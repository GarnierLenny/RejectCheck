import { useState, useEffect } from "react";

export type JdWarningKey =
  | "tooShort"
  | "invalidContent"
  | "promptInjection"
  | "invertedFields";

const INJECTION_PATTERNS = [
  "ignore previous",
  "you are now",
  "disregard",
  "system:",
  "<|",
];

const CV_FIELD_KEYWORDS = ["experience", "skills", "education"];

function checkJd(text: string): JdWarningKey | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();

  // 1. Prompt injection
  if (INJECTION_PATTERNS.some((p) => lower.includes(p))) {
    return "promptInjection";
  }

  // 2. Inverted fields — first 3 words look like a CV section header
  const firstThreeWords = lower.split(/\s+/).slice(0, 3).join(" ");
  if (CV_FIELD_KEYWORDS.some((kw) => firstThreeWords.includes(kw))) {
    return "invertedFields";
  }

  const words = trimmed.split(/\s+/);

  // 3. Too short
  if (words.length < 30) return "tooShort";

  // 4. Special char ratio > 40%
  const specialCount = (trimmed.match(/[^a-zA-Z0-9\s]/g) ?? []).length;
  if (specialCount / trimmed.length > 0.4) return "invalidContent";

  // 5. Single word dominates > 25% of total
  const freq: Record<string, number> = {};
  for (const w of words) {
    const wl = w.toLowerCase();
    freq[wl] = (freq[wl] ?? 0) + 1;
  }
  if (Object.keys(freq).length > 0) {
    const maxFreq = Math.max(...Object.values(freq));
    if (maxFreq / words.length > 0.25) return "invalidContent";
  }

  return null;
}

/**
 * Returns a warning key (or null) for the given job description text.
 * Debounced 500ms so it doesn't fire on every keystroke.
 */
export function useJdValidation(text: string): JdWarningKey | null {
  const [warningKey, setWarningKey] = useState<JdWarningKey | null>(null);

  useEffect(() => {
    if (!text.trim()) {
      setWarningKey(null);
      return;
    }
    const timer = setTimeout(() => {
      setWarningKey(checkJd(text));
    }, 500);
    return () => clearTimeout(timer);
  }, [text]);

  return warningKey;
}
