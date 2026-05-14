"use client";

import {
  Code2,
  LayoutGrid,
  Palette,
  Database,
  Megaphone,
  Settings,
  DollarSign,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import { ROLES } from "../../../lib/onboarding-data";
import type { RoleType } from "../../../lib/queries";
import type { Dictionary } from "../../(locale)/[lang]/dictionaries";
import { StepHeader } from "./StepHeader";
import { OptionCard } from "./OptionCard";

const ROLE_ICONS: Record<RoleType, LucideIcon> = {
  software: Code2,
  product: LayoutGrid,
  design: Palette,
  data: Database,
  marketing: Megaphone,
  ops: Settings,
  sales: DollarSign,
  other: HelpCircle,
};

export function StepRole({
  t,
  role,
  roleOther,
  onRoleChange,
  onRoleOtherChange,
}: {
  t: Dictionary;
  role: RoleType | null;
  roleOther: string;
  onRoleChange: (r: RoleType) => void;
  onRoleOtherChange: (v: string) => void;
}) {
  return (
    <section>
      <StepHeader
        eyebrow={t.onboarding.step1.eyebrow}
        title={t.onboarding.step1.title}
        titleAccent={t.onboarding.step1.titleAccent}
      >
        {t.onboarding.step1.sub}
      </StepHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {ROLES.map((r) => {
          const Icon = ROLE_ICONS[r.id];
          return (
            <OptionCard
              key={r.id}
              icon={Icon}
              label={t.onboarding.roles[r.id]}
              meta={t.onboarding.rolesMeta[r.id]}
              selected={role === r.id}
              onClick={() => onRoleChange(r.id)}
            />
          );
        })}
      </div>

      {role === "other" && (
        <div className="mt-3 flex flex-col gap-2 animate-[fadeIn_.3s_ease]">
          <label
            htmlFor="role-other"
            className="font-mono text-[10px] tracking-[0.18em] uppercase text-rc-hint pl-1.5"
          >
            {t.onboarding.step1.otherLabel}
          </label>
          <input
            id="role-other"
            type="text"
            maxLength={60}
            autoComplete="off"
            autoFocus
            value={roleOther}
            onChange={(e) => onRoleOtherChange(e.target.value)}
            placeholder={t.onboarding.step1.otherPlaceholder}
            className="px-5 py-4 border-[1.5px] border-rc-red bg-rc-surface rounded-2xl text-[17px] text-rc-text outline-none focus:shadow-[0_0_0_4px_rgba(201,58,57,0.08)] transition-shadow"
          />
        </div>
      )}
    </section>
  );
}
