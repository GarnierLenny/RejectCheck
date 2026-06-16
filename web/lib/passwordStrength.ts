export type StrengthLevel = "weak" | "medium" | "strong";

/**
 * Lightweight client-side password strength heuristic — purely for UX feedback
 * (the real rules live in Supabase). Returns a level + a 0–4 fill count for the
 * segmented meter.
 */
export function passwordStrength(pw: string): {
  level: StrengthLevel;
  /** number of meter segments to fill (0–4) */
  fill: number;
} {
  if (!pw) return { level: "weak", fill: 0 };

  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const level: StrengthLevel = score <= 2 ? "weak" : score <= 3 ? "medium" : "strong";
  const fill = level === "weak" ? 1 : level === "medium" ? 2 : 4;
  return { level, fill };
}
