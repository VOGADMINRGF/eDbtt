import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import VoxyRenderSchedulingPolicyPanel from "@/features/create/VoxyRenderSchedulingPolicyPanel";
import {
  buildVoxyRenderSchedulingPolicyCommandFromReadmodels,
  buildVoxyRenderSchedulingPolicyPanelModel,
  deriveVoxyRenderSchedulingPolicyStatus,
} from "@/features/create/voxyRenderSchedulingPolicyContract";

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
    createdAt: "2026-07-12T11:00:00.000Z",
    previewStatus: "no_preview_available",
    topBlockers: ["Noch kein Preview verfügbar."],
    ...overrides,
  } as any;
}

function buildApprovalRecord(overrides?: Record<string, unknown>) {
  return {
    approvalSemanticsId: "voxy-render-approval-semantics:1",
    socialDistributionHandoffId: "voxy-render-social-distribution-handoff:1",
    publishReadinessGuardId: "voxy-render-publish-readiness-guard:1",
    previewOutcomeHandoffId: "voxy-render-preview-outcome-handoff:1",
    previewReviewFlowId: "voxy-render-preview-review-flow:1",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
    approvalStatus: "approval_required",
    ...overrides,
  } as any;
}

function buildMediaStorageRecord(overrides?: Record<string, unknown>) {
  return {
    mediaStorageTruthId: "voxy-render-media-storage-truth:1",
    approvalSemanticsId: "voxy-render-approval-semantics:1",
    socialDistributionHandoffId: "voxy-render-social-distribution-handoff:1",
    publishReadinessGuardId: "voxy-render-publish-readiness-guard:1",
    previewOutcomeHandoffId: "voxy-render-preview-outcome-handoff:1",
    previewReviewFlowId: "voxy-render-preview-review-flow:1",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
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

function buildUploadTargetRecord(overrides?: Record<string, unknown>) {
  return {
    uploadTargetPolicyId: "voxy-render-upload-target-policy:1",
    mediaStorageTruthId: "voxy-render-media-storage-truth:1",
    approvalSemanticsId: "voxy-render-approval-semantics:1",
    socialDistributionHandoffId: "voxy-render-social-distribution-handoff:1",
    publishReadinessGuardId: "voxy-render-publish-readiness-guard:1",
    previewOutcomeHandoffId: "voxy-render-preview-outcome-handoff:1",
    previewReviewFlowId: "voxy-render-preview-review-flow:1",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
    uploadTargetPolicyStatus: "access_policy_needed",
    ...overrides,
  } as any;
}

function buildSocialDistributionRecord(overrides?: Record<string, unknown>) {
  return {
    socialDistributionHandoffId: "voxy-render-social-distribution-handoff:1",
    publishReadinessGuardId: "voxy-render-publish-readiness-guard:1",
    previewOutcomeHandoffId: "voxy-render-preview-outcome-handoff:1",
    previewReviewFlowId: "voxy-render-preview-review-flow:1",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
    handoffStatus: "blocked_by_scheduling_guard",
    platformCandidates: [
      {
        platform: "linkedin",
        label: "LinkedIn",
        status: "candidate_only",
        platformApiCallAllowed: false,
        uploadAllowed: false,
        postAllowed: false,
        scheduleAllowed: false,
        reviewerVisibleReason: "LinkedIn bleibt Kandidat.",
        userVisibleReason: "LinkedIn bleibt Kandidat.",
      },
    ],
    copyVariants: [],
    scheduleCandidate: {
      scheduleCandidateId: "social-schedule-candidate:1",
      status: "candidate_only",
      suggestedWindow: null,
      scheduled: false,
      schedulingAllowed: false,
      reviewerVisibleReason: "Distribution-Time bleibt nur Kandidat.",
      userVisibleReason: "Noch kein echter Posting-Zeitpunkt.",
    },
    ...overrides,
  } as any;
}

describe("voxy render scheduling policy contract", () => {
  it("blocks when upload target policy is missing", () => {
    expect(
      deriveVoxyRenderSchedulingPolicyStatus({
        uploadTargetPolicyId: null,
        approvalSemanticsId: "voxy-render-approval-semantics:1",
        uploadTargetPolicyStatusHint: null,
        mediaStorageTruthStatusHint: "media_storage_truth_only",
        approvalStatusHint: "approval_required",
        publishReadinessGuardStatusHint: "approval_required",
        socialDistributionHandoffStatusHint: "blocked_by_scheduling_guard",
        previewReviewFlowStatusHint: "preview_review_flow_only",
        mediaFileAvailable: true,
        scheduleCandidateStatus: "candidate_only",
        publishWindowPolicyDefined: false,
        timezonePolicyDefined: false,
        platformTimingPolicyDefined: false,
        calendarPolicyDefined: false,
        schedulerRuntimeDefined: false,
      }),
    ).toBe("blocked_by_missing_upload_target_policy");
  });

  it("keeps script-only flows out of scheduling", () => {
    const command = buildVoxyRenderSchedulingPolicyCommandFromReadmodels({
      previewFlow: buildPreviewFlow({ previewStatus: "keep_as_script_only" }),
      latestApprovalSemanticsRecord: buildApprovalRecord({ approvalStatus: "keep_as_script_only" }),
      latestMediaStorageTruthRecord: buildMediaStorageRecord({
        mediaStorageTruthStatus: "keep_as_script_only",
      }),
      latestUploadTargetPolicyRecord: buildUploadTargetRecord({
        uploadTargetPolicyStatus: "keep_as_script_only",
      }),
      latestSocialDistributionHandoffRecord: buildSocialDistributionRecord(),
    });

    expect(command).toMatchObject({
      schedulingPolicyStatus: "keep_as_script_only",
      scheduleCandidate: {
        status: "not_applicable",
        scheduled: false,
      },
      nextStep: "keep_as_script_only",
    });
  });

  it("keeps missing media files separate from schedule planning", () => {
    const command = buildVoxyRenderSchedulingPolicyCommandFromReadmodels({
      previewFlow: buildPreviewFlow(),
      latestApprovalSemanticsRecord: buildApprovalRecord(),
      latestMediaStorageTruthRecord: buildMediaStorageRecord({
        mediaStorageTruthStatus: "blocked_by_missing_preview_file",
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
      latestUploadTargetPolicyRecord: buildUploadTargetRecord(),
      latestSocialDistributionHandoffRecord: buildSocialDistributionRecord(),
    });

    expect(command).toMatchObject({
      schedulingPolicyStatus: "blocked_by_missing_media_file",
      scheduleCandidate: {
        status: "blocked",
        scheduledAt: null,
        scheduled: false,
      },
      publishWindow: {
        earliestPublishAt: null,
        latestPublishAt: null,
      },
      schedulingSemantics: {
        scheduled: false,
        schedulerJobCreated: false,
        calendarEventCreated: false,
      },
      executionFlags: {
        schedulingAllowed: false,
        schedulerJobAllowed: false,
        calendarWriteAllowed: false,
      },
    });
  });

  it("renders an honest scheduling panel without planning ctas", () => {
    const model = buildVoxyRenderSchedulingPolicyPanelModel({
      previewFlow: buildPreviewFlow(),
      latestApprovalSemanticsRecord: buildApprovalRecord(),
      latestMediaStorageTruthRecord: buildMediaStorageRecord(),
      latestUploadTargetPolicyRecord: buildUploadTargetRecord(),
      latestSocialDistributionHandoffRecord: buildSocialDistributionRecord(),
    });

    const html = renderToStaticMarkup(
      <VoxyRenderSchedulingPolicyPanel model={model} dataTestId="voxy-render-scheduling-policy" />,
    );

    expect(html).toContain("Scheduling Policy");
    expect(html).toContain("Noch nicht geplant");
    expect(html).toContain("Kein Scheduler Job");
    expect(html).toContain("Kein Kalendertermin");
    expect(html).not.toContain("Jetzt planen");
    expect(html).not.toContain("Jetzt veröffentlichen");
  });
});
