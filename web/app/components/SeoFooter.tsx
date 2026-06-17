import Link from 'next/link'
import Image from 'next/image'
import { getDictionary, type Locale } from '../(locale)/[lang]/dictionaries'
import { BlueprintBackdrop } from './BlueprintBackdrop'

export async function SeoFooter({ lang }: { lang: Locale }) {
  const dict = await getDictionary(lang)
  const f = dict.pricing.footer
  const base = `/${lang}`

  // EN-only SEO landings + guides (these routes notFound() under /fr, so only
  // link them on the English footer). Cross-linking them from this shared footer
  // propagates internal links across every page that renders SeoFooter.
  const enSeoLinks =
    lang === 'en'
      ? [
          { href: `${base}/ats-checker`, label: 'ATS Checker' },
          { href: `${base}/resume-checker`, label: 'Resume Checker' },
          { href: `${base}/cv-review`, label: 'CV Review' },
          { href: `${base}/software-engineer-cv`, label: 'Software Engineer CV' },
          { href: `${base}/guides`, label: 'Guides' },
        ]
      : []

  const links: { href: string; label: string; external?: boolean }[] = [
    { href: `${base}/analyze`, label: dict.navbar.tryFree },
    { href: `${base}/pricing`, label: dict.navbar.pricing },
    { href: `${base}/for-teams`, label: f.forTeams },
    { href: `${base}/alternatives`, label: f.alternatives },
    ...enSeoLinks,
    { href: `${base}/privacy`, label: f.privacy },
    { href: 'mailto:support@rejectcheck.com', label: f.contact ?? 'Contact', external: true },
  ]

  return (
    <footer className="rc-bp-footer">
      <BlueprintBackdrop variant="dark" bloom={false} />
      <div className="rc-bp-footer__inner">
        <div className="rc-bp-footer__brand">
          <Image src="/RejectCheck_500_bg_less.png" alt="RejectCheck" width={32} height={32} />
          <div className="rc-bp-footer__copy">{f.copyright}</div>
        </div>
        <nav aria-label="Footer" className="rc-bp-footer__nav">
          {links.map((l) =>
            l.external ? (
              <a key={l.href} href={l.href} className="rc-bp-footer__link">{l.label}</a>
            ) : (
              <Link key={l.href} href={l.href} className="rc-bp-footer__link">{l.label}</Link>
            )
          )}
        </nav>
      </div>
    </footer>
  )
}
