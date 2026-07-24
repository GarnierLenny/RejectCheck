import React from "react";

/**
 * Stylized header band for a report section: a bold RejectCheck-red block with
 * light text, holding the section tag ("08 · BRIDGE"), the human title, an
 * optional subtitle, and an optional meta slot (e.g. a difficulty badge).
 * Replaces the old two-tier "mono line + SectionHeader" pair so a section
 * announces itself in one standout block.
 */
export function SectionBand({
  tag,
  title,
  subtitle,
  meta,
  className,
}: {
  tag: string;
  title: React.ReactNode;
  subtitle?: string;
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl px-7 py-6 flex items-start justify-between gap-4${className ? ` ${className}` : ""}`}
      style={{
        background: "linear-gradient(135deg, #d0413f 0%, var(--rc-red) 46%, #a82c2b 100%)",
        boxShadow: "0 8px 24px -8px var(--rc-red-glow)",
      }}
    >
      {/* Soft top-right sheen for depth */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(120% 130% at 100% 0%, rgba(255,255,255,0.16), transparent 55%)" }}
      />
      <div className="relative min-w-0">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.16em] font-bold flex items-center gap-2.5 mb-3"
          style={{ color: "rgba(255,255,255,0.75)" }}
        >
          <span className="w-[18px] h-px shrink-0" style={{ background: "rgba(255,255,255,0.6)" }} />
          {tag}
        </div>
        <h2 className="font-sans font-bold text-[23px] tracking-tight leading-tight text-white">
          {title}
        </h2>
        {subtitle && (
          <p className="text-[15px] mt-2 leading-relaxed max-w-[620px]" style={{ color: "rgba(255,255,255,0.85)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {meta && <div className="relative shrink-0 self-center">{meta}</div>}
    </div>
  );
}
