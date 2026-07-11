import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import VoxyRenderPreviewReviewFlowPanel from "@/features/create/VoxyRenderPreviewReviewFlowPanel";
import {
  buildVoxyRenderPreviewOutcomeHandoffCommandFromReadmodels,
} from "@/features/create/voxyRenderPreviewOutcomeHandoffContract";
import {
  buildVoxyRenderPreviewReviewFlowFromReadmodels,
  buildVoxyRenderPreviewReviewFlowPanelModel,
} from "@/features/create/voxyRenderPreviewReviewFlowContract";

function buildGate(overrides?: Record<string, unknown>) {
  return {
    gateKey: "review",
    label: "Review",
    status: "go",
    blockerSeverity: "none",
    reviewerVisibleReason: "Gate ist vorbereitet.",
    userVisibleReason: "Gate ist vorbereitet.",
    evidenceRefs: ["evidence-1"],
    nextAction: "review_script",
    executionAllowed: false,
    ...overrides,
  } as any;
}

function buildMatrix(overrides?: Record<string, unknown>) {
  return {
    matrixId: "voxy-render-runtime-go-nogo-matrix:preview-1",
    providerSelectionDraftId: "voxy-render-provider-selection-draft:preview-1",
    assetPackDraftId: "voxy-render-asset-pack-draft:preview-1",
    costPolicyPreviewId: "voxy-render-cost-credit-policy:preview-1",
    queuePreviewId: "voxy-render-queue-preview:preview-1",
    requestDraftId: "voxy-render-request-draft:preview-1",
    decisionId: "voxy-render-decision:test-1",
    decisionGateId: "voxy-render-review-decision-gate:admin-1",
    scriptRef: {
      id: "script-1",
      title: "Voxy Script",
      href: "/admin/review",
    },
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
    matrixStatus: "go_nogo_preview_only",
    reviewGate: buildGate({ gateKey: "review", label: "Review" }),
    providerGate: buildGate({ gateKey: "provider", label: "Provider" }),
    assetGate: buildGate({ gateKey: "assets", label: "Assets" }),
    queueGate: buildGate({ gateKey: "queue", label: "Queue" }),
    costCreditGate: buildGate({ gateKey: "cost_credit", label: "Kosten & Credits" }),
    languageGate: buildGate({ gateKey: "language", label: "Sprache & Untertitel" }),
    runtimeGate: buildGate({ gateKey: "runtime", label: "Runtime" }),
    publishGate: buildGate({ gateKey: "publish", label: "Veröffentlichung" }),
    overallDecision: "review_needed",
    topBlockers: ["Noch kein Preview-Video."],
    nextRecommendedAction: "review_script",
    nextStep: "Script zuerst prüfen.",
    execution: {
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
    previousMatrixRef: null,
    supersedesMatrixRef: null,
    matrixVersion: null,
    ...overrides,
  } as any;
}

function buildBacklog(overrides?: Record<string, unknown>) {
  return {
    backlogId: "voxy-render-runtime-enablement-backlog:preview-1",
    matrixId: "voxy-render-runtime-go-nogo-matrix:preview-1",
    providerSelectionDraftId: "voxy-render-provider-selection-draft:preview-1",
    assetPackDraftId: "voxy-render-asset-pack-draft:preview-1",
    costPolicyPreviewId: "voxy-render-cost-credit-policy:preview-1",
    queuePreviewId: "voxy-render-queue-preview:preview-1",
    requestDraftId: "voxy-render-request-draft:preview-1",
    decisionId: "voxy-render-decision:test-1",
    decisionGateId: "voxy-render-review-decision-gate:admin-1",
    scriptRef: {
      id: "script-1",
      title: "Voxy Script",
      href: "/admin/review",
    },
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
    backlogStatus: "planning_only",
    items: [],
    topP0Items: ["Preview-Checklist vorbereiten"],
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
    ...overrides,
  } as any;
}

describe("voxy render preview review flow contract", () => {
  it("blocks when no enablement backlog is available", () => {
    const preview = buildVoxyRenderPreviewReviewFlowFromReadmodels({
      surface: "admin",
      backlog: null,
      matrix: buildMatrix(),
    });

    expect(preview.previewStatus).toBe("blocked_by_missing_backlog");
    expect(preview.overallDecision).toBe("blocked");
    expect(preview.previewCandidate.status).toBe("blocked");
    expect(preview.execution.previewRendered).toBe(false);
  });

  it("blocks when no runtime go/no-go matrix is available", () => {
    const preview = buildVoxyRenderPreviewReviewFlowFromReadmodels({
      surface: "admin",
      backlog: buildBacklog(),
      matrix: null,
    });

    expect(preview.previewStatus).toBe("blocked_by_missing_matrix");
    expect(preview.overallDecision).toBe("blocked");
    expect(preview.reviewActions.find((item) => item.actionKey === "blocked")?.allowed).toBe(true);
  });

  it("keeps explicit script-only decisions without preview claims", () => {
    const preview = buildVoxyRenderPreviewReviewFlowFromReadmodels({
      surface: "admin",
      backlog: buildBacklog({ backlogStatus: "keep_as_script_only" }),
      matrix: buildMatrix({ matrixStatus: "keep_as_script_only" }),
    });

    expect(preview.previewStatus).toBe("keep_as_script_only");
    expect(preview.overallDecision).toBe("keep_as_script_only");
    expect(preview.nextRecommendedAction).toBe("keep_as_script_only");
    expect(preview.previewCandidate.mediaUrl).toBeNull();
  });

  it("marks runtime no-go as needs_render_runtime without fake preview assets", () => {
    const preview = buildVoxyRenderPreviewReviewFlowFromReadmodels({
      surface: "admin",
      backlog: buildBacklog(),
      matrix: buildMatrix({
        runtimeGate: buildGate({
          gateKey: "runtime",
          label: "Runtime",
          status: "no_go",
          blockerSeverity: "blocker",
          reviewerVisibleReason: "Runtime-Wahrheit fehlt weiterhin.",
        }),
      }),
    });

    expect(preview.previewStatus).toBe("needs_render_runtime");
    expect(preview.previewCandidate.status).toBe("blocked");
    expect(preview.nextRecommendedAction).toBe("wait_for_preview_runtime");
    expect(preview.previewCandidate.thumbnailUrl).toBeNull();
    expect(preview.previewCandidate.durationSeconds).toBeNull();
  });

  it("keeps no-preview states honest and all execution flags false", () => {
    const preview = buildVoxyRenderPreviewReviewFlowFromReadmodels({
      surface: "admin",
      backlog: buildBacklog(),
      matrix: buildMatrix(),
    });

    expect(preview.previewStatus).toBe("no_preview_available");
    expect(preview.previewCandidate.status).toBe("no_media");
    expect(preview.previewCandidate.mediaUrl).toBeNull();
    expect(preview.previewCandidate.thumbnailUrl).toBeNull();
    expect(preview.previewCandidate.durationSeconds).toBeNull();
    expect(preview.reviewActions.find((item) => item.actionKey === "comment_only")?.createsRenderJob).toBe(false);
    expect(preview.reviewActions.find((item) => item.actionKey === "request_revision")?.triggersProvider).toBe(false);
    expect(preview.reviewActions.find((item) => item.actionKey === "reject_preview")?.triggersPublish).toBe(false);
    expect(preview.reviewActions.find((item) => item.actionKey === "mark_review_ready")?.allowed).toBe(true);
    expect(preview.reviewChecklist.map((item) => item.checkKey)).toEqual(
      expect.arrayContaining([
        "script_accuracy",
        "source_caption_accuracy",
        "claim_safety",
        "language_quality",
        "subtitle_readability",
        "rtl_layout",
        "brand_fit",
        "voxy_presence",
        "audio_voice_fit",
        "legal_safety",
        "publication_safety",
        "accessibility",
      ]),
    );
    expect(Object.values(preview.execution).every((value) => value === false)).toBe(true);
  });

  it("keeps the outcome handoff blocked until a preview-review decision exists", () => {
    const preview = buildVoxyRenderPreviewReviewFlowFromReadmodels({
      surface: "admin",
      backlog: buildBacklog(),
      matrix: buildMatrix(),
    });
    const outcomeCommand = buildVoxyRenderPreviewOutcomeHandoffCommandFromReadmodels({
      previewFlow: preview,
    });

    expect(outcomeCommand.outcomeType).toBe("blocked");
    expect(outcomeCommand.handoffStatus).toBe("blocked_by_missing_preview_review_decision");
    expect(outcomeCommand.executionFlags.renderAllowed).toBe(false);
  });

  it("renders a review-first panel without raw enum strings", () => {
    const model = buildVoxyRenderPreviewReviewFlowPanelModel({
      preview: buildVoxyRenderPreviewReviewFlowFromReadmodels({
        surface: "admin",
        backlog: buildBacklog(),
        matrix: buildMatrix(),
      }),
    });

    const html = renderToStaticMarkup(
      <VoxyRenderPreviewReviewFlowPanel model={model} dataTestId="preview-review-panel" />,
    );

    expect(html).toContain("Preview Review");
    expect(html).toContain("Noch kein Preview-Video");
    expect(html).toContain("Keine Medien-Datei");
    expect(html).toContain("Kommentar dokumentieren");
    expect(html).toContain("Als review-ready markieren");
    expect(html).toContain("Barrierefreiheit");
    expect(html).not.toContain("mark_review_ready");
    expect(html).not.toContain("no_preview_available");
  });
});
