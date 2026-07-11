import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdmin(...args),
}));

import { GET, POST } from "@/app/api/admin/voxy-render-runtime-enablement-backlogs/route";
import {
  createInMemoryVoxyRenderRuntimeEnablementBacklogRepository,
  setVoxyRenderRuntimeEnablementBacklogRepositoryForTests,
} from "@/features/create/voxyRenderRuntimeEnablementBacklogStore";

function req(url: string, init?: RequestInit) {
  return new NextRequest(url, init);
}

function buildCommand() {
  return {
    backlogId: "voxy-render-runtime-enablement-backlog:preview-1",
    matrixId: "voxy-render-runtime-go-nogo-matrix:preview-1",
    providerSelectionDraftId: "voxy-render-provider-selection-draft:preview-1",
    assetPackDraftId: "voxy-render-asset-pack-draft:preview-1",
    costPolicyPreviewId: "voxy-render-cost-credit-policy:preview-1",
    queuePreviewId: "voxy-render-queue-preview:preview-1",
    requestDraftId: "voxy-render-request-draft:preview-1",
    decisionId: "voxy-render-decision:test-1",
    decisionGateId: "voxy-render-review-decision-gate:admin-1",
    scriptRef: {
      id: "script-1",
      title: "Voxy Script",
      href: "/admin/review",
    },
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
    backlogStatus: "blocked_by_runtime_truth",
    items: [
      {
        itemId: "voxy-render-runtime-enablement-item:provider-1",
        category: "provider",
        title: "Provider-Strategie definieren",
        status: "needs_decision",
        priority: "p0",
        dependencyKeys: ["matrix:preview-1", "gate:provider"],
        sourceGate: "provider",
        userVisibleReason: "Provider bleibt offen.",
        reviewerVisibleReason: "Provider-Strategie fehlt.",
        acceptanceCriteria: ["Providerpfad ist dokumentiert."],
        nonGoals: ["Kein Rendering"],
        runtimeImpact: "requires_provider",
        executionAllowed: false,
        implemented: false,
      },
      {
        itemId: "voxy-render-runtime-enablement-item:queue-1",
        category: "queue",
        title: "Queue-Architektur definieren",
        status: "needs_runtime",
        priority: "p0",
        dependencyKeys: ["matrix:preview-1", "gate:queue"],
        sourceGate: "queue",
        userVisibleReason: "Queue bleibt disabled.",
        reviewerVisibleReason: "Queue bleibt disabled.",
        acceptanceCriteria: ["Queue-Grenzen sind dokumentiert."],
        nonGoals: ["Keine Queue-Ausführung"],
        runtimeImpact: "requires_worker",
        executionAllowed: false,
        implemented: false,
      },
    ],
    topP0Items: ["Provider-Strategie definieren", "Queue-Architektur definieren"],
    nextRecommendedAction: "define_provider_strategy",
    reviewerVisibleSummary: "Backlog bleibt rein planerisch.",
    userVisibleSummary: "Es werden nur Enablement-Aufgaben gesammelt.",
    execution: {
      runtimeEnabled: false,
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
    createdAt: "2026-07-11T08:00:00.000Z",
  } as const;
}

describe("voxy render runtime enablement backlog admin route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({
      _id: {
        toHexString: () => "admin-1",
      },
    });
    setVoxyRenderRuntimeEnablementBacklogRepositoryForTests(
      createInMemoryVoxyRenderRuntimeEnablementBacklogRepository(),
    );
  });

  it("persists a review-first enablement backlog preview with audit trail", async () => {
    const postRes = await POST(
      req("http://localhost/api/admin/voxy-render-runtime-enablement-backlogs", {
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
          backlogStatus: "blocked_by_runtime_truth",
          persistedBy: "admin-1",
        },
      },
      auditEvent: {
        action: "runtime_enablement_backlog_recorded",
        decisionGateId: "voxy-render-review-decision-gate:admin-1",
        backlogStatus: "blocked_by_runtime_truth",
      },
      persistence: {
        mode: "in_memory_fallback",
        adminWritePath: "admin_api_available",
      },
    });

    const getRes = await GET(
      req(
        "http://localhost/api/admin/voxy-render-runtime-enablement-backlogs?decisionGateId=voxy-render-review-decision-gate:admin-1&limit=5",
      ),
    );

    expect(getRes.status).toBe(200);
    await expect(getRes.json()).resolves.toMatchObject({
      ok: true,
      latestRecord: {
        decisionGateId: "voxy-render-review-decision-gate:admin-1",
        backlogStatus: "blocked_by_runtime_truth",
      },
      records: [
        {
          decisionGateId: "voxy-render-review-decision-gate:admin-1",
          backlogStatus: "blocked_by_runtime_truth",
        },
      ],
      auditEvents: [
        {
          action: "runtime_enablement_backlog_recorded",
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
      req("http://localhost/api/admin/voxy-render-runtime-enablement-backlogs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decisionGateId: "" }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid_voxy_render_runtime_enablement_backlog_command",
    });
  });
});
