import type { AnalysisResult } from "../components/types";
import { pdf } from "@react-pdf/renderer";
import React from "react";
import { ExportTemplatePdf } from "../components/ExportTemplate";

/**
 * Generates a Markdown representation of the analysis result.
 * Optimized for Obsidian and Notion with strict GFM compliance.
 */
export function generateMarkdown(result: AnalysisResult): string {
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const jobTitle = (result as any).job_details?.title || result.seniority_analysis.expected || "Unknown Position";
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

  const b: string[] = [];

  // 1. YAML Frontmatter
  b.push(`---
type: RejectCheck Analysis
job: "${jobDisplay}"
date: ${new Date().toISOString().split('T')[0]}
score: ${result.score}
verdict: "${result.verdict}"
---`);

  // 2. Header & Abstract
  b.push(`# RejectCheck Analysis: ${jobDisplay}`);
  b.push(`> [!abstract] **Analysis Summary**
> - **Job:** ${jobDisplay}
> - **Date:** ${dateStr}
> - **Rejection Risk:** ${result.score}% — **${result.verdict}**`);

  // 3. Score Breakdown (Table)
  b.push(`## 📊 Score Breakdown`);
  const tableLines = [
    `| Dimension | Quality |`,
    `| -------------------- | ----------- |`,
    `| **Keyword Match** | ${getScoreLabel(result.breakdown.keyword_match)} |`,
    `| **Tech Stack Fit** | ${getScoreLabel(result.breakdown.tech_stack_fit)} |`,
    `| **Experience Level** | ${getScoreLabel(result.breakdown.experience_level)} |`
  ];
  if (result.breakdown.github_signal !== null) {
    tableLines.push(`| **GitHub Signal** | ${getScoreLabel(result.breakdown.github_signal)} |`);
  }
  if (result.breakdown.linkedin_signal !== null) {
    tableLines.push(`| **LinkedIn Signal** | ${getScoreLabel(result.breakdown.linkedin_signal)} |`);
  }
  b.push(tableLines.join('\n'));

  // 4. ATS Simulation
  b.push(`## 🤖 ATS Simulation`);
  b.push(`> [!${result.ats_simulation.would_pass ? 'success' : 'error'}] **Result: ${result.ats_simulation.would_pass ? "PASSED" : "FAILED"}**
> **Simulated Score:** ${result.ats_simulation.score}/100
> ${result.ats_simulation.reason}`);

  if (result.ats_simulation.critical_missing_keywords.length > 0) {
    b.push(`### 🔑 Missing Critical Keywords
${result.ats_simulation.critical_missing_keywords.map((kw: any) => `- ${kw.keyword} (${kw.jd_frequency}×)`).join('\n')}`);
  }

  // 5. Seniority Gap
  b.push(`## ⚖️ Seniority Gap
**Expected:** ${result.seniority_analysis.expected}
**Detected:** ${result.seniority_analysis.detected}`);

  b.push(`> [!quote] **Gap Analysis**
> ${result.seniority_analysis.gap}
> **Strength Identified:** ${result.seniority_analysis.strength}`);

  b.push(`**Immediate Fix:**
${result.seniority_analysis.fix.summary}`);

  // 6. CV Tone Audit
  b.push(`## 🎭 CV Tone Audit
**Detected Tone:** \`${result.cv_tone.detected.toUpperCase()}\`

**Examples from your CV:**
${(result.cv_tone.examples as string[]).map(ex => `- ${ex}`).join('\n')}`);

  // 7. Detailed Audit Issues
  if (result.audit.cv.issues.length > 0) {
    b.push(`## 🔍 Detailed Audit Issues`);
    const issuesMd = (result.audit.cv.issues as any[]).map(issue => {
      const type = issue.severity === 'critical' ? 'danger' : issue.severity === 'major' ? 'warning' : 'todo';
      const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'major' ? '🟠' : '🟡';
      return `### ${icon} [${String(issue.category).toUpperCase()}] ${issue.what}
> [!${type}] **${String(issue.severity).toUpperCase()}**
> **Why it matters:** ${issue.why}
> 
> **Action Step:** ${issue.fix.summary}
> **Est. Time:** ${issue.fix.time_required}`;
    }).join('\n\n');
    b.push(issuesMd);
  }

  // 8. Hidden Red Flags
  if (result.hidden_red_flags.length > 0) {
    b.push(`## 🚩 Hidden Red Flags`);
    const flagsMd = (result.hidden_red_flags as any[]).map(flag => `> [!danger] **${flag.flag}**
> **Recruiter Perception:** ${flag.perception}
> **Fix:** ${flag.fix.summary}`).join('\n\n');
    b.push(flagsMd);
  }

  // 9. Bridge the Gap (Project Recommendation)
  if (result.project_recommendation) {
    const project = result.project_recommendation;
    b.push(`## 🌉 Bridge the Gap
> [!todo] **Recommended Project: ${project.name}**
> ${project.description}
> 
> **Technologies:** ${project.technologies.join(", ")}
> 
> **Why it matters:** 
> ${project.why_it_matters}`);

    b.push(`### 🛠️ Key Features to Build
${project.key_features.map(f => `- ${f}`).join('\n')}`);

    b.push(`### 🚀 Vital Steps for Impact
${project.what_matters.map(s => `- ${s}`).join('\n')}`);
  }

  // 10. Your Action Plan
  if (actionPlan.week.length > 0 || actionPlan.month.length > 0 || actionPlan.longTerm.length > 0) {
    b.push(`## 🚀 Your Action Plan`);
    const planBlocks: string[] = [];
    if (actionPlan.week.length > 0) {
      planBlocks.push(`### 📅 Priority — This week\n${actionPlan.week.map(step => `- [ ] ${step}`).join('\n')}`);
    }
    if (actionPlan.month.length > 0) {
      planBlocks.push(`### 🗓️ Short Term — This month\n${actionPlan.month.map(step => `- [ ] ${step}`).join('\n')}`);
    }
    if (actionPlan.longTerm.length > 0) {
      planBlocks.push(`### 🔭 Long Term Growth\n${actionPlan.longTerm.map(step => `- [ ] ${step}`).join('\n')}`);
    }
    b.push(planBlocks.join('\n\n'));
  }

  // 10. Footer
  b.push(`---
*Generated by [RejectCheck](https://rejectcheck.com) — No dev should have to apply blind.*`);

  return b.map(s => s.trim()).join('\n\n');
}

function getScoreLabel(val: number | null): string {
  if (val === null) return "N/A";
  if (val <= 30) return "Weak";
  if (val <= 60) return "Moderate";
  if (val <= 80) return "Good";
  return "Strong";
}

/**
 * Triggers a browser download of a string content.
 */
export function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates a PDF using native @react-pdf/renderer.
 */
export async function generatePdf(result: AnalysisResult, filename: string) {
  try {
    const logoUrl = typeof window !== "undefined" ? window.location.origin + "/RejectCheck_500_bg_less.png" : "";
    const blob = await pdf(<ExportTemplatePdf result={result} logoUrl={logoUrl} />).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Native PDF generation failed:", error);
    throw error;
  }
}

/**
 * Generates export filenames based on job title and current date.
 */
export function getExportFilenames(result: AnalysisResult) {
  const jobTitle = (result as any).job_details?.title || result.seniority_analysis.expected || "analysis";
  const slug = jobTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const date = new Date().toISOString().split("T")[0];
  return {
    pdf: `rejectcheck-${slug}-${date}.pdf`,
    md: `rejectcheck-${slug}-${date}.md`,
  };
}
