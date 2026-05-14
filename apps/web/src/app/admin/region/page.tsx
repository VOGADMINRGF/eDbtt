import Link from "next/link";
import {
  getRegionalAdminCockpitReadModel,
  listOperationalRegions,
} from "@features/region";

type SearchParamsShape =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

function firstParam(value?: string | string[]) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

function suggestedActionLabel(action: string) {
  switch (action) {
    case "create_anlassraum":
      return "Anlassraum-Vorschlag";
    case "attach_to_anlassraum":
      return "An bestehenden Anlassraum anhängen";
    case "create_dossier":
      return "Dossier-Vorschlag";
    case "attach_source_to_dossier":
      return "Quelle an Dossier anhängen";
    case "ask_clarifying_question":
      return "Rückfrage klären";
    default:
      return "Ignorieren";
  }
}

export default async function AdminRegionPage({
  searchParams,
}: {
  searchParams?: SearchParamsShape;
}) {
  const resolved = searchParams ? await searchParams : {};
  const regions = await listOperationalRegions();
  const selectedRegionId = firstParam(resolved.regionId) ?? regions[0]?.slug ?? regions[0]?.id ?? null;
  const cockpit = selectedRegionId ? await getRegionalAdminCockpitReadModel(selectedRegionId) : null;

  return (
    <main
      data-testid="admin-region-page"
      className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6"
    >
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Regionales Lagebild
        </p>
        <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">Verwaltung, Akteure und Signale</h1>
        <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">
          Die Surface verbindet regionale Signale, Feed-Vorschläge und reviewpflichtige Dossier- oder
          Anlassraum-Hinweise. Keine automatische Veröffentlichung, keine automatische Dossier-Erstellung,
          kein Vergabe-Monitoring.
        </p>
      </header>

      <section
        data-testid="admin-region-selector"
        className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4"
      >
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">Region auswählen</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {regions.slice(0, 18).map((region) => (
            <Link
              key={region.id}
              href={`/admin/region?regionId=${encodeURIComponent(region.slug || region.id)}`}
              className={`rounded-full border px-3 py-1 text-xs ${
                region.id === cockpit?.region.id || region.slug === selectedRegionId
                  ? "border-cyan-400 bg-cyan-500/10 text-cyan-900"
                  : "border-[rgb(var(--border))] text-[rgb(var(--muted))]"
              }`}
            >
              {region.name}
            </Link>
          ))}
        </div>
      </section>

      {cockpit ? (
        <>
          <section data-testid="admin-region-summary" className="grid gap-3 md:grid-cols-4">
            <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Region</p>
              <p className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">{cockpit.region.name}</p>
              <p className="text-sm text-[rgb(var(--muted))]">
                {cockpit.region.type}
                {cockpit.region.administrativeUnitType ? ` · ${cockpit.region.administrativeUnitType}` : ""}
              </p>
            </div>
            <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Akteure</p>
              <p className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">{cockpit.actorCount}</p>
              <p className="text-sm text-[rgb(var(--muted))]">
                {cockpit.verifiedActorCount} verifiziert · {cockpit.officialDirectoryActorCount} amtlich
              </p>
            </div>
            <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Signale</p>
              <p className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">{cockpit.signalCount}</p>
              <p className="text-sm text-[rgb(var(--muted))]">{cockpit.pendingSignalCount} warten auf Sichtung</p>
            </div>
            <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Guardrails</p>
              <p className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">Review first</p>
              <p className="text-sm text-[rgb(var(--muted))]">Kein Auto-Publish, kein Auto-Dossier, kein Scraping.</p>
            </div>
          </section>

          <section data-testid="admin-region-feed-signals" className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Neue Signale</p>
              <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">
                Aktuelle Themenlage {cockpit.region.name}
              </h2>
              <div className="mt-4 space-y-3">
                {cockpit.feedSignals.slice(0, 5).map((signal) => (
                  <div key={signal.id} className="rounded-2xl border border-[rgb(var(--border))] p-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                      <span>{signal.sourceType}</span>
                      <span>·</span>
                      <span>{signal.provenance.dataOrigin === "pilot_fixture" ? "Pilot-Fixture" : "Review-Queue"}</span>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">{signal.title}</h3>
                    <p className="mt-1 text-sm text-[rgb(var(--muted))]">{signal.summary}</p>
                    <p className="mt-2 text-xs font-medium text-cyan-900">{suggestedActionLabel(signal.suggestedAction)}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Themencluster</p>
              <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">Reviewpflichtige Verdichtungen</h2>
              <div className="mt-4 space-y-3">
                {cockpit.topicClusters.slice(0, 5).map((cluster) => (
                  <div key={cluster.id} className="rounded-2xl border border-[rgb(var(--border))] p-3">
                    <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">{cluster.label}</h3>
                    <p className="mt-1 text-sm text-[rgb(var(--muted))]">{cluster.summary}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section data-testid="admin-region-suggestions" className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Vorschläge</p>
              <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">Anlassräume</h2>
              <div className="mt-4 space-y-3">
                {cockpit.suggestedAnlassraeume.slice(0, 4).map((suggestion) => (
                  <div key={suggestion.id} className="rounded-2xl border border-[rgb(var(--border))] p-3">
                    <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">{suggestion.title}</h3>
                    <p className="mt-1 text-sm text-[rgb(var(--muted))]">{suggestion.summary}</p>
                  </div>
                ))}
              </div>
            </article>
            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Vorschläge</p>
              <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">Dossiers und Rückfragen</h2>
              <div className="mt-4 space-y-3">
                {cockpit.suggestedDossiers.slice(0, 4).map((suggestion) => (
                  <div key={suggestion.id} className="rounded-2xl border border-[rgb(var(--border))] p-3">
                    <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">{suggestion.title}</h3>
                    <p className="mt-1 text-sm text-[rgb(var(--muted))]">{suggestion.summary}</p>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section data-testid="admin-region-modules" className="grid gap-4 lg:grid-cols-2">
            {Object.entries(cockpit.cockpit.modules).map(([key, module]) => (
              <article key={key} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">{key}</p>
                <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">{module.headline}</h2>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">{module.summary}</p>
              </article>
            ))}
          </section>
        </>
      ) : (
        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 text-sm text-[rgb(var(--muted))]">
          Noch keine Region gefunden.
        </section>
      )}
    </main>
  );
}
