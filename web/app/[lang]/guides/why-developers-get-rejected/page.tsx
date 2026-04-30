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

const PAGE_PATH = '/guides/why-developers-get-rejected'
const PUBLISHED_ISO = '2026-04-29'
const LAST_UPDATED_ISO = '2026-04-29'
const CANONICAL = `${SITE_URL}/en${PAGE_PATH}`

const TITLE = 'Why Developers Get Rejected (2026)'
const DESCRIPTION =
  'The three filters between Submit and the interview: ATS, the 6-second HR scan, and the hiring manager review. 9 red flags and how to iterate on rejections.'

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
    question: 'Why do developers get rejected even with strong skills?',
    answer:
      'The skills are usually fine. What fails is the gap between reality and what the CV shows. Three filters — ATS, HR 6-second scan, hiring manager review — each look for different signals. Strong candidates get filtered out by formatting, vague phrasing, junior-tone bullets, or GitHub-CV inconsistencies long before the technical interview.',
  },
  {
    question: 'How long does an HR recruiter spend on a CV?',
    answer:
      'Around 6 seconds on average. They scan, not read. They look at current title, company names, tenure length, and visual signals (length, structure, typos). Anything that triggers a red flag in that window — short stays, time gaps, fancy graphics, inconsistencies — kills the application.',
  },
  {
    question: 'What are the most common red flags on a developer CV?',
    answer:
      'Short tenures across multiple jobs, unexplained gaps, 2+ pages with under 10 years of experience, colorful or graphic-heavy design, fancy fonts, unprofessional touches (selfie photos, hotmail addresses), CV-vs-LinkedIn inconsistencies, inflated skill lists, and "Familiar with..." sections that signal the candidate has not actually used the technology.',
  },
  {
    question: 'How do I know if my CV reads junior or senior?',
    answer:
      'Check the verbs and the GitHub. Junior signals: "I worked on", "I helped build", "I used React", task descriptions, side projects only. Senior signals: "I owned and shipped", "I designed and led", "I architected", live projects with users, impact metrics, ownership language. The hiring manager reads tone within seconds.',
  },
  {
    question: 'How can I improve my application iteratively?',
    answer:
      'Treat each rejection as data, not failure. Before applying: audit CV/GitHub/LinkedIn against the target role. For the job: mirror the JD’s exact keywords and tone, confirm seniority alignment. After rejection: identify which layer probably filtered you (ATS keyword miss? HR red flag? Manager seniority gap?) and adjust for the next application. The fastest hires are not the most talented — they are the fastest iterators.',
  },
]

export default async function WhyDevelopersGetRejectedPage({
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
    { name: 'Why Developers Get Rejected', url: CANONICAL },
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
      <JsonLd id="ld-breadcrumb-why-rejected" data={breadcrumbs} />
      <JsonLd id="ld-faq-why-rejected" data={faqPageSchema(FAQ_ITEMS)} />
      <JsonLd id="ld-article-why-rejected" data={article} />

      <div className="bg-rc-bg text-rc-text font-sans min-h-screen">
        <Navbar />

        <article className="max-w-[760px] mx-auto px-5 md:px-[40px] pt-16 pb-20 md:pt-24 md:pb-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-6 bg-rc-red" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-red">
              Guide · 14 min read
            </span>
          </div>

          <h1 className="text-[36px] md:text-[52px] font-semibold leading-[1.1] tracking-[-0.025em] text-rc-text mb-6">
            Why developers get rejected{' '}
            <span
              className="text-rc-red italic"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              (and never find out why)
            </span>
            .
          </h1>

          <p className="text-rc-muted text-[16px] md:text-[17px] leading-[1.7] mb-4">
            I&rsquo;m a junior software engineer. I got rejected 200+ times before I figured
            out the application pipeline is a black box — and that you can crack it open.
          </p>
          <p className="text-rc-muted text-[15px] leading-[1.7] mb-10">
            This is the breakdown: the three filters between &ldquo;Submit&rdquo; and an
            interview, the signals each one weighs, and a framework to iterate on every
            rejection instead of taking it personally.
          </p>

          {/* TL;DR */}
          <div className="rounded-2xl border border-rc-border bg-rc-surface p-6 mb-12">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-red font-bold mb-3">
              TL;DR
            </p>
            <ul className="space-y-2 text-[14px] text-rc-muted leading-[1.7]">
              <li>
                <strong className="text-rc-text">3 filters</strong> stand between you and the
                interview: ATS (machine), HR (6-second human scan), hiring manager (signal
                review).
              </li>
              <li>
                <strong className="text-rc-text">9 red flags</strong> kill your CV at the HR
                layer in seconds.
              </li>
              <li>
                <strong className="text-rc-text">Tone</strong> tells the hiring manager your
                seniority before they read a single bullet.
              </li>
              <li>
                <strong className="text-rc-text">Each rejection is data.</strong> Iterate on
                it. The fastest hires are not the most talented — they iterate fastest.
              </li>
            </ul>
          </div>

          <div className="space-y-12 text-[16px] leading-[1.8] text-rc-text">
            {/* Part 1: The pipeline */}
            <section>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold">
                Part 1
              </span>
              <h2 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.02em] text-rc-text mt-2 mb-6">
                The invisible pipeline
              </h2>
              <p className="text-rc-muted mb-4">
                A single mid-sized tech job posting receives 200 to 1,000+ applications.
                Manual review at that volume is impossible — not out of laziness, out of
                arithmetic. So between &ldquo;Submit&rdquo; and &ldquo;Unfortunately…&rdquo;,
                three filters stand in the way.
              </p>
            </section>

            {/* Layer 1 */}
            <section>
              <h3 className="text-[22px] md:text-[26px] font-semibold tracking-[-0.02em] text-rc-text mb-3">
                Layer 1 — The ATS
              </h3>
              <p className="text-rc-muted mb-4">
                The Applicant Tracking System is software, not a human. It parses your CV into
                plain text and scores keyword overlap with the job description. It does not
                read between the lines. It does not look at your projects.
              </p>
              <p className="text-rc-muted mb-4">
                If your CV lists a skill in a fancy box, the ATS may not catch it. If the JD
                says &ldquo;Kubernetes&rdquo; and you wrote &ldquo;K8s&rdquo;, the match
                weakens. The ATS is dumb on purpose. Once you understand that, passing it
                becomes a checklist.
              </p>
              <p className="text-rc-muted">
                Full breakdown:{' '}
                <Link
                  href="/en/guides/how-to-pass-ats"
                  className="text-rc-red no-underline hover:underline font-medium"
                >
                  How to pass ATS in 2026
                </Link>
                .
              </p>
            </section>

            {/* Layer 2 */}
            <section>
              <h3 className="text-[22px] md:text-[26px] font-semibold tracking-[-0.02em] text-rc-text mb-3">
                Layer 2 — The HR recruiter (6-second scan)
              </h3>
              <p className="text-rc-muted mb-4">
                If your CV passes the ATS, it lands in front of a human — usually an HR
                recruiter, not a developer. Someone who may not know the difference between
                Python and JavaScript, or between mid-level and senior. That sounds unfair, but
                the math forces it: developers cannot review every CV that survives the ATS.
              </p>
              <p className="text-rc-muted mb-4">
                <strong className="text-rc-text">6 seconds.</strong> That&rsquo;s the average
                time an HR recruiter spends making the keep-or-cut decision. They do not read.
                They scan. They look at your current title, the companies you have worked at,
                tenure length, and whether anything visually stands out — for the right or
                wrong reason.
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-red font-bold mt-8 mb-4">
                The 9 red flags that kill your CV at this layer
              </p>
              <div className="space-y-4">
                {[
                  {
                    n: '01',
                    title: 'Short stays at every company',
                    body:
                      'Pattern reads as: trouble staying consistent. Likely to lose motivation again.',
                  },
                  {
                    n: '02',
                    title: 'Big unexplained gaps between jobs',
                    body:
                      'What happened during those gaps? Side projects? Burnout? Money? Without context, the recruiter assumes the worst.',
                  },
                  {
                    n: '03',
                    title: '2+ pages with less than 10 years of experience',
                    body:
                      'Reads as inflated content. The bar for adding length is high — most engineers under 10 years should fit on one page.',
                  },
                  {
                    n: '04',
                    title: 'Too colorful, too many graphics',
                    body:
                      'Heavy design reads as compensation. Clean structure beats fancy layout every time.',
                  },
                  {
                    n: '05',
                    title: 'Font too fancy or too small',
                    body:
                      'If it is hard to read in 6 seconds, it gets cut. Skim-ability matters more than aesthetics.',
                  },
                  {
                    n: '06',
                    title: 'Unprofessional touches',
                    body:
                      'Selfie profile photo, dragonslayer2003@hotmail.com, typos. Each one shaves credibility. A few combined kill it.',
                  },
                  {
                    n: '07',
                    title: 'Inconsistencies CV ↔ LinkedIn',
                    body:
                      'Overlapping job dates. 5 years of experience but graduated 3 years ago. Title on CV different from LinkedIn. One inconsistency makes the recruiter doubt all of it.',
                  },
                  {
                    n: '08',
                    title: 'Too many skills',
                    body:
                      'Listing 40 technologies does not prove competence — it signals inflation. Pick the 8–12 you actually use.',
                  },
                  {
                    n: '09',
                    title: '"Familiar with…" sections',
                    body:
                      'Code for: I have not actually used this. Recruiters and hiring managers both read this as filler.',
                  },
                ].map((rf) => (
                  <div
                    key={rf.n}
                    className="rounded-xl border border-rc-border bg-rc-surface p-5"
                  >
                    <div className="flex items-baseline gap-3 mb-1">
                      <span className="font-mono text-[11px] text-rc-red tracking-[0.16em]">
                        {rf.n}
                      </span>
                      <h4 className="text-[16px] font-semibold text-rc-text leading-tight">
                        {rf.title}
                      </h4>
                    </div>
                    <p className="text-[14px] text-rc-muted leading-[1.65] pl-[40px]">
                      {rf.body}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {/* Layer 3 */}
            <section>
              <h3 className="text-[22px] md:text-[26px] font-semibold tracking-[-0.02em] text-rc-text mb-3">
                Layer 3 — The hiring manager (signal review)
              </h3>
              <p className="text-rc-muted mb-4">
                If you pass HR, your CV finally reaches someone technical. They will work
                with you, manage you, or be your future colleague. They know what the job
                requires because they do it themselves. They look at your application
                completely differently from HR.
              </p>
              <p className="text-rc-muted mb-4">
                The first thing a technical hiring manager often does is open your GitHub.
                Not to read every line. To get a feel. Do you code outside of work? Are your
                projects real or tutorial clones? Do your repos have READMEs? Is there recent
                activity, or was the last commit two years ago?
              </p>
              <p className="text-rc-muted mb-4">
                They cross-reference CV ↔ LinkedIn ↔ GitHub — not necessarily to catch lies,
                but because consistency reduces uncertainty. The single question they keep
                asking themselves is: <em>is this candidate experienced enough for the job?</em>
              </p>
              <p className="text-rc-muted">
                In a pool of 10–20 shortlisted candidates, &ldquo;almost senior&rdquo; loses
                to &ldquo;clearly senior&rdquo; every single time.
              </p>
            </section>

            {/* Mid-article CTA */}
            <div className="rounded-2xl border border-rc-red/30 bg-rc-red/5 p-6 my-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-red font-bold mb-2">
                Audit all three layers in 60 seconds
              </p>
              <p className="text-rc-text text-[15px] leading-[1.7] mb-4">
                RejectCheck runs your CV against the ATS layer, the HR scan layer (red-flag
                detection, format audit), and the hiring manager layer (GitHub signal,
                LinkedIn consistency, seniority audit) — tailored to one specific job.
              </p>
              <Link
                href="/en/analyze"
                className="inline-flex items-center gap-2 bg-rc-red text-white font-mono text-[11px] tracking-[0.14em] uppercase px-5 py-2.5 rounded-lg hover:bg-[#b83332] transition-all duration-200 no-underline"
              >
                Run free diagnosis →
              </Link>
            </div>

            {/* Part 2: Blind spots */}
            <section>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold">
                Part 2
              </span>
              <h2 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.02em] text-rc-text mt-2 mb-6">
                The blind spots
              </h2>
              <p className="text-rc-muted mb-4">
                Bold guess: you are probably suited for the job. What stands between you and
                it is the gap between reality and what your CV shows. Your application is a
                story. To you it is obvious. To the HR and the hiring manager, it is hard to
                read.
              </p>
              <p className="text-rc-muted mb-4">
                Classic example: you spent 6 months building a payment system that handled
                thousands of transactions a day, dealt with edge cases, integrated external
                APIs, and shipped to production without a single incident. Your CV says:{' '}
                <em>&ldquo;Worked on backend payment features.&rdquo;</em>
              </p>
              <p className="text-rc-muted">
                That gap is what kills you — not the skills.
              </p>
            </section>

            {/* The seniority trap */}
            <section>
              <h3 className="text-[22px] md:text-[26px] font-semibold tracking-[-0.02em] text-rc-text mb-3">
                The seniority trap — junior vs senior signals
              </h3>
              <p className="text-rc-muted mb-6">
                Most developers do not know what level they actually read at. Their CV is
                signaling — they just do not see it. The hiring manager picks up on tone
                within seconds.
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
                    <li>— Only side projects on GitHub</li>
                    <li>— No metrics, only task descriptions</li>
                    <li>— Passive voice throughout</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-rc-red/30 bg-rc-red/5 p-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-red font-bold mb-3">
                    Senior signals
                  </p>
                  <ul className="space-y-2 text-[14px] text-rc-muted leading-[1.7]">
                    <li>— &ldquo;I owned and shipped…&rdquo;</li>
                    <li>— &ldquo;I designed and led…&rdquo;</li>
                    <li>— &ldquo;I architected the frontend&rdquo;</li>
                    <li>— Live projects with users</li>
                    <li>— Impact metrics (latency, scale, $$, users)</li>
                    <li>— Active voice, ownership language</li>
                  </ul>
                </div>
              </div>

              <p className="text-rc-muted mt-6">
                Same person, same work — different framing. The hiring manager reads
                seniority off the verbs before they reach the bullet&rsquo;s content.
              </p>
            </section>

            {/* Each job is a story */}
            <section>
              <h3 className="text-[22px] md:text-[26px] font-semibold tracking-[-0.02em] text-rc-text mb-3">
                Each job has its own story too
              </h3>
              <p className="text-rc-muted mb-4">
                Two companies post the exact same job title with the exact same required
                skills. One is a Series A startup that needs someone to build fast and break
                things. The other is a scale-up that needs someone to stabilize a codebase
                that grew too fast. Same title. Same tech. Completely different ideal
                candidate.
              </p>
              <p className="text-rc-muted">
                Your CV needs to speak the same language as the job&rsquo;s story. Not lie —
                tell. Before applying, spend 10 minutes on these questions: what problem is
                this company trying to solve by hiring? What do they expect 6 months from
                now? 1 year from now? Then ask: does my CV speak the same language?
              </p>
            </section>

            {/* Online presence */}
            <section>
              <h3 className="text-[22px] md:text-[26px] font-semibold tracking-[-0.02em] text-rc-text mb-3">
                Your online presence is part of the application
              </h3>
              <p className="text-rc-muted mb-4">
                Your CV is half the story. GitHub, LinkedIn, anything indexable on Google —
                all of it is part of your application, whether you optimize it or not. The
                hiring manager will look. The cross-reference is not optional from their side.
              </p>
              <p className="text-rc-muted">
                Reverse the exercise. Find developers on LinkedIn who already have the job
                you want. Spend 30 minutes per profile. Read their CV, GitHub, LinkedIn,
                Google search. Map the timeline. What do they do? What would you change about
                yours? The ones who got hired are not magic — their pattern is visible.
              </p>
            </section>

            {/* Part 3: Plan */}
            <section>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold">
                Part 3
              </span>
              <h2 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.02em] text-rc-text mt-2 mb-6">
                The plan — iterate, do not blind-shot
              </h2>
              <p className="text-rc-muted mb-4">
                The real issue is not skill. It is system. Most developers apply blind. Each
                application is a one-off. No feedback loop. No data captured. Two hundred
                applications later, they have learned nothing.
              </p>
              <p className="text-rc-muted mb-8">
                The moment you treat rejections as data, the math changes. You are not
                someone who got rejected 200 times. You are someone who ran 200 experiments.
                Some taught you the CV was unclear. Some taught you the level was off. Some
                taught you the GitHub was sending the wrong signal. Each rejection — painful
                as it is — is information.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="rounded-2xl border border-rc-border bg-rc-surface p-6">
                  <span className="font-mono text-[11px] text-rc-red tracking-[0.16em]">
                    01
                  </span>
                  <h4 className="text-[16px] font-semibold text-rc-text mt-3 mb-3">
                    Before applying
                  </h4>
                  <ul className="space-y-1.5 text-[13px] text-rc-muted leading-[1.65]">
                    <li>— Audit CV / GitHub / LinkedIn</li>
                    <li>— Read your CV from a stranger&rsquo;s POV</li>
                    <li>— Ask: is the story clear?</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-rc-border bg-rc-surface p-6">
                  <span className="font-mono text-[11px] text-rc-red tracking-[0.16em]">
                    02
                  </span>
                  <h4 className="text-[16px] font-semibold text-rc-text mt-3 mb-3">
                    For the job
                  </h4>
                  <ul className="space-y-1.5 text-[13px] text-rc-muted leading-[1.65]">
                    <li>— Mirror JD&rsquo;s exact keywords</li>
                    <li>— Adapt your story to theirs</li>
                    <li>— Confirm seniority alignment</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-rc-border bg-rc-surface p-6">
                  <span className="font-mono text-[11px] text-rc-red tracking-[0.16em]">
                    03
                  </span>
                  <h4 className="text-[16px] font-semibold text-rc-text mt-3 mb-3">
                    After rejection
                  </h4>
                  <ul className="space-y-1.5 text-[13px] text-rc-muted leading-[1.65]">
                    <li>— Treat it as data, not failure</li>
                    <li>— Identify which layer cut you</li>
                    <li>— Adjust for the next application</li>
                  </ul>
                </div>
              </div>

              <p className="text-rc-muted mt-8 mb-4">
                Doing all of this manually for every job is exhausting — reading the JD,
                cross-referencing the CV, checking keyword match, auditing GitHub, scanning
                LinkedIn. It is a lot. That is the reason RejectCheck exists. I built it
                because I needed it. It worked for me. It is free to try.
              </p>
            </section>

            {/* Related guides */}
            <section className="border-t border-rc-border pt-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold mb-3">
                Go deeper
              </p>
              <ul className="space-y-2 text-[14px] leading-[1.7]">
                <li>
                  →{' '}
                  <Link
                    href="/en/guides/software-engineer-resume-tips"
                    className="text-rc-red no-underline hover:underline font-medium"
                  >
                    Software Engineer Resume Tips — 12 rules ranked by impact
                  </Link>
                </li>
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
                    Get a deep CV review for your specific role
                  </Link>
                </li>
              </ul>
            </section>

            {/* Author + external */}
            <section className="border-t border-rc-border pt-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold mb-3">
                About the author
              </p>
              <p className="text-rc-muted text-[14px] leading-[1.7] mb-4">
                Lenny Garnier — junior software engineer, founder of RejectCheck. Got rejected
                200+ times before building the tool I wished existed.
              </p>
              <p className="text-rc-muted text-[14px] leading-[1.7]">
                A longer narrative version of this guide lives on Medium:{' '}
                <a
                  href="https://medium.com/@lennygarnier"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rc-red no-underline hover:underline font-medium"
                >
                  Why Developers Get Rejected (And Never Find Out Why) ↗
                </a>
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
              Stop applying blind. Start iterating.
            </h2>
            <p className="text-rc-muted text-[14px] mb-6">
              Free first scan. ATS + HR red flags + hiring manager signals — one pass.
            </p>
            <Link
              href="/en/analyze"
              className="inline-flex items-center gap-2.5 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-7 py-3.5 rounded-xl hover:bg-[#b83332] transition-all duration-200 no-underline"
            >
              Run free diagnosis →
            </Link>
          </div>
        </article>

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
