/**
 * Golden {JD, CV} pairs for the two-tier score-stability harness.
 *
 * Tier 1 (CI, free, deterministic): score-stability.spec.ts pins the keyword
 * coverage each fixture produces and locks it with a snapshot, so any change to
 * the lexicon or matcher surfaces as a reviewable diff.
 *
 * Tier 2 (real API, on demand): score-drift.ts runs each fixture through the
 * live model N times and fails if the anchored risk spread or the ATS pass flag
 * drifts beyond the allowed band.
 *
 * Keep the skills spelled exactly as a candidate would write them so the
 * deterministic matcher behaves realistically.
 */

export type ScoreGoldenFixture = {
  name: string;
  jobDescription: string;
  cvText: string;
};

export const SCORE_GOLDEN_FIXTURES: ScoreGoldenFixture[] = [
  {
    name: 'senior-fullstack-strong-match',
    jobDescription: `Senior Full-Stack Engineer (5+ years required).

We are looking for an engineer with strong TypeScript and React on the front end.
You must have solid Node.js experience and be proficient with PostgreSQL.
Experience with AWS and Docker is required. GraphQL and a testing culture with
Jest are essential. You will own CI/CD pipelines end to end.`,
    cvText: `Jane Doe — Senior Software Engineer, 7 years of experience.

Experience
- Built and shipped a customer portal in TypeScript and React, reducing load time.
- Designed Node.js services backed by PostgreSQL, handling high traffic.
- Deployed everything on AWS with Docker containers and GitHub Actions CI/CD.
- Exposed a GraphQL API and kept coverage high with Jest.

Skills: TypeScript, React, Node.js, PostgreSQL, AWS, Docker, GraphQL, Jest.`,
  },
  {
    name: 'backend-partial-match',
    jobDescription: `Backend Engineer.

Required: strong Python and Django, with solid PostgreSQL and Redis experience.
You must have Docker and Kubernetes in production. AWS and Terraform are
essential for our infrastructure. 4+ years required.`,
    cvText: `John Smith — Backend Developer, 4 years of experience.

Experience
- Built REST APIs in Python with Django, backed by PostgreSQL.
- Used Redis for caching and background job queues.
- Wrote unit and integration tests, mentored two juniors.

Skills: Python, Django, PostgreSQL, Redis, SQL.`,
  },
  {
    name: 'frontend-vs-backend-mismatch',
    jobDescription: `Platform Engineer.

Required: strong Golang and Kubernetes. You must have Terraform and Docker in
production, with PostgreSQL for persistence. 5+ years of backend experience is
essential.`,
    cvText: `Alex Martin — Front-End Developer, 3 years of experience.

Experience
- Built responsive interfaces in React and TypeScript.
- Styled components with CSS and HTML, prototyped in Figma.
- Improved accessibility and Core Web Vitals across the marketing site.

Skills: React, TypeScript, CSS, HTML, Figma.`,
  },
];
