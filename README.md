<div align="center">
  <img src="web/public/RejectCheck.png" alt="RejectCheck" width="180" />
  <h1>RejectCheck</h1>
  <p>Find out why your job application got rejected, before it does.</p>
</div>

---

## Why RejectCheck?

Most CV tools tell you to "add more keywords" or "use action verbs." That's not help, that's noise.

RejectCheck was built around a different premise: a rejection isn't just a formatting problem, it's a signal that there's a gap between who you are on paper and who the job requires. The goal isn't to dress up your CV — it's to close that gap for real.

Where other tools stop at feedback, RejectCheck goes further. It tells you what skills you're missing, then gives you a concrete plan to actually build them: project ideas with specs, CV rewrites, and time estimates. And if you want to stress-test your application before the real thing, the AI Interview puts you through a live voice interview tailored to the specific job — questions adapted to your gaps, your profile, and the JD's expectations.

The target user is a developer who wants to be the right candidate, not just look like one.

---

## Features

### Analysis

- **Rejection risk score** — 0–100 score with a Low / Medium / High verdict and confidence rating
- **ATS simulation** — keyword coverage check with a pass/fail result and a list of critical gaps
- **Seniority analysis** — compares expected vs. detected seniority, flags experience gaps
- **CV tone audit** — detects passive language and identifies weak bullet points
- **GitHub audit** — assesses code quality and project signal strength (optional)
- **LinkedIn audit** — checks alignment between your profile and the job description (optional)
- **Red flag detection** — employment gaps, short tenures, vague titles, skills without evidence
- **Skill gap radar** — visual breakdown of technical gap across primary and secondary skills
- **Roadmap** — numbered fix steps with before/after examples, project ideas, and time estimates
- **Project recommendation** — a concrete portfolio project spec tailored to the target role

### Premium

- **CV rewrite** *(Improve CV tab)* — AI rewrites your CV based on detected issues: injects missing keywords, fixes tone, adds seniority signals. Exportable as PDF.
- **AI Interview** *(AI Interview tab)* — 10-minute voice interview simulated by AI, tailored to the job. Questions are generated from your analysis — skill gaps, red flags, JD expectations. Turn-based: the AI speaks and listens, detects when you finish, and asks follow-ups when answers are vague. After the interview: a full performance report with axis scores (communication, technical relevance, composure, etc.), per-question feedback, key strengths and improvements. Retry with new questions anytime, with attempt history tracked.

### Account

- **Analysis history** — all past analyses saved and accessible from `/account`
- **Interview history** — past AI interview attempts listed with scores, accessible from `/account`, one click to open the analysis with the interview pre-selected

---

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Backend | NestJS 11, TypeScript, Zod, Prisma, PostgreSQL (Supabase) |
| AI | OpenAI GPT-4o (ATS, CV audit), Anthropic Claude Sonnet (technical analysis, interview evaluation) |
| Voice | OpenAI Whisper (STT), OpenAI TTS, GPT-4o-mini (conversation logic) |
| Payments | Stripe (subscriptions, webhooks) |
| Auth | Supabase Auth |

## Architecture

```
Browser (port 3000)
    └── Next.js frontend
            └── NestJS backend (port 8888)
                    ├── POST /api/analyze          — streaming CV analysis (SSE)
                    ├── POST /api/analyze/rewrite   — AI CV rewrite (premium)
                    ├── POST /api/interview/start   — generate interview questions + TTS
                    ├── POST /api/interview/answer  — Whisper transcription + next question
                    ├── POST /api/interview/complete — Claude post-interview analysis
                    ├── GET  /api/interview/history  — past attempts
                    ├── Stripe webhooks
                    └── Supabase PostgreSQL
```

## Status

Core analysis pipeline, CV rewrite, and AI Interview are all functional end-to-end. Ongoing work is focused on refining AI output quality and expanding the interview evaluation depth.
