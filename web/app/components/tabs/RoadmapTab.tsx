"use client";

import { useState, useMemo } from "react";
import { CheckCircle2, Circle, Zap, Target, Trophy, Gauge, ArrowRight, Layers, ShieldCheck, Lightbulb, ListChecks } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { AnalysisResult } from "../types";

type Props = {
  result: AnalysisResult;
};

type ActionItem = {
  step: string;
  source: string;
  timeRequired: string;
};

type ActionCategory = {
  id: "week" | "month" | "longTerm";
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  dotColor: string;
  bgColor: string;
  borderColor: string;
};

const CATEGORIES: ActionCategory[] = [
  {
    id: "week",
    title: "Priority — This Week",
    subtitle: "High impact fixes for immediate results",
    icon: <Zap className="w-3 h-3" />,
    color: "text-rc-red",
    dotColor: "bg-rc-red",
    bgColor: "bg-rc-red/5",
    borderColor: "border-rc-red/20",
  },
  {
    id: "month",
    title: "Short Term — 30 Days",
    subtitle: "Deeper optimizations and platform building",
    icon: <Target className="w-3 h-3" />,
    color: "text-rc-amber",
    dotColor: "bg-rc-amber",
    bgColor: "bg-rc-amber/5",
    borderColor: "border-rc-amber/20",
  },
  {
    id: "longTerm",
    title: "Long Term Growth",
    subtitle: "Strategy for continuous improvement",
    icon: <Trophy className="w-3 h-3" />,
    color: "text-rc-hint",
    dotColor: "bg-rc-hint",
    bgColor: "bg-rc-surface/10",
    borderColor: "border-rc-border/40",
  },
];

// Strip markdown syntax from short label strings (used for pill tags)
function stripMd(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").replace(/`(.+?)`/g, "$1").trim();
}

const mdClass = "[&_strong]:font-semibold [&_strong]:text-rc-text [&_ul]:mt-2 [&_ul]:space-y-1 [&_li]:ml-4 [&_li]:list-disc [&_p]:leading-relaxed";

export function RoadmapTab({ result }: Props) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const actionPlan = useMemo(() => {
    const plan: { week: ActionItem[]; month: ActionItem[]; longTerm: ActionItem[] } = {
      week: [],
      month: [],
      longTerm: [],
    };

    const categorizeFix = (fix: any, source: string) => {
      if (!fix || !fix.steps) return;
      const time = (fix.time_required || "").toLowerCase();
      let target = plan.longTerm;

      if (time.includes("minute") || time.includes("hour")) {
        target = plan.week;
      } else if (time.includes("day") || time.includes("week")) {
        target = plan.month;
      }

      (fix.steps as string[]).forEach((step: string) => {
        if (!target.find(i => i.step === step)) {
          target.push({ step, source, timeRequired: fix.time_required || "" });
        }
      });
    };

    (result.audit.cv.issues as any[]).forEach(issue =>
      categorizeFix(issue.fix, `CV Audit · ${issue.category}`)
    );
    (result.audit.github.issues as any[]).forEach(issue =>
      categorizeFix(issue.fix, `GitHub Signal · ${issue.category}`)
    );
    (result.audit.linkedin.issues as any[]).forEach(issue =>
      categorizeFix(issue.fix, `LinkedIn Signal · ${issue.category}`)
    );
    categorizeFix(result.seniority_analysis.fix, "Profile · Seniority");
    categorizeFix(result.cv_tone.fix, "Profile · Tone");
    (result.hidden_red_flags as any[]).forEach(flag =>
      categorizeFix(flag.fix, `Red Flags · ${flag.flag}`)
    );

    return plan;
  }, [result]);

  const toggleCheck = (step: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(step)) next.delete(step);
      else next.add(step);
      return next;
    });
  };

  const totalSteps = actionPlan.week.length + actionPlan.month.length + actionPlan.longTerm.length;
  const project = result.project_recommendation;

  const difficultyColor = !project ? "" :
    project.difficulty_level === "Expert" ? "text-rc-red border-rc-red/20 bg-rc-red/5" :
    project.difficulty_level === "Advanced" ? "text-rc-amber border-rc-amber/20 bg-rc-amber/5" :
    "text-rc-muted border-rc-border/40 bg-rc-surface/20";

  return (
    <div className="space-y-10">

      {/* ══════════════════════════════════════════════════
          SECTION 1 — ACTION PLAN
      ══════════════════════════════════════════════════ */}
      <div className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-sans font-bold text-[22px] tracking-tight uppercase text-rc-text">
              Personalized Action Plan
            </h2>
            <p className="font-mono text-[10px] text-rc-hint uppercase tracking-wider mt-1">
              Step-by-step checklist to improve your application
            </p>
          </div>
          {totalSteps > 0 && (
            <div className="text-right hidden md:block">
              <span className="font-mono text-[10px] uppercase tracking-widest text-rc-hint">Completion</span>
              <p className="font-mono font-bold text-rc-red text-xl">
                {Math.round((checkedItems.size / totalSteps) * 100)}%
              </p>
            </div>
          )}
        </div>

        {totalSteps === 0 ? (
          <div className="p-12 text-center bg-rc-surface border border-rc-border border-dashed rounded">
            <CheckCircle2 className="w-12 h-12 text-rc-green mx-auto mb-4 opacity-20" />
            <h3 className="font-sans font-bold text-[22px] tracking-tight uppercase mb-2">You&apos;re All Set</h3>
            <p className="text-rc-muted text-sm mx-auto max-w-[300px]">
              No major improvements identified. Your application materials are already in top shape!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {CATEGORIES.map((cat) => {
              const items = actionPlan[cat.id];
              if (items.length === 0) return null;

              return (
                <div key={cat.id} className="bg-rc-surface border border-rc-border rounded overflow-hidden">
                  <div className={`px-6 py-4 border-b border-rc-border ${cat.bgColor} flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full ${cat.dotColor}`} />
                      <div>
                        <h3 className={`font-mono text-[10px] uppercase tracking-[0.2em] font-bold ${cat.color}`}>
                          {cat.title}
                        </h3>
                        <p className="font-mono text-[9px] text-rc-hint uppercase tracking-tight mt-0.5">{cat.subtitle}</p>
                      </div>
                    </div>
                    <span className={`font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded border ${cat.borderColor} ${cat.color}`}>
                      {items.length} steps
                    </span>
                  </div>

                  <div className="divide-y divide-rc-border/20">
                    {items.map((item, idx) => {
                      const isChecked = checkedItems.has(item.step);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleCheck(item.step)}
                          className="flex items-start gap-4 px-6 py-4 hover:bg-rc-surface-raised transition-colors cursor-pointer group"
                        >
                          <button className="mt-0.5 shrink-0 transition-transform active:scale-90">
                            {isChecked ? (
                              <CheckCircle2 className="w-4 h-4 text-rc-green" />
                            ) : (
                              <Circle className="w-4 h-4 text-rc-hint group-hover:text-rc-red transition-colors" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[13px] leading-relaxed transition-all ${isChecked ? "text-rc-hint line-through italic" : "text-rc-text"}`}>
                              {item.step}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              <span className="font-mono text-[9px] text-rc-hint bg-rc-bg border border-rc-border/40 px-1.5 py-0.5">
                                {item.source}
                              </span>
                              {item.timeRequired && (
                                <span className="font-mono text-[9px] text-rc-hint">
                                  ≈ {item.timeRequired}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-rc-border/30" />
        <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-rc-hint">Bridge the Gap</span>
        <div className="h-px flex-1 bg-rc-border/30" />
      </div>

      {/* ══════════════════════════════════════════════════
          SECTION 2 — BRIDGE THE GAP (Project)
      ══════════════════════════════════════════════════ */}
      {!project ? (
        <div className="p-12 text-center bg-rc-surface border border-rc-border border-dashed rounded">
          <CheckCircle2 className="w-12 h-12 text-rc-green mx-auto mb-4 opacity-20" />
          <h3 className="font-sans font-bold text-[22px] tracking-tight uppercase mb-2">No Project Needed</h3>
          <p className="text-rc-muted text-sm mx-auto max-w-[300px]">
            Your technical profile already aligns perfectly with this role&apos;s requirements.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-sans font-bold text-[22px] tracking-tight uppercase text-rc-text">
                Bridge the Gap
              </h2>
              <p className="font-mono text-[10px] text-rc-hint uppercase tracking-wider mt-1">
                A high-impact project engineered to crush technical objections
              </p>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 border font-mono text-[9px] uppercase tracking-widest font-bold shrink-0 rounded ${difficultyColor}`}>
              <Gauge className="w-3 h-3" />
              {project.difficulty_level}
            </div>
          </div>

          {/* Project name + description */}
          <div className="bg-rc-surface border border-rc-border rounded p-6">
            <h3 className="font-sans font-bold text-[20px] tracking-tight text-rc-text mb-3 leading-tight">
              {stripMd(project.name)}
            </h3>
            <div className={`text-[14px] text-rc-muted ${mdClass}`}>
              <ReactMarkdown>{project.description}</ReactMarkdown>
            </div>
          </div>

          {/* Strategic Value */}
          <div className="bg-rc-surface border border-rc-border rounded p-6">
            <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-green font-bold flex items-center gap-1.5 mb-3">
              <Target className="w-3 h-3" /> Strategic Value
            </h4>
            <div className={`text-[13px] text-rc-muted italic ${mdClass} [&_strong]:not-italic`}>
              <ReactMarkdown>{project.why_it_matters}</ReactMarkdown>
            </div>
          </div>

          {/* What to Build */}
          {project.key_features && project.key_features.length > 0 && (
            <div className="bg-rc-surface border border-rc-border rounded p-6">
              <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-text font-bold flex items-center gap-1.5 mb-4">
                <ListChecks className="w-3 h-3" /> What to Build
              </h4>
              <div className="space-y-2">
                {project.key_features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-rc-surface-raised border border-rc-border/40">
                    <span className="font-mono text-[10px] text-rc-hint w-5 text-right shrink-0 mt-0.5">{i + 1}.</span>
                    <div className={`text-[13px] text-rc-text ${mdClass} [&_p]:m-0`}>
                      <ReactMarkdown>{feature}</ReactMarkdown>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Architecture Blueprint */}
          <div className="bg-rc-surface-raised border border-rc-border rounded p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-rc-red" />
            <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-red font-bold flex items-center gap-1.5 mb-4">
              <Layers className="w-3 h-3" /> Architecture Blueprint
            </h4>
            <div className={`font-mono text-[12px] text-rc-muted ${mdClass}`}>
              <ReactMarkdown>{project.architecture}</ReactMarkdown>
            </div>
          </div>

          {/* Core Stack + Advanced Concepts */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-rc-surface border border-rc-border rounded p-6">
              <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold flex items-center gap-1.5 mb-3">
                <Zap className="w-3 h-3" /> Core Stack
              </h4>
              <div className="flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                  <span key={tech} className="px-2.5 py-1 bg-rc-surface-raised border border-rc-border font-mono text-[11px] text-rc-text">
                    {stripMd(tech)}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-rc-surface border border-rc-border rounded p-6">
              <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold flex items-center gap-1.5 mb-3">
                <ShieldCheck className="w-3 h-3" /> Advanced Concepts
              </h4>
              <div className="flex flex-wrap gap-2">
                {project.advanced_concepts.map((concept) => (
                  <span key={concept} className="px-2.5 py-1 bg-rc-amber/5 border border-rc-amber/20 font-mono text-[11px] text-rc-amber">
                    {stripMd(concept)}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Success Criteria */}
          <div className="bg-rc-surface border border-rc-border rounded p-6">
            <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold flex items-center gap-1.5 mb-4">
              <CheckCircle2 className="w-3 h-3" /> Success Criteria
            </h4>
            <div className="space-y-2">
              {project.success_criteria.map((criteria, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-rc-green/5 border border-rc-green/10 rounded">
                  <div className="mt-0.5 w-4 h-4 rounded bg-rc-green/20 border border-rc-green/30 flex items-center justify-center shrink-0">
                    <span className="text-rc-green text-[9px] font-bold">✓</span>
                  </div>
                  <div className={`text-[13px] text-rc-text ${mdClass} [&_p]:m-0`}>
                    <ReactMarkdown>{criteria}</ReactMarkdown>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actionable Steps */}
          <div className="bg-rc-surface border border-rc-border rounded p-6">
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

          {/* Tip */}
          <div className="flex items-start gap-3 p-4 bg-rc-surface border border-rc-border rounded">
            <Lightbulb className="w-3.5 h-3.5 text-rc-hint shrink-0 mt-0.5" />
            <p className="font-mono text-[10px] text-rc-hint leading-relaxed">
              Deploy to production and document the trade-offs you made. That&apos;s what seniors do.
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-8 rounded bg-rc-surface border border-rc-border border-dashed text-center">
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
