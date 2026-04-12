import type { Metadata } from "next";
import { Instrument_Sans, Chivo_Mono } from 'next/font/google';
import "./globals.css";
import Providers from "./providers";
import { Analytics } from "@vercel/analytics/next"

const instrumentSans = Instrument_Sans({
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
  title: "RejectCheck — Find out why your CV got rejected",
  description: "Deep-dive diagnosis across ATS filters, seniority gaps, tone analysis — and exactly what to fix before you hit send.",
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
    card: "summary",
    title: "RejectCheck — Find out why your CV got rejected",
    description: "Deep-dive diagnosis across ATS filters, seniority gaps, tone analysis — and exactly what to fix before you hit send.",
    images: ["/RejectCheck_white.png"],
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
      className={`${instrumentSans.variable} ${chivoMono.variable} h-full antialiased`}
    >
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
