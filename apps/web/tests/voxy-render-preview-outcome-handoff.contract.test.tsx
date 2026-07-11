import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import VoxyRenderPreviewOutcomeHandoffPanel from "@/features/create/VoxyRenderPreviewOutcomeHandoffPanel";
import {
  buildVoxyRenderPreviewOutcomeHandoffCommandFromReadmodels,
  buildVoxyRenderPreviewOutcomeHandoffPanelModel,
  deriveVoxyRenderPreviewOutcomeHandoffStatus,
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

function buildPreviewFlow(overrides?: {
  backlog?: Record<string, unknown>;
  matrix?: Record<string, unknown>;
}) {
  const backlog = buildBacklog(overrides?.backlog);
  const matrix = buildMatrix(overrides?.matrix);
  return buildVoxyRenderPreviewReviewFlowFromReadmodels({
    surface: "admin",
    backlog,
    matrix,
  });
}

function buildLatestDecisionRecord(overrides?: Record<string, unknown>) {
  return {
    decisionRecordId: "voxy-render-preview-review-decision:1",
    previewReviewFlowId: "voxy-render-preview-review-flow:preview-1",
    decisionGateId: "voxy-render-review-decision-gate:admin-1",
    enablementBacklogId: "voxy-render-runtime-enablement-backlog:preview-1",
    matrixId: "voxy-render-runtime-go-nogo-matrix:preview-1",
    requestDraftId: "voxy-render-request-draft:preview-1",
    renderDecisionId: "voxy-render-decision:test-1",
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
    reviewerRef: {
      id: "admin-1",
      title: "Admin",
      href: null,
    },
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
    nextStep: "Kommentar dokumentieren.",
    userVisibleSummary: "Es wird nur kommentiert.",
    reviewerVisibleSummary: "Kommentar bleibt audit-only.",
    previewReviewStatusHint: "no_preview_available",
    persistedAt: "2026-07-11T10:00:00.000Z",
    persistedBy: "admin-1",
    idempotencyKey: "decision-idempotency-1",
    previousDecisionRecordRef: null,
    supersedesDecisionRecordRef: null,
    decisionVersion: 1,
    ...overrides,
  } as any;
}

describe("voxy render preview outcome handoff contract", () => {
  it("blocks when no preview review decision is available", () => {
    const previewFlow = buildPreviewFlow();
    const command = buildVoxyRenderPreviewOutcomeHandoffCommandFromReadmodels({
      previewFlow,
    });
    const status = deriveVoxyRenderPreviewOutcomeHandoffStatus({
      previewReviewDecisionRecordId: command.previewReviewDecisionRecordId ?? null,
      outcomeType: command.outcomeType,
      previewReviewDecisionStatus: command.previewReviewDecisionStatusHint ?? null,
    });

    expect(command.previewReviewDecisionRecordId).toBeNull();
    expect(command.outcomeType).toBe("blocked");
    expect(status).toBe("blocked_by_missing_preview_review_decision");
    expect(command.executionFlags.renderAllowed).toBe(false);
    expect(command.executionFlags.publishAllowed).toBe(false);
  });

  it("keeps comment_only as review context only", () => {
    const previewFlow = buildPreviewFlow();
    const decisionRecord = buildLatestDecisionRecord();
    const command = buildVoxyRenderPreviewOutcomeHandoffCommandFromReadmodels({
      previewFlow,
      latestPreviewReviewDecisionRecord: decisionRecord,
    });

    expect(command.outcomeType).toBe("comment_only");
    expect(command.handoffStatus).toBe("review_context_only");
    expect(command.downstreamTarget).toBe("review_context");
    expect(command.handoffEffects.createsScriptRevisionTask).toBe(false);
    expect(command.handoffEffects.triggersRerender).toBe(false);
  });

  it("maps request_revision only to a revision candidate without rerender", () => {
    const previewFlow = buildPreviewFlow({
      matrix: {
        assetGate: buildGate({
          gateKey: "assets",
          label: "Assets",
          status: "no_go",
          blockerSeverity: "blocker",
          reviewerVisibleReason: "Subtitle template fehlt.",
          userVisibleReason: "Subtitle template fehlt.",
        }),
      },
    });
    const decisionRecord = buildLatestDecisionRecord({
      decisionType: "request_revision",
      decisionPayload: {
        ...buildLatestDecisionRecord().decisionPayload,
        revisionReason: "Subtitle template und lower-third überarbeiten.",
      },
    });
    const command = buildVoxyRenderPreviewOutcomeHandoffCommandFromReadmodels({
      previewFlow,
      latestPreviewReviewDecisionRecord: decisionRecord,
      latestMatrix: buildMatrix({
        assetGate: buildGate({
          gateKey: "assets",
          label: "Assets",
          status: "no_go",
          blockerSeverity: "blocker",
          reviewerVisibleReason: "Subtitle template fehlt.",
          userVisibleReason: "Subtitle template fehlt.",
        }),
      }),
    });

    expect(command.handoffStatus).toBe("revision_backlog_candidate");
    expect(command.downstreamTarget).toBe("asset_revision");
    expect(command.handoffEffects.createsAssetRevisionTask).toBe(true);
    expect(command.handoffEffects.triggersRerender).toBe(false);
    expect(command.executionFlags.rerenderAllowed).toBe(false);
  });

  it("keeps reject_preview blocked downstream without publish", () => {
    const previewFlow = buildPreviewFlow();
    const decisionRecord = buildLatestDecisionRecord({
      decisionType: "reject_preview",
      decisionPayload: {
        ...buildLatestDecisionRecord().decisionPayload,
        rejectionReason: "Claim-Sicherheit bleibt unklar.",
      },
    });
    const command = buildVoxyRenderPreviewOutcomeHandoffCommandFromReadmodels({
      previewFlow,
      latestPreviewReviewDecisionRecord: decisionRecord,
    });

    expect(command.handoffStatus).toBe("downstream_blocked");
    expect(command.downstreamTarget).toBe("blocked_downstream");
    expect(command.handoffEffects.blocksDownstream).toBe(true);
    expect(command.handoffEffects.triggersPublish).toBe(false);
    expect(command.executionFlags.publishAllowed).toBe(false);
  });

  it("keeps mark_review_ready as review-ready only", () => {
    const previewFlow = buildPreviewFlow();
    const decisionRecord = buildLatestDecisionRecord({
      decisionType: "mark_review_ready",
      decisionPayload: {
        ...buildLatestDecisionRecord().decisionPayload,
        reviewReadyReason: "Checkliste ist für review-ready vertretbar.",
      },
    });
    const command = buildVoxyRenderPreviewOutcomeHandoffCommandFromReadmodels({
      previewFlow,
      latestPreviewReviewDecisionRecord: decisionRecord,
    });

    expect(command.handoffStatus).toBe("review_ready_only");
    expect(command.downstreamTarget).toBe("publish_guard");
    expect(command.handoffEffects.marksReviewReadyOnly).toBe(true);
    expect(command.executionFlags.renderAllowed).toBe(false);
    expect(command.userVisibleSummary).toContain("Review-ready");
  });

  it("pauses the video flow for keep_as_script_only", () => {
    const previewFlow = buildPreviewFlow({
      backlog: { backlogStatus: "keep_as_script_only" },
      matrix: { matrixStatus: "keep_as_script_only" },
    });
    const decisionRecord = buildLatestDecisionRecord({
      decisionType: "keep_as_script_only",
      decisionStatus: "keep_as_script_only",
    });
    const command = buildVoxyRenderPreviewOutcomeHandoffCommandFromReadmodels({
      previewFlow,
      latestPreviewReviewDecisionRecord: decisionRecord,
    });

    expect(command.handoffStatus).toBe("script_only_pause");
    expect(command.downstreamTarget).toBe("script_only_archive");
    expect(command.handoffEffects.pausesVideoFlow).toBe(true);
    expect(command.executionFlags.previewFileAvailable).toBe(false);
  });

  it("renders the panel without raw enum strings", () => {
    const previewFlow = buildPreviewFlow();
    const decisionRecord = buildLatestDecisionRecord({
      decisionType: "request_revision",
      decisionPayload: {
        ...buildLatestDecisionRecord().decisionPayload,
        revisionReason: "Claim und Script überarbeiten.",
      },
    });
    const model = buildVoxyRenderPreviewOutcomeHandoffPanelModel({
      previewFlow,
      latestPreviewReviewDecisionRecord: decisionRecord,
    });
    const html = renderToStaticMarkup(
      <VoxyRenderPreviewOutcomeHandoffPanel
        model={model}
        dataTestId="voxy-render-preview-outcome-handoff"
      />,
    );

    expect(html).toContain("Preview Outcome Handoff");
    expect(html).toContain("Kommentar → Review-Kontext");
    expect(html).toContain("Revision → Script-/Asset-/Runtime-Backlog-Kandidat");
    expect(html).toContain("Ablehnung → Downstream blockiert");
    expect(html).toContain("Review-ready → nur review-ready, nicht approved/published");
    expect(html).toContain("Script-only → Video-Flow pausiert");
    expect(html).toContain("Kein Render");
    expect(html).toContain("Kein Re-Render");
    expect(html).not.toContain("request_revision");
    expect(html).not.toContain("blocked_by_missing_preview_review_decision");
  });
});
