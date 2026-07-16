"use client";

import { useState, useEffect } from "react";
import { X, Link, Check, Download, ImageIcon } from "lucide-react";
import posthog from "posthog-js";
import { useLanguage } from "../../context/language";

type Props = {
  token: string;
  shareUrl: string;
  displayName: string;
  isCvReview: boolean;
  score: number;
  jobLabel: string | null;
  company: string | null;
  onClose: () => void;
};

export function ShareModal({
  token,
  shareUrl,
  displayName,
  isCvReview,
  score,
  jobLabel,
  company,
  onClose,
}: Props) {
  const { t, locale } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);
  const [liState, setLiState] = useState<"idle" | "copying" | "ready">("idle");
  const [xState, setXState] = useState<"idle" | "copying" | "ready">("idle");

  const cardUrl = `/og/share/${token}`;
  const positionLabel = [jobLabel, company].filter(Boolean).join(" @ ");

  const mode = isCvReview ? "cv-review" : "vs-job";

  async function handleCopy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    posthog.capture("share_copy_link", { token, mode });
  }

  function handleDownload() {
    const a = document.createElement("a");
    a.href = cardUrl;
    a.download = `rejectcheck-${token.slice(0, 8)}.png`;
    a.click();
    posthog.capture("share_download_card", { token, mode });
  }

  const xText = encodeURIComponent(
    isCvReview
      ? `${displayName} has a CV score of ${score} on RejectCheck`
      : `${displayName} scored ${score} competitiveness${positionLabel ? ` for ${positionLabel}` : ""} on RejectCheck`
  );
  const xUrl = `https://twitter.com/intent/tweet?text=${xText}&url=${encodeURIComponent(shareUrl)}`;
  const liUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  const clipboardSupported = typeof ClipboardItem !== "undefined";
  const nativeShareSupported = typeof navigator !== "undefined" && !!navigator.share;

  async function handleNativeShare() {
    try {
      const res = await fetch(cardUrl);
      const blob = await res.blob();
      const file = new File([blob], `rejectcheck-${token.slice(0, 8)}.png`, { type: "image/png" });
      const shareData = { title: isCvReview ? `${displayName}'s CV Score` : `${displayName}'s competitiveness`, url: shareUrl, files: [file] };
      if (navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.share({ title: shareData.title, url: shareUrl });
      }
      posthog.capture("share_native", { token, mode });
    } catch { /* user cancelled or unsupported */ }
  }

  async function handleX() {
    setXState("copying");
    let clipboardOk = false;
    try {
      const res = await fetch(cardUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      clipboardOk = true;
      setXState("ready");
      setTimeout(() => {
        window.open(xUrl, "_blank", "noopener,noreferrer");
        setXState("idle");
      }, 2000);
    } catch {
      window.open(xUrl, "_blank", "noopener,noreferrer");
      setXState("idle");
    }
    posthog.capture("share_click_x", { token, mode, clipboard_ok: clipboardOk });
  }

  async function handleLinkedIn() {
    setLiState("copying");
    let clipboardOk = false;
    try {
      const res = await fetch(cardUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      clipboardOk = true;
      setLiState("ready");
      setTimeout(() => {
        window.open(liUrl, "_blank", "noopener,noreferrer");
        setLiState("idle");
      }, 2000);
    } catch {
      window.open(liUrl, "_blank", "noopener,noreferrer");
      setLiState("idle");
    }
    posthog.capture("share_click_linkedin", { token, mode, clipboard_ok: clipboardOk });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className={`absolute inset-0 backdrop-blur-sm transition-all duration-[400ms] ${visible ? "bg-black/50" : "bg-black/0"}`} onClick={onClose} />

      {/* Modal */}
      <div className={`relative z-10 bg-rc-surface w-full max-w-[680px] shadow-2xl overflow-hidden border border-rc-border transition-all duration-[400ms] transform ${visible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-8 scale-95"}`}>

        {/* Header */}
        <div className="px-8 pt-7 pb-6 border-b border-rc-border bg-rc-surface-hero flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <p className="font-mono text-[11px] font-semibold tracking-[0.18em] uppercase text-rc-red">
              {isCvReview ? "Share · CV Review" : "Share · Analysis"}
            </p>
            <p className="text-[26px] font-bold text-rc-text leading-tight">{t.share.modalHeadline}</p>
            <p className="text-[13px] text-rc-hint">{t.share.modalSub}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-9 h-9 flex items-center justify-center border border-rc-border text-rc-muted hover:text-rc-text hover:bg-rc-bg transition-colors mt-0.5"
          >
            <X size={16} />
          </button>
        </div>

        {/* Card preview */}
        <div className="px-8 pt-6">
          <div className="border border-rc-border overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cardUrl}
              alt="Share card preview"
              className="w-full block"
              style={{ aspectRatio: "1290/630" }}
            />
          </div>
        </div>

        {/* Copy link */}
        <div className="px-8 pt-5 pb-1">
          <div className="flex items-center border border-rc-border bg-rc-bg">
            <div className="pl-4 pr-3 text-rc-muted shrink-0">
              <Link size={14} />
            </div>
            <span className="flex-1 font-mono text-[11px] text-rc-muted truncate py-3">{shareUrl}</span>
            <button
              onClick={handleCopy}
              className={`shrink-0 flex items-center gap-2 px-5 py-3 border-l border-rc-border font-mono text-[11px] uppercase tracking-wider transition-colors ${copied ? "text-rc-green bg-rc-bg" : "text-rc-text hover:bg-rc-surface"}`}
            >
              {copied ? <Check size={13} /> : null}
              {copied ? t.share.copied : t.share.copyLink}
            </button>
          </div>
        </div>

        {/* X clipboard toast */}
        {xState === "ready" && (
          <div className="mx-8 mb-0 mt-4 flex items-center gap-3 px-4 py-3 bg-[#0f0f0f]/10 border border-[#0f0f0f]/20 text-rc-text">
            <Check size={14} className="shrink-0" />
            <p className="font-mono text-[11px]">
              Image copied — X opens in 2s, paste with <strong>Ctrl+V</strong> (or <strong>⌘V</strong>)
            </p>
          </div>
        )}

        {/* LinkedIn clipboard toast */}
        {liState === "ready" && (
          <div className="mx-8 mb-0 mt-4 flex items-center gap-3 px-4 py-3 bg-[#0A66C2]/10 border border-[#0A66C2]/30 text-[#0A66C2]">
            <Check size={14} className="shrink-0" />
            <p className="font-mono text-[11px]">
              Image copied — LinkedIn opens in 2s, paste with <strong>Ctrl+V</strong> (or <strong>⌘V</strong>)
            </p>
          </div>
        )}

        {/* Action buttons */}
        {/* Native share — mobile only */}
        {nativeShareSupported && (
          <div className="px-8 pt-4 pb-0">
            <button
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rc-red hover:bg-rc-red/90 text-white font-mono text-[11px] font-semibold uppercase tracking-wider transition-colors"
            >
              Share
            </button>
          </div>
        )}

        <div className="px-8 py-5 flex gap-3">

          {/* Download */}
          <button
            onClick={handleDownload}
            className="flex-1 flex flex-col items-center justify-center gap-1 px-4 py-3.5 border border-rc-border bg-rc-bg hover:bg-rc-surface transition-colors"
          >
            <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-rc-text">
              <Download size={13} />
              {t.share.downloadCard}
            </div>
            <div className="font-mono text-[10px] text-rc-hint">PNG · 1290×630</div>
          </button>

          {/* X */}
          <button
            onClick={handleX}
            disabled={xState === "copying"}
            className="flex-1 flex flex-col items-center justify-center gap-1 px-4 py-3.5 bg-[#0f0f0f] hover:bg-[#1a1a1a] disabled:opacity-70 transition-colors"
          >
            <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-white">
              <span className="text-[14px] leading-none">𝕏</span>
              {xState === "copying" ? "Preparing…" : "Post on X"}
            </div>
            <div className="font-mono text-[10px] text-white/50">
              {clipboardSupported ? "@rejectcheck" : "Download & attach manually"}
            </div>
          </button>

          {/* LinkedIn */}
          <button
            onClick={handleLinkedIn}
            disabled={liState === "copying"}
            className="flex-1 flex flex-col items-center justify-center gap-1 px-4 py-3.5 bg-[#0A66C2] hover:bg-[#0958a8] disabled:opacity-70 transition-colors"
          >
            <div className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-white">
              {liState === "ready" ? <ImageIcon size={13} /> : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              )}
              {liState === "copying" ? "Preparing…" : "Share on LinkedIn"}
            </div>
            <div className="font-mono text-[10px] text-white/60">
              {liState === "ready" ? "Image copied — paste in post" : clipboardSupported ? "Public post" : "Download & attach manually"}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
