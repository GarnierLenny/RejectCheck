import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Navbar } from '../../../../components/Navbar'
import { SeoFooter } from '../../../../components/SeoFooter'
import { BlueprintCta } from '../../../../components/BlueprintCta'
import {
  JsonLd,
  SITE_URL,
  articleSchema,
  breadcrumbSchema,
  faqPageSchema,
} from '../../../../components/JsonLd'
import { hasLocale, type Locale } from '../../dictionaries'

const PAGE_PATH = '/guides/software-engineer-resume-tips'
const PUBLISHED_ISO = '2026-04-29'
const LAST_UPDATED_ISO = '2026-04-29'
const canonicalFor = (lang: Locale) => `${SITE_URL}/${lang}${PAGE_PATH}`

type Faq = { question: string; answer: string }
type Tip = { n: string; title: string; body: string; example?: { before: string; after: string } }
type TldrItem = { label: string; body: string }
type CrossLink = { href: string; label: string }

type Copy = {
  title: string
  description: string
  bcHome: string
  bcGuides: string
  bcCurrent: string
  eyebrow: string
  h1Pre: string
  h1Em: string
  h1Post: string
  intro: string
  tldrLabel: string
  tldrItems: TldrItem[]
  beforeLabel: string
  afterLabel: string
  midCtaLabel: string
  midCtaBody: string
  midCtaBtn: string
  relatedLabel: string
  relatedLinks: CrossLink[]
  authorLabel: string
  authorBody: string
  faqH2: string
  faqItems: Faq[]
  bottomCtaH2: string
  bottomCtaSub: string
  bottomCtaBtn: string
  tips: Tip[]
}

const COPY: Record<Locale, Copy> = {
  en: {
    title: '12 Software Engineer Resume Tips (2026)',
    description:
      '12 resume tips for software engineers based on what hiring managers look for: GitHub signals, ownership phrasing, ATS-friendly format, seniority alignment.',
    bcHome: 'Home',
    bcGuides: 'Guides',
    bcCurrent: 'Software Engineer Resume Tips',
    eyebrow: 'Guide · 11 min read',
    h1Pre: 'Software engineer resume tips —',
    h1Em: '12 rules',
    h1Post: 'that actually move the needle.',
    intro:
      'Generic resume advice does not work for engineers. Three different filters read your CV: ATS, HR, hiring manager — each looks for different signals. These 12 rules are calibrated for what each filter actually weighs, ranked by impact.',
    tldrLabel: 'TL;DR — the 4 highest-leverage rules',
    tldrItems: [
      { label: 'Format', body: 'single-column PDF, no boxes, no images. Boring beats clever.' },
      { label: 'Words', body: 'mirror the JD’s exact keywords (Kubernetes, not K8s).' },
      { label: 'Verbs', body: '“I owned and shipped”, not “I worked on”. Tone tells seniority before content does.' },
      { label: 'Numbers', body: 'quantify scope, latency, scale, dollars, users. Vague bullets read as filler.' },
    ],
    beforeLabel: 'Before',
    afterLabel: 'After',
    midCtaLabel: 'Apply rules 1-6 in 60 seconds',
    midCtaBody:
      'Run your CV through the analyzer against the actual job. You get the missing keywords with point values, format flags, tone audit, and prioritized fixes — free.',
    midCtaBtn: 'Run free check →',
    relatedLabel: 'Related',
    relatedLinks: [
      { href: '/software-engineer-cv', label: 'Software Engineer CV — full structural guide' },
      { href: '/cv-review', label: 'Get a deep CV review (free, role-anchored)' },
      { href: '/guides/how-to-pass-ats', label: 'How to pass ATS in 2026' },
      { href: '/guides/why-developers-get-rejected', label: 'Why developers get rejected (and never find out why)' },
    ],
    authorLabel: 'About the author',
    authorBody:
      'Lenny Garnier — junior software engineer, founder of RejectCheck. These rules come from 200+ rejections during my own job search and the patterns I extracted while building the tool.',
    faqH2: 'FAQ',
    faqItems: [
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
    ],
    bottomCtaH2: 'Apply the 12 rules. Verify against a real role.',
    bottomCtaSub: '60 seconds. Tailored to one specific job. Free.',
    bottomCtaBtn: 'Run free check →',
    tips: [
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
    ],
  },
  fr: {
    title: '12 Conseils CV pour Ingénieurs Logiciels (2026)',
    description:
      '12 conseils CV pour développeurs basés sur ce que cherchent les managers : signaux GitHub, formulations d’ownership, format compatible ATS, séniorité alignée. Améliore ton CV de développeur.',
    bcHome: 'Accueil',
    bcGuides: 'Guides',
    bcCurrent: 'Conseils CV pour ingénieurs logiciels',
    eyebrow: 'Guide · 11 min de lecture',
    h1Pre: 'Conseils CV pour développeurs —',
    h1Em: '12 règles',
    h1Post: 'qui font vraiment la différence.',
    intro:
      'Les conseils CV génériques ne marchent pas pour les ingénieurs. Trois filtres différents lisent ton CV : ATS, RH, manager — chacun cherche des signaux différents. Ces 12 règles sont calibrées sur ce que chaque filtre pèse réellement, classées par impact.',
    tldrLabel: 'TL;DR — les 4 règles à plus fort levier',
    tldrItems: [
      { label: 'Format', body: 'PDF une seule colonne, sans encadrés, sans images. Le sobre bat le créatif.' },
      { label: 'Mots', body: 'reprends les mots-clés exacts de l’offre (Kubernetes, pas K8s).' },
      { label: 'Verbes', body: '« J’ai pris en charge et livré », pas « J’ai participé à ». Le ton trahit la séniorité avant le contenu.' },
      { label: 'Chiffres', body: 'quantifie le périmètre, la latence, l’échelle, les euros, les utilisateurs. Les puces vagues passent pour du remplissage.' },
    ],
    beforeLabel: 'Avant',
    afterLabel: 'Après',
    midCtaLabel: 'Applique les règles 1 à 6 en 60 secondes',
    midCtaBody:
      'Passe ton CV dans l’analyseur face à l’offre réelle. Tu obtiens les mots-clés manquants avec leur poids, les alertes de format, l’audit du ton et les corrections priorisées — gratuitement.',
    midCtaBtn: 'Tester gratuitement →',
    relatedLabel: 'À lire aussi',
    relatedLinks: [
      { href: '/software-engineer-cv', label: 'CV d’ingénieur logiciel — le guide structurel complet' },
      { href: '/cv-review', label: 'Obtiens une review de CV poussée (gratuite, calée sur ton métier)' },
      { href: '/guides/how-to-pass-ats', label: 'Comment passer l’ATS en 2026' },
      { href: '/guides/why-developers-get-rejected', label: 'Pourquoi les développeurs sont rejetés (sans jamais savoir pourquoi)' },
    ],
    authorLabel: 'À propos de l’auteur',
    authorBody:
      'Lenny Garnier — ingénieur logiciel junior, fondateur de RejectCheck. Ces règles viennent de plus de 200 refus pendant ma propre recherche d’emploi et des patterns que j’ai extraits en construisant l’outil.',
    faqH2: 'FAQ',
    faqItems: [
      {
        question: 'Ces conseils sont pour les juniors ou les seniors ?',
        answer:
          'Les deux. Les règles de format et d’ATS s’appliquent pareil. Le ton et les signaux de séniorité diffèrent — les juniors doivent se concentrer sur le conseil 9 (section Projets) et le conseil 3 (voix active). Les seniors doivent viser le conseil 4 (métriques d’impact) et le conseil 11 (signaux de séniorité alignés sur le poste).',
      },
      {
        question: 'Quelle longueur pour un CV d’ingénieur logiciel ?',
        answer:
          'Une page tant que tu n’as pas plus de 10 ans d’expérience pertinente. Le manager n’en lira pas plus. Chaque ligne doit justifier sa place — si une puce ne signale ni ownership, ni impact, ni techno pertinente, coupe-la.',
      },
      {
        question: 'Faut-il utiliser un template de CV créatif ?',
        answer:
          'Non. Une seule colonne, des intitulés standards, pas d’images, pas de zones de texte. Les templates créatifs cassent la lecture ATS et signalent de la « compensation » aux recruteurs. Sur ce support, le sobre bat le malin.',
      },
      {
        question: 'Comment faire ressortir un CV d’ingénieur junior ?',
        answer:
          'La section Projets. Deux ou trois projets vivants avec des README, déployés quelque part, dans la stack que demande l’offre. Les clones de tutos ne comptent pas. La section Projets, c’est là où les juniors construisent le signal technique que des années d’expérience apporteraient normalement.',
      },
      {
        question: 'Comment quantifier l’impact quand mon travail était modeste ?',
        answer:
          'Accroche-toi à tout ce qui est mesurable : nombre de coéquipiers, nombre d’utilisateurs internes, lignes de code relues par semaine, temps gagné par semaine, déploiements par semaine. « Cycle de déploiement réduit de 4 h à 30 min » est une métrique. « Vélocité de l’équipe améliorée » n’en est pas une.',
      },
      {
        question: 'Quel est le conseil le plus négligé ?',
        answer:
          'Nettoyer son GitHub avant de postuler. Le manager va l’ouvrir. Quelques repos vides, aucun README et un dernier commit datant de deux ans affaiblissent tout le CV, peu importe la qualité du reste.',
      },
    ],
    bottomCtaH2: 'Applique les 12 règles. Vérifie face à une vraie offre.',
    bottomCtaSub: '60 secondes. Calé sur une offre précise. Gratuit.',
    bottomCtaBtn: 'Tester gratuitement →',
    tips: [
      {
        n: '01',
        title: 'Exporte un PDF une seule colonne, sans encadrés ni images',
        body:
          'Tableaux, mises en page multi-colonnes, zones de texte et images intégrées cassent la lecture ATS. L’ATS extrait le texte brut et score le recouvrement de mots-clés. Si tes compétences sont dans un encadré latéral, l’ATS peut ne pas les voir du tout. Une seule colonne avec des intitulés de section standards, c’est ennuyeux et efficace.',
      },
      {
        n: '02',
        title: 'Reprends les mots-clés exacts de l’offre d’emploi',
        body:
          'L’ATS ne comprend pas les synonymes de façon fiable. Si l’offre dit « Kubernetes », écris « Kubernetes » — pas « K8s », pas « orchestration de conteneurs ». C’est de l’alignement, pas du bourrage. Le recruteur qui lit ensuite ne te pénalisera pas d’avoir repris le vocabulaire du poste.',
      },
      {
        n: '03',
        title: 'Emploie la voix active avec de l’ownership',
        body:
          'Les puces passives font junior. Les puces actives font senior. Le verbe signale ton niveau avant même que le lecteur traite le reste de la phrase.',
        example: {
          before: 'Travaillé sur un système de traitement des paiements qui gérait un fort trafic.',
          after:
            'Conçu et livré un pipeline de traitement des paiements gérant 40 000 requêtes/jour, avec une latence p95 sous les 200 ms.',
        },
      },
      {
        n: '04',
        title: 'Quantifie l’impact dans chaque puce',
        body:
          'Les chiffres ancrent la puce dans le réel. Sans eux, chaque puce passe pour une affirmation vague. Latence, échelle, débit, euros économisés, utilisateurs servis, fréquence de déploiement — prends celui qui est honnête et concret.',
        example: {
          before: 'Amélioré significativement les performances du système.',
          after:
            'Réduit la latence p99 de 1,2 s à 280 ms en remplaçant le fan-out synchrone par un pool de workers adossé à une file.',
        },
      },
      {
        n: '05',
        title: 'Mets ton lien GitHub dans l’en-tête — et nettoie-le d’abord',
        body:
          'Le manager va ouvrir ton GitHub. Quelques repos vides, aucun README, aucune activité récente — tout ça te dessert plus que de ne pas mettre GitHub du tout. Épingle 3 à 4 repos solides, écris un vrai README pour chacun, et assure-toi que les langages correspondent à ce que ton CV affirme.',
      },
      {
        n: '06',
        title: 'Liste 8 à 12 compétences, pas de « Notions de… »',
        body:
          'Une liste de 25 compétences signale de l’inflation, pas de l’étendue. « Notions de… » signale que le candidat y a à peine touché. Garde les 8 à 12 que tu as utilisées en production. Reprends exactement le vocabulaire de l’offre.',
      },
      {
        n: '07',
        title: 'Une page jusqu’à plus de 10 ans d’expérience',
        body:
          'Deux pages avec moins de 10 ans d’expérience, ça se lit comme gonflé. Le manager survole — chaque ligne doit signaler quelque chose. Coupe tout ce qui ne montre ni ownership, ni impact, ni techno pertinente.',
      },
      {
        n: '08',
        title: 'Utilise des intitulés de section standards',
        body:
          'Expérience, Formation, Compétences, Projets. Pas « Mon parcours », pas « Les technos que j’aime », pas « Ce que j’ai construit ». L’ATS mappe le contenu aux champs en reconnaissant ces libellés. Les intitulés créatifs risquent de faire sauter des champs entiers.',
      },
      {
        n: '09',
        title: 'Pour les juniors et les reconvertis, la section Projets est la plus forte',
        body:
          'Deux ou trois projets vivants avec des README, déployés là où les évaluateurs peuvent les voir, dans une stack que l’offre demande. Pour chaque projet : énoncé du problème en une ligne + ton choix technique + résultat. Les clones de tutos et les starters abandonnés ne comptent pas.',
      },
      {
        n: '10',
        title: 'Fais correspondre ton intitulé au poste visé',
        body:
          'Si tu postules pour « Backend Engineer » mais que l’en-tête de ton CV dit « Généraliste full-stack », tu crées un décalage instantané. L’alignement de l’intitulé fait partie des premières choses que le recruteur scanne. Ajuste sans mentir : choisis un vrai intitulé passé qui colle le plus possible au poste visé.',
      },
      {
        n: '11',
        title: 'Aligne tes signaux de séniorité sur le niveau du poste',
        body:
          'Un CV senior qui se lit junior perd face à un pair clairement senior. « J’ai pris en charge et livré » contre « J’ai aidé à construire », ça se lit à deux niveaux d’écart. Audite chaque puce pour le verbe. Si tu as mené le travail, dis-le. Si tu l’as soutenu, ne surenchéris pas — mais ne te sous-vends pas non plus.',
      },
      {
        n: '12',
        title: 'Vérifie face à l’offre précise avant d’envoyer',
        body:
          'Un CV optimisé pour une offre ne l’est pas pour la suivante. Avant de cliquer sur envoyer, lance un test ATS + humain calé sur ce poste. La liste de corrections est courte et concrète : en général 3 à 5 mots-clés manquants plus une ou deux reformulations. Itère à chaque offre, pas chaque trimestre.',
      },
    ],
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
      images: [{ url: `${SITE_URL}/${lang}/opengraph-image/main`, width: 1200, height: 630, alt: 'RejectCheck' }],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: c.title,
      description: c.description,
      // Re-declared so X renders an image (custom twitter object suppresses the auto card image).
      images: [`${SITE_URL}/${lang}/opengraph-image/main`],
    },
  }
}

export default async function SoftwareEngineerResumeTipsPage({
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
    { name: c.bcGuides, url: `${SITE_URL}/${lang}/guides` },
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

  return (
    <>
      <JsonLd id="ld-breadcrumb-se-tips" data={breadcrumbs} />
      <JsonLd id="ld-faq-se-tips" data={faqPageSchema(c.faqItems)} />
      <JsonLd id="ld-article-se-tips" data={article} />

      <div className="bg-rc-bg text-rc-text font-sans min-h-screen">
        <Navbar />

        <article className="max-w-[760px] mx-auto px-5 md:px-[40px] pt-16 pb-20 md:pt-24 md:pb-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-px w-6 bg-rc-red" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-red">
              {c.eyebrow}
            </span>
          </div>

          <h1 className="text-[36px] md:text-[52px] font-semibold leading-[1.1] tracking-[-0.025em] text-rc-text mb-6">
            {c.h1Pre}{' '}
            <span
              className="text-rc-red italic"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {c.h1Em}
            </span>{' '}
            {c.h1Post}
          </h1>

          <p className="text-rc-muted text-[16px] md:text-[17px] leading-[1.7] mb-10">
            {c.intro}
          </p>

          {/* TL;DR */}
          <div className="rounded-2xl border border-rc-border bg-rc-surface p-6 mb-12">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-red font-bold mb-3">
              {c.tldrLabel}
            </p>
            <ul className="space-y-2 text-[14px] text-rc-muted leading-[1.7]">
              {c.tldrItems.map((item) => (
                <li key={item.label}>
                  <strong className="text-rc-text">{item.label}</strong> — {item.body}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-10 text-[16px] leading-[1.8] text-rc-text">
            {c.tips.map((tip, idx) => (
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
                        {c.beforeLabel}
                      </p>
                      <p className="text-[14px] text-rc-hint leading-snug line-through">
                        {tip.example.before}
                      </p>
                    </div>
                    <div className="h-px bg-rc-border" />
                    <div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-rc-green font-bold mb-1.5">
                        {c.afterLabel}
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
                      {c.midCtaLabel}
                    </p>
                    <p className="text-rc-text text-[15px] leading-[1.7] mb-4">
                      {c.midCtaBody}
                    </p>
                    <Link
                      href={`${base}/analyze`}
                      className="inline-flex items-center gap-2 bg-rc-red text-white font-mono text-[11px] tracking-[0.14em] uppercase px-5 py-2.5 rounded-lg hover:bg-[#b83332] transition-all duration-200 no-underline"
                    >
                      {c.midCtaBtn}
                    </Link>
                  </div>
                )}
              </section>
            ))}

            {/* Cross-links */}
            <section className="border-t border-rc-border pt-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold mb-3">
                {c.relatedLabel}
              </p>
              <ul className="space-y-2 text-[14px] leading-[1.7]">
                {c.relatedLinks.map((l) => (
                  <li key={l.href}>
                    →{' '}
                    <Link
                      href={`${base}${l.href}`}
                      className="text-rc-red no-underline hover:underline font-medium"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            {/* Author */}
            <section className="border-t border-rc-border pt-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold mb-3">
                {c.authorLabel}
              </p>
              <p className="text-rc-muted text-[14px] leading-[1.7]">
                {c.authorBody}
              </p>
            </section>
          </div>

          {/* FAQ */}
          <section className="mt-16 pt-10 border-t border-rc-border">
            <h2 className="text-[24px] md:text-[28px] font-semibold tracking-[-0.02em] text-rc-text mb-6">
              {c.faqH2}
            </h2>
            <div className="space-y-3">
              {c.faqItems.map((item) => (
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
              {c.bottomCtaH2}
            </h2>
            <p className="text-rc-muted text-[14px] mb-6">
              {c.bottomCtaSub}
            </p>
            <Link
              href={`${base}/analyze`}
              className="inline-flex items-center gap-2.5 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-7 py-3.5 rounded-xl hover:bg-[#b83332] transition-all duration-200 no-underline"
            >
              {c.bottomCtaBtn}
            </Link>
          </div>
        </article>

        <BlueprintCta lang={lang} />
        <SeoFooter lang={lang} />
      </div>
    </>
  )
}
