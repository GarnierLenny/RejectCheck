// Static data for the onboarding flow + Settings → Targeting section.
// Ported from the design mockup at /Users/lenny.garnier/Downloads/Onboarding.html.

import type { ExperienceLevel, RoleType } from './queries'

export type RoleOption = {
  id: RoleType
  // Localised labels live in the i18n dictionary under `onboarding.roles.<id>`
  // and `onboarding.rolesMeta.<id>`. Keep this list in sync with both.
}

export const ROLES: RoleOption[] = [
  { id: 'software' },
  { id: 'product' },
  { id: 'design' },
  { id: 'data' },
  { id: 'marketing' },
  { id: 'ops' },
  { id: 'sales' },
  { id: 'other' },
]

export const TECH_ROLES: RoleType[] = ['software', 'data']

export type ExperienceOption = { id: ExperienceLevel }

export const EXPERIENCE_LEVELS: ExperienceOption[] = [
  { id: 'student' },
  { id: 'junior' },
  { id: 'mid' },
  { id: 'senior' },
  { id: 'lead' },
  { id: 'switcher' },
]

export const STACKS_PRIMARY: string[] = [
  'React',
  'Vue',
  'Angular',
  'Svelte',
  'Node.js',
  'Python',
  'Go',
  'Rust',
  'Java',
  'C#',
  'PHP',
  'TypeScript',
  'JavaScript',
  'iOS',
  'Android',
  'React Native',
  'Flutter',
  'DevOps / Cloud',
  'Data / ML',
  'Embedded',
]

export const STACKS_EXTENDED: string[] = [
  ...STACKS_PRIMARY,
  'Next.js',
  'Nuxt',
  'Remix',
  'Astro',
  'SolidJS',
  'Qwik',
  'NestJS',
  'FastAPI',
  'Django',
  'Flask',
  'Spring',
  'Laravel',
  'Ruby on Rails',
  'Phoenix',
  'Express',
  'Hono',
  'Kubernetes',
  'Docker',
  'AWS',
  'GCP',
  'Azure',
  'Terraform',
  'Ansible',
  'Pulumi',
  'PostgreSQL',
  'MySQL',
  'MongoDB',
  'Redis',
  'Elasticsearch',
  'ClickHouse',
  'Snowflake',
  'BigQuery',
  'PyTorch',
  'TensorFlow',
  'LangChain',
  'Pandas',
  'dbt',
  'Spark',
  'Kafka',
  'Swift',
  'Kotlin',
  'Objective-C',
  'Unity',
  'Unreal',
  'C++',
  'C',
  'Scala',
  'Elixir',
  'Clojure',
  'Haskell',
  'Lua',
  'Dart',
  'GraphQL',
  'tRPC',
  'REST',
  'gRPC',
  'WebSockets',
  'WebRTC',
  'Tailwind',
  'Sass',
  'styled-components',
  'Storybook',
  'Figma APIs',
  'Solidity',
  'Rust (web3)',
  'Embedded C',
  'FPGA / Verilog',
  'ROS',
]

export type Language = { code: string; name: string }

export const LANGS_PRIMARY: Language[] = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'de', name: 'German' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'it', name: 'Italian' },
  { code: 'zh', name: 'Mandarin' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' },
]

export const LANGS_EXTENDED: Language[] = [
  ...LANGS_PRIMARY,
  { code: 'nl', name: 'Dutch' },
  { code: 'sv', name: 'Swedish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'da', name: 'Danish' },
  { code: 'fi', name: 'Finnish' },
  { code: 'pl', name: 'Polish' },
  { code: 'cs', name: 'Czech' },
  { code: 'tr', name: 'Turkish' },
  { code: 'el', name: 'Greek' },
  { code: 'he', name: 'Hebrew' },
  { code: 'th', name: 'Thai' },
  { code: 'vi', name: 'Vietnamese' },
  { code: 'id', name: 'Indonesian' },
  { code: 'ms', name: 'Malay' },
  { code: 'tl', name: 'Tagalog' },
  { code: 'ca', name: 'Catalan' },
  { code: 'ro', name: 'Romanian' },
  { code: 'hu', name: 'Hungarian' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'bn', name: 'Bengali' },
  { code: 'ur', name: 'Urdu' },
  { code: 'fa', name: 'Persian' },
  { code: 'sw', name: 'Swahili' },
]

// URL fields shown on the last onboarding step + their adaptive banner copy.
// Tone drives the banner colour: red (technical / required GitHub),
// green (portfolio-led roles), amber (LinkedIn-only roles).
export type UrlField = 'github' | 'linkedin' | 'portfolio'
export type BannerTone = 'red' | 'green' | 'amber'

export type UrlPreset = {
  fields: UrlField[]
  recommended: UrlField[]
  tone: BannerTone
}

export const URL_PRESETS: Record<RoleType, UrlPreset> = {
  software: {
    fields: ['github', 'linkedin', 'portfolio'],
    recommended: ['github'],
    tone: 'red',
  },
  data: {
    fields: ['github', 'linkedin', 'portfolio'],
    recommended: ['github'],
    tone: 'red',
  },
  product: {
    fields: ['linkedin', 'portfolio'],
    recommended: ['linkedin'],
    tone: 'green',
  },
  design: {
    fields: ['portfolio', 'linkedin'],
    recommended: ['portfolio'],
    tone: 'green',
  },
  marketing: {
    fields: ['linkedin', 'portfolio'],
    recommended: ['linkedin'],
    tone: 'amber',
  },
  ops: {
    fields: ['linkedin'],
    recommended: ['linkedin'],
    tone: 'amber',
  },
  sales: {
    fields: ['linkedin'],
    recommended: ['linkedin'],
    tone: 'amber',
  },
  other: {
    fields: ['linkedin', 'portfolio', 'github'],
    recommended: ['linkedin'],
    tone: 'red',
  },
}

export const FIELD_PLACEHOLDERS: Record<UrlField, string> = {
  github: 'github.com/yourhandle',
  linkedin: 'linkedin.com/in/your-handle',
  portfolio: 'your-domain.com',
}
