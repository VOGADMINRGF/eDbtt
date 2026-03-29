import type { Metadata } from "next";
import Link from "next/link";
import { listRundenEntryItems, type RundenEntryItem } from "@features/topicRound/entrySource";
import { readSession } from "@/utils/session";

type SearchParamsShape =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

type RoundEntryView = "active" | "mine" | "results" | "organize";

export const metadata: Metadata = {
  title: "Anlässe - eDebatte",
  description: "Geführter Einstieg in laufende Anlässe, Beiträge und Ergebnisse.",
};

const VIEW_ORDER: RoundEntryView[] = ["active", "mine", "results", "organize"];

const VIEW_LABELS: Record<RoundEntryView, string> = {
  active: "Laufend",
  mine: "Meine Anlässe",
  results: "Ergebnisse",
  organize: "Verwalten",
};

const MANAGE_ROLES = new Set([
  "editor",
  "journalist",
  "redaktion",
  "moderator",
  "staff",
  "admin",
  "superadmin",
  "owner",
]);

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

function hasManageAccess(roles: string[]) {
  return roles.some((role) => MANAGE_ROLES.has(role));
}

function buildStartCards(existingHref: string | null) {
  return [
    {
      href: "/create?mode=source",
      title: "Anlass eröffnen",
      body: "Ein neues Thema mit klaren Schritten anlegen.",
      emphasize: true,
    },
    {
      href: existingHref ?? viewHref("active"),
      title: "Bestehenden Anlass öffnen",
      body: "Laufende Themen, Beiträge und Ergebnisse öffnen.",
      emphasize: false,
    },
    {
      href: viewHref("results"),
      title: "Ergebnisse ansehen",
      body: "Abgeschlossene Themen und Ergebnisse ansehen.",
      emphasize: false,
    },
  ] as const;
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
  const session = await readSession().catch(() => null);
  const isSignedIn = Boolean(session?.uid);
  const sessionRoles = (session?.roles ?? []).map((role) => String(role).toLowerCase());
  const canManage = hasManageAccess(sessionRoles);
  const viewOrder = canManage
    ? VIEW_ORDER
    : VIEW_ORDER.filter((entryView): entryView is Exclude<RoundEntryView, "organize"> => entryView !== "organize");

  const resolved = searchParams ? await searchParams : {};
  const requestedView = parseView(readStringParam(resolved?.view));
  const view: RoundEntryView =
    isSignedIn && viewOrder.includes(requestedView) ? requestedView : "active";
  const compat = readStringParam(resolved?.compat) === "demo_runden";

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
  const featuredEntryHref = featuredEntry?.entryHref ?? null;
  const remainingActiveEntries =
    featuredEntry === null
      ? visibleActiveEntries
      : visibleActiveEntries.filter((entry) => entry.id !== featuredEntry.id);
  const existingEntryHref = visibleActiveEntries.find((entry) => entry.entryHref)?.entryHref ?? featuredEntryHref;
  const startCards = buildStartCards(existingEntryHref ?? null);
  const legacyCount = entries.filter((entry) => entry.legacyIncomplete).length;

  return (
    <main className="mx-auto min-h-screen w-full max-w-[92rem] space-y-6 px-4 py-6 md:space-y-8 md:px-8 md:py-10 xl:px-10">
      <header className="relative overflow-hidden rounded-[2rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm md:p-6">
        <div className="pointer-events-none absolute -right-28 -top-24 h-72 w-72 rounded-full bg-[rgb(var(--grad-from))]/12 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-[rgb(var(--grad-to))]/10 blur-3xl" />

        <div className="relative space-y-4 md:space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[rgb(var(--muted))]">ANLÄSSE</p>

          <div className="space-y-2">
            <h1
              className="text-3xl font-semibold leading-tight md:text-4xl"
              style={{
                backgroundImage:
                  "linear-gradient(120deg,rgba(var(--fg),0.98) 0%,rgba(var(--grad-to),0.78) 92%)",
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              Dein Einstieg in jeden Anlass
            </h1>
            <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">
              Hier eröffnest du neue Anlässe, öffnest bestehende Themen und findest Ergebnisse.
            </p>
          </div>

          <section aria-label="Schneller Einstieg" className="grid gap-3 md:grid-cols-3">
            {startCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                aria-label={card.title}
                className={`group block h-full rounded-2xl border bg-[rgb(var(--bg))] p-4 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))] ${
                  card.emphasize
                    ? "border-[rgb(var(--grad-from))]/45"
                    : "border-[rgb(var(--border))]"
                }`}
              >
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">{card.title}</p>
                <p className="mt-1 text-xs text-[rgb(var(--muted))]">{card.body}</p>
                <p className="mt-3 text-xs font-semibold text-[rgb(var(--grad-from))] transition group-hover:text-[rgb(var(--grad-to))]">
                  Öffnen →
                </p>
              </Link>
            ))}
          </section>

          {!isSignedIn ? (
            <p className="text-xs text-[rgb(var(--muted))]">
              {activeEntries.length === 0
                ? "Noch keine laufenden Anlässe vorhanden. Eröffne jetzt deinen ersten Anlass."
                : "Laufende Anlässe und Ergebnisse kannst du direkt über die Karten öffnen."}
            </p>
          ) : (
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[rgb(var(--muted))]">
              <span>Gesamt: {entries.length}</span>
              <span>Laufend: {activeEntries.length}</span>
              <span>Unvollständige Einträge: {legacyCount}</span>
            </div>
          )}
        </div>
      </header>

      {isSignedIn ? (
        <section className="space-y-3">
          <p className="text-sm font-semibold text-[rgb(var(--fg))]">Ansicht</p>
          <nav aria-label="Rundenbereiche" className="overflow-x-auto pb-1">
            <div className="inline-flex min-w-full gap-1 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-1 sm:min-w-0">
              {viewOrder.map((entryView) => {
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
      ) : null}

      {compat ? (
        <section className="rounded-3xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
          Hinweis: Frühere Demo-Links führen jetzt direkt auf diese produktive Anlassseite.
        </section>
      ) : null}

      {sourceError ? (
        <section className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          Die Rundendaten sind gerade nicht verfügbar. Bitte versuche es später erneut.
        </section>
      ) : null}

      {!sourceError && isSignedIn && entries.length === 0 ? (
        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 text-sm text-[rgb(var(--muted))]">
          Noch keine Anlässe vorhanden. Eröffne jetzt deinen ersten <Link className="underline" href="/create?mode=source">Anlass</Link>.
        </section>
      ) : null}

      {isSignedIn && view === "active" && !sourceError && entries.length > 0 ? (
        <section id="aktive-runden" className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[rgb(var(--fg))]">
                {remainingActiveEntries.length > 0 ? "Weitere laufende Anlässe" : "Laufende Anlässe"}
              </h2>
              <p className="text-sm text-[rgb(var(--muted))]">Laufende Themen und Anlässe im Überblick.</p>
            </div>
            <Link href="/create?mode=source" className="btn-secondary w-full text-sm sm:w-auto">
              Beitrag einreichen
            </Link>
          </div>

          {featuredEntry ? (
            <article className="rounded-3xl border border-[rgb(var(--grad-from))]/35 bg-[rgb(var(--card))] p-5 shadow-sm">
              <div className="grid gap-4 lg:grid-cols-[1.45fr_0.9fr] lg:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Empfohlener Anlass</p>
                  <h3 className="mt-2 text-xl font-semibold text-[rgb(var(--fg))] md:text-2xl">{featuredEntry.title}</h3>
                  <p className="mt-2 text-sm text-[rgb(var(--muted))]">{shortSummary(featuredEntry.summary)}</p>
                  <p className="mt-3 text-xs text-[rgb(var(--muted))]">
                    {typeLabel(featuredEntry)} · Status {outputStatusLabel(featuredEntry)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                  <p className="text-xs text-[rgb(var(--muted))]">
                    review {reviewStateLabel(featuredEntry)} · update {formatDate(featuredEntry.updatedAt)}
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    {featuredEntry.legacyIncomplete
                      ? "Legacy-Incomplete Datensatz"
                      : "Produktiv normalisiert"}
                  </p>
                  {featuredEntryHref ? (
                    <Link href={featuredEntryHref} className="btn btn-primary mt-4 w-full text-sm">
                      Anlass öffnen
                    </Link>
                  ) : (
                    <p className="mt-4 text-xs text-[rgb(var(--muted))]">
                      Dieser Anlass ist aktuell nicht direkt verfügbar.
                    </p>
                  )}
                </div>
              </div>
            </article>
          ) : null}

          {remainingActiveEntries.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {remainingActiveEntries.map((entry) => {
                const entryHref = entry.entryHref;
                return (
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
                    {entryHref ? (
                      <Link href={entryHref} className="btn btn-primary mt-4 text-sm">
                        Anlass öffnen
                      </Link>
                    ) : (
                      <p className="mt-4 text-xs text-[rgb(var(--muted))]">
                        Der direkte Einstieg in diesen Anlass ist hier noch nicht verfügbar.
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          ) : null}
        </section>
      ) : null}

      {isSignedIn && view === "mine" && !sourceError ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-[rgb(var(--fg))]">Meine Anlässe</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
              <h3 className="text-base font-semibold text-[rgb(var(--fg))]">Beitrag einreichen</h3>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">Starte einen neuen Beitrag und bring dein Thema ein.</p>
              <Link href="/create?mode=manual" className="btn btn-primary mt-4 text-sm">
                Beitrag einreichen
              </Link>
            </article>
            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
              <h3 className="text-base font-semibold text-[rgb(var(--fg))]">Bestehenden Anlass öffnen</h3>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">Steig wieder in einen laufenden Anlass ein.</p>
              <Link
                href={featuredEntryHref ?? "/create?mode=source"}
                className="btn-secondary mt-4 inline-flex text-sm"
              >
                Bestehenden Anlass öffnen
              </Link>
            </article>
            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
              <h3 className="text-base font-semibold text-[rgb(var(--fg))]">Anlass eröffnen</h3>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">Bereite ein Thema mit Quellen und Struktur vor.</p>
              <Link href="/create?mode=source" className="btn-secondary mt-4 inline-flex text-sm">
                Anlass eröffnen
              </Link>
            </article>
          </div>
        </section>
      ) : null}

      {isSignedIn && view === "results" && !sourceError ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-[rgb(var(--fg))]">Ergebnisse & abgeschlossene Anlässe</h2>
          {closedEntries.length === 0 ? (
            <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 text-sm text-[rgb(var(--muted))]">
              Noch keine abgeschlossenen Anlässe vorhanden.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {closedEntries.map((entry) => {
                const entryHref = entry.entryHref;
                return (
                  <article key={`${entry.id}-results`} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <span className="vog-chip">{typeLabel(entry)}</span>
                      <span className="vog-chip vog-chip--status">{outputStatusLabel(entry)}</span>
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-[rgb(var(--fg))]">{entry.title}</h3>
                    <p className="mt-1 text-sm text-[rgb(var(--muted))]">{shortSummary(entry.summary)}</p>
                    <ul className="mt-4 space-y-1 text-sm text-[rgb(var(--muted))]">
                      <li>- Review: {reviewStateLabel(entry)}</li>
                      <li>- Herkunft: {sourceModeLabel(entry)}</li>
                      <li>- Zuletzt aktiv: {formatDate(entry.updatedAt)}</li>
                    </ul>
                    {entryHref ? (
                      <Link href={entryHref} className="btn-secondary mt-4 inline-flex text-sm">
                        Ergebnis ansehen
                      </Link>
                    ) : (
                      <p className="mt-4 text-xs text-[rgb(var(--muted))]">
                        Ergebnis für diesen Anlass aktuell nicht direkt verfügbar.
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {isSignedIn && canManage && view === "organize" && !sourceError ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-[rgb(var(--fg))]">Verwalten</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
              <h3 className="text-base font-semibold text-[rgb(var(--fg))]">Feed/Anlassraum Review</h3>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">Queue, Backfill und Governance-Review im Admin-Bereich.</p>
              <Link href="/admin/feeds/drafts" className="btn btn-primary mt-4 text-sm">
                Review öffnen
              </Link>
            </article>
            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
              <h3 className="text-base font-semibold text-[rgb(var(--fg))]">Output-Prep</h3>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">Rundenergebnisse pro Anlassraum manuell in den Status bringen.</p>
              <Link
                href={featuredEntry?.anlassraumId ? `/admin/feeds/anlassraum/${featuredEntry.anlassraumId}` : "/admin/feeds/anlassraum"}
                className="btn-secondary mt-4 inline-flex text-sm"
              >
                Anlassraum öffnen
              </Link>
            </article>
            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
              <h3 className="text-base font-semibold text-[rgb(var(--fg))]">Anlass vorbereiten</h3>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">Neuen Anlass mit dem Einreichungsassistenten starten.</p>
              <Link href="/create?mode=source" className="btn-secondary mt-4 inline-flex text-sm">
                Anlass vorbereiten
              </Link>
            </article>
          </div>
        </section>
      ) : null}
    </main>
  );
}
