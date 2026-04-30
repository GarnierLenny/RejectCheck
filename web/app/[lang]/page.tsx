"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { Navbar } from "../components/Navbar";
import { FadeInSection, useInView, useCountUp } from "../components/FadeInSection";
import { useLanguage } from "../../context/language";
import {
  JsonLd,
  softwareApplicationSchema,
  faqPageSchema,
} from "../components/JsonLd";

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
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: "#6b6860", fontFamily: "var(--font-mono)" }} />
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

/* ─── Landing ─────────────────────────────────────────────────────── */
export default function Home() {
  const { t, locale, localePath } = useLanguage();
  const mc = t.landing.mockContent;

  /* hero qcard — random scenario + live count-up */
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [run, setRun] = useState(false);
  const [barIn, setBarIn] = useState(false);
  useEffect(() => {
    setScenarioIndex(Math.floor(Math.random() * SCENARIOS.length));
    const t1 = setTimeout(() => setRun(true), 250);
    const t2 = setTimeout(() => setBarIn(true), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  const scenario = SCENARIOS[scenarioIndex];
  const rejectionPct = useCountUp(scenario.pct, run);

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
              </div>
            </div>
            <div className="split__r">
              <figure
                className={"qcard qcard--" + tierFor(scenario.pct)}
                aria-label="Sample diagnostic report"
                suppressHydrationWarning
              >
                <figcaption className="qcard__cap">
                  <span>{scenario.rc}</span>
                  <span className="qcard__live"><span className="dot" />live</span>
                </figcaption>
                <div className="qcard__name">{scenario.name}</div>
                <div className="qcard__role">{scenario.role}</div>
                <div className="qcard__num">
                  <span className="n">{rejectionPct}</span>
                  <span className="u">%</span>
                </div>
                <div className="qcard__label">Rejection probability</div>
                <div
                  className={"qcard__bar " + (barIn ? "in" : "")}
                  style={{ ["--w" as string]: scenario.pct + "%" }}
                >
                  <i />
                </div>
                <ul className="qcard__feedback">
                  {scenario.feedback.map((f, i) => (
                    <li key={i} className="qcard__fb">
                      <span className={"mark mark--" + f.mark}>{FB_GLYPH[f.mark]}</span>
                      <span>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </figure>
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
                <article className="h-full rounded-2xl border border-rc-border bg-rc-surface p-7">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="font-mono text-[11px] text-rc-red tracking-[0.16em]">0{i + 1}</span>
                    <div className="h-px flex-1 bg-rc-border" />
                  </div>
                  <h3 className="text-[18px] md:text-[19px] font-semibold tracking-[-0.01em] text-rc-text mb-3">
                    {item.label}
                  </h3>
                  <p className="text-rc-muted text-[14px] md:text-[15px] leading-[1.6] mb-4">
                    {item.claim}
                  </p>
                  <div className="pt-3 border-t border-rc-border">
                    <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-rc-hint mb-2">
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
                            className="font-mono text-[11px] tracking-wide text-rc-red hover:underline"
                          >
                            {lnk.label} ↗
                          </a>
                        ) : (
                          <Link
                            key={j}
                            href={lnk.href}
                            className="font-mono text-[11px] tracking-wide text-rc-red no-underline hover:underline"
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
                <details className="group rounded-xl border border-rc-border bg-rc-surface open:shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-shadow">
                  <summary className="cursor-pointer list-none flex items-start justify-between gap-4 px-5 py-4 md:px-6 md:py-5">
                    <h3 className="text-[16px] md:text-[17px] font-semibold text-rc-text leading-[1.35] tracking-[-0.01em]">
                      {item.question}
                    </h3>
                    <span
                      aria-hidden="true"
                      className="shrink-0 mt-1 font-mono text-[18px] text-rc-red transition-transform group-open:rotate-45 select-none"
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
                            className="font-mono text-[11px] tracking-wide text-rc-red no-underline hover:underline"
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
                <span style={{ color: "var(--rc-red)", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
                  {t.landing.quote.word}
                </span>
                ,
                <br />
                {t.landing.quote.line2}
              </p>
            </blockquote>
            <p className="font-mono text-[13px] md:text-[14px] tracking-[0.06em] text-rc-hint mb-10">
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
              <div className="font-mono text-[12px] font-bold tracking-[0.06em] mb-3 text-rc-text">
                REJECTCHECK<span style={{ color: "var(--rc-red)" }}>!</span>
              </div>
              <p className="text-rc-muted text-[13px] leading-[1.6] max-w-[340px]">
                {t.landing.hero.subtitle}
              </p>
            </div>
            <div>
              <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-text font-bold mb-3">Product</div>
              <Link href={localePath("/analyze")} className="block py-1 font-mono text-[13px] text-rc-muted hover:text-rc-red transition-colors">
                {t.landing.hero.cta}
              </Link>
              <Link href={localePath("/pricing")} className="block py-1 font-mono text-[13px] text-rc-muted hover:text-rc-red transition-colors">
                {t.navbar.pricing}
              </Link>
              <Link href={localePath("/for-teams")} className="block py-1 font-mono text-[13px] text-rc-muted hover:text-rc-red transition-colors">
                {t.landing.footer.forTeams}
              </Link>
            </div>
            <div>
              <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-text font-bold mb-3">Resources</div>
              <Link href={localePath("/alternatives")} className="block py-1 font-mono text-[13px] text-rc-muted hover:text-rc-red transition-colors">
                {t.landing.footer.alternatives}
              </Link>
              <Link href={localePath("/challenge")} className="block py-1 font-mono text-[13px] text-rc-muted hover:text-rc-red transition-colors">
                {t.challenge.navLink}
              </Link>
              {locale === "en" && (
                <>
                  <Link href="/en/cv-review" className="block py-1 font-mono text-[13px] text-rc-muted hover:text-rc-red transition-colors">CV Review</Link>
                  <Link href="/en/ats-checker" className="block py-1 font-mono text-[13px] text-rc-muted hover:text-rc-red transition-colors">ATS Checker</Link>
                </>
              )}
            </div>
            <div>
              <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-text font-bold mb-3">Company</div>
              <Link href={localePath("/privacy")} className="block py-1 font-mono text-[13px] text-rc-muted hover:text-rc-red transition-colors">
                {t.landing.footer.privacy}
              </Link>
              <a href="#" className="block py-1 font-mono text-[13px] text-rc-muted hover:text-rc-red transition-colors">
                {t.landing.footer.terms}
              </a>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between gap-2 pt-6 border-t border-rc-border font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint">
            <span>{t.landing.footer.copyright}</span>
            <span>The diagnosis you weren&apos;t sent</span>
          </div>
        </div>
      </footer>

      <a
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
      </a>
    </div>
  );
}
