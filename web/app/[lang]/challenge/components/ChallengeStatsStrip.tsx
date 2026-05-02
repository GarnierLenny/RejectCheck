"use client";

import { useLanguage } from "../../../../context/language";
import type { Streak } from "../../../../lib/challenge";
import { useUserXp } from "../../../../lib/queries";

type Props = {
  streak: Streak | undefined;
  completions: number | undefined;
};

export function ChallengeStatsStrip({ streak, completions }: Props) {
  const { t } = useLanguage();
  const ui = t.challenge.ui;
  const { data: xp } = useUserXp();

  const current = streak?.currentStreak ?? 0;
  const best = streak?.longestStreak ?? 0;
  const personalBest = (ui.personalBest as string).replace("{n}", String(best));

  const xpToNext = xp && xp.next ? xp.xpForNextLevel - xp.xpInLevel : 0;
  const xpToNextLabel =
    xp && xp.next
      ? (ui.xpToNextTier as string).replace("{n}", xpToNext.toLocaleString())
      : (ui.xpMaxTier as string);

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
      <div className="ch-stat">
        <span className="ch-stat__label">{ui.yourRankLabel}</span>
        <span className="ch-stat__value">
          {xp && xp.totalUsers > 0 ? (
            <>
              #{xp.rank}
              <span className="ch-stat__value-sub">
                {" "}/ {xp.totalUsers.toLocaleString()}
              </span>
            </>
          ) : (
            "—"
          )}
        </span>
        {xp && xp.totalUsers > 0 && xp.rank > 0 && (
          <span className="ch-stat__sub">
            {(ui.topPercent as string).replace(
              "{n}",
              ((xp.rank / xp.totalUsers) * 100).toFixed(1),
            )}
          </span>
        )}
      </div>
      <div className="ch-stat">
        <span className="ch-stat__label">{ui.xpTotalLabel}</span>
        <span className="ch-stat__value">
          {xp ? xp.totalXp.toLocaleString() : "—"}
        </span>
        {xp && <span className="ch-stat__sub">{xpToNextLabel}</span>}
      </div>
    </section>
  );
}
