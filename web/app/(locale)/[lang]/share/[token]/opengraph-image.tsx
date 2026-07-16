import { ImageResponse } from "next/og";

export const alt = "Analysis · RejectCheck";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.rejectcheck.com";

// ── Radar math ────────────────────────────────────────────────────────────────
const CX = 130, CY = 130, R = 100;

function angle(i: number, n: number) {
  return (2 * Math.PI * i) / n - Math.PI / 2;
}

function poly(values: number[], max: number): string {
  return values
    .map((v, i) => {
      const a = angle(i, values.length);
      const r = (v / max) * R;
      return `${(CX + r * Math.cos(a)).toFixed(1)},${(CY + r * Math.sin(a)).toFixed(1)}`;
    })
    .join(" ");
}

function ringPoly(n: number, pct: number): string {
  return Array.from({ length: n }, (_, i) => {
    const a = angle(i, n);
    const r = (pct / 100) * R;
    return `${(CX + r * Math.cos(a)).toFixed(1)},${(CY + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

// ── Fetch ─────────────────────────────────────────────────────────────────────
async function fetchShared(token: string) {
  try {
    const res = await fetch(`${API_BASE}/api/share/${token}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ── Image ─────────────────────────────────────────────────────────────────────
export default async function OgImage({
  params,
}: {
  params: Promise<{ lang: string; token: string }>;
}) {
  const { token } = await params;
  const data = await fetchShared(token);

  // Fallback card
  if (!data || !data.result) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%", height: "100%",
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "#f7f5f2", fontFamily: "monospace",
            color: "#C93A39", fontSize: 32, letterSpacing: "0.2em",
          }}
        >
          REJECTCHECK
        </div>
      ),
      { ...size },
    );
  }

  const { result, jobLabel, company, profile } = data;
  const isCvReview = !!result.cv_quality;

  const displayName: string = profile?.displayName ?? "Anonymous";
  const initials: string = displayName.slice(0, 2).toUpperCase();
  const avatarUrl: string | null = profile?.avatarUrl ?? null;
  const positionLabel: string = [jobLabel, company].filter(Boolean).join(" @ ");

  // vs-JD: competitiveness (100 − stored risk); CV audit: quality. Both higher = better.
  const score: number = isCvReview ? result.cv_quality.overall : 100 - result.score;
  const scoreColor: string = score >= 70 ? "#2D9B6F" : score >= 40 ? "#c47f00" : "#C93A39";

  // ── Radar data ───────────────────────────────────────────────────────────────
  let radarCurrent: number[] = [];
  let radarExpected: number[] | null = null;
  let radarMax = 100;

  if (isCvReview && result.skill_radar?.axes?.length >= 3) {
    radarCurrent = result.skill_radar.axes.map((ax: { score: number }) => ax.score);
    radarMax = 100;
  } else if (!isCvReview && result.technical_analysis?.skills?.length >= 3) {
    radarCurrent = result.technical_analysis.skills.map((s: { current: number }) => s.current);
    radarExpected = result.technical_analysis.skills.map((s: { expected: number }) => s.expected);
    radarMax = 10;
  }

  const n = radarCurrent.length;
  const hasRadar = n >= 3;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%",
          display: "flex", flexDirection: "column",
          justifyContent: "space-between",
          background: "#f7f5f2",
          padding: "56px 72px",
          fontFamily: "sans-serif",
          color: "#1a1917",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 8, height: 8, borderRadius: 9999, background: "#C93A39" }} />
          <div style={{
            fontFamily: "monospace", fontSize: 18,
            letterSpacing: "0.22em", textTransform: "uppercase", color: "#C93A39",
          }}>
            RejectCheck
          </div>
        </div>

        {/* Body */}
        <div style={{ display: "flex", alignItems: "center", gap: 80, flex: 1, marginTop: 40 }}>

          {/* Left: identity + score */}
          <div style={{ display: "flex", flexDirection: "column", gap: 28, flex: 1 }}>

            {/* Avatar + name */}
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  width={64} height={64}
                  style={{ borderRadius: 9999, objectFit: "cover" }}
                  alt={displayName}
                />
              ) : (
                <div style={{
                  width: 64, height: 64, borderRadius: 9999,
                  background: "#C93A3918", border: "2px solid #C93A3940",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "monospace", fontSize: 22, fontWeight: 700, color: "#C93A39",
                }}>
                  {initials}
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: "#1a1917" }}>
                  {displayName}
                </div>
                {positionLabel && (
                  <div style={{
                    fontFamily: "monospace", fontSize: 14,
                    color: "#6b6860", letterSpacing: "0.04em",
                  }}>
                    {positionLabel}
                  </div>
                )}
              </div>
            </div>

            {/* Score */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 1, color: scoreColor }}>
                {`${score}`}
              </div>
              <div style={{
                fontFamily: "monospace", fontSize: 16,
                letterSpacing: "0.18em", textTransform: "uppercase",
                color: "#6b6860",
              }}>
                {isCvReview ? "CV Score" : "Competitiveness"}
              </div>
            </div>

          </div>

          {/* Right: radar */}
          {hasRadar && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 300, height: 300 }}>
              <svg width="260" height="260" viewBox="-10 -10 280 280">
                {/* Rings */}
                {[25, 50, 75, 100].map((pct) => (
                  <polygon
                    key={pct}
                    points={ringPoly(n, pct)}
                    fill="none"
                    stroke="#d4cfc9"
                    strokeWidth="1"
                  />
                ))}
                {/* Spokes */}
                {radarCurrent.map((_, i) => {
                  const a = angle(i, n);
                  return (
                    <line
                      key={i}
                      x1={CX} y1={CY}
                      x2={(CX + R * Math.cos(a)).toFixed(1)}
                      y2={(CY + R * Math.sin(a)).toFixed(1)}
                      stroke="#d4cfc9"
                      strokeWidth="1"
                    />
                  );
                })}
                {/* Expected polygon */}
                {radarExpected && (
                  <polygon
                    points={poly(radarExpected, radarMax)}
                    fill="#c47f0012"
                    stroke="#c47f00"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />
                )}
                {/* Current polygon */}
                <polygon
                  points={poly(radarCurrent, radarMax)}
                  fill="#C93A3920"
                  stroke="#C93A39"
                  strokeWidth="2"
                />
                {/* Dots */}
                {radarCurrent.map((v, i) => {
                  const a = angle(i, n);
                  const r = (v / radarMax) * R;
                  return (
                    <circle
                      key={i}
                      cx={(CX + r * Math.cos(a)).toFixed(1)}
                      cy={(CY + r * Math.sin(a)).toFixed(1)}
                      r="4"
                      fill="#C93A39"
                    />
                  );
                })}
              </svg>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          borderTop: "1px solid #d4cfc9", paddingTop: 24,
        }}>
          <div style={{
            fontFamily: "monospace", fontSize: 16,
            color: "#6b6860", letterSpacing: "0.08em",
          }}>
            rejectcheck.com
          </div>
          <div style={{
            fontFamily: "monospace", fontSize: 14,
            color: "#a09d98", letterSpacing: "0.1em", textTransform: "uppercase",
          }}>
            Powered by Claude
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
