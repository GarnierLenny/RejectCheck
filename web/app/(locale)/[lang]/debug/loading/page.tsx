"use client";

import { useState, useEffect } from "react";
import { LoadingScreen } from "../../../../components/LoadingScreen";

// Scripted SSE sequence: main steps, then the deep step holds while the 5
// Claude sub-task keys stream into `streamText` (humanized in the panel).
const SEQUENCE: { step: string; addKey?: string }[] = [
  { step: "parsing_cv" },
  { step: "matching_skills" },
  { step: "analyzing_linkedin" },
  { step: "analyzing_github" },
  { step: "running_ats" },
  { step: "dual_ai_analysis" },
  { step: "dual_ai_analysis", addKey: "audit_cv" },
  { step: "dual_ai_analysis", addKey: "audit_jd_match" },
  { step: "dual_ai_analysis", addKey: "ats_simulation" },
  { step: "dual_ai_analysis", addKey: "cv_tone" },
  { step: "dual_ai_analysis", addKey: "hidden_red_flags" },
  { step: "done" },
];

export default function LoadingDebugPage() {
  const [hasGithub, setHasGithub] = useState(true);
  const [hasLinkedin, setHasLinkedin] = useState(true);
  const [errored, setErrored] = useState(false);
  const [run, setRun] = useState(0); // bump to restart

  const [step, setStep] = useState<string | null>(null);
  const [stream, setStream] = useState("");

  useEffect(() => {
    if (errored) return;
    setStream("");
    setStep(SEQUENCE[0].step);
    let i = 0;
    let acc = "";
    const id = setInterval(() => {
      i++;
      if (i >= SEQUENCE.length) {
        clearInterval(id);
        return;
      }
      const cur = SEQUENCE[i];
      if (cur.addKey) {
        acc += `"${cur.addKey}": "reasoning…" `;
        setStream(acc);
      }
      setStep(cur.step);
    }, 1300);
    return () => clearInterval(id);
  }, [run, errored]);

  const Toggle = ({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 rounded border transition-colors ${
        on ? "bg-rc-green/20 text-rc-green border-rc-green/30" : "bg-white/10 text-white/50 border-white/10"
      }`}
    >
      {label}: {on ? "ON" : "OFF"}
    </button>
  );

  return (
    <div className="bg-rc-bg min-h-screen flex flex-col">
      <div className="fixed top-4 left-4 z-50 bg-black/80 text-white p-4 rounded-xl font-mono text-[10px] space-y-2 border border-white/10 max-w-[260px]">
        <p className="text-rc-green font-bold">DEBUG: LOADING SCREEN (v2)</p>
        <p>
          Step: <span className="text-rc-red">{errored ? "error" : step ?? "-"}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Toggle on={hasGithub} label="GitHub" onClick={() => { setHasGithub((v) => !v); setRun((r) => r + 1); }} />
          <Toggle on={hasLinkedin} label="LinkedIn" onClick={() => { setHasLinkedin((v) => !v); setRun((r) => r + 1); }} />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setErrored(false); setRun((r) => r + 1); }}
            className="flex-1 py-1 bg-white/10 hover:bg-white/20 rounded border border-white/10 transition-colors"
          >
            ▸ Restart
          </button>
          <button
            onClick={() => setErrored((v) => !v)}
            className={`flex-1 py-1 rounded border transition-colors ${
              errored ? "bg-rc-amber/30 text-rc-amber border-rc-amber/40" : "bg-white/10 hover:bg-white/20 border-white/10"
            }`}
          >
            ⚠ Error
          </button>
        </div>
      </div>

      <LoadingScreen
        key={run}
        currentStep={errored ? step : step}
        streamText={stream}
        hasGithub={hasGithub}
        hasLinkedin={hasLinkedin}
        hasML={true}
        errored={errored}
        onRetry={() => { setErrored(false); setRun((r) => r + 1); }}
      />
    </div>
  );
}
