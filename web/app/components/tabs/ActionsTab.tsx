"use client";

import { useState, useMemo } from "react";
import { CheckCircle2, Circle, Clock, ArrowRight, Zap, Target, Trophy } from "lucide-react";
import type { AnalysisResult } from "../types";

type Props = {
  result: AnalysisResult;
};

type ActionCategory = {
  id: "week" | "month" | "longTerm";
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
};

const CATEGORIES: ActionCategory[] = [
  {
    id: "week",
    title: "Priority — This Week",
    subtitle: "High impact fixes for immediate results",
    icon: <Zap className="w-4 h-4" />,
    color: "text-rc-red",
    bgColor: "bg-rc-red/5",
    borderColor: "border-rc-red/20",
  },
  {
    id: "month",
    title: "Short Term — 30 Days",
    subtitle: "Deeper optimizations and platform building",
    icon: <Target className="w-4 h-4" />,
    color: "text-rc-amber",
    bgColor: "bg-rc-amber/5",
    borderColor: "border-rc-amber/20",
  },
  {
    id: "longTerm",
    title: "Long Term Growth",
    subtitle: "Strategy for continuous improvement",
    icon: <Trophy className="w-4 h-4" />,
    color: "text-rc-muted",
    bgColor: "bg-rc-muted/5",
    borderColor: "border-rc-border",
  },
];

export function ActionsTab({ result }: Props) {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const actionPlan = useMemo(() => {
    const plan: { week: string[]; month: string[]; longTerm: string[] } = {
      week: [],
      month: [],
      longTerm: [],
    };

    const categorizeFix = (fix: any) => {
      if (!fix || !fix.steps) return;
      const time = (fix.time_required || "").toLowerCase();
      let target = plan.longTerm;

      if (time.includes("minute") || time.includes("hour")) {
        target = plan.week;
      } else if (time.includes("day") || time.includes("week")) {
        target = plan.month;
      } else if (time.includes("month")) {
        target = plan.longTerm;
      }

      (fix.steps as string[]).forEach((step: string) => {
        if (!target.includes(step)) target.push(step);
      });
    };

    // Extract fixes from all audit sections
    (result.audit.cv.issues as any[]).forEach(issue => categorizeFix(issue.fix));
    (result.audit.github.issues as any[]).forEach(issue => categorizeFix(issue.fix));
    (result.audit.linkedin.issues as any[]).forEach(issue => categorizeFix(issue.fix));
    categorizeFix(result.seniority_analysis.fix);
    categorizeFix(result.cv_tone.fix);
    (result.hidden_red_flags as any[]).forEach(flag => categorizeFix(flag.fix));

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

  const hasAnyActions = actionPlan.week.length > 0 || actionPlan.month.length > 0 || actionPlan.longTerm.length > 0;

  if (!hasAnyActions) {
    return (
      <div className="p-12 text-center bg-rc-surface rounded-3xl border border-rc-border border-dashed">
        <CheckCircle2 className="w-12 h-12 text-rc-green mx-auto mb-4 opacity-20" />
        <h3 className="text-lg font-bold mb-2">You're All Set</h3>
        <p className="text-rc-muted text-sm mx-auto max-w-[300px]">
          No major improvements identified. Your application materials are already in top shape!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-4 px-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Personalized Action Plan</h2>
          <p className="text-rc-muted text-sm mt-1">A step-by-step checklist to crush your next application.</p>
        </div>
        <div className="text-right hidden md:block">
          <span className="font-mono text-[10px] uppercase tracking-widest text-rc-hint">Completion</span>
          <p className="font-bold text-rc-red text-xl">
            {Math.round((checkedItems.size / (actionPlan.week.length + actionPlan.month.length + actionPlan.longTerm.length)) * 100)}%
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {CATEGORIES.map((cat) => {
          const steps = actionPlan[cat.id];
          if (steps.length === 0) return null;

          return (
            <section key={cat.id} className="bg-white border border-rc-border rounded-3xl overflow-hidden shadow-sm">
              <div className={`p-6 border-b border-rc-border ${cat.bgColor} flex items-center justify-between`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl bg-white border ${cat.borderColor} flex items-center justify-center ${cat.color} shadow-sm`}>
                    {cat.icon}
                  </div>
                  <div>
                    <h3 className={`text-sm font-black uppercase tracking-wider ${cat.color}`}>{cat.title}</h3>
                    <p className="text-[11px] font-medium text-rc-muted uppercase tracking-tight">{cat.subtitle}</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-white/50 rounded-full border border-rc-border">
                  <span className="font-mono text-[10px] text-rc-hint">{steps.length} Steps</span>
                </div>
              </div>

              <div className="divide-y divide-rc-border">
                {steps.map((step, idx) => {
                  const isChecked = checkedItems.has(step);
                  return (
                    <div 
                      key={idx} 
                      onClick={() => toggleCheck(step)}
                      className="flex items-start gap-4 p-5 hover:bg-rc-bg transition-colors cursor-pointer group"
                    >
                      <button className="mt-0.5 shrink-0 transition-transform active:scale-90">
                        {isChecked ? (
                          <CheckCircle2 className="w-5 h-5 text-rc-green" />
                        ) : (
                          <Circle className="w-5 h-5 text-rc-hint group-hover:text-rc-red transition-colors" />
                        )}
                      </button>
                      <span className={`text-[14px] leading-relaxed transition-all ${isChecked ? "text-rc-hint line-through italic" : "text-rc-text font-medium"}`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <div className="mt-12 p-8 rounded-3xl bg-rc-surface border border-rc-border border-dashed text-center">
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
