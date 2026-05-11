export function AtsKeywordsSkeleton() {
  return (
    <div
      className="bg-rc-surface border border-rc-border overflow-hidden animate-pulse"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="p-6 border-b border-rc-border space-y-5">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-rc-text/10" />
          <div className="h-3 w-20 bg-rc-text/10" />
          <div className="h-3 w-32 bg-rc-text/5" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-5 h-5 bg-rc-text/10 shrink-0" />
              <div className="h-4 bg-rc-text/10 w-32 shrink-0" />
              <div className="flex-1 h-1.5 bg-rc-text/5" />
              <div className="h-3 w-12 bg-rc-text/10 shrink-0" />
            </div>
          ))}
        </div>
      </div>
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-rc-text/10" />
          <div className="h-3 w-24 bg-rc-text/10" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-5 h-5 bg-rc-text/10 shrink-0" />
              <div className="h-4 bg-rc-text/10 w-28 shrink-0" />
              <div className="flex-1 h-1.5 bg-rc-text/5" />
              <div className="h-3 w-12 bg-rc-text/10 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
