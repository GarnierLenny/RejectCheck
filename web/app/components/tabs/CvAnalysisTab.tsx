"use client";

import type { AnalysisResult } from "../types";
import { IssueItem } from "../IssueItem";
import { FixBlock } from "../FixBlock";
import { SectionHeader } from "../SectionHeader";
import { ArrowRight, CheckCircle2, XCircle, Link } from "lucide-react";

type Props = {
  result: AnalysisResult;
};

const TONE_BADGE: Record<string, string> = {
  active:  "text-rc-green bg-rc-green/5 border-rc-green/20",
  passive: "text-rc-red bg-rc-red/5 border-rc-red/20",
  mixed:   "text-rc-amber bg-rc-amber/5 border-rc-amber/20",
};

const SEVERITY_CONFIG = {
  critical: { color: "text-rc-red", dot: "bg-rc-red", border: "border-rc-red/20", bg: "bg-rc-red/5" },
  major:    { color: "text-rc-amber", dot: "bg-rc-amber", border: "border-rc-amber/20", bg: "bg-rc-amber/5" },
  minor:    { color: "text-rc-hint", dot: "bg-rc-hint", border: "border-rc-border/30", bg: "bg-rc-surface/10" },
};

const ACTION_VERBS = /^(led|built|designed|developed|created|implemented|launched|delivered|managed|architected|reduced|increased|improved|drove|owned|scaled|deployed|migrated|refactored|optimized|shipped|authored|established|automated|negotiated|mentored|grew|secured|generated|achieved|spearheaded)/i;
const METRIC_PATTERN = /\d+%?|\$[\d,.]+|[\d,]+\s*(users|customers|ms|seconds|requests|deployments|engineers|teams?)/i;

function getPhraseQuality(phrase: string): "good" | "weak" {
  if (METRIC_PATTERN.test(phrase) || ACTION_VERBS.test(phrase.trim())) return "good";
  return "weak";
}

export function CvAnalysisTab({ result }: Props) {
  const { seniority_analysis, cv_tone, correlation, audit } = result;
  const cv = audit.cv;

  const criticalCount = cv.issues.filter(i => i.severity === "critical").length;
  const majorCount    = cv.issues.filter(i => i.severity === "major").length;
  const minorCount    = cv.issues.filter(i => i.severity === "minor").length;

  return (
    <div className="space-y-12">

      {/* ── SECTION 1: Profile Analysis ──────────────────── */}
      <div>
        <SectionHeader
          label="CV Analysis"
          labelColor="text-rc-red"
          title="Profile Analysis"
          subtitle="Seniority positioning, writing tone, and behavioral signals extracted from your CV."
        />

        <div className="space-y-5">

          {/* Seniority Gap card */}
          <div className="bg-rc-surface border border-rc-border p-6">
            <SectionHeader
              label="Gap Detection"
              title="Seniority Gap"
              subtitle="Expected seniority for this role vs. the level your CV actually signals."
            />

            <div className="flex items-center gap-4 mb-6 max-w-lg">
              <div className="flex-1 text-center px-5 py-5 bg-rc-bg border border-rc-border">
                <span className="font-mono text-[11px] uppercase tracking-wider text-rc-hint block mb-2">Expected</span>
                <span className="text-[22px] font-mono font-bold text-rc-text">{seniority_analysis.expected}</span>
              </div>
              <div className="shrink-0 text-rc-hint">
                <ArrowRight size={18} strokeWidth={1.5} />
              </div>
              <div className="flex-1 text-center px-5 py-5 bg-rc-bg border border-rc-red/20">
                <span className="font-mono text-[11px] uppercase tracking-wider text-rc-red block mb-2">Detected</span>
                <span className="text-[22px] font-mono font-bold text-rc-text">{seniority_analysis.detected}</span>
              </div>
            </div>

            {seniority_analysis.strength && (
              <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase px-2.5 py-1 bg-rc-green/5 text-rc-green border border-rc-green/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-rc-green" />
                  Strength: {seniority_analysis.strength}
                </span>
              </div>
            )}

            <p className="text-[17px] text-rc-muted leading-[1.7] italic mb-5">{seniority_analysis.gap}</p>
            <FixBlock fix={seniority_analysis.fix} />
          </div>

          {/* Tone Audit card */}
          <div className="bg-rc-surface border border-rc-border p-6">
            <SectionHeader
              label="Writing Style"
              title="Tone Audit"
              subtitle="Active vs. passive voice patterns across your bullet points and descriptions."
              meta={
                <span className={`font-mono text-[11px] uppercase tracking-wider px-2.5 py-1 border ${TONE_BADGE[cv_tone.detected] ?? TONE_BADGE.mixed}`}>
                  {cv_tone.detected}
                </span>
              }
            />

            <div className="space-y-2 mb-6">
              {cv_tone.examples.map((ex, i) => {
                const isGood = getPhraseQuality(ex) === "good";
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-3.5 bg-rc-surface-raised border-l-[3px] ${isGood ? "border-l-rc-green" : "border-l-rc-red"}`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {isGood
                        ? <CheckCircle2 size={13} className="text-rc-green" />
                        : <XCircle size={13} className="text-rc-red" />
                      }
                    </div>
                    <p className="text-[17px] text-rc-muted leading-relaxed italic">&quot;{ex}&quot;</p>
                  </div>
                );
              })}
            </div>

            <FixBlock fix={cv_tone.fix} />
          </div>

          {/* Correlation callout */}
          {correlation.detected && (
            <div className="flex gap-4 p-5 bg-rc-amber/5 border border-rc-amber/20">
              <div className="shrink-0 mt-0.5">
                <Link size={14} className="text-rc-amber" />
              </div>
              <div>
                <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-rc-amber block mb-1.5 font-bold">
                  Pattern detected — Tone × Seniority
                </span>
                <p className="text-[17px] text-rc-muted leading-[1.7]">{correlation.explanation}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION 2: CV Forensic Audit ─────────────────── */}
      <div>
        <SectionHeader
          label="Forensic Audit"
          labelColor="text-rc-red"
          title="CV Issues"
          subtitle={`${cv.issues.length} vulnerabilit${cv.issues.length !== 1 ? "ies" : "y"} identified across structure, content, and positioning.`}
          meta={
            <div className="text-right">
              <span className="font-mono text-[11px] uppercase tracking-wider text-rc-hint block mb-1">Health Score</span>
              <span className={`font-mono text-[28px] font-medium leading-none ${cv.score >= 80 ? 'text-rc-green' : cv.score >= 60 ? 'text-rc-amber' : 'text-rc-red'}`}>
                {cv.score}%
              </span>
            </div>
          }
        />

        {/* Severity breakdown + Strengths */}
        <div className="flex flex-wrap gap-3 mb-5 items-start justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {(["critical", "major", "minor"] as const).map(sev => {
              const count = sev === "critical" ? criticalCount : sev === "major" ? majorCount : minorCount;
              if (count === 0) return null;
              const cfg = SEVERITY_CONFIG[sev];
              return (
                <span key={sev} className={`inline-flex items-center gap-1.5 font-mono text-[11px] uppercase px-2.5 py-1 border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {count} {sev}
                </span>
              );
            })}
          </div>
          {cv.strengths.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {cv.strengths.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase px-2.5 py-1 bg-rc-green/5 text-rc-green border border-rc-green/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-rc-green" />
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Issues list */}
        <div className="bg-rc-surface border border-rc-border divide-y divide-rc-border/20">
          {cv.issues.map((issue, idx) => (
            <IssueItem key={idx} issue={issue} />
          ))}
        </div>
      </div>

    </div>
  );
}
