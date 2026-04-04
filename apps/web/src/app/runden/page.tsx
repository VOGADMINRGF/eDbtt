import type { Metadata } from "next";
import Link from "next/link";
import {
  listRundenEntryItems,
  type RundenEntryItem,
} from "@features/topicRound/entrySource";
import { readSession } from "@/utils/session";
import RundenShareActions from "./RundenShareActions";

export const metadata: Metadata = {
  title: "Anlässe - eDebatte",
  description: "Geführter Einstieg in laufende Anlässe, Beiträge und Ergebnisse.",
};

type RoundEntryView = "active" | "mine" | "results" | "organize";

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

function readStringParam(val?: string | string[]): string | undefined {
  return Array.isArray(val) ? val[0] : val;
}

function parseView(val?: string): RoundEntryView {
  if (val === "mine" || val === "results" || val === "organize") return val;
  return "active";
}

function viewHref(view: RoundEntryView): string {
  return `/runden?view=${view}`;
}

function hasManageAccess(roles: string[]): boolean {
  return roles.some((role) => MANAGE_ROLES.has(role));
}

function formatDate(value?: string | Date | null): string {
  if (!value) return "–";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "–";

  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function buildStartCards(existingHref: string | null) {
  return [
    {
      href: "/create?mode=source",
      title: "Neu starten in /create",
      body: "Intake, Analyse und Routing für neue Anlässe.",
      emphasize: true,
    },
    {
      href: existingHref ?? viewHref("active"),
      title: "Laufendes in /runden",
      body: "Aktive Runden führen, verfolgen und fortsetzen.",
      emphasize: false,
    },
    {
      href: viewHref("results"),
      title: "Ergebnisse ansehen",
      body: "Abgeschlossene Anlässe und Ergebnisse öffnen.",
      emphasize: false,
    },
  ] as const;
}

export default async function RundenPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};

  const session = await readSession().catch(() => null);
  const isSignedIn = Boolean(session?.uid);
  const sessionRoles = (session?.roles ?? []).map((role) =>
    String(role).toLowerCase(),
  );
  const canManage = hasManageAccess(sessionRoles);

  const signedInViewOrder = canManage
    ? VIEW_ORDER
    : VIEW_ORDER.filter((view) => view !== "organize");

  const requestedView = parseView(readStringParam(resolvedSearchParams.view));
  const view: RoundEntryView =
    isSignedIn && signedInViewOrder.includes(requestedView)
      ? requestedView
      : "active";

  const compat = readStringParam(resolvedSearchParams.compat) === "demo_runden";

  let entries: RundenEntryItem[] = [];
  let sourceError: string | null = null;

  try {
    entries = await listRundenEntryItems({ limit: 80 });
  } catch {
    sourceError = "round_entry_source_unavailable";
  }

  const activeEntries = entries.filter((entry) => entry.lifecycle === "active");
  const closedEntries = entries.filter((entry) => entry.lifecycle === "closed");

  const featured = activeEntries[0] ?? null;
  const remainingActive = featured
    ? activeEntries.filter((entry) => entry.id !== featured.id)
    : activeEntries;

  const existingHref =
    activeEntries.find((entry) => entry.operatingHref)?.operatingHref ??
    activeEntries.find((entry) => entry.entryHref)?.entryHref ??
    featured?.operatingHref ??
    featured?.entryHref ??
    null;

  const startCards = buildStartCards(existingHref);
  const legacyCount = entries.filter((entry) => entry.legacyIncomplete).length;

  return (
    <main className="mx-auto min-h-screen w-full max-w-[92rem] space-y-6 px-4 py-6 md:px-8 md:py-10 lg:px-10">
      <header className="relative overflow-hidden rounded-2xl border bg-[rgb(var(--card))] p-5 shadow-sm md:p-6">
        <div className="pointer-events-none absolute -right-28 -top-24 h-72 w-72 rounded-full bg-[rgb(var(--grad-from))]/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-[rgb(var(--grad-to))]/10 blur-3xl" />

        <div className="relative space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
            ANLÄSSE
          </p>

          <div className="space-y-2">
            <h1
              className="text-3xl font-semibold leading-tight md:text-4xl"
              style={{
                backgroundImage: `linear-gradient(120deg,
                  rgba(var(--fg),0.98) 0%,
                  rgba(var(--grad-to),0.82) 92%)`,
                WebkitBackgroundClip: "text",
                color: "transparent",
              }}
            >
              /create startet, /runden führt laufende Arbeit
            </h1>

            <p className="max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
              Nutze <span className="font-semibold text-[rgb(var(--fg))]">/create</span> für
              neue Starts mit Analyse und Routing. Nutze{" "}
              <span className="font-semibold text-[rgb(var(--fg))]">/runden</span> für
              laufende Statusführung, Weiterarbeit und Ergebnisse.
            </p>
          </div>

          <section
            aria-label="Schneller Einstieg"
            className="grid gap-3 md:grid-cols-3"
          >
            {startCards.map((card) => (
              <Link
                key={card.title}
                href={card.href}
                aria-label={card.title}
                className={
                  "group block h-full rounded-xl border bg-[rgb(var(--bg))] p-4 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))] " +
                  (card.emphasize
                    ? "border-[rgb(var(--grad-from))]/45"
                    : "border-[rgb(var(--border))]")
                }
              >
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">
                  {card.title}
                </p>
                <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">
                  {card.body}
                </p>
                <p className="mt-3 text-xs font-semibold text-[rgb(var(--grad-from))] transition group-hover:text-[rgb(var(--grad-to))]">
                  Öffnen →
                </p>
              </Link>
            ))}
          </section>

          {!isSignedIn ? (
            <p className="text-xs text-[rgb(var(--muted))]">
              {activeEntries.length === 0
                ? "Aktuell sind noch keine laufenden Anlässe sichtbar."
                : `${activeEntries.length} laufende Anlässe sind aktuell verfügbar.`}
            </p>
          ) : (
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[rgb(var(--muted))]">
              <span>Gesamt: {entries.length}</span>
              <span>Laufend: {activeEntries.length}</span>
              <span>Abgeschlossen: {closedEntries.length}</span>
              <span>Offener Altstand: {legacyCount}</span>
            </div>
          )}
        </div>
      </header>

      {isSignedIn && (
        <section className="space-y-3">
          <p className="text-sm font-semibold text-[rgb(var(--fg))]">Ansicht</p>

          <nav aria-label="Rundenbereiche" className="overflow-x-auto pb-1">
            <div className="inline-flex min-w-full gap-1 rounded-lg border bg-[rgb(var(--card))] p-1">
              {signedInViewOrder.map((entryView) => {
                const isActive = view === entryView;

                return (
                  <Link
                    key={entryView}
                    href={viewHref(entryView)}
                    aria-current={isActive ? "page" : undefined}
                    className={
                      "flex-1 whitespace-nowrap rounded-lg px-4 py-2.5 text-center text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))] " +
                      (isActive
                        ? "bg-[rgb(var(--bg))] text-[rgb(var(--fg))] shadow-sm"
                        : "text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]")
                    }
                  >
                    {VIEW_LABELS[entryView]}
                  </Link>
                );
              })}
            </div>
          </nav>
        </section>
      )}

      {compat && (
        <section className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800">
          Hinweis: Ein früherer Demo-Link führt jetzt auf die aktuelle
          Anlassseite.
        </section>
      )}

      {sourceError && (
        <section className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800">
          Die Anlassdaten sind gerade nicht verfügbar. Bitte versuche es später
          erneut.
        </section>
      )}

      {!sourceError && entries.length === 0 && (
        <section className="rounded-2xl border bg-[rgb(var(--card))] p-6 text-sm text-[rgb(var(--muted))]">
          <p>Noch keine Anlässe vorhanden.</p>
          <Link
            href="/create?mode=source"
            className="mt-3 inline-block font-semibold text-[rgb(var(--grad-from))] hover:text-[rgb(var(--grad-to))]"
          >
            Jetzt ersten Anlass eröffnen →
          </Link>
        </section>
      )}

      {!sourceError && view === "active" && entries.length > 0 && (
        <section id="aktive-runden" className="space-y-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[rgb(var(--fg))]">
                Laufende Anlässe
              </h2>
              <p className="text-sm text-[rgb(var(--muted))]">
                Runde = laufender Prozesskontext. Anlassraum bleibt der offene
                Kontext, Dossier der größere Zusammenhangsraum.
              </p>
            </div>

            <Link
              href="/create?mode=source"
              className="inline-flex w-full items-center justify-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] transition hover:bg-[rgb(var(--bg))] sm:w-auto"
            >
              Neu in /create starten
            </Link>
          </div>

          {activeEntries.length === 0 ? (
            <div className="rounded-2xl border bg-[rgb(var(--card))] p-5 text-sm text-[rgb(var(--muted))]">
              Aktuell sind keine laufenden Anlässe vorhanden.
            </div>
          ) : (
            <>
              {featured && (
                <article className="rounded-2xl border border-[rgb(var(--grad-from))]/40 bg-[rgb(var(--card))] p-5 shadow-sm">
                  <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                        Empfohlener Anlass
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-[rgb(var(--fg))] md:text-2xl">
                        {featured.title}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">
                        Öffne den Anlass, um Beiträge, Verlauf und aktuellen
                        Stand zu sehen.
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[rgb(var(--muted))]">
                        Eröffnet: {formatDate(featured.createdAt)}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={
                      featured.operatingHref ??
                      featured.entryHref ??
                      featured.intakeHref ??
                      "/runden"
                    }
                    className="mt-4 block w-full rounded-md bg-[rgb(var(--grad-from))] px-4 py-2 text-center text-sm font-semibold text-white shadow transition hover:opacity-90"
                  >
                    Runde öffnen
                  </Link>

                  {featured.intakeHref ? (
                    <Link
                      href={featured.intakeHref}
                      className="mt-2 block w-full text-center text-xs font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
                    >
                      In /create weiter vorbereiten
                    </Link>
                  ) : null}

                  {featured.shareActions ? (
                    <RundenShareActions share={featured.shareActions} />
                  ) : null}
                </article>
              )}

              {remainingActive.length > 0 && (
                <div className="grid gap-4 lg:grid-cols-2">
                  {remainingActive.map((entry) => (
                    <article
                      key={entry.id}
                      className="rounded-2xl border bg-[rgb(var(--card))] p-5 shadow-sm"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                        <span>Eröffnet: {formatDate(entry.createdAt)}</span>
                        {entry.legacyIncomplete ? (
                          <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                            Altstand offen
                          </span>
                        ) : null}
                      </div>

                      <h3 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">
                        {entry.title}
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">
                        Anlass öffnen, um Beiträge und aktuellen Stand
                        einzusehen.
                      </p>

                      <Link
                        href={
                          entry.operatingHref ??
                          entry.entryHref ??
                          entry.intakeHref ??
                          "/runden"
                        }
                        className="mt-3 inline-block text-sm font-semibold text-[rgb(var(--grad-from))] hover:text-[rgb(var(--grad-to))]"
                      >
                        Runde öffnen →
                      </Link>

                      {entry.intakeHref ? (
                        <Link
                          href={entry.intakeHref}
                          className="ml-4 mt-3 inline-block text-xs font-semibold text-[rgb(var(--muted))] hover:text-[rgb(var(--fg))]"
                        >
                          in /create fortführen
                        </Link>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      )}

      {!sourceError && isSignedIn && view === "mine" && (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-[rgb(var(--fg))]">
              Meine Anlässe
            </h2>
            <p className="text-sm text-[rgb(var(--muted))]">
              Für persönliche Zuständigkeit und Follow-up. Die Quelle liefert
              derzeit noch keine getrennte persönliche Zuordnung.
            </p>
          </div>

          <div className="rounded-2xl border bg-[rgb(var(--card))] p-5 text-sm text-[rgb(var(--muted))]">
            Sobald persönliche Anlass-Zuordnungen im Entry-Contract verfügbar
            sind, kann diese Ansicht hier sauber differenziert werden.
          </div>
        </section>
      )}

      {!sourceError && isSignedIn && view === "results" && (
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-[rgb(var(--fg))]">
              Ergebnisse
            </h2>
            <p className="text-sm text-[rgb(var(--muted))]">
              Abgeschlossene Anlässe und ihre Verläufe.
            </p>
          </div>

          {closedEntries.length === 0 ? (
            <div className="rounded-2xl border bg-[rgb(var(--card))] p-5 text-sm text-[rgb(var(--muted))]">
              Noch keine abgeschlossenen Anlässe vorhanden.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {closedEntries.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-2xl border bg-[rgb(var(--card))] p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-3 text-xs text-[rgb(var(--muted))]">
                    <span>Eröffnet: {formatDate(entry.createdAt)}</span>
                    <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
                      Abgeschlossen
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Abschluss: {formatDate(entry.finishedAt)}
                  </p>

                  <h3 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">
                    {entry.title}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-[rgb(var(--muted))]">
                    Anlass öffnen, um Verlauf und Abschlussstand anzusehen.
                  </p>

                  <Link
                    href={
                      entry.resultsHref ??
                      entry.operatingHref ??
                      entry.entryHref ??
                      "/runden"
                    }
                    className="mt-3 inline-block text-sm font-semibold text-[rgb(var(--grad-from))] hover:text-[rgb(var(--grad-to))]"
                  >
                    Ergebnis öffnen →
                  </Link>

                  {entry.shareActions ? (
                    <RundenShareActions share={entry.shareActions} />
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {!sourceError && isSignedIn && canManage && view === "organize" && (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-[rgb(var(--fg))]">
              Verwalten
            </h2>
            <p className="text-sm text-[rgb(var(--muted))]">
              Bereich für Governance-, Moderations- und Follow-up-Arbeit an
              laufenden Runden.
            </p>
          </div>

          <div className="rounded-2xl border bg-[rgb(var(--card))] p-5 text-sm text-[rgb(var(--muted))]">
            Diese Verwaltungsansicht kann hier im nächsten Schritt mit echten
            Operator- oder Moderationsaktionen ergänzt werden.
          </div>
        </section>
      )}
    </main>
  );
}
