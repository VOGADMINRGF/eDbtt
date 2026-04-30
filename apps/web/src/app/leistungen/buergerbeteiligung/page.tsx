import Link from "next/link";
import ProductSurfaceShell from "@/components/layout/ProductSurfaceShell";
import { participationPackages, tenderLotMappings } from "@features/procurement/participationPackages";

const primaryPackageIds = ["check", "dossier", "runde", "mandat", "studio"] as const;
const primaryPackages = participationPackages.filter((pkg) => primaryPackageIds.includes(pkg.id as (typeof primaryPackageIds)[number]));

export default function ParticipationProcurementPage() {
  return (
    <ProductSurfaceShell>
      <header className="relative overflow-hidden rounded-[1.75rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_92%_0%,rgba(14,165,233,0.12),transparent_44%)]" />
        <div className="relative max-w-5xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            Vergabefaehige Buergerbeteiligung
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[rgb(var(--fg))] sm:text-4xl">
            Buergerbeteiligung, die nicht im Protokoll endet.
          </h1>
          <p className="mt-4 max-w-4xl text-base leading-relaxed text-[rgb(var(--muted))]">
            eDebatte verbindet Themenklaerung, Dossier, digitale Beteiligungsrunde, Auswertung,
            Studio-Kommunikation und Mandatsbericht in einem nachvollziehbaren Prozess fuer Kommunen,
            Verwaltungen, Medien und Beteiligungsdienstleister.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/pricing?segment=kommunen" className="btn-primary">
              Kommunale Pakete ansehen
            </Link>
            <Link href="/leistungen/partner" className="btn-secondary">
              Partner-Modell fuer Beteiligungsbueros
            </Link>
            <Link href="/demo/dossier" className="btn-secondary">
              Demo-Dossier ansehen
            </Link>
          </div>
        </div>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ["Fuer Ausschreibungen", "Leistungsbausteine statt nur App: Konzept, Online-Beteiligung, Auswertung, Bericht und Gremienexport."],
          ["Fuer Kommunen", "Lokale und regionale Vorhaben koennen als Check, Dossier, Runde, Mandat und Studio geplant werden."],
          ["Fuer Partner", "Moderations- und Planungsbueros koennen eDebatte als digitale Infrastruktur in eigene Angebote integrieren."],
        ].map(([title, text]) => (
          <article key={title} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">{text}</p>
          </article>
        ))}
      </section>

      <section className="mt-10 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Prozess
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[rgb(var(--fg))]">
          Vom Anlass zum Mandat
        </h2>
        <div className="mt-5 grid gap-3 md:grid-cols-5">
          {primaryPackages.map((pkg, index) => (
            <article key={pkg.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
              <p className="text-xs font-semibold text-[rgb(var(--muted))]">{index + 1}</p>
              <h3 className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">{pkg.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-[rgb(var(--muted))]">{pkg.subtitle}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 space-y-4">
        <div className="max-w-4xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
            Ausschreibungslogik
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[rgb(var(--fg))]">
            Lose sauber in eDebatte-Angebote uebersetzen
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">
            Der Contract spiegelt typische Lose aus Buergerbeteiligungs- und Onlinebeteiligungsvergaben.
            So koennen Leistungsseiten, Pricing, Studio und spaeter das Procurement-Board dieselbe Paketlogik nutzen.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tenderLotMappings.map((lot) => (
            <article key={lot.id} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">{lot.tenderLot}</p>
              <h3 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">{lot.eDebatteOffer}</h3>
              <p className="mt-3 text-xs font-semibold text-[rgb(var(--muted))]">Beispiele</p>
              <ul className="mt-2 space-y-1 text-sm text-[rgb(var(--muted))]">
                {lot.examples.map((example) => (
                  <li key={`${lot.id}-${example}`}>{example}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Muster-Leistungsbild
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-[rgb(var(--fg))]">
          Ausschreibungsfaehige Bausteine
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {[
            ["Leistungsgegenstand", "Konzeption, technische Bereitstellung, Durchfuehrung, Auswertung und Dokumentation digitaler oder hybrider Buergerbeteiligung."],
            ["Mindestleistung", "Dossier, Quellenstruktur, Beteiligungsfrage, digitale Runde, QR-/Link-Zugang, Export und Ergebnisdarstellung."],
            ["Optionale Module", "Jugendbeteiligung, mehrsprachige Ausspielung, Offline-Erfassung, Faktencheck, Studio-Kampagne und Moderationsanbindung."],
            ["Vergabegrenze", "eDebatte bereitet Entwurf, Review, Planung und Freigabe vor; echte Veroeffentlichung bleibt eine explizite Admin-Entscheidung."],
          ].map(([title, text]) => (
            <article key={title} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
              <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[rgb(var(--muted))]">{text}</p>
            </article>
          ))}
        </div>
      </section>
    </ProductSurfaceShell>
  );
}
