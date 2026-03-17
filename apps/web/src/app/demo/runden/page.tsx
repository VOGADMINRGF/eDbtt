import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getDemoPersonaConfig,
  parseDemoPersona,
  withPersona,
  type DemoPersona,
} from "@/features/demo/personas";
import { readStringParam, resolveSurfaceContext } from "@/features/surface";
import {
  listCompanionContextsByTopicSlug,
  listRoundsByTopicSlug,
  listTopics,
} from "@features/topicRound";

type SearchParamsShape = Promise<Record<string, string | string[] | undefined>>;

type RoundEntryView = "active" | "mine" | "results" | "organize";

const VIEW_ORDER: RoundEntryView[] = ["active", "mine", "results", "organize"];

const VIEW_LABELS: Record<RoundEntryView, string> = {
  active: "Aktiv",
  mine: "Meine",
  results: "Ergebnisse",
  organize: "Organisieren",
};

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
  if (firstSentence.length <= 138) return firstSentence;
  return `${firstSentence.slice(0, 135).trimEnd()}...`;
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
    return `${summaryCountLabel(contributions, "aktueller Beitrag", "aktuelle Beitraege")} geben dir schnellen Kontext fuer den Einstieg.`;
  }
  return "Guter Einstieg, um den aktuellen Stand mit einem Klick zu verstehen.";
}

function viewHref(persona: DemoPersona, view: RoundEntryView) {
  return `/demo/runden?persona=${encodeURIComponent(persona)}&view=${view}`;
}

export default async function DemoRoundsPage({
  searchParams,
}: {
  searchParams?: SearchParamsShape;
}) {
  // Ownership note: /demo/runden is intentionally owned by this route file.
  // It orchestrates entry IA while topic/round detail logic stays on /topic and /round routes.
  const resolved = searchParams ? await searchParams : {};
  const persona = parseDemoPersona(readStringParam(resolved?.persona));
  const view = parseView(readStringParam(resolved?.view));
  const personaCfg = getDemoPersonaConfig(persona);

  const context = resolveSurfaceContext({
    mode: "demo",
    audience:
      persona === "journalist" ? "journalist" : persona === "administration" ? "verwaltung" : "buerger",
    dataSource: "seed",
  });

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
      return `/companion/${companionContext.slug}?entry=qr&source=${roundSourceParam(round.type)}&persona=${persona}`;
    }
    return `/round/${round.slug}?entry=qr&source=${roundSourceParam(round.type)}&persona=${persona}`;
  };

  const featuredRoundEntryHref = featuredRound ? resolveRoundEntryHref(featuredRound) : `/topic/${topic.slug}`;
  const totalContributions = rounds.reduce((sum, round) => sum + round.contributions.length, 0);
  const totalOpenPoints = rounds.reduce((sum, round) => sum + round.openPoints.length, 0);
  const unresolvedRoadmap = topic.roadmap.filter((item) => item.status !== "done");

  return (
    <main className="mx-auto min-h-screen w-full max-w-[92rem] space-y-10 px-4 py-8 md:space-y-12 md:px-8 md:py-12 xl:px-10">
      <header className="relative overflow-hidden rounded-[2rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-7 shadow-sm md:p-10">
        <div className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full bg-[rgb(var(--grad-from))]/18 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-52 w-52 rounded-full bg-[rgb(var(--grad-to))]/14 blur-3xl" />

        <div className="relative space-y-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[rgb(var(--muted))]">Demo - Runden</p>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr] lg:items-end">
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight text-[rgb(var(--fg))] md:text-5xl">
                Mach bei einer Runde mit
              </h1>
              <p className="max-w-3xl text-base text-[rgb(var(--muted))]">
                Starte ein neues Thema, steige direkt in eine laufende Runde ein oder gehe ueber Ergebnisse tiefer in
                den Stand.
              </p>
            </div>

            <div className="rounded-2xl border border-[rgb(var(--grad-from))]/35 bg-[rgb(var(--bg))]/85 p-4 md:p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Empfohlener Start</p>
              <p className="mt-2 text-sm text-[rgb(var(--fg))]">
                {featuredRound ? featuredRound.title : "Direkt in das aktuelle Thema wechseln"}
              </p>
              <Link href={featuredRoundEntryHref} className="btn btn-primary mt-4 w-full text-base">
                Jetzt einsteigen
              </Link>
            </div>
          </div>

          <section aria-label="Schneller Einstieg" className="grid gap-4 md:grid-cols-3">
            <Link
              href={withPersona("/demo/create", persona)}
              className="min-h-[150px] rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-5 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))]"
            >
              <p className="text-base font-semibold text-[rgb(var(--fg))]">Neue Runde starten</p>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                Lege ein Anliegen an und fuehre es in den passenden Beteiligungsfluss.
              </p>
            </Link>

            <Link
              href={viewHref(persona, "active")}
              className="min-h-[150px] rounded-2xl border border-[rgb(var(--grad-from))]/50 bg-[rgb(var(--bg))] p-5 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))]"
            >
              <p className="text-base font-semibold text-[rgb(var(--fg))]">In aktive Runde einsteigen</p>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                Oeffne laufende Runden mit einem Klick und arbeite direkt an offenen Punkten weiter.
              </p>
            </Link>

            <Link
              href={viewHref(persona, "results")}
              className="min-h-[150px] rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-5 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--grad-from))]"
            >
              <p className="text-base font-semibold text-[rgb(var(--fg))]">Ergebnisse ansehen</p>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                Schau dir abgeschlossene Runden an und wechsle von dort in Details.
              </p>
            </Link>
          </section>

          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-[rgb(var(--muted))]">
            <span>Persona: {personaCfg.label}</span>
            <span>Runden: {rounds.length}</span>
            <span>Aktiv: {activeRounds.length}</span>
            <span>Datenquelle: {context.dataSource}</span>
          </div>
        </div>
      </header>

      {view === "active" && featuredRound ? (
        <section className="rounded-3xl border border-[rgb(var(--grad-from))]/35 bg-[rgb(var(--card))] p-6 shadow-sm md:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr] lg:items-end">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
                Empfohlene Runde
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-[rgb(var(--fg))] md:text-3xl">{featuredRound.title}</h2>
              <p className="mt-2 max-w-3xl text-sm text-[rgb(var(--muted))]">{shortSummary(featuredRound.summary)}</p>
              <p className="mt-3 text-sm text-[rgb(var(--fg))]">
                Warum jetzt: {roundRelevanceLabel(featuredRound.contributions.length, featuredRound.openPoints.length)}
              </p>
            </div>

            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 md:p-5">
              <p className="text-xs text-[rgb(var(--muted))]">
                {roundTypeLabel(featuredRound.type)} · zuletzt aktiv am {formatDate(featuredRound.startedAt)}
              </p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                {summaryCountLabel(featuredRound.contributions.length, "Beitrag", "Beitraege")} · {summaryCountLabel(featuredRound.openPoints.length, "offene Frage", "offene Fragen")}
              </p>
              <Link href={featuredRoundEntryHref} className="btn btn-primary mt-4 w-full text-base">
                Runde oeffnen
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">Ansicht</p>
        <nav aria-label="Rundenbereiche" className="overflow-x-auto pb-1">
          <div className="inline-flex min-w-full gap-1 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-1 sm:min-w-0">
            {VIEW_ORDER.map((entryView) => {
              const active = view === entryView;
              return (
                <Link
                  key={entryView}
                  href={viewHref(persona, entryView)}
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
        <>
          <section id="aktive-runden" className="space-y-5">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-[rgb(var(--fg))]">
                  {remainingActiveRounds.length > 0 ? "Weitere aktive Runden" : "Aktive Runden"}
                </h2>
                <p className="text-sm text-[rgb(var(--muted))]">Weniger lesen, schneller einsteigen: jede Karte hat genau eine Hauptaktion.</p>
              </div>
              <Link href={`/topic/${topic.slug}`} className="btn-secondary w-full text-sm sm:w-auto">
                Aktuelles Thema ansehen
              </Link>
            </div>

            {remainingActiveRounds.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {remainingActiveRounds.map((round) => {
                  const companionContext = companionByRoundSlug.get(round.slug);
                  const openRoundHref = resolveRoundEntryHref(round);

                  return (
                    <article key={round.id} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm md:p-6">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                        <span className="vog-chip">{roundTypeLabel(round.type)}</span>
                        <span className="vog-chip vog-chip--status">{round.status === "open" ? "laeuft" : "abgeschlossen"}</span>
                        {companionContext ? <span className="vog-chip">Begleitraum</span> : null}
                      </div>

                      <h3 className="mt-3 text-lg font-semibold text-[rgb(var(--fg))]">{round.title}</h3>
                      <p className="mt-2 text-sm text-[rgb(var(--muted))]">{shortSummary(round.summary)}</p>

                      <p className="mt-3 text-xs text-[rgb(var(--muted))]">
                        {summaryCountLabel(round.contributions.length, "Beitrag", "Beitraege")} · {summaryCountLabel(round.openPoints.length, "offene Frage", "offene Fragen")} · zuletzt {formatDate(round.startedAt)}
                      </p>

                      <div className="mt-5 flex items-center gap-3">
                        <Link href={openRoundHref} className="btn btn-primary text-sm">
                          Runde oeffnen
                        </Link>
                        <Link href={`/topic/${topic.slug}`} className="text-sm font-medium text-[rgb(var(--muted))] underline-offset-2 hover:underline">
                          Mehr dazu
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 text-sm text-[rgb(var(--muted))] shadow-sm">
                Aktuell gibt es keine weitere Runde neben der empfohlenen Einstiegsrunde.
              </article>
            )}
          </section>

          <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm md:p-8">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold text-[rgb(var(--fg))]">Sekundaere Orientierung</h2>
              <p className="text-sm text-[rgb(var(--muted))]">
                Dieser Bereich bleibt bewusst nachgelagert: zuerst Einstieg und Auswahl, danach Regeln, Verlauf und tieferer Kontext.
              </p>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Regeln & Transparenz</h3>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                  Moderation, Review-Log und begruendete Entscheidungen liegen im Governance-Bereich.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/topic/manage/${topic.slug}/governance`} className="btn-secondary text-xs">
                    Governance oeffnen
                  </Link>
                  {rounds[0] ? (
                    <Link href={`/round/manage/${rounds[0].slug}/merge`} className="btn-secondary text-xs">
                      Merge-Review
                    </Link>
                  ) : null}
                </div>
              </article>

              <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Wie es danach weitergeht</h3>
                <ul className="mt-2 space-y-1 text-sm text-[rgb(var(--muted))]">
                  {unresolvedRoadmap.slice(0, 3).map((item) => (
                    <li key={item.id}>- {item.title}</li>
                  ))}
                </ul>
                <details className="mt-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-[rgb(var(--fg))]">Alle naechsten Schritte</summary>
                  <ul className="mt-2 space-y-1 text-xs text-[rgb(var(--muted))]">
                    {topic.roadmap.slice(0, 6).map((item) => (
                      <li key={`${item.id}-all`}>- {item.title}</li>
                    ))}
                  </ul>
                </details>
              </article>

              <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Was bereits eingebracht wurde</h3>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                  {summaryCountLabel(totalContributions, "Beitrag", "Beitraege")} und {summaryCountLabel(totalOpenPoints, "offener Punkt", "offene Punkte")} liegen derzeit vor.
                </p>
                <details className="mt-3 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-[rgb(var(--fg))]">Runden-Details</summary>
                  <ul className="mt-2 space-y-1 text-xs text-[rgb(var(--muted))]">
                    {rounds.slice(0, 4).map((round) => (
                      <li key={`${round.id}-meta`}>{round.title}: {round.contributions.length} Beitraege · {round.openPoints.length} offene Punkte</li>
                    ))}
                  </ul>
                </details>
              </article>
            </div>
          </section>
        </>
      ) : null}

      {view === "mine" ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-[rgb(var(--fg))]">Meine naechsten Schritte</h2>
            <p className="text-sm text-[rgb(var(--muted))]">
              In der Demo wird dieser Bereich aus deiner Persona abgeleitet: {personaCfg.label}.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
              <h3 className="text-base font-semibold text-[rgb(var(--fg))]">Direkt mitreden</h3>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                Starte mit einem strukturierten Beitrag und fuege Frage, Einwand oder Quelle ein.
              </p>
              <Link href={withPersona("/demo/create", persona)} className="btn btn-primary mt-4 text-sm">
                Beitrag starten
              </Link>
            </article>

            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
              <h3 className="text-base font-semibold text-[rgb(var(--fg))]">Runde wieder aufnehmen</h3>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                Oeffne eine laufende Runde und arbeite direkt an offenen Punkten weiter.
              </p>
              <Link href={featuredRoundEntryHref} className="btn-secondary mt-4 inline-flex text-sm">
                Runde oeffnen
              </Link>
            </article>

            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
              <h3 className="text-base font-semibold text-[rgb(var(--fg))]">Hintergrund verstehen</h3>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                Vertiefe Quellen, Konflikte und Optionen im Dossier.
              </p>
              <Link href={withPersona("/demo/dossier", persona)} className="btn-secondary mt-4 inline-flex text-sm">
                Dossier ansehen
              </Link>
            </article>
          </div>

          <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
            <h3 className="text-base font-semibold text-[rgb(var(--fg))]">Zuletzt bearbeitbare Runden</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {rounds.slice(0, 2).map((round) => {
                const openRoundHref = resolveRoundEntryHref(round);

                return (
                  <article
                    key={`${round.id}-mine`}
                    className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
                  >
                    <p className="text-sm font-semibold text-[rgb(var(--fg))]">{round.title}</p>
                    <p className="mt-1 text-sm text-[rgb(var(--muted))]">{shortSummary(round.summary)}</p>
                    <Link href={openRoundHref} className="btn-secondary mt-3 inline-flex text-xs">
                      Runde oeffnen
                    </Link>
                  </article>
                );
              })}
            </div>
          </section>
        </section>
      ) : null}

      {view === "results" ? (
        <section className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-[rgb(var(--fg))]">Ergebnisse & vergangene Runden</h2>
              <p className="text-sm text-[rgb(var(--muted))]">
                Hier siehst du, was bereits eingebracht wurde und welche Fragen noch offen sind.
              </p>
            </div>
            <Link href={`/topic/${topic.slug}`} className="btn-secondary w-full text-sm sm:w-auto">
              Ergebnis im Thema ansehen
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {(closedRounds.length > 0 ? closedRounds : rounds.slice(0, 2)).map((round) => {
              const resultHref = resolveRoundEntryHref(round);

              return (
                <article
                  key={`${round.id}-results`}
                  className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm"
                >
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

                  <Link href={resultHref} className="btn-secondary mt-4 inline-flex text-sm">
                    Ergebnis ansehen
                  </Link>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {view === "organize" ? (
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold text-[rgb(var(--fg))]">Organisieren</h2>
            <p className="text-sm text-[rgb(var(--muted))]">
              Steuerung, Transparenz und Verteilung sind hier gebuendelt und vom Einstieg getrennt.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
              <h3 className="text-base font-semibold text-[rgb(var(--fg))]">Regeln & Transparenz</h3>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                Review-Log, Rollen und nachvollziehbare Entscheidungen im Governance-Bereich.
              </p>
              <Link href={`/topic/manage/${topic.slug}/governance`} className="btn btn-primary mt-4 text-sm">
                Governance oeffnen
              </Link>
            </article>

            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
              <h3 className="text-base font-semibold text-[rgb(var(--fg))]">Runden-Review</h3>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                Ueberpruefe Merge-Vorschlaege und offene Entscheidungen in der Runde.
              </p>
              {rounds[0] ? (
                <Link href={`/round/manage/${rounds[0].slug}/merge`} className="btn-secondary mt-4 inline-flex text-sm">
                  Merge-Review oeffnen
                </Link>
              ) : (
                <p className="mt-4 text-xs text-[rgb(var(--muted))]">Keine Runde fuer Merge-Review vorhanden.</p>
              )}
            </article>

            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
              <h3 className="text-base font-semibold text-[rgb(var(--fg))]">Verteilen & Einbetten</h3>
              <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                Teile Einstiege fuer QR, Companion und Embed gezielt nach Kanal.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {companions[0] ? (
                  <Link
                    href={`/companion/${companions[0].slug}?entry=qr&source=article&persona=${persona}`}
                    className="btn-secondary text-xs"
                  >
                    Begleitraum oeffnen
                  </Link>
                ) : null}
                <Link
                  href={`/embed/topic/${topic.slug}?entry=qr&source=article&persona=${persona}`}
                  className="btn-secondary text-xs"
                >
                  Topic-Embed
                </Link>
                {featuredRound ? (
                  <Link
                    href={`/embed/round/${featuredRound.slug}?entry=qr&source=${roundSourceParam(featuredRound.type)}&persona=${persona}`}
                    className="btn-secondary text-xs"
                  >
                    Round-Embed
                  </Link>
                ) : null}
              </div>
            </article>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <details className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]/82 p-5 shadow-sm">
              <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">
                Wie es danach weitergeht
              </summary>
              <ul className="mt-3 space-y-2 text-sm text-[rgb(var(--muted))]">
                {topic.roadmap.slice(0, 4).map((item) => (
                  <li key={item.id} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
                    <p className="font-semibold text-[rgb(var(--fg))]">{item.title}</p>
                    <p>{item.unresolved}</p>
                  </li>
                ))}
              </ul>
            </details>

            <details className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]/82 p-5 shadow-sm">
              <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">
                Transparenzerlaeuterung zur Demo
              </summary>
              <div className="mt-3 space-y-2 text-sm text-[rgb(var(--muted))]">
                <p>
                  Diese Einstiegsseite fuehrt in produktive Detailrouten: <span className="font-semibold">/topic/[slug]</span>,{" "}
                  <span className="font-semibold">/round/[slug]</span> und <span className="font-semibold">/companion/[slug]</span>.
                </p>
                <p>
                  Damit bleibt die Datenlogik unveraendert. Die Seite ordnet nur den Einstieg neu, statt Inhalte zu
                  duplizieren.
                </p>
              </div>
            </details>
          </div>
        </section>
      ) : null}
    </main>
  );
}
