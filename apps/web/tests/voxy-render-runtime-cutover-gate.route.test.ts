import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdmin(...args),
}));

import { GET, POST } from "@/app/api/admin/voxy-render-runtime-cutover-gates/route";
import {
  createInMemoryVoxyRenderRuntimeCutoverGateRepository,
  setVoxyRenderRuntimeCutoverGateRepositoryForTests,
} from "@/features/create/voxyRenderRuntimeCutoverGateStore";

function req(url: string, init?: RequestInit) {
  return new NextRequest(url, init);
}

function buildCommand() {
  return {
    runtimeCutoverGateId: "voxy-render-runtime-cutover-gate:preview-1",
    runtimeObservabilityId: "voxy-render-runtime-observability:1",
    schedulingPolicyId: "voxy-render-scheduling-policy:1",
    uploadTargetPolicyId: "voxy-render-upload-target-policy:1",
    mediaStorageTruthId: "voxy-render-media-storage-truth:1",
    approvalSemanticsId: "voxy-render-approval-semantics:1",
    socialDistributionHandoffId: "voxy-render-social-distribution-handoff:1",
    publishReadinessGuardId: "voxy-render-publish-readiness-guard:1",
    enablementBacklogId: "voxy-render-runtime-enablement-backlog:1",
    matrixId: "voxy-render-runtime-go-nogo-matrix:1",
    providerSelectionDraftId: "voxy-render-provider-selection-draft:1",
    queueContractId: "voxy-render-queue-preview:1",
    costCreditPolicyId: "voxy-render-cost-credit-policy:1",
    requestDraftId: "voxy-render-request-draft:1",
    previewReviewFlowId: "voxy-render-preview-review-flow:1",
    scriptRef: { id: "script-1", title: "Voxy Script", href: "/admin/review" },
    contributionRef: { id: "review-1", title: "Sichere Schulwege", href: "/admin/review" },
    dossierRef: { id: "dossier-1", title: "Sichere Schulwege", href: "/dossier/demo" },
    reviewerRef: null,
    createdAt: "2026-07-12T12:30:00.000Z",
    updatedAt: null,
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
    runtimeCutoverGateStatus: "feature_flag_policy_needed",
    cutoverCandidate: {
      cutoverCandidateId: "voxy-render-runtime-cutover-gate:preview-1:candidate",
      status: "policy_needed",
      runtimeCutoverCandidate: true,
      runtimeEnabled: false,
      featureFlagCandidate: true,
      featureFlagEnabled: false,
      reviewerVisibleReason: "Feature Flag fehlt.",
      userVisibleReason: "Feature Flag nicht aktiviert.",
    },
    gates: [
      {
        gateKey: "featureFlagGate",
        label: "Feature Flag",
        status: "policy_needed",
        reviewerVisibleReason: "Feature-Flag-Policy fehlt.",
        userVisibleReason: "Feature Flag nicht aktiviert.",
        nextAction: "define_feature_flag_policy",
        executionAllowed: false,
      },
      {
        gateKey: "providerRuntimeGate",
        label: "Provider Runtime",
        status: "runtime_needed",
        reviewerVisibleReason: "Provider-Runtime fehlt.",
        userVisibleReason: "Provider nicht ausgeführt.",
        nextAction: "configure_provider_runtime",
        executionAllowed: false,
      },
    ],
    semantics: {
      runtimeCutoverCandidate: true,
      runtimeEnabled: false,
      featureFlagCandidate: true,
      featureFlagEnabled: false,
      providerRuntimeEnabled: false,
      queueWorkerEnabled: false,
      storageRuntimeEnabled: false,
      uploadRuntimeEnabled: false,
      schedulingRuntimeEnabled: false,
      observabilityRuntimeEnabled: false,
      costRuntimeEnabled: false,
      rollbackReady: false,
      runbookReady: false,
      publishAllowed: false,
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
    topBlockers: ["Feature Flag nicht aktiviert.", "Provider nicht ausgeführt."],
    nextStep: "define_feature_flag_policy",
    userVisibleSummary: "Runtime bleibt deaktiviert.",
    reviewerVisibleSummary: "Cutover bleibt read-only.",
    runtimeObservabilityStatusHint: "monitoring_provider_needed",
    schedulingPolicyStatusHint: "scheduler_runtime_needed",
    uploadTargetPolicyStatusHint: "access_policy_needed",
    mediaStorageTruthStatusHint: "media_storage_truth_only",
    approvalStatusHint: "approval_required",
    socialDistributionHandoffStatusHint: "blocked_by_scheduling_guard",
    publishReadinessGuardStatusHint: "approval_required",
    providerSelectionStatusHint: "noop_provider_selection",
    queueStatusHint: "queue_contract_only",
    costCreditPolicyStatusHint: "needs_runtime_metering",
    backlogStatusHint: "runtime_planning_only",
    matrixStatusHint: "runtime_no_go",
  } as const;
}

describe("voxy render runtime cutover gate admin route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({
      _id: {
        toHexString: () => "admin-1",
      },
    });
    setVoxyRenderRuntimeCutoverGateRepositoryForTests(
      createInMemoryVoxyRenderRuntimeCutoverGateRepository(),
    );
  });

  it("persists runtime cutover gate records without enabling runtime", async () => {
    const postRes = await POST(
      req("http://localhost/api/admin/voxy-render-runtime-cutover-gates", {
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
          runtimeObservabilityId: "voxy-render-runtime-observability:1",
          runtimeCutoverGateStatus: "feature_flag_policy_needed",
          persistedBy: null,
          cutoverCandidate: {
            runtimeEnabled: false,
            featureFlagEnabled: false,
          },
          executionFlags: {
            runtimeExecutionAllowed: false,
            publishAllowed: false,
          },
        },
      },
      auditEvent: {
        action: "runtime_cutover_gate_recorded",
        runtimeObservabilityId: "voxy-render-runtime-observability:1",
      },
      persistence: {
        mode: "in_memory_fallback",
        adminWritePath: "admin_api_available",
      },
    });

    const getRes = await GET(
      req(
        "http://localhost/api/admin/voxy-render-runtime-cutover-gates?runtimeObservabilityId=voxy-render-runtime-observability:1&limit=5",
      ),
    );

    expect(getRes.status).toBe(200);
    await expect(getRes.json()).resolves.toMatchObject({
      ok: true,
      latestRecord: {
        runtimeObservabilityId: "voxy-render-runtime-observability:1",
        runtimeCutoverGateStatus: "feature_flag_policy_needed",
      },
      records: [
        {
          runtimeObservabilityId: "voxy-render-runtime-observability:1",
          previewReviewFlowId: "voxy-render-preview-review-flow:1",
        },
      ],
      auditEvents: [
        {
          action: "runtime_cutover_gate_recorded",
          runtimeObservabilityId: "voxy-render-runtime-observability:1",
        },
      ],
      persistence: {
        mode: "in_memory_fallback",
      },
    });
  });

  it("blocks commands when the runtime observability reference is missing", async () => {
    const command = { ...buildCommand(), runtimeObservabilityId: null };
    const res = await POST(
      req("http://localhost/api/admin/voxy-render-runtime-cutover-gates", {
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
        errors: ["runtime_observability_required"],
      },
    });
  });
});
