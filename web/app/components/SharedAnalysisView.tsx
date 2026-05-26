"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, X } from "lucide-react";
import type { AnalysisResult } from "./types";
import { ScoreSidebar } from "./ScoreSidebar";
import { TechnicalRadarChart } from "./TechnicalRadarChart";
import { AtsTab } from "./tabs/AtsTab";
import { CvAnalysisTab } from "./tabs/CvAnalysisTab";
import { CvReviewTab } from "./tabs/CvReviewTab";
import { SignalsTab } from "./tabs/SignalsTab";
import { FlagsTab } from "./tabs/FlagsTab";
import { RoadmapTab } from "./tabs/RoadmapTab";
import { BridgeTab } from "./tabs/BridgeTab";
import { ConsistencyTab } from "./tabs/ConsistencyTab";
import { NegotiationTab } from "./tabs/NegotiationTab";
import { useLanguage } from "../../context/language";

type Tab =
  | "overview"
  | "ats"
  | "cv-analysis"
  | "signals"
  | "flags"
  | "consistency"
  | "negotiation"
  | "roadmap"
  | "project";

type Props = {
  result: AnalysisResult;
  jobLabel: string | null;
  company: string | null;
  profile: { displayName: string | null; avatarUrl: string | null } | null;
  lang: string;
};

export function SharedAnalysisView({ result, jobLabel, company, profile, lang }: Props) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const isCvReview = !!result.cv_quality;
  const noop = () => {};

  const displayName = profile?.displayName ?? "Someone";
  const avatarUrl = profile?.avatarUrl ?? null;
  const initials = displayName.slice(0, 2).toUpperCase();

  const positionLabel = [jobLabel, company].filter(Boolean).join(" @ ");

  const consistencyTab =
    result.cross_profile_inconsistencies &&
    result.cross_profile_inconsistencies.length > 0
      ? [
          {
            id: "consistency" as const,
            label: t.tabs.consistency,
            badge: String(result.cross_profile_inconsistencies.length),
            badgeClass: result.cross_profile_inconsistencies.some(
              (i) => i.severity === "critical"
            )
              ? "text-rc-red"
              : result.cross_profile_inconsistencies.some(
                    (i) => i.severity === "major"
                  )
                ? "text-rc-amber"
                : "text-rc-muted",
          },
        ]
      : [];

  const tabs = result
    ? ([
        { id: "overview", label: t.tabs.skillGap },
        {
          id: "ats",
          label: t.tabs.atsFilter,
          badge: result.ats_simulation?.would_pass ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <X className="w-3.5 h-3.5" />
          ),
          badgeClass: result.ats_simulation?.would_pass
            ? "text-rc-green"
            : "text-rc-red",
        },
        {
          id: "cv-analysis",
          label: t.tabs.cvAnalysis,
          badge: String(result.audit.cv.issues.length),
          badgeClass: "text-rc-amber",
        },
        {
          id: "signals",
          label: t.tabs.signals,
          badge: String(result.audit.github.issues.length + result.audit.linkedin.issues.length),
          badgeClass: "text-rc-amber",
        },
        {
          id: "flags",
          label: t.tabs.redFlags,
          badge: String(result.hidden_red_flags.length),
          badgeClass: "text-rc-red",
        },
        ...consistencyTab,
        { id: "negotiation", label: t.tabs.negotiation, badge: "✦", badgeClass: "text-rc-red" },
        { id: "roadmap", label: t.tabs.roadmap, badge: null, badgeClass: "" },
        { id: "project", label: t.tabs.project, badge: null, badgeClass: "" },
      ] as const)
    : [];

  return (
    <div className="bg-rc-bg text-rc-text font-sans min-h-screen flex flex-col overflow-x-hidden">
      {/* Share header */}
      <div className="border-b border-rc-border bg-rc-surface px-5 md:px-[32px] py-5">
        <div className="max-w-[1600px] mx-auto flex items-center gap-4">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={40}
              height={40}
              className="rounded-full object-cover w-10 h-10 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-rc-red/10 border border-rc-red/30 flex items-center justify-center shrink-0">
              <span className="font-mono text-[13px] font-bold text-rc-red">{initials}</span>
            </div>
          )}
          {isCvReview ? (
            <p className="font-mono text-[13px] text-rc-text leading-snug">
              <span className="font-bold">{displayName}</span>
              {" "}{t.share.cvScorePhrase}{" "}
              <span className={`font-bold ${result.cv_quality!.overall >= 70 ? "text-rc-green" : result.cv_quality!.overall >= 40 ? "text-rc-amber" : "text-rc-red"}`}>
                {result.cv_quality!.overall}%
              </span>
            </p>
          ) : (
            <p className="font-mono text-[13px] text-rc-text leading-snug">
              <span className="font-bold">{displayName}</span>
              {" "}{t.share.rejectionPhrase}{" "}
              <span className={`font-bold ${result.score >= 70 ? "text-rc-red" : result.score >= 40 ? "text-rc-amber" : "text-rc-green"}`}>
                {result.score}% {t.share.rejectionSuffix}
              </span>
              {positionLabel && (
                <> {t.share.rejectionFor} <span className="text-rc-hint">{positionLabel}</span></>
              )}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-[1600px] w-[92%] mx-auto pt-9 pb-[80px] px-5 md:px-[32px]">
        {isCvReview ? (
          <CvReviewTab result={result} />
        ) : (
          <>
            <ScoreSidebar
              result={result}
              onReset={noop}
              onExportMd={noop}
              onExportPdf={noop}
              readOnly
            />

            {/* Tab nav */}
            <div className="mb-8 border-b border-rc-border">
              <div className="tabs-scrollbar flex overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`shrink-0 flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.12em] px-6 py-4 transition-colors relative -mb-px border-b-2 ${
                      activeTab === tab.id
                        ? "border-rc-red text-rc-red font-bold"
                        : "border-transparent text-rc-muted hover:text-rc-text"
                    }`}
                  >
                    {tab.label}
                    {"badge" in tab && tab.badge && (
                      <span className={`font-bold ${tab.badgeClass}`}>{tab.badge}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            {activeTab === "overview" && <TechnicalRadarChart data={result.technical_analysis} />}
            {activeTab === "ats" && result.ats_simulation && (
              <AtsTab
                ats={result.ats_simulation}
                checkedKeywords={new Set()}
                onToggle={noop}
                onReset={noop}
              />
            )}
            {activeTab === "cv-analysis" && <CvAnalysisTab result={result} fixesReady={true} />}
            {activeTab === "signals" && (
              <SignalsTab
                github={result.audit.github}
                linkedin={result.audit.linkedin}
                hasGithub={result.audit.github.score !== null}
                hasLinkedin={result.audit.linkedin.score !== null}
              />
            )}
            {activeTab === "flags" && (
              <FlagsTab
                flags={result.hidden_red_flags}
                jdMatch={result.audit.jd_match}
                score={result.score}
                verdict={result.verdict}
                confidence={result.confidence}
                breakdown={result.breakdown}
                fixesReady={true}
              />
            )}
            {activeTab === "consistency" && (
              <ConsistencyTab
                inconsistencies={result.cross_profile_inconsistencies ?? []}
                timelineEntries={result.timeline_entries ?? []}
              />
            )}
            {activeTab === "negotiation" && (
              <NegotiationTab result={result} analysisId={null} isPremium={true} />
            )}
            {activeTab === "roadmap" && <RoadmapTab result={result} />}
            {activeTab === "project" && <BridgeTab result={result} />}
          </>
        )}
      </div>

      {/* CTA block */}
      <div className="max-w-[1600px] w-[92%] mx-auto px-5 md:px-[32px] py-12 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-rc-border mt-4">
        <p className="text-[15px] text-rc-text leading-snug max-w-[420px]">
          {t.share.ctaText}
        </p>
        <Link
          href={`/${lang}/analyze`}
          className="shrink-0 inline-flex items-center justify-center px-6 py-3 bg-rc-red text-white font-mono text-[12px] tracking-widest uppercase transition-colors hover:bg-rc-red/90 active:scale-95"
        >
          {t.share.ctaButton} →
        </Link>
      </div>
    </div>
  );
}
