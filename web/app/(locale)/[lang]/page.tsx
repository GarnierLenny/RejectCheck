"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef } from "react";
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
import { FadeInSection, useInView } from "../../components/FadeInSection";
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
  { company: "Mistral",   role: "Staff Engineer",      status: "saved",     date: "May 21", salary: "€120-150k", location: "Paris" },
  { company: "Datadog",   role: "Backend Engineer",    status: "saved",     date: "May 20", salary: "€90-115k",  location: "Remote" },
  { company: "Stripe",    role: "Backend Engineer",    status: "applied",   date: "May 19", salary: "€95-120k",  location: "Remote" },
  { company: "Linear",    role: "Frontend Engineer",   status: "screen",    date: "May 17", salary: "€85-105k",  location: "Paris" },
  { company: "Vercel",    role: "Staff Engineer",      status: "applied",   date: "May 15", salary: "€130-160k", location: "Remote" },
  { company: "Anthropic", role: "ML Engineer",         status: "offer",     date: "May 10", salary: "€140-180k", location: "Remote" },
  { company: "GitHub",    role: "DevOps Engineer",     status: "applied",   date: "May 14", salary: "€90-115k",  location: "Hybrid" },
  { company: "Notion",    role: "Senior Engineer",     status: "screen",    date: "May 12", salary: "€100-130k", location: "Remote" },
  { company: "Loom",      role: "Backend Engineer",    status: "interview", date: "May 11", salary: "€88-110k",  location: "Paris" },
  { company: "Figma",     role: "Full Stack Engineer", status: "rejected",  date: "May 08", salary: "€80-100k",  location: "Hybrid" },
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
  {
    id: "negotiation",
    label: "Negotiation Coach",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
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
  const kw = (s: string) => <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "11px", background: "rgba(201,58,57,0.08)", color: "var(--rc-red)", padding: "1px 4px", borderRadius: "2px" }}>{s}</span>;
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
                  <Radar name="Target" dataKey="target" stroke="#94a3b8" fill="rgba(100,116,139,0.08)" strokeWidth={1.25} strokeDasharray="4 3" isAnimationActive animationDuration={900} />
                  <Radar name="You" dataKey="you" stroke="#C93A39" fill="rgba(201,58,57,0.14)" strokeWidth={1.6} isAnimationActive animationDuration={1200} animationBegin={200} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="fp-radar__legend">
              {SAMPLE_SKILLS.map((s) => (
                <div key={s.name} className="fp-radar__legend-item">
                  <i style={{ background: s.ok ? "var(--rc-green)" : "var(--rc-red)" }} />
                  <span>{s.name}</span>
                  <span className="v" style={{ color: s.ok ? "var(--rc-green)" : "var(--rc-red)" }}>{s.have}/{s.need}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px", margin: "10px 0" }}>
            {[
              { skill: "Distributed systems", gap: "Listed in skills section. No project, PR, or production incident backs the claim. Recruiters are trained to flag this as unverifiable.", sev: "crit" },
              { skill: "Kubernetes", gap: "3 of 4 target companies run k8s in prod. CV mentions it once in a skills list. No cluster ownership, no ops story, no cert.", sev: "crit" },
              { skill: "Event-driven arch.", gap: "JD explicitly requires Kafka or RabbitMQ ownership. Absent from CV entirely. Not even in skills.", sev: "major" },
            ].map((g) => (
              <div key={g.skill} style={{ display: "flex", gap: "10px", padding: "8px 10px", background: "var(--rc-surface)", border: "1px solid var(--rc-border)" }}>
                <span className={"fp-row__pill " + g.sev} style={{ alignSelf: "flex-start", flexShrink: 0 }}>Gap</span>
                <div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: "12px", fontWeight: 600, color: "var(--rc-text)", marginBottom: "2px" }}>{g.skill}</div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--rc-muted)", lineHeight: 1.45 }}>{g.gap}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="fp-analysis">
            Strong on <span className="em">TypeScript</span> and <span className="em">PostgreSQL</span>, both verified by project context.
            <span className="num"> 3 critical gaps</span>: distributed systems, Kubernetes, event-driven arch are the senior backbone this JD requires, and none are evidenced anywhere on the CV.
          </div>
        </>
      );

    case "ATS":
      return (
        <>
          <div className="frame__grid">
            <div className="frame-card bad">
              <div className="lab">ATS Score</div>
              <div className="num">34<small>/100</small></div>
              <div className="verd">Below 67% pass-line · filtered</div>
            </div>
            <div className="frame-card good">
              <div className="lab">Skill match</div>
              <div className="num">82<small>/100</small></div>
              <div className="verd">✓ Strong fit on stack</div>
            </div>
          </div>
          <div style={{ margin: "10px 0" }}>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--rc-hint)", marginBottom: "6px" }}>Keyword scan · 18 terms from JD</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {[
                { kw: "typescript",          found: true,  freq: "4×", note: "skills + 3 bullets, solid" },
                { kw: "node.js",             found: true,  freq: "2×", note: "skills section only" },
                { kw: "postgresql",          found: true,  freq: "1×", note: "skills only, no project context" },
                { kw: "rest api",            found: true,  freq: "1×", note: "mentioned once, no scale signal" },
                { kw: "docker",              found: false, freq: "0×", note: "required · JD mentions 3 times" },
                { kw: "kubernetes / k8s",    found: false, freq: "0×", note: "required · infrastructure role" },
                { kw: "microservices",       found: false, freq: "0×", note: "required · architecture scope" },
                { kw: "distributed systems", found: false, freq: "0×", note: "required · in skills only, not keyword-matched" },
                { kw: "kafka",               found: false, freq: "0×", note: "preferred · event-driven section" },
              ].map((k) => (
                <div key={k.kw} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 8px", background: k.found ? "rgba(22,163,74,0.04)" : "rgba(201,58,57,0.04)", borderLeft: `2px solid ${k.found ? "var(--rc-green)" : "var(--rc-red)"}` }}>
                  <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "11px", color: k.found ? "var(--rc-green)" : "var(--rc-red)", width: "12px", textAlign: "center", flexShrink: 0 }}>{k.found ? "✓" : "✗"}</span>
                  <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "11px", color: "var(--rc-text)", flex: "0 0 160px" }}>{k.kw}</span>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "10px", color: "var(--rc-hint)", flex: "0 0 28px" }}>{k.freq}</span>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: "10px", color: "var(--rc-muted)" }}>{k.note}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="fp-analysis">
            <span className="num">34/100</span>: the bot drops this CV before any human reads it. Adding {kw("docker")}, {kw("kubernetes")}, {kw("microservices")} in context (not keyword-dumped) lifts the score to <span className="num">~71</span>, above the 67% pass-line. The stack match is strong. Fixable formatting problem, not a skills problem.
          </div>
        </>
      );

    case "CV":
      return (
        <>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--rc-hint)", marginBottom: "8px" }}>CV analysis · 11 bullets reviewed</div>
          <div className="fp-rows">
            {[
              { title: "No quantified impact",         sub: "0 of 11 bullets contain a metric, percentage, or scale signal. Recruiters can't assess scope.", sev: "crit",  count: "11" },
              { title: "Passive voice throughout",     sub: "\"Worked on\", \"Helped with\", \"Contributed to\": reads as junior IC, not senior engineer",    sev: "major", count: "5" },
              { title: "Missing seniority signals",    sub: "No \"led\", no cross-team scope, no RFC/ADR authored, no mentoring, no headcount owned",         sev: "crit",  count: "3" },
              { title: "Skills listed, not evidenced", sub: "\"Distributed systems\", \"Kafka\", \"k8s\" in skills section. Zero project or story backs them.", sev: "crit", count: "4" },
              { title: "Two-column layout",            sub: "ATS parsers read left column only. Your entire skills section may be invisible to bots.",         sev: "major", count: "1" },
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
          <div style={{ marginTop: "10px" }}>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--rc-hint)", marginBottom: "6px" }}>Flagged bullets</div>
            {[
              { bad: "Worked on backend systems and helped with API development.", why: "Passive · no ownership · no scale · no outcome" },
              { bad: "Contributed to microservices migration project.",            why: "Vague · no scope · no metric · no evidence of lead" },
              { bad: "Participated in architecture discussions.",                  why: "IC framing at staff scope. No artifact, no decision owned." },
            ].map((b, i) => (
              <div key={i} style={{ padding: "7px 10px", marginBottom: "4px", background: "rgba(201,58,57,0.04)", borderLeft: "2px solid var(--rc-red)" }}>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: "12px", color: "var(--rc-text)", lineHeight: 1.4, marginBottom: "3px" }}>"{b.bad}"</div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: "10px", color: "var(--rc-red)", letterSpacing: "0.02em" }}>{b.why}</div>
              </div>
            ))}
          </div>
          <div className="fp-analysis">
            Zero metrics across <span className="num">11 bullets</span> is the primary signal of a junior profile, even when the work itself was senior. Adding scope + metric + outcome to each bullet lifts the seniority read by <span className="em">~28%</span> based on recruiter scoring patterns.
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
                <span className="fp-stat__name">GitHub · @alex-morales</span>
              </div>
              <div className="fp-stat__num warn">72%</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "4px", margin: "6px 0 8px" }}>
                {[{ n: "42", l: "Repos", cls: "ok" }, { n: "3", l: "CI/CD", cls: "warn" }, { n: "1", l: "Tests", cls: "bad" }, { n: "7", l: "Stars", cls: "warn" }].map((s) => (
                  <div key={s.l} style={{ textAlign: "center", padding: "5px 2px", background: "var(--rc-surface)", border: "1px solid var(--rc-border)" }}>
                    <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "14px", color: s.cls === "ok" ? "var(--rc-green)" : s.cls === "bad" ? "var(--rc-red)" : "var(--rc-text)" }}>{s.n}</div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "10px", color: "var(--rc-hint)" }}>{s.l}</div>
                  </div>
                ))}
              </div>
              {[
                { sev: "crit",  t: "Top pinned repo: \"todo-app\"",    d: "No README, no demo, no description. Recruiters bounce in under 10s." },
                { sev: "major", t: "1 of 42 repos has tests",          d: "Strong negative signal to engineering managers evaluating prod quality" },
                { sev: "minor", t: "3 of 42 repos have CI badges",     d: "Add GitHub Actions to top 3 pinned repos before applying" },
              ].map((r) => (
                <div key={r.t} style={{ display: "flex", gap: "8px", padding: "5px 0", borderTop: "1px solid var(--rc-border)" }}>
                  <span className={"fp-row__pill " + r.sev} style={{ alignSelf: "flex-start", flexShrink: 0, fontSize: "9px" }}>{r.sev === "crit" ? "Crit" : r.sev === "major" ? "Maj" : "Min"}</span>
                  <div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 600, color: "var(--rc-text)", marginBottom: "1px" }}>{r.t}</div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "10px", color: "var(--rc-muted)", lineHeight: 1.4 }}>{r.d}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="fp-stat">
              <div className="fp-stat__head">
                <IconLinkedIn size={18} />
                <span className="fp-stat__name">LinkedIn · Alex Morales</span>
              </div>
              <div className="fp-stat__num bad">58%</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px", margin: "6px 0 8px" }}>
                {[{ n: "312", l: "Connections", cls: "ok" }, { n: "0", l: "Recs", cls: "bad" }, { n: "14", l: "Endorsements", cls: "warn" }].map((s) => (
                  <div key={s.l} style={{ textAlign: "center", padding: "5px 2px", background: "var(--rc-surface)", border: "1px solid var(--rc-border)" }}>
                    <div style={{ fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: "14px", color: s.cls === "ok" ? "var(--rc-green)" : s.cls === "bad" ? "var(--rc-red)" : "var(--rc-text)" }}>{s.n}</div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "10px", color: "var(--rc-hint)" }}>{s.l}</div>
                  </div>
                ))}
              </div>
              {[
                { sev: "crit",  t: "About section is empty",          d: "Recruiters check this first. Empty About signals zero effort on candidacy." },
                { sev: "crit",  t: "Headline: \"Software Engineer\"", d: "No stack, no seniority, no domain. Invisible in recruiter search filters." },
                { sev: "major", t: "0 recommendations",               d: "1 peer rec moves you above 75% of applicants in this salary band" },
                { sev: "minor", t: "12 skills listed",                d: "JD has 40+ keywords. Add matching skills to recover ATS score." },
              ].map((r) => (
                <div key={r.t} style={{ display: "flex", gap: "8px", padding: "5px 0", borderTop: "1px solid var(--rc-border)" }}>
                  <span className={"fp-row__pill " + r.sev} style={{ alignSelf: "flex-start", flexShrink: 0, fontSize: "9px" }}>{r.sev === "crit" ? "Crit" : r.sev === "major" ? "Maj" : "Min"}</span>
                  <div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "11px", fontWeight: 600, color: "var(--rc-text)", marginBottom: "1px" }}>{r.t}</div>
                    <div style={{ fontFamily: "var(--font-sans)", fontSize: "10px", color: "var(--rc-muted)", lineHeight: 1.4 }}>{r.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="fp-analysis">
            GitHub has volume but no signal: <span className="em">42 repos, none polished</span>. LinkedIn is the bigger blocker. Empty About + generic headline = invisible in recruiter search. One afternoon of profile work moves the combined signal from <span className="num">65% → 83%+</span>.
          </div>
        </>
      );

    case "Flag":
      return (
        <>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--rc-hint)", marginBottom: "8px" }}>
            2 critical · 2 major · 1 minor
          </div>
          <div className="fp-rows">
            {[
              { title: "Skill claims without evidence", sub: "\"Distributed systems\", \"Kubernetes\", \"Kafka\" in skills list. No project, PR, cert, or talk backs any of them. Recruiters are trained to catch this and it triggers hard rejection at senior level.", sev: "crit",  label: "Critical" },
              { title: "Zero quantified impact: all 11 bullets", sub: "Not one number, percentage, or scale indicator. A senior engineer's output is measured. This CV reads as IC even if the work was staff-level. Non-negotiable fix.", sev: "crit",  label: "Critical" },
              { title: "Employment gap · Apr → Dec 2023", sub: "8 months unaddressed. Recruiters will ask in screen call. Prepare a one-line answer: freelance, study, health, or personal. Optionally add a line to the CV.", sev: "major", label: "Major" },
              { title: "Two-column layout", sub: "ATS parsers read left-to-right linearly. Skills section is in column 2. Likely invisible to the bot, which explains the 34/100 ATS score despite strong stack match.", sev: "major", label: "Major" },
              { title: "Title: Engineer III vs. staff scope", sub: "CV lists \"Software Engineer III\" but JD asks for staff scope (system design ownership, cross-team delivery, RFC authorship). None evidenced in bullets.", sev: "minor", label: "Minor" },
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
            The <span className="num">2 critical flags</span> compound: unbacked claims + zero metrics reads as fabrication to experienced recruiters. Fix the layout first (10 min, fixes ATS immediately), then address bullet quality. The minor flag won&apos;t get you rejected, but it lowers the <span className="em">recruiter&apos;s ceiling</span> on seniority assessment.
          </div>
        </>
      );

    case "Road":
      return (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--rc-hint)" }}>Action plan · ~5h 30min total</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--rc-muted)" }}>2 of 5 done · ATS 26 → 47</div>
          </div>
          <div className="fp-roadmap">
            {[
              { t: "Switch to single-column layout",       sub: "10 min · ATS: 26 → 34 · removes major flag",     state: "done", lab: "✓ Done" },
              { t: "Inject 5 missing keywords in context", sub: "30 min · ATS: 34 → 47 · clears keyword scan",    state: "done", lab: "✓ Done" },
              { t: "Quantify all 11 bullets with metrics", sub: "2h · seniority signal +31% · removes crit flag",  state: "now",  lab: "→ Now" },
              { t: "Remove or evidence 4 unbacked claims", sub: "1h · removes remaining critical flag",             state: "todo", lab: "○ Next" },
              { t: "Address employment gap in timeline",   sub: "20 min · removes major flag · prep screen answer", state: "todo", lab: "○ Later" },
            ].map((s, i) => (
              <div key={i} className={"fp-roadmap__item " + s.state}>
                <span className={"fp-roadmap__check " + s.state}>{i + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="fp-roadmap__t">{s.t}</div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: "10px", color: s.state === "done" ? "var(--rc-green)" : "var(--rc-hint)", marginTop: "2px" }}>{s.sub}</div>
                </div>
                <span className="fp-roadmap__lab">{s.lab}</span>
              </div>
            ))}
          </div>
          <div className="fp-analysis">
            <span className="num">2 of 5</span> done. Layout fix moved ATS from <span className="num">26 → 47</span> in 10 minutes. Completing step 3 (quantifying bullets) is the highest-leverage action: it resolves both critical flags at once and is estimated to cut rejection probability from <span className="num">84% → ~42%</span>.
          </div>
        </>
      );

    case "Imp":
      return (
        <>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--rc-hint)", marginBottom: "8px" }}>14 bullets rewritten · JD-matched · no fabrication</div>
          {[
            {
              before: "Worked on backend systems and helped with API development.",
              after:  "Designed gRPC API handling 8k req/min; cut p95 latency 43% via connection pooling and query index optimisation.",
              fix: "ownership + scale + metric",
            },
            {
              before: "Contributed to microservices migration project.",
              after:  "Led decomposition of monolith → 6 domain services; reduced deploy time 45 min → 9 min, eliminated 3 cross-module bug classes.",
              fix: "lead signal + outcome + measurable",
            },
            {
              before: "Participated in architecture discussions and helped with code reviews.",
              after:  "Authored ADR-14 (async event pipeline, adopted by 3 squads); reviewed 80+ PRs in Q3 across backend and infra teams.",
              fix: "artifact + scope + volume",
            },
          ].map((rw, i) => (
            <div key={i} className="fp-rewrite" style={{ marginBottom: i < 2 ? "8px" : 0 }}>
              <div className="fp-rewrite__col before">
                <div className="fp-rewrite__lab">Before</div>
                <p className="fp-rewrite__t">{rw.before}</p>
              </div>
              <div className="fp-rewrite__col after">
                <div className="fp-rewrite__lab">After · {rw.fix}</div>
                <p className="fp-rewrite__t"><strong>{rw.after.split(" ")[0]}</strong>{" "}{rw.after.split(" ").slice(1).join(" ")}</p>
              </div>
            </div>
          ))}
          <div className="fp-analysis">
            Every rewrite uses only information already on your CV. <span className="em">No fabrication, no inflation.</span> Keywords from the JD injected naturally. Seniority signals added via ownership language, artifact references (ADRs, PRs), and team scope, all traceable to flagged issues.
          </div>
        </>
      );

    case "AI":
      return (
        <>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: "10px", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--rc-hint)", marginBottom: "8px" }}>
            Mock interview · Round 1 · Technical screen · 6 questions
          </div>
          <div className="fp-interview">
            <div className="fp-interview__bub" style={{ marginBottom: "8px" }}>
              <span className="who">Senior Engineer · Datadog · Round 1</span>
              Walk me through how you&apos;ve worked with distributed systems at scale. Specifically, what failure modes did you have to design around and how did you diagnose them in production?
            </div>
            <div className="fp-interview__bub" style={{ background: "var(--rc-surface)", borderColor: "var(--rc-border)", marginBottom: "6px" }}>
              <span className="who" style={{ color: "var(--rc-muted)" }}>You</span>
              I&apos;ve worked with microservices and distributed architectures in my previous roles, building APIs and working with various backend technologies to handle different scale scenarios...
            </div>
            <div style={{ padding: "8px 10px", background: "rgba(201,58,57,0.05)", borderLeft: "2px solid var(--rc-red)", marginBottom: "10px" }}>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: "10px", fontWeight: 700, color: "var(--rc-red)", marginBottom: "3px" }}>AI feedback · Specificity: 3.2/10</div>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: "11px", color: "var(--rc-muted)", lineHeight: 1.5 }}>
                No failure mode named, no system referenced, no scale mentioned. &quot;Various backend technologies&quot; is a non-answer at this level. Expected: a specific incident (network partition, clock skew, cascading failure) with your exact diagnosis and fix.
              </div>
            </div>
            <div className="fp-interview__axes">
              {[
                { name: "Tech depth",    v: 8.1, cls: "ok" },
                { name: "Specificity",   v: 3.2, cls: "bad" },
                { name: "Communication", v: 6.8, cls: "warn" },
                { name: "STAR structure", v: 5.1, cls: "warn" },
              ].map((a) => (
                <div key={a.name} className="fp-interview__ax">
                  <span className="name">{a.name}</span>
                  <div style={{ flex: 1, height: "4px", background: "var(--rc-border)", borderRadius: "2px", margin: "0 8px" }}>
                    <div style={{ height: "100%", width: a.v * 10 + "%", background: a.cls === "ok" ? "var(--rc-green)" : a.cls === "bad" ? "var(--rc-red)" : "#d97706", borderRadius: "2px", transition: "width 0.6s ease" }} />
                  </div>
                  <span className="v" style={{ color: a.cls === "ok" ? "var(--rc-green)" : a.cls === "bad" ? "var(--rc-red)" : "var(--rc-text)" }}>{a.v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="fp-analysis">
            Average <span className="num">5.8/10</span> across 6 questions. Strong theoretical knowledge (<span className="em">tech depth 8.1</span>) collapses under open-ended questions. Specificity drops to 3.2. Prepare one concrete incident story per major system you&apos;ve built. STAR format, specific numbers, your personal contribution clearly separated from the team&apos;s.
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
            ATS filter drops this CV before any recruiter reads it. Fix <strong>3 missing keywords</strong> to cross the 67% pass-line.
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
              <div className="ftv-linkedin__verdict warn">Mixed signal. Needs work before applying.</div>
            </div>
          </div>
          <div className="ftv-rows-mini">
            {[
              { sev: "crit",  title: "No About summary",            sub: "Recruiters check this first. Yours is empty." },
              { sev: "major", title: "Generic headline",             sub: '"Software Engineer": no stack, no seniority signal' },
              { sev: "major", title: "Zero recommendations",         sub: "One peer endorsement moves you above 75% of applicants" },
              { sev: "minor", title: "Skills section underutilized", sub: "12 skills vs. 40+ in the JD. Keyword gap visible to ATS." },
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
              <div className="ftv-linkedin__verdict warn">Active contributor, but unpolished</div>
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
              { sev: "crit",  title: "Pinned repos lack documentation", sub: "Recruiters open the top repo. No README, no demo → they bounce in 10s." },
              { sev: "major", title: "Only 1 repo has tests",           sub: "Production engineers write tests. This signal is weak to engineering teams." },
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
            { label: "Saved",     cls: "saved",     statuses: ["saved"] },
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
                    <div className="ftv-job__meta">
                      <span className="ftv-job__salary">{j.salary}</span>
                      <span className="ftv-job__loc">{j.location}</span>
                    </div>
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
              <p>I&apos;m applying for the Senior Backend Engineer role at Stripe. In my last position I scaled our payment processing service from 2k to 50k transactions per minute, exactly the kind of infrastructure challenge I understand your team is navigating now.</p>
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
              I&apos;d use a sliding window approach with Redis Lua scripts for atomicity. The script increments the counter and checks the limit in a single round trip, avoiding race conditions entirely...
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
            Average <strong>6.9/10</strong> across 6 questions. Strongest on tech depth, weakest on structure. Practice STAR-format answers for system design questions.
          </div>
        </div>
      );

    case "negotiation":
      return (
        <div className="ftv-negotiation">
          {/* Range card */}
          <div className="ftv-nego__range-card">
            <div className="ftv-nego__range-head">
              <span>Senior Backend Engineer · France · 5 yrs exp</span>
              <span className="src">Levels.fyi + LinkedIn Salary · May 2026</span>
            </div>
            <div className="ftv-nego__range-wrap">
              {/* Labels above the track */}
              <div className="ftv-nego__upper-labels">
                <div className="ftv-nego__ulabel you" style={{ left: "30%" }}>↓ You · €82k</div>
                <div className="ftv-nego__ulabel target" style={{ left: "59%" }}>↓ Target · €105k</div>
              </div>
              {/* Track */}
              <div className="ftv-nego__track">
                <div className="ftv-nego__band" style={{ left: "25%", width: "46%" }} />
                <div className="ftv-nego__median-line" style={{ left: "46%" }} />
                <div className="ftv-nego__dot you" style={{ left: "30%" }} />
                <div className="ftv-nego__dot target" style={{ left: "59%" }} />
              </div>
              {/* Scale */}
              <div className="ftv-nego__scale">
                {[
                  { label: "€58k",           pct: "0%" },
                  { label: "P25 · €78k",     pct: "25%" },
                  { label: "Median · €95k",  pct: "46%" },
                  { label: "P75 · €115k",    pct: "71%" },
                  { label: "€138k",          pct: "100%" },
                ].map((s) => (
                  <span key={s.label} style={{ left: s.pct }}>{s.label}</span>
                ))}
              </div>
            </div>
          </div>
          {/* Metrics */}
          <div className="ftv-nego__metrics">
            {[
              { label: "Your current",   val: "€82k",  note: "P30",  cls: "warn" },
              { label: "Market median",  val: "€95k",  note: "P50",  cls: "" },
              { label: "Your target",    val: "€105k", note: "P59",  cls: "ok" },
              { label: "Upside",         val: "+€23k", note: "+28%", cls: "ok" },
            ].map((m) => (
              <div key={m.label} className={"ftv-nego__metric " + m.cls}>
                <div className="lab">{m.label}</div>
                <div className="val">{m.val}</div>
                <div className="note">{m.note}</div>
              </div>
            ))}
          </div>
          {/* Talking points */}
          <div className="ftv-nego__points">
            <div className="ftv-nego__points-lab">Negotiation script · generated from your report + market data</div>
            {[
              "P65 for this role in France is €103-108k. Open with €108k, settle at €105k.",
              "2 competing offers in your tracker = real leverage. Mention it without naming companies.",
              "Don't anchor first. Wait for their number, then counter with market data.",
            ].map((p, i) => (
              <div key={i} className="ftv-nego__point">
                <span className="n">{i + 1}</span>
                <span>{p}</span>
              </div>
            ))}
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
          <div className="hero__text">
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
            <a
              href="#preview"
              className="font-sans text-[13px] text-rc-hint hover:text-rc-red transition-colors mt-4 inline-flex items-center gap-1.5"
              onClick={(e) => { e.preventDefault(); document.getElementById("preview")?.scrollIntoView({ behavior: "smooth" }); }}
            >
              {t.landing.hero.seeSample}
              <IconArrow size={11} color="currentColor" />
            </a>
          </div>
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
                  <span className={heroStep === 1 && !heroCvFile ? "active" : heroCvFile ? "done" : ""}>{t.landing.hero.step1}</span>
                  <span className={heroStep === 2 ? "active" : ""}>{t.landing.hero.step2}</span>
                  <span>{t.landing.hero.step3}</span>
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
                    <div className="hero-drop__label">{t.landing.hero.dropLabel}</div>
                    <div className="hero-drop__hint">{t.landing.hero.dropHintOr} <span>{t.landing.hero.dropHintChoose}</span> · {t.landing.hero.dropHintFormat}</div>
                  </div>
                )}

                {/* Step 2 — JD + sample picker */}
                {heroStep === 2 && (
                  <>
                    <div className="hero-widget__file-ok">
                      <IconCheck size={12} />
                      <span>{heroCvFile?.name}</span>
                      <button onClick={() => { setHeroStep(1); setHeroCvFile(null); }}>{t.landing.hero.changeFile}</button>
                    </div>
                    <div className="hero-step2">
                      <div className="hero-step2__paste">
                        <div className="hero-step2__lab">{t.landing.hero.pasteLabel}</div>
                        <textarea
                          className="hero-jd"
                          placeholder={t.landing.hero.pastePlaceholder}
                          value={heroJd}
                          onChange={(e) => setHeroJd(e.target.value)}
                          rows={7}
                          autoFocus
                        />
                      </div>
                      <div className="hero-step2__or">{t.landing.hero.orDivider}</div>
                      <div className="hero-step2__samples">
                        <div className="hero-step2__lab">{t.landing.hero.sampleLabel}</div>
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
                      {t.landing.hero.submitCta}
                      <IconArrow size={12} color="#fff" />
                    </button>
                  </>
                )}

                <a href="#preview" className="hero-widget__sample">
                  {t.landing.hero.viewSample}
                </a>
              </div>
        </div>
      </section>

      {/* ═══ ALL-IN-ONE PLATFORM ════════════════════════════════════════ */}
      <section className="sec sec--white" id="platform">
        <div className="rc-wrap">
          <div className="ft-head">
            <div className="ft-head__eye">{t.landing.sections.platformLabel}</div>
            <h2 className="ft-head__h">{t.landing.sections.platformTitle}</h2>
            <p className="ft-head__sub">{t.landing.sections.platformSubtitle}</p>
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
              <div className="font-sans text-[9px] tracking-[0.08em] text-rc-red">{t.landing.sections.founderLabel}</div>
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
              { quote: "Best job search tool I've ever used. Went from 0 callbacks to 3 in a week.", name: "Raphael", role: "Fullstack Engineer", img: "/testimonials/raphael.png" },
              { quote: "Actual game changer. 3 interviews in 2 weeks after fixing the gaps it flagged.", name: "Arshiyaa", role: "Product Manager", img: "/testimonials/arshiyaa.jpeg" },
              { quote: "The advice is really good.", name: "Sheryll", role: "Software Eng. Student", initials: "S" },
              { quote: "This is a really great tool!", name: "Yasbira", role: "ISE Student", initials: "Y" },
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

      {/* ═══ TRUST FACTS ═════════════════════════════════════════════════ */}
      <section id="trust" className="sec sec--paper">
        <div className="rc-wrap">
          <SecHead
            num="04"
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
                          <a key={j} href={lnk.href} target="_blank" rel="noopener noreferrer" className="font-sans text-[11px] tracking-wide text-rc-red hover:underline">
                            {lnk.label} ↗
                          </a>
                        ) : (
                          <Link key={j} href={lnk.href} className="font-sans text-[11px] tracking-wide text-rc-red no-underline hover:underline">
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

      {/* ═══ PRICING TRIO ════════════════════════════════════════════════ */}
      <section id="pricing" className="sec sec--cream">
        <div className="rc-wrap">
          <SecHead
            num="05"
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
            <span>{t.landing.sections.cancelAnytime}</span>
            <span className="pricing__trust-dot" />
            <span>{t.landing.sections.hiredRefund}</span>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═════════════════════════════════════════════════════════ */}
      <section id="faq" className="sec sec--white">
        <div className="rc-wrap--tight">
          <SecHead num="06" eyebrow="FAQ" lead={t.faq.subtitle}>
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
