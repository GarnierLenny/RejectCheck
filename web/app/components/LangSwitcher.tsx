"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "../../context/language";

export function LangSwitcher() {
  const { locale } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(targetLocale: string) {
    if (targetLocale === locale) return;
    // Replace the locale prefix in the pathname
    const newPath = pathname.replace(/^\/(en|fr)/, `/${targetLocale}`);
    // Set cookie before navigating so proxy doesn't override choice
    document.cookie = `NEXT_LOCALE=${targetLocale};path=/;max-age=${60 * 60 * 24 * 365}`;
    router.push(newPath);
  }

  return (
    <div className="flex items-center gap-0.5 border border-rc-border rounded px-1 py-0.5">
      {(["en", "fr"] as const).map((l) => (
        <button
          key={l}
          onClick={() => switchTo(l)}
          className={`font-mono text-[9px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded transition-all duration-150 ${
            locale === l
              ? "bg-rc-red text-white"
              : "text-rc-hint hover:text-rc-text"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
