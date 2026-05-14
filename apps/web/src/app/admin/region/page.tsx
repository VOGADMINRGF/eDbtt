import Link from "next/link";
import type { RegionAllowedAction, RegionalAdminCockpitReadModel } from "@features/region";
import {
  getRegionalAdminCockpitReadModel,
  listOperationalRegions,
} from "@features/region";

type SearchParamsShape =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

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
    default:
      return "Manuelle Notiz";
  }
}

function reviewStatusLabel(value: string) {
  switch (value) {
    case "accepted":
      return "akzeptiert";
    case "rejected":
      return "abgelehnt";
    case "archived":
      return "archiviert";
    case "needs_review":
      return "reviewpflichtig";
    default:
      return "Entwurf";
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

function verificationStatusLabel(
  value: RegionalAdminCockpitReadModel["accessSummary"]["verificationStatus"],
) {
  switch (value) {
    case "admin_fallback":
      return "Admin-Fallback";
    case "publication_approved":
      return "Publikationsfreigabe bestätigt";
    case "unit_verified":
      return "Unit-verifiziert";
    case "organization_verified":
      return "Organisations-verifiziert";
    case "email_verified":
      return "E-Mail-verifiziert";
    case "pending_review":
      return "Pending Review";
    case "unverified":
      return "Unverifiziert";
    case "rejected":
      return "Abgelehnt";
    case "revoked":
      return "Widerrufen";
    default:
      return "Keine verifizierte Behördenrolle";
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
    return "Zugriff über adminFallback. Das ist eine globale Adminsicht und noch keine verifizierte Behördenfreischaltung.";
  }
  if (cockpit.accessSummary.verificationStatus === "publication_approved") {
    return "Publikationsfreigabe wäre theoretisch erlaubt. CUT-02 baut dafür bewusst noch keine Publikationsroute.";
  }
  if (cockpit.accessSummary.verificationStatus === "unit_verified") {
    return "Unit-verifizierte Rollen dürfen Draft- und Review-Aktionen vorbereiten. Veröffentlichung bleibt separat gesperrt.";
  }
  if (cockpit.accessSummary.verificationStatus === "organization_verified") {
    return "Organisations-verifizierte Rollen bleiben read-only für die eigene Region. Draft-Aktionen folgen erst mit zusätzlicher Unit-Verifizierung.";
  }
  return "Self-declared, pending oder unverifizierte Zuordnungen sind keine Behördenrechte. Standorte wie Rathaus Reinickendorf bleiben optionale Kontextangaben.";
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

export default async function AdminRegionPage({
  searchParams,
}: {
  searchParams?: SearchParamsShape;
}) {
  const resolved = searchParams ? await searchParams : {};
  const regions = await listOperationalRegions();
  const selectedRegionId = firstParam(resolved.regionId) ?? regions[0]?.slug ?? regions[0]?.id ?? null;
  const cockpit = selectedRegionId ? await getRegionalAdminCockpitReadModel(selectedRegionId) : null;

  return (
    <main
      data-testid="admin-region-page"
      className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6"
    >
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Regionales Lagebild
        </p>
        <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">Verwaltung, Akteure und Signale</h1>
        <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">
          Die Surface verbindet regionale Signale, Feed-Vorschläge und reviewpflichtige Dossier- oder
          Anlassraum-Hinweise. Keine automatische Veröffentlichung, keine automatische Dossier-Erstellung,
          kein Vergabe- oder Procurement-Monitoring.
        </p>
      </header>

      <section
        data-testid="admin-region-selector"
        className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4"
      >
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">Region auswählen</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {regions.slice(0, 18).map((region) => (
            <Link
              key={region.id}
              href={`/admin/region?regionId=${encodeURIComponent(region.slug || region.id)}`}
              className={`rounded-full border px-3 py-1 text-xs ${
                region.id === cockpit?.region.id || region.slug === selectedRegionId
                  ? "border-cyan-400 bg-cyan-500/10 text-cyan-900"
                  : "border-[rgb(var(--border))] text-[rgb(var(--muted))]"
              }`}
            >
              {region.name}
            </Link>
          ))}
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
              <p className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">{cockpit.openReviewItems.length}</p>
              <p className="text-sm text-[rgb(var(--muted))]">Review-gated, keine automatische Weiterverarbeitung</p>
            </div>
            <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Authority</p>
              <p className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">
                {authoritySourceLabel(cockpit.accessSummary.authoritySource)}
              </p>
              <p className="text-sm text-[rgb(var(--muted))]">
                {verificationStatusLabel(cockpit.accessSummary.verificationStatus)}
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
                    {verificationStatusLabel(cockpit.accessSummary.verificationStatus)}
                  </p>
                  <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                    Pending hat keine Behördenrechte. Publication approval bleibt gesondert erforderlich.
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm text-[rgb(var(--muted))]">{accessHint(cockpit)}</p>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                Self-declared ist nicht verifiziert. Pending hat keine Behördenrechte. Publication approval ist
                gesondert erforderlich. Standortangaben wie Rathaus Reinickendorf bleiben optional.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {cockpit.accessSummary.allowedActions.length > 0 ? (
                  cockpit.accessSummary.allowedActions.map((action) => (
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
              <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Pilotlage</p>
              <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">
                Aktuelle Themenlage {cockpit.region.name}
              </h2>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                Pilotdaten zur Demonstration der Themenlage. Keine echten Nachrichten, keine produktiven Verwaltungsdaten,
                kein Procurement- oder Vergabe-Radar.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                  reviewRequired: {cockpit.guardrails.reviewRequired ? "true" : "false"}
                </span>
                <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                  noAutoPublish: {cockpit.guardrails.noAutoPublish ? "true" : "false"}
                </span>
                <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                  noAutoDossierCreation: {cockpit.guardrails.noAutoDossierCreation ? "true" : "false"}
                </span>
                <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                  noAutoAnlassraumCreation: {cockpit.guardrails.noAutoAnlassraumCreation ? "true" : "false"}
                </span>
                <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                  noTenderMonitoring: {cockpit.guardrails.noTenderMonitoring ? "true" : "false"}
                </span>
                <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                  noProcurementMonitoring: {cockpit.guardrails.noProcurementMonitoring ? "true" : "false"}
                </span>
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
                {cockpit.feedSignals.length > 0 ? (
                  cockpit.feedSignals.slice(0, 6).map((signal) => (
                    <div key={signal.id} className="rounded-2xl border border-[rgb(var(--border))] p-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                        <span>{sourceTypeLabel(signal.sourceType)}</span>
                        <span>·</span>
                        <span>{reviewStatusLabel(signal.reviewStatus)}</span>
                        <span>·</span>
                        <span>Confidence {signal.confidence.toFixed(2)}</span>
                        <span>·</span>
                        <span>
                          {signal.provenance.dataOrigin === "pilot_fixture"
                            ? "pilot fixture · not real news · not production data"
                            : "runtime review queue"}
                        </span>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">{signal.title}</h3>
                      <p className="mt-1 text-sm text-[rgb(var(--muted))]">{signal.summary}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {signal.detectedTopics.map((topic) => (
                          <span
                            key={topic}
                            className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-xs text-[rgb(var(--muted))]"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                        Orte: {signal.detectedPlaces.join(", ") || "nicht erkannt"}
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
                {cockpit.topicClusters.length > 0 ? (
                  cockpit.topicClusters.slice(0, 5).map((cluster) => (
                    <div key={cluster.id} className="rounded-2xl border border-[rgb(var(--border))] p-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                        <span>{reviewStatusLabel(cluster.reviewStatus)}</span>
                        <span>·</span>
                        <span>{cluster.signalIds.length} Signale</span>
                        <span>·</span>
                        <span>Review-Hinweis aktiv</span>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">{cluster.label}</h3>
                      <p className="mt-1 text-sm text-[rgb(var(--muted))]">{cluster.summary}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {cluster.detectedTopics.map((topic) => (
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

          <section data-testid="admin-region-suggestions" className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Vorgeschlagene Anlassräume</p>
              <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">Nur Vorschläge, kein automatischer Anlassraum</h2>
              <div className="mt-4 space-y-3">
                {cockpit.suggestedAnlassraeume.length > 0 ? (
                  cockpit.suggestedAnlassraeume.slice(0, 4).map((suggestion) => (
                    <div key={suggestion.id} className="rounded-2xl border border-[rgb(var(--border))] p-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                        <span>{reviewStatusLabel(suggestion.reviewStatus)}</span>
                        <span>·</span>
                        <span>{suggestedActionLabel(suggestion.suggestedAction)}</span>
                        <span>·</span>
                        <span>{suggestion.relatedSignalIds.length} relatedSignals</span>
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
                {cockpit.suggestedDossiers.length > 0 ? (
                  cockpit.suggestedDossiers.slice(0, 4).map((suggestion) => (
                    <div key={suggestion.id} className="rounded-2xl border border-[rgb(var(--border))] p-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                        <span>{reviewStatusLabel(suggestion.reviewStatus)}</span>
                        <span>·</span>
                        <span>{suggestedActionLabel(suggestion.suggestedAction)}</span>
                        <span>·</span>
                        <span>{suggestion.relatedSignalIds.length} relatedSignals</span>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">{suggestion.title}</h3>
                      <p className="mt-1 text-sm text-[rgb(var(--muted))]">{suggestion.summary}</p>
                      {suggestion.openQuestions.length > 0 ? (
                        <div className="mt-3 space-y-1">
                          {suggestion.openQuestions.map((question) => (
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

          <section data-testid="admin-region-open-review" className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
              <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">Open Review Items</p>
              <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">Review-gated Arbeitsliste</h2>
              <div className="mt-4 space-y-3">
                {cockpit.openReviewItems.length > 0 ? (
                  cockpit.openReviewItems.slice(0, 6).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-[rgb(var(--border))] p-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[rgb(var(--muted))]">
                        <span>{sourceTypeLabel(item.sourceType)}</span>
                        <span>·</span>
                        <span>{reviewStatusLabel(item.reviewStatus)}</span>
                        <span>·</span>
                        <span>{item.isFixture ? "Pilot-/Fixture-Hinweis" : "Runtime-Review"}</span>
                        <span>·</span>
                        <span>Confidence {item.confidence.toFixed(2)}</span>
                      </div>
                      <h3 className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">{item.title}</h3>
                      <p className="mt-1 text-sm text-[rgb(var(--muted))]">
                        Aktion bleibt review-gated. Keine automatische Veröffentlichung und keine automatische Erstellung.
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
                      {actionStateLabel(cockpit)} · Folgt in CUT-03
                    </span>
                  </button>
                ))}
              </div>
            </article>
          </section>

          <section data-testid="admin-region-modules" className="grid gap-4 lg:grid-cols-2">
            {Object.entries(cockpit.cockpit.modules).map(([key, module]) => (
              <article key={key} className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
                <p className="text-xs uppercase tracking-[0.14em] text-[rgb(var(--muted))]">{key}</p>
                <h2 className="mt-2 text-lg font-semibold text-[rgb(var(--fg))]">{module.headline}</h2>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">{module.summary}</p>
              </article>
            ))}
          </section>
        </>
      ) : (
        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 text-sm text-[rgb(var(--muted))]">
          Noch keine Region gefunden.
        </section>
      )}
    </main>
  );
}
