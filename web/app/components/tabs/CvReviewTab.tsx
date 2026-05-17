"use client";

import { Github, Linkedin } from "react-bootstrap-icons";
import type { AnalysisResult, Issue } from "../types";
import { RadarChart } from "../RadarChart";
import { Md } from "../Md";
import { useLanguage } from "../../../context/language";

// ─── Types ─────────────────────────────────────────────────────────────────

type MergedIssue = Issue & { source: 'cv' | 'github' | 'linkedin' };

// ─── Constants ──────────────────────────────────────────────────────────────

const SEV_ORDER = { critical: 0, major: 1, minor: 2 } as const;

const SEV_BADGE: Record<string, string> = {
  critical: 'text-rc-red   border-rc-red/30',
  major:    'text-rc-amber border-rc-amber/30',
  minor:    'text-rc-hint  border-rc-border',
};

const SEV_DOT: Record<string, string> = {
  critical: 'bg-rc-red',
  major:    'bg-rc-amber',
  minor:    'bg-rc-hint/40',
};

const SENIORITY_LEVELS = ['Junior', 'Mid', 'Senior', 'Staff', 'Lead', 'Principal'] as const;

const QUALITY_KEYS = [
  { key: 'clarity'     as const, labelEn: 'Clarity',    labelFr: 'Clarté' },
  { key: 'impact'      as const, labelEn: 'Impact',      labelFr: 'Impact' },
  { key: 'hard_skills' as const, labelEn: 'Hard skills', labelFr: 'Hard skills' },
  { key: 'soft_skills' as const, labelEn: 'Soft skills', labelFr: 'Soft skills' },
  { key: 'consistency' as const, labelEn: 'Consistency', labelFr: 'Cohérence' },
  { key: 'ats_format'  as const, labelEn: 'ATS format',  labelFr: 'Format ATS' },
];

function seniorityIndex(label: string) {
  const l = label.toLowerCase();
  const idx = SENIORITY_LEVELS.findIndex(s => l.includes(s.toLowerCase()));
  return idx >= 0 ? idx : 2;
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function LetterBadge({ letter }: { letter: string }) {
  return (
    <div className="shrink-0 w-6 h-6 border border-rc-text/40 flex items-center justify-center font-mono text-[11px] font-bold text-rc-text mt-0.5">
      {letter}
    </div>
  );
}

function SectionHead({ letter, tag, title, subtitle }: {
  letter: string; tag: string; title: string; subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-4 mb-7">
      <LetterBadge letter={letter} />
      <div>
        <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-rc-red block mb-1.5">{tag}</span>
        <h2 className="text-[21px] font-bold text-rc-text leading-tight">{title}</h2>
        {subtitle && <p className="text-[13px] text-rc-muted mt-2 leading-relaxed max-w-xl">{subtitle}</p>}
      </div>
    </div>
  );
}

function SourceBadge({ source }: { source: 'cv' | 'github' | 'linkedin' }) {
  if (source === 'github')   return <Github   size={11} className="text-rc-hint/60 shrink-0" />;
  if (source === 'linkedin') return <Linkedin size={11} className="text-rc-hint/60 shrink-0" />;
  return <span className="font-mono text-[7px] text-rc-hint/50 border border-rc-border px-1 shrink-0">CV</span>;
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function CvReviewTab({ result }: { result: AnalysisResult }) {
  const { locale } = useLanguage();
  const fr = locale === 'fr';

  const {
    cv_quality, projected_profile, cv_tone, seniority_analysis,
    audit, cross_profile_inconsistencies, skill_radar,
  } = result;

  if (!cv_quality || !projected_profile) return null;

  // ── Merged issue list ────────────────────────────────────────────────────
  const merged: MergedIssue[] = [
    ...audit.cv.issues.map(i => ({ ...i, source: 'cv' as const })),
    ...(audit.github.score   !== null ? audit.github.issues.map(i =>   ({ ...i, source: 'github'   as const })) : []),
    ...(audit.linkedin.score !== null ? audit.linkedin.issues.map(i => ({ ...i, source: 'linkedin' as const })) : []),
  ].sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]);

  const critCount   = merged.filter(i => i.severity === 'critical').length;
  const majorCount  = merged.filter(i => i.severity === 'major').length;

  // ── Source cards ─────────────────────────────────────────────────────────
  const sources = [
    { key: 'cv'       as const, label: 'CV',       score: audit.cv.score,       count: audit.cv.issues.length },
    ...(audit.linkedin.score !== null ? [{ key: 'linkedin' as const, label: 'LinkedIn', score: audit.linkedin.score!, count: audit.linkedin.issues.length }] : []),
    ...(audit.github.score   !== null ? [{ key: 'github'   as const, label: 'GitHub',   score: audit.github.score!,   count: audit.github.issues.length   }] : []),
  ];

  // ── Dynamic section letters ───────────────────────────────────────────────
  const inconsistencies = cross_profile_inconsistencies ?? [];
  const hasTimeline     = inconsistencies.length > 0;
  const hasRewrites     = cv_tone?.detected !== 'active' && (cv_tone?.rewrites?.length ?? 0) > 0;
  const topConclusions  = merged.slice(0, 3);

  let letterIdx = 0;
  const nextLetter = () => 'ABCDE'[letterIdx++];
  const letterA = nextLetter(); // always A
  const letterB = hasTimeline ? nextLetter() : null;
  const letterC = nextLetter(); // conclusions
  const letterD = nextLetter(); // seniority
  const letterE = hasRewrites ? nextLetter() : null;

  // ── Seniority ─────────────────────────────────────────────────────────────
  const expectedIdx = seniorityIndex(seniority_analysis.expected);
  const detectedIdx = seniorityIndex(seniority_analysis.detected);
  const hasGap = expectedIdx !== detectedIdx;

  return (
    <div>

      {/* ── HEADER: score + issue table ──────────────────────────────────── */}
      <div className="border border-rc-border mb-12 overflow-hidden">
        <div className="grid grid-cols-[220px_1fr]">

          {/* Left column: global score + sub-score bars */}
          <div className="border-r border-rc-border p-6 flex flex-col gap-6">
            <div>
              <div className="flex items-end gap-1 leading-none mb-1">
                <span
                  className={`font-mono font-semibold leading-none ${
                    cv_quality.overall >= 70 ? 'text-rc-green'
                    : cv_quality.overall >= 50 ? 'text-rc-amber'
                    : 'text-rc-red'
                  }`}
                  style={{ fontSize: 60 }}
                >
                  {cv_quality.overall}
                </span>
                <span className="font-mono text-[18px] text-rc-hint mb-1">/100</span>
              </div>
              <span className="font-mono text-[8px] uppercase tracking-[0.18em] text-rc-hint">
                {fr ? 'GLOBAL DU CV' : 'CV GLOBAL SCORE'}
              </span>
            </div>

            <div className="space-y-2">
              {QUALITY_KEYS.map(({ key, labelEn, labelFr }) => {
                const val = cv_quality[key] ?? 0;
                const barCls = val >= 70 ? 'bg-rc-green' : val >= 50 ? 'bg-rc-amber' : 'bg-rc-red';
                const txtCls = val >= 70 ? 'text-rc-green' : val >= 50 ? 'text-rc-amber' : 'text-rc-red';
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="font-mono text-[8px] uppercase text-rc-hint w-16 shrink-0 truncate">
                      {fr ? labelFr : labelEn}
                    </span>
                    <div className="flex-1 h-[3px] bg-rc-border/40">
                      <div className={`h-full ${barCls}`} style={{ width: `${val}%` }} />
                    </div>
                    <span className={`font-mono text-[9px] w-6 text-right tabular-nums ${txtCls}`}>{val}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column: issue table */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center justify-between px-5 py-2.5 bg-rc-surface-hero border-b border-rc-border shrink-0">
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-rc-hint">
                {fr ? 'Signaux détectés' : 'Detected signals'} <span className="text-rc-text font-bold ml-1">{merged.length}</span>
              </span>
              <div className="flex items-center gap-3">
                {critCount  > 0 && <span className="font-mono text-[9px] text-rc-red">{critCount} critique{critCount  > 1 ? 's' : ''}</span>}
                {majorCount > 0 && <span className="font-mono text-[9px] text-rc-amber">{majorCount} majeur{majorCount > 1 ? 's' : ''}</span>}
              </div>
            </div>

            <div className="overflow-y-auto divide-y divide-rc-border/20" style={{ maxHeight: 230 }}>
              {merged.map((issue, idx) => (
                <div key={idx} className="flex items-start gap-3 px-5 py-2.5 hover:bg-rc-surface-raised transition-colors">
                  <span className="font-mono text-[9px] text-rc-hint/30 shrink-0 tabular-nums mt-0.5 w-5 text-right">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className={`shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${SEV_DOT[issue.severity]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`font-mono text-[8px] uppercase tracking-wider border px-1.5 py-[1px] ${SEV_BADGE[issue.severity]}`}>
                        {issue.severity}
                      </span>
                      <span className="font-mono text-[8px] uppercase text-rc-hint/40">{issue.category}</span>
                    </div>
                    <p className="text-[12px] text-rc-text leading-snug truncate"><Md>{issue.what}</Md></p>
                  </div>
                  <div className="shrink-0 mt-1"><SourceBadge source={issue.source} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION A: Source scores ──────────────────────────────────────── */}
      <div className="mb-14">
        <SectionHead
          letter={letterA}
          tag={fr ? `LE CONSTAT ${letterA} · SOURCES MULTIPLES` : `FINDING ${letterA} · MULTIPLE SOURCES`}
          title={fr ? 'Chaque source porte sa propre version de vous.' : 'Each source tells a different story about you.'}
          subtitle={fr
            ? `Le scan a comparé ${sources.length} sources publiques. Chacune raconte une histoire légèrement différente — et ces différences sont mesurables.`
            : `The scan compared ${sources.length} public sources. Each tells a slightly different story — and those differences are measurable.`
          }
        />

        <div className={`grid gap-4 ${sources.length === 1 ? 'grid-cols-1' : sources.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {sources.map(src => {
            const col    = src.score >= 70 ? 'text-rc-green'     : src.score >= 50 ? 'text-rc-amber'     : 'text-rc-red';
            const border = src.score >= 70 ? 'border-rc-green/20' : src.score >= 50 ? 'border-rc-amber/20' : 'border-rc-red/20';
            const bar    = src.score >= 70 ? 'bg-rc-green'       : src.score >= 50 ? 'bg-rc-amber'       : 'bg-rc-red';
            return (
              <div key={src.key} className={`bg-rc-surface border ${border} p-5`}>
                <div className="flex items-center gap-2 mb-3">
                  {src.key === 'github'   && <Github   size={11} className="text-rc-hint" />}
                  {src.key === 'linkedin' && <Linkedin size={11} className="text-rc-hint" />}
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-rc-hint">{src.label}</span>
                </div>
                <div className="flex items-end gap-1 leading-none mb-2">
                  <span className={`font-mono text-[40px] font-medium leading-none ${col}`}>{src.score}</span>
                  <span className="font-mono text-[13px] text-rc-hint mb-0.5">/100</span>
                </div>
                <div className="h-[2px] bg-rc-border/40 mb-2 overflow-hidden">
                  <div className={`h-full ${bar}`} style={{ width: `${src.score}%` }} />
                </div>
                <span className="font-mono text-[9px] text-rc-hint">
                  {src.count} {fr ? `signal${src.count !== 1 ? 's' : ''}` : `issue${src.count !== 1 ? 's' : ''}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── SECTION B: Timeline / Inconsistencies (if available) ─────────── */}
      {hasTimeline && letterB && (
        <div className="mb-14">
          <SectionHead
            letter={letterB}
            tag={fr ? `LE CONSTAT ${letterB} · CHRONOLOGIE, DIVERGENCES` : `FINDING ${letterB} · TIMELINE DIVERGENCES`}
            title={fr
              ? `${inconsistencies.length} point${inconsistencies.length > 1 ? 's' : ''} de divergence détecté${inconsistencies.length > 1 ? 's' : ''}.`
              : `${inconsistencies.length} divergence point${inconsistencies.length > 1 ? 's' : ''} detected.`
            }
            subtitle={fr
              ? 'Quand on aligne les sources sur la même règle temporelle, les écarts deviennent impossibles à cacher.'
              : 'When sources are aligned on the same timeline, discrepancies become impossible to hide.'
            }
          />

          <div className="border border-rc-border divide-y divide-rc-border/20">
            {inconsistencies.map((inc, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-4">
                <div className={`shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${SEV_DOT[inc.severity]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`font-mono text-[8px] uppercase tracking-wider border px-1.5 py-px ${SEV_BADGE[inc.severity]}`}>
                      {inc.severity}
                    </span>
                    <span className="font-mono text-[8px] uppercase tracking-wider text-rc-hint/50">
                      {inc.field.replace(/_/g, ' ')}
                    </span>
                    <div className="flex gap-1">
                      {inc.sources.map(s => (
                        <span key={s} className="font-mono text-[8px] text-rc-hint/60 px-1 border border-rc-border">{s}</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-[13px] text-rc-text leading-snug"><Md>{inc.description}</Md></p>
                  {inc.recruiter_perception && (
                    <p className="text-[12px] text-rc-muted mt-1 italic leading-relaxed"><Md>{inc.recruiter_perception}</Md></p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION C: Top conclusions ────────────────────────────────────── */}
      {topConclusions.length > 0 && (
        <div className="mb-14">
          <SectionHead
            letter={letterC}
            tag={fr
              ? `LE CONSTAT ${letterC} · CONCLUSIONS TRANSVERSALES`
              : `FINDING ${letterC} · KEY FINDINGS`
            }
            title={fr
              ? `${topConclusions.length} conclusion${topConclusions.length > 1 ? 's' : ''}. Traçable${topConclusions.length > 1 ? 's' : ''} à la source.`
              : `${topConclusions.length} conclusion${topConclusions.length > 1 ? 's' : ''}. Traceable to the source.`
            }
          />

          <div className="space-y-3">
            {topConclusions.map((issue, i) => (
              <div key={i} className={`border bg-rc-surface ${
                issue.severity === 'critical' ? 'border-rc-red/20' :
                issue.severity === 'major'    ? 'border-rc-amber/20' : 'border-rc-border'
              }`}>
                <div className="flex items-start gap-5 p-6">
                  <span className="font-mono text-[40px] font-bold text-rc-text/10 leading-none shrink-0 select-none tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`font-mono text-[8px] uppercase tracking-wider border px-1.5 py-px ${SEV_BADGE[issue.severity]}`}>
                        {issue.severity}
                      </span>
                      <SourceBadge source={issue.source} />
                    </div>
                    <p className="text-[15px] font-semibold text-rc-text leading-snug mb-1.5"><Md>{issue.what}</Md></p>
                    <p className="text-[13px] text-rc-muted leading-relaxed"><Md>{issue.why}</Md></p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SECTION D: Seniority + Radar ──────────────────────────────────── */}
      <div className="mb-14">
        <SectionHead
          letter={letterD}
          tag={fr
            ? `LE CONSTAT ${letterD} · EMPREINTE DE SÉNIORITÉ`
            : `FINDING ${letterD} · SENIORITY PROFILE`
          }
          title={
            hasGap
              ? (fr
                  ? `Vous écrivez comme un ${seniority_analysis.expected}. Vos titres suggèrent ${seniority_analysis.detected}.`
                  : `Your writing reads ${seniority_analysis.expected}. Your titles suggest ${seniority_analysis.detected}.`)
              : (fr
                  ? `Profil cohérent — ${seniority_analysis.expected}.`
                  : `Consistent profile — ${seniority_analysis.expected}.`)
          }
        />

        {/* Seniority progression bar */}
        <div className="mb-8 px-2">
          <div className="flex items-start">
            {SENIORITY_LEVELS.map((level, idx) => (
              <div key={level} className="flex-1 flex flex-col items-center relative">
                <div className={`w-full h-[2px] ${idx <= Math.max(expectedIdx, detectedIdx) ? 'bg-rc-border' : 'bg-rc-border/30'}`} />
                <div className={`w-2.5 h-2.5 rounded-full border-2 -mt-[5px] ${
                  idx === expectedIdx && idx === detectedIdx ? 'border-rc-amber bg-rc-amber' :
                  idx === expectedIdx ? 'border-rc-red bg-rc-red' :
                  idx === detectedIdx ? 'border-rc-amber bg-rc-amber' :
                  'border-rc-border/40 bg-rc-bg'
                }`} />
                <span className={`font-mono text-[8px] uppercase mt-2 text-center ${
                  idx === expectedIdx || idx === detectedIdx ? 'text-rc-text font-semibold' : 'text-rc-hint/40'
                }`}>
                  {level}
                </span>
                {idx === expectedIdx && hasGap && (
                  <span className="font-mono text-[7px] text-rc-red mt-0.5">{fr ? 'écrit' : 'writes'}</span>
                )}
                {idx === detectedIdx && hasGap && (
                  <span className="font-mono text-[7px] text-rc-amber mt-0.5">{fr ? 'titres' : 'titles'}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className={`grid gap-8 ${skill_radar && skill_radar.axes.length >= 4 ? 'md:grid-cols-2' : 'grid-cols-1'}`}>
          {/* Left: seniority insight */}
          <div className="space-y-4">
            <p className="text-[14px] text-rc-muted leading-relaxed"><Md>{seniority_analysis.gap}</Md></p>
            {seniority_analysis.strength && (
              <blockquote className="border-l-2 border-rc-amber/50 pl-4 py-1">
                <p className="text-[13px] text-rc-text italic leading-relaxed">"<Md>{seniority_analysis.strength}</Md>"</p>
              </blockquote>
            )}
          </div>

          {/* Right: radar + skill evidence */}
          {skill_radar && skill_radar.axes.length >= 4 && (
            <div className="space-y-5">
              <RadarChart axes={skill_radar.axes} />

              {/* Skill score bars */}
              <div className="border border-rc-border divide-y divide-rc-border/20">
                {skill_radar.axes.map((axis, i) => (
                  <div key={i} className="px-4 py-2.5 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] uppercase text-rc-hint w-20 shrink-0">{axis.label}</span>
                      <div className="flex-1 h-[2px] bg-rc-border/40">
                        <div
                          className={`h-full ${axis.score >= 70 ? 'bg-rc-green' : axis.score >= 50 ? 'bg-rc-amber' : 'bg-rc-red'}`}
                          style={{ width: `${axis.score}%` }}
                        />
                      </div>
                      <span className={`font-mono text-[10px] w-6 text-right tabular-nums ${axis.score >= 70 ? 'text-rc-green' : axis.score >= 50 ? 'text-rc-amber' : 'text-rc-red'}`}>
                        {axis.score}
                      </span>
                    </div>
                    <p className="font-mono text-[10px] text-rc-hint leading-snug pl-[5.5rem]"><Md>{axis.evidence}</Md></p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── SECTION E: Before/After diff ──────────────────────────────────── */}
      {hasRewrites && letterE && (
        <div className="mb-14">
          <SectionHead
            letter={letterE}
            tag={fr ? `LE CONSTAT ${letterE} · DIFF LINGUISTIQUE` : `FINDING ${letterE} · LANGUAGE DIFF`}
            title={fr ? 'Avant. Après. Diff.' : 'Before. After. Diff.'}
            subtitle={fr
              ? 'Ces phrases sont lues comme des descriptions de tâches, pas des accomplissements. Voici la réécriture.'
              : "These phrases read as task descriptions, not accomplishments. Here's the rewrite."
            }
          />

          <div className="border border-rc-border divide-y divide-rc-border/20 font-mono overflow-hidden">
            {cv_tone!.examples.map((ex, i) => (
              <div key={i}>
                <div className="flex items-start gap-3 px-5 py-3 bg-rc-red/[0.025]">
                  <span className="text-[13px] text-rc-red/60 shrink-0 select-none leading-relaxed">−</span>
                  <p className="text-[12px] text-rc-muted leading-relaxed italic line-through decoration-rc-red/20"><Md>{ex}</Md></p>
                </div>
                {cv_tone!.rewrites?.[i] && (
                  <div className="flex items-start gap-3 px-5 py-3 bg-rc-green/[0.03] border-t border-rc-border/20">
                    <span className="text-[13px] text-rc-green/60 shrink-0 select-none leading-relaxed">+</span>
                    <p className="text-[12px] text-rc-text leading-relaxed"><Md>{cv_tone!.rewrites![i]}</Md></p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
