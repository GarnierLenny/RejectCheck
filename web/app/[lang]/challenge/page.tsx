"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
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
import { ChallengeLeaderboardCard } from "./components/ChallengeLeaderboardCard";
import { ChallengeStatsStrip } from "./components/ChallengeStatsStrip";
import { ChallengeStreakTrack } from "./components/ChallengeStreakTrack";
import { ReviewComposer, type ReviewComposerHandle } from "./components/ReviewComposer";

type Stage = "idle" | "challenged" | "completed";

function BriefCollapse({
  title,
  items,
  emptyText,
  progressive = false,
  itemLabel,
}: {
  title: string;
  items: string[];
  emptyText: string;
  progressive?: boolean;
  itemLabel?: string;
}) {
  return (
    <details className="ch-collapse">
      <summary className="ch-collapse__head">
        <span className="ch-collapse__chev" aria-hidden>
          ›
        </span>
        <span className="ch-collapse__title">{title}</span>
        <span className="ch-collapse__count">{items.length || "—"}</span>
      </summary>
      <div className="ch-collapse__body">
        {items.length === 0 ? (
          <p className="ch-collapse__empty">{emptyText}</p>
        ) : progressive ? (
          <div className="ch-collapse__progressive">
            {items.map((it, i) => {
              const num = String(i + 1).padStart(2, "0");
              const label = itemLabel
                ? itemLabel.replace("{n}", num)
                : `Item ${num}`;
              return (
                <details key={i} className="ch-hint">
                  <summary className="ch-hint__head">
                    <span className="ch-hint__num">{num}</span>
                    <span className="ch-hint__label">{label}</span>
                    <span className="ch-hint__chev" aria-hidden>
                      ›
                    </span>
                  </summary>
                  <div className="ch-hint__body">
                    <ReactMarkdown
                      allowedElements={["p", "code", "strong", "em"]}
                      unwrapDisallowed
                    >
                      {it}
                    </ReactMarkdown>
                  </div>
                </details>
              );
            })}
          </div>
        ) : (
          <ol className="ch-collapse__list">
            {items.map((it, i) => (
              <li key={i}>
                <span className="num">{String(i + 1).padStart(2, "0")}</span>
                <span>{it}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </details>
  );
}

function renderTitle(title: string) {
  // Split on em-dash for editorial italic — keep first part regular, second part italic-serif
  const dashIdx = title.indexOf("—");
  if (dashIdx === -1) return <>{title}</>;
  return (
    <>
      {title.slice(0, dashIdx + 1)}
      <br />
      <em>{title.slice(dashIdx + 1).trim()}</em>
    </>
  );
}

function useResetCountdown() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const next = new Date(now);
  next.setHours(24, 0, 0, 0);
  const ms = next.getTime() - now.getTime();
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

function ChallengeContent() {
  const { t } = useLanguage();
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

  const composerRef = useRef<ReviewComposerHandle>(null);
  const countdown = useResetCountdown();

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

  if (challengeQuery.isLoading) {
    return (
      <div className="ch-page text-center text-rc-muted py-12">
        {t.common.loading}
      </div>
    );
  }

  if (challengeQuery.isError || !challengeQuery.data) {
    return (
      <div className="ch-page text-center text-rc-muted py-12">
        {t.challenge.errors.loadFailed}
      </div>
    );
  }

  const challenge = challengeQuery.data;
  const isAnonymous = !authLoading && !user;
  const canSubmit = !isAnonymous;

  const resetsIn = (t.challenge.ui.resetsIn as string).replace("{time}", countdown);

  // ── State machine slot (right column under briefing) ──
  let stageSlot: React.ReactNode = null;
  if (stage === "completed" && finalResult) {
    stageSlot = <ScoreCard challenge={challenge} result={finalResult} />;
  } else if (isAnonymous) {
    stageSlot = <AnonymousOverlay />;
  } else if (submitFirst.isPending) {
    stageSlot = (
      <>
        <FirstReviewQuote text={firstAnswer} />
        <PushbackCard loading />
      </>
    );
  } else if (stage === "challenged" && aiChallenge) {
    stageSlot = (
      <>
        <FirstReviewQuote text={firstAnswer} />
        <PushbackCard text={aiChallenge} />
        <ReviewComposer
          ref={composerRef}
          value={secondAnswer}
          onChange={setSecondAnswer}
          onSubmit={handleSubmitFinal}
          pending={submitFinal.isPending}
          disabled={!canSubmit}
          placeholder={t.challenge.socratic.placeholder}
          submitLabel={t.challenge.socratic.submit}
          pendingLabel={t.common.processing}
          rows={8}
          autoFocus
        />
      </>
    );
  } else {
    stageSlot = (
      <ReviewComposer
        ref={composerRef}
        value={firstAnswer}
        onChange={setFirstAnswer}
        onSubmit={handleSubmitFirst}
        pending={submitFirst.isPending}
        disabled={!canSubmit}
        placeholder={t.challenge.firstAnswer.placeholder}
        submitLabel={t.challenge.firstAnswer.submit}
        pendingLabel={t.common.processing}
        rows={12}
      />
    );
  }

  const showSidebars = !isAnonymous;

  return (
    <main className="ch-page">
      <section className="ch-title-block">
        <div>
          <h1 className="ch-title">{renderTitle(challenge.title)}</h1>
        </div>
        <div className="ch-title-meta">
          <ChallengeBadges
            focusTag={challenge.focusTag}
            difficulty={challenge.difficulty}
            estimatedTime={challenge.estimatedTime}
            language={challenge.language}
          />
          <span className="ch-resets">{resetsIn}</span>
        </div>
      </section>

      {showSidebars && (
        <ChallengeStatsStrip
          streak={streakQuery.data}
          completions={statsQuery.data?.completions}
        />
      )}

      {showSidebars && <ChallengeStreakTrack />}

      <section className="ch-main">
        <CodeSnippet
          code={challenge.snippet}
          language={challenge.language}
          withChrome
          onCiteLines={(range) =>
            composerRef.current?.insertText(`${range} `)
          }
        />
        <div className="ch-right-col">
          <div className="ch-briefing">
            <div className="ch-briefing__head">
              <span className="ch-briefing__head-bar" />
              <b>{t.challenge.ui.briefSection}</b>
            </div>
            <div className="ch-briefing__md">
              <ReactMarkdown
                allowedElements={["p", "code", "strong", "em"]}
                unwrapDisallowed
              >
                {challenge.question}
              </ReactMarkdown>
            </div>
            <BriefCollapse
              title={t.challenge.ui.whatToLookForLabel}
              items={challenge.whatToLookFor}
              emptyText={t.challenge.ui.whatToLookForEmpty}
            />
            <BriefCollapse
              title={t.challenge.ui.hintsLabel}
              items={challenge.hints}
              emptyText={t.challenge.ui.hintsEmpty}
              progressive
              itemLabel={t.challenge.ui.hintItemLabel as string}
            />
          </div>
          {stageSlot}
        </div>
      </section>

      {stage === "completed" && finalResult && (
        <section className="ch-bottom">
          <ChallengeLeaderboardCard
            challengeId={challenge.id}
            score={finalResult.score}
            challengeTitle={challenge.title}
          />
        </section>
      )}
      {stage !== "completed" && !isAnonymous && (
        <section className="ch-bottom">
          <ChallengeLeaderboardCard challengeId={challenge.id} />
        </section>
      )}
    </main>
  );
}

export default function ChallengePage() {
  return (
    <>
      <Navbar activePage="challenge" />
      <Suspense fallback={<div className="py-12 text-center text-rc-muted">Loading…</div>}>
        <ChallengeContent />
      </Suspense>
    </>
  );
}
