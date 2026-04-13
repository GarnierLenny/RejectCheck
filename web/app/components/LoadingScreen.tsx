"use client";

import { useState, useEffect } from "react";

type Props = {
  currentStep: string | null;
  hasGithub: boolean;
  hasLinkedin: boolean;
  hasML: boolean;
};

type StepStatus = "pending" | "running" | "done" | "skipped";

const STEP_IDS = [
  "parsing_cv", 
  "matching_skills", 
  "analyzing_github", 
  "analyzing_linkedin", 
  "analyzing_ml", 
  "running_ats"
] as const;

const STEP_LABELS: Record<string, string> = {
  parsing_cv: "CV parsed",
  matching_skills: "Job description processed",
  analyzing_github: "Analyzing GitHub profile",
  analyzing_linkedin: "Analyzing LinkedIn profile",
  analyzing_ml: "Analyzing Motivation Letter",
  running_ats: "Running ATS simulation",
  computing_score: "Computing rejection score",
};

function Spinner() {
  return (
    <svg className="animate-spin shrink-0" width="13" height="13" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="rgba(226,75,74,0.25)" strokeWidth="2"/>
      <path d="M12 2a10 10 0 0110 10" stroke="#e24b4a" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

function StepIcon({ status }: { status: StepStatus }) {
  if (status === "done") return <span className="text-rc-green font-bold text-[13px] w-[13px] shrink-0">✓</span>;
  if (status === "running") return <Spinner />;
  if (status === "skipped") return <span className="text-rc-hint font-mono text-[10px] w-[13px] shrink-0 opacity-40">--</span>;
  return <span className="text-rc-hint text-[13px] w-[13px] shrink-0 opacity-60">○</span>;
}

export function LoadingScreen({ currentStep, hasGithub, hasLinkedin, hasML }: Props) {
  const [showComputingScore, setShowComputingScore] = useState(false);

  useEffect(() => {
    if (currentStep !== "running_ats") {
      setShowComputingScore(false);
      return;
    }
    const t = setTimeout(() => setShowComputingScore(true), 2000);
    return () => clearTimeout(t);
  }, [currentStep]);

  // All steps are displayed, but some might be skipped
  const displayStepsList = [...STEP_IDS];
  const currentIndex = currentStep ? displayStepsList.indexOf(currentStep as typeof STEP_IDS[number]) : -1;

  function getStatus(stepId: string): StepStatus {
    // Check if step was provided
    if (stepId === "analyzing_github" && !hasGithub) return "skipped";
    if (stepId === "analyzing_linkedin" && !hasLinkedin) return "skipped";
    if (stepId === "analyzing_ml" && !hasML) return "skipped";

    if (stepId === "running_ats") {
      return showComputingScore ? "done" : currentStep === "running_ats" ? "running" : currentIndex > displayStepsList.indexOf("running_ats") ? "done" : "pending";
    }

    const idx = displayStepsList.indexOf(stepId as typeof STEP_IDS[number]);
    if (idx < 0) return "pending";
    if (idx < currentIndex) return "done";
    if (idx === currentIndex) return "running";
    return "pending";
  }

  const finalDisplaySteps = [...displayStepsList, "computing_score"];

  function getComputingScoreStatus(): StepStatus {
    return showComputingScore ? "running" : "pending";
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-rc-surface border border-rc-border rounded-xl px-10 py-10 w-full max-w-[460px] shadow-sm">
        <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-rc-red mb-8 border-b border-rc-red/10 pb-4">
          Analyzing your application...
        </p>

        <div className="space-y-5">
          {finalDisplaySteps.map((stepId) => {
            const status = stepId === "computing_score" ? getComputingScoreStatus() : getStatus(stepId);
            const isSkipped = status === "skipped";

            return (
              <div key={stepId} className={`flex items-center gap-4 transition-opacity duration-300 ${isSkipped ? "opacity-30" : "opacity-100"}`}>
                <StepIcon status={status} />
                <div className="flex flex-col">
                  <span
                    className={`font-mono text-[13px] tracking-tight transition-colors ${
                      status === "done"
                        ? "text-rc-text"
                        : status === "running"
                        ? "text-rc-text font-bold"
                        : isSkipped
                        ? "text-rc-hint line-through decoration-rc-hint/30"
                        : "text-rc-hint px-1"
                    }`}
                  >
                    {STEP_LABELS[stepId]}
                  </span>
                  {isSkipped && (
                    <span className="font-mono text-[9px] uppercase tracking-widest text-rc-hint mt-0.5">Not provided — Skipped</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
