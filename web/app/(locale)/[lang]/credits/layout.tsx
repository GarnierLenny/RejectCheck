import type { Metadata } from 'next'

// App-internal route: keep out of the index (mirrors dashboard/account/settings).
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
