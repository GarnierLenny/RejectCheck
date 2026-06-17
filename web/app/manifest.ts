import type { MetadataRoute } from 'next'

// Next 16 native route: emitted at /manifest.webmanifest and auto-linked in <head>.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RejectCheck',
    short_name: 'RejectCheck',
    description:
      'Find out why your CV gets rejected, before they do. AI rejection-risk analysis: ATS simulation, red flags, and a fix-it plan in under 60 seconds.',
    start_url: '/en',
    display: 'standalone',
    background_color: '#f7f5f2',
    theme_color: '#C93A39',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      // Same padded mark doubles as maskable (it has a built-in safe-zone margin).
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
