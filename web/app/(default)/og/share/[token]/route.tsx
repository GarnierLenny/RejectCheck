import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { bandFor } from "../../../../lib/cv-quality-score";
import { buildBenchmarkClaim, FAMILY_LABEL, AXIS_CLAIM_LABEL } from "../../../../lib/role-benchmark";

export const runtime = "edge";

const W = 1290, H = 630;
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

const fallback = (
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
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const origin = req.nextUrl.origin;
  const logoUrl = `${origin}/RejectCheck_500_bg_less.png`;

  let data: {
    result: Record<string, unknown>;
    jobLabel: string | null;
    company: string | null;
    profile: { displayName: string | null; avatarUrl: string | null } | null;
    cvTextFormatted: string | null;
  } | null = null;

  try {
    const res = await fetch(`${API_BASE}/api/share/${token}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) data = await res.json();
  } catch { /* fallback */ }

  if (!data?.result) {
    return new ImageResponse(fallback, { width: W, height: H });
  }

  const { result, jobLabel, company, profile, cvTextFormatted } = data;
  const isCvReview = !!(result as { cv_quality?: unknown }).cv_quality;
  const cvQ = (result as { cv_quality?: { overall: number } }).cv_quality;
  // vs-JD: display competitiveness (100 − stored rejection risk); CV audit: quality. Both higher = better.
  const score: number = isCvReview ? (cvQ?.overall ?? 0) : 100 - (result as { score: number }).score;
  const displayName = profile?.displayName ?? "Anonymous";
  const initials = displayName.slice(0, 2).toUpperCase();
  const avatarUrl = profile?.avatarUrl ?? null;
  const positionLabel = [jobLabel, company].filter(Boolean).join(" @ ");

  // Both scores are higher = better (green high, red low). Bands are PER METRIC
  // (single source: lib/cv-quality-score.ts) so the shared card's colour agrees
  // with the tier the report itself shows. They sit on different curves: at the
  // old flat 70/40 only 5% of CV audits could ever produce a green card, because
  // the deflated quality headline has never exceeded 75 in production.
  const scoreTier = bandFor(isCvReview ? "strength" : "competitiveness", score);
  const scoreColor =
    scoreTier === "strong" ? "#2D9B6F" : scoreTier === "decent" ? "#c47f00" : "#C93A39";

  // Comparative claim under the score. A bare number has no referent and reads
  // as self-promotion with no payoff; "top quartile, vs 118 engineering resumes"
  // is a citable flex. Same honest gate as the report: buildBenchmarkClaim
  // returns null unless the CV genuinely clears the corpus top quartile, so a
  // weak CV simply gets the number alone rather than an invented compliment.
  const pp = (result as { projected_profile?: { target_roles?: string[]; domains?: string[] } })
    .projected_profile;
  const claim =
    isCvReview && cvTextFormatted
      ? buildBenchmarkClaim(
          cvTextFormatted,
          [...(pp?.target_roles ?? []), ...(pp?.domains ?? [])],
          score,
        )
      : null;
  const claimText = claim
    ? `Top quartile on ${AXIS_CLAIM_LABEL[claim.axis].en}, vs ${claim.n} ${FAMILY_LABEL[claim.family]?.en ?? claim.family} resumes`
    : null;

  const skillRadar = (result as { skill_radar?: { axes: { score: number; label: string }[] } }).skill_radar;
  const techAnalysis = (result as { technical_analysis?: { skills: { current: number; expected: number; name: string }[] } }).technical_analysis;

  let radarCurrent: number[] = [];
  let radarExpected: number[] | null = null;
  let radarLabels: string[] = [];
  let radarMax = 100;

  if (isCvReview && (skillRadar?.axes?.length ?? 0) >= 3) {
    radarCurrent = skillRadar!.axes.map((ax) => ax.score);
    radarLabels = skillRadar!.axes.map((ax) => ax.label);
    radarMax = 100;
  } else if (!isCvReview && (techAnalysis?.skills?.length ?? 0) >= 3) {
    radarCurrent = techAnalysis!.skills.map((s) => s.current);
    radarExpected = techAnalysis!.skills.map((s) => s.expected);
    radarLabels = techAnalysis!.skills.map((s) => s.name);
    radarMax = 10;
  }

  const n = radarCurrent.length;
  const hasRadar = n >= 3;

  // Radar layout constants
  // Container: 560×400, SVG offset: left 70 top 20, SVG size: 400×400
  // viewBox -10 -10 280 280 → scale = 400/280 ≈ 1.429
  const SVG_OFFSET_X = 70, SVG_OFFSET_Y = 20;
  const SVG_SIZE = 400;
  const VIEW_TOTAL = 280;
  const radarScale = SVG_SIZE / VIEW_TOTAL;
  const LABEL_R = R + 18;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%",
          display: "flex", flexDirection: "column",
          justifyContent: "space-between",
          background: "#f7f5f2",
          padding: "44px 72px",
          fontFamily: "sans-serif",
          color: "#1a1917",
        }}
      >
        {/* Brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} width={44} height={44} style={{ objectFit: "contain" }} alt="" />
          <div style={{ fontFamily: "monospace", fontSize: 24, letterSpacing: "0.22em", textTransform: "uppercase", color: "#C93A39" }}>
            RejectCheck
          </div>
        </div>

        {/* Body */}
        <div style={{ display: "flex", alignItems: "center", gap: 60, flex: 1, marginTop: 24 }}>

          {/* Left */}
          <div style={{ display: "flex", flexDirection: "column", gap: 32, flex: 1 }}>

            {/* Avatar + name */}
            <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} width={112} height={112} style={{ borderRadius: 9999, objectFit: "cover" }} alt={displayName} />
              ) : (
                <div style={{ width: 112, height: 112, borderRadius: 9999, background: "#C93A3918", border: "2px solid #C93A3940", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontSize: 38, fontWeight: 700, color: "#C93A39" }}>
                  {initials}
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ fontSize: 38, fontWeight: 700 }}>{displayName}</div>
                {positionLabel && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <div style={{ fontFamily: "monospace", fontSize: 14, color: "#6b6860", letterSpacing: "0.16em", textTransform: "uppercase" }}>
                      {isCvReview ? "Profile" : "Targeting"}
                    </div>
                    <div style={{ fontFamily: "monospace", fontSize: 18, color: "#6b6860", letterSpacing: "0.04em" }}>{positionLabel}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Score */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 96, fontWeight: 700, lineHeight: 1, color: scoreColor }}>{`${score}`}</div>
              <div style={{ fontFamily: "monospace", fontSize: 22, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6b6860" }}>
                {isCvReview ? "CV Score" : "Competitiveness"}
              </div>
              {claimText && (
                <div style={{ fontSize: 18, fontWeight: 600, color: "#2D9B6F", maxWidth: 460, lineHeight: 1.35 }}>
                  {claimText}
                </div>
              )}
            </div>
          </div>

          {/* Radar — wide container so labels have room on every side */}
          {hasRadar && (
            <div style={{ display: "flex", position: "relative", width: 560, height: 400 }}>
              <svg
                style={{ position: "absolute", left: SVG_OFFSET_X, top: SVG_OFFSET_Y }}
                width={SVG_SIZE} height={SVG_SIZE}
                viewBox="-10 -10 280 280"
              >
                {[25, 50, 75, 100].map((pct) => (
                  <polygon key={pct} points={ringPoly(n, pct)} fill="none" stroke="#d4cfc9" strokeWidth="1" />
                ))}
                {radarCurrent.map((_, i) => {
                  const a = angle(i, n);
                  return <line key={i} x1={CX} y1={CY} x2={(CX + R * Math.cos(a)).toFixed(1)} y2={(CY + R * Math.sin(a)).toFixed(1)} stroke="#d4cfc9" strokeWidth="1" />;
                })}
                {radarExpected && (
                  <polygon points={poly(radarExpected, radarMax)} fill="#c47f0012" stroke="#c47f00" strokeWidth="1.5" strokeDasharray="4 3" />
                )}
                <polygon points={poly(radarCurrent, radarMax)} fill="#C93A3920" stroke="#C93A39" strokeWidth="2" />
                {radarCurrent.map((v, i) => {
                  const a = angle(i, n);
                  const r = (v / radarMax) * R;
                  return <circle key={i} cx={(CX + r * Math.cos(a)).toFixed(1)} cy={(CY + r * Math.sin(a)).toFixed(1)} r="4.5" fill="#C93A39" />;
                })}
              </svg>
              {radarLabels.map((label, i) => {
                const a = angle(i, n);
                // SVG coord → container pixel
                const px = SVG_OFFSET_X + (CX + LABEL_R * Math.cos(a) + 10) * radarScale;
                const py = SVG_OFFSET_Y + (CY + LABEL_R * Math.sin(a) + 10) * radarScale;
                const cosA = Math.cos(a);
                const sinA = Math.sin(a);
                const tx = cosA > 0.2 ? "0%" : cosA < -0.2 ? "-100%" : "-50%";
                const ty = sinA > 0.2 ? "0%" : sinA < -0.2 ? "-100%" : "-50%";
                const short = label;
                return (
                  <div
                    key={i}
                    style={{
                      position: "absolute",
                      left: px,
                      top: py,
                      transform: `translate(${tx}, ${ty})`,
                      fontSize: 17,
                      color: "#3d3b38",
                      fontFamily: "sans-serif",
                      whiteSpace: "nowrap",
                      display: "flex",
                      lineHeight: 1.2,
                    }}
                  >
                    {short}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #d4cfc9", paddingTop: 24 }}>
          <div style={{ fontFamily: "monospace", fontSize: 20, color: "#6b6860", letterSpacing: "0.08em" }}>rejectcheck.com</div>
          <div style={{ fontFamily: "monospace", fontSize: 17, color: "#a09d98", letterSpacing: "0.1em" }}>Free CV & application analysis</div>
        </div>
      </div>
    ),
    { width: W, height: H },
  );
}
