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

const PAGE_PATH = '/ats-checker'
const PUBLISHED_ISO = '2026-04-29'
const LAST_UPDATED_ISO = '2026-04-29'
const CANONICAL = `${SITE_URL}/en${PAGE_PATH}`

const TITLE = 'Free ATS Checker for Developers — Test Your Resume Against ATS Filters'
const DESCRIPTION =
  'Free ATS resume checker for developers. Simulates the Applicant Tracking System layer that rejects 70% of CVs before a human ever reads them. Find missing keywords, format flags, and exact fixes — tailored to a specific job description.'

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
    question: 'What is an ATS checker?',
    answer:
      'An ATS checker simulates the Applicant Tracking System that recruiters use to filter resumes before a human review. It scores your CV against a job description, surfaces missing keywords, and flags formatting issues that break automated parsing.',
  },
  {
    question: 'Is this ATS checker free?',
    answer:
      'Yes. The first analysis on RejectCheck is free, no signup required. You upload your CV and paste the target job description — you get an ATS score with the exact missing keywords and their point values.',
  },
  {
    question: 'How is RejectCheck different from Jobscan or Resume Worded?',
    answer:
      'Most ATS checkers stop at keyword matching. RejectCheck adds a developer-specific layer: GitHub signal audit, technical skill gap radar, seniority audit, and red-flag detection (vague titles, passive voice, employment gaps). It is built for engineers, not generic candidates.',
  },
  {
    question: 'Why do ATS systems reject so many resumes?',
    answer:
      'ATS parsers extract plain text from your CV and look for keyword overlap with the job description. Multi-column layouts, text boxes, images, and creative section headings break parsing. Even strong candidates get filtered out by formatting alone before a recruiter sees them.',
  },
  {
    question: 'What is the difference between an ATS checker and a resume checker?',
    answer:
      'An ATS checker only tests the automated filter layer (keyword match, parsing). A resume checker like RejectCheck also evaluates how a human recruiter and a hiring manager will read your CV — tone, seniority signals, GitHub/LinkedIn consistency, and structural red flags.',
  },
]

export default async function AtsCheckerPage({
  params,
}: {
  params: Promise<LangParams>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  if (lang !== 'en') notFound()

  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: `${SITE_URL}/en` },
    { name: 'ATS Checker', url: CANONICAL },
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
      <JsonLd id="ld-breadcrumb-ats-checker" data={breadcrumbs} />
      <JsonLd id="ld-faq-ats-checker" data={faqPageSchema(FAQ_ITEMS)} />
      <JsonLd id="ld-article-ats-checker" data={article} />
      <JsonLd id="ld-app-ats-checker" data={softwareApplicationSchema('en')} />

      <div className="bg-rc-bg text-rc-text font-sans min-h-screen">
        <Navbar />

        {/* Hero */}
        <section className="max-w-[1100px] mx-auto px-5 md:px-[40px] pt-20 pb-16 md:pt-28 md:pb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px w-6 bg-rc-red" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-red">
              ATS Checker · For developers
            </span>
          </div>
          <h1 className="text-[40px] md:text-[58px] font-semibold leading-[1.08] tracking-[-0.025em] text-rc-text max-w-[820px] mb-6">
            See exactly why ATS filters{' '}
            <span
              className="text-rc-red italic"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              reject your resume
            </span>{' '}
            before recruiters do.
          </h1>
          <p className="text-rc-muted text-[16px] md:text-[17px] leading-[1.7] max-w-[620px] mb-10">
            Free ATS resume checker tailored to developer roles. Paste a job description, upload
            your CV, get the exact missing keywords with point values, formatting flags, and
            actionable fixes — in under 60 seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link
              href="/en/analyze"
              className="inline-flex items-center gap-2.5 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-7 py-3.5 rounded-xl hover:bg-[#b83332] transition-all duration-200 no-underline"
            >
              Run free ATS check
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
              No signup · No CV stored · Tailored to one job
            </span>
          </div>
        </section>

        {/* What an ATS does */}
        <section className="border-t-[0.5px] border-rc-border bg-rc-surface-hero">
          <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-20 md:py-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-rc-border" />
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
                Why this matters
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-6 max-w-[680px]">
              A single tech job posting gets 200–1,000 applications. ATS filters cut that to
              20–50 before a human reads anything.
            </h2>
            <p className="text-rc-muted text-[15px] md:text-[16px] leading-[1.7] max-w-[700px] mb-12">
              The ATS is dumb on purpose: it parses your CV into plain text and scores keyword
              overlap with the job description. It does not read between the lines. If your
              skills are in a fancy box, listed as &ldquo;K8s&rdquo; when the JD says
              &ldquo;Kubernetes&rdquo;, or hidden behind a multi-column layout, the ATS does not
              see them. You get auto-rejected without a single second of human attention.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  step: '01',
                  title: 'Parse',
                  body:
                    'The ATS extracts raw text from your PDF. Tables, columns, text boxes, and images often break this step entirely.',
                },
                {
                  step: '02',
                  title: 'Match',
                  body:
                    'It scores keyword overlap with the job description: hard skills, soft skills, titles, certifications. Synonyms count less. Exact phrasing wins.',
                },
                {
                  step: '03',
                  title: 'Filter',
                  body:
                    'Below a match threshold, your application is auto-rejected or buried. The recruiter never sees it. You get silence or a templated email.',
                },
              ].map((c) => (
                <div
                  key={c.step}
                  className="rounded-2xl border border-rc-border bg-rc-surface p-6"
                >
                  <span className="font-mono text-[11px] text-rc-red tracking-[0.16em]">
                    {c.step}
                  </span>
                  <h3 className="text-[18px] font-semibold text-rc-text mt-3 mb-2">
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
                What the ATS checker returns
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-12 max-w-[640px]">
              Not just a score. The exact fixes, ordered by point impact.
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[
                {
                  label: 'ATS score / 100',
                  body:
                    'Match percentage between your CV and the target job description, calibrated to recruiter pass thresholds (typically 70+).',
                },
                {
                  label: 'Missing keywords with point values',
                  body:
                    'Each missing keyword from the JD with its weight ("Kubernetes +11 pts", "GraphQL +9 pts") so you know exactly what to add and where.',
                },
                {
                  label: 'Format and parsing flags',
                  body:
                    'Multi-column layouts, embedded images, non-standard headings, fonts that fail OCR — anything that would silently break ATS extraction.',
                },
                {
                  label: 'Synonym and phrasing audit',
                  body:
                    '"K8s" vs "Kubernetes", "TS" vs "TypeScript", "JS" vs "JavaScript". The ATS scores exact matches higher. We flag every mismatch.',
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

        {/* Beyond ATS */}
        <section className="border-t-[0.5px] border-rc-border bg-rc-surface-hero">
          <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-20 md:py-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-rc-border" />
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
                The ATS is layer one
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-6 max-w-[680px]">
              Passing the ATS is necessary, not sufficient.
            </h2>
            <p className="text-rc-muted text-[15px] md:text-[16px] leading-[1.7] max-w-[700px] mb-8">
              After the ATS, an HR recruiter scans your CV for an average of <strong>6
              seconds</strong> looking for red flags. Then a hiring manager evaluates your
              GitHub, LinkedIn, and seniority signals. RejectCheck audits all three layers in
              one pass — not just the ATS.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/en/guides/how-to-pass-ats"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rc-border bg-rc-surface font-mono text-[11px] tracking-wide text-rc-text hover:border-rc-red transition-colors no-underline"
              >
                Read: How to pass ATS in 2026 →
              </Link>
              <Link
                href="/en/guides/why-developers-get-rejected"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rc-border bg-rc-surface font-mono text-[11px] tracking-wide text-rc-text hover:border-rc-red transition-colors no-underline"
              >
                Read: Why developers get rejected →
              </Link>
              <Link
                href="/en/software-engineer-cv"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rc-border bg-rc-surface font-mono text-[11px] tracking-wide text-rc-text hover:border-rc-red transition-colors no-underline"
              >
                Software engineer CV guide →
              </Link>
              <Link
                href="/en/resume-checker"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rc-border bg-rc-surface font-mono text-[11px] tracking-wide text-rc-text hover:border-rc-red transition-colors no-underline"
              >
                Full resume checker →
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
              ATS checker — what developers ask
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
              Run a free ATS check on your CV right now.
            </h2>
            <p className="font-mono text-[12px] md:text-[13px] tracking-[0.06em] text-rc-hint mb-8">
              No signup. No data stored. Tailored to one specific job.
            </p>
            <Link
              href="/en/analyze"
              className="inline-flex items-center gap-2.5 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-8 py-4 rounded-xl hover:bg-[#b83332] transition-all duration-200 no-underline"
            >
              Run free ATS check
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
