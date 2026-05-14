import type { Metadata } from 'next'
import { DM_Sans, Chivo_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import Providers from '../providers'
import '../globals.css'

const dmSans = DM_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-sans',
})

const chivoMono = Chivo_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function DefaultRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${chivoMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Toaster position="top-center" expand={true} richColors />
        <Providers>{children}</Providers>
      </body>
      <Analytics />
    </html>
  )
}
