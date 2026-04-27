"use client";

import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Ban } from "lucide-react";
import { useBlock } from "../../lib/mutations";
import { useLanguage } from "../../context/language";

type Props = {
  username: string;
  /** Disabled when viewer is the profile owner. */
  disabled?: boolean;
};

export function ProfileActionsMenu({ username, disabled }: Props) {
  const { t } = useLanguage();
  const block = useBlock();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirming(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        setConfirming(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  if (disabled) return null;

  async function handleBlock() {
    await block.mutateAsync(username);
    setOpen(false);
    setConfirming(false);
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center w-8 h-8 bg-rc-bg border border-rc-border rounded-md hover:border-rc-red/40 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t.block.menuLabel}
      >
        <MoreHorizontal size={14} />
      </button>

      <div
        role="menu"
        aria-hidden={!open}
        className={`absolute right-0 mt-2 w-56 bg-rc-surface border border-rc-border rounded-lg shadow-lg overflow-hidden z-50 origin-top-right transition-all duration-150 ease-out ${
          open
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        }`}
      >
        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            role="menuitem"
            className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-[13px] text-rc-red hover:bg-rc-bg"
          >
            <Ban size={13} />
            {t.block.blockUser.replace("{user}", `@${username}`)}
          </button>
        ) : (
          <div className="p-3 flex flex-col gap-2 bg-rc-red/[0.03]">
            <p className="text-[12px] text-rc-text leading-snug">
              {t.block.confirmText.replace("{user}", `@${username}`)}
            </p>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={handleBlock}
                disabled={block.isPending}
                className="flex-1 px-2 py-1 bg-rc-red text-white font-mono text-[10px] uppercase tracking-wider rounded hover:bg-[#b83332] disabled:opacity-50 transition-colors"
              >
                {block.isPending ? t.block.blocking : t.block.confirmButton}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={block.isPending}
                className="px-2 py-1 bg-rc-bg border border-rc-border font-mono text-[10px] uppercase tracking-wider rounded hover:border-rc-red/40 disabled:opacity-50 transition-colors"
              >
                {t.block.cancel}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
