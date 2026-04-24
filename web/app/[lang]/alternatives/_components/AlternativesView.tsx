import Link from 'next/link'
import { Navbar } from '../../../components/Navbar'
import type { AlternativesContent, Competitor } from '../jobscan/content'
import type { Locale } from '../../dictionaries'

function AtsIcon({
  v,
  labels,
}: {
  v: Competitor['atsCheck']
  labels: AlternativesContent['atsLabels']
}) {
  const label = v === 'yes' ? labels.yes : v === 'premium' ? labels.premium : labels.limited
  const color =
    v === 'yes' ? 'text-green-600' : v === 'premium' ? 'text-amber-600' : 'text-rc-muted'
  return <span className={`font-mono text-[12px] ${color}`}>{label}</span>
}

function BoolCell({
  v,
  labels,
}: {
  v: boolean
  labels: AlternativesContent['boolLabels']
}) {
  return (
    <span className={`font-mono text-[12px] ${v ? 'text-green-600' : 'text-rc-muted'}`}>
      {v ? labels.yes : labels.no}
    </span>
  )
}

export function AlternativesView({
  content: c,
  locale,
}: {
  content: AlternativesContent
  locale: Locale
}) {
  const analyzeHref = `/${locale}/analyze`
  const pricingHref = `/${locale}/pricing`
  const privacyHref = `/${locale}/privacy`

  return (
    <div className="bg-rc-bg text-rc-text font-sans min-h-screen">
      <Navbar />

      {/* HERO */}
      <section className="max-w-[900px] mx-auto px-5 md:px-[40px] pt-16 pb-12 md:pt-24 md:pb-16">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-rc-muted mb-8"
        >
          <Link href={`/${locale}`} className="no-underline hover:text-rc-red">
            {c.breadcrumbHome}
          </Link>
          <span>/</span>
          <span>{c.breadcrumbAlternatives}</span>
          <span>/</span>
          <span className="text-rc-text">{c.breadcrumbCurrent}</span>
        </nav>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-px w-6 bg-rc-red" />
          <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-red">
            {c.badgeLabel}
          </span>
        </div>

        <h1 className="text-[38px] md:text-[54px] font-semibold leading-[1.08] tracking-[-0.025em] text-rc-text mb-6">
          {c.heroTitle}
        </h1>

        <p className="text-rc-muted text-[16px] md:text-[18px] leading-[1.65] max-w-[720px] mb-6">
          {c.heroIntro}
        </p>

        <div className="rounded-2xl border border-rc-border bg-rc-surface p-5 md:p-6 mb-6">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-rc-muted mb-3">
            {c.tldrLabel}
          </div>
          <p className="text-rc-text text-[15px] md:text-[16px] leading-[1.65]">{c.tldr}</p>
        </div>
      </section>

      {/* WHY */}
      <section className="border-t-[0.5px] border-rc-border bg-rc-surface-hero">
        <div className="max-w-[900px] mx-auto px-5 md:px-[40px] py-16 md:py-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-6 bg-rc-border" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
              {c.whyBadge}
            </span>
          </div>
          <h2 className="text-[28px] md:text-[38px] font-semibold tracking-[-0.02em] mb-8">
            {c.whyTitle}
          </h2>

          <ol className="space-y-5">
            {c.whyReasons.map((reason, i) => (
              <li key={i} className="flex gap-5">
                <span className="font-mono text-[22px] text-rc-red font-semibold shrink-0 w-8">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div>
                  <h3 className="text-[17px] md:text-[18px] font-semibold mb-1">
                    {reason.title}
                  </h3>
                  <p className="text-rc-muted text-[15px] leading-[1.6]">{reason.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* COMPARISON TABLE */}
      <section className="border-t-[0.5px] border-rc-border bg-rc-bg">
        <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-16 md:py-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-6 bg-rc-red" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-red">
              {c.comparisonBadge}
            </span>
          </div>
          <h2 className="text-[28px] md:text-[38px] font-semibold tracking-[-0.02em] mb-8">
            {c.comparisonTitle}
          </h2>

          <div className="overflow-x-auto rounded-2xl border border-rc-border bg-rc-surface">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-rc-border bg-rc-surface-hero">
                  {(
                    [
                      c.tableHeaders.tool,
                      c.tableHeaders.freeTier,
                      c.tableHeaders.paidEntry,
                      c.tableHeaders.ats,
                      c.tableHeaders.aiInterview,
                      c.tableHeaders.githubAudit,
                      c.tableHeaders.languages,
                    ] as string[]
                  ).map((h, i) => (
                    <th
                      key={i}
                      className="font-mono text-[10px] tracking-[0.14em] uppercase text-rc-muted px-4 py-3 min-w-[120px]"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {c.competitors.map((comp) => (
                  <tr key={comp.name} className="border-b border-rc-border last:border-b-0">
                    <td className="px-4 py-4 align-top">
                      <div className="font-semibold text-[14px]">{comp.name}</div>
                    </td>
                    <td className="px-4 py-4 align-top text-[13px] text-rc-muted">
                      {comp.freeTier}
                    </td>
                    <td className="px-4 py-4 align-top text-[13px] text-rc-muted">
                      {comp.paidEntry}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <AtsIcon v={comp.atsCheck} labels={c.atsLabels} />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <BoolCell v={comp.aiInterview} labels={c.boolLabels} />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <BoolCell v={comp.githubAudit} labels={c.boolLabels} />
                    </td>
                    <td className="px-4 py-4 align-top text-[13px] text-rc-muted">
                      {comp.languages.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="font-mono text-[11px] text-rc-hint mt-4 tracking-wide">
            {c.comparisonFootnote}
          </p>
        </div>
      </section>

      {/* DETAILED BREAKDOWN */}
      <section className="border-t-[0.5px] border-rc-border bg-rc-surface-hero">
        <div className="max-w-[900px] mx-auto px-5 md:px-[40px] py-16 md:py-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-6 bg-rc-border" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
              {c.breakdownBadge}
            </span>
          </div>
          <h2 className="text-[28px] md:text-[38px] font-semibold tracking-[-0.02em] mb-10">
            {c.breakdownTitle}
          </h2>

          <div className="space-y-12">
            {c.competitors.map((comp, idx) => (
              <article
                key={comp.name}
                id={comp.name.toLowerCase().replace(/\s+/g, '-')}
                className="scroll-mt-24"
              >
                <div className="flex items-start gap-4 mb-5">
                  <span className="font-mono text-[28px] text-rc-red font-semibold leading-none shrink-0 w-12">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-[24px] md:text-[28px] font-semibold tracking-[-0.01em] mb-2">
                      {comp.name}
                    </h3>
                    <p className="text-rc-muted text-[15px] md:text-[16px] leading-[1.6] mb-4">
                      {comp.tagline}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-5">
                  <div>
                    <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-rc-muted mb-2">
                      {c.labels.freeTier}
                    </div>
                    <p className="text-[14px] text-rc-text">{comp.freeTier}</p>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-rc-muted mb-2">
                      {c.labels.paidEntry}
                    </div>
                    <p className="text-[14px] text-rc-text">{comp.paidEntry}</p>
                  </div>
                </div>

                <div className="mb-5">
                  <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-rc-muted mb-3">
                    {c.labels.keyFeatures}
                  </div>
                  <ul className="space-y-2">
                    {comp.topFeatures.map((f) => (
                      <li key={f} className="flex gap-3 text-[14px] leading-[1.55]">
                        <span className="text-rc-red shrink-0">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-5">
                  <div className="rounded-xl border border-green-600/20 bg-green-600/5 p-4">
                    <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-green-700 mb-2">
                      {c.labels.bestFor}
                    </div>
                    <p className="text-[14px] leading-[1.55]">{comp.bestFor}</p>
                  </div>
                  <div className="rounded-xl border border-amber-600/20 bg-amber-600/5 p-4">
                    <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-amber-700 mb-2">
                      {c.labels.honestWeakness}
                    </div>
                    <p className="text-[14px] leading-[1.55]">{comp.weakness}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[12px] font-mono text-rc-muted">
                  {comp.userClaim && (
                    <span>
                      {c.labels.usersClaimed}: {comp.userClaim}
                    </span>
                  )}
                  <a
                    href={comp.website}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-rc-red hover:underline"
                  >
                    {comp.website.replace(/^https?:\/\//, '')} →
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* DECISION GUIDE */}
      <section className="border-t-[0.5px] border-rc-border bg-rc-bg">
        <div className="max-w-[900px] mx-auto px-5 md:px-[40px] py-16 md:py-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-6 bg-rc-red" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-red">
              {c.decisionBadge}
            </span>
          </div>
          <h2 className="text-[28px] md:text-[38px] font-semibold tracking-[-0.02em] mb-8">
            {c.decisionTitle}
          </h2>

          <div className="space-y-4">
            {c.decisionRows.map((row, i) => (
              <div
                key={i}
                className="rounded-xl border border-rc-border bg-rc-surface p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-3 md:gap-6"
              >
                <div className="flex-1">
                  <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-rc-muted mb-1">
                    {c.decisionIfLabel}
                  </div>
                  <div className="text-[15px] font-medium">{row.scenario}</div>
                </div>
                <div className="md:w-[260px] shrink-0">
                  <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-rc-red mb-1">
                    → {row.pick}
                  </div>
                  <div className="text-[13px] text-rc-muted leading-[1.5]">{row.why}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t-[0.5px] border-rc-border bg-rc-surface-hero">
        <div className="max-w-[900px] mx-auto px-5 md:px-[40px] py-16 md:py-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-6 bg-rc-border" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
              {c.faqBadge}
            </span>
          </div>
          <h2 className="text-[28px] md:text-[38px] font-semibold tracking-[-0.02em] mb-10">
            {c.faqTitle}
          </h2>

          <div className="space-y-3">
            {c.faqItems.map((item, i) => (
              <details
                key={i}
                className="group rounded-xl border border-rc-border bg-rc-surface open:shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-shadow"
              >
                <summary className="cursor-pointer list-none flex items-start justify-between gap-4 px-5 py-4 md:px-6 md:py-5">
                  <h3 className="text-[16px] md:text-[17px] font-semibold text-rc-text leading-[1.35]">
                    {item.question}
                  </h3>
                  <span
                    aria-hidden="true"
                    className="shrink-0 mt-1 font-mono text-[18px] text-rc-red transition-transform group-open:rotate-45 select-none"
                  >
                    +
                  </span>
                </summary>
                <div className="px-5 pb-5 md:px-6 md:pb-6 -mt-1">
                  <p className="text-rc-muted text-[14px] md:text-[15px] leading-[1.7]">
                    {item.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t-[0.5px] border-rc-border bg-rc-surface">
        <div className="max-w-[900px] mx-auto px-5 md:px-[40px] py-20 md:py-28 text-center">
          <h2 className="text-[28px] md:text-[40px] font-semibold tracking-[-0.02em] mb-5">
            {c.ctaTitle}
          </h2>
          <p className="text-rc-muted text-[15px] md:text-[17px] leading-[1.65] max-w-[580px] mx-auto mb-8">
            {c.ctaSubtitle}
          </p>
          <Link
            href={analyzeHref}
            className="inline-flex items-center gap-2.5 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-8 py-4 rounded-xl hover:bg-[#b83332] hover:shadow-[0_8px_28px_rgba(201,58,57,0.28)] active:scale-[0.98] transition-all duration-200 no-underline"
          >
            {c.ctaButton}
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path
                d="M2 7h10M7.5 3l4 4-4 4"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <p className="font-mono text-[11px] text-rc-hint mt-6 tracking-wide">
            {c.ctaPricingLink}{' '}
            <Link href={pricingHref} className="text-rc-red hover:underline">
              {pricingHref}
            </Link>
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t-[0.5px] border-rc-border py-6 px-5 md:px-[40px] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="font-mono text-[13px] text-rc-muted">{c.footerCopyright}</div>
        <div className="flex gap-6">
          <Link
            href={privacyHref}
            className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline hover:text-rc-text"
          >
            {c.footerPrivacy}
          </Link>
          <Link
            href={pricingHref}
            className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline hover:text-rc-text"
          >
            {c.footerPricing}
          </Link>
        </div>
      </footer>
    </div>
  )
}
