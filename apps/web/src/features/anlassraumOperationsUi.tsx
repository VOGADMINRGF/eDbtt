import Link from "next/link";
import type {
  AnlassraumOperationsItem,
  AnlassraumOperationsQuery,
  AnlassraumOperationsResult,
  AnlassraumOperationsScopeFilter,
  AnlassraumOperationsStatusFilter,
} from "@/features/anlassraumOperationsRead";

type Props = {
  data: AnlassraumOperationsResult | null;
  loading: boolean;
  error: string | null;
  query: AnlassraumOperationsQuery;
  onQueryChange: (patch: Partial<AnlassraumOperationsQuery>) => void;
  onReload: () => void;
};

const STATUS_FILTERS: AnlassraumOperationsStatusFilter[] = [
  "all",
  "draft",
  "curated",
  "reviewed",
  "approved",
  "active",
  "archived",
  "auto_ingested",
  "auto_clustered",
  "needs_editor_review",
  "ready_for_round",
  "published",
];

const SCOPE_FILTERS: AnlassraumOperationsScopeFilter[] = ["all", "local", "regional", "national", "eu", "global"];

export function AnlassraumOperationsPanel({ data, loading, error, query, onQueryChange, onReload }: Props) {
  const items = data?.items ?? [];

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">Anlassraum Operations</h1>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Read-only Sicht auf Anlassraeume als operative Einheiten. Keine Mutation, kein Apply, keine Auto-Aktion.
        </p>
      </header>

      <div className="rounded-xl border border-sky-300/50 bg-sky-50/70 p-3 text-sm text-sky-900 dark:border-sky-400/40 dark:bg-sky-500/10 dark:text-sky-100">
        Read-only only. Diese Oberflaeche dient nur der operativen Sichtbarkeit und Navigation.
      </div>

      <section className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-semibold text-[rgb(var(--fg))]">
            Suche
            <input
              className="mt-1 block rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-1 text-xs text-[rgb(var(--fg))]"
              value={query.q}
              onChange={(event) => onQueryChange({ q: event.target.value, page: 1 })}
              placeholder="Titel / ID / Topic / Cluster / Region"
            />
          </label>

          <label className="text-xs font-semibold text-[rgb(var(--fg))]">
            Status
            <select
              className="mt-1 block rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-1 text-xs text-[rgb(var(--fg))]"
              value={query.status}
              onChange={(event) => onQueryChange({ status: event.target.value as AnlassraumOperationsStatusFilter, page: 1 })}
            >
              {STATUS_FILTERS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-semibold text-[rgb(var(--fg))]">
            Scope
            <select
              className="mt-1 block rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-1 text-xs text-[rgb(var(--fg))]"
              value={query.scope}
              onChange={(event) => onQueryChange({ scope: event.target.value as AnlassraumOperationsScopeFilter, page: 1 })}
            >
              {SCOPE_FILTERS.map((scope) => (
                <option key={scope} value={scope}>
                  {scope}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-semibold text-[rgb(var(--fg))]">
            Limit
            <input
              type="number"
              min={1}
              max={100}
              className="mt-1 block w-20 rounded-md border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2 py-1 text-xs text-[rgb(var(--fg))]"
              value={query.limit}
              onChange={(event) => onQueryChange({ limit: Number(event.target.value) || 1, page: 1 })}
            />
          </label>

          <button
            type="button"
            className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-xs font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
            onClick={onReload}
          >
            Neu laden
          </button>
        </div>
      </section>

      {loading ? <p className="text-sm text-[rgb(var(--muted))]">Anlassraeume werden geladen ...</p> : null}

      {error ? (
        <p className="rounded-md border border-rose-300/60 bg-rose-50/80 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/40 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </p>
      ) : null}

      {data ? (
        <section className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3 text-xs text-[rgb(var(--muted))]">
          <div className="flex flex-wrap items-center gap-3">
            <span>
              Ergebnisse: <strong className="text-[rgb(var(--fg))]">{data.total}</strong>
            </span>
            <span>
              Seite: <strong className="text-[rgb(var(--fg))]">{data.page}</strong>
            </span>
            <span>
              Scan: <strong className="text-[rgb(var(--fg))]">{data.scan.scanned}</strong> / sichtbar {" "}
              <strong className="text-[rgb(var(--fg))]">{data.scan.visible}</strong>
            </span>
          </div>
        </section>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <section className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 text-sm text-[rgb(var(--muted))]">
          Keine Anlassraeume fuer den aktuellen Filter gefunden.
        </section>
      ) : null}

      <section className="grid gap-3">
        {items.map((item) => (
          <AnlassraumOperationsCard key={item.id} item={item} />
        ))}
      </section>

      {data ? (
        <section className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={query.page <= 1}
            onClick={() => onQueryChange({ page: Math.max(1, query.page - 1) })}
            className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-xs font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Vorherige Seite
          </button>
          <button
            type="button"
            disabled={!data.hasMore}
            onClick={() => onQueryChange({ page: query.page + 1 })}
            className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-xs font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Naechste Seite
          </button>
        </section>
      ) : null}
    </section>
  );
}

function AnlassraumOperationsCard({ item }: { item: AnlassraumOperationsItem }) {
  return (
    <article className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[rgb(var(--fg))]">{item.title}</h2>
          <p className="mt-1 font-mono text-[11px] text-[rgb(var(--muted))]">
            {item.slug ?? "no-slug"} | {item.id}
          </p>
        </div>
        <div className="text-right text-xs text-[rgb(var(--muted))]">
          <p className="font-semibold text-[rgb(var(--fg))]">{item.status}</p>
          <p>{item.scope ?? "scope?"} / {item.decisionScope ?? "decisionScope?"}</p>
          <p>{item.sourceMode ?? "sourceMode?"}</p>
        </div>
      </header>

      <p className="mt-2 text-sm text-[rgb(var(--muted))]">{item.summary ?? "Keine Summary."}</p>

      <div className="mt-3 grid gap-2 text-xs text-[rgb(var(--muted))] sm:grid-cols-2 lg:grid-cols-4">
        <p>Region: <span className="text-[rgb(var(--fg))]">{item.regionKey ?? "--"}</span></p>
        <p>Topic: <span className="text-[rgb(var(--fg))]">{item.topicKey ?? "--"}</span></p>
        <p>Cluster: <span className="text-[rgb(var(--fg))]">{item.clusterKey ?? "--"}</span></p>
        <p>Dossier: <span className="text-[rgb(var(--fg))]">{item.dossierType ?? "--"}</span></p>
        <p>Sources: <span className="text-[rgb(var(--fg))]">{item.sourceCount}</span></p>
        <p>Outputs: <span className="text-[rgb(var(--fg))]">{item.outputCount}</span></p>
        <p>Public: <span className="text-[rgb(var(--fg))]">{item.isPublic ? "ja" : "nein"}</span></p>
        <p>Relevance: <span className="text-[rgb(var(--fg))]">{item.relevanceScore ?? "--"}</span></p>
        <p>Created: <span className="text-[rgb(var(--fg))]">{formatIso(item.createdAt)}</span></p>
        <p>Updated: <span className="text-[rgb(var(--fg))]">{formatIso(item.updatedAt)}</span></p>
      </div>

      <div className="mt-3 text-xs text-[rgb(var(--muted))]">
        <p className="font-semibold text-[rgb(var(--fg))]">Operative Hinweise</p>
        <p>{item.operationalHints.length > 0 ? item.operationalHints.join(", ") : "keine"}</p>
      </div>

      <div className="mt-3 text-xs text-[rgb(var(--muted))]">
        <p className="font-semibold text-[rgb(var(--fg))]">Output-Typen</p>
        <p>{item.outputTypes.length > 0 ? item.outputTypes.join(", ") : "keine"}</p>
      </div>

      <div className="mt-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3 text-xs text-[rgb(var(--muted))]">
        <p className="font-semibold text-[rgb(var(--fg))]">Feed-/Cluster-Kontext</p>
        <p>
          Linked Drafts: <span className="text-[rgb(var(--fg))]">{item.feedContext.linkedDraftCount}</span>{" "}
          (queued {item.feedContext.queuedDraftCount}, weak-signal {item.feedContext.weakSignalDraftCount})
        </p>
        <p>
          Letzter Draft: <span className="text-[rgb(var(--fg))]">{formatIso(item.feedContext.latestDraftCreatedAt)}</span>
        </p>
        <p>
          Cluster: <span className="text-[rgb(var(--fg))]">{item.clusterContext.clusterKey ?? "--"}</span> · peers{" "}
          <span className="text-[rgb(var(--fg))]">{item.clusterContext.peerRoomCount}</span>
        </p>
        <p>
          Cluster Candidate: <span className="text-[rgb(var(--fg))]">{item.clusterContext.candidateStatus ?? "--"}</span> · drafts{" "}
          {item.clusterContext.candidateDraftCount} · updated {formatIso(item.clusterContext.candidateUpdatedAt)}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold">
        <Link href={item.links.detailAdmin} className="text-sky-700 hover:underline">
          Admin-Detail
        </Link>
        <Link href={item.links.createContext} className="text-sky-700 hover:underline">
          Create-Kontext
        </Link>
        <Link href={item.links.attachQueue} className="text-sky-700 hover:underline">
          Attach Queue
        </Link>
        <Link href={item.links.feedDrafts} className="text-sky-700 hover:underline">
          Feed-Drafts
        </Link>
        <Link href={item.links.feedInputRooms} className="text-sky-700 hover:underline">
          Feed-Input Rooms
        </Link>
        <Link href={item.links.feedClusterRooms} className="text-sky-700 hover:underline">
          Cluster-Rooms
        </Link>
        <Link href={item.links.clusterControl} className="text-sky-700 hover:underline">
          Cluster-Control
        </Link>
        <Link href={item.links.detailJson} className="text-sky-700 hover:underline">
          Feed/History JSON
        </Link>
        {item.links.dossierAdmin ? (
          <Link href={item.links.dossierAdmin} className="text-sky-700 hover:underline">
            Dossier-Admin
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function formatIso(value: string | null): string {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toISOString().slice(0, 19).replace("T", " ") + "Z";
}
