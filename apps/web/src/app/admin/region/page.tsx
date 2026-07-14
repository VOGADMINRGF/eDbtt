import Link from "next/link";
import { redirect } from "next/navigation";
import type { RegionAllowedAction, RegionalAdminCockpitReadModel } from "@features/region";
import {
  getOperationalRegionById,
  getRegionalAdminCockpitReadModel,
  organizationVerificationStatusLabel,
  regionEntitlementReasonLabel,
  regionEntitlementStatusLabel,
  regionFeedSignalOriginLabel,
  regionGuardrailLabel,
  regionOpenReviewOriginLabel,
  regionReviewStatusLabel,
  regionVisibilityStateLabel,
  resolveFeedVisibilityState,
} from "@features/region";
import { buildB2GFirstLoginAdminHint } from "@/features/agenticRuntime/b2gFirstLoginJurisdictionCockpitHints";
import { buildMunicipalHandoffTrialRegionHint } from "@/features/agenticRuntime/municipalHandoffThreeAdoptionTrialContract";
import { RegionSourceConnectionsPanel } from "./RegionSourceConnectionsPanel";

type SearchParamsShape =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

function toArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function firstParam(value?: string | string[]) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

function suggestedActionLabel(action: string) {
  switch (action) {
    case "create_anlassraum":
      return "Anlassraum-Vorschlag";
    case "attach_to_anlassraum":
      return "An bestehenden Anlassraum anhängen";
    case "create_dossier":
      return "Dossier-Draft vorbereiten";
    case "attach_source_to_dossier":
      return "Quelle prüfen";
    case "ask_clarifying_question":
      return "Offene Frage markieren";
    default:
      return "Ignorieren";
  }
}

function sourceTypeLabel(value: string) {
  switch (value) {
    case "news":
      return "Nachrichtenhinweis";
    case "official_update":
      return "Verwaltungshinweis";
    case "community_signal":
      return "Bürgerhinweis";
    case "feed_draft":
      return "Feed-Draft";
    case "public_claim":
      return "Öffentliche Aussage";
    case "public_contribution":
      return "Öffentlicher Beitrag";
    case "public_question":
      return "Öffentliche Frage";
    case "public_source_hint":
      return "Öffentlicher Quellenhinweis";
    case "swipe_interest":
      return "Aggregiertes Swipe-Interesse";
    case "swipe_counterpoint":
      return "Aggregierte Gegenposition";
    case "saved_topic":
      return "Gespeichertes Thema";
    case "support_signal":
      return "Unterstütztes Thema";
    default:
      return "Manuelle Notiz";
  }
}

function authoritySourceLabel(value: RegionalAdminCockpitReadModel["accessSummary"]["authoritySource"]) {
  switch (value) {
    case "admin_fallback":
      return "Admin-Fallback";
    case "verified_membership":
      return "Verifizierte Behördenzuordnung";
    default:
      return "Unverifizierter Region-Hinweis";
  }
}

function allowedActionLabel(action: RegionAllowedAction) {
  switch (action) {
    case "read_region_dashboard":
      return "Region-Dashboard lesen";
    case "review_region_signal":
      return "Signale reviewen";
    case "create_region_draft":
      return "Region-Draft vorbereiten";
    case "attach_signal_to_dossier":
      return "Signal an Dossier anhängen";
    case "create_dossier_draft":
      return "Dossier-Draft vorbereiten";
    case "create_anlassraum_draft":
      return "Anlassraum-Draft vorbereiten";
    case "submit_for_review":
      return "Für Review einreichen";
    case "approve_publication":
      return "Publikation freigeben";
    default:
      return "Mitglieder verwalten";
  }
}

function accessHint(cockpit: RegionalAdminCockpitReadModel) {
  if (cockpit.accessSummary.adminFallback) {
    return "Zugriff über adminFallback. Das ist eine globale Adminsicht und noch keine verifizierte Behördenfreischaltung oder bezahlte Freischaltung.";
  }
  if (cockpit.accessSummary.paidDashboardEntitlement !== "granted") {
    return "Verifizierte Membership allein reicht nicht. Für dieses RegionDashboard ist zusätzlich eine aktive oder testweise Freischaltung erforderlich.";
  }
  if (cockpit.accessSummary.verificationStatus === "publication_approved") {
    return "Publikationsfreigabe ist als expliziter menschlicher Freigabeschritt möglich. `public_official` wird nie automatisch vergeben.";
  }
  if (cockpit.accessSummary.verificationStatus === "unit_verified") {
    return "Unit-verifizierte Rollen dürfen Draft- und Review-Aktionen vorbereiten. Veröffentlichung bleibt separat gesperrt.";
  }
  if (cockpit.accessSummary.verificationStatus === "organization_verified") {
    return "Organisations-verifizierte Rollen bleiben read-only für die eigene Region. Draft-Aktionen folgen erst mit zusätzlicher Unit-Verifizierung.";
  }
  return "Selbstauskunft, In-Prüfung-Status oder unverifizierte Zuordnungen sind keine Behördenrechte. Standorte wie Rathaus, Geschäftsstelle oder Redaktionsbüro bleiben optionale Kontextangaben.";
}

function actionStateLabel(cockpit: RegionalAdminCockpitReadModel) {
  if (cockpit.accessSummary.canCreateDossierDraft || cockpit.accessSummary.canCreateAnlassraumDraft) {
    return "Aktion vorbereitet, aber noch nicht ausführbar";
  }
  return "Berechtigung oder CUT-03 erforderlich";
}

function renderEmptyState(label: string) {
  return <p className="text-sm text-[rgb(var(--muted))]">Noch keine {label} sichtbar.</p>;
}

function guidelineLabel(value: string) {
  switch (value) {
    case "fruehzeitigkeit":
      return "Frühzeitigkeit";
    case "transparenz":
      return "Transparenz";
    case "rueckmeldung":
      return "Rückmeldung";
    case "zielgruppenansprache":
      return "Zielgruppenansprache";
    case "barrierefreiheit":
      return "Barrierefreiheit";
    case "dokumentation":
      return "Dokumentation";
    default:
      return "Nachvollziehbarkeit";
  }
}

function aggregationModeLabel(value: string) {
  switch (value) {
    case "anonymized_count":
      return "anonymisiert/aggregiert";
    case "aggregate_only":
      return "aggregiert";
    default:
      return "einzelner Review-Hinweis";
  }
}

function privacyModeLabel(value: string) {
  switch (value) {
    case "anonymized":
      return "anonymisiert";
    case "review_restricted":
      return "reviewbeschränkt";
    default:
      return "ohne Personendaten";
  }
}

function intelligenceSuggestionLabel(value: string) {
  switch (value) {
    case "topic_cluster":
      return "Themencluster";
    case "dossier_suggestion":
      return "Dossier-Vorschlag";
    case "anlassraum_suggestion":
      return "Anlassraum-Vorschlag";
    default:
      return "Review-Vorschlag";
  }
}

export default async function AdminRegionPage({
  searchParams,
}: {
  searchParams?: SearchParamsShape;
}) {
  const resolved = searchParams ? await searchParams : {};
  const selectedRegionId = firstParam(resolved.regionId);
  if (!selectedRegionId) {
    redirect("/admin/regions");
  }
  const region = selectedRegionId ? await getOperationalRegionById(selectedRegionId) : null;
  if (!region) {
    redirect("/admin/regions");
  }
  const cockpit = await getRegionalAdminCockpitReadModel(region.id);
  const openReviewItems = toArray(cockpit.openReviewItems);
  const feedSignals = toArray(cockpit.feedSignals);
  const topicClusters = toArray(cockpit.topicClusters);
  const participationSignals = toArray(cockpit.participationSignals);
  const needsRegionReviewSignals = toArray(cockpit.needsRegionReviewSignals);
  const communitySourceHints = toArray(cockpit.communitySourceHints);
  const reviewItemsFromPublicInput = toArray(cockpit.reviewItemsFromPublicInput);
  const suggestedAnlassraeume = toArray(cockpit.suggestedAnlassraeume);
  const suggestedDossiers = toArray(cockpit.suggestedDossiers);
  const intelligenceSources = toArray(cockpit.intelligenceSources);
  const intelligenceReviewSuggestions = toArray(cockpit.intelligenceReviewSuggestions);
  const sourceConnections = toArray(cockpit.sourceConnections);
  const sourceTestResults = toArray(cockpit.sourceTestResults);
  const allowedActions = toArray(cockpit.accessSummary.allowedActions);
  const guidelineCriteria = cockpit.guidelineMatrix ? toArray(cockpit.guidelineMatrix.criteria) : [];
  const cockpitModules = Object.entries(cockpit.cockpit?.modules ?? {});

  return (
    <main
      data-testid="admin-region-page"
      className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6"
    >
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Regionales Lagebild
        </p>
        <div
          data-testid="admin-region-context"
          className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]"
        >
          <Link href="/admin/regions" className="rounded-full border border-[rgb(var(--border))] px-3 py-1">
            Zur Regionen-Übersicht
          </Link>
          {selectedRegionId ? (
            <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1">
              Arbeitsansicht: {selectedRegionId}
            </span>
          ) : null}
          <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1">
            Detailroute: `/admin/region?regionId=...`
          </span>
        </div>
        <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">Verwaltung, Akteure und Signale</h1>
        <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">
          `/admin/region` bleibt die Detail- und Arbeitsansicht für eine ausgewählte Region. Die Surface verbindet
          regionale Signale, Feed-Vorschläge und reviewpflichtige Dossier- oder Anlassraum-Hinweise. Keine
          automatische Veröffentlichung, keine automatische Dossier-Erstellung, kein Vergabe- oder
          Procurement-Monitoring.
        </p>
        <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">{buildB2GFirstLoginAdminHint()}</p>
        <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">{buildMunicipalHandoffTrialRegionHint()}</p>
      </header>

      <section
        data-testid="admin-region-journey"
        className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Nächster Schritt
        </p>
        <h2 className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">
          Quelle oder Snapshot prüfen, dann bewusst in Review und Sichtbarkeit gehen
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-[rgb(var(--muted))]">
          Hier entstehen reviewpflichtige Signals, Claims, Themencluster sowie Dossier- und
          Anlassraum-Vorschläge. Noch nichts ist sichtbar oder automatisch amtlich.
        </p>
        <p className="mt-2 max-w-3xl text-sm text-[rgb(var(--muted))]">
          Der nächste operative Schritt liegt in der Review Queue: dort wird aus dem Review-Item
          eine Vorschau, danach eine bewusste Sichtbarkeit und erst dann Public URL, QR oder
          Share. Sichtbarkeit kann anschließend wieder zurückgenommen oder archiviert werden.
        </p>
        <p className="mt-2 max-w-3xl text-sm text-[rgb(var(--muted))]">
          Jurisdiktions-Match, reviewed topic candidate und vorgeschlagene Beteiligung bleiben getrennt von offizieller Behördenzuständigkeit oder gestartetem Verfahren.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/admin/review"
            className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))]"
          >
            Review-Queue öffnen
          </Link>
        </div>
      </section>

      {cockpit ? (
        <>
          <section data-testid="admin-region-summary" className="grid gap-3 md:grid-cols-4">
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
              <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Review-Items</p>
              <p className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">{openReviewItems.length}</p>
              <p className="text-sm text-[rgb(var(--muted))]">Review-gated, keine automatische Weiterverarbeitung</p>
            </div>
            <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Authority</p>
              <p className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">
                {authoritySourceLabel(cockpit.accessSummary.authoritySource)}
              </p>
              <p className="text-sm text-[rgb(var(--muted))]">
                {organizationVerificationStatusLabel(cockpit.accessSummary.verificationStatus)}
              </p>
            </div>
          </section>

          <section data-testid="admin-region-access-summary" className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Access Summary</p>
              <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">Zugriff und Verifizierungsstatus</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-[rgb(var(--muted))]">Authority Source</p>
                  <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">
                    {authoritySourceLabel(cockpit.accessSummary.authoritySource)}
                  </p>
                  <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                    Admin-Fallback: {cockpit.accessSummary.adminFallback ? "ja" : "nein"}
                  </p>
                </div>
                <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-[rgb(var(--muted))]">Verification</p>
                  <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">
                    {organizationVerificationStatusLabel(cockpit.accessSummary.verificationStatus)}
                  </p>
                  <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                    In Prüfung hat keine Behördenrechte. Publikationsfreigabe bleibt gesondert erforderlich.
                  </p>
                </div>
                <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-[rgb(var(--muted))]">Freischaltung</p>
                  <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">
                    {cockpit.accessSummary.entitlementStatus
                      ? regionEntitlementStatusLabel(cockpit.accessSummary.entitlementStatus)
                      : "Keine Freischaltung"}
                  </p>
                  <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                    {regionEntitlementReasonLabel(cockpit.accessSummary.entitlementReason)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-[rgb(var(--muted))]">Plan</p>
                  <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">
                    {cockpit.accessSummary.entitlementPlanLabel ?? "Kein Plan"}
                  </p>
                  <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                    {cockpit.accessSummary.entitlementSource === "admin_grant"
                      ? "Admin-Freischaltung, ohne Checkout"
                      : cockpit.accessSummary.entitlementSource === "pilot_grant"
                        ? "Pilot-Freischaltung, ohne Abrechnung"
                        : cockpit.accessSummary.entitlementSource === "manual_contract"
                          ? "Manueller Vertrag, ohne automatische Abbuchung"
                          : cockpit.accessSummary.entitlementSource === "admin_fallback"
                            ? "Admin-Fallback"
                            : cockpit.accessSummary.entitlementSource === "not_checked"
                              ? "Noch nicht geprüft"
                              : cockpit.accessSummary.entitlementSource ?? "Unbekannt"}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm text-[rgb(var(--muted))]">{accessHint(cockpit)}</p>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                Limits/Usage: Regionen {cockpit.accessSummary.entitlementUsage?.regionsUsed ?? 0}
                {cockpit.accessSummary.entitlementLimits?.maxRegions != null
                  ? ` / ${cockpit.accessSummary.entitlementLimits.maxRegions}`
                  : " / offen"}
                {" · "}Drafts {cockpit.accessSummary.entitlementUsage?.draftsThisMonth ?? 0}
                {cockpit.accessSummary.entitlementLimits?.maxDraftsPerMonth != null
                  ? ` / ${cockpit.accessSummary.entitlementLimits.maxDraftsPerMonth}`
                  : " / offen"}
              </p>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                Selbstauskunft ist nicht verifiziert. In Prüfung hat keine Behördenrechte. Eine
                Publikationsfreigabe ist gesondert erforderlich. Standortangaben wie Rathaus,
                Geschäftsstelle oder Redaktionsbüro bleiben optional.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {allowedActions.length > 0 ? (
                  allowedActions.map((action) => (
                    <span
                      key={action}
                      className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]"
                    >
                      {allowedActionLabel(action)}
                    </span>
                  ))
                ) : (
                  <span className="rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-xs text-amber-900">
                    Keine offiziellen Behördenaktionen aktiv
                  </span>
                )}
              </div>
            </article>

            <article
              data-testid="admin-region-guardrails"
              className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5"
            >
              <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Startlage</p>
              <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">
                Aktuelle Themenlage {cockpit.region.name}
              </h2>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                Kuratierte Startlage und Pilotvorschau für die Themenlage. Sichtbar heißt nicht automatisch geprüft
                oder amtlich. Keine Live-Crawler-Behauptung, kein Scraping, keine DeepSearch-Automatikkosten und
                kein Procurement- oder Vergabe-Radar.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                  {regionGuardrailLabel("reviewRequired")}
                </span>
                <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                  {regionGuardrailLabel("noAutoPublish")}
                </span>
                <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                  {regionGuardrailLabel("noAutoDossierCreation")}
                </span>
                <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                  {regionGuardrailLabel("noAutoAnlassraumCreation")}
                </span>
                <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                  {regionGuardrailLabel("noTenderMonitoring")}
                </span>
                <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                  {regionGuardrailLabel("noProcurementMonitoring")}
                </span>
              </div>
              <div className="mt-5 grid gap-3 lg:grid-cols-3">
                <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                    Produktive Quellen
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">
                    {cockpit.intelligenceSourceStatus?.productiveLabel ??
                      "Noch keine produktive Quelle verbunden"}
                  </p>
                  <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                    Kein produktiver Regionaladapter ist verbunden, solange keine echte Quelle angebunden ist.
                  </p>
                </div>
                <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                    Kuratierte Quellen
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">
                    {cockpit.intelligenceSourceStatus?.curatedLabel ??
                      "Noch keine kuratierte Quelle verbunden"}
                  </p>
                  <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                    Kuration bleibt reviewpflichtig und ist keine automatische amtliche Bewertung.
                  </p>
                </div>
                <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                    Manuelle Quellen
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">
                    {cockpit.intelligenceSourceStatus?.manualLabel ??
                      "Noch keine manuellen Quellen verbunden"}
                  </p>
                  <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                    Öffentliche und manuelle Hinweise laufen nur über bestehende Review-Pfade ein.
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] p-4">
                <p className="text-xs uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                  Quellengewichtung und Adapter
                </p>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                  {cockpit.intelligenceWeighting?.label ?? "Gewichtung vorbereitet"}
                </p>
                <div className="mt-3 grid gap-3 lg:grid-cols-3">
                  {intelligenceSources.map((source) => (
                    <div key={source.adapterId} className="rounded-2xl border border-[rgb(var(--border))] p-3">
                      <p className="text-sm font-semibold text-[rgb(var(--fg))]">{source.label}</p>
                      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                        {source.category} · {source.status} · Gewicht {source.weight.toFixed(2)}
                      </p>
                      <p className="mt-2 text-xs text-[rgb(var(--muted))]">{source.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </section>

          <section data-testid="admin-region-feed-signals" className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Feed- und Signal-Hinweise</p>
              <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">
                Aktuelle Themenlage {cockpit.region.name}
              </h2>
              <div className="mt-4 space-y-3">
                {feedSignals.length > 0 ? (
                  feedSignals.slice(0, 6).map((signal) => (
                    <div key={signal.id} className="rounded-2xl border border-[rgb(var(--border))] p-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                        <span>{sourceTypeLabel(signal.sourceType)}</span>
                        <span>·</span>
                        <span>{regionReviewStatusLabel(signal.reviewStatus)}</span>
                        <span>·</span>
                        <span>{regionVisibilityStateLabel(resolveFeedVisibilityState({
                          reviewStatus: signal.reviewStatus,
                          sourceType: signal.sourceType,
                        }))}</span>
                        <span>·</span>
                        <span>Confidence {signal.confidence.toFixed(2)}</span>
                        <span>·</span>
                        <span>
                          {regionFeedSignalOriginLabel(signal.provenance.dataOrigin)}
                        </span>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">{signal.title}</h3>
                      <p className="mt-1 text-sm text-[rgb(var(--muted))]">{signal.summary}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {toArray(signal.detectedTopics).map((topic) => (
                          <span
                            key={topic}
                            className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-xs text-[rgb(var(--muted))]"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                        Orte: {toArray(signal.detectedPlaces).join(", ") || "nicht erkannt"}
                      </p>
                      <p className="mt-2 text-xs font-medium text-cyan-900">{suggestedActionLabel(signal.suggestedAction)}</p>
                    </div>
                  ))
                ) : (
                  renderEmptyState("Signale")
                )}
              </div>
            </article>

            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Themencluster</p>
              <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">Reviewpflichtige Verdichtungen</h2>
              <div className="mt-4 space-y-3">
                {topicClusters.length > 0 ? (
                  topicClusters.slice(0, 5).map((cluster) => (
                    <div key={cluster.id} className="rounded-2xl border border-[rgb(var(--border))] p-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                        <span>{regionReviewStatusLabel(cluster.reviewStatus)}</span>
                        <span>·</span>
                        <span>{toArray(cluster.signalIds).length} Signale</span>
                        <span>·</span>
                        <span>Review-Hinweis aktiv</span>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">{cluster.label}</h3>
                      <p className="mt-1 text-sm text-[rgb(var(--muted))]">{cluster.summary}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {toArray(cluster.detectedTopics).map((topic) => (
                          <span
                            key={topic}
                            className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-xs text-[rgb(var(--muted))]"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  renderEmptyState("Themencluster")
                )}
              </div>
            </article>
          </section>

          {cockpit.guidelineMatrix ? (
            <section
              data-testid="admin-region-guidelines"
              className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5"
            >
              <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Leitlinienmatrix</p>
              <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">
                {cockpit.guidelineMatrix.title}
              </h2>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                Arbeits- und Transparenzmatrix für {cockpit.region.name}. Keine Rechtsberatung, keine automatische
                Leitlinien-Erfüllung und keine automatische Veröffentlichung.
              </p>
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {guidelineCriteria.map((criterion) => (
                  <article key={criterion.key} className="rounded-2xl border border-[rgb(var(--border))] p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                      {guidelineLabel(criterion.key)}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">{criterion.workingRule}</p>
                    <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                      Prüffrage: {criterion.reviewQuestion}
                    </p>
                    <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                      Dokumentationshinweis: {criterion.evidenceHint}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section
            data-testid="admin-region-participation-signals"
            className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]"
          >
            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                Öffentliche Beteiligungssignale
              </p>
              <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">
                Ungeprüft, nicht amtlich, reviewpflichtig
              </h2>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                Öffentliche Aussagen, Beiträge, Fragen, Quellenhinweise und Swipe-Signale erscheinen hier nur
                anonymisiert oder aggregiert. Keine Personenprofile, keine Repräsentativitätsbehauptung und
                keine automatische amtliche Übernahme.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                    Aussagen aus der Öffentlichkeit
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">
                    {cockpit.publicClaimsSummary.total}
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    {cockpit.publicClaimsSummary.reviewPending} reviewpflichtig · nicht repräsentativ
                  </p>
                </div>
                <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                    Fragen aus der Öffentlichkeit
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">
                    {cockpit.publicQuestionsSummary.total}
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    {cockpit.publicQuestionsSummary.reviewPending} reviewpflichtig · nicht amtlich
                  </p>
                </div>
                <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                    Swipe-/Interesse-Signale aggregiert
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">
                    {cockpit.swipeInterestSummary.totalSignals}
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    anonymisiert/aggregiert · keine Personendaten
                  </p>
                </div>
                <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                    Gegenpositionen / andere Sichtweisen
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">
                    {cockpit.counterpointSummary.totalSignals}
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    anonymisiert/aggregiert · nicht repräsentativ
                  </p>
                </div>
              </div>
              {needsRegionReviewSignals.length > 0 ? (
                <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-amber-900">
                    Regionzuordnung offen
                  </p>
                  <p className="mt-2 text-sm text-amber-950">
                    {needsRegionReviewSignals.length} öffentliche Signale bleiben bis zur bestätigten
                    Regionzuordnung außerhalb der aktiven Themenlage.
                  </p>
                  <div className="mt-3 space-y-2">
                    {needsRegionReviewSignals.slice(0, 4).map((signal) => (
                      <div key={signal.id} className="rounded-xl border border-amber-200 bg-white px-3 py-2">
                        <p className="text-sm font-semibold text-[rgb(var(--fg))]">{signal.title}</p>
                        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                          {regionReviewStatusLabel(signal.reviewStatus)} · {privacyModeLabel(signal.privacyMode)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="mt-4 space-y-3">
                {participationSignals.length > 0 ? (
                  participationSignals.slice(0, 6).map((signal) => (
                    <div key={signal.id} className="rounded-2xl border border-[rgb(var(--border))] p-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                        <span>{sourceTypeLabel(signal.sourceType)}</span>
                        <span>·</span>
                        <span>{regionReviewStatusLabel(signal.reviewStatus)}</span>
                        <span>·</span>
                        <span>{regionVisibilityStateLabel(signal.visibilityState)}</span>
                        <span>·</span>
                        <span>{aggregationModeLabel(signal.aggregationMode)}</span>
                        <span>·</span>
                        <span>{privacyModeLabel(signal.privacyMode)}</span>
                        <span>·</span>
                        <span>nicht amtlich</span>
                        <span>·</span>
                        <span>nicht repräsentativ</span>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">{signal.title}</h3>
                      <p className="mt-1 text-sm text-[rgb(var(--muted))]">{signal.summary}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {toArray(signal.detectedTopics).map((topic) => (
                          <span
                            key={topic}
                            className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-xs text-[rgb(var(--muted))]"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                        Orte: {toArray(signal.detectedPlaces).join(", ") || "nicht sicher zugeordnet"}
                      </p>
                    </div>
                  ))
                ) : (
                  renderEmptyState("öffentliche Beteiligungssignale")
                )}
              </div>
            </article>

            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                Review für Beteiligungssignale
              </p>
              <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">
                Quellenhinweise, Aggregation und Datenschutz
              </h2>
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                    Quellenhinweise aus der Community
                  </p>
                  {communitySourceHints.length > 0 ? (
                    communitySourceHints.slice(0, 3).map((signal) => (
                      <p key={signal.id} className="mt-2 text-sm text-[rgb(var(--muted))]">
                        {signal.title}
                      </p>
                    ))
                  ) : (
                    <p className="mt-2 text-sm text-[rgb(var(--muted))]">Noch keine Hinweise sichtbar.</p>
                  )}
                </div>
                <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                    Swipe-Signale
                  </p>
                  <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                    Nur anonymisiert/aggregiert, keine Nutzerlisten, keine politischen Profile, keine
                    Verwaltungssicht auf individuelle Präferenzen.
                  </p>
                </div>
                <div className="rounded-2xl border border-[rgb(var(--border))] p-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                    Review-Items aus öffentlichem Input
                  </p>
                  {reviewItemsFromPublicInput.length > 0 ? (
                    reviewItemsFromPublicInput.slice(0, 4).map((item) => (
                      <div key={item.id} className="mt-2 text-sm text-[rgb(var(--muted))]">
                        {item.title} · {privacyModeLabel(item.privacyMode)} · {aggregationModeLabel(item.aggregationMode)}
                        {" "}· {regionVisibilityStateLabel(item.visibilityState)}
                      </div>
                    ))
                  ) : (
                    <p className="mt-2 text-sm text-[rgb(var(--muted))]">Noch keine Review-Items sichtbar.</p>
                  )}
                </div>
              </div>
            </article>
          </section>

          <section data-testid="admin-region-suggestions" className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Vorgeschlagene Anlassräume</p>
              <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">Nur Vorschläge, kein automatischer Anlassraum</h2>
              <div className="mt-4 space-y-3">
                {suggestedAnlassraeume.length > 0 ? (
                  suggestedAnlassraeume.slice(0, 4).map((suggestion) => (
                    <div key={suggestion.id} className="rounded-2xl border border-[rgb(var(--border))] p-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                        <span>{regionReviewStatusLabel(suggestion.reviewStatus)}</span>
                        <span>·</span>
                        <span>{suggestedActionLabel(suggestion.suggestedAction)}</span>
                        <span>·</span>
                        <span>{toArray(suggestion.relatedSignalIds).length} relatedSignals</span>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">{suggestion.title}</h3>
                      <p className="mt-1 text-sm text-[rgb(var(--muted))]">{suggestion.summary}</p>
                    </div>
                  ))
                ) : (
                  renderEmptyState("Anlassraum-Vorschläge")
                )}
              </div>
            </article>

            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Vorgeschlagene Dossiers</p>
              <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">Nur Vorschläge, kein automatisches Dossier</h2>
              <div className="mt-4 space-y-3">
                {suggestedDossiers.length > 0 ? (
                  suggestedDossiers.slice(0, 4).map((suggestion) => (
                    <div key={suggestion.id} className="rounded-2xl border border-[rgb(var(--border))] p-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                        <span>{regionReviewStatusLabel(suggestion.reviewStatus)}</span>
                        <span>·</span>
                        <span>{suggestedActionLabel(suggestion.suggestedAction)}</span>
                        <span>·</span>
                        <span>{toArray(suggestion.relatedSignalIds).length} relatedSignals</span>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">{suggestion.title}</h3>
                      <p className="mt-1 text-sm text-[rgb(var(--muted))]">{suggestion.summary}</p>
                      {toArray(suggestion.openQuestions).length > 0 ? (
                        <div className="mt-3 space-y-1">
                          {toArray(suggestion.openQuestions).map((question) => (
                            <p key={question} className="text-xs text-[rgb(var(--muted))]">
                              Offene Frage: {question}
                            </p>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  renderEmptyState("Dossier-Vorschläge")
                )}
              </div>
            </article>
          </section>

          <section
            id="intelligence-review-suggestions"
            data-testid="admin-region-open-review"
            className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]"
          >
            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Open Review Items</p>
              <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">Review-gated Arbeitsliste</h2>
              <div className="mt-4 space-y-3">
                {openReviewItems.length > 0 ? (
                  openReviewItems.slice(0, 6).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-[rgb(var(--border))] p-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                        <span>{sourceTypeLabel(item.sourceType)}</span>
                        <span>·</span>
                        <span>{regionReviewStatusLabel(item.reviewStatus)}</span>
                        <span>·</span>
                        <span>{regionVisibilityStateLabel(item.visibilityState)}</span>
                        <span>·</span>
                        <span>{regionOpenReviewOriginLabel(item.isFixture)}</span>
                        <span>·</span>
                        <span>Confidence {item.confidence.toFixed(2)}</span>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">{item.title}</h3>
                      <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                        Aktion bleibt review-gated. Nichts wird automatisch sichtbar gemacht, veröffentlicht oder erstellt.
                      </p>
                    </div>
                  ))
                ) : (
                  renderEmptyState("Review-Items")
                )}
              </div>
            </article>

            <article
              data-testid="admin-region-prepare-actions"
              className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5"
            >
              <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Prepare-only Aktionen</p>
              <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">CUT-03 baut die echten Draft-Routen</h2>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                Diese Aktionen bleiben bewusst non-mutating. Keine automatische Veröffentlichung, keine automatische
                Erstellung, Review und Berechtigung bleiben erforderlich.
              </p>
              <div className="mt-4 grid gap-3">
                {[
                  "Dossier-Draft vorbereiten",
                  "Anlassraum-Draft vorbereiten",
                  "Quelle prüfen",
                  "Offene Frage markieren",
                ].map((label) => (
                  <button
                    key={label}
                    type="button"
                    disabled
                    className="rounded-2xl border border-[rgb(var(--border))] px-4 py-3 text-left text-sm text-[rgb(var(--muted))] opacity-70"
                  >
                    <span className="block font-semibold text-[rgb(var(--fg))]">{label}</span>
                    <span className="mt-1 block text-xs text-[rgb(var(--muted))]">
                      {actionStateLabel(cockpit)} · Persistente Draft-Erstellung läuft serverseitig nur für akzeptierte Signale. Diese Oberfläche bleibt bewusst prepare-only.
                    </span>
                  </button>
                ))}
              </div>
            </article>
          </section>

          <section data-testid="admin-region-intelligence-review-suggestions" className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
                Intelligence-Vorschläge
              </p>
              <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">
                Reviewpflichtige Startlage-Vorschläge
              </h2>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                Intelligence-Ergebnisse bleiben reviewpflichtige Vorschläge. Nichts wird automatisch veröffentlicht,
                nichts wird automatisch amtlich und `public_official` wird hier nie automatisch vergeben.
              </p>
              <div className="mt-4 space-y-3">
                {intelligenceReviewSuggestions.length > 0 ? (
                  intelligenceReviewSuggestions.slice(0, 6).map((suggestion) => (
                    <div key={suggestion.id} className="rounded-2xl border border-[rgb(var(--border))] p-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                        <span>{intelligenceSuggestionLabel(suggestion.suggestionType)}</span>
                        <span>·</span>
                        <span>{regionReviewStatusLabel(suggestion.reviewStatus)}</span>
                        <span>·</span>
                        <span>{regionVisibilityStateLabel(suggestion.visibilityState)}</span>
                        <span>·</span>
                        <span>Confidence {suggestion.confidence.toFixed(2)}</span>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">{suggestion.title}</h3>
                      <p className="mt-1 text-sm text-[rgb(var(--muted))]">{suggestion.summary}</p>
                      <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                        {suggestion.sourceStatusLabel}
                      </p>
                    </div>
                  ))
                ) : (
                  renderEmptyState("Intelligence-Vorschläge")
                )}
              </div>
            </article>
          </section>

          <section data-testid="admin-region-modules" className="grid gap-4 lg:grid-cols-2">
            {cockpitModules.map(([key, module]) => (
              <article key={key} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">{key}</p>
                <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">{module.headline}</h2>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">{module.summary}</p>
              </article>
            ))}
          </section>

          <RegionSourceConnectionsPanel
            regionId={cockpit.region.id}
            connections={sourceConnections}
            results={sourceTestResults}
          />
        </>
      ) : (
        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 text-sm text-[rgb(var(--muted))]">
          Noch keine Region gefunden.
        </section>
      )}
    </main>
  );
}
