"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { useAuth } from "../../context/auth";
import { useSubscription, type Subscription } from "../../lib/queries";

function isActiveSubscription(sub: Subscription | null | undefined): boolean {
  if (!sub) return false;
  return sub.status === "active" && new Date(sub.currentPeriodEnd) > new Date();
}

export function SentryTags() {
  const { user } = useAuth();
  const { data: subscription } = useSubscription();

  useEffect(() => {
    const isActive = isActiveSubscription(subscription);
    const tier: "guest" | "connected" | "premium" = !user
      ? "guest"
      : isActive
        ? "premium"
        : "connected";
    const plan: "rejected" | "shortlisted" | "hired" = !isActive
      ? "rejected"
      : subscription?.plan === "hired"
        ? "hired"
        : "shortlisted";
    Sentry.setTag("tier", tier);
    Sentry.setTag("plan", plan);
  }, [user, subscription]);

  return null;
}
