import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import VoxyRenderRuntimeCutoverGatePanel from "@/features/create/VoxyRenderRuntimeCutoverGatePanel";
import {
  buildVoxyRenderRuntimeCutoverGateCommandFromReadmodels,
  buildVoxyRenderRuntimeCutoverGatePanelModel,
} from "@/features/create/voxyRenderRuntimeCutoverGateContract";

function buildRuntimeObservability(overrides?: Record<string, unknown>) {
  return {
    runtimeObservabilityId: "voxy-render-runtime-observability:1",
    schedulingPolicyId: "voxy-render-scheduling-policy:1",
    uploadTargetPolicyId: "voxy-render-upload-target-policy:1",
    mediaStorageTruthId: "voxy-render-media-storage-truth:1",
    approvalSemanticsId: "voxy-render-approval-semantics:1",
    socialDistributionHandoffId: "voxy-render-social-distribution-handoff:1",
    publishReadinessGuardId: "voxy-render-publish-readiness-guard:1",
    enablementBacklogId: "voxy-render-runtime-enablement-backlog:1",
    matrixId: "voxy-render-runtime-go-nogo-matrix:1",
    requestDraftId: "voxy-render-request-draft:1",
    previewReviewFlowId: "voxy-render-preview-review-flow:1",
    scriptRef: { id: "script-1", title: "Voxy Script", href: "/admin/review" },
    contributionRef: { id: "review-1", title: "Sichere Schulwege", href: "/admin/review" },
    dossierRef: { id: "dossier-1", title: "Sichere Schulwege", href: "/dossier/demo" },
    reviewerRef: null,
    createdAt: "2026-07-12T12:00:00.000Z",
    updatedAt: null,
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
    runtimeObservabilityStatus: "monitoring_provider_needed",
    ...overrides,
  } as any;
}

function buildSchedulingPolicy(overrides?: Record<string, unknown>) {
  return {
    schedulingPolicyId: "voxy-render-scheduling-policy:1",
    uploadTargetPolicyId: "voxy-render-upload-target-policy:1",
    mediaStorageTruthId: "voxy-render-media-storage-truth:1",
    approvalSemanticsId: "voxy-render-approval-semantics:1",
    socialDistributionHandoffId: "voxy-render-social-distribution-handoff:1",
    publishReadinessGuardId: "voxy-render-publish-readiness-guard:1",
    previewReviewFlowId: "voxy-render-preview-review-flow:1",
    enablementBacklogId: "voxy-render-runtime-enablement-backlog:1",
    matrixId: "voxy-render-runtime-go-nogo-matrix:1",
    requestDraftId: "voxy-render-request-draft:1",
    scriptRef: { id: "script-1", title: "Voxy Script", href: "/admin/review" },
    contributionRef: { id: "review-1", title: "Sichere Schulwege", href: "/admin/review" },
    dossierRef: { id: "dossier-1", title: "Sichere Schulwege", href: "/dossier/demo" },
    reviewerRef: null,
    createdAt: "2026-07-12T12:00:00.000Z",
    updatedAt: null,
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
    schedulingPolicyStatus: "scheduler_runtime_needed",
    ...overrides,
  } as any;
}

function buildUploadTargetPolicy(overrides?: Record<string, unknown>) {
  return {
    uploadTargetPolicyId: "voxy-render-upload-target-policy:1",
    uploadTargetPolicyStatus: "access_policy_needed",
    ...overrides,
  } as any;
}

function buildMediaStorageTruth(overrides?: Record<string, unknown>) {
  return {
    mediaStorageTruthId: "voxy-render-media-storage-truth:1",
    mediaStorageTruthStatus: "media_storage_truth_only",
    mediaSemantics: {
      mediaCandidate: true,
      mediaFileAvailable: true,
      previewFileAvailable: false,
      thumbnailAvailable: false,
      subtitleFileAvailable: false,
      sourceCaptionFileAvailable: false,
      storageWriteAllowed: false,
      uploadAllowed: false,
      published: false,
      socialPosted: false,
      scheduled: false,
    },
    ...overrides,
  } as any;
}

function buildProviderSelection(overrides?: Record<string, unknown>) {
  return {
    providerSelectionDraftId: "voxy-render-provider-selection-draft:1",
    providerSelectionStatus: "noop_provider_selection",
    ...overrides,
  } as any;
}

function buildQueueContract(overrides?: Record<string, unknown>) {
  return {
    queuePreviewId: "voxy-render-queue-preview:1",
    queueStatus: "queue_contract_only",
    ...overrides,
  } as any;
}

function buildCostPolicy(overrides?: Record<string, unknown>) {
  return {
    policyPreviewId: "voxy-render-cost-credit-policy:1",
    policyStatus: "needs_runtime_metering",
    ...overrides,
  } as any;
}

describe("voxy render runtime cutover gate contract", () => {
  it("blocks when runtime observability is missing", () => {
    const command = buildVoxyRenderRuntimeCutoverGateCommandFromReadmodels({
      latestRuntimeObservabilityRecord: null,
      latestSchedulingPolicyRecord: buildSchedulingPolicy(),
      latestUploadTargetPolicyRecord: buildUploadTargetPolicy(),
      latestMediaStorageTruthRecord: buildMediaStorageTruth(),
    });

    expect(command).toMatchObject({
      runtimeCutoverGateStatus: "blocked_by_missing_observability",
      nextStep: "blocked",
      runtimeObservabilityId: null,
    });
  });

  it("keeps script-only flows out of runtime cutover", () => {
    const command = buildVoxyRenderRuntimeCutoverGateCommandFromReadmodels({
      latestRuntimeObservabilityRecord: buildRuntimeObservability({
        runtimeObservabilityStatus: "keep_as_script_only",
      }),
      latestSchedulingPolicyRecord: buildSchedulingPolicy({
        schedulingPolicyStatus: "keep_as_script_only",
      }),
      latestUploadTargetPolicyRecord: buildUploadTargetPolicy(),
      latestMediaStorageTruthRecord: buildMediaStorageTruth(),
    });

    expect(command).toMatchObject({
      runtimeCutoverGateStatus: "keep_as_script_only",
      cutoverCandidate: {
        status: "not_applicable",
        runtimeEnabled: false,
        featureFlagEnabled: false,
      },
      semantics: {
        runtimeEnabled: false,
        providerRuntimeEnabled: false,
        publishAllowed: false,
      },
    });
  });

  it("keeps missing media files separate from runtime cutover", () => {
    const command = buildVoxyRenderRuntimeCutoverGateCommandFromReadmodels({
      latestRuntimeObservabilityRecord: buildRuntimeObservability(),
      latestSchedulingPolicyRecord: buildSchedulingPolicy(),
      latestUploadTargetPolicyRecord: buildUploadTargetPolicy(),
      latestMediaStorageTruthRecord: buildMediaStorageTruth({
        mediaSemantics: {
          mediaCandidate: true,
          mediaFileAvailable: false,
          previewFileAvailable: false,
          thumbnailAvailable: false,
          subtitleFileAvailable: false,
          sourceCaptionFileAvailable: false,
          storageWriteAllowed: false,
          uploadAllowed: false,
          published: false,
          socialPosted: false,
          scheduled: false,
        },
      }),
    });

    expect(command).toMatchObject({
      runtimeCutoverGateStatus: "blocked_by_missing_media_file",
      nextStep: "require_real_media_file",
      executionFlags: {
        runtimeExecutionAllowed: false,
        uploadAllowed: false,
        publishAllowed: false,
      },
    });
    expect(command.gates.find((gate) => gate.gateKey === "mediaStorageGate")).toMatchObject({
      status: "blocked",
      executionAllowed: false,
    });
  });

  it("renders an honest runtime cutover panel without fake enablement claims", () => {
    const model = buildVoxyRenderRuntimeCutoverGatePanelModel({
      latestRuntimeObservabilityRecord: buildRuntimeObservability(),
      latestSchedulingPolicyRecord: buildSchedulingPolicy(),
      latestUploadTargetPolicyRecord: buildUploadTargetPolicy(),
      latestMediaStorageTruthRecord: buildMediaStorageTruth(),
      latestProviderSelectionDraft: buildProviderSelection(),
      latestQueueContract: buildQueueContract(),
      latestCostCreditPolicy: buildCostPolicy(),
    });

    const html = renderToStaticMarkup(
      <VoxyRenderRuntimeCutoverGatePanel model={model} dataTestId="runtime-cutover-gate" />,
    );

    expect(html).toContain("Runtime Cutover Gate");
    expect(html).toContain("Runtime noch nicht aktiviert");
    expect(html).toContain("Feature Flag nicht aktiviert");
    expect(html).toContain("Provider nicht ausgeführt");
    expect(html).toContain("Kein Worker gestartet");
    expect(html).toContain("Kein Upload erlaubt");
    expect(html).toContain("Kein Publish erlaubt");
    expect(html).not.toContain("Feature Flag aktivieren");
    expect(html).not.toContain("Worker starten");
  });
});
