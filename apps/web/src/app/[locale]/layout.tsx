import { notFound } from "next/navigation";
import { locales } from "../../../i18n";
import { Header, Footer } from "@vog/ui";
import { LocaleProvider } from "@/context/LocaleContext"; // <-- dein eigener Kontextprovider

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
    <html lang={localeValue}>
      <body>
        <LocaleProvider initialLocale={localeValue as any}>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-900 focus:shadow"
          >
            Skip to content
          </a>
          <Header />
          <main id="main-content">{children}</main>
          <Footer />
        </LocaleProvider>
      </body>
    </html>
  );
}
