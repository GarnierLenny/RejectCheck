"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useBuyCredits } from "../../lib/mutations";
import { useQuota, useSubscription } from "../../lib/queries";
import { useLanguage } from "../../context/language";

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Prices mirror the backend source of truth (backend/src/credits/domain/credit-packs.ts).
// Keep in sync when repricing.
const PACKS = [
  { quantity: 500,  price: "8,99 €",  sub: "= 5× analyse JD · 10× audit CV",         popular: false },
  { quantity: 1000, price: "15,99 €", sub: "= 10× analyse JD · 20× audit CV · -11%", popular: true  },
  { quantity: 2000, price: "27,99 €", sub: "= 20× analyse JD · 40× audit CV · -22%", popular: false },
] as const;

export function BuyCreditsModal({ isOpen, onClose }: BuyCreditsModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [loadingQty, setLoadingQty] = useState<number | null>(null);

  const buyCredits = useBuyCredits();
  const { data: quota } = useQuota();
  const { data: sub } = useSubscription();
  const { t, localePath } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const t = setTimeout(() => setIsVisible(false), 250);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  const now = new Date();
  const nextMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  const resetDays = Math.ceil((nextMonthStart.getTime() - now.getTime()) / 86400000);

  const monthlyRemaining = quota ? quota.monthlyCap - quota.monthlyUsed : null;
  const permanentBalance = quota?.creditsBalance ?? 0;
  const showPermanent = permanentBalance >= 50;
  const isHired = sub?.plan === "hired";

  const handleBuy = (quantity: number) => {
    setLoadingQty(quantity);
    buyCredits.mutate(
      { quantity },
      { onSettled: () => setLoadingQty(null) },
    );
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-[250ms] ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div
        className={`relative bg-white border border-rc-border rounded-2xl w-full max-w-[460px] shadow-[0_32px_80px_rgba(0,0,0,0.18)] transition-all duration-[250ms] overflow-hidden ${
          isOpen ? "translate-y-0 scale-100" : "translate-y-3 scale-[0.98]"
        }`}
      >
        {/* Header */}
        <div className="px-7 pt-7 pb-6">
          <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-rc-hint mb-3">{t.buyCreditsModal.title}</p>
          <div className="flex items-baseline gap-3 mb-1.5">
            <span className="font-serif text-[52px] font-medium leading-none text-rc-text">{monthlyRemaining ?? "-"}</span>
            <span className="text-[13px] text-rc-muted leading-tight">{t.buyCreditsModal.monthlyLabel}</span>
          </div>
          <p className="font-mono text-[10px] text-rc-hint">
            {t.buyCreditsModal.resetIn} {resetDays} {resetDays > 1 ? t.buyCreditsModal.days : t.buyCreditsModal.day}
            {showPermanent && <><span className="mx-1.5 opacity-30">·</span><span className="text-rc-green">+{permanentBalance} {t.buyCreditsModal.permanentLabel}</span></>}
          </p>
        </div>

        <div className="border-t border-rc-border" />

        {/* Credit packs */}
        <div className="px-7 py-5">
          <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-rc-hint mb-3">{t.buyCreditsModal.packsLabel}</p>

          <div className="flex flex-col gap-2">
            {PACKS.map((pack) => (
              <button
                key={pack.quantity}
                type="button"
                onClick={() => handleBuy(pack.quantity)}
                disabled={loadingQty !== null}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-left transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                  pack.popular
                    ? "border-rc-red bg-rc-red/[0.04] hover:bg-rc-red/[0.07]"
                    : "border-rc-border hover:border-rc-red/40 hover:bg-rc-bg"
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-bold text-rc-text">
                      {pack.quantity} {pack.quantity > 1 ? t.buyCreditsModal.credits : t.buyCreditsModal.credit}
                    </span>
                    {pack.popular && (
                      <span className="font-mono text-[8px] tracking-[0.1em] uppercase text-rc-red border border-rc-red/40 px-1.5 py-0.5 rounded">
                        {t.buyCreditsModal.popular}
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-[11px] text-rc-hint mt-0.5">{pack.sub}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <span className={`text-[15px] font-bold ${pack.popular ? "text-rc-red" : "text-rc-text"}`}>
                    {loadingQty === pack.quantity ? "…" : pack.price}
                  </span>
                  <span className={`text-[14px] ${pack.popular ? "text-rc-red" : "text-rc-hint"}`}>→</span>
                </div>
              </button>
            ))}
          </div>

          {/* Upgrade CTA — only if not on hired plan */}
          {!isHired && (
            <Link
              href={localePath("/settings")}
              onClick={onClose}
              className="mt-4 flex items-center justify-between w-full px-4 py-3 rounded-xl bg-rc-bg border border-rc-border hover:border-rc-red/40 transition-all no-underline group"
            >
              <div>
                <p className="text-[12px] font-semibold text-rc-text">{t.buyCreditsModal.upgradeTitle}</p>
                <p className="font-mono text-[10px] text-rc-hint mt-0.5">{t.buyCreditsModal.upgradeSub}</p>
              </div>
              <span className="font-mono text-[11px] text-rc-red group-hover:opacity-70 transition-opacity shrink-0 ml-3">
                {t.buyCreditsModal.upgradeCta}
              </span>
            </Link>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-rc-border flex items-center justify-between">
          <span className="font-mono text-[10px] text-rc-hint tracking-[0.06em]">
            {t.buyCreditsModal.paymentNote}
          </span>
          <button
            onClick={onClose}
            className="font-mono text-[10px] tracking-[0.12em] uppercase text-rc-hint hover:text-rc-text transition-colors"
          >
            {t.buyCreditsModal.close}
          </button>
        </div>
      </div>
    </div>
  );
}
