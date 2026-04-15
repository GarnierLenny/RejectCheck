import ReactMarkdown from "react-markdown";
import type { Fix } from "./types";

export function FixBlock({ fix }: { fix: Fix }) {
  return (
    <div className="mt-4 p-4 bg-rc-bg rounded-lg border-[0.5px] border-rc-border/40">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-full bg-rc-green/20 flex items-center justify-center text-[10px] text-rc-green">✓</div>
        <div className="text-[13px] font-medium text-rc-text prose-sm prose-invert max-w-none">
          <ReactMarkdown>{fix.summary}</ReactMarkdown>
        </div>
      </div>

      <div className="space-y-2.5 ml-7 mb-4">
        {fix.steps.map((step, i) => (
          <div key={i} className="text-[12px] text-rc-muted flex gap-2">
            <span className="text-rc-hint font-mono">{i + 1}.</span>
            <span className="prose-sm prose-invert max-w-none"><ReactMarkdown>{step}</ReactMarkdown></span>
          </div>
        ))}
      </div>

      {fix.example && (
        <div className="ml-7 border-l-2 border-rc-red/20 pl-4 py-1 space-y-3">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-rc-hint font-mono">Current:</span>
            <div className="text-[12px] text-rc-muted italic prose-sm prose-invert max-w-none">
              <ReactMarkdown>{`"${fix.example.before}"`}</ReactMarkdown>
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-rc-green font-mono italic">Reframed:</span>
          <div className="text-[12px] text-rc-text font-medium prose-sm prose-invert max-w-none">
            <ReactMarkdown>{fix.example.after}</ReactMarkdown>
          </div>
        </div>
      )}

      {fix.project_idea && (
        <div className="ml-7 bg-rc-bg/50 p-3.5 rounded-md border-[0.5px] border-rc-border/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-rc-text uppercase tracking-widest">{fix.project_idea.name}</span>
            <span className="text-[10px] text-rc-green font-mono bg-rc-green/10 px-2 py-0.5 rounded">NEW PROJECT</span>
          </div>
          <div className="text-[12px] text-rc-muted mb-3 leading-relaxed prose-sm prose-invert max-w-none">
            <ReactMarkdown>{fix.project_idea.description}</ReactMarkdown>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {fix.project_idea.endpoints.map((e, i) => (
              <span key={i} className="text-[10px] font-mono text-rc-hint bg-rc-surface px-1.5 py-0.5 rounded border-[0.5px] border-rc-border/50">{e}</span>
            ))}
          </div>
          <div className="text-[11px] text-rc-text leading-tight mb-1">
            <span className="text-rc-hint">Demonstrates:</span>{" "}
            <span className="prose-sm prose-invert max-w-none inline"><ReactMarkdown>{fix.project_idea.proves}</ReactMarkdown></span>
          </div>
          {fix.project_idea.bonus && (
            <div className="text-[11px] leading-tight mt-1">
              <span className="text-rc-green font-mono">Bonus:</span>{" "}
              <span className="text-rc-muted prose-sm prose-invert max-w-none inline">
                <ReactMarkdown>{fix.project_idea.bonus}</ReactMarkdown>
              </span>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 ml-7 inline-flex items-center gap-1.5 px-2 py-1 bg-rc-text/5 rounded text-[10px] text-rc-hint font-mono uppercase tracking-tighter">
        <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M7 3.5v3.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        Time: {fix.time_required}
      </div>
    </div>
  );
}
