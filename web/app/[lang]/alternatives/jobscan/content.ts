export type Competitor = {
  name: string
  tagline: string
  website: string
  freeTier: string
  paidEntry: string
  topFeatures: string[]
  bestFor: string
  weakness: string
  atsCheck: 'yes' | 'premium' | 'limited'
  aiInterview: boolean
  githubAudit: boolean
  linkedinAudit: boolean
  languages: string[]
  userClaim?: string
}

export type FaqItem = { question: string; answer: string }

export type DecisionGuideRow = { scenario: string; pick: string; why: string }

export type SourceLink = { label: string; href: string; external?: boolean }

export type AlternativesContent = {
  // metadata
  title: string
  description: string
  // hero
  badgeLabel: string
  heroTitle: string
  heroIntro: string
  tldrLabel: string
  tldr: string
  // breadcrumbs
  breadcrumbHome: string
  breadcrumbAlternatives: string
  breadcrumbCurrent: string
  // why section
  whyBadge: string
  whyTitle: string
  whyReasons: Array<{ title: string; text: string }>
  // comparison table
  comparisonBadge: string
  comparisonTitle: string
  tableHeaders: {
    tool: string
    freeTier: string
    paidEntry: string
    ats: string
    aiInterview: string
    githubAudit: string
    languages: string
  }
  comparisonFootnote: string
  // breakdown
  breakdownBadge: string
  breakdownTitle: string
  labels: {
    freeTier: string
    paidEntry: string
    keyFeatures: string
    bestFor: string
    honestWeakness: string
    usersClaimed: string
  }
  atsLabels: { yes: string; premium: string; limited: string }
  boolLabels: { yes: string; no: string }
  // decision guide
  decisionBadge: string
  decisionTitle: string
  decisionIfLabel: string
  decisionRows: DecisionGuideRow[]
  // faq
  faqBadge: string
  faqTitle: string
  faqItems: FaqItem[]
  // cta
  ctaTitle: string
  ctaSubtitle: string
  ctaButton: string
  ctaPricingLink: string
  // footer
  footerCopyright: string
  footerPrivacy: string
  footerPricing: string
  // competitors
  competitors: Competitor[]
}

const COMPETITORS_EN: Competitor[] = [
  {
    name: 'RejectCheck',
    tagline: 'Dual-AI CV diagnosis with skill gap radar and GitHub/LinkedIn audit.',
    website: 'https://www.rejectcheck.com',
    freeTier: '1 full analysis (guest) or 3 (registered, free)',
    paidEntry: '€7.99 / month',
    topFeatures: [
      'ATS simulation against exact job description',
      'Technical skill gap radar chart',
      'GitHub commit history and repo quality audit',
      'LinkedIn profile cross-reference with CV',
      'Voice-based AI mock interview (10 minutes)',
      'CV rewrite with keyword injection + PDF export',
      'Dual-AI pipeline (GPT-4o + Anthropic Claude) run in parallel',
    ],
    bestFor:
      'Software engineers and technical candidates who want skill-gap visualization and GitHub/LinkedIn auditing, not just keyword matching.',
    weakness:
      'Younger product than Jobscan. Cover letter generator and Chrome extension are announced as "coming soon".',
    atsCheck: 'yes',
    aiInterview: true,
    githubAudit: true,
    linkedinAudit: true,
    languages: ['English', 'French'],
  },
  {
    name: 'Jobscan',
    tagline: 'ATS resume optimization with One-Click Optimize, LinkedIn tools, and job tracker.',
    website: 'https://www.jobscan.co',
    freeTier: 'Limited free scans (exact count varies; verify current policy)',
    paidEntry: 'Monthly tier (verify current pricing on jobscan.co)',
    topFeatures: [
      'ATS resume scan with match rate score',
      'One-Click Optimize (AI tailoring to job description)',
      'Resume builder with ATS-friendly templates',
      'LinkedIn profile optimization',
      'Job tracker for managing applications',
    ],
    bestFor:
      'Job seekers who want the most mature, widely used ATS scanner with a large keyword database and a full suite (resume builder + LinkedIn + job tracker).',
    weakness:
      'English only. No GitHub or code-portfolio signals. No voice-based AI interview. Pricing on higher end of the category.',
    atsCheck: 'yes',
    aiInterview: false,
    githubAudit: false,
    linkedinAudit: true,
    languages: ['English'],
  },
  {
    name: 'Rezi',
    tagline: 'AI resume builder with Rezi Score, lifetime pricing, and AI interview practice.',
    website: 'https://www.rezi.ai',
    freeTier: '1 resume, 3 PDF downloads, 1 AI interview',
    paidEntry: '$29 / month - or $149 lifetime (one-time)',
    topFeatures: [
      'AI Resume Builder with keyword targeting',
      'Rezi Score - ATS compatibility scoring',
      'Unlimited AI interview practice (paid)',
      'Resume Agent (AI assistant for rewrites)',
      'PDF / DOCX / Google Drive export',
      '30-day money-back guarantee',
    ],
    bestFor:
      'Candidates who want a builder-first experience with a one-time lifetime option instead of recurring subscriptions.',
    weakness:
      'No GitHub or code-portfolio signals. Free tier caps downloads at 3 PDFs. English only.',
    atsCheck: 'yes',
    aiInterview: true,
    githubAudit: false,
    linkedinAudit: false,
    languages: ['English'],
  },
  {
    name: 'Resume Worded',
    tagline: 'Free instant resume review + dedicated LinkedIn profile optimization.',
    website: 'https://resumeworded.com',
    freeTier: 'Free account - instant resume review + sample bullets',
    paidEntry: 'Pro tier - pricing not published publicly; verify on site',
    topFeatures: [
      'Score My Resume - instant free feedback',
      'LinkedIn profile optimization (dedicated feature)',
      'Resume targeting against job descriptions',
      '250+ bullet-point samples across industries',
      'ATS-compatible resume templates',
    ],
    bestFor:
      'Candidates whose LinkedIn presence matters as much as their resume - marketing, sales, and client-facing roles where LinkedIn is the primary discovery channel.',
    weakness:
      'Pricing opacity (Pro tier cost not public). No AI interview. No code-portfolio signals.',
    atsCheck: 'yes',
    aiInterview: false,
    githubAudit: false,
    linkedinAudit: true,
    languages: ['English'],
    userClaim: 'Over 1,000,000 professionals',
  },
  {
    name: 'Kickresume',
    tagline: 'Template-rich resume and cover letter builder with AI and ATS checker.',
    website: 'https://www.kickresume.com',
    freeTier: '4 resume templates, 20,000 pre-written phrases, unlimited downloads',
    paidEntry: '€8 / month (annual) - €24 / month (monthly billing)',
    topFeatures: [
      '40+ resume templates (paid) - largest library in this list',
      'AI Resume & Cover Letter Writer (paid)',
      'ATS Resume Checker (paid only)',
      'LinkedIn and PDF import',
      'Mobile apps (iOS and Android)',
      'Career Map career-planning tool',
    ],
    bestFor:
      'Designers, creatives, and candidates who want dozens of visually distinct templates and export flexibility.',
    weakness:
      'ATS checker is paid-only. Free tier is limited to 4 templates. No AI interview. No code-portfolio signals.',
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
    freeTier: '7-day trial - all templates, basic sections, max 12 items',
    paidEntry: 'Pro quarterly (verify current price on enhancv.com)',
    topFeatures: [
      'Hundreds of visually polished templates',
      'ATS compatibility check (Pro)',
      'Real-time AI content suggestions',
      'Resume tailoring from pasted job description',
      'Bullet-point generator',
    ],
    bestFor:
      'Candidates in design-heavy roles (product, UX, marketing) where a visually distinct resume is a positive signal.',
    weakness:
      'Free tier is time-limited (7 days), not feature-limited. No AI interview. No GitHub or LinkedIn audit. English only.',
    atsCheck: 'premium',
    aiInterview: false,
    githubAudit: false,
    linkedinAudit: false,
    languages: ['English'],
  },
]

const COMPETITORS_FR: Competitor[] = [
  {
    name: 'RejectCheck',
    tagline: 'Diagnostic de CV dual-IA avec radar des lacunes et audit GitHub/LinkedIn.',
    website: 'https://www.rejectcheck.com',
    freeTier: '1 analyse complète (invité) ou 3 (enregistré, gratuit)',
    paidEntry: '7,99 € / mois',
    topFeatures: [
      "Simulation ATS contre l'offre exacte",
      'Radar des lacunes techniques',
      "Audit GitHub : historique de commits et qualité des repos",
      'Recoupement profil LinkedIn avec ton CV',
      'Entretien simulé IA vocal (10 minutes)',
      'Réécriture de CV avec injection de mots-clés + export PDF',
      'Pipeline dual-IA (GPT-4o + Anthropic Claude) en parallèle',
    ],
    bestFor:
      'Développeurs et candidats techniques qui veulent voir leurs lacunes visualisées et un audit GitHub/LinkedIn - pas juste du matching de mots-clés.',
    weakness:
      "Produit plus jeune que Jobscan. Le générateur de lettre de motivation et l'extension Chrome sont annoncés comme 'à venir'.",
    atsCheck: 'yes',
    aiInterview: true,
    githubAudit: true,
    linkedinAudit: true,
    languages: ['Anglais', 'Français'],
  },
  {
    name: 'Jobscan',
    tagline: "Optimisation CV ATS avec One-Click Optimize, outils LinkedIn, et suivi de candidatures.",
    website: 'https://www.jobscan.co',
    freeTier: "Scans gratuits limités (nombre exact variable ; vérifie la politique actuelle)",
    paidEntry: 'Tier mensuel (vérifie le prix actuel sur jobscan.co)',
    topFeatures: [
      'Scan ATS avec score de match',
      'One-Click Optimize (tailoring IA à la fiche de poste)',
      'Builder de CV avec templates ATS-friendly',
      'Optimisation de profil LinkedIn',
      'Suivi de candidatures',
    ],
    bestFor:
      "Candidats qui veulent le scanner ATS le plus mature et utilisé, avec la plus grande base de mots-clés et une suite complète (builder + LinkedIn + tracker).",
    weakness:
      "Anglais uniquement. Pas de signaux GitHub ni code-portfolio. Pas d'entretien simulé IA vocal. Prix dans le haut de la catégorie.",
    atsCheck: 'yes',
    aiInterview: false,
    githubAudit: false,
    linkedinAudit: true,
    languages: ['Anglais'],
  },
  {
    name: 'Rezi',
    tagline: 'Builder de CV IA avec Rezi Score, prix à vie, et pratique d\'entretien IA.',
    website: 'https://www.rezi.ai',
    freeTier: '1 CV, 3 téléchargements PDF, 1 entretien IA',
    paidEntry: '29 $ / mois - ou 149 $ à vie (paiement unique)',
    topFeatures: [
      'Builder IA avec ciblage de mots-clés',
      'Rezi Score - scoring de compatibilité ATS',
      "Pratique d'entretien IA illimitée (payant)",
      'Resume Agent (assistant IA pour réécritures)',
      'Export PDF / DOCX / Google Drive',
      'Garantie remboursement 30 jours',
    ],
    bestFor:
      "Candidats qui veulent une expérience builder-first avec une option à vie plutôt qu'un abonnement récurrent.",
    weakness:
      'Pas de signaux GitHub ni code-portfolio. Tier gratuit limité à 3 PDF. Anglais uniquement.',
    atsCheck: 'yes',
    aiInterview: true,
    githubAudit: false,
    linkedinAudit: false,
    languages: ['Anglais'],
  },
  {
    name: 'Resume Worded',
    tagline: 'Revue instantanée gratuite + optimisation LinkedIn dédiée.',
    website: 'https://resumeworded.com',
    freeTier: 'Compte gratuit - revue instantanée + exemples de bullets',
    paidEntry: "Tier Pro - prix non publié publiquement ; vérifie sur le site",
    topFeatures: [
      'Score My Resume - feedback gratuit instantané',
      'Optimisation profil LinkedIn (feature dédiée)',
      'Ciblage CV face aux fiches de poste',
      '250+ exemples de bullets par industrie',
      'Templates compatibles ATS',
    ],
    bestFor:
      'Candidats pour qui la présence LinkedIn compte autant que le CV - marketing, ventes, et rôles client-facing où LinkedIn est le canal primaire.',
    weakness:
      "Opacité tarifaire (prix Pro pas public). Pas d'entretien IA. Pas de signaux code-portfolio.",
    atsCheck: 'yes',
    aiInterview: false,
    githubAudit: false,
    linkedinAudit: true,
    languages: ['Anglais'],
    userClaim: 'Plus d\'1 million de pros',
  },
  {
    name: 'Kickresume',
    tagline: 'Builder de CV et lettre avec IA et checker ATS, grande bibliothèque de templates.',
    website: 'https://www.kickresume.com',
    freeTier: '4 templates de CV, 20 000 phrases pré-écrites, téléchargements illimités',
    paidEntry: '8 € / mois (annuel) - 24 € / mois (facturation mensuelle)',
    topFeatures: [
      '40+ templates de CV (payant) - plus grande bibliothèque de cette liste',
      'Writer IA de CV et lettre (payant)',
      'Checker ATS (payant uniquement)',
      'Import LinkedIn et PDF',
      'Apps mobile (iOS et Android)',
      'Career Map pour la planification carrière',
    ],
    bestFor:
      'Designers, créatifs, et candidats qui veulent des dizaines de templates visuellement distincts et de la flexibilité export.',
    weakness:
      "Checker ATS payant uniquement. Tier gratuit limité à 4 templates. Pas d'entretien IA. Pas de signaux code-portfolio.",
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
    freeTier: "Essai 7 jours - tous templates, sections de base, max 12 items",
    paidEntry: 'Pro trimestriel (vérifie le prix actuel sur enhancv.com)',
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

export const contentEn: AlternativesContent = {
  title: '7 Best Jobscan Alternatives (2026)',
  description:
    'Compare RejectCheck, Rezi, Resume Worded, Kickresume, and Enhancv on price, ATS accuracy, AI models, and who each is best for. Hands-on research.',
  badgeLabel: 'Comparison · Updated April 24, 2026',
  heroTitle: '7 Best Jobscan Alternatives in 2026',
  heroIntro:
    'Jobscan is the most widely known ATS resume scanner, but it is not the only - or always the best - option. Below is an honest, hands-on comparison of six alternatives (plus Jobscan itself) ranging from free to lifetime pricing, covering candidates from software engineers to design professionals.',
  tldrLabel: 'TL;DR',
  tldr: 'If you want the most mature ATS scanner with the largest keyword database, stay on Jobscan. If you are a software engineer who needs GitHub and LinkedIn auditing plus a voice-based AI mock interview, use RejectCheck. If you want a lifetime license instead of a subscription, choose Rezi ($149 one-time). If LinkedIn optimization is your priority, use Resume Worded. For design-heavy roles, Enhancv or Kickresume give you the largest template libraries.',
  breadcrumbHome: 'Home',
  breadcrumbAlternatives: 'Alternatives',
  breadcrumbCurrent: 'Jobscan',
  whyBadge: 'Why look for an alternative',
  whyTitle: 'Four reasons candidates leave Jobscan',
  whyReasons: [
    {
      title: 'Price on the higher end of the category',
      text: "Jobscan's monthly tier sits at the top of the resume-scanner market. Alternatives like Rezi ($29/mo or $149 lifetime), Kickresume (€8/mo annual), and RejectCheck (€7.99/mo) cover the same ATS-scan use case for meaningfully less per month.",
    },
    {
      title: 'Keyword matching only - no deeper portfolio signals',
      text: 'Jobscan scores your CV against the job description. It does not look at your GitHub commit history, the languages you actually code in, or whether your LinkedIn summary contradicts your CV. For a software engineer, those signals often matter more than keyword density. RejectCheck is built specifically to audit them.',
    },
    {
      title: 'No voice-based interview practice',
      text: 'Jobscan focuses on the resume stage. Candidates preparing for the interview stage need a different tool. Rezi offers text-based AI interviews; RejectCheck runs a 10-minute voice-based mock interview tailored to the specific job and your detected skill gaps, with a scored debrief afterwards.',
    },
    {
      title: 'English-only analysis',
      text: 'Jobscan, Rezi, Resume Worded, and Enhancv all ship English-first. Candidates applying in French-speaking markets (France, Belgium, Switzerland, Canada) need the analysis output, keywords, and tone audit localized. RejectCheck is bilingual EN + FR end-to-end.',
    },
  ],
  comparisonBadge: 'At a glance',
  comparisonTitle: 'Jobscan vs. 6 alternatives - quick comparison',
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
    'Pricing verified April 2026. Please confirm current pricing on each vendor\'s site before purchase.',
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
      scenario: 'You want the most mature, widely used ATS scanner',
      pick: 'Jobscan',
      why: 'Largest keyword database, most years of data, full suite (resume builder + LinkedIn + job tracker).',
    },
    {
      scenario: 'You are a software engineer and want GitHub audit + AI voice interview',
      pick: 'RejectCheck',
      why: 'The only tool that audits commit history, repo quality, and language distribution against the target job, plus a 10-minute voice mock interview.',
    },
    {
      scenario: 'You prefer a one-time lifetime payment over subscription',
      pick: 'Rezi',
      why: '$149 lifetime license. No recurring charges.',
    },
    {
      scenario: 'Your LinkedIn profile matters as much as your resume',
      pick: 'Resume Worded',
      why: 'Dedicated LinkedIn optimization product, not just an add-on.',
    },
    {
      scenario: 'You want dozens of template options for visual impact',
      pick: 'Kickresume or Enhancv',
      why: 'Largest template libraries in the category.',
    },
    {
      scenario: 'You are applying in French-speaking markets',
      pick: 'RejectCheck',
      why: 'Fully bilingual EN + FR - UI, analysis output, keywords, tone audit.',
    },
    {
      scenario: 'You want a truly free full analysis (not just a teaser)',
      pick: 'RejectCheck',
      why: 'Free tier includes a full deep analysis (1 for guests, 3 for registered users) with ATS simulation, tone audit, and red-flag detection - not just a limited scan.',
    },
  ],
  faqBadge: 'FAQ',
  faqTitle: 'Frequently asked questions',
  faqItems: [
    {
      question: 'What is the best free alternative to Jobscan?',
      answer:
        "Among the tools compared here, the most useful free tiers are: RejectCheck (1 full analysis for guests, 3 for registered users, with ATS simulation and CV scoring included), Rezi (1 resume with Rezi Score access), and Resume Worded (instant free resume review). If you only want an ATS score once, all three work without paying. Kickresume and Enhancv lock their ATS checkers behind paid tiers.",
    },
    {
      question: 'Why would someone switch from Jobscan to an alternative?',
      answer:
        "Common reasons include: price (Jobscan's monthly tier sits at the top of the category), wanting features Jobscan does not offer (voice-based AI mock interview, GitHub commit-history audit, skill-gap radar chart, non-English language support), and wanting a free tier that includes a full analysis rather than a limited-use scan.",
    },
    {
      question: 'Which Jobscan alternative is best for software engineers?',
      answer:
        'RejectCheck is the only tool in this comparison that audits your GitHub commit history, repo quality, and language distribution against the target job, and visualizes technical skill gaps on a radar chart. For a pure CS/engineering candidate evaluating an ATS tool alongside their portfolio, that deeper signal audit is a material advantage over resume-only scanners.',
    },
    {
      question: 'Which alternatives support French or other non-English languages?',
      answer:
        'RejectCheck is fully bilingual (English + French), with both UI and analysis output localized. Kickresume supports multiple languages in templates. Jobscan, Rezi, Resume Worded, and Enhancv are primarily English-only as of April 2026.',
    },
    {
      question: 'Is a lifetime plan available for any of these tools?',
      answer:
        "Rezi offers a $149 lifetime plan as a one-time purchase - the only true lifetime option in this list. Jobscan, RejectCheck, Resume Worded, Kickresume, and Enhancv are subscription-based. Kickresume's annual tier (€96 / year, roughly €8 / month equivalent) is the closest non-lifetime low-commitment option.",
    },
    {
      question: 'Which AI models do these tools use?',
      answer:
        'RejectCheck openly documents its dual-AI architecture: OpenAI GPT-4o for ATS simulation, CV audit, and red-flag detection, plus Anthropic Claude for technical skill radar, GitHub/LinkedIn signals, and project recommendations, run in parallel. Rezi, Jobscan, Kickresume, and Enhancv use AI for writing and scoring but do not publicly disclose which specific models power each feature.',
    },
    {
      question: 'How accurate are ATS simulators in general?',
      answer:
        'ATS simulators estimate match rates based on keyword density and presence against the job description. They do not replicate a specific employer ATS (Workday, Greenhouse, Lever, Taleo) exactly because real ATS systems vary by configuration. They are useful as a directional signal - if you score 40%, you are missing meaningful keywords - but no simulator guarantees a real ATS will behave identically. Jobscan itself recommends a 75% match rate; RejectCheck, Rezi, and Resume Worded use similar thresholds.',
    },
  ],
  ctaTitle: 'Try RejectCheck - free, no signup',
  ctaSubtitle:
    'Upload your CV, paste a job description, and get a full diagnosis in under 60 seconds: ATS score, technical skill gap radar, GitHub and LinkedIn signal audit, and red flag detection.',
  ctaButton: 'Analyze my CV free',
  ctaPricingLink: 'Or see full pricing →',
  footerCopyright: '© RejectCheck · Last updated April 24, 2026',
  footerPrivacy: 'Privacy (GDPR)',
  footerPricing: 'Pricing',
  competitors: COMPETITORS_EN,
}

export const contentFr: AlternativesContent = {
  title: '7 alternatives à Jobscan (2026)',
  description:
    "Compare RejectCheck, Rezi, Resume Worded, Kickresume, et Enhancv sur le prix, la précision ATS, les modèles IA, et pour qui chacun est le mieux.",
  badgeLabel: 'Comparaison · Mis à jour le 24 avril 2026',
  heroTitle: '7 meilleures alternatives à Jobscan en 2026',
  heroIntro:
    "Jobscan est le scanner de CV ATS le plus connu, mais ce n'est pas la seule - ni toujours la meilleure - option. Ci-dessous, une comparaison honnête et hands-on de six alternatives (plus Jobscan lui-même) allant du gratuit au paiement à vie, pour des candidats allant du développeur au design pro.",
  tldrLabel: 'TL;DR',
  tldr: "Si tu veux le scanner ATS le plus mature avec la plus grande base de mots-clés, reste sur Jobscan. Si tu es développeur et qu'il te faut un audit GitHub/LinkedIn + entretien simulé IA vocal, utilise RejectCheck. Si tu préfères une licence à vie plutôt qu'un abonnement, choisis Rezi (149 $ unique). Si l'optimisation LinkedIn est ta priorité, utilise Resume Worded. Pour les rôles design-heavy, Enhancv ou Kickresume offrent les plus grandes bibliothèques de templates.",
  breadcrumbHome: 'Accueil',
  breadcrumbAlternatives: 'Alternatives',
  breadcrumbCurrent: 'Jobscan',
  whyBadge: "Pourquoi chercher une alternative",
  whyTitle: 'Quatre raisons pour lesquelles les candidats quittent Jobscan',
  whyReasons: [
    {
      title: 'Prix dans le haut de la catégorie',
      text: "Le tier mensuel de Jobscan est au sommet du marché des scanners de CV. Des alternatives comme Rezi (29 $/mois ou 149 $ à vie), Kickresume (8 €/mois annuel), et RejectCheck (7,99 €/mois) couvrent le même cas d'usage ATS pour significativement moins par mois.",
    },
    {
      title: 'Matching de mots-clés uniquement - pas de signaux portfolio',
      text: "Jobscan score ton CV face à la fiche de poste. Il ne regarde pas ton historique de commits GitHub, les langages dans lesquels tu codes vraiment, ni si ton résumé LinkedIn contredit ton CV. Pour un développeur, ces signaux comptent souvent plus que la densité de mots-clés. RejectCheck est construit spécifiquement pour les auditer.",
    },
    {
      title: "Pas d'entretien simulé vocal",
      text: "Jobscan se concentre sur l'étape CV. Les candidats qui préparent l'entretien ont besoin d'un autre outil. Rezi propose des entretiens IA texte ; RejectCheck lance un entretien simulé vocal de 10 minutes taillé au poste exact et à tes lacunes détectées, avec débrief scoré à la fin.",
    },
    {
      title: 'Analyse en anglais uniquement',
      text: "Jobscan, Rezi, Resume Worded, et Enhancv sont tous anglais-first. Les candidats qui postulent sur les marchés francophones (France, Belgique, Suisse, Canada) ont besoin que la sortie d'analyse, les mots-clés, et l'audit de ton soient localisés. RejectCheck est bilingue EN + FR de bout en bout.",
    },
  ],
  comparisonBadge: "En un coup d'œil",
  comparisonTitle: 'Jobscan vs. 6 alternatives - comparaison rapide',
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
    "Prix vérifiés en avril 2026. Confirme le prix actuel sur le site de chaque vendeur avant achat.",
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
      scenario: 'Tu veux le scanner ATS le plus mature et utilisé',
      pick: 'Jobscan',
      why: 'Plus grande base de mots-clés, le plus de recul, suite complète (builder + LinkedIn + tracker).',
    },
    {
      scenario: 'Tu es dev et tu veux un audit GitHub + entretien IA vocal',
      pick: 'RejectCheck',
      why: "Le seul outil qui audite l'historique de commits, la qualité des repos, et la distribution de langages face au poste visé, plus un entretien vocal de 10 minutes.",
    },
    {
      scenario: "Tu préfères un paiement unique à vie plutôt qu'un abonnement",
      pick: 'Rezi',
      why: '149 $ licence à vie. Aucun paiement récurrent.',
    },
    {
      scenario: 'Ton profil LinkedIn compte autant que ton CV',
      pick: 'Resume Worded',
      why: "Produit d'optimisation LinkedIn dédié, pas juste un add-on.",
    },
    {
      scenario: "Tu veux des dizaines de templates pour l'impact visuel",
      pick: 'Kickresume ou Enhancv',
      why: 'Plus grandes bibliothèques de templates de la catégorie.',
    },
    {
      scenario: 'Tu postules sur des marchés francophones',
      pick: 'RejectCheck',
      why: "Bilingue EN + FR complet - UI, sortie d'analyse, mots-clés, audit de ton.",
    },
    {
      scenario: 'Tu veux une vraie analyse gratuite complète (pas un teaser)',
      pick: 'RejectCheck',
      why: 'Tier gratuit inclut une analyse complète (1 pour invités, 3 pour enregistrés) avec simulation ATS, audit ton, et détection de red flags - pas juste un scan limité.',
    },
  ],
  faqBadge: 'FAQ',
  faqTitle: 'Questions fréquentes',
  faqItems: [
    {
      question: "Quelle est la meilleure alternative gratuite à Jobscan ?",
      answer:
        "Parmi les outils comparés ici, les tiers gratuits les plus utiles sont : RejectCheck (1 analyse complète pour invités, 3 pour enregistrés, avec simulation ATS et scoring de CV inclus), Rezi (1 CV avec accès au Rezi Score), et Resume Worded (revue instantanée de CV gratuite). Si tu veux juste un score ATS une fois, ces trois fonctionnent sans payer. Kickresume et Enhancv bloquent leurs checkers ATS derrière les tiers payants.",
    },
    {
      question: "Pourquoi quelqu'un quitterait Jobscan pour une alternative ?",
      answer:
        "Raisons courantes : prix (le tier mensuel de Jobscan est en haut de la catégorie), besoin de features que Jobscan n'offre pas (entretien simulé IA vocal, audit historique GitHub, radar des lacunes techniques, support de langues non-anglaises), et besoin d'un tier gratuit qui inclut une analyse complète plutôt qu'un scan à usage limité.",
    },
    {
      question: 'Quelle alternative à Jobscan est la meilleure pour les développeurs ?',
      answer:
        "RejectCheck est le seul outil de cette comparaison qui audite ton historique de commits GitHub, la qualité de tes repos, et la distribution de langages face au poste visé, et qui visualise les lacunes techniques sur un radar. Pour un candidat dev, cet audit signal plus profond est un avantage matériel face aux scanners CV-only.",
    },
    {
      question: 'Quelles alternatives supportent le français ou des langues non-anglaises ?',
      answer:
        "RejectCheck est entièrement bilingue (anglais + français), UI et sortie d'analyse localisées. Kickresume supporte plusieurs langues dans ses templates. Jobscan, Rezi, Resume Worded, et Enhancv sont principalement anglais uniquement en avril 2026.",
    },
    {
      question: "Un plan à vie est-il disponible sur ces outils ?",
      answer:
        "Rezi offre un plan à vie à 149 $ en paiement unique - la seule vraie option à vie de la liste. Jobscan, RejectCheck, Resume Worded, Kickresume, et Enhancv sont basés sur abonnement. Le tier annuel de Kickresume (96 €/an, environ 8 €/mois) est l'option la plus proche sans engagement long.",
    },
    {
      question: 'Quels modèles IA utilisent ces outils ?',
      answer:
        "RejectCheck documente ouvertement son architecture dual-IA : OpenAI GPT-4o pour la simulation ATS, l'audit CV, et la détection de red flags, plus Anthropic Claude pour le radar technique, les signaux GitHub/LinkedIn, et les recommandations de projets, en parallèle. Rezi, Jobscan, Kickresume, et Enhancv utilisent de l'IA pour l'écriture et le scoring mais ne documentent pas publiquement quels modèles spécifiques alimentent chaque feature.",
    },
    {
      question: "Quelle est la précision des simulateurs ATS en général ?",
      answer:
        "Les simulateurs ATS estiment les taux de match basés sur la densité et la présence de mots-clés face à la fiche de poste. Ils ne répliquent pas exactement un ATS d'employeur spécifique (Workday, Greenhouse, Lever, Taleo) parce que les vrais ATS varient par configuration. Ils sont utiles comme signal directionnel - si tu scores 40 %, il te manque des mots-clés importants - mais aucun simulateur ne garantit qu'un vrai ATS se comportera identiquement. Jobscan lui-même recommande un taux de match de 75 % ; RejectCheck, Rezi, et Resume Worded utilisent des seuils similaires.",
    },
  ],
  ctaTitle: 'Essaie RejectCheck - gratuit, sans inscription',
  ctaSubtitle:
    "Téléverse ton CV, colle une fiche de poste, et obtiens un diagnostic complet en moins de 60 secondes : score ATS, radar des lacunes techniques, audit signaux GitHub et LinkedIn, et détection de red flags.",
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
