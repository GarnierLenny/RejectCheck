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

const PAGE_PATH = '/guides/why-developers-get-rejected'
const PUBLISHED_ISO = '2026-04-29'
const LAST_UPDATED_ISO = '2026-04-29'
const canonicalFor = (lang: Locale) => `${SITE_URL}/${lang}${PAGE_PATH}`

type RedFlag = { n: string; title: string; body: string }
type PlanCard = { n: string; title: string; items: string[] }
type RelatedLink = { href: string; label: string }
type Faq = { question: string; answer: string }

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
  introP1: string
  introP2: string
  tldrLabel: string
  tldrItems: { strong: string; rest: string }[]
  p1Label: string
  p1H2: string
  p1Body: string
  layer1H3: string
  layer1P1: string
  layer1P2: string
  layer1P3Pre: string
  layer1P3Link: string
  layer1P3Post: string
  layer2H3: string
  layer2P1: string
  layer2P2Strong: string
  layer2P2Rest: string
  redFlagsLabel: string
  redFlags: RedFlag[]
  layer3H3: string
  layer3P1: string
  layer3P2: string
  layer3P3Pre: string
  layer3P3Em: string
  layer3P4Pre: string
  layer3P4q1: string
  layer3P4Mid: string
  layer3P4q2: string
  layer3P4Post: string
  midCtaLabel: string
  midCtaBody: string
  midCtaBtn: string
  p2Label: string
  p2H2: string
  p2P1: string
  p2P2Pre: string
  p2P2Em: string
  p2P3: string
  seniorityH3: string
  seniorityP1: string
  juniorLabel: string
  juniorSignals: string[]
  seniorLabel: string
  seniorSignals: string[]
  seniorityP2: string
  jobStoryH3: string
  jobStoryP1: string
  jobStoryP2: string
  onlineH3: string
  onlineP1: string
  onlineP2: string
  p3Label: string
  p3H2: string
  p3P1: string
  p3P2: string
  planCards: PlanCard[]
  p3P3: string
  relatedLabel: string
  relatedLinks: RelatedLink[]
  authorLabel: string
  authorBio: string
  authorMediumPre: string
  authorMediumLink: string
  faqH2: string
  faqItems: Faq[]
  ctaH2: string
  ctaSub: string
  ctaBtn: string
}

const COPY: Record<Locale, Copy> = {
  en: {
    title: 'Why Developers Get Rejected (2026)',
    description:
      'The three filters between Submit and the interview: ATS, the 6-second HR scan, and the hiring manager review. 9 red flags and how to iterate on rejections.',
    bcHome: 'Home',
    bcGuides: 'Guides',
    bcCurrent: 'Why Developers Get Rejected',
    eyebrow: 'Guide · 14 min read',
    h1Pre: 'Why developers get rejected',
    h1Em: '(and never find out why)',
    h1Post: '.',
    introP1:
      'I’m a junior software engineer. I got rejected 200+ times before I figured out the application pipeline is a black box — and that you can crack it open.',
    introP2:
      'This is the breakdown: the three filters between “Submit” and an interview, the signals each one weighs, and a framework to iterate on every rejection instead of taking it personally.',
    tldrLabel: 'TL;DR',
    tldrItems: [
      {
        strong: '3 filters',
        rest: ' stand between you and the interview: ATS (machine), HR (6-second human scan), hiring manager (signal review).',
      },
      {
        strong: '9 red flags',
        rest: ' kill your CV at the HR layer in seconds.',
      },
      {
        strong: 'Tone',
        rest: ' tells the hiring manager your seniority before they read a single bullet.',
      },
      {
        strong: 'Each rejection is data.',
        rest: ' Iterate on it. The fastest hires are not the most talented — they iterate fastest.',
      },
    ],
    p1Label: 'Part 1',
    p1H2: 'The invisible pipeline',
    p1Body:
      'A single mid-sized tech job posting receives 200 to 1,000+ applications. Manual review at that volume is impossible — not out of laziness, out of arithmetic. So between “Submit” and “Unfortunately…”, three filters stand in the way.',
    layer1H3: 'Layer 1 — The ATS',
    layer1P1:
      'The Applicant Tracking System is software, not a human. It parses your CV into plain text and scores keyword overlap with the job description. It does not read between the lines. It does not look at your projects.',
    layer1P2:
      'If your CV lists a skill in a fancy box, the ATS may not catch it. If the JD says “Kubernetes” and you wrote “K8s”, the match weakens. The ATS is dumb on purpose. Once you understand that, passing it becomes a checklist.',
    layer1P3Pre: 'Full breakdown: ',
    layer1P3Link: 'How to pass ATS in 2026',
    layer1P3Post: '.',
    layer2H3: 'Layer 2 — The HR recruiter (6-second scan)',
    layer2P1:
      'If your CV passes the ATS, it lands in front of a human — usually an HR recruiter, not a developer. Someone who may not know the difference between Python and JavaScript, or between mid-level and senior. That sounds unfair, but the math forces it: developers cannot review every CV that survives the ATS.',
    layer2P2Strong: '6 seconds.',
    layer2P2Rest:
      ' That’s the average time an HR recruiter spends making the keep-or-cut decision. They do not read. They scan. They look at your current title, the companies you have worked at, tenure length, and whether anything visually stands out — for the right or wrong reason.',
    redFlagsLabel: 'The 9 red flags that kill your CV at this layer',
    redFlags: [
      {
        n: '01',
        title: 'Short stays at every company',
        body: 'Pattern reads as: trouble staying consistent. Likely to lose motivation again.',
      },
      {
        n: '02',
        title: 'Big unexplained gaps between jobs',
        body: 'What happened during those gaps? Side projects? Burnout? Money? Without context, the recruiter assumes the worst.',
      },
      {
        n: '03',
        title: '2+ pages with less than 10 years of experience',
        body: 'Reads as inflated content. The bar for adding length is high — most engineers under 10 years should fit on one page.',
      },
      {
        n: '04',
        title: 'Too colorful, too many graphics',
        body: 'Heavy design reads as compensation. Clean structure beats fancy layout every time.',
      },
      {
        n: '05',
        title: 'Font too fancy or too small',
        body: 'If it is hard to read in 6 seconds, it gets cut. Skim-ability matters more than aesthetics.',
      },
      {
        n: '06',
        title: 'Unprofessional touches',
        body: 'Selfie profile photo, dragonslayer2003@hotmail.com, typos. Each one shaves credibility. A few combined kill it.',
      },
      {
        n: '07',
        title: 'Inconsistencies CV ↔ LinkedIn',
        body: 'Overlapping job dates. 5 years of experience but graduated 3 years ago. Title on CV different from LinkedIn. One inconsistency makes the recruiter doubt all of it.',
      },
      {
        n: '08',
        title: 'Too many skills',
        body: 'Listing 40 technologies does not prove competence — it signals inflation. Pick the 8–12 you actually use.',
      },
      {
        n: '09',
        title: '"Familiar with…" sections',
        body: 'Code for: I have not actually used this. Recruiters and hiring managers both read this as filler.',
      },
    ],
    layer3H3: 'Layer 3 — The hiring manager (signal review)',
    layer3P1:
      'If you pass HR, your CV finally reaches someone technical. They will work with you, manage you, or be your future colleague. They know what the job requires because they do it themselves. They look at your application completely differently from HR.',
    layer3P2:
      'The first thing a technical hiring manager often does is open your GitHub. Not to read every line. To get a feel. Do you code outside of work? Are your projects real or tutorial clones? Do your repos have READMEs? Is there recent activity, or was the last commit two years ago?',
    layer3P3Pre:
      'They cross-reference CV ↔ LinkedIn ↔ GitHub — not necessarily to catch lies, but because consistency reduces uncertainty. The single question they keep asking themselves is: ',
    layer3P3Em: 'is this candidate experienced enough for the job?',
    layer3P4Pre: 'In a pool of 10–20 shortlisted candidates, ',
    layer3P4q1: 'almost senior',
    layer3P4Mid: ' loses to ',
    layer3P4q2: 'clearly senior',
    layer3P4Post: ' every single time.',
    midCtaLabel: 'Audit all three layers in 60 seconds',
    midCtaBody:
      'RejectCheck runs your CV against the ATS layer, the HR scan layer (red-flag detection, format audit), and the hiring manager layer (GitHub signal, LinkedIn consistency, seniority audit) — tailored to one specific job.',
    midCtaBtn: 'Run free diagnosis →',
    p2Label: 'Part 2',
    p2H2: 'The blind spots',
    p2P1:
      'Bold guess: you are probably suited for the job. What stands between you and it is the gap between reality and what your CV shows. Your application is a story. To you it is obvious. To the HR and the hiring manager, it is hard to read.',
    p2P2Pre:
      'Classic example: you spent 6 months building a payment system that handled thousands of transactions a day, dealt with edge cases, integrated external APIs, and shipped to production without a single incident. Your CV says: ',
    p2P2Em: '“Worked on backend payment features.”',
    p2P3: 'That gap is what kills you — not the skills.',
    seniorityH3: 'The seniority trap — junior vs senior signals',
    seniorityP1:
      'Most developers do not know what level they actually read at. Their CV is signaling — they just do not see it. The hiring manager picks up on tone within seconds.',
    juniorLabel: 'Junior signals',
    juniorSignals: [
      '— “I worked on…”',
      '— “I helped build…”',
      '— “I used React”',
      '— Only side projects on GitHub',
      '— No metrics, only task descriptions',
      '— Passive voice throughout',
    ],
    seniorLabel: 'Senior signals',
    seniorSignals: [
      '— “I owned and shipped…”',
      '— “I designed and led…”',
      '— “I architected the frontend”',
      '— Live projects with users',
      '— Impact metrics (latency, scale, $$, users)',
      '— Active voice, ownership language',
    ],
    seniorityP2:
      'Same person, same work — different framing. The hiring manager reads seniority off the verbs before they reach the bullet’s content.',
    jobStoryH3: 'Each job has its own story too',
    jobStoryP1:
      'Two companies post the exact same job title with the exact same required skills. One is a Series A startup that needs someone to build fast and break things. The other is a scale-up that needs someone to stabilize a codebase that grew too fast. Same title. Same tech. Completely different ideal candidate.',
    jobStoryP2:
      'Your CV needs to speak the same language as the job’s story. Not lie — tell. Before applying, spend 10 minutes on these questions: what problem is this company trying to solve by hiring? What do they expect 6 months from now? 1 year from now? Then ask: does my CV speak the same language?',
    onlineH3: 'Your online presence is part of the application',
    onlineP1:
      'Your CV is half the story. GitHub, LinkedIn, anything indexable on Google — all of it is part of your application, whether you optimize it or not. The hiring manager will look. The cross-reference is not optional from their side.',
    onlineP2:
      'Reverse the exercise. Find developers on LinkedIn who already have the job you want. Spend 30 minutes per profile. Read their CV, GitHub, LinkedIn, Google search. Map the timeline. What do they do? What would you change about yours? The ones who got hired are not magic — their pattern is visible.',
    p3Label: 'Part 3',
    p3H2: 'The plan — iterate, do not blind-shot',
    p3P1:
      'The real issue is not skill. It is system. Most developers apply blind. Each application is a one-off. No feedback loop. No data captured. Two hundred applications later, they have learned nothing.',
    p3P2:
      'The moment you treat rejections as data, the math changes. You are not someone who got rejected 200 times. You are someone who ran 200 experiments. Some taught you the CV was unclear. Some taught you the level was off. Some taught you the GitHub was sending the wrong signal. Each rejection — painful as it is — is information.',
    planCards: [
      {
        n: '01',
        title: 'Before applying',
        items: [
          '— Audit CV / GitHub / LinkedIn',
          '— Read your CV from a stranger’s POV',
          '— Ask: is the story clear?',
        ],
      },
      {
        n: '02',
        title: 'For the job',
        items: [
          '— Mirror JD’s exact keywords',
          '— Adapt your story to theirs',
          '— Confirm seniority alignment',
        ],
      },
      {
        n: '03',
        title: 'After rejection',
        items: [
          '— Treat it as data, not failure',
          '— Identify which layer cut you',
          '— Adjust for the next application',
        ],
      },
    ],
    p3P3:
      'Doing all of this manually for every job is exhausting — reading the JD, cross-referencing the CV, checking keyword match, auditing GitHub, scanning LinkedIn. It is a lot. That is the reason RejectCheck exists. I built it because I needed it. It worked for me. It is free to try.',
    relatedLabel: 'Go deeper',
    relatedLinks: [
      {
        href: '/guides/software-engineer-resume-tips',
        label: 'Software Engineer Resume Tips — 12 rules ranked by impact',
      },
      {
        href: '/software-engineer-cv',
        label: 'Software Engineer CV — full structural guide',
      },
      {
        href: '/cv-review',
        label: 'Get a deep CV review for your specific role',
      },
    ],
    authorLabel: 'About the author',
    authorBio:
      'Lenny Garnier — junior software engineer, founder of RejectCheck. Got rejected 200+ times before building the tool I wished existed.',
    authorMediumPre: 'A longer narrative version of this guide lives on Medium: ',
    authorMediumLink: 'Why Developers Get Rejected (And Never Find Out Why) ↗',
    faqH2: 'FAQ',
    faqItems: [
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
    ],
    ctaH2: 'Stop applying blind. Start iterating.',
    ctaSub: 'Free first scan. ATS + HR red flags + hiring manager signals — one pass.',
    ctaBtn: 'Run free diagnosis →',
  },
  fr: {
    title: 'Pourquoi les Développeurs sont Rejetés (2026)',
    description:
      'Les trois filtres entre « Postuler » et l’entretien : l’ATS, le scan RH de 6 secondes et la revue du manager. 9 signaux d’alerte et comment itérer sur chaque candidature développeur rejetée.',
    bcHome: 'Accueil',
    bcGuides: 'Guides',
    bcCurrent: 'Pourquoi les développeurs sont rejetés',
    eyebrow: 'Guide · 14 min de lecture',
    h1Pre: 'Pourquoi ton CV est refusé',
    h1Em: '(et pourquoi tu ne le sauras jamais)',
    h1Post: '.',
    introP1:
      'Je suis développeur junior. Je me suis fait rejeter plus de 200 fois avant de comprendre que le processus de candidature est une boîte noire — et qu’on peut l’ouvrir.',
    introP2:
      'Voici le décryptage : les trois filtres entre « Postuler » et un entretien, les signaux que chacun analyse, et une méthode pour itérer sur chaque rejet au lieu de le prendre personnellement.',
    tldrLabel: 'EN BREF',
    tldrItems: [
      {
        strong: '3 filtres',
        rest: ' te séparent de l’entretien : l’ATS (machine), les RH (scan humain de 6 secondes), le manager (revue des signaux).',
      },
      {
        strong: '9 signaux d’alerte',
        rest: ' tuent ton CV au niveau RH en quelques secondes.',
      },
      {
        strong: 'Le ton',
        rest: ' indique au manager ta séniorité avant même qu’il ne lise une seule ligne.',
      },
      {
        strong: 'Chaque rejet est une donnée.',
        rest: ' Itère dessus. Les profils embauchés le plus vite ne sont pas les plus talentueux — ce sont ceux qui itèrent le plus vite.',
      },
    ],
    p1Label: 'Partie 1',
    p1H2: 'Le processus invisible',
    p1Body:
      'Une seule offre tech de taille moyenne reçoit de 200 à plus de 1 000 candidatures. Une revue manuelle à ce volume est impossible — pas par paresse, par arithmétique. Alors entre « Postuler » et « Malheureusement… », trois filtres se dressent sur ta route.',
    layer1H3: 'Couche 1 — L’ATS',
    layer1P1:
      'L’Applicant Tracking System est un logiciel, pas un humain. Il convertit ton CV en texte brut et score le recouvrement de mots-clés avec l’offre d’emploi. Il ne lit pas entre les lignes. Il ne regarde pas tes projets.',
    layer1P2:
      'Si ton CV met une compétence dans un joli encadré, l’ATS risque de ne pas la voir. Si l’offre dit « Kubernetes » et que tu as écrit « K8s », la correspondance s’affaiblit. L’ATS est bête par conception. Une fois que tu l’as compris, le passer devient une simple checklist.',
    layer1P3Pre: 'Le décryptage complet : ',
    layer1P3Link: 'Comment passer l’ATS en 2026',
    layer1P3Post: '.',
    layer2H3: 'Couche 2 — Le recruteur RH (scan de 6 secondes)',
    layer2P1:
      'Si ton CV passe l’ATS, il atterrit devant un humain — généralement un recruteur RH, pas un développeur. Quelqu’un qui ne fait peut-être pas la différence entre Python et JavaScript, ou entre un profil intermédiaire et un senior. Ça paraît injuste, mais les maths l’imposent : les développeurs ne peuvent pas relire chaque CV qui survit à l’ATS.',
    layer2P2Strong: '6 secondes.',
    layer2P2Rest:
      ' C’est le temps moyen qu’un recruteur RH passe à décider de garder ou d’écarter. Il ne lit pas. Il scanne. Il regarde ton intitulé actuel, les entreprises où tu as bossé, la durée de chaque poste, et si quelque chose ressort visuellement — en bien ou en mal.',
    redFlagsLabel: 'Les 9 signaux d’alerte qui tuent ton CV à ce niveau',
    redFlags: [
      {
        n: '01',
        title: 'Des passages courts dans chaque entreprise',
        body: 'Le motif se lit comme : du mal à rester constant. Risque de perdre la motivation à nouveau.',
      },
      {
        n: '02',
        title: 'De grands trous inexpliqués entre deux postes',
        body: 'Que s’est-il passé pendant ces trous ? Des projets perso ? Un burnout ? Une question d’argent ? Sans contexte, le recruteur imagine le pire.',
      },
      {
        n: '03',
        title: '2 pages ou plus avec moins de 10 ans d’expérience',
        body: 'Ça se lit comme un contenu gonflé. La barre pour ajouter de la longueur est haute — la plupart des ingénieurs avec moins de 10 ans doivent tenir sur une page.',
      },
      {
        n: '04',
        title: 'Trop coloré, trop de graphismes',
        body: 'Un design chargé se lit comme une compensation. Une structure claire bat une mise en page tape-à-l’œil à tous les coups.',
      },
      {
        n: '05',
        title: 'Police trop fantaisiste ou trop petite',
        body: 'Si c’est dur à lire en 6 secondes, c’est éliminé. La lisibilité au survol compte plus que l’esthétique.',
      },
      {
        n: '06',
        title: 'Des touches peu professionnelles',
        body: 'Photo de profil en selfie, dragonslayer2003@hotmail.com, fautes de frappe. Chacune grignote ta crédibilité. Quelques-unes combinées la tuent.',
      },
      {
        n: '07',
        title: 'Incohérences CV ↔ LinkedIn',
        body: 'Des dates de postes qui se chevauchent. 5 ans d’expérience mais diplômé il y a 3 ans. Un intitulé sur le CV différent de LinkedIn. Une seule incohérence fait douter le recruteur de tout le reste.',
      },
      {
        n: '08',
        title: 'Trop de compétences',
        body: 'Lister 40 technologies ne prouve pas la maîtrise — ça signale du gonflage. Garde les 8 à 12 que tu utilises vraiment.',
      },
      {
        n: '09',
        title: 'Des rubriques « Familier avec… »',
        body: 'Traduction : je ne l’ai pas vraiment utilisé. Recruteurs et managers lisent ça comme du remplissage.',
      },
    ],
    layer3H3: 'Couche 3 — Le manager (revue des signaux)',
    layer3P1:
      'Si tu passes les RH, ton CV atteint enfin quelqu’un de technique. Cette personne va travailler avec toi, t’encadrer, ou être ton futur collègue. Elle sait ce que le poste exige parce qu’elle le fait elle-même. Elle regarde ta candidature d’une manière complètement différente des RH.',
    layer3P2:
      'La première chose qu’un manager technique fait souvent, c’est ouvrir ton GitHub. Pas pour lire chaque ligne. Pour se faire une idée. Est-ce que tu codes en dehors du travail ? Tes projets sont-ils réels ou des clones de tutoriels ? Tes dépôts ont-ils des READMEs ? Y a-t-il de l’activité récente, ou le dernier commit date-t-il de deux ans ?',
    layer3P3Pre:
      'Il recoupe CV ↔ LinkedIn ↔ GitHub — pas forcément pour traquer des mensonges, mais parce que la cohérence réduit l’incertitude. La seule question qu’il se pose en boucle est : ',
    layer3P3Em: 'ce candidat est-il assez expérimenté pour le poste ?',
    layer3P4Pre: 'Dans un vivier de 10 à 20 candidats présélectionnés, « ',
    layer3P4q1: 'presque senior',
    layer3P4Mid: ' » perd contre « ',
    layer3P4q2: 'clairement senior',
    layer3P4Post: ' » à chaque fois.',
    midCtaLabel: 'Audite les trois couches en 60 secondes',
    midCtaBody:
      'RejectCheck passe ton CV au crible de la couche ATS, de la couche RH (détection des signaux d’alerte, audit de mise en forme) et de la couche manager (signal GitHub, cohérence LinkedIn, audit de séniorité) — calé sur une offre précise.',
    midCtaBtn: 'Lancer le diagnostic gratuit →',
    p2Label: 'Partie 2',
    p2H2: 'Les angles morts',
    p2P1:
      'Pari osé : tu es sans doute fait pour le poste. Ce qui te sépare de lui, c’est l’écart entre la réalité et ce que ton CV montre. Ta candidature est une histoire. Pour toi, elle est évidente. Pour les RH et le manager, elle est difficile à lire.',
    p2P2Pre:
      'Exemple classique : tu as passé 6 mois à construire un système de paiement qui traitait des milliers de transactions par jour, gérait les cas limites, intégrait des API externes et tournait en production sans le moindre incident. Ton CV dit : ',
    p2P2Em: '« Travaillé sur des fonctionnalités de paiement back-end. »',
    p2P3: 'C’est cet écart qui te tue — pas les compétences.',
    seniorityH3: 'Le piège de la séniorité — signaux junior vs senior',
    seniorityP1:
      'La plupart des développeurs ne savent pas à quel niveau leur CV se lit vraiment. Leur CV envoie des signaux — ils ne les voient juste pas. Le manager capte le ton en quelques secondes.',
    juniorLabel: 'Signaux junior',
    juniorSignals: [
      '— « J’ai travaillé sur… »',
      '— « J’ai aidé à construire… »',
      '— « J’ai utilisé React »',
      '— Uniquement des projets perso sur GitHub',
      '— Aucune métrique, que des descriptions de tâches',
      '— Voix passive du début à la fin',
    ],
    seniorLabel: 'Signaux senior',
    seniorSignals: [
      '— « J’ai pris en charge et livré… »',
      '— « J’ai conçu et piloté… »',
      '— « J’ai architecturé le front-end »',
      '— Des projets en ligne avec des utilisateurs',
      '— Des métriques d’impact (latence, échelle, $$, utilisateurs)',
      '— Voix active, vocabulaire de l’ownership',
    ],
    seniorityP2:
      'Même personne, même travail — cadrage différent. Le manager lit la séniorité dans les verbes avant même d’arriver au contenu de la ligne.',
    jobStoryH3: 'Chaque poste a aussi sa propre histoire',
    jobStoryP1:
      'Deux entreprises publient exactement le même intitulé avec exactement les mêmes compétences requises. L’une est une startup en série A qui cherche quelqu’un pour construire vite et casser des choses. L’autre est une scale-up qui cherche quelqu’un pour stabiliser une base de code qui a grossi trop vite. Même intitulé. Même stack. Candidat idéal complètement différent.',
    jobStoryP2:
      'Ton CV doit parler la même langue que l’histoire du poste. Pas mentir — raconter. Avant de postuler, passe 10 minutes sur ces questions : quel problème cette entreprise cherche-t-elle à résoudre en recrutant ? Qu’attend-elle de toi dans 6 mois ? Dans 1 an ? Puis demande-toi : est-ce que mon CV parle la même langue ?',
    onlineH3: 'Ta présence en ligne fait partie de la candidature',
    onlineP1:
      'Ton CV n’est que la moitié de l’histoire. GitHub, LinkedIn, tout ce qui est indexable sur Google — tout fait partie de ta candidature, que tu l’optimises ou non. Le manager ira regarder. Le recoupement n’est pas optionnel de son côté.',
    onlineP2:
      'Inverse l’exercice. Trouve sur LinkedIn des développeurs qui ont déjà le poste que tu veux. Passe 30 minutes par profil. Lis leur CV, leur GitHub, leur LinkedIn, leur recherche Google. Reconstitue la chronologie. Que font-ils ? Que changerais-tu au tien ? Ceux qui ont été embauchés n’ont rien de magique — leur schéma est visible.',
    p3Label: 'Partie 3',
    p3H2: 'Le plan — itère, ne tire pas à l’aveugle',
    p3P1:
      'Le vrai problème n’est pas le niveau. C’est le système. La plupart des développeurs postulent à l’aveugle. Chaque candidature est un coup unique. Aucune boucle de feedback. Aucune donnée captée. Deux cents candidatures plus tard, ils n’ont rien appris.',
    p3P2:
      'À l’instant où tu traites les rejets comme des données, les maths changent. Tu n’es pas quelqu’un qui s’est fait rejeter 200 fois. Tu es quelqu’un qui a mené 200 expériences. Certaines t’ont appris que le CV était flou. D’autres que le niveau ne collait pas. D’autres que le GitHub envoyait le mauvais signal. Chaque rejet — aussi douloureux soit-il — est une information.',
    planCards: [
      {
        n: '01',
        title: 'Avant de postuler',
        items: [
          '— Audite ton CV / GitHub / LinkedIn',
          '— Lis ton CV avec l’œil d’un inconnu',
          '— Demande-toi : l’histoire est-elle claire ?',
        ],
      },
      {
        n: '02',
        title: 'Pour l’offre',
        items: [
          '— Reprends les mots-clés exacts de l’offre',
          '— Adapte ton histoire à la leur',
          '— Confirme l’alignement de séniorité',
        ],
      },
      {
        n: '03',
        title: 'Après le rejet',
        items: [
          '— Traite-le comme une donnée, pas un échec',
          '— Identifie quelle couche t’a écarté',
          '— Ajuste pour la prochaine candidature',
        ],
      },
    ],
    p3P3:
      'Faire tout ça à la main pour chaque poste est épuisant — lire l’offre, recouper le CV, vérifier le matching de mots-clés, auditer GitHub, scanner LinkedIn. Ça fait beaucoup. C’est la raison d’être de RejectCheck. Je l’ai construit parce que j’en avais besoin. Ça a marché pour moi. C’est gratuit à essayer.',
    relatedLabel: 'Aller plus loin',
    relatedLinks: [
      {
        href: '/guides/software-engineer-resume-tips',
        label: 'Conseils CV ingénieur logiciel — 12 règles classées par impact',
      },
      {
        href: '/software-engineer-cv',
        label: 'CV d’ingénieur logiciel — le guide structurel complet',
      },
      {
        href: '/cv-review',
        label: 'Obtiens une revue de CV approfondie pour ton poste précis',
      },
    ],
    authorLabel: 'À propos de l’auteur',
    authorBio:
      'Lenny Garnier — développeur junior, fondateur de RejectCheck. Rejeté plus de 200 fois avant de construire l’outil que j’aurais voulu avoir.',
    authorMediumPre: 'Une version narrative plus longue de ce guide est sur Medium : ',
    authorMediumLink: 'Why Developers Get Rejected (And Never Find Out Why) ↗',
    faqH2: 'FAQ',
    faqItems: [
      {
        question: 'Pourquoi les développeurs sont-ils rejetés même avec de solides compétences ?',
        answer:
          'Les compétences sont généralement bonnes. Ce qui pèche, c’est l’écart entre la réalité et ce que le CV montre. Trois filtres — l’ATS, le scan RH de 6 secondes, la revue du manager — cherchent chacun des signaux différents. De bons candidats sont éliminés par la mise en forme, des formulations vagues, des lignes au ton junior ou des incohérences GitHub-CV, bien avant l’entretien technique.',
      },
      {
        question: 'Combien de temps un recruteur RH passe-t-il sur un CV ?',
        answer:
          'Environ 6 secondes en moyenne. Il scanne, il ne lit pas. Il regarde l’intitulé actuel, les noms d’entreprises, la durée des postes et les signaux visuels (longueur, structure, fautes). Tout ce qui déclenche un signal d’alerte dans cette fenêtre — passages courts, trous, graphismes tape-à-l’œil, incohérences — tue la candidature.',
      },
      {
        question: 'Quels sont les signaux d’alerte les plus courants sur un CV de développeur ?',
        answer:
          'Des passages courts sur plusieurs postes, des trous inexpliqués, 2 pages ou plus avec moins de 10 ans d’expérience, un design coloré ou chargé en graphismes, des polices fantaisistes, des touches peu professionnelles (photos en selfie, adresses hotmail), des incohérences CV / LinkedIn, des listes de compétences gonflées et des rubriques « Familier avec… » qui signalent que le candidat n’a pas vraiment utilisé la techno.',
      },
      {
        question: 'Comment savoir si mon CV se lit junior ou senior ?',
        answer:
          'Regarde les verbes et le GitHub. Signaux junior : « j’ai travaillé sur », « j’ai aidé à construire », « j’ai utilisé React », des descriptions de tâches, uniquement des projets perso. Signaux senior : « j’ai pris en charge et livré », « j’ai conçu et piloté », « j’ai architecturé », des projets en ligne avec des utilisateurs, des métriques d’impact, un vocabulaire d’ownership. Le manager lit le ton en quelques secondes.',
      },
      {
        question: 'Comment améliorer ma candidature de façon itérative ?',
        answer:
          'Traite chaque rejet comme une donnée, pas comme un échec. Avant de postuler : audite ton CV/GitHub/LinkedIn face au poste visé. Pour l’offre : reprends les mots-clés et le ton exacts de l’offre, confirme l’alignement de séniorité. Après un rejet : identifie quelle couche t’a probablement filtré (mot-clé ATS manquant ? signal d’alerte RH ? écart de séniorité côté manager ?) et ajuste pour la candidature suivante. Les profils embauchés le plus vite ne sont pas les plus talentueux — ce sont ceux qui itèrent le plus vite.',
      },
    ],
    ctaH2: 'Arrête de postuler à l’aveugle. Commence à itérer.',
    ctaSub: 'Premier scan gratuit. ATS + signaux d’alerte RH + signaux manager — en une passe.',
    ctaBtn: 'Lancer le diagnostic gratuit →',
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

export default async function WhyDevelopersGetRejectedPage({
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
      <JsonLd id="ld-breadcrumb-why-rejected" data={breadcrumbs} />
      <JsonLd id="ld-faq-why-rejected" data={faqPageSchema(c.faqItems)} />
      <JsonLd id="ld-article-why-rejected" data={article} />

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
            <span className="text-rc-red font-semibold">
              {c.h1Em}
            </span>
            {c.h1Post}
          </h1>

          <p className="text-rc-muted text-[16px] md:text-[17px] leading-[1.7] mb-4">
            {c.introP1}
          </p>
          <p className="text-rc-muted text-[15px] leading-[1.7] mb-10">
            {c.introP2}
          </p>

          {/* TL;DR */}
          <div className="rounded-2xl border border-rc-border bg-rc-surface p-6 mb-12">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-red font-bold mb-3">
              {c.tldrLabel}
            </p>
            <ul className="space-y-2 text-[14px] text-rc-muted leading-[1.7]">
              {c.tldrItems.map((item) => (
                <li key={item.strong}>
                  <strong className="text-rc-text">{item.strong}</strong>
                  {item.rest}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-12 text-[16px] leading-[1.8] text-rc-text">
            {/* Part 1: The pipeline */}
            <section>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold">
                {c.p1Label}
              </span>
              <h2 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.02em] text-rc-text mt-2 mb-6">
                {c.p1H2}
              </h2>
              <p className="text-rc-muted mb-4">
                {c.p1Body}
              </p>
            </section>

            {/* Layer 1 */}
            <section>
              <h3 className="text-[22px] md:text-[26px] font-semibold tracking-[-0.02em] text-rc-text mb-3">
                {c.layer1H3}
              </h3>
              <p className="text-rc-muted mb-4">
                {c.layer1P1}
              </p>
              <p className="text-rc-muted mb-4">
                {c.layer1P2}
              </p>
              <p className="text-rc-muted">
                {c.layer1P3Pre}
                <Link
                  href={`${base}/guides/how-to-pass-ats`}
                  className="text-rc-red no-underline hover:underline font-medium"
                >
                  {c.layer1P3Link}
                </Link>
                {c.layer1P3Post}
              </p>
            </section>

            {/* Layer 2 */}
            <section>
              <h3 className="text-[22px] md:text-[26px] font-semibold tracking-[-0.02em] text-rc-text mb-3">
                {c.layer2H3}
              </h3>
              <p className="text-rc-muted mb-4">
                {c.layer2P1}
              </p>
              <p className="text-rc-muted mb-4">
                <strong className="text-rc-text">{c.layer2P2Strong}</strong>
                {c.layer2P2Rest}
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-red font-bold mt-8 mb-4">
                {c.redFlagsLabel}
              </p>
              <div className="space-y-4">
                {c.redFlags.map((rf) => (
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
                {c.layer3H3}
              </h3>
              <p className="text-rc-muted mb-4">
                {c.layer3P1}
              </p>
              <p className="text-rc-muted mb-4">
                {c.layer3P2}
              </p>
              <p className="text-rc-muted mb-4">
                {c.layer3P3Pre}<em>{c.layer3P3Em}</em>
              </p>
              <p className="text-rc-muted">
                {c.layer3P4Pre}{c.layer3P4q1}{c.layer3P4Mid}{c.layer3P4q2}{c.layer3P4Post}
              </p>
            </section>

            {/* Mid-article CTA */}
            <div className="rounded-2xl border border-rc-red/30 bg-rc-red/5 p-6 my-4">
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

            {/* Part 2: Blind spots */}
            <section>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold">
                {c.p2Label}
              </span>
              <h2 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.02em] text-rc-text mt-2 mb-6">
                {c.p2H2}
              </h2>
              <p className="text-rc-muted mb-4">
                {c.p2P1}
              </p>
              <p className="text-rc-muted mb-4">
                {c.p2P2Pre}
                <em>{c.p2P2Em}</em>
              </p>
              <p className="text-rc-muted">
                {c.p2P3}
              </p>
            </section>

            {/* The seniority trap */}
            <section>
              <h3 className="text-[22px] md:text-[26px] font-semibold tracking-[-0.02em] text-rc-text mb-3">
                {c.seniorityH3}
              </h3>
              <p className="text-rc-muted mb-6">
                {c.seniorityP1}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="rounded-2xl border border-rc-border bg-rc-surface p-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold mb-3">
                    {c.juniorLabel}
                  </p>
                  <ul className="space-y-2 text-[14px] text-rc-muted leading-[1.7]">
                    {c.juniorSignals.map((signal) => (
                      <li key={signal}>{signal}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-rc-red/30 bg-rc-red/5 p-6">
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-red font-bold mb-3">
                    {c.seniorLabel}
                  </p>
                  <ul className="space-y-2 text-[14px] text-rc-muted leading-[1.7]">
                    {c.seniorSignals.map((signal) => (
                      <li key={signal}>{signal}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <p className="text-rc-muted mt-6">
                {c.seniorityP2}
              </p>
            </section>

            {/* Each job is a story */}
            <section>
              <h3 className="text-[22px] md:text-[26px] font-semibold tracking-[-0.02em] text-rc-text mb-3">
                {c.jobStoryH3}
              </h3>
              <p className="text-rc-muted mb-4">
                {c.jobStoryP1}
              </p>
              <p className="text-rc-muted">
                {c.jobStoryP2}
              </p>
            </section>

            {/* Online presence */}
            <section>
              <h3 className="text-[22px] md:text-[26px] font-semibold tracking-[-0.02em] text-rc-text mb-3">
                {c.onlineH3}
              </h3>
              <p className="text-rc-muted mb-4">
                {c.onlineP1}
              </p>
              <p className="text-rc-muted">
                {c.onlineP2}
              </p>
            </section>

            {/* Part 3: Plan */}
            <section>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold">
                {c.p3Label}
              </span>
              <h2 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.02em] text-rc-text mt-2 mb-6">
                {c.p3H2}
              </h2>
              <p className="text-rc-muted mb-4">
                {c.p3P1}
              </p>
              <p className="text-rc-muted mb-8">
                {c.p3P2}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {c.planCards.map((card) => (
                  <div key={card.n} className="rounded-2xl border border-rc-border bg-rc-surface p-6">
                    <span className="font-mono text-[11px] text-rc-red tracking-[0.16em]">
                      {card.n}
                    </span>
                    <h4 className="text-[16px] font-semibold text-rc-text mt-3 mb-3">
                      {card.title}
                    </h4>
                    <ul className="space-y-1.5 text-[13px] text-rc-muted leading-[1.65]">
                      {card.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <p className="text-rc-muted mt-8 mb-4">
                {c.p3P3}
              </p>
            </section>

            {/* Related guides */}
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

            {/* Author + external */}
            <section className="border-t border-rc-border pt-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint font-bold mb-3">
                {c.authorLabel}
              </p>
              <p className="text-rc-muted text-[14px] leading-[1.7] mb-4">
                {c.authorBio}
              </p>
              <p className="text-rc-muted text-[14px] leading-[1.7]">
                {c.authorMediumPre}
                <a
                  href="https://medium.com/@lennygarnier"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-rc-red no-underline hover:underline font-medium"
                >
                  {c.authorMediumLink}
                </a>
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
              {c.ctaH2}
            </h2>
            <p className="text-rc-muted text-[14px] mb-6">
              {c.ctaSub}
            </p>
            <Link
              href={`${base}/analyze`}
              className="inline-flex items-center gap-2.5 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-7 py-3.5 rounded-xl hover:bg-[#b83332] transition-all duration-200 no-underline"
            >
              {c.ctaBtn}
            </Link>
          </div>
        </article>

        <BlueprintCta lang={lang} />
        <SeoFooter lang={lang} />
      </div>
    </>
  )
}
