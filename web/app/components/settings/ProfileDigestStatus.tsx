"use client";

import { useState } from "react";
import { RefreshCw, Sparkles, AlertTriangle } from "lucide-react";
import { Caption, FieldLabel, Heading, Text } from "../typography";
import { useRefreshProfileDigest } from "../../../lib/mutations";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../context/auth";
import type { Profile } from "../../../lib/queries";

/**
 * Surfaces the ProfileDigest sync state — when it was last generated and a
 * button to refresh it on demand. Auto-regeneration happens at analysis time
 * when source hashes drift, so this is mostly for users who want to "warm"
 * the digest after updating their portfolio or LinkedIn outside the analyze
 * flow.
 *
 * The mutation accepts no body for now — the backend pulls every source from
 * the stored Profile row (githubUsername, portfolioUrl, last uploaded LinkedIn).
 * CV refreshes happen during analysis via hash detection, not here.
 */
export function ProfileDigestStatus({ profile }: { profile: Profile | null }) {
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;
  const refresh = useRefreshProfileDigest();
  const [feedback, setFeedback] = useState<
    { kind: "ok" | "err"; text: string } | null
  >(null);

  const updatedAt = profile?.digestUpdatedAt
    ? new Date(profile.digestUpdatedAt)
    : null;
  const ageDays = updatedAt
    ? Math.floor((Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const stale = ageDays !== null && ageDays >= 30;
  const missing = !updatedAt;

  function handleRefresh() {
    setFeedback(null);
    refresh.mutate(
      {},
      {
        onSuccess: () => {
          setFeedback({ kind: "ok", text: "Profile synced" });
          if (userId) {
            queryClient.invalidateQueries({ queryKey: ["profile", userId] });
          }
        },
        onError: (err) => {
          setFeedback({
            kind: "err",
            text:
              err instanceof Error
                ? err.message
                : "Couldn't sync your profile",
          });
        },
      },
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-3">
        <Sparkles size={16} className="text-rc-red" />
        <Heading>Profile sync</Heading>
      </div>
      <Text tone="muted" className="!mt-1">
        A condensed snapshot of your CV, LinkedIn, GitHub and portfolio used by
        every analysis. Auto-refreshes when sources change. Refresh manually if
        you want to feed the latest portfolio update into the next analysis
        without launching one.
      </Text>

      <div
        className={`flex items-center justify-between gap-4 p-4 border rounded-xl ${
          missing
            ? "bg-rc-amber-bg border-rc-amber-border"
            : stale
              ? "bg-rc-amber-bg border-rc-amber-border"
              : "bg-rc-green-bg border-rc-green-border"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {missing || stale ? (
            <AlertTriangle size={18} className="text-rc-amber shrink-0" />
          ) : (
            <Sparkles size={18} className="text-rc-green shrink-0" />
          )}
          <div className="min-w-0">
            <FieldLabel className="!mb-0.5">
              {missing
                ? "Never synced"
                : ageDays === 0
                  ? "Synced today"
                  : `Last synced ${formatAge(ageDays!)} ago`}
            </FieldLabel>
            {(missing || stale) && (
              <Caption tone="amber">
                {missing
                  ? "First analysis will sync automatically."
                  : "Older than 30 days — refresh recommended."}
              </Caption>
            )}
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refresh.isPending}
          className="shrink-0 inline-flex items-center gap-2 px-4 py-2 border border-rc-border bg-rc-bg rounded-lg text-[13px] text-rc-text hover:border-rc-red/40 hover:text-rc-red transition-colors disabled:opacity-60 disabled:cursor-not-allowed font-mono uppercase tracking-wider"
        >
          <RefreshCw
            size={13}
            className={refresh.isPending ? "animate-spin" : ""}
          />
          {refresh.isPending ? "Syncing…" : "Refresh now"}
        </button>
      </div>

      {feedback && (
        <Caption tone={feedback.kind === "ok" ? "green" : "red"}>
          {feedback.text}
        </Caption>
      )}
    </section>
  );
}

function formatAge(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "1 day";
  if (days < 7) return `${days} days`;
  if (days < 30) return `${Math.floor(days / 7)} week${days >= 14 ? "s" : ""}`;
  if (days < 365)
    return `${Math.floor(days / 30)} month${days >= 60 ? "s" : ""}`;
  return `${Math.floor(days / 365)} year${days >= 730 ? "s" : ""}`;
}
