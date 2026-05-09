"use client";

import { useState } from "react";
import { STACKS_PRIMARY } from "../../../lib/onboarding-data";
import type { Dictionary } from "../../[lang]/dictionaries";
import { StepHeader } from "./StepHeader";
import { StackPickerModal } from "./StackPickerModal";

const MAX_STACKS = 3;

export function StepStack({
  t,
  stacks,
  onToggle,
}: {
  t: Dictionary;
  stacks: string[];
  onToggle: (name: string) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section>
      <StepHeader
        eyebrow={t.onboarding.step3.eyebrow}
        title={t.onboarding.step3.title}
        titleAccent={t.onboarding.step3.titleAccent}
        titleSuffix={t.onboarding.step3.titleSuffix}
      >
        {t.onboarding.step3.sub}
      </StepHeader>

      <div className="flex flex-wrap gap-2.5">
        {STACKS_PRIMARY.map((name) => {
          const idx = stacks.indexOf(name);
          const isSelected = idx >= 0;
          const atMax = !isSelected && stacks.length >= MAX_STACKS;
          return (
            <button
              key={name}
              type="button"
              onClick={() => onToggle(name)}
              disabled={atMax}
              className={`inline-flex items-center gap-2.5 px-4.5 py-3 border-[1.5px] rounded-full text-[15px] font-medium leading-none transition-all duration-150 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
                isSelected
                  ? "border-rc-red bg-rc-red text-white shadow-[0_6px_16px_rgba(201,58,57,0.22)]"
                  : "border-rc-border bg-rc-surface text-rc-text hover:border-rc-red/55 hover:-translate-y-px"
              } ${atMax ? "opacity-40 cursor-not-allowed" : ""}`}
              style={{ paddingLeft: "18px", paddingRight: "18px", paddingTop: "13px", paddingBottom: "13px" }}
            >
              {isSelected && (
                <span className="font-mono text-[10px] font-bold tracking-[0.04em] bg-white/20 text-white px-1.5 py-[3px] rounded-full">
                  {idx + 1}
                </span>
              )}
              {name}
            </button>
          );
        })}
      </div>

      <div className="mt-5 px-4 py-3.5 border border-rc-border rounded-2xl bg-rc-surface flex items-center gap-3.5">
        <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-rc-hint">
          <b
            className={`font-bold ${
              stacks.length === MAX_STACKS ? "text-rc-red" : "text-rc-text"
            }`}
          >
            {stacks.length}
          </b>
          {" / "}
          {MAX_STACKS}
          {" "}
          {t.onboarding.step3.counter
            .replace("{n}", "")
            .replace(`/ ${MAX_STACKS}`, "")
            .trim()}
        </span>
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="font-mono text-[10px] tracking-[0.16em] uppercase text-rc-red px-3.5 py-2 border-[1.5px] border-dashed border-rc-red/45 rounded-full bg-transparent hover:bg-rc-red-bg hover:border-rc-red transition-all"
        >
          {t.onboarding.step3.seeAll}
        </button>
        <div className="ml-auto flex gap-1.5">
          {Array.from({ length: MAX_STACKS }).map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                i < stacks.length ? "bg-rc-red" : "bg-rc-border"
              }`}
            />
          ))}
        </div>
      </div>

      <StackPickerModal
        t={t}
        open={modalOpen}
        selected={stacks}
        onToggle={onToggle}
        onClose={() => setModalOpen(false)}
      />
    </section>
  );
}
