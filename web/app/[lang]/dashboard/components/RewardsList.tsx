"use client";

import { useState } from "react";
import { useRewards } from "../../../../lib/queries";

const PAGE_SIZE = 3;

export function RewardsList() {
  const { data, isLoading } = useRewards();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  if (isLoading || !data) {
    return (
      <section className="xp-rewards xp-rewards--loading">
        <p className="xp-rewards__placeholder">Loading rewards…</p>
      </section>
    );
  }

  const unlocked = data.filter((r) => r.unlocked);
  const locked = data.filter((r) => !r.unlocked);
  const ordered = [...unlocked, ...locked];

  const totalPages = Math.max(1, Math.ceil(ordered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * PAGE_SIZE;
  const visible = ordered.slice(start, start + PAGE_SIZE);

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

      {visible.length > 0 && (
        <ul className="xp-rewards__list">
          {visible.map((r) =>
            r.unlocked ? (
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
            ) : (
              <li key={r.key} className="xp-rewards__item xp-rewards__item--locked">
                <div className="xp-rewards__main">
                  <p className="xp-rewards__label">{r.label}</p>
                  <p className="xp-rewards__desc">{r.description}</p>
                </div>
                <span className="xp-rewards__pill xp-rewards__pill--locked">
                  Lvl {r.unlockedAtLevel}
                </span>
              </li>
            )
          )}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[rgba(0,0,0,0.06)]">
          <span className="font-mono text-[10px] uppercase tracking-widest text-rc-hint">
            {safePage + 1} / {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="px-3 py-1.5 rounded-lg border border-rc-border bg-white font-mono text-[9px] tracking-widest uppercase text-rc-hint hover:text-rc-text hover:border-rc-red/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="px-3 py-1.5 rounded-lg border border-rc-border bg-white font-mono text-[9px] tracking-widest uppercase text-rc-hint hover:text-rc-text hover:border-rc-red/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
