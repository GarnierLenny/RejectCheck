"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Upload,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { useLanguage } from "../../../context/language";
import { consumeSSE } from "../../../lib/sse";
import { KeywordMatchTable } from "./KeywordMatchTable";
import { InlineOptimize } from "./InlineOptimize";
import type { AnalysisResult } from "../types";
import type { Dictionary } from "../../(locale)/[lang]/dictionaries";

/** The rescan i18n block — carries nested objects (optimize), so it is not a
 *  flat Record<string, string>. */
type RescanRt = Dictionary["analysisLayout"]["rescan"];
import type {
  KeywordMatchResult,
  QuickRescanResponse,
  RescanDeltas,
  RescansResponse,
  RescanTimelinePoint,
} from "./types";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.rejectcheck.com";

type Props = {
  analysisId: number | null;
  accessToken: string | null;
  /** The current (owned) analysis result — powers the live inline projection. */
  result?: AnalysisResult | null;
  /** Reconstructed CV text, the base the inline edits are applied to. */
  cvText?: string | null;
};

type FullPayload = {
  step: string;
  section?: string;
  key?: string;
  parentAnalysisId?: number;
  deltas?: RescanDeltas;
  analysisId?: number | null;
  keywordMatch?: KeywordMatchResult | null;
  message?: string;
  code?: string;
};

export function RescanPanel({ analysisId, accessToken, result = null, cvText = null }: Props) {
  const { t, localePath } = useLanguage();
  const rt = t.analysisLayout.rescan;

  const [match, setMatch] = useState<KeywordMatchResult | null>(null);
  const [timeline, setTimeline] = useState<RescanTimelinePoint[]>([]);
  const [coverageBefore, setCoverageBefore] = useState<number | null>(null);
  const [coverageAfter, setCoverageAfter] = useState<number | null>(null);

  const [quickBusy, setQuickBusy] = useState(false);
  const [fullBusy, setFullBusy] = useState(false);
  const [fullDeltas, setFullDeltas] = useState<RescanDeltas | null>(null);
  const [fullNewId, setFullNewId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);
  const [dragging, setDragging] = useState(false);

  const quickInputRef = useRef<HTMLInputElement>(null);
  const fullInputRef = useRef<HTMLInputElement>(null);

  const canRescan = !!analysisId && !!accessToken;

  // Load the stored baseline + attempt timeline so the panel renders the
  // coverage number and present/absent table on first paint (no re-scan needed).
  useEffect(() => {
    if (!canRescan) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${apiUrl}/api/analyze/${analysisId}/rescans`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) return;
        const data = (await res.json()) as RescansResponse;
        if (cancelled) return;
        setMatch(data.baseline);
        setTimeline(data.timeline);
        const base = data.baseline?.coverageScore ?? null;
        const last = data.timeline.length
          ? data.timeline[data.timeline.length - 1].coverageScore
          : base;
        setCoverageBefore(base);
        setCoverageAfter(last);
      } catch {
        /* baseline is best-effort — the panel still works via re-scan */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [analysisId, accessToken, canRescan]);

  const runQuickRescan = useCallback(
    async (file: File) => {
      if (!canRescan || quickBusy) return;
      setError(null);
      setQuickBusy(true);
      try {
        const fd = new FormData();
        fd.append("cv", file);
        const res = await fetch(
          `${apiUrl}/api/analyze/${analysisId}/rescan-keywords`,
          {
            method: "POST",
            body: fd,
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || rt.error);
        }
        const data = (await res.json()) as QuickRescanResponse;
        setMatch(data.current);
        setTimeline(data.timeline);
        setCoverageBefore(data.coverageBefore);
        setCoverageAfter(data.coverageAfter);
        setShowTable(true);
        // Toast = feedback on THIS upload, so measure against the previous
        // attempt (not the original baseline — the meter already shows total
        // climb). Otherwise a revision that regresses from the last try would
        // still flash a green "+N" just because it beats the very first CV.
        const prev =
          data.timeline.length >= 2
            ? data.timeline[data.timeline.length - 2].coverageScore
            : data.coverageBefore;
        const step = data.coverageAfter - prev;
        if (step > 0) {
          toast.success(`${rt.coverage} +${step}`);
        } else if (step < 0) {
          toast(`${rt.coverage} ${step}`);
        } else {
          toast(rt.noChangeYet);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : rt.error);
      } finally {
        setQuickBusy(false);
      }
    },
    [analysisId, accessToken, canRescan, quickBusy, rt],
  );

  const runFullRescan = useCallback(
    async (file: File) => {
      if (!canRescan || fullBusy) return;
      setError(null);
      setFullBusy(true);
      setFullDeltas(null);
      setFullNewId(null);
      try {
        const fd = new FormData();
        fd.append("cv", file);
        const res = await fetch(`${apiUrl}/api/analyze/${analysisId}/rescan`, {
          method: "POST",
          body: fd,
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok || !res.body) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || rt.error);
        }
        await consumeSSE<FullPayload>(res, (p) => {
          if (p.step === "rescan_deltas" && p.deltas) {
            setFullDeltas(p.deltas);
          } else if (p.step === "done") {
            if (typeof p.analysisId === "number") setFullNewId(p.analysisId);
          } else if (p.step === "error") {
            throw new Error(p.message || rt.error);
          }
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : rt.error);
      } finally {
        setFullBusy(false);
      }
    },
    [analysisId, accessToken, canRescan, fullBusy, rt],
  );

  // Inline commit (move 4): the user edited keywords/bullets in-app; send the
  // reconstructed CV TEXT to the JSON rescan-inline route. Same SSE + deltas as
  // the file-based full re-scan, so it reuses fullBusy / fullDeltas / fullNewId.
  const runInlineRescan = useCallback(
    async (editedCvText: string) => {
      if (!canRescan || fullBusy) return;
      setError(null);
      setFullBusy(true);
      setFullDeltas(null);
      setFullNewId(null);
      try {
        const res = await fetch(
          `${apiUrl}/api/analyze/${analysisId}/rescan-inline`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ cvText: editedCvText }),
          },
        );
        if (!res.ok || !res.body) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || rt.error);
        }
        await consumeSSE<FullPayload>(res, (p) => {
          if (p.step === "rescan_deltas" && p.deltas) {
            setFullDeltas(p.deltas);
          } else if (p.step === "done") {
            if (typeof p.analysisId === "number") setFullNewId(p.analysisId);
          } else if (p.step === "error") {
            throw new Error(p.message || rt.error);
          }
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : rt.error);
      } finally {
        setFullBusy(false);
      }
    },
    [analysisId, accessToken, canRescan, fullBusy, rt],
  );

  // Anonymous / unsaved analysis: re-scan needs an owned, persisted row.
  if (!canRescan) {
    return (
      <Frame rt={rt}>
        <p style={hintStyle}>{rt.signIn}</p>
      </Frame>
    );
  }

  const openUpdated = () => {
    if (fullNewId == null) return;
    // Hard navigate so the analyze page re-bootstraps on the new id (its
    // in-memory analysisId state still points at the original otherwise).
    window.location.assign(`${localePath("/analyze")}?id=${fullNewId}`);
  };

  return (
    <Frame rt={rt}>
      {match && match.totalCount > 0 && (
        <CoverageMeter
          coverageAfter={coverageAfter}
          coverageBefore={coverageBefore}
          timeline={timeline}
          /* Original-analysis baseline (stable) — NOT match.coverageScore, which
             gets overwritten with the current result after a quick re-scan and
             would drop the true baseline from the climb + duplicate the tip. */
          baseline={coverageBefore}
          rt={rt}
        />
      )}

      {/* Inline optimize loop (move 4): live projected score from keyword +
          bullet edits, committed via rescan-inline. Needs the owned result
          (breakdown/penalties) and the reconstructed CV text. */}
      {result?.breakdown && cvText && match && match.keywords.length > 0 && (
        <InlineOptimize
          result={result}
          keywords={match.keywords}
          cvText={cvText}
          busy={fullBusy}
          onCommit={runInlineRescan}
          ro={rt.optimize}
        />
      )}

      <div className="rc-col2-m" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 18 }}>
        {/* Quick re-scan — the free retention loop (drop zone) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => !quickBusy && quickInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") quickInputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) runQuickRescan(f);
          }}
          style={{
            cursor: quickBusy ? "wait" : "pointer",
            border: `1.5px dashed ${dragging ? "var(--rc-green)" : "var(--rc-border)"}`,
            background: dragging
              ? "color-mix(in srgb, var(--rc-green) 8%, transparent)"
              : "var(--rc-surface)",
            borderRadius: 8,
            padding: "18px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            transition: "border-color 150ms, background 150ms",
            minHeight: 118,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {quickBusy ? (
              <Loader2 size={14} className="rc-spin" style={{ color: "var(--rc-green)" }} />
            ) : (
              <Upload size={14} style={{ color: "var(--rc-green)" }} />
            )}
            <span style={ctaTitle}>{rt.quickCta}</span>
            <span style={freePill}>{rt.free}</span>
          </div>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--rc-muted)", lineHeight: 1.5 }}>
            {quickBusy ? rt.reading : rt.dropZone}
          </span>
          <span style={{ marginTop: "auto", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--rc-hint)", letterSpacing: "0.02em" }}>
            {rt.textOnly}
          </span>
          <input
            ref={quickInputRef}
            type="file"
            accept=".pdf,application/pdf"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) runQuickRescan(f);
              e.target.value = "";
            }}
          />
        </div>

        {/* Full re-scan — explicit, paid, fresh narrative */}
        <div
          style={{
            border: "1px solid var(--rc-border)",
            background: "var(--rc-surface)",
            borderRadius: 8,
            padding: "18px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            minHeight: 118,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={ctaTitle}>{rt.fullCta}</span>
          </div>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, color: "var(--rc-muted)", lineHeight: 1.5 }}>
            {rt.fullHint}
          </span>
          <button
            onClick={() => !fullBusy && fullInputRef.current?.click()}
            disabled={fullBusy}
            style={{
              marginTop: "auto",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "8px 12px",
              border: "1px solid var(--rc-text)",
              borderRadius: 4,
              background: "var(--rc-text)",
              color: "#fff",
              cursor: fullBusy ? "wait" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              opacity: fullBusy ? 0.6 : 1,
            }}
          >
            {fullBusy ? (
              <>
                <Loader2 size={12} className="rc-spin" /> {rt.rescanning}
              </>
            ) : (
              rt.fullCta
            )}
          </button>
          <input
            ref={fullInputRef}
            type="file"
            accept=".pdf,application/pdf,image/png,image/jpeg,image/webp"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) runFullRescan(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {error && (
        <div
          style={{
            marginTop: 12,
            padding: "9px 12px",
            borderRadius: 6,
            border: "1px solid color-mix(in srgb, var(--rc-red) 30%, transparent)",
            background: "color-mix(in srgb, var(--rc-red) 6%, transparent)",
            fontFamily: "var(--font-sans)",
            fontSize: 12.5,
            color: "var(--rc-red)",
          }}
        >
          {error}
        </div>
      )}

      {fullDeltas && <FullRescanResult deltas={fullDeltas} onOpen={openUpdated} canOpen={fullNewId != null} rt={rt} />}

      {match && match.keywords.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => setShowTable((v) => !v)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--rc-hint)",
            }}
          >
            <ChevronDown
              size={13}
              style={{ transform: showTable ? "rotate(180deg)" : "none", transition: "transform 150ms" }}
            />
            {showTable ? rt.hideTable : rt.showTable}
          </button>
          {showTable && (
            <div style={{ marginTop: 12 }}>
              <KeywordMatchTable
                match={match}
                labels={{
                  present: rt.present,
                  missing: rt.missing,
                  required: rt.required,
                  nice: rt.nice,
                }}
              />
            </div>
          )}
        </div>
      )}

      <style>{`.rc-spin{animation:rcspin 0.9s linear infinite}@keyframes rcspin{to{transform:rotate(360deg)}}`}</style>
    </Frame>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Frame({ rt, children }: { rt: RescanRt; children: React.ReactNode }) {
  return (
    <div
      style={{
        border: "1px solid var(--rc-border)",
        borderRadius: 10,
        background: "var(--rc-surface-hero)",
        padding: "22px 22px 24px",
        marginBottom: 28,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "var(--rc-red)",
          fontWeight: 700,
          marginBottom: 8,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ width: 18, height: 1, background: "var(--rc-red)" }} />
        {rt.eyebrow}
      </div>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: 13.5, lineHeight: 1.55, color: "var(--rc-muted)", margin: "0 0 18px" }}>
        {rt.intro}
      </p>
      {children}
    </div>
  );
}

function CoverageMeter({
  coverageAfter,
  coverageBefore,
  baseline,
  timeline,
  rt,
}: {
  coverageAfter: number | null;
  coverageBefore: number | null;
  baseline: number | null;
  timeline: RescanTimelinePoint[];
  rt: RescanRt;
}) {
  const value = coverageAfter ?? baseline ?? 0;
  const delta =
    coverageBefore != null && coverageAfter != null
      ? coverageAfter - coverageBefore
      : null;
  const series = [
    ...(baseline != null ? [baseline] : []),
    ...timeline.map((p) => p.coverageScore),
  ];

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 20, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 44, fontWeight: 800, lineHeight: 1, color: "var(--rc-text)", fontVariantNumeric: "tabular-nums" }}>
          {value}
          <span style={{ fontSize: 20, color: "var(--rc-hint)" }}>%</span>
        </span>
        {delta != null && delta !== 0 && <DeltaPill delta={delta} />}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 4 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--rc-hint)", fontWeight: 700 }}>
          {rt.coverage}
        </span>
        {series.length > 1 && <Sparkline series={series} />}
      </div>
    </div>
  );
}

function Sparkline({ series }: { series: number[] }) {
  const W = 120;
  const H = 26;
  const max = 100;
  const min = 0;
  const pts = series
    .map((v, i) => {
      const x = series.length === 1 ? 0 : (i / (series.length - 1)) * W;
      const y = H - ((v - min) / (max - min)) * H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const last = series[series.length - 1];
  const lastX = W;
  const lastY = H - ((last - min) / (max - min)) * H;
  const rising = series[series.length - 1] >= series[0];
  const color = rising ? "var(--rc-green)" : "var(--rc-amber)";
  return (
    <svg width={W} height={H} style={{ overflow: "visible" }} aria-hidden>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lastX} cy={lastY} r={2.6} fill={color} />
    </svg>
  );
}

function DeltaPill({ delta }: { delta: number }) {
  const up = delta > 0;
  const color = up ? "var(--rc-green)" : "var(--rc-red)";
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        fontFamily: "var(--font-mono)",
        fontSize: 14,
        fontWeight: 700,
        color,
        background: `color-mix(in srgb, ${color} 10%, transparent)`,
        borderRadius: 5,
        padding: "2px 7px",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <Icon size={13} />
      {Math.abs(delta)}
    </span>
  );
}

function FullRescanResult({
  deltas,
  onOpen,
  canOpen,
  rt,
}: {
  deltas: RescanDeltas;
  onOpen: () => void;
  canOpen: boolean;
  rt: RescanRt;
}) {
  const scoreDelta = deltas.score.delta;
  const atsFlipUp = !deltas.ats.wouldPassBefore && deltas.ats.wouldPassAfter;
  return (
    <div
      style={{
        marginTop: 14,
        padding: "16px 18px",
        borderRadius: 8,
        border: "1px solid color-mix(in srgb, var(--rc-green) 32%, transparent)",
        background: "color-mix(in srgb, var(--rc-green) 6%, transparent)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        {/* Displayed as competitiveness (100 − stored rejection risk): higher = better, so a rise is the win. */}
        <BeforeAfter
          label={rt.competitiveness}
          before={deltas.score.before == null ? null : 100 - deltas.score.before}
          after={deltas.score.after == null ? null : 100 - deltas.score.after}
        />
        <BeforeAfter label={rt.coverage} before={deltas.keywordCoverage.before} after={deltas.keywordCoverage.after} suffix="%" />
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.04em",
            color: deltas.ats.wouldPassAfter ? "var(--rc-green)" : "var(--rc-red)",
          }}
        >
          {deltas.ats.wouldPassAfter ? <Check size={14} /> : <X size={14} />}
          {deltas.ats.wouldPassAfter ? rt.atsPass : rt.atsFail}
        </div>
      </div>
      {(deltas.resolvedIssueCount > 0 || scoreDelta != null || atsFlipUp) && (
        <div style={{ display: "flex", gap: 16, marginTop: 12, flexWrap: "wrap" }}>
          {deltas.resolvedIssueCount > 0 && (
            <span style={statChip("var(--rc-green)")}>
              {deltas.resolvedIssueCount} {rt.resolvedSuffix}
            </span>
          )}
          {deltas.newIssueCount > 0 && (
            <span style={statChip("var(--rc-amber)")}>
              {deltas.newIssueCount} {rt.newIssuesSuffix}
            </span>
          )}
        </div>
      )}
      {canOpen && (
        <button
          onClick={onOpen}
          style={{
            marginTop: 14,
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "8px 14px",
            border: "1px solid var(--rc-green)",
            borderRadius: 4,
            background: "var(--rc-green)",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          {rt.openUpdated}
        </button>
      )}
    </div>
  );
}

function BeforeAfter({
  label,
  before,
  after,
  suffix = "",
  lowerIsBetter = false,
}: {
  label: string;
  before: number | null;
  after: number | null;
  suffix?: string;
  /** For rejection-risk, a DROP is the improvement. */
  lowerIsBetter?: boolean;
}) {
  const b = before ?? 0;
  const a = after ?? 0;
  const improved = lowerIsBetter ? a < b : a > b;
  const same = a === b;
  const afterColor = same
    ? "var(--rc-text)"
    : improved
      ? "var(--rc-green)"
      : "var(--rc-red)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--rc-hint)", fontWeight: 700 }}>
        {label}
      </span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 700, color: "var(--rc-text)", fontVariantNumeric: "tabular-nums" }}>
        {before ?? "?"}
        {suffix}
        <span style={{ color: "var(--rc-hint)", margin: "0 5px" }}>→</span>
        <span style={{ color: afterColor }}>
          {after ?? "?"}
          {suffix}
        </span>
      </span>
    </div>
  );
}

const ctaTitle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 14,
  fontWeight: 700,
  color: "var(--rc-text)",
};

const freePill: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--rc-green)",
  border: "1px solid color-mix(in srgb, var(--rc-green) 35%, transparent)",
  borderRadius: 3,
  padding: "1px 5px",
};

const hintStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 13,
  color: "var(--rc-muted)",
  margin: 0,
};

function statChip(color: string): React.CSSProperties {
  return {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.02em",
    color,
  };
}
