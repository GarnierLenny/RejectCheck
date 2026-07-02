import type { NextRequest } from 'next/server'
import { renderOgImage } from '../og-render'

// Stable OG image endpoint. Unlike the `opengraph-image.tsx` file convention
// (whose URL Next content-hashes on every build), this route handler has a
// fixed URL — `/og?lang=fr` — so it can be referenced from generateMetadata
// and JSON-LD without 404ing after a rebuild.
export const runtime = 'nodejs'

export function GET(req: NextRequest) {
  const lang = req.nextUrl.searchParams.get('lang') === 'fr' ? 'fr' : 'en'
  return renderOgImage(lang)
}
