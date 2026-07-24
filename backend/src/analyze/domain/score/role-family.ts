/**
 * Backend MIRROR of `resolveRoleFamily` in web/app/lib/role-benchmark.ts.
 *
 * Same deliberate, commented duplication as compose-cv-review-score.ts against
 * web/app/lib/cv-quality-score.ts: there is no shared package between web and
 * backend, and the alternative (shipping the whole benchmark lib server-side)
 * would drag in cv-checks.ts and role-archetypes.json, which already carry a
 * python<->ts sync hazard from the offline calibration.
 *
 * THE CUE TABLE AND FAMILY LIST MUST STAY IN SYNC WITH THE WEB COPY. Changing
 * one means changing both. There is no runtime coupling.
 *
 * Used only to denormalise `Analysis.roleFamily` at write time so a per-family
 * score distribution stops requiring an unindexed JSONB scan. Nothing reads it
 * yet (the percentile ships dark), so a drift here degrades a future query, it
 * does not corrupt anything a user sees today.
 *
 * Pure: no I/O, no dates, no randomness.
 */

/** The 14 families calibrated in web/app/lib/role-archetypes.json. */
const KNOWN_FAMILIES = new Set([
  'software', 'design', 'marketing', 'sales', 'finance', 'hr', 'legal',
  'healthcare', 'education', 'consulting', 'engineering', 'operations',
  'hospitality', 'trades',
]);

const FAMILY_CUES: Array<[string, string[]]> = [
  ['software', ['software','developer',' dev ','full stack','fullstack','frontend','front-end','backend','back-end','devops','programmer','web developer','mobile developer','ios','android','data scientist','data engineer','machine learning',' ml ','data analyst','sre','cloud engineer']],
  ['design', ['designer',' ux',' ui ','product design','graphic','visual design','creative director','illustrat','art director','brand design']],
  ['marketing', ['marketing','growth','seo','content strateg','social media','brand manager','communications','public relations',' pr ','advertising','digital media','copywrit']],
  ['sales', ['sales','account executive','business development','account manager',' bdr',' sdr','partnerships']],
  ['finance', ['finance','financial','accountant','accounting','banking','investment','controller','treasury','fp&a','auditor','bookkeep']],
  ['hr', ['human resources',' hr ','recruit','talent acquisition','people ops','hris']],
  ['legal', ['legal','lawyer','attorney','paralegal','counsel','advocate','litigation','compliance officer']],
  ['healthcare', ['nurse','nursing','medical','clinical','physician','therapist','healthcare','patient','pharmac','dental','caregiver','fitness','personal trainer']],
  ['education', ['teacher','teaching','education','professor','instructor','tutor','lecturer','curriculum','faculty']],
  ['consulting', ['consultant','consulting','advisory','strategy']],
  ['engineering', ['mechanical','civil engineer','electrical engineer','industrial engineer','manufacturing','aerospace','aeronautical','aviation','avionics','structural','hardware engineer','chemical engineer','quality engineer','quality assurance','quality control','qa engineer','process engineer','reliability engineer','maintenance engineer','repair engineer','propulsion','turbine','mechatronic']],
  ['operations', ['operations','logistics','supply chain','procurement','warehouse','aviation','bpo','dispatch']],
  ['hospitality', ['hospitality','hotel','restaurant','chef','culinary','food service','barista','guest service']],
  ['trades', ['construction','electrician','plumber','mechanic','automotive','technician','welder','hvac','carpenter','agriculture','farm','driver']],
];

/**
 * Free-text role hints -> archetype family. Scores each family by how many of
 * its cues the hints hit and takes the highest, so one incidental cue cannot
 * outrank the family the CV matches on several signals. Ties break toward the
 * earlier, more specific family.
 */
export function resolveRoleFamily(hints: string[]): string | null {
  const hay = ' ' + hints.join(' ').toLowerCase() + ' ';
  let best: { family: string; score: number } | null = null;
  for (const [family, cues] of FAMILY_CUES) {
    if (!KNOWN_FAMILIES.has(family)) continue;
    const score = cues.reduce((n, c) => (hay.includes(c) ? n + 1 : n), 0);
    if (score > 0 && (best === null || score > best.score)) {
      best = { family, score };
    }
  }
  return best?.family ?? null;
}

/**
 * Pull the denormalised percentile columns out of an analysis result payload.
 * Defensive: any shape it does not recognise yields nulls rather than throwing,
 * because this runs inside the analysis write path and must never be the reason
 * a paid analysis fails to save.
 */
export function derivePercentileColumns(result: unknown): {
  cvQualityOverall: number | null;
  roleFamily: string | null;
} {
  const r = result as
    | {
        cv_quality?: { overall?: unknown };
        projected_profile?: { target_roles?: unknown; domains?: unknown };
      }
    | null
    | undefined;
  if (!r || typeof r !== 'object') {
    return { cvQualityOverall: null, roleFamily: null };
  }

  const raw = r.cv_quality?.overall;
  const cvQualityOverall =
    typeof raw === 'number' && Number.isFinite(raw)
      ? Math.round(Math.max(0, Math.min(100, raw)))
      : null;

  const asStrings = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  const hints = [
    ...asStrings(r.projected_profile?.target_roles),
    ...asStrings(r.projected_profile?.domains),
  ];
  const roleFamily = hints.length > 0 ? resolveRoleFamily(hints) : null;

  return { cvQualityOverall, roleFamily };
}
