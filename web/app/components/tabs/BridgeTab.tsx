"use client";

import { CheckCircle2, Zap, Target, ArrowRight, Layers, ShieldCheck, Gauge, Lightbulb, ListChecks } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { AnalysisResult } from "../types";

type Props = {
  result: AnalysisResult;
};

// Strip markdown syntax from short label strings (used for pill tags)
function stripMd(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/`(.+?)`/g, "$1").trim();
}

const mdClass = "[&_strong]:font-semibold [&_strong]:text-rc-text [&_ul]:mt-2 [&_ul]:space-y-1 [&_li]:ml-4 [&_li]:list-disc [&_p]:leading-relaxed";

export function BridgeTab({ result }: Props) {
  const project = result.project_recommendation;

  if (!project) {
    return (
      <div className="p-12 text-center bg-rc-surface/20 rounded-2xl border border-rc-border/30 border-dashed">
        <CheckCircle2 className="w-12 h-12 text-rc-green mx-auto mb-4 opacity-20" />
        <h3 className="font-sans font-bold text-[22px] tracking-tight uppercase mb-2">No Project Needed</h3>
        <p className="text-rc-muted text-sm mx-auto max-w-[300px]">
          Your technical profile already aligns perfectly with this role&apos;s requirements.
        </p>
      </div>
    );
  }

  const difficultyColor =
    project.difficulty_level === "Expert" ? "text-rc-red border-rc-red/20 bg-rc-red/5" :
    project.difficulty_level === "Advanced" ? "text-rc-amber border-rc-amber/20 bg-rc-amber/5" :
    "text-rc-muted border-rc-border/40 bg-rc-surface/20";

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-sans font-bold text-[22px] tracking-tight uppercase text-rc-text">
            Bridge the Gap
          </h2>
          <p className="font-mono text-[10px] text-rc-hint uppercase tracking-wider mt-1">
            A high-impact project engineered to crush technical objections
          </p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-full font-mono text-[9px] uppercase tracking-widest font-bold shrink-0 ${difficultyColor}`}>
          <Gauge className="w-3 h-3" />
          {project.difficulty_level}
        </div>
      </div>

      {/* ── Project name + description ──────────────────────── */}
      <div className="bg-rc-surface/20 border border-rc-border/30 rounded-xl p-6">
        <h3 className="font-sans font-bold text-[20px] tracking-tight text-rc-text mb-3 leading-tight">
          {stripMd(project.name)}
        </h3>
        <div className={`text-[14px] text-rc-muted ${mdClass}`}>
          <ReactMarkdown>{project.description}</ReactMarkdown>
        </div>
      </div>

      {/* ── Strategic Value ─────────────────────────────────── */}
      <div className="bg-rc-surface/20 border border-rc-border/30 rounded-xl p-6">
        <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-green font-bold flex items-center gap-1.5 mb-3">
          <Target className="w-3 h-3" /> Strategic Value
        </h4>
        <div className={`text-[13px] text-rc-muted italic ${mdClass} [&_strong]:not-italic`}>
          <ReactMarkdown>{project.why_it_matters}</ReactMarkdown>
        </div>
      </div>

      {/* ── What to Build ───────────────────────────────────── */}
      {project.key_features && project.key_features.length > 0 && (
        <div className="bg-rc-surface/20 border border-rc-border/30 rounded-xl p-6">
          <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-text font-bold flex items-center gap-1.5 mb-4">
            <ListChecks className="w-3 h-3" /> What to Build
          </h4>
          <div className="space-y-2">
            {project.key_features.map((feature, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-rc-bg border border-rc-border/40 rounded-lg">
                <span className="font-mono text-[10px] text-rc-hint w-5 text-right shrink-0 mt-0.5">{i + 1}.</span>
                <div className={`text-[13px] text-rc-text ${mdClass} [&_p]:m-0`}>
                  <ReactMarkdown>{feature}</ReactMarkdown>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Architecture Blueprint ──────────────────────────── */}
      <div className="bg-rc-bg border border-rc-border/40 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-rc-red rounded-l-xl" />
        <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-red font-bold flex items-center gap-1.5 mb-4">
          <Layers className="w-3 h-3" /> Architecture Blueprint
        </h4>
        <div className={`font-mono text-[12px] text-rc-muted ${mdClass}`}>
          <ReactMarkdown>{project.architecture}</ReactMarkdown>
        </div>
      </div>

      {/* ── Core Stack + Advanced Concepts ──────────────────── */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-rc-surface/20 border border-rc-border/30 rounded-xl p-6">
          <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold flex items-center gap-1.5 mb-3">
            <Zap className="w-3 h-3" /> Core Stack
          </h4>
          <div className="flex flex-wrap gap-2">
            {project.technologies.map((tech) => (
              <span key={tech} className="px-2.5 py-1 bg-rc-surface/30 border border-rc-border/40 rounded-lg font-mono text-[11px] text-rc-text">
                {stripMd(tech)}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-rc-surface/20 border border-rc-border/30 rounded-xl p-6">
          <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold flex items-center gap-1.5 mb-3">
            <ShieldCheck className="w-3 h-3" /> Advanced Concepts
          </h4>
          <div className="flex flex-wrap gap-2">
            {project.advanced_concepts.map((concept) => (
              <span key={concept} className="px-2.5 py-1 bg-rc-amber/5 border border-rc-amber/20 rounded-lg font-mono text-[11px] text-rc-amber">
                {stripMd(concept)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Success Criteria ────────────────────────────────── */}
      <div className="bg-rc-surface/20 border border-rc-border/30 rounded-xl p-6">
        <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold flex items-center gap-1.5 mb-4">
          <CheckCircle2 className="w-3 h-3" /> Success Criteria
        </h4>
        <div className="space-y-2">
          {project.success_criteria.map((criteria, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-rc-green/5 border border-rc-green/10 rounded-lg">
              <div className="mt-0.5 w-4 h-4 rounded-full bg-rc-green/20 border border-rc-green/30 flex items-center justify-center shrink-0">
                <span className="text-rc-green text-[9px] font-bold">✓</span>
              </div>
              <div className={`text-[13px] text-rc-text ${mdClass} [&_p]:m-0`}>
                <ReactMarkdown>{criteria}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Actionable Steps ────────────────────────────────── */}
      <div className="bg-rc-surface/20 border border-rc-border/30 rounded-xl p-6">
        <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-red font-bold flex items-center gap-1.5 mb-4">
          <ArrowRight className="w-3 h-3" /> Actionable Steps
        </h4>
        <div className="space-y-3">
          {project.what_matters.map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rc-red shrink-0" />
              <div className={`text-[13px] text-rc-text ${mdClass} [&_p]:m-0`}>
                <ReactMarkdown>{item}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tip ─────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 p-4 bg-rc-surface/10 border border-rc-border/30 rounded-xl">
        <Lightbulb className="w-3.5 h-3.5 text-rc-hint shrink-0 mt-0.5" />
        <p className="font-mono text-[10px] text-rc-hint leading-relaxed">
          Deploy to production and document the trade-offs you made. That&apos;s what seniors do.
        </p>
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="p-8 rounded-2xl bg-rc-surface/10 border border-rc-border/30 border-dashed text-center">
        <p className="text-rc-muted text-sm mb-6 max-w-sm mx-auto">
          Solving these specific gaps transforms you from &quot;potentially risky&quot; to &quot;evidently overqualified&quot;.
        </p>
        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-20 bg-rc-border" />
          <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-rc-hint font-bold">End of Evaluation</span>
          <div className="h-px w-20 bg-rc-border" />
        </div>
      </div>
    </div>
  );
}
