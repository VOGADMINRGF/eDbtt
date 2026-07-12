import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdmin(...args),
}));

import { GET, POST } from "@/app/api/admin/voxy-render-upload-target-policies/route";
import {
  createInMemoryVoxyRenderUploadTargetPolicyRepository,
  setVoxyRenderUploadTargetPolicyRepositoryForTests,
} from "@/features/create/voxyRenderUploadTargetPolicyStore";

function req(url: string, init?: RequestInit) {
  return new NextRequest(url, init);
}

function buildCommand() {
  return {
    mediaStorageTruthId: "voxy-render-media-storage-truth:1",
    approvalSemanticsId: "voxy-render-approval-semantics:1",
    socialDistributionHandoffId: "voxy-render-social-distribution-handoff:1",
    publishReadinessGuardId: "voxy-render-publish-readiness-guard:1",
    previewOutcomeHandoffId: "voxy-render-preview-outcome-handoff:1",
    enablementBacklogId: "voxy-render-runtime-enablement-backlog:1",
    matrixId: "voxy-render-runtime-go-nogo-matrix:1",
    requestDraftId: "voxy-render-request-draft:1",
    scriptRef: { id: "script-1", title: "Voxy Script", href: "/admin/review" },
    contributionRef: { id: "review-item-1", title: "Sichere Schulwege", href: "/admin/review" },
    dossierRef: { id: "dossier-1", title: "Sichere Schulwege", href: "/dossier/demo" },
    reviewerRef: null,
    createdAt: "2026-07-12T10:00:00.000Z",
    updatedAt: null,
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
    uploadTargetPolicyStatus: "blocked_by_missing_media_file",
    uploadTargetCandidate: {
      uploadTargetCandidateId: null,
      status: "no_target",
      provider: "requirement_only",
      bucketOrContainer: null,
      basePath: null,
      publicBaseUrl: null,
      writeAllowed: false,
      uploadAllowed: false,
      publicAccessAllowed: false,
      signedAccessAllowed: false,
      reviewerVisibleReason: "Noch kein Upload-Ziel definiert.",
      userVisibleReason: "Noch kein Upload-Ziel definiert.",
    },
    accessPolicy: {
      accessPolicyId: null,
      visibility: "unknown",
      signedAccessCandidate: false,
      signedUrlCreated: false,
      publicUrlCreated: false,
      downloadAllowed: false,
      shareAllowed: false,
      reviewerVisibleReason: "Access-Policy fehlt.",
      userVisibleReason: "Access-Policy fehlt.",
    },
    signedAccessPolicyDefined: false,
    retentionPolicy: {
      retentionPolicyId: null,
      status: "policy_needed",
      retentionDays: null,
      deletionJobCreated: false,
      deletionAllowed: false,
      reviewerVisibleReason: "Retention-Policy fehlt.",
      userVisibleReason: "Retention-Policy fehlt.",
    },
    deletionPolicy: {
      deletionPolicyId: null,
      status: "policy_needed",
      deletionJobCreated: false,
      deletionAllowed: false,
      reviewerVisibleReason: "Deletion-Policy fehlt.",
      userVisibleReason: "Deletion-Policy fehlt.",
    },
    uploadSemantics: {
      uploadCandidate: true,
      uploadReady: false,
      uploaded: false,
      storageWriteAllowed: false,
      signedUrlAvailable: false,
      publicUrlAvailable: false,
      mediaFileAvailable: false,
      previewFileAvailable: false,
      published: false,
      socialPosted: false,
      scheduled: false,
    },
    executionFlags: {
      uploadAllowed: false,
      storageWriteAllowed: false,
      signedUrlCreationAllowed: false,
      publicUrlCreationAllowed: false,
      deletionJobAllowed: false,
      publishAllowed: false,
      schedulingAllowed: false,
      socialPostAllowed: false,
      autoPublishAllowed: false,
      createsMediaFile: false,
      previewRendered: false,
      renderAllowed: false,
      rerenderAllowed: false,
      queueAllowed: false,
      workerAllowed: false,
      providerExecutionAllowed: false,
      secretsAccessed: false,
      costDebitAllowed: false,
      creditDebitAllowed: false,
      runtimeClaimAllowed: false,
    },
    topBlockers: [
      "Es gibt noch keine echte Medien-Datei.",
      "Noch kein Upload-Ziel definiert.",
      "Access-Policy fehlt.",
    ],
    nextStep: "require_real_media_file",
    userVisibleSummary: "Upload Target Policy bleibt blockiert.",
    reviewerVisibleSummary: "Upload Target Policy bleibt audit-only/noop.",
    mediaStorageTruthStatusHint: "blocked_by_missing_preview_file",
    approvalStatusHint: "approval_required",
    publishReadinessGuardStatusHint: "approval_required",
    socialDistributionHandoffStatusHint: "blocked_by_upload_guard",
    previewReviewFlowStatusHint: "no_preview_available",
  } as const;
}

describe("voxy render upload target policy admin route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({
      _id: {
        toHexString: () => "admin-1",
      },
    });
    setVoxyRenderUploadTargetPolicyRepositoryForTests(
      createInMemoryVoxyRenderUploadTargetPolicyRepository(),
    );
  });

  it("persists upload target policy as audit-only records without uploads or urls", async () => {
    const postRes = await POST(
      req("http://localhost/api/admin/voxy-render-upload-target-policies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildCommand()),
      }),
    );

    expect(postRes.status).toBe(200);
    await expect(postRes.json()).resolves.toMatchObject({
      ok: true,
      result: {
        ok: true,
        status: "noop",
        record: {
          mediaStorageTruthId: "voxy-render-media-storage-truth:1",
          uploadTargetPolicyStatus: "blocked_by_missing_media_file",
          persistedBy: "admin-1",
          uploadTargetCandidate: {
            publicBaseUrl: null,
            writeAllowed: false,
            uploadAllowed: false,
          },
          accessPolicy: {
            signedUrlCreated: false,
            publicUrlCreated: false,
          },
        },
      },
      auditEvent: {
        action: "upload_target_policy_recorded",
        mediaStorageTruthId: "voxy-render-media-storage-truth:1",
      },
      persistence: {
        mode: "in_memory_fallback",
        adminWritePath: "admin_api_available",
      },
    });

    const getRes = await GET(
      req(
        "http://localhost/api/admin/voxy-render-upload-target-policies?mediaStorageTruthId=voxy-render-media-storage-truth:1&limit=5",
      ),
    );

    expect(getRes.status).toBe(200);
    await expect(getRes.json()).resolves.toMatchObject({
      ok: true,
      latestRecord: {
        mediaStorageTruthId: "voxy-render-media-storage-truth:1",
        uploadTargetPolicyStatus: "blocked_by_missing_media_file",
      },
      records: [
        {
          mediaStorageTruthId: "voxy-render-media-storage-truth:1",
          previewReviewFlowId: null,
        },
      ],
      auditEvents: [
        {
          action: "upload_target_policy_recorded",
          mediaStorageTruthId: "voxy-render-media-storage-truth:1",
        },
      ],
      persistence: {
        mode: "in_memory_fallback",
      },
    });
  });

  it("blocks commands when the media storage truth reference is missing", async () => {
    const command = { ...buildCommand(), mediaStorageTruthId: null };
    const res = await POST(
      req("http://localhost/api/admin/voxy-render-upload-target-policies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(command),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      result: {
        ok: false,
        status: "blocked",
        errors: ["media_storage_truth_required"],
      },
    });
  });

  it("rejects fake upload target urls", async () => {
    const command = {
      ...buildCommand(),
      uploadTargetCandidate: {
        ...buildCommand().uploadTargetCandidate,
        publicBaseUrl: "https://example.org/public",
      },
    };
    const res = await POST(
      req("http://localhost/api/admin/voxy-render-upload-target-policies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(command),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      result: {
        ok: false,
        status: "blocked",
        errors: ["public_base_url_must_remain_empty"],
      },
    });
  });
});
