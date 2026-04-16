import ReactMarkdown from "react-markdown";
import { type Issue, getSeverityStyles } from "./types";
import { FixBlock } from "./FixBlock";

const severityBorder: Record<string, string> = {
  critical: "border-l-2 border-l-rc-red",
  major:    "border-l-2 border-l-rc-amber",
  minor:    "border-l-2 border-l-rc-border",
};

export function IssueItem({ issue }: { issue: Issue }) {
  return (
    <div className={`p-5 border-b border-rc-border last:border-0 hover:bg-rc-surface-raised transition-colors ${severityBorder[issue.severity] ?? ''}`}>
      <div className="flex items-start justify-between gap-4 mb-2.5">
        <div className="flex flex-col gap-1.5">
          <h4 className="text-[14px] font-medium text-rc-text leading-snug prose-sm prose-invert max-w-none">
            <ReactMarkdown>{issue.what}</ReactMarkdown>
          </h4>
          <div className="flex items-center gap-3">
            <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${getSeverityStyles(issue.severity)}`}>
              {issue.severity}
            </span>
            <span className="text-[10px] text-rc-hint uppercase tracking-widest font-mono italic">{issue.category}</span>
          </div>
        </div>
      </div>
      <div className="text-[13px] text-rc-muted leading-relaxed mb-4 prose-sm prose-invert max-w-none">
        <ReactMarkdown>{issue.why}</ReactMarkdown>
      </div>
      <FixBlock fix={issue.fix} />
    </div>
  );
}
