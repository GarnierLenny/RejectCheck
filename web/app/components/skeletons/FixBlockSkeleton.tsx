export function FixBlockSkeleton() {
  return (
    <div
      className="mt-4 p-5 bg-rc-surface-raised border border-rc-border animate-pulse"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 bg-rc-text/10" />
        <div className="h-4 bg-rc-text/10 w-2/3" />
      </div>

      <div className="space-y-3 ml-7 mb-5">
        <div className="h-4 bg-rc-text/5 w-11/12" />
        <div className="h-4 bg-rc-text/5 w-10/12" />
        <div className="h-4 bg-rc-text/5 w-9/12" />
      </div>

      <div className="ml-7 pl-4 py-1 space-y-3">
        <div className="h-3 bg-rc-text/5 w-1/4" />
        <div className="h-4 bg-rc-text/5 w-10/12" />
        <div className="h-3 bg-rc-text/5 w-1/4" />
        <div className="h-4 bg-rc-text/5 w-9/12" />
      </div>

      <div className="mt-4 ml-7 inline-flex items-center gap-1.5 px-2.5 py-1 bg-rc-text/5">
        <div className="w-2.5 h-2.5 bg-rc-text/10 rounded-full" />
        <div className="h-3 w-20 bg-rc-text/10" />
      </div>
    </div>
  );
}
