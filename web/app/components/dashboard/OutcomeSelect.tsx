"use client";

import { useSetOutcome } from "../../../lib/mutations";
import { useLanguage } from "../../../context/language";
import type { AnalysisOutcome } from "../../../lib/queries";

const OUTCOMES: AnalysisOutcome[] = [
  "not_applied",
  "applied",
  "no_response",
  "interview",
  "offer",
  "rejected",
];

// Colour cue mirrors the risk semantics: green = good result, red = bad,
// amber = in-progress signal, muted = pending/no signal.
const COLOR: Record<AnalysisOutcome, string> = {
  not_applied: "text-rc-hint",
  applied: "text-rc-text",
  no_response: "text-rc-hint",
  interview: "text-rc-amber",
  offer: "text-rc-green",
  rejected: "text-rc-red",
};

/**
 * Inline per-analysis outcome picker (the moat's data-capture surface). Native
 * <select> for accessibility + zero deps; stops row-click propagation so
 * choosing an outcome doesn't navigate into the analysis.
 */
export function OutcomeSelect({
  id,
  value,
}: {
  id: number;
  value: AnalysisOutcome;
}) {
  const { t } = useLanguage();
  const setOutcome = useSetOutcome();
  const labels = t.dashboardShell.outcomes;

  return (
    <select
      aria-label={labels.header}
      title={labels.hint}
      value={value}
      disabled={setOutcome.isPending}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) =>
        setOutcome.mutate({ id, outcome: e.target.value as AnalysisOutcome })
      }
      className={`bg-transparent border-0 font-mono text-[10px] font-bold cursor-pointer outline-none disabled:opacity-50 ${COLOR[value]}`}
    >
      {OUTCOMES.map((o) => (
        <option key={o} value={o} className="text-rc-text">
          {labels[o]}
        </option>
      ))}
    </select>
  );
}
