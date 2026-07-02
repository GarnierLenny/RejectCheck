import { hasLocale } from './dictionaries'
import { ogAlt, ogContentType, ogSize, renderOgImage } from '../../og-render'

export const alt = 'RejectCheck - CV rejection diagnosis'
export const size = ogSize
export const contentType = ogContentType

export async function generateImageMetadata({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const norm = hasLocale(lang) && lang === 'fr' ? 'fr' : 'en'
  return [{ id: 'main', alt: ogAlt(norm), size, contentType }]
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  const norm = hasLocale(lang) && lang === 'fr' ? 'fr' : 'en'
  return renderOgImage(norm)
}
