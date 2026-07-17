"use client";

import { useRef } from "react";
import { Check, Upload, FileText } from "lucide-react";
import type { Dictionary } from "../../(locale)/[lang]/dictionaries";
import type { ExperienceLevel, RoleType } from "../../../lib/queries";
import { StepHeader } from "./StepHeader";

const CV_ACCEPT =
  ".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp";

export function StepDone({
  t,
  role,
  roleOther,
  xp,
  stacks,
  cvFile,
  onCvChange,
}: {
  t: Dictionary;
  role: RoleType | null;
  roleOther: string;
  xp: ExperienceLevel | null;
  stacks: string[];
  cvFile: File | null;
  onCvChange: (file: File | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const reveal = t.onboarding.reveal;

  // Identity chips composed from the answers already in state. Falls back
  // gracefully when a value is missing (role is required, so it always exists).
  const roleLabel =
    role === "other"
      ? roleOther.trim() || t.onboarding.roles.other
      : role
        ? t.onboarding.roles[role]
        : null;
  const xpLabel = xp ? t.onboarding.experience[xp] : null;
  const topStack = stacks[0] ?? null;
  const chips = [xpLabel, roleLabel, topStack].filter(Boolean) as string[];

  // Reveal bullets keyed by role, generic "other" fallback for a null role.
  const points = reveal.points[role ?? "other"] ?? reveal.points.other;

  return (
    <section className="text-center max-w-[640px] mx-auto">
      <div
        className="w-16 h-16 mx-auto mb-6 bg-rc-red rounded-full flex items-center justify-center shadow-[0_12px_32px_rgba(201,58,57,0.32)]"
        style={{ animation: "rcPop .5s cubic-bezier(.2,1.4,.4,1)" }}
      >
        <Check size={30} strokeWidth={3} className="text-white" />
      </div>

      <StepHeader
        eyebrow={t.onboarding.step6.eyebrow}
        title={t.onboarding.step6.title}
        titleAccent={t.onboarding.step6.titleAccent}
        centered
      >
        {t.onboarding.step6.sub}
      </StepHeader>

      {/* Identity chips: proof the flow listened. */}
      {chips.length > 0 && (
        <div className="mb-8">
          <div className="font-mono text-[10px] tracking-[0.24em] uppercase text-rc-hint mb-3">
            {reveal.tunedFor}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {chips.map((chip) => (
              <span
                key={chip}
                className="font-mono text-[12px] px-3 py-1.5 rounded-full bg-rc-surface border border-rc-border text-rc-text"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Value reveal: what their answers unlocked. */}
      <div className="text-left bg-rc-surface border border-rc-border rounded-xl p-6 mb-6">
        <div className="font-mono text-[10px] tracking-[0.24em] uppercase text-rc-red mb-4">
          {reveal.screenTitle}
        </div>
        <ul className="flex flex-col gap-3">
          {points.map((point) => (
            <li key={point} className="flex gap-3 items-start">
              <Check
                size={16}
                strokeWidth={3}
                className="text-rc-red mt-0.5 shrink-0"
              />
              <span className="text-[14px] leading-[1.5] text-rc-text">
                {point}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Optional inline CV drop: collapse the gap to first value. */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="w-full flex items-center gap-3 text-left px-5 py-4 rounded-xl border border-dashed border-rc-border hover:border-rc-red/40 transition-colors"
      >
        {cvFile ? (
          <>
            <FileText size={20} className="text-rc-green shrink-0" />
            <span className="min-w-0">
              <span className="block text-[14px] text-rc-text truncate">
                {cvFile.name}
              </span>
              <span className="block font-mono text-[11px] text-rc-green">
                {reveal.dropStaged}
              </span>
            </span>
          </>
        ) : (
          <>
            <Upload size={20} className="text-rc-hint shrink-0" />
            <span>
              <span className="block text-[14px] text-rc-text">
                {reveal.dropTitle}
              </span>
              <span className="block font-mono text-[11px] text-rc-hint">
                {reveal.dropHint}
              </span>
            </span>
          </>
        )}
      </button>
      <input
        type="file"
        ref={fileRef}
        accept={CV_ACCEPT}
        className="hidden"
        onChange={(e) => onCvChange(e.target.files?.[0] ?? null)}
      />

      <style>{`
        @keyframes rcPop {
          0% { transform: scale(0.4); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </section>
  );
}
