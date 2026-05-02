"use client";

import { useState } from "react";
import { useRewards } from "../../../../lib/queries";

export function RewardsList() {
  const { data, isLoading } = useRewards();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (isLoading || !data) {
    return (
      <section className="xp-rewards xp-rewards--loading">
        <p className="xp-rewards__placeholder">Loading rewards…</p>
      </section>
    );
  }

  const unlocked = data.filter((r) => r.unlocked);
  const locked = data.filter((r) => !r.unlocked);

  function copy(code: string, key: string) {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  }

  return (
    <section className="xp-rewards">
      <header className="xp-rewards__head">
        <p className="xp-rewards__eyebrow">Rewards</p>
        <h3 className="xp-rewards__title">
          {unlocked.length} unlocked · {locked.length} to come
        </h3>
      </header>

      {unlocked.length > 0 && (
        <ul className="xp-rewards__list">
          {unlocked.map((r) => (
            <li key={r.key} className="xp-rewards__item xp-rewards__item--unlocked">
              <div className="xp-rewards__main">
                <p className="xp-rewards__label">{r.label}</p>
                <p className="xp-rewards__desc">{r.description}</p>
              </div>
              {r.type === "stripe_coupon" && r.promotionCode ? (
                <div className="xp-rewards__code-row">
                  <code className="xp-rewards__code">{r.promotionCode}</code>
                  <button
                    type="button"
                    className="xp-rewards__copy"
                    onClick={() => copy(r.promotionCode!, r.key)}
                  >
                    {copiedKey === r.key ? "Copied!" : "Copy"}
                  </button>
                </div>
              ) : (
                <span className="xp-rewards__pill xp-rewards__pill--active">
                  Active
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {locked.length > 0 && (
        <ul className="xp-rewards__list xp-rewards__list--locked">
          {locked.map((r) => (
            <li key={r.key} className="xp-rewards__item xp-rewards__item--locked">
              <div className="xp-rewards__main">
                <p className="xp-rewards__label">{r.label}</p>
                <p className="xp-rewards__desc">{r.description}</p>
              </div>
              <span className="xp-rewards__pill xp-rewards__pill--locked">
                Lvl {r.unlockedAtLevel}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
