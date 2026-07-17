"use client";

import type { ReactNode } from "react";
import {
  Home,
  Shuffle,
  Building2,
  Globe,
  ShieldCheck,
  Plane,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import { REMOTE_MODES, SPONSORSHIP_OPTIONS } from "../../../lib/onboarding-data";
import type { RemotePreference } from "../../../lib/queries";
import type { Dictionary } from "../../(locale)/[lang]/dictionaries";
import { StepHeader } from "./StepHeader";
import { OptionCard } from "./OptionCard";

const REMOTE_ICONS: Record<RemotePreference, LucideIcon> = {
  remote: Home,
  hybrid: Shuffle,
  onsite: Building2,
  flexible: Globe,
};

const SPONSOR_ICONS: Record<"authorized" | "needs", LucideIcon> = {
  authorized: ShieldCheck,
  needs: Plane,
};

function SectionLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`font-mono text-[11px] uppercase tracking-[0.14em] text-rc-hint font-bold mb-2.5 ${className}`}>
      {children}
    </p>
  );
}

/**
 * Work-eligibility step: the outcome factors the CV-vs-JD score is blind to
 * (remote fit, visa sponsorship, location). Every field is optional — the whole
 * point is to be pleasant, never to force a visa disclosure. Selecting is a tap,
 * location is a single light input.
 */
export function StepWork({
  t,
  remotePreference,
  needsSponsorship,
  country,
  onRemoteChange,
  onSponsorshipChange,
  onCountryChange,
}: {
  t: Dictionary;
  remotePreference: RemotePreference | null;
  needsSponsorship: boolean | null;
  country: string;
  onRemoteChange: (v: RemotePreference) => void;
  onSponsorshipChange: (v: boolean) => void;
  onCountryChange: (v: string) => void;
}) {
  const w = t.onboarding.work;
  return (
    <section>
      <StepHeader eyebrow={w.eyebrow} title={w.title} titleAccent={w.titleAccent}>
        {w.sub}
      </StepHeader>

      <SectionLabel>{w.modeLabel}</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {REMOTE_MODES.map((m) => (
          <OptionCard
            key={m.id}
            icon={REMOTE_ICONS[m.id]}
            label={w.mode[m.id]}
            meta={w.modeMeta[m.id]}
            selected={remotePreference === m.id}
            compact
            onClick={() => onRemoteChange(m.id)}
          />
        ))}
      </div>

      <SectionLabel className="mt-7">{w.authLabel}</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {SPONSORSHIP_OPTIONS.map((s) => (
          <OptionCard
            key={s.id}
            icon={SPONSOR_ICONS[s.id]}
            label={w.sponsorship[s.id]}
            meta={w.sponsorshipMeta[s.id]}
            selected={needsSponsorship === (s.id === "needs")}
            compact
            onClick={() => onSponsorshipChange(s.id === "needs")}
          />
        ))}
      </div>

      <SectionLabel className="mt-7">{w.locationLabel}</SectionLabel>
      <div className="relative max-w-[420px]">
        <MapPin
          size={18}
          strokeWidth={1.6}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-rc-hint pointer-events-none"
        />
        <input
          type="text"
          value={country}
          onChange={(e) => onCountryChange(e.target.value)}
          placeholder={w.locationPlaceholder}
          maxLength={80}
          className="w-full pl-11 pr-4 py-4 border-[1.5px] border-rc-border rounded-2xl bg-rc-surface text-rc-text text-[16px] placeholder:text-rc-hint focus:outline-none focus:border-rc-red/55 transition-colors"
        />
      </div>
    </section>
  );
}
