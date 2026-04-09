<div align="center">
  <img src="web/public/RejectCheck.png" alt="RejectCheck" width="180" />
  <h1>RejectCheck</h1>
  <p>Find out why your job application got rejected, before it does.</p>
</div>

---

## Why RejectCheck?

Most CV tools tell you to "add more keywords" or "use action verbs." That's not help, that's noise.

RejectCheck was built around a different premise: a rejection isn't just a formatting problem, it's a signal that there's a gap between who you are on paper and who the job requires. The goal isn't to dress up your CV — it's to close that gap for real.

Where other tools stop at feedback, RejectCheck goes further. It tells you what skills you're missing, then gives you a concrete plan to actually build them: project ideas with specs, bullet point rewrites, open source contribution suggestions, and time estimates. You leave with a roadmap, not a checklist.

The target user is a developer who wants to be the right candidate, not just look like one.

---

RejectCheck is an AI-powered tool that analyzes your CV against a job description and tells you, bluntly, where you fall short. It simulates an ATS pass, evaluates your seniority signals, audits your GitHub and LinkedIn presence, and gives you a step-by-step plan to fix what's broken.

## Features

- 🎯 **Rejection risk score** — 0–100 score with a Low / Medium / High verdict and confidence rating
- **ATS simulation** — keyword coverage check with a pass/fail result and a list of critical gaps
- **Seniority analysis** — compares expected vs. detected seniority, flags experience gaps
- **CV tone audit** — detects passive language and rewrites weak bullet points
- 🐙 **GitHub audit** — assesses code quality and project signal strength (optional)
- **LinkedIn audit** — checks alignment between your profile and the job description (optional)
- 🚩 **Red flag detection** — employment gaps, short tenures, vague titles, skills without evidence
- 🗺️ **Actionable fix plan** — numbered steps with before/after rewrites, project ideas, time estimates, and severity levels

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Backend | NestJS 11, TypeScript, OpenAI GPT-4o-mini, Zod, PDF-parse |
| Shared types | OpenAPI spec generated from backend, consumed by frontend |

## Architecture

```
Browser (port 3000)
    └── Next.js frontend
            └── POST /api/analyze
                    └── NestJS backend (port 8888)
                            ├── PDF parsing
                            ├── GitHub API
                            └── OpenAI GPT-4o-mini
```

## Status

This is a work-in-progress personal project. The core analysis pipeline is functional, CV upload, ATS simulation, seniority scoring, GitHub/LinkedIn auditing, and fix plan generation are all working end-to-end. Ongoing work is focused on refining the AI output quality and building out the frontend experience.