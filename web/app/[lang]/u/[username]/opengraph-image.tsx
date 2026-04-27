import { ImageResponse } from "next/og";

export const alt = "RejectCheck · Public profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://api.rejectcheck.com";

type ProfileSummary = {
  username: string;
  displayName: string | null;
  challenges: {
    total: number;
    avgScore: number;
    bestScore: number;
    currentStreak: number;
    longestStreak: number;
  };
};

async function fetchSummary(username: string): Promise<ProfileSummary | null> {
  try {
    const res = await fetch(
      `${API_BASE}/api/u/${encodeURIComponent(username)}`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return null;
    return (await res.json()) as ProfileSummary;
  } catch {
    return null;
  }
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ lang: string; username: string }>;
}) {
  const { username } = await params;
  const profile = await fetchSummary(username.toLowerCase());

  const displayName = profile?.displayName ?? `@${profile?.username ?? username}`;
  const handle = profile?.username ?? username.toLowerCase();
  const total = profile?.challenges.total ?? 0;
  const streak = profile?.challenges.currentStreak ?? 0;
  const best = profile?.challenges.bestScore ?? 0;

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

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div
            style={{
              fontSize: 80,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
            }}
          >
            {displayName}
          </div>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: 26,
              color: "#6b6860",
              letterSpacing: "0.04em",
            }}
          >
            @{handle}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: 56,
            alignItems: "flex-end",
            justifyContent: "space-between",
            borderTop: "1px solid #d4cfc9",
            paddingTop: 28,
          }}
        >
          <div style={{ display: "flex", gap: 56 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 56, fontWeight: 700 }}>{total}</div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 14,
                  color: "#6b6860",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}
              >
                Challenges
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 56, fontWeight: 700, color: "#C93A39" }}>
                {streak}
              </div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 14,
                  color: "#6b6860",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}
              >
                Streak
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 56, fontWeight: 700 }}>{best}</div>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: 14,
                  color: "#6b6860",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}
              >
                Best score
              </div>
            </div>
          </div>
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
        </div>
      </div>
    ),
    { ...size },
  );
}
