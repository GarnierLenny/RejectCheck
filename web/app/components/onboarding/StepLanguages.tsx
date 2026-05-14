"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { LANGS_EXTENDED, LANGS_PRIMARY } from "../../../lib/onboarding-data";
import type { Dictionary } from "../../(locale)/[lang]/dictionaries";
import { StepHeader } from "./StepHeader";

export function StepLanguages({
  t,
  langs,
  onToggle,
}: {
  t: Dictionary;
  langs: string[];
  onToggle: (code: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pool = showAll || q ? LANGS_EXTENDED : LANGS_PRIMARY;
    if (!q) return pool;
    return pool.filter((l) => l.name.toLowerCase().includes(q));
  }, [query, showAll]);

  return (
    <section>
      <StepHeader
        eyebrow={t.onboarding.step4.eyebrow}
        title={t.onboarding.step4.title}
        titleAccent={t.onboarding.step4.titleAccent}
      >
        {t.onboarding.step4.sub}
      </StepHeader>

      <div className="relative mb-4">
        <Search
          size={18}
          className="absolute left-[18px] top-1/2 -translate-y-1/2 text-rc-hint"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.onboarding.step4.searchPlaceholder}
          className="w-full pl-12 pr-4 py-4 border-[1.5px] border-rc-border bg-rc-surface rounded-2xl text-[16px] text-rc-text outline-none focus:border-rc-red/50 focus:shadow-[0_0_0_4px_rgba(201,58,57,0.08)] transition-all"
        />
      </div>

      <div className="flex flex-wrap gap-2.5">
        {visible.map((l) => {
          const isSelected = langs.includes(l.code);
          return (
            <button
              key={l.code}
              type="button"
              onClick={() => onToggle(l.code)}
              className={`inline-flex items-center gap-2.5 border-[1.5px] rounded-full text-[15px] font-medium leading-none transition-all duration-150 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
                isSelected
                  ? "border-rc-red bg-rc-red text-white shadow-[0_6px_16px_rgba(201,58,57,0.22)]"
                  : "border-rc-border bg-rc-surface text-rc-text hover:border-rc-red/55 hover:-translate-y-px"
              }`}
              style={{ padding: "13px 18px" }}
            >
              <span
                className={`font-mono text-[10px] font-semibold tracking-[0.08em] uppercase ${
                  isSelected ? "opacity-85" : "opacity-70"
                }`}
              >
                {l.code}
              </span>
              {l.name}
            </button>
          );
        })}
      </div>

      <div className="mt-5 px-4 py-3.5 border border-rc-border rounded-2xl bg-rc-surface flex items-center gap-3.5">
        <span className="font-mono text-[11px] tracking-[0.14em] uppercase text-rc-hint">
          <b className="text-rc-text font-bold">{langs.length}</b>{" "}
          {t.onboarding.step4.counter.replace("{n}", "").trim()}
        </span>
        {!showAll && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="ml-auto font-mono text-[10px] tracking-[0.16em] uppercase text-rc-red px-3.5 py-2 border-[1.5px] border-dashed border-rc-red/45 rounded-full bg-transparent hover:bg-rc-red-bg hover:border-rc-red transition-all"
          >
            {t.onboarding.step4.addAnother}
          </button>
        )}
      </div>
    </section>
  );
}
