import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import VoxyRenderUploadTargetPolicyPanel from "@/features/create/VoxyRenderUploadTargetPolicyPanel";
import {
  buildVoxyRenderUploadTargetPolicyCommandFromReadmodels,
  buildVoxyRenderUploadTargetPolicyPanelModel,
  deriveVoxyRenderUploadTargetPolicyStatus,
} from "@/features/create/voxyRenderUploadTargetPolicyContract";

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
    createdAt: "2026-07-12T09:00:00.000Z",
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
    previewReviewDecisionRecordId: "voxy-render-preview-review-decision:1",
    previewReviewFlowId: "voxy-render-preview-review-flow:1",
    enablementBacklogId: "voxy-render-runtime-enablement-backlog:1",
    matrixId: "voxy-render-runtime-go-nogo-matrix:1",
    requestDraftId: "voxy-render-request-draft:1",
    scriptRef: { id: "script-1", title: "Voxy Script", href: "/admin/review" },
    contributionRef: { id: "review-item-1", title: "Sichere Schulwege", href: "/admin/review" },
    dossierRef: { id: "dossier-1", title: "Sichere Schulwege", href: "/dossier/demo" },
    reviewerRef: { id: "admin-1", title: "Admin", href: null },
    createdAt: "2026-07-12T09:05:00.000Z",
    updatedAt: "2026-07-12T09:05:00.000Z",
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
    previewReviewDecisionRecordId: "voxy-render-preview-review-decision:1",
    previewReviewFlowId: "voxy-render-preview-review-flow:1",
    enablementBacklogId: "voxy-render-runtime-enablement-backlog:1",
    matrixId: "voxy-render-runtime-go-nogo-matrix:1",
    requestDraftId: "voxy-render-request-draft:1",
    scriptRef: { id: "script-1", title: "Voxy Script", href: "/admin/review" },
    contributionRef: { id: "review-item-1", title: "Sichere Schulwege", href: "/admin/review" },
    dossierRef: { id: "dossier-1", title: "Sichere Schulwege", href: "/dossier/demo" },
    reviewerRef: { id: "admin-1", title: "Admin", href: null },
    createdAt: "2026-07-12T09:10:00.000Z",
    updatedAt: "2026-07-12T09:10:00.000Z",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
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
    ...overrides,
  } as any;
}

describe("voxy render upload target policy contract", () => {
  it("blocks when media storage truth is missing", () => {
    expect(
      deriveVoxyRenderUploadTargetPolicyStatus({
        mediaStorageTruthId: null,
        mediaStorageTruthStatusHint: null,
        approvalStatusHint: null,
        publishReadinessGuardStatusHint: null,
        socialDistributionHandoffStatusHint: null,
        previewReviewFlowStatusHint: "preview_review_flow_only",
        mediaFileAvailable: false,
        uploadTargetStatus: "no_target",
        accessPolicyVisibility: "unknown",
        signedAccessCandidate: false,
        signedAccessPolicyDefined: false,
        retentionPolicyStatus: "policy_needed",
        deletionPolicyStatus: "policy_needed",
      }),
    ).toBe("blocked_by_missing_media_storage_truth");
  });

  it("keeps script-only flows at no upload target", () => {
    const command = buildVoxyRenderUploadTargetPolicyCommandFromReadmodels({
      previewFlow: buildPreviewFlow({ previewStatus: "keep_as_script_only" }),
      latestApprovalSemanticsRecord: buildApprovalRecord({ approvalStatus: "keep_as_script_only" }),
      latestMediaStorageTruthRecord: buildMediaStorageRecord({
        mediaStorageTruthStatus: "keep_as_script_only",
      }),
    });

    expect(command).toMatchObject({
      uploadTargetPolicyStatus: "keep_as_script_only",
      uploadTargetCandidate: {
        status: "no_target",
        bucketOrContainer: null,
        basePath: null,
        publicBaseUrl: null,
      },
      nextStep: "keep_as_script_only",
    });
  });

  it("keeps missing media files separate from upload policy", () => {
    const command = buildVoxyRenderUploadTargetPolicyCommandFromReadmodels({
      previewFlow: buildPreviewFlow({ previewStatus: "no_preview_available" }),
      latestApprovalSemanticsRecord: buildApprovalRecord(),
      latestMediaStorageTruthRecord: buildMediaStorageRecord(),
    });

    expect(command).toMatchObject({
      uploadTargetPolicyStatus: "blocked_by_missing_media_file",
      uploadTargetCandidate: {
        status: "no_target",
        uploadAllowed: false,
        publicBaseUrl: null,
      },
      accessPolicy: {
        visibility: "unknown",
        signedUrlCreated: false,
        publicUrlCreated: false,
      },
      uploadSemantics: {
        uploaded: false,
        mediaFileAvailable: false,
        previewFileAvailable: false,
      },
      executionFlags: {
        uploadAllowed: false,
        storageWriteAllowed: false,
        signedUrlCreationAllowed: false,
        publicUrlCreationAllowed: false,
      },
    });
  });

  it("separates missing provider, access, signed access, retention and deletion policies", () => {
    expect(
      deriveVoxyRenderUploadTargetPolicyStatus({
        mediaStorageTruthId: "voxy-render-media-storage-truth:1",
        mediaStorageTruthStatusHint: "media_storage_truth_only",
        approvalStatusHint: "approval_required",
        publishReadinessGuardStatusHint: "approval_required",
        socialDistributionHandoffStatusHint: "blocked_by_upload_guard",
        previewReviewFlowStatusHint: "preview_review_flow_only",
        mediaFileAvailable: true,
        uploadTargetStatus: "provider_needed",
        accessPolicyVisibility: "unknown",
        signedAccessCandidate: false,
        signedAccessPolicyDefined: false,
        retentionPolicyStatus: "policy_needed",
        deletionPolicyStatus: "policy_needed",
      }),
    ).toBe("storage_provider_needed");

    expect(
      deriveVoxyRenderUploadTargetPolicyStatus({
        mediaStorageTruthId: "voxy-render-media-storage-truth:1",
        mediaStorageTruthStatusHint: "media_storage_truth_only",
        approvalStatusHint: "approval_required",
        publishReadinessGuardStatusHint: "approval_required",
        socialDistributionHandoffStatusHint: "blocked_by_upload_guard",
        previewReviewFlowStatusHint: "preview_review_flow_only",
        mediaFileAvailable: true,
        uploadTargetStatus: "access_policy_needed",
        accessPolicyVisibility: "unknown",
        signedAccessCandidate: false,
        signedAccessPolicyDefined: false,
        retentionPolicyStatus: "policy_needed",
        deletionPolicyStatus: "policy_needed",
      }),
    ).toBe("access_policy_needed");

    expect(
      deriveVoxyRenderUploadTargetPolicyStatus({
        mediaStorageTruthId: "voxy-render-media-storage-truth:1",
        mediaStorageTruthStatusHint: "media_storage_truth_only",
        approvalStatusHint: "approval_required",
        publishReadinessGuardStatusHint: "approval_required",
        socialDistributionHandoffStatusHint: "blocked_by_upload_guard",
        previewReviewFlowStatusHint: "preview_review_flow_only",
        mediaFileAvailable: true,
        uploadTargetStatus: "candidate_only",
        accessPolicyVisibility: "internal_review_only",
        signedAccessCandidate: true,
        signedAccessPolicyDefined: false,
        retentionPolicyStatus: "policy_needed",
        deletionPolicyStatus: "policy_needed",
      }),
    ).toBe("signed_access_policy_needed");

    expect(
      deriveVoxyRenderUploadTargetPolicyStatus({
        mediaStorageTruthId: "voxy-render-media-storage-truth:1",
        mediaStorageTruthStatusHint: "media_storage_truth_only",
        approvalStatusHint: "approval_required",
        publishReadinessGuardStatusHint: "approval_required",
        socialDistributionHandoffStatusHint: "blocked_by_upload_guard",
        previewReviewFlowStatusHint: "preview_review_flow_only",
        mediaFileAvailable: true,
        uploadTargetStatus: "candidate_only",
        accessPolicyVisibility: "internal_review_only",
        signedAccessCandidate: false,
        signedAccessPolicyDefined: true,
        retentionPolicyStatus: "policy_needed",
        deletionPolicyStatus: "policy_needed",
      }),
    ).toBe("retention_policy_needed");

    expect(
      deriveVoxyRenderUploadTargetPolicyStatus({
        mediaStorageTruthId: "voxy-render-media-storage-truth:1",
        mediaStorageTruthStatusHint: "media_storage_truth_only",
        approvalStatusHint: "approval_required",
        publishReadinessGuardStatusHint: "approval_required",
        socialDistributionHandoffStatusHint: "blocked_by_upload_guard",
        previewReviewFlowStatusHint: "preview_review_flow_only",
        mediaFileAvailable: true,
        uploadTargetStatus: "candidate_only",
        accessPolicyVisibility: "internal_review_only",
        signedAccessCandidate: false,
        signedAccessPolicyDefined: true,
        retentionPolicyStatus: "candidate_only",
        deletionPolicyStatus: "policy_needed",
      }),
    ).toBe("deletion_policy_needed");
  });

  it("keeps upload target semantics free of uploads, urls and publish claims", () => {
    const command = buildVoxyRenderUploadTargetPolicyCommandFromReadmodels({
      previewFlow: buildPreviewFlow(),
      latestApprovalSemanticsRecord: buildApprovalRecord(),
      latestMediaStorageTruthRecord: buildMediaStorageRecord({
        mediaStorageTruthStatus: "media_storage_truth_only",
      }),
    });

    expect(command).toMatchObject({
      uploadTargetCandidate: {
        bucketOrContainer: null,
        basePath: null,
        publicBaseUrl: null,
        writeAllowed: false,
        uploadAllowed: false,
        publicAccessAllowed: false,
        signedAccessAllowed: false,
      },
      accessPolicy: {
        signedUrlCreated: false,
        publicUrlCreated: false,
        downloadAllowed: false,
        shareAllowed: false,
      },
      retentionPolicy: {
        retentionDays: null,
        deletionJobCreated: false,
      },
      deletionPolicy: {
        deletionJobCreated: false,
      },
      uploadSemantics: {
        uploadReady: false,
        uploaded: false,
        signedUrlAvailable: false,
        publicUrlAvailable: false,
        mediaFileAvailable: false,
        published: false,
      },
      executionFlags: {
        uploadAllowed: false,
        signedUrlCreationAllowed: false,
        publicUrlCreationAllowed: false,
        deletionJobAllowed: false,
        renderAllowed: false,
        rerenderAllowed: false,
        queueAllowed: false,
        workerAllowed: false,
        providerExecutionAllowed: false,
        secretsAccessed: false,
        costDebitAllowed: false,
      },
    });
  });

  it("renders the panel with explicit non-goals and no raw urls", () => {
    const model = buildVoxyRenderUploadTargetPolicyPanelModel({
      previewFlow: buildPreviewFlow(),
      latestApprovalSemanticsRecord: buildApprovalRecord(),
      latestMediaStorageTruthRecord: buildMediaStorageRecord(),
    });
    const html = renderToStaticMarkup(
      <VoxyRenderUploadTargetPolicyPanel model={model} dataTestId="upload-target-policy" />,
    );

    expect(html).toContain("Upload Target Policy");
    expect(html).toContain("Noch kein Upload");
    expect(html).toContain("Keine Signed URL");
    expect(html).toContain("Kein Delete Job");
    expect(html).toContain("Access Policy");
    expect(html).toContain("Retention Policy");
    expect(html).not.toContain("http://");
    expect(html).not.toContain("https://");
  });
});
