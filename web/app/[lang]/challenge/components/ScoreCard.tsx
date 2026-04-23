"use client";

import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { useLanguage } from "../../../../context/language";
import { useChallengeStreak } from "../../../../lib/challenge";
import type { ChallengeIssue, DayStats, FinalResponse, PublicChallenge } from "../../../../lib/challenge";

const SEVERITY_STYLES: Record<ChallengeIssue["severity"], string> = {
  critical: "text-rc-red border-rc-red/30 bg-rc-red/5",
  major: "text-amber-700 border-amber-300 bg-amber-50",
  minor: "text-rc-hint border-rc-border bg-rc-hint/5",
};

const SEVERITY_DOT: Record<ChallengeIssue["severity"], string> = {
  critical: "🔴",
  major: "🟠",
  minor: "⚪",
};

type Props = {
  challenge: PublicChallenge;
  result: FinalResponse;
};

function percentileFromDistribution(stats: DayStats, score: number): number {
  if (stats.completions === 0) return 0;
  let below = 0;
  for (let i = 0; i < 10; i++) {
    const bucketTop = (i + 1) * 10;
    if (bucketTop <= score) below += stats.scoreDistribution[i];
  }
  return Math.round((below / stats.completions) * 100);
}

export function ScoreCard({ challenge, result }: Props) {
  const { t } = useLanguage();
  const streakQuery = useChallengeStreak();
  // Prefer the freshest server value; fall back to what came back with the score
  // (the 409 ALREADY_COMPLETED path can't include the streak).
  const streakCount = Math.max(
    streakQuery.data?.currentStreak ?? 0,
    result.streak.currentStreak ?? 0,
  );
  const percentile = percentileFromDistribution(result.stats, result.score);
  const percentileLabel = (t.challenge.score.percentileTemplate as string).replace(
    "{percent}",
    String(percentile),
  );

  const shareText = (t.challenge.shareText as string)
    .replace("{score}", String(result.score))
    .replace("{title}", challenge.title)
    .replace("{streak}", String(streakCount));

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success(t.challenge.score.copied);
    } catch {
      toast.error(t.common.error);
    }
  }

  const missedIssues = result.issues.filter((issue) =>
    result.missed_issues.includes(issue.title),
  );
  const missed = missedIssues.length > 0 ? missedIssues : result.missed_issues.map((title) => ({
    title,
    description: "",
    severity: "major" as const,
  }));

  const chartData = result.stats.scoreDistribution.map((count, i) => ({
    bucket: `${i * 10}${i === 9 ? "–100" : `–${i * 10 + 9}`}`,
    count,
    highlight: Math.floor(result.score / 10) === (i === 9 && result.score === 100 ? 10 : i),
  }));

  return (
    <div className="space-y-6">
      {streakCount > 0 && (
        <div className="border border-rc-red/30 rounded-2xl p-5 bg-gradient-to-br from-rc-red/10 to-rc-red/[0.03]">
          <div className="flex items-center gap-4">
            <div className="text-[44px] leading-none">🔥</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-[40px] leading-none font-bold text-rc-red">
                  {streakCount}
                </span>
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-rc-red font-bold">
                  {t.challenge.score.streakLabel}
                </span>
              </div>
              <p className="text-[12px] text-rc-text/70 mt-2 leading-relaxed">
                {t.challenge.score.comeBack}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="border border-rc-border rounded-2xl p-6 bg-white">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-rc-hint mb-3">
          {t.challenge.score.heading}
        </p>
        <div className="flex items-end gap-2 mb-6">
          <span className="text-[72px] leading-none font-bold text-rc-text">{result.score}</span>
          <span className="text-[20px] leading-none text-rc-muted mb-3">/ 100</span>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[14px]">
          <div className="flex justify-between border-b border-rc-border/60 pb-2">
            <dt className="text-rc-muted">{t.challenge.score.issuesFound}</dt>
            <dd className="font-mono text-rc-text">{result.scoreBreakdown.issues_found}/40</dd>
          </div>
          <div className="flex justify-between border-b border-rc-border/60 pb-2">
            <dt className="text-rc-muted">{t.challenge.score.explanation}</dt>
            <dd className="font-mono text-rc-text">{result.scoreBreakdown.explanation_quality}/30</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-rc-muted">{t.challenge.score.prioritization}</dt>
            <dd className="font-mono text-rc-text">{result.scoreBreakdown.prioritization}/20</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-rc-muted">{t.challenge.score.bonus}</dt>
            <dd className="font-mono text-rc-text">{result.scoreBreakdown.bonus}/10</dd>
          </div>
        </dl>
      </div>

      <div className="border border-rc-border rounded-2xl p-6 bg-white">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-rc-hint mb-3">
          {t.challenge.score.feedbackHeading}
        </p>
        <p className="text-[15px] leading-relaxed text-rc-text">{result.feedback}</p>
      </div>

      {missed.length > 0 && (
        <div className="border border-rc-border rounded-2xl p-6 bg-white">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-rc-hint mb-3">
            {t.challenge.score.missedHeading}
          </p>
          <ul className="space-y-3">
            {missed.map((issue, i) => (
              <li
                key={i}
                className={`border rounded-xl p-3 ${SEVERITY_STYLES[issue.severity]}`}
              >
                <p className="font-bold text-[14px] flex items-center gap-2">
                  <span>{SEVERITY_DOT[issue.severity]}</span>
                  {issue.title}
                </p>
                {issue.description && (
                  <p className="text-[13px] mt-1 opacity-90 leading-relaxed">
                    {issue.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="border border-rc-border rounded-2xl p-6 bg-white">
        <div className="flex items-end justify-between mb-4">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-rc-hint">
            {t.challenge.score.statsHeading}
          </p>
          {result.stats.completions > 0 && (
            <p className="text-[13px] text-rc-muted">{percentileLabel}</p>
          )}
        </div>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: "#999" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#999" }} allowDecimals={false} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "rgba(201,58,57,0.08)" }} />
              <Bar dataKey="count" fill="#D94040" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href={`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center px-5 py-3 bg-rc-text text-white font-mono text-[11px] tracking-widest uppercase rounded-xl hover:scale-[1.02] active:scale-[0.98] no-underline font-bold transition-transform"
        >
          🔥 {t.challenge.score.shareX}
        </a>
        <button
          onClick={handleCopy}
          className="inline-flex items-center justify-center px-5 py-3 border border-rc-border text-rc-text font-mono text-[11px] tracking-widest uppercase rounded-xl hover:bg-rc-text/5 active:scale-[0.98] font-bold transition-colors"
        >
          {t.challenge.score.copy}
        </button>
      </div>

    </div>
  );
}
