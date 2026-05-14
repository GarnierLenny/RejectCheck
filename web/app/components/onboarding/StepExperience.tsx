"use client";

import {
  GraduationCap,
  Sprout,
  TrendingUp,
  Star,
  Trophy,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { EXPERIENCE_LEVELS } from "../../../lib/onboarding-data";
import type { ExperienceLevel } from "../../../lib/queries";
import type { Dictionary } from "../../(locale)/[lang]/dictionaries";
import { StepHeader } from "./StepHeader";
import { OptionCard } from "./OptionCard";

const XP_ICONS: Record<ExperienceLevel, LucideIcon> = {
  student: GraduationCap,
  junior: Sprout,
  mid: TrendingUp,
  senior: Star,
  lead: Trophy,
  switcher: RefreshCw,
};

export function StepExperience({
  t,
  experience,
  onChange,
}: {
  t: Dictionary;
  experience: ExperienceLevel | null;
  onChange: (xp: ExperienceLevel) => void;
}) {
  return (
    <section>
      <StepHeader
        eyebrow={t.onboarding.step2.eyebrow}
        title={t.onboarding.step2.title}
        titleAccent={t.onboarding.step2.titleAccent}
      >
        {t.onboarding.step2.sub}
      </StepHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {EXPERIENCE_LEVELS.map((x) => {
          const Icon = XP_ICONS[x.id];
          return (
            <OptionCard
              key={x.id}
              icon={Icon}
              label={t.onboarding.experience[x.id]}
              meta={t.onboarding.experienceMeta[x.id]}
              selected={experience === x.id}
              compact
              onClick={() => onChange(x.id)}
            />
          );
        })}
      </div>
    </section>
  );
}
