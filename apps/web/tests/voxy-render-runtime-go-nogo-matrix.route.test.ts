import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdmin(...args),
}));

import { GET, POST } from "@/app/api/admin/voxy-render-runtime-go-nogo-matrix/route";
import {
  createInMemoryVoxyRenderRuntimeGoNogoMatrixRepository,
  setVoxyRenderRuntimeGoNogoMatrixRepositoryForTests,
} from "@/features/create/voxyRenderRuntimeGoNogoMatrixStore";

function req(url: string, init?: RequestInit) {
  return new NextRequest(url, init);
}

function buildCommand() {
  const gate = {
    label: "Review",
    status: "no_go",
    blockerSeverity: "blocker",
    reviewerVisibleReason: "Review fehlt.",
    userVisibleReason: "Review fehlt.",
    evidenceRefs: ["voxy-render-review-decision-gate:admin-1"],
    nextAction: "review_script",
    executionAllowed: false,
  } as const;
  return {
    matrixId: "voxy-render-runtime-go-nogo-matrix:preview-1",
    providerSelectionDraftId: "voxy-render-provider-selection-draft:preview-1",
    assetPackDraftId: "voxy-render-asset-pack-draft:preview-1",
    costPolicyPreviewId: "voxy-render-cost-credit-policy:preview-1",
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
    videoFormat: "briefing_video",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
    surface: "admin",
    matrixStatus: "blocked_by_review",
    reviewGate: { ...gate, gateKey: "review" },
    providerGate: { ...gate, gateKey: "provider", label: "Provider" },
    assetGate: { ...gate, gateKey: "assets", label: "Assets" },
    queueGate: { ...gate, gateKey: "queue", label: "Queue", blockerSeverity: "warning" },
    costCreditGate: { ...gate, gateKey: "cost_credit", label: "Kosten & Credits" },
    languageGate: { ...gate, gateKey: "language", label: "Sprache & Untertitel", blockerSeverity: "info" },
    runtimeGate: { ...gate, gateKey: "runtime", label: "Runtime", blockerSeverity: "warning", nextAction: "wait_for_runtime" },
    publishGate: { ...gate, gateKey: "publish", label: "Veröffentlichung", blockerSeverity: "info", nextAction: "wait_for_runtime" },
    overallDecision: "review_needed",
    topBlockers: ["Review fehlt."],
    nextRecommendedAction: "review_script",
    nextStep: "Script prüfen. Kein Render entsteht in diesem Schritt.",
    execution: {
      renderAllowed: false,
      queueAllowed: false,
      workerAllowed: false,
      providerExecutionAllowed: false,
      secretsAccessed: false,
      mediaFileCreationAllowed: false,
      costDebitAllowed: false,
      creditDebitAllowed: false,
      uploadAllowed: false,
      publishAllowed: false,
      socialPostAllowed: false,
      schedulingAllowed: false,
      runtimeClaimAllowed: false,
    },
    createdBy: null,
    createdAt: "2026-07-10T11:00:00.000Z",
  } as const;
}

describe("voxy render runtime go/no-go admin route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({
      _id: {
        toHexString: () => "admin-1",
      },
    });
    setVoxyRenderRuntimeGoNogoMatrixRepositoryForTests(
      createInMemoryVoxyRenderRuntimeGoNogoMatrixRepository(),
    );
  });

  it("persists an honest go/no-go matrix preview with audit trail", async () => {
    const postRes = await POST(
      req("http://localhost/api/admin/voxy-render-runtime-go-nogo-matrix", {
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
          decisionGateId: "voxy-render-review-decision-gate:admin-1",
          matrixStatus: "blocked_by_review",
          persistedBy: "admin-1",
        },
      },
      auditEvent: {
        action: "runtime_go_nogo_matrix_recorded",
        decisionGateId: "voxy-render-review-decision-gate:admin-1",
        matrixStatus: "blocked_by_review",
      },
      persistence: {
        mode: "in_memory_fallback",
        adminWritePath: "admin_api_available",
      },
    });

    const getRes = await GET(
      req(
        "http://localhost/api/admin/voxy-render-runtime-go-nogo-matrix?decisionGateId=voxy-render-review-decision-gate:admin-1&limit=5",
      ),
    );

    expect(getRes.status).toBe(200);
    await expect(getRes.json()).resolves.toMatchObject({
      ok: true,
      latestRecord: {
        decisionGateId: "voxy-render-review-decision-gate:admin-1",
        matrixStatus: "blocked_by_review",
      },
      records: [
        {
          decisionGateId: "voxy-render-review-decision-gate:admin-1",
          matrixStatus: "blocked_by_review",
        },
      ],
      auditEvents: [
        {
          action: "runtime_go_nogo_matrix_recorded",
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
      req("http://localhost/api/admin/voxy-render-runtime-go-nogo-matrix", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decisionGateId: "" }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid_voxy_render_runtime_go_nogo_matrix_command",
    });
  });
});
