import { Heading, Caption, Text } from "./typography";
import type { PublicProfile } from "../../lib/queries";

type Props = {
  challenges: PublicProfile["recentChallenges"];
  title: string;
  emptyLabel: string;
  dateLocale?: string;
};

const DIFFICULTY_TONE: Record<string, string> = {
  easy: "text-rc-green border-rc-green/30 bg-rc-green/5",
  medium: "text-rc-amber border-rc-amber/30 bg-rc-amber/5",
  hard: "text-rc-red border-rc-red/30 bg-rc-red/5",
};

function scoreClass(score: number): string {
  if (score >= 90) return "text-rc-red";
  if (score >= 70) return "text-rc-amber";
  return "text-rc-muted";
}

function formatDate(iso: string, locale = "en-GB"): string {
  const d = new Date(iso);
  return d.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PublicRecentChallenges({ challenges, title, emptyLabel, dateLocale = "en-GB" }: Props) {
  return (
    <div className="bg-rc-surface border border-rc-border rounded-lg p-5">
      <Heading as="h3" className="mb-4">
        {title}
      </Heading>
      {challenges.length === 0 ? (
        <Caption as="p" tone="subtle" className="block py-2">
          {emptyLabel}
        </Caption>
      ) : (
        <div className="flex flex-col gap-2">
          {challenges.map((c) => (
            <div
              key={c.challengeId}
              className="flex items-center gap-3 px-3 py-2.5 bg-rc-bg border border-rc-border rounded-md"
            >
              <span
                className={`font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border ${DIFFICULTY_TONE[c.difficulty] ?? DIFFICULTY_TONE.medium}`}
              >
                {c.difficulty}
              </span>
              <div className="flex-1 min-w-0">
                <Text className="truncate" weight="medium">
                  {c.title}
                </Text>
                <Caption as="p" className="font-mono text-[10px]">
                  {c.focusTag} · {c.language} · {formatDate(c.completedAt, dateLocale)}
                </Caption>
              </div>
              <span
                className={`font-mono text-[14px] font-semibold tabular-nums ${scoreClass(c.score)}`}
              >
                {c.score}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
