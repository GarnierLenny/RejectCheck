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
  howToPassAtsSchema,
} from '../../../../components/JsonLd'
import { hasLocale, type Locale } from '../../dictionaries'

const PAGE_PATH = '/guides/how-to-pass-ats'
const PUBLISHED_ISO = '2026-04-29'
const LAST_UPDATED_ISO = '2026-04-29'
const canonicalFor = (lang: Locale) => `${SITE_URL}/${lang}${PAGE_PATH}`

type Faq = { question: string; answer: string }

type Copy = {
  title: string
  description: string
  bcHome: string
  bcGuides: string
  bcCurrent: string
  eyebrow: string
  h1: string
  intro: string
  tldrLabel: string
  tldr1Pre: string
  tldr1: string
  tldr2Pre: string
  tldr2: string
  tldr3Pre: string
  tldr3: string
  tldr4Pre: string
  tldr4: string
  s1H2: string
  s1P1: string
  s1P2: string
  s1Label: string
  s1List: string[]
  s2H2: string
  s2P1: string
  s2P2: string
  s2Label: string
  s2List: { pre: string; strong: string; post: string }[]
  s3H2: string
  s3P1: string
  s3Label: string
  s3List: { strong: string; post: string }[]
  ctaLabel: string
  ctaBody: string
  ctaBtn: string
  s4H2: string
  s4P1: string
  s4P2: string
  s5H2: string
  s5P1: string
  s5LinkPre: string
  s5LinkText: string
  s5LinkPost: string
  faqH2: string
  faqItems: Faq[]
  bottomH2: string
  bottomSub: string
  bottomBtn: string
}

const COPY: Record<Locale, Copy> = {
  en: {
    title: 'How to Pass ATS in 2026 — A Developer’s Guide',
    description:
      'Step-by-step for developers: how ATS works, the format traps that break parsing, and the keyword + structure rules that get your CV through to a human.',
    bcHome: 'Home',
    bcGuides: 'Guides',
    bcCurrent: 'How to Pass ATS',
    eyebrow: 'Guide · 12 min read',
    h1: 'How to pass ATS in 2026 — a developer’s guide.',
    intro:
      'The Applicant Tracking System is the first filter between you and a job. It is dumb on purpose. Once you understand how it works, passing it becomes a checklist — not a mystery.',
    tldrLabel: 'TL;DR',
    tldr1Pre: '1.',
    tldr1: 'Save your CV as a single-column PDF. No tables, no text boxes, no images.',
    tldr2Pre: '2.',
    tldr2: 'Use the exact keywords from the job description — “Kubernetes”, not “K8s”.',
    tldr3Pre: '3.',
    tldr3: 'Use standard section headings: Experience, Education, Skills, Projects.',
    tldr4Pre: '4.',
    tldr4: 'Verify against the specific job description with an ATS checker before submitting.',
    s1H2: '1. Format your CV for plain-text parsing',
    s1P1:
      'The ATS extracts raw text from your PDF. It does not see your design. If your skills are in a fancy box, listed in a sidebar, or rendered as part of an image, the ATS often does not catch them at all.',
    s1P2:
      'The fix is structural, not aesthetic. A single-column layout with standard headings reads cleanly to both the ATS and the recruiter who comes next.',
    s1Label: 'Format traps to avoid',
    s1List: [
      '— Multi-column layouts (skills in a sidebar, experience in the main column)',
      '— Tables for experience or skills sections',
      '— Text boxes, callouts, or speech-bubble graphics',
      '— Images with embedded text (logos, icons containing skill names)',
      '— Headers and footers (parsed inconsistently or skipped entirely)',
      '— Decorative fonts or font sizes below 10pt',
    ],
    s2H2: '2. Mirror the job description’s exact phrasing',
    s2P1:
      'The ATS scores keyword overlap. It does not understand that “K8s” and “Kubernetes” are the same thing — at least not reliably. It does not know that “React” and “React.js” mean the same. Match the exact tokens the JD uses.',
    s2P2:
      'This is not stuffing. This is alignment. If you have used the technology, write it in the JD’s language. The recruiter scanning your CV next will not penalize you for matching the role’s vocabulary.',
    s2Label: 'Where to place keywords',
    s2List: [
      { pre: '— A dedicated ', strong: 'Skills', post: ' section listing the JD’s hard skills you have' },
      { pre: '— Inside ', strong: 'experience bullets', post: ', where the keyword has context (“Built X with Kubernetes and Helm”)' },
      { pre: '— In your ', strong: 'title or summary', post: ' if the JD repeats it (e.g. “Backend Engineer”)' },
      { pre: '— ', strong: 'Not', post: ' in white text or hidden fields — modern ATS detect this and penalize' },
    ],
    s3H2: '3. Use standard section headings',
    s3P1:
      'ATS parsers map content into structured fields by looking for known section labels. “My Journey”, “Tech I Love”, “Things I’ve Shipped” sound personal but they may not map cleanly.',
    s3Label: 'Use these labels',
    s3List: [
      { strong: 'Experience', post: ' (or Work Experience / Professional Experience)' },
      { strong: 'Education', post: '' },
      { strong: 'Skills', post: ' (or Technical Skills)' },
      { strong: 'Projects', post: ' (especially valuable for junior devs)' },
      { strong: 'Certifications', post: ' if relevant' },
    ],
    ctaLabel: 'Skip the guesswork',
    ctaBody:
      'Run your CV through the ATS checker against the actual job you want. You get the missing keywords with point values, format flags, and prioritized fixes — free, no signup.',
    ctaBtn: 'Run free ATS check →',
    s4H2: '4. Verify before you submit',
    s4P1:
      'The ATS score is per-job. A CV that passes for one posting may fail for the next. Before you click submit, run an ATS check tailored to the specific job description. The fix list is small and concrete: usually 3 to 5 missing keywords plus one or two structural flags.',
    s4P2:
      'A 30-second check before applying changes the math. You go from blind shots to aimed iterations. Each rejection becomes a data point you can act on, not a silent failure.',
    s5H2: 'After the ATS, three more layers',
    s5P1:
      'Passing the ATS is necessary, not sufficient. Your CV next reaches an HR recruiter scanning for red flags in 6 seconds, then a hiring manager checking GitHub, LinkedIn, and seniority signals. A CV optimized for the ATS but stuffed with red flags still gets rejected — just one stage later.',
    s5LinkPre: 'The full breakdown of all three layers is here: ',
    s5LinkText: 'Why developers get rejected',
    s5LinkPost: '.',
    faqH2: 'FAQ',
    faqItems: [
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
    ],
    bottomH2: 'Now run the check on your CV.',
    bottomSub: '60 seconds. No signup. Tailored to one specific job description.',
    bottomBtn: 'Run free ATS check →',
  },
  fr: {
    title: 'Comment Passer l’ATS en 2026 — Guide Développeur',
    description:
      'Pas à pas pour les développeurs : comment fonctionne l’ATS, les pièges de mise en forme qui cassent la lecture automatique, et les règles de mots-clés et de structure pour faire passer ton CV compatible ATS jusqu’à un humain.',
    bcHome: 'Accueil',
    bcGuides: 'Guides',
    bcCurrent: 'Comment passer l’ATS',
    eyebrow: 'Guide · 12 min de lecture',
    h1: 'Comment passer l’ATS en 2026 — le guide du développeur.',
    intro:
      'L’Applicant Tracking System est le premier filtre entre toi et un poste. Il est bête par conception. Une fois que tu comprends comment il marche, passer les filtres ATS devient une checklist — plus un mystère.',
    tldrLabel: 'TL;DR',
    tldr1Pre: '1.',
    tldr1: 'Enregistre ton CV en PDF une seule colonne. Pas de tableaux, pas de zones de texte, pas d’images.',
    tldr2Pre: '2.',
    tldr2: 'Reprends les mots-clés exacts de l’offre d’emploi — « Kubernetes », pas « K8s ».',
    tldr3Pre: '3.',
    tldr3: 'Utilise des intitulés de sections standards : Expérience, Formation, Compétences, Projets.',
    tldr4Pre: '4.',
    tldr4: 'Vérifie ton CV face à l’offre précise avec un checker ATS avant d’envoyer.',
    s1H2: '1. Mets en forme ton CV pour la lecture en texte brut',
    s1P1:
      'L’ATS extrait le texte brut de ton PDF. Il ne voit pas ton design. Si tes compétences sont dans un joli encadré, listées dans une colonne latérale ou intégrées à une image, l’ATS ne les capte souvent pas du tout.',
    s1P2:
      'La correction est structurelle, pas esthétique. Une mise en page sur une seule colonne avec des intitulés standards se lit proprement, autant pour l’ATS que pour le recruteur qui passe ensuite.',
    s1Label: 'Pièges de mise en forme à éviter',
    s1List: [
      '— Mises en page multi-colonnes (compétences dans une colonne latérale, expérience dans la colonne principale)',
      '— Tableaux pour les sections expérience ou compétences',
      '— Zones de texte, encadrés ou bulles de dialogue',
      '— Images avec texte intégré (logos, icônes contenant des noms de compétences)',
      '— En-têtes et pieds de page (lus de façon incohérente ou ignorés entièrement)',
      '— Polices décoratives ou tailles de police sous 10pt',
    ],
    s2H2: '2. Reprends la formulation exacte de l’offre',
    s2P1:
      'L’ATS score le recouvrement de mots-clés. Il ne comprend pas que « K8s » et « Kubernetes » sont la même chose — du moins pas de façon fiable. Il ne sait pas que « React » et « React.js » désignent la même technologie. Reprends les termes exacts utilisés dans l’offre.',
    s2P2:
      'Ce n’est pas du bourrage de mots-clés. C’est de l’alignement. Si tu as utilisé la technologie, écris-la dans les mots de l’offre. Le recruteur qui scannera ton CV ensuite ne te reprochera pas de reprendre le vocabulaire du poste.',
    s2Label: 'Où placer les mots-clés',
    s2List: [
      { pre: '— Une section ', strong: 'Compétences', post: ' dédiée, listant les compétences techniques de l’offre que tu maîtrises' },
      { pre: '— Dans les ', strong: 'puces d’expérience', post: ', où le mot-clé a du contexte (« Construit X avec Kubernetes et Helm »)' },
      { pre: '— Dans ton ', strong: 'intitulé ou ton accroche', post: ' si l’offre le répète (par ex. « Backend Engineer »)' },
      { pre: '— ', strong: 'Surtout pas', post: ' en texte blanc ou champs cachés — les ATS modernes le détectent et pénalisent' },
    ],
    s3H2: '3. Utilise des intitulés de sections standards',
    s3P1:
      'Les ATS rangent le contenu dans des champs structurés en repérant des intitulés de sections connus. « Mon parcours », « Les techs que j’aime », « Ce que j’ai livré » font personnel, mais ils peuvent ne pas se ranger correctement.',
    s3Label: 'Utilise ces intitulés',
    s3List: [
      { strong: 'Expérience', post: ' (ou Expérience professionnelle)' },
      { strong: 'Formation', post: '' },
      { strong: 'Compétences', post: ' (ou Compétences techniques)' },
      { strong: 'Projets', post: ' (particulièrement utile pour les devs juniors)' },
      { strong: 'Certifications', post: ' si pertinent' },
    ],
    ctaLabel: 'Arrête de deviner',
    ctaBody:
      'Passe ton CV dans le checker ATS face à l’offre que tu vises vraiment. Tu obtiens les mots-clés manquants avec leur poids, les alertes de mise en forme et les corrections priorisées — gratuit, sans inscription.',
    ctaBtn: 'Tester mon CV gratuitement →',
    s4H2: '4. Vérifie avant d’envoyer',
    s4P1:
      'Le score ATS est calculé par offre. Un CV qui passe pour une annonce peut échouer pour la suivante. Avant de cliquer sur envoyer, lance un test ATS calé sur l’offre précise. La liste de corrections est courte et concrète : en général 3 à 5 mots-clés manquants et une ou deux alertes structurelles.',
    s4P2:
      'Un test de 30 secondes avant de postuler change tout. Tu passes de tirs à l’aveugle à des itérations ciblées. Chaque rejet devient une donnée sur laquelle agir, plus un échec silencieux.',
    s5H2: 'Après l’ATS, trois couches de plus',
    s5P1:
      'Passer l’ATS est nécessaire, pas suffisant. Ton CV arrive ensuite chez un recruteur RH qui cherche des signaux d’alerte en 6 secondes, puis chez un manager qui vérifie ton GitHub, ton LinkedIn et tes signaux de séniorité. Un CV optimisé pour l’ATS mais bourré de signaux d’alerte est quand même rejeté — juste une étape plus tard.',
    s5LinkPre: 'Le détail complet des trois couches est ici : ',
    s5LinkText: 'Pourquoi les développeurs sont rejetés',
    s5LinkPost: '.',
    faqH2: 'FAQ',
    faqItems: [
      {
        question: 'Toutes les entreprises utilisent-elles un ATS ?',
        answer:
          'La plupart des moyennes et grandes entreprises, surtout dans la tech. Une seule annonce peut recevoir 200 à 1 000+ candidatures — la lecture manuelle à ce volume est impossible. L’ATS est un filtre, pas un choix.',
      },
      {
        question: 'Reprendre les mots-clés exacts, n’est-ce pas du bourrage de mots-clés ?',
        answer:
          'Non, si c’est honnête. L’ATS récompense les correspondances exactes parce qu’il ne sait pas juger le sens. Si l’offre dit « Kubernetes » et que tu l’as utilisé, écris « Kubernetes » — pas « K8s », pas « orchestration de conteneurs ». Le recruteur qui lit ensuite ne te pénalisera pas pour avoir repris ses propres termes.',
      },
      {
        question: 'Faut-il un CV différent pour chaque candidature ?',
        answer:
          'Tu devrais au minimum ajuster les compétences et la formulation des puces pour coller à l’offre. Même contenu, surface différente. Le score ATS se fait par offre — un CV optimisé pour un poste ne l’est pas pour un autre.',
      },
      {
        question: 'PDF ou DOCX — qu’est-ce que l’ATS préfère ?',
        answer:
          'La plupart des ATS modernes gèrent les deux. Le format compte moins que la structure : une seule colonne, des intitulés standards, pas d’images, pas de zones de texte. Un PDF propre bat un DOCX sophistiqué à chaque fois.',
      },
      {
        question: 'Comment savoir si mon CV passe l’ATS ?',
        answer:
          'Passe-le dans un checker ATS face à l’offre précise. RejectCheck simule la couche de lecture et de scoring et renvoie les mots-clés manquants avec leur poids, plus toute alerte de mise en forme qui casserait la lecture automatique.',
      },
    ],
    bottomH2: 'Maintenant, teste ton CV.',
    bottomSub: '60 secondes. Sans inscription. Calé sur une offre d’emploi précise.',
    bottomBtn: 'Tester mon CV gratuitement →',
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

export default async function HowToPassAtsPage({
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
    // Match the other two guides: named Person author for consistent E-E-A-T.
    author: { type: 'Person', name: 'Lenny Garnier' },
  })

  return (
    <>
      <JsonLd id="ld-breadcrumb-how-to-pass-ats" data={breadcrumbs} />
      <JsonLd id="ld-faq-how-to-pass-ats" data={faqPageSchema(c.faqItems)} />
      <JsonLd id="ld-article-how-to-pass-ats" data={article} />
      <JsonLd id="ld-howto-how-to-pass-ats" data={howToPassAtsSchema(canonical)} />

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
            {c.h1}
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
              <li>
                <strong className="text-rc-text">{c.tldr1Pre}</strong> {c.tldr1}
              </li>
              <li>
                <strong className="text-rc-text">{c.tldr2Pre}</strong> {c.tldr2}
              </li>
              <li>
                <strong className="text-rc-text">{c.tldr3Pre}</strong> {c.tldr3}
              </li>
              <li>
                <strong className="text-rc-text">{c.tldr4Pre}</strong> {c.tldr4}
              </li>
            </ul>
          </div>

          <div className="space-y-12 text-[16px] leading-[1.8] text-rc-text">
            <section id="step-format">
              <h2 className="text-[26px] md:text-[30px] font-semibold tracking-[-0.02em] text-rc-text mb-4 mt-2">
                {c.s1H2}
              </h2>
              <p className="text-rc-muted mb-4">
                {c.s1P1}
              </p>
              <p className="text-rc-muted mb-4">
                {c.s1P2}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold mt-6 mb-3">
                {c.s1Label}
              </p>
              <ul className="space-y-2 text-rc-muted">
                {c.s1List.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section id="step-keywords">
              <h2 className="text-[26px] md:text-[30px] font-semibold tracking-[-0.02em] text-rc-text mb-4 mt-2">
                {c.s2H2}
              </h2>
              <p className="text-rc-muted mb-4">
                {c.s2P1}
              </p>
              <p className="text-rc-muted mb-4">
                {c.s2P2}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold mt-6 mb-3">
                {c.s2Label}
              </p>
              <ul className="space-y-2 text-rc-muted">
                {c.s2List.map((item) => (
                  <li key={item.strong}>{item.pre}<strong className="text-rc-text">{item.strong}</strong>{item.post}</li>
                ))}
              </ul>
            </section>

            <section id="step-headings">
              <h2 className="text-[26px] md:text-[30px] font-semibold tracking-[-0.02em] text-rc-text mb-4 mt-2">
                {c.s3H2}
              </h2>
              <p className="text-rc-muted mb-4">
                {c.s3P1}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold mt-6 mb-3">
                {c.s3Label}
              </p>
              <ul className="space-y-2 text-rc-muted">
                {c.s3List.map((item) => (
                  <li key={item.strong}>— <strong className="text-rc-text">{item.strong}</strong>{item.post}</li>
                ))}
              </ul>
            </section>

            {/* Mid-article CTA */}
            <div className="rounded-2xl border border-rc-red/30 bg-rc-red/5 p-6 my-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-red font-bold mb-2">
                {c.ctaLabel}
              </p>
              <p className="text-rc-text text-[15px] leading-[1.7] mb-4">
                {c.ctaBody}
              </p>
              <Link
                href={`${base}/analyze`}
                className="inline-flex items-center gap-2 bg-rc-red text-white font-mono text-[11px] tracking-[0.14em] uppercase px-5 py-2.5 rounded-lg hover:bg-[#b83332] transition-all duration-200 no-underline"
              >
                {c.ctaBtn}
              </Link>
            </div>

            <section id="step-verify">
              <h2 className="text-[26px] md:text-[30px] font-semibold tracking-[-0.02em] text-rc-text mb-4 mt-2">
                {c.s4H2}
              </h2>
              <p className="text-rc-muted mb-4">
                {c.s4P1}
              </p>
              <p className="text-rc-muted mb-4">
                {c.s4P2}
              </p>
            </section>

            <section>
              <h2 className="text-[26px] md:text-[30px] font-semibold tracking-[-0.02em] text-rc-text mb-4 mt-2">
                {c.s5H2}
              </h2>
              <p className="text-rc-muted mb-4">
                {c.s5P1}
              </p>
              <p className="text-rc-muted">
                {c.s5LinkPre}
                <Link
                  href={`${base}/guides/why-developers-get-rejected`}
                  className="text-rc-red no-underline hover:underline font-medium"
                >
                  {c.s5LinkText}
                </Link>
                {c.s5LinkPost}
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
              {c.bottomH2}
            </h2>
            <p className="text-rc-muted text-[14px] mb-6">
              {c.bottomSub}
            </p>
            <Link
              href={`${base}/analyze`}
              className="inline-flex items-center gap-2.5 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-7 py-3.5 rounded-xl hover:bg-[#b83332] transition-all duration-200 no-underline"
            >
              {c.bottomBtn}
            </Link>
          </div>
        </article>

        <BlueprintCta lang={lang} />
        <SeoFooter lang={lang} />
      </div>
    </>
  )
}
