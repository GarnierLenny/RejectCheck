import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Navbar } from '../../../components/Navbar'
import { SeoFooter } from '../../../components/SeoFooter'
import { BlueprintCta } from '../../../components/BlueprintCta'
import {
  JsonLd,
  SITE_URL,
  articleSchema,
  breadcrumbSchema,
  faqPageSchema,
  softwareApplicationSchema,
} from '../../../components/JsonLd'
import { hasLocale, type Locale } from '../dictionaries'

const PAGE_PATH = '/ats-checker'
const PUBLISHED_ISO = '2026-04-29'
const LAST_UPDATED_ISO = '2026-04-29'
const canonicalFor = (lang: Locale) => `${SITE_URL}/${lang}${PAGE_PATH}`

type Card3 = { step: string; title: string; body: string }
type Card2 = { label: string; body: string }
type CrossLink = { href: string; label: string }
type Faq = { question: string; answer: string }

type Copy = {
  title: string
  description: string
  bcHome: string
  bcCurrent: string
  eyebrow: string
  h1Pre: string
  h1Em: string
  h1Post: string
  heroSub: string
  heroCta: string
  heroReassure: string
  s1Eyebrow: string
  s1H2: string
  s1Body: string
  s1Cards: Card3[]
  s2Eyebrow: string
  s2H2: string
  s2Cards: Card2[]
  s3Eyebrow: string
  s3H2: string
  s3Body: string
  s3Links: CrossLink[]
  faqEyebrow: string
  faqH2: string
  faqItems: Faq[]
  ctaH2: string
  ctaSub: string
  ctaBtn: string
}

const COPY: Record<Locale, Copy> = {
  en: {
    title: 'Free ATS Resume Checker for Developers',
    description:
      'Free ATS resume checker, optimised for developers and works for any role. Simulates the automated filter that screens most CVs out before a human reads them. Find missing keywords and exact fixes.',
    bcHome: 'Home',
    bcCurrent: 'ATS Checker',
    eyebrow: 'ATS Checker · Optimised for devs. Works for any role.',
    h1Pre: 'See exactly why ATS filters',
    h1Em: 'reject your resume',
    h1Post: 'before recruiters do.',
    heroSub:
      'Free ATS resume checker tailored to developer roles. Paste a job description, upload your CV, get the exact missing keywords with point values, formatting flags, and actionable fixes — in under 60 seconds.',
    heroCta: 'Run free ATS check',
    heroReassure: 'No signup · No CV stored · Tailored to one job',
    s1Eyebrow: 'Why this matters',
    s1H2: 'A single tech job posting gets 200–1,000 applications. ATS filters cut that to 20–50 before a human reads anything.',
    s1Body:
      'The ATS is dumb on purpose: it parses your CV into plain text and scores keyword overlap with the job description. It does not read between the lines. If your skills are in a fancy box, listed as “K8s” when the JD says “Kubernetes”, or hidden behind a multi-column layout, the ATS does not see them. You get auto-rejected without a single second of human attention.',
    s1Cards: [
      { step: '01', title: 'Parse', body: 'The ATS extracts raw text from your PDF. Tables, columns, text boxes, and images often break this step entirely.' },
      { step: '02', title: 'Match', body: 'It scores keyword overlap with the job description: hard skills, soft skills, titles, certifications. Synonyms count less. Exact phrasing wins.' },
      { step: '03', title: 'Filter', body: 'Below a match threshold, your application is auto-rejected or buried. The recruiter never sees it. You get silence or a templated email.' },
    ],
    s2Eyebrow: 'What the ATS checker returns',
    s2H2: 'Not just a score. The exact fixes, ordered by point impact.',
    s2Cards: [
      { label: 'ATS score / 100', body: 'Match percentage between your CV and the target job description, calibrated to recruiter pass thresholds (typically 70+).' },
      { label: 'Missing keywords with point values', body: 'Each missing keyword from the JD with its weight ("Kubernetes +11 pts", "GraphQL +9 pts") so you know exactly what to add and where.' },
      { label: 'Format and parsing flags', body: 'Multi-column layouts, embedded images, non-standard headings, fonts that fail OCR — anything that would silently break ATS extraction.' },
      { label: 'Synonym and phrasing audit', body: '"K8s" vs "Kubernetes", "TS" vs "TypeScript", "JS" vs "JavaScript". The ATS scores exact matches higher. We flag every mismatch.' },
    ],
    s3Eyebrow: 'The ATS is layer one',
    s3H2: 'Passing the ATS is necessary, not sufficient.',
    s3Body:
      'After the ATS, an HR recruiter scans your CV for an average of 6 seconds looking for red flags. Then a hiring manager evaluates your GitHub, LinkedIn, and seniority signals. RejectCheck audits all three layers in one pass — not just the ATS.',
    s3Links: [
      { href: '/guides/how-to-pass-ats', label: 'Read: How to pass ATS in 2026 →' },
      { href: '/guides/why-developers-get-rejected', label: 'Read: Why developers get rejected →' },
      { href: '/software-engineer-cv', label: 'Software engineer CV guide →' },
      { href: '/resume-checker', label: 'Full resume checker →' },
    ],
    faqEyebrow: 'FAQ',
    faqH2: 'ATS checker — what developers ask',
    faqItems: [
      { question: 'What is an ATS checker?', answer: 'An ATS checker simulates the Applicant Tracking System that recruiters use to filter resumes before a human review. It scores your CV against a job description, surfaces missing keywords, and flags formatting issues that break automated parsing.' },
      { question: 'Is this ATS checker free?', answer: 'Yes. The first analysis on RejectCheck is free, no signup required. You upload your CV and paste the target job description — you get an ATS score with the exact missing keywords and their point values.' },
      { question: 'How is RejectCheck different from Jobscan or Resume Worded?', answer: 'Most ATS checkers stop at keyword matching. RejectCheck adds a role-aware layer: GitHub signal audit for engineers, portfolio and case-study scoring for PMs and designers, technical skill gap radar, seniority audit, and red-flag detection (vague titles, passive voice, employment gaps).' },
      { question: 'Why do ATS systems reject so many resumes?', answer: 'ATS parsers extract plain text from your CV and look for keyword overlap with the job description. Multi-column layouts, text boxes, images, and creative section headings break parsing. Even strong candidates get filtered out by formatting alone before a recruiter sees them.' },
      { question: 'What is the difference between an ATS checker and a resume checker?', answer: 'An ATS checker only tests the automated filter layer (keyword match, parsing). A resume checker like RejectCheck also evaluates how a human recruiter and a hiring manager will read your CV — tone, seniority signals, GitHub/LinkedIn consistency, and structural red flags.' },
    ],
    ctaH2: 'Run a free ATS check on your CV right now.',
    ctaSub: 'No signup. No data stored. Tailored to one specific job.',
    ctaBtn: 'Run free ATS check',
  },
  fr: {
    title: 'Test CV ATS Gratuit pour Développeurs',
    description:
      'Checker ATS gratuit, optimisé pour les développeurs et adapté à tout métier. Simule le filtre automatique qui élimine la plupart des CV avant qu’un humain les lise. Trouve les mots-clés manquants et les corrections exactes.',
    bcHome: 'Accueil',
    bcCurrent: 'Checker ATS',
    eyebrow: 'Checker ATS · Optimisé pour les devs. Marche pour tous les métiers.',
    h1Pre: 'Vois exactement pourquoi les filtres ATS',
    h1Em: 'rejettent ton CV',
    h1Post: 'avant même les recruteurs.',
    heroSub:
      'Test CV ATS gratuit, taillé pour les profils dev. Colle une offre d’emploi, dépose ton CV, et récupère les mots-clés manquants avec leur poids, les problèmes de mise en forme et les corrections concrètes — en moins de 60 secondes.',
    heroCta: 'Tester mon CV gratuitement',
    heroReassure: 'Sans inscription · CV non conservé · Calé sur une offre',
    s1Eyebrow: 'Pourquoi c’est crucial',
    s1H2: 'Une seule offre tech reçoit 200 à 1 000 candidatures. Les filtres ATS la réduisent à 20–50 avant qu’un humain ne lise quoi que ce soit.',
    s1Body:
      'L’ATS est bête par conception : il convertit ton CV en texte brut et score le recouvrement de mots-clés avec l’offre. Il ne lit pas entre les lignes. Si tes compétences sont dans un joli encadré, écrites « K8s » alors que l’offre dit « Kubernetes », ou cachées derrière une mise en page multi-colonnes, l’ATS ne les voit pas. Tu es rejeté automatiquement, sans une seconde d’attention humaine.',
    s1Cards: [
      { step: '01', title: 'Lecture', body: 'L’ATS extrait le texte brut de ton PDF. Tableaux, colonnes, zones de texte et images cassent souvent complètement cette étape.' },
      { step: '02', title: 'Correspondance', body: 'Il score le recouvrement de mots-clés avec l’offre : compétences techniques, soft skills, intitulés, certifications. Les synonymes comptent moins. La formulation exacte gagne.' },
      { step: '03', title: 'Filtrage', body: 'Sous un certain seuil de correspondance, ta candidature est rejetée automatiquement ou enterrée. Le recruteur ne la voit jamais. Tu n’as que le silence ou un mail type.' },
    ],
    s2Eyebrow: 'Ce que le checker ATS te renvoie',
    s2H2: 'Pas juste un score. Les corrections exactes, classées par impact en points.',
    s2Cards: [
      { label: 'Score ATS / 100', body: 'Pourcentage de correspondance entre ton CV et l’offre visée, calibré sur les seuils de passage des recruteurs (souvent 70+).' },
      { label: 'Mots-clés manquants avec leur poids', body: 'Chaque mot-clé manquant de l’offre avec son poids (« Kubernetes +11 pts », « GraphQL +9 pts ») pour savoir exactement quoi ajouter et où.' },
      { label: 'Alertes de format et de lecture', body: 'Mise en page multi-colonnes, images intégrées, intitulés non standards, polices qui passent mal à l’OCR — tout ce qui casserait silencieusement la lecture ATS.' },
      { label: 'Audit des synonymes et formulations', body: '« K8s » vs « Kubernetes », « TS » vs « TypeScript », « JS » vs « JavaScript ». L’ATS favorise les correspondances exactes. On signale chaque écart.' },
    ],
    s3Eyebrow: 'L’ATS n’est que la première couche',
    s3H2: 'Passer l’ATS est nécessaire, pas suffisant.',
    s3Body:
      'Après l’ATS, un recruteur RH scanne ton CV pendant 6 secondes en moyenne à la recherche de signaux d’alerte. Puis un manager évalue ton GitHub, ton LinkedIn et tes signaux de séniorité. RejectCheck audite ces trois couches en une seule passe — pas seulement l’ATS.',
    s3Links: [
      { href: '/guides/how-to-pass-ats', label: 'Lire : Comment passer l’ATS en 2026 →' },
      { href: '/guides/why-developers-get-rejected', label: 'Lire : Pourquoi les développeurs sont rejetés →' },
      { href: '/software-engineer-cv', label: 'Guide du CV d’ingénieur logiciel →' },
      { href: '/resume-checker', label: 'Le checker de CV complet →' },
    ],
    faqEyebrow: 'FAQ',
    faqH2: 'Checker ATS — ce que les devs demandent',
    faqItems: [
      { question: 'C’est quoi un checker ATS ?', answer: 'Un checker ATS simule l’Applicant Tracking System que les recruteurs utilisent pour filtrer les CV avant toute lecture humaine. Il score ton CV face à une offre d’emploi, fait remonter les mots-clés manquants et signale les problèmes de mise en forme qui cassent la lecture automatique.' },
      { question: 'Ce checker ATS est-il gratuit ?', answer: 'Oui. La première analyse sur RejectCheck est gratuite, sans inscription. Tu déposes ton CV et tu colles l’offre visée — tu obtiens un score ATS avec les mots-clés manquants exacts et leur poids en points.' },
      { question: 'En quoi RejectCheck diffère de Jobscan ou Resume Worded ?', answer: 'La plupart des checkers ATS s’arrêtent au matching de mots-clés. RejectCheck ajoute une couche par métier : audit des signaux GitHub pour les ingénieurs, scoring du portfolio et des études de cas pour les PM et designers, radar des lacunes techniques, audit de séniorité et détection de signaux d’alerte (intitulés vagues, voix passive, trous dans le parcours).' },
      { question: 'Pourquoi les ATS rejettent autant de CV ?', answer: 'Les ATS extraient le texte brut de ton CV et cherchent le recouvrement de mots-clés avec l’offre. Mises en page multi-colonnes, zones de texte, images et intitulés de sections créatifs cassent la lecture. Même de bons candidats sont éliminés par la seule mise en forme, avant qu’un recruteur ne voie le CV.' },
      { question: 'Quelle différence entre un checker ATS et un checker de CV ?', answer: 'Un checker ATS ne teste que la couche de filtrage automatique (matching de mots-clés, lecture). Un checker de CV comme RejectCheck évalue aussi comment un recruteur humain et un manager liront ton CV — ton, signaux de séniorité, cohérence GitHub/LinkedIn et signaux d’alerte structurels.' },
    ],
    ctaH2: 'Teste ton CV face à l’ATS, maintenant et gratuitement.',
    ctaSub: 'Sans inscription. Aucune donnée conservée. Calé sur une offre précise.',
    ctaBtn: 'Tester mon CV gratuitement',
  },
}

type LangParams = { lang: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<LangParams>
}): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang)) return {}
  const c = COPY[lang]
  const canonical = canonicalFor(lang)

  return {
    title: c.title,
    description: c.description,
    alternates: {
      canonical,
      languages: {
        en: canonicalFor('en'),
        fr: canonicalFor('fr'),
        'x-default': canonicalFor('en'),
      },
    },
    openGraph: {
      title: c.title,
      description: c.description,
      url: canonical,
      locale: lang === 'fr' ? 'fr_FR' : 'en_US',
      siteName: 'RejectCheck',
      images: [{ url: `${SITE_URL}/og?lang=${lang}`, width: 1200, height: 630, alt: 'RejectCheck' }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: c.title,
      description: c.description,
      images: [`${SITE_URL}/og?lang=${lang}`],
    },
  }
}

export default async function AtsCheckerPage({
  params,
}: {
  params: Promise<LangParams>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  const c = COPY[lang]
  const base = `/${lang}`
  const canonical = canonicalFor(lang)

  const breadcrumbs = breadcrumbSchema([
    { name: c.bcHome, url: `${SITE_URL}/${lang}` },
    { name: c.bcCurrent, url: canonical },
  ])

  const article = articleSchema({
    headline: c.title,
    description: c.description,
    url: canonical,
    datePublished: PUBLISHED_ISO,
    dateModified: LAST_UPDATED_ISO,
    locale: lang,
  })

  return (
    <>
      <JsonLd id="ld-breadcrumb-ats-checker" data={breadcrumbs} />
      <JsonLd id="ld-faq-ats-checker" data={faqPageSchema(c.faqItems)} />
      <JsonLd id="ld-article-ats-checker" data={article} />
      <JsonLd id="ld-app-ats-checker" data={softwareApplicationSchema(lang)} />

      <div className="bg-rc-bg text-rc-text font-sans min-h-screen">
        <Navbar />

        {/* Hero */}
        <section className="max-w-[1100px] mx-auto px-5 md:px-[40px] pt-20 pb-16 md:pt-28 md:pb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px w-6 bg-rc-red" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-red">
              {c.eyebrow}
            </span>
          </div>
          <h1 className="text-[40px] md:text-[58px] font-semibold leading-[1.08] tracking-[-0.025em] text-rc-text max-w-[820px] mb-6">
            {c.h1Pre}{' '}
            <span
              className="text-rc-red italic"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {c.h1Em}
            </span>{' '}
            {c.h1Post}
          </h1>
          <p className="text-rc-muted text-[16px] md:text-[17px] leading-[1.7] max-w-[620px] mb-10">
            {c.heroSub}
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link
              href={`${base}/analyze`}
              className="inline-flex items-center gap-2.5 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-7 py-3.5 rounded-xl hover:bg-[#b83332] transition-all duration-200 no-underline"
            >
              {c.heroCta}
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M7.5 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <span className="font-mono text-[11px] text-rc-hint tracking-wide">
              {c.heroReassure}
            </span>
          </div>
        </section>

        {/* What an ATS does */}
        <section className="border-t-[0.5px] border-rc-border bg-rc-surface-hero">
          <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-20 md:py-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-rc-border" />
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
                {c.s1Eyebrow}
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-6 max-w-[680px]">
              {c.s1H2}
            </h2>
            <p className="text-rc-muted text-[15px] md:text-[16px] leading-[1.7] max-w-[700px] mb-12">
              {c.s1Body}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {c.s1Cards.map((card) => (
                <div key={card.step} className="rounded-2xl border border-rc-border bg-rc-surface p-6">
                  <span className="font-mono text-[11px] text-rc-red tracking-[0.16em]">{card.step}</span>
                  <h3 className="text-[18px] font-semibold text-rc-text mt-3 mb-2">{card.title}</h3>
                  <p className="text-[14px] text-rc-muted leading-[1.65]">{card.body}</p>
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
                {c.s2Eyebrow}
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-12 max-w-[640px]">
              {c.s2H2}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {c.s2Cards.map((f) => (
                <div key={f.label} className="rounded-2xl border border-rc-border bg-rc-surface p-6">
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
                {c.s3Eyebrow}
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-6 max-w-[680px]">
              {c.s3H2}
            </h2>
            <p className="text-rc-muted text-[15px] md:text-[16px] leading-[1.7] max-w-[700px] mb-8">
              {c.s3Body}
            </p>
            <div className="flex flex-wrap gap-3">
              {c.s3Links.map((l) => (
                <Link
                  key={l.href}
                  href={`${base}${l.href}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rc-border bg-rc-surface font-mono text-[11px] tracking-wide text-rc-text hover:border-rc-red transition-colors no-underline"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t-[0.5px] border-rc-border bg-rc-bg">
          <div className="max-w-[900px] mx-auto px-5 md:px-[40px] py-20 md:py-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-6 bg-rc-red" />
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-red">
                {c.faqEyebrow}
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-10">
              {c.faqH2}
            </h2>
            <div className="space-y-3">
              {c.faqItems.map((item) => (
                <details key={item.question} className="group rounded-xl border border-rc-border bg-rc-surface">
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
                    <p className="text-rc-muted text-[14px] md:text-[15px] leading-[1.7]">{item.answer}</p>
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
              {c.ctaH2}
            </h2>
            <p className="font-mono text-[12px] md:text-[13px] tracking-[0.06em] text-rc-hint mb-8">
              {c.ctaSub}
            </p>
            <Link
              href={`${base}/analyze`}
              className="inline-flex items-center gap-2.5 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-8 py-4 rounded-xl hover:bg-[#b83332] transition-all duration-200 no-underline"
            >
              {c.ctaBtn}
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M7.5 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </section>

        <BlueprintCta lang={lang} />
        <SeoFooter lang={lang} />
      </div>
    </>
  )
}
