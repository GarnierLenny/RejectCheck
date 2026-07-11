import { ogAlt, ogContentType, ogSize, renderOgImage } from './og-render'

// Delegates to the shared renderer so this card can never drift from the
// /og route and the [lang] file-convention image.
export const alt = ogAlt('en')
export const size = ogSize
export const contentType = ogContentType

export default async function OgImage() {
  return renderOgImage('en')
}
