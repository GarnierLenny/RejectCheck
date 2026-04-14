"use client";

import { useState, useEffect } from "react";
import { LoadingScreen } from "../../components/LoadingScreen";

const DEBUG_STEPS = [
  "parsing_cv",
  "matching_skills",
  "analyzing_linkedin",
  "analyzing_github",
  "parsing_motivation_letter",
  "running_ats",
  "dual_ai_analysis",
  "done"
] as const;

export default function LoadingDebugPage() {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % DEBUG_STEPS.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-rc-bg min-h-screen">
      <div className="fixed top-4 left-4 z-50 bg-black/80 text-white p-4 rounded-xl font-mono text-[10px] space-y-2 border border-white/10">
        <p className="text-rc-green font-bold">DEBUG MODE: LOADING SCREEN</p>
        <p>Current Step: <span className="text-rc-red">{DEBUG_STEPS[stepIndex] || "Done"}</span></p>
        <div className="flex gap-2">
          <span className="bg-rc-green/20 text-rc-green px-2 py-0.5 rounded">GitHub: ON</span>
          <span className="bg-rc-green/20 text-rc-green px-2 py-0.5 rounded">LinkedIn: ON</span>
          <span className="bg-rc-green/20 text-rc-green px-2 py-0.5 rounded">ML: ON</span>
        </div>
        <button 
          onClick={() => setStepIndex(0)}
          className="mt-2 w-full py-1 bg-white/10 hover:bg-white/20 rounded border border-white/10 transition-colors"
        >
          Restart Loop
        </button>
      </div>
      
      <LoadingScreen 
        currentStep={DEBUG_STEPS[stepIndex]}
        hasGithub={true}
        hasLinkedin={true}
        hasML={true}
      />
    </div>
  );
}
