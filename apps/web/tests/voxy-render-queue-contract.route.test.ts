import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdmin(...args),
}));

import { GET, POST } from "@/app/api/admin/voxy-render-queue-previews/route";
import {
  createInMemoryVoxyRenderQueuePreviewRepository,
  setVoxyRenderQueuePreviewRepositoryForTests,
} from "@/features/create/voxyRenderQueueStore";

function req(url: string, init?: RequestInit) {
  return new NextRequest(url, init);
}

function buildCommand() {
  return {
    queuePreviewId: "voxy-render-queue-preview:preview-1",
    requestDraftId: "voxy-render-request-draft:preview-1",
    decisionId: "voxy-render-decision:test-1",
    decisionGateId: "voxy-render-review-decision-gate:admin-1",
    handoffRef: null,
    preflightRef: null,
    registryRef: null,
    adapterRef: null,
    scriptRef: null,
    contributionRef: {
      id: "review-item-1",
      title: "Sichere Schulwege",
      href: "/admin/review",
    },
    dossierRef: {
      id: "dossier-1",
      title: "Sichere Schulwege",
      href: "/dossier/demo",
    },
    surface: "admin",
    videoFormat: "briefing_video",
    queueStatus: "queue_contract_only",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: null,
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
    providerRequirements: [],
    assetRequirements: [],
    costRequirements: [],
    reviewRequirements: [],
    publicSafetyRequirements: [],
    estimatedRuntimeRequirements: [],
    userVisibleReason: "Nur Queue-Vertrag, keine Ausführung.",
    reviewerVisibleReason: "Auditierbarer Queue-Vertrag ohne Queue, Worker, Provider, Datei und Publish.",
    nextStep: "Audit prüfen",
    execution: {
      queueEnabled: false,
      createsQueueJob: false,
      workerExecutionAllowed: false,
      providerExecutionAllowed: false,
      mediaFileCreationAllowed: false,
      costDebitAllowed: false,
      uploadAllowed: false,
      publishAllowed: false,
      socialPostAllowed: false,
      schedulingAllowed: false,
      runtimeClaimAllowed: false,
    },
    createdBy: null,
    createdAt: "2026-07-09T13:15:00.000Z",
  } as const;
}

describe("voxy render queue preview admin route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({
      _id: {
        toHexString: () => "admin-1",
      },
    });
    setVoxyRenderQueuePreviewRepositoryForTests(
      createInMemoryVoxyRenderQueuePreviewRepository(),
    );
  });

  it("persists an honest disabled queue preview with audit trail", async () => {
    const postRes = await POST(
      req("http://localhost/api/admin/voxy-render-queue-previews", {
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
        status: "preview_only",
        record: {
          decisionGateId: "voxy-render-review-decision-gate:admin-1",
          queueStatus: "queue_contract_only",
          persistedBy: "admin-1",
        },
      },
      auditEvent: {
        action: "queue_preview_recorded",
        decisionGateId: "voxy-render-review-decision-gate:admin-1",
        queueStatus: "queue_contract_only",
      },
      persistence: {
        mode: "in_memory_fallback",
        adminWritePath: "admin_api_available",
      },
    });

    const getRes = await GET(
      req(
        "http://localhost/api/admin/voxy-render-queue-previews?decisionGateId=voxy-render-review-decision-gate:admin-1&limit=5",
      ),
    );

    expect(getRes.status).toBe(200);
    await expect(getRes.json()).resolves.toMatchObject({
      ok: true,
      latestRecord: {
        decisionGateId: "voxy-render-review-decision-gate:admin-1",
        queueStatus: "queue_contract_only",
      },
      records: [
        {
          decisionGateId: "voxy-render-review-decision-gate:admin-1",
          queueStatus: "queue_contract_only",
        },
      ],
      auditEvents: [
        {
          action: "queue_preview_recorded",
          decisionGateId: "voxy-render-review-decision-gate:admin-1",
        },
      ],
      persistence: {
        mode: "in_memory_fallback",
      },
    });
  });

  it("rejects invalid commands", async () => {
    const res = await POST(
      req("http://localhost/api/admin/voxy-render-queue-previews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decisionGateId: "" }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid_voxy_render_queue_preview_command",
    });
  });
});
