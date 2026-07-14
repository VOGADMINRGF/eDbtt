import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { userIsAdminDashboard } from "@/lib/server/auth/admin";
import { buildReviewQueueReadModel, type ReviewQueueFilters } from "@features/reviewQueue";
import { factcheckSealDecisionLabel } from "@features/factcheck/workflow";
import FeedSourceIntakeSurfaceTruthCallout from "@/features/review/FeedSourceIntakeSurfaceTruthCallout";
import { accountCorrelationBasisLabel } from "@/features/review/e2eFlowUserFacingLabels";
import { createHandoffReviewStateLabel } from "@/features/review/reviewSurfaceStatusLabels";
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
import VoxyRenderAdapterNoopPanel from "@/features/create/VoxyRenderAdapterNoopPanel";
import VoxyRenderAssetPackDraftPanel from "@/features/create/VoxyRenderAssetPackDraftPanel";
import VoxyRenderCostCreditPolicyPanel from "@/features/create/VoxyRenderCostCreditPolicyPanel";
import VoxyRenderAssetProviderRegistryPanel from "@/features/create/VoxyRenderAssetProviderRegistryPanel";
import VoxyRenderPreviewOutcomeHandoffPanel from "@/features/create/VoxyRenderPreviewOutcomeHandoffPanel";
import VoxyRenderPreviewReviewDecisionPersistencePanel from "@/features/create/VoxyRenderPreviewReviewDecisionPersistencePanel";
import VoxyRenderPreviewReviewFlowPanel from "@/features/create/VoxyRenderPreviewReviewFlowPanel";
import VoxyRenderPublishReadinessGuardPanel from "@/features/create/VoxyRenderPublishReadinessGuardPanel";
import VoxyRenderSocialDistributionHandoffPanel from "@/features/create/VoxyRenderSocialDistributionHandoffPanel";
import VoxyRenderApprovalSemanticsPanel from "@/features/create/VoxyRenderApprovalSemanticsPanel";
import VoxyRenderMediaStorageTruthPanel from "@/features/create/VoxyRenderMediaStorageTruthPanel";
import VoxyRenderSchedulingPolicyPanel from "@/features/create/VoxyRenderSchedulingPolicyPanel";
import VoxyRenderRuntimeCutoverGatePanel from "@/features/create/VoxyRenderRuntimeCutoverGatePanel";
import VoxyRenderRuntimeObservabilityPanel from "@/features/create/VoxyRenderRuntimeObservabilityPanel";
import VoxyRenderUploadTargetPolicyPanel from "@/features/create/VoxyRenderUploadTargetPolicyPanel";
import VoxyRenderRuntimeEnablementBacklogPanel from "@/features/create/VoxyRenderRuntimeEnablementBacklogPanel";
import VoxyRenderRuntimeGoNogoMatrixPanel from "@/features/create/VoxyRenderRuntimeGoNogoMatrixPanel";
import VoxyRenderHybridRuntimeFoundationPanel from "@/features/create/VoxyRenderHybridRuntimeFoundationPanel";
import VoxyVideoBriefingFlowMasterClosurePanel from "@/features/create/VoxyVideoBriefingFlowMasterClosurePanel";
import VoxyRenderProviderSelectionDraftPanel from "@/features/create/VoxyRenderProviderSelectionDraftPanel";
import VoxyRenderQueueContractPanel from "@/features/create/VoxyRenderQueueContractPanel";
import VoxyRenderRequestDraftPanel from "@/features/create/VoxyRenderRequestDraftPanel";
import VoxyBriefingScriptCandidatePanel from "@/features/create/VoxyBriefingScriptCandidatePanel";
import VoxyRenderPreflightReadinessPanel from "@/features/create/VoxyRenderPreflightReadinessPanel";
import VoxyRenderProviderHandoffPanel from "@/features/create/VoxyRenderProviderHandoffPanel";
import VoxyRenderReviewDecisionGatePanel from "@/features/create/VoxyRenderReviewDecisionGatePanel";
import {
  buildVoxyRenderDecisionPersistencePanelModel,
} from "@/features/create/voxyRenderDecisionPersistenceContract";
import {
  buildVoxyRenderAssetPackDraftPanelModel,
  buildVoxyRenderAssetPackDraftPreviewFromReviewContext,
} from "@/features/create/voxyRenderAssetPackDraftContract";
import {
  buildVoxyRenderCostCreditPolicyPanelModel,
  buildVoxyRenderCostCreditPolicyPreviewFromReviewContext,
} from "@/features/create/voxyRenderCostCreditPolicyContract";
import {
  buildVoxyRenderPreviewOutcomeHandoffPanelModel,
} from "@/features/create/voxyRenderPreviewOutcomeHandoffContract";
import {
  buildVoxyRenderPublishReadinessGuardPanelModel,
} from "@/features/create/voxyRenderPublishReadinessGuardContract";
import {
  buildVoxyRenderSocialDistributionHandoffPanelModel,
} from "@/features/create/voxyRenderSocialDistributionHandoffContract";
import {
  buildVoxyRenderApprovalSemanticsPanelModel,
} from "@/features/create/voxyRenderApprovalSemanticsContract";
import {
  buildVoxyRenderMediaStorageTruthPanelModel,
} from "@/features/create/voxyRenderMediaStorageTruthContract";
import {
  buildVoxyRenderSchedulingPolicyPanelModel,
} from "@/features/create/voxyRenderSchedulingPolicyContract";
import {
  buildVoxyRenderRuntimeCutoverGatePanelModel,
} from "@/features/create/voxyRenderRuntimeCutoverGateContract";
import {
  buildVoxyRenderRuntimeObservabilityPanelModel,
} from "@/features/create/voxyRenderRuntimeObservabilityContract";
import {
  buildVoxyRenderUploadTargetPolicyPanelModel,
} from "@/features/create/voxyRenderUploadTargetPolicyContract";
import {
  buildVoxyVideoBriefingFlowMasterClosurePanelModel,
} from "@/features/create/voxyVideoBriefingFlowMasterClosureContract";
import {
  buildVoxyRenderPreviewReviewDecisionPersistencePanelModel,
} from "@/features/create/voxyRenderPreviewReviewDecisionPersistenceContract";
import {
  buildVoxyRenderPreviewReviewFlowFromReviewContext,
  buildVoxyRenderPreviewReviewFlowPanelModel,
} from "@/features/create/voxyRenderPreviewReviewFlowContract";
import {
  buildVoxyRenderRuntimeEnablementBacklogFromReviewContext,
  buildVoxyRenderRuntimeEnablementBacklogPanelModel,
} from "@/features/create/voxyRenderRuntimeEnablementBacklogContract";
import {
  buildVoxyRenderRuntimeGoNogoMatrixFromReviewContext,
  buildVoxyRenderRuntimeGoNogoMatrixPanelModel,
} from "@/features/create/voxyRenderRuntimeGoNogoMatrixContract";
import {
  buildVoxyRenderProviderSelectionDraftFromReviewContext,
  buildVoxyRenderProviderSelectionDraftPanelModel,
} from "@/features/create/voxyRenderProviderSelectionDraftContract";
import {
  buildVoxyRenderHybridRuntimeFoundationFromReviewContext,
  buildVoxyRenderHybridRuntimeFoundationPanelModel,
} from "@/features/create/voxyRenderHybridRuntimeFoundationContract";
import {
  buildVoxyRenderQueuePanelModel,
  buildVoxyRenderQueuePreviewFromReviewContext,
} from "@/features/create/voxyRenderQueueContract";
import {
  buildVoxyRenderRequestDraftFromReviewContext,
  buildVoxyRenderRequestDraftPanelModel,
} from "@/features/create/voxyRenderRequestDraftContract";
import {
  getVoxyRenderDecisionPersistenceState,
  listLatestVoxyRenderDecisionRecordsByDecisionGateIds,
} from "@/features/create/voxyRenderDecisionPersistenceStore";
import {
  getVoxyRenderAssetPackDraftPersistenceState,
  listLatestVoxyRenderAssetPackDraftRecordsByDecisionGateIds,
} from "@/features/create/voxyRenderAssetPackDraftStore";
import {
  getVoxyRenderCostCreditPolicyPersistenceState,
  listLatestVoxyRenderCostCreditPolicyRecordsByDecisionGateIds,
} from "@/features/create/voxyRenderCostCreditPolicyStore";
import {
  getVoxyRenderPreviewOutcomeHandoffPersistenceState,
  listLatestVoxyRenderPreviewOutcomeHandoffsByPreviewReviewDecisionRecordIds,
} from "@/features/create/voxyRenderPreviewOutcomeHandoffStore";
import {
  getVoxyRenderPublishReadinessPersistenceState,
  listLatestVoxyRenderPublishReadinessGuardsByPreviewOutcomeHandoffIds,
} from "@/features/create/voxyRenderPublishReadinessGuardStore";
import {
  getVoxyRenderSocialDistributionPersistenceState,
  listLatestVoxyRenderSocialDistributionHandoffsByPublishReadinessGuardIds,
} from "@/features/create/voxyRenderSocialDistributionHandoffStore";
import {
  getVoxyRenderApprovalPersistenceState,
  listLatestVoxyRenderApprovalSemanticsBySocialDistributionHandoffIds,
} from "@/features/create/voxyRenderApprovalSemanticsStore";
import {
  getVoxyRenderMediaStoragePersistenceState,
  listLatestVoxyRenderMediaStorageTruthByApprovalSemanticsIds,
} from "@/features/create/voxyRenderMediaStorageTruthStore";
import {
  getVoxyRenderSchedulingPolicyPersistenceState,
  listLatestVoxyRenderSchedulingPoliciesByUploadTargetPolicyIds,
} from "@/features/create/voxyRenderSchedulingPolicyStore";
import {
  getVoxyRenderRuntimeCutoverGatePersistenceState,
  listLatestVoxyRenderRuntimeCutoverGatesByRuntimeObservabilityIds,
} from "@/features/create/voxyRenderRuntimeCutoverGateStore";
import {
  getVoxyVideoBriefingFlowMasterClosurePersistenceState,
  listLatestVoxyVideoBriefingFlowMasterClosuresByRuntimeCutoverGateIds,
} from "@/features/create/voxyVideoBriefingFlowMasterClosureStore";
import {
  getVoxyRenderRuntimeObservabilityPersistenceState,
  listLatestVoxyRenderRuntimeObservabilityBySchedulingPolicyIds,
} from "@/features/create/voxyRenderRuntimeObservabilityStore";
import {
  getVoxyRenderUploadTargetPolicyPersistenceState,
  listLatestVoxyRenderUploadTargetPoliciesByMediaStorageTruthIds,
} from "@/features/create/voxyRenderUploadTargetPolicyStore";
import {
  getVoxyRenderPreviewReviewDecisionPersistenceState,
  listLatestVoxyRenderPreviewReviewDecisionRecordsByDecisionGateIds,
} from "@/features/create/voxyRenderPreviewReviewDecisionPersistenceStore";
import {
  getVoxyRenderPreviewReviewFlowPersistenceState,
  listLatestVoxyRenderPreviewReviewFlowRecordsByDecisionGateIds,
} from "@/features/create/voxyRenderPreviewReviewFlowStore";
import {
  getVoxyRenderRuntimeEnablementBacklogPersistenceState,
  listLatestVoxyRenderRuntimeEnablementBacklogRecordsByDecisionGateIds,
} from "@/features/create/voxyRenderRuntimeEnablementBacklogStore";
import {
  getVoxyRenderRuntimeGoNogoMatrixPersistenceState,
  listLatestVoxyRenderRuntimeGoNogoMatrixRecordsByDecisionGateIds,
} from "@/features/create/voxyRenderRuntimeGoNogoMatrixStore";
import {
  getVoxyRenderProviderSelectionPersistenceState,
  listLatestVoxyRenderProviderSelectionDraftRecordsByDecisionGateIds,
} from "@/features/create/voxyRenderProviderSelectionDraftStore";
import {
  getVoxyRenderQueuePersistenceState,
  listLatestVoxyRenderQueuePreviewRecordsByDecisionGateIds,
} from "@/features/create/voxyRenderQueueStore";
import {
  getVoxyRenderRequestDraftPersistenceState,
  listLatestVoxyRenderRequestDraftRecordsByDecisionGateIds,
} from "@/features/create/voxyRenderRequestDraftStore";
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
  buildVoxyRenderAdapterNoopFromReviewContext,
} from "@/features/create/voxyRenderAdapterNoopContract";
import {
  buildVoxyRenderAssetProviderRegistryFromReviewContext,
} from "@/features/create/voxyRenderAssetProviderRegistryContract";
import {
  buildVoxyRenderPreflightReadinessFromReviewContext,
} from "@/features/create/voxyRenderPreflightReadinessContract";
import {
  buildVoxyRenderProviderHandoffFromReviewContext,
} from "@/features/create/voxyRenderProviderHandoffContract";
import {
  buildVoxyRenderReviewDecisionGateFromReviewContext,
} from "@/features/create/voxyRenderReviewDecisionGateContract";
import { buildB2GFirstLoginAdminHint } from "@/features/agenticRuntime/b2gFirstLoginJurisdictionCockpitHints";
import { buildMunicipalHandoffTrialReviewHint } from "@/features/agenticRuntime/municipalHandoffThreeAdoptionTrialContract";

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
  const adminVoxyDecisionPanels = new Map<
    string,
    {
      gateModel: ReturnType<typeof buildVoxyRenderReviewDecisionGateFromReviewContext>;
      persistenceModel: ReturnType<typeof buildVoxyRenderDecisionPersistencePanelModel>;
      requestDraftModel: ReturnType<typeof buildVoxyRenderRequestDraftPanelModel>;
      queuePreviewModel: ReturnType<typeof buildVoxyRenderQueuePanelModel>;
      costCreditPolicyModel: ReturnType<typeof buildVoxyRenderCostCreditPolicyPanelModel>;
      assetPackDraftModel: ReturnType<typeof buildVoxyRenderAssetPackDraftPanelModel>;
      previewOutcomeHandoffModel: ReturnType<typeof buildVoxyRenderPreviewOutcomeHandoffPanelModel>;
      publishReadinessGuardModel: ReturnType<typeof buildVoxyRenderPublishReadinessGuardPanelModel>;
      socialDistributionHandoffModel: ReturnType<
        typeof buildVoxyRenderSocialDistributionHandoffPanelModel
      >;
      approvalSemanticsModel: ReturnType<typeof buildVoxyRenderApprovalSemanticsPanelModel>;
      mediaStorageTruthModel: ReturnType<typeof buildVoxyRenderMediaStorageTruthPanelModel>;
      schedulingPolicyModel: ReturnType<typeof buildVoxyRenderSchedulingPolicyPanelModel>;
      runtimeCutoverGateModel: ReturnType<typeof buildVoxyRenderRuntimeCutoverGatePanelModel>;
      masterClosureModel: ReturnType<typeof buildVoxyVideoBriefingFlowMasterClosurePanelModel>;
      runtimeObservabilityModel: ReturnType<
        typeof buildVoxyRenderRuntimeObservabilityPanelModel
      >;
      uploadTargetPolicyModel: ReturnType<typeof buildVoxyRenderUploadTargetPolicyPanelModel>;
      previewReviewDecisionPersistenceModel: ReturnType<
        typeof buildVoxyRenderPreviewReviewDecisionPersistencePanelModel
      >;
      previewReviewFlowModel: ReturnType<typeof buildVoxyRenderPreviewReviewFlowPanelModel>;
      runtimeEnablementBacklogModel: ReturnType<typeof buildVoxyRenderRuntimeEnablementBacklogPanelModel>;
      runtimeGoNogoMatrixModel: ReturnType<typeof buildVoxyRenderRuntimeGoNogoMatrixPanelModel>;
      providerSelectionDraftModel: ReturnType<typeof buildVoxyRenderProviderSelectionDraftPanelModel>;
      hybridRuntimeFoundationModel: ReturnType<
        typeof buildVoxyRenderHybridRuntimeFoundationPanelModel
      >;
    }
  >();
  const reviewItemsById = new Map(readModel.items.map((item) => [item.id, item]));
  for (const item of readModel.items) {
    const gateModel = item.v3ReviewContext
      ? buildVoxyRenderReviewDecisionGateFromReviewContext(item.v3ReviewContext, {
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
        })
      : null;
    adminVoxyDecisionPanels.set(item.id, {
      gateModel,
      persistenceModel: null,
      requestDraftModel: null,
      queuePreviewModel: null,
      costCreditPolicyModel: null,
      assetPackDraftModel: null,
      previewOutcomeHandoffModel: null,
      publishReadinessGuardModel: null,
      socialDistributionHandoffModel: null,
      approvalSemanticsModel: null,
      mediaStorageTruthModel: null,
      schedulingPolicyModel: null,
      runtimeCutoverGateModel: null,
      masterClosureModel: null,
      runtimeObservabilityModel: null,
      uploadTargetPolicyModel: null,
      previewReviewDecisionPersistenceModel: null,
      previewReviewFlowModel: null,
      runtimeEnablementBacklogModel: null,
      runtimeGoNogoMatrixModel: null,
      providerSelectionDraftModel: null,
      hybridRuntimeFoundationModel: null,
    });
  }
  const adminVoxyDecisionStoreState = getVoxyRenderDecisionPersistenceState();
  const adminVoxyRequestDraftStoreState = getVoxyRenderRequestDraftPersistenceState();
  const adminVoxyQueueStoreState = getVoxyRenderQueuePersistenceState();
  const adminVoxyCostCreditStoreState = getVoxyRenderCostCreditPolicyPersistenceState();
  const adminVoxyAssetPackDraftStoreState = getVoxyRenderAssetPackDraftPersistenceState();
  const adminVoxyPreviewReviewDecisionStoreState =
    getVoxyRenderPreviewReviewDecisionPersistenceState();
  const adminVoxyPreviewOutcomeHandoffStoreState =
    getVoxyRenderPreviewOutcomeHandoffPersistenceState();
  const adminVoxyPublishReadinessStoreState =
    getVoxyRenderPublishReadinessPersistenceState();
  const adminVoxySocialDistributionStoreState =
    getVoxyRenderSocialDistributionPersistenceState();
  const adminVoxyApprovalStoreState = getVoxyRenderApprovalPersistenceState();
  const adminVoxyMediaStorageStoreState = getVoxyRenderMediaStoragePersistenceState();
  const adminVoxySchedulingPolicyStoreState =
    getVoxyRenderSchedulingPolicyPersistenceState();
  const adminVoxyRuntimeObservabilityStoreState =
    getVoxyRenderRuntimeObservabilityPersistenceState();
  const adminVoxyRuntimeCutoverGateStoreState =
    getVoxyRenderRuntimeCutoverGatePersistenceState();
  const adminVoxyMasterClosureStoreState =
    getVoxyVideoBriefingFlowMasterClosurePersistenceState();
  const adminVoxyUploadTargetPolicyStoreState =
    getVoxyRenderUploadTargetPolicyPersistenceState();
  const adminVoxyRuntimeEnablementBacklogStoreState =
    getVoxyRenderRuntimeEnablementBacklogPersistenceState();
  const adminVoxyPreviewReviewFlowStoreState =
    getVoxyRenderPreviewReviewFlowPersistenceState();
  const adminVoxyRuntimeGoNogoStoreState = getVoxyRenderRuntimeGoNogoMatrixPersistenceState();
  const adminVoxyProviderSelectionStoreState = getVoxyRenderProviderSelectionPersistenceState();
  const adminVoxyLatestRecords = await listLatestVoxyRenderDecisionRecordsByDecisionGateIds(
    Array.from(adminVoxyDecisionPanels.values())
      .map((entry) => entry.gateModel?.decisionGateId ?? null)
      .filter((value): value is string => Boolean(value)),
  ).catch(() => new Map<string, any>());
  const adminVoxyLatestRequestDrafts =
    await listLatestVoxyRenderRequestDraftRecordsByDecisionGateIds(
      Array.from(adminVoxyDecisionPanels.values())
        .map((entry) => entry.gateModel?.decisionGateId ?? null)
        .filter((value): value is string => Boolean(value)),
    ).catch(() => new Map<string, any>());
  const adminVoxyLatestQueuePreviews =
    await listLatestVoxyRenderQueuePreviewRecordsByDecisionGateIds(
      Array.from(adminVoxyDecisionPanels.values())
        .map((entry) => entry.gateModel?.decisionGateId ?? null)
        .filter((value): value is string => Boolean(value)),
    ).catch(() => new Map<string, any>());
  const adminVoxyLatestCostCreditPolicies =
    await listLatestVoxyRenderCostCreditPolicyRecordsByDecisionGateIds(
      Array.from(adminVoxyDecisionPanels.values())
        .map((entry) => entry.gateModel?.decisionGateId ?? null)
        .filter((value): value is string => Boolean(value)),
    ).catch(() => new Map<string, any>());
  const adminVoxyLatestAssetPackDrafts =
    await listLatestVoxyRenderAssetPackDraftRecordsByDecisionGateIds(
      Array.from(adminVoxyDecisionPanels.values())
        .map((entry) => entry.gateModel?.decisionGateId ?? null)
        .filter((value): value is string => Boolean(value)),
    ).catch(() => new Map<string, any>());
  const adminVoxyLatestPreviewReviewDecisions =
    await listLatestVoxyRenderPreviewReviewDecisionRecordsByDecisionGateIds(
      Array.from(adminVoxyDecisionPanels.values())
        .map((entry) => entry.gateModel?.decisionGateId ?? null)
        .filter((value): value is string => Boolean(value)),
    ).catch(() => new Map<string, any>());
  const adminVoxyLatestPreviewOutcomeHandoffs =
    await listLatestVoxyRenderPreviewOutcomeHandoffsByPreviewReviewDecisionRecordIds(
      Array.from(adminVoxyLatestPreviewReviewDecisions.values())
        .map((record) => record.decisionRecordId)
        .filter((value): value is string => Boolean(value)),
    ).catch(() => new Map<string, any>());
  const adminVoxyLatestPublishReadinessGuards =
    await listLatestVoxyRenderPublishReadinessGuardsByPreviewOutcomeHandoffIds(
      Array.from(adminVoxyLatestPreviewOutcomeHandoffs.values())
        .map((record) => record.outcomeHandoffId)
        .filter((value): value is string => Boolean(value)),
    ).catch(() => new Map<string, any>());
  const adminVoxyLatestSocialDistributionHandoffs =
    await listLatestVoxyRenderSocialDistributionHandoffsByPublishReadinessGuardIds(
      Array.from(adminVoxyLatestPublishReadinessGuards.values())
        .map((record) => record.publishReadinessGuardId)
        .filter((value): value is string => Boolean(value)),
    ).catch(() => new Map<string, any>());
  const adminVoxyLatestApprovalSemantics =
    await listLatestVoxyRenderApprovalSemanticsBySocialDistributionHandoffIds(
      Array.from(adminVoxyLatestSocialDistributionHandoffs.values())
        .map((record) => record.socialDistributionHandoffId)
        .filter((value): value is string => Boolean(value)),
    ).catch(() => new Map<string, any>());
  const adminVoxyLatestMediaStorageTruth =
    await listLatestVoxyRenderMediaStorageTruthByApprovalSemanticsIds(
      Array.from(adminVoxyLatestApprovalSemantics.values())
        .map((record) => record.approvalSemanticsId)
        .filter((value): value is string => Boolean(value)),
    ).catch(() => new Map<string, any>());
  const adminVoxyLatestUploadTargetPolicies =
    await listLatestVoxyRenderUploadTargetPoliciesByMediaStorageTruthIds(
      Array.from(adminVoxyLatestMediaStorageTruth.values())
        .map((record) => record.mediaStorageTruthId)
        .filter((value): value is string => Boolean(value)),
    ).catch(() => new Map<string, any>());
  const adminVoxyLatestSchedulingPolicies =
    await listLatestVoxyRenderSchedulingPoliciesByUploadTargetPolicyIds(
      Array.from(adminVoxyLatestUploadTargetPolicies.values())
        .map((record) => record.uploadTargetPolicyId)
        .filter((value): value is string => Boolean(value)),
    ).catch(() => new Map<string, any>());
  const adminVoxyLatestRuntimeObservability =
    await listLatestVoxyRenderRuntimeObservabilityBySchedulingPolicyIds(
      Array.from(adminVoxyLatestSchedulingPolicies.values())
        .map((record) => record.schedulingPolicyId)
        .filter((value): value is string => Boolean(value)),
    ).catch(() => new Map<string, any>());
  const adminVoxyLatestRuntimeCutoverGates =
    await listLatestVoxyRenderRuntimeCutoverGatesByRuntimeObservabilityIds(
      Array.from(adminVoxyLatestRuntimeObservability.values())
        .map((record) => record.runtimeObservabilityId)
        .filter((value): value is string => Boolean(value)),
    ).catch(() => new Map<string, any>());
  const adminVoxyLatestMasterClosures =
    await listLatestVoxyVideoBriefingFlowMasterClosuresByRuntimeCutoverGateIds(
      Array.from(adminVoxyLatestRuntimeCutoverGates.values())
        .map((record) => record.runtimeCutoverGateId)
        .filter((value): value is string => Boolean(value)),
    ).catch(() => new Map<string, any>());
  const adminVoxyLatestProviderSelectionDrafts =
    await listLatestVoxyRenderProviderSelectionDraftRecordsByDecisionGateIds(
      Array.from(adminVoxyDecisionPanels.values())
        .map((entry) => entry.gateModel?.decisionGateId ?? null)
        .filter((value): value is string => Boolean(value)),
    ).catch(() => new Map<string, any>());
  const adminVoxyLatestRuntimeEnablementBacklogs =
    await listLatestVoxyRenderRuntimeEnablementBacklogRecordsByDecisionGateIds(
      Array.from(adminVoxyDecisionPanels.values())
        .map((entry) => entry.gateModel?.decisionGateId ?? null)
        .filter((value): value is string => Boolean(value)),
    ).catch(() => new Map<string, any>());
  const adminVoxyLatestPreviewReviewFlows =
    await listLatestVoxyRenderPreviewReviewFlowRecordsByDecisionGateIds(
      Array.from(adminVoxyDecisionPanels.values())
        .map((entry) => entry.gateModel?.decisionGateId ?? null)
        .filter((value): value is string => Boolean(value)),
    ).catch(() => new Map<string, any>());
  const adminVoxyLatestRuntimeGoNogoMatrices =
    await listLatestVoxyRenderRuntimeGoNogoMatrixRecordsByDecisionGateIds(
      Array.from(adminVoxyDecisionPanels.values())
        .map((entry) => entry.gateModel?.decisionGateId ?? null)
        .filter((value): value is string => Boolean(value)),
    ).catch(() => new Map<string, any>());
  for (const [itemId, panel] of adminVoxyDecisionPanels.entries()) {
    const item = reviewItemsById.get(itemId);
    const latestDecisionRecord = panel.gateModel
      ? adminVoxyLatestRecords.get(panel.gateModel.decisionGateId) ?? null
      : null;
    const latestRequestDraftRecord = panel.gateModel
      ? adminVoxyLatestRequestDrafts.get(panel.gateModel.decisionGateId) ?? null
      : null;
    const latestQueuePreviewRecord = panel.gateModel
      ? adminVoxyLatestQueuePreviews.get(panel.gateModel.decisionGateId) ?? null
      : null;
    const latestCostCreditPolicyRecord = panel.gateModel
      ? adminVoxyLatestCostCreditPolicies.get(panel.gateModel.decisionGateId) ?? null
      : null;
    const latestAssetPackDraftRecord = panel.gateModel
      ? adminVoxyLatestAssetPackDrafts.get(panel.gateModel.decisionGateId) ?? null
      : null;
    const latestPreviewReviewDecisionRecord = panel.gateModel
      ? adminVoxyLatestPreviewReviewDecisions.get(panel.gateModel.decisionGateId) ?? null
      : null;
    const latestPreviewOutcomeHandoffRecord = latestPreviewReviewDecisionRecord?.decisionRecordId
      ? adminVoxyLatestPreviewOutcomeHandoffs.get(
          latestPreviewReviewDecisionRecord.decisionRecordId,
        ) ?? null
      : null;
    const latestPublishReadinessGuardRecord = latestPreviewOutcomeHandoffRecord?.outcomeHandoffId
      ? adminVoxyLatestPublishReadinessGuards.get(latestPreviewOutcomeHandoffRecord.outcomeHandoffId) ??
        null
      : null;
    const latestSocialDistributionHandoffRecord = latestPublishReadinessGuardRecord
      ?.publishReadinessGuardId
      ? adminVoxyLatestSocialDistributionHandoffs.get(
          latestPublishReadinessGuardRecord.publishReadinessGuardId,
        ) ?? null
      : null;
    const latestApprovalSemanticsRecord = latestSocialDistributionHandoffRecord
      ?.socialDistributionHandoffId
      ? adminVoxyLatestApprovalSemantics.get(
          latestSocialDistributionHandoffRecord.socialDistributionHandoffId,
        ) ?? null
      : null;
    const latestMediaStorageTruthRecord = latestApprovalSemanticsRecord?.approvalSemanticsId
      ? adminVoxyLatestMediaStorageTruth.get(latestApprovalSemanticsRecord.approvalSemanticsId) ??
        null
      : null;
    const latestUploadTargetPolicyRecord = latestMediaStorageTruthRecord?.mediaStorageTruthId
      ? adminVoxyLatestUploadTargetPolicies.get(latestMediaStorageTruthRecord.mediaStorageTruthId) ??
        null
      : null;
    const latestSchedulingPolicyRecord = latestUploadTargetPolicyRecord?.uploadTargetPolicyId
      ? adminVoxyLatestSchedulingPolicies.get(latestUploadTargetPolicyRecord.uploadTargetPolicyId) ??
        null
      : null;
    const latestRuntimeObservabilityRecord = latestSchedulingPolicyRecord?.schedulingPolicyId
      ? adminVoxyLatestRuntimeObservability.get(latestSchedulingPolicyRecord.schedulingPolicyId) ??
        null
      : null;
    const latestRuntimeCutoverGateRecord = latestRuntimeObservabilityRecord
      ?.runtimeObservabilityId
      ? adminVoxyLatestRuntimeCutoverGates.get(
          latestRuntimeObservabilityRecord.runtimeObservabilityId,
        ) ?? null
      : null;
    const latestMasterClosureRecord = latestRuntimeCutoverGateRecord?.runtimeCutoverGateId
      ? adminVoxyLatestMasterClosures.get(latestRuntimeCutoverGateRecord.runtimeCutoverGateId) ??
        null
      : null;
    const latestProviderSelectionDraftRecord = panel.gateModel
      ? adminVoxyLatestProviderSelectionDrafts.get(panel.gateModel.decisionGateId) ?? null
      : null;
    const latestRuntimeEnablementBacklogRecord = panel.gateModel
      ? adminVoxyLatestRuntimeEnablementBacklogs.get(panel.gateModel.decisionGateId) ?? null
      : null;
    const latestPreviewReviewFlowRecord = panel.gateModel
      ? adminVoxyLatestPreviewReviewFlows.get(panel.gateModel.decisionGateId) ?? null
      : null;
    const latestRuntimeGoNogoMatrixRecord = panel.gateModel
      ? adminVoxyLatestRuntimeGoNogoMatrices.get(panel.gateModel.decisionGateId) ?? null
      : null;
    const previewReviewFlow = panel.gateModel && item?.v3ReviewContext
      ? buildVoxyRenderPreviewReviewFlowFromReviewContext({
          reviewContext: item.v3ReviewContext,
          surface: "admin",
          latestDecisionRecord,
          latestRequestDraft: latestRequestDraftRecord,
          latestQueuePreview: latestQueuePreviewRecord,
          latestCostPolicyPreview: latestCostCreditPolicyRecord,
          latestAssetPackDraft: latestAssetPackDraftRecord,
          latestProviderSelectionDraft: latestProviderSelectionDraftRecord,
          latestMatrix: latestRuntimeGoNogoMatrixRecord,
          latestBacklog: latestRuntimeEnablementBacklogRecord,
        })
      : null;
    adminVoxyDecisionPanels.set(itemId, {
      gateModel: panel.gateModel,
      persistenceModel: buildVoxyRenderDecisionPersistencePanelModel({
        gate: panel.gateModel,
        latestRecord: latestDecisionRecord,
        storeState: panel.gateModel ? adminVoxyDecisionStoreState : null,
      }),
      requestDraftModel: panel.gateModel && item?.v3ReviewContext
        ? buildVoxyRenderRequestDraftPanelModel({
            draft: buildVoxyRenderRequestDraftFromReviewContext(item.v3ReviewContext, {
              audience: "admin",
              latestDecisionRecord,
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
            }),
            latestRecord: latestRequestDraftRecord,
            storeState: adminVoxyRequestDraftStoreState,
          })
        : null,
      queuePreviewModel: panel.gateModel && item?.v3ReviewContext
        ? buildVoxyRenderQueuePanelModel({
            preview: buildVoxyRenderQueuePreviewFromReviewContext(item.v3ReviewContext, {
              audience: "admin",
              latestDecisionRecord,
              latestRequestDraftRecord,
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
            }),
            latestRecord: latestQueuePreviewRecord,
            storeState: adminVoxyQueueStoreState,
          })
        : null,
      costCreditPolicyModel: panel.gateModel && item?.v3ReviewContext
        ? buildVoxyRenderCostCreditPolicyPanelModel({
            preview: buildVoxyRenderCostCreditPolicyPreviewFromReviewContext(
              item.v3ReviewContext,
              {
                audience: "admin",
                latestDecisionRecord,
                latestRequestDraftRecord,
                latestQueuePreviewRecord,
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
            ),
            latestRecord: latestCostCreditPolicyRecord,
            storeState: adminVoxyCostCreditStoreState,
          })
        : null,
      assetPackDraftModel: panel.gateModel && item?.v3ReviewContext
        ? buildVoxyRenderAssetPackDraftPanelModel({
            preview: buildVoxyRenderAssetPackDraftPreviewFromReviewContext(
              item.v3ReviewContext,
              {
                audience: "admin",
                latestDecisionRecord,
                latestRequestDraftRecord,
                latestQueuePreviewRecord,
                latestCostPolicyPreviewRecord: latestCostCreditPolicyRecord,
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
            ),
            latestRecord: latestAssetPackDraftRecord,
            storeState: adminVoxyAssetPackDraftStoreState,
          })
        : null,
      previewOutcomeHandoffModel: previewReviewFlow
        ? buildVoxyRenderPreviewOutcomeHandoffPanelModel({
            previewFlow: previewReviewFlow,
            latestPreviewReviewDecisionRecord,
            latestRecord: latestPreviewOutcomeHandoffRecord,
            latestBacklog: latestRuntimeEnablementBacklogRecord,
            latestMatrix: latestRuntimeGoNogoMatrixRecord,
            latestRequestDraft: latestRequestDraftRecord,
            gate: panel.gateModel,
            storeState: adminVoxyPreviewOutcomeHandoffStoreState,
          })
        : null,
      publishReadinessGuardModel: previewReviewFlow
        ? buildVoxyRenderPublishReadinessGuardPanelModel({
            previewFlow: previewReviewFlow,
            latestPreviewOutcomeHandoffRecord,
            latestPreviewReviewDecisionRecord,
            latestRecord: latestPublishReadinessGuardRecord,
            latestBacklog: latestRuntimeEnablementBacklogRecord,
            latestMatrix: latestRuntimeGoNogoMatrixRecord,
            latestRequestDraft: latestRequestDraftRecord,
            gate: panel.gateModel,
            storeState: adminVoxyPublishReadinessStoreState,
          })
        : null,
      socialDistributionHandoffModel: previewReviewFlow
        ? buildVoxyRenderSocialDistributionHandoffPanelModel({
            previewFlow: previewReviewFlow,
            latestPreviewOutcomeHandoffRecord,
            latestPublishReadinessGuardRecord,
            latestPreviewReviewDecisionRecord,
            latestRecord: latestSocialDistributionHandoffRecord,
            latestBacklog: latestRuntimeEnablementBacklogRecord,
            latestMatrix: latestRuntimeGoNogoMatrixRecord,
            latestRequestDraft: latestRequestDraftRecord,
            gate: panel.gateModel,
            storeState: adminVoxySocialDistributionStoreState,
          })
        : null,
      approvalSemanticsModel: previewReviewFlow
        ? buildVoxyRenderApprovalSemanticsPanelModel({
            previewFlow: previewReviewFlow,
            latestPreviewOutcomeHandoffRecord,
            latestPreviewReviewDecisionRecord,
            latestPublishReadinessGuardRecord,
            latestSocialDistributionHandoffRecord,
            latestRecord: latestApprovalSemanticsRecord,
            latestBacklog: latestRuntimeEnablementBacklogRecord,
            latestMatrix: latestRuntimeGoNogoMatrixRecord,
            latestRequestDraft: latestRequestDraftRecord,
            gate: panel.gateModel,
            storeState: adminVoxyApprovalStoreState,
          })
        : null,
      mediaStorageTruthModel: previewReviewFlow
        ? buildVoxyRenderMediaStorageTruthPanelModel({
            previewFlow: previewReviewFlow,
            latestApprovalSemanticsRecord,
            latestRecord: latestMediaStorageTruthRecord,
            latestBacklog: latestRuntimeEnablementBacklogRecord,
            latestMatrix: latestRuntimeGoNogoMatrixRecord,
            latestRequestDraft: latestRequestDraftRecord,
            gate: panel.gateModel,
            storeState: adminVoxyMediaStorageStoreState,
          })
        : null,
      schedulingPolicyModel: previewReviewFlow
        ? buildVoxyRenderSchedulingPolicyPanelModel({
            previewFlow: previewReviewFlow,
            latestUploadTargetPolicyRecord,
            latestMediaStorageTruthRecord,
            latestApprovalSemanticsRecord,
            latestPublishReadinessGuardRecord,
            latestSocialDistributionHandoffRecord,
            latestRecord: latestSchedulingPolicyRecord,
            latestBacklog: latestRuntimeEnablementBacklogRecord,
            latestMatrix: latestRuntimeGoNogoMatrixRecord,
            latestRequestDraft: latestRequestDraftRecord,
            gate: panel.gateModel,
            storeState: adminVoxySchedulingPolicyStoreState,
          })
        : null,
      runtimeCutoverGateModel: previewReviewFlow
        ? buildVoxyRenderRuntimeCutoverGatePanelModel({
            latestRuntimeObservabilityRecord,
            latestSchedulingPolicyRecord,
            latestUploadTargetPolicyRecord,
            latestMediaStorageTruthRecord,
            latestApprovalSemanticsRecord,
            latestSocialDistributionHandoffRecord,
            latestPublishReadinessGuardRecord,
            latestProviderSelectionDraft: latestProviderSelectionDraftRecord,
            latestQueueContract: latestQueuePreviewRecord,
            latestCostCreditPolicy: latestCostCreditPolicyRecord,
            latestBacklog: latestRuntimeEnablementBacklogRecord,
            latestMatrix: latestRuntimeGoNogoMatrixRecord,
            latestRequestDraft: latestRequestDraftRecord,
            previewFlow: previewReviewFlow,
            gate: panel.gateModel,
            latestRecord: latestRuntimeCutoverGateRecord,
            storeState: adminVoxyRuntimeCutoverGateStoreState,
            runtimeObservabilityStoreState: adminVoxyRuntimeObservabilityStoreState,
          })
        : null,
      masterClosureModel: previewReviewFlow && item?.v3ReviewContext
        ? buildVoxyVideoBriefingFlowMasterClosurePanelModel({
            latestRuntimeCutoverGateRecord,
            latestRuntimeObservabilityRecord,
            latestSchedulingPolicyRecord,
            latestUploadTargetPolicyRecord,
            latestMediaStorageTruthRecord,
            latestApprovalSemanticsRecord,
            latestSocialDistributionHandoffRecord,
            latestPublishReadinessGuardRecord,
            latestPreviewOutcomeHandoffRecord,
            latestPreviewReviewFlowRecord: previewReviewFlow,
            latestRequestDraft: latestRequestDraftRecord,
            latestScriptCandidate: buildVoxyBriefingScriptCandidateFromReviewContext(
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
            ),
            latestProviderSelectionDraft: latestProviderSelectionDraftRecord,
            latestAssetPackDraft: latestAssetPackDraftRecord,
            latestQueueContract: latestQueuePreviewRecord,
            latestCostCreditPolicy: latestCostCreditPolicyRecord,
            latestRecord: latestMasterClosureRecord,
            storeState: adminVoxyMasterClosureStoreState,
            runtimeCutoverGateStoreState: adminVoxyRuntimeCutoverGateStoreState,
          })
        : null,
      runtimeObservabilityModel: previewReviewFlow
        ? buildVoxyRenderRuntimeObservabilityPanelModel({
            previewFlow: previewReviewFlow,
            latestSchedulingPolicyRecord,
            latestUploadTargetPolicyRecord,
            latestMediaStorageTruthRecord,
            latestApprovalSemanticsRecord,
            latestSocialDistributionHandoffRecord,
            latestPublishReadinessGuardRecord,
            latestPreviewOutcomeHandoffRecord,
            latestRecord: latestRuntimeObservabilityRecord,
            latestBacklog: latestRuntimeEnablementBacklogRecord,
            latestMatrix: latestRuntimeGoNogoMatrixRecord,
            latestRequestDraft: latestRequestDraftRecord,
            gate: panel.gateModel,
            storeState: adminVoxyRuntimeObservabilityStoreState,
            schedulingPolicyStoreState: adminVoxySchedulingPolicyStoreState,
          })
        : null,
      uploadTargetPolicyModel: previewReviewFlow
        ? buildVoxyRenderUploadTargetPolicyPanelModel({
            previewFlow: previewReviewFlow,
            latestMediaStorageTruthRecord: latestMediaStorageTruthRecord,
            latestApprovalSemanticsRecord,
            latestPublishReadinessGuardRecord,
            latestSocialDistributionHandoffRecord,
            latestRecord: latestUploadTargetPolicyRecord,
            latestBacklog: latestRuntimeEnablementBacklogRecord,
            latestMatrix: latestRuntimeGoNogoMatrixRecord,
            latestRequestDraft: latestRequestDraftRecord,
            gate: panel.gateModel,
            storeState: adminVoxyUploadTargetPolicyStoreState,
          })
        : null,
      previewReviewDecisionPersistenceModel: panel.gateModel && item?.v3ReviewContext
        ? buildVoxyRenderPreviewReviewDecisionPersistencePanelModel({
            previewFlow: previewReviewFlow,
            latestRecord: latestPreviewReviewDecisionRecord,
            storeState: adminVoxyPreviewReviewDecisionStoreState,
          })
        : null,
      previewReviewFlowModel: previewReviewFlow
        ? buildVoxyRenderPreviewReviewFlowPanelModel({
            preview: previewReviewFlow,
            latestRecord: latestPreviewReviewFlowRecord,
            persistenceState: adminVoxyPreviewReviewFlowStoreState,
            backlogStoreState: adminVoxyRuntimeEnablementBacklogStoreState,
          })
        : null,
      runtimeEnablementBacklogModel: panel.gateModel && item?.v3ReviewContext
        ? buildVoxyRenderRuntimeEnablementBacklogPanelModel({
            preview: buildVoxyRenderRuntimeEnablementBacklogFromReviewContext({
              reviewContext: item.v3ReviewContext,
              latestDecisionRecord,
              latestRequestDraft: latestRequestDraftRecord,
              latestQueuePreview: latestQueuePreviewRecord,
              latestCostPolicyPreview: latestCostCreditPolicyRecord,
              latestAssetPackDraft: latestAssetPackDraftRecord,
              latestProviderSelectionDraft: latestProviderSelectionDraftRecord,
              latestMatrix: latestRuntimeGoNogoMatrixRecord,
            }),
            latestRecord: latestRuntimeEnablementBacklogRecord,
            persistenceState: adminVoxyRuntimeEnablementBacklogStoreState,
          })
        : null,
      runtimeGoNogoMatrixModel: panel.gateModel && item?.v3ReviewContext
        ? buildVoxyRenderRuntimeGoNogoMatrixPanelModel({
            preview: buildVoxyRenderRuntimeGoNogoMatrixFromReviewContext({
              reviewContext: item.v3ReviewContext,
              latestDecisionRecord,
              latestRequestDraft: latestRequestDraftRecord,
              latestQueuePreview: latestQueuePreviewRecord,
              latestCostPolicyPreview: latestCostCreditPolicyRecord,
              latestAssetPackDraft: latestAssetPackDraftRecord,
              latestProviderSelectionDraft: latestProviderSelectionDraftRecord,
            }),
            latestRecord: latestRuntimeGoNogoMatrixRecord,
            persistenceState: adminVoxyRuntimeGoNogoStoreState,
          })
        : null,
      providerSelectionDraftModel: panel.gateModel && item?.v3ReviewContext
        ? buildVoxyRenderProviderSelectionDraftPanelModel({
            preview: buildVoxyRenderProviderSelectionDraftFromReviewContext(
              item.v3ReviewContext,
              {
                audience: "admin",
                latestDecisionRecord,
                latestRequestDraftRecord,
                latestQueuePreviewRecord,
                latestCostPolicyPreviewRecord: latestCostCreditPolicyRecord,
                latestAssetPackDraftRecord,
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
            ),
            latestRecord: latestProviderSelectionDraftRecord,
            storeState: adminVoxyProviderSelectionStoreState,
          })
        : null,
      hybridRuntimeFoundationModel: item?.v3ReviewContext
        ? buildVoxyRenderHybridRuntimeFoundationPanelModel({
            preview: buildVoxyRenderHybridRuntimeFoundationFromReviewContext(
              item.v3ReviewContext,
              { surface: "admin" },
            ),
          })
        : null,
    });
  }
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
        <p className="mt-2 max-w-3xl text-sm text-[rgb(var(--muted))]">
          {buildB2GFirstLoginAdminHint()} Reviewed topic candidates sind noch kein offizieller Behördenprozess, und das Response Cockpit bleibt getrennt von externer Notification.
        </p>
        <p className="mt-2 max-w-3xl text-sm text-[rgb(var(--muted))]">
          {buildMunicipalHandoffTrialReviewHint()}
        </p>
      </header>

      <FeedSourceIntakeSurfaceTruthCallout surface="admin_review" />

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
                        <VoxyRenderReviewDecisionGatePanel
                          model={adminVoxyDecisionPanels.get(item.id)?.gateModel ?? null}
                          persistenceModel={
                            adminVoxyDecisionPanels.get(item.id)?.persistenceModel ?? null
                          }
                          title="Voxy Render Decision Summary"
                          dataTestId={`admin-review-voxy-render-decision-${item.id}`}
                        />
                        <VoxyRenderRequestDraftPanel
                          model={adminVoxyDecisionPanels.get(item.id)?.requestDraftModel ?? null}
                          dataTestId={`admin-review-voxy-render-request-draft-${item.id}`}
                        />
                        <VoxyRenderQueueContractPanel
                          model={adminVoxyDecisionPanels.get(item.id)?.queuePreviewModel ?? null}
                          dataTestId={`admin-review-voxy-render-queue-contract-${item.id}`}
                        />
                        <VoxyRenderCostCreditPolicyPanel
                          model={
                            adminVoxyDecisionPanels.get(item.id)?.costCreditPolicyModel ?? null
                          }
                          dataTestId={`admin-review-voxy-render-cost-credit-policy-${item.id}`}
                        />
                        <VoxyRenderAssetPackDraftPanel
                          model={
                            adminVoxyDecisionPanels.get(item.id)?.assetPackDraftModel ?? null
                          }
                          dataTestId={`admin-review-voxy-render-asset-pack-draft-${item.id}`}
                        />
                        <VoxyRenderProviderSelectionDraftPanel
                          model={
                            adminVoxyDecisionPanels.get(item.id)?.providerSelectionDraftModel ??
                            null
                          }
                          dataTestId={`admin-review-voxy-render-provider-selection-draft-${item.id}`}
                        />
                        <VoxyRenderHybridRuntimeFoundationPanel
                          model={
                            adminVoxyDecisionPanels.get(item.id)?.hybridRuntimeFoundationModel ??
                            null
                          }
                          dataTestId={`admin-review-voxy-hybrid-runtime-foundation-${item.id}`}
                        />
                        <VoxyRenderRuntimeGoNogoMatrixPanel
                          model={
                            adminVoxyDecisionPanels.get(item.id)?.runtimeGoNogoMatrixModel ??
                            null
                          }
                          dataTestId={`admin-review-voxy-render-runtime-go-nogo-matrix-${item.id}`}
                        />
                        <VoxyRenderRuntimeEnablementBacklogPanel
                          model={
                            adminVoxyDecisionPanels.get(item.id)?.runtimeEnablementBacklogModel ??
                            null
                          }
                          dataTestId={`admin-review-voxy-render-runtime-enablement-backlog-${item.id}`}
                        />
                        <VoxyRenderPreviewReviewFlowPanel
                          model={
                            adminVoxyDecisionPanels.get(item.id)?.previewReviewFlowModel ?? null
                          }
                          dataTestId={`admin-review-voxy-render-preview-review-flow-${item.id}`}
                        />
                        <VoxyRenderPreviewReviewDecisionPersistencePanel
                          model={
                            adminVoxyDecisionPanels.get(item.id)
                              ?.previewReviewDecisionPersistenceModel ?? null
                          }
                          dataTestId={`admin-review-voxy-render-preview-review-decision-persistence-${item.id}`}
                        />
                        <VoxyRenderPreviewOutcomeHandoffPanel
                          model={
                            adminVoxyDecisionPanels.get(item.id)?.previewOutcomeHandoffModel ??
                            null
                          }
                          dataTestId={`admin-review-voxy-render-preview-outcome-handoff-${item.id}`}
                        />
                        <VoxyRenderPublishReadinessGuardPanel
                          model={
                            adminVoxyDecisionPanels.get(item.id)?.publishReadinessGuardModel ??
                            null
                          }
                          dataTestId={`admin-review-voxy-render-publish-readiness-guard-${item.id}`}
                        />
                        <VoxyRenderSocialDistributionHandoffPanel
                          model={
                            adminVoxyDecisionPanels.get(item.id)?.socialDistributionHandoffModel ??
                            null
                          }
                          dataTestId={`admin-review-voxy-render-social-distribution-handoff-${item.id}`}
                        />
                        <VoxyRenderApprovalSemanticsPanel
                          model={
                            adminVoxyDecisionPanels.get(item.id)?.approvalSemanticsModel ?? null
                          }
                          dataTestId={`admin-review-voxy-render-approval-semantics-${item.id}`}
                        />
                        <VoxyRenderMediaStorageTruthPanel
                          model={
                            adminVoxyDecisionPanels.get(item.id)?.mediaStorageTruthModel ?? null
                          }
                          dataTestId={`admin-review-voxy-render-media-storage-truth-${item.id}`}
                        />
                        <VoxyRenderUploadTargetPolicyPanel
                          model={
                            adminVoxyDecisionPanels.get(item.id)?.uploadTargetPolicyModel ?? null
                          }
                          dataTestId={`admin-review-voxy-render-upload-target-policy-${item.id}`}
                        />
                        <VoxyRenderSchedulingPolicyPanel
                          model={
                            adminVoxyDecisionPanels.get(item.id)?.schedulingPolicyModel ?? null
                          }
                          dataTestId={`admin-review-voxy-render-scheduling-policy-${item.id}`}
                        />
                        <VoxyRenderRuntimeObservabilityPanel
                          model={
                            adminVoxyDecisionPanels.get(item.id)?.runtimeObservabilityModel ??
                            null
                          }
                          dataTestId={`admin-review-voxy-render-runtime-observability-${item.id}`}
                        />
                        <VoxyRenderRuntimeCutoverGatePanel
                          model={
                            adminVoxyDecisionPanels.get(item.id)?.runtimeCutoverGateModel ??
                            null
                          }
                          dataTestId={`admin-review-voxy-render-runtime-cutover-gate-${item.id}`}
                        />
                        <VoxyVideoBriefingFlowMasterClosurePanel
                          model={
                            adminVoxyDecisionPanels.get(item.id)?.masterClosureModel ?? null
                          }
                          dataTestId={`admin-review-voxy-video-briefing-flow-master-closure-${item.id}`}
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
                        <VoxyRenderPreflightReadinessPanel
                          model={buildVoxyRenderPreflightReadinessFromReviewContext(
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
                          title="Voxy Render Preflight Summary"
                          dataTestId={`admin-review-voxy-render-preflight-${item.id}`}
                        />
                        <VoxyRenderAssetProviderRegistryPanel
                          model={buildVoxyRenderAssetProviderRegistryFromReviewContext(
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
                          title="Voxy Asset & Provider Registry Summary"
                          dataTestId={`admin-review-voxy-render-registry-${item.id}`}
                        />
                        <VoxyRenderAdapterNoopPanel
                          model={buildVoxyRenderAdapterNoopFromReviewContext(
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
                          title="Voxy Render Adapter Summary"
                          dataTestId={`admin-review-voxy-render-adapter-${item.id}`}
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
                          Siegel: {factcheckSealDecisionLabel(item.factcheckContext.sealDecision as "none" | "requested" | "granted" | "revoked")}
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
                          Review-State: {createHandoffReviewStateLabel(item.createHandoffContext.reviewState)} ·{" "}
                          {item.createHandoffContext.provenanceSummary}
                        </p>
                        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                          Account-Linkage: {item.createHandoffContext.correlationLabel} · {accountCorrelationBasisLabel(item.createHandoffContext.correlationBasis)}
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
