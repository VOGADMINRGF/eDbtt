import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdmin(...args),
}));

import { GET, POST } from "@/app/api/admin/voxy-render-request-drafts/route";
import {
  createInMemoryVoxyRenderRequestDraftRepository,
  setVoxyRenderRequestDraftRepositoryForTests,
} from "@/features/create/voxyRenderRequestDraftStore";

function req(url: string, init?: RequestInit) {
  return new NextRequest(url, init);
}

function buildCommand() {
  return {
    requestDraftId: "voxy-render-request-draft:preview-1",
    decisionId: "voxy-render-decision:test-1",
    decisionGateId: "voxy-render-review-decision-gate:admin-1",
    surface: "admin",
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
    scriptRef: null,
    handoffRef: null,
    preflightRef: null,
    registryRef: null,
    adapterRef: null,
    videoFormat: "briefing_video",
    requestStatus: "ready_for_future_runtime_review",
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
    sourceFactcheckRequirements: [],
    reviewerNote: "Nur als Draft dokumentieren.",
    userVisibleReason: "Nur Draft, keine Ausführung.",
    reviewerVisibleReason: "Auditierbarer Draft ohne Queue, Provider, Datei und Publish.",
    nextStep: "Audit prüfen",
    decisionStatusSnapshot: "persisted_review_decision",
    execution: {
      createsRenderJob: false,
      queueAllowed: false,
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
    createdAt: "2026-07-09T12:45:00.000Z",
  } as const;
}

describe("voxy render request draft admin route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({
      _id: {
        toHexString: () => "admin-1",
      },
    });
    setVoxyRenderRequestDraftRepositoryForTests(
      createInMemoryVoxyRenderRequestDraftRepository(),
    );
  });

  it("persists an honest preview-only request draft with audit trail", async () => {
    const postRes = await POST(
      req("http://localhost/api/admin/voxy-render-request-drafts", {
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
          requestStatus: "ready_for_future_runtime_review",
          persistedBy: "admin-1",
        },
      },
      auditEvent: {
        action: "request_draft_recorded",
        decisionGateId: "voxy-render-review-decision-gate:admin-1",
        requestStatus: "ready_for_future_runtime_review",
      },
      persistence: {
        mode: "in_memory_fallback",
        adminWritePath: "admin_api_available",
      },
    });

    const getRes = await GET(
      req(
        "http://localhost/api/admin/voxy-render-request-drafts?decisionGateId=voxy-render-review-decision-gate:admin-1&limit=5",
      ),
    );

    expect(getRes.status).toBe(200);
    await expect(getRes.json()).resolves.toMatchObject({
      ok: true,
      latestRecord: {
        decisionGateId: "voxy-render-review-decision-gate:admin-1",
        requestStatus: "ready_for_future_runtime_review",
      },
      records: [
        {
          decisionGateId: "voxy-render-review-decision-gate:admin-1",
          requestStatus: "ready_for_future_runtime_review",
        },
      ],
      auditEvents: [
        {
          action: "request_draft_recorded",
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
      req("http://localhost/api/admin/voxy-render-request-drafts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decisionGateId: "" }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid_voxy_render_request_draft_command",
    });
  });
});
