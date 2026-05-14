"use client";

type Props = {
  label: string;
  pendingLabel: string;
  onClick: () => void;
  disabled: boolean;
  pending: boolean;
};

export function SubmitButton({ label, pendingLabel, onClick, disabled, pending }: Props) {
  return (
    <div className="flex items-center gap-3 flex-wrap justify-end">
      <span className="font-mono text-[10px] text-rc-hint border border-rc-border rounded-md px-1.5 py-0.5 bg-rc-surface-raised">
        ⌘ ↵
      </span>
      <button
        onClick={onClick}
        disabled={disabled}
        className="inline-flex items-center justify-center px-6 py-3 bg-rc-red text-white font-mono text-[11px] tracking-widest uppercase rounded-xl hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-rc-red/25 font-bold transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {pending ? pendingLabel : label}
      </button>
    </div>
  );
}
