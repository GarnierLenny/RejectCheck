import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const LOCALES = ['en', 'fr'] as const
type Locale = (typeof LOCALES)[number]
const DEFAULT_LOCALE: Locale = 'en'
const LOCALE_COOKIE = 'NEXT_LOCALE'

function getPreferredLocale(request: NextRequest): Locale {
  // 1. Respect cookie preference (set when user explicitly switches locale)
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value
  if (cookie === 'fr') return 'fr'
  if (cookie === 'en') return 'en'

  // 2. Fall back to Accept-Language
  const acceptLanguage = request.headers.get('accept-language') ?? ''
  for (const segment of acceptLanguage.split(',')) {
    const lang = segment.trim().split(';')[0].toLowerCase()
    if (lang.startsWith('fr')) return 'fr'
    if (lang.startsWith('en')) return 'en'
  }

  return DEFAULT_LOCALE
}

function hasLocalePrefix(pathname: string): boolean {
  return LOCALES.some(
    (locale) =>
      pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  )
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip internal Next.js paths, API routes, and locale-agnostic routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth/') ||
    pathname.includes('.') // static files (favicon.ico, images, etc.)
  ) {
    return NextResponse.next()
  }

  // Handle French URL alias /analyse → /fr/analyze
  if (pathname === '/analyse' || pathname.startsWith('/analyse/')) {
    const rest = pathname.slice('/analyse'.length)
    const url = request.nextUrl.clone()
    url.pathname = `/fr/analyze${rest}`
    const res = NextResponse.redirect(url, { status: 301 })
    res.cookies.set(LOCALE_COOKIE, 'fr', { path: '/', maxAge: 60 * 60 * 24 * 365 })
    return res
  }

  // If already has a locale prefix, pass through and set cookie
  if (hasLocalePrefix(pathname)) {
    const locale = pathname.split('/')[1] as Locale
    const res = NextResponse.next()
    res.cookies.set(LOCALE_COOKIE, locale, { path: '/', maxAge: 60 * 60 * 24 * 365 })
    return res
  }

  // Add locale prefix based on cookie / Accept-Language
  const locale = getPreferredLocale(request)
  const url = request.nextUrl.clone()
  url.pathname = `/${locale}${pathname}`
  const res = NextResponse.redirect(url)
  res.cookies.set(LOCALE_COOKIE, locale, { path: '/', maxAge: 60 * 60 * 24 * 365 })
  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
