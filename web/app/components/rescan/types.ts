// Frontend mirror of the backend deterministic keyword-match + re-scan shapes
// (backend: domain/keyword-match/keyword-match.ts, domain/rescan-delta.ts).

export type KeywordMatchEntry = {
  term: string;
  category: string;
  required: boolean;
  jdFrequency: number;
  cvFrequency: number;
  presentInCv: boolean;
};

export type KeywordMatchResult = {
  keywords: KeywordMatchEntry[];
  coverageScore: number | null;
  matchedCount: number;
  totalCount: number;
};

export type RescanTimelinePoint = {
  coverageScore: number;
  matchedCount: number;
  totalCount: number;
  createdAt: string;
};

/** GET /api/analyze/:id/rescans */
export type RescansResponse = {
  baseline: KeywordMatchResult | null;
  timeline: RescanTimelinePoint[];
};

/** POST /api/analyze/:id/rescan-keywords */
export type QuickRescanResponse = {
  baseline: KeywordMatchResult;
  current: KeywordMatchResult;
  coverageBefore: number;
  coverageAfter: number;
  coverageDelta: number;
  timeline: RescanTimelinePoint[];
  createdAt: string;
};

export type Delta = {
  before: number | null;
  after: number | null;
  delta: number | null;
};

/** `rescan_deltas` SSE frame from POST /api/analyze/:id/rescan */
export type RescanDeltas = {
  score: Delta;
  breakdown: {
    keyword_match: Delta;
    tech_stack_fit: Delta;
    experience_level: Delta;
    github_signal: Delta;
    linkedin_signal: Delta;
  };
  ats: {
    wouldPassBefore: boolean;
    wouldPassAfter: boolean;
    scoreBefore: number;
    scoreAfter: number;
  };
  keywordCoverage: Delta;
  resolvedIssueCount: number;
  newIssueCount: number;
};
