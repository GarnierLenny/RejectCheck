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

export function getContent(_locale: 'en' | 'fr'): AlternativesContent {
  return contentEn
}
