export function TechnicalAnalysisSkeleton() {
  return (
    <div
      className="space-y-6 animate-pulse"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="p-5 bg-rc-surface-raised border border-rc-border space-y-3">
        <div className="h-3 bg-rc-text/10 w-32" />
        <div className="h-4 bg-rc-text/5 w-full" />
        <div className="h-4 bg-rc-text/5 w-11/12" />
        <div className="h-4 bg-rc-text/5 w-10/12" />
      </div>

      <div className="space-y-3">
        <div className="h-3 bg-rc-text/10 w-40" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="p-4 bg-rc-surface-raised border border-rc-border flex items-center gap-4"
          >
            <div className="h-5 bg-rc-text/10 w-32" />
            <div className="flex-1 h-2 bg-rc-text/5" />
            <div className="h-5 w-12 bg-rc-text/10" />
          </div>
        ))}
      </div>

      <div className="p-5 bg-rc-surface-raised border border-rc-border space-y-3">
        <div className="h-3 bg-rc-text/10 w-36" />
        <div className="h-4 bg-rc-text/5 w-full" />
        <div className="h-4 bg-rc-text/5 w-10/12" />
      </div>
    </div>
  );
}
