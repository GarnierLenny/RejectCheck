"use client";

import { Star, Crown, Zap, Target, Globe, X, Diamond, CircleDot, Focus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "../../context/language";
import type { AchievementsBundle } from "../../lib/queries";

type Props = {
  achievements: AchievementsBundle;
  dateLocale?: string;
};

const SLUG_ICONS: Record<string, LucideIcon> = {
  first_steps:   CircleDot,
  perfect_score: Star,
  triple_crown:  Crown,
  week_warrior:  Zap,
  month_warrior: Target,
  polyglot:      Globe,
  centurion:     X,
  connected:     Diamond,
  focus_master:  Focus,
};

const STATIC_DEFS: { slug: string; progress: (p: AchievementsBundle["progress"]) => string | null }[] = [
  { slug: "first_steps",   progress: () => "1 / 1" },
  { slug: "perfect_score", progress: (p) => `${Math.min(p.perfectCount, 1)} / 1` },
  { slug: "triple_crown",  progress: (p) => `${Math.min(p.perfectCount, 5)} / 5` },
  { slug: "week_warrior",  progress: (p) => `${Math.min(p.longestStreak, 7)} / 7` },
  { slug: "month_warrior", progress: (p) => `${Math.min(p.longestStreak, 30)} / 30` },
  { slug: "polyglot",      progress: (p) => `${Math.min(p.languagesCount, 3)} / 3` },
  { slug: "centurion",     progress: (p) => `${Math.min(p.totalCount, 100)} / 100` },
  { slug: "connected",     progress: (p) => `${Math.min(p.followersCount, 10)} / 10` },
];

function parsePct(text: string | null): number {
  if (!text) return 0;
  const m = text.match(/(\d+)\s*\/\s*(\d+)/);
  if (!m) return 0;
  const max = parseInt(m[2]);
  return max === 0 ? 0 : Math.min(100, (parseInt(m[1]) / max) * 100);
}

function AchRow({ earned, progressText, label, description, slug }: {
  earned: boolean;
  progressText: string | null;
  label: string;
  description: string;
  slug: string;
}) {
  const Icon = SLUG_ICONS[slug.startsWith("focus_master") ? "focus_master" : slug] ?? CircleDot;
  const pct = earned ? 100 : parsePct(progressText);
  const isGreen = earned;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-rc-border last:border-b-0">
      {/* Icon */}
      <div className="w-8 h-8 rounded-lg bg-rc-red/10 flex items-center justify-center flex-shrink-0">
        <Icon size={15} className={earned ? "text-rc-red" : "text-rc-red/40"} />
      </div>

      {/* Text */}
      <div className="min-w-0 w-28 flex-shrink-0">
        <p className={`text-[13px] font-semibold leading-tight ${earned ? "text-rc-text" : "text-rc-hint"}`}>
          {label}
        </p>
        <p className="font-mono text-[10px] text-rc-hint/80 mt-0.5 truncate">{description}</p>
      </div>

      {/* Bar */}
      <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-rc-border/40">
        <div
          className={`h-full rounded-full transition-all ${isGreen ? "bg-rc-green" : "bg-rc-border"}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Count */}
      <span className="font-mono text-[10px] text-rc-hint tabular-nums flex-shrink-0 w-12 text-right">
        {progressText}
      </span>
    </div>
  );
}

export function AchievementsList({ achievements }: Props) {
  const { t } = useLanguage();
  const dict = t.publicProfilePage.achievements.items;
  const earnedMap = new Map(achievements.earned.map((e) => [e.slug, e.earnedAt]));

  const items: { slug: string; earned: boolean; progressText: string | null; label: string; description: string }[] = [];

  for (const def of STATIC_DEFS) {
    const isEarned = earnedMap.has(def.slug);
    const raw = def.progress(achievements.progress);
    items.push({
      slug: def.slug,
      earned: isEarned,
      progressText: raw,
      label: (dict[def.slug as keyof typeof dict] as { label: string })?.label ?? def.slug,
      description: (dict[def.slug as keyof typeof dict] as { description: string })?.description ?? "",
    });
  }

  // Focus master
  const focusMasterEarned = achievements.earned.filter((e) => e.slug.startsWith("focus_master:"));
  for (const fm of focusMasterEarned) {
    const tag = fm.slug.split(":")[1];
    const fmDict = dict.focus_master as { label: string; labelWithTag: string; description: string };
    items.push({
      slug: fm.slug,
      earned: true,
      progressText: "1 / 1",
      label: fmDict.labelWithTag?.replace("{tag}", tag) ?? fmDict.label,
      description: fmDict.description,
    });
  }
  if (focusMasterEarned.length === 0) {
    const counts = achievements.progress.focusMasterCounts;
    const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    const fmDict = dict.focus_master as { label: string; description: string };
    items.push({
      slug: "focus_master",
      earned: false,
      progressText: best ? `${Math.min(best[1], 5)} / 5` : "0 / 5",
      label: fmDict.label,
      description: fmDict.description,
    });
  }

  items.sort((a, b) => Number(b.earned) - Number(a.earned));

  const earnedCount = items.filter((i) => i.earned).length;
  const half = Math.ceil(items.length / 2);
  const left = items.slice(0, half);
  const right = items.slice(half);

  return (
    <div className="py-8">
      <div className="flex items-baseline gap-3 mb-6">
        <h2 className="text-[32px] font-semibold leading-none" style={{ letterSpacing: -0.5 }}>
          {t.publicProfilePage.achievements.title}
        </h2>
        <span className="font-sans text-[13px] text-rc-hint">{earnedCount} / {items.length}</span>
      </div>

      <div className="grid grid-cols-2 gap-x-12">
        <div>{left.map((item) => <AchRow key={item.slug} {...item} />)}</div>
        <div>{right.map((item) => <AchRow key={item.slug} {...item} />)}</div>
      </div>
    </div>
  );
}
