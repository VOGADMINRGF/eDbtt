import Link from "next/link";
import PackagesGrid from "@/components/pricing/PackagesGrid";
import ProductSurfaceShell from "@/components/layout/ProductSurfaceShell";
import {
  getPackagesForJourneySegment,
  normalizePricingLocale,
  type PricingLocale,
} from "@features/pricing";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

function firstString(value?: string | string[]) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return null;
}

function withLocaleHref(href: string, locale: PricingLocale) {
  if (locale !== "en") return href;

  const [pathAndQuery, hash = ""] = href.split("#");
  const [path, query = ""] = pathAndQuery.split("?");
  const params = new URLSearchParams(query);
  params.set("lang", "en");
  const queryString = params.toString();
  return `${path}${queryString ? `?${queryString}` : ""}${hash ? `#${hash}` : ""}`;
}

export default async function PricingPage({ searchParams }: PageProps = {}) {
  const params = (await searchParams) ?? {};
  const locale = normalizePricingLocale(firstString(params.lang));
  const privatePackages = getPackagesForJourneySegment("privat", locale);

  const labels =
    locale === "en"
      ? {
          pageKicker: "Pricing",
          heroTitle: "Packages & pricing",
          heroText: "Choose one of three private packages: Interested, Active or Co-creating.",
          packageCta: "Choose package",
          institutionalCta: "View B2B/B2G conditions",
          initiativeCta: "About the initiative",
          howItWorksCta: "How eDebatte works",
          privateKicker: "Private packages",
          privateTitle: "Private packages for individuals",
          privateText: "Interested: €0 for members / €3.99 regular · Active: €9.90 · Co-creating: €29.90.",
          membershipTitle: "Membership in the initiative",
          membershipIntro: "As a member of the initiative, package “Interested” is free.",
          membershipPriceMember: "Member price for “Interested”: €0",
          membershipPriceRegular: "Regular price for “Interested”: €3.99",
          membershipPointOne: "Regular price for “Interested” is €3.99.",
          membershipPointTwo: "The freely chosen membership contribution stays independent from package pricing.",
          membershipPointThree: "Recommended contribution: €5.63.",
          membershipPointFour:
            "Membership request and contribution amount are finalized via separate email link.",
          membershipPointFive:
            "eDebatte.org and VoiceOpenGov.org can be operated in separate systems with additional security boundaries.",
          institutionalHintText:
            "For organizations, municipalities, associations and newsrooms we provide dedicated conditions.",
        }
      : {
          pageKicker: "Pricing",
          heroTitle: "Pakete & Preise",
          heroText: "Wähle eines von drei Privatpaketen: Interessiert, Aktiv oder Mitgestaltend.",
          packageCta: "Paket wählen",
          institutionalCta: "B2B/B2G-Konditionen ansehen",
          initiativeCta: "Zur Initiative",
          howItWorksCta: "So funktioniert eDebatte",
          privateKicker: "Privatpakete",
          privateTitle: "Privatpakete für Einzelpersonen",
          privateText: "Interessiert: 0 € für Mitglieder / 3,99 € regulär · Aktiv: 9,90 € · Mitgestaltend: 29,90 €.",
          membershipTitle: "Mitgliedschaft in der Initiative",
          membershipIntro: "Als Mitglied der Initiative ist das Paket „Interessiert“ kostenfrei.",
          membershipPriceMember: "Mitgliedspreis für „Interessiert“: 0 €",
          membershipPriceRegular: "Regulärer Preis für „Interessiert“: 3,99 €",
          membershipPointOne: "Regulär kostet „Interessiert“ 3,99 €.",
          membershipPointTwo: "Der frei gewählte Mitgliedsbeitrag bleibt davon unabhängig.",
          membershipPointThree: "Empfohlen sind 5,63 €.",
          membershipPointFour:
            "Mitgliedsantrag und Beitragshöhe werden separat per E-Mail-Link final bestätigt.",
          membershipPointFive:
            "eDebatte.org und VoiceOpenGov.org können organisatorisch und technisch getrennt geführt werden; zusätzliche Sicherheits- und Trennlogik ist bewusst möglich.",
          institutionalHintText: "Für Organisationen, Kommunen, Verbände und Redaktionen gibt es gesonderte Konditionen.",
        };

  return (
    <ProductSurfaceShell>
      <header className="relative overflow-hidden rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_95%_0%,rgba(14,165,233,0.1),transparent_42%)]" />
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{labels.pageKicker}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[rgb(var(--fg))] sm:text-4xl">{labels.heroTitle}</h1>
          <p className="mt-4 max-w-4xl text-base leading-relaxed text-[rgb(var(--muted))]">{labels.heroText}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#pricing-privat" className="btn-primary">
              {labels.packageCta}
            </a>
            <Link href={withLocaleHref("/pricing/institutionen", locale)} className="btn-secondary">
              {labels.institutionalCta}
            </Link>
          </div>
        </div>
      </header>

      <section id="pricing-privat" className="mt-10 space-y-5 scroll-mt-28">
        <div className="max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{labels.privateKicker}</p>
          <h2 className="mt-2 text-2xl font-semibold text-[rgb(var(--fg))] sm:text-3xl">{labels.privateTitle}</h2>
          <p className="mt-1 text-sm leading-relaxed text-[rgb(var(--muted))]">{labels.privateText}</p>
        </div>

        <PackagesGrid packages={privatePackages} locale={locale} compact />

        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{labels.membershipTitle}</p>
          <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">{labels.membershipIntro}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
              {labels.membershipPriceMember}
            </p>
            <p className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-800">
              {labels.membershipPriceRegular}
            </p>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm text-[rgb(var(--muted))]">
            <li>{labels.membershipPointOne}</li>
            <li>{labels.membershipPointTwo}</li>
            <li>{labels.membershipPointThree}</li>
            <li>{labels.membershipPointFour}</li>
            <li>{labels.membershipPointFive}</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={withLocaleHref("/howtoworks/initiative", locale)} className="btn-secondary inline-flex">
              {labels.initiativeCta}
            </Link>
            <Link href={withLocaleHref("/howtoworks/edebatte", locale)} className="btn-secondary inline-flex">
              {labels.howItWorksCta}
            </Link>
          </div>
        </section>
      </section>

      <section className="mt-8 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm sm:p-5">
        <p className="text-sm leading-relaxed text-[rgb(var(--muted))]">{labels.institutionalHintText}</p>
        <div className="mt-3">
          <Link href={withLocaleHref("/pricing/institutionen", locale)} className="btn-secondary inline-flex">
            {labels.institutionalCta}
          </Link>
        </div>
      </section>
    </ProductSurfaceShell>
  );
}
