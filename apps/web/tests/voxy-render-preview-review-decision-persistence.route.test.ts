import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdmin(...args),
}));

import { GET, POST } from "@/app/api/admin/voxy-render-preview-review-decisions/route";
import {
  createInMemoryVoxyRenderPreviewReviewDecisionRepository,
  setVoxyRenderPreviewReviewDecisionRepositoryForTests,
} from "@/features/create/voxyRenderPreviewReviewDecisionPersistenceStore";

function req(url: string, init?: RequestInit) {
  return new NextRequest(url, init);
}

function buildCommand() {
  return {
    previewReviewFlowId: "voxy-render-preview-review-flow:preview-1",
    decisionGateId: "voxy-render-review-decision-gate:admin-1",
    enablementBacklogId: "voxy-render-runtime-enablement-backlog:preview-1",
    matrixId: "voxy-render-runtime-go-nogo-matrix:preview-1",
    requestDraftId: "voxy-render-request-draft:preview-1",
    renderDecisionId: "voxy-render-decision:test-1",
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
    reviewerRef: null,
    createdAt: "2026-07-11T10:00:00.000Z",
    updatedAt: null,
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: "de",
    originalPreserved: true,
    translationIsEvidence: false,
    rtlRequired: false,
    decisionType: "comment_only",
    decisionPayload: {
      reviewerComment: "Kommentar wird nur auditierbar dokumentiert.",
      revisionReason: null,
      rejectionReason: null,
      reviewReadyReason: null,
      checklistFindings: ["Noch kein Preview-Video.", "Keine Medien-Datei."],
      languageNotes: "Quelle und Lesefassung bleiben sichtbar.",
      sourceCaptionNotes: "Caption-Treue bleibt Review-Aufgabe.",
      claimSafetyNotes: "Claim-Sicherheit bleibt manuell.",
      brandNotes: "Brand-Fit bleibt sichtbar.",
      accessibilityNotes: "Barrierefreiheit bleibt offen.",
      legalSafetyNotes: "Rechtliche Sicherheit bleibt Review-Punkt.",
    },
    checklistResults: [
      {
        checkKey: "script_accuracy",
        status: "needs_review",
        reviewerVisibleReason: "Script bleibt zu prüfen.",
        userVisibleReason: "Script bleibt zu prüfen.",
      },
      {
        checkKey: "accessibility",
        status: "not_checked",
        reviewerVisibleReason: "Barrierefreiheit bleibt offen.",
        userVisibleReason: "Barrierefreiheit bleibt offen.",
      },
    ],
    decisionEffects: {
      createsRenderJob: false,
      triggersRerender: false,
      triggersProvider: false,
      createsQueueJob: false,
      createsMediaFile: false,
      createsUpload: false,
      triggersPublish: false,
      costDebitAllowed: false,
      creditDebitAllowed: false,
      runtimeClaimAllowed: false,
    },
    executionFlags: {
      previewRendered: false,
      renderAllowed: false,
      rerenderAllowed: false,
      queueAllowed: false,
      workerAllowed: false,
      providerExecutionAllowed: false,
      secretsAccessed: false,
      mediaFileCreationAllowed: false,
      previewFileAvailable: false,
      uploadAllowed: false,
      publishAllowed: false,
      socialPostAllowed: false,
      schedulingAllowed: false,
      runtimeClaimAllowed: false,
    },
    nextStep: "Kommentar dokumentieren, ohne Runtime zu starten.",
    userVisibleSummary: "Es wird nur kommentiert. Kein Render, kein Publish.",
    reviewerVisibleSummary: "Kommentar bleibt audit-only und trennt sich von jeder Runtime.",
    previewReviewStatusHint: "no_preview_available",
  } as const;
}

describe("voxy render preview review decision persistence admin route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({
      _id: {
        toHexString: () => "admin-1",
      },
    });
    setVoxyRenderPreviewReviewDecisionRepositoryForTests(
      createInMemoryVoxyRenderPreviewReviewDecisionRepository(),
    );
  });

  it("persists preview-review decisions as audit-only records without runtime side effects", async () => {
    const postRes = await POST(
      req("http://localhost/api/admin/voxy-render-preview-review-decisions", {
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
          decisionType: "comment_only",
          decisionStatus: "preview_review_decision_only",
          persistedBy: "admin-1",
          executionFlags: {
            renderAllowed: false,
            rerenderAllowed: false,
            publishAllowed: false,
          },
        },
      },
      auditEvent: {
        action: "preview_review_decision_recorded",
        decisionGateId: "voxy-render-review-decision-gate:admin-1",
        decisionType: "comment_only",
      },
      persistence: {
        mode: "in_memory_fallback",
        adminWritePath: "admin_api_available",
      },
    });

    const getRes = await GET(
      req(
        "http://localhost/api/admin/voxy-render-preview-review-decisions?decisionGateId=voxy-render-review-decision-gate:admin-1&limit=5",
      ),
    );

    expect(getRes.status).toBe(200);
    await expect(getRes.json()).resolves.toMatchObject({
      ok: true,
      latestRecord: {
        decisionGateId: "voxy-render-review-decision-gate:admin-1",
        decisionType: "comment_only",
      },
      records: [
        {
          decisionGateId: "voxy-render-review-decision-gate:admin-1",
          previewReviewFlowId: "voxy-render-preview-review-flow:preview-1",
        },
      ],
      auditEvents: [
        {
          action: "preview_review_decision_recorded",
          decisionGateId: "voxy-render-review-decision-gate:admin-1",
        },
      ],
      persistence: {
        mode: "in_memory_fallback",
      },
    });
  });

  it("blocks commands when the preview review flow is missing", async () => {
    const command = { ...buildCommand(), previewReviewFlowId: null };
    const res = await POST(
      req("http://localhost/api/admin/voxy-render-preview-review-decisions", {
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
        errors: ["preview_review_flow_required"],
      },
    });
  });

  it("rejects invalid commands", async () => {
    const res = await POST(
      req("http://localhost/api/admin/voxy-render-preview-review-decisions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decisionType: "bad" }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid_voxy_render_preview_review_decision_command",
    });
  });
});
