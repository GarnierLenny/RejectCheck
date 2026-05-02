"use client";

import type { TierKey } from "../../lib/queries";

type Props = {
  tier: TierKey;
  label: string;
  /** Compact = just tier dot + name. Full = padded pill. Default full. */
  variant?: "full" | "compact";
  /** Animated red glow ring (unlocked at Senior I). */
  animated?: boolean;
  className?: string;
};

export function TierBadge({
  tier,
  label,
  variant = "full",
  animated = false,
  className,
}: Props) {
  const cls = [
    "xp-tier",
    `xp-tier--${tier}`,
    variant === "compact" ? "xp-tier--compact" : "",
    animated ? "xp-tier--animated" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <span className={cls} title={label}>
      <span className="xp-tier__dot" aria-hidden="true" />
      <span className="xp-tier__label">{label}</span>
    </span>
  );
}
