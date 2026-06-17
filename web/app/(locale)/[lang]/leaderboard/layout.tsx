import type { Metadata } from 'next'

// App-internal route (and an intentionally-disabled feature): keep out of the index.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
