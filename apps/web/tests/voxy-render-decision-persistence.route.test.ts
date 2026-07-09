import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdmin(...args),
}));

import { GET, POST } from "@/app/api/admin/voxy-render-review-decisions/route";
import {
  createInMemoryVoxyRenderDecisionRepository,
  setVoxyRenderDecisionRepositoryForTests,
} from "@/features/create/voxyRenderDecisionPersistenceStore";

function req(url: string, init?: RequestInit) {
  return new NextRequest(url, init);
}

function buildCommand() {
  return {
    decisionGateId: "voxy-render-review-decision-gate:admin-1",
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
    selectedDecision: "review_script",
    reviewerNote: "Script zuerst prüfen.",
    reviewerRole: "admin",
    sourceLanguage: "de",
    readingLanguage: "de",
    scriptLanguage: "de",
    renderLanguage: "de",
    subtitleLanguage: null,
    originalPreserved: true,
    translationIsEvidence: false,
    rtlDecisionHint: null,
    createdBy: null,
    createdAt: "2026-07-09T10:15:00.000Z",
  };
}

describe("voxy render decision persistence admin route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({
      _id: {
        toHexString: () => "admin-1",
      },
    });
    setVoxyRenderDecisionRepositoryForTests(createInMemoryVoxyRenderDecisionRepository());
  });

  it("persists an honest preview-only decision record with audit trail", async () => {
    const postRes = await POST(
      req("http://localhost/api/admin/voxy-render-review-decisions", {
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
          status: "noop_persistence",
          selectedDecision: "review_script",
          persistedBy: "admin-1",
        },
      },
      auditEvent: {
        action: "decision_recorded",
        decisionGateId: "voxy-render-review-decision-gate:admin-1",
        selectedDecision: "review_script",
      },
      persistence: {
        mode: "in_memory_fallback",
        adminWritePath: "admin_api_available",
      },
    });

    const getRes = await GET(
      req(
        "http://localhost/api/admin/voxy-render-review-decisions?decisionGateId=voxy-render-review-decision-gate:admin-1&limit=5",
      ),
    );

    expect(getRes.status).toBe(200);
    await expect(getRes.json()).resolves.toMatchObject({
      ok: true,
      latestRecord: {
        decisionGateId: "voxy-render-review-decision-gate:admin-1",
        status: "noop_persistence",
      },
      records: [
        {
          decisionGateId: "voxy-render-review-decision-gate:admin-1",
          selectedDecision: "review_script",
        },
      ],
      auditEvents: [
        {
          action: "decision_recorded",
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
      req("http://localhost/api/admin/voxy-render-review-decisions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decisionGateId: "", selectedDecision: "bad" }),
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid_voxy_render_decision_command",
    });
  });
});
