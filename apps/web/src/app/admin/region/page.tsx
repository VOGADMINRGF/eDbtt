import Link from "next/link";
import { redirect } from "next/navigation";
import type { RegionalAdminCockpitReadModel } from "@features/region";
import {
  getOperationalRegionById,
  getRegionalAdminCockpitReadModel,
  organizationVerificationStatusLabel,
  regionEntitlementReasonLabel,
  regionEntitlementStatusLabel,
  regionFeedSignalOriginLabel,
  regionReviewStatusLabel,
} from "@features/region";
import { RegionSourceConnectionsPanel } from "./RegionSourceConnectionsPanel";

type SearchParamsShape =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

const WORKSPACE_VIEWS = [
  { id: "lagebild", label: "Lagebild" },
  { id: "quellen", label: "Quellen & Feeds" },
  { id: "recherche", label: "Recherche" },
  { id: "claims", label: "Claims & Dossiers" },
  { id: "beitraege", label: "Beiträge & Veröffentlichung" },
  { id: "kampagnen", label: "Regionale Kampagnen" },
  { id: "einstellungen", label: "Einstellungen & Zugriff" },
] as const;

type WorkspaceView = (typeof WORKSPACE_VIEWS)[number]["id"];

function toArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function firstParam(value?: string | string[]) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

function resolveView(value: string | null): WorkspaceView {
  return WORKSPACE_VIEWS.some((entry) => entry.id === value)
    ? (value as WorkspaceView)
    : "lagebild";
}

function withQuery(path: string, values: Record<string, string | null | undefined>) {
  const query = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  return `${path}?${query.toString()}`;
}

function workspaceHref(region: string, view: WorkspaceView) {
  return withQuery("/admin/region", { regionId: region, view });
}

function researchHref(region: string, topic?: string | null, source?: string | null) {
  return withQuery("/admin/research/tasks", {
    regionId: region,
    topic,
    source,
    origin: "admin-region",
  });
}

function createHref(
  region: string,
  params: { signalTitle?: string | null; topic?: string | null; reason: string },
) {
  return withQuery("/create", {
    source: "admin_region",
    signalTitle: params.signalTitle,
    region,
    scope: "regional",
    clusterHint: params.topic,
    reviewState: "needs_review",
    reason: params.reason,
  });
}

function marketingHref(region: string, topic?: string | null) {
  return withQuery("/admin/marketing", {
    lang: "de",
    segment: "b2g",
    reach: "regional",
    region,
    topic,
    origin: "admin-region",
  });
}

function reviewHref(region: string) {
  return withQuery("/admin/review", { regionId: region, origin: "admin-region" });
}

function sourceTypeLabel(value: string) {
  switch (value) {
    case "news":
      return "Nachrichtenhinweis";
    case "official_update":
      return "Verwaltungshinweis";
    case "community_signal":
      return "Community-Hinweis";
    case "feed_draft":
      return "Feed-Entwurf";
    case "public_claim":
      return "Öffentliche Aussage";
    case "public_contribution":
      return "Öffentlicher Beitrag";
    case "public_question":
      return "Öffentliche Frage";
    case "public_source_hint":
      return "Öffentlicher Quellenhinweis";
    default:
      return "Manueller Hinweis";
  }
}

function suggestedActionLabel(value: string) {
  switch (value) {
    case "create_anlassraum":
      return "Anlassraum-Vorschlag prüfen";
    case "attach_to_anlassraum":
      return "Anlassraum-Zuordnung prüfen";
    case "create_dossier":
      return "Dossier-Vorschlag prüfen";
    case "attach_source_to_dossier":
      return "Quelle einem Dossier zuordnen";
    case "ask_clarifying_question":
      return "Offene Frage klären";
    default:
      return "Im Review einordnen";
  }
}

function authoritySourceLabel(
  value: RegionalAdminCockpitReadModel["accessSummary"]["authoritySource"],
) {
  switch (value) {
    case "admin_fallback":
      return "Globale Adminsicht";
    case "verified_membership":
      return "Verifizierte Behördenzuordnung";
    default:
      return "Unverifizierter Regionshinweis";
  }
}

function Card(props: {
  eyebrow?: string;
  title: string;
  body?: string;
  children?: React.ReactNode;
  testId?: string;
}) {
  return (
    <article
      data-testid={props.testId}
      className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5"
    >
      {props.eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          {props.eyebrow}
        </p>
      ) : null}
      <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">{props.title}</h2>
      {props.body ? <p className="mt-2 text-sm text-[rgb(var(--muted))]">{props.body}</p> : null}
      {props.children}
    </article>
  );
}

function ActionLink(props: {
  href: string;
  children: React.ReactNode;
  primary?: boolean;
  testId?: string;
}) {
  return (
    <Link
      data-testid={props.testId}
      href={props.href}
      className={
        props.primary
          ? "inline-flex items-center justify-center rounded-full bg-[rgb(var(--grad-from))] px-4 py-2 text-sm font-semibold text-white"
          : "inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))]"
      }
    >
      {props.children}
    </Link>
  );
}

export default async function AdminRegionPage({
  searchParams,
}: {
  searchParams?: SearchParamsShape;
}) {
  const resolved = searchParams ? await searchParams : {};
  const selectedRegionId = firstParam(resolved.regionId);
  if (!selectedRegionId) redirect("/admin/regions");

  const region = await getOperationalRegionById(selectedRegionId);
  if (!region) redirect("/admin/regions");

  const view = resolveView(firstParam(resolved.view));
  const cockpit = await getRegionalAdminCockpitReadModel(region.id);
  const regionContext = cockpit.region.slug || selectedRegionId;
  const feedSignals = toArray(cockpit.feedSignals);
  const topicClusters = toArray(cockpit.topicClusters);
  const openReviewItems = toArray(cockpit.openReviewItems);
  const sourceConnections = toArray(cockpit.sourceConnections);
  const sourceTestResults = toArray(cockpit.sourceTestResults);
  const communitySourceHints = toArray(cockpit.communitySourceHints);
  const suggestedDossiers = toArray(cockpit.suggestedDossiers);
  const suggestedAnlassraeume = toArray(cockpit.suggestedAnlassraeume);
  const activeSources = sourceConnections.filter((connection) => connection.enabled);
  const fixtureSignals = feedSignals.filter((signal) => signal.provenance.isFixture);
  const topSignal = feedSignals[0] ?? null;
  const topTopic = topSignal?.detectedTopics?.[0] ?? topicClusters[0]?.label ?? null;
  const claimRows = sourceTestResults.flatMap((result) =>
    result.possibleClaims.map((claim) => ({ claim, result })),
  );
  const nextAction =
    openReviewItems.length > 0
      ? {
          label: `${openReviewItems.length} offene Hinweise prüfen`,
          href: reviewHref(regionContext),
          body: "Prüfe zuerst Herkunft, Regionbezug und Quellenlage. Erst danach wird bewusst weitergegeben.",
        }
      : {
          label: "Quellenbasis ergänzen",
          href: workspaceHref(regionContext, "quellen"),
          body: "Es gibt aktuell keine offene Review-Liste. Ergänze oder teste eine nachvollziehbare Quelle.",
        };

  return (
    <main
      data-testid="admin-region-page"
      className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8"
    >
      <header data-testid="admin-region-context" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
            <Link
              href="/admin/regions"
              className="rounded-full border border-[rgb(var(--border))] px-3 py-1"
            >
              Region wechseln
            </Link>
            <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1">
              {cockpit.region.administrativeUnitType ?? cockpit.region.type}
            </span>
            {fixtureSignals.length > 0 ? (
              <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-amber-900">
                Pilot-/Fixture-Daten enthalten
              </span>
            ) : null}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Regionaler Arbeitsraum
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[rgb(var(--fg))] sm:text-4xl">
            {cockpit.region.name}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
            Von regionalen Signalen und Quellen über bewusste Recherche bis zu reviewpflichtigen
            Beiträgen, Dossiers und Kampagnenübergaben.
          </p>
        </div>
      </header>

      <section
        data-testid="admin-region-journey"
        className="grid gap-4 rounded-3xl border border-cyan-300/70 bg-cyan-50/50 p-5 lg:grid-cols-[1.2fr_0.8fr]"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-900">
            Jetzt relevant
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">
            {topSignal?.title ?? "Noch kein regionales Signal priorisiert"}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">
            {topSignal?.summary ??
              "Baue zuerst eine nachvollziehbare Quellenbasis auf oder prüfe bestehende Hinweise."}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-[rgb(var(--muted))]">Quellenbasis</p>
              <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">
                {activeSources.length} aktiv · {sourceTestResults.length} geprüft
              </p>
            </div>
            <div>
              <p className="text-xs text-[rgb(var(--muted))]">Themenlage</p>
              <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">
                {feedSignals.length} Signale · {topicClusters.length} Cluster
              </p>
            </div>
            <div>
              <p className="text-xs text-[rgb(var(--muted))]">Braucht Prüfung</p>
              <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">
                {openReviewItems.length} offene Hinweise
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-cyan-200 bg-white/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-900">
            Nächste sinnvolle Aktion
          </p>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">{nextAction.body}</p>
          <div className="mt-4">
            <ActionLink href={nextAction.href} primary testId="admin-region-primary-action">
              {nextAction.label}
            </ActionLink>
          </div>
        </div>
      </section>

      <section data-testid="admin-region-quick-actions">
        <h2 className="sr-only">Schnellaktionen</h2>
        <div className="flex flex-wrap gap-2">
          <ActionLink href={workspaceHref(regionContext, "quellen")}>Quellen sammeln</ActionLink>
          <ActionLink href={researchHref(regionContext, topTopic, topSignal?.title)}>
            Recherche vertiefen
          </ActionLink>
          <ActionLink
            href={createHref(regionContext, {
              signalTitle: topSignal?.title,
              topic: topTopic,
              reason: "Internen regionalen Beitrag vorbereiten",
            })}
          >
            Beitrag erstellen
          </ActionLink>
          <ActionLink
            href={createHref(regionContext, {
              signalTitle: topSignal?.title,
              topic: topTopic,
              reason: "Dossier-Vorschlag bewusst vorbereiten",
            })}
          >
            Dossier vorbereiten
          </ActionLink>
          <ActionLink href={marketingHref(regionContext, topTopic)}>Kampagne planen</ActionLink>
        </div>
      </section>

      <nav
        data-testid="admin-region-workspace-navigation"
        aria-label="Arbeitsbereiche der Region"
        className="sticky top-0 z-10 -mx-4 overflow-x-auto border-y border-[rgb(var(--border))] bg-[rgb(var(--bg))]/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border"
      >
        <div className="flex min-w-max gap-2">
          {WORKSPACE_VIEWS.map((entry) => (
            <Link
              key={entry.id}
              href={workspaceHref(regionContext, entry.id)}
              aria-current={view === entry.id ? "page" : undefined}
              className={
                view === entry.id
                  ? "rounded-full bg-[rgb(var(--fg))] px-4 py-2 text-sm font-semibold text-[rgb(var(--bg))]"
                  : "rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))]"
              }
            >
              {entry.label}
            </Link>
          ))}
        </div>
      </nav>

      {view === "lagebild" ? (
        <section data-testid="admin-region-lagebild" className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <Card
            eyebrow="Lagebild"
            title="Regionale Signale"
            body="Signale bleiben nach Herkunft, Prüfstatus und Pilotwahrheit unterscheidbar."
          >
            <div className="mt-4 space-y-3">
              {feedSignals.length > 0 ? (
                feedSignals.slice(0, 6).map((signal) => (
                  <div key={signal.id} className="rounded-2xl border border-[rgb(var(--border))] p-4">
                    <div className="flex flex-wrap gap-2 text-xs text-[rgb(var(--muted))]">
                      <span>{sourceTypeLabel(signal.sourceType)}</span>
                      <span>·</span>
                      <span>{regionFeedSignalOriginLabel(signal.provenance.dataOrigin)}</span>
                      <span>·</span>
                      <span>{regionReviewStatusLabel(signal.reviewStatus)}</span>
                    </div>
                    <h3 className="mt-2 font-semibold text-[rgb(var(--fg))]">{signal.title}</h3>
                    <p className="mt-1 text-sm text-[rgb(var(--muted))]">{signal.summary}</p>
                    <p className="mt-2 text-xs font-medium text-cyan-900">
                      {suggestedActionLabel(signal.suggestedAction)}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <ActionLink
                        href={researchHref(
                          regionContext,
                          signal.detectedTopics[0],
                          signal.title,
                        )}
                      >
                        Recherche vorbereiten
                      </ActionLink>
                      <ActionLink href={reviewHref(regionContext)}>Im Review prüfen</ActionLink>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[rgb(var(--muted))]">
                  Noch keine regionalen Signale im bestehenden Readmodel.
                </p>
              )}
            </div>
          </Card>

          <div className="grid content-start gap-4">
            <Card
              eyebrow="Quellenlage"
              title={`${activeSources.length} aktive Quellen`}
              body={`${sourceTestResults.length} Prüfergebnisse · ${communitySourceHints.length} Community-Hinweise. Fehlende Verbindungen werden nicht als Live-Daten dargestellt.`}
            >
              <div className="mt-4">
                <ActionLink href={workspaceHref(regionContext, "quellen")}>
                  Quellenbasis öffnen
                </ActionLink>
              </div>
            </Card>
            <Card
              eyebrow="Themen"
              title={`${topicClusters.length} reviewpflichtige Cluster`}
              body={`${cockpit.publicQuestionsSummary.reviewPending} öffentliche Fragen und ${cockpit.publicClaimsSummary.reviewPending} Aussagen warten auf Prüfung.`}
            >
              <div className="mt-4 space-y-2">
                {topicClusters.slice(0, 4).map((cluster) => (
                  <div key={cluster.id} className="rounded-2xl border border-[rgb(var(--border))] p-3">
                    <p className="text-sm font-semibold text-[rgb(var(--fg))]">{cluster.label}</p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">{cluster.summary}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>
      ) : null}

      {view === "quellen" ? (
        <section data-testid="admin-region-quellen" className="space-y-4">
          <Card
            eyebrow="Quellen & Feeds"
            title="Quellen nachvollziehbar ergänzen und prüfen"
            body="Verwende die bestehenden Quellenverbindungen und kontrollierten Tests. Es startet keine allgemeine Websuche und nichts wird veröffentlicht."
          />
          <RegionSourceConnectionsPanel
            regionId={cockpit.region.id}
            connections={sourceConnections}
            results={sourceTestResults}
          />
        </section>
      ) : null}

      {view === "recherche" ? (
        <section data-testid="admin-region-recherche" className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
          <Card
            eyebrow="Bewusste Recherche"
            title="Fragestellung und Scope zuerst festlegen"
            body="Deep Search ist hier nur eine vorbereitete, reviewpflichtige Übergabe. Es startet kein Provideraufruf, Crawling oder Scraping."
          >
            <div className="mt-4">
              <ActionLink
                href={researchHref(regionContext, topTopic, topSignal?.title)}
                primary
                testId="admin-region-research-handoff"
              >
                Recherche-Aufgabe öffnen
              </ActionLink>
            </div>
          </Card>
          <Card
            eyebrow="Vorhandene Prüfergebnisse"
            title={`${sourceTestResults.length} Quellenprüfungen als Ausgangspunkt`}
          >
            <div className="mt-4 space-y-3">
              {sourceTestResults.length > 0 ? (
                sourceTestResults.map((result) => (
                  <div key={result.id} className="rounded-2xl border border-[rgb(var(--border))] p-4">
                    <h3 className="text-sm font-semibold text-[rgb(var(--fg))]">{result.title}</h3>
                    <p className="mt-1 text-sm text-[rgb(var(--muted))]">{result.summary}</p>
                    <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                      {result.openQuestions.length} offene Fragen · {result.evidenceReferences.length} Belege ·
                      Confidence {result.confidence.toFixed(2)}
                    </p>
                    <div className="mt-3">
                      <ActionLink
                        href={researchHref(
                          regionContext,
                          result.detectedTopics[0],
                          result.connectionLabel,
                        )}
                      >
                        Mit Kontext vertiefen
                      </ActionLink>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[rgb(var(--muted))]">
                  Noch keine geprüften Quellen. Wähle zuerst eine Quelle im Bereich Quellen & Feeds.
                </p>
              )}
            </div>
          </Card>
        </section>
      ) : null}

      {view === "claims" ? (
        <section data-testid="admin-region-claims" className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <Card
            eyebrow="Claims & Evidenz"
            title={`${claimRows.length} Aussagekandidaten aus geprüften Quellen`}
            body="Aussagen bleiben Kandidaten. Übersetzung ist keine Evidenz, und ein offizielles Urteil erfordert menschliches Review."
          >
            <div className="mt-4 space-y-3">
              {claimRows.length > 0 ? (
                claimRows.map(({ claim, result }, index) => (
                  <div
                    key={`${result.id}-${index}`}
                    className="rounded-2xl border border-[rgb(var(--border))] p-4"
                  >
                    <p className="text-sm font-semibold text-[rgb(var(--fg))]">{claim.text}</p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      {claim.basisLabel} · Confidence {claim.confidence.toFixed(2)} ·{" "}
                      {result.evidenceReferences.length} Belege
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <ActionLink href={reviewHref(regionContext)}>Claim prüfen</ActionLink>
                      <ActionLink
                        href={createHref(regionContext, {
                          signalTitle: claim.text,
                          topic: result.detectedTopics[0],
                          reason: "Dossier aus geprüftem Claim-Kontext vorbereiten",
                        })}
                      >
                        Dossier-Draft vorbereiten
                      </ActionLink>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[rgb(var(--muted))]">
                  Noch keine Aussagekandidaten aus geprüften Quellen.
                </p>
              )}
            </div>
          </Card>
          <div className="grid content-start gap-4">
            <Card
              eyebrow="Dossier-Vorschläge"
              title={`${suggestedDossiers.length} Vorschläge`}
              body="Kein Vorschlag erzeugt automatisch ein Dossier."
            >
              <div className="mt-4 space-y-2">
                {suggestedDossiers.slice(0, 4).map((suggestion) => (
                  <div key={suggestion.id} className="rounded-2xl border border-[rgb(var(--border))] p-3">
                    <p className="text-sm font-semibold text-[rgb(var(--fg))]">{suggestion.title}</p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">{suggestion.summary}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card
              eyebrow="Anlassraum-Vorschläge"
              title={`${suggestedAnlassraeume.length} Vorschläge`}
              body="Ein Anlassraum wird erst nach bewusster Vorbereitung und Review angelegt."
            />
          </div>
        </section>
      ) : null}

      {view === "beitraege" ? (
        <section data-testid="admin-region-beitraege" className="grid gap-4 lg:grid-cols-2">
          <Card
            eyebrow="Interner Beitrag"
            title="Regionalen eDebatte-Beitrag vorbereiten"
            body="Der regionale Quellen- und Themenkontext wird an den bestehenden Create-Flow übergeben. Es entsteht kein automatischer Draft."
          >
            <div className="mt-4">
              <ActionLink
                href={createHref(regionContext, {
                  signalTitle: topSignal?.title,
                  topic: topTopic,
                  reason: "Internen regionalen Beitrag vorbereiten",
                })}
                primary
                testId="admin-region-create-handoff"
              >
                Internen Beitrag beginnen
              </ActionLink>
            </div>
          </Card>
          <Card
            eyebrow="Externe Veröffentlichung"
            title="Social-/Web-Beitrag getrennt reviewen"
            body="Für diese Region liegen in diesem Readmodel keine belegten externen Veröffentlichungsstände vor. Externe Varianten bleiben in der bestehenden Marketing-Review- und Publishing-Kette."
          >
            <div className="mt-4 flex flex-wrap gap-2">
              <ActionLink href={withQuery("/admin/marketing/review", { lang: "de", region: regionContext })}>
                Externe Inhalte prüfen
              </ActionLink>
              <ActionLink href={reviewHref(regionContext)}>Freigaben öffnen</ActionLink>
            </div>
          </Card>
          <Card
            eyebrow="Statuswahrheit"
            title="Intern und extern bleiben verbunden, aber getrennt"
            body="Draft, Review, geplant, veröffentlicht oder archiviert wird erst angezeigt, wenn der jeweilige bestehende Flow diesen Status belegt."
          />
        </section>
      ) : null}

      {view === "kampagnen" ? (
        <section data-testid="admin-region-kampagnen" className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card
            eyebrow="Regionale Kampagnen"
            title={`Kampagnenkontext für ${cockpit.region.name} übergeben`}
            body="Region, Thema, B2G-Zielgruppe und regionaler Reichweitenraum werden an die vorhandene Marketing-Control-Plane übergeben. Hier entsteht keine zweite Kampagne."
          >
            <div className="mt-4">
              <ActionLink
                href={marketingHref(regionContext, topTopic)}
                primary
                testId="admin-region-marketing-handoff"
              >
                In Marketing planen
              </ActionLink>
            </div>
          </Card>
          <Card
            eyebrow="Wirkung"
            title="Interne Wirkung und Plattform-Performance getrennt lesen"
            body="Das Region-Readmodel enthält keine verifizierten Kampagnen- oder Performancewerte. Geplante, laufende und gemessene Inhalte bleiben in Marketing und Insights nachvollziehbar."
          >
            <div className="mt-4 flex flex-wrap gap-2">
              <ActionLink href={withQuery("/admin/marketing/insights", { lang: "de", region: regionContext })}>
                Ergebnisse öffnen
              </ActionLink>
            </div>
          </Card>
        </section>
      ) : null}

      {view === "einstellungen" ? (
        <section data-testid="admin-region-einstellungen" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card
              eyebrow="Zugriff"
              title="Verifizierung und Freischaltung"
              testId="admin-region-access-summary"
            >
              <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                  <dt className="text-xs text-[rgb(var(--muted))]">Zuordnung</dt>
                  <dd className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">
                    {authoritySourceLabel(cockpit.accessSummary.authoritySource)}
                  </dd>
                </div>
                <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                  <dt className="text-xs text-[rgb(var(--muted))]">Verifizierung</dt>
                  <dd className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">
                    {organizationVerificationStatusLabel(cockpit.accessSummary.verificationStatus)}
                  </dd>
                </div>
                <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                  <dt className="text-xs text-[rgb(var(--muted))]">Freischaltung</dt>
                  <dd className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">
                    {cockpit.accessSummary.entitlementStatus
                      ? regionEntitlementStatusLabel(cockpit.accessSummary.entitlementStatus)
                      : "Keine Freischaltung"}
                  </dd>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    {regionEntitlementReasonLabel(cockpit.accessSummary.entitlementReason)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                  <dt className="text-xs text-[rgb(var(--muted))]">Plan</dt>
                  <dd className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">
                    {cockpit.accessSummary.entitlementPlanLabel ?? "Kein Plan"}
                  </dd>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    {cockpit.accessSummary.entitlementSource === "not_checked"
                      ? "Noch nicht geprüft"
                      : "Bestehende Freischaltungsquelle"}
                  </p>
                </div>
              </dl>
              <p className="mt-4 text-sm text-[rgb(var(--muted))]">
                Verifizierte Membership allein reicht nicht. Selbstauskunft ist nicht verifiziert.
                Publikationsfreigaben bleiben ein gesonderter menschlicher Schritt.
              </p>
            </Card>
            <Card
              eyebrow="Leitplanken"
              title="Review-first und fail-closed"
              testId="admin-region-guardrails"
              body="Keine automatische Recherche, kein Auto-Publish, kein Auto-Dossier und kein Auto-Anlassraum. Externe Sichtbarkeit erfordert weiterhin die bestehende Freigabe."
            >
              <details className="mt-4 rounded-2xl border border-[rgb(var(--border))] p-3">
                <summary className="cursor-pointer text-sm font-semibold text-[rgb(var(--fg))]">
                  Diagnose und Limits anzeigen
                </summary>
                <p className="mt-3 text-sm text-[rgb(var(--muted))]">
                  Regionen: {cockpit.accessSummary.entitlementUsage?.regionsUsed ?? 0}
                  {cockpit.accessSummary.entitlementLimits?.maxRegions != null
                    ? ` / ${cockpit.accessSummary.entitlementLimits.maxRegions}`
                    : " / offen"}
                  {" · "}Drafts: {cockpit.accessSummary.entitlementUsage?.draftsThisMonth ?? 0}
                  {cockpit.accessSummary.entitlementLimits?.maxDraftsPerMonth != null
                    ? ` / ${cockpit.accessSummary.entitlementLimits.maxDraftsPerMonth}`
                    : " / offen"}
                </p>
              </details>
            </Card>
          </div>
          {cockpit.guidelineMatrix ? (
            <Card
              eyebrow="Leitlinien"
              title={cockpit.guidelineMatrix.title}
              body="Die Leitlinien unterstützen die Prüfung, ersetzen aber weder Rechtsberatung noch menschliche Freigabe."
            >
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {cockpit.guidelineMatrix.criteria.map((criterion) => (
                  <div key={criterion.key} className="rounded-2xl border border-[rgb(var(--border))] p-3">
                    <p className="text-sm font-semibold text-[rgb(var(--fg))]">
                      {criterion.workingRule}
                    </p>
                    <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                      Prüffrage: {criterion.reviewQuestion}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
