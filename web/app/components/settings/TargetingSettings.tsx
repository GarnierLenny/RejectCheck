"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Heading, FieldLabel, Caption } from "../typography";
import { Button } from "../Button";
import { useLanguage } from "../../../context/language";
import { useUpdateProfile } from "../../../lib/mutations";
import {
  EXPERIENCE_LEVELS,
  LANGS_PRIMARY,
  REMOTE_MODES,
  ROLES,
  STACKS_PRIMARY,
  TECH_ROLES,
} from "../../../lib/onboarding-data";
import type {
  ExperienceLevel,
  Profile,
  RemotePreference,
  RoleType,
} from "../../../lib/queries";

const inputClass =
  "w-full bg-rc-bg border border-rc-border rounded-md px-3 py-2 text-[14px] leading-5 text-rc-text outline-none focus:border-rc-red/40 focus:ring-2 focus:ring-rc-red/20 transition-colors";

const MAX_STACKS = 3;

function SavedBadge({ show, label }: { show: boolean; label: string }) {
  return (
    <Caption
      tone="green"
      className={`transition-opacity duration-300 ${show ? "opacity-100" : "opacity-0"}`}
    >
      {label}
    </Caption>
  );
}

export function TargetingSettings({
  profile,
  lang,
}: {
  profile: Profile | null;
  lang: string;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const updateProfile = useUpdateProfile();

  const [role, setRole] = useState<RoleType | "">("");
  const [roleOther, setRoleOther] = useState("");
  const [xp, setXp] = useState<ExperienceLevel | "">("");
  const [stacks, setStacks] = useState<string[]>([]);
  const [langs, setLangs] = useState<string[]>([]);
  const [remotePref, setRemotePref] = useState<RemotePreference | "">("");
  const [sponsorship, setSponsorship] = useState<"" | "authorized" | "needs">("");
  const [country, setCountry] = useState("");

  const [roleSaved, setRoleSaved] = useState(false);
  const [roleOtherSaved, setRoleOtherSaved] = useState(false);
  const [xpSaved, setXpSaved] = useState(false);
  const [stacksSaved, setStacksSaved] = useState(false);
  const [langsSaved, setLangsSaved] = useState(false);
  const [remoteSaved, setRemoteSaved] = useState(false);
  const [sponsorshipSaved, setSponsorshipSaved] = useState(false);
  const [countrySaved, setCountrySaved] = useState(false);

  const [retaking, setRetaking] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setRole(profile.roleType ?? "");
    setRoleOther(profile.roleTypeOther ?? "");
    setXp(profile.experienceLevel ?? "");
    setStacks(profile.techStack ?? []);
    setLangs(profile.languages ?? []);
    setRemotePref(profile.remotePreference ?? "");
    setSponsorship(
      profile.needsSponsorship === true
        ? "needs"
        : profile.needsSponsorship === false
          ? "authorized"
          : "",
    );
    setCountry(profile.country ?? "");
  }, [profile]);

  function flash(setter: (v: boolean) => void) {
    setter(true);
    setTimeout(() => setter(false), 2000);
  }

  async function handleRoleChange(next: RoleType | "") {
    setRole(next);
    if (next === profile?.roleType) return;
    const value = next === "" ? null : next;
    await updateProfile.mutateAsync({
      roleType: value,
      // Reset techStack if the new role is non-tech (it would be hidden anyway).
      ...(value && !TECH_ROLES.includes(value) ? { techStack: [] } : {}),
      // Clear roleTypeOther if the new role is not "other".
      ...(value !== "other" ? { roleTypeOther: null } : {}),
    });
    if (value && !TECH_ROLES.includes(value)) setStacks([]);
    if (value !== "other") setRoleOther("");
    flash(setRoleSaved);
  }

  async function handleRoleOtherBlur() {
    const current = profile?.roleTypeOther ?? "";
    if (roleOther === current) return;
    await updateProfile.mutateAsync({
      roleTypeOther: roleOther.trim() || null,
    });
    flash(setRoleOtherSaved);
  }

  async function handleXpChange(next: ExperienceLevel | "") {
    setXp(next);
    if (next === profile?.experienceLevel) return;
    await updateProfile.mutateAsync({
      experienceLevel: next === "" ? null : next,
    });
    flash(setXpSaved);
  }

  async function toggleStack(name: string) {
    let next: string[];
    const idx = stacks.indexOf(name);
    if (idx >= 0) next = stacks.filter((s) => s !== name);
    else if (stacks.length >= MAX_STACKS) return;
    else next = [...stacks, name];
    setStacks(next);
    await updateProfile.mutateAsync({ techStack: next });
    flash(setStacksSaved);
  }

  async function toggleLang(code: string) {
    const next = langs.includes(code)
      ? langs.filter((c) => c !== code)
      : [...langs, code];
    setLangs(next);
    await updateProfile.mutateAsync({ languages: next });
    flash(setLangsSaved);
  }

  async function handleRemoteChange(next: RemotePreference | "") {
    setRemotePref(next);
    if (next === (profile?.remotePreference ?? "")) return;
    await updateProfile.mutateAsync({
      remotePreference: next === "" ? null : next,
    });
    flash(setRemoteSaved);
  }

  async function handleSponsorshipChange(next: "" | "authorized" | "needs") {
    setSponsorship(next);
    const value = next === "" ? null : next === "needs";
    if (value === (profile?.needsSponsorship ?? null)) return;
    await updateProfile.mutateAsync({ needsSponsorship: value });
    flash(setSponsorshipSaved);
  }

  async function handleCountryBlur() {
    const current = profile?.country ?? "";
    if (country.trim() === current) return;
    await updateProfile.mutateAsync({ country: country.trim() || null });
    flash(setCountrySaved);
  }

  async function handleRetake() {
    setRetaking(true);
    try {
      await updateProfile.mutateAsync({
        onboardedAt: null,
        onboardingSkipped: false,
      });
      router.push(`/${lang}/onboarding`);
    } finally {
      setRetaking(false);
    }
  }

  const showStack = role !== "" && TECH_ROLES.includes(role as RoleType);

  return (
    <div className="flex flex-col gap-8 max-w-[640px]">
      <header className="border-b border-rc-border pb-4">
        <Heading as="h2" size="lg">
          {t.settingsTab.targeting.cardTitle}
        </Heading>
        <Caption as="p" className="block mt-1">
          {t.settingsTab.targeting.cardDesc}
        </Caption>
      </header>

      {/* Role */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <FieldLabel htmlFor="targeting-role">
            {t.settingsTab.targeting.roleLabel}
          </FieldLabel>
          <SavedBadge show={roleSaved} label={t.settingsTab.savedBadge} />
        </div>
        <select
          id="targeting-role"
          value={role}
          onChange={(e) =>
            handleRoleChange(e.target.value as RoleType | "")
          }
          className={inputClass}
        >
          <option value="">—</option>
          {ROLES.map((r) => (
            <option key={r.id} value={r.id}>
              {t.onboarding.roles[r.id]}
            </option>
          ))}
        </select>
        <Caption as="p" className="block mt-1.5">
          {t.settingsTab.targeting.roleHint}
        </Caption>
        {role === "other" && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1.5">
              <FieldLabel htmlFor="targeting-role-other">
                {t.settingsTab.targeting.roleOtherLabel}
              </FieldLabel>
              <SavedBadge
                show={roleOtherSaved}
                label={t.settingsTab.savedBadge}
              />
            </div>
            <input
              id="targeting-role-other"
              type="text"
              value={roleOther}
              maxLength={60}
              onChange={(e) => setRoleOther(e.target.value)}
              onBlur={handleRoleOtherBlur}
              placeholder={t.settingsTab.targeting.roleOtherPlaceholder}
              className={inputClass}
            />
          </div>
        )}
      </div>

      {/* Experience */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <FieldLabel htmlFor="targeting-xp">
            {t.settingsTab.targeting.experienceLabel}
          </FieldLabel>
          <SavedBadge show={xpSaved} label={t.settingsTab.savedBadge} />
        </div>
        <select
          id="targeting-xp"
          value={xp}
          onChange={(e) =>
            handleXpChange(e.target.value as ExperienceLevel | "")
          }
          className={inputClass}
        >
          <option value="">—</option>
          {EXPERIENCE_LEVELS.map((x) => (
            <option key={x.id} value={x.id}>
              {t.onboarding.experience[x.id]} · {t.onboarding.experienceMeta[x.id]}
            </option>
          ))}
        </select>
        <Caption as="p" className="block mt-1.5">
          {t.settingsTab.targeting.experienceHint}
        </Caption>
      </div>

      {/* Tech stack — only for dev / data */}
      {showStack && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <FieldLabel>{t.settingsTab.targeting.techStackLabel}</FieldLabel>
            <SavedBadge
              show={stacksSaved}
              label={t.settingsTab.savedBadge}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {STACKS_PRIMARY.map((name) => {
              const idx = stacks.indexOf(name);
              const selected = idx >= 0;
              const atMax = !selected && stacks.length >= MAX_STACKS;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleStack(name)}
                  disabled={atMax}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 border rounded-full text-[13px] font-medium transition-all ${
                    selected
                      ? "border-rc-red bg-rc-red text-white"
                      : "border-rc-border bg-rc-surface text-rc-text hover:border-rc-red/40"
                  } ${atMax ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  {name}
                  {selected && (
                    <span className="font-mono text-[10px] opacity-85">
                      ✕
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <Caption as="p" className="block mt-2">
            {stacks.length}/{MAX_STACKS} · {t.settingsTab.targeting.techStackHint}
          </Caption>
        </div>
      )}

      {/* Languages */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <FieldLabel>{t.settingsTab.targeting.languagesLabel}</FieldLabel>
          <SavedBadge show={langsSaved} label={t.settingsTab.savedBadge} />
        </div>
        <div className="flex flex-wrap gap-2">
          {LANGS_PRIMARY.map((l) => {
            const selected = langs.includes(l.code);
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => toggleLang(l.code)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-full text-[13px] font-medium transition-all ${
                  selected
                    ? "border-rc-red bg-rc-red text-white"
                    : "border-rc-border bg-rc-surface text-rc-text hover:border-rc-red/40"
                }`}
              >
                <span className="font-mono text-[9px] uppercase opacity-70 tracking-[0.1em]">
                  {l.code}
                </span>
                {l.name}
                {selected && (
                  <span className="font-mono text-[10px] opacity-85">✕</span>
                )}
              </button>
            );
          })}
        </div>
        <Caption as="p" className="block mt-2">
          {t.settingsTab.targeting.languagesHint}
        </Caption>
      </div>

      {/* Work eligibility — the collectable blind spots (location, remote, visa) */}
      <div className="flex flex-col gap-5 border-t border-rc-border pt-6">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <FieldLabel htmlFor="targeting-remote">
              {t.settingsTab.targeting.remoteLabel}
            </FieldLabel>
            <SavedBadge show={remoteSaved} label={t.settingsTab.savedBadge} />
          </div>
          <select
            id="targeting-remote"
            value={remotePref}
            onChange={(e) =>
              handleRemoteChange(e.target.value as RemotePreference | "")
            }
            className={inputClass}
          >
            <option value="">—</option>
            {REMOTE_MODES.map((m) => (
              <option key={m.id} value={m.id}>
                {t.onboarding.work.mode[m.id]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <FieldLabel htmlFor="targeting-sponsorship">
              {t.settingsTab.targeting.workAuthLabel}
            </FieldLabel>
            <SavedBadge
              show={sponsorshipSaved}
              label={t.settingsTab.savedBadge}
            />
          </div>
          <select
            id="targeting-sponsorship"
            value={sponsorship}
            onChange={(e) =>
              handleSponsorshipChange(
                e.target.value as "" | "authorized" | "needs",
              )
            }
            className={inputClass}
          >
            <option value="">—</option>
            <option value="authorized">
              {t.onboarding.work.sponsorship.authorized}
            </option>
            <option value="needs">
              {t.onboarding.work.sponsorship.needs}
            </option>
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <FieldLabel htmlFor="targeting-country">
              {t.settingsTab.targeting.countryLabel}
            </FieldLabel>
            <SavedBadge show={countrySaved} label={t.settingsTab.savedBadge} />
          </div>
          <input
            id="targeting-country"
            type="text"
            value={country}
            maxLength={80}
            onChange={(e) => setCountry(e.target.value)}
            onBlur={handleCountryBlur}
            placeholder={t.onboarding.work.locationPlaceholder}
            className={inputClass}
          />
          <Caption as="p" className="block mt-1.5">
            {t.settingsTab.targeting.workHint}
          </Caption>
        </div>
      </div>

      {/* URL fields are managed elsewhere — link out */}
      <Caption as="p">{t.settingsTab.targeting.linksRedirect}</Caption>

      {/* Re-take onboarding */}
      <div className="border-t border-rc-border pt-6 flex flex-col gap-2 items-start">
        <Button
          variant="default"
          onClick={handleRetake}
          loading={retaking}
          trailingIcon={<ArrowRight size={14} />}
        >
          {t.settingsTab.targeting.retakeButton}
        </Button>
        <Caption as="p">{t.settingsTab.targeting.retakeHint}</Caption>
      </div>
    </div>
  );
}
