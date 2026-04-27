import { ImageResponse } from "next/og";

export const alt = "RejectCheck challenge score";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.rejectcheck.com";

type AttemptSummary = {
  user: { username: string; displayName: string | null };
  challenge: { title: string; focusTag: string; difficulty: string };
  score: number;
};

async function fetchSummary(
  username: string,
  challengeId: number,
): Promise<AttemptSummary | null> {
  try {
    const res = await fetch(
      `${API_BASE}/api/u/${encodeURIComponent(username)}/attempts/${challengeId}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return null;
    return (await res.json()) as AttemptSummary;
  } catch {
    return null;
  }
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ lang: string; username: string; challengeId: string }>;
}) {
  const { username, challengeId } = await params;
  const idNum = Number(challengeId);
  const summary = Number.isFinite(idNum)
    ? await fetchSummary(username.toLowerCase(), idNum)
    : null;

  const displayName =
    summary?.user.displayName ?? `@${summary?.user.username ?? username}`;
  const handle = summary?.user.username ?? username.toLowerCase();
  const challengeTitle = summary?.challenge.title ?? "RejectCheck challenge";
  const score = summary?.score ?? 0;
  const focusTag = summary?.challenge.focusTag ?? "";
  const difficulty = summary?.challenge.difficulty ?? "";

  const scoreColor =
    score >= 90 ? "#C93A39" : score >= 70 ? "#b8860b" : "#1a1917";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f7f5f2",
          padding: "64px 80px",
          fontFamily: "sans-serif",
          color: "#1a1917",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 9999,
              background: "#C93A39",
            }}
          />
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 20,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#C93A39",
            }}
          >
            RejectCheck
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 28,
              color: "#6b6860",
              fontFamily: "monospace",
              letterSpacing: "0.04em",
            }}
          >
            {displayName} ({`@${handle}`})
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              maxWidth: 1000,
              textAlign: "center",
            }}
          >
            {challengeTitle}
          </div>
          <div
            style={{
              display: "flex",
              gap: 16,
              fontFamily: "monospace",
              fontSize: 18,
              color: "#6b6860",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginTop: 8,
            }}
          >
            {difficulty && <span>{difficulty}</span>}
            {focusTag && <span style={{ color: "#d4cfc9" }}>·</span>}
            {focusTag && <span>{focusTag}</span>}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              marginTop: 20,
            }}
          >
            <span
              style={{
                fontSize: 140,
                fontWeight: 700,
                color: scoreColor,
                lineHeight: 1,
              }}
            >
              {score}
            </span>
            <span style={{ fontSize: 40, color: "#6b6860" }}>/100</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #d4cfc9",
            paddingTop: 24,
          }}
        >
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 18,
              color: "#6b6860",
              letterSpacing: "0.08em",
            }}
          >
            rejectcheck.com/u/{handle}
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 16,
              color: "#6b6860",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Try the challenge →
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
