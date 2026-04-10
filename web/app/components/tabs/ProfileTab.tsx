import type { AnalysisResult } from "../types";
import { FixBlock } from "../FixBlock";
import { ArrowRight, TrendingUp, CheckCircle2, XCircle, Link, MessageSquare } from "lucide-react";

type Props = {
  result: AnalysisResult;
};

const TONE_BADGE: Record<string, string> = {
  active: "text-rc-green bg-rc-green/10 border-rc-green/20",
  passive: "text-rc-red bg-rc-red/10 border-rc-red/20",
  mixed: "text-rc-amber bg-rc-amber/10 border-rc-amber/20",
};

const ACTION_VERBS = /^(led|built|designed|developed|created|implemented|launched|delivered|managed|architected|reduced|increased|improved|drove|owned|scaled|deployed|migrated|refactored|optimized|shipped|authored|established|automated|negotiated|mentored|grew|secured|generated|achieved|spearheaded)/i;
const METRIC_PATTERN = /\d+%?|\$[\d,.]+|[\d,]+\s*(users|customers|ms|seconds|requests|deployments|engineers|teams?)/i;

function getPhraseQuality(phrase: string): "good" | "weak" {
  if (METRIC_PATTERN.test(phrase) || ACTION_VERBS.test(phrase.trim())) return "good";
  return "weak";
}

export function ProfileTab({ result }: Props) {
  const { seniority_analysis, cv_tone, correlation } = result;

  return (
    <div className="space-y-5">

      {/* ── Seniority Gap Analysis ─────────────────────────────── */}
      <div className="bg-rc-surface border border-rc-border rounded-xl p-7">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={15} className="text-rc-hint" />
          <span className="font-mono text-[13px] font-bold uppercase tracking-widest text-rc-hint">Seniority Gap Analysis</span>
        </div>

        {/* Expected → Detected */}
        <div className="flex items-center gap-4 mb-7 max-w-lg">
          <div className="flex-1 text-center px-5 py-4 bg-rc-bg rounded-lg border border-rc-border">
            <span className="text-[10px] uppercase tracking-wider text-rc-hint font-mono block mb-1.5">Expected</span>
            <span className="text-[17px] font-semibold text-rc-text">{seniority_analysis.expected}</span>
          </div>

          <div className="shrink-0 text-rc-hint">
            <ArrowRight size={20} strokeWidth={1.5} />
          </div>

          <div className="flex-1 text-center px-5 py-4 bg-rc-bg rounded-lg border border-rc-red/30 shadow-[0_0_20px_rgba(226,75,74,0.07)]">
            <span className="text-[10px] uppercase tracking-wider text-rc-red font-mono block mb-1.5">Detected</span>
            <span className="text-[17px] font-semibold text-rc-text">{seniority_analysis.detected}</span>
          </div>
        </div>

        {/* Strength badge */}
        {seniority_analysis.strength && (
          <div className="mb-4">
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase px-2.5 py-1 rounded bg-rc-green/10 text-rc-green border border-rc-green/20">
              <CheckCircle2 size={10} />
              Strength: {seniority_analysis.strength}
            </span>
          </div>
        )}

        {/* Gap explanation */}
        <p className="text-[14px] text-rc-muted leading-relaxed italic mb-5">{seniority_analysis.gap}</p>

        <FixBlock fix={seniority_analysis.fix} />
      </div>

      {/* ── Tone Audit ────────────────────────────────────────── */}
      <div className="bg-rc-surface border border-rc-border/60 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MessageSquare size={15} className="text-rc-hint" />
            <span className="font-mono text-[13px] font-bold uppercase tracking-widest text-rc-hint">Tone Audit</span>
          </div>
          <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border ${TONE_BADGE[cv_tone.detected] ?? TONE_BADGE.mixed}`}>
            {cv_tone.detected}
          </span>
        </div>

        {/* CV phrase examples with ✗/✓ indicator */}
        <div className="space-y-2 mb-6">
          {cv_tone.examples.map((ex, i) => {
            const quality = getPhraseQuality(ex);
            const isGood = quality === "good";
            return (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 bg-rc-bg rounded-lg border-l-[3px] ${
                  isGood
                    ? "border-l-rc-green"
                    : "border-l-rc-red"
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {isGood
                    ? <CheckCircle2 size={13} className="text-rc-green" />
                    : <XCircle size={13} className="text-rc-red" />
                  }
                </div>
                <p className="text-[12px] text-rc-muted leading-relaxed italic">&quot;{ex}&quot;</p>
              </div>
            );
          })}
        </div>

        <FixBlock fix={cv_tone.fix} />
      </div>

      {/* ── Correlation block (conditional) ───────────────────── */}
      {correlation.detected && (
        <div className="flex gap-4 p-5 bg-rc-amber/5 border border-rc-amber/20 rounded-xl">
          <div className="shrink-0 mt-0.5">
            <Link size={14} className="text-rc-amber" />
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-rc-amber block mb-2">
              Pattern detected — Tone × Seniority
            </span>
            <p className="text-[13px] text-rc-muted leading-relaxed">{correlation.explanation}</p>
          </div>
        </div>
      )}

    </div>
  );
}
