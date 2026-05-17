import Link from "next/link";
import {
  buildRegionIntelligenceSourceAdapterOverrides,
  buildRegionSourceConnectionFeedSignals,
  getDirectorySourceStatus,
  listRegionSourceConnections,
  listRegionSourceTestResults,
  listOperationalRegions,
  listRegionsFromRegistry,
  resolveRegionIntelligenceSourceContracts,
  regionSourceConnectionTypeLabel,
} from "@features/region";

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
  const registryRegions = listRegionsFromRegistry();
  const sourceStatus = getDirectorySourceStatus();
  const [sourceConnections, sourceTestResults] = await Promise.all([
    listRegionSourceConnections(),
    listRegionSourceTestResults({ limit: 12 }),
  ]);
  const regionMap = new Map(regions.map((region) => [region.id, region]));
  const intelligenceSourceContracts = resolveRegionIntelligenceSourceContracts({
    sources: buildRegionSourceConnectionFeedSignals({
      connections: sourceConnections,
      regionNameById: new Map(regions.map((region) => [region.id, region.name])),
    }).map((signal) => ({
      kind: "feed_signal" as const,
      signal,
    })),
    sourceAdapters: buildRegionIntelligenceSourceAdapterOverrides(sourceConnections),
  });
  const productiveRegions = registryRegions
    .map((region) => regionMap.get(region.id) ?? region)
    .sort((left, right) => left.name.localeCompare(right.name, "de"));
  const productiveRegionIds = new Set(productiveRegions.map((region) => region.id));
  const pilotFixtures = regions
    .filter((region) => !productiveRegionIds.has(region.id))
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

      <section data-testid="admin-regions-summary" className="grid gap-3 md:grid-cols-5">
        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Produktive Regionen</p>
          <p className="mt-2 text-2xl font-semibold text-[rgb(var(--fg))]">{productiveRegions.length}</p>
          <p className="text-sm text-[rgb(var(--muted))]">RegionRegistry-basierte operative Übersichtseinträge</p>
        </div>
        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Manuelle/Pilot-Pfade</p>
          <p className="mt-2 text-2xl font-semibold text-[rgb(var(--fg))]">{pilotFixtures.length}</p>
          <p className="text-sm text-[rgb(var(--muted))]">Getrennt sichtbar, nicht als amtlicher Produktpfad gemischt</p>
        </div>
        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">RegionRegistry</p>
          <p className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">
            {sourceStatus.regionRegistry.status === "ready" ? "Verbunden" : "Nicht verbunden"}
          </p>
          <p className="text-sm text-[rgb(var(--muted))]">Erst Übersicht wählen, dann gezielt in `/admin/region` arbeiten.</p>
        </div>
        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">OfficialDirectory</p>
          <p className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">
            {sourceStatus.officialDirectory.status === "ready" ? "Verbunden" : "Nicht verbunden"}
          </p>
          <p className="text-sm text-[rgb(var(--muted))]">
            Verwaltungsanschriften bleiben getrennt vom RegionRegistry-Import.
          </p>
        </div>
        <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Region Intelligence</p>
          <p className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">
            {intelligenceSourceContracts.sourceStatusSummary.productiveLabel}
          </p>
          <p className="text-sm text-[rgb(var(--muted))]">
            {intelligenceSourceContracts.sourceStatusSummary.curatedLabel} ·{" "}
            {intelligenceSourceContracts.sourceStatusSummary.manualLabel}
          </p>
        </div>
      </section>

      <section
        data-testid="admin-regions-intelligence-sources"
        className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Region Intelligence
        </p>
        <h2 className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">
          Konfigurierbare regionale Quellen, ohne Render-Abhängigkeit
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-[rgb(var(--muted))]">
          Region Intelligence bleibt reviewpflichtig. Produktive, kuratierte und manuelle Quellen
          sind getrennt vorbereitet; keine Live-Crawler-Behauptung, kein Scraping und keine
          DeepSearch-Automatikkosten.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {intelligenceSourceContracts.configuredSources.map((source) => (
            <article key={source.adapterId} className="rounded-2xl border border-[rgb(var(--border))] p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                {source.category}
              </p>
              <h3 className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">{source.label}</h3>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">{source.description}</p>
              <p className="mt-3 text-xs text-[rgb(var(--muted))]">
                Status: {source.status} · Gewicht {source.weight.toFixed(2)}
              </p>
            </article>
          ))}
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-[rgb(var(--border))] p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
              Konfigurierte Quellen
            </p>
            <p className="mt-2 text-2xl font-semibold text-[rgb(var(--fg))]">{sourceConnections.length}</p>
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">
              Produktive, kuratierte und manuelle Quellen bleiben explizit getrennt und laufen nicht direkt im
              Renderpfad.
            </p>
          </article>
          <article className="rounded-2xl border border-[rgb(var(--border))] p-4">
            <p className="text-xs uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
              Reviewpflichtige Source Results
            </p>
            <p className="mt-2 text-2xl font-semibold text-[rgb(var(--fg))]">{sourceTestResults.length}</p>
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">
              Dry Runs bleiben intern in Prüfung und sind weder Veröffentlichung noch `public_official`.
            </p>
          </article>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <article className="rounded-2xl border border-[rgb(var(--border))] p-4">
            <p className="text-sm font-semibold text-[rgb(var(--fg))]">Letzte Quellkonfigurationen</p>
            <div className="mt-3 space-y-2">
              {sourceConnections.length > 0 ? (
                sourceConnections.slice(0, 5).map((connection) => (
                  <div key={connection.id} className="rounded-2xl border border-[rgb(var(--border))] p-3">
                    <p className="text-sm font-semibold text-[rgb(var(--fg))]">{connection.label}</p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      {regionMap.get(connection.regionId)?.name ?? connection.regionId} ·{" "}
                      {regionSourceConnectionTypeLabel(connection.sourceType)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[rgb(var(--muted))]">Noch keine Quellen konfiguriert.</p>
              )}
            </div>
          </article>
          <article className="rounded-2xl border border-[rgb(var(--border))] p-4">
            <p className="text-sm font-semibold text-[rgb(var(--fg))]">Letzte Dry Runs</p>
            <div className="mt-3 space-y-2">
              {sourceTestResults.length > 0 ? (
                sourceTestResults.slice(0, 5).map((result) => (
                  <div key={result.id} className="rounded-2xl border border-[rgb(var(--border))] p-3">
                    <p className="text-sm font-semibold text-[rgb(var(--fg))]">{result.title}</p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      {regionMap.get(result.regionId)?.name ?? result.regionId} · {result.visibilityLabel}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[rgb(var(--muted))]">Noch keine Dry-Run-Ergebnisse vorhanden.</p>
              )}
            </div>
          </article>
        </div>
      </section>

      <section data-testid="admin-regions-productive" className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Produktive Übersicht
          </p>
          <h2 className="text-xl font-semibold text-[rgb(var(--fg))]">Operative Regionen aus der RegionRegistry</h2>
          <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">
            Diese Einträge bilden die produktive Betreiber-/Admin-Übersicht. `RegionRegistry` und
            `OfficialDirectory` bleiben getrennt: Regionen kommen aus der Registry, Verwaltungsanschriften aus dem
            Directory.
          </p>
        </div>
        {sourceStatus.regionRegistry.status !== "ready" ? (
          <div
            data-testid="admin-regions-registry-missing-state"
            className="rounded-3xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4"
          >
            <p className="text-sm font-medium text-[rgb(var(--fg))]">Amtliches Gemeindeverzeichnis ist nicht verbunden.</p>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">
              Manuelle Regionen bleiben nutzbar. XLSX-, CSV- oder API-Dateien dürfen nur Importquellen sein und
              hängen nicht im UI-Renderpfad.
            </p>
          </div>
        ) : null}
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
                sourceLabel="RegionRegistry"
                sourceHint="Produktiver Übersichtseintrag aus der getrennten Regionsbasis."
              />
            ))
          ) : (
            <p className="text-sm text-[rgb(var(--muted))]">Noch keine RegionRegistry-Einträge gefunden.</p>
          )}
        </div>
      </section>

      <section data-testid="admin-regions-pilot-fixtures" className="space-y-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Manuelle/Pilot-Pfade
          </p>
          <h2 className="text-xl font-semibold text-[rgb(var(--fg))]">Getrennt markierte manuelle und Pilotregionen</h2>
          <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">
            Diese Einträge bleiben sichtbar, aber getrennt von der produktiven Übersicht. Keine Fake-Daten werden
            als amtlich behauptet und keine Demo-Fallbacks still als RegionRegistry gelesen.
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
                sourceLabel="Manuell/Pilot"
                sourceHint="Nur getrennt angezeigt. Nicht als amtlicher Betreiber-Normalweg zu lesen."
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
