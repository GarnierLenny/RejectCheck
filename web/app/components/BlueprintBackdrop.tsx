/**
 * Reusable "engineering drafting-paper" grid — RejectCheck's signature backdrop
 * for its dark moments (and a light "drafting paper" variant). Drop it as the
 * first child of any `position: relative` container; it paints a faded
 * major/minor graph grid + corner crop-marks + an edge tick-ruler far behind
 * the content (z-index 0, pointer-events none). Purely decorative & static, so
 * it stays a server component. Use with discipline — dark surfaces and
 * deliberate brand moments only (hero / CTA band / footer), never on dense
 * result/dashboard/content screens. See .rc-bp* in globals.css.
 */
export function BlueprintBackdrop({
  variant = "dark",
  bloom = true,
  marks = true,
}: {
  variant?: "dark" | "light";
  /** soft red bloom + vignette behind the focal content */
  bloom?: boolean;
  /** corner crop-marks + left edge tick-ruler (the "technical calque" signal) */
  marks?: boolean;
}) {
  const stroke = variant === "dark" ? "rgba(247,245,242," : "rgba(26,25,23,";
  return (
    <div className={`rc-bp rc-bp--${variant}${bloom ? " rc-bp--bloom" : ""}`} aria-hidden="true">
      {marks && (
        <svg
          className="rc-bp__svg"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
          focusable="false"
        >
          <g stroke={`${stroke}.16)`} strokeWidth="1.25" fill="none" shapeRendering="crispEdges">
            <path d="M40 28 V64 M28 40 H64" />
            <path d="M960 28 V64 M972 40 H936" />
            <path d="M40 972 V936 M28 960 H64" />
            <path d="M960 972 V936 M972 960 H936" />
          </g>
          <g stroke={`${stroke}.12)`} strokeWidth="1" shapeRendering="crispEdges">
            <line x1="22" y1="120" x2="22" y2="880" />
            {[160, 200, 240, 320, 360, 400, 480, 520, 560, 640, 680, 720, 800, 840].map((y) => (
              <line key={y} x1="22" y1={y} x2="30" y2={y} />
            ))}
          </g>
          <g stroke={`${stroke}.2)`} strokeWidth="1.25" shapeRendering="crispEdges">
            {[120, 280, 440, 600, 760, 880].map((y) => (
              <line key={y} x1="22" y1={y} x2="36" y2={y} />
            ))}
          </g>
        </svg>
      )}
    </div>
  );
}
