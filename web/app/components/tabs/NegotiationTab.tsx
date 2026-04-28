"use client";

import { useState } from "react";
import { Loader2, Copy, Check, Sparkles, AlertTriangle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { AnalysisResult, NegotiationAnalysis, LeveragePoint } from "../types";
import { SectionHeader } from "../SectionHeader";
import { PremiumPaywall } from "../PremiumFeature";
import { SalaryRangeChart } from "../SalaryRangeChart";
import { useLanguage } from "../../../context/language";
import { useGenerateNegotiation } from "../../../lib/mutations";

type Props = {
  result: AnalysisResult;
  analysisId: number | null;
  isPremium: boolean;
};

function fmtCurrency(n: number, glyph: string): string {
  return `${glyph}${Math.round(n).toLocaleString("en-US")}`;
}

function currencyGlyph(c: string): string {
  return c === "USD" ? "$" : c === "GBP" ? "£" : "€";
}

function fmtAmountWithPeriod(
  n: number,
  glyph: string,
  periodLabel: string,
): string {
  return `${fmtCurrency(n, glyph)}${periodLabel}`;
}

export function NegotiationTab({ result, analysisId, isPremium }: Props) {
  const { t, locale } = useLanguage();
  // Treat pre-period entries (generated before period-awareness) as missing,
  // so the user is offered a "Generate playbook" button that triggers the
  // backend's regeneration path (which bypasses stale cache).
  const initialNegotiation =
    result.negotiation_analysis && result.negotiation_analysis.period
      ? result.negotiation_analysis
      : null;
  const [negotiation, setNegotiation] = useState<NegotiationAnalysis | null>(
    initialNegotiation,
  );
  const [copiedEmail, setCopiedEmail] = useState(false);
  const { mutate, isPending, isError } = useGenerateNegotiation();

  if (!isPremium) {
    return (
      <PremiumPaywall
        badge={t.negotiationTab.premiumBadge}
        title={t.negotiationTab.premiumTitle}
        description={t.negotiationTab.premiumDesc}
        ctaLabel={t.negotiationTab.unlockButton}
      />
    );
  }

  function handleGenerate() {
    if (!analysisId) return;
    mutate(
      { analysisId, locale },
      {
        onSuccess: (data) => setNegotiation(data.negotiation),
      },
    );
  }

  async function handleCopyEmail() {
    if (!negotiation) return;
    const subject = `Subject: ${negotiation.counter_offer_email.subject}`;
    const text = `${subject}\n\n${negotiation.counter_offer_email.body}`;
    await navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  }

  if (!negotiation) {
    return (
      <div className="space-y-6">
        <SectionHeader
          label={t.negotiationTab.premiumBadge}
          labelColor="text-rc-red"
          title={t.negotiationTab.title}
          subtitle={t.negotiationTab.subtitle}
        />
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <button
            onClick={handleGenerate}
            disabled={isPending || !analysisId}
            className="flex items-center gap-2 px-8 py-4 bg-rc-red text-white font-mono text-[11px] tracking-widest uppercase rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-rc-red/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t.negotiationTab.estimating}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {t.negotiationTab.estimateButton}
              </>
            )}
          </button>
          {isError && (
            <p className="mt-4 text-[13px] text-rc-red text-center">
              {t.negotiationTab.errorRetry}
            </p>
          )}
        </div>
      </div>
    );
  }

  const glyph = currencyGlyph(negotiation.market_range.currency);
  const period = negotiation.period ?? 'annual';
  const periodLabel = period === 'daily' ? t.negotiationTab.perDay : t.negotiationTab.perYear;
  const gap = negotiation.gap_vs_market;
  const gapAbs = Math.abs(gap);
  // Threshold for "at market" zone scales with period (smaller for daily rates)
  const atMarketThreshold = period === 'daily' ? 25 : 500;
  const gapLabel =
    gap < -atMarketThreshold
      ? t.negotiationTab.gapBelow
      : gap > atMarketThreshold
        ? t.negotiationTab.gapAbove
        : t.negotiationTab.gapAtMarket;
  const jdTitle = result.job_details?.title || "—";
  const jdLocation = result.job_details?.office_location || "—";

  return (
    <div className="space-y-12">
      <SectionHeader
        label={t.negotiationTab.premiumBadge}
        labelColor="text-rc-red"
        title={t.negotiationTab.title}
        subtitle={t.negotiationTab.subtitle}
      />

      {/* SECTION 1 — Market positioning */}
      <section className="space-y-5">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.15em] text-rc-hint font-bold">
          {t.negotiationTab.marketSection}
        </h3>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-rc-surface border border-rc-border rounded-lg p-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-rc-hint mb-1">
              {t.negotiationTab.marketRange}
            </p>
            <p className="text-[14px] text-rc-muted mb-2">
              {jdTitle} · {jdLocation}
            </p>
            <p className="text-[22px] font-bold text-rc-text">
              {fmtCurrency(negotiation.market_range.min, glyph)} —{" "}
              {fmtCurrency(negotiation.market_range.max, glyph)}{" "}
              <span className="text-[13px] font-normal text-rc-hint">
                {periodLabel}
              </span>
            </p>
            <p className="text-[11px] text-rc-hint mt-2">
              {t.negotiationTab.marketDisclaimer}
            </p>
          </div>

          <div className="bg-rc-surface border border-rc-border rounded-lg p-5">
            <p className="font-mono text-[10px] uppercase tracking-wider text-rc-hint mb-1">
              {t.negotiationTab.yourRange}
            </p>
            <p className="text-[14px] text-rc-muted mb-2">
              {result.seniority_analysis?.detected || "—"}
            </p>
            <p className="text-[22px] font-bold text-rc-text">
              {fmtCurrency(negotiation.candidate_range.min, glyph)} —{" "}
              {fmtCurrency(negotiation.candidate_range.max, glyph)}{" "}
              <span className="text-[13px] font-normal text-rc-hint">
                {periodLabel}
              </span>
            </p>
            <p
              className={`text-[12px] mt-2 font-mono ${
                gap < 0 ? "text-rc-red" : gap > 0 ? "text-rc-green" : "text-rc-amber"
              }`}
            >
              {gap < 0 ? "↓ " : gap > 0 ? "↑ " : ""}
              {fmtAmountWithPeriod(gapAbs, glyph, periodLabel)} {gapLabel}
            </p>
          </div>
        </div>

        {/* JD disclosed conditional block */}
        {negotiation.jd_disclosed_salary ? (
          <div className="border border-rc-text/15 rounded-lg p-5 bg-rc-surface-raised">
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-rc-text/70 mb-1">
                  {t.negotiationTab.jdDisclosedTitle}
                </p>
                <p className="text-[20px] font-bold text-rc-text">
                  {fmtCurrency(negotiation.jd_disclosed_salary.min, glyph)} —{" "}
                  {fmtCurrency(negotiation.jd_disclosed_salary.max, glyph)}{" "}
                  <span className="text-[13px] font-normal text-rc-hint">
                    {t.negotiationTab.perYear}
                  </span>
                </p>
              </div>
              <p className="text-[11px] text-rc-hint max-w-[280px]">
                {t.negotiationTab.jdDisclosedNote}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-[12px] text-rc-hint italic">
            {t.negotiationTab.jdNotDisclosed}
          </p>
        )}

        {/* Chart */}
        <div className="bg-rc-surface border border-rc-border rounded-lg p-5">
          <SalaryRangeChart
            period={period}
            marketRange={negotiation.market_range}
            candidateRange={negotiation.candidate_range}
            jdDisclosed={negotiation.jd_disclosed_salary}
            perDayLabel={t.negotiationTab.perDay}
            perYearLabel={t.negotiationTab.perYear}
          />
        </div>

        {/* Why / how to close */}
        {(negotiation.gap_reason || negotiation.how_to_close) && (
          <div className="space-y-3 mt-2">
            {negotiation.gap_reason && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-rc-hint mb-1">
                  {t.negotiationTab.why}
                </p>
                <p className="text-[14px] text-rc-text leading-relaxed">
                  {negotiation.gap_reason}
                </p>
              </div>
            )}
            {negotiation.how_to_close && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-rc-hint mb-1">
                  {t.negotiationTab.howToClose}
                </p>
                <p className="text-[14px] text-rc-text leading-relaxed">
                  {negotiation.how_to_close}
                </p>
              </div>
            )}
          </div>
        )}
      </section>

      {/* SECTION 2 — Leverage points */}
      <section className="space-y-3">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.15em] text-rc-hint font-bold">
          {t.negotiationTab.leverageSection}
        </h3>
        <div className="space-y-2">
          {negotiation.leverage_points.map((p, i) => (
            <LeverageCard
              key={i}
              point={p}
              period={period}
              periodLabel={periodLabel}
              labels={{
                high: t.negotiationTab.leverageHigh,
                medium: t.negotiationTab.leverageMedium,
                watch: t.negotiationTab.leverageWatch,
              }}
            />
          ))}
        </div>
      </section>

      {/* SECTION 3 — Counter-offer email */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.15em] text-rc-hint font-bold">
            {t.negotiationTab.counterOfferSection}
          </h3>
          <button
            onClick={handleCopyEmail}
            className="flex items-center gap-2 px-3 py-1.5 border border-rc-border rounded-lg text-[12px] font-mono text-rc-muted hover:text-rc-text hover:border-rc-text/20 transition-all"
          >
            {copiedEmail ? (
              <>
                <Check className="w-3.5 h-3.5 text-rc-green" />
                {t.negotiationTab.copied}
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                {t.negotiationTab.copyEmail}
              </>
            )}
          </button>
        </div>
        <div className="bg-white border border-[rgba(0,0,0,0.08)] rounded-[12px] p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-rc-border/50">
            <p className="text-[14px] text-rc-text">
              <span className="font-mono text-[10px] uppercase text-rc-hint mr-2">
                Subject
              </span>
              <span className="font-semibold">
                {negotiation.counter_offer_email.subject}
              </span>
            </p>
            <p className="text-[11px] font-mono text-rc-amber whitespace-nowrap">
              {t.negotiationTab.counterOfferAnchor}:{" "}
              {fmtAmountWithPeriod(
                negotiation.counter_offer_email.anchor_amount,
                glyph,
                periodLabel,
              )}
            </p>
          </div>
          <div className="font-sans">
            <ReactMarkdown
              components={{
                p: ({ children }) => (
                  <p className="text-[14px] text-rc-text leading-[1.8] mb-4 last:mb-0">
                    {children}
                  </p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-rc-text">{children}</strong>
                ),
                em: ({ children }) => <em className="italic">{children}</em>,
                ul: ({ children }) => (
                  <ul className="list-disc pl-5 mb-4 space-y-1">{children}</ul>
                ),
                li: ({ children }) => (
                  <li className="text-[14px] text-rc-text leading-[1.8]">{children}</li>
                ),
              }}
            >
              {negotiation.counter_offer_email.body}
            </ReactMarkdown>
          </div>
        </div>
      </section>

      {/* SECTION 4 — Anchoring strategy */}
      <section className="space-y-3">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.15em] text-rc-hint font-bold">
          {t.negotiationTab.anchorSection}
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <AnchorCard
            label={t.negotiationTab.whenToAnchor}
            value={negotiation.anchoring_strategy.when_to_anchor}
          />
          <AnchorCard
            label={t.negotiationTab.anchorAt}
            value={fmtAmountWithPeriod(
              negotiation.anchoring_strategy.anchor_amount,
              glyph,
              periodLabel,
            )}
            highlight
          />
          <AnchorCard
            label={t.negotiationTab.ifPushback}
            value={negotiation.anchoring_strategy.fallback}
          />
        </div>
      </section>

      {/* SECTION 5 — Talking points */}
      <section className="space-y-3">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.15em] text-rc-hint font-bold">
          {t.negotiationTab.talkingPointsSection}
        </h3>
        <div className="space-y-3">
          {negotiation.talking_points.map((p, i) => (
            <div key={i} className="bg-rc-surface border border-rc-border rounded-lg p-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-rc-hint mb-2">
                {p.scenario}
              </p>
              <p className="text-[14px] text-rc-text leading-[1.7] italic">
                &ldquo;{p.phrase}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer + sources */}
      <div className="border-t border-rc-border pt-4 space-y-2">
        <div className="flex items-start gap-2 text-[12px] text-rc-hint">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <p>{negotiation.disclaimer}</p>
        </div>
        {negotiation.sources?.length > 0 && (
          <p className="text-[11px] font-mono text-rc-hint">
            {t.negotiationTab.sourcesLabel}: {negotiation.sources.join(", ")}
          </p>
        )}
        <p className="text-[11px] font-mono text-rc-hint">
          {t.negotiationTab.confidence}:{" "}
          <span className="uppercase">{negotiation.confidence}</span>
        </p>
      </div>
    </div>
  );
}

function formatImpact(amount: number, period: 'annual' | 'daily', periodLabel: string): string {
  if (period === 'daily') {
    return `≈ €${Math.round(amount).toLocaleString('en-US')}${periodLabel}`;
  }
  // Annual: render as €Xk
  if (Math.abs(amount) >= 1000) {
    const k = amount / 1000;
    const rounded = Math.round(k * 10) / 10;
    return `≈ €${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}k${periodLabel}`;
  }
  return `≈ €${Math.round(amount)}${periodLabel}`;
}

function LeverageCard({
  point,
  period,
  periodLabel,
  labels,
}: {
  point: LeveragePoint;
  period: 'annual' | 'daily';
  periodLabel: string;
  labels: { high: string; medium: string; watch: string };
}) {
  const colors = {
    high: { dot: "bg-rc-green", label: labels.high, text: "text-rc-green" },
    medium: { dot: "bg-rc-amber", label: labels.medium, text: "text-rc-amber" },
    watch: { dot: "bg-rc-red", label: labels.watch, text: "text-rc-red" },
  } as const;
  const c = colors[point.level];

  return (
    <div className="flex items-start gap-3 bg-rc-surface border border-rc-border rounded-lg px-4 py-3">
      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span
            className={`font-mono text-[10px] uppercase tracking-wider font-bold ${c.text}`}
          >
            {c.label}
          </span>
          {point.impact_eur != null && (
            <span
              className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${
                point.impact_eur >= 0
                  ? 'text-rc-green bg-rc-green-bg'
                  : 'text-rc-red bg-rc-red-bg'
              }`}
            >
              {point.impact_eur >= 0 ? '+' : '−'}
              {formatImpact(Math.abs(point.impact_eur), period, periodLabel).replace('≈ ', '')}
            </span>
          )}
        </div>
        <p className="text-[14px] text-rc-text font-medium leading-[1.5] mb-1">
          {point.label}
        </p>
        <p className="text-[12px] text-rc-muted leading-[1.5] italic">
          {point.evidence}
        </p>
      </div>
    </div>
  );
}

function AnchorCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-4 border ${
        highlight
          ? "bg-rc-amber/10 border-rc-amber/30"
          : "bg-rc-surface border-rc-border"
      }`}
    >
      <p className="font-mono text-[10px] uppercase tracking-wider text-rc-hint mb-1.5">
        {label}
      </p>
      <p
        className={`text-[14px] leading-[1.5] ${
          highlight ? "font-bold text-rc-amber text-[18px]" : "text-rc-text"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
