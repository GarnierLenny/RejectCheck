import { ImageResponse } from 'next/og'

export const alt = 'RejectCheck — Find out why your CV got rejected'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OgImage() {
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
            gap: 4,
            maxWidth: 1000,
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              color: '#1a1917',
            }}
          >
            Find out why your CV got
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              color: '#C93A39',
              fontStyle: 'italic',
              fontFamily: 'Georgia, serif',
            }}
          >
            rejected.
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 26,
              lineHeight: 1.4,
              color: '#3a3834',
              marginTop: 20,
            }}
          >
            Dual-AI CV diagnosis: ATS simulation, skill gap radar, GitHub & LinkedIn audit, AI mock interview — in under 60 seconds.
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
            rejectcheck.com
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
            <span>EN / FR</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  )
}
