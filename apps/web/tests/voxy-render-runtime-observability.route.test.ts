import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdmin(...args),
}));

import { GET, POST } from "@/app/api/admin/voxy-render-runtime-observability/route";
import {
  createInMemoryVoxyRenderRuntimeObservabilityRepository,
  setVoxyRenderRuntimeObservabilityRepositoryForTests,
} from "@/features/create/voxyRenderRuntimeObservabilityStore";

function req(url: string, init?: RequestInit) {
  return new NextRequest(url, init);
}

function buildCommand() {
  return {
    runtimeObservabilityId: "voxy-render-runtime-observability:preview-1",
    schedulingPolicyId: "voxy-render-scheduling-policy:1",
    uploadTargetPolicyId: "voxy-render-upload-target-policy:1",
    mediaStorageTruthId: "voxy-render-media-storage-truth:1",
    approvalSemanticsId: "voxy-render-approval-semantics:1",
    socialDistributionHandoffId: "voxy-render-social-distribution-handoff:1",
    publishReadinessGuardId: "voxy-render-publish-readiness-guard:1",
    previewOutcomeHandoffId: "voxy-render-preview-outcome-handoff:1",
    previewReviewFlowId: "voxy-render-preview-review-flow:1",
    enablementBacklogId: "voxy-render-runtime-enablement-backlog:1",
    matrixId: "voxy-render-runtime-go-nogo-matrix:1",
    requestDraftId: "voxy-render-request-draft:1",
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
    runtimeObservabilityStatus: "monitoring_provider_needed",
    auditEventCandidates: [
      {
        eventCandidateId: null,
        eventKey: "voxy.render.requested",
        status: "policy_needed",
        wouldDescribe: "render_requested",
        emitted: false,
        emitterAllowed: false,
        reviewerVisibleReason: "Emitter fehlt.",
        userVisibleReason: "Render-Anfrage bleibt Kandidat.",
      },
    ],
    metricCandidates: [
      {
        metricCandidateId: null,
        metricKey: "voxy.render.request.count",
        status: "policy_needed",
        metricKind: "counter",
        metricStreamCreated: false,
        metricEmitted: false,
        reviewerVisibleReason: "Stream fehlt.",
        userVisibleReason: "Counter bleibt Kandidat.",
      },
    ],
    alertCandidates: [
      {
        alertCandidateId: null,
        alertKey: "voxy.runtime.provider.missing",
        status: "provider_needed",
        severity: "warning",
        alertCreated: false,
        alertEmitted: false,
        reviewerVisibleReason: "Provider fehlt.",
        userVisibleReason: "Provider-Alert bleibt Kandidat.",
      },
    ],
    runtimeTraceCandidate: {
      traceCandidateId: null,
      status: "trace_policy_needed",
      traceId: null,
      executionStarted: false,
      executionCompleted: false,
      executionFailed: false,
      reviewerVisibleReason: "Trace-Policy fehlt.",
      userVisibleReason: "Noch keine Runtime Trace.",
    },
    semantics: {
      observabilityPlan: true,
      runtimeTraceAvailable: false,
      auditEventsEmitted: false,
      metricsEmitted: false,
      alertsEmitted: false,
      monitoringRuntimeEnabled: false,
      runtimeEnabled: false,
      renderExecuted: false,
      uploadExecuted: false,
      schedulingExecuted: false,
      publishExecuted: false,
      socialPostExecuted: false,
    },
    executionFlags: {
      auditEventEmissionAllowed: false,
      metricEmissionAllowed: false,
      alertEmissionAllowed: false,
      monitoringProviderCallAllowed: false,
      traceCreationAllowed: false,
      runtimeExecutionAllowed: false,
      schedulingAllowed: false,
      schedulerJobAllowed: false,
      calendarWriteAllowed: false,
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
      "Kein Monitoring Provider konfiguriert.",
      "Trace-Policy fehlt.",
      "Metric-Policy fehlt.",
      "Alert-Policy fehlt.",
    ],
    nextStep: "configure_monitoring_provider",
    userVisibleSummary: "Observability bleibt read-only.",
    reviewerVisibleSummary: "Observability bleibt audit-only.",
  } as const;
}

describe("voxy render runtime observability admin route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({
      _id: {
        toHexString: () => "admin-1",
      },
    });
    setVoxyRenderRuntimeObservabilityRepositoryForTests(
      createInMemoryVoxyRenderRuntimeObservabilityRepository(),
    );
  });

  it("persists runtime observability records without events, metrics, alerts or traces", async () => {
    const postRes = await POST(
      req("http://localhost/api/admin/voxy-render-runtime-observability", {
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
          schedulingPolicyId: "voxy-render-scheduling-policy:1",
          runtimeObservabilityStatus: "monitoring_provider_needed",
          persistedBy: null,
          runtimeTraceCandidate: {
            traceId: null,
            executionStarted: false,
          },
          semantics: {
            runtimeEnabled: false,
            auditEventsEmitted: false,
          },
          executionFlags: {
            monitoringProviderCallAllowed: false,
            renderAllowed: false,
          },
        },
      },
      auditEvent: {
        action: "runtime_observability_recorded",
        schedulingPolicyId: "voxy-render-scheduling-policy:1",
      },
      persistence: {
        mode: "in_memory_fallback",
        adminWritePath: "admin_api_available",
      },
    });

    const getRes = await GET(
      req(
        "http://localhost/api/admin/voxy-render-runtime-observability?schedulingPolicyId=voxy-render-scheduling-policy:1&limit=5",
      ),
    );

    expect(getRes.status).toBe(200);
    await expect(getRes.json()).resolves.toMatchObject({
      ok: true,
      latestRecord: {
        schedulingPolicyId: "voxy-render-scheduling-policy:1",
        runtimeObservabilityStatus: "monitoring_provider_needed",
      },
      records: [
        {
          schedulingPolicyId: "voxy-render-scheduling-policy:1",
          previewReviewFlowId: "voxy-render-preview-review-flow:1",
        },
      ],
      auditEvents: [
        {
          action: "runtime_observability_recorded",
          schedulingPolicyId: "voxy-render-scheduling-policy:1",
        },
      ],
      persistence: {
        mode: "in_memory_fallback",
      },
    });
  });

  it("blocks commands when the scheduling policy reference is missing", async () => {
    const command = { ...buildCommand(), schedulingPolicyId: null };
    const res = await POST(
      req("http://localhost/api/admin/voxy-render-runtime-observability", {
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
        errors: ["scheduling_policy_required"],
      },
    });
  });

  it("rejects fake trace ids", async () => {
    const command = {
      ...buildCommand(),
      runtimeTraceCandidate: {
        ...buildCommand().runtimeTraceCandidate,
        traceId: "trace-1",
      },
    };
    const res = await POST(
      req("http://localhost/api/admin/voxy-render-runtime-observability", {
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
