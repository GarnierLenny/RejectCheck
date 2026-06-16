import Link from 'next/link'
import { getDictionary, type Locale } from '../(locale)/[lang]/dictionaries'
import { BlueprintBackdrop } from './BlueprintBackdrop'

/**
 * Shared dark "closing" CTA band, placed above the SeoFooter on marketing pages.
 * Ink + blueprint grid + one editorial headline and a red CTA into /analyze.
 * Server component (mirrors SeoFooter) — pass the page's resolved `lang`.
 */
export async function BlueprintCta({ lang }: { lang: Locale }) {
  const dict = await getDictionary(lang)
  const c = dict.ctaBand

  return (
    <section className="rc-cta" aria-label={c.titlePre}>
      <BlueprintBackdrop variant="dark" bloom />
      <div className="rc-cta__inner">
        <p className="rc-cta__eyebrow">{c.eyebrow}</p>
        <h2 className="rc-cta__title">
          {c.titlePre} <span className="accent">{c.titleAccent}</span>
        </h2>
        <p className="rc-cta__sub">{c.subtitle}</p>
        <Link href={`/${lang}/analyze`} className="rc-cta__btn">
          {c.cta} <span className="arr">→</span>
        </Link>
        <p className="rc-cta__reassure">{c.reassurance}</p>
      </div>
    </section>
  )
}
