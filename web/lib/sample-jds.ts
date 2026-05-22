export interface SampleRole {
  title: string;
  jd: string;
}

export interface SampleCategory {
  category: string;
  roles: SampleRole[];
}

export const SAMPLE_JDS: SampleCategory[] = [
  {
    category: "Engineering",
    roles: [
      {
        title: "Backend Engineer",
        jd: `We're looking for a Backend Engineer to build and maintain scalable, high-performance systems powering our core product.

Responsibilities:
- Design and own RESTful and gRPC APIs serving millions of requests per day
- Model and optimize PostgreSQL schemas; tune slow queries
- Build and maintain microservices in a distributed architecture
- Participate in on-call rotation and own incidents from detection to postmortem
- Drive technical design reviews and mentor junior engineers

Requirements:
- 3+ years of backend engineering experience
- Proficiency in Python, Go, or Node.js
- Strong understanding of SQL, indexing, and query optimization
- Experience with Docker, Kubernetes, and CI/CD pipelines (GitHub Actions, CircleCI)
- Familiarity with AWS or GCP (EC2, RDS, S3, Lambda)
- Experience with event-driven systems (Kafka, SQS) is a strong plus

We value ownership, production-grade thinking, and the ability to ship reliably at scale.`,
      },
      {
        title: "Frontend Engineer",
        jd: `We're hiring a Frontend Engineer to craft fast, accessible, and delightful user interfaces used by hundreds of thousands of people.

Responsibilities:
- Build and maintain React components with a focus on performance and accessibility
- Collaborate with designers to translate Figma mockups into pixel-perfect UIs
- Own frontend architecture decisions: state management, routing, bundling
- Write unit and integration tests; participate in code reviews
- Instrument key user flows with analytics and monitor Core Web Vitals (LCP, INP, CLS)

Requirements:
- 3+ years of frontend engineering experience
- Deep expertise in React and TypeScript
- Strong understanding of browser rendering, CSS, and performance budgets
- Experience with testing libraries (Jest, Playwright, Testing Library)
- Familiarity with Next.js or similar SSR frameworks
- Experience with design systems and component libraries is a plus

We care about craft: clean code, fast pages, and interfaces that feel effortless.`,
      },
      {
        title: "Full Stack Engineer",
        jd: `We're looking for a Full Stack Engineer who is equally comfortable shaping the frontend experience and designing robust backend systems.

Responsibilities:
- Build end-to-end features across a TypeScript/React frontend and Node.js/Python backend
- Design and evolve PostgreSQL schemas and REST APIs
- Own features from product spec to production deployment
- Write automated tests at every layer and participate in code reviews
- Collaborate with product and design on scope and technical trade-offs

Requirements:
- 3+ years of full-stack experience
- Strong proficiency in TypeScript, React, and Node.js or Python
- Experience with SQL databases and ORM frameworks (Prisma, SQLAlchemy)
- Familiarity with cloud infrastructure (AWS or GCP), Docker, and CI/CD
- Ability to work autonomously and make pragmatic technical decisions

You'll thrive here if you prefer owning outcomes over narrow specialization.`,
      },
      {
        title: "DevOps / Platform Engineer",
        jd: `We're looking for a Platform Engineer to build and operate the infrastructure that lets our engineering teams ship fast and safely.

Responsibilities:
- Design and manage Kubernetes clusters across AWS/GCP environments
- Build internal developer tooling: CI/CD pipelines, deployment automation, secrets management
- Define and enforce SLOs; own the on-call rotation and incident response process
- Implement observability stacks (Prometheus, Grafana, OpenTelemetry, PagerDuty)
- Harden infrastructure security: network policies, IAM, vulnerability scanning

Requirements:
- 3+ years of DevOps or platform engineering experience
- Strong Kubernetes expertise (CKAD/CKA a plus)
- Proficiency with Terraform or Pulumi for infrastructure as code
- Experience with GitHub Actions, ArgoCD, or similar CI/CD tooling
- Solid understanding of networking (VPC, TLS, DNS, load balancers)
- Scripting proficiency in Bash and Python

You'll be the person engineers rely on to make production boring — in the best way.`,
      },
      {
        title: "Data Engineer",
        jd: `We're hiring a Data Engineer to build the pipelines and infrastructure that power our analytics, ML models, and business intelligence.

Responsibilities:
- Design, build, and maintain scalable data pipelines (batch and streaming)
- Manage our data warehouse (Snowflake / BigQuery) and model data with dbt
- Collaborate with data scientists and analysts to ensure clean, reliable data
- Build real-time pipelines with Kafka or AWS Kinesis for event-driven use cases
- Monitor pipeline health and data quality; own SLAs end-to-end

Requirements:
- 3+ years of data engineering experience
- Strong SQL skills and experience with column-store warehouses (BigQuery, Snowflake, Redshift)
- Proficiency with Python and orchestration tools (Airflow, Prefect, or Dagster)
- Experience with dbt for data modeling and transformation
- Familiarity with streaming systems (Kafka, Flink, or Spark Streaming)
- Experience with data quality frameworks is a plus`,
      },
      {
        title: "ML / AI Engineer",
        jd: `We're looking for an ML Engineer to take models from research to production and build the systems that keep them running reliably at scale.

Responsibilities:
- Productionize ML models: packaging, serving, monitoring, and retraining pipelines
- Build feature engineering pipelines and maintain the feature store
- Design A/B testing infrastructure for model evaluation
- Collaborate with research scientists to translate experiments into deployable systems
- Monitor model performance and implement drift detection

Requirements:
- 3+ years of ML engineering experience
- Strong Python skills; proficiency with PyTorch or TensorFlow
- Experience with model serving (TorchServe, BentoML, Seldon, or custom FastAPI services)
- Familiarity with MLOps tooling: MLflow, Weights & Biases, or Kubeflow
- Experience with CI/CD for ML: automated retraining, evaluation gates, canary deploys
- Understanding of distributed training and GPU infrastructure is a plus`,
      },
      {
        title: "Mobile Engineer (iOS)",
        jd: `We're hiring an iOS Engineer to build a native experience used by millions of users worldwide.

Responsibilities:
- Build and ship high-quality iOS features using Swift and SwiftUI
- Own the full release cycle: development, testing, App Store submission, monitoring
- Collaborate with design to deliver polished, accessible interfaces
- Write unit and UI tests; maintain high crash-free rates
- Instrument key flows with analytics; track retention and engagement metrics

Requirements:
- 3+ years of iOS development experience
- Strong proficiency in Swift and SwiftUI (UIKit knowledge is a plus)
- Experience with modern concurrency (async/await, Combine)
- Familiarity with App Store review guidelines and release processes
- Experience with CI/CD for mobile (Fastlane, Xcode Cloud, or Bitrise)
- Published apps on the App Store with measurable user impact

We measure mobile quality in crash-free sessions and App Store ratings, not story points.`,
      },
      {
        title: "Security Engineer",
        jd: `We're looking for a Security Engineer to protect our systems, data, and customers as we scale.

Responsibilities:
- Conduct threat modeling and security reviews for new systems and features
- Lead vulnerability assessments and penetration testing; own the remediation lifecycle
- Build and maintain SIEM, WAF, and intrusion detection systems
- Drive SOC 2 Type II compliance and maintain security documentation
- Respond to security incidents and lead post-incident reviews
- Partner with engineering teams to embed security into the SDLC

Requirements:
- 3+ years of security engineering experience
- Strong understanding of OWASP Top 10 and common attack vectors
- Experience with cloud security (AWS or GCP IAM, VPC, Security Hub)
- Familiarity with SIEM platforms (Splunk, Datadog Security, or Elastic)
- Experience conducting or scoping penetration tests
- Knowledge of compliance frameworks (SOC 2, ISO 27001) is a strong plus`,
      },
    ],
  },
  {
    category: "Product & Design",
    roles: [
      {
        title: "Product Manager",
        jd: `We're hiring a Product Manager to own a core product surface and drive it from insight to shipped impact.

Responsibilities:
- Define and maintain the product roadmap for your area based on user research, data, and business goals
- Write clear, concise PRDs; partner closely with engineering and design throughout delivery
- Set and track success metrics; run A/B experiments to validate hypotheses
- Conduct user interviews, synthesize qualitative and quantitative signals into priorities
- Communicate roadmap and trade-offs clearly to stakeholders and leadership

Requirements:
- 3+ years of product management experience in a B2B or B2C SaaS environment
- Demonstrated ability to ship products that move key metrics
- Strong analytical skills; comfort with SQL and product analytics tools (Mixpanel, Amplitude, PostHog)
- Experience running A/B experiments and interpreting statistical results
- Excellent written and verbal communication; ability to influence without authority
- Technical background or experience working in engineering-led organizations is a strong plus`,
      },
      {
        title: "UX / Product Designer",
        jd: `We're looking for a Product Designer who can take complex problems and turn them into elegant, user-centered solutions.

Responsibilities:
- Own design end-to-end: discovery, wireframes, prototypes, and final specs
- Run user research (interviews, usability tests) to ground decisions in real behavior
- Collaborate daily with PMs and engineers; participate in sprint planning and reviews
- Maintain and evolve the design system; ensure consistency across the product
- Define interaction patterns and accessibility standards

Requirements:
- 3+ years of product design experience, ideally in a SaaS or tech environment
- Strong portfolio demonstrating end-to-end product thinking — not just visual polish
- Proficiency in Figma (components, auto-layout, prototyping)
- Experience running usability tests and synthesizing findings into design decisions
- Comfort with HTML/CSS fundamentals to communicate intent clearly to engineers
- Experience with motion design or data visualization is a plus`,
      },
    ],
  },
  {
    category: "Data & Analytics",
    roles: [
      {
        title: "Data Scientist",
        jd: `We're hiring a Data Scientist to turn raw data into insights, models, and decisions that drive product and business outcomes.

Responsibilities:
- Build predictive and recommendation models that power core product features
- Partner with product and engineering to define metrics and instrument new features
- Design and analyze A/B experiments; communicate results to non-technical stakeholders
- Develop dashboards and automated reports for leadership
- Identify patterns in user behavior and translate them into product opportunities

Requirements:
- 3+ years of data science experience in a product-led environment
- Strong statistical foundation: hypothesis testing, regression, Bayesian methods
- Proficiency in Python (pandas, scikit-learn, statsmodels) and SQL
- Experience with ML frameworks (XGBoost, LightGBM, PyTorch) and MLflow
- Ability to communicate findings clearly to both technical and non-technical audiences
- Experience with causal inference or uplift modeling is a strong plus`,
      },
      {
        title: "Data Analyst",
        jd: `We're looking for a Data Analyst to help us understand our users, measure our impact, and inform our most important decisions.

Responsibilities:
- Build and maintain dashboards and reports used by leadership and product teams
- Define and track key metrics (acquisition, engagement, retention, revenue)
- Conduct ad-hoc analysis to answer strategic business questions
- Partner with data engineers to ensure data quality and model reliability
- Present findings and recommendations to cross-functional stakeholders

Requirements:
- 2+ years of data analysis experience
- Advanced SQL skills; experience with data warehouses (BigQuery, Snowflake, or Redshift)
- Proficiency with BI tools (Looker, Metabase, Tableau, or Mode)
- Solid understanding of product analytics and funnel analysis
- Experience with Python (pandas) for more complex data manipulation
- Strong communication skills: ability to turn data into a clear narrative`,
      },
    ],
  },
  {
    category: "Management",
    roles: [
      {
        title: "Engineering Manager",
        jd: `We're looking for an Engineering Manager to lead a team of 5–8 engineers and drive high-quality, high-velocity delivery across a core product area.

Responsibilities:
- Manage, mentor, and grow a team of engineers through 1:1s, performance reviews, and career development conversations
- Partner with product and design to define quarterly goals; own delivery against those commitments
- Drive engineering excellence: code quality, testing discipline, incident management, and on-call health
- Lead hiring: define roles, run structured interviews, and close candidates
- Remove blockers, manage stakeholders, and create the conditions for the team to do their best work

Requirements:
- 2+ years of engineering management experience, with a track record of growing engineers
- Strong technical background: ability to participate in architecture discussions and code reviews
- Experience managing delivery across multiple concurrent workstreams
- Demonstrated ability to hire and retain strong engineers
- Clear, direct communicator who can translate between business priorities and engineering realities`,
      },
    ],
  },
];
