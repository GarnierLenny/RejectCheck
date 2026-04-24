import ReactMarkdown from "react-markdown";
import { type Issue, getSeverityStyles } from "./types";
import { FixBlock } from "./FixBlock";

const severityBorder: Record<string, string> = {
  critical: "border-l-[3px] border-l-rc-red",
  major:    "border-l-[3px] border-l-rc-amber",
  minor:    "border-l-[3px] border-l-rc-border",
};

export function IssueItem({ issue }: { issue: Issue }) {
  return (
    <div className={`p-6 border-b border-rc-border last:border-0 hover:bg-rc-surface-raised transition-colors ${severityBorder[issue.severity] ?? ''}`}>
      {/* Meta: severity + category - above title */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <span className={`text-[11px] uppercase font-mono px-2.5 py-0.5 border ${getSeverityStyles(issue.severity)}`}>
          {issue.severity}
        </span>
        <span className="text-rc-border">·</span>
        <span className="text-[11px] text-rc-hint uppercase tracking-widest font-mono">{issue.category}</span>
      </div>

      {/* Title */}
      <h4 className="text-[19px] font-semibold text-rc-text leading-snug prose-sm prose-invert max-w-none mb-3">
        <ReactMarkdown>{issue.what}</ReactMarkdown>
      </h4>

      {/* Divider */}
      <div className="h-px bg-rc-border/40 mb-4" />

      {/* Body */}
      <div className="text-[17px] text-rc-muted leading-[1.7] mb-5 prose-sm prose-invert max-w-none">
        <ReactMarkdown>{issue.why}</ReactMarkdown>
      </div>

      <FixBlock fix={issue.fix} />
    </div>
  );
}
