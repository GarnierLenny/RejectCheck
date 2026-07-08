import { ImageResponse } from 'next/og'

// Shared 1200×630 brand OG image, rendered by both the file-convention
// (app/(locale)/[lang]/opengraph-image.tsx) and the stable route handler
// (app/og/route.tsx). Keeping the JSX in one place means the copy — and the
// content hash — never drift between the two.

export const ogSize = { width: 1200, height: 630 }
export const ogContentType = 'image/png'

export function ogAlt(lang: string): string {
  return lang === 'fr' ? 'RejectCheck : Votre dernier refus.' : 'RejectCheck: Your last rejection.'
}

// Headline mirrors the live homepage h1 word-for-word (see app/(locale)/[lang]/page.tsx)
// so the share card never drifts from what people land on after clicking.
export function renderOgImage(lang: string): ImageResponse {
  const isFr = lang === 'fr'

  const lead = isFr ? 'Votre' : 'Your'
  const accent = isFr ? 'dernier refus.' : 'last rejection.'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          backgroundImage:
            'radial-gradient(ellipse 75% 55% at 50% 118%, rgba(201,58,57,0.28), rgba(201,58,57,0) 70%)',
          padding: '0 108px',
          fontFamily: 'sans-serif',
          color: '#1a1917',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 0, marginBottom: 32 }}>
          <div style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', color: '#1a1917' }}>
            Reject
          </div>
          <div
            style={{
              fontSize: 26,
              fontWeight: 500,
              fontStyle: 'italic',
              fontFamily: 'Georgia, serif',
              color: '#C93A39',
            }}
          >
            Check
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: 84,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
              color: '#1a1917',
            }}
          >
            {lead}
          </div>
          <div
            style={{
              fontSize: 84,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.02em',
              color: '#C93A39',
              fontStyle: 'italic',
              fontFamily: 'Georgia, serif',
            }}
          >
            {accent}
          </div>
        </div>
      </div>
    ),
    { ...ogSize },
  )
}
