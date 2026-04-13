import type { components } from "../types/api";

export type AnalysisResult = components["schemas"]["AnalyzeResponseDto"];
export type Issue = AnalysisResult["audit"]["cv"]["issues"][number];
export type Fix = AnalysisResult["seniority_analysis"]["fix"];

export const getSeverityStyles = (severity: string) => {
  switch (severity) {
    case "critical": return "text-rc-red bg-rc-red/10 border-rc-red/20";
    case "major":    return "text-rc-amber bg-rc-amber/10 border-rc-amber/20";
    case "minor":    return "text-rc-muted bg-rc-muted/10 border-rc-muted/20";
    default:         return "text-rc-muted bg-rc-muted/5 border-rc-border";
  }
};
