import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import VoxyRenderSocialDistributionHandoffPanel from "@/features/create/VoxyRenderSocialDistributionHandoffPanel";
import {
  buildVoxyRenderSocialDistributionHandoffCommandFromReadmodels,
  buildVoxyRenderSocialDistributionHandoffPanelModel,
  deriveVoxyRenderSocialDistributionHandoffStatus,
} from "@/features/create/voxyRenderSocialDistributionHandoffContract";

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
      reviewerVisibleReason: "Review-ready ist nur review-ready.",
      userVisibleReason: "Review-ready ist noch keine Veröffentlichung.",
      nextAction: "keep_review_ready_only",
      executionAllowed: false,
    },
    approvalGate: {
      gateKey: "approval",
      label: "Approval Gate",
      status: "needs_approval",
      reviewerVisibleReason: "Freigabe fehlt.",
      userVisibleReason: "Freigabe fehlt.",
      nextAction: "request_human_approval",
      executionAllowed: false,
    },
    mediaGate: {
      gateKey: "media",
      label: "Media Gate",
      status: "no_go",
      reviewerVisibleReason: "Keine Medien-Datei.",
      userVisibleReason: "Keine Medien-Datei.",
      nextAction: "require_real_media_file",
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
      reviewerVisibleReason: "Keine Scheduling-Policy.",
      userVisibleReason: "Keine Scheduling-Policy.",
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
      status: "blocked",
      reviewerVisibleReason: "Runtime bleibt blockiert.",
      userVisibleReason: "Runtime bleibt blockiert.",
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
    guardEffects: {
      blocksPublish: true,
      blocksUpload: true,
      blocksScheduling: true,
      blocksSocialPosting: true,
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
    topBlockers: ["Kein Upload."],
    nextStep: "require_upload_runtime",
    userVisibleSummary: "Publish Readiness bleibt blockiert.",
    reviewerVisibleSummary: "Audit-only Publish Guard.",
    previewOutcomeTypeHint: "mark_review_ready",
    previewOutcomeStatusHint: "review_ready_only",
    previewReviewDecisionTypeHint: "mark_review_ready",
    previewReviewDecisionStatusHint: "persisted_audit_only",
    previewReviewFlowStatusHint: "no_preview_available",
    persistedAt: "2026-07-11T10:10:00.000Z",
    persistedBy: "admin-1",
    idempotencyKey: "guard-1",
    previousPublishReadinessGuardRef: null,
    supersedesPublishReadinessGuardRef: null,
    guardVersion: 1,
    ...overrides,
  } as any;
}

describe("voxy render social distribution handoff contract", () => {
  it("blocks when the publish readiness guard is missing", () => {
    expect(
      deriveVoxyRenderSocialDistributionHandoffStatus({
        publishReadinessGuardId: null,
      }),
    ).toBe("blocked_by_missing_publish_readiness_guard");
  });

  it("maps publish-guard statuses to social-distribution blockers", () => {
    expect(
      deriveVoxyRenderSocialDistributionHandoffStatus({
        publishReadinessGuardId: "guard-1",
        publishGuardStatusHint: "not_publish_ready",
      }),
    ).toBe("blocked_by_publish_guard");
    expect(
      deriveVoxyRenderSocialDistributionHandoffStatus({
        publishReadinessGuardId: "guard-1",
        publishGuardStatusHint: "media_required",
      }),
    ).toBe("blocked_by_missing_media");
    expect(
      deriveVoxyRenderSocialDistributionHandoffStatus({
        publishReadinessGuardId: "guard-1",
        publishGuardStatusHint: "upload_blocked",
      }),
    ).toBe("blocked_by_upload_guard");
    expect(
      deriveVoxyRenderSocialDistributionHandoffStatus({
        publishReadinessGuardId: "guard-1",
        publishGuardStatusHint: "scheduling_blocked",
      }),
    ).toBe("blocked_by_scheduling_guard");
    expect(
      deriveVoxyRenderSocialDistributionHandoffStatus({
        publishReadinessGuardId: "guard-1",
        publishGuardStatusHint: "social_posting_blocked",
      }),
    ).toBe("blocked_by_social_posting_guard");
    expect(
      deriveVoxyRenderSocialDistributionHandoffStatus({
        publishReadinessGuardId: "guard-1",
        publishGuardStatusHint: "keep_as_script_only",
      }),
    ).toBe("keep_as_script_only");
  });

  it("keeps platforms candidate-only and copy as review drafts without posting", () => {
    const command = buildVoxyRenderSocialDistributionHandoffCommandFromReadmodels({
      previewFlow: null,
      latestPublishReadinessGuardRecord: buildPublishGuardRecord({
        guardStatus: "review_ready_only",
        mediaGate: {
          gateKey: "media",
          label: "Media Gate",
          status: "not_applicable",
          reviewerVisibleReason: "Noch keine Medienbehauptung.",
          userVisibleReason: "Noch keine Medienbehauptung.",
          nextAction: "keep_review_ready_only",
          executionAllowed: false,
        },
        uploadGate: {
          gateKey: "upload",
          label: "Upload Gate",
          status: "not_applicable",
          reviewerVisibleReason: "Kein Upload-Claim.",
          userVisibleReason: "Kein Upload-Claim.",
          nextAction: "keep_review_ready_only",
          executionAllowed: false,
        },
        schedulingGate: {
          gateKey: "scheduling",
          label: "Scheduling Gate",
          status: "not_applicable",
          reviewerVisibleReason: "Kein Schedule-Claim.",
          userVisibleReason: "Kein Schedule-Claim.",
          nextAction: "keep_review_ready_only",
          executionAllowed: false,
        },
        socialPostingGate: {
          gateKey: "social_posting",
          label: "Social Posting Gate",
          status: "not_applicable",
          reviewerVisibleReason: "Kein Posting-Claim.",
          userVisibleReason: "Kein Posting-Claim.",
          nextAction: "keep_review_ready_only",
          executionAllowed: false,
        },
      }),
    });

    expect(command.handoffStatus).toBe("not_distribution_ready");
    expect(command.platformCandidates.every((item) => item.status === "candidate_only")).toBe(true);
    expect(
      command.platformCandidates.every(
        (item) =>
          item.platformApiCallAllowed === false &&
          item.uploadAllowed === false &&
          item.postAllowed === false &&
          item.scheduleAllowed === false,
      ),
    ).toBe(true);
    expect(
      command.copyVariants.every(
        (item) =>
          (item.status === "draft_only" || item.status === "needs_review") &&
          item.posted === false &&
          item.scheduled === false &&
          item.platformApiCallAllowed === false,
      ),
    ).toBe(true);
    expect(command.scheduleCandidate.scheduled).toBe(false);
    expect(command.scheduleCandidate.schedulingAllowed).toBe(false);
    expect(command.scheduleCandidate.suggestedWindow).toBeNull();
    expect(command.distributionSemantics.publishReady).toBe(false);
    expect(command.distributionSemantics.published).toBe(false);
    expect(command.distributionSemantics.uploaded).toBe(false);
    expect(command.distributionSemantics.socialPosted).toBe(false);
    expect(command.executionFlags.renderAllowed).toBe(false);
    expect(command.executionFlags.rerenderAllowed).toBe(false);
    expect(command.executionFlags.queueAllowed).toBe(false);
    expect(command.executionFlags.workerAllowed).toBe(false);
    expect(command.executionFlags.providerExecutionAllowed).toBe(false);
    expect(command.executionFlags.secretsAccessed).toBe(false);
    expect(command.executionFlags.mediaFileCreationAllowed).toBe(false);
    expect(command.executionFlags.costDebitAllowed).toBe(false);
    expect(command.executionFlags.publishAllowed).toBe(false);
    expect(command.executionFlags.uploadAllowed).toBe(false);
    expect(command.executionFlags.schedulingAllowed).toBe(false);
    expect(command.executionFlags.socialPostAllowed).toBe(false);
  });

  it("renders user-facing labels instead of raw enum values", () => {
    const model = buildVoxyRenderSocialDistributionHandoffPanelModel({
      previewFlow: null,
      latestPublishReadinessGuardRecord: buildPublishGuardRecord({
        guardStatus: "upload_blocked",
      }),
    });

    const html = renderToStaticMarkup(
      <VoxyRenderSocialDistributionHandoffPanel model={model} />,
    );

    expect(html).toContain("Social Distribution");
    expect(html).toContain("Noch kein Posting");
    expect(html).toContain("Kein Upload");
    expect(html).toContain("Keine Plattform-API");
    expect(html).not.toContain("blocked_by_upload_guard");
    expect(html).not.toContain("candidate_only");
    expect(html).not.toContain("draft_only");
  });
});
