import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdmin(...args),
}));

import { GET, POST } from "@/app/api/admin/voxy-render-social-distribution-handoffs/route";
import {
  createInMemoryVoxyRenderSocialDistributionHandoffRepository,
  setVoxyRenderSocialDistributionHandoffRepositoryForTests,
} from "@/features/create/voxyRenderSocialDistributionHandoffStore";

function req(url: string, init?: RequestInit) {
  return new NextRequest(url, init);
}

function buildCommand() {
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
    handoffStatus: "not_distribution_ready",
    platformCandidates: [
      {
        platform: "internal_review",
        label: "Interne Prüfung",
        status: "candidate_only",
        platformApiCallAllowed: false,
        uploadAllowed: false,
        postAllowed: false,
        scheduleAllowed: false,
        reviewerVisibleReason: "Nur Kandidat.",
        userVisibleReason: "Nur Kandidat.",
      },
      {
        platform: "linkedin",
        label: "LinkedIn",
        status: "candidate_only",
        platformApiCallAllowed: false,
        uploadAllowed: false,
        postAllowed: false,
        scheduleAllowed: false,
        reviewerVisibleReason: "Nur Kandidat.",
        userVisibleReason: "Nur Kandidat.",
      },
    ],
    copyVariants: [
      {
        variantId: "copy-1",
        platform: "internal_review",
        label: "Interne Prüfung",
        status: "draft_only",
        headline: "Sichere Schulwege · Review-Draft",
        body: "Review-Draft. Kein Posting.",
        hashtags: [],
        cta: null,
        sourceCaptionRequired: true,
        languageReviewRequired: false,
        legalReviewRequired: false,
        posted: false,
        scheduled: false,
        platformApiCallAllowed: false,
      },
    ],
    scheduleCandidate: {
      scheduleCandidateId: null,
      status: "needs_policy",
      suggestedWindow: null,
      scheduled: false,
      schedulingAllowed: false,
      reviewerVisibleReason: "Policy fehlt.",
      userVisibleReason: "Policy fehlt.",
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
    topBlockers: ["Es gibt keinen Upload."],
    nextStep: "prepare_copy_review",
    userVisibleSummary: "Distribution bleibt review-first.",
    reviewerVisibleSummary: "Audit-only Social Distribution.",
    publishGuardStatusHint: "review_ready_only",
    previewOutcomeTypeHint: "mark_review_ready",
    previewOutcomeStatusHint: "review_ready_only",
    previewReviewDecisionTypeHint: "mark_review_ready",
    previewReviewDecisionStatusHint: "persisted_audit_only",
    previewReviewFlowStatusHint: "no_preview_available",
  } as const;
}

describe("voxy render social distribution handoff admin route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({
      _id: {
        toHexString: () => "admin-1",
      },
    });
    setVoxyRenderSocialDistributionHandoffRepositoryForTests(
      createInMemoryVoxyRenderSocialDistributionHandoffRepository(),
    );
  });

  it("persists audit-only social-distribution handoffs without runtime side effects", async () => {
    const postRes = await POST(
      req("http://localhost/api/admin/voxy-render-social-distribution-handoffs", {
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
          publishReadinessGuardId: "voxy-render-publish-readiness-guard:1",
          handoffStatus: "not_distribution_ready",
          persistedBy: "admin-1",
          distributionSemantics: {
            publishReady: false,
            published: false,
            uploaded: false,
            socialPosted: false,
          },
          executionFlags: {
            publishAllowed: false,
            uploadAllowed: false,
            schedulingAllowed: false,
            socialPostAllowed: false,
            platformApiCallAllowed: false,
          },
        },
      },
      auditEvent: {
        action: "social_distribution_handoff_recorded",
        publishReadinessGuardId: "voxy-render-publish-readiness-guard:1",
      },
      persistence: {
        mode: "in_memory_fallback",
        adminWritePath: "admin_api_available",
      },
    });

    const getRes = await GET(
      req(
        "http://localhost/api/admin/voxy-render-social-distribution-handoffs?publishReadinessGuardId=voxy-render-publish-readiness-guard:1&limit=5",
      ),
    );

    expect(getRes.status).toBe(200);
    await expect(getRes.json()).resolves.toMatchObject({
      ok: true,
      latestRecord: {
        publishReadinessGuardId: "voxy-render-publish-readiness-guard:1",
        handoffStatus: "not_distribution_ready",
      },
      records: [
        {
          publishReadinessGuardId: "voxy-render-publish-readiness-guard:1",
          previewReviewFlowId: "voxy-render-preview-review-flow:1",
        },
      ],
      auditEvents: [
        {
          action: "social_distribution_handoff_recorded",
          publishReadinessGuardId: "voxy-render-publish-readiness-guard:1",
        },
      ],
      persistence: {
        mode: "in_memory_fallback",
      },
    });
  });

  it("blocks commands when the publish readiness guard is missing", async () => {
    const command = { ...buildCommand(), publishReadinessGuardId: null };
    const res = await POST(
      req("http://localhost/api/admin/voxy-render-social-distribution-handoffs", {
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
        errors: ["publish_readiness_guard_required"],
      },
    });
  });

  it("rejects invalid commands", async () => {
    const res = await POST(
      req("http://localhost/api/admin/voxy-render-social-distribution-handoffs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ handoffStatus: "bad" }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid_voxy_render_social_distribution_handoff_command",
    });
  });
});
