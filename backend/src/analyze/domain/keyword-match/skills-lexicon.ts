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
 * The list is dev/tech-first on purpose (RejectCheck is optimised for devs)
 * with a generic cross-role tail (agile, jira, sql, analytics…). It's meant to
 * be EXTENDED over time — add an entry, add its aliases, ship. No code change
 * needed.
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
  | 'tooling';

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
];
