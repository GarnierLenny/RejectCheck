"use client";

import { CheckCircle2, Zap, Target, Trophy, ArrowRight, Layers, ShieldCheck, Gauge, Lightbulb } from "lucide-react";
import type { AnalysisResult } from "../types";

type Props = {
  result: AnalysisResult;
};

export function BridgeTab({ result }: Props) {
  const project = result.project_recommendation;

  if (!project) {
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

  const difficultyColor = 
    project.difficulty_level === 'Expert' ? 'text-rc-red border-rc-red/20 bg-rc-red/5' :
    project.difficulty_level === 'Advanced' ? 'text-rc-amber border-rc-amber/20 bg-rc-amber/5' :
    'text-blue-500 border-blue-500/20 bg-blue-500/5';

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="px-2 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Bridge the Gap</h2>
          <p className="text-rc-muted text-sm mt-1">A high-impact project engineered to crush technical objections.</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-full font-mono text-[9px] uppercase tracking-widest font-bold ${difficultyColor}`}>
          <Gauge className="w-3 h-3" />
          Level: {project.difficulty_level}
        </div>
      </div>

      <div className="bg-rc-surface border border-rc-border rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
          <Trophy className="w-48 h-48 text-rc-green rotate-12" />
        </div>

        <div className="p-8 md:p-12 relative z-10">
          {/* Header Section */}
          <div className="max-w-3xl mb-12">
            <h3 className="text-3xl font-black text-rc-text mb-4 leading-tight">{project.name}</h3>
            <p className="text-rc-muted leading-relaxed text-lg">
              {project.description}
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            {/* Main Content (Blueprint & Features) */}
            <div className="lg:col-span-2 space-y-10">
              
              {/* Architecture Blueprint Section */}
              <div className="relative p-6 rounded-3xl bg-rc-bg border border-rc-border shadow-inner overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-rc-red" />
                <div className="flex items-center gap-2 mb-4 text-rc-red">
                  <Layers className="w-4 h-4" />
                  <span className="text-xs font-black uppercase tracking-[0.2em]">Architecture Blueprint</span>
                </div>
                <div className="font-mono text-[13px] leading-relaxed text-rc-muted whitespace-pre-wrap">
                  {project.architecture}
                </div>
              </div>

              {/* Technologies & Concepts */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-rc-hint flex items-center gap-2">
                    <Zap className="w-3 h-3" /> Core Stack
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech) => (
                      <span key={tech} className="px-3 py-1 bg-white border border-rc-border rounded-lg text-[11px] font-bold text-rc-text">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-rc-hint flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" /> Advanced Concepts
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {project.advanced_concepts.map((concept) => (
                      <span key={concept} className="px-3 py-1 bg-blue-500/5 border border-blue-500/20 rounded-lg text-[11px] font-bold text-blue-600">
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Success Criteria */}
              <div className="space-y-4 pt-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-rc-hint flex items-center gap-2">
                  <Trophy className="w-3 h-3" /> Success Criteria (To WOW Recruiters)
                </h4>
                <div className="grid sm:grid-cols-1 gap-3">
                  {project.success_criteria.map((criteria, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 bg-rc-green/5 border border-rc-green/10 rounded-2xl">
                      <div className="mt-1 w-5 h-5 rounded-full bg-rc-green flex items-center justify-center shrink-0">
                        <Trophy className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm font-medium leading-relaxed">{criteria}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar (Why & Steps) */}
            <div className="space-y-6">
              <div className="p-8 bg-rc-surface border border-rc-border rounded-[2rem] shadow-sm space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-rc-green">
                    <Target className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Strategic Value</span>
                  </div>
                  <p className="text-[13px] leading-relaxed text-rc-text/80 italic">
                    "{project.why_it_matters}"
                  </p>
                </div>

                <div className="h-px bg-rc-border/50" />

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-rc-red">
                    <ArrowRight className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Actionable Steps</span>
                  </div>
                  <div className="space-y-3">
                    {project.what_matters.map((item, i) => (
                      <div key={i} className="group/item flex gap-3">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rc-red shrink-0 group-hover/item:scale-125 transition-transform" />
                        <p className="text-[13px] leading-relaxed text-rc-text/80">
                          {item}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                   <div className="p-4 bg-rc-hint/5 border border-rc-border rounded-2xl flex items-start gap-3">
                    <Lightbulb className="w-4 h-4 text-rc-hint shrink-0 mt-0.5" />
                    <p className="text-[11px] text-rc-hint leading-relaxed">
                      Deploy this to production and document the trade-offs you made. That's what seniors do.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 p-10 rounded-[2.5rem] bg-rc-bg border border-rc-border border-dashed text-center">
        <p className="text-rc-muted text-sm mb-6 max-w-sm mx-auto tracking-tight">
          Solving these specific gaps transforms you from "potentially risky" to "evidently overqualified".
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
