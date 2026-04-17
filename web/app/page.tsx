import Link from "next/link";
import { Navbar } from "./components/Navbar";
import { FadeInSection } from "./components/FadeInSection";

/* ─── Radar chart data ────────────────────────────────────────────────────── */
const RADAR_SKILLS = [
  { label: "React / Frontend", score: 0.85, expected: 0.90 },
  { label: "Node.js / Backend", score: 0.65, expected: 0.75 },
  { label: "System Design", score: 0.42, expected: 0.80 },
  { label: "Testing", score: 0.55, expected: 0.70 },
  { label: "DevOps", score: 0.28, expected: 0.65 },
  { label: "Algorithms", score: 0.70, expected: 0.60 },
];

function radarPt(angle: number, r: number, cx = 100, cy = 100) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function radarPolygon(values: number[], r = 80) {
  return values
    .map((v, i) => {
      const pt = radarPt(i * 60, v * r);
      return `${pt.x},${pt.y}`;
    })
    .join(" ");
}

function gridPolygon(pct: number, r = 80) {
  return radarPolygon(Array(6).fill(pct), r);
}

const outerR = 80;
const skillPolygon = radarPolygon(RADAR_SKILLS.map((s) => s.score));
const expectedPolygon = radarPolygon(RADAR_SKILLS.map((s) => s.expected));
const gridPcts = [0.33, 0.66, 1];

const axisLabelOffsets: { dx: number; dy: number; anchor: "middle" | "start" | "end" }[] = [
  { dx: 0, dy: -8, anchor: "middle" },
  { dx: 8, dy: -4, anchor: "start" },
  { dx: 8, dy: 4, anchor: "start" },
  { dx: 0, dy: 10, anchor: "middle" },
  { dx: -8, dy: 4, anchor: "end" },
  { dx: -8, dy: -4, anchor: "end" },
];

/* ─── Landing ─────────────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="bg-rc-bg text-rc-text font-sans min-h-screen overflow-x-hidden">
      <Navbar />

      {/* ═══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="max-w-[1100px] mx-auto px-5 md:px-[40px] pt-20 pb-20 md:pt-28 md:pb-24">
        <FadeInSection>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px w-6 bg-rc-red" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-red">
              For developers
            </span>
          </div>

          <h1 className="text-[42px] md:text-[62px] lg:text-[72px] font-semibold leading-[1.08] tracking-[-0.025em] text-rc-text max-w-[800px] mb-3">
            Find out why your job
            <br />
            application got rejected
          </h1>
          <p
            className="text-[42px] md:text-[62px] lg:text-[72px] font-semibold leading-[1.08] tracking-[-0.025em] text-rc-red italic mb-8"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            before it does.
          </p>

          <p className="text-rc-muted text-[16px] md:text-[17px] leading-[1.7] max-w-[540px] mb-10">
            Upload your CV. In under a minute, get a full breakdown:{" "}
            <strong className="text-rc-text font-semibold">ATS simulation</strong>,
            skill gap radar,{" "}
            <strong className="text-rc-text font-semibold">CV rewrite</strong>, and
            an AI mock interview. Tailored to the exact job.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link
              href="/analyze"
              id="hero-cta"
              className="inline-flex items-center gap-2.5 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-7 py-3.5 rounded-xl hover:bg-[#b83332] hover:shadow-[0_8px_28px_rgba(201,58,57,0.28)] active:scale-[0.98] transition-all duration-200 no-underline"
            >
              Analyze my CV, free
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M7.5 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <span className="font-mono text-[11px] text-rc-hint tracking-wide">
              No account required · No data stored
            </span>
          </div>
        </FadeInSection>
      </section>

      {/* ═══ DASHBOARD MOCKUP ══════════════════════════════════════════════ */}
      <section className="border-t-[0.5px] border-rc-border bg-rc-surface-hero">
        <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-20 md:py-28">
          <FadeInSection>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-rc-border" />
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
                What you get
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-10 max-w-[480px]">
              A full <span className="text-rc-red font-bold">diagnostic</span>, not just a score.
            </h2>
          </FadeInSection>

          <FadeInSection delay={100}>
            {/* Mock app frame */}
            <div className="rounded-2xl border border-rc-border bg-rc-surface shadow-[0_4px_40px_rgba(0,0,0,0.07)] overflow-hidden">

              {/* Browser chrome */}
              <div className="bg-rc-surface-hero border-b border-rc-border px-4 py-3 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rc-border" />
                  <div className="w-3 h-3 rounded-full bg-rc-border" />
                  <div className="w-3 h-3 rounded-full bg-rc-border" />
                </div>
                <div className="flex-1 bg-rc-bg border border-rc-border rounded-md px-3 py-1 font-mono text-[11px] text-rc-hint max-w-[300px]">
                  rejectcheck.com/analyze?id=4821
                </div>
              </div>

              {/* Tab bar */}
              <div className="border-b border-rc-border bg-rc-surface overflow-x-auto">
                <div className="flex items-center min-w-max px-5">
                  {[
                    { label: "Skill Gap", active: true },
                    { label: "ATS Filter", badge: "34/100", badgeRed: true },
                    { label: "CV Analysis", badge: "7", badgeAmber: true },
                    { label: "Signals" },
                    { label: "Red Flags", badge: "3", badgeRed: true },
                    { label: "Roadmap" },
                    { label: "Improve CV ✦", premium: true },
                    { label: "AI Interview ✦", premium: true },
                  ].map((tab) => (
                    <div
                      key={tab.label}
                      className={`flex items-center gap-1.5 px-4 py-3.5 border-b-2 font-mono text-[11px] tracking-wide shrink-0 ${
                        tab.active
                          ? "border-rc-text text-rc-text font-bold"
                          : tab.premium
                          ? "border-transparent text-rc-red/70"
                          : "border-transparent text-rc-hint"
                      }`}
                    >
                      {tab.label}
                      {tab.badge && (
                        <span
                          className={`text-[10px] font-bold ${
                            tab.badgeRed ? "text-rc-red" : "text-rc-amber"
                          }`}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Dashboard body */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-0 divide-y md:divide-y-0 md:divide-x divide-rc-border">

                {/* Left — Radar chart */}
                <div className="p-8 flex flex-col items-center gap-6">
                  <div className="text-center">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint mb-1">Technical Skills Radar</p>
                    <p className="text-[13px] text-rc-muted">Mapped against the job description requirements</p>
                  </div>

                  <div className="relative">
                    <svg viewBox="0 0 220 240" width="340" height="360" className="overflow-visible">
                      {gridPcts.map((pct) => (
                        <polygon
                          key={pct}
                          points={gridPolygon(pct, outerR)}
                          transform="translate(10, 20)"
                          fill="none"
                          stroke="#d4cfc9"
                          strokeWidth="0.75"
                        />
                      ))}

                      {RADAR_SKILLS.map((_, i) => {
                        const outer = radarPt(i * 60, outerR, 110, 120);
                        return (
                          <line
                            key={i}
                            x1="110" y1="120"
                            x2={outer.x} y2={outer.y}
                            stroke="#d4cfc9"
                            strokeWidth="0.75"
                          />
                        );
                      })}

                      <polygon
                        points={RADAR_SKILLS.map((s, i) => {
                          const pt = radarPt(i * 60, s.expected * outerR, 110, 120);
                          return `${pt.x},${pt.y}`;
                        }).join(" ")}
                        fill="rgba(100,116,139,0.08)"
                        stroke="#94a3b8"
                        strokeWidth="1.25"
                        strokeDasharray="4 3"
                      />

                      <polygon
                        points={RADAR_SKILLS.map((s, i) => {
                          const pt = radarPt(i * 60, s.score * outerR, 110, 120);
                          return `${pt.x},${pt.y}`;
                        }).join(" ")}
                        fill="rgba(201,58,57,0.10)"
                        stroke="#C93A39"
                        strokeWidth="1.5"
                      />

                      {RADAR_SKILLS.map((s, i) => {
                        const pt = radarPt(i * 60, s.score * outerR, 110, 120);
                        return (
                          <circle key={i} cx={pt.x} cy={pt.y} r="3.5" fill="#C93A39" />
                        );
                      })}

                      {RADAR_SKILLS.map((s, i) => {
                        const outer = radarPt(i * 60, outerR + 18, 110, 120);
                        const off = axisLabelOffsets[i];
                        const score = Math.round(s.score * 100);
                        const scoreColor = score >= 70 ? "#3d6114" : score >= 50 ? "#8a5700" : "#C93A39";
                        return (
                          <g key={i}>
                            <text
                              x={outer.x + off.dx}
                              y={outer.y + off.dy}
                              textAnchor={off.anchor}
                              fontSize="9"
                              fill="#6b6860"
                              fontFamily="monospace"
                            >
                              {s.label}
                            </text>
                            <text
                              x={outer.x + off.dx}
                              y={outer.y + off.dy + 11}
                              textAnchor={off.anchor}
                              fontSize="9"
                              fontWeight="700"
                              fill={scoreColor}
                              fontFamily="monospace"
                            >
                              {score}%
                            </text>
                          </g>
                        );
                      })}
                    </svg>

                    <div className="absolute top-[30px] right-[-10px] md:right-[-60px] bg-rc-bg border border-rc-red/30 rounded-xl px-3 py-2 max-w-[140px] shadow-sm">
                      <div className="font-mono text-[10px] text-rc-red font-bold mb-0.5">Gap detected</div>
                      <p className="text-[11px] text-rc-muted leading-snug">DevOps at 28%, job requires 65%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-5">
                    <div className="flex items-center gap-1.5">
                      <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke="#C93A39" strokeWidth="2" /></svg>
                      <span className="font-mono text-[9px] text-rc-muted uppercase tracking-wider">Your profile</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" /></svg>
                      <span className="font-mono text-[9px] text-rc-muted uppercase tracking-wider">Job requirements</span>
                    </div>
                  </div>
                </div>

                {/* Right — Score + metrics */}
                <div className="p-6 flex flex-col gap-5">
                  <div className="bg-rc-red/5 border border-rc-red/20 rounded-xl p-4">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-rc-red mb-2">ATS Score</p>
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-[40px] font-bold text-rc-red leading-none">34</span>
                      <span className="text-[18px] text-rc-hint mb-1">/100</span>
                    </div>
                    <div className="h-1.5 bg-rc-border rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-rc-red rounded-full" style={{ width: "34%" }} />
                    </div>
                    <p className="font-mono text-[10px] text-rc-red">✗ Would not pass ATS filter</p>
                  </div>

                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-rc-hint mb-2">Critical missing keywords</p>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { kw: "microservices", pts: "+12 pts", freq: "5× in JD" },
                        { kw: "Docker", pts: "+9 pts", freq: "4× in JD" },
                        { kw: "CI/CD", pts: "+8 pts", freq: "3× in JD" },
                        { kw: "TypeScript", pts: "+7 pts", freq: "6× in JD" },
                      ].map((k) => (
                        <div key={k.kw} className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[12px] text-rc-text">{k.kw}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] text-rc-hint">{k.freq}</span>
                            <span className="font-mono text-[10px] text-rc-green font-bold">{k.pts}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-rc-hint mb-2">Red flags</p>
                    <div className="flex flex-col gap-1.5">
                      {[
                        "3-year employment gap unexplained",
                        "No quantified impact on any bullet",
                        "Seniority language absent",
                      ].map((f) => (
                        <div key={f} className="flex items-start gap-2">
                          <span className="text-rc-red text-[10px] mt-0.5 shrink-0">✗</span>
                          <span className="text-[11px] text-rc-muted leading-snug">{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ═══ SIGNALS — GitHub & LinkedIn ═══════════════════════════════════ */}
      <section className="border-t-[0.5px] border-rc-border">
        <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-20 md:py-28">
          <FadeInSection>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-rc-border" />
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
                Beyond the CV
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-3 max-w-[520px]">
              Your CV is only <span className="text-rc-red font-bold">half the story</span>.
            </h2>
            <p className="text-rc-hint text-[15px] md:text-[16px] leading-[1.7] max-w-[500px] mb-12">
              Recruiters Google you. We audit your GitHub and LinkedIn before they do, and flag everything that could cost you the interview.
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* GitHub card */}
            <FadeInSection delay={0}>
              <div className="rounded-2xl border border-rc-border bg-rc-surface overflow-hidden h-full">
                {/* Header */}
                <div className="bg-rc-surface-hero border-b border-rc-border px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="text-rc-text">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                    <span className="font-mono text-[11px] font-bold text-rc-text tracking-wide">GitHub Signal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase px-2 py-1 bg-rc-red/5 border border-rc-red/20 text-rc-red">
                      <span className="w-1.5 h-1.5 rounded-full bg-rc-red" />1 critical
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase px-2 py-1 bg-rc-amber/5 border border-rc-amber/20 text-rc-amber">
                      <span className="w-1.5 h-1.5 rounded-full bg-rc-amber" />2 major
                    </span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="px-5 pt-5 pb-4 border-b border-rc-border flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-rc-hint">Signal Score</span>
                      <span className="font-mono text-[15px] font-bold text-rc-amber">72%</span>
                    </div>
                    <div className="h-1.5 bg-rc-border rounded-full overflow-hidden">
                      <div className="h-full bg-rc-amber rounded-full" style={{ width: "72%" }} />
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-wrap justify-end max-w-[160px]">
                    {["Active contributor", "OSS projects"].map((s) => (
                      <span key={s} className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 bg-rc-green/5 text-rc-green border border-rc-green/20">
                        <span className="w-1 h-1 rounded-full bg-rc-green" />{s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Issues */}
                <div className="divide-y divide-rc-border/30">
                  {[
                    { severity: "critical", label: "Pinned repos have no README", detail: "3 pinned repositories lack documentation. Strong negative signal for senior roles." },
                    { severity: "major", label: "No CI/CD configuration detected", detail: "None of your repos include GitHub Actions or similar pipelines." },
                    { severity: "major", label: "Commit history gaps > 6 months", detail: "3 visible gaps suggest inconsistent activity over the last 2 years." },
                  ].map((issue) => (
                    <div key={issue.label} className="px-5 py-4 flex items-start gap-3">
                      <span className={`mt-0.5 shrink-0 font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 ${
                        issue.severity === "critical"
                          ? "bg-rc-red/5 text-rc-red border border-rc-red/20"
                          : "bg-rc-amber/5 text-rc-amber border border-rc-amber/20"
                      }`}>
                        {issue.severity}
                      </span>
                      <div>
                        <p className="text-[12px] font-semibold text-rc-text mb-0.5">{issue.label}</p>
                        <p className="text-[11px] text-rc-hint leading-snug">{issue.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeInSection>

            {/* LinkedIn card */}
            <FadeInSection delay={120}>
              <div className="rounded-2xl border border-rc-border bg-rc-surface overflow-hidden h-full">
                {/* Header */}
                <div className="bg-rc-surface-hero border-b border-rc-border px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="text-rc-text">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <span className="font-mono text-[11px] font-bold text-rc-text tracking-wide">LinkedIn Signal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase px-2 py-1 bg-rc-amber/5 border border-rc-amber/20 text-rc-amber">
                      <span className="w-1.5 h-1.5 rounded-full bg-rc-amber" />3 major
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase px-2 py-1 bg-rc-surface border border-rc-border text-rc-hint">
                      <span className="w-1.5 h-1.5 rounded-full bg-rc-hint" />1 minor
                    </span>
                  </div>
                </div>

                {/* Score bar */}
                <div className="px-5 pt-5 pb-4 border-b border-rc-border flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-[9px] uppercase tracking-widest text-rc-hint">Signal Score</span>
                      <span className="font-mono text-[15px] font-bold text-rc-red">58%</span>
                    </div>
                    <div className="h-1.5 bg-rc-border rounded-full overflow-hidden">
                      <div className="h-full bg-rc-red rounded-full" style={{ width: "58%" }} />
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-wrap justify-end max-w-[160px]">
                    {["500+ connections"].map((s) => (
                      <span key={s} className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 bg-rc-green/5 text-rc-green border border-rc-green/20">
                        <span className="w-1 h-1 rounded-full bg-rc-green" />{s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Issues */}
                <div className="divide-y divide-rc-border/30">
                  {[
                    { severity: "major", label: "Zero recommendations received", detail: "No peer or manager recommendations. At senior level, social proof matters." },
                    { severity: "major", label: "Current role title too vague", detail: "\"Developer\" without seniority or domain signals. Recruiters can't assess fit at a glance." },
                    { severity: "major", label: "Summary section missing", detail: "Profile has no About section. You're losing the most prominent keyword-matching surface." },
                  ].map((issue) => (
                    <div key={issue.label} className="px-5 py-4 flex items-start gap-3">
                      <span className="mt-0.5 shrink-0 font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 bg-rc-amber/5 text-rc-amber border border-rc-amber/20">
                        {issue.severity}
                      </span>
                      <div>
                        <p className="text-[12px] font-semibold text-rc-text mb-0.5">{issue.label}</p>
                        <p className="text-[11px] text-rc-hint leading-snug">{issue.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* ═══ FEATURE STRIP ═════════════════════════════════════════════════ */}
      <section className="border-t-[0.5px] border-rc-border bg-rc-surface-hero">
        <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-20 md:py-28">
          <FadeInSection>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-rc-border" />
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
                Every tab, a tool
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-14 max-w-[480px]">
              <span className="text-rc-red font-bold">Fix the problem</span>, not just read about it.
            </h2>
          </FadeInSection>

          <FadeInSection delay={80}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-rc-border border border-rc-border rounded-2xl overflow-hidden">

              {/* ── ATS Filter ── */}
              <div className="bg-rc-surface p-7 flex flex-col gap-5">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rc-surface-hero border border-rc-border mb-4">
                    <span className="font-mono text-[10px] text-rc-hint tracking-widest uppercase">ATS Filter</span>
                  </div>
                  <h3 className="text-[17px] font-semibold text-rc-text mb-2 tracking-[-0.01em]">Simulate the filter before the recruiter does</h3>
                  <p className="text-[13px] text-rc-hint leading-[1.7]">
                    We run your CV through an ATS simulation matched to the job description.
                    Each missing keyword gets a point value, so you know exactly what to add.
                  </p>
                </div>

                <div className="bg-rc-bg border border-rc-border rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-rc-hint uppercase tracking-widest">Score</span>
                    <span className="font-mono text-[18px] font-bold text-rc-red">34 / 100</span>
                  </div>
                  <div className="h-1 bg-rc-border rounded-full">
                    <div className="h-full w-[34%] bg-rc-red rounded-full" />
                  </div>
                  <div className="flex flex-col gap-1.5 pt-1">
                    {["kubernetes +11 pts", "GraphQL +9 pts", "Redis +7 pts"].map((k) => {
                      const [kw, pts] = k.split(" +");
                      return (
                        <div key={kw} className="flex items-center justify-between">
                          <span className="font-mono text-[12px] text-rc-text">{kw}</span>
                          <span className="font-mono text-[11px] text-rc-green font-bold">+{pts}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ── CV Rewrite ── */}
              <div className="bg-rc-surface p-7 flex flex-col gap-5 relative">
                <div className="absolute top-4 right-4">
                  <span className="font-mono text-[10px] text-rc-red font-bold tracking-widest">✦ Premium</span>
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rc-surface-hero border border-rc-border mb-4">
                    <span className="font-mono text-[10px] text-rc-hint tracking-widest uppercase">Improve CV</span>
                  </div>
                  <h3 className="text-[17px] font-semibold text-rc-text mb-2 tracking-[-0.01em]">Your CV, surgically rewritten</h3>
                  <p className="text-[13px] text-rc-hint leading-[1.7]">
                    One click rewrites the entire CV: keywords injected, passive tone converted,
                    seniority signals added. Export a clean PDF.
                  </p>
                </div>

                <div className="bg-rc-bg border border-rc-border rounded-xl p-4 flex flex-col gap-3 text-[12px]">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-rc-hint mb-1.5">Before</p>
                    <p className="text-rc-hint leading-snug line-through">
                      &ldquo;Responsible for backend development and worked on API features for the platform.&rdquo;
                    </p>
                  </div>
                  <div className="h-px bg-rc-border" />
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-rc-green mb-1.5">After</p>
                    <p className="text-rc-text leading-snug">
                      &ldquo;<strong>Led</strong> backend architecture delivering 4 core REST APIs, reducing P95 latency by <strong>40%</strong> across 200K daily requests.&rdquo;
                    </p>
                  </div>
                </div>
              </div>

              {/* ── AI Interview ── */}
              <div className="bg-rc-surface p-7 flex flex-col gap-5 relative">
                <div className="absolute top-4 right-4">
                  <span className="font-mono text-[10px] text-rc-red font-bold tracking-widest">✦ Premium</span>
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rc-surface-hero border border-rc-border mb-4">
                    <span className="font-mono text-[10px] text-rc-hint tracking-widest uppercase">AI Interview</span>
                  </div>
                  <h3 className="text-[17px] font-semibold text-rc-text mb-2 tracking-[-0.01em]">10-minute voice mock interview</h3>
                  <p className="text-[13px] text-rc-hint leading-[1.7]">
                    A real-time AI interviewer, voice-based and role-specific. Ends with a scored
                    debrief across communication, technical depth, and leadership signals.
                  </p>
                </div>

                <div className="bg-rc-bg border border-rc-border rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <div className="bg-rc-surface-hero border border-rc-border rounded-lg px-3 py-2 text-[12px] text-rc-muted leading-snug max-w-[85%]">
                      <span className="font-mono text-[9px] text-rc-red font-bold block mb-0.5">AI</span>
                      &ldquo;Walk me through a system you designed from scratch. What trade-offs did you make?&rdquo;
                    </div>
                    <div className="bg-rc-red/5 border border-rc-red/15 rounded-lg px-3 py-2 text-[12px] text-rc-text leading-snug self-end max-w-[85%]">
                      <span className="font-mono text-[9px] text-rc-hint font-bold block mb-0.5">You</span>
                      &ldquo;I built a real-time notification service handling 50K events/sec...&rdquo;
                    </div>
                  </div>
                  <div className="border-t border-rc-border pt-3 flex flex-col gap-1.5">
                    {[
                      { label: "Technical depth", score: 8.1 },
                      { label: "Communication", score: 7.4 },
                      { label: "Leadership signals", score: 6.8 },
                    ].map((axis) => (
                      <div key={axis.label} className="flex items-center gap-2">
                        <span className="text-[11px] text-rc-hint w-[110px] shrink-0">{axis.label}</span>
                        <div className="flex-1 h-1 bg-rc-border rounded-full">
                          <div
                            className="h-full bg-rc-green rounded-full"
                            style={{ width: `${axis.score * 10}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-rc-text font-bold w-[28px] text-right">
                          {axis.score}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ═══ BRIDGE THE GAP ════════════════════════════════════════════════ */}
      <section className="border-t-[0.5px] border-rc-border">
        <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-20 md:py-28">
          <FadeInSection>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-rc-border" />
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
                Project Recommendation
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-3 max-w-[540px]">
              Bridge the <span className="text-rc-red font-bold">Gap</span>.
            </h2>
            <p className="text-rc-hint text-[15px] md:text-[16px] leading-[1.7] max-w-[500px] mb-12">
              AI generates a custom project engineered to close your exact skill gaps, with architecture, stack, and success criteria ready to add to your CV.
            </p>
          </FadeInSection>

          <FadeInSection delay={100}>
            <div className="rounded-2xl border border-rc-border bg-rc-surface overflow-hidden relative">

              {/* Header stripe */}
              <div className="bg-rc-surface-hero border-b border-rc-border px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-5 bg-rc-red rounded-full" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint">Bridge the Gap · Project Recommendation</span>
                </div>
                <span className="font-mono text-[10px] text-rc-amber font-bold px-2 py-0.5 border border-rc-amber/30 bg-rc-amber/5">Advanced</span>
              </div>

              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
                {/* Left — project description */}
                <div className="flex flex-col gap-5">
                  <div>
                    <h3 className="text-[20px] md:text-[22px] font-semibold text-rc-text mb-3 tracking-tight leading-tight">
                      Distributed Event-Driven Microservices Platform
                    </h3>
                    <p className="text-[14px] text-rc-muted leading-[1.75]">
                      Build a production-ready microservices system using Docker, Kubernetes, and an event-driven architecture via Kafka. Exposes real-world CI/CD pipeline experience and closes the DevOps gap identified in your radar.
                    </p>
                  </div>

                  {/* Architecture */}
                  <div className="bg-rc-surface-hero border border-rc-border rounded-xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-rc-red rounded-l-xl" />
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-rc-red font-bold mb-3">Architecture Blueprint</p>
                    <p className="font-mono text-[12px] text-rc-muted leading-relaxed">
                      API Gateway → Auth Service → Order Service → Kafka → Notification Service + Inventory Service. Each service containerised with Docker, orchestrated via Kubernetes, deployed via GitHub Actions.
                    </p>
                  </div>

                  {/* What to build — blurred after 2 items */}
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-rc-hint font-bold mb-3">What to Build</p>
                    <div className="flex flex-col gap-2">
                      {[
                        "API Gateway with JWT auth, rate limiting, and request routing",
                        "Kafka producer/consumer for async inter-service communication",
                        "CI/CD pipeline with automated Docker builds and K8s deployments",
                        "Distributed tracing with OpenTelemetry and Prometheus metrics",
                        "Zero-downtime rolling deploy strategy with health checks",
                      ].map((feature, i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-3 p-3.5 bg-rc-surface-hero border border-rc-border rounded-lg ${i >= 2 ? "relative" : ""}`}
                          style={i >= 2 ? { filter: "blur(3px)", userSelect: "none" } : {}}
                        >
                          <span className="font-mono text-[11px] text-rc-hint w-5 text-right shrink-0 mt-0.5">{i + 1}.</span>
                          <span className="text-[13px] text-rc-text leading-snug">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right — stack + CTA */}
                <div className="flex flex-col gap-5">
                  <div className="bg-rc-surface-hero border border-rc-border rounded-xl p-5">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-rc-hint font-bold mb-3">Core Stack</p>
                    <div className="flex flex-wrap gap-2">
                      {["Docker", "Kubernetes", "Kafka", "TypeScript", "Node.js", "Redis", "PostgreSQL", "GitHub Actions"].map((tech) => (
                        <span key={tech} className="px-2.5 py-1 bg-rc-surface border border-rc-border font-mono text-[11px] text-rc-text rounded">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-rc-surface-hero border border-rc-border rounded-xl p-5">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-rc-amber font-bold mb-3">Advanced Concepts</p>
                    <div className="flex flex-wrap gap-2">
                      {["Event Sourcing", "CQRS", "Circuit Breaker", "Saga Pattern"].map((c) => (
                        <span key={c} className="px-2.5 py-1 bg-rc-amber/5 border border-rc-amber/20 font-mono text-[11px] text-rc-amber rounded">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-rc-surface-hero border border-rc-border rounded-xl p-5 flex flex-col gap-2">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-rc-green font-bold mb-1">Success Criteria</p>
                    {[
                      "System handles 10K req/s under load",
                      "Full observability stack deployed",
                      "Zero-downtime deploys documented",
                    ].map((c) => (
                      <div key={c} className="flex items-start gap-2">
                        <span className="text-rc-green text-[11px] shrink-0 mt-0.5">✓</span>
                        <span className="text-[12px] text-rc-muted leading-snug">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Premium blur overlay at bottom */}
              <div className="relative">
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-rc-surface to-transparent pointer-events-none" />
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-6 border-t border-rc-border bg-rc-surface-hero text-center">
                  <p className="font-mono text-[11px] text-rc-hint tracking-wide">
                    ✦ Full project roadmap, actionable steps & recruiter tip unlocked with Premium
                  </p>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 bg-rc-red text-white font-mono text-[11px] tracking-[0.12em] uppercase px-5 py-2.5 rounded-lg hover:bg-[#b83332] hover:shadow-[0_6px_20px_rgba(201,58,57,0.25)] active:scale-[0.98] transition-all duration-200 no-underline"
                  >
                    Unlock Bridge the Gap
                    <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7h10M7.5 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ═══ COVER LETTER ══════════════════════════════════════════════════ */}
      <section className="border-t-[0.5px] border-rc-border bg-rc-surface-hero">
        <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-20 md:py-28">
          <FadeInSection>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-6 bg-rc-border" />
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
                Cover Letter
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-3 max-w-[520px]">
              A letter that sounds like you, written to land the role.
            </h2>
            <p className="text-rc-hint text-[15px] md:text-[16px] leading-[1.7] max-w-[500px] mb-12">
              Generated from your CV, the job description, and your signal audit. Not a template. Tailored to the exact company and role.
            </p>
          </FadeInSection>

          <FadeInSection delay={100}>
            <div className="rounded-2xl border border-rc-border bg-rc-surface overflow-hidden">
              {/* Document header */}
              <div className="bg-rc-surface-hero border-b border-rc-border px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg width="14" height="16" viewBox="0 0 14 16" fill="none" className="text-rc-hint">
                    <rect x="0.5" y="0.5" width="13" height="15" rx="1.5" stroke="currentColor" strokeWidth="1"/>
                    <line x1="3" y1="5" x2="11" y2="5" stroke="currentColor" strokeWidth="1"/>
                    <line x1="3" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1"/>
                    <line x1="3" y1="11" x2="8" y2="11" stroke="currentColor" strokeWidth="1"/>
                  </svg>
                  <span className="font-mono text-[11px] text-rc-hint">Cover Letter · Senior Backend Engineer @ Stripe</span>
                </div>
                <span className="font-mono text-[10px] text-rc-red font-bold tracking-widest">✦ Premium</span>
              </div>

              {/* Letter preview */}
              <div className="relative">
                <div className="px-8 md:px-12 py-8 max-w-[720px] mx-auto">
                  <p className="text-[13px] text-rc-hint font-mono mb-6">April 17, 2026</p>

                  <p className="text-[15px] text-rc-muted leading-[1.8] mb-5">
                    Dear Hiring Team at Stripe,
                  </p>

                  <p className="text-[15px] text-rc-text leading-[1.85] mb-5">
                    I&apos;m applying for the Senior Backend Engineer role with a focus on distributed systems, an area where I&apos;ve spent the last four years building high-throughput, event-driven infrastructure. At my current company, I led the redesign of our payments pipeline, reducing P99 latency from 340ms to 62ms across 800K daily transactions.
                  </p>

                  <p className="text-[15px] text-rc-text leading-[1.85] mb-5">
                    What draws me to Stripe is the engineering culture around reliability and API design. Your recent engineering blog post on idempotency keys resonated with a problem I solved last year when we migrated from a monolith to microservices, ensuring exactly-once delivery across a Kafka-backed system with 15 consumers.
                  </p>

                  <p className="text-[15px] text-rc-muted leading-[1.85]">
                    I&apos;d welcome the opportunity to discuss how my experience with...
                  </p>
                </div>

                {/* Fade + blur overlay */}
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-rc-surface via-rc-surface/90 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end pb-8 gap-3 text-center">
                  <p className="font-mono text-[11px] text-rc-hint tracking-wide">
                    ✦ Full letter generated with Premium, tailored per company and role
                  </p>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 bg-rc-red text-white font-mono text-[11px] tracking-[0.12em] uppercase px-5 py-2.5 rounded-lg hover:bg-[#b83332] hover:shadow-[0_6px_20px_rgba(201,58,57,0.25)] active:scale-[0.98] transition-all duration-200 no-underline"
                  >
                    Generate my cover letter
                    <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7h10M7.5 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Spacer so content isn't hidden under overlay */}
              <div className="h-24" />
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ═══ QUOTE / CTA ═══════════════════════════════════════════════════ */}
      <section className="border-t-[0.5px] border-rc-border bg-rc-surface">
        <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-24 md:py-32 text-center">
          <FadeInSection>
            <blockquote className="mb-10">
              <p className="text-[32px] md:text-[48px] lg:text-[58px] font-semibold leading-[1.1] tracking-[-0.025em] text-rc-text">
                Apply like a{" "}
                <span className="text-rc-red italic" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>sniper</span>,
                <br />
                not a spammer.
              </p>
            </blockquote>

            <p className="font-mono text-[13px] md:text-[14px] tracking-[0.06em] text-rc-hint mb-10">
              Free analysis · No account required
            </p>

            <Link
              href="/analyze"
              id="quote-cta"
              className="inline-flex items-center gap-2.5 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-8 py-4 rounded-xl hover:bg-[#b83332] hover:shadow-[0_8px_28px_rgba(201,58,57,0.28)] active:scale-[0.98] transition-all duration-200 no-underline"
            >
              Analyze my CV, it&apos;s free
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M7.5 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </FadeInSection>
        </div>
      </section>

      {/* ═══ FOOTER ════════════════════════════════════════════════════════ */}
      <footer className="border-t-[0.5px] border-rc-border py-6 px-5 md:px-[40px] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="font-mono text-[13px] text-rc-muted">RejectCheck © 2026</div>
        <div className="flex gap-6">
          <Link href="/privacy" className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline cursor-pointer transition-colors hover:text-rc-text">
            Privacy (GDPR)
          </Link>
          <a href="#" className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline cursor-pointer transition-colors hover:text-rc-text">
            Terms
          </a>
        </div>
      </footer>
    </div>
  );
}
