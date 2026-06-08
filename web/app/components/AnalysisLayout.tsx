"use client";

import { useState, useEffect } from "react";
import type { AnalysisResult } from "./types";
import { TechnicalRadarChart } from "./TechnicalRadarChart";
import { AtsTab } from "./tabs/AtsTab";
import { CvAnalysisTab } from "./tabs/CvAnalysisTab";
import { FlagsTab } from "./tabs/FlagsTab";
import { SignalsTab } from "./tabs/SignalsTab";
import { ConsistencyTab } from "./tabs/ConsistencyTab";
import { RoadmapTab } from "./tabs/RoadmapTab";
import { BridgeTab } from "./tabs/BridgeTab";
import { ProjectTab } from "./tabs/ProjectTab";
import { NegotiationTab } from "./tabs/NegotiationTab";
import { ImproveTab } from "./tabs/ImproveTab";
import { CoverLetterTab } from "./tabs/CoverLetterTab";
import { ProjectRecommendationSkeleton } from "./skeletons/ProjectRecommendationSkeleton";
import { AI_INTERVIEW_ENABLED } from "../../lib/features";
import { InterviewTab } from "./tabs/InterviewTab";

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColor(n: number): string {
  if (n >= 70) return "var(--rc-red)";
  if (n >= 40) return "var(--rc-amber)";
  return "var(--rc-green)";
}

function verdictLabel(n: number): string {
  if (n >= 70) return "Critical risk";
  if (n >= 50) return "High risk";
  if (n >= 35) return "Moderate risk";
  if (n >= 15) return "Low risk";
  return "Excellent match";
}

function tierStyle(score: number): { bg: string; border: string } {
  if (score >= 70) return { bg: "var(--rc-red-bg)",   border: "var(--rc-red-border)" };
  if (score >= 40) return { bg: "var(--rc-amber-bg)", border: "var(--rc-amber-border)" };
  return              { bg: "var(--rc-green-bg)",  border: "var(--rc-green-border)" };
}

// ── Types ─────────────────────────────────────────────────────────────────────

type MainTab = "match" | "cv" | "signals" | "timeline" | "plan";
type PlanPane = "roadmap" | "bridge" | "negotiate";

export type AnalysisLayoutProps = {
  result: AnalysisResult;
  analysisId: number | null;
  cvBlobUrl: string | null;
  deepStatus: "pending" | "failed" | "ready";
  isPremium: boolean;
  userPlan?: "free" | "shortlisted" | "hired";
  onReset: () => void;
  reconstructedCv?: string | null;
  isRewriting?: boolean;
  onRewrite?: () => void;
  email?: string | null;
  accessToken?: string | null;
  completedSteps?: number[];
};

// ── Component ─────────────────────────────────────────────────────────────────

export function AnalysisLayout({
  result,
  analysisId,
  cvBlobUrl,
  deepStatus,
  isPremium,
  userPlan = "free",
  onReset,
  reconstructedCv,
  isRewriting = false,
  onRewrite,
  email,
  accessToken,
  completedSteps,
}: AnalysisLayoutProps) {
  const [activeTab, setActiveTab] = useState<MainTab>("match");
  const [activePlan, setActivePlan] = useState<PlanPane>("roadmap");
  const [checkedKeywords, setCheckedKeywords] = useState<Set<string>>(new Set());
  const [scoreDisplay, setScoreDisplay] = useState(0);
  const [barGo, setBarGo] = useState(false);

  useEffect(() => {
    const target = result.score;
    const dur = 1400;
    let start: number | null = null;
    let raf: number;
    function tick(t: number) {
      if (start === null) start = t;
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setScoreDisplay(Math.round(target * e));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    const barTimer = setTimeout(() => setBarGo(true), 300);
    return () => { cancelAnimationFrame(raf); clearTimeout(barTimer); };
  }, [result.score]);

  const color = scoreColor(result.score);
  const tier  = tierStyle(result.score);
  const hasShortlisted = userPlan === "shortlisted" || userPlan === "hired";
  const hasHired = userPlan === "hired";
  const role    = result.job_details?.title ?? "";
  const company = result.job_details?.company ?? "";

  // Stat cards (vs-job analyses only)
  const statCards = result.breakdown
    ? [
        { label: "Keywords",   value: result.breakdown.keyword_match,    threshold: 65 },
        { label: "Tech stack", value: result.breakdown.tech_stack_fit,   threshold: 70 },
        { label: "Experience", value: result.breakdown.experience_level, threshold: 60 },
        { label: "GitHub",     value: result.breakdown.github_signal,    threshold: 70 },
        { label: "LinkedIn",   value: result.breakdown.linkedin_signal,  threshold: 70 },
      ]
    : [];

  // Tab badge counts
  const matchBadge =
    (result.ats_simulation && !result.ats_simulation.would_pass ? 1 : 0) +
    (result.audit.jd_match?.required_skills.filter((s) => !s.found).length ?? 0);
  const cvBadge = result.audit.cv.issues.filter((i) => i.severity === "critical").length;
  const signalsBadge =
    (result.audit.github?.issues.length ?? 0) +
    (result.audit.linkedin?.issues.length ?? 0);
  const timelineBadge =
    result.cross_profile_inconsistencies?.filter((i) => i.severity === "critical").length ?? 0;

  const TABS: { id: MainTab; label: string; badge: number; badgeClass: string }[] = [
    { id: "match",    label: "Match",    badge: matchBadge,    badgeClass: "" },
    { id: "cv",       label: "CV",       badge: cvBadge,       badgeClass: "" },
    { id: "signals",  label: "Signals",  badge: signalsBadge,  badgeClass: "amber" },
    { id: "timeline", label: "Timeline", badge: timelineBadge, badgeClass: "" },
    { id: "plan",     label: "Plan",     badge: 0,             badgeClass: "" },
  ];

  const PLAN_PANES: { id: PlanPane; label: string }[] = [
    { id: "roadmap",   label: "Roadmap" },
    { id: "bridge",    label: "Bridge ✦" },
    { id: "negotiate", label: "Negotiate" },
  ];

  return (
    <div className="flex-1 flex overflow-hidden">

      {/* ── Left panel — CV PDF ── */}
      <div className="w-[44%] flex-shrink-0 flex flex-col border-r border-rc-border overflow-hidden bg-rc-surface-hero">
        {/* Panel label */}
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 border-b border-rc-border font-mono text-[10px] uppercase tracking-[0.12em] text-rc-hint">
          <span>Your CV</span>
          {role && (
            <>
              <span className="opacity-30">·</span>
              <span className="text-rc-text font-semibold">
                {role}{company ? ` @ ${company}` : ""}
              </span>
            </>
          )}
        </div>

        {/* PDF or empty state */}
        {cvBlobUrl ? (
          <iframe
            src={cvBlobUrl}
            className="flex-1 border-0 w-full"
            title="CV preview"
          />
        ) : (
          <div className="flex-1 flex items-center justify-center font-mono text-[11px] text-rc-hint uppercase tracking-[0.08em]">
            No CV preview available
          </div>
        )}
      </div>

      {/* ── Right panel — Analysis ── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* ── Score hero ── */}
        <div className="flex-shrink-0 flex items-stretch border-b border-rc-border bg-rc-surface">

          {/* Score + tier badge */}
          <div className="flex flex-col justify-center px-5 py-4 border-r border-rc-border/60" style={{ minWidth: 176 }}>
            <div className="flex items-baseline gap-1 mb-1">
              <span
                className="font-mono font-bold text-[52px] leading-none tabular-nums"
                style={{ color }}
              >
                {scoreDisplay}
              </span>
              <span className="font-mono text-[20px] leading-none" style={{ color, opacity: 0.4 }}>
                %
              </span>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-rc-hint mb-3">
              rejection risk
            </span>
            <span
              className="inline-flex items-center gap-1.5 self-start font-mono text-[10px] uppercase font-bold tracking-[0.06em] px-2.5 py-1 border"
              style={{ color, background: tier.bg, borderColor: tier.border }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: color }}
              />
              {verdictLabel(result.score)}
            </span>
            {result.confidence?.reason && (
              <p className="text-[12px] text-rc-muted leading-relaxed mt-2.5 pr-2 max-w-[180px]">
                {result.confidence.reason}
              </p>
            )}
          </div>

          {/* Stat mini-rows */}
          {statCards.length > 0 && (
            <div className="flex-1 flex flex-col justify-center px-5 py-4 gap-[9px] min-w-0">
              {statCards.map((card) => {
                const pass = card.value !== null && card.value >= card.threshold;
                const cardColor = card.value === null
                  ? "var(--rc-hint)"
                  : pass ? "var(--rc-green)" : "var(--rc-red)";
                return (
                  <div key={card.label} className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-rc-hint flex-shrink-0 truncate" style={{ width: 74 }}>
                      {card.label}
                    </span>
                    <span
                      className="font-mono text-[11px] font-bold tabular-nums flex-shrink-0 text-right"
                      style={{ color: cardColor, width: 26 }}
                    >
                      {card.value !== null ? card.value : "—"}
                    </span>
                    <div className="flex-1 relative min-w-0" style={{ height: 5 }}>
                      <div className="absolute inset-0 bg-rc-border/40" />
                      {card.value !== null && (
                        <div
                          className="absolute inset-y-0 left-0 transition-all duration-700"
                          style={{ background: cardColor, width: barGo ? `${Math.min(100, card.value)}%` : "0%" }}
                        />
                      )}
                      {/* Threshold tick */}
                      <div
                        className="absolute bg-rc-text/20"
                        style={{ left: `${card.threshold}%`, top: -3, width: 2, height: 11, transform: "translateX(-1px)" }}
                      />
                    </div>
                    <span
                      className="font-mono text-[10px] font-bold flex-shrink-0 text-center"
                      style={{ color: cardColor, width: 14 }}
                    >
                      {card.value !== null ? (pass ? "✓" : "✗") : "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Tab bar ── */}
        <div className="rp-tab-bar">
          {TABS.map(({ id, label, badge, badgeClass }) => (
            <button
              key={id}
              className={`rp-tab${activeTab === id ? " active" : ""}`}
              onClick={() => setActiveTab(id)}
            >
              {label}
              {badge > 0 && (
                <span className={`rp-tab-badge${badgeClass ? " " + badgeClass : ""}`}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin" }}>

          {/* Match */}
          {activeTab === "match" && (
            <div className="p-6">
              <TechnicalRadarChart data={result.technical_analysis} />
              {result.ats_simulation && (
                <div className="mt-7">
                  <AtsTab
                    ats={result.ats_simulation}
                    checkedKeywords={checkedKeywords}
                    onToggle={(kw) =>
                      setCheckedKeywords((prev) => {
                        const next = new Set(prev);
                        next.has(kw) ? next.delete(kw) : next.add(kw);
                        return next;
                      })
                    }
                    onReset={onReset}
                  />
                </div>
              )}
            </div>
          )}

          {/* CV */}
          {activeTab === "cv" && (
            <div className="p-6 flex flex-col gap-7">
              <CvAnalysisTab result={result} fixesReady={deepStatus === "ready"} />
              <FlagsTab
                flags={result.hidden_red_flags}
                jdMatch={result.audit.jd_match}
                score={result.score}
                verdict={result.verdict}
                confidence={result.confidence}
                breakdown={result.breakdown}
                fixesReady={deepStatus === "ready"}
              />
              {hasShortlisted && (
                <ImproveTab
                  reconstructedCv={reconstructedCv ?? null}
                  isLoading={isRewriting}
                  isPremium={true}
                  hasAnalysisId={!!analysisId}
                  onRewrite={onRewrite ?? (() => {})}
                />
              )}
              {hasShortlisted && (
                <CoverLetterTab
                  analysisId={analysisId}
                  isPremium={true}
                  company={result.job_details?.company ?? null}
                  candidateName={null}
                  savedCoverLetter={null}
                />
              )}
            </div>
          )}

          {/* Signals */}
          {activeTab === "signals" && (
            <div className="p-6">
              <SignalsTab
                github={result.audit.github}
                linkedin={result.audit.linkedin}
                hasGithub={result.audit.github.score !== null || result.audit.github.issues.length > 0}
                hasLinkedin={result.audit.linkedin.score !== null || result.audit.linkedin.issues.length > 0}
              />
            </div>
          )}

          {/* Timeline */}
          {activeTab === "timeline" && (
            <div className="p-6">
              <ConsistencyTab
                inconsistencies={result.cross_profile_inconsistencies ?? []}
                timelineEntries={result.timeline_entries ?? []}
              />
            </div>
          )}

          {/* Plan */}
          {activeTab === "plan" && (
            <div>
              {/* Sub-nav */}
              <div className="flex gap-1.5 px-5 py-3 border-b border-rc-border">
                {PLAN_PANES.map(({ id, label }) => (
                  <button
                    key={id}
                    className={`plan-subnav-btn${activePlan === id ? " active" : ""}`}
                    onClick={() => setActivePlan(id)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activePlan === "roadmap" && <RoadmapTab result={result} />}

                {activePlan === "bridge" && (
                  <>
                    {result.project_recommendation ? (
                      hasShortlisted ? (
                        <BridgeTab
                          result={result}
                          analysisId={analysisId}
                          completedSteps={completedSteps}
                        />
                      ) : (
                        <ProjectTab project={result.project_recommendation} />
                      )
                    ) : deepStatus === "pending" ? (
                      <ProjectRecommendationSkeleton />
                    ) : (
                      <div className="py-12 text-center font-sans text-[14px] text-rc-hint">
                        Bridge project not available.
                      </div>
                    )}
                  </>
                )}

                {activePlan === "negotiate" && (
                  hasHired ? (
                    <NegotiationTab
                      result={result}
                      analysisId={analysisId}
                      isPremium={true}
                    />
                  ) : (
                    <div className="py-12 text-center font-sans text-[14px] text-rc-hint">
                      Negotiation analysis available on the Hired plan.
                    </div>
                  )
                )}

                {activePlan === "bridge" && AI_INTERVIEW_ENABLED && hasHired && (
                  <div className="mt-8">
                    <InterviewTab
                      isPremium={true}
                      analysisId={analysisId}
                      email={email ?? null}
                      accessToken={accessToken ?? null}
                      defaultInterviewId={null}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
