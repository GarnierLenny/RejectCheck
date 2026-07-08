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

const PAGE_PATH = '/resume-checker'
const PUBLISHED_ISO = '2026-04-29'
const LAST_UPDATED_ISO = '2026-04-29'
const canonicalFor = (lang: Locale) => `${SITE_URL}/${lang}${PAGE_PATH}`

type Card3 = { step: string; title: string; body: string }
type Card2 = { label: string; body: string }
type CrossLink = { href: string; label: string; primary?: boolean }
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
  s3H2: string
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
    title: 'AI Resume Checker for Developers',
    description:
      'Resume checker optimised for developers — works for any role. Audits seniority signals, GitHub activity, LinkedIn consistency, and the red flags rejected in 6 seconds. Free.',
    bcHome: 'Home',
    bcCurrent: 'Resume Checker',
    eyebrow: 'Resume Checker · Optimised for devs. Works for any role.',
    h1Pre: 'An AI resume checker that goes',
    h1Em: 'past the ATS',
    h1Post: '.',
    heroSub:
      'Most resume checkers stop at keyword matching. RejectCheck audits the three layers that actually filter your application: ATS, HR scan, and hiring manager review. Tailored to one specific job. Free first scan.',
    heroCta: 'Check my resume free',
    heroReassure: '60 seconds · No CV stored · Tailored to one job',
    s1Eyebrow: 'Why rejection feels like a black box',
    s1H2: 'Three filters stand between “Submit application” and the interview. You could be failing at any of them and never know.',
    s1Body:
      'A standard resume checker scores you on layer one. RejectCheck audits all three.',
    s1Cards: [
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
    ],
    s2Eyebrow: 'What the resume checker returns',
    s2H2: 'A full diagnosis. Not a generic score.',
    s2Cards: [
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
    ],
    s3H2: 'Go deeper',
    s3Links: [
      { href: '/cv-review', label: 'Want a deep written review instead? CV Review →', primary: true },
      { href: '/software-engineer-cv', label: 'Software engineer CV guide →' },
      { href: '/ats-checker', label: 'Free ATS checker →' },
      { href: '/guides/why-developers-get-rejected', label: 'Guide: Why developers get rejected →' },
      { href: '/guides/how-to-pass-ats', label: 'Guide: How to pass ATS in 2026 →' },
      { href: '/alternatives', label: 'vs Jobscan / Rezi / Resume Worded →' },
    ],
    faqEyebrow: 'FAQ',
    faqH2: 'Resume checker — what developers ask',
    faqItems: [
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
          'Generic resume checkers grade tone and grammar against template rules. RejectCheck audits role-specific signals: GitHub commit patterns and repo quality for engineers, portfolio coherence and case-study depth for PMs and designers, LinkedIn consistency, "I worked on" vs "I owned and shipped" tone. It is calibrated for engineering hires, but works for any role.',
      },
      {
        question: 'Will the resume checker rewrite my CV?',
        answer:
          'The free scan returns the diagnosis: missing keywords, format flags, red flags, seniority assessment, and prioritized fixes. CV rewrite (with the fixes applied surgically and PDF export) is a premium feature.',
      },
      {
        question: 'How long does the resume check take?',
        answer:
          'Under 60 seconds. Upload a CV PDF, paste the target job description, optionally add GitHub username and a LinkedIn PDF export. A multi-pass Claude pipeline (Sonnet diagnostic + Haiku multi-source cross-check) runs the audits in parallel.',
      },
      {
        question: 'What does a good resume look like for the hiring manager layer?',
        answer:
          'Active voice over passive ("I owned and shipped" vs "I helped build"), measurable impact ("used by 10k users", "reduced p95 latency by 40%") over task lists, GitHub activity that backs the CV claims, and seniority signals (ownership, leadership, production systems) that match the role level.',
      },
    ],
    ctaH2: 'Run a full resume check on your CV right now.',
    ctaSub: 'ATS + HR + hiring manager — one pass, three layers, 60 seconds.',
    ctaBtn: 'Check my resume free',
  },
  fr: {
    title: 'Checker de CV IA pour Développeurs',
    description:
      'Checker de CV optimisé pour les développeurs — et adapté à tout métier. Audite tes signaux de séniorité, ton activité GitHub, la cohérence LinkedIn et les signaux d’alerte rejetés en 6 secondes. Gratuit.',
    bcHome: 'Accueil',
    bcCurrent: 'Checker de CV',
    eyebrow: 'Checker de CV · Optimisé pour les devs. Marche pour tous les métiers.',
    h1Pre: 'Un checker de CV IA qui va',
    h1Em: 'plus loin que l’ATS',
    h1Post: '.',
    heroSub:
      'La plupart des checkers de CV s’arrêtent au matching de mots-clés. RejectCheck audite les trois couches qui filtrent vraiment ta candidature : l’ATS, le scan RH et la lecture du manager. Calé sur une offre précise. Première analyse gratuite.',
    heroCta: 'Analyser ton CV gratuitement',
    heroReassure: '60 secondes · CV non conservé · Calé sur une offre',
    s1Eyebrow: 'Pourquoi le rejet ressemble à une boîte noire',
    s1H2: 'Trois filtres se dressent entre « Envoyer ma candidature » et l’entretien. Tu peux échouer à n’importe lequel sans jamais le savoir.',
    s1Body:
      'Un checker de CV classique te note sur la première couche. RejectCheck audite les trois.',
    s1Cards: [
      {
        step: '01',
        title: 'ATS — le filtre automatique',
        body:
          'Convertit ton CV en texte brut et score le recouvrement de mots-clés avec l’offre. Élimine tout ce qui passe sous le seuil. La mise en forme casse la lecture bien plus que les candidats ne l’imaginent.',
      },
      {
        step: '02',
        title: 'Recruteur RH — le scan en 6 secondes',
        body:
          'Un recruteur non technique scanne à la recherche de signaux d’alerte : postes courts, trous dans le parcours, 2 pages et plus avec moins de 10 ans d’expérience, graphismes tape-à-l’œil, fautes, incohérences CV ↔ LinkedIn.',
      },
      {
        step: '03',
        title: 'Manager — la lecture des signaux',
        body:
          'Un lead technique ouvre ton GitHub. Tes projets sont-ils réels ou des clones de tutos ? Ton ton sonne-t-il junior ou senior ? Ton CV correspond-il à la séniorité exigée par le poste ?',
      },
    ],
    s2Eyebrow: 'Ce que le checker de CV te renvoie',
    s2H2: 'Un diagnostic complet. Pas un score générique.',
    s2Cards: [
      {
        label: 'Sortie du checker ATS',
        body:
          'Score de correspondance, mots-clés manquants avec leur poids, alertes de format et de lecture. Comme un checker ATS classique — sauf que ce n’est que l’étape un.',
      },
      {
        label: 'Radar des lacunes techniques',
        body:
          'Carte visuelle de ta stack technique face aux exigences de l’offre : là où tu sur-indexes, là où tu es court, et de combien.',
      },
      {
        label: 'Audit des signaux GitHub & LinkedIn',
        body:
          'Qualité de l’historique de commits, READMEs des repos, pertinence des projets, cohérence LinkedIn-CV, recommandations. Les signaux qu’un manager vérifie vraiment.',
      },
      {
        label: 'Audit de séniorité',
        body:
          '« J’ai travaillé sur » vs « J’ai porté et livré ». « J’ai utilisé React » vs « J’ai architecturé le frontend ». Détecte quand ton ton sonne un cran en dessous de ce que le poste exige.',
      },
      {
        label: 'Détection des signaux d’alerte',
        body:
          'Trous dans le parcours, intitulés vagues, voix passive, dates qui se chevauchent, listes de compétences gonflées, sections « Notions de… » — les schémas qui déclenchent le rejet automatique.',
      },
      {
        label: 'Liste de corrections priorisée',
        body:
          'Chaque constat classé par impact sur l’offre précise. Applique les 3 corrections du haut en premier. Réécriture du CV en un clic (premium) en option, appliquée au scalpel.',
      },
    ],
    s3H2: 'Aller plus loin',
    s3Links: [
      { href: '/cv-review', label: 'Tu veux plutôt une revue écrite approfondie ? CV Review →', primary: true },
      { href: '/software-engineer-cv', label: 'Guide du CV d’ingénieur logiciel →' },
      { href: '/ats-checker', label: 'Checker ATS gratuit →' },
      { href: '/guides/why-developers-get-rejected', label: 'Guide : Pourquoi les développeurs sont rejetés →' },
      { href: '/guides/how-to-pass-ats', label: 'Guide : Comment passer l’ATS en 2026 →' },
      { href: '/alternatives', label: 'vs Jobscan / Rezi / Resume Worded →' },
    ],
    faqEyebrow: 'FAQ',
    faqH2: 'Checker de CV — ce que les devs demandent',
    faqItems: [
      {
        question: 'Que vérifie réellement le checker de CV ?',
        answer:
          'Trois couches : la couche ATS (matching de mots-clés face à l’offre), la couche RH (signaux d’alerte qu’un recruteur repère en un scan de 6 secondes) et la couche manager (signaux de séniorité, activité GitHub, cohérence LinkedIn, pertinence des projets). Une seule passe, trois perspectives.',
      },
      {
        question: 'C’est un checker ATS ou quelque chose de plus complet ?',
        answer:
          'Il intègre un checker ATS complet (scoring de mots-clés, alertes de lecture, compétences manquantes avec leur poids) — mais il ne s’arrête pas là. La plupart des rejets arrivent après l’ATS, au scan RH ou à la lecture du manager. Les checkers qui ne notent que l’ATS passent à côté de 70 % des raisons de rejet des développeurs.',
      },
      {
        question: 'En quoi est-ce différent des checkers de CV génériques ?',
        answer:
          'Les checkers de CV génériques notent le ton et la grammaire selon des règles de templates. RejectCheck audite des signaux propres au métier : patterns de commits GitHub et qualité des repos pour les ingénieurs, cohérence du portfolio et profondeur des études de cas pour les PM et designers, cohérence LinkedIn, ton « J’ai travaillé sur » vs « J’ai porté et livré ». Il est calibré pour le recrutement tech, mais marche pour tous les métiers.',
      },
      {
        question: 'Le checker de CV va-t-il réécrire mon CV ?',
        answer:
          'L’analyse gratuite te renvoie le diagnostic : mots-clés manquants, alertes de format, signaux d’alerte, évaluation de séniorité et corrections priorisées. La réécriture du CV (avec les corrections appliquées au scalpel et l’export PDF) est une fonctionnalité premium.',
      },
      {
        question: 'Combien de temps prend l’analyse du CV ?',
        answer:
          'Moins de 60 secondes. Dépose ton CV en PDF, colle l’offre visée, et ajoute en option ton pseudo GitHub et un export PDF de ton LinkedIn. Un pipeline Claude multi-passe (diagnostic Sonnet + croisement multi-source Haiku) lance les audits en parallèle.',
      },
      {
        question: 'À quoi ressemble un bon CV pour la couche manager ?',
        answer:
          'Voix active plutôt que passive (« J’ai porté et livré » vs « J’ai aidé à construire »), impact mesurable (« utilisé par 10k utilisateurs », « latence p95 réduite de 40 % ») plutôt que des listes de tâches, une activité GitHub qui appuie les affirmations du CV, et des signaux de séniorité (ownership, leadership, systèmes en production) qui collent au niveau du poste.',
      },
    ],
    ctaH2: 'Lance une analyse complète de ton CV, maintenant.',
    ctaSub: 'ATS + RH + manager — une seule passe, trois couches, 60 secondes.',
    ctaBtn: 'Analyser ton CV gratuitement',
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
      // Re-declared so X renders an image (custom twitter object suppresses the auto card image).
      images: [`${SITE_URL}/og?lang=${lang}`],
    },
  }
}

export default async function ResumeCheckerPage({
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
      <JsonLd id="ld-breadcrumb-resume-checker" data={breadcrumbs} />
      <JsonLd id="ld-faq-resume-checker" data={faqPageSchema(c.faqItems)} />
      <JsonLd id="ld-article-resume-checker" data={article} />
      <JsonLd id="ld-app-resume-checker" data={softwareApplicationSchema(lang)} />

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
            <span className="text-rc-red">
              {c.h1Em}
            </span>
            {c.h1Post}
          </h1>
          <p className="text-rc-muted text-[16px] md:text-[17px] leading-[1.7] max-w-[640px] mb-10">
            {c.heroSub}
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link
              href={`${base}/analyze`}
              className="inline-flex items-center gap-2.5 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-7 py-3.5 rounded-xl hover:bg-[#b83332] transition-all duration-200 no-underline"
            >
              {c.heroCta}
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
              {c.heroReassure}
            </span>
          </div>
        </section>

        {/* The 3 layers */}
        <section className="border-t-[0.5px] border-rc-border bg-rc-surface-hero">
          <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-20 md:py-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-rc-border" />
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
                {c.s1Eyebrow}
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-6 max-w-[700px]">
              {c.s1H2}
            </h2>
            <p className="text-rc-muted text-[15px] md:text-[16px] leading-[1.7] max-w-[700px] mb-12">
              {c.s1Body}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {c.s1Cards.map((card) => (
                <div
                  key={card.step}
                  className="rounded-2xl border border-rc-border bg-rc-surface p-6"
                >
                  <span className="font-mono text-[11px] text-rc-red tracking-[0.16em]">
                    {card.step}
                  </span>
                  <h3 className="text-[18px] font-semibold text-rc-text mt-3 mb-2 leading-tight">
                    {card.title}
                  </h3>
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
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-12 max-w-[680px]">
              {c.s2H2}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {c.s2Cards.map((f) => (
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
              {c.s3H2}
            </h2>
            <div className="flex flex-wrap gap-3">
              {c.s3Links.map((l) => (
                <Link
                  key={l.href}
                  href={`${base}${l.href}`}
                  className={
                    l.primary
                      ? 'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rc-red/30 bg-rc-red/5 font-mono text-[11px] tracking-wide text-rc-text hover:border-rc-red transition-colors no-underline'
                      : 'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-rc-border bg-rc-surface font-mono text-[11px] tracking-wide text-rc-text hover:border-rc-red transition-colors no-underline'
                  }
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

        <BlueprintCta lang={lang} />
        <SeoFooter lang={lang} />
      </div>
    </>
  )
}
