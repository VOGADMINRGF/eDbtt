import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdmin(...args),
}));

import { GET, POST } from "@/app/api/admin/voxy-render-provider-selection-drafts/route";
import {
  createInMemoryVoxyRenderProviderSelectionDraftRepository,
  setVoxyRenderProviderSelectionDraftRepositoryForTests,
} from "@/features/create/voxyRenderProviderSelectionDraftStore";

function req(url: string, init?: RequestInit) {
  return new NextRequest(url, init);
}

function buildCommand() {
  return {
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
    providerSelectionStatus: "needs_provider_configuration",
    candidates: [
      {
        candidateId: "provider-candidate:avatar-render",
        label: "Avatar-Video & Render",
        status: "requirement_only",
        statusLabel: "Nur Anforderung",
        source: "requirement",
        sourceLabel: "Anforderung",
        providerName: null,
        requiredCapabilities: ["avatar_video", "brand_overlay", "lower_thirds", "preview_render"],
        missingCapabilities: ["avatar_video", "lower_thirds", "preview_render"],
        reviewerVisibleReason: "Konkrete Provider-Konfiguration fehlt.",
        userVisibleReason: "Konkrete Provider-Konfiguration fehlt.",
        executionAllowed: false,
        providerCalled: false,
        secretsAccessed: false,
        pricingClaimAllowed: false,
        renderSafe: false,
      },
    ],
    inventoryFindings: ["Es gibt keine belegte Provider-Konfiguration."],
    gateHints: ["Pricing fehlt."],
    blockers: ["Konkrete Provider-Konfiguration fehlt."],
    decision: {
      nextProviderDecision: "configure_provider",
      userVisibleReason: "Provider-Konfiguration fehlt",
      reviewerVisibleReason: "Provider-Konfiguration fehlt",
      nextStep: "Provider konfigurieren. Kein Providerlauf entsteht in diesem Schritt.",
    },
    execution: {
      providerExecutionAllowed: false,
      providerCalled: false,
      secretsAccessed: false,
      pricingClaimAllowed: false,
      queueEnabled: false,
      createsQueueJob: false,
      workerExecutionAllowed: false,
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

describe("voxy render provider selection draft admin route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({
      _id: {
        toHexString: () => "admin-1",
      },
    });
    setVoxyRenderProviderSelectionDraftRepositoryForTests(
      createInMemoryVoxyRenderProviderSelectionDraftRepository(),
    );
  });

  it("persists an honest provider-selection draft preview with audit trail", async () => {
    const postRes = await POST(
      req("http://localhost/api/admin/voxy-render-provider-selection-drafts", {
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
          providerSelectionStatus: "needs_provider_configuration",
          persistedBy: "admin-1",
        },
      },
      auditEvent: {
        action: "provider_selection_draft_recorded",
        decisionGateId: "voxy-render-review-decision-gate:admin-1",
        providerSelectionStatus: "needs_provider_configuration",
      },
      persistence: {
        mode: "in_memory_fallback",
        adminWritePath: "admin_api_available",
      },
    });

    const getRes = await GET(
      req(
        "http://localhost/api/admin/voxy-render-provider-selection-drafts?decisionGateId=voxy-render-review-decision-gate:admin-1&limit=5",
      ),
    );

    expect(getRes.status).toBe(200);
    await expect(getRes.json()).resolves.toMatchObject({
      ok: true,
      latestRecord: {
        decisionGateId: "voxy-render-review-decision-gate:admin-1",
        providerSelectionStatus: "needs_provider_configuration",
      },
      records: [
        {
          decisionGateId: "voxy-render-review-decision-gate:admin-1",
          providerSelectionStatus: "needs_provider_configuration",
        },
      ],
      auditEvents: [
        {
          action: "provider_selection_draft_recorded",
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
      req("http://localhost/api/admin/voxy-render-provider-selection-drafts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decisionGateId: "" }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid_voxy_render_provider_selection_draft_command",
    });
  });
});
