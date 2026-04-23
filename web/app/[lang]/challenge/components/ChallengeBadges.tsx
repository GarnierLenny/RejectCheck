"use client";

import { Clock } from "lucide-react";
import { useLanguage } from "../../../../context/language";

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  hard: "bg-rc-red/5 text-rc-red border-rc-red/20",
};

const LANGUAGE_LABELS: Record<string, string> = {
  typescript: "TS",
  python: "PY",
  java: "JAVA",
};

type Props = {
  focusTag: string;
  difficulty: string;
  estimatedTime: number;
  language: string;
};

export function ChallengeBadges({ focusTag, difficulty, estimatedTime, language }: Props) {
  const { t } = useLanguage();
  const tagLabel =
    (t.challenge.focusTags as Record<string, string>)[focusTag] ?? focusTag;
  const difficultyLabel =
    (t.challenge.difficulties as Record<string, string>)[difficulty] ?? difficulty;
  const difficultyClass =
    DIFFICULTY_STYLES[difficulty] ?? "bg-rc-hint/5 text-rc-hint border-rc-border";
  const timeLabel = (t.challenge.estimatedMinutes as string).replace(
    "{minutes}",
    String(estimatedTime),
  );
  const languageLabel = LANGUAGE_LABELS[language] ?? language.toUpperCase();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-mono text-[10px] tracking-[0.18em] uppercase px-3 py-1 rounded-full bg-rc-red/5 text-rc-red border border-rc-red/20 font-bold">
        {languageLabel}
      </span>
      <span className="font-mono text-[10px] tracking-[0.18em] uppercase px-3 py-1 rounded-full bg-rc-text/5 text-rc-text border border-rc-border">
        {tagLabel}
      </span>
      <span
        className={`font-mono text-[10px] tracking-[0.18em] uppercase px-3 py-1 rounded-full border ${difficultyClass}`}
      >
        {difficultyLabel}
      </span>
      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.18em] uppercase px-3 py-1 rounded-full bg-rc-hint/5 text-rc-hint border border-rc-border">
        <Clock className="w-3 h-3" />
        {timeLabel}
      </span>
    </div>
  );
}
