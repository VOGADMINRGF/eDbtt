import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import VoxyRenderPublishReadinessGuardPanel from "@/features/create/VoxyRenderPublishReadinessGuardPanel";
import {
  buildVoxyRenderPublishReadinessGuardCommandFromReadmodels,
  buildVoxyRenderPublishReadinessGuardPanelModel,
  deriveVoxyRenderPublishReadinessGuardStatus,
} from "@/features/create/voxyRenderPublishReadinessGuardContract";
import { buildVoxyRenderPreviewOutcomeHandoffCommandFromReadmodels } from "@/features/create/voxyRenderPreviewOutcomeHandoffContract";
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
    scriptRef: { id: "script-1", title: "Voxy Script", href: "/admin/review" },
    contributionRef: { id: "review-item-1", title: "Sichere Schulwege", href: "/admin/review" },
    dossierRef: { id: "dossier-1", title: "Sichere Schulwege", href: "/dossier/demo" },
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
    runtimeGate: buildGate({ gateKey: "runtime", label: "Runtime", status: "no_go", reviewerVisibleReason: "Keine Runtime.", userVisibleReason: "Keine Runtime." }),
    publishGate: buildGate({ gateKey: "publish", label: "Veröffentlichung", status: "no_go", reviewerVisibleReason: "Nicht veröffentlicht.", userVisibleReason: "Nicht veröffentlicht." }),
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
    scriptRef: { id: "script-1", title: "Voxy Script", href: "/admin/review" },
    contributionRef: { id: "review-item-1", title: "Sichere Schulwege", href: "/admin/review" },
    dossierRef: { id: "dossier-1", title: "Sichere Schulwege", href: "/dossier/demo" },
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

function buildPreviewFlow(overrides?: { backlog?: Record<string, unknown>; matrix?: Record<string, unknown> }) {
  const backlog = buildBacklog(overrides?.backlog);
  const matrix = buildMatrix(overrides?.matrix);
  return buildVoxyRenderPreviewReviewFlowFromReadmodels({
    surface: "admin",
    backlog,
    matrix,
  });
}

function buildDecisionRecord(overrides?: Record<string, unknown>) {
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
    decisionType: "comment_only",
    decisionStatus: "persisted_audit_only",
    decisionPayload: {
      reviewerComment: "Kommentar wird nur dokumentiert.",
      revisionReason: null,
      rejectionReason: null,
      reviewReadyReason: null,
      checklistFindings: ["Noch kein Preview-Video.", "Keine Medien-Datei."],
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
    nextStep: "keep_review_context",
    userVisibleSummary: "Kommentar bleibt Review-Kontext.",
    reviewerVisibleSummary: "Kommentar bleibt audit-only Review-Kontext.",
    previewReviewStatusHint: "no_preview_available",
    persistedAt: "2026-07-11T10:10:00.000Z",
    persistedBy: "admin-1",
    idempotencyKey: "decision-1",
    previousDecisionRecordRef: null,
    supersedesDecisionRecordRef: null,
    decisionVersion: 1,
    ...overrides,
  } as any;
}

describe("voxy render publish readiness guard contract", () => {
  it("blocks when the preview outcome handoff is missing", () => {
    expect(
      deriveVoxyRenderPublishReadinessGuardStatus({
        previewOutcomeHandoffId: null,
        reviewGate: { status: "blocked" },
        approvalGate: { status: "blocked" },
        mediaGate: { status: "blocked" },
        uploadGate: { status: "blocked" },
        schedulingGate: { status: "blocked" },
        socialPostingGate: { status: "blocked" },
      } as any),
    ).toBe("blocked_by_missing_preview_outcome");
  });

  it("keeps comment-only outcomes not publish-ready", () => {
    const previewFlow = buildPreviewFlow();
    const latestDecisionRecord = buildDecisionRecord();
    const command = buildVoxyRenderPublishReadinessGuardCommandFromReadmodels({
      previewFlow,
      latestPreviewReviewDecisionRecord: latestDecisionRecord,
      latestPreviewOutcomeHandoffRecord: {
        ...buildVoxyRenderPreviewOutcomeHandoffCommandFromReadmodels({
          previewFlow,
          latestPreviewReviewDecisionRecord: latestDecisionRecord,
        }),
        outcomeHandoffId: "voxy-render-preview-outcome-handoff:1",
        persistedAt: "2026-07-11T10:20:00.000Z",
        persistedBy: "admin-1",
        idempotencyKey: "handoff-1",
        previousOutcomeHandoffRef: null,
        supersedesOutcomeHandoffRef: null,
        handoffVersion: 1,
      },
    });

    expect(command).toMatchObject({
      guardStatus: "not_publish_ready",
      publishSemantics: {
        reviewReady: false,
        approved: false,
        publishReady: false,
        published: false,
      },
      executionFlags: {
        publishAllowed: false,
        uploadAllowed: false,
        schedulingAllowed: false,
        socialPostAllowed: false,
      },
    });
  });

  it("treats mark_review_ready as review-ready only without approval or publication", () => {
    const previewFlow = buildPreviewFlow();
    const latestDecisionRecord = buildDecisionRecord({ decisionType: "mark_review_ready" });
    const outcomeHandoff = {
      ...buildVoxyRenderPreviewOutcomeHandoffCommandFromReadmodels({
        previewFlow,
        latestPreviewReviewDecisionRecord: latestDecisionRecord,
      }),
      outcomeHandoffId: "voxy-render-preview-outcome-handoff:ready-1",
      persistedAt: "2026-07-11T10:20:00.000Z",
      persistedBy: "admin-1",
      idempotencyKey: "handoff-ready-1",
      previousOutcomeHandoffRef: null,
      supersedesOutcomeHandoffRef: null,
      handoffVersion: 1,
    };

    const model = buildVoxyRenderPublishReadinessGuardPanelModel({
      previewFlow,
      latestPreviewReviewDecisionRecord: latestDecisionRecord,
      latestPreviewOutcomeHandoffRecord: outcomeHandoff,
    });

    expect(model?.preview.publishSemantics).toMatchObject({
      reviewReady: true,
      approved: false,
      publishReady: false,
      published: false,
    });
    expect(model?.preview.guardStatus).toBe("review_ready_only");
    expect(model?.semanticsLines).toContain("Review-ready ist nicht approved.");
    expect(model?.semanticsLines).toContain("Approved ist nicht published.");
  });

  it("keeps request_revision downstream-blocked and all execution flags false", () => {
    const previewFlow = buildPreviewFlow();
    const latestDecisionRecord = buildDecisionRecord({ decisionType: "request_revision" });
    const outcomeHandoff = {
      ...buildVoxyRenderPreviewOutcomeHandoffCommandFromReadmodels({
        previewFlow,
        latestPreviewReviewDecisionRecord: latestDecisionRecord,
      }),
      outcomeHandoffId: "voxy-render-preview-outcome-handoff:revise-1",
      persistedAt: "2026-07-11T10:20:00.000Z",
      persistedBy: "admin-1",
      idempotencyKey: "handoff-revise-1",
      previousOutcomeHandoffRef: null,
      supersedesOutcomeHandoffRef: null,
      handoffVersion: 1,
    };

    const command = buildVoxyRenderPublishReadinessGuardCommandFromReadmodels({
      previewFlow,
      latestPreviewReviewDecisionRecord: latestDecisionRecord,
      latestPreviewOutcomeHandoffRecord: outcomeHandoff,
    });

    expect(command).toMatchObject({
      guardStatus: "downstream_blocked",
      executionFlags: {
        renderAllowed: false,
        rerenderAllowed: false,
        queueAllowed: false,
        workerAllowed: false,
        providerExecutionAllowed: false,
        secretsAccessed: false,
        mediaFileCreationAllowed: false,
        previewFileAvailable: false,
        publishAllowed: false,
        uploadAllowed: false,
        schedulingAllowed: false,
        socialPostAllowed: false,
        costDebitAllowed: false,
        creditDebitAllowed: false,
        runtimeClaimAllowed: false,
      },
    });
  });

  it("renders human labels without raw enums", () => {
    const previewFlow = buildPreviewFlow();
    const latestDecisionRecord = buildDecisionRecord({ decisionType: "mark_review_ready" });
    const outcomeHandoff = {
      ...buildVoxyRenderPreviewOutcomeHandoffCommandFromReadmodels({
        previewFlow,
        latestPreviewReviewDecisionRecord: latestDecisionRecord,
      }),
      outcomeHandoffId: "voxy-render-preview-outcome-handoff:ready-2",
      persistedAt: "2026-07-11T10:20:00.000Z",
      persistedBy: "admin-1",
      idempotencyKey: "handoff-ready-2",
      previousOutcomeHandoffRef: null,
      supersedesOutcomeHandoffRef: null,
      handoffVersion: 1,
    };
    const model = buildVoxyRenderPublishReadinessGuardPanelModel({
      previewFlow,
      latestPreviewReviewDecisionRecord: latestDecisionRecord,
      latestPreviewOutcomeHandoffRecord: outcomeHandoff,
    });

    const html = renderToStaticMarkup(
      React.createElement(VoxyRenderPublishReadinessGuardPanel, { model }),
    );

    expect(html).toContain("Publish Readiness");
    expect(html).toContain("Noch nicht veröffentlichungsbereit");
    expect(html).toContain("Review-ready ist nicht approved");
    expect(html).toContain("Kein Upload");
    expect(html).toContain("Kein Social Posting");
    expect(html).toContain("Kein Scheduling");
    expect(html).toContain("Keine Veröffentlichung");
    expect(html).not.toContain("blocked_by_missing_preview_outcome");
    expect(html).not.toContain("review_ready_only");
    expect(html).not.toContain("social_posting_blocked");
  });
});
