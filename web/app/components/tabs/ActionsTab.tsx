"use client";

import { useState, useMemo } from "react";
import { CheckCircle2, Circle, Zap, Target, Trophy } from "lucide-react";
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

export function ActionsTab({ result }: Props) {
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
  const hasAnyActions = totalSteps > 0;

  if (!hasAnyActions) {
    return (
      <div className="p-12 text-center bg-rc-surface/20 rounded-2xl border border-rc-border/30 border-dashed">
        <CheckCircle2 className="w-12 h-12 text-rc-green mx-auto mb-4 opacity-20" />
        <h3 className="font-sans font-bold text-[22px] tracking-tight uppercase mb-2">You&apos;re All Set</h3>
        <p className="text-rc-muted text-sm mx-auto max-w-[300px]">
          No major improvements identified. Your application materials are already in top shape!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-sans font-bold text-[22px] tracking-tight uppercase text-rc-text">
            Personalized Action Plan
          </h2>
          <p className="font-mono text-[10px] text-rc-hint uppercase tracking-wider mt-1">
            Step-by-step checklist to improve your application
          </p>
        </div>
        <div className="text-right hidden md:block">
          <span className="font-mono text-[10px] uppercase tracking-widest text-rc-hint">Completion</span>
          <p className="font-mono font-bold text-rc-red text-xl">
            {totalSteps > 0 ? Math.round((checkedItems.size / totalSteps) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-6">
        {CATEGORIES.map((cat) => {
          const items = actionPlan[cat.id];
          if (items.length === 0) return null;

          return (
            <div key={cat.id} className="bg-rc-surface/20 border border-rc-border/30 rounded-xl overflow-hidden">
              {/* Category header */}
              <div className={`px-6 py-4 border-b border-rc-border/30 ${cat.bgColor} flex items-center justify-between`}>
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

              {/* Steps */}
              <div className="divide-y divide-rc-border/20">
                {items.map((item, idx) => {
                  const isChecked = checkedItems.has(item.step);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleCheck(item.step)}
                      className="flex items-start gap-4 px-6 py-4 hover:bg-rc-surface/30 transition-colors cursor-pointer group"
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
                          <span className="font-mono text-[9px] text-rc-hint bg-rc-bg border border-rc-border/40 px-1.5 py-0.5 rounded">
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

      {/* Footer */}
      <div className="p-8 rounded-2xl bg-rc-surface/10 border border-rc-border/30 border-dashed text-center">
        <p className="text-rc-muted text-sm mb-6">
          Following this plan increases your interview rates by targeting identified weaknesses.
        </p>
        <div className="flex items-center justify-center gap-4">
          <div className="h-px w-12 bg-rc-border" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-rc-hint">End of Analysis</span>
          <div className="h-px w-12 bg-rc-border" />
        </div>
      </div>
    </div>
  );
}
