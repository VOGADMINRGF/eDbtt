import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdmin(...args),
}));

import { GET, POST } from "@/app/api/admin/voxy-render-media-storage-truth/route";
import {
  createInMemoryVoxyRenderMediaStorageTruthRepository,
  setVoxyRenderMediaStorageTruthRepositoryForTests,
} from "@/features/create/voxyRenderMediaStorageTruthStore";

function req(url: string, init?: RequestInit) {
  return new NextRequest(url, init);
}

function buildCommand() {
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
    reviewerRef: null,
    createdAt: "2026-07-11T10:00:00.000Z",
    updatedAt: null,
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
    mediaStorageTruthStatus: "blocked_by_missing_preview_file",
    mediaCandidate: {
      mediaCandidateId: "media-candidate:1",
      status: "no_file",
      mediaKind: "preview_video",
      mimeType: null,
      fileSizeBytes: null,
      durationSeconds: null,
      checksum: null,
      width: null,
      height: null,
      publicUrl: null,
      signedUrl: null,
      storagePath: null,
      generated: false,
      rendered: false,
      uploaded: false,
      playable: false,
      downloadable: false,
      reviewerVisibleReason: "Noch keine Preview-Datei vorhanden.",
      userVisibleReason: "Noch keine Preview-Datei vorhanden.",
    },
    storageTarget: {
      targetId: null,
      provider: "requirement_only",
      status: "policy_needed",
      writeAllowed: false,
      readAllowed: false,
      publicAccessAllowed: false,
      signedAccessAllowed: false,
      retentionPolicyNeeded: true,
      reviewerVisibleReason: "Storage-Policy fehlt.",
      userVisibleReason: "Storage-Policy fehlt.",
    },
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
    executionFlags: {
      createsMediaFile: false,
      createsThumbnail: false,
      createsSubtitleFile: false,
      createsSourceCaptionFile: false,
      storageWriteAllowed: false,
      uploadAllowed: false,
      publishAllowed: false,
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
      costDebitAllowed: false,
      creditDebitAllowed: false,
      runtimeClaimAllowed: false,
    },
    topBlockers: [
      "Noch keine Preview-Datei vorhanden.",
      "Storage-Policy fehlt.",
    ],
    nextStep: "require_real_preview_file",
    userVisibleSummary: "Media & Storage bleibt blockiert.",
    reviewerVisibleSummary: "Media & Storage bleibt audit-only/noop.",
    approvalStatusHint: "approval_required",
    previewReviewFlowStatusHint: "no_preview_available",
  } as const;
}

describe("voxy render media storage truth admin route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({
      _id: {
        toHexString: () => "admin-1",
      },
    });
    setVoxyRenderMediaStorageTruthRepositoryForTests(
      createInMemoryVoxyRenderMediaStorageTruthRepository(),
    );
  });

  it("persists media/storage truth as audit-only records without storage writes", async () => {
    const postRes = await POST(
      req("http://localhost/api/admin/voxy-render-media-storage-truth", {
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
          approvalSemanticsId: "voxy-render-approval-semantics:1",
          mediaStorageTruthStatus: "blocked_by_missing_preview_file",
          persistedBy: "admin-1",
          mediaCandidate: {
            publicUrl: null,
            signedUrl: null,
            storagePath: null,
            generated: false,
            rendered: false,
          },
          storageTarget: {
            writeAllowed: false,
            publicAccessAllowed: false,
          },
        },
      },
      auditEvent: {
        action: "media_storage_truth_recorded",
        approvalSemanticsId: "voxy-render-approval-semantics:1",
      },
      persistence: {
        mode: "in_memory_fallback",
        adminWritePath: "admin_api_available",
      },
    });

    const getRes = await GET(
      req(
        "http://localhost/api/admin/voxy-render-media-storage-truth?approvalSemanticsId=voxy-render-approval-semantics:1&limit=5",
      ),
    );

    expect(getRes.status).toBe(200);
    await expect(getRes.json()).resolves.toMatchObject({
      ok: true,
      latestRecord: {
        approvalSemanticsId: "voxy-render-approval-semantics:1",
        mediaStorageTruthStatus: "blocked_by_missing_preview_file",
      },
      records: [
        {
          approvalSemanticsId: "voxy-render-approval-semantics:1",
          previewReviewFlowId: "voxy-render-preview-review-flow:1",
        },
      ],
      auditEvents: [
        {
          action: "media_storage_truth_recorded",
          approvalSemanticsId: "voxy-render-approval-semantics:1",
        },
      ],
      persistence: {
        mode: "in_memory_fallback",
      },
    });
  });

  it("blocks commands when the approval semantics reference is missing", async () => {
    const command = { ...buildCommand(), approvalSemanticsId: null };
    const res = await POST(
      req("http://localhost/api/admin/voxy-render-media-storage-truth", {
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
        errors: ["approval_semantics_required"],
      },
    });
  });

  it("rejects fake storage urls", async () => {
    const command = {
      ...buildCommand(),
      mediaCandidate: {
        ...buildCommand().mediaCandidate,
        publicUrl: "https://example.org/preview.mp4",
      },
    };
    const res = await POST(
      req("http://localhost/api/admin/voxy-render-media-storage-truth", {
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
        errors: ["public_url_must_remain_empty"],
      },
    });
  });
});
