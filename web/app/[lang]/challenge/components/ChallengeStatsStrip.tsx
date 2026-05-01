"use client";

import { useLanguage } from "../../../../context/language";
import type { Streak } from "../../../../lib/challenge";

type Props = {
  streak: Streak | undefined;
  completions: number | undefined;
};

export function ChallengeStatsStrip({ streak, completions }: Props) {
  const { t } = useLanguage();
  const ui = t.challenge.ui;

  const current = streak?.currentStreak ?? 0;
  const best = streak?.longestStreak ?? 0;
  const personalBest = (ui.personalBest as string).replace("{n}", String(best));

  return (
    <section className="ch-stats-strip" aria-label={ui.currentStreakLabel}>
      <div className="ch-stat">
        <span className="ch-stat__label">{ui.currentStreakLabel}</span>
        <span className="ch-stat__value ch-stat__value--red">
          {current}
          <span className="ch-stat__value-unit">{ui.days}</span>
        </span>
        {best > 0 && <span className="ch-stat__sub">{personalBest}</span>}
      </div>
      <div className="ch-stat">
        <span className="ch-stat__label">{ui.devsToday}</span>
        <span className="ch-stat__value">{completions ?? "—"}</span>
        {completions !== undefined && completions === 0 && (
          <span className="ch-stat__sub">{ui.noCompletionsYet}</span>
        )}
      </div>
    </section>
  );
}
