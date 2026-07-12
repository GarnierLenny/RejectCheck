import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

// Shared 1200×630 brand OG image, rendered by both the file-convention
// (app/opengraph-image.tsx, app/(locale)/[lang]/opengraph-image.tsx) and the
// stable route handler (app/og/route.tsx). Keeping the JSX in one place means
// the copy, and the content hash, never drift between the two.
//
// Design: "the anatomy". Clinical white, the real R! logo, hairline leader
// lines from a schematic CV sheet to four mono findings (two flagged red),
// print-proof crosshairs in the corners. Headline mirrors the live homepage
// h1 so the card and the landing say the same thing.

export const ogSize = { width: 1200, height: 630 }
export const ogContentType = 'image/png'

const TEXT = '#1a1612'
const TEXT_SOFT = '#6b6157'
const TEXT_MUTED = '#8a837a'
const RED = '#C93A39'
const BORDER = '#d8d1c7'
const BAR = '#e8e2d8'
const BAR_FLAG = '#f3c9c9'
const HAIRLINE = '#c5bdb2'

export function ogAlt(lang: string): string {
  return lang === 'fr' ? 'RejectCheck : Votre dernier refus.' : 'RejectCheck: Your last rejection.'
}

// Latin-subset woffs (~75KB) + 128px logo (~8KB), read once per instance.
// process.cwd() is the Next.js project directory (web/).
let assetsPromise: Promise<{ fonts: Buffer[]; logo: string }> | null = null
function loadAssets() {
  assetsPromise ??= (async () => {
    const [inter400, inter700, mono500, logoPng] = await Promise.all([
      readFile(join(process.cwd(), 'assets/og-fonts', 'inter-latin-400-normal.woff')),
      readFile(join(process.cwd(), 'assets/og-fonts', 'inter-latin-700-normal.woff')),
      readFile(join(process.cwd(), 'assets/og-fonts', 'ibm-plex-mono-latin-500-normal.woff')),
      readFile(join(process.cwd(), 'assets', 'og-logo.png')),
    ])
    return {
      fonts: [inter400, inter700, mono500],
      logo: `data:image/png;base64,${logoPng.toString('base64')}`,
    }
  })()
  return assetsPromise
}

function Crosshair({ x, y }: { x: number; y: number }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      style={{ position: 'absolute', left: x, top: y }}
    >
      <path d="M10 0 V20 M0 10 H20" stroke={BORDER} strokeWidth="1.5" />
    </svg>
  )
}

function SheetBar({ width, flagged = false }: { width: string; flagged?: boolean }) {
  return (
    <div
      style={{
        height: 9,
        borderRadius: 4,
        width,
        backgroundColor: flagged ? BAR_FLAG : BAR,
      }}
    />
  )
}

export async function renderOgImage(lang: string): Promise<ImageResponse> {
  const isFr = lang === 'fr'
  const { fonts, logo } = await loadAssets()
  const [inter400, inter700, mono500] = fonts

  const t = isFr
    ? {
        headlineLead: 'Votre',
        headlineAccent: 'dernier refus.',
        sub: 'Diagnostic complet de votre CV face à une vraie offre. ATS, ton, séniorité, GitHub, LinkedIn. Une minute environ, gratuit.',
        sheetTitle: 'Développeur Frontend',
        sections: ['EXPÉRIENCE', 'COMPÉTENCES'],
        findings: [
          { label: 'PARSING ATS · OK', flagged: false },
          { label: 'MOTS-CLÉS · 12 MANQUANTS', flagged: true },
          { label: 'SÉNIORITÉ · SOUS-VENDUE', flagged: true },
          { label: 'GITHUB · RECOUPÉ', flagged: false },
        ],
      }
    : {
        headlineLead: 'Your',
        headlineAccent: 'last rejection.',
        sub: 'Full CV diagnosis against a real job. ATS, tone, seniority, GitHub, LinkedIn. About a minute, free.',
        sheetTitle: 'Frontend Developer',
        sections: ['EXPERIENCE', 'SKILLS'],
        findings: [
          { label: 'ATS PARSE · CLEAN', flagged: false },
          { label: 'KEYWORDS · 12 MISSING', flagged: true },
          { label: 'SENIORITY · UNDERSOLD', flagged: true },
          { label: 'GITHUB · CROSS-CHECKED', flagged: false },
        ],
      }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          backgroundColor: '#ffffff',
          padding: '54px 64px',
          gap: 48,
          fontFamily: 'Inter',
          color: TEXT,
        }}
      >
        <Crosshair x={20} y={20} />
        <Crosshair x={1160} y={20} />
        <Crosshair x={20} y={590} />
        <Crosshair x={1160} y={590} />

        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="" width={46} height={46} />
            <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, letterSpacing: '-0.02em' }}>
              <span style={{ color: TEXT }}>Reject</span>
              <span style={{ color: RED }}>Check</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                fontSize: 58,
                fontWeight: 700,
                lineHeight: 1.08,
                letterSpacing: '-0.02em',
                color: TEXT,
              }}
            >
              {t.headlineLead}
            </div>
            <div
              style={{
                fontSize: 58,
                fontWeight: 700,
                lineHeight: 1.08,
                letterSpacing: '-0.02em',
                color: RED,
              }}
            >
              {t.headlineAccent}
            </div>
            <div
              style={{
                fontSize: 22,
                lineHeight: 1.5,
                color: TEXT_SOFT,
                marginTop: 20,
                maxWidth: 470,
              }}
            >
              {t.sub}
            </div>
          </div>

          <div
            style={{
              fontFamily: 'IBM Plex Mono',
              fontSize: 20,
              letterSpacing: '0.08em',
              color: TEXT_MUTED,
            }}
          >
            rejectcheck.com
          </div>
        </div>

        <div style={{ flex: 1.08, display: 'flex', alignItems: 'center', gap: 22 }}>
          <div
            style={{
              width: '44%',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              backgroundColor: '#ffffff',
              border: `1.5px solid ${BORDER}`,
              borderRadius: 6,
              padding: '26px 24px',
            }}
          >
            <div style={{ fontSize: 17, fontWeight: 700, color: TEXT, letterSpacing: '0.01em' }}>
              ALEX MARTIN
            </div>
            <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: -6, marginBottom: 4 }}>
              {t.sheetTitle}
            </div>
            <div
              style={{
                fontFamily: 'IBM Plex Mono',
                fontSize: 11,
                letterSpacing: '0.16em',
                color: TEXT_MUTED,
              }}
            >
              {t.sections[0]}
            </div>
            <SheetBar width="94%" />
            <SheetBar width="84%" flagged />
            <SheetBar width="90%" />
            <SheetBar width="42%" />
            <SheetBar width="80%" />
            <SheetBar width="72%" flagged />
            <div
              style={{
                fontFamily: 'IBM Plex Mono',
                fontSize: 11,
                letterSpacing: '0.16em',
                color: TEXT_MUTED,
                marginTop: 6,
              }}
            >
              {t.sections[1]}
            </div>
            <SheetBar width="64%" />
            <SheetBar width="48%" />
          </div>

          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 42,
            }}
          >
            {t.findings.map((f) => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    flex: 1,
                    height: 2,
                    backgroundColor: f.flagged ? RED : HAIRLINE,
                  }}
                />
                <div
                  style={{
                    fontFamily: 'IBM Plex Mono',
                    fontSize: 15,
                    letterSpacing: '0.06em',
                    color: f.flagged ? RED : '#4a4540',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {f.label}
                </div>
              </div>
            ))}
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
