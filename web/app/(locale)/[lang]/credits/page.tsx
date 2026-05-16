"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../../../context/auth";
import { useQuota, useSubscription } from "../../../../lib/queries";
import { useBuyCredits } from "../../../../lib/mutations";
import { useLanguage } from "../../../../context/language";
import { Navbar } from "../../../components/Navbar";

const PACKS = [
  { quantity: 5,  price: "4,99 €",  sub: "0,99 € / analyse", badge: null,   popular: false },
  { quantity: 10, price: "8,99 €",  sub: "0,89 € / analyse", badge: "-10%", popular: true  },
  { quantity: 20, price: "14,99 €", sub: "0,74 € / analyse", badge: "-25%", popular: false },
] as const;

const MOCK_HISTORY: { id: number; event: string; date: string; delta: number; type: string }[] = [];

function HistoryIcon({ type }: { type: string }) {
  const base = "w-7 h-7 rounded-lg flex items-center justify-center font-mono text-[11px] font-bold flex-shrink-0";
  if (type === "reset")   return <div className={`${base} bg-rc-green/10 text-rc-green`}>↻</div>;
  if (type === "achat")   return <div className={`${base} bg-rc-green/10 text-rc-green`}>+</div>;
  return <div className={`${base} bg-rc-border/40 text-rc-hint`}>·</div>;
}

function CreditsContent() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { data: quota } = useQuota();
  const { data: sub } = useSubscription();
  const { localePath } = useLanguage();
  const buyCredits = useBuyCredits();
  const [loadingQty, setLoadingQty] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.replace(localePath("/login"));
  }, [authLoading, user, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const monthlyRemaining = quota ? quota.monthlyCap - quota.monthlyUsed : null;
  const progressPct = quota
    ? Math.max(0, Math.min(100, ((quota.monthlyCap - quota.monthlyUsed) / quota.monthlyCap) * 100))
    : 0;
  const isLow = monthlyRemaining !== null && monthlyRemaining <= 3;
  const isHired = sub?.plan === "hired";

  const resetDays = sub?.currentPeriodEnd
    ? Math.max(0, Math.ceil((new Date(sub.currentPeriodEnd).getTime() - Date.now()) / 86400000))
    : null;
  const resetDate = sub?.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const handleBuy = (quantity: number) => {
    setLoadingQty(quantity);
    buyCredits.mutate({ quantity }, { onSettled: () => setLoadingQty(null) });
  };

  if (authLoading || !user) return null;

  return (
    <div className="bg-rc-bg text-rc-text font-sans min-h-screen">
      <Navbar />

      <div className="max-w-[1440px] mx-auto px-8 py-12">
        <div className="grid gap-10" style={{ gridTemplateColumns: "9fr 11fr" }}>

          {/* ── LEFT COLUMN ── */}
          <div className="flex flex-col gap-6">
            {/* Breadcrumb + title */}
            <div>
              <p className="font-mono text-[10px] tracking-[0.15em] uppercase text-rc-hint mb-3">
                <Link href={localePath("/dashboard")} className="no-underline hover:text-rc-text transition-colors">Compte</Link>
                <span className="mx-2">·</span>
                Crédits
              </p>
              <h1 className="font-serif text-[56px] font-normal leading-none m-0" style={{ letterSpacing: -1 }}>
                Tes crédits<span className="text-rc-red">.</span>
              </h1>
            </div>

            {/* Balance card */}
            <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl p-6">
              <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-rc-hint font-bold mb-4">Solde actuel</p>

              <div className="flex items-end justify-between gap-4 mb-4">
                {/* Big number */}
                <div className="flex items-baseline gap-2">
                  <span className={`font-serif text-[80px] font-medium leading-none tracking-tight ${isLow ? "text-rc-red" : "text-rc-text"}`}>
                    {monthlyRemaining ?? "—"}
                  </span>
                  <span className="font-serif text-[36px] font-normal leading-none text-rc-hint">/ {quota?.monthlyCap ?? "—"}</span>
                </div>

                {/* Reset info */}
                {resetDays !== null && (
                  <div className="text-right pb-1">
                    <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-rc-hint mb-1">Reset gratuit</p>
                    <p className="font-serif text-[28px] font-medium leading-none text-rc-text">{resetDays} jours</p>
                    {resetDate && <p className="font-mono text-[11px] text-rc-hint mt-1">{resetDate}</p>}
                  </div>
                )}
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-rc-surface-hero rounded-full overflow-hidden mb-4">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progressPct}%`, background: isLow ? "var(--rc-red)" : "var(--rc-green)" }}
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-rc-hint">{quota?.monthlyCap ?? 5} crédits gratuits / mois</span>
                {!isHired && (
                  <Link href={localePath("/pricing")} className="font-mono text-[11px] text-rc-hint hover:text-rc-text no-underline transition-colors">
                    Plan illimité dès 12,99 €/mois
                  </Link>
                )}
              </div>
            </div>

            {/* Recharge */}
            <div>
              <p className="font-mono text-[9px] tracking-[0.18em] uppercase text-rc-hint font-bold mb-3">Recharge instantanée</p>
              <div className="grid grid-cols-3 gap-3">
                {PACKS.map((pack) => (
                  <div
                    key={pack.quantity}
                    className={`relative rounded-xl border flex flex-col gap-4 p-5 ${
                      pack.popular ? "border-rc-red" : "border-[rgba(0,0,0,0.08)] bg-white"
                    }`}
                    style={pack.popular ? { background: "white" } : {}}
                  >
                    {pack.badge && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-rc-red text-white font-mono text-[9px] tracking-[0.1em] px-2 py-0.5 rounded">
                        {pack.badge}
                      </span>
                    )}
                    <div>
                      <p className="font-mono text-[9px] tracking-[0.15em] uppercase text-rc-hint mb-1">Pack</p>
                      <div className="flex items-baseline gap-1">
                        <span className="font-serif text-[36px] font-medium leading-none text-rc-text">{pack.quantity}</span>
                        <span className="font-mono text-[12px] text-rc-hint ml-1">crédit{pack.quantity > 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[20px] font-bold text-rc-text">{pack.price}</p>
                      <p className="font-mono text-[11px] text-rc-hint">{pack.sub}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleBuy(pack.quantity)}
                      disabled={loadingQty !== null}
                      className={`w-full py-2.5 rounded-lg font-mono text-[10px] tracking-[0.14em] uppercase font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        pack.popular
                          ? "bg-rc-red text-white hover:opacity-80"
                          : "bg-rc-bg border border-rc-border text-rc-text hover:border-rc-red/40"
                      }`}
                    >
                      {loadingQty === pack.quantity ? "…" : "Acheter →"}
                    </button>
                  </div>
                ))}
              </div>
              <p className="mt-3 font-mono text-[10px] text-rc-hint text-center">Paiement unique · Stripe · pas d'abonnement</p>
            </div>

            {/* Pro plan */}
            {!isHired && (
              <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl p-6 flex items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-serif text-[22px] font-normal text-rc-text">Plan Pro · illimité</span>
                    <span className="font-mono text-[9px] tracking-[0.1em] uppercase border border-rc-green/40 text-rc-green px-2 py-0.5 rounded">
                      Sans limite
                    </span>
                  </div>
                  <p className="text-[13px] text-rc-hint leading-relaxed">
                    Analyses illimitées, dashboard pro, partage avancé. Annulation à tout moment.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-3 flex-shrink-0">
                  <div className="text-right">
                    <span className="font-serif text-[36px] font-medium leading-none text-rc-text">12,99 €</span>
                    <p className="font-mono text-[11px] text-rc-hint mt-0.5">/ mois</p>
                  </div>
                  <Link
                    href={localePath("/pricing")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-rc-red text-white font-mono text-[10px] tracking-[0.14em] uppercase font-bold rounded-lg no-underline hover:opacity-80 transition-opacity"
                  >
                    Passer Pro →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN: HISTORY ── */}
          <div>
            <div className="flex items-baseline justify-between mb-5">
              <h2 className="font-serif text-[32px] font-normal leading-none" style={{ letterSpacing: -0.5 }}>
                Historique
              </h2>
              <button className="font-mono text-[10px] tracking-[0.15em] uppercase text-rc-hint hover:text-rc-text transition-colors">
                Tout exporter →
              </button>
            </div>

            <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-2xl overflow-hidden">
              {/* Table header */}
              <div className="grid px-4 py-3 border-b border-rc-border/60" style={{ gridTemplateColumns: "1fr auto auto" }}>
                <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-rc-hint">Évènement</span>
                <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-rc-hint pr-4">Date</span>
                <span className="font-mono text-[9px] tracking-[0.18em] uppercase text-rc-hint w-8 text-right">Δ</span>
              </div>

              {/* Rows */}
              {MOCK_HISTORY.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="font-mono text-[11px] text-rc-hint">Aucun évènement pour l'instant.</p>
                </div>
              ) : MOCK_HISTORY.map((row, i) => (
                <div
                  key={row.id}
                  className={`flex items-center gap-3 px-4 py-4 ${i < MOCK_HISTORY.length - 1 ? "border-b border-rc-border/40" : ""}`}
                >
                  <HistoryIcon type={row.type} />
                  <span className="flex-1 text-[13px] font-semibold text-rc-text min-w-0 truncate">{row.event}</span>
                  <span className="font-mono text-[11px] text-rc-hint whitespace-nowrap px-3">{row.date}</span>
                  <span className={`font-mono text-[13px] font-bold w-8 text-right tabular-nums ${row.delta > 0 ? "text-rc-green" : "text-rc-red"}`}>
                    {row.delta > 0 ? `+${row.delta}` : row.delta}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function CreditsPage() {
  return (
    <Suspense>
      <CreditsContent />
    </Suspense>
  );
}
