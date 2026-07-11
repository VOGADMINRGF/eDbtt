import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import VoxyRenderApprovalSemanticsPanel from "@/features/create/VoxyRenderApprovalSemanticsPanel";
import {
  buildVoxyRenderApprovalSemanticsCommandFromReadmodels,
  buildVoxyRenderApprovalSemanticsPanelModel,
  deriveVoxyRenderApprovalSemanticsStatus,
} from "@/features/create/voxyRenderApprovalSemanticsContract";

function buildPreviewFlow(overrides?: Record<string, unknown>) {
  return {
    previewReviewFlowId: "voxy-render-preview-review-flow:1",
    enablementBacklogId: "voxy-render-runtime-enablement-backlog:1",
    matrixId: "voxy-render-runtime-go-nogo-matrix:1",
    requestDraftId: "voxy-render-request-draft:1",
    scriptRef: { id: "script-1", title: "Voxy Script", href: "/admin/review" },
    contributionRef: { id: "review-item-1", title: "Sichere Schulwege", href: "/admin/review" },
    dossierRef: { id: "dossier-1", title: "Sichere Schulwege", href: "/dossier/demo" },
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    rtlRequired: false,
    previewStatus: "no_preview_available",
    ...overrides,
  } as any;
}

function buildPublishGuardRecord(overrides?: Record<string, unknown>) {
  return {
    publishReadinessGuardId: "voxy-render-publish-readiness-guard:1",
    previewOutcomeHandoffId: "voxy-render-preview-outcome-handoff:1",
    previewReviewDecisionRecordId: "voxy-render-preview-review-decision:1",
    previewReviewFlowId: "voxy-render-preview-review-flow:1",
    enablementBacklogId: "voxy-render-runtime-enablement-backlog:1",
    matrixId: "voxy-render-runtime-go-nogo-matrix:1",
    requestDraftId: "voxy-render-request-draft:1",
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
    guardStatus: "review_ready_only",
    reviewGate: {
      gateKey: "review",
      label: "Review Gate",
      status: "not_applicable",
      reviewerVisibleReason: "Review-ready bleibt nicht approved.",
      userVisibleReason: "Review-ready bleibt nicht approved.",
      nextAction: "keep_review_ready_only",
      executionAllowed: false,
    },
    approvalGate: {
      gateKey: "approval",
      label: "Approval Gate",
      status: "needs_approval",
      reviewerVisibleReason: "Menschliche Freigabe fehlt.",
      userVisibleReason: "Menschliche Freigabe fehlt.",
      nextAction: "request_human_approval",
      executionAllowed: false,
    },
    mediaGate: {
      gateKey: "media",
      label: "Media Gate",
      status: "not_applicable",
      reviewerVisibleReason: "Keine Medienbehauptung.",
      userVisibleReason: "Keine Medienbehauptung.",
      nextAction: "keep_review_ready_only",
      executionAllowed: false,
    },
    uploadGate: {
      gateKey: "upload",
      label: "Upload Gate",
      status: "no_go",
      reviewerVisibleReason: "Kein Upload.",
      userVisibleReason: "Kein Upload.",
      nextAction: "require_upload_runtime",
      executionAllowed: false,
    },
    schedulingGate: {
      gateKey: "scheduling",
      label: "Scheduling Gate",
      status: "no_go",
      reviewerVisibleReason: "Kein Scheduling.",
      userVisibleReason: "Kein Scheduling.",
      nextAction: "require_scheduling_policy",
      executionAllowed: false,
    },
    socialPostingGate: {
      gateKey: "social_posting",
      label: "Social Posting Gate",
      status: "no_go",
      reviewerVisibleReason: "Kein Social Posting.",
      userVisibleReason: "Kein Social Posting.",
      nextAction: "require_social_review",
      executionAllowed: false,
    },
    legalSafetyGate: {
      gateKey: "legal_safety",
      label: "Legal/Safety Gate",
      status: "needs_review",
      reviewerVisibleReason: "Legal Review bleibt offen.",
      userVisibleReason: "Legal Review bleibt offen.",
      nextAction: "require_social_review",
      executionAllowed: false,
    },
    sourceCaptionGate: {
      gateKey: "source_caption",
      label: "Source Caption Gate",
      status: "needs_review",
      reviewerVisibleReason: "Caption Review bleibt offen.",
      userVisibleReason: "Caption Review bleibt offen.",
      nextAction: "require_social_review",
      executionAllowed: false,
    },
    languageGate: {
      gateKey: "language",
      label: "Language Gate",
      status: "needs_review",
      reviewerVisibleReason: "Language Review bleibt offen.",
      userVisibleReason: "Language Review bleibt offen.",
      nextAction: "require_social_review",
      executionAllowed: false,
    },
    accessibilityGate: {
      gateKey: "accessibility",
      label: "Accessibility Gate",
      status: "needs_review",
      reviewerVisibleReason: "Accessibility Review bleibt offen.",
      userVisibleReason: "Accessibility Review bleibt offen.",
      nextAction: "require_social_review",
      executionAllowed: false,
    },
    runtimeGate: {
      gateKey: "runtime",
      label: "Runtime Gate",
      status: "not_applicable",
      reviewerVisibleReason: "Approval bleibt ohne Runtime.",
      userVisibleReason: "Approval bleibt ohne Runtime.",
      nextAction: "require_upload_runtime",
      executionAllowed: false,
    },
    publishSemantics: {
      reviewReady: true,
      approved: false,
      publishReady: false,
      published: false,
      uploaded: false,
      scheduled: false,
      socialPosted: false,
      autoPublishAllowed: false,
    },
    previewOutcomeTypeHint: "mark_review_ready",
    previewOutcomeStatusHint: "review_ready_only",
    previewReviewDecisionTypeHint: "mark_review_ready",
    previewReviewDecisionStatusHint: "persisted_audit_only",
    previewReviewFlowStatusHint: "no_preview_available",
    ...overrides,
  } as any;
}

function buildSocialDistributionRecord(overrides?: Record<string, unknown>) {
  return {
    socialDistributionHandoffId: "voxy-render-social-distribution-handoff:1",
    publishReadinessGuardId: "voxy-render-publish-readiness-guard:1",
    previewOutcomeHandoffId: "voxy-render-preview-outcome-handoff:1",
    previewReviewDecisionRecordId: "voxy-render-preview-review-decision:1",
    previewReviewFlowId: "voxy-render-preview-review-flow:1",
    enablementBacklogId: "voxy-render-runtime-enablement-backlog:1",
    matrixId: "voxy-render-runtime-go-nogo-matrix:1",
    requestDraftId: "voxy-render-request-draft:1",
    scriptRef: { id: "script-1", title: "Voxy Script", href: "/admin/review" },
    contributionRef: { id: "review-item-1", title: "Sichere Schulwege", href: "/admin/review" },
    dossierRef: { id: "dossier-1", title: "Sichere Schulwege", href: "/dossier/demo" },
    reviewerRef: { id: "admin-1", title: "Admin", href: null },
    createdAt: "2026-07-11T10:10:00.000Z",
    updatedAt: "2026-07-11T10:10:00.000Z",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
    handoffStatus: "not_distribution_ready",
    platformCandidates: [],
    copyVariants: [],
    scheduleCandidate: {
      scheduleCandidateId: null,
      status: "no_schedule",
      suggestedWindow: null,
      scheduled: false,
      schedulingAllowed: false,
      reviewerVisibleReason: "Kein Scheduling.",
      userVisibleReason: "Kein Scheduling.",
    },
    distributionSemantics: {
      publishReady: false,
      published: false,
      uploaded: false,
      scheduled: false,
      socialPosted: false,
      platformApiCalled: false,
      autoPublishAllowed: false,
    },
    guardEffects: {
      blocksUpload: true,
      blocksScheduling: true,
      blocksSocialPosting: true,
      blocksPublish: true,
      createsUpload: false,
      createsSchedule: false,
      createsSocialPost: false,
      triggersPublish: false,
      createsRenderJob: false,
      triggersRerender: false,
      triggersProvider: false,
      createsQueueJob: false,
      createsMediaFile: false,
      costDebitAllowed: false,
      creditDebitAllowed: false,
      runtimeClaimAllowed: false,
    },
    executionFlags: {
      publishAllowed: false,
      uploadAllowed: false,
      schedulingAllowed: false,
      socialPostAllowed: false,
      autoPublishAllowed: false,
      platformApiCallAllowed: false,
      previewRendered: false,
      renderAllowed: false,
      rerenderAllowed: false,
      queueAllowed: false,
      workerAllowed: false,
      providerExecutionAllowed: false,
      secretsAccessed: false,
      mediaFileCreationAllowed: false,
      previewFileAvailable: false,
      costDebitAllowed: false,
      creditDebitAllowed: false,
      runtimeClaimAllowed: false,
    },
    topBlockers: ["Distribution bleibt review-first."],
    nextStep: "prepare_copy_review",
    userVisibleSummary: "Distribution bleibt review-first.",
    reviewerVisibleSummary: "Distribution bleibt review-first.",
    publishGuardStatusHint: "review_ready_only",
    previewOutcomeTypeHint: "mark_review_ready",
    previewOutcomeStatusHint: "review_ready_only",
    previewReviewDecisionTypeHint: "mark_review_ready",
    previewReviewDecisionStatusHint: "persisted_audit_only",
    previewReviewFlowStatusHint: "no_preview_available",
    ...overrides,
  } as any;
}

describe("voxy render approval semantics contract", () => {
  it("blocks when the social distribution handoff is missing", () => {
    expect(
      deriveVoxyRenderApprovalSemanticsStatus({
        socialDistributionHandoffId: null,
        reviewReady: false,
        approvalCandidate: false,
        mediaGate: { status: "needs_review" },
        humanApprovalGate: { status: "not_applicable" },
        publishGuardGate: { status: "needs_review" },
        runtimeGate: { status: "needs_review" },
      } as any),
    ).toBe("blocked_by_missing_distribution_handoff");
  });

  it("maps blocked publish guards to approval blockers", () => {
    expect(
      deriveVoxyRenderApprovalSemanticsStatus({
        socialDistributionHandoffId: "handoff-1",
        publishGuardStatusHint: "not_publish_ready",
        reviewReady: false,
        approvalCandidate: true,
        mediaGate: { status: "needs_review" },
        humanApprovalGate: { status: "needs_review" },
        publishGuardGate: { status: "blocked" },
        runtimeGate: { status: "needs_review" },
      } as any),
    ).toBe("blocked_by_publish_guard");
  });

  it("keeps review-ready approval semantics separate from approved", () => {
    const command = buildVoxyRenderApprovalSemanticsCommandFromReadmodels({
      previewFlow: buildPreviewFlow(),
      latestPublishReadinessGuardRecord: buildPublishGuardRecord(),
      latestSocialDistributionHandoffRecord: buildSocialDistributionRecord(),
    });

    expect(command).toMatchObject({
      approvalStatus: "blocked_by_missing_human_approval",
      approvalSemantics: {
        reviewReady: true,
        approvalCandidate: true,
        approved: false,
        uploaded: false,
        scheduled: false,
        socialPosted: false,
        published: false,
      },
      approvalCandidate: {
        status: "needs_human_approval",
        approvalAllowed: false,
        approved: false,
      },
      executionFlags: {
        approvalExecutionAllowed: false,
        publishAllowed: false,
        uploadAllowed: false,
        schedulingAllowed: false,
        socialPostAllowed: false,
      },
      approvalEffects: {
        marksApproved: false,
        createsUpload: false,
        createsSchedule: false,
        createsSocialPost: false,
        triggersPublish: false,
      },
    });
  });

  it("blocks on missing media when the publish guard still lacks media truth", () => {
    const command = buildVoxyRenderApprovalSemanticsCommandFromReadmodels({
      previewFlow: buildPreviewFlow(),
      latestPublishReadinessGuardRecord: buildPublishGuardRecord({
        mediaGate: {
          gateKey: "media",
          label: "Media Gate",
          status: "no_go",
          reviewerVisibleReason: "Keine Medien-Datei.",
          userVisibleReason: "Keine Medien-Datei.",
          nextAction: "require_real_media_file",
          executionAllowed: false,
        },
      }),
      latestSocialDistributionHandoffRecord: buildSocialDistributionRecord(),
      approverRef: { id: "approver-1", title: "Chefredaktion", href: null },
    });

    expect(command?.approvalStatus).toBe("blocked_by_missing_media");
    expect(command?.nextStep).toBe("require_real_media_file");
  });

  it("keeps script-only cases outside approval execution", () => {
    const command = buildVoxyRenderApprovalSemanticsCommandFromReadmodels({
      previewFlow: buildPreviewFlow(),
      latestPublishReadinessGuardRecord: buildPublishGuardRecord({
        guardStatus: "keep_as_script_only",
        previewOutcomeTypeHint: "keep_as_script_only",
      }),
      latestSocialDistributionHandoffRecord: buildSocialDistributionRecord({
        handoffStatus: "keep_as_script_only",
        previewOutcomeTypeHint: "keep_as_script_only",
      }),
    });

    expect(command?.approvalStatus).toBe("keep_as_script_only");
    expect(command?.approvalCandidate.status).toBe("not_applicable");
    expect(command?.executionFlags.approvalExecutionAllowed).toBe(false);
  });

  it("renders human-readable approval semantics without raw enum strings", () => {
    const model = buildVoxyRenderApprovalSemanticsPanelModel({
      previewFlow: buildPreviewFlow(),
      latestPublishReadinessGuardRecord: buildPublishGuardRecord(),
      latestSocialDistributionHandoffRecord: buildSocialDistributionRecord(),
    });

    const html = renderToStaticMarkup(
      <VoxyRenderApprovalSemanticsPanel model={model} />,
    );

    expect(html).toContain("Approval Semantik");
    expect(html).toContain("Approved ist nicht uploaded");
    expect(html).toContain("Review-ready ist nicht approved");
    expect(html).toContain("Keine Veröffentlichung");
    expect(html).not.toContain("blocked_by_missing_human_approval");
    expect(html).not.toContain("needs_human_approval");
  });
});
