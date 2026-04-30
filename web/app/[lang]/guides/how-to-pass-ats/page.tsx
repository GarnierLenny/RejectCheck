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
  howToPassAtsSchema,
} from '../../../components/JsonLd'
import { hasLocale } from '../../dictionaries'

const PAGE_PATH = '/guides/how-to-pass-ats'
const PUBLISHED_ISO = '2026-04-29'
const LAST_UPDATED_ISO = '2026-04-29'
const CANONICAL = `${SITE_URL}/en${PAGE_PATH}`

const TITLE = 'How to Pass ATS in 2026 — A Developer’s Guide'
const DESCRIPTION =
  'Step-by-step for developers: how ATS works, the format traps that break parsing, and the keyword + structure rules that get your CV through to a human.'

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
    question: 'Do all companies use ATS?',
    answer:
      'Most medium-to-large companies do, especially in tech. A single posting can receive 200 to 1,000+ applications — manual review at that volume is impossible. The ATS is a filter, not a choice.',
  },
  {
    question: 'Will using exact keywords feel like keyword stuffing?',
    answer:
      'No, if it is honest. The ATS rewards exact matches because it cannot judge meaning. If the JD says "Kubernetes" and you have used it, write "Kubernetes" — not "K8s", not "container orchestration". The recruiter who reads next will not penalize you for matching the language they used.',
  },
  {
    question: 'Should I have a different CV per job application?',
    answer:
      'You should at minimum tune the skills and bullet phrasing to mirror the JD. Same content, different surface. ATS scoring is per-job — a CV optimized for one role is not optimized for another.',
  },
  {
    question: 'PDF or DOCX — what does the ATS prefer?',
    answer:
      'Most modern ATS handle both. The format is less important than the structure: single column, standard headings, no images, no text boxes. A clean PDF beats a fancy DOCX every time.',
  },
  {
    question: 'How do I know if my CV passes the ATS?',
    answer:
      'Run it through an ATS checker against the specific job description. RejectCheck simulates the parsing and scoring layer and returns the missing keywords with point values plus any format flags that would break parsing.',
  },
]

export default async function HowToPassAtsPage({
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
    { name: 'How to Pass ATS', url: CANONICAL },
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
      <JsonLd id="ld-breadcrumb-how-to-pass-ats" data={breadcrumbs} />
      <JsonLd id="ld-faq-how-to-pass-ats" data={faqPageSchema(FAQ_ITEMS)} />
      <JsonLd id="ld-article-how-to-pass-ats" data={article} />
      <JsonLd id="ld-howto-how-to-pass-ats" data={howToPassAtsSchema(CANONICAL)} />

      <div className="bg-rc-bg text-rc-text font-sans min-h-screen">
        <Navbar />

        <article className="max-w-[760px] mx-auto px-5 md:px-[40px] pt-16 pb-20 md:pt-24 md:pb-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-6 bg-rc-red" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-red">
              Guide · 12 min read
            </span>
          </div>

          <h1 className="text-[36px] md:text-[52px] font-semibold leading-[1.1] tracking-[-0.025em] text-rc-text mb-6">
            How to pass ATS in 2026 — a developer&rsquo;s guide.
          </h1>

          <p className="text-rc-muted text-[16px] md:text-[17px] leading-[1.7] mb-10">
            The Applicant Tracking System is the first filter between you and a job. It is dumb
            on purpose. Once you understand how it works, passing it becomes a checklist — not
            a mystery.
          </p>

          {/* TL;DR */}
          <div className="rounded-2xl border border-rc-border bg-rc-surface p-6 mb-12">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-red font-bold mb-3">
              TL;DR
            </p>
            <ul className="space-y-2 text-[14px] text-rc-muted leading-[1.7]">
              <li>
                <strong className="text-rc-text">1.</strong> Save your CV as a single-column
                PDF. No tables, no text boxes, no images.
              </li>
              <li>
                <strong className="text-rc-text">2.</strong> Use the exact keywords from the
                job description — &ldquo;Kubernetes&rdquo;, not &ldquo;K8s&rdquo;.
              </li>
              <li>
                <strong className="text-rc-text">3.</strong> Use standard section headings:
                Experience, Education, Skills, Projects.
              </li>
              <li>
                <strong className="text-rc-text">4.</strong> Verify against the specific job
                description with an ATS checker before submitting.
              </li>
            </ul>
          </div>

          <div className="space-y-12 text-[16px] leading-[1.8] text-rc-text">
            <section id="step-format">
              <h2 className="text-[26px] md:text-[30px] font-semibold tracking-[-0.02em] text-rc-text mb-4 mt-2">
                1. Format your CV for plain-text parsing
              </h2>
              <p className="text-rc-muted mb-4">
                The ATS extracts raw text from your PDF. It does not see your design. If your
                skills are in a fancy box, listed in a sidebar, or rendered as part of an image,
                the ATS often does not catch them at all.
              </p>
              <p className="text-rc-muted mb-4">
                The fix is structural, not aesthetic. A single-column layout with standard
                headings reads cleanly to both the ATS and the recruiter who comes next.
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold mt-6 mb-3">
                Format traps to avoid
              </p>
              <ul className="space-y-2 text-rc-muted">
                <li>— Multi-column layouts (skills in a sidebar, experience in the main column)</li>
                <li>— Tables for experience or skills sections</li>
                <li>— Text boxes, callouts, or speech-bubble graphics</li>
                <li>— Images with embedded text (logos, icons containing skill names)</li>
                <li>— Headers and footers (parsed inconsistently or skipped entirely)</li>
                <li>— Decorative fonts or font sizes below 10pt</li>
              </ul>
            </section>

            <section id="step-keywords">
              <h2 className="text-[26px] md:text-[30px] font-semibold tracking-[-0.02em] text-rc-text mb-4 mt-2">
                2. Mirror the job description&rsquo;s exact phrasing
              </h2>
              <p className="text-rc-muted mb-4">
                The ATS scores keyword overlap. It does not understand that &ldquo;K8s&rdquo;
                and &ldquo;Kubernetes&rdquo; are the same thing — at least not reliably. It
                does not know that &ldquo;React&rdquo; and &ldquo;React.js&rdquo; mean the
                same. Match the exact tokens the JD uses.
              </p>
              <p className="text-rc-muted mb-4">
                This is not stuffing. This is alignment. If you have used the technology, write
                it in the JD&rsquo;s language. The recruiter scanning your CV next will not
                penalize you for matching the role&rsquo;s vocabulary.
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold mt-6 mb-3">
                Where to place keywords
              </p>
              <ul className="space-y-2 text-rc-muted">
                <li>— A dedicated <strong className="text-rc-text">Skills</strong> section listing the JD&rsquo;s hard skills you have</li>
                <li>— Inside <strong className="text-rc-text">experience bullets</strong>, where the keyword has context (&ldquo;Built X with Kubernetes and Helm&rdquo;)</li>
                <li>— In your <strong className="text-rc-text">title or summary</strong> if the JD repeats it (e.g. &ldquo;Backend Engineer&rdquo;)</li>
                <li>— <strong className="text-rc-text">Not</strong> in white text or hidden fields — modern ATS detect this and penalize</li>
              </ul>
            </section>

            <section id="step-headings">
              <h2 className="text-[26px] md:text-[30px] font-semibold tracking-[-0.02em] text-rc-text mb-4 mt-2">
                3. Use standard section headings
              </h2>
              <p className="text-rc-muted mb-4">
                ATS parsers map content into structured fields by looking for known section
                labels. &ldquo;My Journey&rdquo;, &ldquo;Tech I Love&rdquo;, &ldquo;Things
                I&rsquo;ve Shipped&rdquo; sound personal but they may not map cleanly.
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold mt-6 mb-3">
                Use these labels
              </p>
              <ul className="space-y-2 text-rc-muted">
                <li>— <strong className="text-rc-text">Experience</strong> (or Work Experience / Professional Experience)</li>
                <li>— <strong className="text-rc-text">Education</strong></li>
                <li>— <strong className="text-rc-text">Skills</strong> (or Technical Skills)</li>
                <li>— <strong className="text-rc-text">Projects</strong> (especially valuable for junior devs)</li>
                <li>— <strong className="text-rc-text">Certifications</strong> if relevant</li>
              </ul>
            </section>

            {/* Mid-article CTA */}
            <div className="rounded-2xl border border-rc-red/30 bg-rc-red/5 p-6 my-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-red font-bold mb-2">
                Skip the guesswork
              </p>
              <p className="text-rc-text text-[15px] leading-[1.7] mb-4">
                Run your CV through the ATS checker against the actual job you want. You get
                the missing keywords with point values, format flags, and prioritized fixes —
                free, no signup.
              </p>
              <Link
                href="/en/analyze"
                className="inline-flex items-center gap-2 bg-rc-red text-white font-mono text-[11px] tracking-[0.14em] uppercase px-5 py-2.5 rounded-lg hover:bg-[#b83332] transition-all duration-200 no-underline"
              >
                Run free ATS check →
              </Link>
            </div>

            <section id="step-verify">
              <h2 className="text-[26px] md:text-[30px] font-semibold tracking-[-0.02em] text-rc-text mb-4 mt-2">
                4. Verify before you submit
              </h2>
              <p className="text-rc-muted mb-4">
                The ATS score is per-job. A CV that passes for one posting may fail for the
                next. Before you click submit, run an ATS check tailored to the specific job
                description. The fix list is small and concrete: usually 3 to 5 missing
                keywords plus one or two structural flags.
              </p>
              <p className="text-rc-muted mb-4">
                A 30-second check before applying changes the math. You go from blind shots to
                aimed iterations. Each rejection becomes a data point you can act on, not a
                silent failure.
              </p>
            </section>

            <section>
              <h2 className="text-[26px] md:text-[30px] font-semibold tracking-[-0.02em] text-rc-text mb-4 mt-2">
                After the ATS, three more layers
              </h2>
              <p className="text-rc-muted mb-4">
                Passing the ATS is necessary, not sufficient. Your CV next reaches an HR
                recruiter scanning for red flags in 6 seconds, then a hiring manager checking
                GitHub, LinkedIn, and seniority signals. A CV optimized for the ATS but stuffed
                with red flags still gets rejected — just one stage later.
              </p>
              <p className="text-rc-muted">
                The full breakdown of all three layers is here:{' '}
                <Link
                  href="/en/guides/why-developers-get-rejected"
                  className="text-rc-red no-underline hover:underline font-medium"
                >
                  Why developers get rejected
                </Link>
                .
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
              Now run the check on your CV.
            </h2>
            <p className="text-rc-muted text-[14px] mb-6">
              60 seconds. No signup. Tailored to one specific job description.
            </p>
            <Link
              href="/en/analyze"
              className="inline-flex items-center gap-2.5 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-7 py-3.5 rounded-xl hover:bg-[#b83332] transition-all duration-200 no-underline"
            >
              Run free ATS check →
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
