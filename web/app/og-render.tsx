import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// Shared 1200×630 brand OG image, rendered by both the file-convention
// (app/opengraph-image.tsx, app/(locale)/[lang]/opengraph-image.tsx) and the
// stable route handler (app/og/route.tsx). Keeping the JSX in one place means
// the copy — and the content hash — never drift between the two.
//
// Design: "the verdict" — left headline, right a mock diagnosis card (score +
// red flags) so the share card shows the product and opens a curiosity gap
// ("what would MY score be?"). Headline is the share-card tagline picked in
// July 2026; it intentionally reads as a pair with the landing promise but is
// NOT the literal h1 (currently "Your last rejection.").

export const ogSize = { width: 1200, height: 630 }
export const ogContentType = 'image/png'

const BG = '#f0ebe2'
const TEXT = '#1a1612'
const TEXT_SOFT = '#6b6157'
const TEXT_MUTED = '#8a837a'
const RED = '#C93A39'
const BORDER = '#d8d1c7'
const BORDER_SOFT = '#e8e2d8'
const SCORE_DIM = '#c5bdb2'

export function ogAlt(lang: string): string {
  return lang === 'fr'
    ? 'RejectCheck — Rejeté ici. Recruté là-bas.'
    : 'RejectCheck — Get rejected here. Get hired out there.'
}

// Latin-subset woffs (~75KB total) — well under the 500KB ImageResponse
// bundle budget. process.cwd() is the Next.js project directory (web/).
let fontsPromise: Promise<Buffer[]> | null = null
function loadFonts() {
  fontsPromise ??= Promise.all(
    [
      'inter-latin-400-normal.woff',
      'inter-latin-700-normal.woff',
      'ibm-plex-mono-latin-500-normal.woff',
    ].map((f) => readFile(join(process.cwd(), 'assets/og-fonts', f))),
  )
  return fontsPromise
}

function FlagX() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20">
      <path d="M5 5 L15 15 M15 5 L5 15" stroke={RED} strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}

export async function renderOgImage(lang: string): Promise<ImageResponse> {
  const isFr = lang === 'fr'
  const [inter400, inter700, mono500] = await loadFonts()

  // FR lines are short; the EN "Get hired out there." needs a smaller size to
  // hold one line in the left column.
  const headlineSize = isFr ? 62 : 54

  const t = isFr
    ? {
        headlineDark: 'Rejeté ici.',
        headlineRed: 'Recruté là-bas.',
        sub: 'Diagnostic CV par IA — ATS, GitHub, LinkedIn — en une minute environ. Gratuit, sans inscription.',
        cardLabel: 'DIAGNOSTIC',
        cardRole: 'frontend · série B',
        badge: 'RISQUE ÉLEVÉ',
        flags: ['12 mots-clés ATS manquants', 'Ton passif dans 9 puces', 'GitHub contredit le CV'],
      }
    : {
        headlineDark: 'Get rejected here.',
        headlineRed: 'Get hired out there.',
        sub: 'Free AI CV diagnosis — ATS, GitHub, LinkedIn — in about a minute. No signup.',
        cardLabel: 'DIAGNOSIS',
        cardRole: 'frontend · series B',
        badge: 'HIGH RISK',
        flags: ['12 ATS keywords missing', 'Passive voice in 9 bullets', 'GitHub contradicts the CV'],
      }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundColor: BG,
          padding: '52px 64px',
          gap: 52,
          fontFamily: 'Inter',
          color: TEXT,
        }}
      >
        <div
          style={{
            flex: 1.12,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 13, height: 13, borderRadius: 999, backgroundColor: RED }} />
            <div
              style={{
                fontFamily: 'IBM Plex Mono',
                fontSize: 22,
                letterSpacing: '0.22em',
                color: RED,
              }}
            >
              REJECTCHECK
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: headlineSize,
                fontWeight: 700,
                lineHeight: 1.08,
                letterSpacing: '-0.02em',
                color: TEXT,
              }}
            >
              {t.headlineDark}
            </div>
            <div
              style={{
                fontSize: headlineSize,
                fontWeight: 700,
                lineHeight: 1.08,
                letterSpacing: '-0.02em',
                color: RED,
              }}
            >
              {t.headlineRed}
            </div>
            <div
              style={{
                fontSize: 24,
                lineHeight: 1.45,
                color: TEXT_SOFT,
                marginTop: 22,
                maxWidth: 520,
              }}
            >
              {t.sub}
            </div>
          </div>

          <div
            style={{
              fontFamily: 'IBM Plex Mono',
              fontSize: 21,
              letterSpacing: '0.08em',
              color: TEXT_MUTED,
            }}
          >
            rejectcheck.com
          </div>
        </div>

        <div style={{ flex: 0.88, display: 'flex', alignItems: 'center' }}>
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#ffffff',
              border: `2px solid ${BORDER}`,
              borderRadius: 20,
              padding: '30px 34px',
              transform: 'rotate(-2deg)',
              boxShadow: '0 16px 40px rgba(26,22,18,0.10)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div
                style={{
                  fontFamily: 'IBM Plex Mono',
                  fontSize: 17,
                  letterSpacing: '0.18em',
                  color: TEXT_MUTED,
                }}
              >
                {t.cardLabel}
              </div>
              <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 17, color: TEXT_MUTED }}>
                {t.cardRole}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, margin: '16px 0 18px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 62, color: RED }}>34</div>
                <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 30, color: SCORE_DIM }}>
                  /100
                </div>
              </div>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  backgroundColor: RED,
                  color: '#ffffff',
                  padding: '7px 16px',
                  borderRadius: 999,
                }}
              >
                {t.badge}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 13,
                borderTop: `2px solid ${BORDER_SOFT}`,
                paddingTop: 18,
              }}
            >
              {t.flags.map((flag) => (
                <div key={flag} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FlagX />
                  <div style={{ fontSize: 22, color: '#4a4540' }}>{flag}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: 'Inter', data: inter400, weight: 400, style: 'normal' },
        { name: 'Inter', data: inter700, weight: 700, style: 'normal' },
        { name: 'IBM Plex Mono', data: mono500, weight: 500, style: 'normal' },
      ],
    },
  )
}
