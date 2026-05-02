"use client";

import { useUserXp, useXpLedger } from "../../../../lib/queries";
import { TierBadge } from "../../../components/TierBadge";
import { XpProgressBar } from "../../../components/XpProgressBar";

export function XpPanel() {
  const xpQuery = useUserXp();
  const ledgerQuery = useXpLedger(10);

  if (xpQuery.isLoading || !xpQuery.data) {
    return (
      <section className="xp-panel xp-panel--loading">
        <p className="xp-panel__placeholder">Loading XP…</p>
      </section>
    );
  }

  const xp = xpQuery.data;

  return (
    <section className="xp-panel">
      <header className="xp-panel__head">
        <div>
          <p className="xp-panel__eyebrow">Your rank</p>
          <div className="xp-panel__tier-row">
            <TierBadge tier={xp.tier} label={xp.tierLabel} />
            <span className="xp-panel__level-num">Lvl {xp.level}</span>
          </div>
        </div>
        <div className="xp-panel__xp-total">
          <span className="xp-panel__xp-num">{xp.totalXp.toLocaleString()}</span>
          <span className="xp-panel__xp-unit">XP total</span>
        </div>
      </header>

      <div className="xp-panel__bar">
        <XpProgressBar xp={xp} />
      </div>

      {ledgerQuery.data && ledgerQuery.data.length > 0 && (
        <div className="xp-panel__ledger">
          <p className="xp-panel__ledger-head">Recent XP</p>
          <ul className="xp-panel__ledger-list">
            {ledgerQuery.data.slice(0, 8).map((tx) => (
              <li key={tx.id} className="xp-panel__ledger-row">
                <span className="xp-panel__ledger-amount">
                  +{tx.amount} XP
                </span>
                <span className="xp-panel__ledger-reason">
                  {humanizeReason(tx.reason)}
                </span>
                <span className="xp-panel__ledger-time">
                  {timeAgo(new Date(tx.createdAt))}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function humanizeReason(reason: string): string {
  switch (reason) {
    case "challenge_completion":
      return "Daily challenge";
    case "first_perfect_focus_tag":
      return "First perfect on this topic";
    case "backfill_legacy":
      return "Past challenges";
    default:
      return reason.replace(/_/g, " ");
  }
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
