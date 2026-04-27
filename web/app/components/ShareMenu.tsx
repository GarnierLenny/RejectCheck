"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, Check, Link as LinkIcon } from "lucide-react";
import { XIcon, LinkedinIcon } from "./SocialIcons";
import { Caption } from "./typography";
import { useLanguage } from "../../context/language";

type Props = {
  /** URL that will be shared (the destination unfurled by X/LinkedIn). */
  url: string;
  /** Pre-filled text for X (LinkedIn ignores text param — it reads OG tags from the URL). */
  text: string;
  size?: "sm" | "md";
};

export function ShareMenu({ url, text, size = "md" }: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [open]);

  function openX() {
    const intent = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(intent, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  function openLinkedIn() {
    const intent = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
    window.open(intent, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 1200);
  }

  const padding = size === "sm" ? "px-2.5 py-1" : "px-3 py-1.5";
  const fontSize = size === "sm" ? "text-[10px]" : "text-[11px]";
  const iconSize = size === "sm" ? 11 : 12;

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 ${padding} bg-rc-bg border border-rc-border rounded-md font-mono ${fontSize} uppercase tracking-[0.12em] text-rc-text hover:border-rc-red/40 transition-colors`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Share2 size={iconSize} />
        {t.share.title}
      </button>

      <div
        role="menu"
        aria-hidden={!open}
        className={`absolute right-0 mt-2 w-44 bg-rc-surface border border-rc-border rounded-lg shadow-lg overflow-hidden z-50 origin-top-right transition-all duration-150 ease-out ${
          open
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        }`}
      >
        <button
          type="button"
          onClick={openX}
          role="menuitem"
          className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-[12px] text-rc-text hover:bg-rc-bg"
        >
          <XIcon size={12} className="text-rc-muted" />
          {t.share.x}
        </button>
        <button
          type="button"
          onClick={openLinkedIn}
          role="menuitem"
          className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-[12px] text-rc-text hover:bg-rc-bg"
        >
          <LinkedinIcon size={12} className="text-rc-muted" />
          {t.share.linkedin}
        </button>
        <button
          type="button"
          onClick={copyLink}
          role="menuitem"
          className="w-full text-left flex items-center gap-2.5 px-3 py-2 text-[12px] text-rc-text hover:bg-rc-bg border-t border-rc-border"
        >
          {copied ? (
            <Check size={12} className="text-rc-green" />
          ) : (
            <LinkIcon size={12} className="text-rc-muted" />
          )}
          {copied ? t.share.copied : t.share.copyLink}
        </button>
      </div>

      {/* SR-only tooltip-equivalent */}
      <Caption className="sr-only">{text}</Caption>
    </div>
  );
}
