"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { STACKS_EXTENDED } from "../../../lib/onboarding-data";
import type { Dictionary } from "../../[lang]/dictionaries";

const MAX_STACKS = 3;

export function StackPickerModal({
  t,
  open,
  selected,
  onToggle,
  onClose,
}: {
  t: Dictionary;
  open: boolean;
  selected: string[];
  onToggle: (name: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return STACKS_EXTENDED;
    return STACKS_EXTENDED.filter((s) => s.toLowerCase().includes(q));
  }, [query]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-6 transition-opacity duration-[250ms] ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      style={{
        background: "rgba(20, 19, 23, 0.55)",
        backdropFilter: "blur(6px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`bg-rc-bg border border-rc-border rounded-3xl w-full max-w-[640px] max-h-[82vh] overflow-hidden flex flex-col shadow-[0_24px_70px_rgba(0,0,0,0.22)] transition-transform duration-[250ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
          open ? "translate-y-0 scale-100" : "translate-y-3 scale-[0.98]"
        }`}
      >
        <div className="px-6 pt-5 pb-4 border-b-[0.5px] border-rc-border flex items-baseline justify-between">
          <h2 className="m-0 text-[22px] font-semibold tracking-[-0.015em]">
            {t.onboarding.step3.modalTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-rc-hint w-8 h-8 rounded-full flex items-center justify-center hover:bg-rc-surface hover:text-rc-text transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 pt-4 pb-6">
          <div className="relative mb-3.5">
            <Search
              size={18}
              className="absolute left-[18px] top-1/2 -translate-y-1/2 text-rc-hint"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.onboarding.step3.modalSearch}
              className="w-full pl-12 pr-4 py-3.5 border-[1.5px] border-rc-border bg-rc-surface rounded-2xl text-[15px] text-rc-text outline-none focus:border-rc-red/50 focus:shadow-[0_0_0_4px_rgba(201,58,57,0.08)] transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2.5">
            {filtered.map((name) => {
              const idx = selected.indexOf(name);
              const isSelected = idx >= 0;
              const atMax = !isSelected && selected.length >= MAX_STACKS;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onToggle(name)}
                  disabled={atMax}
                  className={`inline-flex items-center gap-2.5 border-[1.5px] rounded-full text-[15px] font-medium leading-none transition-all duration-150 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
                    isSelected
                      ? "border-rc-red bg-rc-red text-white shadow-[0_6px_16px_rgba(201,58,57,0.22)]"
                      : "border-rc-border bg-rc-surface text-rc-text hover:border-rc-red/55 hover:-translate-y-px"
                  } ${atMax ? "opacity-40 cursor-not-allowed" : ""}`}
                  style={{ padding: "13px 18px" }}
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
        </div>
        <div className="px-6 py-3.5 border-t-[0.5px] border-rc-border bg-rc-surface flex items-center gap-3.5">
          <span className="font-mono text-[11px] tracking-[0.16em] uppercase text-rc-hint">
            <b className="text-rc-text font-bold">{selected.length}</b> /{" "}
            {MAX_STACKS} selected
          </span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto h-11 px-5 rounded-full bg-rc-red text-white font-mono uppercase font-bold text-[12px] tracking-[0.18em] shadow-[0_6px_16px_rgba(201,58,57,0.25)] hover:bg-rc-red-hover transition-all"
          >
            {t.onboarding.step3.modalDone}
          </button>
        </div>
      </div>
    </div>
  );
}
