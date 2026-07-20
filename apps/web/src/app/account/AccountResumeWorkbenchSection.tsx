"use client";

import * as React from "react";
import Link from "next/link";
import { FiCompass } from "react-icons/fi";
import type { IconType } from "react-icons";
import type { CreateContributionLedgerEntry } from "@features/create/createContributionLedger";
import {
  createSavedWorkstateStatusLabel,
  createSavedWorkstateTypeLabel,
  createSavedWorkstateVisibilityLabel,
  type CreateSavedWorkstateRecord,
} from "@/features/create/createSavedWorkstateContract";
import type { AccountUserScopedRuntimeLinkage } from "@features/account/userScopedRuntimeLinkageTypes";
import type {
  AccountContributionHandoffCorrelation,
} from "@features/account/contributionHandoffCorrelationTypes";
import type { ManualAnlassraumServerDraftSnapshot } from "@/features/surfaces/runden/manualAnlassraumSetup";
import type { StartDraftContext } from "@/features/start/startDraftContext";
import {
  buildAccountResumeWorkbenchItems,
  buildAccountUnifiedWorkItems,
  clearAccountLocalStartDraftArtifacts,
  resolveAccountResumeHrefFromStartDraft,
  type AccountUnifiedWorkItem,
  type ResumeWorkbenchItem,
} from "@features/account/buildAccountUnifiedWorkItems";
import V3AccountResumeWorkflow from "@/features/create/V3AccountResumeWorkflow";
import V3DownstreamKiTransparency, {
  buildV3DownstreamKiTransparencyFromReviewContext,
} from "@/features/create/V3DownstreamKiTransparency";
import OutputSocialWorkbenchPanel from "@/features/create/OutputSocialWorkbenchPanel";
import ParticipationActivationReviewPanel from "@/features/create/ParticipationActivationReviewPanel";
import PollQuestionOptionsReviewPanel from "@/features/create/PollQuestionOptionsReviewPanel";
import V3ReviewContextSummary from "@/features/create/V3ReviewContextSummary";
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
  buildVoxyRenderAssetPackDraftPreviewFromVoxyDialog,
} from "@/features/create/voxyRenderAssetPackDraftContract";
import {
  buildVoxyRenderCostCreditPolicyPanelModel,
  buildVoxyRenderCostCreditPolicyPreviewFromReviewContext,
  buildVoxyRenderCostCreditPolicyPreviewFromVoxyDialog,
} from "@/features/create/voxyRenderCostCreditPolicyContract";
import {
  buildVoxyRenderPreviewOutcomeHandoffCommandFromReadmodels,
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
  buildVoxyRenderPreviewReviewFlowFromVoxyDialog,
  buildVoxyRenderPreviewReviewFlowPanelModel,
} from "@/features/create/voxyRenderPreviewReviewFlowContract";
import {
  buildVoxyRenderRuntimeEnablementBacklogFromReviewContext,
  buildVoxyRenderRuntimeEnablementBacklogFromVoxyDialog,
  buildVoxyRenderRuntimeEnablementBacklogPanelModel,
} from "@/features/create/voxyRenderRuntimeEnablementBacklogContract";
import {
  buildVoxyRenderRuntimeGoNogoMatrixFromReviewContext,
  buildVoxyRenderRuntimeGoNogoMatrixFromVoxyDialog,
  buildVoxyRenderRuntimeGoNogoMatrixPanelModel,
} from "@/features/create/voxyRenderRuntimeGoNogoMatrixContract";
import {
  buildVoxyRenderProviderSelectionDraftFromReviewContext,
  buildVoxyRenderProviderSelectionDraftFromVoxyDialog,
  buildVoxyRenderProviderSelectionDraftPanelModel,
} from "@/features/create/voxyRenderProviderSelectionDraftContract";
import {
  buildVoxyRenderHybridRuntimeFoundationFromReviewContext,
  buildVoxyRenderHybridRuntimeFoundationFromVoxyDialog,
  buildVoxyRenderHybridRuntimeFoundationPanelModel,
} from "@/features/create/voxyRenderHybridRuntimeFoundationContract";
import {
  buildVoxyRenderQueuePanelModel,
  buildVoxyRenderQueuePreviewFromReviewContext,
  buildVoxyRenderQueuePreviewFromVoxyDialog,
} from "@/features/create/voxyRenderQueueContract";
import {
  buildVoxyRenderRequestDraftFromReviewContext,
  buildVoxyRenderRequestDraftFromVoxyDialog,
  buildVoxyRenderRequestDraftPanelModel,
} from "@/features/create/voxyRenderRequestDraftContract";
import DossierWorkspaceDecisionPanel from "@/features/create/DossierWorkspaceDecisionPanel";
import {
  buildDossierWorkspaceDecisionFromReviewContext,
  buildDossierWorkspaceDecisionFromVoxyDialog,
} from "@/features/create/dossierWorkspaceDecisionContract";
import {
  buildOutputSocialWorkbenchFromReviewContext,
  buildOutputSocialWorkbenchFromVoxyDialog,
} from "@/features/create/outputSocialWorkbenchContract";
import {
  buildParticipationActivationReviewFromReviewContext,
  buildParticipationActivationReviewFromVoxyDialog,
} from "@/features/create/participationActivationReviewContract";
import {
  buildPollQuestionOptionsReviewFromReviewContext,
  buildPollQuestionOptionsReviewFromVoxyDialog,
} from "@/features/create/pollQuestionOptionsReviewContract";
import { buildVoxyCocreationDialogFromReviewContext } from "@/features/create/voxyCocreationDialogContract";
import {
  buildSourceFactcheckFeedEnrichmentFromReviewContext,
  buildSourceFactcheckFeedEnrichmentFromVoxyDialog,
} from "@/features/create/sourceFactcheckFeedEnrichmentContract";
import {
  buildVoxyBriefingScriptCandidateFromReviewContext,
  buildVoxyBriefingScriptCandidateFromVoxyDialog,
} from "@/features/create/voxyBriefingScriptCandidateContract";
import {
  buildVoxyRenderAdapterNoopFromReviewContext,
  buildVoxyRenderAdapterNoopFromVoxyDialog,
} from "@/features/create/voxyRenderAdapterNoopContract";
import {
  buildVoxyRenderAssetProviderRegistryFromReviewContext,
  buildVoxyRenderAssetProviderRegistryFromVoxyDialog,
} from "@/features/create/voxyRenderAssetProviderRegistryContract";
import {
  buildVoxyRenderPreflightReadinessFromReviewContext,
  buildVoxyRenderPreflightReadinessFromVoxyDialog,
} from "@/features/create/voxyRenderPreflightReadinessContract";
import {
  buildVoxyRenderProviderHandoffFromReviewContext,
  buildVoxyRenderProviderHandoffFromVoxyDialog,
} from "@/features/create/voxyRenderProviderHandoffContract";
import {
  buildVoxyRenderReviewDecisionGateFromReviewContext,
  buildVoxyRenderReviewDecisionGateFromVoxyDialog,
} from "@/features/create/voxyRenderReviewDecisionGateContract";
import {
  accountCorrelationBasisLabel,
  accountCorrelationStrengthLabel,
  accountRuntimeLinkageStatusLabel,
  accountRuntimeTruthLevelLabel,
} from "@/features/review/e2eFlowUserFacingLabels";
import { readStartDraftContext } from "@/features/start/startDraftContext";

type AccountResumeWorkbenchSectionProps = {
  entries: CreateContributionLedgerEntry[];
  savedWorkstates?: CreateSavedWorkstateRecord[];
  initialStartDraft?: StartDraftContext | null;
  manualAnlassraumServerDrafts?: ManualAnlassraumServerDraftSnapshot[];
  canDeepResearch?: boolean;
  runtimeLinkages?: AccountUserScopedRuntimeLinkage[];
  canViewInternalSavedWorkstates?: boolean;
};

function formatWorkbenchDate(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return "ohne Datum";
  return new Date(parsed).toISOString().slice(0, 10);
}

function buildSavedWorkstateGroups(
  records: CreateSavedWorkstateRecord[],
  canViewInternalSavedWorkstates: boolean,
) {
  const internalRecords = records.filter((record) =>
    ["admin_internal", "organization_internal"].includes(record.visibility),
  );
  const publicRecords = records.filter(
    (record) => !["admin_internal", "organization_internal"].includes(record.visibility),
  );

  const groups = [
    {
      title: "Gespeicherte Beiträge",
      items: publicRecords.filter((record) => record.type === "saved_contribution"),
    },
    {
      title: "Vorgemerkte Themen",
      items: publicRecords.filter((record) => record.type === "topic_candidate"),
    },
    {
      title: "Eigene Fragen",
      items: publicRecords.filter((record) => record.type === "question_candidate"),
    },
    {
      title: "Geparkte Themen",
      items: publicRecords.filter((record) => record.type === "parked_topic"),
    },
    {
      title: "Quellenlisten",
      items: publicRecords.filter((record) => record.type === "source_list"),
    },
    {
      title: "Noch nicht veröffentlichte Entwürfe",
      items: publicRecords.filter((record) =>
        ["community_candidate", "deferred_work"].includes(record.type),
      ),
    },
  ].filter((group) => group.items.length > 0);

  if (canViewInternalSavedWorkstates && internalRecords.length > 0) {
    groups.push({
      title: "Interne Arbeitsstände",
      items: internalRecords,
    });
  }

  return groups;
}

function SavedWorkstateGroups(props: {
  records: CreateSavedWorkstateRecord[];
  canViewInternalSavedWorkstates: boolean;
}) {
  const groups = buildSavedWorkstateGroups(
    props.records,
    props.canViewInternalSavedWorkstates,
  );

  if (groups.length === 0) return null;

  return (
    <div className="mt-4 space-y-4">
      {groups.map((group) => (
        <section key={group.title} className="space-y-2">
          <div>
            <p className="text-sm font-semibold text-[rgb(var(--fg))]">{group.title}</p>
            <p className="text-xs text-[rgb(var(--muted))]">
              Persistierte Arbeitsstände aus deinem Create-Flow.
            </p>
          </div>
          <div className="grid gap-3 xl:grid-cols-2">
            {group.items.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-slate-200/80 bg-[rgb(var(--bg))] px-4 py-4 text-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-slate-300/70 px-2.5 py-1 text-xs font-semibold text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
                    {createSavedWorkstateTypeLabel(item.type)}
                  </span>
                  <span className="rounded-full border border-slate-300/70 px-2.5 py-1 text-xs font-semibold text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
                    {createSavedWorkstateStatusLabel(item.status)}
                  </span>
                  <span className="rounded-full border border-slate-300/70 px-2.5 py-1 text-xs font-semibold text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
                    {createSavedWorkstateVisibilityLabel(item.visibility)}
                  </span>
                </div>
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-semibold text-[rgb(var(--fg))]">{item.title}</p>
                  <p className="text-sm leading-relaxed text-[rgb(var(--muted))]">{item.content}</p>
                  <p className="text-xs text-[rgb(var(--muted))]">
                    Quelle: {item.sourceUrl ?? item.metadata.sourceLabel ?? "aktueller Beitrag"}
                  </p>
                  <p className="text-xs text-[rgb(var(--muted))]">
                    Zuletzt bearbeitet: {formatWorkbenchDate(item.updatedAt)}
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={item.resumeHref}
                    className="btn-primary inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold"
                  >
                    Weiterarbeiten
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function sectionHeading(props: { id: string; title: string; description: string; icon: IconType }) {
  const Icon = props.icon;
  return (
    <div className="flex flex-col gap-1">
      <h2
        id={props.id}
        className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight text-[rgb(var(--fg))]"
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-sky-500/10 text-sky-400 ring-1 ring-sky-300/30">
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span>{props.title}</span>
      </h2>
      <p className="text-xs text-[rgb(var(--muted))]">{props.description}</p>
    </div>
  );
}

function SsotPolicyPanel(props: {
  label: string;
  summary: string;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-slate-200/80 px-3 py-3 text-xs dark:border-[rgb(var(--border))]">
      <p className="font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
        Aktuelle SSOT-Lesewahrheit
      </p>
      <p className="mt-2 font-medium text-[rgb(var(--fg))]">{props.label}</p>
      <p className="mt-1 leading-5 text-[rgb(var(--muted))]">{props.summary}</p>
    </div>
  );
}

function ResumeWorkbenchCard(props: {
  item: ResumeWorkbenchItem;
  correlation: AccountContributionHandoffCorrelation | null;
  ssotLabel: string;
  ssotSummary: string;
  onDiscard?: () => void;
}) {
  const dossierWorkspaceDecisionModel = buildDossierWorkspaceDecisionFromVoxyDialog(
    props.item.voxyCocreationDialog,
    {
      contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
      surface: "account",
      nextStep: props.item.nextStep,
    },
  );
  const participationActivationReviewModel =
    buildParticipationActivationReviewFromVoxyDialog(
      props.item.voxyCocreationDialog,
      {
        contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
        nextStep: props.item.nextStep,
      },
    );
  const pollQuestionOptionsReviewModel =
    buildPollQuestionOptionsReviewFromVoxyDialog(
      props.item.voxyCocreationDialog,
      {
        contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
        nextStep: props.item.nextStep,
      },
    );
  const outputSocialWorkbenchModel =
    buildOutputSocialWorkbenchFromVoxyDialog(
      props.item.voxyCocreationDialog,
      {
        contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
        nextStep: props.item.nextStep,
      },
    );
  const voxyBriefingScriptCandidateModel =
    buildVoxyBriefingScriptCandidateFromVoxyDialog(
      props.item.voxyCocreationDialog,
      {
        contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
        nextStep: props.item.nextStep,
      },
    );
  const voxyRenderProviderHandoffModel =
    buildVoxyRenderProviderHandoffFromVoxyDialog(
      props.item.voxyCocreationDialog,
      {
        contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
        nextStep: props.item.nextStep,
      },
    );
  const voxyRenderPreflightReadinessModel =
    buildVoxyRenderPreflightReadinessFromVoxyDialog(
      props.item.voxyCocreationDialog,
      {
        contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
        nextStep: props.item.nextStep,
      },
    );
  const voxyRenderAssetProviderRegistryModel =
    buildVoxyRenderAssetProviderRegistryFromVoxyDialog(
      props.item.voxyCocreationDialog,
      {
        contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
        nextStep: props.item.nextStep,
      },
    );
  const voxyRenderAdapterNoopModel =
    buildVoxyRenderAdapterNoopFromVoxyDialog(
      props.item.voxyCocreationDialog,
      {
        contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
        nextStep: props.item.nextStep,
      },
    );
  const voxyRenderReviewDecisionGateModel =
    buildVoxyRenderReviewDecisionGateFromVoxyDialog(
      props.item.voxyCocreationDialog,
      {
        contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
        nextStep: props.item.nextStep,
      },
    );
  const voxyRenderDecisionPersistenceModel =
    buildVoxyRenderDecisionPersistencePanelModel({
      gate: voxyRenderReviewDecisionGateModel,
    });
  const voxyRenderRequestDraftModel = buildVoxyRenderRequestDraftPanelModel({
    draft: buildVoxyRenderRequestDraftFromVoxyDialog(props.item.voxyCocreationDialog, {
      contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
      nextStep: props.item.nextStep,
    }),
  });
  const voxyRenderQueueContractModel = buildVoxyRenderQueuePanelModel({
    preview: buildVoxyRenderQueuePreviewFromVoxyDialog(props.item.voxyCocreationDialog, {
      contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
      nextStep: props.item.nextStep,
    }),
  });
  const voxyRenderCostCreditPolicyModel = buildVoxyRenderCostCreditPolicyPanelModel({
    preview: buildVoxyRenderCostCreditPolicyPreviewFromVoxyDialog(
      props.item.voxyCocreationDialog,
      {
        contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
        nextStep: props.item.nextStep,
      },
    ),
  });
  const voxyRenderAssetPackDraftModel = buildVoxyRenderAssetPackDraftPanelModel({
    preview: buildVoxyRenderAssetPackDraftPreviewFromVoxyDialog(
      props.item.voxyCocreationDialog,
      {
        contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
        nextStep: props.item.nextStep,
      },
    ),
  });
  const voxyRenderProviderSelectionDraftModel = buildVoxyRenderProviderSelectionDraftPanelModel({
    preview: buildVoxyRenderProviderSelectionDraftFromVoxyDialog(
      props.item.voxyCocreationDialog,
      {
        contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
        nextStep: props.item.nextStep,
      },
    ),
  });
  const voxyRenderHybridRuntimeFoundationModel =
    buildVoxyRenderHybridRuntimeFoundationPanelModel({
      preview: buildVoxyRenderHybridRuntimeFoundationFromVoxyDialog(
        props.item.voxyCocreationDialog,
        {
          contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
          nextStep: props.item.nextStep,
        },
      ),
    });
  const voxyRenderRuntimeGoNogoMatrixModel = buildVoxyRenderRuntimeGoNogoMatrixPanelModel({
    preview: buildVoxyRenderRuntimeGoNogoMatrixFromVoxyDialog(props.item.voxyCocreationDialog, {
      contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
      nextStep: props.item.nextStep,
    }),
  });
  const voxyRenderRuntimeEnablementBacklogModel =
    buildVoxyRenderRuntimeEnablementBacklogPanelModel({
      preview: buildVoxyRenderRuntimeEnablementBacklogFromVoxyDialog(
        props.item.voxyCocreationDialog,
        {
          contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
          nextStep: props.item.nextStep,
        },
      ),
    });
  const voxyRenderPreviewReviewFlowModel = buildVoxyRenderPreviewReviewFlowPanelModel({
    preview: buildVoxyRenderPreviewReviewFlowFromVoxyDialog(props.item.voxyCocreationDialog, {
      surface: "account",
      contributionRef: props.item.voxyCocreationDialog?.contributionRef ?? null,
      nextStep: props.item.nextStep,
    }),
  });
  const voxyRenderPreviewReviewDecisionPersistenceModel =
    buildVoxyRenderPreviewReviewDecisionPersistencePanelModel({
      previewFlow: voxyRenderPreviewReviewFlowModel?.preview ?? null,
    });
  const voxyRenderPreviewOutcomeHandoffPreview =
    buildVoxyRenderPreviewOutcomeHandoffCommandFromReadmodels({
      previewFlow: voxyRenderPreviewReviewFlowModel?.preview ?? null,
    });
  const voxyRenderPreviewOutcomeHandoffModel = buildVoxyRenderPreviewOutcomeHandoffPanelModel({
    previewFlow: voxyRenderPreviewReviewFlowModel?.preview ?? null,
  });
  const voxyRenderPublishReadinessGuardModel = buildVoxyRenderPublishReadinessGuardPanelModel({
    previewFlow: voxyRenderPreviewReviewFlowModel?.preview ?? null,
  });
  const voxyRenderSocialDistributionHandoffModel =
    buildVoxyRenderSocialDistributionHandoffPanelModel({
      previewFlow: voxyRenderPreviewReviewFlowModel?.preview ?? null,
    });
  const voxyRenderApprovalSemanticsModel = buildVoxyRenderApprovalSemanticsPanelModel({
    previewFlow: voxyRenderPreviewReviewFlowModel?.preview ?? null,
    latestPublishReadinessGuardRecord: voxyRenderPublishReadinessGuardModel?.preview ?? null,
    latestSocialDistributionHandoffRecord:
      voxyRenderSocialDistributionHandoffModel?.preview ?? null,
  });
  const voxyRenderMediaStorageTruthModel = buildVoxyRenderMediaStorageTruthPanelModel({
    previewFlow: voxyRenderPreviewReviewFlowModel?.preview ?? null,
    latestApprovalSemanticsRecord: voxyRenderApprovalSemanticsModel?.preview ?? null,
    latestBacklog: voxyRenderRuntimeEnablementBacklogModel?.preview ?? null,
    latestMatrix: voxyRenderRuntimeGoNogoMatrixModel?.preview ?? null,
    latestRequestDraft: voxyRenderRequestDraftModel?.draft ?? null,
    gate: voxyRenderReviewDecisionGateModel ?? null,
  });
  const voxyRenderUploadTargetPolicyModel = buildVoxyRenderUploadTargetPolicyPanelModel({
    previewFlow: voxyRenderPreviewReviewFlowModel?.preview ?? null,
    latestMediaStorageTruthRecord: voxyRenderMediaStorageTruthModel?.preview ?? null,
    latestApprovalSemanticsRecord: voxyRenderApprovalSemanticsModel?.preview ?? null,
    latestPublishReadinessGuardRecord: voxyRenderPublishReadinessGuardModel?.preview ?? null,
    latestSocialDistributionHandoffRecord:
      voxyRenderSocialDistributionHandoffModel?.preview ?? null,
    latestBacklog: voxyRenderRuntimeEnablementBacklogModel?.preview ?? null,
    latestMatrix: voxyRenderRuntimeGoNogoMatrixModel?.preview ?? null,
    latestRequestDraft: voxyRenderRequestDraftModel?.draft ?? null,
    gate: voxyRenderReviewDecisionGateModel ?? null,
  });
  const voxyRenderSchedulingPolicyModel = buildVoxyRenderSchedulingPolicyPanelModel({
    previewFlow: voxyRenderPreviewReviewFlowModel?.preview ?? null,
    latestUploadTargetPolicyRecord: voxyRenderUploadTargetPolicyModel?.preview ?? null,
    latestMediaStorageTruthRecord: voxyRenderMediaStorageTruthModel?.preview ?? null,
    latestApprovalSemanticsRecord: voxyRenderApprovalSemanticsModel?.preview ?? null,
    latestPublishReadinessGuardRecord: voxyRenderPublishReadinessGuardModel?.preview ?? null,
    latestSocialDistributionHandoffRecord:
      voxyRenderSocialDistributionHandoffModel?.preview ?? null,
    latestBacklog: voxyRenderRuntimeEnablementBacklogModel?.preview ?? null,
    latestMatrix: voxyRenderRuntimeGoNogoMatrixModel?.preview ?? null,
    latestRequestDraft: voxyRenderRequestDraftModel?.draft ?? null,
    gate: voxyRenderReviewDecisionGateModel ?? null,
  });
  const voxyRenderRuntimeObservabilityModel =
    buildVoxyRenderRuntimeObservabilityPanelModel({
      previewFlow: voxyRenderPreviewReviewFlowModel?.preview ?? null,
      latestSchedulingPolicyRecord: voxyRenderSchedulingPolicyModel?.preview ?? null,
      latestUploadTargetPolicyRecord: voxyRenderUploadTargetPolicyModel?.preview ?? null,
      latestMediaStorageTruthRecord: voxyRenderMediaStorageTruthModel?.preview ?? null,
      latestApprovalSemanticsRecord: voxyRenderApprovalSemanticsModel?.preview ?? null,
      latestSocialDistributionHandoffRecord:
        voxyRenderSocialDistributionHandoffModel?.preview ?? null,
      latestPublishReadinessGuardRecord:
        voxyRenderPublishReadinessGuardModel?.preview ?? null,
      latestBacklog: voxyRenderRuntimeEnablementBacklogModel?.preview ?? null,
      latestMatrix: voxyRenderRuntimeGoNogoMatrixModel?.preview ?? null,
      latestRequestDraft: voxyRenderRequestDraftModel?.draft ?? null,
      gate: voxyRenderReviewDecisionGateModel ?? null,
    });
  const voxyRenderRuntimeCutoverGateModel =
    buildVoxyRenderRuntimeCutoverGatePanelModel({
      latestRuntimeObservabilityRecord: voxyRenderRuntimeObservabilityModel?.preview ?? null,
      latestSchedulingPolicyRecord: voxyRenderSchedulingPolicyModel?.preview ?? null,
      latestUploadTargetPolicyRecord: voxyRenderUploadTargetPolicyModel?.preview ?? null,
      latestMediaStorageTruthRecord: voxyRenderMediaStorageTruthModel?.preview ?? null,
      latestApprovalSemanticsRecord: voxyRenderApprovalSemanticsModel?.preview ?? null,
      latestSocialDistributionHandoffRecord:
        voxyRenderSocialDistributionHandoffModel?.preview ?? null,
      latestPublishReadinessGuardRecord:
        voxyRenderPublishReadinessGuardModel?.preview ?? null,
      latestProviderSelectionDraft: voxyRenderProviderSelectionDraftModel?.preview ?? null,
      latestQueueContract: voxyRenderQueueContractModel?.preview ?? null,
      latestCostCreditPolicy: voxyRenderCostCreditPolicyModel?.preview ?? null,
      latestBacklog: voxyRenderRuntimeEnablementBacklogModel?.preview ?? null,
      latestMatrix: voxyRenderRuntimeGoNogoMatrixModel?.preview ?? null,
      latestRequestDraft: voxyRenderRequestDraftModel?.draft ?? null,
      previewFlow: voxyRenderPreviewReviewFlowModel?.preview ?? null,
      gate: voxyRenderReviewDecisionGateModel ?? null,
    });
  const voxyVideoBriefingFlowMasterClosureModel =
    buildVoxyVideoBriefingFlowMasterClosurePanelModel({
      latestRuntimeCutoverGateRecord: voxyRenderRuntimeCutoverGateModel?.preview ?? null,
      latestRuntimeObservabilityRecord: voxyRenderRuntimeObservabilityModel?.preview ?? null,
      latestSchedulingPolicyRecord: voxyRenderSchedulingPolicyModel?.preview ?? null,
      latestUploadTargetPolicyRecord: voxyRenderUploadTargetPolicyModel?.preview ?? null,
      latestMediaStorageTruthRecord: voxyRenderMediaStorageTruthModel?.preview ?? null,
      latestApprovalSemanticsRecord: voxyRenderApprovalSemanticsModel?.preview ?? null,
      latestSocialDistributionHandoffRecord:
        voxyRenderSocialDistributionHandoffModel?.preview ?? null,
      latestPublishReadinessGuardRecord:
        voxyRenderPublishReadinessGuardModel?.preview ?? null,
      latestPreviewOutcomeHandoffRecord:
        voxyRenderPreviewOutcomeHandoffPreview,
      latestPreviewReviewFlowRecord: voxyRenderPreviewReviewFlowModel?.preview ?? null,
      latestRequestDraft: voxyRenderRequestDraftModel?.draft ?? null,
      latestScriptCandidate: voxyBriefingScriptCandidateModel ?? null,
      latestProviderSelectionDraft: voxyRenderProviderSelectionDraftModel?.preview ?? null,
      latestAssetPackDraft: voxyRenderAssetPackDraftModel?.preview ?? null,
      latestQueueContract: voxyRenderQueueContractModel?.preview ?? null,
      latestCostCreditPolicy: voxyRenderCostCreditPolicyModel?.preview ?? null,
    });
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-[rgb(var(--bg))] px-4 py-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-slate-300/70 px-2.5 py-1 text-xs font-semibold text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
          {props.item.type}
        </span>
        <span className="rounded-full border border-slate-300/70 px-2.5 py-1 text-xs font-semibold text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
          {props.item.status}
        </span>
        {props.item.isLocalOnly ? (
          <span className="rounded-full border border-slate-300/70 px-2.5 py-1 text-xs font-semibold text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
            Lokaler Entwurf
          </span>
        ) : null}
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">{props.item.title}</p>
        <p className="text-sm leading-relaxed text-[rgb(var(--muted))]">{props.item.excerpt}</p>
        <p className="text-xs font-medium text-[rgb(var(--fg))]">
          Nächster Schritt: {props.item.nextStep}
        </p>
        {props.item.nextActionStatusLabel ? (
          <p className="text-xs text-[rgb(var(--muted))]">{props.item.nextActionStatusLabel}</p>
        ) : null}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {props.item.guardrails.map((line) => (
          <span
            key={`${props.item.id}-${line}`}
            className="rounded-full border border-slate-300/70 px-2.5 py-1 text-xs text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]"
          >
            {line}
          </span>
        ))}
      </div>
      {props.item.nextActions.length > 0 ? (
        <div className="mt-3 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
            Sinnvolle nächste Schritte
          </p>
          <div className="flex flex-wrap gap-2">
            {props.item.nextActions.slice(0, 3).map((action) => (
              <Link
                key={`${props.item.id}-${action.kind}`}
                href={action.href}
                className="btn-secondary inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold"
                title={action.description}
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      <V3AccountResumeWorkflow
        model={props.item.workflow}
        dataTestId={`account-resume-workflow-${props.item.id}`}
      />
      <V3DownstreamKiTransparency
        model={props.item.downstreamTransparency}
        dataTestId={`account-resume-downstream-ki-${props.item.id}`}
      />
      <V3VoxyCocreationDialog
        model={props.item.voxyCocreationDialog}
        dataTestId={`account-resume-voxy-cocreation-${props.item.id}`}
      />
      <SourceFactcheckFeedEnrichmentPanel
        model={buildSourceFactcheckFeedEnrichmentFromVoxyDialog(
          props.item.voxyCocreationDialog,
          {
            surface: "account",
            nextStep: props.item.nextStep,
            userVisibleReason:
              "Im Account bleibt dieser Block ein vorbereiteter Arbeitsstand und startet keine Recherche.",
            reviewerVisibleReason:
              "Lokale, servergesicherte oder resume-fähige Beiträge zeigen nur vorbereiteten Quellen- und Faktencheckbedarf.",
            runtimeTruthMissing: true,
          },
        )}
        dataTestId={`account-resume-source-factcheck-feed-${props.item.id}`}
      />
      <DossierWorkspaceDecisionPanel
        model={dossierWorkspaceDecisionModel}
        title="Dossier-Entscheidungslogik"
        dataTestId={`account-resume-dossier-decision-${props.item.id}`}
      />
      <ParticipationActivationReviewPanel
        model={participationActivationReviewModel}
        title="Beteiligungsraum vorbereiten"
        dataTestId={`account-resume-participation-activation-${props.item.id}`}
      />
      <PollQuestionOptionsReviewPanel
        model={pollQuestionOptionsReviewModel}
        title="Poll/Frage vorbereiten"
        dataTestId={`account-resume-poll-question-options-${props.item.id}`}
      />
      <OutputSocialWorkbenchPanel
        model={outputSocialWorkbenchModel}
        title="Ausgabe vorbereiten"
        dataTestId={`account-resume-output-social-workbench-${props.item.id}`}
      />
      <VoxyBriefingScriptCandidatePanel
        model={voxyBriefingScriptCandidateModel}
        title="Voxy-Briefing vorbereiten"
        dataTestId={`account-resume-voxy-briefing-script-${props.item.id}`}
      />
      <VoxyRenderReviewDecisionGatePanel
        model={voxyRenderReviewDecisionGateModel}
        persistenceModel={voxyRenderDecisionPersistenceModel}
        title="Render-Entscheidung"
        dataTestId={`account-resume-voxy-render-decision-${props.item.id}`}
      />
      <VoxyRenderRequestDraftPanel
        model={voxyRenderRequestDraftModel}
        dataTestId={`account-resume-voxy-render-request-draft-${props.item.id}`}
      />
      <VoxyRenderQueueContractPanel
        model={voxyRenderQueueContractModel}
        dataTestId={`account-resume-voxy-render-queue-contract-${props.item.id}`}
      />
      <VoxyRenderCostCreditPolicyPanel
        model={voxyRenderCostCreditPolicyModel}
        dataTestId={`account-resume-voxy-render-cost-credit-policy-${props.item.id}`}
      />
      <VoxyRenderAssetPackDraftPanel
        model={voxyRenderAssetPackDraftModel}
        dataTestId={`account-resume-voxy-render-asset-pack-draft-${props.item.id}`}
      />
      <VoxyRenderProviderSelectionDraftPanel
        model={voxyRenderProviderSelectionDraftModel}
        dataTestId={`account-resume-voxy-render-provider-selection-draft-${props.item.id}`}
      />
      <VoxyRenderHybridRuntimeFoundationPanel
        model={voxyRenderHybridRuntimeFoundationModel}
        dataTestId={`account-resume-voxy-hybrid-runtime-foundation-${props.item.id}`}
      />
      <VoxyRenderRuntimeGoNogoMatrixPanel
        model={voxyRenderRuntimeGoNogoMatrixModel}
        dataTestId={`account-resume-voxy-render-runtime-go-nogo-matrix-${props.item.id}`}
      />
      <VoxyRenderRuntimeEnablementBacklogPanel
        model={voxyRenderRuntimeEnablementBacklogModel}
        dataTestId={`account-resume-voxy-render-runtime-enablement-backlog-${props.item.id}`}
      />
      <VoxyRenderPreviewReviewFlowPanel
        model={voxyRenderPreviewReviewFlowModel}
        dataTestId={`account-resume-voxy-render-preview-review-flow-${props.item.id}`}
      />
      <VoxyRenderPreviewReviewDecisionPersistencePanel
        model={voxyRenderPreviewReviewDecisionPersistenceModel}
        dataTestId={`account-resume-voxy-render-preview-review-decision-persistence-${props.item.id}`}
      />
      <VoxyRenderPreviewOutcomeHandoffPanel
        model={voxyRenderPreviewOutcomeHandoffModel}
        dataTestId={`account-resume-voxy-render-preview-outcome-handoff-${props.item.id}`}
      />
      <VoxyRenderPublishReadinessGuardPanel
        model={voxyRenderPublishReadinessGuardModel}
        dataTestId={`account-resume-voxy-render-publish-readiness-guard-${props.item.id}`}
      />
      <VoxyRenderSocialDistributionHandoffPanel
        model={voxyRenderSocialDistributionHandoffModel}
        dataTestId={`account-resume-voxy-render-social-distribution-handoff-${props.item.id}`}
      />
      <VoxyRenderApprovalSemanticsPanel
        model={voxyRenderApprovalSemanticsModel}
        dataTestId={`account-resume-voxy-render-approval-semantics-${props.item.id}`}
      />
      <VoxyRenderMediaStorageTruthPanel
        model={voxyRenderMediaStorageTruthModel}
        dataTestId={`account-resume-voxy-render-media-storage-truth-${props.item.id}`}
      />
      <VoxyRenderUploadTargetPolicyPanel
        model={voxyRenderUploadTargetPolicyModel}
        dataTestId={`account-resume-voxy-render-upload-target-policy-${props.item.id}`}
      />
      <VoxyRenderSchedulingPolicyPanel
        model={voxyRenderSchedulingPolicyModel}
        dataTestId={`account-resume-voxy-render-scheduling-policy-${props.item.id}`}
      />
      <VoxyRenderRuntimeObservabilityPanel
        model={voxyRenderRuntimeObservabilityModel}
        dataTestId={`account-resume-voxy-render-runtime-observability-${props.item.id}`}
      />
      <VoxyRenderRuntimeCutoverGatePanel
        model={voxyRenderRuntimeCutoverGateModel}
        dataTestId={`account-resume-voxy-render-runtime-cutover-gate-${props.item.id}`}
      />
      <VoxyVideoBriefingFlowMasterClosurePanel
        model={voxyVideoBriefingFlowMasterClosureModel}
        dataTestId={`account-resume-voxy-video-briefing-flow-master-closure-${props.item.id}`}
      />
      <VoxyRenderProviderHandoffPanel
        model={voxyRenderProviderHandoffModel}
        title="Voxy-Render/Provider-Handoff vorbereiten"
        dataTestId={`account-resume-voxy-render-provider-handoff-${props.item.id}`}
      />
      <VoxyRenderPreflightReadinessPanel
        model={voxyRenderPreflightReadinessModel}
        title="Voxy-Render-Preflight vorbereiten"
        dataTestId={`account-resume-voxy-render-preflight-${props.item.id}`}
      />
      <VoxyRenderAssetProviderRegistryPanel
        model={voxyRenderAssetProviderRegistryModel}
        title="Voxy Asset- & Provider-Registry"
        dataTestId={`account-resume-voxy-render-registry-${props.item.id}`}
      />
      <VoxyRenderAdapterNoopPanel
        model={voxyRenderAdapterNoopModel}
        title="Render-Adapter vorbereiten"
        dataTestId={`account-resume-voxy-render-adapter-${props.item.id}`}
      />
      <SsotPolicyPanel label={props.ssotLabel} summary={props.ssotSummary} />
      {props.correlation ? (
        <div className="mt-4 rounded-2xl border border-slate-200/80 px-3 py-3 text-xs dark:border-[rgb(var(--border))]">
          <p className="font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
            Verknüpfung zum Arbeitsstand
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-300/70 px-2.5 py-1 text-[11px] font-semibold text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
              {accountCorrelationStrengthLabel(props.correlation.correlationStrength)}
            </span>
            <span className="rounded-full border border-slate-300/70 px-2.5 py-1 text-[11px] font-semibold text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
              {accountCorrelationBasisLabel(props.correlation.correlationBasis)}
            </span>
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-[rgb(var(--fg))]">Handoff: {props.correlation.userVisibleLabel}</p>
            <p className="text-[rgb(var(--fg))]">
              Review: {props.correlation.reviewQueueRef?.stateLabel ?? "Noch kein persisted Review-Handoff"}
            </p>
            <p className="text-[rgb(var(--fg))]">
              Dossier: {props.correlation.dossierWorkspaceRef?.stateLabel ?? "Noch kein direkt verknüpfter Dossier-Arbeitsstand"}
            </p>
            <p className="text-[rgb(var(--fg))]">
              Beteiligung: {props.correlation.participationRef?.stateLabel ?? "Noch kein direkt verknüpfter Beteiligungs-Arbeitsstand"}
            </p>
            <p className="text-[rgb(var(--fg))]">
              Output/Voxy: {props.correlation.outputDraftRef?.stateLabel ?? props.correlation.voxyBriefingRef?.stateLabel ?? "Noch kein verknüpfter Output- oder Voxy-Arbeitsstand"}
            </p>
            {props.correlation.adminReason ? (
              <p className="text-[rgb(var(--muted))]">
                {props.correlation.correlationStrength === "exact" ||
                props.correlation.correlationStrength === "strong" ||
                props.correlation.correlationStrength === "partial"
                  ? "Warum diese Verbindung belastbar ist: "
                  : "Warum sie noch nicht belastbar ist: "}
                {props.correlation.adminReason}
              </p>
            ) : null}
            <p className="font-medium text-[rgb(var(--fg))]">
              Nächster Schritt: {props.correlation.nextStep}
            </p>
          </div>
          {props.correlation.persistedHandoffRef ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={props.correlation.persistedHandoffRef.href}
                className="btn-secondary inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold"
              >
                Persisted Handoff öffnen
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={props.item.href}
          className="btn-primary inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold"
        >
          Weiterarbeiten
        </Link>
        {props.item.discardable && props.onDiscard ? (
          <button
            type="button"
            className="btn-secondary inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold"
            onClick={props.onDiscard}
          >
            Verwerfen
          </button>
        ) : null}
      </div>
    </article>
  );
}

function RuntimeLinkageCard(props: {
  linkage: AccountUserScopedRuntimeLinkage;
  ssotLabel: string;
  ssotSummary: string;
}) {
  const downstreamModel = buildV3DownstreamKiTransparencyFromReviewContext(
    props.linkage.v3ReviewContext,
    "workspace",
  );
  const runtimeWorkflowModel = buildV3RuntimeWorkflowSurfaceFromReviewContext(
    props.linkage.v3ReviewContext,
  );
  const voxyCocreationDialog = buildVoxyCocreationDialogFromReviewContext(
    props.linkage.v3ReviewContext,
    {
      contributionRef: {
        id: props.linkage.contributionRef.handoffId,
        title: props.linkage.contributionRef.title,
        href: props.linkage.contributionRef.href,
      },
      surface: "account",
      maxCards: 4,
    },
  );
  const sourceFactcheckFeedModel = buildSourceFactcheckFeedEnrichmentFromReviewContext(
    props.linkage.v3ReviewContext,
    {
      audience: "workspace",
      contributionRef: {
        id: props.linkage.contributionRef.handoffId,
        title: props.linkage.contributionRef.title,
        href: props.linkage.contributionRef.href,
      },
    },
  );
  const dossierWorkspaceDecisionModel = buildDossierWorkspaceDecisionFromReviewContext(
    props.linkage.v3ReviewContext,
    {
      audience: "workspace",
      contributionRef: {
        id: props.linkage.contributionRef.handoffId,
        title: props.linkage.contributionRef.title,
        href: props.linkage.contributionRef.href,
      },
      dossierRef: props.linkage.dossierWorkspaceRef
        ? {
            id: props.linkage.contributionRef.handoffId,
            title: props.linkage.dossierWorkspaceRef.title,
            href: props.linkage.dossierWorkspaceRef.href,
          }
        : null,
    },
  );
  const participationActivationReviewModel =
    buildParticipationActivationReviewFromReviewContext(
      props.linkage.v3ReviewContext,
      {
        audience: "workspace",
        contributionRef: {
          id: props.linkage.contributionRef.handoffId,
          title: props.linkage.contributionRef.title,
          href: props.linkage.contributionRef.href,
        },
        dossierRef: props.linkage.dossierWorkspaceRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.dossierWorkspaceRef.title,
              href: props.linkage.dossierWorkspaceRef.href,
            }
          : null,
      },
    );
  const pollQuestionOptionsReviewModel =
    buildPollQuestionOptionsReviewFromReviewContext(
      props.linkage.v3ReviewContext,
      {
        audience: "workspace",
        contributionRef: {
          id: props.linkage.contributionRef.handoffId,
          title: props.linkage.contributionRef.title,
          href: props.linkage.contributionRef.href,
        },
        dossierRef: props.linkage.dossierWorkspaceRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.dossierWorkspaceRef.title,
              href: props.linkage.dossierWorkspaceRef.href,
            }
          : null,
      },
    );
  const outputSocialWorkbenchModel =
    buildOutputSocialWorkbenchFromReviewContext(
      props.linkage.v3ReviewContext,
      {
        audience: "workspace",
        contributionRef: {
          id: props.linkage.contributionRef.handoffId,
          title: props.linkage.contributionRef.title,
          href: props.linkage.contributionRef.href,
        },
        dossierRef: props.linkage.dossierWorkspaceRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.dossierWorkspaceRef.title,
              href: props.linkage.dossierWorkspaceRef.href,
            }
          : null,
      },
    );
  const voxyBriefingScriptCandidateModel =
    buildVoxyBriefingScriptCandidateFromReviewContext(
      props.linkage.v3ReviewContext,
      {
        audience: "workspace",
        contributionRef: {
          id: props.linkage.contributionRef.handoffId,
          title: props.linkage.contributionRef.title,
          href: props.linkage.contributionRef.href,
        },
        dossierRef: props.linkage.dossierWorkspaceRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.dossierWorkspaceRef.title,
              href: props.linkage.dossierWorkspaceRef.href,
            }
          : null,
        participationRef: props.linkage.participationRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.participationRef.title,
              href: props.linkage.participationRef.href,
            }
          : null,
        outputRef: props.linkage.outputDraftRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.outputDraftRef.title,
              href: props.linkage.outputDraftRef.href,
            }
          : props.linkage.voxyBriefingRef
            ? {
                id: props.linkage.contributionRef.handoffId,
                title: props.linkage.voxyBriefingRef.title,
                href: props.linkage.voxyBriefingRef.href,
              }
            : null,
      },
    );
  const voxyRenderProviderHandoffModel =
    buildVoxyRenderProviderHandoffFromReviewContext(
      props.linkage.v3ReviewContext,
      {
        audience: "workspace",
        contributionRef: {
          id: props.linkage.contributionRef.handoffId,
          title: props.linkage.contributionRef.title,
          href: props.linkage.contributionRef.href,
        },
        dossierRef: props.linkage.dossierWorkspaceRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.dossierWorkspaceRef.title,
              href: props.linkage.dossierWorkspaceRef.href,
            }
          : null,
        outputRef: props.linkage.outputDraftRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.outputDraftRef.title,
              href: props.linkage.outputDraftRef.href,
            }
          : props.linkage.voxyBriefingRef
            ? {
                id: props.linkage.contributionRef.handoffId,
                title: props.linkage.voxyBriefingRef.title,
                href: props.linkage.voxyBriefingRef.href,
              }
            : null,
      },
    );
  const voxyRenderPreflightReadinessModel =
    buildVoxyRenderPreflightReadinessFromReviewContext(
      props.linkage.v3ReviewContext,
      {
        audience: "workspace",
        contributionRef: {
          id: props.linkage.contributionRef.handoffId,
          title: props.linkage.contributionRef.title,
          href: props.linkage.contributionRef.href,
        },
        dossierRef: props.linkage.dossierWorkspaceRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.dossierWorkspaceRef.title,
              href: props.linkage.dossierWorkspaceRef.href,
            }
          : null,
        participationRef: props.linkage.participationRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.participationRef.title,
              href: props.linkage.participationRef.href,
            }
          : null,
        outputRef: props.linkage.outputDraftRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.outputDraftRef.title,
              href: props.linkage.outputDraftRef.href,
            }
          : props.linkage.voxyBriefingRef
            ? {
                id: props.linkage.contributionRef.handoffId,
                title: props.linkage.voxyBriefingRef.title,
                href: props.linkage.voxyBriefingRef.href,
              }
            : null,
      },
    );
  const voxyRenderAssetProviderRegistryModel =
    buildVoxyRenderAssetProviderRegistryFromReviewContext(
      props.linkage.v3ReviewContext,
      {
        audience: "workspace",
        contributionRef: {
          id: props.linkage.contributionRef.handoffId,
          title: props.linkage.contributionRef.title,
          href: props.linkage.contributionRef.href,
        },
        dossierRef: props.linkage.dossierWorkspaceRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.dossierWorkspaceRef.title,
              href: props.linkage.dossierWorkspaceRef.href,
            }
          : null,
        outputRef: props.linkage.outputDraftRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.outputDraftRef.title,
              href: props.linkage.outputDraftRef.href,
            }
          : props.linkage.voxyBriefingRef
            ? {
                id: props.linkage.contributionRef.handoffId,
                title: props.linkage.voxyBriefingRef.title,
                href: props.linkage.voxyBriefingRef.href,
              }
            : null,
      },
    );
  const voxyRenderAdapterNoopModel =
    buildVoxyRenderAdapterNoopFromReviewContext(
      props.linkage.v3ReviewContext,
      {
        audience: "workspace",
        contributionRef: {
          id: props.linkage.contributionRef.handoffId,
          title: props.linkage.contributionRef.title,
          href: props.linkage.contributionRef.href,
        },
        dossierRef: props.linkage.dossierWorkspaceRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.dossierWorkspaceRef.title,
              href: props.linkage.dossierWorkspaceRef.href,
            }
          : null,
        outputRef: props.linkage.outputDraftRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.outputDraftRef.title,
              href: props.linkage.outputDraftRef.href,
            }
          : props.linkage.voxyBriefingRef
            ? {
                id: props.linkage.contributionRef.handoffId,
                title: props.linkage.voxyBriefingRef.title,
                href: props.linkage.voxyBriefingRef.href,
              }
            : null,
      },
    );
  const voxyRenderReviewDecisionGateModel =
    buildVoxyRenderReviewDecisionGateFromReviewContext(
      props.linkage.v3ReviewContext,
      {
        audience: "workspace",
        contributionRef: {
          id: props.linkage.contributionRef.handoffId,
          title: props.linkage.contributionRef.title,
          href: props.linkage.contributionRef.href,
        },
        dossierRef: props.linkage.dossierWorkspaceRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.dossierWorkspaceRef.title,
              href: props.linkage.dossierWorkspaceRef.href,
            }
          : null,
        outputRef: props.linkage.outputDraftRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.outputDraftRef.title,
              href: props.linkage.outputDraftRef.href,
            }
          : props.linkage.voxyBriefingRef
            ? {
                id: props.linkage.contributionRef.handoffId,
                title: props.linkage.voxyBriefingRef.title,
                href: props.linkage.voxyBriefingRef.href,
              }
            : null,
      },
    );
  const voxyRenderDecisionPersistenceModel =
    buildVoxyRenderDecisionPersistencePanelModel({
      gate: voxyRenderReviewDecisionGateModel,
    });
  const voxyRenderRequestDraftModel = buildVoxyRenderRequestDraftPanelModel({
    draft: buildVoxyRenderRequestDraftFromReviewContext(props.linkage.v3ReviewContext, {
      audience: "workspace",
      contributionRef: {
        id: props.linkage.contributionRef.handoffId,
        title: props.linkage.contributionRef.title,
        href: props.linkage.contributionRef.href,
      },
      dossierRef: props.linkage.dossierWorkspaceRef
        ? {
            id: props.linkage.contributionRef.handoffId,
            title: props.linkage.dossierWorkspaceRef.title,
            href: props.linkage.dossierWorkspaceRef.href,
          }
        : null,
      outputRef: props.linkage.outputDraftRef
        ? {
            id: props.linkage.contributionRef.handoffId,
            title: props.linkage.outputDraftRef.title,
            href: props.linkage.outputDraftRef.href,
          }
        : props.linkage.voxyBriefingRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.voxyBriefingRef.title,
              href: props.linkage.voxyBriefingRef.href,
            }
          : null,
    }),
  });
  const voxyRenderQueueContractModel = buildVoxyRenderQueuePanelModel({
    preview: buildVoxyRenderQueuePreviewFromReviewContext(props.linkage.v3ReviewContext, {
      audience: "workspace",
      latestRequestDraftRecord: buildVoxyRenderRequestDraftFromReviewContext(
        props.linkage.v3ReviewContext,
        {
          audience: "workspace",
          contributionRef: {
            id: props.linkage.contributionRef.handoffId,
            title: props.linkage.contributionRef.title,
            href: props.linkage.contributionRef.href,
          },
          dossierRef: props.linkage.dossierWorkspaceRef
            ? {
                id: props.linkage.contributionRef.handoffId,
                title: props.linkage.dossierWorkspaceRef.title,
                href: props.linkage.dossierWorkspaceRef.href,
              }
            : null,
          outputRef: props.linkage.outputDraftRef
            ? {
                id: props.linkage.contributionRef.handoffId,
                title: props.linkage.outputDraftRef.title,
                href: props.linkage.outputDraftRef.href,
              }
            : props.linkage.voxyBriefingRef
              ? {
                  id: props.linkage.contributionRef.handoffId,
                  title: props.linkage.voxyBriefingRef.title,
                  href: props.linkage.voxyBriefingRef.href,
                }
              : null,
        },
      ),
      contributionRef: {
        id: props.linkage.contributionRef.handoffId,
        title: props.linkage.contributionRef.title,
        href: props.linkage.contributionRef.href,
      },
      dossierRef: props.linkage.dossierWorkspaceRef
        ? {
            id: props.linkage.contributionRef.handoffId,
            title: props.linkage.dossierWorkspaceRef.title,
            href: props.linkage.dossierWorkspaceRef.href,
          }
        : null,
      outputRef: props.linkage.outputDraftRef
        ? {
            id: props.linkage.contributionRef.handoffId,
            title: props.linkage.outputDraftRef.title,
            href: props.linkage.outputDraftRef.href,
          }
        : props.linkage.voxyBriefingRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.voxyBriefingRef.title,
              href: props.linkage.voxyBriefingRef.href,
            }
          : null,
      }),
  });
  const voxyRenderCostCreditPolicyModel = buildVoxyRenderCostCreditPolicyPanelModel({
    preview: buildVoxyRenderCostCreditPolicyPreviewFromReviewContext(
      props.linkage.v3ReviewContext,
      {
        audience: "workspace",
        contributionRef: {
          id: props.linkage.contributionRef.handoffId,
          title: props.linkage.contributionRef.title,
          href: props.linkage.contributionRef.href,
        },
        dossierRef: props.linkage.dossierWorkspaceRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.dossierWorkspaceRef.title,
              href: props.linkage.dossierWorkspaceRef.href,
            }
          : null,
        outputRef: props.linkage.outputDraftRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.outputDraftRef.title,
              href: props.linkage.outputDraftRef.href,
            }
          : props.linkage.voxyBriefingRef
            ? {
                id: props.linkage.contributionRef.handoffId,
                title: props.linkage.voxyBriefingRef.title,
                href: props.linkage.voxyBriefingRef.href,
              }
            : null,
      },
    ),
  });
  const voxyRenderAssetPackDraftModel = buildVoxyRenderAssetPackDraftPanelModel({
    preview: buildVoxyRenderAssetPackDraftPreviewFromReviewContext(
      props.linkage.v3ReviewContext,
      {
        audience: "workspace",
        contributionRef: {
          id: props.linkage.contributionRef.handoffId,
          title: props.linkage.contributionRef.title,
          href: props.linkage.contributionRef.href,
        },
        dossierRef: props.linkage.dossierWorkspaceRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.dossierWorkspaceRef.title,
              href: props.linkage.dossierWorkspaceRef.href,
            }
          : null,
        outputRef: props.linkage.outputDraftRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.outputDraftRef.title,
              href: props.linkage.outputDraftRef.href,
            }
          : props.linkage.voxyBriefingRef
            ? {
                id: props.linkage.contributionRef.handoffId,
                title: props.linkage.voxyBriefingRef.title,
                href: props.linkage.voxyBriefingRef.href,
              }
            : null,
      },
    ),
  });
  const voxyRenderProviderSelectionDraftModel = buildVoxyRenderProviderSelectionDraftPanelModel({
    preview: buildVoxyRenderProviderSelectionDraftFromReviewContext(
      props.linkage.v3ReviewContext,
      {
        audience: "workspace",
        contributionRef: {
          id: props.linkage.contributionRef.handoffId,
          title: props.linkage.contributionRef.title,
          href: props.linkage.contributionRef.href,
        },
        dossierRef: props.linkage.dossierWorkspaceRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.dossierWorkspaceRef.title,
              href: props.linkage.dossierWorkspaceRef.href,
            }
          : null,
        outputRef: props.linkage.outputDraftRef
          ? {
              id: props.linkage.contributionRef.handoffId,
              title: props.linkage.outputDraftRef.title,
              href: props.linkage.outputDraftRef.href,
            }
          : props.linkage.voxyBriefingRef
            ? {
                id: props.linkage.contributionRef.handoffId,
                title: props.linkage.voxyBriefingRef.title,
                href: props.linkage.voxyBriefingRef.href,
              }
            : null,
      },
    ),
  });
  const voxyRenderHybridRuntimeFoundationModel =
    buildVoxyRenderHybridRuntimeFoundationPanelModel({
      preview: buildVoxyRenderHybridRuntimeFoundationFromReviewContext(
        props.linkage.v3ReviewContext,
        { surface: "workspace" },
      ),
    });
  const voxyRenderRuntimeGoNogoMatrixModel = buildVoxyRenderRuntimeGoNogoMatrixPanelModel({
    preview: buildVoxyRenderRuntimeGoNogoMatrixFromReviewContext({
      reviewContext: props.linkage.v3ReviewContext,
    }),
  });
  const voxyRenderRuntimeEnablementBacklogModel =
    buildVoxyRenderRuntimeEnablementBacklogPanelModel({
      preview: buildVoxyRenderRuntimeEnablementBacklogFromReviewContext({
        reviewContext: props.linkage.v3ReviewContext,
      }),
    });
  const voxyRenderPreviewReviewFlowModel = buildVoxyRenderPreviewReviewFlowPanelModel({
    preview: buildVoxyRenderPreviewReviewFlowFromReviewContext({
      reviewContext: props.linkage.v3ReviewContext,
      surface: "workspace",
    }),
  });
  const voxyRenderPreviewReviewDecisionPersistenceModel =
    buildVoxyRenderPreviewReviewDecisionPersistencePanelModel({
      previewFlow: voxyRenderPreviewReviewFlowModel?.preview ?? null,
    });
  const voxyRenderPreviewOutcomeHandoffPreview =
    buildVoxyRenderPreviewOutcomeHandoffCommandFromReadmodels({
      previewFlow: voxyRenderPreviewReviewFlowModel?.preview ?? null,
    });
  const voxyRenderPreviewOutcomeHandoffModel = buildVoxyRenderPreviewOutcomeHandoffPanelModel({
    previewFlow: voxyRenderPreviewReviewFlowModel?.preview ?? null,
  });
  const voxyRenderPublishReadinessGuardModel = buildVoxyRenderPublishReadinessGuardPanelModel({
    previewFlow: voxyRenderPreviewReviewFlowModel?.preview ?? null,
  });
  const voxyRenderSocialDistributionHandoffModel =
    buildVoxyRenderSocialDistributionHandoffPanelModel({
      previewFlow: voxyRenderPreviewReviewFlowModel?.preview ?? null,
    });
  const voxyRenderApprovalSemanticsModel = buildVoxyRenderApprovalSemanticsPanelModel({
    previewFlow: voxyRenderPreviewReviewFlowModel?.preview ?? null,
    latestPublishReadinessGuardRecord: voxyRenderPublishReadinessGuardModel?.preview ?? null,
    latestSocialDistributionHandoffRecord:
      voxyRenderSocialDistributionHandoffModel?.preview ?? null,
  });
  const voxyRenderMediaStorageTruthModel = buildVoxyRenderMediaStorageTruthPanelModel({
    previewFlow: voxyRenderPreviewReviewFlowModel?.preview ?? null,
    latestApprovalSemanticsRecord: voxyRenderApprovalSemanticsModel?.preview ?? null,
    latestBacklog: voxyRenderRuntimeEnablementBacklogModel?.preview ?? null,
    latestMatrix: voxyRenderRuntimeGoNogoMatrixModel?.preview ?? null,
    latestRequestDraft: voxyRenderRequestDraftModel?.draft ?? null,
    gate: voxyRenderReviewDecisionGateModel ?? null,
  });
  const voxyRenderUploadTargetPolicyModel = buildVoxyRenderUploadTargetPolicyPanelModel({
    previewFlow: voxyRenderPreviewReviewFlowModel?.preview ?? null,
    latestMediaStorageTruthRecord: voxyRenderMediaStorageTruthModel?.preview ?? null,
    latestApprovalSemanticsRecord: voxyRenderApprovalSemanticsModel?.preview ?? null,
    latestPublishReadinessGuardRecord: voxyRenderPublishReadinessGuardModel?.preview ?? null,
    latestSocialDistributionHandoffRecord:
      voxyRenderSocialDistributionHandoffModel?.preview ?? null,
    latestBacklog: voxyRenderRuntimeEnablementBacklogModel?.preview ?? null,
    latestMatrix: voxyRenderRuntimeGoNogoMatrixModel?.preview ?? null,
    latestRequestDraft: voxyRenderRequestDraftModel?.draft ?? null,
    gate: voxyRenderReviewDecisionGateModel ?? null,
  });
  const voxyRenderSchedulingPolicyModel = buildVoxyRenderSchedulingPolicyPanelModel({
    previewFlow: voxyRenderPreviewReviewFlowModel?.preview ?? null,
    latestUploadTargetPolicyRecord: voxyRenderUploadTargetPolicyModel?.preview ?? null,
    latestMediaStorageTruthRecord: voxyRenderMediaStorageTruthModel?.preview ?? null,
    latestApprovalSemanticsRecord: voxyRenderApprovalSemanticsModel?.preview ?? null,
    latestPublishReadinessGuardRecord: voxyRenderPublishReadinessGuardModel?.preview ?? null,
    latestSocialDistributionHandoffRecord:
      voxyRenderSocialDistributionHandoffModel?.preview ?? null,
    latestBacklog: voxyRenderRuntimeEnablementBacklogModel?.preview ?? null,
    latestMatrix: voxyRenderRuntimeGoNogoMatrixModel?.preview ?? null,
    latestRequestDraft: voxyRenderRequestDraftModel?.draft ?? null,
    gate: voxyRenderReviewDecisionGateModel ?? null,
  });
  const voxyRenderRuntimeObservabilityModel =
    buildVoxyRenderRuntimeObservabilityPanelModel({
      previewFlow: voxyRenderPreviewReviewFlowModel?.preview ?? null,
      latestSchedulingPolicyRecord: voxyRenderSchedulingPolicyModel?.preview ?? null,
      latestUploadTargetPolicyRecord: voxyRenderUploadTargetPolicyModel?.preview ?? null,
      latestMediaStorageTruthRecord: voxyRenderMediaStorageTruthModel?.preview ?? null,
      latestApprovalSemanticsRecord: voxyRenderApprovalSemanticsModel?.preview ?? null,
      latestSocialDistributionHandoffRecord:
        voxyRenderSocialDistributionHandoffModel?.preview ?? null,
      latestPublishReadinessGuardRecord:
        voxyRenderPublishReadinessGuardModel?.preview ?? null,
      latestBacklog: voxyRenderRuntimeEnablementBacklogModel?.preview ?? null,
      latestMatrix: voxyRenderRuntimeGoNogoMatrixModel?.preview ?? null,
      latestRequestDraft: voxyRenderRequestDraftModel?.draft ?? null,
      gate: voxyRenderReviewDecisionGateModel ?? null,
    });
  const voxyRenderRuntimeCutoverGateModel =
    buildVoxyRenderRuntimeCutoverGatePanelModel({
      latestRuntimeObservabilityRecord: voxyRenderRuntimeObservabilityModel?.preview ?? null,
      latestSchedulingPolicyRecord: voxyRenderSchedulingPolicyModel?.preview ?? null,
      latestUploadTargetPolicyRecord: voxyRenderUploadTargetPolicyModel?.preview ?? null,
      latestMediaStorageTruthRecord: voxyRenderMediaStorageTruthModel?.preview ?? null,
      latestApprovalSemanticsRecord: voxyRenderApprovalSemanticsModel?.preview ?? null,
      latestSocialDistributionHandoffRecord:
        voxyRenderSocialDistributionHandoffModel?.preview ?? null,
      latestPublishReadinessGuardRecord:
        voxyRenderPublishReadinessGuardModel?.preview ?? null,
      latestProviderSelectionDraft: voxyRenderProviderSelectionDraftModel?.preview ?? null,
      latestQueueContract: voxyRenderQueueContractModel?.preview ?? null,
      latestCostCreditPolicy: voxyRenderCostCreditPolicyModel?.preview ?? null,
      latestBacklog: voxyRenderRuntimeEnablementBacklogModel?.preview ?? null,
      latestMatrix: voxyRenderRuntimeGoNogoMatrixModel?.preview ?? null,
      latestRequestDraft: voxyRenderRequestDraftModel?.draft ?? null,
      previewFlow: voxyRenderPreviewReviewFlowModel?.preview ?? null,
      gate: voxyRenderReviewDecisionGateModel ?? null,
    });
  const voxyVideoBriefingFlowMasterClosureModel =
    buildVoxyVideoBriefingFlowMasterClosurePanelModel({
      latestRuntimeCutoverGateRecord: voxyRenderRuntimeCutoverGateModel?.preview ?? null,
      latestRuntimeObservabilityRecord: voxyRenderRuntimeObservabilityModel?.preview ?? null,
      latestSchedulingPolicyRecord: voxyRenderSchedulingPolicyModel?.preview ?? null,
      latestUploadTargetPolicyRecord: voxyRenderUploadTargetPolicyModel?.preview ?? null,
      latestMediaStorageTruthRecord: voxyRenderMediaStorageTruthModel?.preview ?? null,
      latestApprovalSemanticsRecord: voxyRenderApprovalSemanticsModel?.preview ?? null,
      latestSocialDistributionHandoffRecord:
        voxyRenderSocialDistributionHandoffModel?.preview ?? null,
      latestPublishReadinessGuardRecord:
        voxyRenderPublishReadinessGuardModel?.preview ?? null,
      latestPreviewOutcomeHandoffRecord:
        voxyRenderPreviewOutcomeHandoffPreview,
      latestPreviewReviewFlowRecord: voxyRenderPreviewReviewFlowModel?.preview ?? null,
      latestRequestDraft: voxyRenderRequestDraftModel?.draft ?? null,
      latestScriptCandidate: voxyBriefingScriptCandidateModel ?? null,
      latestProviderSelectionDraft: voxyRenderProviderSelectionDraftModel?.preview ?? null,
      latestAssetPackDraft: voxyRenderAssetPackDraftModel?.preview ?? null,
      latestQueueContract: voxyRenderQueueContractModel?.preview ?? null,
      latestCostCreditPolicy: voxyRenderCostCreditPolicyModel?.preview ?? null,
    });

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-[rgb(var(--bg))] px-4 py-4 dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--bg))]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-slate-300/70 px-2.5 py-1 text-xs font-semibold text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
          Verbundener Arbeitsstand
        </span>
        <span className="rounded-full border border-slate-300/70 px-2.5 py-1 text-xs font-semibold text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
          {accountRuntimeLinkageStatusLabel(props.linkage.linkageStatus)}
        </span>
        <span className="rounded-full border border-slate-300/70 px-2.5 py-1 text-xs font-semibold text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
          {accountRuntimeTruthLevelLabel(props.linkage.runtimeTruthLevel)}
        </span>
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">
          {props.linkage.contributionRef.title}
        </p>
        <p className="text-sm leading-relaxed text-[rgb(var(--muted))]">
          {props.linkage.contributionRef.summary}
        </p>
        <p className="text-xs font-medium text-[rgb(var(--fg))]">
          Status: {props.linkage.userVisibleStatus}
        </p>
        <p className="text-xs font-medium text-[rgb(var(--fg))]">
          Nächster Schritt: {props.linkage.nextStep}
        </p>
        {props.linkage.adminReason ? (
          <p className="text-xs text-[rgb(var(--muted))]">
            Warum noch nicht vollständig sichtbar: {props.linkage.adminReason}
          </p>
        ) : null}
      </div>
      <div className="mt-3 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[rgb(var(--muted))]">
          Verbundene Arbeitsstände
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {props.linkage.surfaces.map((surface) => (
            <div
              key={`${props.linkage.contributionRef.handoffId}-${surface.kind}`}
              className="rounded-2xl border border-slate-200/80 px-3 py-3 text-xs dark:border-[rgb(var(--border))]"
            >
              <p className="font-semibold text-[rgb(var(--fg))]">{surface.label}</p>
              <p className="mt-1 text-[rgb(var(--fg))]">{surface.stateLabel}</p>
              <p className="mt-1 text-[rgb(var(--muted))]">{surface.summary}</p>
            </div>
          ))}
        </div>
      </div>
      {props.linkage.linkageGaps.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {props.linkage.linkageGaps.slice(0, 4).map((line) => (
            <span
              key={`${props.linkage.contributionRef.handoffId}-${line}`}
              className="rounded-full border border-slate-300/70 px-2.5 py-1 text-xs text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]"
            >
              {line}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-3">
        <V3ReviewContextSummary
          context={props.linkage.v3ReviewContext}
          audience="workspace"
          title="V3-Review-Kontext"
          dataTestId={`account-runtime-linkage-context-${props.linkage.contributionRef.handoffId}`}
        />
      </div>
      <div className="mt-3">
        <V3RuntimeWorkflowSurface
          model={runtimeWorkflowModel}
          dataTestId={`account-runtime-linkage-workflow-${props.linkage.contributionRef.handoffId}`}
        />
      </div>
      <V3DownstreamKiTransparency
        model={downstreamModel}
        title="Downstream-KI-Transparenz"
        dataTestId={`account-runtime-linkage-downstream-${props.linkage.contributionRef.handoffId}`}
      />
      <V3VoxyCocreationDialog
        model={voxyCocreationDialog}
        dataTestId={`account-runtime-linkage-voxy-${props.linkage.contributionRef.handoffId}`}
      />
      <SourceFactcheckFeedEnrichmentPanel
        model={sourceFactcheckFeedModel}
        dataTestId={`account-runtime-linkage-source-factcheck-feed-${props.linkage.contributionRef.handoffId}`}
      />
      <DossierWorkspaceDecisionPanel
        model={dossierWorkspaceDecisionModel}
        title="Dossier-Entscheidungslogik"
        dataTestId={`account-runtime-linkage-dossier-decision-${props.linkage.contributionRef.handoffId}`}
      />
      <ParticipationActivationReviewPanel
        model={participationActivationReviewModel}
        title="Beteiligungsraum vorbereiten"
        dataTestId={`account-runtime-linkage-participation-activation-${props.linkage.contributionRef.handoffId}`}
      />
      <PollQuestionOptionsReviewPanel
        model={pollQuestionOptionsReviewModel}
        title="Poll/Frage vorbereiten"
        dataTestId={`account-runtime-linkage-poll-question-options-${props.linkage.contributionRef.handoffId}`}
      />
      <OutputSocialWorkbenchPanel
        model={outputSocialWorkbenchModel}
        title="Ausgabe vorbereiten"
        dataTestId={`account-runtime-linkage-output-social-workbench-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyBriefingScriptCandidatePanel
        model={voxyBriefingScriptCandidateModel}
        title="Voxy-Briefing im Account"
        dataTestId={`account-runtime-linkage-voxy-briefing-script-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderReviewDecisionGatePanel
        model={voxyRenderReviewDecisionGateModel}
        persistenceModel={voxyRenderDecisionPersistenceModel}
        title="Render-Entscheidung im Account"
        dataTestId={`account-runtime-linkage-voxy-render-decision-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderRequestDraftPanel
        model={voxyRenderRequestDraftModel}
        dataTestId={`account-runtime-linkage-voxy-render-request-draft-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderQueueContractPanel
        model={voxyRenderQueueContractModel}
        dataTestId={`account-runtime-linkage-voxy-render-queue-contract-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderCostCreditPolicyPanel
        model={voxyRenderCostCreditPolicyModel}
        dataTestId={`account-runtime-linkage-voxy-render-cost-credit-policy-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderAssetPackDraftPanel
        model={voxyRenderAssetPackDraftModel}
        dataTestId={`account-runtime-linkage-voxy-render-asset-pack-draft-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderProviderSelectionDraftPanel
        model={voxyRenderProviderSelectionDraftModel}
        dataTestId={`account-runtime-linkage-voxy-render-provider-selection-draft-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderHybridRuntimeFoundationPanel
        model={voxyRenderHybridRuntimeFoundationModel}
        dataTestId={`account-runtime-linkage-voxy-hybrid-runtime-foundation-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderRuntimeGoNogoMatrixPanel
        model={voxyRenderRuntimeGoNogoMatrixModel}
        dataTestId={`account-runtime-linkage-voxy-render-runtime-go-nogo-matrix-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderRuntimeEnablementBacklogPanel
        model={voxyRenderRuntimeEnablementBacklogModel}
        dataTestId={`account-runtime-linkage-voxy-render-runtime-enablement-backlog-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderPreviewReviewFlowPanel
        model={voxyRenderPreviewReviewFlowModel}
        dataTestId={`account-runtime-linkage-voxy-render-preview-review-flow-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderPreviewReviewDecisionPersistencePanel
        model={voxyRenderPreviewReviewDecisionPersistenceModel}
        dataTestId={`account-runtime-linkage-voxy-render-preview-review-decision-persistence-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderPreviewOutcomeHandoffPanel
        model={voxyRenderPreviewOutcomeHandoffModel}
        dataTestId={`account-runtime-linkage-voxy-render-preview-outcome-handoff-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderPublishReadinessGuardPanel
        model={voxyRenderPublishReadinessGuardModel}
        dataTestId={`account-runtime-linkage-voxy-render-publish-readiness-guard-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderSocialDistributionHandoffPanel
        model={voxyRenderSocialDistributionHandoffModel}
        dataTestId={`account-runtime-linkage-voxy-render-social-distribution-handoff-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderApprovalSemanticsPanel
        model={voxyRenderApprovalSemanticsModel}
        dataTestId={`account-runtime-linkage-voxy-render-approval-semantics-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderMediaStorageTruthPanel
        model={voxyRenderMediaStorageTruthModel}
        dataTestId={`account-runtime-linkage-voxy-render-media-storage-truth-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderUploadTargetPolicyPanel
        model={voxyRenderUploadTargetPolicyModel}
        dataTestId={`account-runtime-linkage-voxy-render-upload-target-policy-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderSchedulingPolicyPanel
        model={voxyRenderSchedulingPolicyModel}
        dataTestId={`account-runtime-linkage-voxy-render-scheduling-policy-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderRuntimeObservabilityPanel
        model={voxyRenderRuntimeObservabilityModel}
        dataTestId={`account-runtime-linkage-voxy-render-runtime-observability-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderRuntimeCutoverGatePanel
        model={voxyRenderRuntimeCutoverGateModel}
        dataTestId={`account-runtime-linkage-voxy-render-runtime-cutover-gate-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyVideoBriefingFlowMasterClosurePanel
        model={voxyVideoBriefingFlowMasterClosureModel}
        dataTestId={`account-runtime-linkage-voxy-video-briefing-flow-master-closure-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderProviderHandoffPanel
        model={voxyRenderProviderHandoffModel}
        title="Voxy-Render/Provider-Handoff im Account"
        dataTestId={`account-runtime-linkage-voxy-render-provider-handoff-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderPreflightReadinessPanel
        model={voxyRenderPreflightReadinessModel}
        title="Voxy-Render-Preflight im Account"
        dataTestId={`account-runtime-linkage-voxy-render-preflight-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderAssetProviderRegistryPanel
        model={voxyRenderAssetProviderRegistryModel}
        title="Voxy Asset- & Provider-Registry im Account"
        dataTestId={`account-runtime-linkage-voxy-render-registry-${props.linkage.contributionRef.handoffId}`}
      />
      <VoxyRenderAdapterNoopPanel
        model={voxyRenderAdapterNoopModel}
        title="Render-Adapter im Account"
        dataTestId={`account-runtime-linkage-voxy-render-adapter-${props.linkage.contributionRef.handoffId}`}
      />
      <SsotPolicyPanel label={props.ssotLabel} summary={props.ssotSummary} />
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={props.linkage.contributionRef.href}
          className="btn-primary inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold"
        >
          Im Create-Kontext öffnen
        </Link>
        {props.linkage.dossierWorkspaceRef?.href ? (
          <Link
            href={props.linkage.dossierWorkspaceRef.href}
            className="btn-secondary inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold"
          >
            Dossier-Studio öffnen
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function renderUnifiedWorkItem(
  workItem: AccountUnifiedWorkItem,
  onDiscardStartDraft: () => void,
) {
  if (workItem.kind === "runtime_linkage") {
    return (
      <RuntimeLinkageCard
        key={workItem.id}
        linkage={workItem.linkage}
        ssotLabel={workItem.ssotPolicy.label}
        ssotSummary={workItem.ssotPolicy.summary}
      />
    );
  }

  return (
    <ResumeWorkbenchCard
      key={workItem.id}
      item={workItem.item}
      correlation={workItem.correlation}
      ssotLabel={workItem.ssotPolicy.label}
      ssotSummary={workItem.ssotPolicy.summary}
      onDiscard={workItem.item.discardable ? onDiscardStartDraft : undefined}
    />
  );
}

export {
  buildAccountResumeWorkbenchItems,
  clearAccountLocalStartDraftArtifacts,
  resolveAccountResumeHrefFromStartDraft,
};

export default function AccountResumeWorkbenchSection(
  props: AccountResumeWorkbenchSectionProps,
) {
  const [startDraft, setStartDraft] = React.useState<StartDraftContext | null>(
    props.initialStartDraft ?? null,
  );

  React.useEffect(() => {
    if (props.initialStartDraft !== undefined) return;
    setStartDraft(readStartDraftContext());
  }, [props.initialStartDraft]);

  const unifiedItems = React.useMemo(
    () =>
      buildAccountUnifiedWorkItems({
        entries: props.entries,
        startDraft,
        manualAnlassraumServerDrafts: props.manualAnlassraumServerDrafts ?? [],
        canDeepResearch: props.canDeepResearch,
        runtimeLinkages: props.runtimeLinkages ?? [],
      }),
    [
      props.canDeepResearch,
      props.entries,
      props.initialStartDraft,
      props.manualAnlassraumServerDrafts,
      props.runtimeLinkages,
      startDraft,
    ],
  );
  const hasAnyWorkState =
    unifiedItems.length > 0 || (props.savedWorkstates?.length ?? 0) > 0;

  return (
    <section
      className="rounded-[28px] border border-slate-200/80 bg-[color-mix(in_oklab,rgb(var(--card))_96%,rgb(var(--bg))_4%)] px-4 py-4 shadow-sm dark:border-[rgb(var(--border))] dark:bg-[rgb(var(--card))]"
      data-testid="account-resume-workbench"
    >
      {sectionHeading({
        id: "account-resume-workbench",
        title: "Meine Arbeitsstände",
        description:
          "Hier findest du lokale, servergesicherte und verknüpfte Review-/Runtime-Arbeitsstände wieder. Nichts davon ist automatisch veröffentlicht, aktiviert oder freigegeben.",
        icon: FiCompass,
      })}
      {hasAnyWorkState ? (
        <>
          <SavedWorkstateGroups
            records={props.savedWorkstates ?? []}
            canViewInternalSavedWorkstates={Boolean(
              props.canViewInternalSavedWorkstates,
            )}
          />
          {unifiedItems.length > 0 ? (
            <div className="mt-4 grid gap-3 xl:grid-cols-2">
              {unifiedItems.map((workItem) =>
                renderUnifiedWorkItem(workItem, () => {
                  clearAccountLocalStartDraftArtifacts();
                  setStartDraft(null);
                }),
              )}
            </div>
          ) : null}
        </>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300/70 px-4 py-4 text-sm text-[rgb(var(--muted))] dark:border-[rgb(var(--border))]">
          <p className="font-semibold text-[rgb(var(--fg))]">Noch keine offenen Arbeitsstände.</p>
          <p className="mt-2">
            Starte einen neuen Beitrag oder schau dir bestehende Themen an, wenn du direkt
            weiterarbeiten willst.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/start"
              className="btn-primary inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold"
            >
              Neuen Beitrag starten
            </Link>
            <Link
              href="/themen"
              className="btn-secondary inline-flex items-center justify-center rounded-full px-3 py-1.5 text-[11px] font-semibold"
            >
              Themen ansehen
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
