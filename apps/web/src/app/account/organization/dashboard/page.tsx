import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { userIsAdminDashboard } from "@/lib/server/auth/admin";
import {
  hasVerifiedMembershipWriteAccess,
  isProductionMembershipTruth,
  mapMembershipToOrganizationRole,
  membershipStatusLabel,
  normalizeMembershipStatus,
  pickPrimaryMembership,
  sourceOfTruthLabel,
  type OrganizationMembershipRole,
} from "@/lib/server/auth/membershipDirectoryRepository";
import { getMembershipDirectoryRepository } from "@/lib/server/auth/runtimeAdapters";
import {
  buildOrganizationDashboardReadModel,
  type OrganizationDashboardDraftSummary,
  type OrganizationDashboardReadModel,
} from "@features/region";
import { publicationVisibilityLabel } from "@features/region/publicationRiskLadder";
import ContentReleaseWorkbenchActions from "@/app/admin/review/ContentReleaseWorkbenchActions";
import ReviewQueueItemActions from "@/app/admin/review/ReviewQueueItemActions";

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
      return "Betreiber-Modus";
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
      return "Verein / Verband / Träger";
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

function organizationScopeRoleLabel(value: OrganizationMembershipRole | null) {
  switch (value) {
    case "owner":
      return "Owner";
    case "admin":
      return "Admin";
    case "editor":
      return "Editor";
    case "reviewer":
      return "Reviewer";
    case "viewer":
      return "Viewer";
    case "publication_approved":
      return "Publikationsfreigabe";
    case "operator":
      return "Betreiberkontext";
    default:
      return "Noch keine Rolle bestätigt";
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

function compactAuditLine(input: {
  title: string;
  detail: string;
  actorLabel: string;
  at: string;
  note: string | null;
}) {
  return `${input.title} · ${input.detail} · ${input.actorLabel} · ${new Date(input.at).toLocaleString("de-DE")}${input.note ? ` · ${input.note}` : ""}`;
}

function scopeSummary(readModel: OrganizationDashboardReadModel) {
  const organizationCount = readModel.organization.organizations.length;
  const readableRegionCount = readModel.regionSummary.filter((entry) => entry.dashboardAccess).length;
  if (readModel.organization.isOperatorMode) {
    return "Globaler Betreiberkontext. Diese Oberfläche zeigt zusätzlich den Organisationsblick auf denselben Arbeitsstand.";
  }
  if (organizationCount === 0 && readableRegionCount === 0) {
    return "Noch kein bestätigter Organisations- oder Regionscope. Moderationsaktionen bleiben gesperrt, bis Membership und Rolle aufgelöst sind.";
  }
  return `${organizationCount} Organisation · ${readableRegionCount} Regionen im bestätigten Scope`;
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
  const membershipDirectory = readModel.organization.isOperatorMode
    ? {
        memberships: [],
        organizations: [],
        sourceOfTruth: "session" as const,
        confidence: "admin_fallback" as const,
        runtimeMarker: "session",
      }
    : await getMembershipDirectoryRepository().listMembershipDirectoryForActor(userId);
  const primaryMembership = readModel.organization.isOperatorMode
    ? null
    : pickPrimaryMembership(membershipDirectory.memberships);
  const normalizedMembershipStatus = readModel.organization.isOperatorMode
    ? "verified"
    : normalizeMembershipStatus(primaryMembership);
  const normalizedOrganizationRole = readModel.organization.isOperatorMode
    ? "operator"
    : mapMembershipToOrganizationRole(primaryMembership);
  const hasWritableOrganizationContext = hasVerifiedMembershipWriteAccess({
    membershipStatus: normalizedMembershipStatus,
    organizationRole: normalizedOrganizationRole,
    isOperatorMode: readModel.organization.isOperatorMode,
    sourceOfTruth: membershipDirectory.sourceOfTruth,
  });
  const hasReadableRegion = readModel.regionSummary.some((entry) => entry.dashboardAccess);
  const accessBlockers = [
    membershipDirectory.sourceOfTruth === "external_directory_pending"
      ? {
          title: "Directory-Anbindung fehlt",
          body: "Die Membership-Wahrheit ist noch nicht produktiv angebunden. Der Organisationsbereich bleibt deshalb auf sichere Status- und Nächste-Schritte-Hinweise begrenzt.",
        }
      : null,
    !readModel.organization.isOperatorMode && normalizedMembershipStatus !== "verified"
      ? {
          title: "Organisation noch nicht verifiziert",
          body: "Ohne verifizierte Membership bleiben Moderation, Sichtbarkeit und interne Regionsdaten gesperrt. Sichtbar bleiben nur sichere nächste Schritte.",
        }
      : null,
    !readModel.organization.isOperatorMode &&
    normalizedMembershipStatus === "verified" &&
    !hasWritableOrganizationContext
      ? {
          title: "Rolle reicht nicht aus",
          body: "Dein Membership-Kontext ist verifiziert, aber diese Rolle darf keine eigenen Review- oder Release-Aktionen ausführen.",
        }
      : null,
    !readModel.organization.isOperatorMode &&
    normalizedMembershipStatus === "verified" &&
    !hasReadableRegion
      ? {
          title: "Regionzugriff fehlt",
          body: "Die Membership ist verifiziert, aber es ist noch kein lesbarer Regionscope aufgelöst. Ohne Regionscope bleiben interne Arbeitsstände unsichtbar.",
        }
      : null,
  ].filter(Boolean) as Array<{ title: string; body: string }>;
  const membershipTruthSummary =
    membershipDirectory.sourceOfTruth === "persistent_membership_store"
      ? "Membership und Organisationszuordnung kommen aus dem persistenten Store. Das ist produktionsnahe Scope-Wahrheit, aber noch keine externe Register- oder Directory-Integration."
      : membershipDirectory.sourceOfTruth === "external_directory_pending"
        ? "Die Directory-Auflösung ist noch nicht produktionsfähig. Dieser Zustand blockiert ehrliche `production_ready`-Aussagen für Auth / Membership / Directory."
        : membershipDirectory.sourceOfTruth === "fixture_demo"
          ? "Die Membership-Wahrheit kommt aus einer Demo- oder Test-Runtime. Das ist ausdrücklich keine produktive Source-of-truth."
          : "Der Scope stammt nur aus dem Session-Kontext und ersetzt keine belastbare Membership-Wahrheit.";
  const operationsPersistence = readModel.reviewQueueOperationsPersistence ?? {
    mode: "in_memory_fallback",
    label: "In-Memory-Fallback",
    summary:
      "Fallback-Zustand ohne dauerhafte Produktionswahrheit. Eigene Review-Operationen sind dann nur pro Runtime vorhanden.",
    productionTruth: false,
  };
  const contentReleasePersistence = readModel.contentReleasePersistence ?? {
    mode: "in_memory_fallback",
    label: "In-Memory-Fallback",
    summary:
      "Fallback-Zustand ohne dauerhafte Produktionswahrheit. Eigene Sichtbarkeits- und Archivzustände leben dann nur pro Runtime.",
    repositoryInterface: "ContentReleaseRepository",
    storeKind: "in_memory",
    productionTruth: false,
    restartReconstructable: false,
    deploymentReconstructable: false,
  };

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
              Starte mit deiner Organisation, deiner Region oder deinem Wirkraum. Hier sieht deine
              Organisation ihren Scope, offene Aufgaben und vorbereitete Themen.
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
            zeigt denselben Arbeitsstand im Organisationsblick, ohne automatische amtliche
            Freigabe.
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
                {readModel.organization.isOperatorMode
                  ? "Betreiberkontext"
                  : readModel.organization.roleLabel ?? "Noch keine Rolle bestätigt"}
              </p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-[rgb(var(--muted))]">Scope</p>
              <p className="text-sm font-semibold text-[rgb(var(--fg))]">{scopeSummary(readModel)}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
              <p className="text-xs text-[rgb(var(--muted))]">Membership-Status</p>
              <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">
                {readModel.organization.isOperatorMode
                  ? "Betreiberkontext"
                  : membershipStatusLabel(normalizedMembershipStatus)}
              </p>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
              <p className="text-xs text-[rgb(var(--muted))]">Directory-Wahrheit</p>
              <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">
                {sourceOfTruthLabel(membershipDirectory.sourceOfTruth)}
              </p>
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                {isProductionMembershipTruth(membershipDirectory.sourceOfTruth)
                  ? "Produktionsnahe Membership-Wahrheit"
                  : "Nicht als produktive Membership-Wahrheit werten"}
              </p>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
              <p className="text-xs text-[rgb(var(--muted))]">Normalisierte Rolle</p>
              <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">
                {organizationScopeRoleLabel(normalizedOrganizationRole)}
              </p>
            </div>
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
              <p className="text-xs text-[rgb(var(--muted))]">Schreibzugriff</p>
              <p className="mt-1 text-sm font-semibold text-[rgb(var(--fg))]">
                {hasWritableOrganizationContext ? "Im eigenen Scope möglich" : "Gesperrt"}
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs text-[rgb(var(--muted))]">{membershipTruthSummary}</p>
          {accessBlockers.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {accessBlockers.map((entry) => (
                <EmptyState key={entry.title} title={entry.title} body={entry.body} />
              ))}
            </div>
          ) : null}
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
              Betreiberkontext
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
            Meine Review-Aufgaben
          </p>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
            Verifizierte Organisationen sehen hier nur ihre eigenen Review-, Quellen- und
            Content-Release-Aufgaben. `/admin/review` bleibt die globale Betreiber-Arbeitsliste.
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

          <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
              Operations-Persistenz
            </p>
            <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">
              {operationsPersistence.label}
            </p>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">{operationsPersistence.summary}</p>
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
                  {item.moderationPermission.role ? (
                    <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                      Eigener Moderationsscope · {item.moderationPermission.role}
                      {item.moderationPermission.operatorModeLabel
                        ? ` · ${item.moderationPermission.operatorModeLabel}`
                        : ""}
                    </p>
                  ) : null}
                  {item.assignedToUserId ? (
                    <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                      Zugewiesen an {item.assignedToUserId}
                    </p>
                  ) : null}
                  {item.moderationPermission.canViewOwnAuditTrail &&
                  (item.unifiedAuditTrail ?? []).slice(-1)[0] ? (
                    <p className="mt-2 text-xs text-[rgb(var(--muted))]">
                      Letzte Aktivität:{" "}
                      {compactAuditLine({
                        title: (item.unifiedAuditTrail ?? []).slice(-1)[0]?.title ?? "",
                        detail: (item.unifiedAuditTrail ?? []).slice(-1)[0]?.detail ?? "",
                        actorLabel:
                          (item.unifiedAuditTrail ?? []).slice(-1)[0]?.actor.label ?? "unbekannt",
                        at:
                          (item.unifiedAuditTrail ?? []).slice(-1)[0]?.at ??
                          new Date(0).toISOString(),
                        note: (item.unifiedAuditTrail ?? []).slice(-1)[0]?.note ?? null,
                      })}
                    </p>
                  ) : null}
                  {item.moderationPermission.canOperateOwnReviewItem ? (
                    <ReviewQueueItemActions
                      item={item}
                      currentUserId={userId}
                      endpoint={`/api/account/organization/review/items/${encodeURIComponent(item.id)}`}
                      visibleActions={item.moderationPermission.allowedActions.filter(
                        (action) =>
                          action === "add_note" ||
                          action === "request_changes" ||
                          action === "mark_in_review" ||
                          action === "mark_ready" ||
                          action === "archive" ||
                          action === "block",
                      )}
                      showAssignmentActions={false}
                      scopeCopy={item.moderationPermission.scopeCopy}
                    />
                  ) : null}
                  {item.contentReleaseWorkbench &&
                  (item.moderationPermission.canPrepareOwnContentRelease ||
                    item.moderationPermission.canMakeOwnContentVisible ||
                    item.moderationPermission.canArchiveOwnContent) ? (
                    <ContentReleaseWorkbenchActions
                      itemId={item.id}
                      sourceKind={item.contentReleaseWorkbench.sourceKind}
                      sourceId={item.contentReleaseWorkbench.sourceId}
                      contentReleasePersistence={contentReleasePersistence}
                      contentReleaseWorkbench={item.contentReleaseWorkbench}
                      endpoint="/api/account/organization/review/content-release"
                      scopeCopy={item.moderationPermission.scopeCopy}
                      allowPrepare={item.moderationPermission.canPrepareOwnContentRelease}
                      allowMakeVisible={item.moderationPermission.canMakeOwnContentVisible}
                      allowPreparePublication={item.moderationPermission.canMakeOwnContentVisible}
                      allowRevokeVisibility={item.moderationPermission.canMakeOwnContentVisible}
                      allowArchive={item.moderationPermission.canArchiveOwnContent}
                    />
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Link
                      href={item.href}
                      className="inline-flex text-sm font-semibold text-[rgb(var(--fg))]"
                    >
                      Review öffnen
                    </Link>
                    {readModel.organization.isOperatorMode ? (
                      <Link
                        href="/admin/review"
                        className="inline-flex text-sm font-semibold text-[rgb(var(--muted))]"
                      >
                        Betreiber-Arbeitsliste öffnen
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
                Audit-Verlauf
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">
                Letzte Aktivitäten im eigenen Scope
              </h2>
              <p className="mt-2 text-sm text-[rgb(var(--muted))]">
                Review-, Content-Release- und Official-Release-Ereignisse werden hier aus
                denselben persistierten Quellen zusammengeführt.
              </p>
            </div>
            {readModel.organization.isOperatorMode ? (
              <span className="rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
                Betreiber-Modus
              </span>
            ) : null}
          </div>
          <div className="mt-5 space-y-3">
            {readModel.recentUnifiedAuditTrail.length === 0 ? (
              <EmptyState
                title="Noch kein Verlauf im eigenen Scope."
                body="Sobald persistierte Review- oder Release-Schritte vorliegen, erscheinen sie hier."
              />
            ) : (
              readModel.recentUnifiedAuditTrail.map((event) => (
                <article
                  key={event.id}
                  className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
                >
                  <p className="text-sm font-semibold text-[rgb(var(--fg))]">
                    {compactAuditLine({
                      title: event.title,
                      detail: event.detail,
                      actorLabel: event.actor.label,
                      at: event.at,
                      note: event.note,
                    })}
                  </p>
                  <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                    {event.regionId ?? "übergreifend"}
                    {event.organizationId ? ` · ${event.organizationId}` : ""}
                  </p>
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
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          Nächster Schritt: Vorschau im Review-to-Publish-Workspace prüfen. Dort wird Sichtbarkeit
          auch wieder zurückgenommen oder archiviert, ohne Hard Delete und ohne automatische
          amtliche Freigabe.
        </p>
        <div className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
            Content-Release-Persistenz
          </p>
          <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">
            {contentReleasePersistence.label}
          </p>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            {contentReleasePersistence.summary}
          </p>
          <p className="mt-2 text-xs text-[rgb(var(--muted))]">
            {contentReleasePersistence.productionTruth
              ? "Eigene sichtbare und archivierte Inhalte kommen aus denselben persistierten Content-Release-Records wie in `/admin/review`."
              : "Nur Dev-/Test-/Runtime-Fallback: diese Sichtbarkeitsquelle darf nicht als Produktionswahrheit ausgegeben werden."}
          </p>
        </div>
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
              body="Sobald Review-Items bewusst als Dossier, Anlassraum oder öffentliche Themenseite vorbereitet werden, erscheinen Vorschau- und Sichtbarkeitsschritte hier."
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
