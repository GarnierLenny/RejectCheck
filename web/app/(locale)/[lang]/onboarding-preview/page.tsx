"use client";

// DEBUG / PREVIEW ONLY — renders the full onboarding flow with NO auth guard and
// NO persistence, so the UI (incl. the work-eligibility step) can be reviewed
// without logging in. Nothing is saved; "Finish" just advances to the done view.
// Remove or gate this route before it matters. Real flow: ../onboarding/page.tsx.

import { useMemo, useState } from "react";
import { useLanguage } from "../../../../context/language";
import { TECH_ROLES } from "../../../../lib/onboarding-data";
import type {
  ExperienceLevel,
  RemotePreference,
  RoleType,
} from "../../../../lib/queries";
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

type StepId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export default function OnboardingPreviewPage() {
  const { t } = useLanguage();

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
  const [doneCvFile, setDoneCvFile] = useState<File | null>(null);

  const showStack = role !== null && TECH_ROLES.includes(role);
  const visibleSteps: StepId[] = showStack
    ? [1, 2, 3, 4, 7, 5, 6]
    : [1, 2, 4, 7, 5, 6];
  const currentIndex = visibleSteps.indexOf(currentStep);
  const totalSteps = visibleSteps.length - 1;

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

  // Primary CTA per step. No persistence: "Finish" just shows the done view.
  const primary = useMemo(() => {
    switch (currentStep) {
      case 1: {
        const canContinue =
          role !== null && (role !== "other" || roleOther.trim().length > 0);
        return { label: t.onboarding.continue, onClick: nextStep, disabled: !canContinue, showHelper: role === "other" };
      }
      case 2:
        return { label: t.onboarding.continue, onClick: nextStep, disabled: xp === null, showHelper: false };
      case 3:
        return { label: t.onboarding.continue, onClick: nextStep, disabled: stacks.length === 0, showHelper: true };
      case 4:
        return { label: t.onboarding.continue, onClick: nextStep, disabled: langs.length === 0, showHelper: true };
      case 7:
        return { label: t.onboarding.continue, onClick: nextStep, disabled: false, showHelper: true };
      case 5:
        return { label: t.onboarding.step5.finish, onClick: () => goToStep(6), disabled: false, showHelper: true };
      case 6:
        return { label: doneCvFile ? t.onboarding.step6.ctaWithCv : t.onboarding.step6.cta, onClick: () => goToStep(1), disabled: false, showHelper: false };
    }
  }, [currentStep, role, roleOther, xp, stacks.length, langs.length, doneCvFile, t, nextStep]);

  const stepLabel = (() => {
    if (currentStep === 6)
      return t.onboarding.nav.stepLabel.replace("{n}", "✓").replace("{total}", String(totalSteps).padStart(2, "0"));
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
        onSkip={() => goToStep(6)}
        skipDisabled={currentStep === 6}
        fillPercent={fillPercent}
      />

      <main className="pt-[88px] pb-[140px] px-5 md:px-8 flex flex-col items-center relative z-10">
        <div key={currentStep} className="w-full max-w-[1040px]" style={{ animation: "rcStepIn .42s cubic-bezier(.2,.7,.2,1)" }}>
          {currentStep === 1 && (
            <StepRole t={t} role={role} roleOther={roleOther} onRoleChange={setRole} onRoleOtherChange={setRoleOther} />
          )}
          {currentStep === 2 && <StepExperience t={t} experience={xp} onChange={setXp} />}
          {currentStep === 3 && <StepStack t={t} stacks={stacks} onToggle={toggleStack} />}
          {currentStep === 4 && <StepLanguages t={t} langs={langs} onToggle={toggleLang} />}
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
              session={null}
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
          primaryLoading={false}
          helper={
            primary.showHelper && currentStep !== 5 && currentStep !== 6 ? (
              <>
                Press{" "}
                <kbd className="font-mono bg-rc-surface border border-rc-border rounded px-[7px] py-0.5 text-rc-text text-[10px]">↵</kbd>{" "}
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
