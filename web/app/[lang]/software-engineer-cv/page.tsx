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

const PAGE_PATH = '/software-engineer-cv'
const PUBLISHED_ISO = '2026-04-29'
const LAST_UPDATED_ISO = '2026-04-29'
const CANONICAL = `${SITE_URL}/en${PAGE_PATH}`

const TITLE =
  'Software Engineer CV — How to Write One That Actually Lands Interviews (2026)'
const DESCRIPTION =
  'How to write a software engineer CV that passes ATS, the 6-second HR scan, and the hiring manager review. Free CV check tailored to a specific engineering role.'

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
    question: 'What is different about a software engineer CV vs a generic resume?',
    answer:
      'A software engineer CV is read by both an ATS and a technical hiring manager. The ATS scores keyword overlap with the job description; the hiring manager checks GitHub, project quality, and seniority phrasing. Generic resume advice (hobby sections, photo, soft-skill paragraphs) actively hurts you in this context. The bar is technical signal, not personality.',
  },
  {
    question: 'How long should a software engineer CV be?',
    answer:
      'One page until you have 10+ years of relevant experience. Longer reads as inflated. The hiring manager skims — every line should signal. If a bullet does not show ownership, impact, or a relevant technology, cut it.',
  },
  {
    question: 'Should I include a GitHub link on my CV?',
    answer:
      'Yes — and only if your GitHub backs your CV claims. The hiring manager will open it. Tutorial clones, abandoned repos with no README, and zero recent activity hurt you. A link to a clean GitHub with 2-3 real projects beats no link.',
  },
  {
    question: 'How do I phrase bullet points to read senior?',
    answer:
      'Active voice with measurable impact. "I owned and shipped a payment system handling 40k requests/day" beats "Worked on backend payment features". The verb signals ownership level. Numbers signal scope. Both are read in seconds.',
  },
  {
    question: 'How many skills should I list?',
    answer:
      '8 to 12 you have actually used in production. Listing 40 technologies signals inflation, not range. "Familiar with…" sections are a red flag — drop them. The skills you list should match the JD vocabulary exactly (Kubernetes, not K8s).',
  },
  {
    question: 'Do I need a Projects section?',
    answer:
      'For juniors and career switchers — yes, it is often the strongest section on the CV. For seniors with 5+ years of professional experience, projects matter less than impact in past roles. Either way, every project listed should be live, have a README, and show the stack from the JD.',
  },
]

export default async function SoftwareEngineerCvPage({
  params,
}: {
  params: Promise<LangParams>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  if (lang !== 'en') notFound()

  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: `${SITE_URL}/en` },
    { name: 'Software Engineer CV', url: CANONICAL },
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
      <JsonLd id="ld-breadcrumb-se-cv" data={breadcrumbs} />
      <JsonLd id="ld-faq-se-cv" data={faqPageSchema(FAQ_ITEMS)} />
      <JsonLd id="ld-article-se-cv" data={article} />
      <JsonLd id="ld-app-se-cv" data={softwareApplicationSchema('en')} />

      <div className="bg-rc-bg text-rc-text font-sans min-h-screen">
        <Navbar />

        {/* Hero */}
        <section className="max-w-[1100px] mx-auto px-5 md:px-[40px] pt-20 pb-16 md:pt-28 md:pb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px w-6 bg-rc-red" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-red">
              Software Engineer CV · 2026
            </span>
          </div>
          <h1 className="text-[40px] md:text-[58px] font-semibold leading-[1.08] tracking-[-0.025em] text-rc-text max-w-[860px] mb-6">
            How to write a software engineer CV that actually{' '}
            <span
              className="text-rc-red italic"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              lands interviews
            </span>
            .
          </h1>
          <p className="text-rc-muted text-[16px] md:text-[17px] leading-[1.7] max-w-[640px] mb-10">
            Generic resume advice does not work for engineers. Your CV is read by an ATS, a
            non-technical recruiter, and a technical hiring manager — three different filters,
            three different signals. This page covers what each one actually looks for.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link
              href="/en/analyze"
              className="inline-flex items-center gap-2.5 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-7 py-3.5 rounded-xl hover:bg-[#b83332] transition-all duration-200 no-underline"
            >
              Check my engineer CV free
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
              60 seconds · Tailored to one specific engineering role
            </span>
          </div>
        </section>

        {/* What makes it different */}
        <section className="border-t-[0.5px] border-rc-border bg-rc-surface-hero">
          <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-20 md:py-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-rc-border" />
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
                Why generic CV advice fails for engineers
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-6 max-w-[680px]">
              An engineer CV is judged on technical signal, not personality.
            </h2>
            <p className="text-rc-muted text-[15px] md:text-[16px] leading-[1.7] max-w-[700px] mb-12">
              Generic templates push you to add a photo, a hobby section, soft-skill
              paragraphs, and creative formatting. Each of those actively hurts you. The
              hiring manager opens GitHub before they finish reading the CV. The ATS chokes on
              decorative layouts. The recruiter scans for red flags in 6 seconds. None of them
              care about your favorite books.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  step: '01',
                  title: 'ATS layer',
                  body:
                    'Parses to plain text, scores keyword overlap with the JD. Multi-column layouts and decorative headings break parsing. You get filtered before any human sees it.',
                },
                {
                  step: '02',
                  title: 'HR layer (6 seconds)',
                  body:
                    'A non-technical recruiter scans for tenure, gaps, format, and consistency. They cut on visual signal, not technical depth. Clean, scannable beats dense and creative.',
                },
                {
                  step: '03',
                  title: 'Hiring manager layer',
                  body:
                    'A senior engineer opens GitHub, cross-checks LinkedIn, and reads tone for seniority signal. "I worked on" reads junior. "I owned and shipped" reads senior. They decide in under 2 minutes.',
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

        {/* The 5 sections */}
        <section className="border-t-[0.5px] border-rc-border">
          <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-20 md:py-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-rc-border" />
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
                Structure
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-12 max-w-[640px]">
              The 5 sections every engineer CV needs.
            </h2>

            <div className="space-y-5">
              {[
                {
                  n: '01',
                  title: 'Header',
                  body:
                    'Name, role title (matching the JD if honest), email, GitHub, LinkedIn, location/timezone. No photo. Title alignment matters: if the JD is for "Backend Engineer", do not call yourself "Full-Stack Generalist" at the top.',
                },
                {
                  n: '02',
                  title: 'Skills',
                  body:
                    '8 to 12 technologies you have used in production. Group them logically (Languages, Frameworks, Infra) only if it helps readability. Mirror the JD vocabulary exactly — Kubernetes, not K8s. Drop "Familiar with…" sections entirely.',
                },
                {
                  n: '03',
                  title: 'Experience',
                  body:
                    'Reverse-chronological. Each role: 2-5 bullets, active voice, measurable impact. "I designed and shipped a streaming pipeline that processed 40M events/day" beats "Worked on data ingestion features". Quantify scope, latency, scale, or business outcome.',
                },
                {
                  n: '04',
                  title: 'Projects',
                  body:
                    'Critical for juniors and career switchers. 2-3 projects: live, with a README, in a stack relevant to the JD. Each project: one-line description + tech stack + what you built and why. Tutorial clones do not belong here.',
                },
                {
                  n: '05',
                  title: 'Education',
                  body:
                    'Degree, institution, graduation year. For experienced engineers, this section can be 2 lines. For juniors and bootcamp grads, list relevant coursework or capstone. No GPA unless above 3.7 and you graduated under 5 years ago.',
                },
              ].map((s) => (
                <div
                  key={s.n}
                  className="rounded-2xl border border-rc-border bg-rc-surface p-6"
                >
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="font-mono text-[11px] text-rc-red tracking-[0.16em]">
                      {s.n}
                    </span>
                    <h3 className="text-[18px] font-semibold text-rc-text leading-tight">
                      {s.title}
                    </h3>
                  </div>
                  <p className="text-[14px] text-rc-muted leading-[1.7] pl-[40px]">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Senior vs Junior */}
        <section className="border-t-[0.5px] border-rc-border bg-rc-surface-hero">
          <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-20 md:py-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-rc-border" />
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
                Seniority signaling
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-6 max-w-[680px]">
              Same person, same work — different tone reads different level.
            </h2>
            <p className="text-rc-muted text-[15px] leading-[1.7] max-w-[700px] mb-10">
              The hiring manager reads seniority off your verbs before they reach the
              bullet&rsquo;s content. In a shortlist of 10-20 candidates, &ldquo;almost
              senior&rdquo; loses to &ldquo;clearly senior&rdquo; every time. If your CV reads
              a level below the role, you do not get the interview.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-rc-border bg-rc-surface p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold mb-3">
                  Junior signals
                </p>
                <ul className="space-y-2 text-[14px] text-rc-muted leading-[1.7]">
                  <li>— &ldquo;I worked on…&rdquo;</li>
                  <li>— &ldquo;I helped build…&rdquo;</li>
                  <li>— &ldquo;I used React&rdquo;</li>
                  <li>— Side projects only on GitHub</li>
                  <li>— No metrics, only task descriptions</li>
                  <li>— Skill list inflated with 25+ technologies</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-rc-red/30 bg-rc-red/5 p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-red font-bold mb-3">
                  Senior signals
                </p>
                <ul className="space-y-2 text-[14px] text-rc-muted leading-[1.7]">
                  <li>— &ldquo;I owned and shipped…&rdquo;</li>
                  <li>— &ldquo;I designed and led…&rdquo;</li>
                  <li>— &ldquo;I architected the streaming layer&rdquo;</li>
                  <li>— Live projects with measurable users or traffic</li>
                  <li>— Impact metrics: latency, scale, $$, throughput</li>
                  <li>— Tight skill list of 10 technologies, all production-grade</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Mid CTA */}
        <section className="border-t-[0.5px] border-rc-border">
          <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-16 md:py-20">
            <div className="rounded-2xl border border-rc-red/30 bg-rc-red/5 p-8 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-red font-bold mb-3">
                Audit yours against a specific role
              </p>
              <h2 className="text-[22px] md:text-[28px] font-semibold tracking-[-0.02em] text-rc-text mb-4 max-w-[620px] mx-auto">
                Paste a job description, upload your CV — get the diagnosis in 60 seconds.
              </h2>
              <p className="text-rc-muted text-[14px] mb-6 max-w-[520px] mx-auto">
                ATS score, missing keywords with point values, seniority audit, GitHub signal,
                red-flag detection. Free. No signup.
              </p>
              <Link
                href="/en/analyze"
                className="inline-flex items-center gap-2 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-7 py-3 rounded-xl hover:bg-[#b83332] transition-all duration-200 no-underline"
              >
                Run free check →
              </Link>
            </div>
          </div>
        </section>

        {/* vs templates */}
        <section className="border-t-[0.5px] border-rc-border bg-rc-surface-hero">
          <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-20 md:py-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-rc-border" />
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
                Why a template alone is not enough
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-6 max-w-[680px]">
              The structure is 30% of the work. The 70% is in the bullets.
            </h2>
            <p className="text-rc-muted text-[15px] leading-[1.7] max-w-[700px] mb-8">
              A free engineer CV template fixes your structure. It does not fix your tone, your
              keyword match, or your seniority signaling. Two CVs with identical templates can
              read 3 levels apart based purely on phrasing. Optimize the words, not just the
              layout.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/en/cv-review"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rc-border bg-rc-surface font-mono text-[11px] tracking-wide text-rc-text hover:border-rc-red transition-colors no-underline"
              >
                Get a deep CV review →
              </Link>
              <Link
                href="/en/resume-checker"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rc-border bg-rc-surface font-mono text-[11px] tracking-wide text-rc-text hover:border-rc-red transition-colors no-underline"
              >
                Fast resume checker →
              </Link>
              <Link
                href="/en/guides/software-engineer-resume-tips"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rc-border bg-rc-surface font-mono text-[11px] tracking-wide text-rc-text hover:border-rc-red transition-colors no-underline"
              >
                12 actionable tips →
              </Link>
              <Link
                href="/en/guides/why-developers-get-rejected"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rc-border bg-rc-surface font-mono text-[11px] tracking-wide text-rc-text hover:border-rc-red transition-colors no-underline"
              >
                Why devs get rejected →
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
              Software engineer CV — what developers ask
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
              Run a check on your engineer CV against the role you actually want.
            </h2>
            <p className="font-mono text-[12px] md:text-[13px] tracking-[0.06em] text-rc-hint mb-8">
              ATS + HR + hiring manager — one pass. Free. No signup.
            </p>
            <Link
              href="/en/analyze"
              className="inline-flex items-center gap-2.5 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-8 py-4 rounded-xl hover:bg-[#b83332] transition-all duration-200 no-underline"
            >
              Check my engineer CV free
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
              href="/en/ats-checker"
              className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline hover:text-rc-text"
            >
              ATS Checker
            </Link>
            <Link
              href="/en/cv-review"
              className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline hover:text-rc-text"
            >
              CV Review
            </Link>
            <Link
              href="/en/resume-checker"
              className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline hover:text-rc-text"
            >
              Resume Checker
            </Link>
            <Link
              href="/en/pricing"
              className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline hover:text-rc-text"
            >
              Pricing
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
