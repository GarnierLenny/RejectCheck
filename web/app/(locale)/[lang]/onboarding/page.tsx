"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { setPendingCv } from "../../../../lib/pending-cv";
import { useAuth } from "../../../../context/auth";
import { useLanguage } from "../../../../context/language";
import { useProfile } from "../../../../lib/queries";
import { useUpdateProfile } from "../../../../lib/mutations";
import { TECH_ROLES } from "../../../../lib/onboarding-data";
import type { ExperienceLevel, RemotePreference, RoleType } from "../../../../lib/queries";
import { OnboardingTopbar } from "../../../components/onboarding/OnboardingTopbar";
import { OnboardingBottomBar } from "../../../components/onboarding/OnboardingBottomBar";
import { StepRole } from "../../../components/onboarding/StepRole";
import { StepExperience } from "../../../components/onboarding/StepExperience";
import { StepStack } from "../../../components/onboarding/StepStack";
import { StepLanguages } from "../../../components/onboarding/StepLanguages";
import { StepLinks } from "../../../components/onboarding/StepLinks";
import { StepWork } from "../../../components/onboarding/StepWork";
import { StepDone } from "../../../components/onboarding/StepDone";
import { BlueprintBackdrop } from "../../../components/BlueprintBackdrop";

const MAX_STACKS = 3;

// Flow order lives in `visibleSteps`, not in these numbers. 7 (work) slots in
// after languages, before links, without renumbering the existing steps.
type StepId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

function buildPayload(args: {
  role: RoleType | null;
  roleOther: string;
  xp: ExperienceLevel | null;
  stacks: string[];
  langs: string[];
  github: string;
  portfolio: string;
  linkedinUrl: string | null;
  remotePreference: RemotePreference | null;
  needsSponsorship: boolean | null;
  country: string;
}) {
  return {
    roleType: args.role,
    roleTypeOther: args.role === "other" ? args.roleOther.trim() : null,
    experienceLevel: args.xp,
    techStack: args.stacks,
    languages: args.langs,
    githubUsername: args.github.trim() || undefined,
    portfolioUrl: args.portfolio.trim() || undefined,
    linkedinUrl: args.linkedinUrl ?? undefined,
    remotePreference: args.remotePreference,
    needsSponsorship: args.needsSponsorship,
    country: args.country.trim() || null,
  };
}

export default function OnboardingPage() {
  const router = useRouter();
  const { t, localePath } = useLanguage();
  const { user, session, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [currentStep, setCurrentStep] = useState<StepId>(1);
  const [role, setRole] = useState<RoleType | null>(null);
  const [roleOther, setRoleOther] = useState("");
  const [xp, setXp] = useState<ExperienceLevel | null>(null);
  const [stacks, setStacks] = useState<string[]>([]);
  const [langs, setLangs] = useState<string[]>([]);
  const [github, setGithub] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState<string | null>(null);
  const [remotePref, setRemotePref] = useState<RemotePreference | null>(null);
  const [needsSponsorship, setNeedsSponsorship] = useState<boolean | null>(null);
  const [country, setCountry] = useState("");
  // Optional CV staged on the final (Done) screen to run the first check
  // immediately: handed to /analyze via setPendingCv, mirroring the landing hero.
  const [doneCvFile, setDoneCvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Pre-fill from profile (handles re-take from Settings + reload).
  useEffect(() => {
    if (!profile || hydrated) return;
    setRole(profile.roleType ?? null);
    setRoleOther(profile.roleTypeOther ?? "");
    setXp(profile.experienceLevel ?? null);
    setStacks(profile.techStack ?? []);
    setLangs(profile.languages ?? []);
    setGithub(profile.githubUsername ?? "");
    setPortfolio(profile.portfolioUrl ?? "");
    setLinkedinUrl(profile.linkedinUrl ?? null);
    setRemotePref(profile.remotePreference ?? null);
    setNeedsSponsorship(profile.needsSponsorship ?? null);
    setCountry(profile.country ?? "");
    setHydrated(true);
  }, [profile, hydrated]);

  // Auth guard.
  useEffect(() => {
    if (!authLoading && !user) router.replace(localePath("/login"));
  }, [authLoading, user, router, localePath]);

  const showStack = role !== null && TECH_ROLES.includes(role);

  // Visible steps in flow order, including the success view.
  const visibleSteps: StepId[] = showStack
    ? [1, 2, 3, 4, 7, 5, 6]
    : [1, 2, 4, 7, 5, 6];
  const currentIndex = visibleSteps.indexOf(currentStep);
  // Total exposed in step counter (excludes the final Done).
  const totalSteps = visibleSteps.length - 1;

  // Progress fill: half of the way through the current step (so it animates as you advance).
  const fillPercent = useMemo(() => {
    if (currentStep === 6) return 100;
    return (currentIndex / totalSteps) * 100 + (1 / totalSteps) * 50;
  }, [currentIndex, totalSteps, currentStep]);

  function goToStep(step: StepId) {
    setCurrentStep(step);
  }

  function nextStep() {
    const next = visibleSteps[currentIndex + 1];
    if (next) goToStep(next);
  }
  function prevStep() {
    const prev = visibleSteps[currentIndex - 1];
    if (prev) goToStep(prev);
  }

  function handleRoleChange(next: RoleType) {
    setRole(next);
  }

  function handleXpChange(next: ExperienceLevel) {
    setXp(next);
  }

  function toggleStack(name: string) {
    setStacks((prev) => {
      const idx = prev.indexOf(name);
      if (idx >= 0) return prev.filter((s) => s !== name);
      if (prev.length >= MAX_STACKS) return prev;
      return [...prev, name];
    });
  }
  function toggleLang(code: string) {
    setLangs((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  async function handleFinishStep5() {
    setSubmitting(true);
    try {
      await updateProfile.mutateAsync({
        ...buildPayload({
          role,
          roleOther,
          xp,
          stacks,
          langs,
          github,
          portfolio,
          linkedinUrl,
          remotePreference: remotePref,
          needsSponsorship,
          country,
        }),
        onboardedAt: new Date().toISOString(),
        onboardingSkipped: false,
      });
      goToStep(6);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSkip() {
    setSubmitting(true);
    try {
      await updateProfile.mutateAsync({
        ...buildPayload({
          role,
          roleOther,
          xp,
          stacks,
          langs,
          github,
          portfolio,
          linkedinUrl,
          remotePreference: remotePref,
          needsSponsorship,
          country,
        }),
        onboardingSkipped: true,
      });
      router.push(localePath("/dashboard"));
    } finally {
      setSubmitting(false);
    }
  }

  // Bottom bar primary CTA varies per step.
  const primary = useMemo(() => {
    switch (currentStep) {
      case 1: {
        const canContinue =
          role !== null &&
          (role !== "other" || roleOther.trim().length > 0);
        return {
          label: t.onboarding.continue,
          onClick: nextStep,
          disabled: !canContinue,
          showHelper: role === "other",
        };
      }
      case 2:
        return {
          label: t.onboarding.continue,
          onClick: nextStep,
          disabled: xp === null,
          showHelper: false,
        };
      case 3:
        return {
          label: t.onboarding.continue,
          onClick: nextStep,
          disabled: stacks.length === 0,
          showHelper: true,
        };
      case 4:
        return {
          label: t.onboarding.continue,
          onClick: nextStep,
          disabled: langs.length === 0,
          showHelper: true,
        };
      case 7:
        // Optional step: never gate Continue on an answer.
        return {
          label: t.onboarding.continue,
          onClick: nextStep,
          disabled: false,
          showHelper: true,
        };
      case 5:
        return {
          label: submitting
            ? t.onboarding.step5.savingState
            : t.onboarding.step5.finish,
          onClick: handleFinishStep5,
          disabled: submitting,
          showHelper: true,
        };
      case 6:
        return {
          label: doneCvFile ? t.onboarding.step6.ctaWithCv : t.onboarding.step6.cta,
          onClick: () => {
            if (doneCvFile) setPendingCv(doneCvFile, "");
            router.push(localePath("/analyze"));
          },
          disabled: false,
          showHelper: false,
        };
    }
  }, [
    currentStep,
    role,
    roleOther,
    xp,
    stacks.length,
    langs.length,
    submitting,
    doneCvFile,
    t,
    router,
    localePath,
    nextStep,
    handleFinishStep5,
  ]);

  // Enter-to-continue keyboard shortcut.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Enter") return;
      const target = e.target as HTMLElement | null;
      if (target && target.tagName === "TEXTAREA") return;
      if (!primary || primary.disabled) return;
      e.preventDefault();
      primary.onClick();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [primary]);

  if (authLoading || profileLoading || !hydrated) {
    return (
      <div className="min-h-screen bg-rc-bg flex items-center justify-center">
        <span className="font-mono text-[11px] tracking-widest uppercase text-rc-hint animate-pulse">
          {t.common.loading}
        </span>
      </div>
    );
  }

  const stepLabel = (() => {
    if (currentStep === 6)
      return t.onboarding.nav.stepLabel
        .replace("{n}", "✓")
        .replace("{total}", String(totalSteps).padStart(2, "0"));
    return t.onboarding.nav.stepLabel
      .replace("{n}", String(currentIndex + 1).padStart(2, "0"))
      .replace("{total}", String(totalSteps).padStart(2, "0"));
  })();

  const showBack = currentIndex > 0 && currentStep !== 6;

  return (
    <div className="min-h-screen bg-rc-bg text-rc-text overflow-x-hidden relative isolate">
      <BlueprintBackdrop variant="light" />
      <OnboardingTopbar
        stepLabel={stepLabel}
        skipLabel={t.onboarding.nav.skip}
        onSkip={handleSkip}
        skipDisabled={submitting || currentStep === 6}
        fillPercent={fillPercent}
      />

      <main className="pt-[88px] pb-[140px] px-5 md:px-8 flex flex-col items-center relative z-10">
        <div
          key={currentStep}
          className="w-full max-w-[1040px]"
          style={{
            animation: "rcStepIn .42s cubic-bezier(.2,.7,.2,1)",
          }}
        >
          {currentStep === 1 && (
            <StepRole
              t={t}
              role={role}
              roleOther={roleOther}
              onRoleChange={handleRoleChange}
              onRoleOtherChange={setRoleOther}
            />
          )}
          {currentStep === 2 && (
            <StepExperience t={t} experience={xp} onChange={handleXpChange} />
          )}
          {currentStep === 3 && (
            <StepStack t={t} stacks={stacks} onToggle={toggleStack} />
          )}
          {currentStep === 4 && (
            <StepLanguages t={t} langs={langs} onToggle={toggleLang} />
          )}
          {currentStep === 7 && (
            <StepWork
              t={t}
              remotePreference={remotePref}
              needsSponsorship={needsSponsorship}
              country={country}
              onRemoteChange={setRemotePref}
              onSponsorshipChange={setNeedsSponsorship}
              onCountryChange={setCountry}
            />
          )}
          {currentStep === 5 && role && (
            <StepLinks
              t={t}
              role={role}
              githubUsername={github}
              portfolioUrl={portfolio}
              linkedinUrl={linkedinUrl}
              onGithubChange={setGithub}
              onPortfolioChange={setPortfolio}
              onLinkedinUrlChange={setLinkedinUrl}
              session={session}
            />
          )}
          {currentStep === 6 && (
            <StepDone
              t={t}
              role={role}
              roleOther={roleOther}
              xp={xp}
              stacks={stacks}
              cvFile={doneCvFile}
              onCvChange={setDoneCvFile}
            />
          )}
        </div>
      </main>

      {primary && (
        <OnboardingBottomBar
          onBack={prevStep}
          showBack={showBack}
          onPrimary={primary.onClick}
          primaryLabel={primary.label}
          primaryDisabled={primary.disabled}
          primaryLoading={submitting}
          helper={
            primary.showHelper && currentStep !== 5 && currentStep !== 6 ? (
              <>
                Press{" "}
                <kbd className="font-mono bg-rc-surface border border-rc-border rounded px-[7px] py-0.5 text-rc-text text-[10px]">
                  ↵
                </kbd>{" "}
                Enter
              </>
            ) : currentStep === 5 ? (
              t.onboarding.step5.helperLine
            ) : null
          }
        />
      )}

      <style>{`
        @keyframes rcStepIn {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
