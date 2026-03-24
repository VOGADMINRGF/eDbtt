import { notFound } from "next/navigation";
import { locales } from "../../../i18n";
import { LocaleProvider } from "@/context/LocaleContext";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string | string[] }>;
}) {
  const { locale } = await params;
  const localeValue = typeof locale === "string" ? locale : Array.isArray(locale) ? locale[0] : undefined;

  if (!localeValue || !locales.includes(localeValue as any)) notFound();

  // Root layout already renders html/body/theme/providers/header/footer.
  // Locale layout only scopes the locale context to the URL segment.
  return <LocaleProvider initialLocale={localeValue as any}>{children}</LocaleProvider>;
}
