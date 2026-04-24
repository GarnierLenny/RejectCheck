import { ImageResponse } from 'next/og'
import { hasLocale } from './dictionaries'

export const alt = 'RejectCheck — CV rejection diagnosis'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const isEn = !hasLocale(lang) || lang === 'en'
  return [
    {
      id: 'main',
      alt: isEn
        ? 'RejectCheck — Find out why your CV got rejected'
        : 'RejectCheck — Comprends pourquoi ton CV a été rejeté',
      size,
      contentType,
    },
  ]
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const isFr = hasLocale(lang) && lang === 'fr'

  const headline = isFr
    ? "Comprends pourquoi ton CV a été rejeté"
    : 'Find out why your CV got rejected'
  const headlineAccent = isFr ? 'avant que ce soit le cas.' : 'before it does.'
  const subtitle = isFr
    ? 'Diagnostic IA dual (GPT-4o + Claude) : simulation ATS, radar des lacunes, audit GitHub & LinkedIn, entretien simulé IA — en moins de 60 secondes.'
    : 'Dual-AI CV diagnosis (GPT-4o + Claude): ATS simulation, skill gap radar, GitHub & LinkedIn audit, AI mock interview — in under 60 seconds.'
  const langTag = isFr ? 'FR · EN' : 'EN · FR'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#f7f5f2',
          padding: '64px 80px',
          fontFamily: 'sans-serif',
          color: '#1a1917',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 9999,
              background: '#C93A39',
            }}
          />
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 20,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#C93A39',
            }}
          >
            RejectCheck
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            maxWidth: 1000,
          }}
        >
          <div
            style={{
              fontSize: 68,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              color: '#1a1917',
            }}
          >
            {headline}
          </div>
          <div
            style={{
              fontSize: 68,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              color: '#C93A39',
              fontStyle: 'italic',
              fontFamily: 'Georgia, serif',
            }}
          >
            {headlineAccent}
          </div>
          <div
            style={{
              fontSize: 24,
              lineHeight: 1.45,
              color: '#3a3834',
              marginTop: 20,
            }}
          >
            {subtitle}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid #d4cfc9',
            paddingTop: 24,
          }}
        >
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 18,
              color: '#6b6860',
              letterSpacing: '0.08em',
            }}
          >
            rejectcheck.com/{lang}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 12,
              fontFamily: 'monospace',
              fontSize: 16,
              color: '#6b6860',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            <span>GPT-4o</span>
            <span style={{ color: '#d4cfc9' }}>·</span>
            <span>Claude</span>
            <span style={{ color: '#d4cfc9' }}>·</span>
            <span>{langTag}</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
