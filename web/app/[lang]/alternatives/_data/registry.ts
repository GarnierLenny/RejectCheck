export type AlternativeEntry = {
  slug: string
  competitor: string
  tagline: { en: string; fr: string }
  bilingual: boolean // true if FR version exists
}

export const ALTERNATIVES_REGISTRY: AlternativeEntry[] = [
  {
    slug: 'jobscan',
    competitor: 'Jobscan',
    tagline: {
      en: 'The category incumbent for ATS resume scanning. 7 alternatives compared on price, features, and fit.',
      fr: "Le leader historique du scan ATS. 7 alternatives comparées sur le prix, les features, et le fit.",
    },
    bilingual: true,
  },
  {
    slug: 'rezi',
    competitor: 'Rezi',
    tagline: {
      en: 'AI-first resume builder with $149 lifetime. 6 alternatives for builders, diagnoses, and lifetime-alternatives.',
      fr: 'Builder de CV IA avec licence à vie à 149 $. 6 alternatives pour builders, diagnostics, et offres à vie.',
    },
    bilingual: true,
  },
  {
    slug: 'resume-worded',
    competitor: 'Resume Worded',
    tagline: {
      en: 'LinkedIn-focused review with hidden Pro pricing. 7 alternatives with transparent pricing.',
      fr: "Revue focalisée LinkedIn avec tarifs Pro non publiés. 7 alternatives avec des prix transparents.",
    },
    bilingual: true,
  },
]

export function otherAlternatives(currentSlug: string): AlternativeEntry[] {
  return ALTERNATIVES_REGISTRY.filter((entry) => entry.slug !== currentSlug)
}
