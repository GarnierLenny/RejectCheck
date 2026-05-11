export function ProjectRecommendationSkeleton() {
  return (
    <div
      className="p-6 bg-rc-surface-raised border border-rc-border animate-pulse"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="h-6 bg-rc-text/10 w-2/3" />
        <div className="h-5 bg-rc-text/10 w-20" />
      </div>

      <div className="space-y-2 mb-6">
        <div className="h-4 bg-rc-text/5 w-full" />
        <div className="h-4 bg-rc-text/5 w-11/12" />
        <div className="h-4 bg-rc-text/5 w-10/12" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-6 w-20 bg-rc-text/10" />
        ))}
      </div>

      <div className="space-y-3 mb-6">
        <div className="h-3 bg-rc-text/10 w-32" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-4 bg-rc-text/5 w-10/12" />
        ))}
      </div>

      <div className="space-y-2">
        <div className="h-3 bg-rc-text/10 w-40" />
        <div className="h-4 bg-rc-text/5 w-full" />
        <div className="h-4 bg-rc-text/5 w-9/12" />
      </div>
    </div>
  );
}
