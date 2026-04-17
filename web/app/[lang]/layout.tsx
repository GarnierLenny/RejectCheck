import { notFound } from 'next/navigation'
import { getDictionary, hasLocale } from './dictionaries'
import { LanguageProvider } from '../../context/language'

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'fr' }]
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params

  if (!hasLocale(lang)) notFound()

  const dict = await getDictionary(lang)

  return (
    <LanguageProvider dictionary={dict} locale={lang}>
      {children}
    </LanguageProvider>
  )
}
