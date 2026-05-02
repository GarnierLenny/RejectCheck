"use client";

import type { UserXp } from "../../lib/queries";

type Props = {
  xp: UserXp;
  /** Show "Xxx → Yyy" label with current/next tier names. Default true. */
  showLabels?: boolean;
};

export function XpProgressBar({ xp, showLabels = true }: Props) {
  const isMax = xp.next == null;
  const percent = isMax ? 100 : xp.percentToNextLevel;
  return (
    <div className={`xp-bar${isMax ? " xp-bar--max" : ""}`}>
      {showLabels && (
        <div className="xp-bar__head">
          <span className="xp-bar__from">{xp.tierLabel}</span>
          {!isMax && (
            <span className="xp-bar__to">→ {xp.next!.tierLabel}</span>
          )}
          <span className="xp-bar__amount">
            {isMax
              ? `${xp.totalXp.toLocaleString()} XP`
              : `${xp.xpInLevel.toLocaleString()} / ${xp.xpForNextLevel.toLocaleString()} XP`}
          </span>
        </div>
      )}
      <div className="xp-bar__track" aria-hidden="true">
        <div className="xp-bar__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
