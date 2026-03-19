import type { Metadata } from "next";
import Link from "next/link";
import { listRundenEntryItems, type RundenEntryItem } from "@features/topicRound/entrySource";

type SearchParamsShape =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

type RoundEntryView = "active" | "mine" | "results" | "organize";

export const metadata: Metadata = {
  title: "Runden - eDebatte",
  description: "Gefuehrter Einstieg in aktive Runden, Ergebnisse und Organisation.",
};

const VIEW_ORDER: RoundEntryView[] = ["active", "mine", "results", "organize"];

const VIEW_LABELS: Record<RoundEntryView, string> = {
  active: "Aktiv",
  mine: "Meine",
  results: "Ergebnisse",
  organize: "Organisieren",
};

function readStringParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseView(value?: string): RoundEntryView {
  if (value === "mine" || value === "results" || value === "organize") return value;
  return "active";
}

function viewHref(view: RoundEntryView) {
  return `/runden?view=${view}`;
}

function shortSummary(text: string) {
  const clean = text.trim();
  if (!clean) return "";
  const firstSentence = clean.split(/[.!?]/)[0]?.trim() ?? clean;
  if (firstSentence.length <= 160) return firstSentence;
  return `${firstSentence.slice(0, 157).trimEnd()}...`;
}

function formatDate(iso: string | null) {
  if (!iso) return "-";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function outputStatusLabel(item: RundenEntryItem) {
  if (item.outputStatus === "queued") return "queued";
  if (item.outputStatus === "review") return "in review";
  if (item.outputStatus === "ready") return "ready";
  if (item.outputStatus === "published") return "published";
  if (item.outputStatus === "discarded") return "discarded";
  return "draft";
}

function reviewStateLabel(item: RundenEntryItem) {
  if (item.reviewState === "approved") return "approved";
  if (item.reviewState === "rejected") return "rejected";
  return "pending";
}

function typeLabel(item: RundenEntryItem) {
  if (item.anlassraumType === "event") return "Event";
  if (item.anlassraumType === "policy") return "Policy";
  if (item.anlassraumType === "conflict") return "Konflikt";
  if (item.anlassraumType === "investigation") return "Investigation";
  if (item.anlassraumType === "proposal") return "Proposal";
  if (item.anlassraumType === "crisis") return "Krise";
  if (item.anlassraumType === "community_project") return "Community";
  if (item.anlassraumType === "funding_case") return "Funding";
  if (item.anlassraumType === "monitoring") return "Monitoring";
  return "Anlassraum";
}

function sourceModeLabel(item: RundenEntryItem) {
  if (item.sourceMode === "ai_assist") return "ai_assist";
  if (item.sourceMode === "cluster") return "cluster";
  if (item.sourceMode === "single_source") return "single_source";
  if (item.sourceMode === "feed") return "feed";
  if (item.sourceMode === "manual") return "manual";
  return "unknown";
}

export default async function RundenPage({
  searchParams,
}: {
  searchParams?: SearchParamsShape;
}) {
  const resolved = searchParams ? await searchParams : {};
  const view = parseView(readStringParam(resolved?.view));

  let entries: RundenEntryItem[] = [];
  let sourceError: string | null = null;

  try {
    entries = await listRundenEntryItems({ limit: 80 });
  } catch {
    sourceError = "round_entry_source_unavailable";
  }

  const activeEntries = entries.filter((entry) => entry.lifecycle === "active");
  const closedEntries = entries.filter((entry) => entry.lifecycle === "closed");
  const visibleActiveEntries = activeEntries.length > 0 ? activeEntries : entries.slice(0, 3);
  const featuredEntry = visibleActiveEntries[0] ?? null;
  const remainingActiveEntries =
    featuredEntry === null
      ? visibleActiveEntries
      : visibleActiveEntries.filter((entry) => entry.id !== featuredEntry.id);
  const legacyCount = entries.filter((entry) => entry.legacyIncomplete).length;

  return (
    <main className="mx-auto min-h-screen w-full max-w-[92rem] space-y-8 px-4 py-6 md:space-y-10 md:px-8 md:py-10 xl:px-10">
      <header className="relative overflow-hidden rounded-[2rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm md:p-8">
        <div className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full bg-[rgb(var(--grad-from))]/18 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-52 w-52 rounded-full bg-[rgb(var(--grad-to))]/14 blur-3xl" />

        <div className="relative space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">Runden</p>

          <div className="grid gap-5 lg:grid-cols-[1.35fr_0.9fr] lg:items-end">
            <div className="space-y-3">
              <h1
                className="text-3xl font-semibold leading-tight md:text-4xl"
                style={{
                  backgroundImage: "linear-gradient(120deg,var(--brand-cyan),var(--brand-blue))",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                }}
              >
                Dein Einstieg in produktive Runden
              </h1>
              <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">
                Diese Entry-Surface liest direkt aus produktiven Output-Seeds und nutzt keinen statischen Demo-Seed-Fallback.
              </p>
            </div>

            <div className="rounded-2xl border border-[rgb(var(--grad-from))]/35 bg-[rgb(var(--bg))]/85 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Empfohlener Start</p>
              <p className="mt-2 text-sm text-[rgb(var(--fg))]">
                {featuredEntry ? featuredEntry.title : "Neue Runde ueber /create vorbereiten"}
              </p>
              <Link href={featuredEntry?.entryHref ?? "/create?mode=source"} className="btn btn-primary mt-4 w-full text-sm">
                Jetzt einsteigen
              </Link>
            </div>
          </div>

          <section aria-label="Schneller Einstieg" className="grid gap-3 md:grid-cols-3">
            <Link
              href="/create?mode=source"
              className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))]"
            >
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">Neue Runde starten</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">Einreichung manuell, aus Quelle oder KI-gestuetzt starten.</p>
            </Link>

            <Link
              href={viewHref("active")}
              className="rounded-2xl border border-[rgb(var(--grad-from))]/50 bg-[rgb(var(--bg))] p-4 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))]"
            >
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">In aktive Runde</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">Laufende Round-Seeds mit einem Klick oeffnen.</p>
            </Link>

            <Link
              href={viewHref("results")}
              className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))]"
            >
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">Ergebnisse ansehen</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">Abgeschlossene Seeds ohne Demo-Fallback vergleichen.</p>
            </Link>
          </section>

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[rgb(var(--muted))]">
            <span>Gesamt: {entries.length}</span>
            <span>Aktiv: {activeEntries.length}</span>
            <span>Legacy-Luecken: {legacyCount}</span>
          </div>
        </div>
      </header>

      <section className="space-y-3">
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">Ansicht</p>
        <nav aria-label="Rundenbereiche" className="overflow-x-auto pb-1">
          <div className="inline-flex min-w-full gap-1 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-1 sm:min-w-0">
            {VIEW_ORDER.map((entryView) => {
              const active = view === entryView;
              return (
                <Link
                  key={entryView}
                  href={viewHref(entryView)}
                  aria-current={active ? "page" : undefined}
                  className={`flex-1 whitespace-nowrap rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))] ${
                    active
                      ? "bg-[rgb(var(--bg))] text-[rgb(var(--fg))] shadow-sm"
                      : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
                  }`}
                >
                  {VIEW_LABELS[entryView]}
                </Link>
              );
            })}
          </div>
        </nav>
      </section>

      {sourceError ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          Produktive Quelle derzeit nicht verfuegbar (`{sourceError}`). Es wird bewusst kein statischer Seed-Datensatz als Fallback angezeigt.
        </section>
      ) : null}

      {!sourceError && entries.length === 0 ? (
        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 text-sm text-[rgb(var(--muted))]">
          Noch keine produktiven Runden vorhanden. Starte eine neue Einreichung ueber <Link className="underline" href="/create?mode=source">/create</Link>.
        </section>
      ) : null}

      {view === "active" && !sourceError && entries.length > 0 ? (
        <section id="aktive-runden" className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[rgb(var(--fg))]">
                {remainingActiveEntries.length > 0 ? "Weitere aktive Runden" : "Aktive Runden"}
              </h2>
              <p className="text-sm text-[rgb(var(--muted))]">Produktive Quelle: `output_seed` + `anlassraum`.</p>
            </div>
            <Link href="/create?mode=source" className="btn-secondary w-full text-sm sm:w-auto">
              Neue Runde vorbereiten
            </Link>
          </div>

          {featuredEntry ? (
            <article className="rounded-3xl border border-[rgb(var(--grad-from))]/35 bg-[rgb(var(--card))] p-5 shadow-sm">
              <div className="grid gap-4 lg:grid-cols-[1.45fr_0.9fr] lg:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Empfohlene Runde</p>
                  <h3 className="mt-2 text-xl font-semibold text-[rgb(var(--fg))] md:text-2xl">{featuredEntry.title}</h3>
                  <p className="mt-2 text-sm text-[rgb(var(--muted))]">{shortSummary(featuredEntry.summary)}</p>
                  <p className="mt-3 text-xs text-[rgb(var(--muted))]">
                    {typeLabel(featuredEntry)} · {sourceModeLabel(featuredEntry)} · status {outputStatusLabel(featuredEntry)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                  <p className="text-xs text-[rgb(var(--muted))]">
                    review {reviewStateLabel(featuredEntry)} · update {formatDate(featuredEntry.updatedAt)}
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">{featuredEntry.legacyIncomplete ? "Legacy-Incomplete Datensatz" : "Produktiv normalisiert"}</p>
                  <Link href={featuredEntry.entryHref} className="btn btn-primary mt-4 w-full text-sm">
                    Runde oeffnen
                  </Link>
                </div>
              </div>
            </article>
          ) : null}

          {remainingActiveEntries.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {remainingActiveEntries.map((entry) => (
                <article key={entry.id} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                    <span className="vog-chip">{typeLabel(entry)}</span>
                    <span className="vog-chip vog-chip--status">{outputStatusLabel(entry)}</span>
                  </div>

                  <h3 className="mt-3 text-lg font-semibold text-[rgb(var(--fg))]">{entry.title}</h3>
                  <p className="mt-2 text-sm text-[rgb(var(--muted))]">{shortSummary(entry.summary)}</p>
                  <p className="mt-3 text-xs text-[rgb(var(--muted))]">
                    review {reviewStateLabel(entry)} · update {formatDate(entry.updatedAt)}
                  </p>

                  <Link href={entry.entryHref} className="btn btn-primary mt-4 text-sm">
                    Runde oeffnen
                  </Link>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      {view === "mine" && !sourceError ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-[rgb(var(--fg))]">Meine naechsten Schritte</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
              <h3 className="text-base font-semibold text-[rgb(var(--fg))]">Direkt mitreden</h3>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">Starte einen neuen Beitrag ueber den zentralen Setup-Dialog.</p>
              <Link href="/create?mode=manual" className="btn btn-primary mt-4 text-sm">
                Beitrag starten
              </Link>
            </article>
            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
              <h3 className="text-base font-semibold text-[rgb(var(--fg))]">Runde wieder aufnehmen</h3>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">Steig wieder in eine aktive produktive Runde ein.</p>
              <Link href={featuredEntry?.entryHref ?? "/create?mode=source"} className="btn-secondary mt-4 inline-flex text-sm">
                Runde oeffnen
              </Link>
            </article>
            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
              <h3 className="text-base font-semibold text-[rgb(var(--fg))]">Kontext vertiefen</h3>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">Arbeite mit Quellen-Setup und Anlassraum-Verknuepfung weiter.</p>
              <Link href="/create?mode=source" className="btn-secondary mt-4 inline-flex text-sm">
                Zu /create
              </Link>
            </article>
          </div>
        </section>
      ) : null}

      {view === "results" && !sourceError ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-[rgb(var(--fg))]">Ergebnisse & vergangene Runden</h2>
          {closedEntries.length === 0 ? (
            <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 text-sm text-[rgb(var(--muted))]">
              Noch keine abgeschlossenen produktiven Runden vorhanden.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {closedEntries.map((entry) => (
                <article key={`${entry.id}-results`} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="vog-chip">{typeLabel(entry)}</span>
                    <span className="vog-chip vog-chip--status">{outputStatusLabel(entry)}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-semibold text-[rgb(var(--fg))]">{entry.title}</h3>
                  <p className="mt-1 text-sm text-[rgb(var(--muted))]">{shortSummary(entry.summary)}</p>
                  <ul className="mt-4 space-y-1 text-sm text-[rgb(var(--muted))]">
                    <li>- Review: {reviewStateLabel(entry)}</li>
                    <li>- Quelle: {sourceModeLabel(entry)}</li>
                    <li>- Zuletzt aktiv: {formatDate(entry.updatedAt)}</li>
                  </ul>
                  <Link href={entry.entryHref} className="btn-secondary mt-4 inline-flex text-sm">
                    Ergebnis ansehen
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {view === "organize" && !sourceError ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-[rgb(var(--fg))]">Organisieren</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
              <h3 className="text-base font-semibold text-[rgb(var(--fg))]">Feed/Anlassraum Review</h3>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">Queue, Backfill und Governance-Review im Admin-Bereich.</p>
              <Link href="/admin/feeds/drafts" className="btn btn-primary mt-4 text-sm">
                Review oeffnen
              </Link>
            </article>
            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
              <h3 className="text-base font-semibold text-[rgb(var(--fg))]">Output-Prep</h3>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">Round-Seed-Outputs pro Anlassraum manuell in den Status bringen.</p>
              <Link
                href={featuredEntry?.anlassraumId ? `/admin/feeds/anlassraum/${featuredEntry.anlassraumId}` : "/admin/feeds/anlassraum"}
                className="btn-secondary mt-4 inline-flex text-sm"
              >
                Anlassraum oeffnen
              </Link>
            </article>
            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
              <h3 className="text-base font-semibold text-[rgb(var(--fg))]">Neue Runde vorbereiten</h3>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">Setup fuer neue Runde im kanonischen Create-Flow starten.</p>
              <Link href="/create?mode=source" className="btn-secondary mt-4 inline-flex text-sm">
                Zu /create
              </Link>
            </article>
          </div>
        </section>
      ) : null}
    </main>
  );
}
