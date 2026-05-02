"use client";

import { useEffect } from "react";
import type { TierKey } from "../../lib/queries";
import { TierBadge } from "./TierBadge";

type Props = {
  open: boolean;
  newLevel: number;
  newTier: TierKey;
  newTierLabel: string;
  newRewardLabels: string[]; // human-readable reward labels (i18n'd by caller)
  onClose: () => void;
};

export function LevelUpModal({
  open,
  newLevel,
  newTier,
  newTierLabel,
  newRewardLabels,
  onClose,
}: Props) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="xp-modal__backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="xp-modal-title"
      onClick={onClose}
    >
      <div className="xp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="xp-modal__burst" aria-hidden="true" />
        <p className="xp-modal__eyebrow">Level up</p>
        <h2 id="xp-modal-title" className="xp-modal__title">
          Welcome to <em>{newTierLabel}</em>
        </h2>
        <div className="xp-modal__badge">
          <TierBadge
            tier={newTier}
            label={`Lvl ${newLevel} · ${newTierLabel}`}
            animated
          />
        </div>
        {newRewardLabels.length > 0 && (
          <div className="xp-modal__rewards">
            <p className="xp-modal__rewards-title">Unlocked rewards</p>
            <ul className="xp-modal__rewards-list">
              {newRewardLabels.map((r, i) => (
                <li key={i}>
                  <span className="xp-modal__rewards-bullet" aria-hidden>
                    ✦
                  </span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
        <button
          type="button"
          className="xp-modal__cta"
          onClick={onClose}
          autoFocus
        >
          Keep going →
        </button>
      </div>
    </div>
  );
}
