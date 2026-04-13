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
    marginBottom: 32,
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
  }
});

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
          </View>
          <Text style={styles.body}>{result.ats_simulation.reason}</Text>
          
          {result.ats_simulation.critical_missing_keywords.length > 0 && (
            <View style={{ ...styles.howToFix, borderLeftColor: redColor, backgroundColor: "#fff5f5", borderLeftWidth: 2 }}>
               <Text style={{ fontSize: 11, fontWeight: 700, color: redColor, marginBottom: 8 }}>Critical Missing Keywords:</Text>
               <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {result.ats_simulation.critical_missing_keywords.map((kw: any) => (
                    <Text key={kw.keyword} style={{ fontSize: 10, backgroundColor: "white", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, color: "#333" }}>
                      {kw.keyword} ({kw.jd_frequency}x)
                    </Text>
                  ))}
               </View>
            </View>
          )}
        </View>

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
          <Text style={styles.body}>{result.seniority_analysis.gap}</Text>
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
        </View>

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
          <View style={styles.section} wrap={false}>
            <Text style={styles.h3}>Bridge the Gap</Text>
            <View style={styles.bridgeCard}>
              <Text style={styles.bridgeTitle}>{result.project_recommendation.name}</Text>
              <Text style={{ ...styles.body, color: "#166534", marginBottom: 12 }}>{result.project_recommendation.description}</Text>
              
              <View style={styles.techBadgeContainer}>
                {result.project_recommendation.technologies.map((tech, i) => (
                  <View key={i} style={styles.techBadge}>
                    <Text style={styles.techBadgeText}>{tech}</Text>
                  </View>
                ))}
              </View>

              <View style={{ gap: 8 }}>
                <Text style={{ ...styles.label, color: "#15803d", marginBottom: 4 }}>Key Features to Build:</Text>
                {result.project_recommendation.key_features.map((feature, i) => (
                  <View key={i} style={styles.featureItem}>
                    <View style={styles.featureCheck} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.whyItMatters}>
                <Text style={{ ...styles.label, color: "#15803d", marginBottom: 4 }}>Why this matters:</Text>
                <Text style={{ ...styles.body, fontSize: 11, color: "#166534" }}>{result.project_recommendation.why_it_matters}</Text>
              </View>

              <View style={styles.vitalStepsCard}>
                <Text style={styles.vitalStepsTitle}>Vital Steps for Impact</Text>
                {result.project_recommendation.what_matters.map((step, i) => (
                  <View key={i} style={styles.vitalStepLine}>
                    <Text style={styles.vitalStepBullet}>•</Text>
                    <Text style={styles.vitalStepText}>{step}</Text>
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
