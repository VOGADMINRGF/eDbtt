import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  listCompanionContextsByTopicSlug,
  listRoundsByTopicSlug,
  listTopics,
} from "@features/topicRound";

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

function roundTypeLabel(type: string) {
  if (type === "event") return "Event";
  if (type === "livestream") return "Livestream";
  if (type === "video") return "Video";
  if (type === "article") return "Artikel";
  if (type === "podcast") return "Podcast";
  if (type === "session") return "Session";
  return "Offene Runde";
}

function roundSourceParam(type: string) {
  if (type === "article") return "article";
  if (type === "video") return "video";
  if (type === "podcast") return "podcast";
  if (type === "session") return "session";
  if (type === "event") return "event";
  if (type === "livestream") return "livestream";
  return "session";
}

function shortSummary(text: string) {
  const clean = text.trim();
  if (!clean) return "";
  const firstSentence = clean.split(/[.!?]/)[0]?.trim() ?? clean;
  if (firstSentence.length <= 140) return firstSentence;
  return `${firstSentence.slice(0, 137).trimEnd()}...`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function summaryCountLabel(value: number, singular: string, plural: string) {
  return `${value} ${value === 1 ? singular : plural}`;
}

function roundRelevanceLabel(contributions: number, openPoints: number) {
  if (openPoints > 0) {
    return `${summaryCountLabel(openPoints, "offene Frage", "offene Fragen")} brauchen noch klares Feedback.`;
  }
  if (contributions >= 3) {
    return `${summaryCountLabel(contributions, "aktueller Beitrag", "aktuelle Beitraege")} geben dir schnellen Kontext.`;
  }
  return "Guter Einstieg, um den aktuellen Stand mit einem Klick zu verstehen.";
}

function viewHref(view: RoundEntryView) {
  return `/runden?view=${view}`;
}

export default async function RundenPage({
  searchParams,
}: {
  searchParams?: SearchParamsShape;
}) {
  const resolved = searchParams ? await searchParams : {};
  const view = parseView(readStringParam(resolved?.view));

  const topics = listTopics();
  const topic = topics[0];
  if (!topic) notFound();

  const rounds = listRoundsByTopicSlug(topic.slug);
  const companions = listCompanionContextsByTopicSlug(topic.slug);
  const companionByRoundSlug = new Map(
    companions
      .filter((entry) => Boolean(entry.linkedRoundSlug))
      .map((entry) => [entry.linkedRoundSlug as string, entry]),
  );

  const activeRounds = rounds.filter((round) => round.status === "open");
  const fallbackRounds = rounds.slice(0, 3);
  const visibleActiveRounds = activeRounds.length > 0 ? activeRounds : fallbackRounds;
  const closedRounds = rounds.filter((round) => round.status === "closed");

  const featuredRound = visibleActiveRounds[0] ?? null;
  const remainingActiveRounds =
    featuredRound === null
      ? visibleActiveRounds
      : visibleActiveRounds.filter((round) => round.id !== featuredRound.id);

  const resolveRoundEntryHref = (round: (typeof rounds)[number]) => {
    const companionContext = companionByRoundSlug.get(round.slug);
    if (companionContext) {
      return `/companion/${companionContext.slug}?entry=qr&source=${roundSourceParam(round.type)}`;
    }
    return `/round/${round.slug}?entry=qr&source=${roundSourceParam(round.type)}`;
  };

  const featuredRoundEntryHref = featuredRound ? resolveRoundEntryHref(featuredRound) : `/topic/${topic.slug}`;
  const totalContributions = rounds.reduce((sum, round) => sum + round.contributions.length, 0);
  const totalOpenPoints = rounds.reduce((sum, round) => sum + round.openPoints.length, 0);
  const unresolvedRoadmap = topic.roadmap.filter((item) => item.status !== "done");

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
                Dein Einstieg in aktive Runden
              </h1>
              <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">
                Oeffne laufende Runden, starte neue Einreichungen ueber <code>/create</code> und halte Ergebnisse nachvollziehbar.
              </p>
            </div>

            <div className="rounded-2xl border border-[rgb(var(--grad-from))]/35 bg-[rgb(var(--bg))]/85 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Empfohlener Start</p>
              <p className="mt-2 text-sm text-[rgb(var(--fg))]">
                {featuredRound ? featuredRound.title : "Direkt in das aktuelle Thema wechseln"}
              </p>
              <Link href={featuredRoundEntryHref} className="btn btn-primary mt-4 w-full text-sm">
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
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">Laufende Runden mit einem Klick oeffnen.</p>
            </Link>

            <Link
              href={viewHref("results")}
              className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))]"
            >
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">Ergebnisse ansehen</p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">Abgeschlossene Runden und offene Punkte vergleichen.</p>
            </Link>
          </section>

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[rgb(var(--muted))]">
            <span>Topic: {topic.title}</span>
            <span>Runden: {rounds.length}</span>
            <span>Aktiv: {activeRounds.length}</span>
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

      {view === "active" ? (
        <section id="aktive-runden" className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[rgb(var(--fg))]">{remainingActiveRounds.length > 0 ? "Weitere aktive Runden" : "Aktive Runden"}</h2>
              <p className="text-sm text-[rgb(var(--muted))]">Jede Karte hat genau eine Hauptaktion.</p>
            </div>
            <Link href={`/topic/${topic.slug}`} className="btn-secondary w-full text-sm sm:w-auto">
              Aktuelles Thema ansehen
            </Link>
          </div>

          {featuredRound ? (
            <article className="rounded-3xl border border-[rgb(var(--grad-from))]/35 bg-[rgb(var(--card))] p-5 shadow-sm">
              <div className="grid gap-4 lg:grid-cols-[1.45fr_0.9fr] lg:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Empfohlene Runde</p>
                  <h3 className="mt-2 text-xl font-semibold text-[rgb(var(--fg))] md:text-2xl">{featuredRound.title}</h3>
                  <p className="mt-2 text-sm text-[rgb(var(--muted))]">{shortSummary(featuredRound.summary)}</p>
                  <p className="mt-3 text-sm text-[rgb(var(--fg))]">
                    Warum jetzt: {roundRelevanceLabel(featuredRound.contributions.length, featuredRound.openPoints.length)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                  <p className="text-xs text-[rgb(var(--muted))]">{roundTypeLabel(featuredRound.type)} · zuletzt {formatDate(featuredRound.startedAt)}</p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    {summaryCountLabel(featuredRound.contributions.length, "Beitrag", "Beitraege")} · {summaryCountLabel(featuredRound.openPoints.length, "offene Frage", "offene Fragen")}
                  </p>
                  <Link href={featuredRoundEntryHref} className="btn btn-primary mt-4 w-full text-sm">
                    Runde oeffnen
                  </Link>
                </div>
              </div>
            </article>
          ) : null}

          {remainingActiveRounds.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {remainingActiveRounds.map((round) => (
                <article key={round.id} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                    <span className="vog-chip">{roundTypeLabel(round.type)}</span>
                    <span className="vog-chip vog-chip--status">{round.status === "open" ? "laeuft" : "abgeschlossen"}</span>
                  </div>

                  <h3 className="mt-3 text-lg font-semibold text-[rgb(var(--fg))]">{round.title}</h3>
                  <p className="mt-2 text-sm text-[rgb(var(--muted))]">{shortSummary(round.summary)}</p>
                  <p className="mt-3 text-xs text-[rgb(var(--muted))]">
                    {summaryCountLabel(round.contributions.length, "Beitrag", "Beitraege")} · {summaryCountLabel(round.openPoints.length, "offene Frage", "offene Fragen")}
                  </p>

                  <Link href={resolveRoundEntryHref(round)} className="btn btn-primary mt-4 text-sm">
                    Runde oeffnen
                  </Link>
                </article>
              ))}
            </div>
          ) : null}

          <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm md:p-6">
            <h3 className="text-base font-semibold text-[rgb(var(--fg))]">Sekundaere Orientierung</h3>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">
              Regeln, Verlauf und Kontext bleiben auffindbar, ohne den Einstieg zu ueberladen.
            </p>

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">Regeln & Transparenz</p>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">Moderation und Review-Log im Governance-Bereich.</p>
                <Link href={`/topic/manage/${topic.slug}/governance`} className="btn-secondary mt-3 text-xs">
                  Governance
                </Link>
              </article>

              <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">Naechste Schritte</p>
                <ul className="mt-2 space-y-1 text-sm text-[rgb(var(--muted))]">
                  {unresolvedRoadmap.slice(0, 3).map((item) => (
                    <li key={item.id}>- {item.title}</li>
                  ))}
                </ul>
              </article>

              <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">Status gesamt</p>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                  {summaryCountLabel(totalContributions, "Beitrag", "Beitraege")} und {summaryCountLabel(totalOpenPoints, "offener Punkt", "offene Punkte")}.
                </p>
              </article>
            </div>
          </section>
        </section>
      ) : null}

      {view === "mine" ? (
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
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">Steig wieder in die empfohlene Runde ein.</p>
              <Link href={featuredRoundEntryHref} className="btn-secondary mt-4 inline-flex text-sm">
                Runde oeffnen
              </Link>
            </article>
            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
              <h3 className="text-base font-semibold text-[rgb(var(--fg))]">Kontext vertiefen</h3>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">Gehe in Topic-Details und offenen Konflikten tiefer.</p>
              <Link href={`/topic/${topic.slug}`} className="btn-secondary mt-4 inline-flex text-sm">
                Topic ansehen
              </Link>
            </article>
          </div>
        </section>
      ) : null}

      {view === "results" ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-[rgb(var(--fg))]">Ergebnisse & vergangene Runden</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {(closedRounds.length > 0 ? closedRounds : rounds.slice(0, 2)).map((round) => (
              <article key={`${round.id}-results`} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="vog-chip">{roundTypeLabel(round.type)}</span>
                  <span className="vog-chip vog-chip--status">abgeschlossen</span>
                </div>
                <h3 className="mt-3 text-lg font-semibold text-[rgb(var(--fg))]">{round.title}</h3>
                <p className="mt-1 text-sm text-[rgb(var(--muted))]">{shortSummary(round.summary)}</p>
                <ul className="mt-4 space-y-1 text-sm text-[rgb(var(--muted))]">
                  <li>- Beitraege: {round.contributions.length}</li>
                  <li>- Offene Punkte: {round.openPoints.length}</li>
                  <li>- Zuletzt aktiv: {formatDate(round.startedAt)}</li>
                </ul>
                <Link href={resolveRoundEntryHref(round)} className="btn-secondary mt-4 inline-flex text-sm">
                  Ergebnis ansehen
                </Link>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {view === "organize" ? (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-[rgb(var(--fg))]">Organisieren</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
              <h3 className="text-base font-semibold text-[rgb(var(--fg))]">Regeln & Transparenz</h3>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">Review-Log und Rollen im Governance-Bereich.</p>
              <Link href={`/topic/manage/${topic.slug}/governance`} className="btn btn-primary mt-4 text-sm">
                Governance oeffnen
              </Link>
            </article>
            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
              <h3 className="text-base font-semibold text-[rgb(var(--fg))]">Runden-Review</h3>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">Merge- und Assist-Vorschlaege pro Runde nachvollziehen.</p>
              {rounds[0] ? (
                <Link href={`/round/manage/${rounds[0].slug}/merge`} className="btn-secondary mt-4 inline-flex text-sm">
                  Merge-Review
                </Link>
              ) : null}
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
