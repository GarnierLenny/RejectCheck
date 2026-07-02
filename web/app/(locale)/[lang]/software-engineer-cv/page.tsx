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

const PAGE_PATH = '/software-engineer-cv'
const PUBLISHED_ISO = '2026-04-29'
const LAST_UPDATED_ISO = '2026-04-29'
const canonicalFor = (lang: Locale) => `${SITE_URL}/${lang}${PAGE_PATH}`

type Layer = { step: string; title: string; body: string }
type Section = { n: string; title: string; body: string }
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
  s1Layers: Layer[]
  s2Eyebrow: string
  s2H2: string
  s2Sections: Section[]
  s3Eyebrow: string
  s3H2: string
  s3Body: string
  juniorLabel: string
  juniorItems: string[]
  seniorLabel: string
  seniorItems: string[]
  midEyebrow: string
  midH2: string
  midBody: string
  midBtn: string
  s4Eyebrow: string
  s4H2: string
  s4Body: string
  s4Links: CrossLink[]
  faqEyebrow: string
  faqH2: string
  faqItems: Faq[]
  ctaH2: string
  ctaSub: string
  ctaBtn: string
}

const COPY: Record<Locale, Copy> = {
  en: {
    title: 'Software Engineer CV Guide (2026)',
    description:
      'How to write a software engineer CV that passes ATS, the 6-second HR scan, and the hiring manager review. Free check tailored to your target role.',
    bcHome: 'Home',
    bcCurrent: 'Software Engineer CV',
    eyebrow: 'Software Engineer CV · 2026',
    h1Pre: 'How to write a software engineer CV that actually',
    h1Em: 'lands interviews',
    h1Post: '.',
    heroSub:
      'Generic resume advice does not work for engineers. Your CV is read by an ATS, a non-technical recruiter, and a technical hiring manager — three different filters, three different signals. This page covers what each one actually looks for.',
    heroCta: 'Check my engineer CV free',
    heroReassure: '60 seconds · Tailored to one specific engineering role',
    s1Eyebrow: 'Why generic CV advice fails for engineers',
    s1H2: 'An engineer CV is judged on technical signal, not personality.',
    s1Body:
      'Generic templates push you to add a photo, a hobby section, soft-skill paragraphs, and creative formatting. Each of those actively hurts you. The hiring manager opens GitHub before they finish reading the CV. The ATS chokes on decorative layouts. The recruiter scans for red flags in 6 seconds. None of them care about your favorite books.',
    s1Layers: [
      {
        step: '01',
        title: 'ATS layer',
        body: 'Parses to plain text, scores keyword overlap with the JD. Multi-column layouts and decorative headings break parsing. You get filtered before any human sees it.',
      },
      {
        step: '02',
        title: 'HR layer (6 seconds)',
        body: 'A non-technical recruiter scans for tenure, gaps, format, and consistency. They cut on visual signal, not technical depth. Clean, scannable beats dense and creative.',
      },
      {
        step: '03',
        title: 'Hiring manager layer',
        body: 'A senior engineer opens GitHub, cross-checks LinkedIn, and reads tone for seniority signal. "I worked on" reads junior. "I owned and shipped" reads senior. They decide in under 2 minutes.',
      },
    ],
    s2Eyebrow: 'Structure',
    s2H2: 'The 5 sections every engineer CV needs.',
    s2Sections: [
      {
        n: '01',
        title: 'Header',
        body: 'Name, role title (matching the JD if honest), email, GitHub, LinkedIn, location/timezone. No photo. Title alignment matters: if the JD is for "Backend Engineer", do not call yourself "Full-Stack Generalist" at the top.',
      },
      {
        n: '02',
        title: 'Skills',
        body: '8 to 12 technologies you have used in production. Group them logically (Languages, Frameworks, Infra) only if it helps readability. Mirror the JD vocabulary exactly — Kubernetes, not K8s. Drop "Familiar with…" sections entirely.',
      },
      {
        n: '03',
        title: 'Experience',
        body: 'Reverse-chronological. Each role: 2-5 bullets, active voice, measurable impact. "I designed and shipped a streaming pipeline that processed 40M events/day" beats "Worked on data ingestion features". Quantify scope, latency, scale, or business outcome.',
      },
      {
        n: '04',
        title: 'Projects',
        body: 'Critical for juniors and career switchers. 2-3 projects: live, with a README, in a stack relevant to the JD. Each project: one-line description + tech stack + what you built and why. Tutorial clones do not belong here.',
      },
      {
        n: '05',
        title: 'Education',
        body: 'Degree, institution, graduation year. For experienced engineers, this section can be 2 lines. For juniors and bootcamp grads, list relevant coursework or capstone. No GPA unless above 3.7 and you graduated under 5 years ago.',
      },
    ],
    s3Eyebrow: 'Seniority signaling',
    s3H2: 'Same person, same work — different tone reads different level.',
    s3Body:
      'The hiring manager reads seniority off your verbs before they reach the bullet’s content. In a shortlist of 10-20 candidates, “almost senior” loses to “clearly senior” every time. If your CV reads a level below the role, you do not get the interview.',
    juniorLabel: 'Junior signals',
    juniorItems: [
      '“I worked on…”',
      '“I helped build…”',
      '“I used React”',
      'Side projects only on GitHub',
      'No metrics, only task descriptions',
      'Skill list inflated with 25+ technologies',
    ],
    seniorLabel: 'Senior signals',
    seniorItems: [
      '“I owned and shipped…”',
      '“I designed and led…”',
      '“I architected the streaming layer”',
      'Live projects with measurable users or traffic',
      'Impact metrics: latency, scale, $$, throughput',
      'Tight skill list of 10 technologies, all production-grade',
    ],
    midEyebrow: 'Audit yours against a specific role',
    midH2: 'Paste a job description, upload your CV — get the diagnosis in 60 seconds.',
    midBody:
      'ATS score, missing keywords with point values, seniority audit, GitHub signal, red-flag detection. Free. No signup.',
    midBtn: 'Run free check →',
    s4Eyebrow: 'Why a template alone is not enough',
    s4H2: 'The structure is 30% of the work. The 70% is in the bullets.',
    s4Body:
      'A free engineer CV template fixes your structure. It does not fix your tone, your keyword match, or your seniority signaling. Two CVs with identical templates can read 3 levels apart based purely on phrasing. Optimize the words, not just the layout.',
    s4Links: [
      { href: '/cv-review', label: 'Get a deep CV review →' },
      { href: '/resume-checker', label: 'Fast resume checker →' },
      { href: '/guides/software-engineer-resume-tips', label: '12 actionable tips →' },
      { href: '/guides/why-developers-get-rejected', label: 'Why devs get rejected →' },
    ],
    faqEyebrow: 'FAQ',
    faqH2: 'Software engineer CV — what developers ask',
    faqItems: [
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
    ],
    ctaH2: 'Run a check on your engineer CV against the role you actually want.',
    ctaSub: 'ATS + HR + hiring manager — one pass. Free. No signup.',
    ctaBtn: 'Check my engineer CV free',
  },
  fr: {
    title: 'CV d’Ingénieur Logiciel : le Guide Anti-Rejet (2026)',
    description:
      'Comment rédiger un CV de développeur qui passe l’ATS, le scan RH de 6 secondes et la relecture du manager. Test gratuit calé sur le poste que tu vises.',
    bcHome: 'Accueil',
    bcCurrent: 'CV d’ingénieur logiciel',
    eyebrow: 'CV ingénieur logiciel · 2026',
    h1Pre: 'Comment rédiger un CV de développeur qui décroche vraiment des',
    h1Em: 'entretiens',
    h1Post: '.',
    heroSub:
      'Les conseils CV génériques ne marchent pas pour les développeurs. Ton CV est lu par un ATS, un recruteur non technique et un manager technique — trois filtres différents, trois signaux différents. Cette page détaille ce que chacun cherche vraiment.',
    heroCta: 'Tester mon CV dev gratuitement',
    heroReassure: '60 secondes · Calé sur un poste d’ingénieur précis',
    s1Eyebrow: 'Pourquoi les conseils CV génériques échouent pour les devs',
    s1H2: 'Un CV d’ingénieur se juge sur le signal technique, pas sur la personnalité.',
    s1Body:
      'Les modèles génériques te poussent à ajouter une photo, une rubrique loisirs, des paragraphes de soft skills et une mise en forme « créative ». Chacun de ces choix te dessert. Le manager ouvre ton GitHub avant même d’avoir fini de lire le CV. L’ATS s’étouffe sur les mises en page décoratives. Le recruteur cherche les signaux d’alerte en 6 secondes. Aucun d’eux ne se soucie de tes livres préférés.',
    s1Layers: [
      {
        step: '01',
        title: 'Couche ATS',
        body: 'Convertit en texte brut, score le recouvrement de mots-clés avec l’offre. Les mises en page multi-colonnes et les intitulés décoratifs cassent la lecture automatique. Tu es filtré avant qu’un humain ne voie quoi que ce soit.',
      },
      {
        step: '02',
        title: 'Couche RH (6 secondes)',
        body: 'Un recruteur non technique scanne l’ancienneté, les trous, le format et la cohérence. Il tranche sur le signal visuel, pas sur la profondeur technique. Propre et lisible bat dense et « créatif ».',
      },
      {
        step: '03',
        title: 'Couche manager',
        body: 'Un ingénieur senior ouvre ton GitHub, recoupe avec LinkedIn et lit le ton pour jauger ta séniorité. « J’ai travaillé sur » fait junior. « J’ai pris en charge et livré » fait senior. Il décide en moins de 2 minutes.',
      },
    ],
    s2Eyebrow: 'Structure',
    s2H2: 'Les 5 sections indispensables à tout CV d’ingénieur.',
    s2Sections: [
      {
        n: '01',
        title: 'En-tête',
        body: 'Nom, intitulé de poste (aligné sur l’offre s’il est honnête), email, GitHub, LinkedIn, localisation/fuseau horaire. Pas de photo. L’alignement de l’intitulé compte : si l’offre vise un « Backend Engineer », ne te présente pas en haut comme « Généraliste Full-Stack ».',
      },
      {
        n: '02',
        title: 'Compétences',
        body: '8 à 12 technologies que tu as utilisées en production. Regroupe-les logiquement (Langages, Frameworks, Infra) seulement si ça aide à la lecture. Reprends le vocabulaire de l’offre à l’identique — Kubernetes, pas K8s. Supprime totalement les rubriques « Notions de… ».',
      },
      {
        n: '03',
        title: 'Expérience',
        body: 'Antéchronologique. Chaque poste : 2 à 5 puces, voix active, impact mesurable. « J’ai conçu et livré un pipeline de streaming traitant 40 M d’événements/jour » bat « Travaillé sur des fonctionnalités d’ingestion de données ». Quantifie la portée, la latence, l’échelle ou le résultat business.',
      },
      {
        n: '04',
        title: 'Projets',
        body: 'Crucial pour les juniors et les reconvertis. 2 à 3 projets : en ligne, avec un README, dans une stack en lien avec l’offre. Pour chaque projet : une description d’une ligne + la stack technique + ce que tu as construit et pourquoi. Les clones de tutos n’ont rien à faire ici.',
      },
      {
        n: '05',
        title: 'Formation',
        body: 'Diplôme, établissement, année d’obtention. Pour les ingénieurs expérimentés, cette section peut tenir en 2 lignes. Pour les juniors et les sortants de bootcamp, liste les cours pertinents ou le projet de fin d’études. Pas de mention chiffrée sauf si elle est excellente et que tu as obtenu ton diplôme il y a moins de 5 ans.',
      },
    ],
    s3Eyebrow: 'Signaler sa séniorité',
    s3H2: 'Même personne, même travail — un ton différent fait lire un niveau différent.',
    s3Body:
      'Le manager déduit ta séniorité de tes verbes avant même d’atteindre le contenu de la puce. Dans une short-list de 10 à 20 candidats, « presque senior » perd à chaque fois face à « clairement senior ». Si ton CV se lit un niveau en dessous du poste, tu n’as pas l’entretien.',
    juniorLabel: 'Signaux junior',
    juniorItems: [
      '« J’ai travaillé sur… »',
      '« J’ai aidé à construire… »',
      '« J’ai utilisé React »',
      'Uniquement des side projects sur GitHub',
      'Aucune métrique, que des descriptions de tâches',
      'Liste de compétences gonflée à 25+ technologies',
    ],
    seniorLabel: 'Signaux senior',
    seniorItems: [
      '« J’ai pris en charge et livré… »',
      '« J’ai conçu et piloté… »',
      '« J’ai architecturé la couche de streaming »',
      'Des projets en ligne avec des utilisateurs ou du trafic mesurables',
      'Des métriques d’impact : latence, échelle, €€, débit',
      'Une liste resserrée de 10 technologies, toutes éprouvées en production',
    ],
    midEyebrow: 'Audite le tien face à un poste précis',
    midH2: 'Colle une offre d’emploi, dépose ton CV — le diagnostic en 60 secondes.',
    midBody:
      'Score ATS, mots-clés manquants avec leur poids, audit de séniorité, signal GitHub, détection des signaux d’alerte. Gratuit. Sans inscription.',
    midBtn: 'Lancer le test gratuit →',
    s4Eyebrow: 'Pourquoi un modèle seul ne suffit pas',
    s4H2: 'La structure, c’est 30 % du travail. Les 70 % restants sont dans les puces.',
    s4Body:
      'Un modèle de CV de développeur gratuit corrige ta structure. Il ne corrige ni ton ton, ni ta correspondance de mots-clés, ni les signaux de ta séniorité. Deux CV avec des modèles identiques peuvent se lire à 3 niveaux d’écart, uniquement à cause de la formulation. Optimise les mots, pas seulement la mise en page.',
    s4Links: [
      { href: '/cv-review', label: 'Obtenir une relecture CV approfondie →' },
      { href: '/resume-checker', label: 'Checker de CV rapide →' },
      { href: '/guides/software-engineer-resume-tips', label: '12 conseils concrets →' },
      { href: '/guides/why-developers-get-rejected', label: 'Pourquoi les devs sont rejetés →' },
    ],
    faqEyebrow: 'FAQ',
    faqH2: 'CV d’ingénieur logiciel — ce que les devs demandent',
    faqItems: [
      {
        question: 'Qu’est-ce qui distingue un CV d’ingénieur logiciel d’un CV générique ?',
        answer:
          'Un CV de développeur est lu à la fois par un ATS et par un manager technique. L’ATS score le recouvrement de mots-clés avec l’offre ; le manager vérifie ton GitHub, la qualité de tes projets et la formulation de ta séniorité. Les conseils de CV génériques (rubrique loisirs, photo, paragraphes de soft skills) te desservent activement dans ce contexte. La barre, c’est le signal technique, pas la personnalité.',
      },
      {
        question: 'Quelle longueur pour un CV d’ingénieur logiciel ?',
        answer:
          'Une page tant que tu n’as pas 10 ans et plus d’expérience pertinente. Plus long, ça fait gonflé. Le manager survole — chaque ligne doit envoyer un signal. Si une puce ne montre pas de prise en charge, d’impact ou d’une technologie pertinente, coupe-la.',
      },
      {
        question: 'Dois-je mettre un lien GitHub sur mon CV ?',
        answer:
          'Oui — et seulement si ton GitHub appuie ce que tu affirmes sur ton CV. Le manager va l’ouvrir. Les clones de tutos, les dépôts abandonnés sans README et l’absence d’activité récente te desservent. Un lien vers un GitHub propre avec 2-3 vrais projets vaut mieux que pas de lien.',
      },
      {
        question: 'Comment formuler mes puces pour qu’elles fassent senior ?',
        answer:
          'Voix active avec un impact mesurable. « J’ai pris en charge et livré un système de paiement gérant 40 000 requêtes/jour » bat « Travaillé sur des fonctionnalités de paiement backend ». Le verbe signale ton niveau de prise en charge. Les chiffres signalent la portée. Les deux se lisent en quelques secondes.',
      },
      {
        question: 'Combien de compétences faut-il lister ?',
        answer:
          '8 à 12 que tu as réellement utilisées en production. Lister 40 technologies signale du gonflage, pas de l’étendue. Les rubriques « Notions de… » sont un signal d’alerte — supprime-les. Les compétences que tu listes doivent reprendre le vocabulaire de l’offre à l’identique (Kubernetes, pas K8s).',
      },
      {
        question: 'Ai-je besoin d’une section Projets ?',
        answer:
          'Pour les juniors et les reconvertis — oui, c’est souvent la section la plus forte du CV. Pour les seniors avec 5 ans et plus d’expérience professionnelle, les projets comptent moins que l’impact dans les postes passés. Dans tous les cas, chaque projet listé doit être en ligne, avoir un README et montrer la stack de l’offre.',
      },
    ],
    ctaH2: 'Teste ton CV de développeur face au poste que tu veux vraiment.',
    ctaSub: 'ATS + RH + manager — en une seule passe. Gratuit. Sans inscription.',
    ctaBtn: 'Tester mon CV dev gratuitement',
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

export default async function SoftwareEngineerCvPage({
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
      <JsonLd id="ld-breadcrumb-se-cv" data={breadcrumbs} />
      <JsonLd id="ld-faq-se-cv" data={faqPageSchema(c.faqItems)} />
      <JsonLd id="ld-article-se-cv" data={article} />
      <JsonLd id="ld-app-se-cv" data={softwareApplicationSchema(lang)} />

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

        {/* What makes it different */}
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
              {c.s1Layers.map((layer) => (
                <div
                  key={layer.step}
                  className="rounded-2xl border border-rc-border bg-rc-surface p-6"
                >
                  <span className="font-mono text-[11px] text-rc-red tracking-[0.16em]">
                    {layer.step}
                  </span>
                  <h3 className="text-[18px] font-semibold text-rc-text mt-3 mb-2 leading-tight">
                    {layer.title}
                  </h3>
                  <p className="text-[14px] text-rc-muted leading-[1.65]">{layer.body}</p>
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
                {c.s2Eyebrow}
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-12 max-w-[640px]">
              {c.s2H2}
            </h2>

            <div className="space-y-5">
              {c.s2Sections.map((s) => (
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
                {c.s3Eyebrow}
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-6 max-w-[680px]">
              {c.s3H2}
            </h2>
            <p className="text-rc-muted text-[15px] leading-[1.7] max-w-[700px] mb-10">
              {c.s3Body}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-rc-border bg-rc-surface p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold mb-3">
                  {c.juniorLabel}
                </p>
                <ul className="space-y-2 text-[14px] text-rc-muted leading-[1.7]">
                  {c.juniorItems.map((item) => (
                    <li key={item}>— {item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-rc-red/30 bg-rc-red/5 p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-red font-bold mb-3">
                  {c.seniorLabel}
                </p>
                <ul className="space-y-2 text-[14px] text-rc-muted leading-[1.7]">
                  {c.seniorItems.map((item) => (
                    <li key={item}>— {item}</li>
                  ))}
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
                {c.midEyebrow}
              </p>
              <h2 className="text-[22px] md:text-[28px] font-semibold tracking-[-0.02em] text-rc-text mb-4 max-w-[620px] mx-auto">
                {c.midH2}
              </h2>
              <p className="text-rc-muted text-[14px] mb-6 max-w-[520px] mx-auto">
                {c.midBody}
              </p>
              <Link
                href={`${base}/analyze`}
                className="inline-flex items-center gap-2 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-7 py-3 rounded-xl hover:bg-[#b83332] transition-all duration-200 no-underline"
              >
                {c.midBtn}
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
                {c.s4Eyebrow}
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-6 max-w-[680px]">
              {c.s4H2}
            </h2>
            <p className="text-rc-muted text-[15px] leading-[1.7] max-w-[700px] mb-8">
              {c.s4Body}
            </p>
            <div className="flex flex-wrap gap-3">
              {c.s4Links.map((l) => (
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
