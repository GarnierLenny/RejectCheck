/**
 * Deterministic timeline consistency checks — reproducible gap/overlap math and
 * a named checklist computed in code from `timeline_entries`, shown ALONGSIDE
 * the LLM narrative. Same input, same output, every render (unlike the model's
 * contextual read), so the timeline section gets both the "how a recruiter sees
 * your chronology" story AND a stable pass/warn/fail/na scorecard.
 *
 * `computeTimelineDecorations` is the single source of the gap/overlap math.
 * Both the SourceTimeline rendering (hatched gap segments, outlined overlap
 * bars) and the consistency checklist (`computeTimelineConsistency`) derive
 * from it, so a gap drawn on the timeline always matches a gap counted in the
 * checks.
 *
 * Date handling: entries carry 'yyyy-mm' strings or 'present'. Anything else
 * (null, free text, malformed) excludes the entry from the affected checks —
 * we never guess a date. Localized copy lives in the consuming component; this
 * module returns structured data only.
 *
 * Pure and display-only: it never triggers a rewrite or a re-scan. Safe to
 * render on a public shared audit as read-only information.
 */

import type { CrossProfileInconsistency, TimelineEntry } from "../components/types";

/** A gap is only "unexplained" beyond this many whole months (exactly 3 = fine). */
export const GAP_MONTHS = 3;

/**
 * A gap that ended more than this many months ago is "old": recruiters weigh
 * recent history, so an early-career gap from years back warns (low weight)
 * instead of failing. 72 months = 6 years.
 */
const RECENT_GAP_MONTHS = 72;

/** Overlaps of a single month are normal handovers — only report beyond this. */
const OVERLAP_MONTHS = 1;

/** Average completed-role tenure below this (months) reads as job-hopping. */
const AVG_TENURE_WARN_MONTHS = 18;

/** Tenure is only judged with at least this many completed roles. */
const AVG_TENURE_MIN_ROLES = 3;

type TimelineSource = TimelineEntry["source"];

export interface GapSegment {
  source: TimelineSource;
  /** First month OF the gap, 'yyyy-mm'. */
  start: string;
  /** Last month OF the gap, 'yyyy-mm'. */
  end: string;
  /** Whole months with no employment on this source's lane. */
  months: number;
  /** Company of the role that ends right before the gap. */
  afterCompany: string;
  /** Company of the role that starts right after the gap. */
  beforeCompany: string;
}

export interface OverlapSegment {
  source: TimelineSource;
  /** Index into the ORIGINAL `entries` array (maps to rendered bars). */
  aIndex: number;
  /** Index into the ORIGINAL `entries` array (maps to rendered bars). */
  bIndex: number;
  /** Months both roles run concurrently (inclusive). */
  months: number;
}

export interface TimelineDecorations {
  gaps: GapSegment[];
  overlaps: OverlapSegment[];
}

export type ConsistencyStatus = "pass" | "warn" | "fail" | "na";

export type ConsistencyCheckId =
  | "unexplained_gaps"
  | "cross_source_dates"
  | "overlaps"
  | "forward_progression"
  | "average_tenure"
  | "future_dates";

export interface ConsistencyRow {
  id: ConsistencyCheckId;
  status: ConsistencyStatus;
  /** Structured facts for the row copy (counts, months, titles). Localized text lives in the component. */
  data: Record<string, string | number>;
}

// ── Date math ─────────────────────────────────────────────────────────────────

const YM = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** 'yyyy-mm' → absolute month index; 'present' → now; anything else → null (never guess). */
function monthIndex(value: string | null | undefined, nowIdx: number): number | null {
  if (!value) return null;
  if (value === "present") return nowIdx;
  const m = YM.exec(value.trim());
  if (!m) return null;
  return Number(m[1]) * 12 + (Number(m[2]) - 1);
}

function formatMonth(idx: number): string {
  const y = Math.floor(idx / 12);
  const mo = (idx % 12) + 1;
  return `${y}-${String(mo).padStart(2, "0")}`;
}

function nowIndex(now: Date): number {
  return now.getFullYear() * 12 + now.getMonth();
}

type DatedEntry = {
  entry: TimelineEntry;
  /** Index into the original `entries` array. */
  index: number;
  start: number;
  end: number;
};

/** Entries with BOTH dates parseable and a sane range; others are excluded, never guessed. */
function datedEntries(entries: TimelineEntry[], nowIdx: number): DatedEntry[] {
  const out: DatedEntry[] = [];
  entries.forEach((entry, index) => {
    const start = monthIndex(entry.start, nowIdx);
    const end = monthIndex(entry.end, nowIdx);
    if (start === null || end === null || end < start) return;
    out.push({ entry, index, start, end });
  });
  return out;
}

// ── Education (explains gaps: studying is not a career break) ────────────────

const YEAR = /^(\d{4})$/;

/**
 * Loose date parse for education spans only: accepts a bare 'yyyy' in addition
 * to strict 'yyyy-mm', so a degree listed with a completion year still bounds a
 * study period. Start rounds to January, end to December of that year.
 */
function looseMonth(value: string | null | undefined, nowIdx: number, end: boolean): number | null {
  const strict = monthIndex(value, nowIdx);
  if (strict !== null) return strict;
  const m = value ? YEAR.exec(value.trim()) : null;
  if (!m) return null;
  return Number(m[1]) * 12 + (end ? 11 : 0);
}

/**
 * Education entries are not type-tagged in the timeline schema, so we detect
 * them from degree/institution keywords in the title or company. Strong,
 * unambiguous cues only ('master' bare would catch "Scrum Master", so we don't
 * include it): institution words plus degree names/abbreviations.
 */
const EDUCATION_CUES = [
  "university", "université", "universite", "college", "collège", "ecole", "école",
  "institute", "institut", "polytechnic", "academy", "académie", "academie", "faculty",
  "msc", "m.sc", "bsc", "b.sc", "beng", "b.eng", "meng", "m.eng", "mba", "phd", "ph.d",
  "bachelor", "master's", "masters", "master of", "doctorate", "diploma", "diplôme", "diplome",
  "degree", "licence", "baccalauréat", "baccalaureat", "bootcamp",
];

function isEducationEntry(entry: TimelineEntry): boolean {
  const hay = `${entry.title} ${entry.company}`.toLowerCase();
  return EDUCATION_CUES.some((c) => hay.includes(c));
}

/** Study periods per source, loosely dated, used to explain away gaps. */
function educationSpans(entries: TimelineEntry[], nowIdx: number): Map<TimelineSource, Array<[number, number]>> {
  const bySource = new Map<TimelineSource, Array<[number, number]>>();
  for (const e of entries) {
    if (!isEducationEntry(e)) continue;
    const start = looseMonth(e.start, nowIdx, false);
    const end = looseMonth(e.end, nowIdx, true);
    if (start === null || end === null || end < start) continue;
    const arr = bySource.get(e.source) ?? [];
    arr.push([start, end]);
    bySource.set(e.source, arr);
  }
  return bySource;
}

/**
 * True when study periods cover enough of [gapStart, gapEnd] that the leftover
 * uncovered stretch is within the normal-gap tolerance — i.e. the "gap" is
 * really a degree, not an unexplained break.
 */
function gapExplainedByStudy(gapStart: number, gapEnd: number, spans: Array<[number, number]>): boolean {
  const clipped = spans
    .map(([s, e]) => [Math.max(s, gapStart), Math.min(e, gapEnd)] as [number, number])
    .filter(([s, e]) => e >= s)
    .sort((a, b) => a[0] - b[0]);
  let covered = 0;
  let cursor = gapStart - 1;
  for (const [s, e] of clipped) {
    const from = Math.max(s, cursor + 1);
    if (e >= from) {
      covered += e - from + 1;
      cursor = e;
    }
  }
  const gapLen = gapEnd - gapStart + 1;
  return gapLen - covered <= GAP_MONTHS;
}

function groupBySource(dated: DatedEntry[]): Map<TimelineSource, DatedEntry[]> {
  const bySource = new Map<TimelineSource, DatedEntry[]>();
  for (const d of dated) {
    const lane = bySource.get(d.entry.source);
    if (lane) lane.push(d);
    else bySource.set(d.entry.source, [d]);
  }
  return bySource;
}

// ── Decorations (shared math for timeline rendering + checklist) ──────────────

export function computeTimelineDecorations(
  entries: TimelineEntry[],
  now: Date = new Date(),
): TimelineDecorations {
  const nowIdx = nowIndex(now);
  const all = entries ?? [];
  const bySource = groupBySource(datedEntries(all, nowIdx));
  const eduBySource = educationSpans(all, nowIdx);

  const gaps: GapSegment[] = [];
  const overlaps: OverlapSegment[] = [];

  for (const [source, lane] of bySource) {
    const sorted = [...lane].sort((a, b) => a.start - b.start || a.end - b.end);
    const eduSpans = eduBySource.get(source) ?? [];

    // Gaps: walk chronologically against the furthest end seen so far, so a
    // short contained role never fabricates a gap after a longer one.
    let runningEnd = sorted[0].end;
    let runningEntry = sorted[0].entry;
    for (let i = 1; i < sorted.length; i++) {
      const cur = sorted[i];
      const months = cur.start - runningEnd - 1;
      // A stretch covered by study is a degree, not an unexplained break.
      if (months > GAP_MONTHS && !gapExplainedByStudy(runningEnd + 1, cur.start - 1, eduSpans)) {
        gaps.push({
          source,
          start: formatMonth(runningEnd + 1),
          end: formatMonth(cur.start - 1),
          months,
          afterCompany: runningEntry.company,
          beforeCompany: cur.entry.company,
        });
      }
      if (cur.end > runningEnd) {
        runningEnd = cur.end;
        runningEntry = cur.entry;
      }
    }

    // Overlaps: pairwise within the lane, inclusive month count.
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const months =
          Math.min(sorted[i].end, sorted[j].end) -
          Math.max(sorted[i].start, sorted[j].start) +
          1;
        if (months > OVERLAP_MONTHS) {
          overlaps.push({ source, aIndex: sorted[i].index, bIndex: sorted[j].index, months });
        }
      }
    }
  }

  return { gaps, overlaps };
}

// ── Title seniority rank ──────────────────────────────────────────────────────

/**
 * Keyword rank mirroring `seniorityIndex` in CvAuditResult.tsx (junior 0 →
 * principal 5), extended with FR keywords and token-based matching so 'intern'
 * never matches inside 'international'. Titles with no recognizable keyword
 * return null and are excluded from the progression check — never guessed.
 */
const TITLE_RANK_TOKENS: Array<[number, string[]]> = [
  [5, ["principal", "principale"]],
  [4, ["lead", "head", "chef"]],
  [3, ["staff"]],
  [2, ["senior", "sénior", "sr"]],
  [1, ["mid", "intermédiaire", "intermediaire", "confirmé", "confirmée", "confirme", "confirmee"]],
  [0, [
    "junior", "jr", "intern", "internship", "stagiaire",
    "débutant", "débutante", "debutant", "debutante",
    "apprenti", "apprentie", "alternant", "alternante",
  ]],
];

function titleSeniorityRank(title: string): number | null {
  const tokens = new Set(
    title
      .toLowerCase()
      .split(/[^a-zà-ÿ]+/i)
      .filter(Boolean),
  );
  let rank: number | null = null;
  for (const [level, words] of TITLE_RANK_TOKENS) {
    if (words.some((w) => tokens.has(w))) rank = rank === null ? level : Math.max(rank, level);
  }
  return rank;
}

// ── Consistency checklist ─────────────────────────────────────────────────────

/**
 * The lane most checks reason about: the CV lane when it has dated entries,
 * otherwise the source with the most dated entries (single-source uploads that
 * came from LinkedIn still get checked).
 */
function primaryLane(bySource: Map<TimelineSource, DatedEntry[]>): DatedEntry[] {
  const cv = bySource.get("cv");
  if (cv && cv.length > 0) return cv;
  let best: DatedEntry[] = [];
  for (const lane of bySource.values()) {
    if (lane.length > best.length) best = lane;
  }
  return best;
}

export function computeTimelineConsistency(
  entries: TimelineEntry[],
  inconsistencies: CrossProfileInconsistency[] | undefined,
  now: Date = new Date(),
): ConsistencyRow[] {
  const all = entries ?? [];
  const nowIdx = nowIndex(now);
  const decorations = computeTimelineDecorations(all, now);
  const dated = datedEntries(all, nowIdx);
  const bySource = groupBySource(dated);
  const sources = new Set(all.map((e) => e.source));
  const lane = primaryLane(bySource);

  const rows: ConsistencyRow[] = [];

  // 1. Unexplained gaps — study-covered gaps are already dropped in decorations.
  //    A recent gap fails (recruiters will ask); an old early-career gap only
  //    warns (low weight), since screening focuses on the last few years.
  const cvGaps = decorations.gaps.filter((g) => g.source === "cv");
  const recentGaps = cvGaps.filter((g) => {
    const endIdx = monthIndex(g.end, nowIdx);
    return endIdx === null || nowIdx - endIdx <= RECENT_GAP_MONTHS;
  });
  const oldGaps = cvGaps.filter((g) => !recentGaps.includes(g));
  const scoredGaps = recentGaps.length > 0 ? recentGaps : oldGaps;
  rows.push({
    id: "unexplained_gaps",
    status: recentGaps.length > 0 ? "fail" : oldGaps.length > 0 ? "warn" : "pass",
    data: {
      gaps: scoredGaps.length,
      longest_months: scoredGaps.reduce((max, g) => Math.max(max, g.months), 0),
    },
  });

  // 2. Cross-source dates — only meaningful with 2+ sources; fail on any
  //    reported inconsistency about dates.
  if (sources.size < 2) {
    rows.push({ id: "cross_source_dates", status: "na", data: { sources: sources.size } });
  } else {
    const dateConflicts = (inconsistencies ?? []).filter((i) => i.field === "dates").length;
    rows.push({
      id: "cross_source_dates",
      status: dateConflicts > 0 ? "fail" : "pass",
      data: { sources: sources.size, conflicts: dateConflicts },
    });
  }

  // 3. Overlaps — warn, never fail: concurrent roles (freelance, side gigs)
  //    are normal, they just deserve a look.
  rows.push({
    id: "overlaps",
    status: decorations.overlaps.length > 0 ? "warn" : "pass",
    data: {
      overlaps: decorations.overlaps.length,
      longest_months: decorations.overlaps.reduce((max, o) => Math.max(max, o.months), 0),
    },
  });

  // 4. Forward progression — title seniority rank must never decrease
  //    chronologically. Unrankable titles are skipped, never guessed.
  const chrono = [...lane].sort((a, b) => a.start - b.start || a.end - b.end);
  const ranked = chrono
    .map((d) => ({ title: d.entry.title, rank: titleSeniorityRank(d.entry.title) }))
    .filter((r): r is { title: string; rank: number } => r.rank !== null);
  if (ranked.length < 2) {
    rows.push({ id: "forward_progression", status: "na", data: { ranked: ranked.length } });
  } else {
    let regression: { from: string; to: string } | null = null;
    for (let i = 1; i < ranked.length && !regression; i++) {
      if (ranked[i].rank < ranked[i - 1].rank) {
        regression = { from: ranked[i - 1].title, to: ranked[i].title };
      }
    }
    rows.push({
      id: "forward_progression",
      status: regression ? "warn" : "pass",
      data: regression
        ? { ranked: ranked.length, from: regression.from, to: regression.to }
        : { ranked: ranked.length },
    });
  }

  // 5. Average tenure — judged on completed roles only (end !== 'present');
  //    needs 3+ completed roles to warn, 2+ dated roles to apply at all.
  if (lane.length < 2) {
    rows.push({ id: "average_tenure", status: "na", data: { roles: lane.length } });
  } else {
    const completed = lane.filter((d) => d.entry.end !== "present");
    const avg =
      completed.length > 0
        ? Math.round(
            completed.reduce((sum, d) => sum + (d.end - d.start + 1), 0) / completed.length,
          )
        : 0;
    rows.push({
      id: "average_tenure",
      status:
        completed.length >= AVG_TENURE_MIN_ROLES && avg < AVG_TENURE_WARN_MONTHS
          ? "warn"
          : "pass",
      data: { roles: completed.length, avg_months: avg },
    });
  }

  // 6. Future dates — any parseable date beyond the current month is a fail
  //    ('present' is by definition never in the future). Checked on ALL
  //    entries, including ones excluded from range math.
  let future = 0;
  for (const e of all) {
    const s = monthIndex(e.start, nowIdx);
    const en = monthIndex(e.end, nowIdx);
    if ((s !== null && s > nowIdx) || (en !== null && en > nowIdx)) future += 1;
  }
  rows.push({
    id: "future_dates",
    status: future > 0 ? "fail" : "pass",
    data: { future },
  });

  return rows;
}
