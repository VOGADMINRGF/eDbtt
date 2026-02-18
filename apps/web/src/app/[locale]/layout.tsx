import { notFound } from "next/navigation";
import { locales } from "../../../i18n";
import { LocaleProvider } from "@/context/LocaleContext";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ReadingModeProvider } from "@/components/providers/reading-mode-provider";
import { SiteHeader } from "@/app/(components)/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

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

  return (
    <html lang={localeValue} className="h-full dark" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <ReadingModeProvider>
            <LocaleProvider initialLocale={localeValue as any}>
              <SiteHeader initialUser={null} />
              {children}
              <SiteFooter />
            </LocaleProvider>
          </ReadingModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
