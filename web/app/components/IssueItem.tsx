import { type Issue, getSeverityStyles } from "./types";
import { FixBlock } from "./FixBlock";

export function IssueItem({ issue }: { issue: Issue }) {
  return (
    <div className="p-5 border-b-[0.5px] border-rc-border last:border-0 hover:bg-rc-text/[0.02] transition-colors">
      <div className="flex items-start justify-between gap-4 mb-2.5">
        <div className="flex flex-col gap-1.5">
          <h4 className="text-[14px] font-medium text-rc-text leading-snug">{issue.what}</h4>
          <div className="flex items-center gap-3">
            <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-[4px] border-[0.5px] ${getSeverityStyles(issue.severity)}`}>
              {issue.severity}
            </span>
            <span className="text-[10px] text-rc-hint uppercase tracking-widest font-mono italic">{issue.category}</span>
          </div>
        </div>
      </div>
      <p className="text-[13px] text-rc-muted leading-relaxed mb-4">{issue.why}</p>
      <FixBlock fix={issue.fix} />
    </div>
  );
}
