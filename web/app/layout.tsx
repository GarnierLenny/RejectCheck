import type { Metadata } from "next";
import { DM_Sans, Chivo_Mono } from 'next/font/google';
import "./globals.css";
import Providers from "./providers";
import { Analytics } from "@vercel/analytics/next"
import { JsonLd, organizationSchema, websiteSchema } from "./components/JsonLd";

const dmSans = DM_Sans({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-sans',
});

const chivoMono = Chivo_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rejectcheck.com"),
  title: "RejectCheck — Find out why your CV got rejected",
  description: "Deep-dive diagnosis across ATS filters, seniority gaps, tone analysis — and exactly what to fix before you hit send.",
  applicationName: "RejectCheck",
  authors: [{ name: "RejectCheck", url: "https://rejectcheck.com" }],
  creator: "RejectCheck",
  publisher: "RejectCheck",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/RejectCheck_white.png",
    shortcut: "/RejectCheck_white.png",
    apple: "/RejectCheck_white.png",
  },
  openGraph: {
    title: "RejectCheck — Find out why your CV got rejected",
    description: "Deep-dive diagnosis across ATS filters, seniority gaps, tone analysis — and exactly what to fix before you hit send.",
    url: "https://rejectcheck.com",
    siteName: "RejectCheck",
    images: [
      {
        url: "/RejectCheck_white.png",
        width: 500,
        height: 500,
        alt: "RejectCheck",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RejectCheck — Find out why your CV got rejected",
    description: "Deep-dive diagnosis across ATS filters, seniority gaps, tone analysis — and exactly what to fix before you hit send.",
    images: ["/RejectCheck_white.png"],
  },
  alternates: {
    canonical: "./",
  },
};

import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${chivoMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <JsonLd id="ld-organization" data={organizationSchema} />
        <JsonLd id="ld-website" data={websiteSchema} />
      </head>
      <body className="min-h-full flex flex-col">
        <Toaster position="top-center" expand={true} richColors />
        <Providers>
          {children}
        </Providers>
      </body>
      <Analytics />
    </html>
  );
}
