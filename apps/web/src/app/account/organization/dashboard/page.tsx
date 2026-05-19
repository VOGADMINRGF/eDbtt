import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { userIsAdminDashboard } from "@/lib/server/auth/admin";
import {
  buildOrganizationDashboardReadModel,
  type OrganizationDashboardDraftSummary,
  type OrganizationDashboardReadModel,
} from "@features/region";
import { publicationVisibilityLabel } from "@features/region/publicationRiskLadder";

export const metadata = {
  title: "Organisationsbereich · eDebatte",
};

function verificationLabel(value: OrganizationDashboardReadModel["verificationStatus"]) {
  switch (value) {
    case "publication_approved":
      return "Publikationsfreigabe bestätigt";
    case "unit_verified":
      return "Unit-verifiziert";
    case "organization_verified":
      return "Organisations-verifiziert";
    case "email_verified":
      return "E-Mail verifiziert";
    case "pending_review":
      return "In Prüfung";
    case "unverified":
      return "Unverifiziert";
    case "rejected":
      return "Abgelehnt";
    case "revoked":
      return "Widerrufen";
    case "admin_fallback":
      return "Betreiber-Fallback";
    default:
      return "Noch kein Status";
  }
}

function organizationTypeLabel(value: OrganizationDashboardReadModel["organizationType"]) {
  switch (value) {
    case "public_administration":
      return "Öffentliche Verwaltung";
    case "municipality":
      return "Kommune";
    case "district_office":
      return "Bezirksamt";
    case "city_administration":
      return "Stadtverwaltung";
    case "county_administration":
      return "Landkreisverwaltung";
    case "ministry":
      return "Ministerium";
    case "agency":
      return "Behörde";
    case "public_body":
      return "Öffentliche Einrichtung";
    case "school":
      return "Schule";
    case "association":
      return "Verein / Verband";
    case "ngo":
      return "NGO";
    case "civic_initiative":
      return "Initiative";
    case "foundation":
      return "Stiftung";
    case "media":
      return "Medienpartner";
    case "company":
      return "Unternehmen";
    case "research_institution":
      return "Forschung";
    case "custom":
      return "Organisation";
    default:
      return "Noch kein Typ";
  }
}

function draftTitle(value: OrganizationDashboardDraftSummary["draftType"]) {
  return value === "dossier" ? "Dossier-Entwurf" : "Anlassraum";
}

function firstRunStatusLabelClass(
  status: OrganizationDashboardReadModel["firstRun"]["steps"][number]["status"],
) {
  switch (status) {
    case "done":
      return "border-emerald-300/70 bg-emerald-50 text-emerald-900";
    case "available":
      return "border-sky-300/70 bg-sky-50 text-sky-900";
    case "needs_review":
      return "border-amber-300/70 bg-amber-50 text-amber-900";
    case "optional":
      return "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--muted))]";
    case "locked":
    default:
      return "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--muted))]";
  }
}

function EmptyState({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
      <p className="text-sm font-semibold text-[rgb(var(--fg))]">{title}</p>
      <p className="mt-1 text-sm text-[rgb(var(--muted))]">{body}</p>
    </div>
  );
}

export default async function AccountOrganizationDashboardPage() {
  const user = await getSessionUser();
  const userId = user?._id?.toHexString?.() ?? null;

  if (!user || !user.sessionValid || !userId) {
    redirect(`/login?next=${encodeURIComponent("/account/organization/dashboard")}`);
  }

  const isAdmin = userIsAdminDashboard(user);
  const readModel = await buildOrganizationDashboardReadModel({
    userId,
    roles: (user.roles ?? []).map((role) => String(role).toLowerCase()),
    isAdmin,
    actorRole: isAdmin ? "admin" : null,
  });

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
              Organisationsbereich
            </p>
            <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">Organisationsbereich</h1>
            <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">
              Hier sieht deine Organisation ihre Region, Freischaltung, offenen Aufgaben und
              vorbereiteten Themen.
            </p>
            <p className="max-w-3xl text-sm text-[rgb(var(--muted))]">
              Aussage, Dossier, Anlassraum und Beteiligungssignal bleiben reviewpflichtige
              Arbeitsstände. Keine automatische Veröffentlichung und keine automatische amtliche
              Freigabe.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/account/organization"
              className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))]"
            >
              Antrag und Status
            </Link>
            <Link
              href="/runden"
              className="inline-flex items-center justify-center rounded-full bg-[rgb(var(--grad-from))] px-4 py-2 text-sm font-semibold text-white"
            >
              Anlassräume ansehen
            </Link>
          </div>
        </div>

        {readModel.organization.isOperatorMode ? (
          <div className="mt-4 rounded-2xl border border-amber-300/70 bg-amber-50 p-4 text-sm text-amber-900">
            Betreiber-Modus aktiv. `/admin` bleibt Betreiberbereich; dieser Organisationsbereich
            zeigt den Stand als Fallback, ohne automatische amtliche Freigabe.
          </div>
        ) : null}
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Meine Organisation
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-[rgb(var(--muted))]">Name</p>
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">
                {readModel.organization.name ?? "Noch keine Organisation bestätigt"}
              </p>
            </div>
            <div>
              <p className="text-xs text-[rgb(var(--muted))]">Typ</p>
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">
                {organizationTypeLabel(readModel.organizationType)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[rgb(var(--muted))]">Status</p>
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">
                {verificationLabel(readModel.verificationStatus)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[rgb(var(--muted))]">Rolle</p>
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">
                {readModel.organization.roleLabel ?? "Noch keine Rolle bestätigt"}
              </p>
            </div>
          </div>
          <div id="regionen" className="mt-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
              Region
            </p>
            {readModel.regionSummary.length === 0 ? (
              <EmptyState
                title="Stelle zuerst einen Organisationsantrag oder warte auf Freigabe."
                body="Ohne bestätigte Membership zeigt der Organisationsbereich noch keine internen Regionsdaten."
              />
            ) : (
              readModel.regionSummary.map((region) => (
                <article
                  key={`${region.source}:${region.regionId}`}
                  className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-[rgb(var(--fg))]">{region.regionName}</p>
                      <p className="text-xs text-[rgb(var(--muted))]">
                        {region.source === "verified_membership"
                          ? "Eigene bestätigte Region"
                          : "Selbstauskunft aus Organisationsantrag"}
                      </p>
                    </div>
                    <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                      {region.dashboardAccess ? "Region sichtbar" : "Noch ohne internen Zugriff"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                    Status:{" "}
                    {region.verificationStatus === "self_declared"
                      ? "Selbstauskunft"
                      : verificationLabel(region.verificationStatus)}
                    {region.roleLabel ? ` · Rolle: ${region.roleLabel}` : ""}
                  </p>
                </article>
              ))
            )}
          </div>
        </article>

        <article
          id="freischaltung"
          className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Freischaltung
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">
            {readModel.entitlementSummary.state}
          </h2>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
            Freischaltung zeigt den Arbeitszugang, nicht Checkout oder Payment. Keine
            Payment-Behauptung in diesem Bereich.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
              <p className="text-xs text-[rgb(var(--muted))]">Status</p>
              <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">
                {readModel.entitlementSummary.hasActiveEntitlement
                  ? "Aktiv"
                  : readModel.entitlementSummary.hasTrialEntitlement
                    ? "Testzugang"
                    : readModel.entitlementSummary.hasExpiredEntitlement
                      ? "Abgelaufen"
                      : "Fehlt"}
              </p>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
              <p className="text-xs text-[rgb(var(--muted))]">Pläne</p>
              <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">
                {readModel.entitlementSummary.planLabels.join(", ") || "Noch keine Freischaltung aktiv."}
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
              Erste Schritte
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">
              Geführter Einstieg für deine Organisation
            </h2>
            <p className="mt-2 max-w-3xl text-sm text-[rgb(var(--muted))]">
              {readModel.firstRun.intro}
            </p>
          </div>
          {readModel.organization.isOperatorMode ? (
            <span className="rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
              Admin-Modus
            </span>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {readModel.firstRun.steps.map((step) => (
            <article
              key={step.id}
              className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">{step.title}</p>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${firstRunStatusLabelClass(step.status)}`}
                >
                  {step.statusLabel}
                </span>
              </div>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">{step.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {step.ctas.map((cta) => (
                  <Link
                    key={cta.id}
                    href={cta.href}
                    className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))]"
                  >
                    {cta.label}
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <article
          id="aufgaben"
          className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Meine Aufgaben
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
              <p className="text-xs text-[rgb(var(--muted))]">Offene Reviews</p>
              <p className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]">
                {readModel.reviewQueueSummary.total}
              </p>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
              <p className="text-xs text-[rgb(var(--muted))]">Offene Organisationsanträge</p>
              <p className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]">
                {readModel.pendingOrganizationClaims.length}
              </p>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
              <p className="text-xs text-[rgb(var(--muted))]">Hohe Priorität</p>
              <p className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]">
                {readModel.reviewQueueSummary.highPriorityCount}
              </p>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
              <p className="text-xs text-[rgb(var(--muted))]">Bereit / blockiert</p>
              <p className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]">
                {readModel.reviewQueueSummary.readyCount} / {readModel.reviewQueueSummary.blockedCount}
              </p>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
              <p className="text-xs text-[rgb(var(--muted))]">Sichtbare Inhalte</p>
              <p className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]">
                {readModel.publishSummary.visibleCount}
              </p>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
              <p className="text-xs text-[rgb(var(--muted))]">Archivierte Inhalte</p>
              <p className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]">
                {readModel.publishSummary.archivedCount}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {readModel.reviewQueueSummary.byOperationalStatus.map((entry) => (
              <span
                key={entry.status}
                className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]"
              >
                {entry.label}: {entry.count}
              </span>
            ))}
          </div>

          <div className="mt-5 space-y-3">
            {readModel.openReviewItems.length === 0 ? (
              <EmptyState
                title="Noch keine offenen Reviews."
                body="Sobald reviewpflichtige Signale, Entwürfe oder Freigabeschritte vorliegen, erscheinen sie hier."
              />
            ) : (
              readModel.openReviewItems.slice(0, 4).map((item) => (
                <article key={item.id} className="rounded-2xl border border-[rgb(var(--border))] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[rgb(var(--fg))]">{item.title}</p>
                    <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                      {item.regionName ?? "Übergreifend"}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                    {item.domainLabel} · {item.workflowLabel} · {item.operationalStatusLabel} ·{" "}
                    {item.priorityLabel}
                  </p>
                  <p className="mt-2 text-sm text-[rgb(var(--muted))]">{item.summary}</p>
                  <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                    {publicationVisibilityLabel(item.visibilityState)} · {item.scopeLabel} ·{" "}
                    {item.reviewAuthorityLabel}
                  </p>
                  {item.assignedToUserId ? (
                    <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                      Zugewiesen an {item.assignedToUserId}
                    </p>
                  ) : null}
                  <Link href={item.href} className="mt-3 inline-flex text-sm font-semibold text-[rgb(var(--fg))]">
                    Review öffnen
                  </Link>
                </article>
              ))
            )}
          </div>
        </article>

        <article
          id="startlage"
          className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Regionale Startlage
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">
            KI-vorqualifizierte Startlage
          </h2>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
            Themencluster, offene Fragen und Quellenstatus werden als kuratierte Startlage
            vorbereitet. Das bleibt reviewpflichtig und ist keine automatische amtliche Bewertung.
          </p>

          <div className="mt-5 space-y-4">
            {readModel.regionalStartingPoints.length === 0 ? (
              <EmptyState
                title="Noch keine regionale Startlage vorbereitet."
                body="Stelle zuerst einen Organisationsantrag oder warte auf Freigabe."
              />
            ) : (
              readModel.regionalStartingPoints.map((entry) => (
                <article key={entry.regionId} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[rgb(var(--fg))]">{entry.regionName}</p>
                    <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                      Quellenstatus
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[rgb(var(--muted))]">{entry.summary}</p>
                  <p className="mt-2 text-xs text-[rgb(var(--muted))]">{entry.sourceStatus}</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold text-[rgb(var(--muted))]">Themencluster</p>
                      <p className="mt-1 text-sm text-[rgb(var(--fg))]">
                        {entry.topicClusters.join(", ") || "Noch keine Cluster."}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[rgb(var(--muted))]">Offene Fragen</p>
                      <p className="mt-1 text-sm text-[rgb(var(--fg))]">
                        {entry.openQuestions.join(", ") || "Noch keine offenen Fragen."}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[rgb(var(--muted))]">Quellenstatus</p>
                      <p className="mt-1 text-sm text-[rgb(var(--fg))]">
                        {entry.sourcesCount} Quellenhinweise · {entry.dossierSuggestionCount} Dossier-Vorschläge ·{" "}
                        {entry.anlassraumSuggestionCount} Anlassraum-Vorschläge
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold text-[rgb(var(--muted))]">Produktiv / kuratiert / manuell</p>
                      <p className="mt-1 text-sm text-[rgb(var(--fg))]">
                        {entry.productiveSourceStatus}
                      </p>
                      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                        {entry.curatedSourceStatus} · {entry.manualSourceStatus}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[rgb(var(--muted))]">Gewichtung</p>
                      <p className="mt-1 text-sm text-[rgb(var(--fg))]">{entry.weightingLabel}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[rgb(var(--muted))]">Review-Vorschläge</p>
                      <p className="mt-1 text-sm text-[rgb(var(--fg))]">
                        {entry.reviewSuggestionCount} reviewpflichtige Vorschläge
                      </p>
                      <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                        {entry.reviewSuggestionLabels.join(", ") || "Noch keine Vorschläge."}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Dossier-Entwürfe
          </p>
          <div className="mt-4 space-y-3">
            {readModel.dossierDrafts.length === 0 ? (
              <EmptyState
                title="Noch keine Dossier-Entwürfe."
                body="Reviewpflichtige Dossier-Drafts erscheinen hier, sobald sie deiner Organisation oder Region zugeordnet sind."
              />
            ) : (
              readModel.dossierDrafts.map((draft) => (
                <article key={draft.draftId} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                  <p className="text-sm font-semibold text-[rgb(var(--fg))]">{draft.title}</p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    {draft.regionName} · {draftTitle(draft.draftType)} ·{" "}
                    {publicationVisibilityLabel(draft.visibilityState)}
                  </p>
                  <p className="mt-2 text-sm text-[rgb(var(--muted))]">{draft.summary}</p>
                  <Link href={draft.href} className="mt-3 inline-flex text-sm font-semibold text-[rgb(var(--fg))]">
                    Entwurf öffnen
                  </Link>
                </article>
              ))
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Anlassräume
          </p>
          <div className="mt-4 space-y-3">
            {readModel.anlassraumDrafts.length === 0 ? (
              <EmptyState
                title="Noch keine Anlassräume."
                body="Reviewpflichtige Anlassraum-Entwürfe erscheinen hier, sobald sie deiner Organisation oder Region zugeordnet sind."
              />
            ) : (
              readModel.anlassraumDrafts.map((draft) => (
                <article key={draft.draftId} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                  <p className="text-sm font-semibold text-[rgb(var(--fg))]">{draft.title}</p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    {draft.regionName} · Anlassraum ·{" "}
                    {publicationVisibilityLabel(draft.visibilityState)}
                  </p>
                  <p className="mt-2 text-sm text-[rgb(var(--muted))]">{draft.summary}</p>
                  <Link href={draft.href} className="mt-3 inline-flex text-sm font-semibold text-[rgb(var(--fg))]">
                    Anlassraum öffnen
                  </Link>
                </article>
              ))
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Beteiligungssignale
          </p>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
            Fragen, Quellen, Aussagen und andere Beteiligungssignale erscheinen nur im Rahmen von
            Sichtbarkeits- und Review-Regeln.
          </p>
          <div className="mt-4 space-y-3">
            {readModel.participationSignals.length === 0 ? (
              <EmptyState
                title="Noch keine Beteiligungssignale."
                body="Sobald sichtbare oder reviewpflichtige Signale deiner Region zugeordnet sind, erscheinen sie hier."
              />
            ) : (
              readModel.participationSignals.map((signal) => (
                <article key={`${signal.regionId}:${signal.id}`} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[rgb(var(--fg))]">{signal.title}</p>
                    <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                      {publicationVisibilityLabel(signal.visibilityState)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">{signal.regionName}</p>
                  <p className="mt-2 text-sm text-[rgb(var(--muted))]">{signal.summary}</p>
                </article>
              ))
            )}
          </div>
        </article>
      </section>

      <section
        id="veroeffentlichung"
        className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Veröffentlichbare Inhalte
        </p>
        <h2 className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">
          Vorschau, Sichtbarkeit und öffentliche Links
        </h2>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          Sichtbar heißt nicht automatisch amtlich. Öffentliche URL, Share-Link und QR erscheinen
          erst nach bewusster Sichtbarkeit.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
            <p className="text-xs text-[rgb(var(--muted))]">Vorbereitet</p>
            <p className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]">
              {readModel.publishSummary.totalPrepared}
            </p>
          </div>
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
            <p className="text-xs text-[rgb(var(--muted))]">Sichtbar</p>
            <p className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]">
              {readModel.publishSummary.visibleCount}
            </p>
          </div>
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
            <p className="text-xs text-[rgb(var(--muted))]">Teilbar</p>
            <p className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]">
              {readModel.publishSummary.shareableCount}
            </p>
          </div>
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
            <p className="text-xs text-[rgb(var(--muted))]">Archiviert</p>
            <p className="mt-1 text-2xl font-semibold text-[rgb(var(--fg))]">
              {readModel.publishSummary.archivedCount}
            </p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {readModel.publishSummary.items.filter((item) => !item.archived).length === 0 ? (
            <EmptyState
              title="Noch keine sichtbaren oder vorbereiteten Inhalte."
              body="Sobald Review-Items bewusst als Dossier oder Anlassraum vorbereitet werden, erscheinen Vorschau- und Sichtbarkeitsschritte hier."
            />
          ) : (
            readModel.publishSummary.items
              .filter((item) => !item.archived)
              .slice(0, 4)
              .map((item) => (
                <article
                  key={`${item.itemId}:${item.targetType}`}
                  className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[rgb(var(--fg))]">{item.title}</p>
                    <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                      {item.targetLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                    {item.regionName ?? "Eigener Scope"} · {publicationVisibilityLabel(item.visibilityState)} ·{" "}
                    {item.statusLabel}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.previewHref ? (
                      <Link
                        href={item.previewHref}
                        className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))]"
                      >
                        Vorschau ansehen
                      </Link>
                    ) : null}
                    {item.publicHref ? (
                      <Link
                        href={item.publicHref}
                        className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))]"
                      >
                        Öffentliche URL
                      </Link>
                    ) : null}
                    {item.shareHref ? (
                      <Link
                        href={item.shareHref}
                        className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))]"
                      >
                        Share-Link
                      </Link>
                    ) : null}
                    {item.qrHref ? (
                      <Link
                        href={item.qrHref}
                        className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))]"
                      >
                        QR-Link
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))
          )}
        </div>
        {readModel.publishSummary.archivedCount > 0 ? (
          <p className="mt-4 text-xs text-[rgb(var(--muted))]">
            Archivierte Inhalte bleiben auffindbar, werden hier aber bewusst nicht prominent
            ausgespielt.
          </p>
        ) : null}
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Nächste Schritte
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {readModel.nextActions.length === 0 ? (
            <EmptyState
              title="Stelle zuerst einen Organisationsantrag oder warte auf Freigabe."
              body="Sobald Membership, Freischaltung oder regionbezogene Arbeitsstände vorliegen, werden hier die nächsten Schritte sichtbar."
            />
          ) : (
            readModel.nextActions.map((action) => (
              <Link
                key={action.id}
                href={action.href}
                className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 transition hover:-translate-y-0.5"
              >
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">{action.label}</p>
                <p className="mt-2 text-sm text-[rgb(var(--muted))]">{action.description}</p>
              </Link>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
