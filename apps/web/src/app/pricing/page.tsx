import Link from "next/link";

type B2cTierCard = {
  id: "citizenBasic" | "citizenPremium" | "citizenPro";
  marketingLabel: "Basis" | "Start" | "Pro";
  title: string;
  price: string;
  audience: string;
  value: string;
  ctaLabel: string;
  ctaHref: string;
  highlighted?: boolean;
};

const B2C_TIER_CARDS: B2cTierCard[] = [
  {
    id: "citizenBasic",
    marketingLabel: "Basis",
    title: "eDebatte Basis",
    price: "0 €",
    audience: "Für alle, die direkt starten wollen",
    value: "Lesen, mitmachen und erste eigene Beiträge ohne Kosten.",
    ctaLabel: "Basis vormerken",
    ctaHref: "/vormerken?paket=basis",
  },
  {
    id: "citizenPremium",
    marketingLabel: "Start",
    title: "eDebatte Start",
    price: "9,99 €",
    audience: "Für regelmäßige Beteiligung",
    value: "Mehr Komfort, höhere Kontingente und verlässlicher Arbeitsfluss.",
    ctaLabel: "Start vormerken",
    ctaHref: "/vormerken?paket=start",
    highlighted: true,
  },
  {
    id: "citizenPro",
    marketingLabel: "Pro",
    title: "eDebatte Pro",
    price: "29 €",
    audience: "Für intensive Nutzung in Initiative und Team",
    value: "Erweitertes Paket mit mehr Credits, mehr Werkzeugen und stabilerem Takt.",
    ctaLabel: "Pro vormerken",
    ctaHref: "/vormerken?paket=pro",
  },
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

const INSTITUTION_MODEL_ITEMS = [
  "Base ab 2.500 € / Monat",
  "+ aktive Anlassräume",
  "+ optionale aktive Teilnehmende",
  "+ optionale Outcomes / Reports / Add-ons",
  "- Pilot- und Jahresrabatte nach Modell",
];

const ANLASSRAUM_STAFFEL = [
  "Small: 300 €",
  "Medium: 600–1.000 €",
  "Large: 1.000–1.500 €",
];

const EXAMPLE_CALCULATIONS = [
  "Beispiel 1: Base 2.500 € + 2 mittlere Anlassräume + 500 aktive Teilnehmende = 4.475 € vor Rabatt.",
  "Beispiel 2: Base 2.500 € + 4 gemischte Anlassräume + 1.500 aktive Teilnehmende = 6.825 € vor Rabatt.",
];

function SectionCard(props: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{props.title}</p>
      {props.subtitle ? <h3 className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">{props.subtitle}</h3> : null}
      <div className="mt-3 text-sm leading-relaxed text-[rgb(var(--muted))]">{props.children}</div>
    </article>
  );
}

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-[rgb(var(--bg))] pb-16">
      <section className="mx-auto w-full max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
        <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 lg:p-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Kanonische Pricing-Seite</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[rgb(var(--fg))] lg:text-4xl">Pakete & Preise</h1>
          <p className="mt-3 max-w-4xl text-sm leading-relaxed text-[rgb(var(--muted))]">
            Diese Seite ist der zentrale Einstieg für Pakete, Preise, Add-ons und Vormerkung. Mitgliedschaft und Antrag
            laufen separat über den Mitgliedsantrag.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/vormerken" className="btn-primary">
              Vormerken
            </Link>
            <Link href="/mitglied-antrag" className="btn-secondary">
              Zum Mitgliedsantrag
            </Link>
          </div>
        </header>

        <nav
          aria-label="Pricing-Segmente"
          className="mt-6 flex flex-wrap gap-2 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3"
        >
          <a href="#pricing-privat" className="vog-chip">
            Privat
          </a>
          <a href="#pricing-organisationen" className="vog-chip">
            Organisationen
          </a>
          <a href="#pricing-kommunen" className="vog-chip">
            Kommunen / Verwaltung
          </a>
        </nav>

        <section id="pricing-privat" className="mt-10 space-y-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Privat</p>
            <h2 className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]">Bürgerpakete: Basis, Start, Pro</h2>
            <p className="mt-2 max-w-4xl text-sm text-[rgb(var(--muted))]">
              Marketing-Namen und technische Access-Tiers sind sauber zugeordnet: Basis = citizenBasic, Start =
              citizenPremium, Pro = citizenPro.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {B2C_TIER_CARDS.map((tier) => (
              <article
                key={tier.id}
                className={`rounded-3xl border p-6 shadow-sm ${
                  tier.highlighted
                    ? "border-sky-300 bg-sky-500/5"
                    : "border-[rgb(var(--border))] bg-[rgb(var(--card))]"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                  eDebatte {tier.marketingLabel}
                </p>
                <h3 className="mt-1 text-xl font-semibold text-[rgb(var(--fg))]">{tier.title}</h3>
                <p className="mt-1 text-3xl font-bold tracking-tight text-[rgb(var(--fg))]">{tier.price}</p>
                <p className="mt-2 text-sm font-medium text-[rgb(var(--fg))]">{tier.audience}</p>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">{tier.value}</p>
                <p className="mt-4 rounded-lg bg-[rgb(var(--bg))] px-3 py-2 text-xs text-[rgb(var(--muted))]">
                  Technisches Mapping: <code>{tier.id}</code>
                </p>
                <Link href={tier.ctaHref} className="btn-primary mt-5 inline-flex">
                  {tier.ctaLabel}
                </Link>
              </article>
            ))}
          </div>

          <div className="rounded-2xl border border-emerald-300/60 bg-emerald-500/10 p-4 text-sm text-emerald-900 dark:text-emerald-100">
            Pakete erweitern Tools, Komfort, Credits und Sichtbarkeit. Sie kaufen keine demokratischen Sonderrechte und
            keine Priorität in Entscheidungen.
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
            <ul className="space-y-1">
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
            <Link href="/vormerken?paket=b2b_pro" className="btn-secondary mt-4 inline-flex">
              Organisation vormerken
            </Link>
          </SectionCard>

          <SectionCard title="Kommunen / Verwaltung" subtitle="Transparente Struktur für kommunale Beteiligung">
            <p>
              Für Kommunen und Verwaltung gilt dieselbe Hybridlogik. Der Preis entsteht nachvollziehbar aus Base,
              Anlassräumen und optionalen Leistungsbausteinen.
            </p>
            <ul className="mt-3 space-y-1">
              {EXAMPLE_CALCULATIONS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <Link href="/vormerken?paket=b2g_pro" className="btn-secondary mt-4 inline-flex">
              Kommune vormerken
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
          <h2 className="mt-1 text-xl font-semibold text-[rgb(var(--fg))]">Produktpreise und Mitgliedschaft getrennt</h2>
          <p className="mt-2 max-w-4xl text-sm text-[rgb(var(--muted))]">
            Paketwahl und Preise laufen über <code>/pricing</code>. Der Mitgliedsantrag und die Mitgliedschaft laufen über{" "}
            <code>/mitglied-antrag</code>. Der Legacy-Pfad <code>/mitglied-werden</code> leitet auf diese Seite um.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/vormerken" className="btn-primary">
              Jetzt vormerken
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
