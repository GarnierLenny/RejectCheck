/**
 * Deterministic, named CV checks — a reproducible scorecard computed in code
 * from the CV text, shown ALONGSIDE the LLM judgment. This is the Resume Worded
 * parity layer: line-level checks that always return the same result for the
 * same text (unlike the model's contextual read), so the user gets both the
 * "why a recruiter rejects you" narrative AND a stable checklist to grind down.
 *
 * `computeCvMetrics` is the single source of the raw axis VALUES. Both the
 * runtime scorecard (`computeCvChecks`) and the offline archetype calibration
 * (datasets/calibrate) compute the same axes the same way, so a CV's value is
 * comparable to the per-role bands in role-archetypes.json.
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

/** Raw structural axis values — the single source shared with the calibration. */
export type CvMetrics = {
  /** % of bullets that carry a number. */
  quantifiedBulletPct: number;
  /** % of bullets that start with a strong action verb. */
  actionVerbPct: number;
  /** Numbers per 100 words. */
  metricDensity: number;
  /** Average words per bullet. */
  avgBulletLen: number;
  wordCount: number;
  bulletCount: number;
  weak: number;
  buzz: number;
  firstPerson: number;
  fillers: number;
  hasEmail: boolean;
  sections: number;
  years: number;
};

/**
 * Strong resume action verbs (past + present, EN + FR). Matched against the
 * FIRST word of each bullet, diacritic-preserving. Kept broad on purpose: a
 * narrow list under-counts and unfairly flags real resumes (the calibration's
 * action-verb axis was all zeros with the original 32-verb list).
 *
 * NOTE: keep in sync with ACTION_VERBS in datasets/calibrate/calibrate_archetypes.py
 * so the runtime value matches the calibrated bands.
 */
const ACTION_VERBS = [
  // EN — leadership / ownership
  "led","lead","managed","manage","directed","direct","owned","own","oversaw","oversee",
  "supervised","supervise","headed","head","chaired","coordinated","coordinate","spearheaded",
  "spearhead","orchestrated","championed","drove","drive","ran","run","founded","found",
  // EN — build / ship
  "built","build","created","create","developed","develop","designed","design","engineered",
  "engineer","architected","implemented","implement","shipped","ship","launched","launch",
  "deployed","deploy","delivered","deliver","produced","produce","authored","wrote","write",
  "published","publish","rebuilt","redesigned","revamped","prototyped","programmed",
  // EN — improve / grow
  "improved","improve","increased","increase","grew","grow","scaled","scale","expanded",
  "expand","boosted","boost","accelerated","accelerate","optimized","optimised","optimize",
  "streamlined","streamline","automated","automate","reduced","reduce","cut","saved","save",
  "lowered","minimized","minimised","maximized","maximised","transformed","transform",
  "restructured","consolidated","standardized","standardised","migrated","migrate",
  "integrated","integrate","modernized","modernised",
  // EN — achieve / sell
  "achieved","achieve","generated","generate","exceeded","exceed","surpassed","won","win",
  "closed","close","negotiated","negotiate","secured","secure","sold","sell","acquired",
  // EN — people / comms
  "mentored","mentor","trained","train","coached","coach","hired","hire","recruited","recruit",
  "facilitated","facilitate","presented","present","collaborated","collaborate","partnered",
  "partner","advised","advise","consulted","consult","guided","guide",
  // EN — analyze / operate
  "analyzed","analysed","analyze","evaluated","evaluate","researched","research","assessed",
  "assess","measured","measure","tracked","track","forecasted","forecast","budgeted","budget",
  "planned","plan","executed","execute","established","establish","initiated","initiate",
  "pioneered","pioneer","resolved","resolve","tested","test","maintained","maintain",
  "configured","configure","administered","administer","processed","organized","organised",
  // FR
  "géré","gérer","dirigé","diriger","développé","développer","créé","créer","conçu","concevoir",
  "lancé","lancer","déployé","déployer","livré","livrer","mené","mener","piloté","piloter",
  "réalisé","réaliser","augmenté","augmenter","réduit","réduire","amélioré","améliorer",
  "optimisé","optimiser","automatisé","automatiser","coordonné","coordonner","organisé",
  "organiser","négocié","négocier","formé","former","encadré","encadrer","supervisé",
  "superviser","analysé","analyser","généré","générer","rédigé","rédiger","fondé","fonder",
  "restructuré","accéléré","conçu","présenté","présenter","géré",
];

const ACTION_VERB_SET = new Set(ACTION_VERBS);

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

const NUM_TOKEN = /\d[\d.,]*%?/g;

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

/** Compute the raw structural axis values. Single source for checks + benchmark. */
export function computeCvMetrics(cvText: string): CvMetrics {
  const cv = cvText ?? "";
  const low = cv.toLowerCase();
  const allWords = words(cv);
  const wc = allWords.length || 1;
  const bullets = bulletLines(cv);
  const bulletCount = bullets.length || 1;

  const quantified = bullets.filter((b) => /\d/.test(b)).length;
  const actionStart = bullets.filter((b) => {
    const first = (words(b)[0] ?? "").toLowerCase().replace(/[^a-zà-ÿ]/g, "");
    return ACTION_VERB_SET.has(first);
  }).length;
  const numTokens = (cv.match(NUM_TOKEN) ?? []).length;
  const avgBullet = Math.round(
    bullets.reduce((sum, b) => sum + words(b).length, 0) / bulletCount,
  );

  return {
    quantifiedBulletPct: pct(quantified, bulletCount),
    actionVerbPct: pct(actionStart, bulletCount),
    metricDensity: Math.round((1000 * numTokens) / wc) / 10, // per 100 words, 1dp
    avgBulletLen: avgBullet,
    wordCount: allWords.length,
    bulletCount: bullets.length,
    weak: countOccurrences(cv, WEAK_PHRASES),
    buzz: countOccurrences(cv, BUZZWORDS),
    firstPerson: (low.match(/\b(i|i'm|i've|my|me)\b/g) ?? []).length,
    fillers: countOccurrences(cv, FILLERS),
    hasEmail: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(cv),
    sections: SECTION_WORDS.filter((s) => low.includes(s)).length,
    years: (cv.match(/\b(19|20)\d{2}\b/g) ?? []).length,
  };
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
  const m = computeCvMetrics(cvText);

  return [
    {
      id: "quantified_bullets",
      status: band(m.quantifiedBulletPct, 40, 20),
      detail: `${m.quantifiedBulletPct}% of bullets carry a number`,
    },
    {
      id: "action_verbs",
      status: band(m.actionVerbPct, 50, 30),
      detail: `${m.actionVerbPct}% of bullets start with an action verb`,
    },
    {
      id: "weak_ownership",
      status: bandLow(m.weak, 0, 2),
      detail: `${m.weak} weak-ownership phrase${m.weak === 1 ? "" : "s"}`,
    },
    {
      id: "buzzwords",
      status: bandLow(m.buzz, 0, 2),
      detail: `${m.buzz} empty buzzword${m.buzz === 1 ? "" : "s"}`,
    },
    {
      id: "first_person",
      status: bandLow(m.firstPerson, 0, 3),
      detail: `${m.firstPerson} first-person pronoun${m.firstPerson === 1 ? "" : "s"}`,
    },
    {
      id: "fillers",
      status: bandLow(m.fillers, 1, 4),
      detail: `${m.fillers} filler word${m.fillers === 1 ? "" : "s"}`,
    },
    {
      id: "contact",
      status: m.hasEmail ? "pass" : "fail",
      detail: m.hasEmail ? "email present" : "no email found",
    },
    {
      id: "sections",
      status: band(m.sections, 2, 1),
      detail: `${m.sections} standard section${m.sections === 1 ? "" : "s"} detected`,
    },
    {
      id: "dates",
      status: band(m.years, 2, 1),
      detail: `${m.years} date${m.years === 1 ? "" : "s"} found`,
    },
    {
      id: "avg_bullet_len",
      status:
        m.avgBulletLen >= 8 && m.avgBulletLen <= 26
          ? "pass"
          : m.avgBulletLen >= 5 && m.avgBulletLen <= 32
            ? "warn"
            : "fail",
      detail: `${m.avgBulletLen} words per bullet on average`,
    },
    {
      id: "length",
      status: m.wordCount >= 250 && m.wordCount <= 850 ? "pass" : m.wordCount >= 120 ? "warn" : "fail",
      detail: `${m.wordCount} words total`,
    },
  ];
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
