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
import { hasLocale } from '../dictionaries'

// FR-only pillar: the FR "CV développeur" niche is unclaimed by FR generalists,
// and the EN equivalent is already served by /software-engineer-cv. So this page
// renders only under /fr; /en/cv-developpeur is a 404 by design.
const PAGE_PATH = '/cv-developpeur'
const PUBLISHED_ISO = '2026-06-17'
const LAST_UPDATED_ISO = '2026-06-17'
const CANONICAL = `${SITE_URL}/fr${PAGE_PATH}`

const TITLE = 'CV Développeur : l’Analyse IA qui Lit Aussi ton GitHub'
const DESCRIPTION =
  'Analyse de CV développeur gratuite : on audite ton CV, ton GitHub et ton LinkedIn comme un recruteur tech. Mots-clés ATS par stack, signaux de séniorité, signaux d’alerte — en moins de 60 secondes.'

const FAQ_ITEMS = [
  {
    question: 'C’est quoi une analyse de CV développeur ?',
    answer:
      'C’est une relecture de ton CV pensée pour les profils tech. Au-delà du score ATS classique (mots-clés vs offre), elle évalue ce qu’un recruteur tech et un manager regardent vraiment : la cohérence entre ton CV et ton GitHub, tes signaux de séniorité, la pertinence de ta stack face à l’offre, et les signaux d’alerte (intitulés vagues, voix passive, trous). Le résultat n’est pas qu’une note : c’est une liste de corrections concrètes, classées par impact.',
  },
  {
    question: 'Tu audites vraiment mon GitHub ?',
    answer:
      'Oui. Pour un développeur, ton vrai CV c’est souvent ton compte GitHub. RejectCheck regarde l’activité de tes commits, la qualité de tes repos (README, structure, tests), et surtout la cohérence entre ce que ton CV affirme et ce que ton GitHub montre : une compétence revendiquée sans aucun code la soutenant est un signal d’alerte que les recruteurs tech repèrent immédiatement.',
  },
  {
    question: 'Quels mots-clés mettre dans un CV de développeur ?',
    answer:
      'Exactement ceux de l’offre, écrits comme dans l’offre. L’ATS favorise les correspondances exactes : si l’annonce dit « Kubernetes », écris « Kubernetes », pas « K8s ». Pareil pour « TypeScript » vs « TS », « JavaScript » vs « JS ». RejectCheck score ton CV face à une offre précise et te rend la liste des mots-clés manquants avec leur poids, pour que tu saches quoi ajouter et où.',
  },
  {
    question: 'Quelle différence avec Jobscan ou les autres checkers ATS ?',
    answer:
      'La plupart des checkers s’arrêtent au matching de mots-clés. RejectCheck ajoute la couche humaine spécifique aux devs : audit des signaux GitHub, radar des lacunes techniques, audit de séniorité, et détection de signaux d’alerte. Et là où la plupart sont génériques, l’analyse est calibrée pour les profils techniques (tout en marchant pour les autres métiers).',
  },
  {
    question: 'Comment bien signaler ma séniorité de développeur ?',
    answer:
      'Par des preuves, pas des adjectifs. « J’ai pris en charge et livré » bat « j’ai aidé à construire ». L’impact mesurable (« utilisé par 10k utilisateurs », « p95 réduit de 40 % ») bat la liste de tâches. Les systèmes en production, l’ownership et le leadership signalent la séniorité — encore faut-il qu’ils matchent le niveau de l’offre. RejectCheck repère où tes signaux de séniorité dépassent ou n’atteignent pas le rôle visé.',
  },
  {
    question: 'C’est gratuit ?',
    answer:
      'La première analyse est gratuite, sans inscription. Tu déposes ton CV, tu colles l’offre visée, tu ajoutes éventuellement ton GitHub et un export LinkedIn — et tu obtiens ton diagnostic en moins de 60 secondes.',
  },
]

type LangParams = { lang: string }

export async function generateMetadata({
  params,
}: {
  params: Promise<LangParams>
}): Promise<Metadata> {
  const { lang } = await params
  if (!hasLocale(lang) || lang !== 'fr') return {}

  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: {
      canonical: CANONICAL,
      languages: {
        fr: CANONICAL,
        'x-default': CANONICAL,
      },
    },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: CANONICAL,
      locale: 'fr_FR',
      siteName: 'RejectCheck',
      images: [{ url: `${SITE_URL}/og?lang=fr`, width: 1200, height: 630, alt: 'RejectCheck' }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: TITLE,
      description: DESCRIPTION,
      images: [`${SITE_URL}/og?lang=fr`],
    },
  }
}

export default async function CvDeveloppeurPage({
  params,
}: {
  params: Promise<LangParams>
}) {
  const { lang } = await params
  if (!hasLocale(lang)) notFound()
  if (lang !== 'fr') notFound()

  const breadcrumbs = breadcrumbSchema([
    { name: 'Accueil', url: `${SITE_URL}/fr` },
    { name: 'CV Développeur', url: CANONICAL },
  ])

  const article = articleSchema({
    headline: TITLE,
    description: DESCRIPTION,
    url: CANONICAL,
    datePublished: PUBLISHED_ISO,
    dateModified: LAST_UPDATED_ISO,
    locale: 'fr',
    author: { type: 'Person', name: 'Lenny Garnier' },
  })

  const rejectionCards = [
    {
      step: '01',
      title: 'Ta stack passe sous les radars',
      body: 'L’ATS cherche les mots-clés exacts de l’offre. Si tu écris « K8s » quand l’annonce dit « Kubernetes », ou que tes compétences sont dans un encadré stylé, elles n’existent pas pour la machine.',
    },
    {
      step: '02',
      title: 'Ton GitHub contredit ton CV',
      body: 'Compétence revendiquée sans une ligne de code derrière, projets listés mais introuvables, dernier commit il y a deux ans : le recruteur tech voit l’écart avant de te lire en entier.',
    },
    {
      step: '03',
      title: 'Ta séniorité est mal signalée',
      body: '« A participé à » ne prouve rien. Sans impact mesurable ni ownership visible, un bon profil passe pour junior — ou un junior pour un imposteur face à une offre senior.',
    },
  ]

  const githubSignals = [
    { label: 'Activité réelle', body: 'Fréquence et régularité des commits, projets vivants vs repos abandonnés. Un GitHub actif soutient ce que ton CV affirme.' },
    { label: 'Qualité des repos', body: 'README clairs, structure de projet, tests, documentation. Un recruteur tech ouvre tes repos — on regarde ce qu’il y trouve.' },
    { label: 'Cohérence CV ↔ GitHub', body: 'Chaque compétence du CV est-elle adossée à du code ? Les incohérences sont des signaux d’alerte qu’on remonte avec le même poids qu’un recruteur.' },
    { label: 'Signaux de stack', body: 'Les langages et outils visibles dans ton GitHub matchent-ils l’offre ? On compare ton activité réelle aux mots-clés attendus.' },
  ]

  const atsTraps = [
    { label: 'Synonymes de stack', body: '« K8s » vs « Kubernetes », « TS » vs « TypeScript », « JS » vs « JavaScript ». L’ATS favorise la formulation exacte de l’offre — on signale chaque écart.' },
    { label: 'Pièges d’intitulés FR', body: '« Intégrateur Web » vs « Développeur Front-end », « Ingénieur d’études » vs « Software Engineer » : un mauvais intitulé te fait rater des offres pourtant faites pour toi.' },
    { label: 'Mots-clés par offre', body: 'On score ton CV face à une offre précise et on te rend les mots-clés manquants avec leur poids — pas une liste générique.' },
    { label: 'Mise en forme', body: 'Colonnes multiples, encadrés, icônes, PDF non lisible : tout ce qui casse silencieusement la lecture automatique avant qu’un humain te voie.' },
  ]

  const juniorItems = [
    'Projets perso et open source qui montrent ce que tu sais faire, pas juste ce que tu as appris.',
    'GitHub propre et actif : c’est ta preuve quand tu n’as pas encore d’expérience pro.',
    'Stack alignée sur l’offre, mots-clés exacts, format ATS irréprochable.',
  ]
  const seniorItems = [
    'Ownership et impact mesurable : « pris en charge et livré », « p95 réduit de 40 % ».',
    'Systèmes en production, échelle, leadership technique — les signaux que cherche un manager.',
    'Cohérence entre le niveau revendiqué, l’offre visée et ce que montre ton GitHub.',
  ]

  const crossLinks = [
    { href: '/fr/ats-checker', label: 'Le checker ATS →' },
    { href: '/fr/cv-review', label: 'La revue de CV complète →' },
    { href: '/fr/guides/why-developers-get-rejected', label: 'Lire : Pourquoi les développeurs sont rejetés →' },
    { href: '/fr/software-engineer-cv', label: 'Guide du CV d’ingénieur logiciel →' },
  ]

  return (
    <>
      <JsonLd id="ld-breadcrumb-cv-developpeur" data={breadcrumbs} />
      <JsonLd id="ld-faq-cv-developpeur" data={faqPageSchema(FAQ_ITEMS)} />
      <JsonLd id="ld-article-cv-developpeur" data={article} />
      <JsonLd id="ld-app-cv-developpeur" data={softwareApplicationSchema('fr')} />

      <div className="bg-rc-bg text-rc-text font-sans min-h-screen">
        <Navbar />

        {/* Hero */}
        <section className="max-w-[1100px] mx-auto px-5 md:px-[40px] pt-20 pb-16 md:pt-28 md:pb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px w-6 bg-rc-red" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-red">
              CV Développeur · Analyse IA · Optimisé pour les devs
            </span>
          </div>
          <h1 className="text-[40px] md:text-[58px] font-semibold leading-[1.08] tracking-[-0.025em] text-rc-text max-w-[860px] mb-6">
            Le checker de CV développeur qui lit{' '}
            <span className="text-rc-red font-semibold">
              ton GitHub
            </span>
            , pas juste tes mots-clés.
          </h1>
          <p className="text-rc-muted text-[16px] md:text-[17px] leading-[1.7] max-w-[640px] mb-10">
            Les checkers ATS génériques s’arrêtent aux mots-clés. Pour un développeur, ton vrai
            CV c’est aussi ton GitHub. RejectCheck audite ton CV, ton GitHub et ton LinkedIn comme
            un recruteur tech — et te dit, avant de postuler, ce qui ferait rejeter ta candidature.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link
              href="/fr/analyze"
              className="inline-flex items-center gap-2.5 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-7 py-3.5 rounded-xl hover:bg-[#b83332] transition-all duration-200 no-underline"
            >
              Analyser mon CV gratuitement
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M7.5 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <span className="font-mono text-[11px] text-rc-hint tracking-wide">
              Sans inscription · CV non conservé · Calé sur une offre
            </span>
          </div>
        </section>

        {/* Why dev CVs get rejected */}
        <section className="border-t-[0.5px] border-rc-border bg-rc-surface-hero">
          <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-20 md:py-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-rc-border" />
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
                Pourquoi ça coince
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-6 max-w-[680px]">
              Un CV de développeur se fait rejeter pour des raisons que les checkers génériques ne voient pas.
            </h2>
            <p className="text-rc-muted text-[15px] md:text-[16px] leading-[1.7] max-w-[700px] mb-12">
              Le matching de mots-clés ne raconte qu’un tiers de l’histoire. Les deux autres tiers —
              ton GitHub et tes signaux de séniorité — sont exactement ce qu’un recruteur tech
              regarde, et exactement ce que les outils génériques ignorent.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {rejectionCards.map((card) => (
                <div key={card.step} className="rounded-2xl border border-rc-border bg-rc-surface p-6">
                  <span className="font-mono text-[11px] text-rc-red tracking-[0.16em]">{card.step}</span>
                  <h3 className="text-[18px] font-semibold text-rc-text mt-3 mb-2">{card.title}</h3>
                  <p className="text-[14px] text-rc-muted leading-[1.65]">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* GitHub is part of your application */}
        <section className="border-t-[0.5px] border-rc-border">
          <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-20 md:py-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-rc-border" />
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
                L’angle que les autres ratent
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-12 max-w-[640px]">
              Ton GitHub fait partie de ta candidature. On l’audite comme un recruteur tech.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {githubSignals.map((f) => (
                <div key={f.label} className="rounded-2xl border border-rc-border bg-rc-surface p-6">
                  <h3 className="text-[16px] font-semibold text-rc-text mb-2">{f.label}</h3>
                  <p className="text-[14px] text-rc-muted leading-[1.65]">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ATS traps for devs */}
        <section className="border-t-[0.5px] border-rc-border bg-rc-surface-hero">
          <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-20 md:py-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-rc-border" />
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
                Les pièges ATS propres aux devs
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-12 max-w-[680px]">
              Les mots-clés tech ont leurs propres pièges. On les connaît.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {atsTraps.map((f) => (
                <div key={f.label} className="rounded-2xl border border-rc-border bg-rc-surface p-6">
                  <h3 className="text-[16px] font-semibold text-rc-text mb-2">{f.label}</h3>
                  <p className="text-[14px] text-rc-muted leading-[1.65]">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Junior vs Senior */}
        <section className="border-t-[0.5px] border-rc-border">
          <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-20 md:py-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-rc-border" />
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
                Signaux de séniorité
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-12 max-w-[680px]">
              Junior ou senior : ce qui doit ressortir change.
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="rounded-2xl border border-rc-border bg-rc-surface p-7">
                <h3 className="font-mono text-[11px] tracking-[0.16em] uppercase text-rc-red mb-4">CV développeur junior</h3>
                <ul className="space-y-3">
                  {juniorItems.map((item) => (
                    <li key={item} className="text-[14px] text-rc-muted leading-[1.6] flex gap-2.5">
                      <span className="text-rc-red shrink-0">—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-rc-border bg-rc-surface p-7">
                <h3 className="font-mono text-[11px] tracking-[0.16em] uppercase text-rc-red mb-4">CV développeur senior</h3>
                <ul className="space-y-3">
                  {seniorItems.map((item) => (
                    <li key={item} className="text-[14px] text-rc-muted leading-[1.6] flex gap-2.5">
                      <span className="text-rc-red shrink-0">—</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Cross-links */}
        <section className="border-t-[0.5px] border-rc-border bg-rc-surface-hero">
          <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-16 md:py-20">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px w-6 bg-rc-border" />
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
                Pour aller plus loin
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              {crossLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
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
                FAQ
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-10">
              CV développeur — ce que tu te demandes
            </h2>
            <div className="space-y-3">
              {FAQ_ITEMS.map((item) => (
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
              Analyse ton CV de développeur, maintenant et gratuitement.
            </h2>
            <p className="font-mono text-[12px] md:text-[13px] tracking-[0.06em] text-rc-hint mb-8">
              CV + GitHub + LinkedIn audités face à une offre. Sans inscription.
            </p>
            <Link
              href="/fr/analyze"
              className="inline-flex items-center gap-2.5 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-8 py-4 rounded-xl hover:bg-[#b83332] transition-all duration-200 no-underline"
            >
              Analyser mon CV gratuitement
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
