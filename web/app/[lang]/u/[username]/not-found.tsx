"use client";

import Link from "next/link";
import { Navbar } from "../../../components/Navbar";
import { useLanguage } from "../../../../context/language";

export default function NotFound() {
  const { t } = useLanguage();
  const copy = t.publicProfilePage.notFound;

  return (
    <div className="bg-rc-bg text-rc-text font-sans min-h-screen">
      <Navbar />
      <div className="max-w-[600px] mx-auto px-5 md:px-[40px] py-24 md:py-32 text-center">
        <div className="font-mono text-[10px] tracking-[0.22em] uppercase text-rc-red mb-4">
          404
        </div>
        <h1 className="text-[32px] md:text-[40px] font-semibold leading-tight tracking-tight mb-3">
          {copy.title}
        </h1>
        <p className="text-rc-muted text-[15px] md:text-[16px] leading-relaxed mb-8">
          {copy.description}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2.5 bg-rc-red text-white font-mono text-[12px] tracking-[0.14em] uppercase px-7 py-3.5 rounded-xl hover:bg-[#b83332] transition-colors no-underline"
        >
          {copy.cta}
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path
              d="M2 7h10M7.5 3l4 4-4 4"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
