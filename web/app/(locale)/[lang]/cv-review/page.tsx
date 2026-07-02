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
  softwareApplicationSchema,
} from '../../../components/JsonLd'
import { hasLocale, type Locale } from '../dictionaries'

const PAGE_PATH = '/cv-review'
const PUBLISHED_ISO = '2026-04-29'
const LAST_UPDATED_ISO = '2026-04-29'
const canonicalFor = (lang: Locale) => `${SITE_URL}/${lang}${PAGE_PATH}`

type Lens = { label: string; body: string }
type Deliverable = { n: string; title: string; body: string }
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
  diffEyebrow: string
  diffH2: string
  diffBody: string
  scoreLabel: string
  scoreH3: string
  scoreItems: string[]
  scoreFootPre: string
  scoreFootLink: string
  reviewLabel: string
  reviewH3: string
  reviewItems: string[]
  reviewFoot: string
  lensEyebrow: string
  lensH2: string
  lenses: Lens[]
  midH2: string
  midSub: string
  midCta: string
  deliverEyebrow: string
  deliverH2: string
  deliverables: Deliverable[]
  faqEyebrow: string
  faqH2: string
  faqItems: Faq[]
  ctaH2: string
  ctaSub: string
  ctaBtn: string
  footerCopy: string
  footerSeCv: string
  footerResumeChecker: string
  footerAtsChecker: string
  footerPricing: string
  footerPrivacy: string
}

const COPY: Record<Locale, Copy> = {
  en: {
    title: 'Deep CV Review for Developers',
    description:
      'Deep CV review tailored to a specific role: tone, seniority signals, GitHub coherence. The critique a hiring manager would write. Free.',
    bcHome: 'Home',
    bcCurrent: 'CV Review',
    eyebrow: 'Deep CV Review · Optimised for devs. Works for any role.',
    h1Pre: 'Not a CV score.',
    h1Em: 'A real CV review',
    h1Post: '— the one a hiring manager would write.',
    heroSub:
      'A score tells you something is broken. A review tells you what to change, line by line. Tone, seniority phrasing, narrative coherence, GitHub coherence — read like a debrief, not a checklist.',
    heroCta: 'Get my CV reviewed free',
    heroReassure: 'Anchored to a specific role · Plain-English critique',
    diffEyebrow: 'The difference',
    diffH2: 'An ATS score and a CV review answer different questions.',
    diffBody:
      'Both are useful. They are not interchangeable. If you have already passed an ATS check and still keep getting silence, the gap is at the next layer — narrative and signaling — and a score will not surface it.',
    scoreLabel: 'ATS / Resume score',
    scoreH3: 'Did the machine pass me?',
    scoreItems: [
      '— Match percentage vs JD keywords',
      '— Format and parsing flags',
      '— Missing keywords with point values',
      '— Output: a number + a fix list',
    ],
    scoreFootPre: 'Right tool when you want a quick pass/fail before submitting. ',
    scoreFootLink: 'Use the resume checker →',
    reviewLabel: 'Deep CV review',
    reviewH3: 'Why is this not landing interviews?',
    reviewItems: [
      '— Tone and seniority signaling per bullet',
      '— Narrative coherence across sections',
      '— GitHub vs CV vs LinkedIn cross-check',
      '— Output: a written debrief + before/after rewrites',
    ],
    reviewFoot: 'Right tool when the score is fine but you still get silence.',
    lensEyebrow: 'What the review actually looks at',
    lensH2: 'Five lenses. Each one is what a different reader weighs.',
    lenses: [
      {
        label: 'Tone — does this read at the right level?',
        body:
          'Active vs passive voice, ownership claims, level of abstraction. "Helped build" reads two levels below "owned and shipped". The review surfaces every bullet where the verb undersells the work.',
      },
      {
        label: 'Narrative — does the story hold together?',
        body:
          'Job changes, promotions, tenure, gaps. Does the trajectory make sense? Are there silent reversals (senior title, then junior title) that need addressing? A coherent story reduces uncertainty for the reader.',
      },
      {
        label: 'Signal — does GitHub back the CV?',
        body:
          'If your CV claims production-level Kubernetes, your GitHub should not show only React tutorials. The review cross-references commit history, language distribution, and project relevance against your stated stack.',
      },
      {
        label: 'Positioning — are you the right candidate for this role?',
        body:
          'Anchored to the job description you provide. Where you are clearly aligned, where you over-pitch, where you under-pitch. Specific feedback per role, not a generic CV grade.',
      },
      {
        label: 'Specificity — are bullets concrete?',
        body:
          'Generic bullets ("worked with cross-functional teams", "improved system performance") read as filler. The review flags vague claims and rewrites the worst offenders with concrete numbers and verbs.',
      },
      {
        label: 'Consistency — CV ↔ LinkedIn ↔ GitHub',
        body:
          'Title differences, overlapping dates, claimed years of experience versus graduation year, recommendations that contradict the CV. Each inconsistency reduces trust by a measurable amount.',
      },
    ],
    midH2: 'Get the kind of feedback a senior would give over coffee.',
    midSub:
      'Anchored to a real role. Plain-English critique. Before/after rewrites for the bullets that need it most.',
    midCta: 'Run free deep review →',
    deliverEyebrow: 'What you get back',
    deliverH2: 'A review that reads like a real debrief.',
    deliverables: [
      {
        n: '01',
        title: 'A written critique, not a checklist',
        body:
          'Top 5-7 findings expressed in plain English: what stood out, what raised doubt, what would land differently with the hiring manager. Each finding is anchored to a specific section or bullet of your CV.',
      },
      {
        n: '02',
        title: 'Before / after rewrites for high-impact bullets',
        body:
          'For the 3-5 weakest bullets, you get a concrete suggested rewrite — same content, stronger phrasing. Side-by-side so you can see what changed and why.',
      },
      {
        n: '03',
        title: 'Priority-ordered fix list',
        body:
          'Every finding ranked by impact on this specific role. Apply the top 3 first. This is not a 40-item generic checklist — it is the few changes that actually move the application.',
      },
      {
        n: '04',
        title: 'Cross-application coherence call-out',
        body:
          'If your GitHub or LinkedIn weakens or contradicts the CV story, you get a clear, named flag — with the exact item that triggers it. Most candidates never see these because they only review the CV in isolation.',
      },
    ],
    faqEyebrow: 'FAQ',
    faqH2: 'Deep CV review — what developers ask',
    faqItems: [
      {
        question: 'What is a CV review and how is it different from a CV check?',
        answer:
          'A check is binary and fast: did your CV match the keywords, did it pass parsing, what is the score. A review is qualitative: how does the narrative read, does the tone match the seniority you are claiming, does your GitHub back the story, are the bullets specific or vague. The output of a check is a number; the output of a review is feedback you can act on, line by line.',
      },
      {
        question: 'Is the review written in plain English or just structured scores?',
        answer:
          'Plain English. Each finding is phrased the way a senior hiring manager would write it in a one-on-one debrief: what stood out, what raised doubt, what to change first. Where useful, you get before/after rewrites of specific bullets — not just labels like "weak verb".',
      },
      {
        question: 'Does the review look at GitHub and LinkedIn?',
        answer:
          'Yes. The review treats your CV, GitHub, and LinkedIn as one application. Inconsistencies between them — title differences, claimed skills with no commit history, projects on the CV that no longer exist on GitHub — are flagged with the same weight a recruiter or hiring manager would give them.',
      },
      {
        question: 'How is the review tailored to a specific role?',
        answer:
          'You paste the target job description. The review is then anchored to that role: which of your bullets are relevant, which read off-target, where your seniority signaling matches the role level and where it slips. A generic review tells you what is wrong; a role-anchored review tells you what to fix for this specific opportunity.',
      },
      {
        question: 'How long does a deep review take?',
        answer:
          'Under 60 seconds. The review runs as a multi-pass Claude pipeline: a fast Sonnet diagnostic (ATS fit, narrative, technical signal, red flags) plus a Haiku synthesis pass that cross-references your CV, LinkedIn and GitHub for consistency. Speed comes from streaming the diagnostic first, not from skipping depth.',
      },
      {
        question: 'Will the review rewrite my CV or just critique it?',
        answer:
          'The free deep review returns the critique with prioritized fixes and example rewrites for the highest-impact bullets. A full surgical rewrite (with all fixes applied and a clean PDF export) is a premium feature — but the diagnosis itself is free, and you can apply the fixes manually.',
      },
    ],
    ctaH2: 'Stop guessing why your CV is not landing. Get the critique.',
    ctaSub: 'Anchored to one role. Plain-English. Before/after rewrites included.',
    ctaBtn: 'Get my CV reviewed free',
    footerCopy: '© RejectCheck — Optimised for developers',
    footerSeCv: 'SE CV Guide',
    footerResumeChecker: 'Resume Checker',
    footerAtsChecker: 'ATS Checker',
    footerPricing: 'Pricing',
    footerPrivacy: 'Privacy (GDPR)',
  },
  fr: {
    title: 'Revue de CV Approfondie pour Développeurs',
    description:
      'Revue de CV approfondie, calée sur une offre précise : ton, signaux de séniorité, cohérence GitHub. La critique qu’un manager écrirait sur ton CV. Gratuit.',
    bcHome: 'Accueil',
    bcCurrent: 'Revue de CV',
    eyebrow: 'Revue de CV approfondie · Optimisée pour les devs. Marche pour tous les métiers.',
    h1Pre: 'Pas un score.',
    h1Em: 'Une vraie revue de CV',
    h1Post: '— celle qu’un manager écrirait.',
    heroSub:
      'Un score te dit que quelque chose cloche. Une revue te dit quoi changer, ligne par ligne. Ton, formulation de la séniorité, cohérence du récit, cohérence GitHub — ça se lit comme un débrief, pas comme une checklist.',
    heroCta: 'Faire relire mon CV gratuitement',
    heroReassure: 'Calée sur une offre précise · Critique en français clair',
    diffEyebrow: 'La différence',
    diffH2: 'Un score ATS et une revue de CV répondent à deux questions différentes.',
    diffBody:
      'Les deux sont utiles. Ils ne sont pas interchangeables. Si tu as déjà passé un test ATS et que tu n’as toujours que du silence, l’écart se situe à la couche suivante — le récit et les signaux — et un score ne le fera jamais ressortir.',
    scoreLabel: 'Score ATS / CV',
    scoreH3: 'Est-ce que la machine m’a laissé passer ?',
    scoreItems: [
      '— Pourcentage de correspondance avec les mots-clés de l’offre',
      '— Alertes de format et de lecture automatique',
      '— Mots-clés manquants avec leur poids',
      '— Résultat : un chiffre + une liste de corrections',
    ],
    scoreFootPre: 'L’outil quand tu veux un oui/non rapide avant d’envoyer. ',
    scoreFootLink: 'Utiliser le checker de CV →',
    reviewLabel: 'Revue de CV approfondie',
    reviewH3: 'Pourquoi ça ne décroche pas d’entretiens ?',
    reviewItems: [
      '— Ton et signaux de séniorité, ligne par ligne',
      '— Cohérence du récit d’une section à l’autre',
      '— Recoupement GitHub vs CV vs LinkedIn',
      '— Résultat : un débrief écrit + des réécritures avant/après',
    ],
    reviewFoot: 'L’outil quand le score est bon mais que tu n’as toujours que du silence.',
    lensEyebrow: 'Ce que la revue regarde vraiment',
    lensH2: 'Cinq angles. Chacun correspond à ce qu’un lecteur différent évalue.',
    lenses: [
      {
        label: 'Ton — est-ce que ça se lit au bon niveau ?',
        body:
          'Voix active ou passive, prise de responsabilité, niveau d’abstraction. « A aidé à construire » se lit deux niveaux en dessous de « a pris en charge et livré ». La revue fait ressortir chaque ligne où le verbe sous-vend le travail.',
      },
      {
        label: 'Récit — est-ce que l’histoire tient debout ?',
        body:
          'Changements de poste, promotions, ancienneté, trous. La trajectoire a-t-elle du sens ? Y a-t-il des reculs silencieux (titre senior, puis titre junior) qu’il faut adresser ? Un récit cohérent réduit l’incertitude pour le lecteur.',
      },
      {
        label: 'Signal — est-ce que GitHub appuie le CV ?',
        body:
          'Si ton CV annonce du Kubernetes en production, ton GitHub ne devrait pas montrer que des tutos React. La revue recoupe l’historique des commits, la répartition des langages et la pertinence des projets avec la stack que tu affiches.',
      },
      {
        label: 'Positionnement — es-tu le bon candidat pour cette offre ?',
        body:
          'Calée sur l’offre d’emploi que tu fournis. Où tu es clairement aligné, où tu te survends, où tu te sous-vends. Un retour précis pour cette offre, pas une note de CV générique.',
      },
      {
        label: 'Précision — tes lignes sont-elles concrètes ?',
        body:
          'Les lignes génériques (« travail avec des équipes pluridisciplinaires », « amélioration des performances du système ») se lisent comme du remplissage. La revue signale les formulations vagues et réécrit les pires avec des chiffres et des verbes concrets.',
      },
      {
        label: 'Cohérence — CV ↔ LinkedIn ↔ GitHub',
        body:
          'Différences d’intitulés, dates qui se chevauchent, années d’expérience affichées face à l’année de diplôme, recommandations qui contredisent le CV. Chaque incohérence fait baisser la confiance d’un cran mesurable.',
      },
    ],
    midH2: 'Reçois le genre de retour qu’un senior te donnerait autour d’un café.',
    midSub:
      'Calée sur une vraie offre. Critique en français clair. Réécritures avant/après pour les lignes qui en ont le plus besoin.',
    midCta: 'Lancer la revue gratuite →',
    deliverEyebrow: 'Ce que tu récupères',
    deliverH2: 'Une revue qui se lit comme un vrai débrief.',
    deliverables: [
      {
        n: '01',
        title: 'Une critique écrite, pas une checklist',
        body:
          'Les 5 à 7 points principaux exprimés en français clair : ce qui ressort, ce qui sème le doute, ce qui passerait différemment auprès du manager. Chaque point est rattaché à une section ou une ligne précise de ton CV.',
      },
      {
        n: '02',
        title: 'Réécritures avant / après des lignes à fort impact',
        body:
          'Pour les 3 à 5 lignes les plus faibles, tu reçois une réécriture concrète — même contenu, formulation plus forte. Côte à côte, pour voir ce qui change et pourquoi.',
      },
      {
        n: '03',
        title: 'Liste de corrections classée par priorité',
        body:
          'Chaque point classé par impact sur cette offre précise. Applique les 3 premiers d’abord. Ce n’est pas une checklist générique de 40 lignes — ce sont les quelques changements qui font vraiment bouger la candidature.',
      },
      {
        n: '04',
        title: 'Alerte de cohérence entre tes supports',
        body:
          'Si ton GitHub ou ton LinkedIn affaiblit ou contredit le récit du CV, tu reçois une alerte claire et nommée — avec l’élément exact qui la déclenche. La plupart des candidats ne les voient jamais parce qu’ils relisent leur CV en isolation.',
      },
    ],
    faqEyebrow: 'FAQ',
    faqH2: 'Revue de CV approfondie — ce que les devs demandent',
    faqItems: [
      {
        question: 'C’est quoi une revue de CV et en quoi elle diffère d’un test de CV ?',
        answer:
          'Un test est binaire et rapide : ton CV a-t-il matché les mots-clés, a-t-il passé la lecture automatique, quel est le score. Une revue est qualitative : comment se lit le récit, le ton colle-t-il à la séniorité que tu revendiques, ton GitHub appuie-t-il l’histoire, tes lignes sont-elles précises ou vagues. Le résultat d’un test est un chiffre ; le résultat d’une revue, c’est un retour exploitable, ligne par ligne.',
      },
      {
        question: 'La revue est-elle en français clair ou juste des scores structurés ?',
        answer:
          'En français clair. Chaque point est formulé comme un manager senior l’écrirait dans un débrief en tête-à-tête : ce qui ressort, ce qui sème le doute, ce qu’il faut changer en premier. Quand c’est utile, tu reçois des réécritures avant/après de lignes précises — pas juste des étiquettes du genre « verbe faible ».',
      },
      {
        question: 'La revue regarde-t-elle GitHub et LinkedIn ?',
        answer:
          'Oui. La revue traite ton CV, ton GitHub et ton LinkedIn comme une seule candidature. Les incohérences entre eux — différences d’intitulés, compétences revendiquées sans historique de commits, projets sur le CV qui n’existent plus sur GitHub — sont signalées avec le même poids qu’un recruteur ou un manager leur donnerait.',
      },
      {
        question: 'Comment la revue est-elle calée sur une offre précise ?',
        answer:
          'Tu colles l’offre d’emploi visée. La revue est alors ancrée à cette offre : quelles lignes sont pertinentes, lesquelles sonnent à côté, là où tes signaux de séniorité collent au niveau du poste et là où ça dérape. Une revue générique te dit ce qui ne va pas ; une revue calée sur l’offre te dit quoi corriger pour cette opportunité précise.',
      },
      {
        question: 'Combien de temps prend une revue approfondie ?',
        answer:
          'Moins de 60 secondes. La revue est un pipeline Claude multi-passe : un diagnostic Sonnet rapide (compatibilité ATS, récit, signal technique, red flags) plus une passe de synthèse Haiku qui croise ton CV, ton LinkedIn et ton GitHub pour vérifier la cohérence. La rapidité vient du streaming du diagnostic d’abord, pas d’un raccourci sur la profondeur.',
      },
      {
        question: 'La revue va-t-elle réécrire mon CV ou juste le critiquer ?',
        answer:
          'La revue approfondie gratuite te renvoie la critique avec des corrections priorisées et des exemples de réécriture pour les lignes à plus fort impact. La réécriture complète au scalpel (avec toutes les corrections appliquées et un export PDF propre) est une fonctionnalité premium — mais le diagnostic lui-même est gratuit, et tu peux appliquer les corrections à la main.',
      },
    ],
    ctaH2: 'Arrête de deviner pourquoi ton CV ne décroche rien. Reçois la critique.',
    ctaSub: 'Calée sur une offre. En français clair. Réécritures avant/après incluses.',
    ctaBtn: 'Faire relire mon CV gratuitement',
    footerCopy: '© RejectCheck — Optimisé pour les développeurs',
    footerSeCv: 'Guide CV ingénieur logiciel',
    footerResumeChecker: 'Checker de CV',
    footerAtsChecker: 'Checker ATS',
    footerPricing: 'Tarifs',
    footerPrivacy: 'Confidentialité (RGPD)',
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

export default async function CvReviewPage({
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
      <JsonLd id="ld-breadcrumb-cv-review" data={breadcrumbs} />
      <JsonLd id="ld-faq-cv-review" data={faqPageSchema(c.faqItems)} />
      <JsonLd id="ld-article-cv-review" data={article} />
      <JsonLd id="ld-app-cv-review" data={softwareApplicationSchema(lang)} />

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
          <h1 className="text-[40px] md:text-[58px] font-semibold leading-[1.08] tracking-[-0.025em] text-rc-text max-w-[860px] mb-6">
            {c.h1Pre}{' '}
            <span
              className="text-rc-red italic"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {c.h1Em}
            </span>{' '}
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

        {/* Score vs Review */}
        <section className="border-t-[0.5px] border-rc-border bg-rc-surface-hero">
          <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-20 md:py-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-rc-border" />
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
                {c.diffEyebrow}
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-6 max-w-[700px]">
              {c.diffH2}
            </h2>
            <p className="text-rc-muted text-[15px] leading-[1.7] max-w-[700px] mb-10">
              {c.diffBody}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-rc-border bg-rc-surface p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold mb-3">
                  {c.scoreLabel}
                </p>
                <h3 className="text-[18px] font-semibold text-rc-text mb-3 leading-tight">
                  {c.scoreH3}
                </h3>
                <ul className="space-y-2 text-[14px] text-rc-muted leading-[1.7]">
                  {c.scoreItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="mt-4 text-[13px] text-rc-hint">
                  {c.scoreFootPre}
                  <Link
                    href={`${base}/resume-checker`}
                    className="text-rc-red no-underline hover:underline font-medium"
                  >
                    {c.scoreFootLink}
                  </Link>
                </p>
              </div>

              <div className="rounded-2xl border border-rc-red/30 bg-rc-red/5 p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-red font-bold mb-3">
                  {c.reviewLabel}
                </p>
                <h3 className="text-[18px] font-semibold text-rc-text mb-3 leading-tight">
                  {c.reviewH3}
                </h3>
                <ul className="space-y-2 text-[14px] text-rc-muted leading-[1.7]">
                  {c.reviewItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                <p className="mt-4 text-[13px] text-rc-hint">
                  {c.reviewFoot}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What the review covers */}
        <section className="border-t-[0.5px] border-rc-border">
          <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-20 md:py-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-rc-border" />
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
                {c.lensEyebrow}
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-12 max-w-[680px]">
              {c.lensH2}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {c.lenses.map((f) => (
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

        {/* Mid CTA */}
        <section className="border-t-[0.5px] border-rc-border bg-rc-surface-hero">
          <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-16 md:py-20">
            <div className="rounded-2xl border border-rc-red/30 bg-rc-red/5 p-8 text-center">
              <h2 className="text-[22px] md:text-[28px] font-semibold tracking-[-0.02em] text-rc-text mb-4 max-w-[640px] mx-auto">
                {c.midH2}
              </h2>
              <p className="text-rc-muted text-[14px] mb-6 max-w-[520px] mx-auto">
                {c.midSub}
              </p>
              <Link
                href={`${base}/analyze`}
                className="inline-flex items-center gap-2 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-7 py-3 rounded-xl hover:bg-[#b83332] transition-all duration-200 no-underline"
              >
                {c.midCta}
              </Link>
            </div>
          </div>
        </section>

        {/* What you get back */}
        <section className="border-t-[0.5px] border-rc-border">
          <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-20 md:py-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-rc-border" />
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
                {c.deliverEyebrow}
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-12 max-w-[640px]">
              {c.deliverH2}
            </h2>

            <div className="space-y-5">
              {c.deliverables.map((s) => (
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

        <footer className="border-t-[0.5px] border-rc-border py-6 px-5 md:px-[40px] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-mono text-[13px] text-rc-muted">
            {c.footerCopy}
          </div>
          <div className="flex gap-6 flex-wrap justify-center">
            <Link
              href={`${base}/software-engineer-cv`}
              className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline hover:text-rc-text"
            >
              {c.footerSeCv}
            </Link>
            <Link
              href={`${base}/resume-checker`}
              className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline hover:text-rc-text"
            >
              {c.footerResumeChecker}
            </Link>
            <Link
              href={`${base}/ats-checker`}
              className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline hover:text-rc-text"
            >
              {c.footerAtsChecker}
            </Link>
            <Link
              href={`${base}/pricing`}
              className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline hover:text-rc-text"
            >
              {c.footerPricing}
            </Link>
            <Link
              href={`${base}/privacy`}
              className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline hover:text-rc-text"
            >
              {c.footerPrivacy}
            </Link>
          </div>
        </footer>
      </div>
    </>
  )
}
