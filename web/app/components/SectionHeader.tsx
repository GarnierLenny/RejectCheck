type Props = {
  label?: string;
  labelColor?: string;
  title: React.ReactNode;
  subtitle?: string;
  meta?: React.ReactNode;
};

export function SectionHeader({ label, labelColor = "text-rc-hint", title, subtitle, meta }: Props) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          {label && (
            <span className={`font-mono text-[11px] uppercase tracking-[0.1em] block mb-1 ${labelColor}`}>
              {label}
            </span>
          )}
          <h2 className="font-sans font-bold text-[22px] text-rc-text tracking-tight leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[15px] text-rc-muted mt-1.5 leading-relaxed">{subtitle}</p>
          )}
        </div>
        {meta && <div className="shrink-0 mt-1">{meta}</div>}
      </div>
      <div className="h-px bg-rc-border mt-5" />
    </div>
  );
}
