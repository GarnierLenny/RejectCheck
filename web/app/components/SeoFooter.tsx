import Link from 'next/link'
import Image from 'next/image'
import { getDictionary, type Locale } from '../[lang]/dictionaries'

export async function SeoFooter({ lang }: { lang: Locale }) {
  const dict = await getDictionary(lang)
  const f = dict.pricing.footer
  const base = `/${lang}`

  return (
    <footer className="border-t border-rc-border bg-white/50 backdrop-blur-sm relative z-10">
      <div className="max-w-[1200px] mx-auto py-12 px-5 md:px-[40px] flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex flex-col items-center md:items-start gap-4">
          <Image src="/RejectCheck_500_bg_less.png" alt="RejectCheck" width={32} height={32} />
          <div className="font-mono text-[12px] text-rc-hint">{f.copyright}</div>
        </div>
        <nav aria-label="Footer" className="flex gap-8 flex-wrap justify-center">
          <Link href={`${base}/analyze`} className="font-mono text-[11px] tracking-widest text-rc-muted no-underline hover:text-rc-red transition-colors uppercase">
            {dict.navbar.tryFree}
          </Link>
          <Link href={`${base}/pricing`} className="font-mono text-[11px] tracking-widest text-rc-muted no-underline hover:text-rc-red transition-colors uppercase">
            {dict.navbar.pricing}
          </Link>
          <Link href={`${base}/for-teams`} className="font-mono text-[11px] tracking-widest text-rc-muted no-underline hover:text-rc-red transition-colors uppercase">
            {f.forTeams}
          </Link>
          <Link href={`${base}/alternatives`} className="font-mono text-[11px] tracking-widest text-rc-muted no-underline hover:text-rc-red transition-colors uppercase">
            {f.alternatives}
          </Link>
          <Link href={`${base}/privacy`} className="font-mono text-[11px] tracking-widest text-rc-muted no-underline hover:text-rc-red transition-colors uppercase">
            {f.privacy}
          </Link>
          <a href="mailto:support@rejectcheck.com" className="font-mono text-[11px] tracking-widest text-rc-muted no-underline hover:text-rc-red transition-colors uppercase">
            {f.contact ?? 'Contact'}
          </a>
        </nav>
      </div>
    </footer>
  )
}
