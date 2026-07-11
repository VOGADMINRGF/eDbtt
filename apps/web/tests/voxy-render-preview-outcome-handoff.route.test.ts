import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdmin(...args),
}));

import { GET, POST } from "@/app/api/admin/voxy-render-preview-outcome-handoffs/route";
import {
  createInMemoryVoxyRenderPreviewOutcomeHandoffRepository,
  setVoxyRenderPreviewOutcomeHandoffRepositoryForTests,
} from "@/features/create/voxyRenderPreviewOutcomeHandoffStore";

function req(url: string, init?: RequestInit) {
  return new NextRequest(url, init);
}

function buildCommand() {
  return {
    previewReviewDecisionRecordId: "voxy-render-preview-review-decision:1",
    previewReviewFlowId: "voxy-render-preview-review-flow:preview-1",
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
    handoffStatus: "review_context_only",
    outcomeType: "comment_only",
    downstreamTarget: "review_context",
    handoffPayload: {
      reviewerComment: "Kommentar bleibt Review-Kontext.",
      revisionReason: null,
      rejectionReason: null,
      reviewReadyReason: null,
      checklistSummary: "Noch kein Preview-Video. Keine Medien-Datei.",
      languageNotes: "Quelle und Lesefassung bleiben sichtbar.",
      claimSafetyNotes: "Claim-Sicherheit bleibt manuell.",
      assetNotes: "Keine Asset-Aktion.",
      runtimeNotes: "Keine Runtime.",
      downstreamNotes: "Kein Workflow-Trigger.",
    },
    handoffEffects: {
      createsScriptRevisionTask: false,
      createsAssetRevisionTask: false,
      createsRuntimeBacklogTask: false,
      blocksDownstream: false,
      marksReviewReadyOnly: false,
      pausesVideoFlow: false,
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
    nextStep: "keep_review_context",
    userVisibleSummary: "Kommentar bleibt Review-Kontext.",
    reviewerVisibleSummary: "Kommentar bleibt audit-only Review-Kontext.",
    previewReviewDecisionTypeHint: "comment_only",
    previewReviewDecisionStatusHint: "persisted_audit_only",
    previewReviewFlowStatusHint: "no_preview_available",
  } as const;
}

describe("voxy render preview outcome handoff admin route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({
      _id: {
        toHexString: () => "admin-1",
      },
    });
    setVoxyRenderPreviewOutcomeHandoffRepositoryForTests(
      createInMemoryVoxyRenderPreviewOutcomeHandoffRepository(),
    );
  });

  it("persists outcome handoffs as audit-only records without runtime side effects", async () => {
    const postRes = await POST(
      req("http://localhost/api/admin/voxy-render-preview-outcome-handoffs", {
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
          previewReviewDecisionRecordId: "voxy-render-preview-review-decision:1",
          outcomeType: "comment_only",
          handoffStatus: "review_context_only",
          downstreamTarget: "review_context",
          persistedBy: "admin-1",
          executionFlags: {
            renderAllowed: false,
            rerenderAllowed: false,
            publishAllowed: false,
          },
        },
      },
      auditEvent: {
        action: "preview_outcome_handoff_recorded",
        previewReviewDecisionRecordId: "voxy-render-preview-review-decision:1",
        outcomeType: "comment_only",
      },
      persistence: {
        mode: "in_memory_fallback",
        adminWritePath: "admin_api_available",
      },
    });

    const getRes = await GET(
      req(
        "http://localhost/api/admin/voxy-render-preview-outcome-handoffs?previewReviewDecisionRecordId=voxy-render-preview-review-decision:1&limit=5",
      ),
    );

    expect(getRes.status).toBe(200);
    await expect(getRes.json()).resolves.toMatchObject({
      ok: true,
      latestRecord: {
        previewReviewDecisionRecordId: "voxy-render-preview-review-decision:1",
        outcomeType: "comment_only",
      },
      records: [
        {
          previewReviewDecisionRecordId: "voxy-render-preview-review-decision:1",
          previewReviewFlowId: "voxy-render-preview-review-flow:preview-1",
        },
      ],
      auditEvents: [
        {
          action: "preview_outcome_handoff_recorded",
          previewReviewDecisionRecordId: "voxy-render-preview-review-decision:1",
        },
      ],
      persistence: {
        mode: "in_memory_fallback",
      },
    });
  });

  it("blocks commands when the preview review decision is missing", async () => {
    const command = { ...buildCommand(), previewReviewDecisionRecordId: null };
    const res = await POST(
      req("http://localhost/api/admin/voxy-render-preview-outcome-handoffs", {
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
        errors: ["preview_review_decision_record_required"],
      },
    });
  });

  it("rejects invalid commands", async () => {
    const res = await POST(
      req("http://localhost/api/admin/voxy-render-preview-outcome-handoffs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ outcomeType: "bad" }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid_voxy_render_preview_outcome_handoff_command",
    });
  });
});
