"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { setPendingCv } from "../../../lib/pending-cv";
import { SAMPLE_JDS } from "../../../lib/sample-jds";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { Navbar } from "../../components/Navbar";
import { FadeInSection, useInView, useCountUp } from "../../components/FadeInSection";
import { useLanguage } from "../../../context/language";
import {
  JsonLd,
  softwareApplicationSchema,
  faqPageSchema,
} from "../../components/JsonLd";

/* ─── Inline SVG icons ────────────────────────────────────────────── */
const IconArrow = ({ size = 12, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none">
    <path d="M2 7h10M7.5 3l4 4-4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconCheck = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 12 9 17 20 6" />
  </svg>
);
const IconX = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);
const IconGitHub = ({ size = 28 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);
const IconLinkedIn = ({ size = 28 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

/* ─── Highlight helper: wraps {hl}…{/hl} as bold red span ─────────── */
function hl(text: string) {
  const m = text.match(/^([\s\S]*?)\{hl\}([\s\S]*?)\{\/hl\}([\s\S]*)$/);
  if (!m) return <>{text}</>;
  return <>{m[1]}<span className="em" style={{ color: "var(--rc-red)", fontWeight: 700 }}>{m[2]}</span>{m[3]}</>;
}

/* ─── Section header — magazine-style with stagger ────────────────── */
function SecHead({
  num,
  eyebrow,
  lead,
  children,
}: {
  num: string;
  eyebrow: string;
  lead?: string;
  children: React.ReactNode;
}) {
  const [r, seen] = useInView(0.18);
  return (
    <div ref={r} className="sec__head">
      <div className="sec__num">{num}</div>
      <div>
        <div className={"rise " + (seen ? "in" : "")}>
          <div className="sec__eye">{eyebrow}</div>
        </div>
        <h2 className={"sec__h rise d1 " + (seen ? "in" : "")}>{children}</h2>
        {lead && <p className={"sec__lead rise d2 " + (seen ? "in" : "")}>{lead}</p>}
      </div>
    </div>
  );
}

/* ─── Diagnosis radar + flags (sample data) ───────────────────────── */
const SAMPLE_SKILLS = [
  { name: "TypeScript",          have: 90, need: 80, ok: true  },
  { name: "Distributed systems", have: 35, need: 85, ok: false },
  { name: "Kubernetes",          have: 45, need: 90, ok: false },
  { name: "PostgreSQL",          have: 75, need: 70, ok: true  },
  { name: "Event-driven arch.",  have: 20, need: 80, ok: false },
];

const INTERVIEW_AXES = [
  { name: "Specificity",   v: 8.1 },
  { name: "Tech depth",    v: 7.4 },
  { name: "Communication", v: 6.8 },
];

/* ─── Feature tab showcase data ───────────────────────────────────────── */
const TRACKER_JOBS = [
  { company: "Stripe",    role: "Backend Engineer",    status: "applied",   date: "May 19" },
  { company: "Linear",    role: "Frontend Engineer",   status: "screen",    date: "May 17" },
  { company: "Vercel",    role: "Staff Engineer",      status: "applied",   date: "May 15" },
  { company: "Anthropic", role: "ML Engineer",         status: "offer",     date: "May 10" },
  { company: "GitHub",    role: "DevOps Engineer",     status: "applied",   date: "May 14" },
  { company: "Notion",    role: "Senior Engineer",     status: "screen",    date: "May 12" },
  { company: "Loom",      role: "Backend Engineer",    status: "interview", date: "May 11" },
  { company: "Figma",     role: "Full Stack Engineer", status: "rejected",  date: "May 08" },
];

const FEATURE_TABS = [
  {
    id: "report",
    label: "Rejection Report",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
  { id: "linkedin",  label: "LinkedIn Optimization", icon: <IconLinkedIn size={15} /> },
  { id: "github",    label: "GitHub Optimization",   icon: <IconGitHub size={15} /> },
  {
    id: "tracker",
    label: "Job Tracker",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  {
    id: "cv",
    label: "CV & Cover Letter",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
    ),
  },
  {
    id: "interview",
    label: "AI Interview",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
  },
];

/* ─── Hero qcard scenarios — fictional sample reports ─────────────── */
type FbMark = "x" | "warn" | "ok";
const SCENARIOS: {
  rc: string; name: string; role: string; pct: number;
  feedback: { mark: FbMark; text: string }[];
}[] = [
  /* Excellent fit — low rejection probability */
  {
    rc: "RC-9024", name: "Sofia Reyes", role: "security engineer", pct: 12,
    feedback: [
      { mark: "ok",   text: "3 published CVE writeups with reproduction steps" },
      { mark: "ok",   text: "SOC2 Type II program ownership documented" },
      { mark: "ok",   text: "Threat modeling integrated in design narrative" },
    ],
  },
  {
    rc: "RC-1856", name: "Ben Schwartz", role: "staff engineer", pct: 23,
    feedback: [
      { mark: "ok",   text: "Cross-team scope clearly demonstrated" },
      { mark: "ok",   text: "4 RFCs and 2 ADRs linked from CV" },
      { mark: "warn", text: "Hiring contributions could be stronger" },
    ],
  },
  /* Borderline — medium rejection */
  {
    rc: "RC-6088", name: "Marie Chen", role: "data engineer", pct: 38,
    feedback: [
      { mark: "ok",   text: "Pipelines documented with scale (12k rows/sec)" },
      { mark: "warn", text: "Streaming experience could be deeper" },
      { mark: "warn", text: "SQL strong, warehouse work light" },
    ],
  },
  {
    rc: "RC-5114", name: "Tom Bauer", role: "fullstack", pct: 51,
    feedback: [
      { mark: "warn", text: "Mid-level title, JD asks for senior scope" },
      { mark: "warn", text: "No system design artifact in repo" },
      { mark: "ok",   text: "Strong test coverage signal" },
    ],
  },
  {
    rc: "RC-3902", name: "Priya Iyer", role: "frontend engineer", pct: 64,
    feedback: [
      { mark: "x",    text: "Frontend perf metrics absent (LCP, INP)" },
      { mark: "x",    text: "Pinned repos are toys, not products" },
      { mark: "warn", text: "Stack mismatch: Tailwind-only vs JD's CSS-in-JS" },
    ],
  },
  /* High rejection — multiple critical gaps */
  {
    rc: "RC-3527", name: "Diego Ramos", role: "iOS engineer", pct: 76,
    feedback: [
      { mark: "x",    text: "SwiftUI claims, no public App Store app" },
      { mark: "x",    text: "No release metrics (downloads, ratings)" },
      { mark: "warn", text: "Missing modern concurrency (async/await)" },
    ],
  },
  {
    rc: "RC-4821", name: "Alex Morales", role: "senior backend", pct: 84,
    feedback: [
      { mark: "x", text: "Distributed systems claims with no prod evidence" },
      { mark: "x", text: "No quantified impact on any bullet" },
      { mark: "x", text: "Two-column layout broke ATS parser" },
    ],
  },
  {
    rc: "RC-7251", name: "Hana Yamada", role: "ML engineer", pct: 89,
    feedback: [
      { mark: "x", text: "Notebooks listed, no production pipelines" },
      { mark: "x", text: "No model deployment or serving experience" },
      { mark: "x", text: "MLOps signals absent (CI, monitoring, drift)" },
    ],
  },
  {
    rc: "RC-2647", name: "Jules Lambert", role: "DevOps engineer", pct: 93,
    feedback: [
      { mark: "x", text: "No prod incident stories or postmortems" },
      { mark: "x", text: "Certs listed without ownership context" },
      { mark: "x", text: "Vague Terraform claims, no module reuse" },
    ],
  },
  {
    rc: "RC-5740", name: "Kareem Ali", role: "engineering manager", pct: 96,
    feedback: [
      { mark: "x", text: "IC bullets dominate, manager scope absent" },
      { mark: "x", text: "Zero headcount, hiring, or perf-cycle metrics" },
      { mark: "x", text: "Tone reads as senior IC, not manager" },
    ],
  },
];

const FB_GLYPH: Record<FbMark, string> = { x: "✗", warn: "!", ok: "✓" };
const tierFor = (pct: number) => (pct < 35 ? "good" : pct < 65 ? "warn" : "bad");

/* ─── Tab placeholder content ─────────────────────────────────────── */
type Mc = {
  radar: { atsWouldNotPass: string; redFlagItems: string[] };
  github: { issues: { severity: string; label: string; detail: string }[] };
  linkedin: { issues: { severity: string; label: string; detail: string }[] };
  rewriteCard: { beforeText: string; afterText: string };
  interviewCard: { aiQuestion: string; aiLabel: string };
};

const RADAR_DATA = SAMPLE_SKILLS.map((s) => ({
  skill: s.name.replace(" arch.", ""),
  you: s.have,
  target: s.need,
}));

function renderTab(id: string, mc: Mc) {
  switch (id) {
    case "Skill":
      return (
        <>
          <div className="fp-radar">
            <div className="fp-radar__chart">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={RADAR_DATA} outerRadius="78%">
                  <PolarGrid stroke="#d4cfc9" strokeWidth={0.75} />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: "#6b6860", fontFamily: "var(--font-sans)" }} />
                  <Radar
                    name="Target"
                    dataKey="target"
                    stroke="#94a3b8"
                    fill="rgba(100,116,139,0.08)"
                    strokeWidth={1.25}
                    strokeDasharray="4 3"
                    isAnimationActive
                    animationDuration={900}
                  />
                  <Radar
                    name="You"
                    dataKey="you"
                    stroke="#C93A39"
                    fill="rgba(201,58,57,0.14)"
                    strokeWidth={1.6}
                    isAnimationActive
                    animationDuration={1200}
                    animationBegin={200}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="fp-radar__legend">
              {SAMPLE_SKILLS.map((s) => (
                <div key={s.name} className="fp-radar__legend-item">
                  <i style={{ background: s.ok ? "var(--rc-green)" : "var(--rc-red)" }} />
                  <span>{s.name}</span>
                  <span className="v" style={{ color: s.ok ? "var(--rc-green)" : "var(--rc-red)" }}>
                    {s.have}/{s.need}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="fp-analysis">
            Strong on <span className="em">TypeScript</span> and <span className="em">PostgreSQL</span>.
            <span className="num"> 3 critical gaps</span> on distributed systems, Kubernetes, and event-driven arch — the senior backbone this JD requires.
          </div>
        </>
      );

    case "ATS":
      return (
        <>
          <div className="frame__grid">
            <div className="frame-card bad">
              <div className="lab">ATS Filter</div>
              <div className="num">34<small>/100</small></div>
              <div className="verd">{mc.radar.atsWouldNotPass}</div>
            </div>
            <div className="frame-card good">
              <div className="lab">Skill match</div>
              <div className="num">82<small>/100</small></div>
              <div className="verd">✓ Strong fit on stack</div>
            </div>
          </div>
          <div className="fp-analysis">
            <span className="num">34/100</span> means the bot drops this CV before any human sees it. Injecting the
            <span className="em"> 3 missing keywords</span> (<span className="num">docker</span>, <span className="num">k8s</span>, <span className="num">microservices</span>) lifts the score above the <span className="num">67%</span> pass-line.
          </div>
        </>
      );

    case "CV":
      return (
        <>
          <div className="fp-rows">
            {[
              { title: "Passive bullets", sub: "5 detected · rewrite for impact", sev: "major", count: "5" },
              { title: "Vague seniority", sub: "no scope or ownership signals", sev: "crit",  count: "2" },
              { title: "Missing impact metrics", sub: "no quantified outcomes",  sev: "major", count: "4" },
            ].map((r) => (
              <div key={r.title} className="fp-row">
                <div>
                  <div className="fp-row__title">{r.title}</div>
                  <div className="fp-row__sub">{r.sub}</div>
                </div>
                <span className={"fp-row__pill " + r.sev}>{r.count}</span>
              </div>
            ))}
          </div>
          <div className="fp-analysis">
            Passive voice + missing metrics are the dominant patterns. Rewriting these <span className="num">11 lines</span> would lift the seniority signal by <span className="em">~28%</span> — and stop recruiters from skimming past the third bullet.
          </div>
        </>
      );

    case "Sig":
      return (
        <>
          <div className="fp-stat-grid">
            <div className="fp-stat">
              <div className="fp-stat__head">
                <IconGitHub size={18} />
                <span className="fp-stat__name">GitHub signal</span>
              </div>
              <div className="fp-stat__num warn">72%</div>
              <p className="fp-stat__caption">Active contributor — but pinned repos lack documentation.</p>
            </div>
            <div className="fp-stat">
              <div className="fp-stat__head">
                <IconLinkedIn size={18} />
                <span className="fp-stat__name">LinkedIn signal</span>
              </div>
              <div className="fp-stat__num bad">58%</div>
              <p className="fp-stat__caption">Profile reads competent but generic — summary missing.</p>
            </div>
          </div>
          <div className="fp-analysis">
            GitHub looks alive but unpolished — recruiters open the top pinned repo and bounce. LinkedIn lacks the <span className="em">social proof</span> they scan first: <span className="num">one</span> peer recommendation moves you above 75% of applicants in this band.
          </div>
        </>
      );

    case "Flag":
      return (
        <>
          <div className="fp-rows">
            {[
              { title: "Skills without evidence", sub: "claims expertise · no project, talk, or repo backs it", sev: "crit",  label: "Critical" },
              { title: "Employment gap (8 mo)",   sub: "Apr 2023 → Dec 2023 unaccounted for",                     sev: "major", label: "Major" },
              { title: "Title doesn't match seniority", sub: "listed III · JD asks staff scope",                  sev: "minor", label: "Minor" },
            ].map((r) => (
              <div key={r.title} className="fp-row">
                <div>
                  <div className="fp-row__title">{r.title}</div>
                  <div className="fp-row__sub">{r.sub}</div>
                </div>
                <span className={"fp-row__pill " + r.sev}>{r.label}</span>
              </div>
            ))}
          </div>
          <div className="fp-analysis">
            <span className="num">1 critical flag</span> (skill claims unbacked) is the binary blocker — address that first. Major and minor flags rarely get a CV rejected on their own, but they compound a recruiter&apos;s <span className="em">overall reading</span> of seniority.
          </div>
        </>
      );

    case "Road":
      return (
        <>
          <div className="fp-roadmap">
            {[
              { t: "Inject 4 missing keywords",   state: "done", lab: "✓ Done" },
              { t: "Quantify 3 vague bullets",    state: "done", lab: "✓ Done" },
              { t: "Rewrite 5 passive sentences", state: "now",  lab: "→ Now" },
              { t: "Add seniority scope signals", state: "todo", lab: "○ Next" },
            ].map((s, i) => (
              <div key={i} className={"fp-roadmap__item " + s.state}>
                <span className={"fp-roadmap__check " + s.state}>{i + 1}</span>
                <span className="fp-roadmap__t">{s.t}</span>
                <span className="fp-roadmap__lab">{s.lab}</span>
              </div>
            ))}
          </div>
          <div className="fp-analysis">
            <span className="num">2 of 4</span> actions completed in <span className="num">~50min</span>. Keyword injection alone moved ATS score from <span className="num">26 → 41</span>. Estimated <span className="em">~4h remaining</span> to clear the pass-line and ship.
          </div>
        </>
      );

    case "Imp":
      return (
        <>
          <div className="fp-rewrite">
            <div className="fp-rewrite__col before">
              <div className="fp-rewrite__lab">Before</div>
              <p className="fp-rewrite__t">{mc.rewriteCard.beforeText}</p>
            </div>
            <div className="fp-rewrite__col after">
              <div className="fp-rewrite__lab">After · matches JD</div>
              <p className="fp-rewrite__t">
                <strong>Shipped</strong> 4 microservices · 12k req/min · −38% p99 latency.
              </p>
            </div>
          </div>
          <div className="fp-analysis">
            Surgical rewrites preserve your voice — <span className="em">14 bullets restructured</span>, all keywords from the JD injected naturally. <span className="num">No keyword dumping</span>, no fabrication. Every change traces to a flagged issue.
          </div>
        </>
      );

    case "AI":
      return (
        <>
          <div className="fp-interview">
            <div className="fp-interview__bub">
              <span className="who">{mc.interviewCard.aiLabel} · Round 1</span>
              {mc.interviewCard.aiQuestion}
            </div>
            <div className="fp-interview__axes">
              {INTERVIEW_AXES.map((a) => (
                <div key={a.name} className="fp-interview__ax">
                  <span className="name">{a.name}</span>
                  <span className="v">{a.v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="fp-analysis">
            Average <span className="num">7.4/10</span> across 6 questions. Strongest on <span className="em">tech depth (8.1)</span>, weakest on communication clarity (<span className="num">6.8</span>). Practice STAR-format answers — concrete situations beat abstract reasoning every time.
          </div>
        </>
      );

    default:
      return null;
  }
}

/* ─── Feature tab preview renderer ───────────────────────────────────── */
function renderFeaturePreview(id: string) {
  switch (id) {
    case "report":
      return (
        <div className="ftv-report">
          <div className="ftv-report__metrics">
            {[
              { label: "Match Score", val: "82", unit: "/100",  cls: "ok" },
              { label: "ATS Filter",  val: "34", unit: "/100",  cls: "bad" },
              { label: "Skill Gaps",  val: "3",  unit: " found", cls: "bad" },
              { label: "Red Flags",   val: "2",  unit: " found", cls: "warn" },
            ].map((m) => (
              <div key={m.label} className={"ftv-metric " + m.cls}>
                <div className="ftv-metric__lab">{m.label}</div>
                <div className="ftv-metric__val">{m.val}<span>{m.unit}</span></div>
              </div>
            ))}
          </div>
          <div className="ftv-report__skills">
            {SAMPLE_SKILLS.slice(0, 4).map((s) => (
              <div key={s.name} className="ftv-skill">
                <div className="ftv-skill__name">{s.name}</div>
                <div className="ftv-skill__bar">
                  <i style={{ width: s.have + "%", background: s.ok ? "var(--rc-green)" : "var(--rc-red)" }} />
                  <div className="ftv-skill__need" style={{ left: s.need + "%" }} />
                </div>
                <span className={"ftv-skill__val " + (s.ok ? "ok" : "bad")}>{s.have}/{s.need}</span>
              </div>
            ))}
          </div>
          <div className="ftv-insight">
            ATS filter drops this CV before any recruiter reads it — fix <strong>3 missing keywords</strong> to cross the 67% pass-line.
          </div>
        </div>
      );

    case "linkedin":
      return (
        <div className="ftv-linkedin">
          <div className="ftv-linkedin__score">
            <div className="ftv-score-ring warn">58%</div>
            <div>
              <div className="ftv-linkedin__name">LinkedIn Profile</div>
              <div className="ftv-linkedin__verdict warn">Mixed signal — needs work before applying</div>
            </div>
          </div>
          <div className="ftv-rows-mini">
            {[
              { sev: "crit",  title: "No About summary",            sub: "Recruiters check this first — yours is empty" },
              { sev: "major", title: "Generic headline",             sub: '"Software Engineer" — no stack, no seniority signal' },
              { sev: "major", title: "Zero recommendations",         sub: "One peer endorsement moves you above 75% of applicants" },
              { sev: "minor", title: "Skills section underutilized", sub: "12 skills vs. 40+ in the JD — keyword gap visible to ATS" },
            ].map((r) => (
              <div key={r.title} className="ftv-row">
                <span className={"ftv-sev " + r.sev}>{r.sev === "crit" ? "Critical" : r.sev === "major" ? "Major" : "Minor"}</span>
                <div>
                  <div className="ftv-row__title">{r.title}</div>
                  <div className="ftv-row__sub">{r.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case "github":
      return (
        <div className="ftv-github">
          <div className="ftv-github__score">
            <div className="ftv-score-ring warn">72%</div>
            <div>
              <div className="ftv-linkedin__name">GitHub Profile</div>
              <div className="ftv-linkedin__verdict warn">Active contributor — but unpolished</div>
            </div>
          </div>
          <div className="ftv-github__stats">
            {[
              { n: "42", l: "Repos",  cls: "ok" },
              { n: "3",  l: "CI/CD",  cls: "warn" },
              { n: "1",  l: "Tests",  cls: "bad" },
              { n: "7",  l: "Stars",  cls: "ok" },
            ].map((s) => (
              <div key={s.l} className={"ftv-gstat " + s.cls}>
                <div className="n">{s.n}</div>
                <div className="l">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="ftv-rows-mini">
            {[
              { sev: "crit",  title: "Pinned repos lack documentation", sub: "Recruiters open the top repo — no README, no demo → they bounce in 10s" },
              { sev: "major", title: "Only 1 repo has tests",           sub: "Production engineers write tests — this signal is weak to engineering teams" },
              { sev: "major", title: "3 of 42 repos have CI",           sub: "Add GitHub Actions badges to your top 3 pinned repos before applying" },
            ].map((r) => (
              <div key={r.title} className="ftv-row">
                <span className={"ftv-sev " + r.sev}>{r.sev === "crit" ? "Critical" : "Major"}</span>
                <div>
                  <div className="ftv-row__title">{r.title}</div>
                  <div className="ftv-row__sub">{r.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case "tracker":
      return (
        <div className="ftv-tracker">
          {[
            { label: "Applied",   cls: "applied",   statuses: ["applied"] },
            { label: "Screening", cls: "screen",    statuses: ["screen"] },
            { label: "Interview", cls: "interview", statuses: ["interview"] },
            { label: "Offer",     cls: "offer",     statuses: ["offer"] },
            { label: "Rejected",  cls: "rejected",  statuses: ["rejected"] },
          ].map((col) => {
            const jobs = TRACKER_JOBS.filter((j) => col.statuses.includes(j.status));
            return (
              <div key={col.label} className="ftv-col">
                <div className={"ftv-col__head " + col.cls}>
                  <span>{col.label}</span>
                  <span className="n">{jobs.length}</span>
                </div>
                {jobs.slice(0, 2).map((j) => (
                  <div key={j.company} className={"ftv-job " + col.cls}>
                    <div className="ftv-job__co">{j.company}</div>
                    <div className="ftv-job__role">{j.role}</div>
                    <div className="ftv-job__date">{j.date}</div>
                  </div>
                ))}
                {jobs.length > 2 && (
                  <div className="ftv-job__more">+{jobs.length - 2} more</div>
                )}
              </div>
            );
          })}
        </div>
      );

    case "cv":
      return (
        <div className="ftv-cv">
          <div className="ftv-cv__rewrite">
            <div className="ftv-cv__col before">
              <div className="ftv-cv__lab">Before</div>
              <p>Worked on backend systems and helped with API development. Contributed to team projects and participated in code reviews.</p>
            </div>
            <div className="ftv-cv__col after">
              <div className="ftv-cv__lab">After · matched to JD</div>
              <p><strong>Shipped</strong> 4 gRPC microservices handling 12k req/min. Reduced p99 latency 38% via query optimization and Redis caching. Mentored 3 junior engineers across 2 sprint cycles.</p>
            </div>
          </div>
          <div className="ftv-cv__letter">
            <div className="ftv-cv__letter-lab">Cover Letter · Generated</div>
            <div className="ftv-cv__letter-body">
              <p>Dear Hiring Team,</p>
              <p>I&apos;m applying for the Senior Backend Engineer role at Stripe. In my last position I scaled our payment processing service from 2k to 50k transactions per minute — exactly the kind of infrastructure challenge I understand your team is navigating now.</p>
              <p>What draws me to this role is the intersection of high-throughput systems and developer experience that Stripe uniquely sits at...</p>
              <div className="ftv-cv__letter-fade" />
            </div>
          </div>
        </div>
      );

    case "interview":
      return (
        <div className="ftv-interview">
          <div className="ftv-interview__round">Round 1 · Technical Screen</div>
          <div className="ftv-interview__chat">
            <div className="ftv-interview__q">
              <span className="who">Interviewer · Senior Engineer</span>
              Walk me through how you&apos;d design a distributed rate limiter across 50 nodes with sub-millisecond overhead. How do you handle clock skew?
            </div>
            <div className="ftv-interview__a">
              <span className="who">You</span>
              I&apos;d use a sliding window approach with Redis Lua scripts for atomicity — the script increments the counter and checks the limit in a single round trip, avoiding race conditions entirely...
            </div>
          </div>
          <div className="ftv-interview__scores">
            {[
              { name: "Specificity", val: 8.1, cls: "ok" },
              { name: "Tech depth",  val: 7.4, cls: "ok" },
              { name: "Structure",   val: 6.2, cls: "warn" },
              { name: "Clarity",     val: 5.8, cls: "warn" },
            ].map((s) => (
              <div key={s.name} className="ftv-score">
                <span className="name">{s.name}</span>
                <div className="bar"><i className={s.cls} style={{ width: s.val * 10 + "%" }} /></div>
                <span className={"val " + s.cls}>{s.val}</span>
              </div>
            ))}
          </div>
          <div className="ftv-insight">
            Average <strong>6.9/10</strong> across 6 questions — strongest on tech depth, weakest on structure. Practice STAR-format answers for system design questions.
          </div>
        </div>
      );

    default:
      return null;
  }
}

/* ─── Landing ─────────────────────────────────────────────────────── */
export default function Home() {
  const { t, locale, localePath } = useLanguage();
  const mc = t.landing.mockContent;

  /* hero upload widget */
  const router = useRouter();
  const [heroStep, setHeroStep] = useState<1 | 2>(1);
  const [heroCvFile, setHeroCvFile] = useState<File | null>(null);
  const [heroJd, setHeroJd] = useState("");
  const [heroDragging, setHeroDragging] = useState(false);
  const heroFileRef = useRef<HTMLInputElement>(null);

  function handleHeroDrop(e: React.DragEvent) {
    e.preventDefault();
    setHeroDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) { setHeroCvFile(file); setHeroStep(2); }
  }
  function handleHeroFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) { setHeroCvFile(file); setHeroStep(2); }
  }
  function handleHeroSubmit() {
    if (!heroCvFile) return;
    setPendingCv(heroCvFile, heroJd);
    router.push(localePath("/analyze"));
  }

  /* total analyses counter */
  const [totalAnalyses, setTotalAnalyses] = useState(0);
  const [statsRun, setStatsRun] = useState(false);
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.rejectcheck.com";
    fetch(`${apiUrl}/api/stats`)
      .then((r) => r.json())
      .then((d) => {
        if (typeof d?.totalAnalyses === "number") {
          setTotalAnalyses(d.totalAnalyses);
          setStatsRun(true);
        }
      })
      .catch(() => {});
  }, []);
  const animatedTotal = useCountUp(totalAnalyses, statsRun, 2000);

  /* preview tabs */
  const [activeTab, setActiveTab] = useState("ATS");
  const tabs = [
    { id: "Skill", name: t.tabs.skillGap },
    { id: "ATS",   name: t.tabs.atsFilter,   count: "34", cls: "crit" as const },
    { id: "CV",    name: t.tabs.cvAnalysis,  count: "7",  cls: "warn" as const },
    { id: "Sig",   name: t.tabs.signals },
    { id: "Flag",  name: t.tabs.redFlags,    count: "3",  cls: "crit" as const },
    { id: "Road",  name: t.tabs.roadmap },
    { id: "Imp",   name: `${t.tabs.improveCv} ✦`,    cls: "prem" as const },
    { id: "AI",    name: `${t.tabs.aiInterview} ✦`,  cls: "prem" as const },
  ];

  /* feature tab showcase */
  const [activeFeatureTab, setActiveFeatureTab] = useState("report");

  /* diagnosis + signals + bridge inView refs */
  const [diagRadarRef, diagRadarIn] = useInView(0.18);
  const [diagFlagsRef, diagFlagsIn] = useInView(0.18);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <JsonLd id="ld-software-app" data={softwareApplicationSchema(locale)} />
      <JsonLd id="ld-faq" data={faqPageSchema(t.faq.items)} />
      <Navbar />

      {/* ═══ HERO SPLIT ════════════════════════════════════════════════════ */}
      <section className="hero hero--split">
        <div className="hero__rule" />
        <div className="hero__grain" />
        <div className="rc-wrap hero__inner">
          <div className="split">
            <div className="split__l">
              <div className="hero__eyebrow"><span className="pulse" />{t.landing.badge}</div>
              <h1 className="hero__h">
                {t.landing.hero.title}
                <span className="second">{t.landing.hero.titleItalic}</span>
              </h1>
              <p className="hero__sub">
                {(t.landing.hero.subtitle.split(":")[0] || t.landing.hero.subtitle)
                  .replace(/\s+$/, "")
                  .replace(/[.\s]*$/, "")}.
              </p>
              <div className="cta-row">
                <Link href={localePath("/analyze")} className="btn-primary" id="hero-cta">
                  {t.landing.hero.cta}
                  <IconArrow size={12} color="#fff" />
                </Link>
                <a href="#preview" className="btn-ghost">
                  See a sample
                </a>
              </div>
              <p className="font-sans text-[12px] text-rc-hint tracking-[0.04em] mt-4 flex items-center gap-2 flex-wrap">
                <span>Free</span>
                <span className="text-rc-border">·</span>
                <span>No credit card</span>
                <span className="text-rc-border">·</span>
                <span>~2 min</span>
                {animatedTotal > 0 && (
                  <>
                    <span className="text-rc-border">·</span>
                    <span>
                      <span className="font-semibold text-rc-muted tabular-nums">{animatedTotal.toLocaleString()}</span>
                      {" "}CVs analyzed
                    </span>
                  </>
                )}
              </p>
            </div>
            <div className="split__r">
              <div className="hero-widget">
                {/* Stepper */}
                <div className="hero-widget__stepper">
                  <span className={"hero-widget__step" + (heroStep >= 1 ? " active" : "") + (heroCvFile ? " done" : "")}>
                    {heroCvFile ? <IconCheck size={10} /> : "1"}
                  </span>
                  <span className="hero-widget__connector" />
                  <span className={"hero-widget__step" + (heroStep >= 2 ? " active" : "")}>2</span>
                  <span className="hero-widget__connector" />
                  <span className="hero-widget__step">3</span>
                </div>
                <div className="hero-widget__labels">
                  <span className={heroStep === 1 && !heroCvFile ? "active" : heroCvFile ? "done" : ""}>Upload CV</span>
                  <span className={heroStep === 2 ? "active" : ""}>Add job</span>
                  <span>View results</span>
                </div>

                {/* Step 1 — drop zone */}
                {heroStep === 1 && (
                  <div
                    className={"hero-drop" + (heroDragging ? " drag-over" : "") + (heroCvFile ? " has-file" : "")}
                    onDragOver={(e) => { e.preventDefault(); setHeroDragging(true); }}
                    onDragLeave={() => setHeroDragging(false)}
                    onDrop={handleHeroDrop}
                    onClick={() => heroFileRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && heroFileRef.current?.click()}
                  >
                    <input
                      ref={heroFileRef}
                      type="file"
                      accept=".pdf,.doc,.docx"
                      style={{ display: "none" }}
                      onChange={handleHeroFile}
                    />
                    <div className="hero-drop__icon">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="12" y1="18" x2="12" y2="12" />
                        <line x1="9" y1="15" x2="15" y2="15" />
                      </svg>
                    </div>
                    <div className="hero-drop__label">Drag & drop your CV</div>
                    <div className="hero-drop__hint">or <span>choose a file</span> · PDF or DOCX</div>
                  </div>
                )}

                {/* Step 2 — JD + sample picker */}
                {heroStep === 2 && (
                  <>
                    <div className="hero-widget__file-ok">
                      <IconCheck size={12} />
                      <span>{heroCvFile?.name}</span>
                      <button onClick={() => { setHeroStep(1); setHeroCvFile(null); }}>Change</button>
                    </div>
                    <div className="hero-step2">
                      <div className="hero-step2__paste">
                        <div className="hero-step2__lab">Paste a job description</div>
                        <textarea
                          className="hero-jd"
                          placeholder="Copy & paste the job description here…"
                          value={heroJd}
                          onChange={(e) => setHeroJd(e.target.value)}
                          rows={7}
                          autoFocus
                        />
                      </div>
                      <div className="hero-step2__or">OR</div>
                      <div className="hero-step2__samples">
                        <div className="hero-step2__lab">Use a sample</div>
                        <div className="hero-step2__list">
                          {SAMPLE_JDS.map((cat) => (
                            <div key={cat.category}>
                              <div className="hero-step2__cat">{cat.category}</div>
                              {cat.roles.map((role) => (
                                <button
                                  key={role.title}
                                  className={"hero-step2__role" + (heroJd === role.jd ? " active" : "")}
                                  onClick={() => setHeroJd(role.jd)}
                                >
                                  {role.title}
                                  {heroJd === role.jd && <IconCheck size={10} />}
                                </button>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn-primary"
                      style={{ width: "100%", justifyContent: "center" }}
                      onClick={handleHeroSubmit}
                    >
                      Get my score
                      <IconArrow size={12} color="#fff" />
                    </button>
                    <button className="hero-widget__skip" onClick={handleHeroSubmit}>
                      Skip — just audit my CV
                    </button>
                  </>
                )}

                <a href="#preview" className="hero-widget__sample">
                  View sample report ↗
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ════════════════════════════════════════════════ */}
      <section className="border-t border-rc-border bg-rc-surface py-16">
        <div className="rc-wrap">
          {/* Founder story */}
          <div className="flex items-center gap-6 border border-rc-border bg-rc-bg p-7 mb-4">
            <Image
              src="/testimonials/lenny.jpeg"
              alt="Lenny Garnier"
              width={52}
              height={52}
              className="rounded-full object-cover shrink-0 border border-rc-border"
              style={{ width: 52, height: 52 }}
            />
            <div className="flex flex-col gap-2">
              <div className="font-sans text-[9px] tracking-[0.08em] text-rc-red">Founder · Built it for himself</div>
              <p className="italic text-[18px] leading-[1.45] text-rc-text">
                "During my job search I built the tool I wish existed, this same tool got me 4x more interviews and a job in 2 months"
              </p>
              <div className="font-sans text-[11px] text-rc-hint tracking-[0.04em]">
                <span className="text-rc-muted font-semibold">Lenny Garnier</span> · Fullstack Engineer @ Witik
              </div>
            </div>
          </div>

          {/* 4-card strip */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {([
              { quote: "Best job search tool I've ever used", name: "Raphael", role: "Fullstack Engineer", img: "/testimonials/raphael.png" },
              { quote: "Actual game changer for job-seekers", name: "Arshiyaa", role: "Product Manager", img: "/testimonials/arshiyaa.jpeg" },
              { quote: "The advice is really good", name: "Sheryll", role: "Software Eng. Student", initials: "S" },
              { quote: "I think this is a really great tool!", name: "Yasbira", role: "ISE Student", initials: "Y" },
            ] as const).map((t) => (
              <div key={t.name} className="flex flex-col gap-3 border border-rc-border bg-rc-surface p-5">
                <span className="text-[28px] leading-none text-rc-red opacity-60">"</span>
                <p className="font-sans text-[14px] leading-[1.55] text-rc-text flex-1">{t.quote}</p>
                <div className="flex items-center gap-2.5 mt-1">
                  {"img" in t ? (
                    <Image
                      src={t.img}
                      alt={t.name}
                      width={36}
                      height={36}
                      className="rounded-full object-cover shrink-0 border border-rc-border"
                      style={{ width: 36, height: 36 }}
                    />
                  ) : (
                    <div className="shrink-0 w-9 h-9 rounded-full bg-rc-bg border border-rc-border flex items-center justify-center font-sans text-[12px] font-bold text-rc-muted">
                      {t.initials}
                    </div>
                  )}
                  <div className="flex flex-col gap-0.5">
                    <span className="font-sans text-[11px] font-bold text-rc-text tracking-[0.04em]">{t.name}</span>
                    <span className="font-sans text-[10px] text-rc-hint tracking-[0.04em]">{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ALL-IN-ONE PLATFORM ════════════════════════════════════════ */}
      <section className="sec sec--white" id="platform">
        <div className="rc-wrap">
          <div className="ft-head">
            <div className="ft-head__eye">All-in-one platform</div>
            <h2 className="ft-head__h">Six tools. One subscription.</h2>
            <p className="ft-head__sub">Everything you need to go from rejected to hired: CV, LinkedIn, GitHub, job tracker, cover letter, and mock interviews.</p>
          </div>
          <div className="ft-tabs">
            {FEATURE_TABS.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFeatureTab(f.id)}
                className={"ft-tab" + (activeFeatureTab === f.id ? " is-active" : "")}
              >
                {f.icon}
                <span>{f.label}</span>
              </button>
            ))}
          </div>
          <div className="ft-preview">
            <div key={activeFeatureTab} className="ft-preview__inner">
              {renderFeaturePreview(activeFeatureTab)}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DIAGNOSIS — radar + flags ════════════════════════════════════ */}
      <section className="sec sec--paper">
        <div className="rc-wrap">
          <SecHead
            num="01"
            eyebrow={t.landing.sections.whatYouGet}
            lead={mc.radar.subtitle}
          >
            {hl(t.landing.sections.diagnosticTitle)}
          </SecHead>
          <div className="diag">
            <div ref={diagRadarRef} className={"panel " + (diagRadarIn ? "in" : "")}>
              <div className="panel__lab">
                <span>{mc.radar.title}</span>
                <span className="meta">sample</span>
              </div>
              <div className="radar">
                {SAMPLE_SKILLS.map((s) => (
                  <div key={s.name} className="radar__row">
                    <div className="name">
                      <span>{s.name}</span>
                      <span style={{ color: s.ok ? "var(--rc-green)" : "var(--rc-red)" }}>
                        {s.have} / {s.need}
                      </span>
                    </div>
                    <div
                      className="radar__bar"
                      style={{
                        ["--need" as string]: s.need + "%",
                        ["--have" as string]: s.have + "%",
                      }}
                    >
                      <i className="need" />
                      <i
                        className="have"
                        style={{
                          background: s.ok
                            ? "var(--rc-green)"
                            : "linear-gradient(90deg, #c93a39, #8a2625)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div ref={diagFlagsRef} className={"panel " + (diagFlagsIn ? "in" : "")}>
              <div className="panel__lab">
                <span>{mc.radar.redFlagsLabel}</span>
                <span className="meta">{(mc.radar.redFlagItems as string[]).length} found</span>
              </div>
              {(mc.radar.redFlagItems as string[]).map((item, i) => {
                const sev = i === 0 ? "crit" : i === 1 ? "major" : "minor";
                const label = sev === "crit" ? "Critical" : sev === "major" ? "Major" : "Minor";
                return (
                  <div key={item} className="flag">
                    <span className={"flag__sev " + sev}>
                      <span className="dot" />
                      {label}
                    </span>
                    <div>
                      <div className="flag__title">{item}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ SIGNALS DARK — github + linkedin ═════════════════════════════ */}
      <section className="sec sec--dark">
        <div className="rc-wrap">
          <SecHead
            num="02"
            eyebrow={t.landing.sections.beyondCv}
            lead={t.landing.sections.beyondDesc}
          >
            {hl(t.landing.sections.beyondTitle)}
          </SecHead>
          <div className="signals">
            <div className="sigcard">
              <div className="sigcard__head">
                <span className="sigcard__icon"><IconGitHub size={28} /></span>
                <div>
                  <div className="sigcard__name">{t.landing.whatYouGet.github.title}</div>
                  <div className="sigcard__sub">sample · 42 public repos</div>
                </div>
                <span className="sigcard__verdict weak">Weak</span>
              </div>
              <div className="sigcard__stats">
                <div className="sigcard__stat"><div className="n">42</div><div className="l">Repos</div></div>
                <div className="sigcard__stat warn"><div className="n">3</div><div className="l">CI</div></div>
                <div className="sigcard__stat bad"><div className="n">1</div><div className="l">Tests</div></div>
              </div>
              <div className="sigcard__issues">
                <div className="sigcard__issues-lab">Issues detected · 3</div>
                {(mc.github.issues as { severity: string; label: string; detail: string }[]).slice(0, 3).map((issue, i) => (
                  <div key={i} className="sigcard__issue">
                    <span className={"sigcard__issue-sev " + issue.severity}>{issue.severity}</span>
                    <div>
                      <div className="sigcard__issue-label">{issue.label}</div>
                      <div className="sigcard__issue-detail">{issue.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="sigcard__fix">
                <div className="sigcard__fix-lab">Top fixes</div>
                <ul className="sigcard__fix-list">
                  <li>Pin 3 polished repos with READMEs and screenshots</li>
                  <li>Add CI badges (GitHub Actions) to top pinned repos</li>
                  <li>Push 2 weeks of consistent commits before applying</li>
                </ul>
              </div>
            </div>
            <div className="sigcard">
              <div className="sigcard__head">
                <span className="sigcard__icon"><IconLinkedIn size={28} /></span>
                <div>
                  <div className="sigcard__name">{t.landing.whatYouGet.linkedin.title}</div>
                  <div className="sigcard__sub">sample · headline · summary · skills</div>
                </div>
                <span className="sigcard__verdict weak">Mixed</span>
              </div>
              <div className="sigcard__stats">
                <div className="sigcard__stat good"><div className="n">312</div><div className="l">Connections</div></div>
                <div className="sigcard__stat good"><div className="n">14</div><div className="l">Endorsements</div></div>
                <div className="sigcard__stat warn"><div className="n">0</div><div className="l">Recs</div></div>
              </div>
              <div className="sigcard__issues">
                <div className="sigcard__issues-lab">Issues detected · 3</div>
                {(mc.linkedin.issues as { severity: string; label: string; detail: string }[]).slice(0, 3).map((issue, i) => (
                  <div key={i} className="sigcard__issue">
                    <span className={"sigcard__issue-sev " + issue.severity}>{issue.severity}</span>
                    <div>
                      <div className="sigcard__issue-label">{issue.label}</div>
                      <div className="sigcard__issue-detail">{issue.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="sigcard__fix">
                <div className="sigcard__fix-lab">Top fixes</div>
                <ul className="sigcard__fix-list">
                  <li>Ask the manager from your last role for one recommendation</li>
                  <li>Rewrite headline with seniority + domain (not just &quot;Developer&quot;)</li>
                  <li>Add a 4-line About section with stack keywords from JD</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PREVIEW — browser frame with tabs ════════════════════════════ */}
      <section id="preview" className="sec sec--white">
        <div className="rc-wrap">
          <SecHead
            num="03"
            eyebrow={t.landing.sections.everyTab}
            lead={mc.atsCard.desc}
          >
            {hl(t.landing.sections.previewTitle)}
          </SecHead>
          <FadeInSection>
            <div className="frame">
              <div className="frame__bar">
                <div className="frame__dots">
                  <span className="frame__dot" /><span className="frame__dot" /><span className="frame__dot" />
                </div>
                <div className="frame__url">rejectcheck.com/analyze?id=4821</div>
              </div>
              <div className="frame__tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={
                      "frame__tab " +
                      (tab.cls || "") +
                      (activeTab === tab.id ? " is-active" : "")
                    }
                  >
                    {tab.name}
                    {tab.count && <span className="count">{tab.count}</span>}
                  </button>
                ))}
              </div>
              <div className="frame__body">
                <div key={activeTab} className="frame__placeholder">
                  {renderTab(activeTab, mc)}
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ═══ FIXIT STRIP — 3 premium tools ════════════════════════════════ */}
      <section className="sec sec--paper">
        <div className="rc-wrap">
          <SecHead
            num="04"
            eyebrow={t.landing.sections.everyTab}
            lead={t.landing.sections.coverDesc}
          >
            {hl(t.landing.sections.fixTitle)}
          </SecHead>
          <FadeInSection>
            <div className="fixstrip">
              {/* CV Rewrite */}
              <div className="fixcard">
                <div className="fixcard__prem">✦ Premium</div>
                <div className="fixcard__lab">{mc.rewriteCard.label}</div>
                <div>
                  <div className="fixcard__title">{mc.rewriteCard.title}</div>
                  <p className="fixcard__desc">{mc.rewriteCard.desc}</p>
                </div>
                <div className="fixcard__demo">
                  <div>
                    <div className="ba__lab before">{mc.rewriteCard.before}</div>
                    <div className="ba__text before">{mc.rewriteCard.beforeText}</div>
                  </div>
                  <div className="ba__rule" />
                  <div>
                    <div className="ba__lab after">{mc.rewriteCard.after}</div>
                    <div className="ba__text after">
                      <strong>{(mc.rewriteCard.afterText as string).split(" ")[0]}</strong>{" "}
                      {(mc.rewriteCard.afterText as string).split(" ").slice(1).join(" ")}
                    </div>
                  </div>
                </div>
              </div>
              {/* AI Mock Interview */}
              <div className="fixcard">
                <div className="fixcard__prem">✦ Premium</div>
                <div className="fixcard__lab">{mc.interviewCard.label}</div>
                <div>
                  <div className="fixcard__title">{mc.interviewCard.title}</div>
                  <p className="fixcard__desc">{mc.interviewCard.desc}</p>
                </div>
                <div className="fixcard__demo">
                  <div className="chat">
                    <div className="chat__bub ai">
                      <span className="who">{mc.interviewCard.aiLabel} · Round 1</span>
                      {mc.interviewCard.aiQuestion}
                    </div>
                    <div className="chat__bub you">
                      <span className="who">{mc.interviewCard.youLabel}</span>
                      {mc.interviewCard.youAnswer}
                    </div>
                    <div className="chat__axes">
                      {INTERVIEW_AXES.map((a) => (
                        <div key={a.name} className="chat__axis">
                          <span className="name">{a.name}</span>
                          <span className="bar"><i style={{ width: a.v * 10 + "%" }} /></span>
                          <span className="val">{a.v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              {/* Cover Letter */}
              <div className="fixcard">
                <div className="fixcard__prem">✦ Premium</div>
                <div className="fixcard__lab">{t.landing.sections.coverLabel}</div>
                <div>
                  <div className="fixcard__title">{t.landing.sections.coverTitle}</div>
                  <p className="fixcard__desc">{t.landing.sections.coverDesc}</p>
                </div>
                <div className="fixcard__demo">
                  <div className="letter">
                    <div className="date">{mc.coverLetter.date}</div>
                    <p>{mc.coverLetter.greeting}</p>
                    <p>{mc.coverLetter.p1}</p>
                    <p>{mc.coverLetter.p2}</p>
                  </div>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ═══ BRIDGE THE GAP ═══════════════════════════════════════════════ */}
      <section className="sec sec--cream">
        <div className="rc-wrap">
          <SecHead
            num="05"
            eyebrow={t.landing.sections.bridgeLabel}
            lead={t.landing.sections.bridgeDesc}
          >
            {hl(t.landing.sections.bridgeTitle)}
          </SecHead>
          <FadeInSection>
            <div className="bridge">
              <div className="bridge__bar">
                <div className="bridge__bar-l">{mc.bridge.headerLabel}</div>
                <span className="bridge__lvl">{mc.bridge.level}</span>
              </div>
              <div className="bridge__body">
                <div>
                  <h3 className="bridge__title">{mc.bridge.projectTitle}</h3>
                  <p className="bridge__lead">{mc.bridge.projectDesc}</p>
                  <div className="bridge__quote">
                    <div className="bridge__quote-lab">{mc.bridge.architectureLabel}</div>
                    <div className="bridge__quote-text">{mc.bridge.architectureText}</div>
                  </div>
                  <div className="bridge__steps-lab">{mc.bridge.whatToBuildLabel}</div>
                  {(mc.bridge.whatToBuild as string[]).map((step, i) => (
                    <div key={i} className={"bridge__step " + (i >= 2 ? "locked" : "")}>
                      <span className="n">{i + 1}.</span>
                      <span className="t">{step}</span>
                    </div>
                  ))}
                </div>
                <aside className="bridge__side">
                  <div className="bridge__pill-box">
                    <div className="bridge__pill-lab core">{mc.bridge.coreStackLabel}</div>
                    <div className="bridge__pills">
                      {["Docker", "Kubernetes", "Kafka", "TypeScript", "Node.js", "Redis", "PostgreSQL", "GitHub Actions"].map((p) => (
                        <span key={p} className="pill">{p}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bridge__pill-box">
                    <div className="bridge__pill-lab adv">{mc.bridge.advancedLabel}</div>
                    <div className="bridge__pills">
                      {["Event Sourcing", "CQRS", "Circuit Breaker", "Saga Pattern"].map((p) => (
                        <span key={p} className="pill adv">{p}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bridge__pill-box">
                    <div className="bridge__pill-lab ok">{mc.bridge.successLabel}</div>
                    <div className="bridge__criteria">
                      {(mc.bridge.success as string[]).map((c) => (
                        <div key={c} className="bridge__crit">
                          <span className="ok">✓</span>
                          <span>{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </aside>
              </div>
              <div className="bridge__cta-strip">
                <div className="bridge__cta-note">
                  <span className="star">✦</span> {t.landing.sections.bridgePremiumNote}
                </div>
                <Link href={localePath("/pricing")} className="btn-primary">
                  {t.landing.sections.bridgeCta}
                  <IconArrow size={12} color="#fff" />
                </Link>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ═══ PRICING TRIO ════════════════════════════════════════════════ */}
      <section id="pricing" className="sec sec--cream">
        <div className="rc-wrap">
          <SecHead
            num="06"
            eyebrow={t.pricing.badge}
            lead={t.pricing.subtitle + " " + t.pricing.subtitleLine2}
          >
            {t.pricing.title} <span className="it">{t.pricing.titleHighlight}</span>
          </SecHead>
          <FadeInSection>
            <div className="pricing">
              {/* Free / REJECTED */}
              <div className="price">
                <div className="price__name">{t.pricing.plans.free.name}</div>
                <div className="price__amt">
                  <span className="n">€0</span>
                  <span className="u">{t.pricing.plans.free.period}</span>
                </div>
                <div className="price__desc">{t.pricing.plans.free.description}</div>
                <ul className="price__feats">
                  {t.pricing.plans.free.features.slice(0, 5).map((f) => (
                    <li key={f} className="on">
                      <span className="check"><IconCheck size={14} /></span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={localePath("/analyze")}
                  className="btn-ghost"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {t.pricing.plans.free.cta}
                </Link>
              </div>
              {/* SHORTLISTED — popular */}
              <div className="price price--pop">
                <div className="price__badge">{t.pricing.recommended}</div>
                <div className="price__name">{t.pricing.plans.shortlisted.name}</div>
                <div className="price__amt">
                  <span className="n">€7.99</span>
                  <span className="u">{t.pricing.plans.shortlisted.period}</span>
                </div>
                <div className="price__desc">{t.pricing.plans.shortlisted.description}</div>
                <ul className="price__feats">
                  {t.pricing.plans.shortlisted.features.slice(0, 6).map((f) => (
                    <li key={f} className="on">
                      <span className="check"><IconCheck size={14} /></span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={localePath("/pricing")}
                  className="btn-primary"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {t.pricing.plans.shortlisted.cta}
                  <IconArrow size={12} color="#fff" />
                </Link>
              </div>
              {/* HIRED */}
              <div className="price">
                <div className="price__name">{t.pricing.plans.hired.name}</div>
                <div className="price__amt">
                  <span className="n">€11.99</span>
                  <span className="u">{t.pricing.plans.hired.period}</span>
                </div>
                <div className="price__desc">{t.pricing.plans.hired.description}</div>
                <div className="price__guarantee">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                  {t.pricing.plans.hired.guarantee}
                </div>
                <ul className="price__feats">
                  {t.pricing.plans.hired.features.slice(0, 5).map((f) => (
                    <li key={f} className="on">
                      <span className="check"><IconCheck size={14} /></span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={localePath("/pricing")}
                  className="btn-ghost"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {t.pricing.plans.hired.cta}
                </Link>
              </div>
            </div>
          </FadeInSection>
          <div className="pricing__trust">
            <span>Cancel anytime</span>
            <span className="pricing__trust-dot" />
            <span>Hired? <strong>We refund your last month.</strong> No form. Just tell us.</span>
          </div>
        </div>
      </section>

      {/* ═══ TRUST FACTS ═════════════════════════════════════════════════ */}
      <section id="trust" className="sec sec--paper">
        <div className="rc-wrap">
          <SecHead
            num="07"
            eyebrow={t.landing.trust.badge}
            lead={t.landing.trust.subtitle}
          >
            {t.landing.trust.title}
          </SecHead>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {t.landing.trust.items.map((item, i) => (
              <FadeInSection key={i} delay={i * 40}>
                <article className="h-full border border-rc-border bg-rc-surface p-7">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-sans text-[11px] text-rc-red tracking-[0.05em]">0{i + 1}</span>
                    <div className="h-px flex-1 bg-rc-border" />
                  </div>
                  <h3 className="text-[18px] md:text-[19px] font-semibold tracking-[-0.01em] text-rc-text mb-3">
                    {item.label}
                  </h3>
                  <p className="text-rc-muted text-[14px] md:text-[15px] leading-[1.6] mb-4">
                    {item.claim}
                  </p>
                  <div className="pt-3 border-t border-rc-border">
                    <div className="font-sans text-[10px] tracking-[0.05em] uppercase text-rc-hint mb-2">
                      Source
                    </div>
                    <p className="text-[13px] text-rc-muted leading-[1.5] mb-2">{item.source}</p>
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {item.sourceLinks.map((lnk, j) => {
                        const isExternal = lnk.href.startsWith("http");
                        return isExternal ? (
                          <a
                            key={j}
                            href={lnk.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-sans text-[11px] tracking-wide text-rc-red hover:underline"
                          >
                            {lnk.label} ↗
                          </a>
                        ) : (
                          <Link
                            key={j}
                            href={lnk.href}
                            className="font-sans text-[11px] tracking-wide text-rc-red no-underline hover:underline"
                          >
                            {lnk.label} →
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </article>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═════════════════════════════════════════════════════════ */}
      <section id="faq" className="sec sec--white">
        <div className="rc-wrap--tight">
          <SecHead num="08" eyebrow="FAQ" lead={t.faq.subtitle}>
            {t.faq.title}
          </SecHead>
          <div className="space-y-3">
            {t.faq.items.map((item, i) => (
              <FadeInSection key={i} delay={i * 40}>
                <details className="group border border-rc-border bg-rc-surface open:shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-shadow">
                  <summary className="cursor-pointer list-none flex items-start justify-between gap-4 px-5 py-4 md:px-6 md:py-5">
                    <h3 className="text-[16px] md:text-[17px] font-semibold text-rc-text leading-[1.35] tracking-[-0.01em]">
                      {item.question}
                    </h3>
                    <span
                      aria-hidden="true"
                      className="shrink-0 mt-1 font-sans text-[18px] text-rc-red transition-transform group-open:rotate-45 select-none"
                    >
                      +
                    </span>
                  </summary>
                  <div className="px-5 pb-5 md:px-6 md:pb-6 -mt-1">
                    <p className="text-rc-muted text-[14px] md:text-[15px] leading-[1.7]">
                      {item.answer}
                    </p>
                    {"seeAlso" in item && Array.isArray(item.seeAlso) && item.seeAlso.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                        {item.seeAlso.map((lnk, j) => (
                          <Link
                            key={j}
                            href={lnk.href}
                            className="font-sans text-[11px] tracking-wide text-rc-red no-underline hover:underline"
                          >
                            {lnk.label} →
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </details>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FINAL QUOTE / CTA ═══════════════════════════════════════════ */}
      <section className="sec sec--paper">
        <div className="rc-wrap text-center">
          <FadeInSection>
            <blockquote className="mb-10">
              <p className="text-[32px] md:text-[48px] lg:text-[58px] font-semibold leading-[1.1] tracking-[-0.025em] text-rc-text">
                {t.landing.quote.line1}{" "}
                <span style={{ color: "var(--rc-red)", fontFamily: "var(--font-sans)", fontStyle: "italic" }}>
                  {t.landing.quote.word}
                </span>
                ,
                <br />
                {t.landing.quote.line2}
              </p>
            </blockquote>
            <p className="font-sans text-[13px] md:text-[14px] tracking-[0.06em] text-rc-hint mb-10">
              {t.landing.quote.subtitle}
            </p>
            <Link href={localePath("/analyze")} id="quote-cta" className="btn-primary">
              {t.landing.quote.cta}
              <IconArrow size={12} color="#fff" />
            </Link>
          </FadeInSection>
        </div>
      </section>

      {/* ═══ FOOTER ═════════════════════════════════════════════════════ */}
      <footer className="border-t-[0.5px] border-rc-border bg-rc-bg py-10 md:py-12 px-5 md:px-[40px]">
        <div className="rc-wrap">
          <div className="grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-8 mb-10">
            <div>
              <div className="font-sans text-[12px] font-bold tracking-[0.06em] mb-3 text-rc-text">
                REJECTCHECK<span style={{ color: "var(--rc-red)" }}>!</span>
              </div>
              <p className="text-rc-muted text-[13px] leading-[1.6] max-w-[340px]">
                {t.landing.hero.subtitle}
              </p>
            </div>
            <div>
              <div className="font-sans text-[10px] tracking-[0.06em] uppercase text-rc-text font-bold mb-3">Product</div>
              <Link href={localePath("/analyze")} className="block py-1 font-sans text-[13px] text-rc-muted hover:text-rc-red transition-colors">
                {t.landing.hero.cta}
              </Link>
              <Link href={localePath("/pricing")} className="block py-1 font-sans text-[13px] text-rc-muted hover:text-rc-red transition-colors">
                {t.navbar.pricing}
              </Link>
              <Link href={localePath("/for-teams")} className="block py-1 font-sans text-[13px] text-rc-muted hover:text-rc-red transition-colors">
                {t.landing.footer.forTeams}
              </Link>
            </div>
            <div>
              <div className="font-sans text-[10px] tracking-[0.06em] uppercase text-rc-text font-bold mb-3">Resources</div>
              <Link href={localePath("/alternatives")} className="block py-1 font-sans text-[13px] text-rc-muted hover:text-rc-red transition-colors">
                {t.landing.footer.alternatives}
              </Link>
{locale === "en" && (
                <>
                  <Link href="/en/cv-review" className="block py-1 font-sans text-[13px] text-rc-muted hover:text-rc-red transition-colors">CV Review</Link>
                  <Link href="/en/ats-checker" className="block py-1 font-sans text-[13px] text-rc-muted hover:text-rc-red transition-colors">ATS Checker</Link>
                </>
              )}
            </div>
            <div>
              <div className="font-sans text-[10px] tracking-[0.06em] uppercase text-rc-text font-bold mb-3">Company</div>
              <Link href={localePath("/privacy")} className="block py-1 font-sans text-[13px] text-rc-muted hover:text-rc-red transition-colors">
                {t.landing.footer.privacy}
              </Link>
              <a href="#" className="block py-1 font-sans text-[13px] text-rc-muted hover:text-rc-red transition-colors">
                {t.landing.footer.terms}
              </a>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between gap-2 pt-6 border-t border-rc-border font-sans text-[10px] tracking-[0.06em] uppercase text-rc-hint">
            <span>{t.landing.footer.copyright}</span>
            <span>The diagnosis you weren&apos;t sent</span>
          </div>
        </div>
      </footer>

      {/* <a
        href="https://www.producthunt.com/products/rejectcheck?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-rejectcheck"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 right-4 z-50"
      >
        <img
          alt="RejectCheck on Product Hunt"
          width="250"
          height="54"
          src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1128865&theme=light&t=1776772520938"
        />
      </a> */}
    </div>
  );
}
