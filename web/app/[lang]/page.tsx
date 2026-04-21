"use client";

import Link from "next/link";
import { Navbar } from "../components/Navbar";
import { FadeInSection } from "../components/FadeInSection";
import { useLanguage } from "../../context/language";

/* ─── Highlight helper ────────────────────────────────────────────────────── */
function hl(text: string) {
  const m = text.match(/^([\s\S]*?)\{hl\}([\s\S]*?)\{\/hl\}([\s\S]*)$/);
  if (!m) return <>{text}</>;
  return <>{m[1]}<span className="text-rc-red font-bold">{m[2]}</span>{m[3]}</>;
}

/* ─── Radar chart data ────────────────────────────────────────────────────── */
const RADAR_SKILLS = [
  { label: "React / Frontend", score: 0.85, expected: 0.90 },
  { label: "Node.js / Backend", score: 0.65, expected: 0.75 },
  { label: "System Design", score: 0.42, expected: 0.80 },
  { label: "Testing", score: 0.55, expected: 0.70 },
  { label: "DevOps", score: 0.28, expected: 0.65 },
  { label: "Algorithms", score: 0.70, expected: 0.60 },
];

const INTERVIEW_SCORES = [8.1, 7.4, 6.8];

function radarPt(angle: number, r: number, cx = 100, cy = 100) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

const outerR = 80;
const gridPcts = [0.33, 0.66, 1];

const axisLabelOffsets: { dx: number; dy: number; anchor: "middle" | "start" | "end" }[] = [
  { dx: 0,  dy: -8, anchor: "middle" },
  { dx: 8,  dy: -4, anchor: "start"  },
  { dx: 8,  dy:  4, anchor: "start"  },
  { dx: 0,  dy: 10, anchor: "middle" },
  { dx: -8, dy:  4, anchor: "end"    },
  { dx: -8, dy: -4, anchor: "end"    },
];

function radarPolygon(values: number[], r = 80) {
  return values.map((v, i) => {
    const pt = radarPt(i * 60, v * r, 110, 120);
    return `${pt.x},${pt.y}`;
  }).join(" ");
}

function gridPolygon(pct: number) {
  return Array(6).fill(pct).map((v, i) => {
    const pt = radarPt(i * 60, v * outerR);
    return `${pt.x},${pt.y}`;
  }).join(" ");
}

/* ─── Landing ─────────────────────────────────────────────────────────────── */
export default function Home() {
  const { t, localePath } = useLanguage();
  const mc = t.landing.mockContent;

  return (
    <div className="bg-rc-bg text-rc-text font-sans min-h-screen overflow-x-hidden">
      <Navbar />

      {/* ═══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="max-w-[1100px] mx-auto px-5 md:px-[40px] pt-20 pb-20 md:pt-28 md:pb-24">
        <FadeInSection>
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px w-6 bg-rc-red" />
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-red">
              {t.landing.badge}
            </span>
          </div>

          <h1 className="text-[42px] md:text-[62px] lg:text-[72px] font-semibold leading-[1.08] tracking-[-0.025em] text-rc-text max-w-[800px] mb-3">
            {t.landing.hero.title}
          </h1>
          <p
            className="text-[42px] md:text-[62px] lg:text-[72px] font-semibold leading-[1.08] tracking-[-0.025em] text-rc-red italic mb-8"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            {t.landing.hero.titleItalic}
          </p>

          <p className="text-rc-muted text-[16px] md:text-[17px] leading-[1.7] max-w-[540px] mb-10">
            {t.landing.hero.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link
              href={localePath("/analyze")}
              id="hero-cta"
              className="inline-flex items-center gap-2.5 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-7 py-3.5 rounded-xl hover:bg-[#b83332] hover:shadow-[0_8px_28px_rgba(201,58,57,0.28)] active:scale-[0.98] transition-all duration-200 no-underline"
            >
              {t.landing.hero.cta}
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M7.5 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <span className="font-mono text-[11px] text-rc-hint tracking-wide">
              {t.landing.hero.noDataStored}
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
                {t.landing.sections.whatYouGet}
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-10 max-w-[480px]">
              {hl(t.landing.sections.diagnosticTitle)}
            </h2>
          </FadeInSection>

          <FadeInSection delay={100}>
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

              {/* Tab bar — labels are the same product tab names across locales */}
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
                          : (tab as any).premium
                          ? "border-transparent text-rc-red/70"
                          : "border-transparent text-rc-hint"
                      }`}
                    >
                      {tab.label}
                      {tab.badge && (
                        <span className={`text-[10px] font-bold ${tab.badgeRed ? "text-rc-red" : "text-rc-amber"}`}>
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
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint mb-1">{mc.radar.title}</p>
                    <p className="text-[13px] text-rc-muted">{mc.radar.subtitle}</p>
                  </div>

                  <div className="relative">
                    <svg viewBox="0 0 220 240" width="340" height="360" className="overflow-visible">
                      {gridPcts.map((pct) => (
                        <polygon key={pct} points={gridPolygon(pct)} transform="translate(10, 20)" fill="none" stroke="#d4cfc9" strokeWidth="0.75" />
                      ))}
                      {RADAR_SKILLS.map((_, i) => {
                        const outer = radarPt(i * 60, outerR, 110, 120);
                        return <line key={i} x1="110" y1="120" x2={outer.x} y2={outer.y} stroke="#d4cfc9" strokeWidth="0.75" />;
                      })}
                      <polygon points={radarPolygon(RADAR_SKILLS.map((s) => s.expected))} fill="rgba(100,116,139,0.08)" stroke="#94a3b8" strokeWidth="1.25" strokeDasharray="4 3" />
                      <polygon points={radarPolygon(RADAR_SKILLS.map((s) => s.score))} fill="rgba(201,58,57,0.10)" stroke="#C93A39" strokeWidth="1.5" />
                      {RADAR_SKILLS.map((s, i) => {
                        const pt = radarPt(i * 60, s.score * outerR, 110, 120);
                        return <circle key={i} cx={pt.x} cy={pt.y} r="3.5" fill="#C93A39" />;
                      })}
                      {RADAR_SKILLS.map((s, i) => {
                        const outer = radarPt(i * 60, outerR + 18, 110, 120);
                        const off = axisLabelOffsets[i];
                        const score = Math.round(s.score * 100);
                        const scoreColor = score >= 70 ? "#3d6114" : score >= 50 ? "#8a5700" : "#C93A39";
                        return (
                          <g key={i}>
                            <text x={outer.x + off.dx} y={outer.y + off.dy} textAnchor={off.anchor} fontSize="9" fill="#6b6860" fontFamily="monospace">{s.label}</text>
                            <text x={outer.x + off.dx} y={outer.y + off.dy + 11} textAnchor={off.anchor} fontSize="9" fontWeight="700" fill={scoreColor} fontFamily="monospace">{score}%</text>
                          </g>
                        );
                      })}
                    </svg>

                    <div className="absolute top-[30px] right-[-10px] md:right-[-60px] bg-rc-bg border border-rc-red/30 rounded-xl px-3 py-2 max-w-[140px] shadow-sm">
                      <div className="font-mono text-[10px] text-rc-red font-bold mb-0.5">{mc.radar.gapDetected}</div>
                      <p className="text-[11px] text-rc-muted leading-snug">{mc.radar.gapDetail}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-5">
                    <div className="flex items-center gap-1.5">
                      <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke="#C93A39" strokeWidth="2" /></svg>
                      <span className="font-mono text-[9px] text-rc-muted uppercase tracking-wider">{mc.radar.yourProfile}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 3" /></svg>
                      <span className="font-mono text-[9px] text-rc-muted uppercase tracking-wider">{mc.radar.jobRequirements}</span>
                    </div>
                  </div>
                </div>

                {/* Right — Score + metrics */}
                <div className="p-6 flex flex-col gap-5">
                  <div className="bg-rc-red/5 border border-rc-red/20 rounded-xl p-4">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-rc-red mb-2">{mc.radar.atsLabel}</p>
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-[40px] font-bold text-rc-red leading-none">34</span>
                      <span className="text-[18px] text-rc-hint mb-1">/100</span>
                    </div>
                    <div className="h-1.5 bg-rc-border rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-rc-red rounded-full" style={{ width: "34%" }} />
                    </div>
                    <p className="font-mono text-[10px] text-rc-red">{mc.radar.atsWouldNotPass}</p>
                  </div>

                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-rc-hint mb-2">{mc.radar.missingKeywords}</p>
                    <div className="flex flex-col gap-1.5">
                      {[
                        { kw: "microservices", pts: "+12 pts", freq: "5× in JD" },
                        { kw: "Docker",        pts: "+9 pts",  freq: "4× in JD" },
                        { kw: "CI/CD",         pts: "+8 pts",  freq: "3× in JD" },
                        { kw: "TypeScript",    pts: "+7 pts",  freq: "6× in JD" },
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
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-rc-hint mb-2">{mc.radar.redFlagsLabel}</p>
                    <div className="flex flex-col gap-1.5">
                      {(mc.radar.redFlagItems as string[]).map((f) => (
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
                {t.landing.sections.beyondCv}
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-3 max-w-[520px]">
              {hl(t.landing.sections.beyondTitle)}
            </h2>
            <p className="text-rc-hint text-[15px] md:text-[16px] leading-[1.7] max-w-[500px] mb-12">
              {t.landing.sections.beyondDesc}
            </p>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* GitHub card */}
            <FadeInSection delay={0}>
              <div className="rounded-2xl border border-rc-border bg-rc-surface overflow-hidden h-full">
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
                    {(mc.github.badges as string[]).map((s) => (
                      <span key={s} className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 bg-rc-green/5 text-rc-green border border-rc-green/20">
                        <span className="w-1 h-1 rounded-full bg-rc-green" />{s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="divide-y divide-rc-border/30">
                  {(mc.github.issues as { severity: string; label: string; detail: string }[]).map((issue) => (
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
                    {(mc.linkedin.badges as string[]).map((s) => (
                      <span key={s} className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 bg-rc-green/5 text-rc-green border border-rc-green/20">
                        <span className="w-1 h-1 rounded-full bg-rc-green" />{s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="divide-y divide-rc-border/30">
                  {(mc.linkedin.issues as { severity: string; label: string; detail: string }[]).map((issue) => (
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
                {t.landing.sections.everyTab}
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-14 max-w-[480px]">
              {hl(t.landing.sections.fixTitle)}
            </h2>
          </FadeInSection>

          <FadeInSection delay={80}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-rc-border border border-rc-border rounded-2xl overflow-hidden">

              {/* ── ATS Filter ── */}
              <div className="bg-rc-surface p-7 flex flex-col gap-5">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rc-surface-hero border border-rc-border mb-4">
                    <span className="font-mono text-[10px] text-rc-hint tracking-widest uppercase">{mc.atsCard.label}</span>
                  </div>
                  <h3 className="text-[17px] font-semibold text-rc-text mb-2 tracking-[-0.01em]">{mc.atsCard.title}</h3>
                  <p className="text-[13px] text-rc-hint leading-[1.7]">{mc.atsCard.desc}</p>
                </div>

                <div className="bg-rc-bg border border-rc-border rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-rc-hint uppercase tracking-widest">{mc.atsCard.scoreLabel}</span>
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
                    <span className="font-mono text-[10px] text-rc-hint tracking-widest uppercase">{mc.rewriteCard.label}</span>
                  </div>
                  <h3 className="text-[17px] font-semibold text-rc-text mb-2 tracking-[-0.01em]">{mc.rewriteCard.title}</h3>
                  <p className="text-[13px] text-rc-hint leading-[1.7]">{mc.rewriteCard.desc}</p>
                </div>

                <div className="bg-rc-bg border border-rc-border rounded-xl p-4 flex flex-col gap-3 text-[12px]">
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-rc-hint mb-1.5">{mc.rewriteCard.before}</p>
                    <p className="text-rc-hint leading-snug line-through">{mc.rewriteCard.beforeText}</p>
                  </div>
                  <div className="h-px bg-rc-border" />
                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-widest text-rc-green mb-1.5">{mc.rewriteCard.after}</p>
                    <p className="text-rc-text leading-snug">
                      &ldquo;<strong>{(mc.rewriteCard.afterText as string).split(" ")[0]}</strong>{" "}
                      {(mc.rewriteCard.afterText as string).split(" ").slice(1).join(" ")}&rdquo;
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
                    <span className="font-mono text-[10px] text-rc-hint tracking-widest uppercase">{mc.interviewCard.label}</span>
                  </div>
                  <h3 className="text-[17px] font-semibold text-rc-text mb-2 tracking-[-0.01em]">{mc.interviewCard.title}</h3>
                  <p className="text-[13px] text-rc-hint leading-[1.7]">{mc.interviewCard.desc}</p>
                </div>

                <div className="bg-rc-bg border border-rc-border rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <div className="bg-rc-surface-hero border border-rc-border rounded-lg px-3 py-2 text-[12px] text-rc-muted leading-snug max-w-[85%]">
                      <span className="font-mono text-[9px] text-rc-red font-bold block mb-0.5">{mc.interviewCard.aiLabel}</span>
                      {mc.interviewCard.aiQuestion}
                    </div>
                    <div className="bg-rc-red/5 border border-rc-red/15 rounded-lg px-3 py-2 text-[12px] text-rc-text leading-snug self-end max-w-[85%]">
                      <span className="font-mono text-[9px] text-rc-hint font-bold block mb-0.5">{mc.interviewCard.youLabel}</span>
                      {mc.interviewCard.youAnswer}
                    </div>
                  </div>
                  <div className="border-t border-rc-border pt-3 flex flex-col gap-1.5">
                    {(mc.interviewCard.axes as string[]).map((label, idx) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className="text-[11px] text-rc-hint w-[110px] shrink-0">{label}</span>
                        <div className="flex-1 h-1 bg-rc-border rounded-full">
                          <div className="h-full bg-rc-green rounded-full" style={{ width: `${INTERVIEW_SCORES[idx] * 10}%` }} />
                        </div>
                        <span className="font-mono text-[11px] text-rc-text font-bold w-[28px] text-right">{INTERVIEW_SCORES[idx]}</span>
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
                {t.landing.sections.bridgeLabel}
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-3 max-w-[540px]">
              {hl(t.landing.sections.bridgeTitle)}
            </h2>
            <p className="text-rc-hint text-[15px] md:text-[16px] leading-[1.7] max-w-[500px] mb-12">
              {t.landing.sections.bridgeDesc}
            </p>
          </FadeInSection>

          <FadeInSection delay={100}>
            <div className="rounded-2xl border border-rc-border bg-rc-surface overflow-hidden relative">

              <div className="bg-rc-surface-hero border-b border-rc-border px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-1 h-5 bg-rc-red rounded-full" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-hint">{mc.bridge.headerLabel}</span>
                </div>
                <span className="font-mono text-[10px] text-rc-amber font-bold px-2 py-0.5 border border-rc-amber/30 bg-rc-amber/5">{mc.bridge.level}</span>
              </div>

              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
                <div className="flex flex-col gap-5">
                  <div>
                    <h3 className="text-[20px] md:text-[22px] font-semibold text-rc-text mb-3 tracking-tight leading-tight">
                      {mc.bridge.projectTitle}
                    </h3>
                    <p className="text-[14px] text-rc-muted leading-[1.75]">{mc.bridge.projectDesc}</p>
                  </div>

                  <div className="bg-rc-surface-hero border border-rc-border rounded-xl p-5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-rc-red rounded-l-xl" />
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-rc-red font-bold mb-3">{mc.bridge.architectureLabel}</p>
                    <p className="font-mono text-[12px] text-rc-muted leading-relaxed">{mc.bridge.architectureText}</p>
                  </div>

                  <div>
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-rc-hint font-bold mb-3">{mc.bridge.whatToBuildLabel}</p>
                    <div className="flex flex-col gap-2">
                      {(mc.bridge.whatToBuild as string[]).map((feature, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3.5 bg-rc-surface-hero border border-rc-border rounded-lg"
                          style={i >= 2 ? { filter: "blur(3px)", userSelect: "none" } : {}}
                        >
                          <span className="font-mono text-[11px] text-rc-hint w-5 text-right shrink-0 mt-0.5">{i + 1}.</span>
                          <span className="text-[13px] text-rc-text leading-snug">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-5">
                  <div className="bg-rc-surface-hero border border-rc-border rounded-xl p-5">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-rc-hint font-bold mb-3">{mc.bridge.coreStackLabel}</p>
                    <div className="flex flex-wrap gap-2">
                      {["Docker", "Kubernetes", "Kafka", "TypeScript", "Node.js", "Redis", "PostgreSQL", "GitHub Actions"].map((tech) => (
                        <span key={tech} className="px-2.5 py-1 bg-rc-surface border border-rc-border font-mono text-[11px] text-rc-text rounded">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-rc-surface-hero border border-rc-border rounded-xl p-5">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-rc-amber font-bold mb-3">{mc.bridge.advancedLabel}</p>
                    <div className="flex flex-wrap gap-2">
                      {["Event Sourcing", "CQRS", "Circuit Breaker", "Saga Pattern"].map((c) => (
                        <span key={c} className="px-2.5 py-1 bg-rc-amber/5 border border-rc-amber/20 font-mono text-[11px] text-rc-amber rounded">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-rc-surface-hero border border-rc-border rounded-xl p-5 flex flex-col gap-2">
                    <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-rc-green font-bold mb-1">{mc.bridge.successLabel}</p>
                    {(mc.bridge.success as string[]).map((c) => (
                      <div key={c} className="flex items-start gap-2">
                        <span className="text-rc-green text-[11px] shrink-0 mt-0.5">✓</span>
                        <span className="text-[12px] text-rc-muted leading-snug">{c}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-rc-surface to-transparent pointer-events-none" />
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-6 border-t border-rc-border bg-rc-surface-hero text-center">
                  <p className="font-mono text-[11px] text-rc-hint tracking-wide">
                    ✦ {t.landing.sections.bridgePremiumNote}
                  </p>
                  <Link
                    href={localePath("/pricing")}
                    className="inline-flex items-center gap-2 bg-rc-red text-white font-mono text-[11px] tracking-[0.12em] uppercase px-5 py-2.5 rounded-lg hover:bg-[#b83332] hover:shadow-[0_6px_20px_rgba(201,58,57,0.25)] active:scale-[0.98] transition-all duration-200 no-underline"
                  >
                    {t.landing.sections.bridgeCta}
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
                {t.landing.sections.coverLabel}
              </span>
            </div>
            <h2 className="text-[26px] md:text-[34px] font-semibold leading-[1.15] tracking-[-0.02em] text-rc-text mb-3 max-w-[520px]">
              {t.landing.sections.coverTitle}
            </h2>
            <p className="text-rc-hint text-[15px] md:text-[16px] leading-[1.7] max-w-[500px] mb-12">
              {t.landing.sections.coverDesc}
            </p>
          </FadeInSection>

          <FadeInSection delay={100}>
            <div className="rounded-2xl border border-rc-border bg-rc-surface overflow-hidden">
              <div className="bg-rc-surface-hero border-b border-rc-border px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg width="14" height="16" viewBox="0 0 14 16" fill="none" className="text-rc-hint">
                    <rect x="0.5" y="0.5" width="13" height="15" rx="1.5" stroke="currentColor" strokeWidth="1"/>
                    <line x1="3" y1="5" x2="11" y2="5" stroke="currentColor" strokeWidth="1"/>
                    <line x1="3" y1="8" x2="11" y2="8" stroke="currentColor" strokeWidth="1"/>
                    <line x1="3" y1="11" x2="8" y2="11" stroke="currentColor" strokeWidth="1"/>
                  </svg>
                  <span className="font-mono text-[11px] text-rc-hint">{mc.coverLetter.headerLabel}</span>
                </div>
                <span className="font-mono text-[10px] text-rc-red font-bold tracking-widest">✦ Premium</span>
              </div>

              <div className="relative">
                <div className="px-8 md:px-12 py-8 max-w-[720px] mx-auto">
                  <p className="text-[13px] text-rc-hint font-mono mb-6">{mc.coverLetter.date}</p>
                  <p className="text-[15px] text-rc-muted leading-[1.8] mb-5">{mc.coverLetter.greeting}</p>
                  <p className="text-[15px] text-rc-text leading-[1.85] mb-5">{mc.coverLetter.p1}</p>
                  <p className="text-[15px] text-rc-text leading-[1.85] mb-5">{mc.coverLetter.p2}</p>
                  <p className="text-[15px] text-rc-muted leading-[1.85]">{mc.coverLetter.p3}</p>
                </div>

                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-rc-surface via-rc-surface/90 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end pb-8 gap-3 text-center">
                  <p className="font-mono text-[11px] text-rc-hint tracking-wide">
                    ✦ {t.landing.sections.coverPremiumNote}
                  </p>
                  <Link
                    href={localePath("/pricing")}
                    className="inline-flex items-center gap-2 bg-rc-red text-white font-mono text-[11px] tracking-[0.12em] uppercase px-5 py-2.5 rounded-lg hover:bg-[#b83332] hover:shadow-[0_6px_20px_rgba(201,58,57,0.25)] active:scale-[0.98] transition-all duration-200 no-underline"
                  >
                    {t.landing.sections.coverCta}
                    <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                      <path d="M2 7h10M7.5 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              </div>

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
                {t.landing.quote.line1}{" "}
                <span className="text-rc-red italic" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>{t.landing.quote.word}</span>,
                <br />
                {t.landing.quote.line2}
              </p>
            </blockquote>

            <p className="font-mono text-[13px] md:text-[14px] tracking-[0.06em] text-rc-hint mb-10">
              {t.landing.quote.subtitle}
            </p>

            <Link
              href={localePath("/analyze")}
              id="quote-cta"
              className="inline-flex items-center gap-2.5 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-8 py-4 rounded-xl hover:bg-[#b83332] hover:shadow-[0_8px_28px_rgba(201,58,57,0.28)] active:scale-[0.98] transition-all duration-200 no-underline"
            >
              {t.landing.quote.cta}
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M7.5 3l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </FadeInSection>
        </div>
      </section>

      {/* ═══ FOOTER ════════════════════════════════════════════════════════ */}
      <footer className="border-t-[0.5px] border-rc-border py-6 px-5 md:px-[40px] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="font-mono text-[13px] text-rc-muted">{t.landing.footer.copyright}</div>
        <div className="flex gap-6">
          <Link href={localePath("/privacy")} className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline cursor-pointer transition-colors hover:text-rc-text">
            {t.landing.footer.privacy} (GDPR)
          </Link>
          <a href="#" className="font-mono text-[11px] tracking-[0.05em] text-rc-muted no-underline cursor-pointer transition-colors hover:text-rc-text">
            {t.landing.footer.terms}
          </a>
        </div>
      </footer>
      <a href="https://www.producthunt.com/products/rejectcheck?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-rejectcheck" target="_blank" rel="noopener noreferrer" className="fixed bottom-4 right-4 z-50">
        <img alt="RejectCheck - Find out why you got rejected, before you do | Product Hunt" width="250" height="54" src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1128865&theme=light&t=1776772520938" />
      </a>
    </div>
  );
}
