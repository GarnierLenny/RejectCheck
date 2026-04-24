import type { AlternativesContent, Competitor } from '../jobscan/content'

const COMPETITORS_EN: Competitor[] = [
  {
    name: 'RejectCheck',
    tagline:
      'Dual-AI CV diagnosis tool - not a builder. Tells you what is wrong with the CV you already have.',
    website: 'https://rejectcheck.com',
    freeTier: '1 full diagnosis (guest) or 3 (registered, free) - no signup required for first run',
    paidEntry: '€7.99 / month',
    topFeatures: [
      'ATS simulation against exact job description',
      'Technical skill gap radar chart (visual, not just a keyword list)',
      'GitHub commit history and repo quality audit',
      'LinkedIn profile cross-reference with CV',
      'Voice-based AI mock interview (10 minutes, scored debrief)',
      'CV rewrite with keyword injection and PDF export',
      'Dual-AI pipeline (GPT-4o + Anthropic Claude) run in parallel',
      'Bilingual (English + French) end-to-end',
    ],
    bestFor:
      'Candidates who already have a CV and want to diagnose why it is being rejected - specifically software engineers who also want GitHub and LinkedIn signal audits, and French-speaking candidates.',
    weakness:
      "No CV builder from scratch - you need an existing CV to analyze. Cover letter generator announced as 'coming soon'.",
    atsCheck: 'yes',
    aiInterview: true,
    githubAudit: true,
    linkedinAudit: true,
    languages: ['English', 'French'],
  },
  {
    name: 'Rezi',
    tagline:
      'AI-first resume builder with Rezi Score (ATS), lifetime pricing option, and AI interview practice.',
    website: 'https://www.rezi.ai',
    freeTier: '1 resume, 3 PDF downloads, 1 AI interview, limited Rezi Score access',
    paidEntry: '$29 / month - or $149 lifetime (one-time, no recurring)',
    topFeatures: [
      'AI Resume Builder with job-description keyword targeting',
      'Rezi Score - ATS compatibility scoring',
      'Unlimited AI interview practice (Pro and Lifetime)',
      'Resume Agent - AI assistant for bullet rewrites',
      'PDF / DOCX / Google Drive export',
      '30-day money-back guarantee',
      'Five resume format templates (Pro), Standard-only on free',
      'One free professional resume review monthly (Pro)',
    ],
    bestFor:
      'Candidates starting from scratch who want a modern, AI-written resume, or those who prefer a one-time lifetime payment over recurring subscriptions.',
    weakness:
      'No GitHub or code-portfolio audit. No LinkedIn profile audit. Free tier caps downloads at 3 PDFs. English-only. Subscription model at $29/month is expensive for occasional users.',
    atsCheck: 'yes',
    aiInterview: true,
    githubAudit: false,
    linkedinAudit: false,
    languages: ['English'],
  },
  {
    name: 'Jobscan',
    tagline:
      'ATS resume optimization with One-Click Optimize, LinkedIn tools, and job tracker - the category incumbent.',
    website: 'https://www.jobscan.co',
    freeTier: 'Limited free scans (exact count varies; verify current policy)',
    paidEntry: 'Monthly tier - top of the category (verify current pricing on jobscan.co)',
    topFeatures: [
      'ATS resume scan with match rate score',
      'One-Click Optimize (AI tailoring to job description)',
      'Resume builder with ATS-friendly templates',
      'LinkedIn profile optimization',
      'Job tracker for managing applications',
      'Claims "3x more interview callbacks"',
    ],
    bestFor:
      'Candidates who want the most mature, widely used ATS scanner and keyword database, and who will use the full suite (resume builder + LinkedIn + job tracker).',
    weakness:
      'English only. No GitHub or code-portfolio signals. No voice-based AI interview. Pricing on the higher end.',
    atsCheck: 'yes',
    aiInterview: false,
    githubAudit: false,
    linkedinAudit: true,
    languages: ['English'],
  },
  {
    name: 'Resume Worded',
    tagline:
      'Free instant resume review with dedicated LinkedIn profile optimization - over 1M users.',
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
      'Candidates whose LinkedIn presence matters as much as their CV - marketing, sales, and client-facing roles where LinkedIn is the primary discovery channel.',
    weakness:
      'Pricing opacity (Pro tier cost not public). No AI interview. No GitHub audit. English only.',
    atsCheck: 'yes',
    aiInterview: false,
    githubAudit: false,
    linkedinAudit: true,
    languages: ['English'],
    userClaim: 'Over 1,000,000 professionals',
  },
  {
    name: 'Kickresume',
    tagline: 'Template-rich resume and cover letter builder with AI writer and ATS checker.',
    website: 'https://www.kickresume.com',
    freeTier: '4 resume templates, 20,000 pre-written phrases, unlimited downloads',
    paidEntry: '€8 / month (annual) - €24 / month (monthly billing)',
    topFeatures: [
      '40+ resume templates on Pro (largest library in this category)',
      'AI Resume & Cover Letter Writer (Pro)',
      'ATS Resume Checker (Pro only)',
      'LinkedIn and PDF import',
      'Mobile apps (iOS and Android)',
      'Career Map career-planning tool',
    ],
    bestFor:
      'Designers, creatives, and candidates who want dozens of visually distinct templates at the lowest annual price point in this list.',
    weakness:
      'ATS checker is paid-only. Free tier limited to 4 templates. No AI interview. No GitHub audit.',
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

const COMPETITORS_FR: Competitor[] = [
  {
    name: 'RejectCheck',
    tagline:
      "Outil de diagnostic de CV dual-IA - pas un builder. Te dit ce qui ne va pas dans le CV que tu as déjà.",
    website: 'https://rejectcheck.com',
    freeTier: "1 diagnostic complet (invité) ou 3 (enregistré, gratuit) - pas d'inscription requise au premier essai",
    paidEntry: '7,99 € / mois',
    topFeatures: [
      "Simulation ATS face à l'offre exacte",
      'Radar des lacunes techniques (visuel, pas juste une liste de mots-clés)',
      "Audit GitHub : historique de commits et qualité des repos",
      'Recoupement profil LinkedIn avec ton CV',
      'Entretien simulé IA vocal (10 minutes, débrief scoré)',
      'Réécriture de CV avec injection de mots-clés + export PDF',
      'Pipeline dual-IA (GPT-4o + Anthropic Claude) en parallèle',
      'Bilingue (anglais + français) de bout en bout',
    ],
    bestFor:
      "Candidats qui ont déjà un CV et veulent diagnostiquer pourquoi il se fait rejeter - en particulier les développeurs qui veulent un audit GitHub et LinkedIn, et les candidats francophones.",
    weakness:
      "Pas de builder de CV à partir de zéro - il te faut un CV existant à analyser. Générateur de lettre de motivation annoncé comme 'à venir'.",
    atsCheck: 'yes',
    aiInterview: true,
    githubAudit: true,
    linkedinAudit: true,
    languages: ['Anglais', 'Français'],
  },
  {
    name: 'Rezi',
    tagline:
      "Builder de CV IA-first avec Rezi Score (ATS), option de paiement à vie, et pratique d'entretien IA.",
    website: 'https://www.rezi.ai',
    freeTier: '1 CV, 3 téléchargements PDF, 1 entretien IA, accès limité au Rezi Score',
    paidEntry: '29 $ / mois - ou 149 $ à vie (paiement unique)',
    topFeatures: [
      "Builder IA avec ciblage de mots-clés de l'offre",
      'Rezi Score - scoring de compatibilité ATS',
      "Pratique d'entretien IA illimitée (Pro et Lifetime)",
      'Resume Agent - assistant IA pour réécritures',
      'Export PDF / DOCX / Google Drive',
      'Garantie remboursement 30 jours',
      'Cinq formats de templates (Pro), Standard uniquement en gratuit',
      "1 revue de CV professionnelle gratuite par mois (Pro)",
    ],
    bestFor:
      "Candidats qui démarrent d'une page blanche et veulent un CV moderne écrit par IA, ou ceux qui préfèrent un paiement à vie plutôt qu'un abonnement récurrent.",
    weakness:
      'Pas d\'audit GitHub ni code-portfolio. Pas d\'audit profil LinkedIn. Tier gratuit limité à 3 PDF. Anglais uniquement. 29 $/mois c\'est cher pour un usage occasionnel.',
    atsCheck: 'yes',
    aiInterview: true,
    githubAudit: false,
    linkedinAudit: false,
    languages: ['Anglais'],
  },
  {
    name: 'Jobscan',
    tagline:
      "Optimisation CV ATS avec One-Click Optimize, outils LinkedIn, et suivi de candidatures - le leader historique.",
    website: 'https://www.jobscan.co',
    freeTier: "Scans gratuits limités (nombre variable ; vérifie la politique actuelle)",
    paidEntry: 'Tier mensuel - haut de la catégorie (vérifie le prix sur jobscan.co)',
    topFeatures: [
      'Scan ATS avec score de match',
      'One-Click Optimize (tailoring IA)',
      'Builder de CV avec templates ATS-friendly',
      'Optimisation profil LinkedIn',
      'Suivi de candidatures',
      'Revendique "3x plus de callbacks d\'entretien"',
    ],
    bestFor:
      "Candidats qui veulent le scanner ATS le plus mature avec la plus grande base de mots-clés et la suite complète (builder + LinkedIn + tracker).",
    weakness:
      "Anglais uniquement. Pas de signaux GitHub ni code-portfolio. Pas d'entretien simulé IA. Prix dans le haut de la catégorie.",
    atsCheck: 'yes',
    aiInterview: false,
    githubAudit: false,
    linkedinAudit: true,
    languages: ['Anglais'],
  },
  {
    name: 'Resume Worded',
    tagline:
      "Revue de CV instantanée gratuite avec optimisation LinkedIn dédiée - plus d'1M users.",
    website: 'https://resumeworded.com',
    freeTier: 'Compte gratuit - revue instantanée + exemples de bullets',
    paidEntry: 'Tier Pro - prix non publié publiquement ; vérifie sur le site',
    topFeatures: [
      'Score My Resume - feedback gratuit instantané',
      'Optimisation profil LinkedIn (feature dédiée)',
      "Ciblage CV face aux offres",
      '250+ exemples de bullets par industrie',
      'Templates compatibles ATS',
    ],
    bestFor:
      "Candidats pour qui LinkedIn compte autant que le CV - marketing, ventes, rôles client-facing.",
    weakness:
      "Opacité tarifaire (prix Pro pas public). Pas d'entretien IA. Pas d'audit GitHub. Anglais uniquement.",
    atsCheck: 'yes',
    aiInterview: false,
    githubAudit: false,
    linkedinAudit: true,
    languages: ['Anglais'],
    userClaim: "Plus d'1 million de pros",
  },
  {
    name: 'Kickresume',
    tagline: 'Builder de CV et lettre avec IA et checker ATS, grande bibliothèque de templates.',
    website: 'https://www.kickresume.com',
    freeTier: '4 templates de CV, 20 000 phrases pré-écrites, téléchargements illimités',
    paidEntry: '8 € / mois (annuel) - 24 € / mois (mensuel)',
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
      "Checker ATS payant uniquement. Tier gratuit limité à 4 templates. Pas d'entretien IA. Pas d'audit GitHub.",
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

export const contentEn: AlternativesContent = {
  title: '6 Best Rezi Alternatives in 2026 (Free, Lifetime, Non-Subscription)',
  description:
    'Looking for a Rezi alternative? Compare RejectCheck, Jobscan, Resume Worded, Kickresume, and Enhancv on price, ATS accuracy, free tier depth, and whether they build vs diagnose. Includes the lifetime vs subscription trade-off.',
  badgeLabel: 'Comparison · Updated April 24, 2026',
  heroTitle: '6 Best Rezi Alternatives in 2026',
  heroIntro:
    'Rezi pioneered the AI-first resume builder format with its $149 lifetime option. It is a solid tool for candidates starting from a blank page - but if you already have a CV and want to diagnose why it is failing, or if you need signals beyond keywords (GitHub, LinkedIn), Rezi is not the right tool. Here is an honest comparison of six alternatives, ranging from a true free tier to the most mature ATS scanner in the category.',
  tldrLabel: 'TL;DR',
  tldr: "Stay on Rezi if you are starting a resume from scratch AND you want a one-time $149 lifetime payment. Switch to RejectCheck if you already have a CV and want a full diagnosis including GitHub and LinkedIn audit, plus a voice-based AI mock interview. Choose Jobscan for the most mature ATS scanner. Choose Kickresume (€8/month annual) for the largest template library at the lowest recurring price. Choose Resume Worded if LinkedIn optimization is your priority.",
  breadcrumbHome: 'Home',
  breadcrumbAlternatives: 'Alternatives',
  breadcrumbCurrent: 'Rezi',
  whyBadge: 'Why look for an alternative',
  whyTitle: 'Four reasons candidates leave Rezi',
  whyReasons: [
    {
      title: 'Builder-first, not diagnosis-first',
      text: 'Rezi is fundamentally a resume builder. It starts with a blank page and helps you write. If you already have a CV and want to know specifically why it is getting rejected - which keywords are missing, which seniority signals are weak, whether your LinkedIn contradicts it - you need a diagnosis tool, not a builder. RejectCheck is built for that exact job.',
    },
    {
      title: 'No GitHub or LinkedIn portfolio audit',
      text: 'For software engineers, candidates in design, and anyone whose public portfolio (GitHub commits, LinkedIn summary, recommendations) matters as much as the CV itself, Rezi offers nothing. RejectCheck audits your GitHub commit history, repo quality, and language distribution against the target role, and cross-references your LinkedIn profile with your CV to catch inconsistencies.',
    },
    {
      title: 'Limited free tier (3 PDFs, 1 AI interview)',
      text: "Rezi's free tier is effectively a demo - 3 PDF downloads total, 1 AI interview, limited Rezi Score access. If you only need an ATS scan once, free-tier alternatives go further: RejectCheck offers 1 full analysis without signup (3 for registered users), Resume Worded gives an instant free resume review, and Kickresume lets you download resumes unlimited from free templates.",
    },
    {
      title: 'English-only',
      text: "Rezi targets English-speaking markets. Candidates applying in France, Belgium, Switzerland, or French-speaking Canada need the analysis output, keywords, and tone audit localized. Only RejectCheck is fully bilingual EN + FR end-to-end; Kickresume offers multilingual templates; Jobscan, Resume Worded, and Enhancv are English-first.",
    },
  ],
  comparisonBadge: 'At a glance',
  comparisonTitle: 'Rezi vs. 5 alternatives - quick comparison',
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
    "Pricing verified April 2026. Please confirm current pricing on each vendor's site before purchase.",
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
      scenario: 'You are starting a resume from a blank page',
      pick: 'Rezi (stay)',
      why: 'Rezi is a best-in-class AI-first builder. The $149 lifetime option is unique in the category.',
    },
    {
      scenario: 'You already have a CV and want to diagnose why it is failing',
      pick: 'RejectCheck',
      why: 'Purpose-built for diagnosing an existing CV against a specific job - ATS simulation, skill gap radar, red flags, with actionable fixes ordered by priority.',
    },
    {
      scenario: 'You are a software engineer and want GitHub audit',
      pick: 'RejectCheck',
      why: 'The only tool in this list that audits commit history, repo quality, and language distribution against the target role.',
    },
    {
      scenario: 'You want the most mature ATS scanner with largest keyword database',
      pick: 'Jobscan',
      why: 'Category incumbent. Claims 3x more interview callbacks. Full suite including LinkedIn and job tracker.',
    },
    {
      scenario: 'Your LinkedIn profile matters as much as your CV',
      pick: 'Resume Worded',
      why: 'Dedicated LinkedIn optimization - not just an add-on.',
    },
    {
      scenario: 'You want the largest template library at lowest recurring cost',
      pick: 'Kickresume',
      why: '40+ templates on the €8/month annual tier. Best template library in the category.',
    },
    {
      scenario: 'You are applying in French-speaking markets',
      pick: 'RejectCheck',
      why: 'Fully bilingual EN + FR - UI, analysis, keywords, and tone audit all localized.',
    },
  ],
  faqBadge: 'FAQ',
  faqTitle: 'Frequently asked questions',
  faqItems: [
    {
      question: 'What is the best free alternative to Rezi?',
      answer:
        "Among the tools compared here, the most useful free tiers beyond Rezi's are: RejectCheck (1 full diagnosis for guests, 3 for registered users, no download cap), Resume Worded (free instant resume review + sample bullets), and Kickresume (4 templates with unlimited downloads). If your goal is a diagnosis of an existing CV rather than a builder, RejectCheck's free tier goes further than Rezi's.",
    },
    {
      question: "Is Rezi's $149 lifetime plan actually worth it?",
      answer:
        'If you expect to update your resume 5+ times over 1-2 years, the $149 lifetime is cheaper than 6 months of the $29/month Pro tier. For anyone who updates their resume only once or twice per year, a monthly ATS-check tool like RejectCheck (€7.99/month, cancel anytime) is cheaper on a per-use basis. Rezi is also only worth it if you use the builder itself - the Rezi Score alone can be obtained elsewhere.',
    },
    {
      question: 'What does RejectCheck do that Rezi does not?',
      answer:
        'Three things: (1) GitHub commit history and repo quality audit against the target job - Rezi has nothing like this; (2) LinkedIn profile cross-reference with your CV to detect inconsistencies; (3) voice-based AI mock interview (10 minutes, scored debrief) - Rezi offers only text-based AI interviews. RejectCheck is also bilingual EN + FR; Rezi is English-only.',
    },
    {
      question: 'Which Rezi alternative is best for software engineers?',
      answer:
        'RejectCheck is the only tool in this comparison that audits your GitHub commit history, repo quality, and language distribution against the target role. For a CS or engineering candidate evaluating an ATS tool alongside their code portfolio, that deeper signal audit is a material advantage over any pure CV-scanner, including Rezi.',
    },
    {
      question: 'Can I use Rezi in French?',
      answer:
        "Rezi is English-only as of April 2026. Candidates applying in France, Belgium, Switzerland, or French-speaking Canada who want analysis in French should use RejectCheck, which is fully bilingual EN + FR (UI, analysis output, keywords, tone audit all localized). Kickresume offers multilingual templates but the AI writer and ATS checker are primarily English.",
    },
    {
      question: 'Does Rezi Score accurately predict real ATS behavior?',
      answer:
        "Rezi Score is a keyword-density match score against the job description. Like all ATS simulators (Jobscan match rate, RejectCheck ATS score, Resume Worded score), it estimates behavior based on keyword presence but cannot replicate a specific employer's ATS (Workday, Greenhouse, Lever) exactly. It is useful as a directional signal - scoring 40% means you are missing meaningful keywords - but no score guarantees a real ATS will behave identically.",
    },
    {
      question: 'Which AI models does Rezi use compared to alternatives?',
      answer:
        'Rezi uses AI for its Resume Agent, writer, and interview practice but does not publicly disclose which specific models. RejectCheck openly documents a dual-AI architecture: OpenAI GPT-4o for ATS, CV audit, and red flags, plus Anthropic Claude for technical skill radar, GitHub/LinkedIn signals, and project recommendations - run in parallel. Jobscan, Kickresume, and Enhancv also use AI but similarly do not disclose specific models per feature.',
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
  title: '6 meilleures alternatives à Rezi en 2026 (gratuit, à vie, sans abonnement)',
  description:
    "Tu cherches une alternative à Rezi ? Compare RejectCheck, Jobscan, Resume Worded, Kickresume, et Enhancv sur le prix, la précision ATS, la profondeur du tier gratuit, et s'ils buildent ou diagnostiquent. Inclut le trade-off à vie vs abonnement.",
  badgeLabel: 'Comparaison · Mis à jour le 24 avril 2026',
  heroTitle: '6 meilleures alternatives à Rezi en 2026',
  heroIntro:
    "Rezi a popularisé le format builder de CV IA-first avec son option à vie à 149 $. C'est un outil solide pour les candidats qui partent d'une page blanche - mais si tu as déjà un CV et que tu veux diagnostiquer pourquoi il est rejeté, ou si tu as besoin de signaux au-delà des mots-clés (GitHub, LinkedIn), Rezi n'est pas le bon outil. Voici une comparaison honnête de six alternatives, du vrai tier gratuit au scanner ATS le plus mature de la catégorie.",
  tldrLabel: 'TL;DR',
  tldr: "Reste sur Rezi si tu démarres un CV de zéro ET que tu veux un paiement à vie de 149 $ unique. Passe à RejectCheck si tu as déjà un CV et veux un diagnostic complet incluant audit GitHub et LinkedIn + entretien simulé IA vocal. Choisis Jobscan pour le scanner ATS le plus mature. Choisis Kickresume (8 €/mois annuel) pour la plus grande bibliothèque de templates au prix récurrent le plus bas. Choisis Resume Worded si l'optimisation LinkedIn est ta priorité.",
  breadcrumbHome: 'Accueil',
  breadcrumbAlternatives: 'Alternatives',
  breadcrumbCurrent: 'Rezi',
  whyBadge: 'Pourquoi chercher une alternative',
  whyTitle: 'Quatre raisons de quitter Rezi',
  whyReasons: [
    {
      title: 'Builder-first, pas diagnostic-first',
      text: "Rezi est fondamentalement un builder de CV. Il démarre d'une page blanche et t'aide à écrire. Si tu as déjà un CV et veux savoir précisément pourquoi il se fait rejeter - quels mots-clés manquent, quels signaux de séniorité sont faibles, si ton LinkedIn le contredit - il te faut un outil de diagnostic, pas un builder. RejectCheck est construit exactement pour ça.",
    },
    {
      title: "Pas d'audit GitHub ni LinkedIn",
      text: "Pour les développeurs, candidats design, et tous ceux pour qui le portfolio public (commits GitHub, résumé LinkedIn, recommandations) compte autant que le CV, Rezi n'offre rien. RejectCheck audite ton historique de commits GitHub, la qualité des repos, et la distribution de langages face au rôle visé, et recoupe ton profil LinkedIn avec ton CV pour repérer les incohérences.",
    },
    {
      title: 'Tier gratuit limité (3 PDF, 1 entretien IA)',
      text: "Le tier gratuit de Rezi est une démo - 3 téléchargements PDF au total, 1 entretien IA, accès limité au Rezi Score. Si tu veux juste un scan ATS une fois, les alternatives gratuites vont plus loin : RejectCheck offre 1 analyse complète sans inscription (3 pour les enregistrés), Resume Worded donne une revue CV instantanée gratuite, et Kickresume permet des téléchargements illimités depuis les templates gratuits.",
    },
    {
      title: 'Anglais uniquement',
      text: "Rezi cible les marchés anglophones. Les candidats qui postulent en France, Belgique, Suisse, ou au Canada francophone ont besoin que la sortie d'analyse, les mots-clés, et l'audit de ton soient localisés. Seul RejectCheck est entièrement bilingue EN + FR de bout en bout ; Kickresume offre des templates multilingues ; Jobscan, Resume Worded, et Enhancv sont anglais-first.",
    },
  ],
  comparisonBadge: "En un coup d'œil",
  comparisonTitle: 'Rezi vs. 5 alternatives - comparaison rapide',
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
      scenario: "Tu démarres un CV d'une page blanche",
      pick: 'Rezi (reste)',
      why: "Rezi est un des meilleurs builders IA-first. L'option à vie à 149 $ est unique dans la catégorie.",
    },
    {
      scenario: 'Tu as déjà un CV et veux diagnostiquer pourquoi il échoue',
      pick: 'RejectCheck',
      why: "Conçu pour diagnostiquer un CV existant face à une offre spécifique - simulation ATS, radar des lacunes, red flags, avec corrections priorisées.",
    },
    {
      scenario: 'Tu es dev et tu veux un audit GitHub',
      pick: 'RejectCheck',
      why: "Le seul outil de cette liste qui audite l'historique de commits, la qualité des repos, et la distribution de langages face au rôle visé.",
    },
    {
      scenario: 'Tu veux le scanner ATS le plus mature avec la plus grande base de mots-clés',
      pick: 'Jobscan',
      why: "Leader de la catégorie. Revendique 3x plus de callbacks. Suite complète avec LinkedIn et tracker.",
    },
    {
      scenario: 'Ton profil LinkedIn compte autant que ton CV',
      pick: 'Resume Worded',
      why: "Optimisation LinkedIn dédiée - pas juste un add-on.",
    },
    {
      scenario: 'Tu veux la plus grande bibliothèque de templates au prix récurrent le plus bas',
      pick: 'Kickresume',
      why: "40+ templates sur le tier annuel à 8 €/mois. Meilleure bibliothèque de la catégorie.",
    },
    {
      scenario: 'Tu postules dans des marchés francophones',
      pick: 'RejectCheck',
      why: "Bilingue EN + FR complet - UI, analyse, mots-clés, et audit de ton localisés.",
    },
  ],
  faqBadge: 'FAQ',
  faqTitle: 'Questions fréquentes',
  faqItems: [
    {
      question: 'Quelle est la meilleure alternative gratuite à Rezi ?',
      answer:
        "Parmi les outils comparés ici, les tiers gratuits les plus utiles au-delà de Rezi sont : RejectCheck (1 diagnostic complet pour invités, 3 pour enregistrés, pas de cap de téléchargement), Resume Worded (revue CV instantanée gratuite + exemples de bullets), et Kickresume (4 templates avec téléchargements illimités). Si ton objectif est un diagnostic d'un CV existant plutôt qu'un builder, le tier gratuit de RejectCheck va plus loin que celui de Rezi.",
    },
    {
      question: "Le plan à vie de Rezi à 149 $ vaut-il vraiment le coup ?",
      answer:
        "Si tu t'attends à mettre à jour ton CV 5+ fois sur 1-2 ans, le 149 $ à vie est moins cher que 6 mois du tier Pro à 29 $/mois. Pour ceux qui mettent leur CV à jour seulement 1-2 fois par an, un outil de check ATS mensuel comme RejectCheck (7,99 €/mois, résiliable à tout moment) est moins cher à l'usage. Rezi n'est aussi intéressant que si tu utilises le builder lui-même - le Rezi Score seul peut être obtenu ailleurs.",
    },
    {
      question: 'Que fait RejectCheck que Rezi ne fait pas ?',
      answer:
        "Trois choses : (1) audit historique de commits GitHub et qualité des repos face à l'offre visée - Rezi n'a rien de ce type ; (2) recoupement profil LinkedIn avec ton CV pour détecter les incohérences ; (3) entretien simulé IA vocal (10 minutes, débrief scoré) - Rezi n'offre que des entretiens IA texte. RejectCheck est aussi bilingue EN + FR ; Rezi est anglais uniquement.",
    },
    {
      question: 'Quelle alternative à Rezi est la meilleure pour les développeurs ?',
      answer:
        "RejectCheck est le seul outil de cette comparaison qui audite ton historique de commits GitHub, la qualité de tes repos, et la distribution de langages face au rôle visé. Pour un candidat dev qui évalue un outil ATS en parallèle de son portfolio de code, cet audit signal plus profond est un avantage matériel face à tout scanner CV-only, Rezi inclus.",
    },
    {
      question: 'Puis-je utiliser Rezi en français ?',
      answer:
        "Rezi est anglais uniquement en avril 2026. Les candidats qui postulent en France, Belgique, Suisse, ou au Canada francophone et veulent une analyse en français devraient utiliser RejectCheck, entièrement bilingue EN + FR (UI, sortie d'analyse, mots-clés, audit de ton tous localisés). Kickresume offre des templates multilingues mais le writer IA et le checker ATS sont principalement anglais.",
    },
    {
      question: "Le Rezi Score prédit-il fidèlement le comportement d'un vrai ATS ?",
      answer:
        "Le Rezi Score est un score de densité de mots-clés face à l'offre. Comme tous les simulateurs ATS (Jobscan match rate, RejectCheck ATS score, Resume Worded score), il estime le comportement basé sur la présence de mots-clés mais ne peut pas répliquer exactement l'ATS d'un employeur spécifique (Workday, Greenhouse, Lever). Utile comme signal directionnel - scorer 40 % signifie qu'il te manque des mots-clés importants - mais aucun score ne garantit qu'un vrai ATS se comportera identiquement.",
    },
    {
      question: 'Quels modèles IA utilise Rezi vs les alternatives ?',
      answer:
        "Rezi utilise l'IA pour son Resume Agent, le writer, et la pratique d'entretien, mais ne divulgue pas publiquement les modèles spécifiques. RejectCheck documente ouvertement son architecture dual-IA : OpenAI GPT-4o pour l'ATS, l'audit CV, et les red flags, plus Anthropic Claude pour le radar technique, les signaux GitHub/LinkedIn, et les recommandations de projets - en parallèle. Jobscan, Kickresume, et Enhancv utilisent aussi de l'IA mais de même ne divulguent pas les modèles spécifiques par feature.",
    },
  ],
  ctaTitle: 'Essaie RejectCheck - gratuit, sans inscription',
  ctaSubtitle:
    "Téléverse ton CV, colle une offre, et obtiens un diagnostic complet en moins de 60 secondes : score ATS, radar des lacunes techniques, audit signaux GitHub et LinkedIn, et détection de red flags.",
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
