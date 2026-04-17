"use client";

import { createContext, useContext, useCallback } from "react";
import type { Dictionary, Locale } from "../app/[lang]/dictionaries";

type LanguageContextValue = {
  t: Dictionary;
  locale: Locale;
  localePath: (path: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
  dictionary,
  locale,
}: {
  children: React.ReactNode;
  dictionary: Dictionary;
  locale: Locale;
}) {
  const localePath = useCallback(
    (path: string) => `/${locale}${path.startsWith('/') ? path : `/${path}`}`,
    [locale]
  );

  return (
    <LanguageContext.Provider value={{ t: dictionary, locale, localePath }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}
