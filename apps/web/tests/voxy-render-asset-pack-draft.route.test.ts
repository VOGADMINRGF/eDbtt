import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdmin(...args),
}));

import { GET, POST } from "@/app/api/admin/voxy-render-asset-pack-drafts/route";
import {
  createInMemoryVoxyRenderAssetPackDraftRepository,
  setVoxyRenderAssetPackDraftRepositoryForTests,
} from "@/features/create/voxyRenderAssetPackDraftStore";

function req(url: string, init?: RequestInit) {
  return new NextRequest(url, init);
}

function buildCommand() {
  return {
    assetPackDraftId: "voxy-render-asset-pack-draft:preview-1",
    requestDraftId: "voxy-render-request-draft:preview-1",
    queuePreviewId: "voxy-render-queue-preview:preview-1",
    costPolicyPreviewId: "voxy-render-cost-credit-policy:preview-1",
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
    assetPackStatus: "needs_voice_profile",
    assetEntries: [
      {
        assetKey: "voxy_avatar",
        label: "Voxy-Avatar",
        status: "available",
        statusLabel: "Vorhanden",
        source: "repo",
        sourceLabel: "Repo",
        publicPath: "/brand/voxy/voxy-confident.png",
        reviewerVisibleReason: "Repo-Asset vorhanden.",
        userVisibleReason: "Repo-Asset vorhanden.",
        renderSafe: false,
        generated: false,
        uploaded: false,
      },
      {
        assetKey: "voice_profile",
        label: "Voice-Profil",
        status: "missing",
        statusLabel: "Fehlt",
        source: "requirement",
        sourceLabel: "Anforderung",
        publicPath: null,
        reviewerVisibleReason: "Kein Voice-Profil vorhanden.",
        userVisibleReason: "Kein Voice-Profil vorhanden.",
        renderSafe: false,
        generated: false,
        uploaded: false,
      },
    ],
    providerRequirements: [],
    assetRequirements: [],
    costRequirements: [],
    blockers: ["Noch keine Datei."],
    evidenceLines: ["Manifest: /brand/voxy/manifest.json"],
    nextAssetDecision: "prepare_voice_profile",
    userVisibleReason: "Voice-Profil fehlt weiterhin.",
    reviewerVisibleReason: "Noop-Asset-Pack ohne Datei oder Providerlauf.",
    nextStep: "Voice-Profil vorbereiten und Review-first Grenze beibehalten",
    execution: {
      createsMediaFile: false,
      createsSubtitleFile: false,
      createsVoiceFile: false,
      createsExportPreset: false,
      callsProvider: false,
      queueEnabled: false,
      costDebitAllowed: false,
      creditDebitAllowed: false,
      uploadAllowed: false,
      publishAllowed: false,
      runtimeClaimAllowed: false,
    },
    createdBy: null,
    createdAt: "2026-07-10T09:00:00.000Z",
  } as const;
}

describe("voxy render asset pack draft admin route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({
      _id: {
        toHexString: () => "admin-1",
      },
    });
    setVoxyRenderAssetPackDraftRepositoryForTests(
      createInMemoryVoxyRenderAssetPackDraftRepository(),
    );
  });

  it("persists an honest asset-pack draft preview with audit trail", async () => {
    const postRes = await POST(
      req("http://localhost/api/admin/voxy-render-asset-pack-drafts", {
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
          assetPackStatus: "needs_voice_profile",
          persistedBy: "admin-1",
        },
      },
      auditEvent: {
        action: "asset_pack_draft_recorded",
        decisionGateId: "voxy-render-review-decision-gate:admin-1",
        assetPackStatus: "needs_voice_profile",
      },
      persistence: {
        mode: "in_memory_fallback",
        adminWritePath: "admin_api_available",
      },
    });

    const getRes = await GET(
      req(
        "http://localhost/api/admin/voxy-render-asset-pack-drafts?decisionGateId=voxy-render-review-decision-gate:admin-1&limit=5",
      ),
    );

    expect(getRes.status).toBe(200);
    await expect(getRes.json()).resolves.toMatchObject({
      ok: true,
      latestRecord: {
        decisionGateId: "voxy-render-review-decision-gate:admin-1",
        assetPackStatus: "needs_voice_profile",
      },
      records: [
        {
          decisionGateId: "voxy-render-review-decision-gate:admin-1",
          assetPackStatus: "needs_voice_profile",
        },
      ],
      auditEvents: [
        {
          action: "asset_pack_draft_recorded",
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
      req("http://localhost/api/admin/voxy-render-asset-pack-drafts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decisionGateId: "" }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid_voxy_render_asset_pack_draft_command",
    });
  });
});
