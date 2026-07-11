import Link from "next/link";
import { shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import {
  dossierClaimsCol,
  dossierSourcesCol,
  openQuestionsCol,
} from "@features/dossier/db";
import { findDossierByAnyId } from "@features/dossier/lookup";
import { getDossierStudioWorkspaceRepo } from "@features/dossier/server/studioPersistence";
import MasterPostActions from "@/components/outputEngine/MasterPostActions";
import SocialCarouselPreview from "@/components/outputEngine/SocialCarouselPreview";
import SocialDistributionPanel from "@/components/outputEngine/SocialDistributionPanel";
import {
  OutputPackageSchema,
  buildSocialDistributionPlan,
  loadSocialDistributionQueueReadModel,
  demoDossierForOutputEngine,
  generateMasterPost,
  generateSocialCarouselOutput,
  generateOutputPackage,
  getSocialPublishingPolicy,
  type MinimalDossierInput,
} from "@features/outputEngine";
import {
  type ExplicitOfficialPublicationApproval,
  publicationVisibilityLabel,
  resolveExplicitOfficialVisibility,
  type RegionPublicationVisibilityState,
} from "@features/region/publicationRiskLadder";
import { getRelatedTopicPageForDossier } from "@features/publicTopicPage";
import {
  buildRuntimeDataGuardrail,
  isExplicitDemoDossierId,
  isRegionDraftDossierId,
} from "@/features/runtimeDataGuardrails";
import { getPersistedCreateHandoffRecord } from "@/features/create/persistedHandoffReviewQueue";
import {
  buildLedgerContributionSourceRefs,
  buildPersistedHandoffReverseCorrelation,
} from "@features/account/buildContributionHandoffCorrelations";
import { loadAccountCreateContributionLedger } from "@features/account/loadAccountCreateContributionLedger";
import V3DownstreamKiTransparency, {
  buildV3DownstreamKiTransparencyFromReviewContext,
} from "@/features/create/V3DownstreamKiTransparency";
import { buildDossierWorkspaceV3ReviewContext } from "@/features/create/unifiedReviewQueueWiring";
import V3ReviewContextSummary from "@/features/create/V3ReviewContextSummary";
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
import VoxyRenderRuntimeEnablementBacklogPanel from "@/features/create/VoxyRenderRuntimeEnablementBacklogPanel";
import VoxyRenderRuntimeGoNogoMatrixPanel from "@/features/create/VoxyRenderRuntimeGoNogoMatrixPanel";
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
  buildVoxyRenderQueuePanelModel,
  buildVoxyRenderQueuePreviewFromReviewContext,
} from "@/features/create/voxyRenderQueueContract";
import {
  buildVoxyRenderRequestDraftFromReviewContext,
  buildVoxyRenderRequestDraftPanelModel,
} from "@/features/create/voxyRenderRequestDraftContract";
import {
  getLatestVoxyRenderDecisionRecord,
  getVoxyRenderDecisionPersistenceState,
} from "@/features/create/voxyRenderDecisionPersistenceStore";
import {
  getLatestVoxyRenderAssetPackDraftRecord,
  getVoxyRenderAssetPackDraftPersistenceState,
} from "@/features/create/voxyRenderAssetPackDraftStore";
import {
  getLatestVoxyRenderCostCreditPolicyRecord,
  getVoxyRenderCostCreditPolicyPersistenceState,
} from "@/features/create/voxyRenderCostCreditPolicyStore";
import {
  getLatestVoxyRenderPreviewOutcomeHandoffRecord,
  getVoxyRenderPreviewOutcomeHandoffPersistenceState,
} from "@/features/create/voxyRenderPreviewOutcomeHandoffStore";
import {
  getLatestVoxyRenderPublishReadinessGuardRecord,
  getVoxyRenderPublishReadinessPersistenceState,
} from "@/features/create/voxyRenderPublishReadinessGuardStore";
import {
  getLatestVoxyRenderPreviewReviewDecisionRecord,
  getVoxyRenderPreviewReviewDecisionPersistenceState,
} from "@/features/create/voxyRenderPreviewReviewDecisionPersistenceStore";
import {
  getLatestVoxyRenderPreviewReviewFlowRecord,
  getVoxyRenderPreviewReviewFlowPersistenceState,
} from "@/features/create/voxyRenderPreviewReviewFlowStore";
import {
  getLatestVoxyRenderRuntimeEnablementBacklogRecord,
  getVoxyRenderRuntimeEnablementBacklogPersistenceState,
} from "@/features/create/voxyRenderRuntimeEnablementBacklogStore";
import {
  getLatestVoxyRenderRuntimeGoNogoMatrixRecord,
  getVoxyRenderRuntimeGoNogoMatrixPersistenceState,
} from "@/features/create/voxyRenderRuntimeGoNogoMatrixStore";
import {
  getLatestVoxyRenderProviderSelectionDraftRecord,
  getVoxyRenderProviderSelectionPersistenceState,
} from "@/features/create/voxyRenderProviderSelectionDraftStore";
import {
  getLatestVoxyRenderQueuePreviewRecord,
  getVoxyRenderQueuePersistenceState,
} from "@/features/create/voxyRenderQueueStore";
import {
  getLatestVoxyRenderRequestDraftRecord,
  getVoxyRenderRequestDraftPersistenceState,
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

type PageProps = { params: Promise<{ id: string }> };

const REVIEW_REQUIRED_STATUSES = new Set(["draft", "needs_review"]);

function withOfficialVisibility<T extends { visibilityState: string }>(
  value: T,
  officialApproval: ExplicitOfficialPublicationApproval | null | undefined,
): T {
  return {
    ...value,
    visibilityState: resolveExplicitOfficialVisibility({
      fallbackVisibilityState:
        value.visibilityState as RegionPublicationVisibilityState,
      officialApproval: officialApproval ?? null,
    }),
  };
}

function reviewStatusLabel(value: string): string {
  if (value === "draft") return "Entwurf";
  if (value === "needs_review") return "Review erforderlich";
  if (value === "approved") return "Freigegeben";
  if (value === "rejected") return "Abgelehnt";
  if (value === "published") return "Veröffentlicht";
  if (value === "archived") return "Archiviert";
  return value;
}

function completenessLabel(value: string): string {
  if (value === "complete") return "vollständig";
  if (value === "needs_input") return "Eingaben fehlen";
  return value;
}

function sourceStateLabel(value: string): string {
  if (value === "sufficient") return "ausreichend";
  if (value === "missing") return "unvollständig";
  return value;
}

type StudioRuntimeState =
  | {
      mode: "runtime";
      dossier: MinimalDossierInput;
      guardrailLabel: string;
    }
  | {
      mode: "demo";
      dossier: MinimalDossierInput;
      guardrailLabel: string;
    }
  | {
      mode: "missing";
      guardrailLabel: string;
    };

async function loadStudioRuntimeState(dossierId: string): Promise<StudioRuntimeState> {
  if (isExplicitDemoDossierId(dossierId)) {
    const guardrail = buildRuntimeDataGuardrail("demo");
    return {
      mode: "demo",
      dossier: {
        ...demoDossierForOutputEngine,
        id: dossierId,
        updatedAt: demoDossierForOutputEngine.updatedAt,
      },
      guardrailLabel: `${guardrail.sourceKind} · demoOnly=${guardrail.demoOnly} · notProductionData=${guardrail.notProductionData}`,
    };
  }

  const dossier = await findDossierByAnyId(dossierId).catch(() => null);
  if (!dossier) {
    return {
      mode: "missing",
      guardrailLabel: isRegionDraftDossierId(dossierId)
        ? "runtime missing · region draft review only · no demo fallback"
        : "runtime missing · no demo fallback in produktnahen Studio-Pfaden",
    };
  }

  const [claims, sources, openQuestions] = await Promise.all([
    (await dossierClaimsCol()).find({ dossierId: dossier.dossierId }).sort({ createdAt: 1 }).toArray(),
    (await dossierSourcesCol()).find({ dossierId: dossier.dossierId }).sort({ createdAt: 1 }).toArray(),
    (await openQuestionsCol()).find({ dossierId: dossier.dossierId }).sort({ createdAt: 1 }).toArray(),
  ]);
  const guardrail = buildRuntimeDataGuardrail("runtime");
  return {
    mode: "runtime",
    dossier: {
      id: dossier.dossierId,
      title: dossier.title ?? `Dossier ${dossier.dossierId}`,
      summary:
        dossier.status === "draft"
          ? "Reviewpflichtiger Dossier-Entwurf aus einem produktnahen Arbeitskontext. Keine veröffentlichte Dossierfassung."
          : "Runtime-Dossier für das Studio.",
      claims: claims.map((claim) => ({
        id: claim.claimId,
        text: claim.text,
        status: claim.status,
      })),
      sources: sources.map((source) => ({
        id: source.sourceId,
        title: source.title,
        url: source.url,
      })),
      openQuestions: openQuestions.map((question) => question.text),
      options: [],
      status: dossier.status,
      updatedAt: dossier.updatedAt?.toISOString() ?? dossier.createdAt.toISOString(),
    },
    guardrailLabel: `${guardrail.sourceKind} · reviewRequired=${guardrail.reviewRequired} · notProductionData=${guardrail.notProductionData}`,
  };
}

export default async function DossierOutputStudioPage({ params }: PageProps) {
  const { id } = await params;
  const runtimeState = await loadStudioRuntimeState(id);

  if (runtimeState.mode === "missing") {
    return (
      <main className="mx-auto min-h-screen max-w-5xl space-y-4 px-4 py-10 text-[rgb(var(--fg))]">
        <h1 className="text-2xl font-semibold">eDebatte Studio</h1>
        <p className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-950">
          Für dieses Dossier liegen aktuell keine runtimefähigen Studio-Daten vor. Es wird bewusst kein
          `demoDossierForOutputEngine` als Ersatz in einem produktnahen Pfad angezeigt.
        </p>
        <p className="text-sm text-[rgb(var(--muted))]">
          Guardrail: {runtimeState.guardrailLabel}. Lokale Studio-Arbeitsstände bleiben browserlokal und sind
          keine produktive Behördenpersistenz.
        </p>
      </main>
    );
  }

  const outputPackage = generateOutputPackage(runtimeState.dossier, {
    generatedAt: runtimeState.dossier.updatedAt,
    baseUrl: "https://edebatte.org",
  });

  const parsedPackage = OutputPackageSchema.safeParse(outputPackage);

  if (!parsedPackage.success) {
    return (
      <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 space-y-4 text-[rgb(var(--fg))]">
        <h1 className="text-2xl font-semibold">eDebatte Studio</h1>
        <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
          OutputPackage konnte nicht validiert werden. Bitte Dossierdaten und Quellenlage prüfen.
        </p>
      </main>
    );
  }

  const studioWorkspace = shouldUseInMemoryMongoFallback()
    ? null
    : await getDossierStudioWorkspaceRepo().getDossierStudioWorkspace(id);
  const pkg = studioWorkspace?.officialApproval
    ? withOfficialVisibility(parsedPackage.data, studioWorkspace.officialApproval)
    : parsedPackage.data;
  const reviewRequired = REVIEW_REQUIRED_STATUSES.has(pkg.reviewStatus);
  const carouselBase = studioWorkspace?.carouselDraft ?? generateSocialCarouselOutput(pkg);
  const carousel = studioWorkspace?.officialApproval
    ? withOfficialVisibility(carouselBase, studioWorkspace.officialApproval)
    : carouselBase;
  const masterPostBase = studioWorkspace?.masterPostDraft ?? generateMasterPost(pkg);
  const masterPost = studioWorkspace?.officialApproval
    ? withOfficialVisibility(masterPostBase, studioWorkspace.officialApproval)
    : masterPostBase;
  const policy = getSocialPublishingPolicy();
  const distributionPlan = buildSocialDistributionPlan(masterPost, carousel, { policy });
  const persistedDistributionDraft = studioWorkspace?.distributionDraft ?? null;
  const sourceNarrative = masterPost.sourceSituation;
  const reviewStateLabel = reviewRequired ? "Review erforderlich" : "Review abgeschlossen";
  const relatedTopicPage = await getRelatedTopicPageForDossier(id);
  const queueReadModel = await loadSocialDistributionQueueReadModel({
    dossierId: id,
    limit: 16,
  }).catch(() => null);
  const sourceRecord =
    studioWorkspace?.provenance.sourceDraftId
      ? await getPersistedCreateHandoffRecord(studioWorkspace.provenance.sourceDraftId).catch(
          () => null,
        )
      : null;
  const sourceContributionRefs =
    sourceRecord?.createdByUserId
      ? buildLedgerContributionSourceRefs(
          await loadAccountCreateContributionLedger(sourceRecord.createdByUserId, "de", 20).catch(
            () => [],
          ),
        )
      : [];
  const reverseCorrelation = sourceRecord
    ? buildPersistedHandoffReverseCorrelation({
        persistedHandoffRef: {
          handoffId: sourceRecord.id,
          createHandoffId: sourceRecord.id,
          title: `${sourceRecord.topicSeed.topicLabel} · ${sourceRecord.selectedAction}`,
          summary: sourceRecord.plannerResult.shortSummary ?? sourceRecord.sourceText,
          href: sourceRecord.resumeHref,
          sourceText: sourceRecord.sourceText,
          reviewState: sourceRecord.reviewState,
          selectedAction: sourceRecord.selectedAction,
          createdByUserId: sourceRecord.createdByUserId,
          createdAt: sourceRecord.createdAt,
          updatedAt: sourceRecord.updatedAt,
          dossierId: sourceRecord.dossierId ?? null,
          sharedIds: [sourceRecord.id],
        },
        contributionRefs: sourceContributionRefs,
        runtimeTruthLevel: "dossier_readmodel",
      })
    : null;
  const v3ReviewContext = studioWorkspace
    ? buildDossierWorkspaceV3ReviewContext({
        workspace: studioWorkspace,
        sourceRecord,
      })
    : null;
  const workspaceVoxyRefs = {
    id: pkg.dossierId,
    title: pkg.title,
    href: pkg.dossierBacklinkTarget,
  };
  const workspaceVoxyDecisionGateModel = v3ReviewContext
    ? buildVoxyRenderReviewDecisionGateFromReviewContext(v3ReviewContext, {
        audience: "workspace",
        dossierRef: workspaceVoxyRefs,
        contributionRef: workspaceVoxyRefs,
        outputRef: workspaceVoxyRefs,
      })
    : null;
  const workspaceVoxyLatestDecisionRecord = workspaceVoxyDecisionGateModel
    ? await getLatestVoxyRenderDecisionRecord(
        workspaceVoxyDecisionGateModel.decisionGateId,
      ).catch(() => null)
    : null;
  const workspaceVoxyDecisionPersistenceModel = buildVoxyRenderDecisionPersistencePanelModel({
    gate: workspaceVoxyDecisionGateModel,
    latestRecord: workspaceVoxyLatestDecisionRecord,
    storeState: workspaceVoxyDecisionGateModel
      ? getVoxyRenderDecisionPersistenceState()
      : null,
  });
  const workspaceVoxyLatestRequestDraftRecord = workspaceVoxyDecisionGateModel
    ? await getLatestVoxyRenderRequestDraftRecord(
        workspaceVoxyDecisionGateModel.decisionGateId,
      ).catch(() => null)
    : null;
  const workspaceVoxyRequestDraftModel = buildVoxyRenderRequestDraftPanelModel({
    draft: v3ReviewContext
      ? buildVoxyRenderRequestDraftFromReviewContext(v3ReviewContext, {
          audience: "workspace",
          latestDecisionRecord: workspaceVoxyLatestDecisionRecord,
          dossierRef: workspaceVoxyRefs,
          contributionRef: workspaceVoxyRefs,
          outputRef: workspaceVoxyRefs,
        })
      : null,
    latestRecord: workspaceVoxyLatestRequestDraftRecord,
    storeState: workspaceVoxyDecisionGateModel
      ? getVoxyRenderRequestDraftPersistenceState()
      : null,
  });
  const workspaceVoxyLatestQueuePreviewRecord = workspaceVoxyDecisionGateModel
    ? await getLatestVoxyRenderQueuePreviewRecord(
        workspaceVoxyDecisionGateModel.decisionGateId,
      ).catch(() => null)
    : null;
  const workspaceVoxyQueueContractModel = buildVoxyRenderQueuePanelModel({
    preview: v3ReviewContext
      ? buildVoxyRenderQueuePreviewFromReviewContext(v3ReviewContext, {
          audience: "workspace",
          latestDecisionRecord: workspaceVoxyLatestDecisionRecord,
          latestRequestDraftRecord: workspaceVoxyLatestRequestDraftRecord,
          dossierRef: workspaceVoxyRefs,
          contributionRef: workspaceVoxyRefs,
          outputRef: workspaceVoxyRefs,
        })
      : null,
    latestRecord: workspaceVoxyLatestQueuePreviewRecord,
    storeState: workspaceVoxyDecisionGateModel
      ? getVoxyRenderQueuePersistenceState()
      : null,
  });
  const workspaceVoxyLatestCostCreditPolicyRecord = workspaceVoxyDecisionGateModel
    ? await getLatestVoxyRenderCostCreditPolicyRecord(
        workspaceVoxyDecisionGateModel.decisionGateId,
      ).catch(() => null)
    : null;
  const workspaceVoxyCostCreditPolicyModel = buildVoxyRenderCostCreditPolicyPanelModel({
    preview: v3ReviewContext
      ? buildVoxyRenderCostCreditPolicyPreviewFromReviewContext(v3ReviewContext, {
          audience: "workspace",
          latestDecisionRecord: workspaceVoxyLatestDecisionRecord,
          latestRequestDraftRecord: workspaceVoxyLatestRequestDraftRecord,
          latestQueuePreviewRecord: workspaceVoxyLatestQueuePreviewRecord,
          dossierRef: workspaceVoxyRefs,
          contributionRef: workspaceVoxyRefs,
          outputRef: workspaceVoxyRefs,
        })
      : null,
    latestRecord: workspaceVoxyLatestCostCreditPolicyRecord,
    storeState: workspaceVoxyDecisionGateModel
      ? getVoxyRenderCostCreditPolicyPersistenceState()
      : null,
  });
  const workspaceVoxyLatestAssetPackDraftRecord = workspaceVoxyDecisionGateModel
    ? await getLatestVoxyRenderAssetPackDraftRecord(
        workspaceVoxyDecisionGateModel.decisionGateId,
      ).catch(() => null)
    : null;
  const workspaceVoxyAssetPackDraftModel = buildVoxyRenderAssetPackDraftPanelModel({
    preview: v3ReviewContext
      ? buildVoxyRenderAssetPackDraftPreviewFromReviewContext(v3ReviewContext, {
          audience: "workspace",
          latestDecisionRecord: workspaceVoxyLatestDecisionRecord,
          latestRequestDraftRecord: workspaceVoxyLatestRequestDraftRecord,
          latestQueuePreviewRecord: workspaceVoxyLatestQueuePreviewRecord,
          latestCostPolicyPreviewRecord: workspaceVoxyLatestCostCreditPolicyRecord,
          dossierRef: workspaceVoxyRefs,
          contributionRef: workspaceVoxyRefs,
          outputRef: workspaceVoxyRefs,
        })
      : null,
    latestRecord: workspaceVoxyLatestAssetPackDraftRecord,
    storeState: workspaceVoxyDecisionGateModel
      ? getVoxyRenderAssetPackDraftPersistenceState()
      : null,
  });
  const workspaceVoxyLatestProviderSelectionDraftRecord = workspaceVoxyDecisionGateModel
    ? await getLatestVoxyRenderProviderSelectionDraftRecord(
        workspaceVoxyDecisionGateModel.decisionGateId,
      ).catch(() => null)
    : null;
  const workspaceVoxyProviderSelectionDraftModel =
    buildVoxyRenderProviderSelectionDraftPanelModel({
      preview: v3ReviewContext
        ? buildVoxyRenderProviderSelectionDraftFromReviewContext(v3ReviewContext, {
            audience: "workspace",
            latestDecisionRecord: workspaceVoxyLatestDecisionRecord,
            latestRequestDraftRecord: workspaceVoxyLatestRequestDraftRecord,
            latestQueuePreviewRecord: workspaceVoxyLatestQueuePreviewRecord,
            latestCostPolicyPreviewRecord: workspaceVoxyLatestCostCreditPolicyRecord,
            latestAssetPackDraftRecord: workspaceVoxyLatestAssetPackDraftRecord,
            dossierRef: workspaceVoxyRefs,
            contributionRef: workspaceVoxyRefs,
            outputRef: workspaceVoxyRefs,
          })
        : null,
      latestRecord: workspaceVoxyLatestProviderSelectionDraftRecord,
      storeState: workspaceVoxyDecisionGateModel
        ? getVoxyRenderProviderSelectionPersistenceState()
        : null,
    });
  const workspaceVoxyLatestRuntimeGoNogoMatrixRecord = workspaceVoxyDecisionGateModel
    ? await getLatestVoxyRenderRuntimeGoNogoMatrixRecord(
        workspaceVoxyDecisionGateModel.decisionGateId,
      ).catch(() => null)
    : null;
  const workspaceVoxyLatestRuntimeEnablementBacklogRecord = workspaceVoxyDecisionGateModel
    ? await getLatestVoxyRenderRuntimeEnablementBacklogRecord(
        workspaceVoxyDecisionGateModel.decisionGateId,
      ).catch(() => null)
    : null;
  const workspaceVoxyLatestPreviewReviewFlowRecord = workspaceVoxyDecisionGateModel
    ? await getLatestVoxyRenderPreviewReviewFlowRecord(
        workspaceVoxyDecisionGateModel.decisionGateId,
      ).catch(() => null)
    : null;
  const workspaceVoxyLatestPreviewReviewDecisionRecord = workspaceVoxyDecisionGateModel
    ? await getLatestVoxyRenderPreviewReviewDecisionRecord({
        decisionGateId: workspaceVoxyDecisionGateModel.decisionGateId,
        previewReviewFlowId: workspaceVoxyLatestPreviewReviewFlowRecord?.previewReviewFlowId ?? null,
      }).catch(() => null)
    : null;
  const workspaceVoxyLatestPreviewOutcomeHandoffRecord = workspaceVoxyLatestPreviewReviewDecisionRecord
    ? await getLatestVoxyRenderPreviewOutcomeHandoffRecord({
        previewReviewDecisionRecordId:
          workspaceVoxyLatestPreviewReviewDecisionRecord.decisionRecordId,
        previewReviewFlowId: workspaceVoxyLatestPreviewReviewFlowRecord?.previewReviewFlowId ?? null,
      }).catch(() => null)
    : null;
  const workspaceVoxyLatestPublishReadinessGuardRecord = workspaceVoxyLatestPreviewOutcomeHandoffRecord
    ? await getLatestVoxyRenderPublishReadinessGuardRecord({
        previewOutcomeHandoffId: workspaceVoxyLatestPreviewOutcomeHandoffRecord.outcomeHandoffId,
        previewReviewDecisionRecordId:
          workspaceVoxyLatestPreviewReviewDecisionRecord?.decisionRecordId ?? null,
        previewReviewFlowId: workspaceVoxyLatestPreviewReviewFlowRecord?.previewReviewFlowId ?? null,
      }).catch(() => null)
    : null;
  const workspaceVoxyRuntimeGoNogoMatrixModel =
    buildVoxyRenderRuntimeGoNogoMatrixPanelModel({
      preview: v3ReviewContext
        ? buildVoxyRenderRuntimeGoNogoMatrixFromReviewContext({
            reviewContext: v3ReviewContext,
            latestDecisionRecord: workspaceVoxyLatestDecisionRecord,
            latestRequestDraft: workspaceVoxyLatestRequestDraftRecord,
            latestQueuePreview: workspaceVoxyLatestQueuePreviewRecord,
            latestCostPolicyPreview: workspaceVoxyLatestCostCreditPolicyRecord,
            latestAssetPackDraft: workspaceVoxyLatestAssetPackDraftRecord,
            latestProviderSelectionDraft: workspaceVoxyLatestProviderSelectionDraftRecord,
          })
        : null,
      latestRecord: workspaceVoxyLatestRuntimeGoNogoMatrixRecord,
      persistenceState: workspaceVoxyDecisionGateModel
        ? getVoxyRenderRuntimeGoNogoMatrixPersistenceState()
        : null,
    });
  const workspaceVoxyRuntimeEnablementBacklogModel =
    buildVoxyRenderRuntimeEnablementBacklogPanelModel({
      preview: v3ReviewContext
        ? buildVoxyRenderRuntimeEnablementBacklogFromReviewContext({
            reviewContext: v3ReviewContext,
            latestDecisionRecord: workspaceVoxyLatestDecisionRecord,
            latestRequestDraft: workspaceVoxyLatestRequestDraftRecord,
            latestQueuePreview: workspaceVoxyLatestQueuePreviewRecord,
            latestCostPolicyPreview: workspaceVoxyLatestCostCreditPolicyRecord,
            latestAssetPackDraft: workspaceVoxyLatestAssetPackDraftRecord,
            latestProviderSelectionDraft: workspaceVoxyLatestProviderSelectionDraftRecord,
            latestMatrix: workspaceVoxyLatestRuntimeGoNogoMatrixRecord,
          })
        : null,
      latestRecord: workspaceVoxyLatestRuntimeEnablementBacklogRecord,
      persistenceState: workspaceVoxyDecisionGateModel
        ? getVoxyRenderRuntimeEnablementBacklogPersistenceState()
        : null,
    });
  const workspaceVoxyPreviewReviewFlowModel =
    buildVoxyRenderPreviewReviewFlowPanelModel({
      preview: v3ReviewContext
        ? buildVoxyRenderPreviewReviewFlowFromReviewContext({
            reviewContext: v3ReviewContext,
            surface: "workspace",
            latestDecisionRecord: workspaceVoxyLatestDecisionRecord,
            latestRequestDraft: workspaceVoxyLatestRequestDraftRecord,
            latestQueuePreview: workspaceVoxyLatestQueuePreviewRecord,
            latestCostPolicyPreview: workspaceVoxyLatestCostCreditPolicyRecord,
            latestAssetPackDraft: workspaceVoxyLatestAssetPackDraftRecord,
            latestProviderSelectionDraft: workspaceVoxyLatestProviderSelectionDraftRecord,
            latestMatrix: workspaceVoxyLatestRuntimeGoNogoMatrixRecord,
            latestBacklog: workspaceVoxyLatestRuntimeEnablementBacklogRecord,
          })
        : null,
      latestRecord: workspaceVoxyLatestPreviewReviewFlowRecord,
      persistenceState: workspaceVoxyDecisionGateModel
        ? getVoxyRenderPreviewReviewFlowPersistenceState()
        : null,
      backlogStoreState: workspaceVoxyDecisionGateModel
        ? getVoxyRenderRuntimeEnablementBacklogPersistenceState()
        : null,
    });
  const workspaceVoxyPreviewReviewDecisionPersistenceModel =
    buildVoxyRenderPreviewReviewDecisionPersistencePanelModel({
      previewFlow: workspaceVoxyPreviewReviewFlowModel?.preview ?? null,
      latestRecord: workspaceVoxyLatestPreviewReviewDecisionRecord,
      storeState: workspaceVoxyDecisionGateModel
        ? getVoxyRenderPreviewReviewDecisionPersistenceState()
        : null,
    });
  const workspaceVoxyPreviewOutcomeHandoffModel =
    buildVoxyRenderPreviewOutcomeHandoffPanelModel({
      previewFlow: workspaceVoxyPreviewReviewFlowModel?.preview ?? null,
      latestPreviewReviewDecisionRecord: workspaceVoxyLatestPreviewReviewDecisionRecord,
      latestRecord: workspaceVoxyLatestPreviewOutcomeHandoffRecord,
      latestBacklog: workspaceVoxyLatestRuntimeEnablementBacklogRecord,
      latestMatrix: workspaceVoxyLatestRuntimeGoNogoMatrixRecord,
      latestRequestDraft: workspaceVoxyLatestRequestDraftRecord,
      gate: workspaceVoxyDecisionGateModel,
      storeState: workspaceVoxyDecisionGateModel
        ? getVoxyRenderPreviewOutcomeHandoffPersistenceState()
        : null,
    });
  const workspaceVoxyPublishReadinessGuardModel =
    buildVoxyRenderPublishReadinessGuardPanelModel({
      previewFlow: workspaceVoxyPreviewReviewFlowModel?.preview ?? null,
      latestPreviewOutcomeHandoffRecord: workspaceVoxyLatestPreviewOutcomeHandoffRecord,
      latestPreviewReviewDecisionRecord: workspaceVoxyLatestPreviewReviewDecisionRecord,
      latestRecord: workspaceVoxyLatestPublishReadinessGuardRecord,
      latestBacklog: workspaceVoxyLatestRuntimeEnablementBacklogRecord,
      latestMatrix: workspaceVoxyLatestRuntimeGoNogoMatrixRecord,
      latestRequestDraft: workspaceVoxyLatestRequestDraftRecord,
      gate: workspaceVoxyDecisionGateModel,
      storeState: workspaceVoxyDecisionGateModel
        ? getVoxyRenderPublishReadinessPersistenceState()
        : null,
    });

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 text-[rgb(var(--fg))] sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight">eDebatte Studio</h1>
        <p className="mt-2 text-base text-[rgb(var(--muted))]">
          Vom Dossier zum fertigen Beitrag, Kanal-Versionen und Veröffentlichungsplan.
        </p>
        <p className="mt-3 text-sm text-[rgb(var(--muted))]">
          Für Beteiligungsbüros, Moderations- und Dialogprofis: Dossier-Inhalte in professionelle Kommunikation
          übersetzen — ohne automatische Live-Veröffentlichung.
        </p>
        <p className="mt-3 text-sm text-[rgb(var(--muted))]">
          Das Studio erzeugt Masterpost, kurze Caption, Carousel-Outline, QR-/Print-Text und Newsletter-Block
          als reviewpflichtige CI-Ausgaben. Externe Kanäle bleiben Export- und Planungsziele, keine Live-Connectoren.
        </p>
        <p className="mt-3 text-sm text-[rgb(var(--muted))]">
          Public URL, Share-Link und QR werden erst im bestehenden Review-to-Publish-Workspace nach
          bewusster Sichtbarkeit freigeschaltet. Dort kann Sichtbarkeit auch wieder zurückgenommen
          oder archiviert werden.
        </p>
        <p className="mt-3 text-xs text-[rgb(var(--muted))]">
          Datenherkunft: {runtimeState.guardrailLabel}. LocalStorage-Arbeitsstände bleiben lokal und gelten nicht
          als produktive Behördenpersistenz.
        </p>
        <p className="mt-2 text-xs text-[rgb(var(--muted))]">
          {studioWorkspace
            ? `Studio-Arbeitsstand serverseitig gespeichert (${studioWorkspace.status}), reviewpflichtig und nicht veröffentlicht.`
            : "Noch kein serverseitiger Studio-Arbeitsstand. Browser-Arbeitsstände bleiben lokal und nicht produktiv, bis explizit serverseitig gespeichert wird."}
        </p>
        {sourceRecord ? (
          <>
            <p className="mt-2 text-xs text-[rgb(var(--muted))]">
              Aus bestehendem Create-Arbeitsstand abgeleitet. Account-Linkage ist vorhanden; Review,
              Sichtbarkeit und Veröffentlichung bleiben getrennte Schritte.
            </p>
            <p className="mt-2 text-xs text-[rgb(var(--muted))]">
              Rückverknüpfung zum ursprünglichen Beitrag: {reverseCorrelation?.userVisibleLabel ?? "offen"}.
            </p>
            {reverseCorrelation?.adminReason ? (
              <p className="mt-1 text-xs text-[rgb(var(--muted))]">
                Warum das noch nicht vollständig belastbar ist: {reverseCorrelation.adminReason}
              </p>
            ) : null}
          </>
        ) : null}
        {v3ReviewContext ? (
          <div className="mt-4">
            <V3ReviewContextSummary
              context={v3ReviewContext}
              audience="workspace"
              title="V3-Review-Kontext im Studio"
              dataTestId="dossier-studio-v3-review-context"
            />
            <div className="mt-3">
              <V3RuntimeWorkflowSurface
                model={buildV3RuntimeWorkflowSurfaceFromReviewContext(v3ReviewContext)}
                dataTestId="dossier-studio-v3-workflow-surface"
              />
            </div>
            <V3DownstreamKiTransparency
              model={buildV3DownstreamKiTransparencyFromReviewContext(
                v3ReviewContext,
                "workspace",
              )}
              title="Downstream-KI-Transparenz im Studio"
              dataTestId="dossier-studio-downstream-ki-transparency"
            />
            <V3VoxyCocreationDialog
              model={buildVoxyCocreationDialogFromReviewContext(v3ReviewContext, {
                contributionRef: {
                  id: pkg.dossierId,
                  title: pkg.title,
                  href: pkg.dossierBacklinkTarget,
                },
                surface: "workspace",
                maxCards: 4,
              })}
              dataTestId="dossier-studio-voxy-cocreation"
            />
            <SourceFactcheckFeedEnrichmentPanel
              model={buildSourceFactcheckFeedEnrichmentFromReviewContext(v3ReviewContext, {
                audience: "workspace",
                contributionRef: {
                  id: pkg.dossierId,
                  title: pkg.title,
                  href: pkg.dossierBacklinkTarget,
                },
              })}
              dataTestId="dossier-studio-source-factcheck-feed-enrichment"
            />
            <DossierWorkspaceDecisionPanel
              model={buildDossierWorkspaceDecisionFromReviewContext(v3ReviewContext, {
                audience: "workspace",
                dossierRef: {
                  id: pkg.dossierId,
                  title: pkg.title,
                  href: pkg.dossierBacklinkTarget,
                },
                contributionRef: {
                  id: pkg.dossierId,
                  title: pkg.title,
                  href: pkg.dossierBacklinkTarget,
                },
              })}
              title="Dossier-Entscheidungslogik im Studio"
              dataTestId="dossier-studio-dossier-decision"
            />
            <ParticipationActivationReviewPanel
              model={buildParticipationActivationReviewFromReviewContext(v3ReviewContext, {
                audience: "workspace",
                dossierRef: {
                  id: pkg.dossierId,
                  title: pkg.title,
                  href: pkg.dossierBacklinkTarget,
                },
                contributionRef: {
                  id: pkg.dossierId,
                  title: pkg.title,
                  href: pkg.dossierBacklinkTarget,
                },
              })}
              title="Beteiligungsraum vorbereiten im Studio"
              dataTestId="dossier-studio-participation-activation-review"
            />
            <PollQuestionOptionsReviewPanel
              model={buildPollQuestionOptionsReviewFromReviewContext(v3ReviewContext, {
                audience: "workspace",
                dossierRef: {
                  id: pkg.dossierId,
                  title: pkg.title,
                  href: pkg.dossierBacklinkTarget,
                },
                contributionRef: {
                  id: pkg.dossierId,
                  title: pkg.title,
                  href: pkg.dossierBacklinkTarget,
                },
              })}
              title="Poll/Frage-Arbeitsstand im Studio"
              dataTestId="dossier-studio-poll-question-options-review"
            />
            <OutputSocialWorkbenchPanel
              model={buildOutputSocialWorkbenchFromReviewContext(v3ReviewContext, {
                audience: "workspace",
                dossierRef: {
                  id: pkg.dossierId,
                  title: pkg.title,
                  href: pkg.dossierBacklinkTarget,
                },
                contributionRef: {
                  id: pkg.dossierId,
                  title: pkg.title,
                  href: pkg.dossierBacklinkTarget,
                },
              })}
              title="Output-/Social-Arbeitsstand im Studio"
              dataTestId="dossier-studio-output-social-workbench"
            />
            <VoxyBriefingScriptCandidatePanel
              model={buildVoxyBriefingScriptCandidateFromReviewContext(v3ReviewContext, {
                audience: "workspace",
                dossierRef: {
                  id: pkg.dossierId,
                  title: pkg.title,
                  href: pkg.dossierBacklinkTarget,
                },
                contributionRef: {
                  id: pkg.dossierId,
                  title: pkg.title,
                  href: pkg.dossierBacklinkTarget,
                },
              })}
              title="Voxy-Briefing-Arbeitsstand"
              dataTestId="dossier-studio-voxy-briefing-script"
            />
            <VoxyRenderReviewDecisionGatePanel
              model={workspaceVoxyDecisionGateModel}
              persistenceModel={workspaceVoxyDecisionPersistenceModel}
              title="Render-Entscheidung im Studio"
              dataTestId="dossier-studio-voxy-render-decision"
            />
            <VoxyRenderRequestDraftPanel
              model={workspaceVoxyRequestDraftModel}
              dataTestId="dossier-studio-voxy-render-request-draft"
            />
            <VoxyRenderQueueContractPanel
              model={workspaceVoxyQueueContractModel}
              dataTestId="dossier-studio-voxy-render-queue-contract"
            />
            <VoxyRenderCostCreditPolicyPanel
              model={workspaceVoxyCostCreditPolicyModel}
              dataTestId="dossier-studio-voxy-render-cost-credit-policy"
            />
            <VoxyRenderAssetPackDraftPanel
              model={workspaceVoxyAssetPackDraftModel}
              dataTestId="dossier-studio-voxy-render-asset-pack-draft"
            />
            <VoxyRenderProviderSelectionDraftPanel
              model={workspaceVoxyProviderSelectionDraftModel}
              dataTestId="dossier-studio-voxy-render-provider-selection-draft"
            />
            <VoxyRenderRuntimeGoNogoMatrixPanel
              model={workspaceVoxyRuntimeGoNogoMatrixModel}
              dataTestId="dossier-studio-voxy-render-runtime-go-nogo-matrix"
            />
            <VoxyRenderRuntimeEnablementBacklogPanel
              model={workspaceVoxyRuntimeEnablementBacklogModel}
              dataTestId="dossier-studio-voxy-render-runtime-enablement-backlog"
            />
            <VoxyRenderPreviewReviewFlowPanel
              model={workspaceVoxyPreviewReviewFlowModel}
              dataTestId="dossier-studio-voxy-render-preview-review-flow"
            />
            <VoxyRenderPreviewReviewDecisionPersistencePanel
              model={workspaceVoxyPreviewReviewDecisionPersistenceModel}
              dataTestId="dossier-studio-voxy-render-preview-review-decision-persistence"
            />
            <VoxyRenderPreviewOutcomeHandoffPanel
              model={workspaceVoxyPreviewOutcomeHandoffModel}
              dataTestId="dossier-studio-voxy-render-preview-outcome-handoff"
            />
            <VoxyRenderPublishReadinessGuardPanel
              model={workspaceVoxyPublishReadinessGuardModel}
              dataTestId="dossier-studio-voxy-render-publish-readiness-guard"
            />
            <VoxyRenderProviderHandoffPanel
              model={buildVoxyRenderProviderHandoffFromReviewContext(v3ReviewContext, {
                audience: "workspace",
                dossierRef: {
                  id: pkg.dossierId,
                  title: pkg.title,
                  href: pkg.dossierBacklinkTarget,
                },
                contributionRef: {
                  id: pkg.dossierId,
                  title: pkg.title,
                  href: pkg.dossierBacklinkTarget,
                },
                outputRef: {
                  id: pkg.dossierId,
                  title: pkg.title,
                  href: pkg.dossierBacklinkTarget,
                },
              })}
              title="Voxy-Render/Provider-Handoff im Studio"
              dataTestId="dossier-studio-voxy-render-provider-handoff"
            />
            <VoxyRenderPreflightReadinessPanel
              model={buildVoxyRenderPreflightReadinessFromReviewContext(v3ReviewContext, {
                audience: "workspace",
                dossierRef: {
                  id: pkg.dossierId,
                  title: pkg.title,
                  href: pkg.dossierBacklinkTarget,
                },
                contributionRef: {
                  id: pkg.dossierId,
                  title: pkg.title,
                  href: pkg.dossierBacklinkTarget,
                },
                outputRef: {
                  id: pkg.dossierId,
                  title: pkg.title,
                  href: pkg.dossierBacklinkTarget,
                },
              })}
              title="Voxy-Render-Preflight im Studio"
              dataTestId="dossier-studio-voxy-render-preflight"
            />
            <VoxyRenderAssetProviderRegistryPanel
              model={buildVoxyRenderAssetProviderRegistryFromReviewContext(v3ReviewContext, {
                audience: "workspace",
                dossierRef: {
                  id: pkg.dossierId,
                  title: pkg.title,
                  href: pkg.dossierBacklinkTarget,
                },
                contributionRef: {
                  id: pkg.dossierId,
                  title: pkg.title,
                  href: pkg.dossierBacklinkTarget,
                },
                outputRef: {
                  id: pkg.dossierId,
                  title: pkg.title,
                  href: pkg.dossierBacklinkTarget,
                },
              })}
              title="Voxy Asset- & Provider-Registry im Studio"
              dataTestId="dossier-studio-voxy-render-registry"
            />
            <VoxyRenderAdapterNoopPanel
              model={buildVoxyRenderAdapterNoopFromReviewContext(v3ReviewContext, {
                audience: "workspace",
                dossierRef: {
                  id: pkg.dossierId,
                  title: pkg.title,
                  href: pkg.dossierBacklinkTarget,
                },
                contributionRef: {
                  id: pkg.dossierId,
                  title: pkg.title,
                  href: pkg.dossierBacklinkTarget,
                },
                outputRef: {
                  id: pkg.dossierId,
                  title: pkg.title,
                  href: pkg.dossierBacklinkTarget,
                },
              })}
              title="Render-Adapter im Studio"
              dataTestId="dossier-studio-voxy-render-adapter"
            />
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1">Dossier bleibt Quelle</span>
          <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1">{reviewStateLabel}</span>
          <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1">
            Sichtbarkeit: {publicationVisibilityLabel(pkg.visibilityState)}
          </span>
          <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1">Noch nicht live veröffentlicht</span>
          <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1">
            Externe Kanäle nur Export/Kopieren, solange nicht verbunden
          </span>
          {runtimeState.mode === "demo" ? (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1">
              Demo-Modus · keine produktiven Behördendaten
            </span>
          ) : null}
          {studioWorkspace ? (
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-1">
              Server-Workspace · {studioWorkspace.status} ·{" "}
              {publicationVisibilityLabel(studioWorkspace.visibilityState)}
            </span>
          ) : null}
          {studioWorkspace?.officialApproval ? (
            <span className="rounded-full border border-sky-400/40 bg-sky-500/10 px-2 py-1">
              Menschlich freigegeben · {studioWorkspace.officialApproval.authority === "admin_fallback"
                ? "Betreiber-Fallback"
                : "Publikationsfreigabe"}
            </span>
          ) : null}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">
          Studio-Kontext
        </p>
        <h2 className="mt-2 text-2xl font-semibold">Dossier-Kontext</h2>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Thema: {pkg.title}
        </p>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Region/Vergleichsraum: {carousel.regionalContext}
        </p>
        {relatedTopicPage ? (
          <p className="mt-1 text-sm text-[rgb(var(--muted))]">
            Verbundene Themenseite:{" "}
            <Link
              href={
                relatedTopicPage.visibilityState === "internal_review"
                  ? relatedTopicPage.previewHref
                  : relatedTopicPage.publicHref
              }
              className="font-semibold text-[rgb(var(--fg))]"
            >
              {relatedTopicPage.title}
            </Link>
            {" · "}
            {relatedTopicPage.visibilityLabel}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[rgb(var(--muted))]">
            Status: {reviewStatusLabel(pkg.reviewStatus)}
          </span>
          <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[rgb(var(--muted))]">
            Sichtbarkeit: {publicationVisibilityLabel(pkg.visibilityState)}
          </span>
          {reviewRequired ? (
            <span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1 font-semibold text-amber-300">
              Review erforderlich
            </span>
          ) : null}
          <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[rgb(var(--muted))]">
            Vollständigkeit: {completenessLabel(pkg.completenessStatus)}
          </span>
        </div>

        <p className="mt-3 text-sm text-[rgb(var(--muted))]">{pkg.shortSummary}</p>
        <div className="mt-4">
          <Link
            href={pkg.dossierBacklinkTarget}
            className="inline-flex rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-1.5 text-sm font-semibold"
          >
            Zurück zum Dossier
          </Link>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <h3 className="text-lg font-semibold">Fertiger Post-Entwurf</h3>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Finaler Master-Post vor Veröffentlichungsvorbereitung.
        </p>
        <p className="mt-1 text-xs text-[rgb(var(--muted))]">
          Sichtbarkeit: {publicationVisibilityLabel(masterPost.visibilityState)}. Sichtbar heißt hier
          nicht automatisch geprüft oder amtlich.
        </p>
        {studioWorkspace?.officialApproval ? (
          <p className="mt-2 text-xs text-sky-700">
            Öffentliche amtliche Freigabe wurde explizit durch einen berechtigten Menschen erteilt.
          </p>
        ) : null}
        <article className="mt-4 space-y-4 rounded-2xl border border-[rgb(var(--border))] bg-[linear-gradient(145deg,rgba(8,47,73,0.9),rgba(3,7,18,0.92))] p-4 text-slate-100">
          <header>
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Titel</p>
            <h4 className="mt-1 text-2xl font-semibold text-white">{masterPost.title}</h4>
            <p className="mt-2 text-sm text-cyan-100">{masterPost.hook}</p>
          </header>

          <section>
            <p className="text-xs uppercase tracking-wide text-cyan-200">Regionaler Kontext</p>
            <p className="mt-1 text-sm text-slate-100">{masterPost.regionalContext}</p>
            <p className="mt-1 text-sm text-slate-200">{masterPost.body}</p>
          </section>

          <section>
            <p className="text-xs uppercase tracking-wide text-cyan-200">Gesamtbild bisher</p>
            <p className="mt-1 text-sm text-slate-100">{masterPost.overallPicture}</p>
          </section>

          <section>
            <p className="text-xs uppercase tracking-wide text-cyan-200">Quellenlage</p>
            <p className="mt-1 text-sm text-slate-100">{sourceNarrative}</p>
            <p className="mt-1 text-xs text-slate-300">
              Quellen bisher: {masterPost.sourceState.sourceCount} · Status:{" "}
              {sourceStateLabel(masterPost.sourceState.status)}
            </p>
          </section>

          <section>
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Offene Fragen</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
              {masterPost.openQuestions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </section>

          <section>
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Eventualitäten / Optionen</p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
              {masterPost.options.map((option) => (
                <li key={option}>{option}</li>
              ))}
            </ul>
          </section>

          <section>
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">Beteiligungsfrage</p>
            <p className="mt-1 text-sm text-white">{masterPost.participationQuestion}</p>
          </section>

          <section className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-3">
            <p className="text-xs uppercase tracking-wide text-[rgb(var(--muted))]">CTA</p>
            <p className="mt-1 text-sm font-semibold text-emerald-100">{masterPost.cta}</p>
            <p className="mt-2 text-xs text-emerald-100">
              Dossier-Link: {masterPost.backlinkTarget}
            </p>
            <p className="mt-1 text-xs text-emerald-100">
              QR-Ziel: {masterPost.qrTarget}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {masterPost.suggestedHashtags.map((entry) => (
                <span
                  key={entry.tag}
                  className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-700 dark:text-cyan-200"
                >
                  {entry.tag}
                </span>
              ))}
            </div>
          </section>
          {masterPost.reviewGuardrails.length > 0 ? (
            <section className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-3">
              <p className="text-xs uppercase tracking-wide text-amber-100">Review-Hinweise</p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-amber-50">
                {masterPost.reviewGuardrails.map((entry) => (
                  <li key={entry.id}>{entry.message}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </article>
      </section>

      <section className="mt-5">
        <MasterPostActions
          dossierId={id}
          initialText={
            studioWorkspace?.masterPostDraft
              ? studioWorkspace.masterPostDraft.body
              : `${masterPost.title}\n\n${masterPost.hook}\n\n${masterPost.body}\n\n${masterPost.participationQuestion}\n\nCTA: ${masterPost.cta}\nLink: ${masterPost.backlinkTarget}`
          }
          suggestedSlots={masterPost.suggestedPostingWindows.map((entry) => entry.window)}
          masterPostTemplate={masterPost}
          workspaceApiPath={`/api/dossier/${encodeURIComponent(id)}/studio/workspace`}
        />
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[1.15fr_1fr] lg:items-start">
        <SocialDistributionPanel
          plan={distributionPlan}
          dossierId={id}
          reviewRequired={reviewRequired}
          dossierBacklink={pkg.dossierBacklinkTarget}
          masterPost={masterPost}
          carouselDraft={carousel}
          workspaceApiPath={`/api/dossier/${encodeURIComponent(id)}/studio/workspace`}
          initialDistributionDraft={persistedDistributionDraft}
          queueReadModel={queueReadModel}
        />
        <SocialCarouselPreview carousel={carousel} reviewRequired={reviewRequired} />
      </section>

      <details className="mt-6 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5">
        <summary className="cursor-pointer list-none text-base font-semibold">Dossier-Qualität & Hinweise</summary>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
            <h4 className="text-sm font-semibold">Quellenlage</h4>
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">
              Quelle-Status: <span className="font-semibold text-[rgb(var(--fg))]">{sourceStateLabel(pkg.sourceState.status)}</span> · {" "}
              {pkg.sourceState.sourceCount} verknüpfte Quellen
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {pkg.sourceTraces.map((trace) => (
                <li key={trace.sourceId} className="rounded-xl border border-[rgb(var(--border))] px-3 py-2">
                  <p className="font-medium">{trace.title}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">{trace.url}</p>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
            <h4 className="text-sm font-semibold">Offene Fragen & Eingabehinweise</h4>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[rgb(var(--fg))]">
              {pkg.openQuestions.length > 0 ? (
                pkg.openQuestions.map((question) => <li key={question}>{question}</li>)
              ) : (
                <li>Keine offenen Fragen vorhanden.</li>
              )}
            </ul>
            <div className="mt-3 rounded-xl border border-[rgb(var(--border))] p-3 text-sm">
              <p className="font-semibold">Eingabehinweise</p>
              {pkg.needsInputMarkers.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-[rgb(var(--muted))]">
                  {pkg.needsInputMarkers.map((marker) => (
                    <li key={marker}>{marker}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-[rgb(var(--muted))]">Keine offenen Eingabewarnungen.</p>
              )}
            </div>
          </article>
        </div>

      </details>
    </main>
  );
}
