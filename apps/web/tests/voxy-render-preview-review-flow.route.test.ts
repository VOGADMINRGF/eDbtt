import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdmin(...args),
}));

import { GET, POST } from "@/app/api/admin/voxy-render-preview-review-flows/route";
import {
  createInMemoryVoxyRenderPreviewReviewFlowRepository,
  setVoxyRenderPreviewReviewFlowRepositoryForTests,
} from "@/features/create/voxyRenderPreviewReviewFlowStore";

function req(url: string, init?: RequestInit) {
  return new NextRequest(url, init);
}

function buildCommand() {
  return {
    previewReviewFlowId: "voxy-render-preview-review-flow:preview-1",
    enablementBacklogId: "voxy-render-runtime-enablement-backlog:preview-1",
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
    previewStatus: "no_preview_available",
    previewCandidate: {
      previewCandidateId: null,
      status: "no_media",
      mediaUrl: null,
      thumbnailUrl: null,
      durationSeconds: null,
      generated: false,
      rendered: false,
      uploaded: false,
      playable: false,
      reviewerVisibleReason: "Keine Datei vorhanden.",
      userVisibleReason: "Noch kein Preview-Video vorhanden.",
    },
    reviewActions: [
      {
        actionKey: "comment_only",
        allowed: true,
        executionAllowed: false,
        createsRenderJob: false,
        triggersProvider: false,
        triggersPublish: false,
        userVisibleLabel: "Kommentar dokumentieren",
        reviewerVisibleReason: "Kommentar bleibt nur Audit.",
      },
      {
        actionKey: "mark_review_ready",
        allowed: true,
        executionAllowed: false,
        createsRenderJob: false,
        triggersProvider: false,
        triggersPublish: false,
        userVisibleLabel: "Als review-ready markieren",
        reviewerVisibleReason: "Nicht gleich Approval oder Publish.",
      },
    ],
    reviewChecklist: [
      {
        checkKey: "script_accuracy",
        status: "needs_review",
        reviewerVisibleReason: "Script bleibt Review-Punkt.",
        userVisibleReason: "Script bleibt zu prüfen.",
      },
      {
        checkKey: "accessibility",
        status: "needs_review",
        reviewerVisibleReason: "Barrierefreiheit bleibt sichtbar.",
        userVisibleReason: "Barrierefreiheit bleibt zu prüfen.",
      },
    ],
    overallDecision: "no_preview_available",
    topBlockers: ["Noch kein Preview-Video.", "Keine Medien-Datei."],
    nextRecommendedAction: "prepare_preview_review_checklist",
    reviewerVisibleSummary: "Flow bleibt review-first.",
    userVisibleSummary: "Es gibt noch kein Preview-Video.",
    nextStep: "Checklist vorbereiten.",
    execution: {
      previewRendered: false,
      renderAllowed: false,
      queueAllowed: false,
      workerAllowed: false,
      providerExecutionAllowed: false,
      secretsAccessed: false,
      mediaFileCreationAllowed: false,
      previewFileAvailable: false,
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

describe("voxy render preview review flow admin route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({
      _id: {
        toHexString: () => "admin-1",
      },
    });
    setVoxyRenderPreviewReviewFlowRepositoryForTests(
      createInMemoryVoxyRenderPreviewReviewFlowRepository(),
    );
  });

  it("persists a preview-review-flow audit record without rendering anything", async () => {
    const postRes = await POST(
      req("http://localhost/api/admin/voxy-render-preview-review-flows", {
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
          previewStatus: "no_preview_available",
          persistedBy: "admin-1",
        },
      },
      auditEvent: {
        action: "preview_review_flow_recorded",
        decisionGateId: "voxy-render-review-decision-gate:admin-1",
        previewStatus: "no_preview_available",
      },
      persistence: {
        mode: "in_memory_fallback",
        adminWritePath: "admin_api_available",
      },
    });

    const getRes = await GET(
      req(
        "http://localhost/api/admin/voxy-render-preview-review-flows?decisionGateId=voxy-render-review-decision-gate:admin-1&limit=5",
      ),
    );

    expect(getRes.status).toBe(200);
    await expect(getRes.json()).resolves.toMatchObject({
      ok: true,
      latestRecord: {
        decisionGateId: "voxy-render-review-decision-gate:admin-1",
        previewStatus: "no_preview_available",
      },
      records: [
        {
          decisionGateId: "voxy-render-review-decision-gate:admin-1",
          previewStatus: "no_preview_available",
        },
      ],
      auditEvents: [
        {
          action: "preview_review_flow_recorded",
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
      req("http://localhost/api/admin/voxy-render-preview-review-flows", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decisionGateId: "" }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid_voxy_render_preview_review_flow_command",
    });
  });
});
