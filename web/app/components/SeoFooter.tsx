import Link from 'next/link'
import Image from 'next/image'
import { getDictionary, type Locale } from '../(locale)/[lang]/dictionaries'
import { BlueprintBackdrop } from './BlueprintBackdrop'

export async function SeoFooter({ lang }: { lang: Locale }) {
  const dict = await getDictionary(lang)
  const f = dict.pricing.footer
  const base = `/${lang}`

  // SEO landings + guides — now bilingual, so cross-linked on both EN and FR
  // footers. This shared footer propagates internal links to the cluster across
  // every page that renders it (and feeds the new FR cluster its internal links).
  const seoLinks =
    lang === 'fr'
      ? [
          { href: `${base}/ats-checker`, label: 'Checker ATS' },
          { href: `${base}/resume-checker`, label: 'Checker de CV' },
          { href: `${base}/cv-review`, label: 'Revue de CV' },
          { href: `${base}/software-engineer-cv`, label: 'CV ingénieur logiciel' },
          { href: `${base}/guides`, label: 'Guides' },
        ]
      : [
          { href: `${base}/ats-checker`, label: 'ATS Checker' },
          { href: `${base}/resume-checker`, label: 'Resume Checker' },
          { href: `${base}/cv-review`, label: 'CV Review' },
          { href: `${base}/software-engineer-cv`, label: 'Software Engineer CV' },
          { href: `${base}/guides`, label: 'Guides' },
        ]

  const links: { href: string; label: string; external?: boolean }[] = [
    { href: `${base}/analyze`, label: dict.navbar.tryFree },
    { href: `${base}/pricing`, label: dict.navbar.pricing },
    { href: `${base}/for-teams`, label: f.forTeams },
    { href: `${base}/alternatives`, label: f.alternatives },
    ...seoLinks,
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
