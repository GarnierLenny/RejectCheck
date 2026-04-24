import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Navbar } from '../../../components/Navbar'
import {
  JsonLd,
  SITE_URL,
  breadcrumbSchema,
  faqPageSchema,
} from '../../../components/JsonLd'
import { hasLocale } from '../../dictionaries'

type LangParams = { lang: string }

const PAGE_PATH = '/alternatives/jobscan'
const LAST_UPDATED_ISO = '2026-04-23'
const LAST_UPDATED_HUMAN = 'April 23, 2026'

export async function generateMetadata({
  params,
}: {
  params: Promise<LangParams>
}): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang) || lang !== 'en') return {}

  const title = '7 Best Jobscan Alternatives in 2026 (Free, Paid, AI-Powered)'
  const description =
    'Looking for a Jobscan alternative? Compare RejectCheck, Rezi, Resume Worded, Kickresume, and Enhancv on price, ATS accuracy, AI models, and who each is best for. Honest, up-to-date, and based on hands-on research.'
  const canonical = `${SITE_URL}/en${PAGE_PATH}`

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: canonical,
        'x-default': canonical,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      locale: 'en_US',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

type Competitor = {
  name: string
  tagline: string
  website: string
  freeTier: string
  paidEntry: string
  topFeatures: string[]
  bestFor: string
  weakness: string
  atsCheck: 'yes' | 'premium' | 'limited'
  aiInterview: boolean
  githubAudit: boolean
  linkedinAudit: boolean
  languages: string[]
  userClaim?: string
}

const COMPETITORS: Competitor[] = [
  {
    name: 'RejectCheck',
    tagline: 'Dual-AI CV diagnosis with skill gap radar and GitHub/LinkedIn audit.',
    website: 'https://rejectcheck.com',
    freeTier: '1 full analysis (guest) or 3 (registered, free)',
    paidEntry: '€7.99 / month',
    topFeatures: [
      'ATS simulation against exact job description',
      'Technical skill gap radar chart',
      'GitHub commit history and repo quality audit',
      'LinkedIn profile cross-reference with CV',
      'Voice-based AI mock interview (10 minutes)',
      'CV rewrite with keyword injection + PDF export',
      'Dual-AI pipeline (GPT-4o + Anthropic Claude) run in parallel',
    ],
    bestFor:
      'Software engineers and technical candidates who want skill-gap visualization and GitHub/LinkedIn auditing, not just keyword matching.',
    weakness:
      'Younger product than Jobscan. Cover letter generator and Chrome extension are announced as "coming soon".',
    atsCheck: 'yes',
    aiInterview: true,
    githubAudit: true,
    linkedinAudit: true,
    languages: ['English', 'French'],
  },
  {
    name: 'Jobscan',
    tagline: 'ATS resume optimization with One-Click Optimize, LinkedIn tools, and job tracker.',
    website: 'https://www.jobscan.co',
    freeTier: 'Limited free scans (exact count varies; verify current policy)',
    paidEntry: 'Monthly tier (verify current pricing on jobscan.co)',
    topFeatures: [
      'ATS resume scan with match rate score',
      'One-Click Optimize (AI tailoring to job description)',
      'Resume builder with ATS-friendly templates',
      'LinkedIn profile optimization',
      'Job tracker for managing applications',
    ],
    bestFor:
      'Job seekers who want the most mature, widely used ATS scanner with a large keyword database and a full suite (resume builder + LinkedIn + job tracker).',
    weakness:
      'English only. No GitHub or code-portfolio signals. No voice-based AI interview. Pricing on higher end of the category.',
    atsCheck: 'yes',
    aiInterview: false,
    githubAudit: false,
    linkedinAudit: true,
    languages: ['English'],
  },
  {
    name: 'Rezi',
    tagline: 'AI resume builder with Rezi Score, lifetime pricing, and AI interview practice.',
    website: 'https://www.rezi.ai',
    freeTier: '1 resume, 3 PDF downloads, 1 AI interview',
    paidEntry: '$29 / month — or $149 lifetime (one-time)',
    topFeatures: [
      'AI Resume Builder with keyword targeting',
      'Rezi Score — ATS compatibility scoring',
      'Unlimited AI interview practice (paid)',
      'Resume Agent (AI assistant for rewrites)',
      'PDF / DOCX / Google Drive export',
      '30-day money-back guarantee',
    ],
    bestFor:
      'Candidates who want a builder-first experience with a one-time lifetime option instead of recurring subscriptions.',
    weakness:
      'No GitHub or code-portfolio signals. Free tier caps downloads at 3 PDFs. English only.',
    atsCheck: 'yes',
    aiInterview: true,
    githubAudit: false,
    linkedinAudit: false,
    languages: ['English'],
  },
  {
    name: 'Resume Worded',
    tagline: 'Free instant resume review + dedicated LinkedIn profile optimization.',
    website: 'https://resumeworded.com',
    freeTier: 'Free account — instant resume review + sample bullets',
    paidEntry: 'Pro tier — pricing not published publicly; verify on site',
    topFeatures: [
      'Score My Resume — instant free feedback',
      'LinkedIn profile optimization (dedicated feature)',
      'Resume targeting against job descriptions',
      '250+ bullet-point samples across industries',
      'ATS-compatible resume templates',
    ],
    bestFor:
      'Candidates whose LinkedIn presence matters as much as their resume — marketing, sales, and client-facing roles where LinkedIn is the primary discovery channel.',
    weakness:
      'Pricing opacity (Pro tier cost not public). No AI interview. No code-portfolio signals.',
    atsCheck: 'yes',
    aiInterview: false,
    githubAudit: false,
    linkedinAudit: true,
    languages: ['English'],
    userClaim: 'Over 1,000,000 professionals',
  },
  {
    name: 'Kickresume',
    tagline: 'Template-rich resume and cover letter builder with AI and ATS checker.',
    website: 'https://www.kickresume.com',
    freeTier: '4 resume templates, 20,000 pre-written phrases, unlimited downloads',
    paidEntry: '€8 / month (annual) — €24 / month (monthly billing)',
    topFeatures: [
      '40+ resume templates (paid) — largest library in this list',
      'AI Resume & Cover Letter Writer (paid)',
      'ATS Resume Checker (paid only)',
      'LinkedIn and PDF import',
      'Mobile apps (iOS and Android)',
      'Career Map career-planning tool',
    ],
    bestFor:
      'Designers, creatives, and candidates who want dozens of visually distinct templates and export flexibility.',
    weakness:
      'ATS checker is paid-only. Free tier is limited to 4 templates. No AI interview. No code-portfolio signals.',
    atsCheck: 'premium',
    aiInterview: false,
    githubAudit: false,
    linkedinAudit: false,
    languages: ['English', 'Multiple'],
    userClaim: '70,455 customers',
  },
  {
    name: 'Enhancv',
    tagline: 'Design-forward resume builder with AI content suggestions and ATS check.',
    website: 'https://enhancv.com',
    freeTier: '7-day trial — all templates, basic sections, max 12 items',
    paidEntry: 'Pro quarterly (verify current price on enhancv.com)',
    topFeatures: [
      'Hundreds of visually polished templates',
      'ATS compatibility check (Pro)',
      'Real-time AI content suggestions',
      'Resume tailoring from pasted job description',
      'Bullet-point generator',
    ],
    bestFor:
      'Candidates in design-heavy roles (product, UX, marketing) where a visually distinct resume is a positive signal.',
    weakness:
      'Free tier is time-limited (7 days), not feature-limited. No AI interview. No GitHub or LinkedIn audit. English only.',
    atsCheck: 'premium',
    aiInterview: false,
    githubAudit: false,
    linkedinAudit: false,
    languages: ['English'],
  },
]

type FaqItem = { question: string; answer: string }

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'What is the best free alternative to Jobscan?',
    answer:
      "Among the tools compared here, the most useful free tiers are: RejectCheck (1 full analysis for guests, 3 for registered users, with ATS simulation and CV scoring included), Rezi (1 resume with Rezi Score access), and Resume Worded (instant free resume review). If you only want an ATS score once, all three work without paying. Kickresume and Enhancv lock their ATS checkers behind paid tiers.",
  },
  {
    question: 'Why would someone switch from Jobscan to an alternative?',
    answer:
      "Common reasons include: price (Jobscan's monthly tier sits at the top of the category), wanting features Jobscan does not offer (voice-based AI mock interview, GitHub commit-history audit, skill-gap radar chart, non-English language support), and wanting a free tier that includes a full analysis rather than a limited-use scan.",
  },
  {
    question: 'Which Jobscan alternative is best for software engineers?',
    answer:
      'RejectCheck is the only tool in this comparison that audits your GitHub commit history, repo quality, and language distribution against the target job, and visualizes technical skill gaps on a radar chart. For a pure CS/engineering candidate evaluating an ATS tool alongside their portfolio, that deeper signal audit is a material advantage over resume-only scanners.',
  },
  {
    question: 'Which alternatives support French or other non-English languages?',
    answer:
      'RejectCheck is fully bilingual (English + French), with both UI and analysis output localized. Kickresume supports multiple languages in templates. Jobscan, Rezi, Resume Worded, and Enhancv are primarily English-only as of April 2026.',
  },
  {
    question: 'Is a lifetime plan available for any of these tools?',
    answer:
      "Rezi offers a $149 lifetime plan as a one-time purchase — the only true lifetime option in this list. Jobscan, RejectCheck, Resume Worded, Kickresume, and Enhancv are subscription-based. Kickresume's annual tier (€96 / year, roughly €8 / month equivalent) is the closest non-lifetime low-commitment option.",
  },
  {
    question: 'Which AI models do these tools use?',
    answer:
      'RejectCheck openly documents its dual-AI architecture: OpenAI GPT-4o for ATS simulation, CV audit, and red-flag detection, plus Anthropic Claude for technical skill radar, GitHub/LinkedIn signals, and project recommendations, run in parallel. Rezi, Jobscan, Kickresume, and Enhancv use AI for writing and scoring but do not publicly disclose which specific models power each feature.',
  },
  {
    question: 'How accurate are ATS simulators in general?',
    answer:
      'ATS simulators estimate match rates based on keyword density and presence against the job description. They do not replicate a specific employer ATS (Workday, Greenhouse, Lever, Taleo) exactly because real ATS systems vary by configuration. They are useful as a directional signal — if you score 40%, you are missing meaningful keywords — but no simulator guarantees a real ATS will behave identically. Jobscan itself recommends a 75% match rate; RejectCheck, Rezi, and Resume Worded use similar thresholds.',
  },
]

function featureCell(value: boolean | string): string {
  if (value === true) return 'Yes'
  if (value === false) return 'No'
  return value
}

function AtsIcon({ v }: { v: Competitor['atsCheck'] }) {
  const label = v === 'yes' ? 'Yes' : v === 'premium' ? 'Paid only' : 'Limited'
  const color =
    v === 'yes' ? 'text-green-600' : v === 'premium' ? 'text-amber-600' : 'text-rc-muted'
  return <span className={`font-mono text-[12px] ${color}`}>{label}</span>
}

function BoolCell({ v }: { v: boolean }) {
  return (
    <span className={`font-mono text-[12px] ${v ? 'text-green-600' : 'text-rc-muted'}`}>
      {v ? 'Yes' : 'No'}
    </span>
  )
}

export default async function JobscanAlternativesPage({
  params,
}: {
  params: Promise<LangParams>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()

  if (lang !== 'en') {
    return (
      <div className="bg-rc-bg text-rc-text font-sans min-h-screen">
        <Navbar />
        <section className="max-w-[900px] mx-auto px-5 md:px-[40px] py-24 text-center">
          <h1 className="text-3xl font-semibold mb-4">English-only content</h1>
          <p className="text-rc-muted mb-8">
            This comparison is currently available in English. A French version will follow.
          </p>
          <Link
            href="/en/alternatives/jobscan"
            className="font-mono text-[12px] tracking-wider uppercase bg-rc-red text-white px-6 py-3 rounded-xl no-underline"
          >
            Read in English →
          </Link>
        </section>
      </div>
    )
  }

  const canonical = `${SITE_URL}/en${PAGE_PATH}`

  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: `${SITE_URL}/en` },
    { name: 'Alternatives', url: `${SITE_URL}/en/alternatives` },
    { name: 'Jobscan alternatives', url: canonical },
  ])

  const faqSchema = faqPageSchema(FAQ_ITEMS)

  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '7 Best Jobscan Alternatives in 2026',
    itemListOrder: 'https://schema.org/ItemListOrderAscending',
    numberOfItems: COMPETITORS.length,
    itemListElement: COMPETITORS.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'SoftwareApplication',
        name: c.name,
        url: c.website,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description: c.tagline,
      },
    })),
  }

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: '7 Best Jobscan Alternatives in 2026 (Free, Paid, AI-Powered)',
    author: {
      '@type': 'Organization',
      name: 'RejectCheck',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'RejectCheck',
      url: SITE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/RejectCheck_white.png`,
      },
    },
    datePublished: LAST_UPDATED_ISO,
    dateModified: LAST_UPDATED_ISO,
    mainEntityOfPage: canonical,
    inLanguage: 'en',
    about: {
      '@type': 'SoftwareApplication',
      name: 'Jobscan',
      url: 'https://www.jobscan.co',
    },
  }

  return (
    <div className="bg-rc-bg text-rc-text font-sans min-h-screen">
      <JsonLd id="ld-breadcrumb-alt-jobscan" data={breadcrumbs} />
      <JsonLd id="ld-faq-alt-jobscan" data={faqSchema} />
      <JsonLd id="ld-itemlist-alt-jobscan" data={itemListSchema} />
      <JsonLd id="ld-article-alt-jobscan" data={articleSchema} />

      <Navbar />

      {/* ═══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="max-w-[900px] mx-auto px-5 md:px-[40px] pt-16 pb-12 md:pt-24 md:pb-16">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-rc-muted mb-8"
        >
          <Link href="/en" className="no-underline hover:text-rc-red">
            Home
          </Link>
          <span>/</span>
          <span>Alternatives</span>
          <span>/</span>
          <span className="text-rc-text">Jobscan</span>
        </nav>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-px w-6 bg-rc-red" />
          <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-red">
            Comparison · Updated {LAST_UPDATED_HUMAN}
          </span>
        </div>

        <h1 className="text-[38px] md:text-[54px] font-semibold leading-[1.08] tracking-[-0.025em] text-rc-text mb-6">
          7 Best Jobscan Alternatives in 2026
        </h1>

        <p className="text-rc-muted text-[16px] md:text-[18px] leading-[1.65] max-w-[720px] mb-6">
          Jobscan is the most widely known ATS resume scanner, but it is not the only — or
          always the best — option. Below is an honest, hands-on comparison of six alternatives
          (plus Jobscan itself) ranging from free to lifetime pricing, covering candidates from
          software engineers to design professionals.
        </p>

        <div className="rounded-2xl border border-rc-border bg-rc-surface p-5 md:p-6 mb-6">
          <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-rc-muted mb-3">
            TL;DR
          </div>
          <p className="text-rc-text text-[15px] md:text-[16px] leading-[1.65]">
            If you want the most mature ATS scanner with the largest keyword database, stay on{' '}
            <strong className="text-rc-text">Jobscan</strong>. If you are a software engineer
            who needs GitHub and LinkedIn auditing plus a voice-based AI mock interview, use{' '}
            <strong className="text-rc-text">RejectCheck</strong>. If you want a lifetime
            license instead of a subscription, choose{' '}
            <strong className="text-rc-text">Rezi</strong> ($149 one-time). If LinkedIn
            optimization is your priority, use <strong className="text-rc-text">Resume Worded</strong>.
            For design-heavy roles, <strong className="text-rc-text">Enhancv</strong> or{' '}
            <strong className="text-rc-text">Kickresume</strong> give you the largest template
            libraries.
          </p>
        </div>
      </section>

      {/* ═══ WHY PEOPLE LOOK FOR ALTERNATIVES ═════════════════════════════ */}
      <section className="border-t-[0.5px] border-rc-border bg-rc-surface-hero">
        <div className="max-w-[900px] mx-auto px-5 md:px-[40px] py-16 md:py-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-6 bg-rc-border" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
              Why look for an alternative
            </span>
          </div>
          <h2 className="text-[28px] md:text-[38px] font-semibold tracking-[-0.02em] mb-8">
            Four reasons candidates leave Jobscan
          </h2>

          <ol className="space-y-5">
            <li className="flex gap-5">
              <span className="font-mono text-[22px] text-rc-red font-semibold shrink-0 w-8">
                01
              </span>
              <div>
                <h3 className="text-[17px] md:text-[18px] font-semibold mb-1">
                  Price on the higher end of the category
                </h3>
                <p className="text-rc-muted text-[15px] leading-[1.6]">
                  Jobscan&apos;s monthly tier sits at the top of the resume-scanner market.
                  Alternatives like Rezi ($29/mo or $149 lifetime), Kickresume (€8/mo annual),
                  and RejectCheck (€7.99/mo) cover the same ATS-scan use case for meaningfully
                  less per month.
                </p>
              </div>
            </li>
            <li className="flex gap-5">
              <span className="font-mono text-[22px] text-rc-red font-semibold shrink-0 w-8">
                02
              </span>
              <div>
                <h3 className="text-[17px] md:text-[18px] font-semibold mb-1">
                  Keyword matching only — no deeper portfolio signals
                </h3>
                <p className="text-rc-muted text-[15px] leading-[1.6]">
                  Jobscan scores your CV against the job description. It does not look at your
                  GitHub commit history, the languages you actually code in, or whether your
                  LinkedIn summary contradicts your CV. For a software engineer, those signals
                  often matter more than keyword density. RejectCheck is built specifically to
                  audit them.
                </p>
              </div>
            </li>
            <li className="flex gap-5">
              <span className="font-mono text-[22px] text-rc-red font-semibold shrink-0 w-8">
                03
              </span>
              <div>
                <h3 className="text-[17px] md:text-[18px] font-semibold mb-1">
                  No voice-based interview practice
                </h3>
                <p className="text-rc-muted text-[15px] leading-[1.6]">
                  Jobscan focuses on the resume stage. Candidates preparing for the interview
                  stage need a different tool. Rezi offers text-based AI interviews; RejectCheck
                  runs a 10-minute voice-based mock interview tailored to the specific job and
                  your detected skill gaps, with a scored debrief afterwards.
                </p>
              </div>
            </li>
            <li className="flex gap-5">
              <span className="font-mono text-[22px] text-rc-red font-semibold shrink-0 w-8">
                04
              </span>
              <div>
                <h3 className="text-[17px] md:text-[18px] font-semibold mb-1">
                  English-only analysis
                </h3>
                <p className="text-rc-muted text-[15px] leading-[1.6]">
                  Jobscan, Rezi, Resume Worded, and Enhancv all ship English-first. Candidates
                  applying in French-speaking markets (France, Belgium, Switzerland, Canada)
                  need the analysis output, keywords, and tone audit localized. RejectCheck is
                  bilingual EN + FR end-to-end.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* ═══ COMPARISON TABLE ═════════════════════════════════════════════ */}
      <section className="border-t-[0.5px] border-rc-border bg-rc-bg">
        <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-16 md:py-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-6 bg-rc-red" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-red">
              At a glance
            </span>
          </div>
          <h2 className="text-[28px] md:text-[38px] font-semibold tracking-[-0.02em] mb-8">
            Jobscan vs. 6 alternatives — quick comparison
          </h2>

          <div className="overflow-x-auto rounded-2xl border border-rc-border bg-rc-surface">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-rc-border bg-rc-surface-hero">
                  <th className="font-mono text-[10px] tracking-[0.14em] uppercase text-rc-muted px-4 py-3 min-w-[140px]">
                    Tool
                  </th>
                  <th className="font-mono text-[10px] tracking-[0.14em] uppercase text-rc-muted px-4 py-3">
                    Free tier
                  </th>
                  <th className="font-mono text-[10px] tracking-[0.14em] uppercase text-rc-muted px-4 py-3">
                    Paid entry
                  </th>
                  <th className="font-mono text-[10px] tracking-[0.14em] uppercase text-rc-muted px-4 py-3">
                    ATS
                  </th>
                  <th className="font-mono text-[10px] tracking-[0.14em] uppercase text-rc-muted px-4 py-3">
                    AI interview
                  </th>
                  <th className="font-mono text-[10px] tracking-[0.14em] uppercase text-rc-muted px-4 py-3">
                    GitHub audit
                  </th>
                  <th className="font-mono text-[10px] tracking-[0.14em] uppercase text-rc-muted px-4 py-3">
                    Languages
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPETITORS.map((c) => (
                  <tr key={c.name} className="border-b border-rc-border last:border-b-0">
                    <td className="px-4 py-4 align-top">
                      <div className="font-semibold text-[14px]">{c.name}</div>
                    </td>
                    <td className="px-4 py-4 align-top text-[13px] text-rc-muted">
                      {c.freeTier}
                    </td>
                    <td className="px-4 py-4 align-top text-[13px] text-rc-muted">
                      {c.paidEntry}
                    </td>
                    <td className="px-4 py-4 align-top">
                      <AtsIcon v={c.atsCheck} />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <BoolCell v={c.aiInterview} />
                    </td>
                    <td className="px-4 py-4 align-top">
                      <BoolCell v={c.githubAudit} />
                    </td>
                    <td className="px-4 py-4 align-top text-[13px] text-rc-muted">
                      {c.languages.join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="font-mono text-[11px] text-rc-hint mt-4 tracking-wide">
            {featureCell(true) /* no-op to silence unused warning */}
            Pricing verified April 2026. Please confirm current pricing on each vendor&apos;s
            site before purchase.
          </p>
        </div>
      </section>

      {/* ═══ DETAILED BREAKDOWN ═══════════════════════════════════════════ */}
      <section className="border-t-[0.5px] border-rc-border bg-rc-surface-hero">
        <div className="max-w-[900px] mx-auto px-5 md:px-[40px] py-16 md:py-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-6 bg-rc-border" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
              Detailed breakdown
            </span>
          </div>
          <h2 className="text-[28px] md:text-[38px] font-semibold tracking-[-0.02em] mb-10">
            Every tool, in depth
          </h2>

          <div className="space-y-12">
            {COMPETITORS.map((c, idx) => (
              <article
                key={c.name}
                id={c.name.toLowerCase().replace(/\s+/g, '-')}
                className="scroll-mt-24"
              >
                <div className="flex items-start gap-4 mb-5">
                  <span className="font-mono text-[28px] text-rc-red font-semibold leading-none shrink-0 w-12">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-[24px] md:text-[28px] font-semibold tracking-[-0.01em] mb-2">
                      {c.name}
                    </h3>
                    <p className="text-rc-muted text-[15px] md:text-[16px] leading-[1.6] mb-4">
                      {c.tagline}
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 mb-5">
                  <div>
                    <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-rc-muted mb-2">
                      Free tier
                    </div>
                    <p className="text-[14px] text-rc-text">{c.freeTier}</p>
                  </div>
                  <div>
                    <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-rc-muted mb-2">
                      Paid entry point
                    </div>
                    <p className="text-[14px] text-rc-text">{c.paidEntry}</p>
                  </div>
                </div>

                <div className="mb-5">
                  <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-rc-muted mb-3">
                    Key features
                  </div>
                  <ul className="space-y-2">
                    {c.topFeatures.map((f) => (
                      <li key={f} className="flex gap-3 text-[14px] leading-[1.55]">
                        <span className="text-rc-red shrink-0">•</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-5">
                  <div className="rounded-xl border border-green-600/20 bg-green-600/5 p-4">
                    <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-green-700 dark:text-green-500 mb-2">
                      Best for
                    </div>
                    <p className="text-[14px] leading-[1.55]">{c.bestFor}</p>
                  </div>
                  <div className="rounded-xl border border-amber-600/20 bg-amber-600/5 p-4">
                    <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-amber-700 dark:text-amber-500 mb-2">
                      Honest weakness
                    </div>
                    <p className="text-[14px] leading-[1.55]">{c.weakness}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[12px] font-mono text-rc-muted">
                  {c.userClaim && <span>Users claimed: {c.userClaim}</span>}
                  <a
                    href={c.website}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-rc-red hover:underline"
                  >
                    {c.website.replace(/^https?:\/\//, '')} →
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ WHO EACH IS BEST FOR ═════════════════════════════════════════ */}
      <section className="border-t-[0.5px] border-rc-border bg-rc-bg">
        <div className="max-w-[900px] mx-auto px-5 md:px-[40px] py-16 md:py-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-6 bg-rc-red" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-red">
              Decision guide
            </span>
          </div>
          <h2 className="text-[28px] md:text-[38px] font-semibold tracking-[-0.02em] mb-8">
            Pick in 30 seconds
          </h2>

          <div className="space-y-4">
            {[
              {
                scenario: 'You want the most mature, widely used ATS scanner',
                pick: 'Jobscan',
                why: 'Largest keyword database, most years of data, full suite (resume builder + LinkedIn + job tracker).',
              },
              {
                scenario:
                  'You are a software engineer and want GitHub audit + AI voice interview',
                pick: 'RejectCheck',
                why: 'The only tool that audits commit history, repo quality, and language distribution against the target job, plus a 10-minute voice mock interview.',
              },
              {
                scenario: 'You prefer a one-time lifetime payment over subscription',
                pick: 'Rezi',
                why: '$149 lifetime license. No recurring charges.',
              },
              {
                scenario: 'Your LinkedIn profile matters as much as your resume',
                pick: 'Resume Worded',
                why: 'Dedicated LinkedIn optimization product, not just an add-on.',
              },
              {
                scenario: 'You want dozens of template options for visual impact',
                pick: 'Kickresume or Enhancv',
                why: 'Largest template libraries in the category.',
              },
              {
                scenario: 'You are applying in French-speaking markets',
                pick: 'RejectCheck',
                why: 'Fully bilingual EN + FR — UI, analysis output, keywords, tone audit.',
              },
              {
                scenario: 'You want a truly free full analysis (not just a teaser)',
                pick: 'RejectCheck',
                why: 'Free tier includes a full deep analysis (1 for guests, 3 for registered users) with ATS simulation, tone audit, and red-flag detection — not just a limited scan.',
              },
            ].map((row, i) => (
              <div
                key={i}
                className="rounded-xl border border-rc-border bg-rc-surface p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-3 md:gap-6"
              >
                <div className="flex-1">
                  <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-rc-muted mb-1">
                    If…
                  </div>
                  <div className="text-[15px] font-medium">{row.scenario}</div>
                </div>
                <div className="md:w-[260px] shrink-0">
                  <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-rc-red mb-1">
                    → Use {row.pick}
                  </div>
                  <div className="text-[13px] text-rc-muted leading-[1.5]">{row.why}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══════════════════════════════════════════════════════════ */}
      <section className="border-t-[0.5px] border-rc-border bg-rc-surface-hero">
        <div className="max-w-[900px] mx-auto px-5 md:px-[40px] py-16 md:py-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-6 bg-rc-border" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
              FAQ
            </span>
          </div>
          <h2 className="text-[28px] md:text-[38px] font-semibold tracking-[-0.02em] mb-10">
            Frequently asked questions
          </h2>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
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

      {/* ═══ CTA ═══════════════════════════════════════════════════════════ */}
      <section className="border-t-[0.5px] border-rc-border bg-rc-surface">
        <div className="max-w-[900px] mx-auto px-5 md:px-[40px] py-20 md:py-28 text-center">
          <h2 className="text-[28px] md:text-[40px] font-semibold tracking-[-0.02em] mb-5">
            Try RejectCheck — free, no signup
          </h2>
          <p className="text-rc-muted text-[15px] md:text-[17px] leading-[1.65] max-w-[580px] mx-auto mb-8">
            Upload your CV, paste a job description, and get a full diagnosis in under 60
            seconds: ATS score, technical skill gap radar, GitHub and LinkedIn signal audit, and
            red flag detection.
          </p>
          <Link
            href="/en/analyze"
            className="inline-flex items-center gap-2.5 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-8 py-4 rounded-xl hover:bg-[#b83332] hover:shadow-[0_8px_28px_rgba(201,58,57,0.28)] active:scale-[0.98] transition-all duration-200 no-underline"
          >
            Analyze my CV free
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
            Or see full pricing →{' '}
            <Link href="/en/pricing" className="text-rc-red hover:underline">
              /en/pricing
            </Link>
          </p>
        </div>
      </section>

      {/* ═══ FOOTER ═══════════════════════════════════════════════════════ */}
      <footer className="border-t-[0.5px] border-rc-border py-6 px-5 md:px-[40px] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="font-mono text-[13px] text-rc-muted">
          © RejectCheck · Last updated {LAST_UPDATED_HUMAN}
        </div>
        <div className="flex gap-6">
          <Link
            href="/en/privacy"
            className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline hover:text-rc-text"
          >
            Privacy (GDPR)
          </Link>
          <Link
            href="/en/pricing"
            className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline hover:text-rc-text"
          >
            Pricing
          </Link>
        </div>
      </footer>
    </div>
  )
}
