"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Trophy, ArrowRight, Sparkles, Target } from "lucide-react";
import type { ChallengeAnalysis } from "../types";

const mdClass =
  "[&_strong]:font-semibold [&_strong]:text-rc-text [&_em]:italic [&_p]:leading-relaxed [&_p]:m-0";

type Props = {
  analysis: ChallengeAnalysis | null | undefined;
};

export function ChallengeAnalysisCard({ analysis }: Props) {
  const params = useParams();
  const lang = (params?.lang as string) ?? "en";
  const challengeHref = `/${lang}/challenge`;

  if (!analysis) return null;

  if (analysis.status === "cta") {
    const language = analysis.cta?.language ?? "TypeScript";
    const message =
      analysis.cta?.message ??
      `Do daily ${language} challenges for a month — concrete proof of code-review fluency goes further than any line on a CV.`;
    return (
      <div className="bg-gradient-to-br from-rc-red/10 to-rc-amber/5 border border-rc-red/30 rounded-xl p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-rc-red/20 border border-rc-red/30 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-rc-red" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-sans font-bold text-[16px] tracking-tight text-rc-text mb-1">
              Boost your seniority signal
            </h3>
            <div className={`text-[13px] text-rc-muted mb-4 ${mdClass}`}>
              <ReactMarkdown>{message}</ReactMarkdown>
            </div>
            <Link
              href={challengeHref}
              className="inline-flex items-center gap-2 px-4 py-2 bg-rc-red text-white rounded-lg font-mono text-[11px] uppercase tracking-wider font-bold hover:bg-rc-red/90 transition-colors"
            >
              Start daily {language} challenges <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // status === "analyzed"
  const language = analysis.matched_language;
  const summary = analysis.summary ?? "";
  const strengths = analysis.strengths ?? [];
  const bridge = analysis.bridge_to_project ?? "";

  return (
    <div className="bg-rc-surface/20 border border-rc-border/30 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-rc-green" />
          <h3 className="font-sans font-bold text-[16px] tracking-tight uppercase text-rc-text">
            Challenge Track Record
          </h3>
        </div>
        {language && (
          <span className="px-2.5 py-1 bg-rc-green/10 border border-rc-green/30 rounded-full font-mono text-[10px] uppercase tracking-wider font-bold text-rc-green">
            {language}
          </span>
        )}
      </div>

      {summary && (
        <div className={`text-[13px] text-rc-muted mb-4 ${mdClass}`}>
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
      )}

      {strengths.length > 0 && (
        <ul className="space-y-2 mb-4">
          {strengths.map((s, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[13px] text-rc-text"
            >
              <span className="shrink-0 mt-1.5 w-1 h-1 rounded-full bg-rc-green" />
              <div className={`flex-1 ${mdClass}`}>
                <ReactMarkdown>{s}</ReactMarkdown>
              </div>
            </li>
          ))}
        </ul>
      )}

      {bridge && (
        <div className="mt-4 pt-4 border-t border-rc-border/30">
          <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-rc-red font-bold flex items-center gap-1.5 mb-2">
            <Target className="w-3 h-3" /> Bridge to the project below
          </h4>
          <div className={`text-[13px] text-rc-muted italic ${mdClass}`}>
            <ReactMarkdown>{bridge}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
