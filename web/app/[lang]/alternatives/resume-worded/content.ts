import type { AlternativesContent, Competitor } from '../jobscan/content'

const COMPETITORS_EN: Competitor[] = [
  {
    name: 'RejectCheck',
    tagline:
      'Dual-AI CV diagnosis with skill gap radar, GitHub commit audit, LinkedIn cross-reference, and voice-based AI mock interview.',
    website: 'https://rejectcheck.com',
    freeTier: '1 full diagnosis (guest) or 3 (registered, free) — no signup required for first run',
    paidEntry: '€7.99 / month (transparent pricing, published publicly)',
    topFeatures: [
      'ATS simulation against exact job description',
      'Technical skill gap radar chart (visual, not just keyword list)',
      'GitHub commit history and repo quality audit',
      'LinkedIn profile cross-reference with CV — detects inconsistencies',
      'Voice-based AI mock interview (10 minutes, scored debrief)',
      'CV rewrite with keyword injection and PDF export',
      'Dual-AI pipeline (GPT-4o + Anthropic Claude) run in parallel',
      'Bilingual (English + French) end-to-end',
    ],
    bestFor:
      "Candidates who want more than LinkedIn optimization — full CV diagnosis including ATS, skill gaps, GitHub audit, and interview prep. Also the only option in this list with transparent pricing and French support.",
    weakness:
      "Younger product than Resume Worded (which has 1M+ claimed users). Cover letter generator and Chrome extension announced as 'coming soon'.",
    atsCheck: 'yes',
    aiInterview: true,
    githubAudit: true,
    linkedinAudit: true,
    languages: ['English', 'French'],
  },
  {
    name: 'Resume Worded',
    tagline:
      'Free instant resume review with dedicated LinkedIn profile optimization — 1M+ claimed users.',
    website: 'https://resumeworded.com',
    freeTier:
      'Free account — instant resume review, free LinkedIn profile review, sample bullet library',
    paidEntry:
      'Pro tier — pricing not published publicly; must create account to see cost',
    topFeatures: [
      'Score My Resume — instant free feedback on CV',
      'Free LinkedIn Profile Review (separate tool)',
      'Resume Targeting against pasted job descriptions',
      '250+ bullet-point samples across industries',
      'ATS-compatible resume templates',
      'LinkedIn headline and summary generators',
    ],
    bestFor:
      'Candidates whose LinkedIn presence matters as much as their CV — marketing, sales, and client-facing roles where LinkedIn is the primary discovery channel.',
    weakness:
      "Pricing opacity is the biggest concern — Pro tier cost not on the marketing site. No AI interview practice. No GitHub or code-portfolio audit. English only. The '5x more jobs / leads' claim is marketing language, not a measured outcome.",
    atsCheck: 'yes',
    aiInterview: false,
    githubAudit: false,
    linkedinAudit: true,
    languages: ['English'],
    userClaim: 'Over 1,000,000 professionals',
  },
  {
    name: 'Jobscan',
    tagline:
      'ATS resume optimization with One-Click Optimize, LinkedIn tools, and job tracker — the category incumbent.',
    website: 'https://www.jobscan.co',
    freeTier: 'Limited free scans (exact count varies; verify current policy)',
    paidEntry: 'Monthly tier (verify current pricing on jobscan.co)',
    topFeatures: [
      'ATS resume scan with match rate score',
      'One-Click Optimize (AI tailoring to job description)',
      'Resume builder with ATS-friendly templates',
      'LinkedIn profile optimization',
      'Job tracker for managing applications',
      'Claims "3x more interview callbacks"',
    ],
    bestFor:
      'Candidates who want the most mature, widely used ATS scanner with a large keyword database and a full suite (resume builder + LinkedIn + job tracker).',
    weakness:
      'English only. No GitHub or code-portfolio signals. No voice-based AI interview. Pricing on the higher end of the category.',
    atsCheck: 'yes',
    aiInterview: false,
    githubAudit: false,
    linkedinAudit: true,
    languages: ['English'],
  },
  {
    name: 'Rezi',
    tagline:
      'AI-first resume builder with Rezi Score, lifetime pricing option, and AI interview practice.',
    website: 'https://www.rezi.ai',
    freeTier: '1 resume, 3 PDF downloads, 1 AI interview',
    paidEntry: '$29 / month — or $149 lifetime (one-time, no recurring)',
    topFeatures: [
      'AI Resume Builder with keyword targeting',
      'Rezi Score — ATS compatibility scoring',
      'Unlimited AI interview practice (Pro and Lifetime)',
      'Resume Agent — AI assistant for rewrites',
      'PDF / DOCX / Google Drive export',
      '30-day money-back guarantee',
    ],
    bestFor:
      "Candidates starting from a blank page who want an AI-written resume, or anyone who prefers a one-time $149 lifetime payment over recurring subscriptions.",
    weakness:
      'Builder-first rather than diagnosis-first. No GitHub or LinkedIn audit. Free tier caps downloads at 3 PDFs. English only.',
    atsCheck: 'yes',
    aiInterview: true,
    githubAudit: false,
    linkedinAudit: false,
    languages: ['English'],
  },
  {
    name: 'Kickresume',
    tagline: 'Template-rich resume and cover letter builder with AI writer and ATS checker.',
    website: 'https://www.kickresume.com',
    freeTier: '4 resume templates, 20,000 pre-written phrases, unlimited downloads',
    paidEntry: '€8 / month (annual) — €24 / month (monthly billing)',
    topFeatures: [
      '40+ resume templates on Pro (largest library in this list)',
      'AI Resume & Cover Letter Writer (Pro)',
      'ATS Resume Checker (Pro only)',
      'LinkedIn and PDF import',
      'Mobile apps (iOS and Android)',
      'Career Map career-planning tool',
    ],
    bestFor:
      'Designers, creatives, and candidates who want dozens of visually distinct templates at the lowest annual price point in this list.',
    weakness:
      'ATS checker is paid-only. Free tier limited to 4 templates. No AI interview. No GitHub audit. No LinkedIn audit.',
    atsCheck: 'premium',
    aiInterview: false,
    githubAudit: false,
    linkedinAudit: false,
    languages: ['English', 'Multiple'],
    userClaim: '70,455 customers',
  },
  {
    name: 'Enhancv',
    tagline: 'Design-forward resume builder with AI content suggestions and ATS check.',
    website: 'https://enhancv.com',
    freeTier: '7-day trial — all templates, basic sections, max 12 items',
    paidEntry: 'Pro quarterly (verify current price on enhancv.com)',
    topFeatures: [
      'Hundreds of visually polished templates',
      'ATS compatibility check (Pro)',
      'Real-time AI content suggestions',
      'Resume tailoring from pasted job description',
      'Bullet-point generator',
    ],
    bestFor:
      'Candidates in design-heavy roles (product, UX, marketing) where a visually distinct CV is a positive signal.',
    weakness:
      'Free tier is time-limited (7 days), not feature-limited. No AI interview. No GitHub or LinkedIn audit. English only.',
    atsCheck: 'premium',
    aiInterview: false,
    githubAudit: false,
    linkedinAudit: false,
    languages: ['English'],
  },
]

export const contentEn: AlternativesContent = {
  title: '7 Best Resume Worded Alternatives in 2026 (with Transparent Pricing)',
  description:
    "Looking for a Resume Worded alternative with public pricing, AI interview practice, or GitHub audit? Compare RejectCheck, Jobscan, Rezi, Kickresume, and Enhancv on price, feature depth, and who each is best for. Honest and research-backed.",
  badgeLabel: 'Comparison · Updated April 24, 2026',
  heroTitle: '7 Best Resume Worded Alternatives in 2026',
  heroIntro:
    'Resume Worded is a solid free tool for instant CV scoring and LinkedIn optimization, and it claims over 1M users. But its Pro pricing is not published publicly, it has no AI interview practice, and it offers no signal audit beyond LinkedIn — a dealbreaker for software engineers and candidates evaluating tools with transparent pricing. Here is an honest comparison of six alternatives ranging from fully-free to subscription to lifetime.',
  tldrLabel: 'TL;DR',
  tldr: "Stay on Resume Worded's free tier if you only need a one-off CV score and LinkedIn review. If you want transparent pricing plus CV diagnosis + GitHub audit + AI mock interview, switch to RejectCheck (€7.99/month). Choose Jobscan for the most mature ATS scanner. Choose Rezi if you want a one-time $149 lifetime license. Choose Kickresume (€8/month annual) for the largest template library at the lowest recurring price.",
  breadcrumbHome: 'Home',
  breadcrumbAlternatives: 'Alternatives',
  breadcrumbCurrent: 'Resume Worded',
  whyBadge: 'Why look for an alternative',
  whyTitle: 'Four reasons candidates leave Resume Worded',
  whyReasons: [
    {
      title: 'Pro pricing is not public',
      text: "Resume Worded does not publish the price of its Pro tier on the marketing site. You have to create an account to see the cost. For a buyer comparing tools, this is a deliberate friction that most competitors avoid — RejectCheck (€7.99/month), Rezi ($29/month or $149 lifetime), Kickresume (€8–24/month), and Jobscan all publish their prices on the marketing page. Opacity is often a signal that the price will feel high when revealed.",
    },
    {
      title: 'No AI interview practice',
      text: 'Resume Worded focuses on the CV and LinkedIn stages. Candidates preparing for the interview stage need a different tool. Rezi offers text-based AI interviews; RejectCheck runs a 10-minute voice-based mock interview tailored to the specific job and your detected skill gaps, with a scored debrief on communication, technical depth, and leadership signals.',
    },
    {
      title: 'No GitHub or code-portfolio audit',
      text: "Resume Worded reviews your CV and LinkedIn profile — it does not look at your GitHub commit history, repo quality, or language distribution. For software engineers and developers, those signals often matter more to recruiters than LinkedIn polish. RejectCheck is the only tool in this list that audits GitHub against the specific job you're applying to.",
    },
    {
      title: 'English-only',
      text: 'Resume Worded is English-first, as are Jobscan, Rezi, and Enhancv. Candidates applying in France, Belgium, Switzerland, or French-speaking Canada need the CV analysis, keywords, and tone audit localized. Only RejectCheck is fully bilingual EN + FR end-to-end.',
    },
  ],
  comparisonBadge: 'At a glance',
  comparisonTitle: 'Resume Worded vs. 6 alternatives — quick comparison',
  tableHeaders: {
    tool: 'Tool',
    freeTier: 'Free tier',
    paidEntry: 'Paid entry',
    ats: 'ATS',
    aiInterview: 'AI interview',
    githubAudit: 'GitHub audit',
    languages: 'Languages',
  },
  comparisonFootnote:
    "Pricing verified April 2026. Resume Worded does not publish Pro pricing publicly. Please confirm current pricing on each vendor's site before purchase.",
  breakdownBadge: 'Detailed breakdown',
  breakdownTitle: 'Every tool, in depth',
  labels: {
    freeTier: 'Free tier',
    paidEntry: 'Paid entry point',
    keyFeatures: 'Key features',
    bestFor: 'Best for',
    honestWeakness: 'Honest weakness',
    usersClaimed: 'Users claimed',
  },
  atsLabels: { yes: 'Yes', premium: 'Paid only', limited: 'Limited' },
  boolLabels: { yes: 'Yes', no: 'No' },
  decisionBadge: 'Decision guide',
  decisionTitle: 'Pick in 30 seconds',
  decisionIfLabel: 'If…',
  decisionRows: [
    {
      scenario: 'You only need a one-time free CV and LinkedIn review',
      pick: 'Resume Worded (stay on free)',
      why: 'Free tier is genuinely useful. Just avoid upgrading until you know the Pro price.',
    },
    {
      scenario: 'You want transparent pricing + full CV diagnosis',
      pick: 'RejectCheck',
      why: 'Pricing published publicly (€7.99/month). Covers ATS, skill gap, GitHub, LinkedIn, and mock interview.',
    },
    {
      scenario: 'You are a software engineer and want GitHub audit',
      pick: 'RejectCheck',
      why: 'The only tool in this list that audits GitHub commit history, repo quality, and language distribution against the target role.',
    },
    {
      scenario: 'You want the most mature ATS scanner and keyword database',
      pick: 'Jobscan',
      why: 'Category incumbent. Claims 3x more interview callbacks. Full suite including LinkedIn and job tracker.',
    },
    {
      scenario: 'You want a one-time payment, not a subscription',
      pick: 'Rezi',
      why: '$149 lifetime license — unique in this category.',
    },
    {
      scenario: 'You want a voice-based AI mock interview',
      pick: 'RejectCheck',
      why: '10-minute voice interview tailored to the target job and your detected skill gaps, with scored debrief.',
    },
    {
      scenario: 'You are applying in French-speaking markets',
      pick: 'RejectCheck',
      why: 'Fully bilingual EN + FR — UI, analysis, keywords, and tone audit all localized.',
    },
  ],
  faqBadge: 'FAQ',
  faqTitle: 'Frequently asked questions',
  faqItems: [
    {
      question: 'What is the best free alternative to Resume Worded?',
      answer:
        "Among the tools compared here, the most useful free tiers beyond Resume Worded's are: RejectCheck (1 full diagnosis for guests, 3 for registered users — more depth than a single score), Rezi (1 resume with Rezi Score access), and Kickresume (4 templates with unlimited downloads). If you specifically want a free LinkedIn review, Resume Worded's is genuinely useful — but RejectCheck also audits LinkedIn as part of its diagnosis.",
    },
    {
      question: 'How much does Resume Worded Pro actually cost?',
      answer:
        "Resume Worded does not publish Pro pricing on its marketing site as of April 2026. You have to create an account to see the cost. This is a deliberate choice — most competitors publish prices transparently. If pricing transparency matters to you when evaluating tools, RejectCheck (€7.99/month), Jobscan (monthly tier on jobscan.co), Rezi ($29/month or $149 lifetime), and Kickresume (€8–24/month) all list their prices publicly.",
    },
    {
      question: 'Why switch from Resume Worded to an alternative?',
      answer:
        'Common reasons: you want to know the Pro price before signing up (transparency), you need AI interview practice (not offered by Resume Worded), you need GitHub commit-history audit (missing), you want analysis in a language other than English, or you want a single tool that covers CV + LinkedIn + GitHub + interview rather than four separate free tools.',
    },
    {
      question: 'Does RejectCheck review my LinkedIn too?',
      answer:
        "Yes. RejectCheck's LinkedIn audit goes beyond a standalone profile review — it cross-references your LinkedIn profile (headline, summary, experience titles, recommendations) with your CV to catch inconsistencies recruiters would flag. Where Resume Worded reviews LinkedIn in isolation, RejectCheck reads LinkedIn and CV together and reports mismatches.",
    },
    {
      question: 'Which Resume Worded alternative is best for software engineers?',
      answer:
        'RejectCheck is the only tool in this comparison that audits your GitHub commit history, repo quality, and language distribution against the target role, and visualizes technical skill gaps on a radar chart. For engineers evaluating an ATS tool alongside their code portfolio, the GitHub audit is unique in the category.',
    },
    {
      question: 'Can I get a free LinkedIn review somewhere else?',
      answer:
        "Resume Worded's LinkedIn review is free and useful. RejectCheck also reviews LinkedIn as part of its free CV diagnosis (1 free for guests, 3 for registered users) — with the added benefit of cross-referencing LinkedIn against the CV to detect inconsistencies. Jobscan has paid LinkedIn optimization tools. For a single-purpose free LinkedIn check, Resume Worded is hard to beat.",
    },
    {
      question: 'Which AI models does Resume Worded use compared to alternatives?',
      answer:
        'Resume Worded does not publicly disclose which AI models power its reviews. RejectCheck openly documents a dual-AI architecture: OpenAI GPT-4o for ATS simulation, CV audit, and red flags, plus Anthropic Claude for technical skill radar, GitHub/LinkedIn signal analysis, and project recommendations, run in parallel. Jobscan, Rezi, Kickresume, and Enhancv use AI but similarly do not disclose specific models per feature.',
    },
  ],
  ctaTitle: 'Try RejectCheck — free, no signup, transparent pricing',
  ctaSubtitle:
    'Upload your CV, paste a job description, and get a full diagnosis in under 60 seconds: ATS score, technical skill gap radar, GitHub and LinkedIn signal audit, and red flag detection. Pricing published publicly.',
  ctaButton: 'Analyze my CV free',
  ctaPricingLink: 'Or see full pricing →',
  footerCopyright: '© RejectCheck · Last updated April 24, 2026',
  footerPrivacy: 'Privacy (GDPR)',
  footerPricing: 'Pricing',
  competitors: COMPETITORS_EN,
}

const COMPETITORS_FR: Competitor[] = [
  {
    name: 'RejectCheck',
    tagline:
      'Diagnostic de CV dual-IA avec radar des lacunes, audit commits GitHub, recoupement LinkedIn, et entretien simulé IA vocal.',
    website: 'https://rejectcheck.com',
    freeTier: "1 diagnostic complet (invité) ou 3 (enregistré, gratuit) — pas d'inscription requise au premier essai",
    paidEntry: '7,99 € / mois (prix transparent, publié publiquement)',
    topFeatures: [
      "Simulation ATS face à l'offre exacte",
      'Radar des lacunes techniques (visuel, pas juste une liste de mots-clés)',
      "Audit historique de commits GitHub et qualité des repos",
      'Recoupement profil LinkedIn avec CV — détecte les incohérences',
      'Entretien simulé IA vocal (10 minutes, débrief scoré)',
      'Réécriture de CV avec injection de mots-clés + export PDF',
      'Pipeline dual-IA (GPT-4o + Anthropic Claude) en parallèle',
      'Bilingue (anglais + français) de bout en bout',
    ],
    bestFor:
      "Candidats qui veulent plus que l'optimisation LinkedIn — diagnostic CV complet incluant ATS, lacunes, audit GitHub, et préparation d'entretien. Aussi la seule option de cette liste avec prix transparent et support français.",
    weakness:
      "Produit plus jeune que Resume Worded (qui revendique 1M+ users). Générateur de lettre de motivation et extension Chrome annoncés comme 'à venir'.",
    atsCheck: 'yes',
    aiInterview: true,
    githubAudit: true,
    linkedinAudit: true,
    languages: ['Anglais', 'Français'],
  },
  {
    name: 'Resume Worded',
    tagline:
      "Revue de CV instantanée gratuite avec optimisation LinkedIn dédiée — 1M+ users revendiqués.",
    website: 'https://resumeworded.com',
    freeTier:
      'Compte gratuit — revue instantanée CV, revue LinkedIn gratuite, bibliothèque de bullets',
    paidEntry:
      "Tier Pro — prix non publié publiquement ; il faut créer un compte pour voir le coût",
    topFeatures: [
      'Score My Resume — feedback gratuit instantané sur CV',
      'Revue gratuite de profil LinkedIn (outil séparé)',
      "Ciblage CV face aux offres collées",
      '250+ exemples de bullets par industrie',
      'Templates CV compatibles ATS',
      'Générateurs de titres et résumés LinkedIn',
    ],
    bestFor:
      'Candidats pour qui la présence LinkedIn compte autant que le CV — marketing, ventes, rôles client-facing où LinkedIn est le canal de découverte primaire.',
    weakness:
      "L'opacité tarifaire est la plus grosse préoccupation — prix Pro pas sur le site marketing. Pas d'entretien IA. Pas d'audit GitHub ni code-portfolio. Anglais uniquement. Le '5x plus de jobs/leads' revendiqué est du langage marketing, pas un résultat mesuré.",
    atsCheck: 'yes',
    aiInterview: false,
    githubAudit: false,
    linkedinAudit: true,
    languages: ['Anglais'],
    userClaim: "Plus d'1 million de pros",
  },
  {
    name: 'Jobscan',
    tagline:
      "Optimisation CV ATS avec One-Click Optimize, outils LinkedIn, et suivi de candidatures — le leader historique.",
    website: 'https://www.jobscan.co',
    freeTier: 'Scans gratuits limités (nombre variable ; vérifie la politique actuelle)',
    paidEntry: 'Tier mensuel (vérifie le prix sur jobscan.co)',
    topFeatures: [
      'Scan ATS avec score de match',
      'One-Click Optimize (tailoring IA à l\'offre)',
      'Builder de CV avec templates ATS-friendly',
      'Optimisation profil LinkedIn',
      'Suivi de candidatures',
      'Revendique "3x plus de callbacks"',
    ],
    bestFor:
      "Candidats qui veulent le scanner ATS le plus mature et utilisé, avec la plus grande base de mots-clés et qui vont utiliser la suite complète (builder + LinkedIn + tracker).",
    weakness:
      "Anglais uniquement. Pas de signaux GitHub ni code-portfolio. Pas d'entretien IA vocal. Prix dans le haut de la catégorie.",
    atsCheck: 'yes',
    aiInterview: false,
    githubAudit: false,
    linkedinAudit: true,
    languages: ['Anglais'],
  },
  {
    name: 'Rezi',
    tagline:
      "Builder de CV IA-first avec Rezi Score, option de paiement à vie, et pratique d'entretien IA.",
    website: 'https://www.rezi.ai',
    freeTier: '1 CV, 3 téléchargements PDF, 1 entretien IA',
    paidEntry: '29 $ / mois — ou 149 $ à vie (paiement unique)',
    topFeatures: [
      'Builder IA avec ciblage de mots-clés',
      'Rezi Score — scoring de compatibilité ATS',
      "Pratique d'entretien IA illimitée (Pro et Lifetime)",
      'Resume Agent — assistant IA pour réécritures',
      'Export PDF / DOCX / Google Drive',
      'Garantie remboursement 30 jours',
    ],
    bestFor:
      "Candidats qui démarrent d'une page blanche et veulent un CV IA, ou ceux qui préfèrent un paiement à vie de 149 $ unique plutôt qu'un abonnement récurrent.",
    weakness:
      "Builder-first plutôt que diagnostic-first. Pas d'audit GitHub ni LinkedIn. Tier gratuit limité à 3 PDF. Anglais uniquement.",
    atsCheck: 'yes',
    aiInterview: true,
    githubAudit: false,
    linkedinAudit: false,
    languages: ['Anglais'],
  },
  {
    name: 'Kickresume',
    tagline: 'Builder de CV et lettre avec IA et checker ATS, grande bibliothèque de templates.',
    website: 'https://www.kickresume.com',
    freeTier: '4 templates de CV, 20 000 phrases pré-écrites, téléchargements illimités',
    paidEntry: '8 € / mois (annuel) — 24 € / mois (mensuel)',
    topFeatures: [
      '40+ templates sur Pro (plus grande bibliothèque de cette liste)',
      'Writer IA de CV et lettre (Pro)',
      'Checker ATS Resume (Pro uniquement)',
      'Import LinkedIn et PDF',
      'Apps mobile (iOS et Android)',
      'Career Map pour la planification carrière',
    ],
    bestFor:
      "Designers, créatifs, et candidats qui veulent des dizaines de templates visuellement distincts au prix annuel le plus bas.",
    weakness:
      "Checker ATS payant uniquement. Tier gratuit limité à 4 templates. Pas d'entretien IA. Pas d'audit GitHub. Pas d'audit LinkedIn.",
    atsCheck: 'premium',
    aiInterview: false,
    githubAudit: false,
    linkedinAudit: false,
    languages: ['Anglais', 'Multilingue'],
    userClaim: '70 455 clients',
  },
  {
    name: 'Enhancv',
    tagline: 'Builder design-first avec suggestions IA et check ATS.',
    website: 'https://enhancv.com',
    freeTier: "Essai 7 jours — tous templates, sections de base, max 12 items",
    paidEntry: 'Pro trimestriel (vérifie le prix sur enhancv.com)',
    topFeatures: [
      'Des centaines de templates visuellement polis',
      'Check compatibilité ATS (Pro)',
      "Suggestions de contenu IA en temps réel",
      "Tailoring CV à partir de la fiche collée",
      'Générateur de bullet points',
    ],
    bestFor:
      'Candidats dans des rôles design-heavy (produit, UX, marketing) où un CV visuellement distinct est un signal positif.',
    weakness:
      "Tier gratuit limité en temps (7 jours), pas en features. Pas d'entretien IA. Pas d'audit GitHub/LinkedIn. Anglais uniquement.",
    atsCheck: 'premium',
    aiInterview: false,
    githubAudit: false,
    linkedinAudit: false,
    languages: ['Anglais'],
  },
]

export const contentFr: AlternativesContent = {
  title: '7 meilleures alternatives à Resume Worded en 2026 (avec prix transparents)',
  description:
    "Tu cherches une alternative à Resume Worded avec un prix public, un entretien IA, ou un audit GitHub ? Compare RejectCheck, Jobscan, Rezi, Kickresume, et Enhancv sur le prix, la profondeur des features, et pour qui chacun est le mieux. Honnête et basé sur la recherche.",
  badgeLabel: 'Comparaison · Mis à jour le 24 avril 2026',
  heroTitle: '7 meilleures alternatives à Resume Worded en 2026',
  heroIntro:
    "Resume Worded est un outil gratuit solide pour le scoring instantané de CV et l'optimisation LinkedIn, et revendique plus d'1M d'utilisateurs. Mais son prix Pro n'est pas publié publiquement, il n'a pas d'entretien IA, et il n'offre aucun audit signal au-delà de LinkedIn — un dealbreaker pour les développeurs et les candidats qui évaluent des outils avec des prix transparents. Voici une comparaison honnête de six alternatives allant du totalement gratuit à l'abonnement et au paiement à vie.",
  tldrLabel: 'TL;DR',
  tldr: "Reste sur le tier gratuit de Resume Worded si tu veux juste un scoring CV ponctuel et une revue LinkedIn. Si tu veux un prix transparent + diagnostic CV + audit GitHub + entretien simulé IA, passe à RejectCheck (7,99 €/mois). Choisis Jobscan pour le scanner ATS le plus mature. Choisis Rezi si tu veux une licence à vie à 149 $. Choisis Kickresume (8 €/mois annuel) pour la plus grande bibliothèque de templates au prix récurrent le plus bas.",
  breadcrumbHome: 'Accueil',
  breadcrumbAlternatives: 'Alternatives',
  breadcrumbCurrent: 'Resume Worded',
  whyBadge: 'Pourquoi chercher une alternative',
  whyTitle: 'Quatre raisons de quitter Resume Worded',
  whyReasons: [
    {
      title: "Le prix Pro n'est pas public",
      text: "Resume Worded ne publie pas le prix de son tier Pro sur le site marketing. Il faut créer un compte pour voir le coût. Pour un acheteur qui compare des outils, c'est une friction délibérée que la plupart des concurrents évitent — RejectCheck (7,99 €/mois), Rezi (29 $/mois ou 149 $ à vie), Kickresume (8–24 €/mois), et Jobscan publient tous leurs prix sur la page marketing. L'opacité est souvent un signal que le prix va sembler élevé une fois révélé.",
    },
    {
      title: "Pas d'entretien simulé IA",
      text: "Resume Worded se concentre sur les étapes CV et LinkedIn. Les candidats qui préparent l'entretien ont besoin d'un autre outil. Rezi propose des entretiens IA texte ; RejectCheck lance un entretien simulé IA vocal de 10 minutes taillé au poste exact et à tes lacunes détectées, avec débrief scoré sur la communication, la profondeur technique, et les signaux de leadership.",
    },
    {
      title: "Pas d'audit GitHub ni code-portfolio",
      text: "Resume Worded revue ton CV et ton profil LinkedIn — il ne regarde pas ton historique de commits GitHub, la qualité de tes repos, ni la distribution de langages. Pour les développeurs, ces signaux comptent souvent plus aux yeux des recruteurs que le poli LinkedIn. RejectCheck est le seul outil de cette liste qui audite GitHub face à l'offre exacte visée.",
    },
    {
      title: 'Anglais uniquement',
      text: "Resume Worded est anglais-first, comme Jobscan, Rezi, et Enhancv. Les candidats qui postulent en France, Belgique, Suisse, ou au Canada francophone ont besoin que l'analyse CV, les mots-clés, et l'audit de ton soient localisés. Seul RejectCheck est entièrement bilingue EN + FR de bout en bout.",
    },
  ],
  comparisonBadge: "En un coup d'œil",
  comparisonTitle: 'Resume Worded vs. 6 alternatives — comparaison rapide',
  tableHeaders: {
    tool: 'Outil',
    freeTier: 'Tier gratuit',
    paidEntry: 'Entrée payante',
    ats: 'ATS',
    aiInterview: 'Entretien IA',
    githubAudit: 'Audit GitHub',
    languages: 'Langues',
  },
  comparisonFootnote:
    "Prix vérifiés en avril 2026. Resume Worded ne publie pas son prix Pro publiquement. Confirme le prix actuel sur le site de chaque vendeur avant achat.",
  breakdownBadge: 'Détail par outil',
  breakdownTitle: 'Chaque outil, en profondeur',
  labels: {
    freeTier: 'Tier gratuit',
    paidEntry: "Point d'entrée payant",
    keyFeatures: 'Features clés',
    bestFor: 'Idéal pour',
    honestWeakness: 'Faiblesse honnête',
    usersClaimed: 'Utilisateurs revendiqués',
  },
  atsLabels: { yes: 'Oui', premium: 'Payant seul.', limited: 'Limité' },
  boolLabels: { yes: 'Oui', no: 'Non' },
  decisionBadge: 'Guide de décision',
  decisionTitle: 'Choisis en 30 secondes',
  decisionIfLabel: 'Si…',
  decisionRows: [
    {
      scenario: "Tu veux juste une revue CV et LinkedIn gratuite ponctuelle",
      pick: 'Resume Worded (reste en gratuit)',
      why: "Le tier gratuit est vraiment utile. Évite juste d'upgrader avant de connaître le prix Pro.",
    },
    {
      scenario: 'Tu veux des prix transparents + diagnostic CV complet',
      pick: 'RejectCheck',
      why: 'Prix publié publiquement (7,99 €/mois). Couvre ATS, lacunes, GitHub, LinkedIn, et entretien simulé.',
    },
    {
      scenario: 'Tu es dev et tu veux un audit GitHub',
      pick: 'RejectCheck',
      why: "Le seul outil de cette liste qui audite l'historique de commits GitHub, la qualité des repos, et la distribution de langages face au rôle visé.",
    },
    {
      scenario: 'Tu veux le scanner ATS le plus mature et la plus grande base de mots-clés',
      pick: 'Jobscan',
      why: "Leader de la catégorie. Revendique 3x plus de callbacks. Suite complète avec LinkedIn et tracker.",
    },
    {
      scenario: "Tu veux un paiement unique, pas un abonnement",
      pick: 'Rezi',
      why: "149 $ licence à vie — unique dans cette catégorie.",
    },
    {
      scenario: 'Tu veux un entretien simulé IA vocal',
      pick: 'RejectCheck',
      why: "Entretien vocal de 10 minutes taillé au poste exact et à tes lacunes détectées, avec débrief scoré.",
    },
    {
      scenario: 'Tu postules dans des marchés francophones',
      pick: 'RejectCheck',
      why: "Bilingue EN + FR complet — UI, analyse, mots-clés, et audit de ton localisés.",
    },
  ],
  faqBadge: 'FAQ',
  faqTitle: 'Questions fréquentes',
  faqItems: [
    {
      question: 'Quelle est la meilleure alternative gratuite à Resume Worded ?',
      answer:
        "Parmi les outils comparés ici, les tiers gratuits les plus utiles au-delà de Resume Worded sont : RejectCheck (1 diagnostic complet pour invités, 3 pour enregistrés — plus de profondeur qu'un simple score), Rezi (1 CV avec accès au Rezi Score), et Kickresume (4 templates avec téléchargements illimités). Si tu veux spécifiquement une revue LinkedIn gratuite, celle de Resume Worded est vraiment utile — mais RejectCheck audite aussi LinkedIn dans son diagnostic.",
    },
    {
      question: 'Combien coûte vraiment Resume Worded Pro ?',
      answer:
        "Resume Worded ne publie pas le prix Pro sur son site marketing en avril 2026. Il faut créer un compte pour voir le coût. C'est un choix délibéré — la plupart des concurrents publient leurs prix transparents. Si la transparence tarifaire compte pour toi quand tu évalues des outils, RejectCheck (7,99 €/mois), Jobscan (tier mensuel sur jobscan.co), Rezi (29 $/mois ou 149 $ à vie), et Kickresume (8–24 €/mois) listent tous leurs prix publiquement.",
    },
    {
      question: 'Pourquoi quitter Resume Worded pour une alternative ?',
      answer:
        "Raisons courantes : tu veux connaître le prix Pro avant de signer (transparence), tu as besoin d'une pratique d'entretien IA (non offerte par Resume Worded), tu as besoin d'un audit historique de commits GitHub (manquant), tu veux une analyse dans une autre langue que l'anglais, ou tu veux un seul outil qui couvre CV + LinkedIn + GitHub + entretien plutôt que quatre outils gratuits séparés.",
    },
    {
      question: 'RejectCheck révise-t-il aussi mon LinkedIn ?',
      answer:
        "Oui. L'audit LinkedIn de RejectCheck va au-delà d'une revue de profil standalone — il recoupe ton profil LinkedIn (titre, résumé, titres d'expérience, recommandations) avec ton CV pour repérer les incohérences que les recruteurs flaggeraient. Là où Resume Worded revue LinkedIn en isolation, RejectCheck lit LinkedIn et CV ensemble et reporte les désalignements.",
    },
    {
      question: 'Quelle alternative à Resume Worded est la meilleure pour les développeurs ?',
      answer:
        "RejectCheck est le seul outil de cette comparaison qui audite ton historique de commits GitHub, la qualité de tes repos, et la distribution de langages face au rôle visé, et qui visualise les lacunes techniques sur un radar. Pour les devs qui évaluent un outil ATS en parallèle de leur portfolio de code, l'audit GitHub est unique dans la catégorie.",
    },
    {
      question: 'Puis-je obtenir une revue LinkedIn gratuite ailleurs ?',
      answer:
        "La revue LinkedIn de Resume Worded est gratuite et utile. RejectCheck revue aussi LinkedIn dans son diagnostic CV gratuit (1 gratuit pour invités, 3 pour enregistrés) — avec le bénéfice additionnel de recouper LinkedIn contre le CV pour détecter les incohérences. Jobscan a des outils d'optimisation LinkedIn payants. Pour un check LinkedIn gratuit ponctuel, Resume Worded est dur à battre.",
    },
    {
      question: "Quels modèles IA utilise Resume Worded vs les alternatives ?",
      answer:
        "Resume Worded ne divulgue pas publiquement les modèles IA qui alimentent ses revues. RejectCheck documente ouvertement son architecture dual-IA : OpenAI GPT-4o pour l'ATS, l'audit CV, et les red flags, plus Anthropic Claude pour le radar technique, l'analyse des signaux GitHub/LinkedIn, et les recommandations de projets, en parallèle. Jobscan, Rezi, Kickresume, et Enhancv utilisent de l'IA mais de même ne divulguent pas les modèles spécifiques par feature.",
    },
  ],
  ctaTitle: 'Essaie RejectCheck — gratuit, sans inscription, prix transparent',
  ctaSubtitle:
    "Téléverse ton CV, colle une offre, et obtiens un diagnostic complet en moins de 60 secondes : score ATS, radar des lacunes techniques, audit signaux GitHub et LinkedIn, et détection de red flags. Prix publié publiquement.",
  ctaButton: 'Analyser mon CV gratuit',
  ctaPricingLink: 'Ou voir tous les tarifs →',
  footerCopyright: '© RejectCheck · Mis à jour le 24 avril 2026',
  footerPrivacy: 'Confidentialité (RGPD)',
  footerPricing: 'Tarifs',
  competitors: COMPETITORS_FR,
}

export function getContent(locale: 'en' | 'fr'): AlternativesContent {
  return locale === 'fr' ? contentFr : contentEn
}
