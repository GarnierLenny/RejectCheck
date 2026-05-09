"use client";

import { Check } from "lucide-react";
import type { Dictionary } from "../../[lang]/dictionaries";
import { StepHeader } from "./StepHeader";

export function StepDone({ t }: { t: Dictionary }) {
  return (
    <section className="text-center">
      <div
        className="w-24 h-24 mx-auto mb-7 bg-rc-red rounded-full flex items-center justify-center shadow-[0_16px_40px_rgba(201,58,57,0.35)]"
        style={{
          animation: "rcPop .5s cubic-bezier(.2,1.4,.4,1)",
        }}
      >
        <Check size={44} strokeWidth={3} className="text-white" />
      </div>
      <StepHeader
        eyebrow={t.onboarding.step6.eyebrow}
        title={t.onboarding.step6.title}
        titleAccent={t.onboarding.step6.titleAccent}
        centered
      >
        {t.onboarding.step6.sub}
      </StepHeader>
      <style>{`
        @keyframes rcPop {
          0% { transform: scale(0.4); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </section>
  );
}
