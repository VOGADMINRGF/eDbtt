import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdmin(...args),
}));

import { GET, POST } from "@/app/api/admin/voxy-render-scheduling-policies/route";
import {
  createInMemoryVoxyRenderSchedulingPolicyRepository,
  setVoxyRenderSchedulingPolicyRepositoryForTests,
} from "@/features/create/voxyRenderSchedulingPolicyStore";

function req(url: string, init?: RequestInit) {
  return new NextRequest(url, init);
}

function buildCommand() {
  return {
    uploadTargetPolicyId: "voxy-render-upload-target-policy:1",
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
    createdAt: "2026-07-12T12:00:00.000Z",
    updatedAt: null,
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
    schedulingPolicyStatus: "publish_window_needed",
    scheduleCandidate: {
      scheduleCandidateId: "schedule-candidate:1",
      status: "candidate_only",
      suggestedWindow: null,
      timezone: null,
      platform: "LinkedIn",
      scheduledAt: null,
      scheduled: false,
      schedulingAllowed: false,
      schedulerJobCreated: false,
      calendarEventCreated: false,
      reviewerVisibleReason: "Distribution-Time bleibt Kandidat.",
      userVisibleReason: "Noch kein echter Veröffentlichungszeitpunkt.",
    },
    publishWindow: {
      publishWindowId: null,
      status: "policy_needed",
      earliestPublishAt: null,
      latestPublishAt: null,
      timezonePolicyNeeded: true,
      platformTimingPolicyNeeded: true,
      reviewerVisibleReason: "Publish-Window-Policy fehlt.",
      userVisibleReason: "Vor der Planung fehlt ein belastbares Zeitfenster.",
    },
    calendarHint: {
      calendarHintId: null,
      status: "policy_needed",
      calendarEventCreated: false,
      calendarWriteAllowed: false,
      reminderCreated: false,
      reviewerVisibleReason: "Kalender-Policy fehlt.",
      userVisibleReason: "Noch kein Kalenderhinweis vorbereitet.",
    },
    schedulingSemantics: {
      scheduleCandidate: true,
      scheduled: false,
      schedulerJobCreated: false,
      calendarEventCreated: false,
      postedAtAvailable: false,
      distributionTimeFinal: false,
      uploadReady: false,
      published: false,
      socialPosted: false,
    },
    executionFlags: {
      schedulingAllowed: false,
      schedulerJobAllowed: false,
      calendarWriteAllowed: false,
      reminderAllowed: false,
      publishAllowed: false,
      uploadAllowed: false,
      storageWriteAllowed: false,
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
      "Publish-Window-Policy fehlt.",
      "Timezone-Policy fehlt.",
      "Kalender-Policy fehlt.",
    ],
    nextStep: "define_publish_window_policy",
    userVisibleSummary: "Scheduling Policy bleibt audit-only und plant nichts.",
    reviewerVisibleSummary: "Scheduling Policy bleibt ein reiner Wahrheitslayer ohne Planung.",
    uploadTargetPolicyStatusHint: "access_policy_needed",
    mediaStorageTruthStatusHint: "media_storage_truth_only",
    approvalStatusHint: "approval_required",
    publishReadinessGuardStatusHint: "approval_required",
    socialDistributionHandoffStatusHint: "blocked_by_scheduling_guard",
    previewReviewFlowStatusHint: "no_preview_available",
  } as const;
}

describe("voxy render scheduling policy admin route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({
      _id: {
        toHexString: () => "admin-1",
      },
    });
    setVoxyRenderSchedulingPolicyRepositoryForTests(
      createInMemoryVoxyRenderSchedulingPolicyRepository(),
    );
  });

  it("persists scheduling policy records without schedules, jobs or calendar events", async () => {
    const postRes = await POST(
      req("http://localhost/api/admin/voxy-render-scheduling-policies", {
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
          uploadTargetPolicyId: "voxy-render-upload-target-policy:1",
          schedulingPolicyStatus: "publish_window_needed",
          persistedBy: null,
          scheduleCandidate: {
            scheduledAt: null,
            scheduled: false,
            schedulerJobCreated: false,
          },
          publishWindow: {
            earliestPublishAt: null,
            latestPublishAt: null,
          },
          calendarHint: {
            calendarEventCreated: false,
            reminderCreated: false,
          },
        },
      },
      auditEvent: {
        action: "scheduling_policy_recorded",
        uploadTargetPolicyId: "voxy-render-upload-target-policy:1",
      },
      persistence: {
        mode: "in_memory_fallback",
        adminWritePath: "admin_api_available",
      },
    });

    const getRes = await GET(
      req(
        "http://localhost/api/admin/voxy-render-scheduling-policies?uploadTargetPolicyId=voxy-render-upload-target-policy:1&limit=5",
      ),
    );

    expect(getRes.status).toBe(200);
    await expect(getRes.json()).resolves.toMatchObject({
      ok: true,
      latestRecord: {
        uploadTargetPolicyId: "voxy-render-upload-target-policy:1",
        schedulingPolicyStatus: "publish_window_needed",
      },
      records: [
        {
          uploadTargetPolicyId: "voxy-render-upload-target-policy:1",
          previewReviewFlowId: null,
        },
      ],
      auditEvents: [
        {
          action: "scheduling_policy_recorded",
          uploadTargetPolicyId: "voxy-render-upload-target-policy:1",
        },
      ],
      persistence: {
        mode: "in_memory_fallback",
      },
    });
  });

  it("blocks commands when the upload target policy reference is missing", async () => {
    const command = { ...buildCommand(), uploadTargetPolicyId: null };
    const res = await POST(
      req("http://localhost/api/admin/voxy-render-scheduling-policies", {
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
        errors: ["upload_target_policy_required"],
      },
    });
  });

  it("rejects fake scheduled timestamps", async () => {
    const command = {
      ...buildCommand(),
      scheduleCandidate: {
        ...buildCommand().scheduleCandidate,
        scheduledAt: "2026-07-20T08:00:00.000Z",
      },
    };
    const res = await POST(
      req("http://localhost/api/admin/voxy-render-scheduling-policies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(command),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
    });
  });
});
