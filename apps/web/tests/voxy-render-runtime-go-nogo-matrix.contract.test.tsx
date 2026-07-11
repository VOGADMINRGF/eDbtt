import * as React from "react";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import VoxyRenderRuntimeGoNogoMatrixPanel from "@/features/create/VoxyRenderRuntimeGoNogoMatrixPanel";
import {
  buildVoxyRenderPreviewOutcomeHandoffCommandFromReadmodels,
} from "@/features/create/voxyRenderPreviewOutcomeHandoffContract";
import {
  buildVoxyRenderPreviewReviewFlowFromReadmodels,
} from "@/features/create/voxyRenderPreviewReviewFlowContract";
import {
  buildVoxyRenderRuntimeGoNogoMatrixFromReadmodels,
  buildVoxyRenderRuntimeGoNogoMatrixPanelModel,
} from "@/features/create/voxyRenderRuntimeGoNogoMatrixContract";

function buildDecisionRecord(overrides?: Record<string, unknown>) {
  return {
    decisionId: "voxy-render-decision:test-1",
    decisionGateId: "voxy-render-review-decision-gate:admin-1",
    selectedDecision: "configure_provider",
    contributionRef: {
      id: "review-item-1",
      title: "Sichere Schulwege",
      href: "/admin/review",
    },
    dossierRef: {
      id: "dossier-1",
      title: "Sichere Schulwege",
      href: "/dossier/demo",
    },
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    ...overrides,
  } as any;
}

function buildLatestPreviewDecisionRecord(overrides?: Record<string, unknown>) {
  return {
    decisionRecordId: "voxy-render-preview-review-decision:1",
    previewReviewFlowId: "voxy-render-preview-review-flow:preview-1",
    decisionGateId: "voxy-render-review-decision-gate:admin-1",
    enablementBacklogId: "voxy-render-runtime-enablement-backlog:preview-1",
    matrixId: "voxy-render-runtime-go-nogo-matrix:preview-1",
    requestDraftId: "voxy-render-request-draft:preview-1",
    renderDecisionId: "voxy-render-decision:test-1",
    scriptRef: { id: "script-1", title: "Voxy Script", href: "/admin/review" },
    contributionRef: { id: "review-item-1", title: "Sichere Schulwege", href: "/admin/review" },
    dossierRef: { id: "dossier-1", title: "Sichere Schulwege", href: "/dossier/demo" },
    reviewerRef: { id: "admin-1", title: "Admin", href: null },
    createdAt: "2026-07-11T10:00:00.000Z",
    updatedAt: "2026-07-11T10:00:00.000Z",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
    decisionType: "request_revision",
    decisionStatus: "persisted_audit_only",
    decisionPayload: {
      reviewerComment: "Revision bleibt audit-only.",
      revisionReason: "Untertitelvorlage fehlt.",
      rejectionReason: null,
      reviewReadyReason: null,
      checklistFindings: ["Untertitelvorlage fehlt."],
      languageNotes: "Quelle und Lesefassung bleiben sichtbar.",
      sourceCaptionNotes: "Caption-Treue bleibt Review-Aufgabe.",
      claimSafetyNotes: "Claim-Sicherheit bleibt manuell.",
      brandNotes: "Brand-Fit bleibt sichtbar.",
      accessibilityNotes: "Barrierefreiheit bleibt offen.",
      legalSafetyNotes: "Rechtliche Sicherheit bleibt Review-Punkt.",
    },
    checklistResults: [],
    decisionEffects: {
      createsRenderJob: false,
      triggersRerender: false,
      triggersProvider: false,
      createsQueueJob: false,
      createsMediaFile: false,
      createsUpload: false,
      triggersPublish: false,
      costDebitAllowed: false,
      creditDebitAllowed: false,
      runtimeClaimAllowed: false,
    },
    executionFlags: {
      previewRendered: false,
      renderAllowed: false,
      rerenderAllowed: false,
      queueAllowed: false,
      workerAllowed: false,
      providerExecutionAllowed: false,
      secretsAccessed: false,
      mediaFileCreationAllowed: false,
      previewFileAvailable: false,
      uploadAllowed: false,
      publishAllowed: false,
      socialPostAllowed: false,
      schedulingAllowed: false,
      runtimeClaimAllowed: false,
    },
    nextStep: "Asset-Revision vorbereiten.",
    userVisibleSummary: "Revision bleibt audit-only.",
    reviewerVisibleSummary: "Revision bleibt audit-only.",
    previewReviewStatusHint: "needs_preview_asset",
    persistedAt: "2026-07-11T10:00:00.000Z",
    persistedBy: "admin-1",
    idempotencyKey: "decision-idempotency-1",
    previousDecisionRecordRef: null,
    supersedesDecisionRecordRef: null,
    decisionVersion: 1,
    ...overrides,
  } as any;
}

function buildGateFixture(overrides?: Record<string, unknown>) {
  return {
    decisionGateId: "voxy-render-review-decision-gate:admin-1",
    decisionStatus: "decision_preview",
    reviewGates: [
      { id: "scriptReview", status: "ready", statusLabel: "Bereit", reason: "Bereit." },
      { id: "sourceReview", status: "ready", statusLabel: "Bereit", reason: "Bereit." },
      { id: "factcheckReview", status: "ready", statusLabel: "Bereit", reason: "Bereit." },
      { id: "languageReview", status: "ready", statusLabel: "Bereit", reason: "Bereit." },
      { id: "brandReview", status: "ready", statusLabel: "Bereit", reason: "Bereit." },
      { id: "assetReview", status: "ready", statusLabel: "Bereit", reason: "Bereit." },
      { id: "providerReview", status: "ready", statusLabel: "Bereit", reason: "Bereit." },
      { id: "costReview", status: "ready", statusLabel: "Bereit", reason: "Bereit." },
      { id: "publishingReview", status: "ready", statusLabel: "Bereit", reason: "Bereit." },
    ],
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    rtlDecisionHint: null,
    publicSafeLabel: "Kein Publish in diesem Slice",
    reviewerVisibleReason: "Review ist sichtbar.",
    userVisibleReason: "Review ist sichtbar.",
    ...overrides,
  } as any;
}

function buildRequestDraft(overrides?: Record<string, unknown>) {
  return {
    requestDraftId: "voxy-render-request-draft:preview-1",
    decisionId: "voxy-render-decision:test-1",
    decisionGateId: "voxy-render-review-decision-gate:admin-1",
    contributionRef: {
      id: "review-item-1",
      title: "Sichere Schulwege",
      href: "/admin/review",
    },
    dossierRef: {
      id: "dossier-1",
      title: "Sichere Schulwege",
      href: "/dossier/demo",
    },
    handoffRef: null,
    preflightRef: null,
    registryRef: null,
    adapterRef: null,
    scriptRef: null,
    videoFormat: "briefing_video",
    requestStatus: "draft_only",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
    ...overrides,
  } as any;
}

function buildQueuePreview(overrides?: Record<string, unknown>) {
  return {
    queuePreviewId: "voxy-render-queue-preview:preview-1",
    requestDraftId: "voxy-render-request-draft:preview-1",
    decisionId: "voxy-render-decision:test-1",
    decisionGateId: "voxy-render-review-decision-gate:admin-1",
    queueStatus: "queue_contract_only",
    reviewerVisibleReason: "Queue bleibt disabled.",
    userVisibleReason: "Queue bleibt disabled.",
    videoFormat: "briefing_video",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
    ...overrides,
  } as any;
}

function buildCostPolicyPreview(overrides?: Record<string, unknown>) {
  return {
    policyPreviewId: "voxy-render-cost-credit-policy:preview-1",
    queuePreviewId: "voxy-render-queue-preview:preview-1",
    requestDraftId: "voxy-render-request-draft:preview-1",
    decisionId: "voxy-render-decision:test-1",
    decisionGateId: "voxy-render-review-decision-gate:admin-1",
    policyStatus: "policy_preview_only",
    providerPricingStatus: "available",
    estimatedCostAmount: 42,
    reviewerVisibleReason: "Pricing ist nur Preview.",
    userVisibleReason: "Pricing ist nur Preview.",
    videoFormat: "briefing_video",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
    ...overrides,
  } as any;
}

function buildAssetPackDraft(overrides?: Record<string, unknown>) {
  return {
    assetPackDraftId: "voxy-render-asset-pack-draft:preview-1",
    requestDraftId: "voxy-render-request-draft:preview-1",
    queuePreviewId: "voxy-render-queue-preview:preview-1",
    costPolicyPreviewId: "voxy-render-cost-credit-policy:preview-1",
    decisionId: "voxy-render-decision:test-1",
    decisionGateId: "voxy-render-review-decision-gate:admin-1",
    assetPackStatus: "asset_pack_draft_only",
    userVisibleReason: "Asset-Pack bleibt Preview.",
    reviewerVisibleReason: "Asset-Pack bleibt Preview.",
    assetEntries: [
      { assetKey: "brand_logo", status: "available" },
      { assetKey: "subtitle_template", status: "available" },
      { assetKey: "lower_third_template", status: "available" },
      { assetKey: "source_caption_template", status: "available" },
      { assetKey: "export_preset", status: "available" },
    ],
    videoFormat: "briefing_video",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
    ...overrides,
  } as any;
}

function buildProviderSelectionDraft(overrides?: Record<string, unknown>) {
  return {
    providerSelectionDraftId: "voxy-render-provider-selection-draft:preview-1",
    assetPackDraftId: "voxy-render-asset-pack-draft:preview-1",
    costPolicyPreviewId: "voxy-render-cost-credit-policy:preview-1",
    queuePreviewId: "voxy-render-queue-preview:preview-1",
    requestDraftId: "voxy-render-request-draft:preview-1",
    decisionId: "voxy-render-decision:test-1",
    decisionGateId: "voxy-render-review-decision-gate:admin-1",
    providerSelectionStatus: "provider_selection_draft_only",
    candidates: [
      {
        candidateId: "candidate-1",
        label: "Avatar-Video & Render",
        status: "needs_review",
        providerName: "review-provider",
        missingCapabilities: [],
      },
    ],
    decision: {
      reviewerVisibleReason: "Provider bleibt Preview.",
      userVisibleReason: "Provider bleibt Preview.",
    },
    videoFormat: "briefing_video",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
    ...overrides,
  } as any;
}

function buildAdapterModel(overrides?: Record<string, unknown>) {
  return {
    adapterStatus: "noop_preview",
    providerGateItems: [
      { id: "provider_contract", status: "ready" },
      { id: "provider_configuration", status: "ready" },
      { id: "secret_runtime_truth", status: "ready" },
      { id: "render_queue_runtime", status: "ready" },
    ],
    ...overrides,
  } as any;
}

function buildPreview(overrides?: {
  requestDraft?: any | null;
  queuePreview?: any | null;
  costPolicyPreview?: any | null;
  assetPackDraft?: any | null;
  providerSelectionDraft?: any | null;
  latestDecisionRecord?: any | null;
  gate?: any | null;
  preflightModel?: any | null;
  adapterModel?: any | null;
}) {
  return buildVoxyRenderRuntimeGoNogoMatrixFromReadmodels({
    surface: "admin",
    requestDraft: overrides?.requestDraft === undefined ? buildRequestDraft() : overrides.requestDraft,
    queuePreview: overrides?.queuePreview === undefined ? buildQueuePreview() : overrides.queuePreview,
    costPolicyPreview:
      overrides?.costPolicyPreview === undefined
        ? buildCostPolicyPreview()
        : overrides.costPolicyPreview,
    assetPackDraft:
      overrides?.assetPackDraft === undefined ? buildAssetPackDraft() : overrides.assetPackDraft,
    providerSelectionDraft:
      overrides?.providerSelectionDraft === undefined
        ? buildProviderSelectionDraft()
        : overrides.providerSelectionDraft,
    latestDecisionRecord:
      overrides?.latestDecisionRecord === undefined
        ? buildDecisionRecord()
        : overrides.latestDecisionRecord,
    gate: overrides?.gate === undefined ? buildGateFixture() : overrides.gate,
    preflightModel:
      overrides?.preflightModel === undefined
        ? { preflightStatus: "needs_review", handoffRef: { id: "handoff-1" } }
        : overrides.preflightModel,
    adapterModel:
      overrides?.adapterModel === undefined ? buildAdapterModel() : overrides.adapterModel,
  });
}

describe("voxy render runtime go/no-go matrix", () => {
  it("marks missing request draft as runtime no-go with a review blocker", () => {
    const preview = buildPreview({ requestDraft: null });

    expect(preview.matrixStatus).toBe("blocked_by_review");
    expect(preview.reviewGate.status).toBe("no_go");
    expect(preview.overallDecision).toBe("review_needed");
    expect(preview.execution.renderAllowed).toBe(false);
  });

  it("keeps explicit script-only paths as keep_as_script_only", () => {
    const preview = buildPreview({
      requestDraft: buildRequestDraft({ requestStatus: "keep_as_script_only" }),
    });

    expect(preview.matrixStatus).toBe("keep_as_script_only");
    expect(preview.overallDecision).toBe("keep_as_script_only");
    expect(preview.reviewGate.nextAction).toBe("keep_as_script_only");
  });

  it("blocks provider readiness when configuration or capability truth is missing", () => {
    const preview = buildPreview({
      providerSelectionDraft: buildProviderSelectionDraft({
        providerSelectionStatus: "needs_provider_configuration",
        candidates: [
          {
            candidateId: "candidate-1",
            label: "Avatar-Video & Render",
            status: "configuration_needed",
            providerName: null,
            missingCapabilities: ["avatar_video"],
          },
        ],
      }),
    });

    expect(preview.matrixStatus).toBe("blocked_by_provider");
    expect(preview.providerGate.status).toBe("no_go");
  });

  it("blocks assets when required templates are still missing", () => {
    const preview = buildPreview({
      assetPackDraft: buildAssetPackDraft({
        assetPackStatus: "needs_subtitle_template",
        assetEntries: [{ assetKey: "subtitle_template", status: "missing" }],
        userVisibleReason: "Untertitelvorlage fehlt.",
        reviewerVisibleReason: "Untertitelvorlage fehlt.",
      }),
    });

    expect(preview.matrixStatus).toBe("blocked_by_assets");
    expect(preview.assetGate.status).toBe("no_go");
  });

  it("shows language no-go for RTL or cross-lingual gaps", () => {
    const preview = buildPreview({
      requestDraft: buildRequestDraft({
        sourceLanguage: "ar",
        readingLanguage: "de",
        scriptLanguage: "ar",
        renderLanguage: "ar",
        subtitleLanguage: "ar",
        rtlRequired: true,
      }),
      providerSelectionDraft: buildProviderSelectionDraft({
        sourceLanguage: "ar",
        readingLanguage: "de",
        scriptLanguage: "ar",
        renderLanguage: "ar",
        subtitleLanguage: "ar",
        rtlRequired: true,
        providerSelectionStatus: "needs_subtitle_capability",
      }),
      gate: buildGateFixture({
        sourceLanguage: "ar",
        readingLanguage: "de",
        scriptLanguage: "ar",
        renderLanguage: "ar",
        subtitleLanguage: "ar",
        rtlDecisionHint: "RTL nötig",
      }),
    });

    expect(preview.matrixStatus).toBe("blocked_by_language");
    expect(preview.languageGate.status).toBe("no_go");
  });

  it("keeps a formally prepared preview at runtime_not_available while queue and runtime stay disabled", () => {
    const preview = buildPreview();

    expect(preview.reviewGate.status).toBe("go");
    expect(preview.providerGate.status).toBe("warning");
    expect(preview.assetGate.status).toBe("warning");
    expect(preview.costCreditGate.status).toBe("warning");
    expect(preview.queueGate.status).toBe("no_go");
    expect(preview.runtimeGate.status).toBe("no_go");
    expect(preview.matrixStatus).toBe("runtime_no_go");
    expect(preview.overallDecision).toBe("runtime_not_available");
  });

  it("feeds asset blockers into the outcome handoff as an asset revision candidate", () => {
    const matrix = buildPreview({
      assetPackDraft: buildAssetPackDraft({
        assetPackStatus: "needs_subtitle_template",
        assetEntries: [{ assetKey: "subtitle_template", status: "missing" }],
        userVisibleReason: "Untertitelvorlage fehlt.",
        reviewerVisibleReason: "Untertitelvorlage fehlt.",
      }),
    });
    const previewFlow = buildVoxyRenderPreviewReviewFlowFromReadmodels({
      surface: "admin",
      backlog: {
        backlogId: "voxy-render-runtime-enablement-backlog:preview-1",
        matrixId: matrix.matrixId,
        providerSelectionDraftId: matrix.providerSelectionDraftId,
        assetPackDraftId: matrix.assetPackDraftId,
        costPolicyPreviewId: matrix.costPolicyPreviewId,
        queuePreviewId: matrix.queuePreviewId,
        requestDraftId: matrix.requestDraftId,
        decisionId: matrix.decisionId,
        decisionGateId: matrix.decisionGateId,
        scriptRef: matrix.scriptRef,
        contributionRef: matrix.contributionRef,
        dossierRef: matrix.dossierRef,
        videoFormat: "briefing_video",
        sourceLanguage: "de",
        readingLanguage: "de",
        scriptLanguage: "de",
        renderLanguage: "de",
        subtitleLanguage: "de",
        originalPreserved: true,
        translationIsEvidence: false,
        rtlRequired: false,
        surface: "admin",
        backlogStatus: "runtime_planning_only",
        items: [],
        topP0Items: ["Untertitelvorlage fehlt."],
        nextRecommendedAction: "prepare_runtime_enablement",
        reviewerVisibleSummary: "Noch kein Preview und keine Runtime.",
        userVisibleSummary: "Es werden nur spätere Aufgaben gesammelt.",
        execution: {
          runtimeEnabled: false,
          renderAllowed: false,
          queueAllowed: false,
          workerAllowed: false,
          providerExecutionAllowed: false,
          secretsAccessed: false,
          mediaFileCreationAllowed: false,
          costDebitAllowed: false,
          creditDebitAllowed: false,
          uploadAllowed: false,
          publishAllowed: false,
          socialPostAllowed: false,
          schedulingAllowed: false,
          runtimeClaimAllowed: false,
        },
        persistedAt: null,
        persistedBy: null,
        idempotencyKey: null,
        previousBacklogRef: null,
        supersedesBacklogRef: null,
        backlogVersion: null,
      } as any,
      matrix,
    });
    const outcomeCommand = buildVoxyRenderPreviewOutcomeHandoffCommandFromReadmodels({
      previewFlow,
      latestPreviewReviewDecisionRecord: buildLatestPreviewDecisionRecord(),
      latestMatrix: matrix,
    });

    expect(outcomeCommand.downstreamTarget).toBe("asset_revision");
    expect(outcomeCommand.handoffEffects.createsAssetRevisionTask).toBe(true);
    expect(outcomeCommand.handoffEffects.triggersRerender).toBe(false);
  });

  it("renders a human-readable panel without raw enum leakage", () => {
    const preview = buildPreview();
    const html = renderToStaticMarkup(
      <VoxyRenderRuntimeGoNogoMatrixPanel
        model={buildVoxyRenderRuntimeGoNogoMatrixPanelModel({ preview })}
      />,
    );

    expect(html).toContain("Runtime Go/No-Go");
    expect(html).toContain("Noch kein Render");
    expect(html).toContain("Keine Queue");
    expect(html).toContain("Keine Veröffentlichung");
    expect(html).not.toContain("runtime_no_go");
    expect(html).not.toContain("blocked_by_provider");
  });
});
