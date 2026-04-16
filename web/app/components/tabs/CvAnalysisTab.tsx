"use client";

import type { AnalysisResult } from "../types";
import { IssueItem } from "../IssueItem";
import { FixBlock } from "../FixBlock";
import { ArrowRight, CheckCircle2, XCircle, Link, TrendingUp, MessageSquare } from "lucide-react";

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
    <div className="space-y-8">

      {/* ══════════════════════════════════════════════════
          SECTION 1 — PROFILE (Seniority + Tone + Correlation)
      ══════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-rc-red" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold">Profile Analysis</span>
        </div>

        <div className="space-y-5">

          {/* Seniority Gap */}
          <div className="bg-rc-surface border border-rc-border rounded p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp size={13} className="text-rc-hint" />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold">Seniority Gap Analysis</span>
            </div>

            <div className="flex items-center gap-4 mb-6 max-w-lg">
              <div className="flex-1 text-center px-5 py-5 bg-rc-bg rounded border border-rc-border">
                <span className="font-mono text-[9px] uppercase tracking-wider text-rc-hint block mb-2">Expected</span>
                <span className="text-[20px] font-mono font-bold text-rc-text">{seniority_analysis.expected}</span>
              </div>
              <div className="shrink-0 text-rc-hint">
                <ArrowRight size={18} strokeWidth={1.5} />
              </div>
              <div className="flex-1 text-center px-5 py-5 bg-rc-bg rounded border border-rc-red/20">
                <span className="font-mono text-[9px] uppercase tracking-wider text-rc-red block mb-2">Detected</span>
                <span className="text-[20px] font-mono font-bold text-rc-text">{seniority_analysis.detected}</span>
              </div>
            </div>

            {seniority_analysis.strength && (
              <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase px-2.5 py-1 rounded bg-rc-green/5 text-rc-green border border-rc-green/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-rc-green" />
                  Strength: {seniority_analysis.strength}
                </span>
              </div>
            )}

            <p className="text-[13px] text-rc-muted leading-relaxed italic mb-5">{seniority_analysis.gap}</p>
            <FixBlock fix={seniority_analysis.fix} />
          </div>

          {/* Tone Audit */}
          <div className="bg-rc-surface border border-rc-border rounded p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <MessageSquare size={13} className="text-rc-hint" />
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold">Tone Audit</span>
              </div>
              <span className={`font-mono text-[9px] uppercase tracking-wider px-2.5 py-1 rounded border ${TONE_BADGE[cv_tone.detected] ?? TONE_BADGE.mixed}`}>
                {cv_tone.detected}
              </span>
            </div>

            <div className="space-y-2 mb-6">
              {cv_tone.examples.map((ex, i) => {
                const isGood = getPhraseQuality(ex) === "good";
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-3 bg-rc-surface-raised border-l-2 ${isGood ? "border-l-rc-green" : "border-l-rc-red"}`}
                  >
                    <div className="shrink-0 mt-0.5">
                      {isGood
                        ? <CheckCircle2 size={12} className="text-rc-green" />
                        : <XCircle size={12} className="text-rc-red" />
                      }
                    </div>
                    <p className="text-[12px] text-rc-muted leading-relaxed italic">&quot;{ex}&quot;</p>
                  </div>
                );
              })}
            </div>

            <FixBlock fix={cv_tone.fix} />
          </div>

          {/* Correlation block */}
          {correlation.detected && (
            <div className="flex gap-4 p-5 bg-rc-amber/5 border border-rc-amber/20 rounded">
              <div className="shrink-0 mt-0.5">
                <Link size={13} className="text-rc-amber" />
              </div>
              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-amber block mb-2 font-bold">
                  Pattern detected — Tone × Seniority
                </span>
                <p className="text-[13px] text-rc-muted leading-relaxed">{correlation.explanation}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-rc-border/30" />
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-rc-hint">CV Forensic Audit</span>
        <div className="h-px flex-1 bg-rc-border/30" />
      </div>

      {/* ══════════════════════════════════════════════════
          SECTION 2 — CV FORENSIC AUDIT
      ══════════════════════════════════════════════════ */}
      <div className="bg-rc-surface border border-rc-border rounded overflow-hidden">

        {/* Header */}
        <div className="p-6 border-b border-rc-border flex items-start justify-between">
          <div>
            <h2 className="font-sans font-bold text-[22px] tracking-tight uppercase text-rc-text">CV Forensic Audit</h2>
            <p className="font-mono text-[10px] text-rc-hint uppercase tracking-wider mt-1">
              {cv.issues.length} vulnerabilit{cv.issues.length !== 1 ? "ies" : "y"} identified
            </p>
          </div>
          <div className="text-right">
            <span className="font-mono text-[10px] uppercase tracking-widest text-rc-hint block mb-1">Health Score</span>
            <span className={`font-mono text-[24px] font-medium ${cv.score >= 80 ? 'text-rc-green' : cv.score >= 60 ? 'text-rc-amber' : 'text-rc-red'}`}>
              {cv.score}%
            </span>
          </div>
        </div>

        {/* Severity breakdown + Strengths */}
        <div className="p-5 border-b border-rc-border flex flex-wrap gap-4 items-start justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {(["critical", "major", "minor"] as const).map(sev => {
              const count = sev === "critical" ? criticalCount : sev === "major" ? majorCount : minorCount;
              if (count === 0) return null;
              const cfg = SEVERITY_CONFIG[sev];
              return (
                <span key={sev} className={`inline-flex items-center gap-1.5 font-mono text-[10px] uppercase px-2.5 py-1 rounded border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {count} {sev}
                </span>
              );
            })}
          </div>

          {cv.strengths.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {cv.strengths.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase px-2.5 py-1 rounded bg-rc-green/5 text-rc-green border border-rc-green/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-rc-green" />
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Issues list */}
        <div className="divide-y divide-rc-border/20">
          {cv.issues.map((issue, idx) => (
            <IssueItem key={idx} issue={issue} />
          ))}
        </div>
      </div>

    </div>
  );
}
