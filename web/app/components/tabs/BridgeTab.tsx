"use client";

import { CheckCircle2, Zap, Target, Trophy, ArrowRight } from "lucide-react";
import type { AnalysisResult } from "../types";

type Props = {
  result: AnalysisResult;
};

export function BridgeTab({ result }: Props) {
  if (!result.project_recommendation) {
    return (
      <div className="p-12 text-center bg-rc-surface rounded-3xl border border-rc-border border-dashed">
        <CheckCircle2 className="w-12 h-12 text-rc-green mx-auto mb-4 opacity-20" />
        <h3 className="text-lg font-bold mb-2">No Project Needed</h3>
        <p className="text-rc-muted text-sm mx-auto max-w-[300px]">
          Your technical profile already aligns perfectly with this role's requirements.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 px-2">
        <h2 className="text-2xl font-bold tracking-tight">Bridge the Gap</h2>
        <p className="text-rc-muted text-sm mt-1">A personalized project to prove your competence in missing technologies.</p>
      </div>

      <div className="bg-rc-surface border border-rc-border rounded-[2rem] overflow-hidden shadow-xl shadow-rc-green/5 relative group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <Trophy className="w-32 h-32 text-rc-green rotate-12" />
        </div>

        <div className="p-8 md:p-10 relative">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1 space-y-6">
              <div>
                <h3 className="text-2xl font-black text-rc-text mb-3">{result.project_recommendation.name}</h3>
                <p className="text-rc-muted leading-relaxed">
                  {result.project_recommendation.description}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {result.project_recommendation.technologies.map((tech) => (
                  <span key={tech} className="px-3 py-1 bg-white border border-rc-border rounded-full text-[11px] font-bold uppercase tracking-wider text-rc-text shadow-sm">
                    {tech}
                  </span>
                ))}
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-rc-hint">Key Features to Build</h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  {result.project_recommendation.key_features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 p-3 bg-white/50 border border-rc-border/50 rounded-2xl text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4 text-rc-green shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-full md:w-72 space-y-4">
              <div className="p-6 bg-rc-green/5 border border-rc-green/20 rounded-3xl space-y-4">
                <div className="flex items-center gap-2 text-rc-green">
                  <Target className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Why this project?</span>
                </div>
                <p className="text-[13px] leading-relaxed text-rc-text/80 italic">
                  "{result.project_recommendation.why_it_matters}"
                </p>
              </div>

              <div className="p-6 bg-rc-red/5 border border-rc-red/20 rounded-3xl space-y-4">
                <div className="flex items-center gap-2 text-rc-red">
                  <ArrowRight className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Vital Steps</span>
                </div>
                <div className="space-y-3">
                  {result.project_recommendation.what_matters.map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-rc-red font-bold">•</span>
                      <p className="text-[13px] leading-relaxed text-rc-text/80">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 p-8 rounded-3xl bg-rc-surface border border-rc-border border-dashed text-center">
        <p className="text-rc-muted text-sm mb-6">
          Completing this project provides concrete evidence of your skills for this specific role.
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
