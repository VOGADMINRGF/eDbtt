import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdmin(...args),
}));

import { GET, POST } from "@/app/api/admin/voxy-render-publish-readiness-guards/route";
import {
  createInMemoryVoxyRenderPublishReadinessGuardRepository,
  setVoxyRenderPublishReadinessGuardRepositoryForTests,
} from "@/features/create/voxyRenderPublishReadinessGuardStore";

function req(url: string, init?: RequestInit) {
  return new NextRequest(url, init);
}

function buildGate(gateKey: string, label: string, status = "no_go") {
  return {
    gateKey,
    label,
    status,
    reviewerVisibleReason: `${label} bleibt blockiert.`,
    userVisibleReason: `${label} bleibt blockiert.`,
    nextAction: gateKey === "approval" ? "request_human_approval" : "keep_publish_blocked",
    executionAllowed: false,
  } as const;
}

function buildCommand() {
  return {
    previewOutcomeHandoffId: "voxy-render-preview-outcome-handoff:1",
    previewReviewDecisionRecordId: "voxy-render-preview-review-decision:1",
    previewReviewFlowId: "voxy-render-preview-review-flow:preview-1",
    enablementBacklogId: "voxy-render-runtime-enablement-backlog:preview-1",
    matrixId: "voxy-render-runtime-go-nogo-matrix:preview-1",
    requestDraftId: "voxy-render-request-draft:preview-1",
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
    guardStatus: "review_ready_only",
    reviewGate: buildGate("review", "Review", "not_applicable"),
    approvalGate: buildGate("approval", "Approval", "needs_approval"),
    mediaGate: buildGate("media", "Media"),
    uploadGate: buildGate("upload", "Upload"),
    schedulingGate: buildGate("scheduling", "Scheduling"),
    socialPostingGate: buildGate("social_posting", "Social Posting"),
    legalSafetyGate: buildGate("legal_safety", "Legal/Safety", "needs_review"),
    sourceCaptionGate: buildGate("source_caption", "Source Caption", "needs_review"),
    languageGate: buildGate("language", "Language/RTL", "needs_review"),
    accessibilityGate: buildGate("accessibility", "Accessibility", "needs_review"),
    runtimeGate: buildGate("runtime", "Runtime"),
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
    topBlockers: [
      "Review-ready ist noch nicht approved.",
      "Es gibt keine echte Medien-Datei.",
      "Es gibt keinen Upload.",
    ],
    nextStep: "request_human_approval",
    userVisibleSummary: "Review-ready bleibt nicht approved und nicht published.",
    reviewerVisibleSummary: "Publish Guard bleibt audit-only/noop.",
    previewOutcomeTypeHint: "mark_review_ready",
    previewOutcomeStatusHint: "review_ready_only",
    previewReviewDecisionTypeHint: "mark_review_ready",
    previewReviewDecisionStatusHint: "persisted_audit_only",
    previewReviewFlowStatusHint: "no_preview_available",
  } as const;
}

describe("voxy render publish readiness guard admin route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({
      _id: {
        toHexString: () => "admin-1",
      },
    });
    setVoxyRenderPublishReadinessGuardRepositoryForTests(
      createInMemoryVoxyRenderPublishReadinessGuardRepository(),
    );
  });

  it("persists publish readiness guards as audit-only records without runtime side effects", async () => {
    const postRes = await POST(
      req("http://localhost/api/admin/voxy-render-publish-readiness-guards", {
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
          previewOutcomeHandoffId: "voxy-render-preview-outcome-handoff:1",
          guardStatus: "review_ready_only",
          persistedBy: "admin-1",
          publishSemantics: {
            reviewReady: true,
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
        },
      },
      auditEvent: {
        action: "publish_readiness_guard_recorded",
        previewOutcomeHandoffId: "voxy-render-preview-outcome-handoff:1",
      },
      persistence: {
        mode: "in_memory_fallback",
        adminWritePath: "admin_api_available",
      },
    });

    const getRes = await GET(
      req(
        "http://localhost/api/admin/voxy-render-publish-readiness-guards?previewOutcomeHandoffId=voxy-render-preview-outcome-handoff:1&limit=5",
      ),
    );

    expect(getRes.status).toBe(200);
    await expect(getRes.json()).resolves.toMatchObject({
      ok: true,
      latestRecord: {
        previewOutcomeHandoffId: "voxy-render-preview-outcome-handoff:1",
        guardStatus: "review_ready_only",
      },
      records: [
        {
          previewOutcomeHandoffId: "voxy-render-preview-outcome-handoff:1",
          previewReviewFlowId: "voxy-render-preview-review-flow:preview-1",
        },
      ],
      auditEvents: [
        {
          action: "publish_readiness_guard_recorded",
          previewOutcomeHandoffId: "voxy-render-preview-outcome-handoff:1",
        },
      ],
      persistence: {
        mode: "in_memory_fallback",
      },
    });
  });

  it("blocks commands when the preview outcome handoff is missing", async () => {
    const command = { ...buildCommand(), previewOutcomeHandoffId: null };
    const res = await POST(
      req("http://localhost/api/admin/voxy-render-publish-readiness-guards", {
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
        errors: ["preview_outcome_handoff_required"],
      },
    });
  });

  it("rejects invalid commands", async () => {
    const res = await POST(
      req("http://localhost/api/admin/voxy-render-publish-readiness-guards", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ guardStatus: "bad" }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid_voxy_render_publish_readiness_guard_command",
    });
  });
});

