import { SeoFooter } from "../../../components/SeoFooter";
import { BlueprintCta } from "../../../components/BlueprintCta";
import { hasLocale, type Locale } from "../dictionaries";

export default async function ShareLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = (hasLocale(lang) ? lang : "en") as Locale;

  return (
    <>
      {children}
      <BlueprintCta lang={locale} />
      <SeoFooter lang={locale} />
    </>
  );
}
