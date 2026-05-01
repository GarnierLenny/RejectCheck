"use client";

import { useMemo } from "react";
import { useLanguage } from "../../../../context/language";
import { useChallengeActivity } from "../../../../lib/challenge";

const TOTAL_DAYS = 28;
const DONE_THRESHOLD = 70;

type CellState = "" | "done" | "partial" | "today";

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function ChallengeStreakTrack() {
  const { t, locale } = useLanguage();
  const ui = t.challenge.ui;
  const activityQuery = useChallengeActivity();

  const { cells, completedCount, startLabel, midLabel } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today);
    start.setDate(start.getDate() - (TOTAL_DAYS - 1));

    const map = new Map<string, number>();
    (activityQuery.data ?? []).forEach((entry) => {
      map.set(entry.date.slice(0, 10), entry.score);
    });

    const cells: CellState[] = [];
    let completedCount = 0;
    for (let i = 0; i < TOTAL_DAYS; i++) {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      const isToday = i === TOTAL_DAYS - 1;
      const score = map.get(isoDay(day));
      let state: CellState = "";
      if (score !== undefined) {
        state = score >= DONE_THRESHOLD ? "done" : "partial";
        completedCount++;
      }
      if (isToday && state === "") state = "today";
      cells.push(state);
    }

    const fmt = (d: Date) =>
      d.toLocaleDateString(locale, { month: "short", day: "numeric" });
    const mid = new Date(start);
    mid.setDate(mid.getDate() + Math.floor(TOTAL_DAYS / 2));

    return {
      cells,
      completedCount,
      startLabel: fmt(start),
      midLabel: fmt(mid),
    };
  }, [activityQuery.data, locale]);

  const progress = (ui.daysCompleted as string)
    .replace("{done}", String(completedCount))
    .replace("{total}", String(TOTAL_DAYS));

  return (
    <section className="ch-streak-card" aria-label={ui.last28Days}>
      <div className="ch-streak-card__head">
        <div className="ch-streak-card__title">
          <span className="ch-streak-card__title-bar" />
          <b>{ui.last28Days}</b>
        </div>
        <span className="ch-streak-card__progress">{progress}</span>
      </div>
      <div className="ch-streak-track">
        {cells.map((state, i) => (
          <div
            key={i}
            className={`ch-streak-cell${state ? ` ch-streak-cell--${state}` : ""}`}
          />
        ))}
      </div>
      <div className="ch-streak-track__foot">
        <span>{startLabel}</span>
        <span>{midLabel}</span>
        <span className="today">{ui.today}</span>
      </div>
    </section>
  );
}
