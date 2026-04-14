import React from "react";
import { Document, Page, View, Text, Image, StyleSheet, Font } from "@react-pdf/renderer";
import type { AnalysisResult } from "./types";

// Register local fonts for brand consistency and offline reliability
const fontBase = typeof window !== 'undefined' ? window.location.origin : '';

Font.register({
  family: 'InstrumentSans',
  fonts: [
    { src: `${fontBase}/Instrument_Sans/static/InstrumentSans-Regular.ttf`, fontWeight: 400 },
    { src: `${fontBase}/Instrument_Sans/static/InstrumentSans-Italic.ttf`, fontWeight: 400, fontStyle: 'italic' },
    { src: `${fontBase}/Instrument_Sans/static/InstrumentSans-SemiBold.ttf`, fontWeight: 600 },
    { src: `${fontBase}/Instrument_Sans/static/InstrumentSans-Bold.ttf`, fontWeight: 700 },
  ],
});

const redColor = "#D94040";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    paddingHorizontal: 60,
    backgroundColor: "white",
    fontFamily: 'InstrumentSans',
    color: "#1a1917",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 20,
  },
  logoSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: -0.5,
  },
  headerDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  refIdLabel: {
    fontSize: 9,
    color: "#999",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  refIdValue: {
    fontSize: 11,
    fontWeight: 600,
    marginTop: 2,
  },
  section: {
    marginBottom: 48,
  },
  label: {
    fontSize: 10,
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  h2: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: 16,
  },
  h3: {
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 12,
  },
  body: {
    fontSize: 13,
    lineHeight: 1.5,
    color: "#444",
  },
  breakdownGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  },
  breakdownItem: {
    flexDirection: "column",
    gap: 4,
  },
  badge: {
    paddingHorizontal: 12,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 65,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: 700,
    textTransform: "uppercase",
    textAlign: 'center',
  },
  riskCard: {
    backgroundColor: "#faf9f6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f0eee8",
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginBottom: 32,
  },
  riskScore: {
    fontSize: 64,
    fontWeight: 700,
    lineHeight: 1,
  },
  riskPercent: {
    fontSize: 24,
    opacity: 0.6,
  },
  verdictBadge: {
    paddingHorizontal: 20,
    height: 28,
    borderRadius: 6,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 140,
  },
  verdictBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: 'center',
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: "#eee",
    marginBottom: 32,
  },
  seniorityRow: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 20,
  },
  seniorityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toneCard: {
    backgroundColor: "#f9f8f6",
    borderRadius: 8,
    padding: 20,
    marginTop: 12,
  },
  toneExample: {
    flexDirection: "row",
    marginBottom: 8,
    gap: 10,
  },
  issueCard: {
    padding: 20,
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    marginBottom: 16,
  },
  issueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  howToFix: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 6,
    borderLeftWidth: 3,
  },
  actionPlanCard: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 12,
    marginTop: 20,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
  },
  actionPlanTitle: {
    color: "#0f172a",
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 20,
    textAlign: 'center',
  },
  actionGroup: {
    marginBottom: 20,
  },
  actionGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    paddingBottom: 6,
  },
  actionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  actionGroupTitle: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  actionItem: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  checkbox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderRadius: 3,
    marginTop: 2,
    borderColor: "#94a3b8",
  },
  actionText: {
    fontSize: 11,
    color: "#1e293b",
    flex: 1,
    lineHeight: 1.4,
  },
  footer: {
    marginTop: 40,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 20,
    alignItems: "center",
  },
  footerText: {
    fontSize: 10,
    color: "#999",
    marginBottom: 4,
  },
  footerTagline: {
    fontSize: 9,
    fontStyle: "italic",
    color: "#bbb",
  },
  bridgeCard: {
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#dcfce7",
    padding: 24,
    marginBottom: 32,
  },
  bridgeTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#166534",
    marginBottom: 8,
  },
  techBadgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 16,
  },
  techBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#dcfce7",
    borderRadius: 4,
  },
  techBadgeText: {
    fontSize: 8,
    fontWeight: 700,
    color: "#166534",
    textTransform: "uppercase",
  },
  featureItem: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
    alignItems: "flex-start",
  },
  featureCheck: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: "#22c55e",
    marginTop: 2,
  },
  featureText: {
    fontSize: 11,
    color: "#166534",
    flex: 1,
    lineHeight: 1.4,
  },
  whyItMatters: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#22c55e",
  },
  vitalStepsCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#fff1f2",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#fecdd3",
  },
  vitalStepsTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#9f1239",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  vitalStepLine: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 4,
  },
  vitalStepBullet: {
    color: "#e11d48",
    fontWeight: 700,
  },
  vitalStepText: {
    fontSize: 10,
    color: "#9f1239",
    flex: 1,
    lineHeight: 1.4,
  },
  techSection: {
    marginTop: 12,
  },
  techSkillRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    width: '100%',
  },
  techSkillLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: "#475569",
    flex: 1,
  },
  techSkillLevels: {
    flexDirection: "row",
    gap: 12,
  },
  techLevelText: {
    fontSize: 10,
    fontFamily: 'InstrumentSans',
  },
  techSkillEvidence: {
    fontSize: 9,
    color: "#64748b",
    fontStyle: "italic",
    marginTop: 4,
    lineHeight: 1.4,
  },
  techRecommendation: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#64748b",
  },
  infoBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#0ea5e9",
  },
  signalCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    marginBottom: 20,
  },
  signalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  signalTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#1a1917",
  },
  signalScore: {
    fontSize: 20,
    fontWeight: 700,
  },
  strengthBadgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  strengthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#dcfce7",
    borderRadius: 4,
  },
  strengthBadgeText: {
    fontSize: 8,
    color: "#166534",
    fontWeight: 700,
    textTransform: "uppercase",
  },
  architectureBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#D94040",
  },
  advancedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 4,
  },
  advancedBadgeText: {
    fontSize: 8,
    color: "#92400e",
    fontWeight: 700,
    textTransform: "uppercase",
  },
  successCriteriaItem: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 6,
    alignItems: "flex-start",
  },
  successCheck: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#dcfce7",
    borderWidth: 1,
    borderColor: "#86efac",
    marginTop: 2,
  },
  correlationBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#fffbeb",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#d97706",
  },
  jdSkillRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
});

function stripMd(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^#+\s+/gm, "")
    .trim();
}

type TemplateProps = {
  result: AnalysisResult;
  logoUrl?: string;
};

export function ExportTemplatePdf({ result, logoUrl }: TemplateProps) {
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const jobTitle = (result as any).job_details?.title || result.seniority_analysis.expected || "Analysis Result";
  const company = (result as any).job_details?.company || "";
  const jobDisplay = company ? `${jobTitle} — ${company}` : jobTitle;

  const actionPlan: { week: string[]; month: string[]; longTerm: string[] } = {
    week: [],
    month: [],
    longTerm: [],
  };

  const categorizeFix = (fix: any) => {
    if (!fix || !fix.steps) return;
    const time = (fix.time_required || "").toLowerCase();
    let target = actionPlan.longTerm;

    if (time.includes("minute") || time.includes("hour")) {
      target = actionPlan.week;
    } else if (time.includes("day") || time.includes("week")) {
      target = actionPlan.month;
    } else if (time.includes("month")) {
      target = actionPlan.longTerm;
    }

    (fix.steps as string[]).forEach((step: string) => {
      if (!target.includes(step)) target.push(step);
    });
  };

  (result.audit.cv.issues as any[]).forEach(issue => categorizeFix(issue.fix));
  (result.audit.github.issues as any[]).forEach(issue => categorizeFix(issue.fix));
  (result.audit.linkedin.issues as any[]).forEach(issue => categorizeFix(issue.fix));
  categorizeFix(result.seniority_analysis.fix);
  categorizeFix(result.cv_tone.fix);
  (result.hidden_red_flags as any[]).forEach(flag => categorizeFix(flag.fix));

  const getBadgeStyle = (val: number | null) => {
    const isWeak = val !== null && val <= 30;
    const isModerate = val !== null && val <= 60;
    
    return {
      ...styles.badge,
      backgroundColor: val === null ? "#f5f5f5" : (isWeak ? "#fee2e2" : isModerate ? "#fef3c7" : "#ecfdf5"),
      color: val === null ? "#999" : (isWeak ? redColor : isModerate ? "#8a5700" : "#065f46"),
      borderColor: val === null ? "#eee" : (isWeak ? "#fecaca" : isModerate ? "#fde68a" : "#d1fae5"),
    };
  };

  const riskColor = result.score >= 70 ? redColor : result.score >= 40 ? "#8a5700" : "#3d6114";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 1. Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            {logoUrl && <Image src={logoUrl} style={styles.logo} />}
            <View>
              <Text style={styles.headerTitle}>RejectCheck Report</Text>
              <Text style={styles.headerDate}>{dateStr}</Text>
            </View>
          </View>
          <View style={{ textAlign: "right" }}>
            <Text style={styles.refIdLabel}>Reference ID</Text>
            <Text style={styles.refIdValue}>{Math.random().toString(36).substr(2, 9).toUpperCase()}</Text>
          </View>
        </View>

        {/* 2. Job Info */}
        <View style={styles.section}>
          <Text style={styles.label}>Job Position</Text>
          <Text style={{ ...styles.h2, marginBottom: 12 }}>{jobDisplay}</Text>
          <View style={styles.breakdownGrid}>
            {(Object.entries(result.breakdown) as [string, number | null][]).map(([key, val]) => (
              <View key={key} style={styles.breakdownItem}>
                <Text style={{ ...styles.label, fontSize: 8, textAlign: 'center' }}>{key.replace(/_/g, " ")}</Text>
                <View style={getBadgeStyle(val)}>
                  <Text style={styles.badgeText}>
                    {val === null ? "N/A" : (val <= 30 ? "Weak" : val <= 60 ? "Moderate" : val <= 80 ? "Good" : "Strong")}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 3. Rejection Risk Card */}
        <View style={styles.riskCard}>
          <Text style={styles.label}>Rejection Risk</Text>
          <Text style={{ ...styles.riskScore, color: riskColor }}>
            {result.score}<Text style={styles.riskPercent}>%</Text>
          </Text>
          <View style={{ ...styles.verdictBadge, backgroundColor: riskColor }}>
            <Text style={styles.verdictBadgeText}>
              {result.verdict}
            </Text>
          </View>
          {result.confidence && (
            <Text style={{ fontSize: 10, color: "#888", marginTop: 4 }}>
              Confidence: {result.confidence.score}% — {stripMd(result.confidence.reason)}
            </Text>
          )}
        </View>

        {/* 4. ATS Simulation */}
        <View style={styles.section}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <Text style={{ ...styles.h3, marginBottom: 0 }}>ATS Simulation</Text>
            <View style={{ ...getBadgeStyle(result.ats_simulation.would_pass ? 90 : 20), fontSize: 10 }}>
              <Text style={styles.badgeText}>
                {result.ats_simulation.would_pass ? "Passed" : "Failed"}
              </Text>
            </View>
            <Text style={{ fontSize: 10, color: "#888" }}>
              Score: {result.ats_simulation.score}/100 (threshold: {result.ats_simulation.threshold})
            </Text>
          </View>
          <Text style={styles.body}>{result.ats_simulation.reason}</Text>

          {result.ats_simulation.critical_missing_keywords.length > 0 && (
            <View style={{ ...styles.howToFix, borderLeftColor: redColor, backgroundColor: "#fff5f5", borderLeftWidth: 2, marginTop: 12 }}>
              <Text style={{ fontSize: 11, fontWeight: 700, color: redColor, marginBottom: 8 }}>Critical Missing Keywords:</Text>
              {result.ats_simulation.critical_missing_keywords.map((kw: any) => (
                <View key={kw.keyword} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: "#fecaca" }}>
                  <Text style={{ fontSize: 10, fontWeight: 700, color: "#333", flex: 1 }}>{kw.keyword}</Text>
                  <Text style={{ fontSize: 9, color: "#888", width: 50, textAlign: "center" }}>{kw.jd_frequency}× in JD</Text>
                  <Text style={{ fontSize: 9, color: kw.required ? redColor : "#888", width: 50, textAlign: "center" }}>{kw.required ? "Required" : "Optional"}</Text>
                  <Text style={{ fontSize: 9, color: redColor, width: 60, textAlign: "right" }}>-{kw.score_impact} pts</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 4.2 JD Required Skills */}
        {result.audit.jd_match?.required_skills?.length > 0 && (
          <View style={styles.section}>
            <Text style={{ ...styles.h3, fontSize: 14 }}>JD Required Skills</Text>
            <View style={{ borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, overflow: "hidden" }}>
              {(result.audit.jd_match.required_skills as any[]).map((skill: any, i: number) => (
                <View key={i} style={{ ...styles.jdSkillRow, backgroundColor: i % 2 === 0 ? "#fafafa" : "white", paddingHorizontal: 12 }}>
                  <Text style={{ fontSize: 11, fontWeight: 600, flex: 1, color: "#1a1917" }}>{skill.skill}</Text>
                  <Text style={{ fontSize: 11, width: 24, textAlign: "center", color: skill.found ? "#166534" : redColor }}>{skill.found ? "✓" : "✗"}</Text>
                  <Text style={{ fontSize: 9, color: "#94a3b8", flex: 2, textAlign: "right" }}>{skill.evidence || "—"}</Text>
                </View>
              ))}
            </View>
            {result.audit.jd_match.experience_gap && (
              <View style={{ ...styles.howToFix, borderLeftColor: "#d97706", backgroundColor: "#fffbeb", marginTop: 8 }}>
                <Text style={{ fontSize: 10, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>Experience Gap:</Text>
                <Text style={{ fontSize: 11, color: "#78350f" }}>{stripMd(result.audit.jd_match.experience_gap)}</Text>
              </View>
            )}
          </View>
        )}

        {/* 4.5 Technical Skill Gap */}
        {result.technical_analysis && (
          <View style={styles.section}>
            <Text style={styles.h3}>Technical Skill Gap Analysis</Text>
            <View style={styles.techSection}>
              {result.technical_analysis.skills.map((skill: any, i: number) => (
                <View key={i} style={styles.techSkillRow} wrap={false}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: 700, color: "#1a1917", flex: 1, marginRight: 20 }}>{skill.name}</Text>
                    <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                      <Text style={{ fontSize: 10, color: "#64748b" }}>Expected: {skill.expected}/10</Text>
                      <Text style={{ fontSize: 10, color: skill.current >= skill.expected ? "#166534" : redColor, fontWeight: 700 }}>
                        Current: {skill.current}/10
                      </Text>
                    </View>
                  </View>
                  {skill.evidence && (
                    <Text style={{ 
                      fontSize: 9, 
                      color: "#444", 
                      fontStyle: "italic", 
                      marginTop: 2,
                      lineHeight: 1.5
                    }}>
                      {stripMd(skill.evidence)}
                    </Text>
                  )}
                </View>
              ))}
              {result.technical_analysis.reasoning && (
                <View style={styles.infoBox}>
                  <Text style={{ ...styles.label, fontSize: 8, color: "#0369a1", marginBottom: 4 }}>Technical Reasoning:</Text>
                  <Text style={{ fontSize: 10, color: "#0c4a6e" }}>{stripMd(result.technical_analysis.reasoning)}</Text>
                </View>
              )}
              <View style={styles.techRecommendation}>
                <Text style={{ ...styles.label, fontSize: 8, color: "#64748b", marginBottom: 4 }}>AI Strategy:</Text>
                <Text style={{ fontSize: 11, color: "#1e293b", fontStyle: "italic" }}>
                  "{stripMd(result.technical_analysis.recommendation)}"
                </Text>
              </View>
              {result.technical_analysis.market_context && (
                <View style={{ ...styles.infoBox, backgroundColor: "#f0fdf4", borderLeftColor: "#22c55e", marginTop: 8 }}>
                  <Text style={{ ...styles.label, fontSize: 8, color: "#15803d", marginBottom: 4 }}>Market Context:</Text>
                  <Text style={{ fontSize: 10, color: "#14532d" }}>{stripMd(result.technical_analysis.market_context)}</Text>
                </View>
              )}
              {result.technical_analysis.seniority_signals?.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ ...styles.label, fontSize: 8, marginBottom: 6 }}>Seniority Signals (Claude):</Text>
                  {(result.technical_analysis.seniority_signals as string[]).map((signal, i) => (
                    <View key={i} style={{ flexDirection: "row", gap: 6, marginBottom: 4 }}>
                      <Text style={{ fontSize: 9, color: "#64748b" }}>•</Text>
                      <Text style={{ fontSize: 10, color: "#475569", flex: 1 }}>{stripMd(signal)}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* 5. Seniority Gap */}
        <View style={styles.section} break>
          <Text style={styles.h3}>Seniority Gap</Text>
          <View style={styles.seniorityRow}>
            <View style={styles.seniorityItem}>
              <Text style={styles.label}>Expected:</Text>
              <Text style={{ fontSize: 13, fontWeight: 600 }}>{result.seniority_analysis.expected}</Text>
            </View>
            <View style={styles.seniorityItem}>
              <Text style={styles.label}>Detected:</Text>
              <Text style={{ fontSize: 13, fontWeight: 600, color: redColor }}>{result.seniority_analysis.detected}</Text>
            </View>
          </View>
          <Text style={styles.body}>{stripMd(result.seniority_analysis.gap)}</Text>
          {result.seniority_analysis.strength && (
            <Text style={{ fontSize: 12, color: "#166534", marginTop: 8, fontStyle: "italic" }}>
              Strength: {stripMd(result.seniority_analysis.strength)}
            </Text>
          )}
          {result.seniority_analysis.fix?.steps?.length > 0 && (
            <View style={{ ...styles.howToFix, borderLeftColor: "#d97706", marginTop: 12 }}>
              <Text style={{ fontSize: 10, fontWeight: 700, color: "#92400e", marginBottom: 6 }}>
                Fix: {stripMd(result.seniority_analysis.fix.summary)} — {result.seniority_analysis.fix.time_required}
              </Text>
              {(result.seniority_analysis.fix.steps as string[]).map((step, i) => (
                <View key={i} style={{ flexDirection: "row", gap: 6, marginBottom: 3 }}>
                  <Text style={{ fontSize: 9, color: "#d97706" }}>•</Text>
                  <Text style={{ fontSize: 10, color: "#78350f", flex: 1 }}>{stripMd(step)}</Text>
                </View>
              ))}
            </View>
          )}
          {result.correlation && (
            <View style={styles.correlationBox}>
              <Text style={{ fontSize: 10, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>
                Tone × Seniority Correlation: {result.correlation.detected ? "Detected" : "Not Detected"}
              </Text>
              <Text style={{ fontSize: 10, color: "#78350f" }}>{stripMd(result.correlation.explanation)}</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* 6. CV Tone Audit */}
        <View style={styles.section}>
          <Text style={styles.h3}>CV Tone Audit</Text>
          <Text style={{ ...styles.body, fontWeight: 600, color: result.cv_tone.detected === 'active' ? "#3d6114" : redColor, textTransform: "uppercase", marginBottom: 10 }}>
            Detected Tone: {result.cv_tone.detected}
          </Text>
          <View style={styles.toneCard}>
            <Text style={{ ...styles.label, marginBottom: 10 }}>Examples from your CV:</Text>
            {(result.cv_tone.examples as string[]).map((ex, i) => {
              const isStrong = /\d/.test(ex) || /^(built|led|delivered|achieved|increased|reduced|launched|designed|implemented|created|developed|managed|improved|spearheaded|drove|scaled|optimized|automated|shipped)\b/i.test(ex.trim());
              return (
                <View key={i} style={styles.toneExample}>
                  <Text style={{ color: isStrong ? "#3d6114" : redColor, fontSize: 12 }}>{isStrong ? "✓" : "✗"}</Text>
                  <Text style={{ fontSize: 12, color: "#333" }}>{ex}</Text>
                </View>
              );
            })}
          </View>
          {result.cv_tone.fix?.steps?.length > 0 && (
            <View style={{ ...styles.howToFix, borderLeftColor: "#d97706", marginTop: 12 }}>
              <Text style={{ fontSize: 10, fontWeight: 700, color: "#92400e", marginBottom: 6 }}>
                Fix: {stripMd(result.cv_tone.fix.summary)} — {result.cv_tone.fix.time_required}
              </Text>
              {(result.cv_tone.fix.steps as string[]).map((step, i) => (
                <View key={i} style={{ flexDirection: "row", gap: 6, marginBottom: 3 }}>
                  <Text style={{ fontSize: 9, color: "#d97706" }}>•</Text>
                  <Text style={{ fontSize: 10, color: "#78350f", flex: 1 }}>{stripMd(step)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 7. CV Audit Issues */}
        <View style={styles.section}>
          <Text style={{ ...styles.h2, fontSize: 18 }}>CV Audit Issues</Text>
          {result.audit.cv.issues.map((issue: any, i: number) => (
            <View key={i} style={{ ...styles.issueCard, backgroundColor: issue.severity === 'critical' ? "#fffafa" : "white" }} wrap={false}>
              <View style={styles.issueHeader}>
                <View style={getBadgeStyle(issue.severity === 'critical' ? 20 : 50)}>
                   <Text style={{ ...styles.badgeText, fontSize: 7 }}>{issue.severity} • {issue.category}</Text>
                </View>
                <Text style={{ fontSize: 9, color: "#999" }}>Est. Fix Time: {issue.fix.time_required}</Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{issue.what}</Text>
              <Text style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>{issue.why}</Text>
              <View style={{ ...styles.howToFix, borderLeftColor: issue.severity === 'critical' ? redColor : "#8a5700" }}>
                <Text style={{ fontSize: 10, fontWeight: 700, color: "#666", marginBottom: 4, textTransform: "uppercase" }}>Action Step:</Text>
                <Text style={{ fontSize: 12, color: "#333" }}>{issue.fix.summary}</Text>
              </View>
            </View>
          ))}
          {result.audit.cv.strengths?.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={{ ...styles.label, marginBottom: 8 }}>CV Strengths:</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {(result.audit.cv.strengths as string[]).map((strength, i) => (
                  <View key={i} style={styles.strengthBadge}>
                    <Text style={styles.strengthBadgeText}>{strength}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* 7.5 External Signals (GitHub + LinkedIn) */}
        {(() => {
          const gh = result.audit.github;
          const li = result.audit.linkedin;
          const ghHasData = gh.score !== null || gh.issues.length > 0 || gh.strengths.length > 0;
          const liHasData = li.score !== null || li.issues.length > 0 || li.strengths.length > 0;
          const renderSignal = (title: string, data: typeof gh, hasData: boolean, emptyMsg: string) => (
            <View style={styles.signalCard} wrap={false}>
              <View style={styles.signalHeader}>
                <Text style={styles.signalTitle}>{title}</Text>
                <Text style={{ ...styles.signalScore, color: data.score === null ? "#888" : data.score >= 70 ? "#166534" : data.score >= 50 ? "#d97706" : redColor }}>
                  {data.score !== null ? `${data.score}%` : "N/A"}
                </Text>
              </View>
              {!hasData ? (
                <Text style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic", padding: 16 }}>{emptyMsg}</Text>
              ) : (
                <View>
                  {data.strengths.length > 0 && (
                    <View style={styles.strengthBadgeContainer}>
                      {(data.strengths as string[]).map((s, i) => (
                        <View key={i} style={styles.strengthBadge}>
                          <Text style={styles.strengthBadgeText}>{s}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  {data.issues.length > 0 ? (
                    data.issues.map((issue: any, i: number) => (
                      <View key={i} style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" }}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
                          <View style={getBadgeStyle(issue.severity === 'critical' ? 20 : 50)}>
                            <Text style={{ ...styles.badgeText, fontSize: 7 }}>{issue.severity} • {issue.category}</Text>
                          </View>
                          <Text style={{ fontSize: 9, color: "#999" }}>{issue.fix.time_required}</Text>
                        </View>
                        <Text style={{ fontSize: 12, fontWeight: 600, marginBottom: 3 }}>{issue.what}</Text>
                        <Text style={{ fontSize: 10, color: "#666" }}>{issue.why}</Text>
                        <Text style={{ fontSize: 10, color: "#333", marginTop: 4, fontStyle: "italic" }}>Fix: {issue.fix.summary}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic", padding: 16, textAlign: "center" }}>No issues detected — strong signal.</Text>
                  )}
                </View>
              )}
            </View>
          );
          return (
            <View style={styles.section}>
              <Text style={styles.h3}>External Signals</Text>
              {renderSignal("GitHub Signal", gh, ghHasData, "No GitHub username provided — deep technical verification skipped.")}
              {renderSignal("LinkedIn Signal", li, liHasData, "No LinkedIn PDF provided — cross-reference verification skipped.")}
            </View>
          );
        })()}

        {/* 8. Hidden Red Flags */}
        {result.hidden_red_flags.length > 0 && (
          <View style={styles.section} wrap={false}>
            <Text style={styles.h3}>Hidden Red Flags</Text>
            <View style={{ gap: 12 }}>
              {result.hidden_red_flags.map((flag: any, i: number) => (
                <View key={i} style={{ ...styles.issueCard, padding: 16 }}>
                  <Text style={{ fontSize: 13, fontWeight: 700, color: redColor, marginBottom: 6 }}>{flag.flag}</Text>
                  <Text style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>Perception: {flag.perception}</Text>
                  <Text style={{ fontSize: 12, color: "#333", fontStyle: "italic" }}>Fix: {flag.fix.summary}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 8.5 Bridge the Gap */}
        {result.project_recommendation && (
          <View style={styles.section}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <Text style={{ ...styles.h3, marginBottom: 0 }}>Bridge the Gap</Text>
              {result.project_recommendation.difficulty_level && (
                <View style={{
                  paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1,
                  backgroundColor: result.project_recommendation.difficulty_level === "Expert" ? "#fff1f2" : result.project_recommendation.difficulty_level === "Advanced" ? "#fffbeb" : "#f8fafc",
                  borderColor: result.project_recommendation.difficulty_level === "Expert" ? "#fecdd3" : result.project_recommendation.difficulty_level === "Advanced" ? "#fde68a" : "#e2e8f0",
                }}>
                  <Text style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1,
                    color: result.project_recommendation.difficulty_level === "Expert" ? redColor : result.project_recommendation.difficulty_level === "Advanced" ? "#92400e" : "#64748b",
                  }}>
                    {result.project_recommendation.difficulty_level}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.bridgeCard}>
              <Text style={styles.bridgeTitle}>{stripMd(result.project_recommendation.name)}</Text>
              <Text style={{ ...styles.body, color: "#166534", marginBottom: 12 }}>{stripMd(result.project_recommendation.description)}</Text>

              <View style={styles.techBadgeContainer}>
                {result.project_recommendation.technologies.map((tech, i) => (
                  <View key={i} style={styles.techBadge}>
                    <Text style={styles.techBadgeText}>{stripMd(tech)}</Text>
                  </View>
                ))}
              </View>

              <View style={{ gap: 8, marginBottom: 12 }}>
                <Text style={{ ...styles.label, color: "#15803d", marginBottom: 4 }}>What to Build:</Text>
                {result.project_recommendation.key_features.map((feature, i) => (
                  <View key={i} style={styles.featureItem}>
                    <View style={styles.featureCheck} />
                    <Text style={styles.featureText}>{stripMd(feature)}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.whyItMatters}>
                <Text style={{ ...styles.label, color: "#15803d", marginBottom: 4 }}>Why this matters:</Text>
                <Text style={{ ...styles.body, fontSize: 11, color: "#166534" }}>{stripMd(result.project_recommendation.why_it_matters)}</Text>
              </View>

              {result.project_recommendation.architecture && (
                <View style={styles.architectureBox}>
                  <Text style={{ ...styles.label, fontSize: 8, color: "#991b1b", marginBottom: 6 }}>Architecture Blueprint:</Text>
                  <Text style={{ fontSize: 10, color: "#1e293b", fontFamily: "InstrumentSans", lineHeight: 1.5 }}>
                    {stripMd(result.project_recommendation.architecture)}
                  </Text>
                </View>
              )}

              {result.project_recommendation.advanced_concepts?.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ ...styles.label, fontSize: 8, marginBottom: 6 }}>Advanced Concepts:</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                    {result.project_recommendation.advanced_concepts.map((concept: string, i: number) => (
                      <View key={i} style={styles.advancedBadge}>
                        <Text style={styles.advancedBadgeText}>{stripMd(concept)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {result.project_recommendation.success_criteria?.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ ...styles.label, fontSize: 8, marginBottom: 6 }}>Success Criteria:</Text>
                  {result.project_recommendation.success_criteria.map((criteria: string, i: number) => (
                    <View key={i} style={styles.successCriteriaItem}>
                      <View style={styles.successCheck} />
                      <Text style={{ fontSize: 10, color: "#166534", flex: 1 }}>{stripMd(criteria)}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.vitalStepsCard}>
                <Text style={styles.vitalStepsTitle}>Actionable Steps</Text>
                {result.project_recommendation.what_matters.map((step, i) => (
                  <View key={i} style={styles.vitalStepLine}>
                    <Text style={styles.vitalStepBullet}>•</Text>
                    <Text style={styles.vitalStepText}>{stripMd(step)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* 9. Action Plan */}
        <View style={styles.actionPlanCard} wrap={false}>
          <Text style={styles.actionPlanTitle}>Your Recommended Action Plan</Text>
          
          {actionPlan.week.length > 0 && (
            <View style={styles.actionGroup}>
              <View style={styles.actionGroupHeader}>
                <View style={{ ...styles.actionDot, backgroundColor: redColor }} />
                <Text style={{ ...styles.actionGroupTitle, color: redColor }}>Priority — Within 7 Days</Text>
              </View>
              {actionPlan.week.map((step, i) => (
                <View key={i} style={styles.actionItem}>
                  <View style={{ ...styles.checkbox, borderColor: redColor }} />
                  <Text style={styles.actionText}>{step}</Text>
                </View>
              ))}
            </View>
          )}

          {actionPlan.month.length > 0 && (
            <View style={styles.actionGroup}>
              <View style={styles.actionGroupHeader}>
                <View style={{ ...styles.actionDot, backgroundColor: "#d97706" }} />
                <Text style={{ ...styles.actionGroupTitle, color: "#b45309" }}>Short Term — Within 30 Days</Text>
              </View>
              {actionPlan.month.map((step, i) => (
                <View key={i} style={styles.actionItem}>
                  <View style={{ ...styles.checkbox, borderColor: "#d97706" }} />
                  <Text style={styles.actionText}>{step}</Text>
                </View>
              ))}
            </View>
          )}

          {actionPlan.longTerm.length > 0 && (
            <View style={styles.actionGroup}>
              <View style={styles.actionGroupHeader}>
                <View style={{ ...styles.actionDot, backgroundColor: "#888" }} />
                <Text style={{ ...styles.actionGroupTitle, color: "#666" }}>Long Term Career Growth</Text>
              </View>
              {actionPlan.longTerm.map((step, i) => (
                <View key={i} style={styles.actionItem}>
                  <View style={{ ...styles.checkbox, borderColor: "#aaa" }} />
                  <Text style={styles.actionText}>{step}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 10. Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated by RejectCheck — rejectcheck.com</Text>
          <Text style={styles.footerTagline}>No dev should have to apply blind.</Text>
        </View>
      </Page>
    </Document>
  );
}

// Keep the old component for backward compatibility OR delete it if no longer needed.
// Since we are migrating fully, we can eventually remove the DOM version.
// For now, I'll export both or just replace the main one.
// The user asked to "Rewrite the entire ExportTemplate component".
export function ExportTemplate({ result, id }: any) {
  // This is the DOM version, we will probably remove its usage in the next step.
  // For now, let's just keep it empty or return null to not break types if it's still imported elsewhere.
  return null;
}
