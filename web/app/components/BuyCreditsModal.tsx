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

const PACKS = [
  { quantity: 5,  price: "4,99 €",  sub: "1,00 € / analyse",                    popular: false },
  { quantity: 10, price: "8,99 €",  sub: "0,90 € / analyse · -10%",             popular: true  },
  { quantity: 20, price: "15,99 €", sub: "0,80 € / analyse · -20%",             popular: false },
] as const;

export function BuyCreditsModal({ isOpen, onClose }: BuyCreditsModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [loadingQty, setLoadingQty] = useState<number | null>(null);

  const buyCredits = useBuyCredits();
  const { data: quota } = useQuota();
  const { data: sub } = useSubscription();
  const { localePath } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const t = setTimeout(() => setIsVisible(false), 250);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  if (!isOpen && !isVisible) return null;

  const resetDays = sub?.currentPeriodEnd
    ? Math.max(0, Math.ceil((new Date(sub.currentPeriodEnd).getTime() - Date.now()) / 86400000))
    : null;

  const usedCredits = quota?.monthlyCap ?? 5;
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
          <div className="font-mono text-[9px] tracking-[0.18em] uppercase text-rc-red font-bold flex items-center gap-1.5 mb-3">
            <span className="text-[7px]">●</span> Crédits épuisés
          </div>
          <h2 className="text-[26px] font-bold text-rc-text leading-[1.15] tracking-[-0.02em] mb-3">
            Tu as utilisé tes {usedCredits} crédits<span className="text-rc-red" style={{ fontFamily: "Georgia, serif" }}>.</span>
          </h2>
          <p className="text-[13px] text-rc-muted leading-[1.6]">
            {resetDays !== null
              ? <>Le reset arrive dans <strong className="text-rc-text font-semibold">{resetDays} jour{resetDays > 1 ? "s" : ""}</strong>. Ta candidature et tes signaux sont sauvegardés — relance dès que tu recharges.</>
              : <>Ta candidature et tes signaux sont sauvegardés — recharge pour continuer.</>
            }
          </p>
        </div>

        <div className="border-t border-rc-border" />

        {/* Credit packs */}
        <div className="px-7 py-5">
          <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-rc-hint mb-3">Acheter des crédits</p>

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
                      {pack.quantity} crédit{pack.quantity > 1 ? "s" : ""}
                    </span>
                    {pack.popular && (
                      <span className="font-mono text-[8px] tracking-[0.1em] uppercase text-rc-red border border-rc-red/40 px-1.5 py-0.5 rounded">
                        Populaire
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
                <p className="text-[12px] font-semibold text-rc-text">Passer au plan Pro ou Hired</p>
                <p className="font-mono text-[10px] text-rc-hint mt-0.5">Analyses illimitées · plus de crédits à acheter</p>
              </div>
              <span className="font-mono text-[11px] text-rc-red group-hover:opacity-70 transition-opacity shrink-0 ml-3">
                Voir les plans →
              </span>
            </Link>
          )}
        </div>

        {/* Footer */}
        <div className="px-7 py-4 border-t border-rc-border flex items-center justify-between">
          <span className="font-mono text-[10px] text-rc-hint tracking-[0.06em]">
            Paiement unique · Stripe
          </span>
          <button
            onClick={onClose}
            className="font-mono text-[10px] tracking-[0.12em] uppercase text-rc-hint hover:text-rc-text transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
