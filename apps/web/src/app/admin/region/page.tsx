import Link from "next/link";
import type { Region, RegionalAdminCockpitReadModel } from "@features/region";
import {
  getOperationalRegionById,
  getRegionalAdminCockpitReadModel,
  listOperationalRegions,
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

type ExperienceStatus =
  | "bereits erprobt"
  | "teilweise vorbereitet"
  | "noch ohne Erfahrung"
  | "manuelle Freigabe erforderlich";

type ExperienceEntry = {
  label: string;
  status: ExperienceStatus;
  basis: string;
  gap: string;
};

function toArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function firstParam(value?: string | string[]) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

function countLabel(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
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

function marketingHref() {
  return withQuery("/admin/marketing", {
    lang: "de",
    segment: "b2g",
    reach: "regional",
  });
}

function reviewHref(region: string) {
  return withQuery("/admin/review", { regionId: region });
}

function regionTypeLabel(value: string) {
  switch (value) {
    case "bezirk":
      return "Bezirk";
    case "kommune":
      return "Kommune";
    case "land":
      return "Land";
    case "landkreis":
      return "Landkreis";
    case "quartier":
      return "Quartier";
    case "region":
      return "Region";
    default:
      return value;
  }
}

function experienceStatusClass(status: ExperienceStatus) {
  switch (status) {
    case "bereits erprobt":
      return "border-emerald-300 bg-emerald-50 text-emerald-900";
    case "teilweise vorbereitet":
      return "border-cyan-300 bg-cyan-50 text-cyan-900";
    case "manuelle Freigabe erforderlich":
      return "border-amber-300 bg-amber-50 text-amber-950";
    default:
      return "border-slate-300 bg-slate-50 text-slate-800";
  }
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

function RegionSelector(props: {
  regions: Region[];
  selectedRegion: Region | null;
  invalidSelection?: string | null;
}) {
  const typeCounts = new Map<string, number>();
  props.regions.forEach((region) => {
    typeCounts.set(region.type, (typeCounts.get(region.type) ?? 0) + 1);
  });

  return (
    <section
      data-testid="admin-region-selector"
      className="rounded-3xl border-2 border-cyan-400 bg-gradient-to-br from-cyan-50 via-[rgb(var(--card))] to-[rgb(var(--card))] p-5 shadow-sm sm:p-7"
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-900">
            Region zuerst
          </p>
          <h1 className="mt-2 break-words text-2xl font-semibold text-[rgb(var(--fg))] sm:text-3xl">
            Region suchen und auswählen
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
            Suche in den vorhandenen Regionseinträgen. Erst danach zeigt der Arbeitsraum
            belegte Erfahrung, Lücken und die nächste sinnvolle Aktion für genau diese Region.
          </p>
          <form method="get" action="/admin/region" className="mt-5 flex flex-col gap-3 sm:flex-row">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Region nach Name oder Typ suchen</span>
              <input
                type="search"
                name="regionId"
                list="admin-region-options"
                defaultValue={props.selectedRegion?.slug ?? props.invalidSelection ?? ""}
                placeholder="z. B. Berlin Reinickendorf, Kommune oder Landkreis"
                autoComplete="off"
                className="min-h-12 w-full rounded-2xl border border-cyan-400 bg-white px-4 text-base text-[rgb(var(--fg))]"
              />
            </label>
            <button
              type="submit"
              className="min-h-12 rounded-full bg-[rgb(var(--fg))] px-5 text-sm font-semibold text-[rgb(var(--bg))]"
            >
              Regionsprofil öffnen
            </button>
            <datalist id="admin-region-options">
              {props.regions.map((region) => (
                <option
                  key={region.id}
                  value={region.slug || region.id}
                  label={`${region.name} · ${regionTypeLabel(region.type)}`}
                />
              ))}
            </datalist>
          </form>
          {props.invalidSelection ? (
            <p role="alert" className="mt-3 text-sm font-medium text-amber-900">
              „{props.invalidSelection}“ ist kein vorhandener Regionseintrag. Bitte wähle einen
              Vorschlag aus der Liste.
            </p>
          ) : null}
        </div>
        {props.selectedRegion ? (
          <div className="min-w-0 rounded-2xl border border-cyan-300 bg-white/80 p-4 lg:max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-900">
              Aktuell ausgewählt
            </p>
            <p className="mt-2 break-words text-lg font-semibold text-[rgb(var(--fg))]">
              {props.selectedRegion.name}
            </p>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">
              {props.selectedRegion.administrativeUnitType ??
                regionTypeLabel(props.selectedRegion.type)}
            </p>
          </div>
        ) : null}
      </div>
      <div className="mt-5 flex flex-wrap gap-2 text-xs text-[rgb(var(--muted))]">
        {Array.from(typeCounts.entries())
          .sort(([left], [right]) => regionTypeLabel(left).localeCompare(regionTypeLabel(right), "de"))
          .map(([type, count]) => (
            <span key={type} className="rounded-full border border-[rgb(var(--border))] bg-white px-3 py-1">
              {regionTypeLabel(type)} · {count}
            </span>
          ))}
      </div>
    </section>
  );
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
  const regions = (await listOperationalRegions()).sort((left, right) =>
    left.name.localeCompare(right.name, "de"),
  );
  const region = selectedRegionId ? await getOperationalRegionById(selectedRegionId) : null;

  if (!region) {
    return (
      <main
        data-testid="admin-region-page"
        className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8"
      >
        <RegionSelector
          regions={regions}
          selectedRegion={null}
          invalidSelection={selectedRegionId}
        />
        <section
          data-testid="admin-region-empty-profile"
          className="rounded-3xl border border-dashed border-[rgb(var(--border))] p-6"
        >
          <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">
            Noch kein Regionsprofil ausgewählt
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
            Ohne ausgewählte Region gibt es keine belastbare Aussage zu Erfahrung, Quellen,
            Themen oder Kampagnen. Wähle oben einen vorhandenen Eintrag aus.
          </p>
        </section>
      </main>
    );
  }

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
  const activeDossiers = toArray(cockpit.activeDossiers);
  const activeAnlassraeume = toArray(cockpit.activeAnlassraeume);
  const participationSignals = toArray(cockpit.participationSignals);
  const communitySignals = toArray(cockpit.communitySignals);
  const activeSources = sourceConnections.filter((connection) => connection.enabled);
  const fixtureSignals = feedSignals.filter((signal) => signal.provenance.isFixture);
  const nonFixtureSignals = feedSignals.filter((signal) => !signal.provenance.isFixture);
  const topSignal = feedSignals[0] ?? null;
  const topTopic = topSignal?.detectedTopics?.[0] ?? topicClusters[0]?.label ?? null;
  const claimRows = sourceTestResults.flatMap((result) =>
    result.possibleClaims.map((claim) => ({ claim, result })),
  );
  const contributionCount = participationSignals.length + communitySignals.length;
  const experienceEntries: ExperienceEntry[] = [
    {
      label: "Quellen",
      status:
        sourceTestResults.length > 0
          ? "bereits erprobt"
          : sourceConnections.length > 0
            ? "teilweise vorbereitet"
            : "noch ohne Erfahrung",
      basis:
        sourceConnections.length > 0 || sourceTestResults.length > 0
          ? `${countLabel(sourceConnections.length, "hinterlegte Quellenverbindung", "hinterlegte Quellenverbindungen")}, ${countLabel(sourceTestResults.length, "kontrolliertes Prüfergebnis", "kontrollierte Prüfergebnisse")} im Regionsreadmodel.`
          : "Im Regionsreadmodel sind weder Quellenverbindungen noch Prüfergebnisse hinterlegt.",
      gap:
        sourceConnections.length === 0
          ? "Eine konkrete regionale Quelle fehlt."
          : sourceTestResults.length === 0
            ? "Die hinterlegte Quelle wurde noch nicht kontrolliert geprüft."
            : "Live-Anbindung und Veröffentlichung werden daraus nicht abgeleitet.",
    },
    {
      label: "Feeds & Themen",
      status:
        nonFixtureSignals.length > 0
          ? "bereits erprobt"
          : feedSignals.length > 0 || topicClusters.length > 0
            ? "teilweise vorbereitet"
            : "noch ohne Erfahrung",
      basis:
        feedSignals.length > 0
          ? `${countLabel(feedSignals.length, "Feed-Signal", "Feed-Signale")} und ${countLabel(topicClusters.length, "Themencluster", "Themencluster")}; davon ${fixtureSignals.length} als Pilot-/Fixture-Daten gekennzeichnet.`
          : "Keine Feed-Signale oder Themencluster für diese Region im Readmodel.",
      gap:
        fixtureSignals.length === feedSignals.length && feedSignals.length > 0
          ? "Es gibt noch kein nicht-fiktionales regionales Feed-Signal."
          : feedSignals.length === 0
            ? "Eine belegte regionale Themenlage fehlt."
            : "Offene Signale bleiben reviewpflichtig.",
    },
    {
      label: "Claims & Dossiers",
      status:
        activeDossiers.length > 0
          ? "bereits erprobt"
          : claimRows.length > 0 || suggestedDossiers.length > 0
            ? "teilweise vorbereitet"
            : "noch ohne Erfahrung",
      basis:
        activeDossiers.length > 0 || claimRows.length > 0 || suggestedDossiers.length > 0
          ? `${countLabel(claimRows.length, "Claim-Kandidat", "Claim-Kandidaten")}, ${countLabel(suggestedDossiers.length, "Dossier-Vorschlag", "Dossier-Vorschläge")} und ${countLabel(activeDossiers.length, "aktive Dossier-Referenz", "aktive Dossier-Referenzen")}.`
          : "Keine Claim-Kandidaten, Dossier-Vorschläge oder aktiven Dossier-Referenzen vorhanden.",
      gap:
        activeDossiers.length === 0
          ? "Noch kein regional belegtes Dossier im aktiven Referenzbestand."
          : "Aussagen und Zuordnungen benötigen weiterhin menschliches Review.",
    },
    {
      label: "Beiträge",
      status: contributionCount > 0 ? "teilweise vorbereitet" : "noch ohne Erfahrung",
      basis:
        contributionCount > 0
          ? `${countLabel(participationSignals.length, "Beteiligungssignal", "Beteiligungssignale")} und ${countLabel(communitySignals.length, "Community-Hinweis", "Community-Hinweise")} im regionalen Scope.`
          : "Keine regionalen Beteiligungssignale oder Community-Hinweise im Readmodel.",
      gap: "Interne Drafts und externe Veröffentlichungsstände sind hier nicht regional angebunden.",
    },
    {
      label: "Kampagnen",
      status: "manuelle Freigabe erforderlich",
      basis:
        "Das Regionsreadmodel enthält keine verifizierten Kampagnen- oder Performancewerte; nur die bestehende Marketing-Control-Plane ist erreichbar.",
      gap: "Der ausgewählte Regionenkontext wird aktuell nicht automatisch an Marketing übertragen.",
    },
    {
      label: "Institutionen & Initiativen",
      status: cockpit.actorsSummary.total > 0 ? "teilweise vorbereitet" : "noch ohne Erfahrung",
      basis:
        cockpit.actorsSummary.total > 0
          ? `${countLabel(cockpit.actorsSummary.total, "Akteur", "Akteure")}, davon ${cockpit.actorsSummary.verified} verifiziert und ${cockpit.actorsSummary.officialDirectory} aus dem amtlichen Verzeichnis.`
          : "Keine Akteure für diese Region im vorhandenen Register.",
      gap: "Initiativen werden im Regionsreadmodel nicht als eigener belegter Bestand ausgewiesen.",
    },
    {
      label: "Sprachkontexte",
      status: "noch ohne Erfahrung",
      basis: `Das Regionsprofil belegt ${cockpit.region.country ?? "kein Land"}, enthält aber keine regionalen Sprachdaten.`,
      gap: "Ein belegter regionaler Sprachkontext ist noch nicht angebunden.",
    },
  ];
  const experienceCount = experienceEntries.filter(
    (entry) => entry.status === "bereits erprobt",
  ).length;
  const preparedCount = experienceEntries.filter(
    (entry) => entry.status === "teilweise vorbereitet",
  ).length;
  const emptyCount = experienceEntries.filter(
    (entry) => entry.status === "noch ohne Erfahrung",
  ).length;
  const nextAction =
    sourceConnections.length === 0
      ? {
          label: "Erste regionale Quelle vorbereiten",
          href: workspaceHref(regionContext, "quellen"),
          body: "Die größte belegte Lücke ist die fehlende Quellenbasis. Hinterlege zuerst genau eine nachvollziehbare regionale Quelle.",
        }
      : sourceTestResults.length === 0
        ? {
            label: "Hinterlegte Quelle kontrolliert prüfen",
            href: workspaceHref(regionContext, "quellen"),
            body: "Eine Verbindung ist vorbereitet, aber noch nicht geprüft. Führe den bestehenden kontrollierten Quellentest aus.",
          }
        : openReviewItems.length > 0
          ? {
              label: `${openReviewItems.length} regionale Hinweise im Lagebild prüfen`,
              href: `${workspaceHref(regionContext, "lagebild")}#region-signals`,
              body: "Quellenprüfung liegt vor. Als Nächstes müssen Herkunft, Regionbezug und Evidenz der offenen Hinweise lokal gesichtet werden.",
            }
          : claimRows.length > 0 && activeDossiers.length === 0
            ? {
                label: "Claim-Kandidaten für ein Dossier prüfen",
                href: workspaceHref(regionContext, "claims"),
                body: "Geprüfte Quellen liefern Claim-Kandidaten, aber noch kein aktives regionales Dossier.",
              }
            : {
                label: "Regionalen Beitrag bewusst vorbereiten",
                href: workspaceHref(regionContext, "beitraege"),
                body: "Die belegte Grundlage ist vorbereitet. Der nächste Schritt bleibt ein manueller interner Beitragsentwurf.",
              };

  return (
    <main
      data-testid="admin-region-page"
      className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:py-8"
    >
      <RegionSelector regions={regions} selectedRegion={region} />

      <header data-testid="admin-region-context" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
            <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1">
              {cockpit.region.administrativeUnitType ?? regionTypeLabel(cockpit.region.type)}
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
            Ausgewähltes Regionsprofil
          </p>
          <h2 className="mt-2 break-words text-3xl font-semibold text-[rgb(var(--fg))] sm:text-4xl">
            {cockpit.region.name}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
            Das Profil fasst ausschließlich vorhandene Regions-, Quellen- und
            Beteiligungsreadmodels zusammen. Fehlende Anbindungen bleiben als Lücke sichtbar.
          </p>
        </div>
      </header>

      <section
        data-testid="admin-region-profile"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className="min-w-0 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <p className="text-xs text-[rgb(var(--muted))]">Regionstyp</p>
          <p className="mt-1 break-words text-base font-semibold text-[rgb(var(--fg))]">
            {cockpit.region.administrativeUnitType ?? regionTypeLabel(cockpit.region.type)}
          </p>
          <p className="mt-2 break-words text-xs text-[rgb(var(--muted))]">
            {cockpit.region.federalState ?? "Kein Bundesland hinterlegt"} ·{" "}
            {cockpit.region.country ?? "Kein Land hinterlegt"}
          </p>
        </div>
        <div className="min-w-0 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <p className="text-xs text-[rgb(var(--muted))]">Zuständige Stelle</p>
          <p className="mt-1 break-words text-base font-semibold text-[rgb(var(--fg))]">
            {cockpit.region.officialBody?.label ?? "Keine amtliche Stelle hinterlegt"}
          </p>
          <p className="mt-2 break-words text-xs text-[rgb(var(--muted))]">
            {cockpit.region.officialDirectoryEntry
              ? `Amtlicher Verzeichniseintrag, Stand ${cockpit.region.officialDirectoryEntry.sourceAsOf}`
              : "Noch nicht mit einem amtlichen Verzeichniseintrag verbunden"}
          </p>
        </div>
        <div className="min-w-0 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <p className="text-xs text-[rgb(var(--muted))]">Regionale Erfahrung</p>
          <p className="mt-1 text-base font-semibold text-[rgb(var(--fg))]">
            {experienceCount} erprobt · {preparedCount} vorbereitet
          </p>
          <p className="mt-2 text-xs text-[rgb(var(--muted))]">
            {emptyCount} Bereiche noch ohne Erfahrung
          </p>
        </div>
        <div className="min-w-0 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
          <p className="text-xs text-[rgb(var(--muted))]">Belegte Arbeitsgrundlage</p>
          <p className="mt-1 text-base font-semibold text-[rgb(var(--fg))]">
            {countLabel(sourceTestResults.length, "Quellenprüfung", "Quellenprüfungen")} ·{" "}
            {countLabel(openReviewItems.length, "offener Hinweis", "offene Hinweise")}
          </p>
          <p className="mt-2 text-xs text-[rgb(var(--muted))]">
            {countLabel(activeAnlassraeume.length, "Anlassraum", "Anlassräume")} ·{" "}
            {countLabel(cockpit.actorsSummary.total, "Akteur", "Akteure")}
          </p>
        </div>
      </section>

      <section data-testid="admin-region-experience" className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Fähigkeiten und Evidenzen
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[rgb(var(--fg))]">
            Was eDebatte für diese Region bereits weiß
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
            Jeder Status nennt seine Grundlage und die verbleibende Lücke. Pilotdaten,
            kontrollierte Tests und fehlende Anbindungen werden nicht gleichgesetzt.
          </p>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {experienceEntries.map((entry) => (
            <article
              key={entry.label}
              data-experience-status={entry.status}
              className="min-w-0 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5"
            >
              <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                <h3 className="break-words text-base font-semibold text-[rgb(var(--fg))]">
                  {entry.label}
                </h3>
                <span
                  className={`max-w-full rounded-full border px-3 py-1 text-xs font-semibold ${experienceStatusClass(entry.status)}`}
                >
                  {entry.status}
                </span>
              </div>
              <p className="mt-4 break-words text-sm leading-6 text-[rgb(var(--muted))]">
                <strong className="font-semibold text-[rgb(var(--fg))]">Grundlage:</strong>{" "}
                {entry.basis}
              </p>
              <p className="mt-2 break-words text-sm leading-6 text-[rgb(var(--muted))]">
                <strong className="font-semibold text-[rgb(var(--fg))]">Lücke:</strong>{" "}
                {entry.gap}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        data-testid="admin-region-next-action"
        className="grid gap-4 rounded-3xl border-2 border-cyan-400 bg-cyan-50/70 p-5 lg:grid-cols-[1fr_auto] lg:items-center"
      >
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-900">
            Genau eine nächste Aktion
          </p>
          <h2 className="mt-2 break-words text-xl font-semibold text-[rgb(var(--fg))]">
            {nextAction.label}
          </h2>
          <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-[rgb(var(--muted))]">
            {nextAction.body}
          </p>
        </div>
        <ActionLink href={nextAction.href} primary testId="admin-region-primary-action">
          {nextAction.label}
        </ActionLink>
      </section>

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Nachgeordnete Arbeitsbereiche
        </p>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Alle Bereiche bleiben im URL-Kontext von {cockpit.region.name}.
        </p>
      </div>

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
        <section
          id="region-signals"
          data-testid="admin-region-lagebild"
          className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]"
        >
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
                    <div className="mt-3">
                      <ActionLink href={workspaceHref(regionContext, "recherche")}>
                        Bewusste Recherche öffnen
                      </ActionLink>
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
              title={countLabel(activeSources.length, "aktive Quelle", "aktive Quellen")}
              body={`${countLabel(sourceTestResults.length, "Prüfergebnis", "Prüfergebnisse")} · ${countLabel(communitySourceHints.length, "Community-Hinweis", "Community-Hinweise")}. Fehlende Verbindungen werden nicht als Live-Daten dargestellt.`}
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
            body="Dieser Regionsbereich ordnet vorhandene Prüfergebnisse ein. Die bestehende Recherche-Aufgabenliste erhält aktuell keinen Regionskontext; es startet kein Provideraufruf, Crawling oder Scraping."
          >
            <div className="mt-4">
              <ActionLink
                href="/admin/research/tasks"
                testId="admin-region-research-handoff"
              >
                Bestehende Recherche-Aufgaben öffnen
              </ActionLink>
            </div>
          </Card>
          <Card
            eyebrow="Vorhandene Prüfergebnisse"
            title={`${countLabel(sourceTestResults.length, "Quellenprüfung", "Quellenprüfungen")} als Ausgangspunkt`}
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
                      <ActionLink href={workspaceHref(regionContext, "claims")}>
                        Claim-Kandidaten prüfen
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
                      <ActionLink href={reviewHref(cockpit.region.id)}>Claim prüfen</ActionLink>
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
              <ActionLink href={withQuery("/admin/marketing/review", { lang: "de" })}>
                Externe Inhalte prüfen
              </ActionLink>
              <ActionLink href={reviewHref(cockpit.region.id)}>Freigaben öffnen</ActionLink>
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
            title="Marketing-Arbeitsbereich kontrolliert öffnen"
            body={`Die vorhandene Marketing-Control-Plane unterstützt B2G und regionale Reichweite. ${cockpit.region.name} wird dort aktuell nicht automatisch als Regionenkontext übernommen; hier entsteht keine zweite Kampagne.`}
          >
            <div className="mt-4">
              <ActionLink
                href={marketingHref()}
                testId="admin-region-marketing-handoff"
              >
                B2G-Kampagnen öffnen
              </ActionLink>
            </div>
          </Card>
          <Card
            eyebrow="Wirkung"
            title="Interne Wirkung und Plattform-Performance getrennt lesen"
            body="Das Region-Readmodel enthält keine verifizierten Kampagnen- oder Performancewerte. Geplante, laufende und gemessene Inhalte bleiben in Marketing und Insights nachvollziehbar."
          >
            <div className="mt-4 flex flex-wrap gap-2">
              <ActionLink href={withQuery("/admin/marketing/insights", { lang: "de" })}>
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
