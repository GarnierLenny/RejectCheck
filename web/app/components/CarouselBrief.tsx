"use client";

import { useState } from "react";
import type { CarouselInsights } from "./types";

type Props = {
  insights?: CarouselInsights;
  /** Shared reports keep the brief visible but do not expose an authoring action. */
  readOnly?: boolean;
};

function scoreColor(score: number) {
  if (score >= 7) return "var(--rc-green)";
  if (score >= 5) return "var(--rc-amber)";
  return "var(--rc-red)";
}

function scoreLabel(score: number) {
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

function carouselText(insights: CarouselInsights) {
  const scorecard = insights.scorecard
    .map((item) => `- ${item.label}: ${scoreLabel(item.score)}/10. ${item.evidence}`)
    .join("\n");
  const fixes = [...insights.priority_fixes]
    .sort((a, b) => a.priority - b.priority)
    .map((item) => `${item.priority}. ${item.change}\n   Why: ${item.why_it_matters}`)
    .join("\n");
  const slides = [...insights.slides]
    .sort((a, b) => a.number - b.number)
    .map((slide) => `SLIDE ${slide.number} · ${slide.purpose.toUpperCase()}\n${slide.headline}\n${slide.body}`)
    .join("\n\n");

  return `${insights.hook}\n\nTHE AHA\n${insights.aha_moment.headline}\n${insights.aha_moment.evidence}\nRecruiter consequence: ${insights.aha_moment.recruiter_consequence}\n\nSCORECARD\n${scorecard}\n\nTOP FIXES\n${fixes}\n\nCAROUSEL SCRIPT\n${slides}`;
}

export function CarouselBrief({ insights, readOnly = false }: Props) {
  const [copied, setCopied] = useState(false);
  if (!insights) return null;

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(carouselText(insights));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard access can be blocked in embedded browsers. The brief remains
      // fully selectable, so failing the convenience action should be silent.
    }
  };

  return (
    <section
      style={{
        marginTop: 28,
        padding: "24px",
        border: "1px solid var(--rc-red-border)",
        borderRadius: 8,
        background: "linear-gradient(135deg, var(--rc-red-bg), var(--rc-surface) 58%)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--rc-red)", marginBottom: 8 }}>
            Carousel-ready recruiter brief
          </div>
          <h2 style={{ fontFamily: "var(--font-sans)", fontSize: "clamp(21px, 2.4vw, 30px)", lineHeight: 1.12, letterSpacing: "-0.025em", fontWeight: 600, color: "var(--rc-text)", margin: 0, maxWidth: 720 }}>
            {insights.hook}
          </h2>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={copy}
            style={{ flexShrink: 0, fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", border: "1px solid var(--rc-border)", background: "var(--rc-surface)", color: copied ? "var(--rc-green)" : "var(--rc-text)", borderRadius: 4, padding: "8px 10px", cursor: "pointer" }}
          >
            {copied ? "Copied" : "Copy script"}
          </button>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginBottom: 20 }}>
        {insights.scorecard.map((item) => {
          const color = scoreColor(item.score);
          return (
            <div key={item.label} style={{ padding: "12px", border: "1px solid var(--rc-border)", borderRadius: 5, background: "var(--rc-surface)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline", marginBottom: 7 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--rc-hint)" }}>{item.label}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 17, fontWeight: 700, letterSpacing: "-0.04em", color }}>{scoreLabel(item.score)}<span style={{ fontSize: 9, opacity: 0.65 }}>/10</span></span>
              </div>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, lineHeight: 1.45, color: "var(--rc-muted)", margin: 0 }}>{item.evidence}</p>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.15fr) minmax(220px, 0.85fr)", gap: 18, borderTop: "1px solid var(--rc-border)", paddingTop: 18 }} className="rc-carousel-brief-bottom">
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--rc-red)", marginBottom: 7 }}>The aha</div>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 16, lineHeight: 1.38, fontWeight: 600, color: "var(--rc-text)", margin: "0 0 7px" }}>{insights.aha_moment.headline}</p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.5, color: "var(--rc-muted)", margin: "0 0 8px" }}>{insights.aha_moment.evidence}</p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: 12, lineHeight: 1.5, color: "var(--rc-text)", margin: 0 }}><strong>Recruiter consequence:</strong> {insights.aha_moment.recruiter_consequence}</p>
        </div>
        <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 8 }}>
          {insights.priority_fixes
            .slice()
            .sort((a, b) => a.priority - b.priority)
            .map((fix) => (
              <li key={fix.priority} style={{ display: "grid", gridTemplateColumns: "20px 1fr", gap: 8 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: "var(--rc-red)" }}>{fix.priority}</span>
                <div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, lineHeight: 1.4, fontWeight: 600, color: "var(--rc-text)" }}>{fix.change}</div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, lineHeight: 1.45, color: "var(--rc-muted)", marginTop: 2 }}>{fix.why_it_matters}</div>
                </div>
              </li>
            ))}
        </ol>
      </div>
    </section>
  );
}
