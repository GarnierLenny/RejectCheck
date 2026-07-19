"use client";

import { Github, Linkedin } from "react-bootstrap-icons";
import type { AnalysisResult, Issue } from "../types";
import { RadarChart } from "../RadarChart";
import { Md } from "../Md";
import { IssueItem } from "../IssueItem";
import { SectionHeader } from "../SectionHeader";
import { getSeverityStyles } from "../types";
import { useLanguage } from "../../../context/language";

// ─── Types ─────────────────────────────────────────────────────────────────

type MergedIssue = Issue & { source: 'cv' | 'github' | 'linkedin' };

// ─── Constants ──────────────────────────────────────────────────────────────

const SEV_ORDER = { critical: 0, major: 1, minor: 2 } as const;

const SENIORITY_LEVELS = ['Junior', 'Mid', 'Senior', 'Staff', 'Lead', 'Principal'] as const;

const QUALITY_KEYS = [
  { key: 'clarity'     as const, labelEn: 'Clarity',    labelFr: 'Clarté' },
  { key: 'impact'      as const, labelEn: 'Impact',      labelFr: 'Impact' },
  { key: 'hard_skills' as const, labelEn: 'Hard skills', labelFr: 'Hard skills' },
  { key: 'soft_skills' as const, labelEn: 'Soft skills', labelFr: 'Soft skills' },
  { key: 'consistency' as const, labelEn: 'Consistency', labelFr: 'Cohérence' },
  { key: 'ats_format'  as const, labelEn: 'ATS format',  labelFr: 'Format ATS' },
];

const SEV_DOT: Record<string, string> = {
  critical: 'bg-rc-red',
  major:    'bg-rc-amber',
  minor:    'bg-rc-hint/40',
};

function seniorityIndex(label: string) {
  const l = label.toLowerCase();
  const idx = SENIORITY_LEVELS.findIndex(s => l.includes(s.toLowerCase()));
  return idx >= 0 ? idx : 2;
}

function SourceBadge({ source }: { source: 'cv' | 'github' | 'linkedin' }) {
  if (source === 'github')   return <Github   size={12} className="text-rc-hint shrink-0" />;
  if (source === 'linkedin') return <Linkedin size={12} className="text-rc-hint shrink-0" />;
  return <span className="font-mono text-[8px] text-rc-hint border border-rc-border px-1 shrink-0">CV</span>;
}

// ─── Main ────────────────────────────────────────────────────────────────────

export function CvReviewTab({ result, actions }: { result: AnalysisResult; actions?: React.ReactNode }) {
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

  const critCount  = merged.filter(i => i.severity === 'critical').length;
  const majorCount = merged.filter(i => i.severity === 'major').length;
  const minorCount = merged.filter(i => i.severity === 'minor').length;

  // ── Source cards ─────────────────────────────────────────────────────────
  const sources = [
    { key: 'cv'       as const, label: 'CV',       score: audit.cv.score,       count: audit.cv.issues.length,       strengths: audit.cv.strengths },
    ...(audit.linkedin.score !== null ? [{ key: 'linkedin' as const, label: 'LinkedIn', score: audit.linkedin.score!, count: audit.linkedin.issues.length, strengths: audit.linkedin.strengths }] : []),
    ...(audit.github.score   !== null ? [{ key: 'github'   as const, label: 'GitHub',   score: audit.github.score!,   count: audit.github.issues.length,   strengths: audit.github.strengths   }] : []),
  ];

  // ── Conditionals ─────────────────────────────────────────────────────────
  const inconsistencies = cross_profile_inconsistencies ?? [];
  const hasTimeline     = inconsistencies.length > 0;
  const hasRewrites     = cv_tone?.detected !== 'active' && (cv_tone?.rewrites?.length ?? 0) > 0;
  const topConclusions  = merged.slice(0, 3);

  // ── Seniority ─────────────────────────────────────────────────────────────
  const expectedIdx = seniorityIndex(seniority_analysis.expected);
  const detectedIdx = seniorityIndex(seniority_analysis.detected);
  const hasGap = expectedIdx !== detectedIdx;

  // ── Score color helpers ───────────────────────────────────────────────────
  const scoreColor = (s: number) => s >= 70 ? 'text-rc-green' : s >= 50 ? 'text-rc-amber' : 'text-rc-red';
  const scoreBg    = (s: number) => s >= 70 ? 'bg-rc-green'   : s >= 50 ? 'bg-rc-amber'   : 'bg-rc-red';
  const scoreBorder = (s: number) => s >= 70 ? 'border-rc-green/20' : s >= 50 ? 'border-rc-amber/20' : 'border-rc-red/20';

  return (
    <div className="space-y-12">

      {/* ── SCORE HEADER ─────────────────────────────────────────────────── */}
      <div className="bg-rc-surface border border-rc-border overflow-hidden">

        {/* Top bar */}
        <div className="px-8 py-4 border-b border-rc-border bg-rc-surface-hero flex items-center justify-between">
          <span className="font-mono text-[12px] tracking-[0.15em] uppercase text-rc-hint">
            {fr ? 'Bilan CV' : 'CV Audit'}
          </span>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Score + sub-bars */}
          <div className="px-8 py-8 lg:w-[320px] shrink-0 border-b lg:border-b-0 lg:border-r border-rc-border flex flex-col justify-center gap-6">
            <div>
              <div className={`font-mono font-medium leading-none ${scoreColor(cv_quality.overall)}`} style={{ fontSize: 88, lineHeight: 1 }}>
                {cv_quality.overall}<span style={{ fontSize: 28 }} className="opacity-40">%</span>
              </div>
              <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-rc-hint mt-2 block">
                {fr ? 'Score global' : 'Overall score'}
              </span>
            </div>

            <div className="space-y-3">
              {QUALITY_KEYS.map(({ key, labelEn, labelFr }) => {
                const val = cv_quality[key];
                if (val === undefined) return null;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] uppercase tracking-tight text-rc-hint">{fr ? labelFr : labelEn}</span>
                      <span className={`font-mono text-[11px] font-bold tabular-nums ${scoreColor(val)}`}>{val}</span>
                    </div>
                    <div className="h-[3px] bg-rc-text/8 overflow-hidden">
                      <div className={`h-full ${scoreBg(val)} transition-all duration-700`} style={{ width: `${val}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Merged issue table */}
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between px-8 py-4 border-b border-rc-border bg-rc-surface-hero shrink-0">
              <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-rc-hint">
                {fr ? 'Signaux' : 'Signals'} <span className="text-rc-text font-bold ml-1">{merged.length}</span>
              </span>
              <div className="flex items-center gap-3">
                {critCount  > 0 && <span className="font-mono text-[11px] px-2 py-0.5 border border-rc-red/20 text-rc-red">{critCount} {fr ? 'critique' : 'critical'}{critCount > 1 ? 's' : ''}</span>}
                {majorCount > 0 && <span className="font-mono text-[11px] px-2 py-0.5 border border-rc-amber/20 text-rc-amber">{majorCount} {fr ? 'majeur' : 'major'}{majorCount > 1 ? 's' : ''}</span>}
                {minorCount > 0 && <span className="font-mono text-[11px] px-2 py-0.5 border border-rc-border text-rc-hint">{minorCount} minor</span>}
              </div>
            </div>

            <div className="overflow-y-auto divide-y divide-rc-border/20" style={{ maxHeight: 280 }}>
              {merged.map((issue, idx) => (
                <div key={idx} className="flex items-start gap-4 px-8 py-4 hover:bg-rc-surface-raised transition-colors">
                  <span className="font-mono text-[11px] text-rc-hint/30 shrink-0 tabular-nums mt-0.5 w-5 text-right">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-mono text-[11px] uppercase px-2 py-0.5 border ${getSeverityStyles(issue.severity)}`}>
                        {issue.severity}
                      </span>
                      <span className="font-mono text-[11px] uppercase text-rc-hint/50">{issue.category}</span>
                    </div>
                    <p className="text-[14px] text-rc-text leading-snug truncate"><Md>{issue.what}</Md></p>
                  </div>
                  <div className="shrink-0 mt-1"><SourceBadge source={issue.source} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer: projected profile */}
        <div className="px-8 py-5 border-t border-rc-border bg-rc-surface-hero flex flex-wrap items-center gap-x-8 gap-y-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-rc-hint">{fr ? 'Profil projeté' : 'Projected profile'}</span>
          <span className="font-mono text-[12px] text-rc-text font-semibold">{projected_profile.seniority}</span>
          <span className="text-rc-border">·</span>
          <div className="flex flex-wrap gap-2">
            {projected_profile.target_roles.slice(0, 3).map((r, i) => (
              <span key={i} className="font-mono text-[11px] px-2 py-0.5 border border-rc-border text-rc-hint">{r}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── SOURCE SCORES ────────────────────────────────────────────────── */}
      <div>
        <SectionHeader
          label={fr ? 'Sources' : 'Sources'}
          title={fr ? 'Score par source' : 'Score per source'}
          subtitle={fr
            ? `${sources.length} source${sources.length > 1 ? 's' : ''} analysée${sources.length > 1 ? 's' : ''}. Chacune raconte une histoire légèrement différente.`
            : `${sources.length} source${sources.length > 1 ? 's' : ''} analysed. Each tells a slightly different story.`
          }
        />

        <div className={`grid gap-4 ${sources.length === 1 ? 'grid-cols-1' : sources.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
          {sources.map(src => (
            <div key={src.key} className={`bg-rc-surface border ${scoreBorder(src.score)} p-6`}>
              <div className="flex items-center gap-2 mb-4">
                {src.key === 'github'   && <Github   size={13} className="text-rc-hint" />}
                {src.key === 'linkedin' && <Linkedin size={13} className="text-rc-hint" />}
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-rc-hint">{src.label}</span>
              </div>
              <div className={`font-mono font-medium leading-none mb-3 ${scoreColor(src.score)}`} style={{ fontSize: 56, lineHeight: 1 }}>
                {src.score}<span style={{ fontSize: 20 }} className="opacity-40">%</span>
              </div>
              <div className="h-[3px] bg-rc-text/8 mb-4 overflow-hidden">
                <div className={`h-full ${scoreBg(src.score)}`} style={{ width: `${src.score}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-rc-muted">
                  {src.count} {fr ? `signal${src.count !== 1 ? 's' : ''}` : `issue${src.count !== 1 ? 's' : ''}`}
                </span>
                {(src.strengths?.length ?? 0) > 0 && (
                  <span className="font-mono text-[11px] text-rc-green">{src.strengths?.length} ✓</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SENIORITY PROFILE ────────────────────────────────────────────── */}
      <div>
        {/* Radar — avant l'encart séniorité */}
        {skill_radar && skill_radar.axes.length >= 4 && (
          <div className="bg-rc-surface border border-rc-border overflow-hidden mb-6">
            <div className="px-8 py-4 border-b border-rc-border bg-rc-surface-hero">
              <span className="font-mono text-[12px] tracking-[0.15em] uppercase text-rc-hint">
                {fr ? 'Radar de compétences' : 'Skills radar'}
              </span>
            </div>
            <div className="px-12 py-10">
              <RadarChart
                axes={skill_radar.axes}
                fluid
                evidenceHeader={{
                  title: fr ? 'Détail des scores' : 'Skill breakdown',
                  subtitle: fr ? 'Score par dimension clé' : 'Score across each key dimension',
                }}
              />
            </div>
          </div>
        )}

        <SectionHeader
          label={fr ? 'Séniorité' : 'Seniority'}
          title={
            hasGap
              ? (fr
                  ? `Vous écrivez comme un ${seniority_analysis.expected}. Vos titres suggèrent ${seniority_analysis.detected}.`
                  : `Your writing reads ${seniority_analysis.expected}. Your titles suggest ${seniority_analysis.detected}.`)
              : (fr
                  ? `Profil cohérent : ${seniority_analysis.expected}`
                  : `Consistent profile: ${seniority_analysis.expected}`)
          }
          subtitle={fr
            ? 'Analyse du niveau perçu par un recruteur à la lecture du CV.'
            : 'Perceived seniority level as read by a recruiter.'
          }
        />

        {/* Progression bar */}
        <div className="bg-rc-surface border border-rc-border p-6 mb-6">
          <div className="flex items-start px-2">
            {SENIORITY_LEVELS.map((level, idx) => (
              <div key={level} className="flex-1 flex flex-col items-center">
                <div className={`w-full h-[2px] ${idx <= Math.max(expectedIdx, detectedIdx) ? 'bg-rc-border' : 'bg-rc-border/30'}`} />
                <div className={`w-3 h-3 rounded-full border-2 -mt-[6px] ${
                  idx === expectedIdx && idx === detectedIdx ? 'border-rc-amber bg-rc-amber' :
                  idx === expectedIdx ? 'border-rc-red bg-rc-red' :
                  idx === detectedIdx ? 'border-rc-amber bg-rc-amber' :
                  'border-rc-border/40 bg-rc-bg'
                }`} />
                <span className={`font-mono text-[10px] uppercase mt-2.5 text-center ${
                  idx === expectedIdx || idx === detectedIdx ? 'text-rc-text font-semibold' : 'text-rc-hint/40'
                }`}>
                  {level}
                </span>
                {idx === expectedIdx && hasGap && (
                  <span className="font-mono text-[9px] text-rc-red mt-0.5">{fr ? 'écrit' : 'writes'}</span>
                )}
                {idx === detectedIdx && hasGap && (
                  <span className="font-mono text-[9px] text-rc-amber mt-0.5">{fr ? 'titres' : 'titles'}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Insight text */}
        <div className="space-y-4">
          <p className="text-[17px] text-rc-muted leading-[1.7]"><Md>{seniority_analysis.gap}</Md></p>
          {seniority_analysis.strength && (
            <div className="pl-5 py-1">
              <p className="text-[17px] text-rc-text italic leading-relaxed"><Md>{seniority_analysis.strength}</Md></p>
            </div>
          )}
        </div>
      </div>

      {/* ── TIMELINE DIVERGENCES ─────────────────────────────────────────── */}
      {hasTimeline && (
        <div>
          <SectionHeader
            label={fr ? 'Chronologie' : 'Timeline'}
            labelColor="text-rc-amber"
            title={fr
              ? `${inconsistencies.length} divergence${inconsistencies.length > 1 ? 's' : ''} détectée${inconsistencies.length > 1 ? 's' : ''}`
              : `${inconsistencies.length} divergence${inconsistencies.length > 1 ? 's' : ''} detected`
            }
            subtitle={fr
              ? 'Quand on aligne les sources sur la même règle temporelle, les écarts deviennent impossibles à cacher.'
              : 'When sources are aligned on the same timeline, discrepancies become impossible to hide.'
            }
          />

          <div className="bg-rc-surface border border-rc-border divide-y divide-rc-border/20">
            {inconsistencies.map((inc, i) => (
              <div key={i} className="flex items-start gap-4 p-6">
                <div className={`shrink-0 w-1.5 h-1.5 rounded-full mt-2 ${SEV_DOT[inc.severity]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className={`font-mono text-[11px] uppercase px-2 py-0.5 border ${getSeverityStyles(inc.severity)}`}>
                      {inc.severity}
                    </span>
                    <span className="font-mono text-[11px] uppercase tracking-wider text-rc-hint/50">
                      {inc.field.replace(/_/g, ' ')}
                    </span>
                    <div className="flex gap-1">
                      {inc.sources.map(s => (
                        <span key={s} className="font-mono text-[11px] text-rc-hint px-1.5 border border-rc-border">{s}</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-[17px] text-rc-text leading-snug mb-2"><Md>{inc.description}</Md></p>
                  {inc.recruiter_perception && (
                    <p className="text-[15px] text-rc-muted italic leading-relaxed"><Md>{inc.recruiter_perception}</Md></p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TOP FINDINGS ─────────────────────────────────────────────────── */}
      {topConclusions.length > 0 && (
        <div>
          <SectionHeader
            label={fr ? 'Priorités' : 'Priorities'}
            labelColor="text-rc-red"
            title={fr ? 'Points critiques à corriger' : 'Critical points to fix'}
            subtitle={fr
              ? `Les ${topConclusions.length} signaux les plus impactants, toutes sources confondues.`
              : `The ${topConclusions.length} highest-impact signals across all sources.`
            }
          />

          <div className="bg-rc-surface border border-rc-border divide-y divide-rc-border/20">
            {topConclusions.map((issue, i) => (
              <IssueItem key={i} issue={issue} fixesReady={false} />
            ))}
          </div>
        </div>
      )}

      {/* ── BEFORE/AFTER DIFF ────────────────────────────────────────────── */}
      {hasRewrites && (
        <div>
          <SectionHeader
            label={fr ? 'Reformulation' : 'Language diff'}
            title={fr ? 'Avant / Après' : 'Before / After'}
            subtitle={fr
              ? 'Ces phrases sont lues comme des descriptions de tâches, pas des accomplissements.'
              : 'These phrases read as task descriptions, not accomplishments.'
            }
          />

          <div className="bg-rc-surface border border-rc-border divide-y divide-rc-border/20 overflow-hidden">
            {cv_tone!.examples.map((ex, i) => (
              <div key={i}>
                <div className="flex items-start gap-4 px-6 py-4 bg-rc-red/[0.02]">
                  <span className="font-mono text-[13px] text-rc-red/50 shrink-0 select-none mt-0.5">−</span>
                  <p className="text-[15px] text-rc-muted leading-relaxed italic line-through decoration-rc-red/20">
                    <Md>{ex}</Md>
                  </p>
                </div>
                {cv_tone!.rewrites?.[i] && (
                  <div className="flex items-start gap-4 px-6 py-4 bg-rc-green/[0.025] border-t border-rc-border/20">
                    <span className="font-mono text-[13px] text-rc-green/60 shrink-0 select-none mt-0.5">+</span>
                    <p className="text-[15px] text-rc-text leading-relaxed"><Md>{cv_tone!.rewrites![i]}</Md></p>
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
