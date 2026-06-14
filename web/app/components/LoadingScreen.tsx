"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FileText, Search, Zap, ChevronRight, Lock } from "lucide-react";
import { Github, Linkedin } from "react-bootstrap-icons";
import { useLanguage } from "../../context/language";

type Props = {
  currentStep: string | null;
  streamText?: string;
  hasGithub: boolean;
  hasLinkedin: boolean;
  hasML: boolean;
  isHired?: boolean;
  onFinished?: () => void;
  /** Optional: parent can flag a hard failure to show the error treatment. */
  errored?: boolean;
  /** Optional: wired to the retry button in the error state. */
  onRetry?: () => void;
};

type StepStatus = "pending" | "running" | "done" | "skipped";

// The visible pipeline = the 5 hot-pass phases. Negotiation + finalizing run
// invisibly after the user is already on the result view (skeletons there).
const STEP_DEFS = [
  { id: "parsing_cv" as const, Icon: FileText },
  { id: "matching_skills" as const, Icon: Search },
  { id: "analyzing_linkedin" as const, Icon: Linkedin, needs: "linkedin" as const },
  { id: "analyzing_github" as const, Icon: Github, needs: "github" as const },
  { id: "dual_ai_analysis" as const, Icon: Zap, deep: true as const },
];

// Claude sub-task JSON keys emitted in the hot tool_use stream. Order matters
// for the reasoning panel + the deep-step sub-progress.
const SUBTASK_KEYS = [
  "audit_cv",
  "audit_jd_match",
  "ats_simulation",
  "cv_tone",
  "hidden_red_flags",
] as const;

const WATCHDOG_MS = 45_000;

/** Maps a backend SSE `currentStep` to a main-step index (skips share idx). */
function backendIndexOf(currentStep: string | null, total: number): number {
  if (!currentStep) return -1;
  if (currentStep === "done") return total;
  // Motivation-letter parsing + ATS run within the deep phase.
  if (currentStep === "parsing_motivation_letter" || currentStep === "running_ats") return 4;
  return STEP_DEFS.findIndex((s) => s.id === currentStep);
}

export function LoadingScreen({
  currentStep,
  streamText = "",
  hasGithub,
  hasLinkedin,
  hasML,
  isHired,
  onFinished,
  errored = false,
  onRetry,
}: Props) {
  const { t } = useLanguage();
  const ls = t.loadingScreen;
  const reduce = useReducedMotion();
  void hasML;
  void isHired;

  const total = STEP_DEFS.length;
  const skipped = (id: string) =>
    (id === "analyzing_linkedin" && !hasLinkedin) ||
    (id === "analyzing_github" && !hasGithub);

  const backendIdx = backendIndexOf(currentStep, total);
  const backendDone = currentStep === "done" || backendIdx >= total;

  // The currently-running main step: first non-skipped step at or after the
  // backend signal. Driven by real signals, not a cosmetic timer.
  let active = Math.max(0, backendIdx);
  while (active < total && skipped(STEP_DEFS[active].id)) active++;

  const statusOf = (i: number): StepStatus => {
    if (skipped(STEP_DEFS[i].id)) return "skipped";
    if (backendDone) return "done";
    if (i < active) return "done";
    if (i === active) return "running";
    return "pending";
  };

  // Deep sub-task detection.
  const subDone = SUBTASK_KEYS.map((k) => backendDone || streamText.includes(`"${k}"`));
  const subCount = subDone.filter(Boolean).length;
  const firstActiveSub = subDone.findIndex((d) => !d);
  const deepRunning = STEP_DEFS[active]?.deep === true && !backendDone;

  // Progress %, derived from completed steps + deep sub-progress.
  const nonSkippedTotal = STEP_DEFS.filter((s) => !skipped(s.id)).length;
  const doneCount = STEP_DEFS.filter((s, i) => !skipped(s.id) && statusOf(i) === "done").length;
  const pct = useMemo(() => {
    if (backendDone) return 100;
    const per = 100 / nonSkippedTotal;
    let p = doneCount * per;
    if (deepRunning) p += per * (subCount / SUBTASK_KEYS.length);
    return Math.min(99, Math.round(p));
  }, [backendDone, doneCount, deepRunning, subCount, nonSkippedTotal]);
  const stepNo = Math.min(nonSkippedTotal, doneCount + (backendDone ? 0 : 1));

  // Reasoning lines: each completed sub-task + the active one (humanized prose).
  const reasoningRows = SUBTASK_KEYS
    .map((k, i) => ({ key: k, i }))
    .filter(({ i }) => subDone[i] || i === firstActiveSub)
    .filter(() => deepRunning || backendDone || subCount > 0);

  // Collapsible reasoning — open by default on desktop only (avoid SSR mismatch).
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth > 640) setOpen(true);
  }, []);

  // Watchdog: soft "taking longer than expected" message, never a freeze.
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    if (backendDone) {
      setSlow(false);
      return;
    }
    const tid = setTimeout(() => setSlow(true), WATCHDOG_MS);
    return () => clearTimeout(tid);
  }, [backendDone]);

  // Finalize fallback — the parent normally swaps views on `analysis_done`;
  // this only protects against the parent never unmounting us.
  useEffect(() => {
    if (!backendDone || !onFinished) return;
    const tid = setTimeout(onFinished, reduce ? 0 : 1000);
    return () => clearTimeout(tid);
  }, [backendDone, onFinished, reduce]);

  const isError = errored;
  const title = isError ? ls.error.title : backendDone ? ls.readyTitle : ls.title;
  const subtitle = isError
    ? ls.error.subtitle
    : backendDone
      ? ls.readySubtitle
      : slow
        ? ls.slowSubtitle
        : ls.subtitle;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 14, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
        role="status"
        aria-live="polite"
        className="relative w-full max-w-[480px] overflow-hidden rounded-[24px] border border-rc-border bg-rc-surface p-7 shadow-[0_30px_70px_rgba(201,58,57,0.08)] md:p-8"
      >
        {/* top accent rule */}
        <div
          className={`absolute inset-x-0 top-0 h-[2px] opacity-50 ${
            isError ? "bg-gradient-to-r from-transparent via-rc-amber to-transparent" : "bg-gradient-to-r from-transparent via-rc-red to-transparent"
          }`}
        />

        {/* eyebrow */}
        <div className="mb-5 flex items-center gap-2.5">
          <span
            className={`h-[7px] w-[7px] rounded-full ${isError ? "bg-rc-amber" : "bg-rc-red motion-safe:animate-pulse"}`}
            aria-hidden
          />
          <span className={`font-mono text-[11px] font-bold uppercase tracking-[0.22em] ${isError ? "text-rc-amber" : "text-rc-red"}`}>
            {ls.eyebrow}
          </span>
          <span className="ml-auto font-mono text-[10.5px] uppercase tracking-[0.14em] text-rc-hint">
            {isError ? ls.error.eta : ls.eta}
          </span>
        </div>

        {/* title + subtitle */}
        <h1 className="mb-1.5 text-[26px] font-bold leading-[1.12] tracking-tight text-rc-text md:text-[27px]">
          {title}
        </h1>
        <p className="mb-5 max-w-[40ch] text-[14px] leading-relaxed text-rc-muted">{subtitle}</p>

        {/* progress */}
        {!isError && (
          <>
            <div className="mb-2 flex items-baseline justify-between">
              <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-rc-hint">
                {ls.stepLabel} {stepNo} / {nonSkippedTotal}
              </span>
              <span className="font-mono text-[13px] font-bold tabular-nums text-rc-text">{pct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-rc-border/60">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--rc-red),var(--rc-red-hover))] shadow-[0_0_12px_var(--rc-red-glow)] transition-[width] duration-700 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          </>
        )}

        {/* steps */}
        <ul className="mt-6 flex flex-col gap-0.5">
          {STEP_DEFS.map((step, i) => {
            const status = statusOf(i);
            const tag =
              status === "done"
                ? ls.tags.done
                : status === "running"
                  ? ls.tags.running
                  : status === "skipped"
                    ? ls.tags.skipped
                    : "";
            return (
              <li key={step.id}>
                <div
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors duration-300 ${
                    status === "running" ? "border-rc-red-border bg-rc-red-bg" : "border-transparent"
                  }`}
                >
                  <span className="grid h-[22px] w-[22px] flex-none place-items-center">
                    {status === "done" ? (
                      <motion.span
                        initial={reduce ? false : { scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 18 }}
                        className="grid h-[18px] w-[18px] place-items-center rounded-full bg-rc-red"
                      >
                        <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="#fff" strokeWidth={3}>
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.span>
                    ) : status === "running" ? (
                      <span className="h-4 w-4 rounded-full border-2 border-rc-red-border border-t-rc-red motion-safe:animate-spin" />
                    ) : (
                      <span className={`h-[15px] w-[15px] rounded-full border-2 border-rc-border ${status === "skipped" ? "border-dashed" : ""}`} />
                    )}
                  </span>
                  <span
                    className={`text-[14px] ${
                      status === "running"
                        ? "font-semibold text-rc-text"
                        : status === "done"
                          ? "font-medium text-rc-text"
                          : status === "skipped"
                            ? "font-medium text-rc-hint line-through decoration-rc-border"
                            : "font-medium text-rc-hint"
                    }`}
                  >
                    {ls.steps[step.id as keyof typeof ls.steps]}
                  </span>
                  {tag && (
                    <span
                      className={`ml-auto font-mono text-[9.5px] uppercase tracking-[0.14em] ${
                        status === "running" ? "text-rc-red" : status === "done" ? "text-rc-green" : "text-rc-hint"
                      }`}
                    >
                      {tag}
                    </span>
                  )}
                </div>

                {/* deep step sub-tasks */}
                {step.deep && status === "running" && (
                  <div className="flex flex-col gap-1 py-1 pl-[47px]">
                    {SUBTASK_KEYS.map((k, si) => (
                      <div
                        key={k}
                        className={`flex items-center gap-2 font-mono text-[10.5px] ${si <= firstActiveSub || subDone[si] ? "text-rc-muted" : "text-rc-hint"}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${subDone[si] || si === firstActiveSub ? "bg-rc-red" : "bg-rc-border"}`} />
                        {(ls.claudeTasks as string[])[si]}
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {!isError && (
          <>
            {/* divider */}
            <div className="my-3 h-px bg-gradient-to-r from-transparent via-rc-border to-transparent" />

            {/* reasoning */}
            <button
              type="button"
              aria-expanded={open}
              aria-controls="rc-reasoning"
              onClick={() => setOpen((o) => !o)}
              className="flex w-full items-center gap-2.5 py-2.5"
            >
              <ChevronRight size={13} className={`text-rc-hint transition-transform duration-300 ${open ? "rotate-90" : ""}`} />
              <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-rc-hint">{ls.reasoningToggle}</span>
              <span className="ml-auto font-mono text-[9.5px] italic text-rc-hint">{ls.reasoningWho}</span>
            </button>
            <div
              id="rc-reasoning"
              className="overflow-hidden transition-[max-height] duration-500"
              style={{ maxHeight: open ? 200 : 0 }}
            >
              <div
                className="mt-1 h-[150px] overflow-y-auto rounded-xl border border-rc-border bg-rc-surface-raised px-4 py-3.5 font-mono text-[12px] leading-[1.7] text-rc-muted"
                style={{
                  maskImage: "linear-gradient(to bottom, transparent 0, #000 18px, #000 calc(100% - 18px), transparent 100%)",
                  WebkitMaskImage: "linear-gradient(to bottom, transparent 0, #000 18px, #000 calc(100% - 18px), transparent 100%)",
                }}
              >
                {reasoningRows.length === 0 ? (
                  <span className="italic text-rc-hint">{ls.liveThoughtsPlaceholder}</span>
                ) : (
                  reasoningRows.map(({ key, i }) => (
                    <motion.div
                      key={key}
                      initial={reduce ? false : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4 }}
                    >
                      {ls.reasoning[key as keyof typeof ls.reasoning]}
                      {i === firstActiveSub && !backendDone && (
                        <span className="ml-0.5 inline-block h-3 w-[6px] translate-y-0.5 bg-rc-red motion-safe:animate-pulse" />
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* error retry */}
        {isError && onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rc-red px-[18px] py-3 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[var(--rc-red-hover)] active:scale-[0.97]"
          >
            ↻ {ls.error.retry}
          </button>
        )}

        {/* footer */}
        {!isError && (
          <div className="mt-4 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.1em] text-rc-hint">
            <Lock size={11} />
            <span>{ls.footer}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}
