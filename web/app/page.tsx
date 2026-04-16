import Link from "next/link";
import { Navbar } from "./components/Navbar";

/* ─── Radar chart data ────────────────────────────────────────────────────── */
// 6-axis hexagon, centre (100,100), outer radius 80
// Axes (clockwise from top): React, Node.js, System Design, Testing, DevOps, Algorithms
const RADAR_SKILLS = [
  { label: "React / Frontend", score: 0.85 },
  { label: "Node.js / Backend", score: 0.65 },
  { label: "System Design", score: 0.42 },
  { label: "Testing", score: 0.55 },
  { label: "DevOps", score: 0.28 },
  { label: "Algorithms", score: 0.70 },
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
const gridPcts = [0.33, 0.66, 1];

const axisLabelOffsets: { dx: number; dy: number; anchor: "middle" | "start" | "end" }[] = [
  { dx: 0, dy: -8, anchor: "middle" },     // top
  { dx: 8, dy: -4, anchor: "start" },      // top-right
  { dx: 8, dy: 4, anchor: "start" },       // bottom-right
  { dx: 0, dy: 10, anchor: "middle" },     // bottom
  { dx: -8, dy: 4, anchor: "end" },        // bottom-left
  { dx: -8, dy: -4, anchor: "end" },       // top-left
];

/* ─── Landing ─────────────────────────────────────────────────────────────── */
export default function Home() {
  return (
    <div className="bg-rc-bg text-rc-text font-sans min-h-screen overflow-x-hidden">
      <Navbar />

      {/* ═══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="max-w-[1100px] mx-auto px-5 md:px-[40px] pt-20 pb-20 md:pt-28 md:pb-24">
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
          an AI mock interview — tailored to the exact job.
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Link
            href="/analyze"
            id="hero-cta"
            className="inline-flex items-center gap-2.5 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-7 py-3.5 rounded-xl hover:bg-[#b83332] hover:shadow-[0_8px_28px_rgba(201,58,57,0.28)] active:scale-[0.98] transition-all duration-200 no-underline"
          >
            Analyze my CV — free
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M7.5 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <span className="font-mono text-[11px] text-rc-hint tracking-wide">
            No account required · No data stored
          </span>
        </div>
      </section>

      {/* ═══ DASHBOARD MOCKUP ══════════════════════════════════════════════ */}
      <section className="border-t-[0.5px] border-rc-border bg-rc-surface-hero">
        <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-20 md:py-28">

          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-6 bg-rc-border" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
              What you get
            </span>
          </div>
          <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-10 max-w-[480px]">
            A full diagnostic, not just a score.
          </h2>

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
                    {/* Grid polygons */}
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

                    {/* Axis lines */}
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

                    {/* Skill polygon fill */}
                    <polygon
                      points={RADAR_SKILLS.map((s, i) => {
                        const pt = radarPt(i * 60, s.score * outerR, 110, 120);
                        return `${pt.x},${pt.y}`;
                      }).join(" ")}
                      fill="rgba(201,58,57,0.10)"
                      stroke="#C93A39"
                      strokeWidth="1.5"
                    />

                    {/* Skill dots */}
                    {RADAR_SKILLS.map((s, i) => {
                      const pt = radarPt(i * 60, s.score * outerR, 110, 120);
                      return (
                        <circle key={i} cx={pt.x} cy={pt.y} r="3.5" fill="#C93A39" />
                      );
                    })}

                    {/* Axis labels */}
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

                  {/* Annotation callout */}
                  <div className="absolute top-[30px] right-[-10px] md:right-[-60px] bg-rc-bg border border-rc-red/30 rounded-xl px-3 py-2 max-w-[140px] shadow-sm">
                    <div className="font-mono text-[10px] text-rc-red font-bold mb-0.5">Gap detected</div>
                    <p className="text-[11px] text-rc-muted leading-snug">DevOps at 28% — job requires 60%+</p>
                  </div>
                </div>
              </div>

              {/* Right — Score + metrics */}
              <div className="p-6 flex flex-col gap-5">

                {/* ATS score */}
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

                {/* Missing keywords */}
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

                {/* Red flags preview */}
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
        </div>
      </section>

      {/* ═══ FEATURE STRIP ═════════════════════════════════════════════════ */}
      <section className="border-t-[0.5px] border-rc-border">
        <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-20 md:py-28">

          <div className="flex items-center gap-3 mb-4">
            <div className="h-px w-6 bg-rc-border" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-hint">
              Every tab, a tool
            </span>
          </div>
          <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-14 max-w-[480px]">
            Fix the problem, not just read about it.
          </h2>

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
                  Each missing keyword gets a point value — so you know exactly what to add.
                </p>
              </div>

              {/* Mini demo */}
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
                  One click rewrites the entire CV — injecting keywords, converting passive tone,
                  adding seniority signals. Export a clean PDF.
                </p>
              </div>

              {/* Mini demo — before/after */}
              <div className="bg-rc-bg border border-rc-border rounded-xl p-4 flex flex-col gap-3 text-[12px]">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-rc-hint mb-1.5">Before</p>
                  <p className="text-rc-hint leading-snug line-through">
                    "Responsible for backend development and worked on API features for the platform."
                  </p>
                </div>
                <div className="h-px bg-rc-border" />
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-widest text-rc-green mb-1.5">After</p>
                  <p className="text-rc-text leading-snug">
                    "<strong>Led</strong> backend architecture delivering 4 core REST APIs, reducing P95 latency by <strong>40%</strong> across 200K daily requests."
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
                  A real-time AI interviewer — voice-based, role-specific. Ends with a scored
                  debrief across communication, technical depth, and leadership signals.
                </p>
              </div>

              {/* Mini demo — chat + score */}
              <div className="bg-rc-bg border border-rc-border rounded-xl p-4 flex flex-col gap-3">
                {/* Chat bubble */}
                <div className="flex flex-col gap-2">
                  <div className="bg-rc-surface-hero border border-rc-border rounded-lg px-3 py-2 text-[12px] text-rc-muted leading-snug max-w-[85%]">
                    <span className="font-mono text-[9px] text-rc-red font-bold block mb-0.5">AI</span>
                    "Walk me through a system you designed from scratch. What trade-offs did you make?"
                  </div>
                  <div className="bg-rc-red/5 border border-rc-red/15 rounded-lg px-3 py-2 text-[12px] text-rc-text leading-snug self-end max-w-[85%]">
                    <span className="font-mono text-[9px] text-rc-hint font-bold block mb-0.5">You</span>
                    "I built a real-time notification service handling 50K events/sec..."
                  </div>
                </div>
                {/* Score axes */}
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
        </div>
      </section>

      {/* ═══ QUOTE / CTA ═══════════════════════════════════════════════════ */}
      <section className="border-t-[0.5px] border-rc-border bg-rc-surface">
        <div className="max-w-[1100px] mx-auto px-5 md:px-[40px] py-24 md:py-32 text-center">
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
            Analyze my CV — it&apos;s free
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M7.5 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
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
