import Link from "next/link";
import Image from "next/image";
import { AuthNavLink } from "./components/AuthNavLink";

const steps = [
  {
    number: "01",
    title: "Upload your CV",
    description:
      "Drop your PDF resume. Optionally add the job description, your GitHub handle, or your LinkedIn export — each one sharpens the diagnosis.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "AI runs a full diagnosis",
    description:
      "We simulate ATS filters, check seniority alignment, audit tone, scan your GitHub activity, and surface every hidden red flag — in under a minute.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="11" y1="8" x2="11" y2="14" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Fix before you send",
    description:
      "You get a scored breakdown with exact fixes — missing keywords, tone mismatches, experience gaps — so every application lands with intent.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
];

const signals = [
  "ATS simulation",
  "Seniority gap",
  "Tone audit",
  "GitHub analysis",
  "LinkedIn PDF",
  "Actionable fixes",
];

export default function Home() {
  return (
    <div className="bg-rc-bg text-rc-text font-sans min-h-screen overflow-x-hidden">
      {/* ─── Nav ─────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-5 py-4 md:px-[40px] border-b-[0.5px] border-rc-border">
        <div className="flex items-center gap-2.5">
          <Image
            src="/RejectCheck_500_bg_less.png"
            alt="RejectCheck Logo"
            width={40}
            height={40}
          />
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/pricing"
            className="font-mono text-[11px] tracking-[0.14em] uppercase text-rc-text/50 hover:text-rc-text px-4 py-2 transition-all duration-200 no-underline"
          >
            Pricing
          </Link>
          <AuthNavLink />
          <Link
            href="/analyze"
            className="font-mono text-[11px] tracking-[0.14em] uppercase text-rc-red border border-rc-red/30 hover:border-rc-red/60 hover:bg-rc-red/5 px-4 py-2 rounded-lg transition-all duration-200 no-underline"
          >
            Try free →
          </Link>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────── */}
      <section className="max-w-[1100px] mx-auto px-5 md:px-[40px] pt-20 pb-24 md:pt-28 md:pb-32">
        {/* eyebrow */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px w-6 bg-rc-red" />
          <span
            className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-red"
          >
            For developers
          </span>
        </div>

        {/* headline */}
        <h1 className="text-[42px] md:text-[62px] lg:text-[72px] font-semibold leading-[1.08] tracking-[-0.025em] text-rc-text max-w-[800px] mb-3">
          Find out why your job
          <br />
          application got rejected
        </h1>
        <p
          className="text-[42px] md:text-[62px] lg:text-[72px] font-semibold leading-[1.08] tracking-[-0.025em] text-rc-red italic mb-8"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          before it does.
        </p>

        {/* subline */}
        <p className="text-rc-muted text-[16px] md:text-[17px] leading-[1.7] max-w-[520px] mb-10">
          Deep-dive diagnosis across{" "}
          <strong className="text-rc-text font-semibold">ATS filters</strong>, seniority
          gaps, tone analysis — and exactly what to fix before you hit send.
        </p>

        {/* signal pills */}
        <div className="flex flex-wrap gap-2 mb-12">
          {signals.map((s) => (
            <span
              key={s}
              className="font-mono text-[11px] tracking-[0.04em] text-rc-muted border border-rc-border bg-rc-surface rounded-full px-3.5 py-1.5"
            >
              {s}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Link
            href="/analyze"
            id="hero-cta"
            className="inline-flex items-center gap-2.5 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-7 py-3.5 rounded-xl hover:bg-[#b83332] hover:shadow-[0_8px_28px_rgba(201,58,57,0.28)] active:scale-[0.98] transition-all duration-200 no-underline"
          >
            Analyze my CV
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M7.5 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <span className="font-mono text-[11px] text-rc-hint tracking-wide flex items-center gap-1.5">
            <span className="opacity-60">🔒</span> No account required · No data stored
          </span>
        </div>
      </section>

      {/* ─── How it works ────────────────────────────────────────── */}
      <section
        id="how-it-works"
        className="border-t-[0.5px] border-rc-border bg-rc-surface"
      >
        <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-20 md:py-28">
          {/* section header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-6 bg-rc-border" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
              How it works
            </span>
          </div>
          <h2 className="text-[28px] md:text-[36px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-16 max-w-[500px]">
            Three steps. One brutally honest report.
          </h2>

          {/* steps grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-rc-border">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className="bg-rc-surface p-8 md:p-10 flex flex-col gap-6 relative"
              >
                {/* connector line between cards on desktop */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute right-0 top-10 w-px h-8 bg-rc-border" />
                )}

                {/* icon + number */}
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl bg-rc-red/8 border border-rc-red/15 flex items-center justify-center text-rc-red">
                    {step.icon}
                  </div>
                  <span className="font-mono text-[13px] text-rc-border tracking-[0.08em]">
                    {step.number}
                  </span>
                </div>

                {/* text */}
                <div>
                  <h3 className="text-[17px] font-semibold text-rc-text mb-2.5 tracking-[-0.01em]">
                    {step.title}
                  </h3>
                  <p className="text-[14px] text-rc-hint leading-[1.7]">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Quote / CTA ─────────────────────────────────────────── */}
      <section className="border-t-[0.5px] border-rc-border">
        <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-24 md:py-32 text-center">
          {/* quote */}
          <blockquote className="mb-10">
            <p className="text-[32px] md:text-[48px] lg:text-[58px] font-semibold leading-[1.1] tracking-[-0.025em] text-rc-text">
              Apply like a{" "}
              <span className="text-rc-red italic" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>sniper</span>,
              <br />
              not a spammer.
            </p>
          </blockquote>

          {/* sub-message */}
          <p className="font-mono text-[13px] md:text-[14px] tracking-[0.06em] text-rc-hint mb-10">
            Free to try · No account required
          </p>

          {/* CTA */}
          <Link
            href="/analyze"
            id="quote-cta"
            className="inline-flex items-center gap-2.5 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-8 py-4 rounded-xl hover:bg-[#b83332] hover:shadow-[0_8px_28px_rgba(201,58,57,0.28)] active:scale-[0.98] transition-all duration-200 no-underline"
          >
            Analyze my CV — it&apos;s free
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M7.5 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t-[0.5px] border-rc-border py-6 px-5 md:px-[40px] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="font-mono text-[13px] text-rc-muted">RejectCheck © 2026</div>
        <div className="flex gap-6">
          <a href="#" className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline cursor-pointer transition-colors hover:text-rc-text">
            Privacy
          </a>
          <a href="#" className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline cursor-pointer transition-colors hover:text-rc-text">
            Terms
          </a>
        </div>
      </footer>
    </div>
  );
}
