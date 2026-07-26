import { notFound } from "next/navigation";
import { locales } from "../../../i18n";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale?: string | string[] }>;
}) {
  const { locale } = await params;
  const localeValue = typeof locale === "string" ? locale : Array.isArray(locale) ? locale[0] : undefined;

  if (!localeValue || !locales.includes(localeValue as (typeof locales)[number])) notFound();

  // Root layout already renders the shared locale provider.
  // The provider now resolves locale-prefixed paths directly to avoid a second truth source.
  return children;
}
