"use client";

import { Trophy, Check, Lock } from "lucide-react";
import { Heading, Caption, Text } from "./typography";
import { useLanguage } from "../../context/language";
import type { AchievementsBundle } from "../../lib/queries";

type Props = {
  achievements: AchievementsBundle;
  dateLocale?: string;
};

type AchievementDef = {
  slug: string;
  /** For locked items, returns "X / Y" or null if no numeric progress to show. */
  progress?: (p: AchievementsBundle["progress"]) => string | null;
};

const STATIC_DEFS: AchievementDef[] = [
  { slug: "first_steps", progress: () => null },
  {
    slug: "perfect_score",
    progress: (p) => (p.perfectCount > 0 ? null : "0 / 1"),
  },
  {
    slug: "triple_crown",
    progress: (p) => `${Math.min(p.perfectCount, 5)} / 5`,
  },
  {
    slug: "week_warrior",
    progress: (p) => `${Math.min(p.longestStreak, 7)} / 7`,
  },
  {
    slug: "month_warrior",
    progress: (p) => `${Math.min(p.longestStreak, 30)} / 30`,
  },
  {
    slug: "polyglot",
    progress: (p) => `${Math.min(p.languagesCount, 3)} / 3`,
  },
  {
    slug: "centurion",
    progress: (p) => `${Math.min(p.totalCount, 100)} / 100`,
  },
  {
    slug: "connected",
    progress: (p) => `${Math.min(p.followersCount, 10)} / 10`,
  },
];

function formatDate(iso: string, locale = "en-GB"): string {
  return new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function AchievementsList({ achievements, dateLocale = "en-GB" }: Props) {
  const { t } = useLanguage();
  const earnedMap = new Map(
    achievements.earned.map((e) => [e.slug, e.earnedAt]),
  );
  const items: { slug: string; earned: boolean; earnedAt: string | null; progress: string | null; isFocusMaster?: boolean; tag?: string }[] = [];

  // Static catalog
  for (const def of STATIC_DEFS) {
    const earnedAt = earnedMap.get(def.slug);
    const isEarned = earnedAt !== undefined;
    items.push({
      slug: def.slug,
      earned: isEarned,
      earnedAt: earnedAt ?? null,
      progress: isEarned ? null : (def.progress?.(achievements.progress) ?? null),
    });
  }

  // Focus master: one row per earned tag (variable count)
  const focusMasterEarned = achievements.earned.filter((e) =>
    e.slug.startsWith("focus_master:"),
  );
  for (const fm of focusMasterEarned) {
    const tag = fm.slug.split(":")[1];
    items.push({
      slug: fm.slug,
      earned: true,
      earnedAt: fm.earnedAt,
      progress: null,
      isFocusMaster: true,
      tag,
    });
  }
  // Show locked focus_master template only if no tag is earned yet, with the
  // closest tag's progress (e.g. "3 / 5 on react_rerenders").
  if (focusMasterEarned.length === 0) {
    const counts = achievements.progress.focusMasterCounts;
    const tags = Object.keys(counts);
    let closestTag: string | null = null;
    let closestCount = 0;
    for (const tag of tags) {
      if (counts[tag] > closestCount) {
        closestCount = counts[tag];
        closestTag = tag;
      }
    }
    items.push({
      slug: "focus_master",
      earned: false,
      earnedAt: null,
      progress: closestTag
        ? `${Math.min(closestCount, 5)} / 5${
            closestTag !== null ? ` (${closestTag})` : ""
          }`
        : "0 / 5",
      isFocusMaster: true,
    });
  }

  // Sort: earned first, locked after
  items.sort((a, b) => Number(b.earned) - Number(a.earned));

  return (
    <div className="bg-rc-surface border border-rc-border rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={14} className="text-rc-amber" />
        <Heading as="h3">{t.publicProfilePage.achievements.title}</Heading>
      </div>
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => {
          const labels = getLabels(t, item.slug, item.tag);
          return (
            <li
              key={item.slug}
              className={`flex items-start gap-3 p-2.5 rounded-md ${
                item.earned
                  ? "bg-rc-bg/50"
                  : "opacity-60"
              }`}
            >
              <span
                className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                  item.earned
                    ? "bg-rc-green/20 text-rc-green"
                    : "bg-rc-bg border border-rc-border text-rc-hint"
                }`}
                aria-hidden="true"
              >
                {item.earned ? <Check size={11} /> : <Lock size={10} />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <Text weight="medium" className="text-[13px]">
                    {labels.label}
                  </Text>
                  {item.earned && item.earnedAt && (
                    <Caption className="font-mono text-[10px] shrink-0">
                      {t.publicProfilePage.achievements.earnedOn}{" "}
                      {formatDate(item.earnedAt, dateLocale)}
                    </Caption>
                  )}
                  {!item.earned && item.progress && (
                    <Caption className="font-mono text-[10px] shrink-0 tabular-nums">
                      {item.progress}
                    </Caption>
                  )}
                </div>
                <Caption as="p" className="block mt-0.5">
                  {labels.description}
                </Caption>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function getLabels(
  t: ReturnType<typeof useLanguage>["t"],
  slug: string,
  tag?: string,
): { label: string; description: string } {
  const dict = t.publicProfilePage.achievements.items;
  if (slug.startsWith("focus_master")) {
    if (tag) {
      return {
        label: dict.focus_master.labelWithTag.replace("{tag}", tag),
        description: dict.focus_master.description,
      };
    }
    return {
      label: dict.focus_master.label,
      description: dict.focus_master.description,
    };
  }
  const key = slug as keyof typeof dict;
  const item = dict[key];
  if (item && typeof item === "object" && "label" in item) {
    return { label: item.label as string, description: item.description as string };
  }
  return { label: slug, description: "" };
}
