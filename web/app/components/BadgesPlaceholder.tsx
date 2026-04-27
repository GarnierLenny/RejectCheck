import { Heading, Caption } from "./typography";

type BadgeItem = { label: string; desc: string };

type Props = {
  title: string;
  comingSoonLabel: string;
  items: BadgeItem[];
};

export function BadgesPlaceholder({ title, comingSoonLabel, items }: Props) {
  return (
    <div className="bg-rc-surface border border-rc-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <Heading as="h3">{title}</Heading>
        <Caption className="font-mono text-[10px] uppercase tracking-[0.18em] text-rc-hint">
          {comingSoonLabel}
        </Caption>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((b) => (
          <div
            key={b.label}
            className="flex flex-col items-center text-center gap-2 p-3 bg-rc-bg border border-dashed border-rc-border rounded-md opacity-50"
          >
            <div className="w-10 h-10 rounded-full bg-rc-surface border border-rc-border" />
            <span className="font-mono text-[11px] text-rc-text">{b.label}</span>
            <Caption className="text-[10px] leading-tight">{b.desc}</Caption>
          </div>
        ))}
      </div>
    </div>
  );
}
