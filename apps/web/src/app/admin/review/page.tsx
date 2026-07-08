import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { userIsAdminDashboard } from "@/lib/server/auth/admin";
import { buildReviewQueueReadModel, type ReviewQueueFilters } from "@features/reviewQueue";
import AdminFactcheckJobsSection from "./AdminFactcheckJobsSection";
import AdminEditorialReviewSection from "./AdminEditorialReviewSection";
import AdminGraphMergeCandidatesSection from "./AdminGraphMergeCandidatesSection";
import AdminCommunitySourceReviewSection from "./AdminCommunitySourceReviewSection";
import AdminTopicGraphApprovalSection from "./AdminTopicGraphApprovalSection";
import AdminDossierRuntimeCreationSection from "./AdminDossierRuntimeCreationSection";
import AdminDossierPublishSection from "./AdminDossierPublishSection";
import AdminAnlassraumRuntimeCreationSection from "./AdminAnlassraumRuntimeCreationSection";
import AdminAnlassraumActivationSection from "./AdminAnlassraumActivationSection";
import AdminParticipationSpaceRuntimeCreationSection from "./AdminParticipationSpaceRuntimeCreationSection";
import AdminParticipationSpacePublishSection from "./AdminParticipationSpacePublishSection";
import ContentReleaseWorkbenchActions from "./ContentReleaseWorkbenchActions";
import { getEditorialReviewFilterLabel } from "@features/editorialReviewQueue";
import { loadAdminEditorialReviewRequests, ADMIN_EDITORIAL_FILTER_OPTIONS } from "./loadAdminEditorialReviewRequests";
import { loadAdminFactcheckJobs } from "./loadAdminFactcheckJobs";
import { loadAdminGraphMergeSectionProps } from "./loadAdminGraphMergeSectionProps";
import { loadAdminCommunitySourceReviewSectionProps } from "./loadAdminCommunitySourceReviewSectionProps";
import { loadAdminTopicGraphApprovalSectionProps } from "./loadAdminTopicGraphApprovalSectionProps";
import { loadAdminDossierRuntimeCreationSectionProps } from "./loadAdminDossierRuntimeCreationSectionProps";
import { loadAdminDossierPublishSectionProps } from "./loadAdminDossierPublishSectionProps";
import { loadAdminAnlassraumRuntimeCreationSectionProps } from "./loadAdminAnlassraumRuntimeCreationSectionProps";
import { loadAdminAnlassraumActivationSectionProps } from "./loadAdminAnlassraumActivationSectionProps";
import { loadAdminParticipationSpaceRuntimeCreationSectionProps } from "./loadAdminParticipationSpaceRuntimeCreationSectionProps";
import { loadAdminParticipationSpacePublishSectionProps } from "./loadAdminParticipationSpacePublishSectionProps";
import ReviewQueueItemActions from "./ReviewQueueItemActions";
import V3ReviewContextSummary from "@/features/create/V3ReviewContextSummary";
import V3DownstreamKiTransparency, {
  buildV3DownstreamKiTransparencyFromReviewContext,
} from "@/features/create/V3DownstreamKiTransparency";
import DossierWorkspaceDecisionPanel from "@/features/create/DossierWorkspaceDecisionPanel";
import OutputSocialWorkbenchPanel from "@/features/create/OutputSocialWorkbenchPanel";
import ParticipationActivationReviewPanel from "@/features/create/ParticipationActivationReviewPanel";
import PollQuestionOptionsReviewPanel from "@/features/create/PollQuestionOptionsReviewPanel";
import SourceFactcheckFeedEnrichmentPanel from "@/features/create/SourceFactcheckFeedEnrichmentPanel";
import V3RuntimeWorkflowSurface, {
  buildV3RuntimeWorkflowSurfaceFromReviewContext,
} from "@/features/create/V3RuntimeWorkflowSurface";
import V3VoxyCocreationDialog from "@/features/create/V3VoxyCocreationDialogPanel";
import VoxyBriefingScriptCandidatePanel from "@/features/create/VoxyBriefingScriptCandidatePanel";
import VoxyRenderProviderHandoffPanel from "@/features/create/VoxyRenderProviderHandoffPanel";
import { buildDossierWorkspaceDecisionFromReviewContext } from "@/features/create/dossierWorkspaceDecisionContract";
import { buildOutputSocialWorkbenchFromReviewContext } from "@/features/create/outputSocialWorkbenchContract";
import { buildParticipationActivationReviewFromReviewContext } from "@/features/create/participationActivationReviewContract";
import { buildPollQuestionOptionsReviewFromReviewContext } from "@/features/create/pollQuestionOptionsReviewContract";
import { buildVoxyCocreationDialogFromReviewContext } from "@/features/create/voxyCocreationDialogContract";
import {
  buildSourceFactcheckFeedEnrichmentFromReviewContext,
} from "@/features/create/sourceFactcheckFeedEnrichmentContract";
import {
  buildVoxyBriefingScriptCandidateFromReviewContext,
} from "@/features/create/voxyBriefingScriptCandidateContract";
import {
  buildVoxyRenderProviderHandoffFromReviewContext,
} from "@/features/create/voxyRenderProviderHandoffContract";

export const metadata = {
  title: "Admin Review Queue · eDebatte",
};

type SearchParamsInput =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>
  | undefined;

function readSearchParam(
  input: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = input[key];
  if (Array.isArray(value)) return String(value[0] ?? "").trim();
  return String(value ?? "").trim();
}

async function resolveSearchParams(searchParams: SearchParamsInput) {
  const resolved = (await searchParams) ?? {};
  return {
    domain: readSearchParam(resolved, "domain") || "all",
    operationalStatus: readSearchParam(resolved, "status") || "all",
    regionId: readSearchParam(resolved, "regionId") || "all",
    organizationId: readSearchParam(resolved, "organizationId") || "all",
    priority: readSearchParam(resolved, "priority") || "all",
    assignedToUserId: readSearchParam(resolved, "assignedTo") || "all",
    visibilityState: readSearchParam(resolved, "visibility") || "all",
    sort: readSearchParam(resolved, "sort") || "priority",
    editorial: readSearchParam(resolved, "editorial") || "all",
  } as const;
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
      <p className="text-sm font-semibold text-[rgb(var(--fg))]">Keine Review-Aufgaben im aktuellen Filter.</p>
      <p className="mt-2 text-sm text-[rgb(var(--muted))]">
        Passe Filter oder Sortierung an. Beteiligungssignale, Drafts, Source Results,
        Workspaces und Freigabeschritte bleiben weiter review-first.
      </p>
    </div>
  );
}

function FilterSelect({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value: string;
  options: Array<{ value: string; label: string; count?: number }>;
}) {
  return (
    <label className="space-y-2 text-xs text-[rgb(var(--muted))]">
      {label}
      <select
        name={name}
        defaultValue={value}
        className="w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
      >
        <option value="all">Alle</option>
        {options.map((option) => (
          <option key={`${name}:${option.value}`} value={option.value}>
            {option.label}
            {typeof option.count === "number" ? ` (${option.count})` : ""}
          </option>
        ))}
      </select>
    </label>
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

function correlationBasisLabel(value: string) {
  if (value === "shared_id") return "Gemeinsame Kennung";
  if (value === "source_handoff_id") return "Explizite Handoff-Referenz";
  if (value === "source_draft_id") return "Explizite Draft-Referenz";
  if (value === "ledger_branch_id") return "Gemeinsame Branch-ID";
  if (value === "provenance") return "Bestehende Provenance";
  if (value === "created_by_and_dossier_id") return "Dossier und Nutzerkontext";
  if (value === "existing_review_context") return "Bestehender Review-Kontext";
  if (value === "existing_runtime_readmodel") return "Bestehendes Runtime-Readmodel";
  if (value === "text_similarity_suggestion") return "Nur Textähnlichkeit";
  return "Keine belastbare Basis";
}

export default async function AdminReviewPage({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
} = {}) {
  const user = await getSessionUser();
  const userId = user?._id?.toHexString?.() ?? null;

  if (!user || !user.sessionValid || !userId) {
    redirect(`/login?next=${encodeURIComponent("/admin/review")}`);
  }
  if (!userIsAdminDashboard(user)) {
    redirect("/account/organization/dashboard");
  }

  const filters = await resolveSearchParams(searchParams);
  const readModel = await buildReviewQueueReadModel(
    {
      mode: "global_operator",
      userId,
      isAdmin: true,
      visibleRegionIds: [],
      organizationIds: [],
      canApproveOfficial: true,
      governanceActor: {
        userId,
        role: "admin",
        isAdmin: true,
        scopedOwnerIds: [userId],
        scopedEntityIds: [userId],
        personTrust: null,
      },
    },
    filters as Partial<ReviewQueueFilters>,
  );
  const [
    graphMergeSectionProps,
    topicGraphApprovalSectionProps,
    communitySourceReviewSectionProps,
    dossierRuntimeCreationSectionProps,
    dossierPublishSectionProps,
    anlassraumRuntimeCreationSectionProps,
    anlassraumActivationSectionProps,
    participationSpaceRuntimeCreationSectionProps,
    participationSpacePublishSectionProps,
    editorialRequests,
    factcheckJobs,
  ] =
    await Promise.all([
      loadAdminGraphMergeSectionProps(),
      loadAdminTopicGraphApprovalSectionProps(),
      loadAdminCommunitySourceReviewSectionProps(),
      loadAdminDossierRuntimeCreationSectionProps(),
      loadAdminDossierPublishSectionProps(),
      loadAdminAnlassraumRuntimeCreationSectionProps(),
      loadAdminAnlassraumActivationSectionProps(),
      loadAdminParticipationSpaceRuntimeCreationSectionProps(),
      loadAdminParticipationSpacePublishSectionProps(),
      loadAdminEditorialReviewRequests(filters.editorial),
      loadAdminFactcheckJobs(),
    ]);

  const activeFilterCount = [
    readModel.filters.applied.domain !== "all",
    readModel.filters.applied.operationalStatus !== "all",
    readModel.filters.applied.regionId !== "all",
    readModel.filters.applied.organizationId !== "all",
    readModel.filters.applied.priority !== "all",
    readModel.filters.applied.assignedToUserId !== "all",
    readModel.filters.applied.visibilityState !== "all",
    filters.editorial !== "all",
  ].filter(Boolean).length;
  const operationsPersistence = readModel.operationsPersistence ?? {
    mode: "in_memory_fallback",
    label: "In-Memory-Fallback",
    summary:
      "Fallback-Zustand ohne dauerhafte Produktionswahrheit. Review-Operationen sind dann nur pro Runtime vorhanden.",
    productionTruth: false,
  };
  const contentReleasePersistence = readModel.contentReleasePersistence ?? {
    mode: "in_memory_fallback",
    label: "In-Memory-Fallback",
    summary:
      "Fallback-Zustand ohne dauerhafte Produktionswahrheit. Sichtbarkeits- und Archivzustände leben dann nur pro Runtime.",
    repositoryInterface: "ContentReleaseRepository",
    storeKind: "in_memory",
    productionTruth: false,
    restartReconstructable: false,
    deploymentReconstructable: false,
  };
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Admin · Review
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[rgb(var(--fg))]">Zentrale Review-Queue</h1>
        <p className="mt-2 max-w-3xl text-sm text-[rgb(var(--muted))]">
          Operative Arbeitsliste für reviewpflichtige Beteiligungssignale, Anlassraum Public Input,
          Region-Intelligence-Vorschläge, reviewpflichtige Source Results aus expliziten
          URL-Auswertungen, RegionSignalDrafts, Dossier Studio Workspaces, Output-/Distribution-Artefakte,
          Create-Handoffs, Factcheck-/Siegelentscheidungen und explizite public_official-Freigaben.
        </p>
        <p className="mt-2 max-w-3xl text-sm text-[rgb(var(--muted))]">
          Keine Sammelentscheidung, kein Auto-Publish, kein automatisches public_official und keine
          automatische Dossier-/Anlassraum-Finalisierung. Social-/CI-Distribution bleibt review-first,
          auditierbar und manuell veröffentlicht. Provider- oder Siegelpfade bleiben
          bewusste, auditierbare Einzelentscheidungen.
        </p>
      </header>

      <section
        data-testid="admin-review-journey"
        className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
          Review-to-Visible Journey
        </p>
        <h2 className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">
          Review, Vorschau, Sichtbarkeit und Widerruf laufen auf demselben Pfad
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-[rgb(var(--muted))]">
          Aus einem reviewpflichtigen Item werden hier bewusst Dossier oder Anlassraum vorbereitet,
          danach Vorschau, Sichtbarkeit und erst im sichtbaren Zustand Public URL, QR und Share.
        </p>
        <p className="mt-2 max-w-3xl text-sm text-[rgb(var(--muted))]">
          Sichtbar heißt nicht automatisch amtlich. `public_official` bleibt ausschließlich Official
          Release. Sichtbarkeit kann später wieder zurückgenommen oder archiviert werden.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Sichtbare Aufgaben
          </p>
          <p className="mt-2 text-3xl font-semibold text-[rgb(var(--fg))]">{readModel.summary.total}</p>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
            {readModel.summary.totalBeforeFilters} insgesamt · {activeFilterCount} aktive Filter
          </p>
        </article>
        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Hohe Priorität
          </p>
          <p className="mt-2 text-3xl font-semibold text-[rgb(var(--fg))]">
            {readModel.summary.highPriorityCount}
          </p>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
            Priorität folgt Workflow, Queue-Status und Alterung.
          </p>
        </article>
        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Zugewiesen
          </p>
          <p className="mt-2 text-3xl font-semibold text-[rgb(var(--fg))]">
            {readModel.summary.assignedCount}
          </p>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
            {readModel.summary.readyCount} bereit · {readModel.summary.blockedCount} blockiert
          </p>
        </article>
        <article className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
            Amtliche Freigaben
          </p>
          <p className="mt-2 text-3xl font-semibold text-[rgb(var(--fg))]">
            {readModel.summary.officialApprovalCount}
          </p>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
            public_official bleibt ein expliziter menschlicher Schritt.
          </p>
        </article>
      </section>

      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
              Arbeitsliste
            </p>
            <p className="mt-1 text-sm text-[rgb(var(--muted))]">
              Filter, Sortierung, Zuweisung, Notizen und sichere Statuswechsel liegen auf derselben
              zentralen Review-Queue. Fachentscheidungen bleiben in den bestehenden Zielpfaden.
            </p>
          </div>
          <Link
            href="/admin/create/attach-drafts"
            className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))]"
          >
            Create-Handoffs separat öffnen
          </Link>
        </div>

        <form className="mt-5 grid gap-3 lg:grid-cols-4" method="GET">
          <FilterSelect
            label="Typ"
            name="domain"
            value={readModel.filters.applied.domain}
            options={readModel.filters.options.domains}
          />
          <FilterSelect
            label="Status"
            name="status"
            value={readModel.filters.applied.operationalStatus}
            options={readModel.filters.options.statuses}
          />
          <FilterSelect
            label="Region"
            name="regionId"
            value={readModel.filters.applied.regionId}
            options={readModel.filters.options.regions}
          />
          <FilterSelect
            label="Organisation"
            name="organizationId"
            value={readModel.filters.applied.organizationId}
            options={readModel.filters.options.organizations}
          />
          <FilterSelect
            label="Priorität"
            name="priority"
            value={readModel.filters.applied.priority}
            options={readModel.filters.options.priorities}
          />
          <FilterSelect
            label="Zugewiesen an"
            name="assignedTo"
            value={readModel.filters.applied.assignedToUserId}
            options={readModel.filters.options.assignees.map((option) => ({
              ...option,
              label: option.value === userId ? "Mir" : option.label,
            }))}
          />
          <FilterSelect
            label="Sichtbarkeit"
            name="visibility"
            value={readModel.filters.applied.visibilityState}
            options={readModel.filters.options.visibilities}
          />
          <label className="space-y-2 text-xs text-[rgb(var(--muted))]">
            Sortierung
            <select
              name="sort"
              defaultValue={readModel.filters.applied.sort}
              className="w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
            >
              {readModel.filters.options.sorts.map((option) => (
                <option key={`sort:${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2 text-xs text-[rgb(var(--muted))]">
            Redaktion
            <select
              name="editorial"
              defaultValue={filters.editorial}
              className="w-full rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm text-[rgb(var(--fg))]"
            >
              {ADMIN_EDITORIAL_FILTER_OPTIONS.map((option) => (
                <option key={`editorial:${option}`} value={option}>
                  {getEditorialReviewFilterLabel(option)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap items-end gap-2 lg:col-span-4">
            <button
              type="submit"
              className="rounded-full bg-[rgb(var(--grad-from))] px-4 py-2 text-sm font-semibold text-white"
            >
              Filter anwenden
            </button>
            <Link
              href="/admin/review"
              className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))]"
            >
              Zurücksetzen
            </Link>
          </div>
        </form>

        <div className="mt-5 flex flex-wrap gap-2">
          {readModel.summary.byOperationalStatus.map((entry) => (
            <span
              key={entry.status}
              className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]"
            >
              {entry.label}: {entry.count}
            </span>
          ))}
          <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
            Redaktion: {editorialRequests.length}
          </span>
          <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
            Factchecks: {factcheckJobs.length}
          </span>
        </div>

        <AdminEditorialReviewSection currentUserId={userId} editorialRequests={editorialRequests} />

        <AdminFactcheckJobsSection factcheckJobs={factcheckJobs} />

        <AdminGraphMergeCandidatesSection {...graphMergeSectionProps} />

        <AdminTopicGraphApprovalSection {...topicGraphApprovalSectionProps} />

        <AdminDossierRuntimeCreationSection {...dossierRuntimeCreationSectionProps} />

        <AdminDossierPublishSection {...dossierPublishSectionProps} />

        <AdminAnlassraumRuntimeCreationSection {...anlassraumRuntimeCreationSectionProps} />

        <AdminAnlassraumActivationSection {...anlassraumActivationSectionProps} />

        <AdminParticipationSpaceRuntimeCreationSection
          {...participationSpaceRuntimeCreationSectionProps}
        />

        <AdminParticipationSpacePublishSection
          {...participationSpacePublishSectionProps}
        />

        <AdminCommunitySourceReviewSection {...communitySourceReviewSectionProps} />

        <div className="mt-5 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
            Operations-Persistenz
          </p>
          <p className="mt-2 text-sm font-semibold text-[rgb(var(--fg))]">
            {operationsPersistence.label}
          </p>
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">{operationsPersistence.summary}</p>
          <p className="mt-2 text-xs text-[rgb(var(--muted))]">
            {operationsPersistence.productionTruth
              ? "Zuweisungen, Notizen und Statuswechsel sind über Restart und Deployment rekonstruierbar."
              : "Nur Dev-/Test-/Runtime-Fallback: dieser Zustand darf nicht als Produktionswahrheit ausgegeben werden."}
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
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
              ? "Sichtbarkeit, Archivierung, Public URL, Share-Link und QR leiten sich aus persistierten Content-Release-Records ab."
              : "Nur Dev-/Test-/Runtime-Fallback: Sichtbarkeits- und Archivzustände dürfen so nicht als Produktionswahrheit erscheinen."}
          </p>
        </div>

        <div className="mt-5 space-y-3">
          {readModel.items.length === 0 ? (
            <EmptyState />
          ) : (
            readModel.items.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                        {item.domainLabel}
                      </span>
                      <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                        {item.workflowLabel}
                      </span>
                      <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                        {item.operationalStatusLabel}
                      </span>
                      <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                        {item.priorityLabel}
                      </span>
                      <span className="rounded-full border border-[rgb(var(--border))] px-3 py-1 text-xs text-[rgb(var(--muted))]">
                        {item.visibilityLabel}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">{item.title}</h2>
                    <p className="max-w-4xl text-sm text-[rgb(var(--muted))]">{item.summary}</p>
                    <p className="text-xs text-[rgb(var(--muted))]">
                      {item.scopeLabel} · {item.reviewAuthorityLabel} · offen seit {item.pendingHours}h
                    </p>
                    {item.v3ReviewContext ? (
                      <>
                        <V3ReviewContextSummary
                          context={item.v3ReviewContext}
                          audience="admin"
                          title="V3-Review-Kontext"
                          dataTestId={`admin-review-context-${item.id}`}
                        />
                        <div className="mt-3">
                          <V3RuntimeWorkflowSurface
                            model={buildV3RuntimeWorkflowSurfaceFromReviewContext(
                              item.v3ReviewContext,
                            )}
                            dataTestId={`admin-review-workflow-${item.id}`}
                          />
                        </div>
                        <V3DownstreamKiTransparency
                          model={buildV3DownstreamKiTransparencyFromReviewContext(
                            item.v3ReviewContext,
                            "admin",
                          )}
                          title="Downstream-KI-Transparenz"
                          dataTestId={`admin-review-downstream-ki-${item.id}`}
                        />
                        <V3VoxyCocreationDialog
                          model={buildVoxyCocreationDialogFromReviewContext(
                            item.v3ReviewContext,
                            {
                              contributionRef: {
                                id: item.id,
                                title: item.title,
                                href: item.href,
                              },
                              surface: "admin",
                              maxCards: 4,
                            },
                          )}
                          dataTestId={`admin-review-voxy-${item.id}`}
                        />
                        <SourceFactcheckFeedEnrichmentPanel
                          model={buildSourceFactcheckFeedEnrichmentFromReviewContext(
                            item.v3ReviewContext,
                            {
                              audience: "admin",
                              contributionRef: {
                                id: item.id,
                                title: item.title,
                                href: item.href,
                              },
                            },
                          )}
                          dataTestId={`admin-review-source-factcheck-feed-${item.id}`}
                        />
                        <DossierWorkspaceDecisionPanel
                          model={buildDossierWorkspaceDecisionFromReviewContext(
                            item.v3ReviewContext,
                            {
                              audience: "admin",
                              contributionRef: {
                                id: item.id,
                                title: item.title,
                                href: item.href,
                              },
                            },
                          )}
                          title="Dossier-Entscheidungslogik"
                          dataTestId={`admin-review-dossier-decision-${item.id}`}
                        />
                        <ParticipationActivationReviewPanel
                          model={buildParticipationActivationReviewFromReviewContext(
                            item.v3ReviewContext,
                            {
                              audience: "admin",
                              contributionRef: {
                                id: item.id,
                                title: item.title,
                                href: item.href,
                              },
                            },
                          )}
                          title="Beteiligungsraum vorbereiten"
                          dataTestId={`admin-review-participation-activation-${item.id}`}
                        />
                        <PollQuestionOptionsReviewPanel
                          model={buildPollQuestionOptionsReviewFromReviewContext(
                            item.v3ReviewContext,
                            {
                              audience: "admin",
                              contributionRef: {
                                id: item.id,
                                title: item.title,
                                href: item.href,
                              },
                            },
                          )}
                          title="Poll Question Review Summary"
                          dataTestId={`admin-review-poll-question-options-${item.id}`}
                        />
                        <OutputSocialWorkbenchPanel
                          model={buildOutputSocialWorkbenchFromReviewContext(
                            item.v3ReviewContext,
                            {
                              audience: "admin",
                              contributionRef: {
                                id: item.id,
                                title: item.title,
                                href: item.href,
                              },
                            },
                          )}
                          title="Output Social Workbench Summary"
                          dataTestId={`admin-review-output-social-workbench-${item.id}`}
                        />
                        <VoxyBriefingScriptCandidatePanel
                          model={buildVoxyBriefingScriptCandidateFromReviewContext(
                            item.v3ReviewContext,
                            {
                              audience: "admin",
                              contributionRef: {
                                id: item.id,
                                title: item.title,
                                href: item.href,
                              },
                              dossierRef: item.dossierId
                                ? {
                                    id: item.dossierId,
                                    title: item.title,
                                    href: item.href,
                                  }
                                : null,
                            },
                          )}
                          title="Voxy Script Candidate Summary"
                          dataTestId={`admin-review-voxy-briefing-script-${item.id}`}
                        />
                        <VoxyRenderProviderHandoffPanel
                          model={buildVoxyRenderProviderHandoffFromReviewContext(
                            item.v3ReviewContext,
                            {
                              audience: "admin",
                              contributionRef: {
                                id: item.id,
                                title: item.title,
                                href: item.href,
                              },
                              dossierRef: item.dossierId
                                ? {
                                    id: item.dossierId,
                                    title: item.title,
                                    href: item.href,
                                  }
                                : null,
                              outputRef: {
                                id: item.id,
                                title: item.title,
                                href: item.href,
                              },
                            },
                          )}
                          title="Voxy Render/Provider Handoff Summary"
                          dataTestId={`admin-review-voxy-render-provider-handoff-${item.id}`}
                        />
                      </>
                    ) : null}
                    {item.assignedToUserId ? (
                      <p className="text-xs text-[rgb(var(--muted))]">
                        Zugewiesen an {item.assignedToUserId}
                        {item.assignedAt
                          ? ` · ${new Date(item.assignedAt).toLocaleString("de-DE")}`
                          : ""}
                      </p>
                    ) : null}
                    {(item.unifiedAuditTrail ?? []).length > 0 ? (
                      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                          Kompakter Verlauf
                        </p>
                        <div className="mt-2 space-y-1">
                          {(item.unifiedAuditTrail ?? []).slice(-3).map((event) => (
                            <p key={event.id} className="text-xs text-[rgb(var(--muted))]">
                              {compactAuditLine({
                                title: event.title,
                                detail: event.detail,
                                actorLabel: event.actor.label,
                                at: event.at,
                                note: event.note,
                              })}
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {item.sourceSnapshotTemplate ? (
                      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                          {item.sourceSnapshotTemplate.label}
                        </p>
                        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                          {item.sourceSnapshotTemplate.seedKindLabel}
                          {item.sourceSnapshotTemplate.isExampleSeed
                            ? " · Beispiel-Seed"
                            : " · Region-generic"}
                        </p>
                        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                          {item.sourceSnapshotTemplate.reviewHint}
                        </p>
                      </div>
                    ) : null}
                    {item.factcheckContext ? (
                      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                          Factcheck-Kontext
                        </p>
                        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                          {item.factcheckContext.scopeSummary} · Research: {item.factcheckContext.researchMode} ·
                          Siegel: {item.factcheckContext.sealDecision}
                        </p>
                        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                          {item.factcheckContext.sourceRefCount} Quellenhinweise · {item.factcheckContext.limitationHint}
                        </p>
                      </div>
                    ) : null}
                    {item.createHandoffContext ? (
                      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                          Create-/Account-Herkunft
                        </p>
                        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                          Bestehender Create-Arbeitsstand mit Account-Resume-Bezug. {item.createHandoffContext.scopeSummary}
                        </p>
                        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                          Review-State: {item.createHandoffContext.reviewState} · {item.createHandoffContext.provenanceSummary}
                        </p>
                        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                          Account-Linkage: {item.createHandoffContext.correlationLabel} · {correlationBasisLabel(item.createHandoffContext.correlationBasis)}
                        </p>
                        {item.createHandoffContext.correlationReason ? (
                          <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                            Warum noch nicht vollständig belastbar: {item.createHandoffContext.correlationReason}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <Link
                    href={item.href}
                    className="inline-flex items-center justify-center rounded-full bg-[rgb(var(--grad-from))] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Prüfen
                  </Link>
                </div>

                <ReviewQueueItemActions item={item} currentUserId={userId} />

                {item.contentReleaseWorkbench ? (
                  <ContentReleaseWorkbenchActions
                    itemId={item.id}
                    sourceKind={item.contentReleaseWorkbench.sourceKind}
                    sourceId={item.contentReleaseWorkbench.sourceId}
                    contentReleasePersistence={contentReleasePersistence}
                    contentReleaseWorkbench={item.contentReleaseWorkbench}
                  />
                ) : null}
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
