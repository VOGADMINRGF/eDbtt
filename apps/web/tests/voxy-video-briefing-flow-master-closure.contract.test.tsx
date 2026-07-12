import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import VoxyVideoBriefingFlowMasterClosurePanel from "@/features/create/VoxyVideoBriefingFlowMasterClosurePanel";
import {
  buildVoxyVideoBriefingFlowMasterClosureCommandFromReadmodels,
  buildVoxyVideoBriefingFlowMasterClosurePanelModel,
} from "@/features/create/voxyVideoBriefingFlowMasterClosureContract";

function buildScriptCandidate(overrides?: Record<string, unknown>) {
  return {
    title: "Voxy-Briefing",
    summary: "Script-Kandidat, noch kein Video",
    surface: "admin",
    contributionRef: { id: "review-1", title: "Sichere Schulwege", href: "/admin/review" },
    dossierRef: { id: "dossier-1", title: "Sichere Schulwege", href: "/dossier/demo" },
    participationRef: null,
    pollRef: null,
    outputRef: { id: "output-1", title: "Output", href: "/admin/review" },
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    languageLabel: "Deutsch",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlDisplayHint: false,
    scriptStatus: "script_preview",
    scriptStatusLabel: "Script-Vorschau",
    scriptFormat: "short_briefing",
    scriptFormatLabel: "Kurzes Briefing",
    scriptSegments: [],
    scriptDraft: {
      title: "Sichere Schulwege",
      intro: "Kurzfassung",
      segments: [],
      estimatedDurationSeconds: 45,
      publicSafeLabel: "Review-first",
    },
    scriptRisks: [],
    readinessSignals: [],
    downstreamReadiness: [],
    nextScriptDecision: {
      id: "prepare_render_handoff",
      label: "Render-Handoff vorbereiten",
      reason: "Das Script ist als Vorschau vorhanden.",
    },
    publicSafeLabel: "Review-first",
    userVisibleReason: "Script vorhanden.",
    reviewerVisibleReason: "Script vorhanden.",
    nextStep: "Render-Handoff vorbereiten",
    reviewRequired: true,
    noRenderAction: true,
    noPublishAction: true,
    noSocialPostAction: true,
    noRuntimeClaim: true,
    ...overrides,
  } as any;
}

function buildPreviewReviewFlow(overrides?: Record<string, unknown>) {
  return {
    previewReviewFlowId: "voxy-render-preview-review-flow:1",
    createdAt: "2026-07-12T12:00:00.000Z",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    previewStatus: "review_ready_only",
    ...overrides,
  } as any;
}

function buildPreviewOutcome(overrides?: Record<string, unknown>) {
  return {
    outcomeHandoffId: "voxy-render-preview-outcome-handoff:1",
    previewReviewFlowId: "voxy-render-preview-review-flow:1",
    handoffStatus: "preview_outcome_only",
    ...overrides,
  } as any;
}

function buildPublishReadiness(overrides?: Record<string, unknown>) {
  return {
    publishReadinessGuardId: "voxy-render-publish-readiness-guard:1",
    previewOutcomeHandoffId: "voxy-render-preview-outcome-handoff:1",
    previewReviewFlowId: "voxy-render-preview-review-flow:1",
    guardStatus: "review_ready_only",
    ...overrides,
  } as any;
}

function buildSocialDistribution(overrides?: Record<string, unknown>) {
  return {
    socialDistributionHandoffId: "voxy-render-social-distribution-handoff:1",
    publishReadinessGuardId: "voxy-render-publish-readiness-guard:1",
    previewOutcomeHandoffId: "voxy-render-preview-outcome-handoff:1",
    previewReviewFlowId: "voxy-render-preview-review-flow:1",
    handoffStatus: "handoff_only",
    ...overrides,
  } as any;
}

function buildApproval(overrides?: Record<string, unknown>) {
  return {
    approvalSemanticsId: "voxy-render-approval-semantics:1",
    previewReviewFlowId: "voxy-render-preview-review-flow:1",
    createdAt: "2026-07-12T12:00:00.000Z",
    approvalStatus: "approval_required",
    ...overrides,
  } as any;
}

function buildMediaTruth(overrides?: Record<string, unknown>) {
  return {
    mediaStorageTruthId: "voxy-render-media-storage-truth:1",
    previewReviewFlowId: "voxy-render-preview-review-flow:1",
    createdAt: "2026-07-12T12:00:00.000Z",
    mediaStorageTruthStatus: "media_storage_truth_only",
    ...overrides,
  } as any;
}

function buildUploadPolicy(overrides?: Record<string, unknown>) {
  return {
    uploadTargetPolicyId: "voxy-render-upload-target-policy:1",
    previewReviewFlowId: "voxy-render-preview-review-flow:1",
    createdAt: "2026-07-12T12:00:00.000Z",
    uploadTargetPolicyStatus: "access_policy_needed",
    ...overrides,
  } as any;
}

function buildSchedulingPolicy(overrides?: Record<string, unknown>) {
  return {
    schedulingPolicyId: "voxy-render-scheduling-policy:1",
    previewReviewFlowId: "voxy-render-preview-review-flow:1",
    createdAt: "2026-07-12T12:00:00.000Z",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    schedulingPolicyStatus: "scheduler_runtime_needed",
    ...overrides,
  } as any;
}

function buildRuntimeObservability(overrides?: Record<string, unknown>) {
  return {
    runtimeObservabilityId: "voxy-render-runtime-observability:1",
    previewReviewFlowId: "voxy-render-preview-review-flow:1",
    createdAt: "2026-07-12T12:00:00.000Z",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    runtimeObservabilityStatus: "monitoring_provider_needed",
    ...overrides,
  } as any;
}

function buildRuntimeCutover(overrides?: Record<string, unknown>) {
  return {
    runtimeCutoverGateId: "voxy-render-runtime-cutover-gate:1",
    previewReviewFlowId: "voxy-render-preview-review-flow:1",
    runtimeObservabilityId: "voxy-render-runtime-observability:1",
    createdAt: "2026-07-12T12:00:00.000Z",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    rtlRequired: false,
    runtimeCutoverGateStatus: "feature_flag_policy_needed",
    ...overrides,
  } as any;
}

function buildRequestDraft(overrides?: Record<string, unknown>) {
  return {
    requestDraftId: "voxy-render-request-draft:1",
    ...overrides,
  } as any;
}

function buildProviderSelection(overrides?: Record<string, unknown>) {
  return {
    providerSelectionDraftId: "voxy-render-provider-selection-draft:1",
    ...overrides,
  } as any;
}

function buildAssetPack(overrides?: Record<string, unknown>) {
  return {
    assetPackDraftId: "voxy-render-asset-pack-draft:1",
    ...overrides,
  } as any;
}

function buildQueuePreview(overrides?: Record<string, unknown>) {
  return {
    queuePreviewId: "voxy-render-queue-preview:1",
    ...overrides,
  } as any;
}

function buildCostPolicy(overrides?: Record<string, unknown>) {
  return {
    policyPreviewId: "voxy-render-cost-credit-policy:1",
    ...overrides,
  } as any;
}

function buildCompleteInput() {
  return {
    latestScriptCandidate: buildScriptCandidate(),
    latestPreviewReviewFlowRecord: buildPreviewReviewFlow(),
    latestPreviewOutcomeHandoffRecord: buildPreviewOutcome(),
    latestPublishReadinessGuardRecord: buildPublishReadiness(),
    latestSocialDistributionHandoffRecord: buildSocialDistribution(),
    latestApprovalSemanticsRecord: buildApproval(),
    latestMediaStorageTruthRecord: buildMediaTruth(),
    latestUploadTargetPolicyRecord: buildUploadPolicy(),
    latestSchedulingPolicyRecord: buildSchedulingPolicy(),
    latestRuntimeObservabilityRecord: buildRuntimeObservability(),
    latestRuntimeCutoverGateRecord: buildRuntimeCutover(),
    latestRequestDraft: buildRequestDraft(),
    latestProviderSelectionDraft: buildProviderSelection(),
    latestAssetPackDraft: buildAssetPack(),
    latestQueueContract: buildQueuePreview(),
    latestCostCreditPolicy: buildCostPolicy(),
  };
}

describe("voxy video briefing flow master closure contract", () => {
  it("blocks when the runtime cutover gate is missing", () => {
    const command = buildVoxyVideoBriefingFlowMasterClosureCommandFromReadmodels({
      ...buildCompleteInput(),
      latestRuntimeCutoverGateRecord: null,
    });

    expect(command).toMatchObject({
      masterStatus: "blocked_by_missing_cutover_gate",
      nextStep: "decide_runtime_path",
      runtimeCutoverGateId: null,
    });
  });

  it("blocks when runtime observability is missing", () => {
    const command = buildVoxyVideoBriefingFlowMasterClosureCommandFromReadmodels({
      ...buildCompleteInput(),
      latestRuntimeObservabilityRecord: null,
      latestRuntimeCutoverGateRecord: null,
    });

    expect(command).toMatchObject({
      masterStatus: "blocked_by_missing_observability",
      nextStep: "configure_monitoring_runtime",
      runtimeObservabilityId: null,
    });
  });

  it("blocks when scheduling policy is missing", () => {
    const command = buildVoxyVideoBriefingFlowMasterClosureCommandFromReadmodels({
      ...buildCompleteInput(),
      latestSchedulingPolicyRecord: null,
      latestRuntimeObservabilityRecord: null,
      latestRuntimeCutoverGateRecord: null,
    });

    expect(command).toMatchObject({
      masterStatus: "blocked_by_missing_scheduling_policy",
      schedulingPolicyId: null,
    });
  });

  it("blocks when upload policy is missing", () => {
    const command = buildVoxyVideoBriefingFlowMasterClosureCommandFromReadmodels({
      ...buildCompleteInput(),
      latestUploadTargetPolicyRecord: null,
      latestSchedulingPolicyRecord: null,
      latestRuntimeObservabilityRecord: null,
      latestRuntimeCutoverGateRecord: null,
    });

    expect(command).toMatchObject({
      masterStatus: "blocked_by_missing_upload_policy",
      uploadTargetPolicyId: null,
    });
  });

  it("blocks when media truth is missing", () => {
    const command = buildVoxyVideoBriefingFlowMasterClosureCommandFromReadmodels({
      ...buildCompleteInput(),
      latestMediaStorageTruthRecord: null,
      latestUploadTargetPolicyRecord: null,
      latestSchedulingPolicyRecord: null,
      latestRuntimeObservabilityRecord: null,
      latestRuntimeCutoverGateRecord: null,
    });

    expect(command).toMatchObject({
      masterStatus: "blocked_by_missing_media_truth",
      mediaStorageTruthId: null,
    });
  });

  it("blocks when approval semantics are missing", () => {
    const command = buildVoxyVideoBriefingFlowMasterClosureCommandFromReadmodels({
      ...buildCompleteInput(),
      latestApprovalSemanticsRecord: null,
      latestMediaStorageTruthRecord: null,
      latestUploadTargetPolicyRecord: null,
      latestSchedulingPolicyRecord: null,
      latestRuntimeObservabilityRecord: null,
      latestRuntimeCutoverGateRecord: null,
    });

    expect(command).toMatchObject({
      masterStatus: "blocked_by_missing_approval_semantics",
      approvalSemanticsId: null,
    });
  });

  it("builds a complete review-first architecture that stays runtime-pending", () => {
    const command = buildVoxyVideoBriefingFlowMasterClosureCommandFromReadmodels(
      buildCompleteInput(),
    );

    expect(command).toMatchObject({
      masterStatus: "review_first_architecture_complete",
      semantics: {
        reviewFirstArchitectureComplete: true,
        runtimePending: true,
        runtimeEnabled: false,
        previewRendered: false,
        mediaFileAvailable: false,
        uploaded: false,
        scheduled: false,
        socialPosted: false,
        published: false,
      },
      nextStep: "decide_runtime_path",
    });
    expect(command.executionFlags).toEqual(
      expect.objectContaining({
        runtimeExecutionAllowed: false,
        providerExecutionAllowed: false,
        queueAllowed: false,
        workerAllowed: false,
        uploadAllowed: false,
        publishAllowed: false,
        renderAllowed: false,
        secretsAccessed: false,
        costDebitAllowed: false,
      }),
    );
    expect(Object.values(command.executionFlags).every((value) => value === false)).toBe(true);
  });

  it("renders a humanized master-closure panel without raw enum leakage", () => {
    const model = buildVoxyVideoBriefingFlowMasterClosurePanelModel(buildCompleteInput());

    const html = renderToStaticMarkup(
      <VoxyVideoBriefingFlowMasterClosurePanel
        model={model}
        dataTestId="voxy-video-briefing-flow-master-closure"
      />,
    );

    expect(html).toContain("Voxy Video Briefing Flow");
    expect(html).toContain("Review-first Architektur geschlossen");
    expect(html).toContain("Runtime noch nicht aktiviert");
    expect(html).toContain("Keine Videodatei");
    expect(html).toContain("Kein Upload");
    expect(html).toContain("Kein Scheduling");
    expect(html).toContain("Kein Publish");
    expect(html).toContain("Nächster Schritt: Runtime-Pfad entscheiden");
    expect(html).not.toContain("review_first_architecture_complete");
    expect(html).not.toContain("runtime_pending");
  });
});
