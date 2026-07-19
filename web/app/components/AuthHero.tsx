"use client";

import { useLanguage } from "@/context/language";

/**
 * Left panel of the auth split-screen (login / reset-password): a dark
 * "verdict hero" on engineering-drafting-paper grid. Shows a SAMPLE
 * rejection-risk verdict (tagged "exemple") so the product anchors the signup
 * moment. Purely presentational; copy comes from t.authHero. Hidden ≤900px
 * (see .rc-auth-panel in globals.css).
 */
export function AuthHero() {
  const { t } = useLanguage();
  const h = t.authHero;
  const signals = [
    { txt: h.signal1, delay: "d-sig1" },
    { txt: h.signal2, delay: "d-sig2" },
    { txt: h.signal3, delay: "d-sig3" },
  ];

  return (
    <section className="rc-auth-panel">
      {/* Blueprint crop-marks + edge tick-ruler — decorative, static */}
      <svg
        className="rc-auth-blueprint"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
        focusable="false"
      >
        <g stroke="rgba(247,245,242,.16)" strokeWidth="1.25" fill="none" shapeRendering="crispEdges">
          <path d="M40 28 V64 M28 40 H64" />
          <path d="M960 28 V64 M972 40 H936" />
          <path d="M40 972 V936 M28 960 H64" />
          <path d="M960 972 V936 M972 960 H936" />
        </g>
        <g stroke="rgba(247,245,242,.13)" strokeWidth="1" shapeRendering="crispEdges">
          {[160, 200, 240, 320, 360, 400, 480, 520, 560, 640, 680, 720, 800, 840].map((y) => (
            <line key={y} x1="22" y1={y} x2="30" y2={y} />
          ))}
          <line x1="22" y1="120" x2="22" y2="880" />
        </g>
        <g stroke="rgba(247,245,242,.2)" strokeWidth="1.25" shapeRendering="crispEdges">
          {[120, 280, 440, 600, 760, 880].map((y) => (
            <line key={y} x1="22" y1={y} x2="36" y2={y} />
          ))}
        </g>
      </svg>

      <div className="rc-auth-wordmark rc-auth-anim d-wordmark">
        <svg className="rc-auth-mark" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="1.5" y="1.5" width="21" height="21" rx="6" stroke="#f7f5f2" strokeWidth="1.5" opacity=".85" />
          <path d="M7 12.4l3.1 3.1L17 8.5" stroke="#C93A39" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="rc-auth-name">
          <span className="sec">§</span>
          {h.wordmark}
        </span>
      </div>

      <div className="rc-auth-hero">
        <p className="rc-auth-editorial rc-auth-anim d-editorial">
          «&nbsp;{h.editorialPre}
          <span className="glow">{h.editorialAccent}</span>
          {h.editorialPost}&nbsp;»
        </p>

        <article className="rc-auth-card rc-auth-anim d-card">
          <div className="rc-auth-card-top">
            <span className="rc-auth-card-label">{h.cardLabel}</span>
            <span className="rc-auth-tag-ex">{h.tagExample}</span>
          </div>

          <div className="rc-auth-verdict-row">
            <span className="rc-auth-pct">
              {h.verdict}
              <span className="sym">%</span>
            </span>
            <span className="rc-auth-pill">
              <span className="dot" />
              {h.pill}
            </span>
          </div>

          <div className="rc-auth-meter-wrap">
            <div className="rc-auth-meter">
              <div className="rc-auth-z g" />
              <div className="rc-auth-z a" />
              <div className="rc-auth-z r" />
              <div className="rc-auth-needle">
                <span className="stem" />
                <span className="tri" />
              </div>
            </div>
            <div className="rc-auth-zone-labels">
              <span className="zl-g">{h.zoneLow}</span>
              <span className="zl-a">{h.zoneMid}</span>
              <span className="zl-r">{h.zoneHigh}</span>
            </div>
            <div className="rc-auth-ticks">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>

          <div className="rc-auth-card-divider" />

          <div className="rc-auth-sig-head">{h.signalsHead}</div>
          <div className="rc-auth-signals">
            {signals.map((s) => (
              <div key={s.delay} className={`rc-auth-signal rc-auth-anim ${s.delay}`}>
                <span className="dash">-</span>
                <span>{s.txt}</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="rc-auth-footnote rc-auth-anim d-footnote">
        <span className="l">{h.footnoteLeft}</span>
        <span className="r">
          {h.footnoteRight.map((label, i) => (
            <span key={label} style={{ display: "contents" }}>
              {i > 0 && <span className="sep">/</span>}
              <span>{label}</span>
            </span>
          ))}
        </span>
      </div>
    </section>
  );
}
