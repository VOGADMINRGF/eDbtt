import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import VoxyRenderPreviewReviewDecisionPersistencePanel from "@/features/create/VoxyRenderPreviewReviewDecisionPersistencePanel";
import {
  buildVoxyRenderPreviewReviewDecisionCommandFromPreviewReviewFlow,
  buildVoxyRenderPreviewReviewDecisionPersistencePanelModel,
  deriveVoxyRenderPreviewReviewDecisionStatus,
} from "@/features/create/voxyRenderPreviewReviewDecisionPersistenceContract";
import {
  buildVoxyRenderPreviewOutcomeHandoffCommandFromReadmodels,
} from "@/features/create/voxyRenderPreviewOutcomeHandoffContract";
import { buildVoxyRenderPreviewReviewFlowFromReadmodels } from "@/features/create/voxyRenderPreviewReviewFlowContract";

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

function buildPreviewFlow(overrides?: Record<string, unknown>) {
  return buildVoxyRenderPreviewReviewFlowFromReadmodels({
    surface: "admin",
    backlog: buildBacklog(overrides?.backlog as Record<string, unknown> | undefined),
    matrix: buildMatrix(overrides?.matrix as Record<string, unknown> | undefined),
  });
}

describe("voxy render preview review decision persistence contract", () => {
  it("blocks when no preview review flow is available", () => {
    const command = buildVoxyRenderPreviewReviewDecisionCommandFromPreviewReviewFlow(null);
    const status = deriveVoxyRenderPreviewReviewDecisionStatus({
      previewFlow: null,
      decisionType: command.decisionType,
      persistenceMode: "unavailable",
    });

    expect(command.previewReviewFlowId).toBeNull();
    expect(command.decisionType).toBe("blocked");
    expect(status).toBe("blocked_by_missing_preview_review_flow");
    expect(command.executionFlags.renderAllowed).toBe(false);
    expect(command.executionFlags.publishAllowed).toBe(false);
  });

  it("keeps request_revision, reject_preview and review_ready strictly audit-only", () => {
    const previewFlow = buildPreviewFlow();
    const revisionCommand = buildVoxyRenderPreviewReviewDecisionCommandFromPreviewReviewFlow(
      previewFlow,
      {
        decisionType: "request_revision",
      },
    );
    const rejectCommand = buildVoxyRenderPreviewReviewDecisionCommandFromPreviewReviewFlow(
      previewFlow,
      {
        decisionType: "reject_preview",
      },
    );
    const readyCommand = buildVoxyRenderPreviewReviewDecisionCommandFromPreviewReviewFlow(
      previewFlow,
      {
        decisionType: "mark_review_ready",
      },
    );

    expect(revisionCommand.decisionEffects.triggersRerender).toBe(false);
    expect(revisionCommand.executionFlags.rerenderAllowed).toBe(false);
    expect(rejectCommand.decisionEffects.triggersPublish).toBe(false);
    expect(rejectCommand.executionFlags.publishAllowed).toBe(false);
    expect(readyCommand.decisionEffects.runtimeClaimAllowed).toBe(false);
    expect(readyCommand.executionFlags.renderAllowed).toBe(false);
    expect(readyCommand.userVisibleSummary).toContain("Review-ready");
  });

  it("keeps script-only flows limited to comment or script-only decisions", () => {
    const previewFlow = buildPreviewFlow({
      backlog: { backlogStatus: "keep_as_script_only" },
      matrix: { matrixStatus: "keep_as_script_only" },
    });
    const command = buildVoxyRenderPreviewReviewDecisionCommandFromPreviewReviewFlow(previewFlow);
    const status = deriveVoxyRenderPreviewReviewDecisionStatus({
      previewFlow,
      decisionType: command.decisionType,
      persistenceMode: "in_memory_fallback",
    });

    expect(command.decisionType).toBe("keep_as_script_only");
    expect(status).toBe("keep_as_script_only");
    expect(command.previewReviewFlowId).toContain("voxy-render-preview-review-flow");
  });

  it("maps a persisted preview-review decision to a downstream noop handoff", () => {
    const previewFlow = buildPreviewFlow();
    const decisionCommand = buildVoxyRenderPreviewReviewDecisionCommandFromPreviewReviewFlow(
      previewFlow,
      {
        decisionType: "comment_only",
      },
    );
    const outcomeCommand = buildVoxyRenderPreviewOutcomeHandoffCommandFromReadmodels({
      previewFlow,
      latestPreviewReviewDecisionRecord: {
        ...decisionCommand,
        decisionRecordId: "voxy-render-preview-review-decision:1",
        decisionStatus: "persisted_audit_only",
        persistedAt: "2026-07-11T10:00:00.000Z",
        persistedBy: "admin-1",
        idempotencyKey: "decision-idempotency-1",
        previousDecisionRecordRef: null,
        supersedesDecisionRecordRef: null,
        decisionVersion: 1,
      },
    });

    expect(outcomeCommand.handoffStatus).toBe("review_context_only");
    expect(outcomeCommand.downstreamTarget).toBe("review_context");
    expect(outcomeCommand.handoffEffects.triggersPublish).toBe(false);
  });

  it("renders the panel without raw enum strings", () => {
    const previewFlow = buildPreviewFlow();
    const model = buildVoxyRenderPreviewReviewDecisionPersistencePanelModel({
      previewFlow,
    });
    const html = renderToStaticMarkup(
      <VoxyRenderPreviewReviewDecisionPersistencePanel
        model={model}
        dataTestId="voxy-render-preview-review-decision-persistence"
      />,
    );

    expect(html).toContain("Preview-Review-Entscheidung");
    expect(html).toContain("Kommentar dokumentieren");
    expect(html).toContain("Revision anfordern");
    expect(html).toContain("Preview ablehnen");
    expect(html).toContain("Als review-ready markieren");
    expect(html).toContain("Kein Re-Render");
    expect(html).toContain("Keine Medien-Datei");
    expect(html).toContain("Audit-only");
    expect(html).not.toContain("mark_review_ready");
    expect(html).not.toContain("request_revision");
  });
});
