import Link from "next/link";
import type { DossierAtlasWeeklySnapshotExport } from "@features/anlassraum/dossierAtlasWeeklySnapshotExport";

type WeeklySnapshotSurfaceProps = {
  snapshot: DossierAtlasWeeklySnapshotExport;
  sourceState?: "live" | "fallback";
  showInternal?: boolean;
};

function flowLabel(key: "anlassToRound" | "dossierToRound" | "roundToResult" | "anlassToCompanion") {
  if (key === "anlassToRound") return "Anlass → Runde";
  if (key === "dossierToRound") return "Dossier → Runde";
  if (key === "roundToResult") return "Runde → Ergebnis";
  return "Anlass → Companion";
}

function activityBandLabel(value: "none" | "low" | "medium" | "high") {
  if (value === "none") return "ruhig";
  if (value === "low") return "leicht aktiv";
  if (value === "medium") return "aktiv";
  return "stark aktiv";
}

function contextLabel(key: string) {
  if (key === "association") return "Verband/Verein";
  if (key === "initiative") return "Initiative";
  if (key === "organization") return "Organisation";
  if (key === "editorial_publisher") return "Redaktion/Publisher";
  if (key === "civic_creator") return "Civic/Creator";
  if (key === "expert_voice") return "Experten/Fachstimme";
  return key;
}

export default function WeeklySnapshotSurface({
  snapshot,
  sourceState = "live",
  showInternal = false,
}: WeeklySnapshotSurfaceProps) {
  const flowEntries: Array<
    ["anlassToRound" | "dossierToRound" | "roundToResult" | "anlassToCompanion", number]
  > = [
    ["anlassToRound", snapshot.activityFlows.anlassToRound],
    ["dossierToRound", snapshot.activityFlows.dossierToRound],
    ["roundToResult", snapshot.activityFlows.roundToResult],
    ["anlassToCompanion", snapshot.activityFlows.anlassToCompanion],
  ];

  return (
    <main className="mx-auto min-h-screen w-full max-w-[92rem] space-y-6 px-4 py-6 md:px-8 md:py-10">
      <header className="relative overflow-hidden rounded-2xl border bg-[rgb(var(--card))] p-5 shadow-sm md:p-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[rgb(var(--grad-from))]/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-[rgb(var(--grad-to))]/10 blur-3xl" />
        <div className="relative space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
            WOCHENATLAS
          </p>
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
            {snapshot.snapshotWindow.label}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
            Zeitraum {new Date(snapshot.snapshotWindow.windowStart).toLocaleDateString("de-DE")} bis{" "}
            {new Date(snapshot.snapshotWindow.windowEnd).toLocaleDateString("de-DE")} ·
            Public-first Wochenlage ohne Toplist- oder Wahrheitslogik.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-[rgb(var(--muted))]">
              Read-only
            </span>
            <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-[rgb(var(--muted))]">
              Kein Auto-Publish
            </span>
            <span className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-[rgb(var(--muted))]">
              Thema und Region getrennt
            </span>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/atlas"
              className="inline-flex items-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1.5 font-semibold text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]"
            >
              Zur Atlas-Übersicht
            </Link>
            <Link
              href="/atlas/social-review"
              className="inline-flex items-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1.5 font-semibold text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]"
            >
              Social-Review-Queue
            </Link>
            <Link
              href={showInternal ? "/atlas/weekly" : "/atlas/weekly?detail=internal"}
              className="inline-flex items-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1.5 font-semibold text-[rgb(var(--fg))] hover:bg-[rgb(var(--card))]"
            >
              {showInternal ? "Public-Ansicht" : "Interne Details"}
            </Link>
          </div>
        </div>
      </header>

      <nav
        aria-label="Wochenatlas-Bereiche"
        className="overflow-x-auto rounded-xl border bg-[rgb(var(--card))] px-2 py-2"
      >
        <div className="flex min-w-max gap-2">
          <SectionAnchor href="#weekly-summary" label="Summary" />
          <SectionAnchor href="#weekly-flows" label="Flows" />
          <SectionAnchor href="#weekly-topics" label="Themen" />
          <SectionAnchor href="#weekly-region-context" label="Region/Kontext" />
          <SectionAnchor href="#weekly-guardrails" label="Guardrails" />
        </div>
      </nav>

      {sourceState === "fallback" ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Snapshot-Quelle ist gerade nicht vollständig verfügbar. Die Ansicht zeigt einen degradierten,
          aber contract-konformen Stand.
        </section>
      ) : null}

      <section id="weekly-summary" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Neue Beiträge" value={snapshot.summary.weekly.newContributions} />
        <MetricCard label="Neue Anlassräume" value={snapshot.summary.weekly.newAnlassraeume} />
        <MetricCard label="Aktive Runden" value={snapshot.summary.weekly.activeRounds} />
        <MetricCard label="Folgeverläufe" value={snapshot.summary.weekly.followupFlows} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <article className="rounded-2xl border bg-[rgb(var(--card))] p-4 md:p-5">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Public Summary</h2>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">{snapshot.publicSafeSummary.headline}</p>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">{snapshot.publicSafeSummary.subline}</p>
          <ul className="mt-3 space-y-1 text-sm text-[rgb(var(--muted))]">
            {snapshot.publicSafeSummary.bullets.map((bullet) => (
              <li key={bullet}>• {bullet}</li>
            ))}
          </ul>
        </article>

        <article id="weekly-flows" className="rounded-2xl border bg-[rgb(var(--card))] p-4 md:p-5">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Flow-Lage</h2>
          <div className="mt-3 space-y-2">
            {flowEntries.map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2"
              >
                <span className="text-sm text-[rgb(var(--muted))]">{flowLabel(key)}</span>
                <span className="text-sm font-semibold text-[rgb(var(--fg))]">{value}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <article id="weekly-topics" className="rounded-2xl border bg-[rgb(var(--card))] p-4 md:p-5">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Themen-Highlights</h2>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            Alphabetisch ausgewählt, ausdrücklich ohne Ranking.
          </p>
          <div className="mt-3 space-y-2">
            {snapshot.topicHighlights.length === 0 ? (
              <p className="text-sm text-[rgb(var(--muted))]">Keine Themen-Highlights verfügbar.</p>
            ) : (
              snapshot.topicHighlights.map((topic) => (
                <article
                  key={topic.topicKey}
                  className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[rgb(var(--fg))]">{topic.topicLabel}</p>
                    <span className="rounded-full border border-[rgb(var(--border))] px-2 py-0.5 text-[11px] text-[rgb(var(--muted))]">
                      {activityBandLabel(topic.activityBand)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    Anlass {topic.counts.anlaesse} · Dossiers {topic.counts.dossiers} · Runden{" "}
                    {topic.counts.rounds} · Ergebnisse {topic.counts.results}
                  </p>
                </article>
              ))
            )}
          </div>
        </article>

        <aside id="weekly-region-context" className="space-y-4">
          <article className="rounded-2xl border bg-[rgb(var(--card))] p-4">
            <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Regionenansicht</h2>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">
              Region bleibt eigene Achse, getrennt von Themen.
            </p>
            <div className="mt-3 space-y-2">
              {snapshot.regionView.regions.length === 0 ? (
                <p className="text-xs text-[rgb(var(--muted))]">Keine Regionenzuordnung verfügbar.</p>
              ) : (
                snapshot.regionView.regions.map((region) => (
                  <div
                    key={region.regionKey}
                    className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-2.5"
                  >
                    <p className="text-sm font-semibold text-[rgb(var(--fg))]">{region.label}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">
                      Anlass {region.anlassCount} · Runden {region.roundCount} · Ergebnisse{" "}
                      {region.resultCount}
                    </p>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="rounded-2xl border bg-[rgb(var(--card))] p-4">
            <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Kontextsichtbarkeit</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(snapshot.contextVisibility).map(([key, value]) => (
                <span
                  key={key}
                  className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-2.5 py-1 text-xs text-[rgb(var(--muted))]"
                >
                  {contextLabel(key)}: {value}
                </span>
              ))}
            </div>
          </article>
        </aside>
      </section>

      {showInternal ? (
        <section className="rounded-2xl border bg-[rgb(var(--card))] p-4 md:p-5">
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Interne Kurzlage</h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <article>
              <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Operations-Fokus</h3>
              <ul className="mt-2 space-y-1 text-sm text-[rgb(var(--muted))]">
                {snapshot.internalDenseSummary.operationsFocus.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </article>
            <article>
              <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">Watchouts</h3>
              <ul className="mt-2 space-y-1 text-sm text-[rgb(var(--muted))]">
                {snapshot.internalDenseSummary.watchouts.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>
      ) : null}

      <section id="weekly-guardrails" className="rounded-2xl border bg-[rgb(var(--card))] p-4">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Guardrails</h2>
        <ul className="mt-2 space-y-1 text-sm text-[rgb(var(--muted))]">
          <li>Wochenatlas ist keine Toplist.</li>
          <li>Wochenatlas ist keine Wahrheits- oder Reputationsmaschine.</li>
          <li>Kontextmarker bleiben non-epistemisch.</li>
          <li>Feed bleibt Signalquelle, kein Auto-Publish.</li>
          <li>Layout-Hinweis: {snapshot.graphicNotes.layoutHint}</li>
        </ul>
      </section>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-xl border bg-[rgb(var(--card))] p-3 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))] md:text-3xl">{value}</p>
    </article>
  );
}

function SectionAnchor({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1 text-xs font-semibold text-[rgb(var(--muted))] hover:bg-[rgb(var(--card))] hover:text-[rgb(var(--fg))]"
    >
      {label}
    </a>
  );
}
