import type { AnalyzeResponse } from '../dto/analyze-response.dto';

/**
 * Deterministic roadmap item IDs — mirrors the frontend logic in
 * web/app/components/tabs/RoadmapTab.tsx so backend and frontend agree on
 * which item gets which salary impact mapping.
 *
 * Convention:
 *   cv-{i}    → result.audit.cv.issues[i]    (filtered for issues with fix.summary)
 *   gh-{i}    → result.audit.github.issues[i]
 *   li-{i}    → result.audit.linkedin.issues[i]
 *   flag-{i}  → result.hidden_red_flags[i]
 *   seniority → singleton if seniority gap is detected
 *   tone      → singleton if cv_tone is not 'active'
 *
 * Indexes are taken from the source array as-is (no filtering for fix.summary
 * here — frontend filters at render time, but Claude must score against the
 * stable index in the original arrays).
 */
export type RoadmapItem = {
  id: string;
  source: string;
  severity: 'critical' | 'major' | 'minor';
  what: string;
  fixSummary: string;
};

export function extractRoadmapItems(result: AnalyzeResponse): RoadmapItem[] {
  const items: RoadmapItem[] = [];

  result.audit.cv.issues.forEach((issue, i) => {
    if (!issue.fix?.summary) return;
    items.push({
      id: `cv-${i}`,
      source: `CV · ${issue.category}`,
      severity: issue.severity,
      what: issue.what,
      fixSummary: issue.fix.summary,
    });
  });

  result.audit.github.issues.forEach((issue, i) => {
    if (!issue.fix?.summary) return;
    items.push({
      id: `gh-${i}`,
      source: `GitHub · ${issue.category}`,
      severity: issue.severity,
      what: issue.what,
      fixSummary: issue.fix.summary,
    });
  });

  result.audit.linkedin.issues.forEach((issue, i) => {
    if (!issue.fix?.summary) return;
    items.push({
      id: `li-${i}`,
      source: `LinkedIn · ${issue.category}`,
      severity: issue.severity,
      what: issue.what,
      fixSummary: issue.fix.summary,
    });
  });

  result.hidden_red_flags.forEach((flag, i) => {
    if (!flag.fix?.summary) return;
    items.push({
      id: `flag-${i}`,
      source: 'Red Flags',
      severity: 'major',
      what: flag.flag,
      fixSummary: flag.fix.summary,
    });
  });

  if (
    result.seniority_analysis.detected !== result.seniority_analysis.expected &&
    result.seniority_analysis.fix?.summary
  ) {
    items.push({
      id: 'seniority',
      source: 'Profile · Seniority',
      severity: 'major',
      what: `Seniority mismatch — expected ${result.seniority_analysis.expected}, CV signals ${result.seniority_analysis.detected}`,
      fixSummary: result.seniority_analysis.fix.summary,
    });
  }

  if (result.cv_tone.detected !== 'active' && result.cv_tone.fix?.summary) {
    items.push({
      id: 'tone',
      source: 'Profile · Writing',
      severity: result.cv_tone.detected === 'passive' ? 'major' : 'minor',
      what: `${result.cv_tone.detected === 'passive' ? 'Passive' : 'Mixed'} writing tone detected across CV bullet points`,
      fixSummary: result.cv_tone.fix.summary,
    });
  }

  return items;
}
