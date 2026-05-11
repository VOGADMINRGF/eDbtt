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

export default async function AdminRegionPage({
  searchParams,
}: {
  searchParams?: SearchParamsShape;
}) {
  const resolved = searchParams ? await searchParams : {};
  const regions = await listOperationalRegions();
  const selectedRegionId = firstParam(resolved.regionId) ?? regions[0]?.id ?? null;
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
          Die Surface kombiniert offizielles Verwaltungsdirectory, regionales Akteursregister und review-first
          Signalsicht. Keine automatische politische Zuordnung, kein Auto-Publish, kein Auto-Mandat.
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
              href={`/admin/region?regionId=${encodeURIComponent(region.id)}`}
              className={`rounded-full border px-3 py-1 text-xs ${
                region.id === selectedRegionId
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
          <section
            data-testid="admin-region-summary"
            className="grid gap-3 md:grid-cols-4"
          >
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
              <p className="text-sm text-[rgb(var(--muted))]">{cockpit.pendingSignalCount} warten auf erste Sichtung</p>
            </div>
            <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Directory-Strukturen</p>
              <p className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">
                {cockpit.directoryStructureBreakdown.length}
              </p>
              <p className="text-sm text-[rgb(var(--muted))]">Verwaltungstypen für Verortung und Anlassraum-Kontext</p>
            </div>
          </section>

          <section
            data-testid="admin-region-modules"
            className="grid gap-4 lg:grid-cols-2"
          >
            {Object.entries(cockpit.cockpit.modules).map(([key, module]) => (
              <article
                key={key}
                className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5"
              >
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
