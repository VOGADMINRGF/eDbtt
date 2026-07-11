import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdmin(...args),
}));

import { GET, POST } from "@/app/api/admin/voxy-render-approval-semantics/route";
import {
  createInMemoryVoxyRenderApprovalSemanticsRepository,
  setVoxyRenderApprovalSemanticsRepositoryForTests,
} from "@/features/create/voxyRenderApprovalSemanticsStore";

function req(url: string, init?: RequestInit) {
  return new NextRequest(url, init);
}

function buildGate(gateKey: string, label: string, status = "needs_review", nextAction = "keep_approval_blocked") {
  return {
    gateKey,
    label,
    status,
    reviewerVisibleReason: `${label} bleibt offen.`,
    userVisibleReason: `${label} bleibt offen.`,
    nextAction,
    executionAllowed: false,
  } as const;
}

function buildCommand() {
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
    reviewerRef: null,
    approverRef: { id: "chief-1", title: "Chefredaktion", href: null },
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
    approvalStatus: "approval_required",
    approvalCandidate: {
      approvalCandidateId: "approval-candidate:human-approval",
      status: "needs_human_approval",
      reviewerVisibleReason: "Menschliche Freigabe bleibt offen.",
      userVisibleReason: "Menschliche Freigabe bleibt offen.",
      approvalAllowed: false,
      approved: false,
    },
    humanApprovalGate: buildGate(
      "human_approval",
      "Human Approval Gate",
      "needs_approval",
      "request_human_approval",
    ),
    legalSafetyGate: buildGate("legal_safety", "Legal/Safety Gate", "needs_review", "require_legal_review"),
    sourceCaptionGate: buildGate("source_caption", "Source Caption Gate", "needs_review", "require_source_review"),
    claimSafetyGate: buildGate("claim_safety", "Claim Safety Gate", "needs_review", "require_legal_review"),
    languageGate: buildGate("language", "Language/RTL Gate", "needs_review", "require_language_review"),
    accessibilityGate: buildGate(
      "accessibility",
      "Accessibility Gate",
      "needs_review",
      "require_accessibility_review",
    ),
    mediaGate: buildGate("media", "Media Gate", "needs_review", "require_real_media_file"),
    publishGuardGate: buildGate("publish_guard", "Publish Guard Gate"),
    distributionGuardGate: buildGate("distribution_guard", "Distribution Guard Gate"),
    runtimeGate: buildGate("runtime", "Runtime Gate"),
    approvalSemantics: {
      reviewReady: true,
      publishReady: false,
      approvalCandidate: true,
      approved: false,
      uploaded: false,
      scheduled: false,
      socialPosted: false,
      published: false,
      autoPublishAllowed: false,
    },
    approvalEffects: {
      marksApproved: false,
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
      approvalExecutionAllowed: false,
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
    topBlockers: [
      "Menschliche Freigabe bleibt offen.",
      "Approval ist kein Upload und kein Publish.",
    ],
    nextStep: "request_human_approval",
    userVisibleSummary: "Approval bleibt rein semantisch.",
    reviewerVisibleSummary: "Approval bleibt audit-only/noop.",
    publishGuardStatusHint: "review_ready_only",
    socialDistributionStatusHint: "not_distribution_ready",
    previewOutcomeTypeHint: "mark_review_ready",
    previewOutcomeStatusHint: "review_ready_only",
    previewReviewDecisionTypeHint: "mark_review_ready",
    previewReviewDecisionStatusHint: "persisted_audit_only",
    previewReviewFlowStatusHint: "no_preview_available",
  } as const;
}

describe("voxy render approval semantics admin route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({
      _id: {
        toHexString: () => "admin-1",
      },
    });
    setVoxyRenderApprovalSemanticsRepositoryForTests(
      createInMemoryVoxyRenderApprovalSemanticsRepository(),
    );
  });

  it("persists approval semantics as audit-only records without runtime side effects", async () => {
    const postRes = await POST(
      req("http://localhost/api/admin/voxy-render-approval-semantics", {
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
          socialDistributionHandoffId: "voxy-render-social-distribution-handoff:1",
          approvalStatus: "approval_required",
          persistedBy: "admin-1",
          approvalSemantics: {
            reviewReady: true,
            approved: false,
            published: false,
          },
          executionFlags: {
            approvalExecutionAllowed: false,
            publishAllowed: false,
            uploadAllowed: false,
            schedulingAllowed: false,
            socialPostAllowed: false,
          },
        },
      },
      auditEvent: {
        action: "approval_semantics_recorded",
        socialDistributionHandoffId: "voxy-render-social-distribution-handoff:1",
      },
      persistence: {
        mode: "in_memory_fallback",
        adminWritePath: "admin_api_available",
      },
    });

    const getRes = await GET(
      req(
        "http://localhost/api/admin/voxy-render-approval-semantics?socialDistributionHandoffId=voxy-render-social-distribution-handoff:1&limit=5",
      ),
    );

    expect(getRes.status).toBe(200);
    await expect(getRes.json()).resolves.toMatchObject({
      ok: true,
      latestRecord: {
        socialDistributionHandoffId: "voxy-render-social-distribution-handoff:1",
        approvalStatus: "approval_required",
      },
      records: [
        {
          socialDistributionHandoffId: "voxy-render-social-distribution-handoff:1",
          previewReviewFlowId: "voxy-render-preview-review-flow:1",
        },
      ],
      auditEvents: [
        {
          action: "approval_semantics_recorded",
          socialDistributionHandoffId: "voxy-render-social-distribution-handoff:1",
        },
      ],
      persistence: {
        mode: "in_memory_fallback",
      },
    });
  });

  it("blocks commands when the social distribution handoff is missing", async () => {
    const command = { ...buildCommand(), socialDistributionHandoffId: null };
    const res = await POST(
      req("http://localhost/api/admin/voxy-render-approval-semantics", {
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
        errors: ["social_distribution_handoff_required"],
      },
    });
  });

  it("rejects invalid commands", async () => {
    const res = await POST(
      req("http://localhost/api/admin/voxy-render-approval-semantics", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ approvalStatus: "bad" }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid_voxy_render_approval_semantics_command",
    });
  });
});
