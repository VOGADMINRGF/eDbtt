import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdmin(...args),
}));

import { GET, POST } from "@/app/api/admin/voxy-video-briefing-flow-master-closures/route";
import {
  createInMemoryVoxyVideoBriefingFlowMasterClosureRepository,
  setVoxyVideoBriefingFlowMasterClosureRepositoryForTests,
} from "@/features/create/voxyVideoBriefingFlowMasterClosureStore";

function req(url: string, init?: RequestInit) {
  return new NextRequest(url, init);
}

function buildCommand() {
  return {
    masterClosureId: "voxy-video-briefing-flow-master-closure:preview-1",
    runtimeCutoverGateId: "voxy-render-runtime-cutover-gate:1",
    runtimeObservabilityId: "voxy-render-runtime-observability:1",
    schedulingPolicyId: "voxy-render-scheduling-policy:1",
    uploadTargetPolicyId: "voxy-render-upload-target-policy:1",
    mediaStorageTruthId: "voxy-render-media-storage-truth:1",
    approvalSemanticsId: "voxy-render-approval-semantics:1",
    socialDistributionHandoffId: "voxy-render-social-distribution-handoff:1",
    publishReadinessGuardId: "voxy-render-publish-readiness-guard:1",
    previewOutcomeHandoffId: "voxy-render-preview-outcome-handoff:1",
    previewReviewFlowId: "voxy-render-preview-review-flow:1",
    renderRequestDraftId: "voxy-render-request-draft:1",
    scriptCandidateId: "voxy-briefing-script-candidate:review-1:script_preview",
    providerSelectionDraftId: "voxy-render-provider-selection-draft:1",
    assetPackDraftId: "voxy-render-asset-pack-draft:1",
    queueContractId: "voxy-render-queue-preview:1",
    costCreditPolicyId: "voxy-render-cost-credit-policy:1",
    contributionRef: { id: "review-1", title: "Sichere Schulwege", href: "/admin/review" },
    dossierRef: { id: "dossier-1", title: "Sichere Schulwege", href: "/dossier/demo" },
    reviewerRef: null,
    scriptRef: { id: "script-1", title: "Voxy Script", href: "/admin/review" },
    createdAt: "2026-07-12T12:30:00.000Z",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
    masterStatus: "review_first_architecture_complete",
    readinessAreas: [
      {
        areaKey: "scriptReadiness",
        label: "Script",
        status: "review_first_ready",
        reviewerVisibleReason: "Script vorhanden.",
        userVisibleReason: "Script vorhanden.",
        nextAction: "keep_runtime_blocked",
        runtimeEnabled: false,
        executionAllowed: false,
      },
      {
        areaKey: "cutoverReadiness",
        label: "Cutover Gate",
        status: "runtime_pending",
        reviewerVisibleReason: "Cutover dokumentiert, aber nicht aktiviert.",
        userVisibleReason: "Cutover dokumentiert, aber nicht aktiviert.",
        nextAction: "decide_runtime_path",
        runtimeEnabled: false,
        executionAllowed: false,
      },
    ],
    semantics: {
      reviewFirstArchitectureComplete: true,
      runtimePending: true,
      runtimeEnabled: false,
      previewRendered: false,
      mediaFileAvailable: false,
      uploaded: false,
      scheduled: false,
      socialPosted: false,
      published: false,
      autoPublishAllowed: false,
    },
    executionFlags: {
      runtimeExecutionAllowed: false,
      featureFlagWriteAllowed: false,
      providerExecutionAllowed: false,
      queueAllowed: false,
      workerAllowed: false,
      storageWriteAllowed: false,
      uploadAllowed: false,
      schedulingAllowed: false,
      schedulerJobAllowed: false,
      calendarWriteAllowed: false,
      publishAllowed: false,
      socialPostAllowed: false,
      autoPublishAllowed: false,
      auditEventEmissionAllowed: false,
      metricEmissionAllowed: false,
      alertEmissionAllowed: false,
      monitoringProviderCallAllowed: false,
      createsMediaFile: false,
      previewRendered: false,
      renderAllowed: false,
      rerenderAllowed: false,
      secretsAccessed: false,
      costDebitAllowed: false,
      creditDebitAllowed: false,
      runtimeClaimAllowed: false,
    },
    topBlockers: ["Runtime noch nicht aktiviert."],
    runtimePendingRequirements: [
      "Provider: Provider-Runtime konfigurieren",
      "Queue: Queue-/Worker-Runtime konfigurieren",
    ],
    nextStep: "decide_runtime_path",
    userVisibleSummary: "Review-first Architektur geschlossen.",
    reviewerVisibleSummary: "Runtime bleibt pending.",
  } as const;
}

describe("voxy video briefing flow master closure admin route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({
      _id: {
        toHexString: () => "admin-1",
      },
    });
    setVoxyVideoBriefingFlowMasterClosureRepositoryForTests(
      createInMemoryVoxyVideoBriefingFlowMasterClosureRepository(),
    );
  });

  it("persists and reads audit-only master-closure records", async () => {
    const postRes = await POST(
      req("http://localhost/api/admin/voxy-video-briefing-flow-master-closures", {
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
          runtimeCutoverGateId: "voxy-render-runtime-cutover-gate:1",
          masterStatus: "review_first_architecture_complete",
          semantics: {
            runtimePending: true,
            runtimeEnabled: false,
            published: false,
          },
          executionFlags: {
            runtimeExecutionAllowed: false,
            publishAllowed: false,
          },
        },
      },
      auditEvent: {
        action: "master_closure_recorded",
        runtimeCutoverGateId: "voxy-render-runtime-cutover-gate:1",
      },
      persistence: {
        mode: "in_memory_fallback",
        adminWritePath: "admin_api_available",
      },
    });

    const getRes = await GET(
      req(
        "http://localhost/api/admin/voxy-video-briefing-flow-master-closures?runtimeCutoverGateId=voxy-render-runtime-cutover-gate:1&limit=5",
      ),
    );

    expect(getRes.status).toBe(200);
    await expect(getRes.json()).resolves.toMatchObject({
      ok: true,
      latestRecord: {
        runtimeCutoverGateId: "voxy-render-runtime-cutover-gate:1",
        masterStatus: "review_first_architecture_complete",
      },
      records: [
        {
          runtimeCutoverGateId: "voxy-render-runtime-cutover-gate:1",
          previewReviewFlowId: "voxy-render-preview-review-flow:1",
        },
      ],
      auditEvents: [
        {
          action: "master_closure_recorded",
          runtimeCutoverGateId: "voxy-render-runtime-cutover-gate:1",
        },
      ],
    });
  });

  it("rejects invalid payloads that try to enable runtime execution", async () => {
    const res = await POST(
      req("http://localhost/api/admin/voxy-video-briefing-flow-master-closures", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...buildCommand(),
          executionFlags: {
            ...buildCommand().executionFlags,
            runtimeExecutionAllowed: true,
          },
        }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid_voxy_video_briefing_flow_master_closure_payload",
    });
  });
});
