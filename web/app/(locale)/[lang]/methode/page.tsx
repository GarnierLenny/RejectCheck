import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Navbar } from '../../../components/Navbar'
import { SeoFooter } from '../../../components/SeoFooter'
import { BlueprintCta } from '../../../components/BlueprintCta'
import { JsonLd, SITE_URL, breadcrumbSchema, articleSchema } from '../../../components/JsonLd'
import { hasLocale, type Locale } from '../dictionaries'

const PAGE_PATH = '/methode'
const PUBLISHED_ISO = '2026-06-17'
const LAST_UPDATED_ISO = '2026-06-17'
const canonicalFor = (lang: Locale) => `${SITE_URL}/${lang}${PAGE_PATH}`

type Term = { term: string; def: string }
type Filter = { n: string; name: string; body: string }

type Copy = {
  title: string
  description: string
  bcHome: string
  bcCurrent: string
  eyebrow: string
  h1Pre: string
  h1Em: string
  intro: string
  dimsSetName: string
  dimsEyebrow: string
  dimsH2: string
  dimsLead: string
  dimensions: Term[]
  filtersSetName: string
  filtersEyebrow: string
  filtersH2: string
  filtersLead: string
  filters: Filter[]
  cta: string
  ctaBtn: string
}

const COPY: Record<Locale, Copy> = {
  en: {
    title: 'The RejectCheck Method: 6 Rejection Dimensions',
    description:
      'How RejectCheck scores a CV: the 6 rejection dimensions (clarity, impact, hard skills, soft skills, consistency, ATS format) and the 3-filter pipeline every application passes before a human decides.',
    bcHome: 'Home',
    bcCurrent: 'Method',
    eyebrow: 'The Method · How RejectCheck scores your CV',
    h1Pre: 'A CV is judged on six dimensions —',
    h1Em: 'before anyone calls it a “no.”',
    intro:
      'RejectCheck turns “rejected, no reason given” into a structured diagnosis. Every CV is scored on six dimensions, against three filters it has to clear before a human makes a decision. These are the named frameworks behind every RejectCheck score.',
    dimsSetName: 'RejectCheck’s 6 Rejection Dimensions',
    dimsEyebrow: 'The framework',
    dimsH2: 'RejectCheck’s 6 rejection dimensions',
    dimsLead:
      'Your overall score is a weighted average across these six. A CV rarely fails on all of them — it usually fails sharply on one or two, and that’s what gets it filtered out.',
    dimensions: [
      { term: 'Clarity', def: 'How fast a recruiter can parse what you do, at what level, and why you fit. Buried titles, wall-of-text bullets, and vague scope all cost clarity.' },
      { term: 'Impact', def: 'Measurable outcomes over task lists. “Reduced p95 latency by 40%” beats “responsible for performance.” Numbers and ownership carry impact.' },
      { term: 'Hard skills', def: 'The technical stack and tools you show versus what the role demands — including exact keyword matches the ATS rewards (“Kubernetes”, not “K8s”).' },
      { term: 'Soft skills', def: 'Signals of communication, collaboration, and leadership a hiring manager reads between the lines — ownership language, cross-team work, mentoring.' },
      { term: 'Consistency', def: 'Whether your CV, GitHub, and LinkedIn tell the same story. Claimed skills with no code, titles that don’t match, dead projects — each is a red flag.' },
      { term: 'ATS format', def: 'Machine-readability: single column, standard headings, no tables or images. The cleanest content still fails if the parser can’t extract it.' },
    ],
    filtersSetName: 'RejectCheck’s 3-Filter Pipeline',
    filtersEyebrow: 'The pipeline',
    filtersH2: 'The 3 filters every application clears',
    filtersLead:
      'Passing one filter doesn’t mean passing the next. RejectCheck audits all three in a single pass, so you see where you’d actually drop out.',
    filters: [
      { n: '01', name: 'The ATS', body: 'An automated keyword and parsing filter. Most applications to a popular posting are screened out here, before any human attention.' },
      { n: '02', name: 'The 6-second HR scan', body: 'A recruiter skims for red flags — gaps, vague titles, obvious mismatches — in seconds. Survive this and you reach a real evaluation.' },
      { n: '03', name: 'The hiring manager review', body: 'Depth: GitHub signal, seniority match, project relevance, whether the story holds up. This is where the dev-specific signals decide it.' },
    ],
    cta: 'See your six dimensions scored against a real job.',
    ctaBtn: 'Run a free analysis',
  },
  fr: {
    title: 'La Méthode RejectCheck : les 6 Dimensions du Rejet',
    description:
      'Comment RejectCheck score un CV : les 6 dimensions du rejet (clarté, impact, compétences techniques, soft skills, cohérence, format ATS) et le pipeline à 3 filtres que toute candidature traverse avant qu’un humain décide.',
    bcHome: 'Accueil',
    bcCurrent: 'Méthode',
    eyebrow: 'La Méthode · Comment RejectCheck score ton CV',
    h1Pre: 'Un CV se juge sur six dimensions —',
    h1Em: 'avant même qu’on le classe « non ».',
    intro:
      'RejectCheck transforme le « refusé, sans explication » en un diagnostic structuré. Chaque CV est scoré sur six dimensions, face à trois filtres qu’il doit passer avant qu’un humain ne décide. Voici les frameworks nommés derrière chaque score RejectCheck.',
    dimsSetName: 'Les 6 Dimensions du Rejet RejectCheck',
    dimsEyebrow: 'Le framework',
    dimsH2: 'Les 6 dimensions du rejet RejectCheck',
    dimsLead:
      'Ton score global est une moyenne pondérée de ces six dimensions. Un CV échoue rarement sur toutes — il échoue nettement sur une ou deux, et c’est ça qui le fait filtrer.',
    dimensions: [
      { term: 'Clarté', def: 'À quelle vitesse un recruteur comprend ce que tu fais, à quel niveau, et pourquoi tu colles. Intitulés noyés, pavés de texte et périmètre flou coûtent en clarté.' },
      { term: 'Impact', def: 'Des résultats mesurables plutôt que des listes de tâches. « p95 réduit de 40 % » bat « responsable de la performance ». Les chiffres et l’ownership font l’impact.' },
      { term: 'Compétences techniques', def: 'La stack et les outils que tu montres face à ce que le poste exige — y compris les mots-clés exacts que l’ATS récompense (« Kubernetes », pas « K8s »).' },
      { term: 'Soft skills', def: 'Les signaux de communication, de collaboration et de leadership qu’un manager lit entre les lignes — langage d’ownership, travail inter-équipes, mentorat.' },
      { term: 'Cohérence', def: 'Est-ce que ton CV, ton GitHub et ton LinkedIn racontent la même histoire. Compétence revendiquée sans code, intitulés qui ne matchent pas, projets morts — autant de signaux d’alerte.' },
      { term: 'Format ATS', def: 'La lisibilité par la machine : une seule colonne, intitulés standards, ni tableaux ni images. Le meilleur contenu échoue si le parser ne l’extrait pas.' },
    ],
    filtersSetName: 'Le Pipeline à 3 Filtres RejectCheck',
    filtersEyebrow: 'Le pipeline',
    filtersH2: 'Les 3 filtres que toute candidature traverse',
    filtersLead:
      'Passer un filtre ne veut pas dire passer le suivant. RejectCheck audite les trois en une seule passe, pour que tu voies où tu décrocherais vraiment.',
    filters: [
      { n: '01', name: 'L’ATS', body: 'Un filtre automatique de mots-clés et de lecture. La majorité des candidatures à une offre populaire sont éliminées ici, avant toute attention humaine.' },
      { n: '02', name: 'Le scan RH de 6 secondes', body: 'Un recruteur survole à la recherche de signaux d’alerte — trous, intitulés vagues, incohérences évidentes — en quelques secondes. Survis à ça et tu atteins une vraie évaluation.' },
      { n: '03', name: 'La relecture du manager', body: 'La profondeur : signal GitHub, cohérence de séniorité, pertinence des projets, est-ce que l’histoire tient. C’est là que les signaux dev font la différence.' },
    ],
    cta: 'Vois tes six dimensions scorées face à une vraie offre.',
    ctaBtn: 'Lancer une analyse gratuite',
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

export default async function MethodePage({
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
    author: { type: 'Person', name: 'Lenny Garnier' },
  })

  // DefinedTermSet/DefinedTerm makes the named frameworks machine-attributable:
  // an LLM can quote "RejectCheck's 6 rejection dimensions" AND attribute them.
  const definedTerms = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'DefinedTermSet',
        '@id': `${canonical}#dimensions`,
        name: c.dimsSetName,
        url: canonical,
        hasDefinedTerm: c.dimensions.map((d) => ({
          '@type': 'DefinedTerm',
          name: d.term,
          description: d.def,
          inDefinedTermSet: `${canonical}#dimensions`,
        })),
      },
      {
        '@type': 'DefinedTermSet',
        '@id': `${canonical}#pipeline`,
        name: c.filtersSetName,
        url: canonical,
        hasDefinedTerm: c.filters.map((f) => ({
          '@type': 'DefinedTerm',
          name: f.name,
          description: f.body,
          inDefinedTermSet: `${canonical}#pipeline`,
        })),
      },
    ],
  }

  return (
    <>
      <JsonLd id="ld-breadcrumb-methode" data={breadcrumbs} />
      <JsonLd id="ld-article-methode" data={article} />
      <JsonLd id="ld-definedterms-methode" data={definedTerms} />

      <div className="bg-rc-bg text-rc-text font-sans min-h-screen">
        <Navbar />

        {/* Hero */}
        <section className="max-w-[1000px] mx-auto px-5 md:px-[40px] pt-20 pb-12 md:pt-28 md:pb-16">
          <div className="flex items-center gap-3 mb-7">
            <div className="h-px w-6 bg-rc-red" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-red">
              {c.eyebrow}
            </span>
          </div>
          <h1 className="text-[38px] md:text-[54px] font-semibold leading-[1.08] tracking-[-0.025em] text-rc-text max-w-[840px] mb-6">
            {c.h1Pre}{' '}
            <span className="text-rc-red italic" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              {c.h1Em}
            </span>
          </h1>
          <p className="text-rc-muted text-[16px] md:text-[17px] leading-[1.7] max-w-[680px]">
            {c.intro}
          </p>
        </section>

        {/* 6 dimensions */}
        <section className="border-t-[0.5px] border-rc-border bg-rc-surface-hero">
          <div className="max-w-[1000px] mx-auto px-5 md:px-[40px] py-20 md:py-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-rc-border" />
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">{c.dimsEyebrow}</span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-5 max-w-[680px]">
              {c.dimsH2}
            </h2>
            <p className="text-rc-muted text-[15px] md:text-[16px] leading-[1.7] max-w-[700px] mb-12">{c.dimsLead}</p>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-px bg-rc-border border border-rc-border rounded-2xl overflow-hidden">
              {c.dimensions.map((d, i) => (
                <div key={d.term} className="bg-rc-surface p-6">
                  <dt className="flex items-baseline gap-3 mb-2">
                    <span className="font-mono text-[11px] text-rc-red tracking-[0.16em]">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-[18px] font-semibold text-rc-text">{d.term}</span>
                  </dt>
                  <dd className="text-[14px] text-rc-muted leading-[1.65] m-0">{d.def}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* 3 filters */}
        <section className="border-t-[0.5px] border-rc-border">
          <div className="max-w-[1000px] mx-auto px-5 md:px-[40px] py-20 md:py-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-rc-border" />
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">{c.filtersEyebrow}</span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-5 max-w-[680px]">
              {c.filtersH2}
            </h2>
            <p className="text-rc-muted text-[15px] md:text-[16px] leading-[1.7] max-w-[700px] mb-12">{c.filtersLead}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {c.filters.map((f) => (
                <div key={f.n} className="rounded-2xl border border-rc-border bg-rc-surface p-6">
                  <span className="font-mono text-[11px] text-rc-red tracking-[0.16em]">{f.n}</span>
                  <h3 className="text-[18px] font-semibold text-rc-text mt-3 mb-2">{f.name}</h3>
                  <p className="text-[14px] text-rc-muted leading-[1.65]">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t-[0.5px] border-rc-border bg-rc-surface">
          <div className="max-w-[1000px] mx-auto px-5 md:px-[40px] py-20 md:py-24 text-center">
            <h2 className="text-[28px] md:text-[40px] font-semibold leading-[1.12] tracking-[-0.025em] text-rc-text mb-8 max-w-[680px] mx-auto">
              {c.cta}
            </h2>
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
