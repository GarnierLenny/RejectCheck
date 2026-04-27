"use client";

import { Suspense, useState } from "react";
import { toast } from "sonner";
import { Navbar } from "../../components/Navbar";
import { useAuth } from "../../../context/auth";
import { useLanguage } from "../../../context/language";
import {
  ChallengeApiError,
  FinalResponse,
  useChallengeStreak,
  useDayStats,
  useSubmitFinalAnswer,
  useSubmitFirstAnswer,
  useTodayChallenge,
} from "../../../lib/challenge";
import { CodeSnippet } from "./components/CodeSnippet";
import { ChallengeBadges } from "./components/ChallengeBadges";
import { AnonymousOverlay } from "./components/AnonymousOverlay";
import { ScoreCard } from "./components/ScoreCard";
import { PushbackCard } from "./components/PushbackCard";
import { FirstReviewQuote } from "./components/FirstReviewQuote";
import { SubmitButton } from "./components/SubmitButton";
import { ChallengeLeaderboardCard } from "./components/ChallengeLeaderboardCard";

type Stage = "idle" | "challenged" | "completed";

function ChallengeContent() {
  const { t, locale } = useLanguage();
  const { user, loading: authLoading } = useAuth();

  const challengeQuery = useTodayChallenge();
  const streakQuery = useChallengeStreak();
  const statsQuery = useDayStats(challengeQuery.data?.id);

  const submitFirst = useSubmitFirstAnswer();
  const submitFinal = useSubmitFinalAnswer();

  const [stage, setStage] = useState<Stage>("idle");
  const [firstAnswer, setFirstAnswer] = useState("");
  const [secondAnswer, setSecondAnswer] = useState("");
  const [aiChallenge, setAiChallenge] = useState<string | null>(null);
  const [finalResult, setFinalResult] = useState<FinalResponse | null>(null);

  const dateLabel = challengeQuery.data?.date
    ? new Date(challengeQuery.data.date).toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  async function handleSubmitFirst() {
    if (!challengeQuery.data) return;
    try {
      const res = await submitFirst.mutateAsync({
        challengeId: challengeQuery.data.id,
        firstAnswer: firstAnswer.trim(),
      });
      setAiChallenge(res.aiChallenge);
      setStage("challenged");
    } catch (err) {
      if (err instanceof ChallengeApiError && err.status === 409) {
        const payload = err.payload as {
          firstAnswer?: string;
          aiChallenge?: string;
          attempt?: {
            score: number;
            scoreBreakdown: FinalResponse["scoreBreakdown"] & {
              feedback?: string;
              missed_issues?: string[];
            };
          };
          issues?: FinalResponse["issues"];
          stats?: FinalResponse["stats"];
        } | null;
        if (err.code === "FIRST_ANSWER_PENDING" && payload?.aiChallenge) {
          setFirstAnswer(payload.firstAnswer ?? firstAnswer);
          setAiChallenge(payload.aiChallenge);
          setStage("challenged");
          return;
        }
        if (err.code === "ALREADY_COMPLETED" && payload?.attempt && payload.stats) {
          const a = payload.attempt;
          setFinalResult({
            score: a.score,
            scoreBreakdown: a.scoreBreakdown,
            feedback: a.scoreBreakdown?.feedback ?? "",
            missed_issues: a.scoreBreakdown?.missed_issues ?? [],
            issues: payload.issues ?? [],
            stats: payload.stats,
            streak: { currentStreak: 0, longestStreak: 0, lastCompletedAt: null },
          });
          setStage("completed");
          toast.message(t.challenge.errors.alreadyCompleted);
          return;
        }
      }
      const message = err instanceof Error ? err.message : t.challenge.errors.submitFailed;
      toast.error(message);
    }
  }

  async function handleSubmitFinal() {
    if (!challengeQuery.data) return;
    try {
      const res = await submitFinal.mutateAsync({
        challengeId: challengeQuery.data.id,
        secondAnswer: secondAnswer.trim(),
      });
      setFinalResult(res);
      setStage("completed");
    } catch (err) {
      const message = err instanceof Error ? err.message : t.challenge.errors.submitFailed;
      toast.error(message);
    }
  }

  const isAnonymous = !authLoading && !user;
  const streak = streakQuery.data?.currentStreak ?? 0;
  const completionsToday = (t.challenge.completionsToday as string).replace(
    "{count}",
    String(statsQuery.data?.completions ?? 0),
  );
  const streakLabel = (t.challenge.streakDays as string).replace("{count}", String(streak));

  if (challengeQuery.isLoading) {
    return (
      <div className="w-full px-4 md:px-6 py-12 text-center text-rc-muted">
        {t.common.loading}
      </div>
    );
  }

  if (challengeQuery.isError || !challengeQuery.data) {
    return (
      <div className="w-full px-4 md:px-6 py-12 text-center text-rc-muted">
        {t.challenge.errors.loadFailed}
      </div>
    );
  }

  const challenge = challengeQuery.data;
  const canSubmit = !isAnonymous;

  return (
    <div className="w-full px-4 md:px-6 py-4 flex flex-col gap-4 md:flex-1 md:min-h-0">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:flex-1 md:min-h-0">
        {/* Left: title + code snippet - scrolls internally on desktop */}
        <div className="flex flex-col gap-4 md:overflow-y-auto md:h-full md:min-h-0">
          <h1 className="text-[24px] md:text-[30px] font-bold text-rc-text leading-tight">
            {challenge.title}
          </h1>
          <CodeSnippet code={challenge.snippet} language={challenge.language} />
        </div>

        {/* Right: header + question + state machine - scrolls internally on desktop */}
        <div className="flex flex-col gap-5 md:overflow-y-auto md:h-full md:min-h-0 md:pr-2">
          <header className="flex flex-wrap items-end justify-between gap-3 pb-4 border-b border-rc-border">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-rc-hint">
                {t.challenge.title}
              </p>
              <p className="text-[13px] text-rc-muted">{dateLabel}</p>
              <ChallengeBadges
                focusTag={challenge.focusTag}
                difficulty={challenge.difficulty}
                estimatedTime={challenge.estimatedTime}
                language={challenge.language}
              />
            </div>
            <div className="flex flex-col items-end gap-1">
              {user && streak > 0 && (
                <p className="font-mono text-[12px] text-rc-red">🔥 {streakLabel}</p>
              )}
              <p className="font-mono text-[11px] text-rc-muted">{completionsToday}</p>
            </div>
          </header>
          <section className="space-y-2">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-rc-hint">
              {t.challenge.questionLabel}
            </p>
            <p className="text-[16px] text-rc-text leading-relaxed">{challenge.question}</p>
          </section>

          {(() => {
            if (stage === "completed" && finalResult) {
              return (
                <>
                  <ScoreCard challenge={challenge} result={finalResult} />
                  <ChallengeLeaderboardCard
                    challengeId={challenge.id}
                    score={finalResult.score}
                    challengeTitle={challenge.title}
                  />
                </>
              );
            }
            if (isAnonymous) {
              return <AnonymousOverlay />;
            }

            const renderStage: "idle" | "loading" | "challenged" =
              submitFirst.isPending ? "loading" : stage === "challenged" ? "challenged" : "idle";

            const onTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                if (renderStage === "idle" && firstAnswer.trim()) handleSubmitFirst();
                if (renderStage === "challenged" && secondAnswer.trim()) handleSubmitFinal();
              }
            };

            if (renderStage === "loading") {
              return (
                <>
                  <FirstReviewQuote text={firstAnswer} />
                  <PushbackCard loading />
                </>
              );
            }

            if (renderStage === "challenged" && aiChallenge) {
              return (
                <>
                  <FirstReviewQuote text={firstAnswer} />
                  <PushbackCard text={aiChallenge} />
                  <textarea
                    value={secondAnswer}
                    onChange={(e) => setSecondAnswer(e.target.value)}
                    onKeyDown={onTextareaKeyDown}
                    placeholder={t.challenge.socratic.placeholder}
                    rows={8}
                    autoFocus
                    className="w-full border border-rc-border rounded-xl px-4 py-3 text-[14px] font-mono bg-white focus:border-rc-red focus:outline-none resize-y"
                  />
                  <SubmitButton
                    label={t.challenge.socratic.submit}
                    pendingLabel={t.common.processing}
                    onClick={handleSubmitFinal}
                    pending={submitFinal.isPending}
                    disabled={submitFinal.isPending || !secondAnswer.trim()}
                  />
                </>
              );
            }

            return (
              <>
                <textarea
                  value={firstAnswer}
                  onChange={(e) => setFirstAnswer(e.target.value)}
                  onKeyDown={onTextareaKeyDown}
                  placeholder={t.challenge.firstAnswer.placeholder}
                  rows={12}
                  disabled={!canSubmit}
                  className="w-full border border-rc-border rounded-xl px-4 py-3 text-[14px] font-mono bg-white focus:border-rc-red focus:outline-none resize-y"
                />
                <SubmitButton
                  label={t.challenge.firstAnswer.submit}
                  pendingLabel={t.common.processing}
                  onClick={handleSubmitFirst}
                  pending={submitFirst.isPending}
                  disabled={submitFirst.isPending || !firstAnswer.trim() || !canSubmit}
                />
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

export default function ChallengePage() {
  return (
    <div className="md:h-screen md:flex md:flex-col md:overflow-hidden">
      <Navbar activePage="challenge" />
      <Suspense fallback={<div className="py-12 text-center text-rc-muted">Loading…</div>}>
        <ChallengeContent />
      </Suspense>
    </div>
  );
}
