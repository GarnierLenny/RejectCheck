"use client";

import { useState, useEffect } from "react";

type Props = {
  currentStep: string | null;
  hasGithub: boolean;
};

type StepStatus = "pending" | "running" | "done";

const STEP_IDS = ["parsing_cv", "matching_skills", "analyzing_github", "running_ats"] as const;

const STEP_LABELS: Record<string, string> = {
  parsing_cv: "CV parsed",
  matching_skills: "Job description processed",
  analyzing_github: "Analyzing GitHub profile",
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
  return <span className="text-rc-hint text-[13px] w-[13px] shrink-0">○</span>;
}

export function LoadingScreen({ currentStep, hasGithub }: Props) {
  const [showComputingScore, setShowComputingScore] = useState(false);

  useEffect(() => {
    if (currentStep !== "running_ats") {
      setShowComputingScore(false);
      return;
    }
    const t = setTimeout(() => setShowComputingScore(true), 2000);
    return () => clearTimeout(t);
  }, [currentStep]);

  const activeSteps = STEP_IDS.filter((id) => id !== "analyzing_github" || hasGithub);
  const currentIndex = currentStep ? activeSteps.indexOf(currentStep as typeof STEP_IDS[number]) : -1;

  function getStatus(stepId: string): StepStatus {
    if (stepId === "running_ats") {
      return showComputingScore ? "done" : currentStep === "running_ats" ? "running" : currentIndex > activeSteps.indexOf("running_ats") ? "done" : "pending";
    }
    const idx = activeSteps.indexOf(stepId as typeof STEP_IDS[number]);
    if (idx < 0) return "pending";
    if (idx < currentIndex) return "done";
    if (idx === currentIndex) return "running";
    return "pending";
  }

  const displaySteps = [...activeSteps, "computing_score"];

  function getComputingScoreStatus(): StepStatus {
    return showComputingScore ? "running" : "pending";
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-rc-surface border border-rc-border rounded-xl px-10 py-10 w-full max-w-[460px]">
        <p className="font-mono text-[11px] tracking-[0.18em] uppercase text-rc-red mb-6">
          Analyzing your application...
        </p>

        <div className="space-y-4">
          {displaySteps.map((stepId) => {
            const status = stepId === "computing_score" ? getComputingScoreStatus() : getStatus(stepId);
            return (
              <div key={stepId} className="flex items-center gap-3">
                <StepIcon status={status} />
                <span
                  className={`font-mono text-[13px] transition-colors ${
                    status === "done"
                      ? "text-rc-text"
                      : status === "running"
                      ? "text-rc-text"
                      : "text-rc-hint"
                  }`}
                >
                  {STEP_LABELS[stepId]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
