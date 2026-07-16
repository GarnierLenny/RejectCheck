/**
 * Deterministic, named CV checks — a reproducible scorecard computed in code
 * from the CV text, shown ALONGSIDE the LLM judgment. This is the Resume Worded
 * parity layer: ~12 line-level checks that always return the same result for the
 * same text (unlike the model's contextual read), so the user gets both the
 * "why a recruiter rejects you" narrative AND a stable checklist to grind down.
 *
 * Pure and display-only: it never triggers a rewrite or a re-scan (those stay
 * owner-only). Safe to render on a public shared audit as read-only information.
 */

export type CvCheckStatus = "pass" | "warn" | "fail";

export type CvCheck = {
  id: string;
  status: CvCheckStatus;
  /** Short factual detail, e.g. "35% of bullets are quantified". */
  detail: string;
};

const ACTION_VERBS = [
  "led","built","shipped","launched","designed","owned","drove","created","developed",
  "managed","delivered","increased","reduced","improved","grew","scaled","cut","saved",
  "automated","migrated","architected","implemented","negotiated","closed","won","hired",
  "mentored","optimized","optimised","streamlined","launched","founded","directed",
];

const WEAK_PHRASES = [
  "responsible for","participated in","helped with","helped to","worked on",
  "involved in","contributed to","assisted with","duties included","tasked with",
  "in charge of","responsable de","participé","aidé à","travaillé sur",
];

const BUZZWORDS = [
  "team player","hard working","hardworking","hard-working","passionate","detail oriented",
  "detail-oriented","self motivated","self-motivated","go getter","go-getter","synergy",
  "results driven","results-driven","think outside the box","fast learner","dynamic",
  "motivé","rigoureux","autonome","polyvalent","force de proposition",
];

const FILLERS = ["very","really","successfully","effectively","basically","various","several","a lot of"];

const SECTION_WORDS = [
  "experience","education","skills","projects","summary","work history","employment",
  "expérience","formation","compétences","projets","profil",
];

function words(s: string): string[] {
  return s.trim().split(/\s+/).filter(Boolean);
}

/** Bullet-ish lines: non-empty, 3-40 words, not an obvious section header. */
function bulletLines(cv: string): string[] {
  return cv
    .split(/\r?\n/)
    .map((l) => l.replace(/^[\s•\-*·▪◦]+/, "").trim())
    .filter((l) => {
      const w = words(l);
      if (w.length < 3 || w.length > 40) return false;
      const low = l.toLowerCase();
      // Drop lines that are just a section header.
      if (w.length <= 3 && SECTION_WORDS.some((s) => low === s)) return false;
      return true;
    });
}

function countOccurrences(haystack: string, needles: string[]): number {
  const low = haystack.toLowerCase();
  let n = 0;
  for (const needle of needles) {
    let idx = low.indexOf(needle);
    while (idx !== -1) {
      n += 1;
      idx = low.indexOf(needle, idx + needle.length);
    }
  }
  return n;
}

function pct(n: number, d: number): number {
  return d === 0 ? 0 : Math.round((n / d) * 100);
}

function band(value: number, pass: number, warn: number): CvCheckStatus {
  if (value >= pass) return "pass";
  if (value >= warn) return "warn";
  return "fail";
}

/** Invert band for "lower is better" counts (weak phrases, buzzwords, fillers). */
function bandLow(count: number, passMax: number, warnMax: number): CvCheckStatus {
  if (count <= passMax) return "pass";
  if (count <= warnMax) return "warn";
  return "fail";
}

export function computeCvChecks(cvText: string): CvCheck[] {
  const cv = cvText ?? "";
  const low = cv.toLowerCase();
  const allWords = words(cv);
  const bullets = bulletLines(cv);
  const bulletCount = bullets.length || 1;

  const quantified = bullets.filter((b) => /\d/.test(b)).length;
  const actionStart = bullets.filter((b) => {
    const first = (words(b)[0] ?? "").toLowerCase().replace(/[^a-zà-ÿ]/g, "");
    return ACTION_VERBS.includes(first);
  }).length;
  const weak = countOccurrences(cv, WEAK_PHRASES);
  const buzz = countOccurrences(cv, BUZZWORDS);
  const firstPerson = (low.match(/\b(i|i'm|i've|my|me)\b/g) ?? []).length;
  const fillers = countOccurrences(cv, FILLERS);
  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(cv);
  const sections = SECTION_WORDS.filter((s) => low.includes(s)).length;
  const years = (cv.match(/\b(19|20)\d{2}\b/g) ?? []).length;
  const avgBullet = Math.round(
    bullets.reduce((sum, b) => sum + words(b).length, 0) / bulletCount,
  );
  const wordCount = allWords.length;

  const checks: CvCheck[] = [
    {
      id: "quantified_bullets",
      status: band(pct(quantified, bulletCount), 40, 20),
      detail: `${pct(quantified, bulletCount)}% of bullets carry a number`,
    },
    {
      id: "action_verbs",
      status: band(pct(actionStart, bulletCount), 50, 30),
      detail: `${pct(actionStart, bulletCount)}% of bullets start with an action verb`,
    },
    {
      id: "weak_ownership",
      status: bandLow(weak, 0, 2),
      detail: `${weak} weak-ownership phrase${weak === 1 ? "" : "s"}`,
    },
    {
      id: "buzzwords",
      status: bandLow(buzz, 0, 2),
      detail: `${buzz} empty buzzword${buzz === 1 ? "" : "s"}`,
    },
    {
      id: "first_person",
      status: bandLow(firstPerson, 0, 3),
      detail: `${firstPerson} first-person pronoun${firstPerson === 1 ? "" : "s"}`,
    },
    {
      id: "fillers",
      status: bandLow(fillers, 1, 4),
      detail: `${fillers} filler word${fillers === 1 ? "" : "s"}`,
    },
    {
      id: "contact",
      status: hasEmail ? "pass" : "fail",
      detail: hasEmail ? "email present" : "no email found",
    },
    {
      id: "sections",
      status: band(sections, 2, 1),
      detail: `${sections} standard section${sections === 1 ? "" : "s"} detected`,
    },
    {
      id: "dates",
      status: band(years, 2, 1),
      detail: `${years} date${years === 1 ? "" : "s"} found`,
    },
    {
      id: "avg_bullet_len",
      status: avgBullet >= 8 && avgBullet <= 26 ? "pass" : avgBullet >= 5 && avgBullet <= 32 ? "warn" : "fail",
      detail: `${avgBullet} words per bullet on average`,
    },
    {
      id: "length",
      status: wordCount >= 250 && wordCount <= 850 ? "pass" : wordCount >= 120 ? "warn" : "fail",
      detail: `${wordCount} words total`,
    },
  ];

  return checks;
}

export function checksSummary(checks: CvCheck[]): {
  pass: number;
  warn: number;
  fail: number;
} {
  return {
    pass: checks.filter((c) => c.status === "pass").length,
    warn: checks.filter((c) => c.status === "warn").length,
    fail: checks.filter((c) => c.status === "fail").length,
  };
}
