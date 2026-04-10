import Link from "next/link";
import type { ReactNode } from "react";
import {
  PRICING_JOURNEY_HEADLINES,
  PRICING_JOURNEY_SEGMENTS,
  getB2cAccessTierMapping,
  getPackagesForJourneySegment,
} from "@features/pricing";

const INSTITUTION_MODEL_ITEMS = [
  "Base ab 2.500 € / Monat",
  "+ aktive Anlassräume",
  "+ optionale aktive Teilnehmende",
  "+ optionale Outcomes / Reports / Add-ons",
  "- Pilot- und Jahresrabatte nach Modell",
];

const ANLASSRAUM_STAFFEL = ["Small: 300 €", "Medium: 600–1.000 €", "Large: 1.000–1.500 €"];

const EXAMPLE_CALCULATIONS = [
  "Beispiel 1: Base 2.500 € + 2 mittlere Anlassräume + 500 aktive Teilnehmende = 4.475 € vor Rabatt.",
  "Beispiel 2: Base 2.500 € + 4 gemischte Anlassräume + 1.500 aktive Teilnehmende = 6.825 € vor Rabatt.",
];

const INSTITUTION_ADD_ONS = [
  {
    title: "Event",
    detail: "Begleitung für Live-Formate, Sitzungen und kommunale Beteiligungstermine.",
  },
  {
    title: "Assistenz",
    detail: "Operative Unterstützung für Moderation, Routing und Ablaufstabilität.",
  },
  {
    title: "Reports",
    detail: "Outcomes- und Wirkungsberichte für Gremien, Verwaltung und Stakeholder.",
  },
  {
    title: "Managed Governance",
    detail: "Begleitete Governance-Setups mit klaren Guardrails und Verantwortlichkeiten.",
  },
];

function SectionCard(props: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{props.title}</p>
      {props.subtitle ? <h3 className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">{props.subtitle}</h3> : null}
      <div className="mt-3 text-sm leading-relaxed text-[rgb(var(--muted))]">{props.children}</div>
    </article>
  );
}

export default function PricingPage() {
  const privatePackages = getPackagesForJourneySegment("privat");
  const organizationsSegment = PRICING_JOURNEY_SEGMENTS.find((segment) => segment.id === "organisationen");
  const municipalitiesSegment = PRICING_JOURNEY_SEGMENTS.find((segment) => segment.id === "kommunen");

  return (
    <main className="min-h-screen bg-[rgb(var(--bg))] pb-16">
      <section className="mx-auto w-full max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
        <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 lg:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Kanonische Pricing-Seite</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[rgb(var(--fg))] lg:text-4xl">
            {PRICING_JOURNEY_HEADLINES.pricingTitle}
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-[rgb(var(--muted))]">
            {PRICING_JOURNEY_HEADLINES.pricingIntro}
          </p>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-[rgb(var(--muted))]">
            {PRICING_JOURNEY_HEADLINES.activationSeparation}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/vormerken" className="btn-primary">
              Paketstart vorbereiten
            </Link>
            <Link href="/mitglied-antrag" className="btn-secondary">
              Mitgliedsantrag öffnen
            </Link>
          </div>
        </header>

        <nav
          aria-label="Pricing-Segmente"
          className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3"
        >
          {PRICING_JOURNEY_SEGMENTS.map((segment) => (
            <a key={segment.id} href={`#${segment.pricingAnchor}`} className="vog-chip">
              {segment.shortLabel}
            </a>
          ))}
        </nav>

        <section id="pricing-privat" className="mt-10 space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Privat</p>
            <h2 className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]">Bürgerpakete: Basis, Start, Pro</h2>
            <p className="mt-2 max-w-4xl text-sm text-[rgb(var(--muted))]">
              {PRICING_JOURNEY_SEGMENTS.find((segment) => segment.id === "privat")?.pricingIntro}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {privatePackages.map((pkg) => {
              const mapping = getB2cAccessTierMapping(pkg.id);
              if (!mapping) return null;
              const price = typeof pkg.preisMonat === "number" ? `${String(pkg.preisMonat).replace(".", ",")} €` : "Preis folgt";
              return (
                <article
                  key={pkg.id}
                  className={`rounded-3xl border p-6 shadow-sm ${
                    pkg.hervorgehoben
                      ? "border-sky-300 bg-sky-500/5"
                      : "border-[rgb(var(--border))] bg-[rgb(var(--card))]"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                    eDebatte {mapping.marketingLabel}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-[rgb(var(--fg))]">{pkg.titel}</h3>
                  <p className="mt-1 text-3xl font-bold tracking-tight text-[rgb(var(--fg))]">{price}</p>
                  <p className="mt-2 text-sm text-[rgb(var(--muted))]">{pkg.beschreibungKurz}</p>
                  <p className="mt-4 rounded-lg bg-[rgb(var(--bg))] px-3 py-2 text-xs text-[rgb(var(--muted))]">
                    Technisches Mapping: <code>{mapping.accessTierId}</code>
                  </p>
                  <Link href={pkg.ctaHref} className="btn-primary mt-5 inline-flex">
                    Paketstart {mapping.marketingLabel}
                  </Link>
                </article>
              );
            })}
          </div>

          <div className="rounded-2xl border border-emerald-300/60 bg-emerald-500/10 p-4 text-sm text-emerald-900 dark:text-emerald-100">
            {PRICING_JOURNEY_HEADLINES.trustNote}
          </div>

          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
            <p className="text-sm font-semibold text-[rgb(var(--fg))]">Zusatzoption für besonders Engagierte</p>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">
              citizenUltra liegt im Korridor von 49–99 € und bleibt als gesonderte Ausbauoption geführt, nicht als
              dominante Hauptkarte.
            </p>
          </div>
        </section>

        <section className="mt-10">
          <SectionCard title="Profil-Pakete" subtitle="Darstellung und Komfort, nicht demokratische Rechte">
            <p>
              Profil-Pakete (profileBasic, profilePro, profilePremium) bilden eine zweite Dimension für Darstellung,
              Sichtbarkeit und Komfort. Sie sind strikt von Access-Tiers getrennt.
            </p>
            <p className="mt-2">
              Auch hier gilt: Profil-Pakete verändern keine Beteiligungsrechte, keine Wahrheitslogik und keine
              Prioritätslogik.
            </p>
          </SectionCard>
        </section>

        <section id="pricing-organisationen" className="mt-10 grid gap-4 xl:grid-cols-2">
          <SectionCard title="Organisationen" subtitle="Hybridmodell statt fester Pauschale">
            <p>{organizationsSegment?.pricingIntro}</p>
            <ul className="mt-3 space-y-1">
              {INSTITUTION_MODEL_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <div className="mt-4 rounded-xl bg-[rgb(var(--bg))] px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Anlassraum-Staffel</p>
              <ul className="mt-2 space-y-1">
                {ANLASSRAUM_STAFFEL.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <Link href={organizationsSegment?.primaryCtaHref ?? "/vormerken?paket=b2b_pro"} className="btn-secondary mt-4 inline-flex">
              {organizationsSegment?.primaryCtaLabel ?? "Paketstart Organisation"}
            </Link>
          </SectionCard>

          <SectionCard title="Kommunen / Verwaltung" subtitle="Transparente Struktur für kommunale Beteiligung">
            <p>{municipalitiesSegment?.pricingIntro}</p>
            <ul className="mt-3 space-y-1">
              {EXAMPLE_CALCULATIONS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link href={municipalitiesSegment?.primaryCtaHref ?? "/vormerken?paket=b2g_pro"} className="btn-secondary mt-4 inline-flex">
              {municipalitiesSegment?.primaryCtaLabel ?? "Paketstart Kommune"}
            </Link>
          </SectionCard>
        </section>

        <section id="pricing-kommunen" className="mt-10">
          <SectionCard title="Add-ons / Zusatzleistungen" subtitle="Optional und klar ausgewiesen">
            <div className="grid gap-3 md:grid-cols-2">
              {INSTITUTION_ADD_ONS.map((item) => (
                <div key={item.title} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                  <p className="text-sm font-semibold text-[rgb(var(--fg))]">{item.title}</p>
                  <p className="mt-1 text-sm text-[rgb(var(--muted))]">{item.detail}</p>
                </div>
              ))}
            </div>
          </SectionCard>
        </section>

        <section className="mt-10 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Mitgliedschaft</p>
          <h2 className="mt-1 text-xl font-semibold text-[rgb(var(--fg))]">Paketabschluss, Freischaltung und Mitgliedschaft getrennt</h2>
          <p className="mt-2 max-w-4xl text-sm text-[rgb(var(--muted))]">
            Paketwahl und Preise laufen über <code>/pricing</code>. Der Paketstart wird über <code>/vormerken</code> angelegt
            und anschließend freigeschaltet. Der Mitgliedsantrag und die Mitgliedschaft laufen separat über{" "}
            <code>/mitglied-antrag</code>. Der Legacy-Pfad <code>/mitglied-werden</code> leitet auf diese Seite um.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/vormerken" className="btn-primary">
              Paketstart anlegen
            </Link>
            <Link href="/mitglied-antrag" className="btn-secondary">
              Mitgliedsantrag öffnen
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
