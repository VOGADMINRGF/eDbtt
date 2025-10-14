import { notFound } from "next/navigation";
import { locales } from "../../../i18n";
import { Header, Footer } from "@vog/ui";
import { LocaleProvider } from "@/context/LocaleContext"; // <-- dein eigener Kontextprovider

export default function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as any)) notFound();

  return (
    <html lang={locale}>
      <body>
        <LocaleProvider locale={locale}>
          <Header />
          {children}
          <Footer />
        </LocaleProvider>
      </body>
    </html>
  );
}
