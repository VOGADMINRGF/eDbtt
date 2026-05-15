import Link from "next/link";
import { listOperationalRegions } from "@features/region";

function regionTypeLabel(value: string) {
  switch (value) {
    case "bezirk":
      return "Bezirk";
    case "kommune":
      return "Kommune";
    case "quartier":
      return "Quartier";
    case "region":
      return "Region";
    default:
      return value;
  }
}

function RegionCard(props: {
  id: string;
  slug: string;
  name: string;
  type: string;
  administrativeUnitType?: string | null;
  officialBodyLabel?: string | null;
  sourceLabel: string;
  sourceHint: string;
}) {
  return (
    <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
        <span>{regionTypeLabel(props.type)}</span>
        {props.administrativeUnitType ? (
          <>
            <span>·</span>
            <span>{props.administrativeUnitType}</span>
          </>
        ) : null}
        <span>·</span>
        <span>{props.sourceLabel}</span>
      </div>
      <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">{props.name}</h2>
      <p className="mt-1 text-sm text-[rgb(var(--muted))]">{props.officialBodyLabel ?? "Keine amtliche Stelle hinterlegt."}</p>
      <p className="mt-3 text-sm text-[rgb(var(--muted))]">{props.sourceHint}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link
          href={`/admin/region?regionId=${encodeURIComponent(props.slug || props.id)}`}
          className="btn-primary min-h-[42px] px-4 py-2 text-sm"
        >
          Arbeitsansicht öffnen
        </Link>
        <span className="text-xs text-[rgb(var(--muted))]">Detailroute: `/admin/region?regionId=...`</span>
      </div>
    </article>
  );
}

export default async function AdminRegionsPage() {
  const regions = await listOperationalRegions();
  const productiveRegions = regions
    .filter((region) => Boolean(region.officialDirectoryEntry))
    .sort((left, right) => left.name.localeCompare(right.name, "de"));
  const pilotFixtures = regions
    .filter((region) => !region.officialDirectoryEntry)
    .sort((left, right) => left.name.localeCompare(right.name, "de"));

  return (
    <main
      data-testid="admin-regions-page"
      className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6"
    >
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Betreiber- und Admin-Übersicht
        </p>
        <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">Regionen und Arbeitsansichten</h1>
        <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">
          `/admin/regions` ist die produktive Übersicht. `/admin/region?regionId=...` bleibt die Detail- und
          Arbeitsansicht. Keine GeoReference, kein Live-Crawler, kein Payment und keine Publishing-Logik in dieser
          Oberfläche.
        </p>
      </header>

      <section data-testid="admin-regions-summary" className="grid gap-3 md:grid-cols-3">
        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Produktive Regionen</p>
          <p className="mt-2 text-2xl font-semibold text-[rgb(var(--fg))]">{productiveRegions.length}</p>
          <p className="text-sm text-[rgb(var(--muted))]">Directory-basierte operative Übersichtseinträge</p>
        </div>
        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Pilot-/Fixture-Pfade</p>
          <p className="mt-2 text-2xl font-semibold text-[rgb(var(--fg))]">{pilotFixtures.length}</p>
          <p className="text-sm text-[rgb(var(--muted))]">Getrennt sichtbar, nicht als produktiver Normalfall gemischt</p>
        </div>
        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">IA-Regel</p>
          <p className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">Übersicht → Detailroute</p>
          <p className="text-sm text-[rgb(var(--muted))]">Erst Übersicht wählen, dann gezielt in `/admin/region` arbeiten.</p>
        </div>
      </section>

      <section data-testid="admin-regions-productive" className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Produktive Übersicht
          </p>
          <h2 className="text-xl font-semibold text-[rgb(var(--fg))]">Operative Regionen aus dem offiziellen Verzeichnis</h2>
          <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">
            Diese Einträge bilden die produktive Betreiber-/Admin-Übersicht. Sie führen weiter in die bestehende
            Detail- und Arbeitsansicht, ohne neue Fachlogik oder neue Mutationspfade einzuführen.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {productiveRegions.length > 0 ? (
            productiveRegions.map((region) => (
              <RegionCard
                key={region.id}
                id={region.id}
                slug={region.slug}
                name={region.name}
                type={region.type}
                administrativeUnitType={region.administrativeUnitType}
                officialBodyLabel={region.officialBody?.label ?? null}
                sourceLabel="offizielles Verzeichnis"
                sourceHint="Produktiver Übersichtseintrag aus der operationalen Regionsbasis."
              />
            ))
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">Noch keine produktiven Regionseinträge gefunden.</p>
          )}
        </div>
      </section>

      <section data-testid="admin-regions-pilot-fixtures" className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Pilot-/Fixture-Pfade
          </p>
          <h2 className="text-xl font-semibold text-[rgb(var(--fg))]">Getrennt markierte Test- und Pilotregionen</h2>
          <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">
            Diese Einträge bleiben sichtbar, aber getrennt von der produktiven Übersicht. Keine GeoReference, keine
            Reinickendorf-only-Sonderlogik und keine stillen Demo-Fallbacks im produktiven Hauptpfad.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {pilotFixtures.length > 0 ? (
            pilotFixtures.map((region) => (
              <RegionCard
                key={region.id}
                id={region.id}
                slug={region.slug}
                name={region.name}
                type={region.type}
                administrativeUnitType={region.administrativeUnitType}
                officialBodyLabel={region.officialBody?.label ?? null}
                sourceLabel="Pilot-/Fixture-Pfad"
                sourceHint="Nur getrennt angezeigt. Nicht als produktiver Betreiber-Normalweg zu lesen."
              />
            ))
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">Keine Pilot-/Fixture-Einträge vorhanden.</p>
          )}
        </div>
      </section>
    </main>
  );
}
