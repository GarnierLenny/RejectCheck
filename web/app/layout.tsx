import type { Metadata } from "next";
import { Instrument_Serif, DM_Mono, Bricolage_Grotesque, Bebas_Neue } from 'next/font/google';
import "./globals.css";
import Providers from "./providers";

const instrumentSerif = Instrument_Serif({
  weight: ['400'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-serif',
});

const bebasNeue = Bebas_Neue({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-display',
});

const dmMono = DM_Mono({
  weight: ['400', '500'],
  subsets: ['latin'],
  variable: '--font-mono',
});

const bricolage = Bricolage_Grotesque({
  weight: ['400', '600'],
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: "RejectCheck",
  description: "Find out why your CV will be rejected — before you apply.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${dmMono.variable} ${bricolage.variable} ${bebasNeue.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
