import type { AlternativesContent, Competitor } from '../jobscan/content'

const COMPETITORS_EN: Competitor[] = [
  {
    name: 'RejectCheck',
    tagline:
      'Dual-AI CV diagnosis tool — not a builder. Tells you what is wrong with the CV you already have.',
    website: 'https://rejectcheck.com',
    freeTier: '1 full diagnosis (guest) or 3 (registered, free) — no signup required for first run',
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
      'Candidates who already have a CV and want to diagnose why it is being rejected — specifically software engineers who also want GitHub and LinkedIn signal audits, and French-speaking candidates.',
    weakness:
      "No CV builder from scratch — you need an existing CV to analyze. Cover letter generator announced as 'coming soon'.",
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
    paidEntry: '$29 / month — or $149 lifetime (one-time, no recurring)',
    topFeatures: [
      'AI Resume Builder with job-description keyword targeting',
      'Rezi Score — ATS compatibility scoring',
      'Unlimited AI interview practice (Pro and Lifetime)',
      'Resume Agent — AI assistant for bullet rewrites',
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
      'ATS resume optimization with One-Click Optimize, LinkedIn tools, and job tracker — the category incumbent.',
    website: 'https://www.jobscan.co',
    freeTier: 'Limited free scans (exact count varies; verify current policy)',
    paidEntry: 'Monthly tier — top of the category (verify current pricing on jobscan.co)',
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
      'Free instant resume review with dedicated LinkedIn profile optimization — over 1M users.',
    website: 'https://resumeworded.com',
    freeTier: 'Free account — instant resume review + sample bullets',
    paidEntry: 'Pro tier — pricing not published publicly; verify on site',
    topFeatures: [
      'Score My Resume — instant free feedback',
      'LinkedIn profile optimization (dedicated feature)',
      'Resume targeting against job descriptions',
      '250+ bullet-point samples across industries',
      'ATS-compatible resume templates',
    ],
    bestFor:
      'Candidates whose LinkedIn presence matters as much as their CV — marketing, sales, and client-facing roles where LinkedIn is the primary discovery channel.',
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
    paidEntry: '€8 / month (annual) — €24 / month (monthly billing)',
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
  title: '6 Best Rezi Alternatives in 2026 (Free, Lifetime, Non-Subscription)',
  description:
    'Looking for a Rezi alternative? Compare RejectCheck, Jobscan, Resume Worded, Kickresume, and Enhancv on price, ATS accuracy, free tier depth, and whether they build vs diagnose. Includes the lifetime vs subscription trade-off.',
  badgeLabel: 'Comparison · Updated April 24, 2026',
  heroTitle: '6 Best Rezi Alternatives in 2026',
  heroIntro:
    'Rezi pioneered the AI-first resume builder format with its $149 lifetime option. It is a solid tool for candidates starting from a blank page — but if you already have a CV and want to diagnose why it is failing, or if you need signals beyond keywords (GitHub, LinkedIn), Rezi is not the right tool. Here is an honest comparison of six alternatives, ranging from a true free tier to the most mature ATS scanner in the category.',
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
      text: 'Rezi is fundamentally a resume builder. It starts with a blank page and helps you write. If you already have a CV and want to know specifically why it is getting rejected — which keywords are missing, which seniority signals are weak, whether your LinkedIn contradicts it — you need a diagnosis tool, not a builder. RejectCheck is built for that exact job.',
    },
    {
      title: 'No GitHub or LinkedIn portfolio audit',
      text: 'For software engineers, candidates in design, and anyone whose public portfolio (GitHub commits, LinkedIn summary, recommendations) matters as much as the CV itself, Rezi offers nothing. RejectCheck audits your GitHub commit history, repo quality, and language distribution against the target role, and cross-references your LinkedIn profile with your CV to catch inconsistencies.',
    },
    {
      title: 'Limited free tier (3 PDFs, 1 AI interview)',
      text: "Rezi's free tier is effectively a demo — 3 PDF downloads total, 1 AI interview, limited Rezi Score access. If you only need an ATS scan once, free-tier alternatives go further: RejectCheck offers 1 full analysis without signup (3 for registered users), Resume Worded gives an instant free resume review, and Kickresume lets you download resumes unlimited from free templates.",
    },
    {
      title: 'English-only',
      text: "Rezi targets English-speaking markets. Candidates applying in France, Belgium, Switzerland, or French-speaking Canada need the analysis output, keywords, and tone audit localized. Only RejectCheck is fully bilingual EN + FR end-to-end; Kickresume offers multilingual templates; Jobscan, Resume Worded, and Enhancv are English-first.",
    },
  ],
  comparisonBadge: 'At a glance',
  comparisonTitle: 'Rezi vs. 5 alternatives — quick comparison',
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
      why: 'Purpose-built for diagnosing an existing CV against a specific job — ATS simulation, skill gap radar, red flags, with actionable fixes ordered by priority.',
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
      why: 'Dedicated LinkedIn optimization — not just an add-on.',
    },
    {
      scenario: 'You want the largest template library at lowest recurring cost',
      pick: 'Kickresume',
      why: '40+ templates on the €8/month annual tier. Best template library in the category.',
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
      question: 'What is the best free alternative to Rezi?',
      answer:
        "Among the tools compared here, the most useful free tiers beyond Rezi's are: RejectCheck (1 full diagnosis for guests, 3 for registered users, no download cap), Resume Worded (free instant resume review + sample bullets), and Kickresume (4 templates with unlimited downloads). If your goal is a diagnosis of an existing CV rather than a builder, RejectCheck's free tier goes further than Rezi's.",
    },
    {
      question: "Is Rezi's $149 lifetime plan actually worth it?",
      answer:
        'If you expect to update your resume 5+ times over 1-2 years, the $149 lifetime is cheaper than 6 months of the $29/month Pro tier. For anyone who updates their resume only once or twice per year, a monthly ATS-check tool like RejectCheck (€7.99/month, cancel anytime) is cheaper on a per-use basis. Rezi is also only worth it if you use the builder itself — the Rezi Score alone can be obtained elsewhere.',
    },
    {
      question: 'What does RejectCheck do that Rezi does not?',
      answer:
        'Three things: (1) GitHub commit history and repo quality audit against the target job — Rezi has nothing like this; (2) LinkedIn profile cross-reference with your CV to detect inconsistencies; (3) voice-based AI mock interview (10 minutes, scored debrief) — Rezi offers only text-based AI interviews. RejectCheck is also bilingual EN + FR; Rezi is English-only.',
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
        "Rezi Score is a keyword-density match score against the job description. Like all ATS simulators (Jobscan match rate, RejectCheck ATS score, Resume Worded score), it estimates behavior based on keyword presence but cannot replicate a specific employer's ATS (Workday, Greenhouse, Lever) exactly. It is useful as a directional signal — scoring 40% means you are missing meaningful keywords — but no score guarantees a real ATS will behave identically.",
    },
    {
      question: 'Which AI models does Rezi use compared to alternatives?',
      answer:
        'Rezi uses AI for its Resume Agent, writer, and interview practice but does not publicly disclose which specific models. RejectCheck openly documents a dual-AI architecture: OpenAI GPT-4o for ATS, CV audit, and red flags, plus Anthropic Claude for technical skill radar, GitHub/LinkedIn signals, and project recommendations — run in parallel. Jobscan, Kickresume, and Enhancv also use AI but similarly do not disclose specific models per feature.',
    },
  ],
  ctaTitle: 'Try RejectCheck — free, no signup',
  ctaSubtitle:
    'Upload your CV, paste a job description, and get a full diagnosis in under 60 seconds: ATS score, technical skill gap radar, GitHub and LinkedIn signal audit, and red flag detection.',
  ctaButton: 'Analyze my CV free',
  ctaPricingLink: 'Or see full pricing →',
  footerCopyright: '© RejectCheck · Last updated April 24, 2026',
  footerPrivacy: 'Privacy (GDPR)',
  footerPricing: 'Pricing',
  competitors: COMPETITORS_EN,
}

// FR not yet translated — redirect /fr/alternatives/rezi to /en version via the page
export function getContent(_locale: 'en' | 'fr'): AlternativesContent {
  return contentEn
}
