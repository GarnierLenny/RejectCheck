/**
 * Maintained skills lexicon powering the DETERMINISTIC keyword match layer.
 *
 * The freeform-JD problem: a raw job description is noisy prose. Rather than
 * guess at "what is a skill" with fuzzy NLP (non-deterministic, hard to
 * reproduce), we only recognise terms that appear in THIS curated list. That
 * keeps extraction precise and 100% reproducible: the same JD + CV always
 * yields the same keyword table and the same coverage score. See
 * `keyword-match.ts`.
 *
 * The list is dev/tech-first on purpose (RejectCheck is optimised for devs) but
 * also covers the non-tech role families (product, design, marketing, sales,
 * ops), so the deterministic coverage score, the free re-scan and the inline
 * projection apply to any role, not only engineers. It is meant to be EXTENDED
 * over time: add an entry, add its aliases, ship. No code change needed beyond
 * a new SkillCategory value.
 *
 * Precision rule for non-tech terms: only add a term whose surface form does
 * not commonly mean something else. Prefer multi-word or acronym forms over
 * bare common words, so "sales pipeline" is in but bare "pipeline" (which also
 * means a CI pipeline) is out. A false keyword makes the whole score look
 * untrustworthy, which is exactly what this layer exists to prevent.
 *
 * Alias rules (see `aliasToMatcher` in keyword-match.ts):
 *  - aliases are matched case-insensitively with alphanumeric word boundaries,
 *    so "java" never matches inside "javascript" and "react" never matches
 *    inside "reactive".
 *  - a space in an alias means "one or more of space / slash / underscore /
 *    hyphen", so the single alias "machine learning" also catches
 *    "machine-learning" and "machine/learning".
 *  - the canonical name is auto-added as an alias; you only list the EXTRA
 *    spellings.
 *  - ultra-short ambiguous names (C, R, Go) deliberately use qualified aliases
 *    only ("c programming", "golang"…). Missing a bare "Go" is a fair price for
 *    never false-matching "go to market" — precision beats recall here, because
 *    a wrong keyword makes the whole score look untrustworthy.
 */

export type SkillCategory =
  | 'language'
  | 'frontend'
  | 'backend'
  | 'mobile'
  | 'database'
  | 'cloud'
  | 'devops'
  | 'data-ml'
  | 'testing'
  | 'practice'
  | 'tooling'
  // Non-tech role families (product, design, marketing, sales, ops) so the
  // deterministic coverage + free re-scan + inline projection apply to the
  // "works for any role" audience, not just devs.
  | 'product'
  | 'design'
  | 'marketing'
  | 'sales'
  | 'ops';

export type LexiconEntry = {
  /** Display name shown in the keyword table. */
  canonical: string;
  category: SkillCategory;
  /** Extra spellings (lowercased). The canonical is auto-included. */
  aliases: string[];
  /**
   * Set false for ultra-short ambiguous names (C, R, Go) so the BARE canonical
   * is never matched — only the qualified aliases are. Otherwise "c" would hit
   * inside "c++"/"c#" and "r" would hit every stray letter. Defaults to true.
   */
  matchCanonical?: boolean;
};

export const SKILLS_LEXICON: LexiconEntry[] = [
  // ── Languages ──────────────────────────────────────────────────────────
  { canonical: 'JavaScript', category: 'language', aliases: ['js', 'ecmascript', 'es6', 'es2015'] },
  { canonical: 'TypeScript', category: 'language', aliases: ['ts'] },
  { canonical: 'Python', category: 'language', aliases: ['py'] },
  { canonical: 'Java', category: 'language', aliases: [] },
  { canonical: 'C++', category: 'language', aliases: ['cpp', 'cplusplus'] },
  { canonical: 'C#', category: 'language', aliases: ['csharp'] },
  { canonical: 'C', category: 'language', aliases: ['c programming', 'c language'], matchCanonical: false },
  { canonical: 'Go', category: 'language', aliases: ['golang'], matchCanonical: false },
  { canonical: 'Rust', category: 'language', aliases: [] },
  { canonical: 'Ruby', category: 'language', aliases: [] },
  { canonical: 'PHP', category: 'language', aliases: [] },
  { canonical: 'Swift', category: 'language', aliases: [] },
  { canonical: 'Kotlin', category: 'language', aliases: [] },
  { canonical: 'Scala', category: 'language', aliases: [] },
  { canonical: 'Objective-C', category: 'language', aliases: ['objc'] },
  { canonical: 'R', category: 'language', aliases: ['r programming', 'r language', 'rlang', 'rstudio', 'r studio'], matchCanonical: false },
  { canonical: 'Elixir', category: 'language', aliases: [] },
  { canonical: 'Haskell', category: 'language', aliases: [] },
  { canonical: 'Perl', category: 'language', aliases: [] },
  { canonical: 'Dart', category: 'language', aliases: [] },
  { canonical: 'Solidity', category: 'language', aliases: [] },
  { canonical: 'SQL', category: 'language', aliases: [] },
  { canonical: 'HTML', category: 'language', aliases: ['html5'] },
  { canonical: 'CSS', category: 'language', aliases: ['css3'] },
  { canonical: 'Shell', category: 'language', aliases: ['bash', 'shell scripting', 'zsh'] },

  // ── Frontend ───────────────────────────────────────────────────────────
  { canonical: 'React', category: 'frontend', aliases: ['reactjs', 'react.js'] },
  { canonical: 'Vue', category: 'frontend', aliases: ['vuejs', 'vue.js'] },
  { canonical: 'Angular', category: 'frontend', aliases: ['angularjs'] },
  { canonical: 'Svelte', category: 'frontend', aliases: ['sveltekit'] },
  { canonical: 'Next.js', category: 'frontend', aliases: ['nextjs', 'next js'] },
  { canonical: 'Nuxt', category: 'frontend', aliases: ['nuxtjs', 'nuxt.js'] },
  { canonical: 'Remix', category: 'frontend', aliases: [] },
  { canonical: 'Redux', category: 'frontend', aliases: [] },
  { canonical: 'Tailwind CSS', category: 'frontend', aliases: ['tailwind', 'tailwindcss'] },
  { canonical: 'Sass', category: 'frontend', aliases: ['scss'] },
  { canonical: 'Webpack', category: 'frontend', aliases: [] },
  { canonical: 'Vite', category: 'frontend', aliases: [] },
  { canonical: 'jQuery', category: 'frontend', aliases: [] },
  { canonical: 'Bootstrap', category: 'frontend', aliases: [] },
  { canonical: 'Material UI', category: 'frontend', aliases: ['mui', 'material-ui'] },
  { canonical: 'Webflow', category: 'frontend', aliases: [] },
  { canonical: 'Three.js', category: 'frontend', aliases: ['threejs'] },
  { canonical: 'WebGL', category: 'frontend', aliases: [] },
  { canonical: 'Accessibility', category: 'frontend', aliases: ['a11y', 'wcag'] },

  // ── Mobile ─────────────────────────────────────────────────────────────
  { canonical: 'React Native', category: 'mobile', aliases: ['reactnative'] },
  { canonical: 'Flutter', category: 'mobile', aliases: [] },
  { canonical: 'Expo', category: 'mobile', aliases: [] },
  { canonical: 'iOS', category: 'mobile', aliases: ['ios development'] },
  { canonical: 'Android', category: 'mobile', aliases: ['android development'] },
  { canonical: 'SwiftUI', category: 'mobile', aliases: [] },
  { canonical: 'Jetpack Compose', category: 'mobile', aliases: [] },

  // ── Backend / API ──────────────────────────────────────────────────────
  { canonical: 'Node.js', category: 'backend', aliases: ['nodejs', 'node js'] },
  { canonical: 'Express', category: 'backend', aliases: ['expressjs', 'express.js'] },
  { canonical: 'NestJS', category: 'backend', aliases: ['nest.js'] },
  { canonical: 'Django', category: 'backend', aliases: [] },
  { canonical: 'Flask', category: 'backend', aliases: [] },
  { canonical: 'FastAPI', category: 'backend', aliases: ['fast api'] },
  { canonical: 'Spring', category: 'backend', aliases: ['spring boot', 'springboot'] },
  { canonical: 'Ruby on Rails', category: 'backend', aliases: ['rails', 'ror'] },
  { canonical: 'Laravel', category: 'backend', aliases: [] },
  { canonical: 'Symfony', category: 'backend', aliases: [] },
  { canonical: '.NET', category: 'backend', aliases: ['dotnet', 'asp.net', 'aspnet', 'asp net'] },
  { canonical: 'GraphQL', category: 'backend', aliases: [] },
  { canonical: 'REST', category: 'backend', aliases: ['rest api', 'restful', 'rest apis'] },
  { canonical: 'gRPC', category: 'backend', aliases: [] },
  { canonical: 'WebSockets', category: 'backend', aliases: ['websocket', 'web sockets'] },
  { canonical: 'Kafka', category: 'backend', aliases: ['apache kafka'] },
  { canonical: 'RabbitMQ', category: 'backend', aliases: [] },
  { canonical: 'Celery', category: 'backend', aliases: [] },
  { canonical: 'OAuth', category: 'backend', aliases: ['oauth2', 'oauth 2.0'] },
  { canonical: 'JWT', category: 'backend', aliases: [] },

  // ── Databases / data stores ────────────────────────────────────────────
  { canonical: 'PostgreSQL', category: 'database', aliases: ['postgres', 'psql'] },
  { canonical: 'MySQL', category: 'database', aliases: [] },
  { canonical: 'MongoDB', category: 'database', aliases: ['mongo'] },
  { canonical: 'SQLite', category: 'database', aliases: [] },
  { canonical: 'Redis', category: 'database', aliases: [] },
  { canonical: 'Cassandra', category: 'database', aliases: [] },
  { canonical: 'DynamoDB', category: 'database', aliases: [] },
  { canonical: 'Elasticsearch', category: 'database', aliases: ['elastic search'] },
  { canonical: 'Prisma', category: 'database', aliases: [] },
  { canonical: 'Sequelize', category: 'database', aliases: [] },
  { canonical: 'TypeORM', category: 'database', aliases: [] },
  { canonical: 'SQLAlchemy', category: 'database', aliases: [] },
  { canonical: 'Snowflake', category: 'database', aliases: [] },
  { canonical: 'BigQuery', category: 'database', aliases: ['big query'] },
  { canonical: 'Supabase', category: 'database', aliases: [] },
  { canonical: 'Firebase', category: 'database', aliases: [] },

  // ── Cloud / infra ──────────────────────────────────────────────────────
  { canonical: 'AWS', category: 'cloud', aliases: ['amazon web services'] },
  { canonical: 'GCP', category: 'cloud', aliases: ['google cloud', 'google cloud platform'] },
  { canonical: 'Azure', category: 'cloud', aliases: ['microsoft azure'] },
  { canonical: 'Lambda', category: 'cloud', aliases: ['aws lambda'] },
  { canonical: 'S3', category: 'cloud', aliases: ['aws s3'] },
  { canonical: 'Serverless', category: 'cloud', aliases: [] },
  { canonical: 'Cloudflare', category: 'cloud', aliases: [] },
  { canonical: 'Vercel', category: 'cloud', aliases: [] },
  { canonical: 'Heroku', category: 'cloud', aliases: [] },
  { canonical: 'Nginx', category: 'cloud', aliases: [] },
  { canonical: 'Linux', category: 'cloud', aliases: ['unix'] },

  // ── DevOps / CI-CD / observability ─────────────────────────────────────
  { canonical: 'Docker', category: 'devops', aliases: [] },
  { canonical: 'Kubernetes', category: 'devops', aliases: ['k8s'] },
  { canonical: 'Terraform', category: 'devops', aliases: [] },
  { canonical: 'Ansible', category: 'devops', aliases: [] },
  { canonical: 'Jenkins', category: 'devops', aliases: [] },
  { canonical: 'GitHub Actions', category: 'devops', aliases: [] },
  { canonical: 'GitLab CI', category: 'devops', aliases: ['gitlab ci/cd'] },
  { canonical: 'CircleCI', category: 'devops', aliases: ['circle ci'] },
  { canonical: 'CI/CD', category: 'devops', aliases: ['cicd', 'ci cd', 'continuous integration', 'continuous delivery', 'continuous deployment'] },
  { canonical: 'Helm', category: 'devops', aliases: [] },
  { canonical: 'Prometheus', category: 'devops', aliases: [] },
  { canonical: 'Grafana', category: 'devops', aliases: [] },
  { canonical: 'Datadog', category: 'devops', aliases: ['data dog'] },
  { canonical: 'Sentry', category: 'devops', aliases: [] },

  // ── Data / ML ──────────────────────────────────────────────────────────
  { canonical: 'Machine Learning', category: 'data-ml', aliases: ['ml'] },
  { canonical: 'Deep Learning', category: 'data-ml', aliases: [] },
  { canonical: 'TensorFlow', category: 'data-ml', aliases: ['tensor flow'] },
  { canonical: 'PyTorch', category: 'data-ml', aliases: ['py torch'] },
  { canonical: 'Pandas', category: 'data-ml', aliases: [] },
  { canonical: 'NumPy', category: 'data-ml', aliases: [] },
  { canonical: 'scikit-learn', category: 'data-ml', aliases: ['sklearn', 'scikit learn'] },
  { canonical: 'Spark', category: 'data-ml', aliases: ['apache spark', 'pyspark'] },
  { canonical: 'Hadoop', category: 'data-ml', aliases: [] },
  { canonical: 'Airflow', category: 'data-ml', aliases: ['apache airflow'] },
  { canonical: 'dbt', category: 'data-ml', aliases: [] },
  { canonical: 'Tableau', category: 'data-ml', aliases: [] },
  { canonical: 'Power BI', category: 'data-ml', aliases: ['powerbi'] },
  { canonical: 'NLP', category: 'data-ml', aliases: ['natural language processing'] },
  { canonical: 'Computer Vision', category: 'data-ml', aliases: [] },
  { canonical: 'LLM', category: 'data-ml', aliases: ['llms', 'large language model', 'large language models'] },

  // ── Testing / quality ──────────────────────────────────────────────────
  { canonical: 'Jest', category: 'testing', aliases: [] },
  { canonical: 'Vitest', category: 'testing', aliases: [] },
  { canonical: 'Cypress', category: 'testing', aliases: [] },
  { canonical: 'Playwright', category: 'testing', aliases: [] },
  { canonical: 'Selenium', category: 'testing', aliases: [] },
  { canonical: 'Pytest', category: 'testing', aliases: [] },
  { canonical: 'JUnit', category: 'testing', aliases: [] },
  { canonical: 'Mocha', category: 'testing', aliases: [] },
  { canonical: 'Testing Library', category: 'testing', aliases: ['react testing library', 'rtl'] },
  { canonical: 'TDD', category: 'testing', aliases: ['test driven development', 'test-driven'] },

  // ── Practices / concepts ───────────────────────────────────────────────
  { canonical: 'Agile', category: 'practice', aliases: [] },
  { canonical: 'Scrum', category: 'practice', aliases: [] },
  { canonical: 'Kanban', category: 'practice', aliases: [] },
  { canonical: 'Microservices', category: 'practice', aliases: ['micro services', 'microservice'] },
  { canonical: 'System Design', category: 'practice', aliases: [] },
  { canonical: 'Distributed Systems', category: 'practice', aliases: ['distributed system'] },
  { canonical: 'Event-Driven', category: 'practice', aliases: ['event driven', 'event-driven architecture'] },
  { canonical: 'OOP', category: 'practice', aliases: ['object-oriented', 'object oriented programming'] },
  { canonical: 'Functional Programming', category: 'practice', aliases: ['fp'] },
  { canonical: 'Design Patterns', category: 'practice', aliases: ['design pattern'] },
  { canonical: 'DevOps', category: 'practice', aliases: [] },
  { canonical: 'Domain-Driven Design', category: 'practice', aliases: ['ddd', 'domain driven design'] },

  // ── Tooling / collaboration (cross-role tail) ──────────────────────────
  { canonical: 'Git', category: 'tooling', aliases: [] },
  { canonical: 'GitHub', category: 'tooling', aliases: [] },
  { canonical: 'GitLab', category: 'tooling', aliases: [] },
  { canonical: 'Bitbucket', category: 'tooling', aliases: [] },
  { canonical: 'Jira', category: 'tooling', aliases: [] },
  { canonical: 'Confluence', category: 'tooling', aliases: [] },
  { canonical: 'Figma', category: 'tooling', aliases: [] },
  { canonical: 'Notion', category: 'tooling', aliases: [] },
  { canonical: 'A/B Testing', category: 'tooling', aliases: ['ab testing', 'a b testing'] },
  { canonical: 'Analytics', category: 'tooling', aliases: ['google analytics', 'product analytics'] },

  // ── Product management ─────────────────────────────────────────────────
  { canonical: 'Product Roadmap', category: 'product', aliases: ['product roadmap', 'roadmap', 'roadmapping'] },
  { canonical: 'Product Backlog', category: 'product', aliases: ['product backlog'] },
  { canonical: 'User Stories', category: 'product', aliases: ['user story', 'user stories'] },
  { canonical: 'Product-Market Fit', category: 'product', aliases: ['product market fit', 'pmf'] },
  { canonical: 'PRD', category: 'product', aliases: ['product requirements document', 'product spec'] },
  { canonical: 'MVP', category: 'product', aliases: ['minimum viable product'] },
  { canonical: 'Go-to-Market', category: 'product', aliases: ['go-to-market', 'go to market', 'gtm'] },
  { canonical: 'Stakeholder Management', category: 'product', aliases: ['stakeholder management'] },
  { canonical: 'OKRs', category: 'product', aliases: ['okr', 'okrs', 'objectives and key results'] },
  { canonical: 'KPIs', category: 'product', aliases: ['kpi', 'kpis', 'key performance indicator'] },
  { canonical: 'Amplitude', category: 'product', aliases: [] },
  { canonical: 'Mixpanel', category: 'product', aliases: [] },
  { canonical: 'Pendo', category: 'product', aliases: [] },
  { canonical: 'Productboard', category: 'product', aliases: [] },
  { canonical: 'Miro', category: 'product', aliases: [] },

  // ── Design / UX ────────────────────────────────────────────────────────
  { canonical: 'User Experience', category: 'design', aliases: ['ux', 'user experience'] },
  { canonical: 'User Interface', category: 'design', aliases: ['ui design', 'user interface'] },
  { canonical: 'User Research', category: 'design', aliases: ['user research', 'ux research'] },
  { canonical: 'Wireframing', category: 'design', aliases: ['wireframe', 'wireframes', 'wireframing'] },
  { canonical: 'Prototyping', category: 'design', aliases: ['prototyping', 'rapid prototyping'] },
  { canonical: 'Design System', category: 'design', aliases: ['design system', 'design systems'] },
  { canonical: 'Usability Testing', category: 'design', aliases: ['usability testing', 'usability test'] },
  { canonical: 'Information Architecture', category: 'design', aliases: ['information architecture'] },
  { canonical: 'Interaction Design', category: 'design', aliases: ['interaction design'] },
  { canonical: 'Design Thinking', category: 'design', aliases: ['design thinking'] },
  { canonical: 'Journey Mapping', category: 'design', aliases: ['journey mapping', 'customer journey', 'user journey'] },
  { canonical: 'User Personas', category: 'design', aliases: ['user persona', 'user personas', 'personas'] },
  { canonical: 'Adobe XD', category: 'design', aliases: ['adobe xd'] },
  { canonical: 'InVision', category: 'design', aliases: [] },
  { canonical: 'Framer', category: 'design', aliases: [] },
  { canonical: 'Photoshop', category: 'design', aliases: ['adobe photoshop'] },
  { canonical: 'Illustrator', category: 'design', aliases: ['adobe illustrator'] },
  { canonical: 'After Effects', category: 'design', aliases: ['adobe after effects'] },
  { canonical: 'Zeplin', category: 'design', aliases: [] },

  // ── Marketing / growth ─────────────────────────────────────────────────
  { canonical: 'SEO', category: 'marketing', aliases: ['search engine optimization', 'search engine optimisation'] },
  { canonical: 'SEM', category: 'marketing', aliases: ['search engine marketing'] },
  { canonical: 'PPC', category: 'marketing', aliases: ['pay per click', 'pay-per-click'] },
  { canonical: 'Content Marketing', category: 'marketing', aliases: ['content marketing', 'content strategy'] },
  { canonical: 'Email Marketing', category: 'marketing', aliases: ['email marketing'] },
  { canonical: 'Social Media Marketing', category: 'marketing', aliases: ['social media marketing', 'social media', 'smm'] },
  { canonical: 'Growth Marketing', category: 'marketing', aliases: ['growth marketing', 'growth hacking'] },
  { canonical: 'Demand Generation', category: 'marketing', aliases: ['demand generation', 'demand gen'] },
  { canonical: 'Lead Generation', category: 'marketing', aliases: ['lead generation', 'lead gen', 'leadgen'] },
  { canonical: 'Marketing Automation', category: 'marketing', aliases: ['marketing automation'] },
  { canonical: 'Copywriting', category: 'marketing', aliases: ['copywriter'] },
  { canonical: 'Branding', category: 'marketing', aliases: ['brand marketing', 'brand strategy'] },
  { canonical: 'Conversion Rate Optimization', category: 'marketing', aliases: ['conversion rate optimization', 'conversion rate optimisation', 'cro'] },
  { canonical: 'Paid Media', category: 'marketing', aliases: ['paid media', 'paid search', 'paid social'] },
  { canonical: 'Influencer Marketing', category: 'marketing', aliases: ['influencer marketing'] },
  { canonical: 'Google Ads', category: 'marketing', aliases: ['google ads', 'google adwords', 'adwords'] },
  { canonical: 'Meta Ads', category: 'marketing', aliases: ['meta ads', 'facebook ads'] },
  { canonical: 'LinkedIn Ads', category: 'marketing', aliases: ['linkedin ads'] },
  { canonical: 'Google Tag Manager', category: 'marketing', aliases: ['google tag manager'] },
  { canonical: 'HubSpot', category: 'marketing', aliases: [] },
  { canonical: 'Marketo', category: 'marketing', aliases: [] },
  { canonical: 'Mailchimp', category: 'marketing', aliases: [] },
  { canonical: 'Klaviyo', category: 'marketing', aliases: [] },
  { canonical: 'Semrush', category: 'marketing', aliases: [] },
  { canonical: 'Ahrefs', category: 'marketing', aliases: [] },
  { canonical: 'Hootsuite', category: 'marketing', aliases: [] },
  { canonical: 'CAC', category: 'marketing', aliases: ['customer acquisition cost'] },
  { canonical: 'LTV', category: 'marketing', aliases: ['lifetime value', 'customer lifetime value', 'clv'] },
  { canonical: 'ROAS', category: 'marketing', aliases: ['return on ad spend'] },
  { canonical: 'CTR', category: 'marketing', aliases: ['click-through rate', 'click through rate'] },
  { canonical: 'CPC', category: 'marketing', aliases: ['cost per click'] },
  { canonical: 'CPA', category: 'marketing', aliases: ['cost per acquisition'] },
  { canonical: 'CPM', category: 'marketing', aliases: ['cost per mille'] },
  { canonical: 'MQL', category: 'marketing', aliases: ['marketing qualified lead', 'mqls'] },
  { canonical: 'NPS', category: 'marketing', aliases: ['net promoter score'] },

  // ── Sales / revenue ────────────────────────────────────────────────────
  { canonical: 'Salesforce', category: 'sales', aliases: ['sfdc', 'salesforce crm'] },
  { canonical: 'Salesloft', category: 'sales', aliases: [] },
  { canonical: 'ZoomInfo', category: 'sales', aliases: [] },
  { canonical: 'Sales Navigator', category: 'sales', aliases: ['linkedin sales navigator', 'sales navigator'] },
  { canonical: 'Pipedrive', category: 'sales', aliases: [] },
  { canonical: 'CRM', category: 'sales', aliases: ['customer relationship management'] },
  { canonical: 'Prospecting', category: 'sales', aliases: [] },
  { canonical: 'Cold Calling', category: 'sales', aliases: ['cold calling', 'cold outreach', 'cold email'] },
  { canonical: 'Pipeline Management', category: 'sales', aliases: ['pipeline management', 'sales pipeline'] },
  { canonical: 'Account Management', category: 'sales', aliases: ['account management'] },
  { canonical: 'SDR', category: 'sales', aliases: ['sales development representative'] },
  { canonical: 'BDR', category: 'sales', aliases: ['business development representative'] },
  { canonical: 'Quota', category: 'sales', aliases: ['quota attainment', 'quota-carrying'] },
  { canonical: 'Sales Forecasting', category: 'sales', aliases: ['sales forecasting'] },
  { canonical: 'Upselling', category: 'sales', aliases: ['upsell', 'up-sell'] },
  { canonical: 'Cross-selling', category: 'sales', aliases: ['cross-sell'] },
  { canonical: 'Negotiation', category: 'sales', aliases: ['negotiating'] },
  { canonical: 'ARR', category: 'sales', aliases: ['annual recurring revenue'] },
  { canonical: 'MRR', category: 'sales', aliases: ['monthly recurring revenue'] },
  { canonical: 'ACV', category: 'sales', aliases: ['annual contract value'] },
  { canonical: 'B2B', category: 'sales', aliases: ['business-to-business'] },
  { canonical: 'B2C', category: 'sales', aliases: ['business-to-consumer'] },

  // ── Operations / business ──────────────────────────────────────────────
  { canonical: 'Excel', category: 'ops', aliases: ['microsoft excel', 'ms excel'] },
  { canonical: 'SAP', category: 'ops', aliases: [] },
  { canonical: 'NetSuite', category: 'ops', aliases: [] },
  { canonical: 'Workday', category: 'ops', aliases: [] },
  { canonical: 'ServiceNow', category: 'ops', aliases: [] },
  { canonical: 'Zapier', category: 'ops', aliases: [] },
  { canonical: 'Airtable', category: 'ops', aliases: [] },
  { canonical: 'Asana', category: 'ops', aliases: [] },
  { canonical: 'Monday.com', category: 'ops', aliases: ['monday.com'] },
  { canonical: 'Trello', category: 'ops', aliases: [] },
  { canonical: 'Smartsheet', category: 'ops', aliases: [] },
  { canonical: 'Looker', category: 'ops', aliases: [] },
  { canonical: 'Supply Chain', category: 'ops', aliases: ['supply chain', 'supply chain management', 'scm'] },
  { canonical: 'Logistics', category: 'ops', aliases: [] },
  { canonical: 'Procurement', category: 'ops', aliases: [] },
  { canonical: 'Inventory Management', category: 'ops', aliases: ['inventory management', 'inventory control'] },
  { canonical: 'Process Improvement', category: 'ops', aliases: ['process improvement', 'continuous improvement'] },
  { canonical: 'Lean', category: 'ops', aliases: ['lean manufacturing'] },
  { canonical: 'Six Sigma', category: 'ops', aliases: ['six sigma', 'lean six sigma'] },
  { canonical: 'Project Management', category: 'ops', aliases: ['project management'] },
  { canonical: 'Program Management', category: 'ops', aliases: ['program management'] },
  { canonical: 'Change Management', category: 'ops', aliases: ['change management'] },
  { canonical: 'Vendor Management', category: 'ops', aliases: ['vendor management'] },
  { canonical: 'Budgeting', category: 'ops', aliases: ['budget management'] },
  { canonical: 'P&L', category: 'ops', aliases: ['profit and loss', 'p&l management'] },
  { canonical: 'SLA', category: 'ops', aliases: ['service level agreement', 'slas'] },
  { canonical: 'Forecasting', category: 'ops', aliases: ['demand forecasting', 'financial forecasting'] },
  { canonical: 'Operations Management', category: 'ops', aliases: ['operations management'] },
  { canonical: 'Capacity Planning', category: 'ops', aliases: ['capacity planning'] },
];
