import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Navbar } from '../../../components/Navbar'
import {
  JsonLd,
  SITE_URL,
  articleSchema,
  breadcrumbSchema,
  faqPageSchema,
} from '../../../components/JsonLd'
import { hasLocale } from '../../dictionaries'

const PAGE_PATH = '/guides/software-engineer-resume-tips'
const PUBLISHED_ISO = '2026-04-29'
const LAST_UPDATED_ISO = '2026-04-29'
const CANONICAL = `${SITE_URL}/en${PAGE_PATH}`

const TITLE = '12 Software Engineer Resume Tips (2026)'
const DESCRIPTION =
  '12 resume tips for software engineers based on what hiring managers look for: GitHub signals, ownership phrasing, ATS-friendly format, seniority alignment.'

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
    question: 'Are these tips for juniors or seniors?',
    answer:
      'Both. Format and ATS rules apply equally. Tone and seniority signaling differ — juniors should focus on tip 9 (Projects section) and tip 3 (active voice). Seniors should focus on tip 4 (impact metrics) and tip 11 (seniority signals matching the role).',
  },
  {
    question: 'How long should a software engineer resume be?',
    answer:
      'One page until you have 10+ years of relevant experience. The hiring manager will not read more. Every line should justify its space — if a bullet does not signal ownership, impact, or relevant tech, cut it.',
  },
  {
    question: 'Should I use a creative resume template?',
    answer:
      'No. Single-column, standard headings, no images, no text boxes. Creative templates break ATS parsing and signal "compensation" to recruiters. Boring beats clever in this medium.',
  },
  {
    question: 'How do I make a junior engineer resume stand out?',
    answer:
      'Projects section. Two or three live projects with READMEs, deployed somewhere, in the stack the JD requires. Tutorial clones do not count. The Projects section is where juniors build the technical signal that years of experience would normally provide.',
  },
  {
    question: 'How do I quantify impact when my work was small?',
    answer:
      'Anchor to anything measurable: number of teammates, number of internal users, lines of code reviewed per week, time saved per week, deploys per week. "Reduced deploy cycle from 4h to 30min" is a metric. "Improved team velocity" is not.',
  },
  {
    question: 'What is the most overlooked tip?',
    answer:
      'Cleaning up GitHub before applying. The hiring manager will open it. A few empty repos, no READMEs, and the last commit two years ago weakens the entire CV regardless of how well-written the rest is.',
  },
]

const TIPS: Array<{ n: string; title: string; body: string; example?: { before: string; after: string } }> = [
  {
    n: '01',
    title: 'Save as a single-column PDF, no boxes or images',
    body:
      'Tables, multi-column layouts, text boxes, and embedded images break ATS parsing. The ATS extracts plain text and scores keyword overlap. If your skills are in a sidebar box, the ATS may not see them at all. Single-column with standard section headings is boring and effective.',
  },
  {
    n: '02',
    title: 'Mirror the job description’s exact keywords',
    body:
      'The ATS does not understand synonyms reliably. If the JD says "Kubernetes", write "Kubernetes" — not "K8s", not "container orchestration". This is alignment, not stuffing. The recruiter who reads next will not penalize you for matching the role’s language.',
  },
  {
    n: '03',
    title: 'Use active voice with ownership',
    body:
      'Passive bullets read junior. Active bullets read senior. The verb signals your level before the reader processes the rest of the sentence.',
    example: {
      before: 'Worked on a payment processing system that handled high traffic.',
      after:
        'Designed and shipped a payment processing pipeline handling 40k requests/day, with sub-200ms p95 latency.',
    },
  },
  {
    n: '04',
    title: 'Quantify impact in every bullet',
    body:
      'Numbers anchor the bullet to reality. Without them, every bullet reads as a vague claim. Latency, scale, throughput, dollars saved, users served, deploy frequency — pick whichever is honest and concrete.',
    example: {
      before: 'Improved system performance significantly.',
      after:
        'Cut p99 latency from 1.2s to 280ms by replacing the synchronous fan-out with a queue-backed worker pool.',
    },
  },
  {
    n: '05',
    title: 'Put your GitHub link in the header — and clean it up first',
    body:
      'The hiring manager will open your GitHub. A few empty repos, no READMEs, no recent activity — all of that hurts you more than not linking GitHub at all. Pin 3-4 strong repos, write a real README for each, make sure the langs match what your CV claims.',
  },
  {
    n: '06',
    title: 'List 8 to 12 skills, no "Familiar with…"',
    body:
      'A 25-skill list signals inflation, not range. "Familiar with…" signals the candidate has barely touched it. Pick the 8-12 you have used in production. Match the JD vocabulary exactly.',
  },
  {
    n: '07',
    title: 'One page until 10+ years of experience',
    body:
      'Two pages with under 10 years of experience reads as inflated. The hiring manager skims — every line should signal. Cut everything that does not show ownership, impact, or relevant technology.',
  },
  {
    n: '08',
    title: 'Use standard section headings',
    body:
      'Experience, Education, Skills, Projects. Not "My Journey", not "Tech I Love", not "Things I Have Built". The ATS maps content to fields by recognizing these labels. Creative headings risk skipping fields entirely.',
  },
  {
    n: '09',
    title: 'For juniors and switchers, the Projects section is the strongest section',
    body:
      'Two or three live projects with READMEs, deployed where reviewers can see them, in a stack the JD requires. Each project: one-line problem statement + your technical choice + outcome. Tutorial clones and abandoned starters do not count.',
  },
  {
    n: '10',
    title: 'Make your title match the role you are applying for',
    body:
      'If you are applying for "Backend Engineer" but your CV header says "Full-Stack Generalist", you create instant mismatch. Title alignment is one of the first things the recruiter scans. Adjust within honesty: pick a real prior title that matches the target role most closely.',
  },
  {
    n: '11',
    title: 'Match seniority signals to the role level',
    body:
      'A senior CV that reads junior loses to a clearly-senior peer. "I owned and shipped" vs "I helped build" reads two levels apart. Audit every bullet for the verb. If you led the work, say so. If you supported it, do not over-claim — but do not undersell either.',
  },
  {
    n: '12',
    title: 'Verify against the specific job before submitting',
    body:
      'A CV optimized for one job is not optimized for the next. Before clicking submit, run an ATS+human check tailored to that role. The fix list is small and concrete: usually 3-5 missing keywords plus one or two phrasing improvements. Iterate per job, not per quarter.',
  },
]

export default async function SoftwareEngineerResumeTipsPage({
  params,
}: {
  params: Promise<LangParams>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  if (lang !== 'en') notFound()

  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: `${SITE_URL}/en` },
    { name: 'Guides', url: `${SITE_URL}/en/guides` },
    { name: 'Software Engineer Resume Tips', url: CANONICAL },
  ])

  const article = articleSchema({
    headline: TITLE,
    description: DESCRIPTION,
    url: CANONICAL,
    datePublished: PUBLISHED_ISO,
    dateModified: LAST_UPDATED_ISO,
    locale: 'en',
    author: { type: 'Person', name: 'Lenny Garnier' },
  })

  return (
    <>
      <JsonLd id="ld-breadcrumb-se-tips" data={breadcrumbs} />
      <JsonLd id="ld-faq-se-tips" data={faqPageSchema(FAQ_ITEMS)} />
      <JsonLd id="ld-article-se-tips" data={article} />

      <div className="bg-rc-bg text-rc-text font-sans min-h-screen">
        <Navbar />

        <article className="max-w-[760px] mx-auto px-5 md:px-[40px] pt-16 pb-20 md:pt-24 md:pb-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-6 bg-rc-red" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-red">
              Guide · 11 min read
            </span>
          </div>

          <h1 className="text-[36px] md:text-[52px] font-semibold leading-[1.1] tracking-[-0.025em] text-rc-text mb-6">
            Software engineer resume tips —{' '}
            <span
              className="text-rc-red italic"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              12 rules
            </span>{' '}
            that actually move the needle.
          </h1>

          <p className="text-rc-muted text-[16px] md:text-[17px] leading-[1.7] mb-10">
            Generic resume advice does not work for engineers. Three different filters read
            your CV: ATS, HR, hiring manager — each looks for different signals. These 12
            rules are calibrated for what each filter actually weighs, ranked by impact.
          </p>

          {/* TL;DR */}
          <div className="rounded-2xl border border-rc-border bg-rc-surface p-6 mb-12">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-red font-bold mb-3">
              TL;DR — the 4 highest-leverage rules
            </p>
            <ul className="space-y-2 text-[14px] text-rc-muted leading-[1.7]">
              <li>
                <strong className="text-rc-text">Format</strong> — single-column PDF, no
                boxes, no images. Boring beats clever.
              </li>
              <li>
                <strong className="text-rc-text">Words</strong> — mirror the JD’s exact
                keywords (Kubernetes, not K8s).
              </li>
              <li>
                <strong className="text-rc-text">Verbs</strong> — &ldquo;I owned and
                shipped&rdquo;, not &ldquo;I worked on&rdquo;. Tone tells seniority before
                content does.
              </li>
              <li>
                <strong className="text-rc-text">Numbers</strong> — quantify scope, latency,
                scale, dollars, users. Vague bullets read as filler.
              </li>
            </ul>
          </div>

          <div className="space-y-10 text-[16px] leading-[1.8] text-rc-text">
            {TIPS.map((tip, idx) => (
              <section key={tip.n} id={`tip-${tip.n}`}>
                <div className="flex items-baseline gap-3 mb-3">
                  <span className="font-mono text-[11px] text-rc-red tracking-[0.16em]">
                    {tip.n}
                  </span>
                  <h2 className="text-[22px] md:text-[26px] font-semibold tracking-[-0.02em] text-rc-text leading-tight">
                    {tip.title}
                  </h2>
                </div>
                <p className="text-rc-muted">{tip.body}</p>
                {tip.example && (
                  <div className="mt-4 rounded-xl border border-rc-border bg-rc-surface p-5 space-y-3">
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-rc-hint font-bold mb-1.5">
                        Before
                      </p>
                      <p className="text-[14px] text-rc-hint leading-snug line-through">
                        {tip.example.before}
                      </p>
                    </div>
                    <div className="h-px bg-rc-border" />
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-rc-green font-bold mb-1.5">
                        After
                      </p>
                      <p className="text-[14px] text-rc-text leading-snug">
                        {tip.example.after}
                      </p>
                    </div>
                  </div>
                )}
                {/* Mid-article CTA after tip 06 */}
                {idx === 5 && (
                  <div className="mt-8 rounded-2xl border border-rc-red/30 bg-rc-red/5 p-6">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-red font-bold mb-2">
                      Apply rules 1-6 in 60 seconds
                    </p>
                    <p className="text-rc-text text-[15px] leading-[1.7] mb-4">
                      Run your CV through the analyzer against the actual job. You get the
                      missing keywords with point values, format flags, tone audit, and
                      prioritized fixes — free.
                    </p>
                    <Link
                      href="/en/analyze"
                      className="inline-flex items-center gap-2 bg-rc-red text-white font-mono text-[11px] tracking-[0.14em] uppercase px-5 py-2.5 rounded-lg hover:bg-[#b83332] transition-all duration-200 no-underline"
                    >
                      Run free check →
                    </Link>
                  </div>
                )}
              </section>
            ))}

            {/* Cross-links */}
            <section className="border-t border-rc-border pt-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold mb-3">
                Related
              </p>
              <ul className="space-y-2 text-[14px] leading-[1.7]">
                <li>
                  →{' '}
                  <Link
                    href="/en/software-engineer-cv"
                    className="text-rc-red no-underline hover:underline font-medium"
                  >
                    Software Engineer CV — full structural guide
                  </Link>
                </li>
                <li>
                  →{' '}
                  <Link
                    href="/en/cv-review"
                    className="text-rc-red no-underline hover:underline font-medium"
                  >
                    Get a deep CV review (free, role-anchored)
                  </Link>
                </li>
                <li>
                  →{' '}
                  <Link
                    href="/en/guides/how-to-pass-ats"
                    className="text-rc-red no-underline hover:underline font-medium"
                  >
                    How to pass ATS in 2026
                  </Link>
                </li>
                <li>
                  →{' '}
                  <Link
                    href="/en/guides/why-developers-get-rejected"
                    className="text-rc-red no-underline hover:underline font-medium"
                  >
                    Why developers get rejected (and never find out why)
                  </Link>
                </li>
              </ul>
            </section>

            {/* Author */}
            <section className="border-t border-rc-border pt-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold mb-3">
                About the author
              </p>
              <p className="text-rc-muted text-[14px] leading-[1.7]">
                Lenny Garnier — junior software engineer, founder of RejectCheck. These rules
                come from 200+ rejections during my own job search and the patterns I extracted
                while building the tool.
              </p>
            </section>
          </div>

          {/* FAQ */}
          <section className="mt-16 pt-10 border-t border-rc-border">
            <h2 className="text-[24px] md:text-[28px] font-semibold tracking-[-0.02em] text-rc-text mb-6">
              FAQ
            </h2>
            <div className="space-y-3">
              {FAQ_ITEMS.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-xl border border-rc-border bg-rc-surface"
                >
                  <summary className="cursor-pointer list-none flex items-start justify-between gap-4 px-5 py-4">
                    <h3 className="text-[15px] md:text-[16px] font-semibold text-rc-text leading-[1.35]">
                      {item.question}
                    </h3>
                    <span
                      aria-hidden="true"
                      className="shrink-0 mt-1 font-mono text-[16px] text-rc-red transition-transform group-open:rotate-45 select-none"
                    >
                      +
                    </span>
                  </summary>
                  <div className="px-5 pb-5 -mt-1">
                    <p className="text-rc-muted text-[14px] leading-[1.7]">{item.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* Bottom CTA */}
          <div className="mt-16 rounded-2xl border border-rc-border bg-rc-surface p-8 text-center">
            <h2 className="text-[22px] md:text-[26px] font-semibold tracking-[-0.02em] text-rc-text mb-4">
              Apply the 12 rules. Verify against a real role.
            </h2>
            <p className="text-rc-muted text-[14px] mb-6">
              60 seconds. Tailored to one specific job. Free.
            </p>
            <Link
              href="/en/analyze"
              className="inline-flex items-center gap-2.5 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-7 py-3.5 rounded-xl hover:bg-[#b83332] transition-all duration-200 no-underline"
            >
              Run free check →
            </Link>
          </div>
        </article>

        <footer className="border-t-[0.5px] border-rc-border py-6 px-5 md:px-[40px] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-mono text-[13px] text-rc-muted">
            © RejectCheck — Built for developers
          </div>
          <div className="flex gap-6 flex-wrap justify-center">
            <Link
              href="/en/software-engineer-cv"
              className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline hover:text-rc-text"
            >
              SE CV Guide
            </Link>
            <Link
              href="/en/cv-review"
              className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline hover:text-rc-text"
            >
              CV Review
            </Link>
            <Link
              href="/en/ats-checker"
              className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline hover:text-rc-text"
            >
              ATS Checker
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
