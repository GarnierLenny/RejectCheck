import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Navbar } from '../../components/Navbar'
import {
  JsonLd,
  SITE_URL,
  articleSchema,
  breadcrumbSchema,
  faqPageSchema,
  softwareApplicationSchema,
} from '../../components/JsonLd'
import { hasLocale } from '../dictionaries'

const PAGE_PATH = '/resume-checker'
const PUBLISHED_ISO = '2026-04-29'
const LAST_UPDATED_ISO = '2026-04-29'
const CANONICAL = `${SITE_URL}/en${PAGE_PATH}`

const TITLE = 'AI Resume Checker for Developers'
const DESCRIPTION =
  'Resume checker built for developers. Audits seniority signals, GitHub activity, LinkedIn consistency, and the red flags rejected in 6 seconds. Free.'

type LangParams = { lang: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<LangParams>
}): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang) || lang !== 'en') return {}

  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: {
      canonical: CANONICAL,
      languages: {
        en: CANONICAL,
        'x-default': CANONICAL,
      },
    },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: CANONICAL,
      locale: 'en_US',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: TITLE,
      description: DESCRIPTION,
    },
  }
}

const FAQ_ITEMS = [
  {
    question: 'What does the resume checker actually check?',
    answer:
      'Three layers: the ATS layer (keyword match against the job description), the HR layer (red flags a recruiter spots in a 6-second scan), and the hiring manager layer (seniority signals, GitHub activity, LinkedIn consistency, project relevance). One pass, three perspectives.',
  },
  {
    question: 'Is this an ATS resume checker or something more?',
    answer:
      'It includes a full ATS resume checker (keyword scoring, parsing flags, missing skills with point values) — but it does not stop there. Most rejections happen after the ATS, at the HR scan or the hiring manager review. Resume checkers that only score ATS miss 70% of why developers get rejected.',
  },
  {
    question: 'How is this different from generic resume checkers?',
    answer:
      'Generic resume checkers grade tone and grammar against template rules. RejectCheck audits developer-specific signals: GitHub commit patterns, repo quality, README presence, LinkedIn-CV consistency, "I worked on" vs "I owned and shipped" tone. It is calibrated for engineering hires.',
  },
  {
    question: 'Will the resume checker rewrite my CV?',
    answer:
      'The free scan returns the diagnosis: missing keywords, format flags, red flags, seniority assessment, and prioritized fixes. CV rewrite (with the fixes applied surgically and PDF export) is a premium feature.',
  },
  {
    question: 'How long does the resume check take?',
    answer:
      'Under 60 seconds. Upload a CV PDF, paste the target job description, optionally add GitHub username and a LinkedIn PDF export. The dual-AI pipeline (GPT-4o + Claude) runs all audits in parallel.',
  },
  {
    question: 'What does a good resume look like for the hiring manager layer?',
    answer:
      'Active voice over passive ("I owned and shipped" vs "I helped build"), measurable impact ("used by 10k users", "reduced p95 latency by 40%") over task lists, GitHub activity that backs the CV claims, and seniority signals (ownership, leadership, production systems) that match the role level.',
  },
]

export default async function ResumeCheckerPage({
  params,
}: {
  params: Promise<LangParams>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  if (lang !== 'en') notFound()

  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: `${SITE_URL}/en` },
    { name: 'Resume Checker', url: CANONICAL },
  ])

  const article = articleSchema({
    headline: TITLE,
    description: DESCRIPTION,
    url: CANONICAL,
    datePublished: PUBLISHED_ISO,
    dateModified: LAST_UPDATED_ISO,
    locale: 'en',
  })

  return (
    <>
      <JsonLd id="ld-breadcrumb-resume-checker" data={breadcrumbs} />
      <JsonLd id="ld-faq-resume-checker" data={faqPageSchema(FAQ_ITEMS)} />
      <JsonLd id="ld-article-resume-checker" data={article} />
      <JsonLd id="ld-app-resume-checker" data={softwareApplicationSchema('en')} />

      <div className="bg-rc-bg text-rc-text font-sans min-h-screen">
        <Navbar />

        {/* Hero */}
        <section className="max-w-[1100px] mx-auto px-5 md:px-[40px] pt-20 pb-16 md:pt-28 md:pb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px w-6 bg-rc-red" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-red">
              Resume Checker · For developers
            </span>
          </div>
          <h1 className="text-[40px] md:text-[58px] font-semibold leading-[1.08] tracking-[-0.025em] text-rc-text max-w-[820px] mb-6">
            An AI resume checker that goes{' '}
            <span
              className="text-rc-red italic"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              past the ATS
            </span>
            .
          </h1>
          <p className="text-rc-muted text-[16px] md:text-[17px] leading-[1.7] max-w-[640px] mb-10">
            Most resume checkers stop at keyword matching. RejectCheck audits the three layers
            that actually filter your application: ATS, HR scan, and hiring manager review.
            Tailored to one specific job. Free first scan.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link
              href="/en/analyze"
              className="inline-flex items-center gap-2.5 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-7 py-3.5 rounded-xl hover:bg-[#b83332] transition-all duration-200 no-underline"
            >
              Check my resume free
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
            <span className="font-mono text-[11px] text-rc-hint tracking-wide">
              60 seconds · No CV stored · Tailored to one job
            </span>
          </div>
        </section>

        {/* The 3 layers */}
        <section className="border-t-[0.5px] border-rc-border bg-rc-surface-hero">
          <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-20 md:py-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-rc-border" />
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
                Why rejection feels like a black box
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-6 max-w-[700px]">
              Three filters stand between &ldquo;Submit application&rdquo; and the interview.
              You could be failing at any of them and never know.
            </h2>
            <p className="text-rc-muted text-[15px] md:text-[16px] leading-[1.7] max-w-[700px] mb-12">
              A standard resume checker scores you on layer one. RejectCheck audits all three.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  step: '01',
                  title: 'ATS — the automated filter',
                  body:
                    'Parses your CV to plain text, scores keyword overlap with the JD. Drops anything below the match threshold. Format breaks parsing more than candidates realize.',
                },
                {
                  step: '02',
                  title: 'HR recruiter — the 6-second scan',
                  body:
                    'A non-technical recruiter scans for red flags: short tenures, time gaps, 2+ pages with under 10 years of experience, fancy graphics, typos, inconsistencies CV ↔ LinkedIn.',
                },
                {
                  step: '03',
                  title: 'Hiring manager — the signal review',
                  body:
                    'A technical lead opens your GitHub. Are projects real or tutorial clones? Does your tone read junior or senior? Does your CV match the seniority the role requires?',
                },
              ].map((c) => (
                <div
                  key={c.step}
                  className="rounded-2xl border border-rc-border bg-rc-surface p-6"
                >
                  <span className="font-mono text-[11px] text-rc-red tracking-[0.16em]">
                    {c.step}
                  </span>
                  <h3 className="text-[18px] font-semibold text-rc-text mt-3 mb-2 leading-tight">
                    {c.title}
                  </h3>
                  <p className="text-[14px] text-rc-muted leading-[1.65]">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What you get */}
        <section className="border-t-[0.5px] border-rc-border">
          <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-20 md:py-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-rc-border" />
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
                What the resume checker returns
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-12 max-w-[680px]">
              A full diagnosis. Not a generic score.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                {
                  label: 'ATS resume checker output',
                  body:
                    'Match score, missing keywords with point values, format/parsing flags. The same as a standard ATS checker — but it is just step one.',
                },
                {
                  label: 'Skill gap radar',
                  body:
                    'Visual map of your technical stack vs the JD requirements: where you over-index, where you are short, by how much.',
                },
                {
                  label: 'GitHub & LinkedIn signal audit',
                  body:
                    'Commit history quality, repo READMEs, project relevance, LinkedIn-CV consistency, recommendations. The signals a hiring manager actually checks.',
                },
                {
                  label: 'Seniority audit',
                  body:
                    '"I worked on" vs "I owned and shipped". "I used React" vs "I architected the frontend". Detects when your tone reads a level below what the role requires.',
                },
                {
                  label: 'Red-flag detection',
                  body:
                    'Employment gaps, vague titles, passive voice, overlapping dates, inflated skill lists, "Familiar with..." sections — the patterns that trigger auto-rejection.',
                },
                {
                  label: 'Prioritized fix list',
                  body:
                    'Every finding ranked by impact on the specific job. Apply the top 3 fixes first. Optional one-click CV rewrite (premium) applies them surgically.',
                },
              ].map((f) => (
                <div
                  key={f.label}
                  className="rounded-2xl border border-rc-border bg-rc-surface p-6"
                >
                  <h3 className="text-[16px] font-semibold text-rc-text mb-2">{f.label}</h3>
                  <p className="text-[14px] text-rc-muted leading-[1.65]">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cross-links */}
        <section className="border-t-[0.5px] border-rc-border bg-rc-surface-hero">
          <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-16 md:py-20">
            <h2 className="text-[22px] md:text-[28px] font-semibold leading-[1.2] tracking-[-0.02em] text-rc-text mb-6 max-w-[640px]">
              Go deeper
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/en/cv-review"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rc-red/30 bg-rc-red/5 font-mono text-[11px] tracking-wide text-rc-text hover:border-rc-red transition-colors no-underline"
              >
                Want a deep written review instead? CV Review →
              </Link>
              <Link
                href="/en/software-engineer-cv"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rc-border bg-rc-surface font-mono text-[11px] tracking-wide text-rc-text hover:border-rc-red transition-colors no-underline"
              >
                Software engineer CV guide →
              </Link>
              <Link
                href="/en/ats-checker"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rc-border bg-rc-surface font-mono text-[11px] tracking-wide text-rc-text hover:border-rc-red transition-colors no-underline"
              >
                Free ATS checker →
              </Link>
              <Link
                href="/en/guides/why-developers-get-rejected"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rc-border bg-rc-surface font-mono text-[11px] tracking-wide text-rc-text hover:border-rc-red transition-colors no-underline"
              >
                Guide: Why developers get rejected →
              </Link>
              <Link
                href="/en/guides/how-to-pass-ats"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rc-border bg-rc-surface font-mono text-[11px] tracking-wide text-rc-text hover:border-rc-red transition-colors no-underline"
              >
                Guide: How to pass ATS in 2026 →
              </Link>
              <Link
                href="/en/alternatives"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rc-border bg-rc-surface font-mono text-[11px] tracking-wide text-rc-text hover:border-rc-red transition-colors no-underline"
              >
                vs Jobscan / Rezi / Resume Worded →
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t-[0.5px] border-rc-border bg-rc-bg">
          <div className="max-w-[900px] mx-auto px-5 md:px-[40px] py-20 md:py-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-6 bg-rc-red" />
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-red">
                FAQ
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-10">
              Resume checker — what developers ask
            </h2>
            <div className="space-y-3">
              {FAQ_ITEMS.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-xl border border-rc-border bg-rc-surface"
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
          <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-20 md:py-24 text-center">
            <h2 className="text-[28px] md:text-[40px] font-semibold leading-[1.12] tracking-[-0.025em] text-rc-text mb-6 max-w-[700px] mx-auto">
              Run a full resume check on your CV right now.
            </h2>
            <p className="font-mono text-[12px] md:text-[13px] tracking-[0.06em] text-rc-hint mb-8">
              ATS + HR + hiring manager — one pass, three layers, 60 seconds.
            </p>
            <Link
              href="/en/analyze"
              className="inline-flex items-center gap-2.5 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-8 py-4 rounded-xl hover:bg-[#b83332] transition-all duration-200 no-underline"
            >
              Check my resume free
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
          </div>
        </section>

        <footer className="border-t-[0.5px] border-rc-border py-6 px-5 md:px-[40px] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-mono text-[13px] text-rc-muted">
            © RejectCheck — Built for developers
          </div>
          <div className="flex gap-6 flex-wrap justify-center">
            <Link
              href="/en/pricing"
              className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline hover:text-rc-text"
            >
              Pricing
            </Link>
            <Link
              href="/en/alternatives"
              className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline hover:text-rc-text"
            >
              Alternatives
            </Link>
            <Link
              href="/en/privacy"
              className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline hover:text-rc-text"
            >
              Privacy (GDPR)
            </Link>
          </div>
        </footer>
      </div>
    </>
  )
}
