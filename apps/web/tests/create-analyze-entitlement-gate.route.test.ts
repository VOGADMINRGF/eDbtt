import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  analyzeContribution: vi.fn(),
  rateLimitOrThrow: vi.fn(),
  deriveContextNotes: vi.fn(),
  deriveCriticalQuestions: vi.fn(),
  deriveKnots: vi.fn(),
  persistEventualitiesSnapshot: vi.fn(),
  upsertRunReceipt: vi.fn(),
  loggerError: vi.fn(),
  maskUserId: vi.fn(),
  buildHeuristicAnalyzeResult: vi.fn(),
  resolveCreateGraphMatches: vi.fn(),
  getCreateEntitlementsForRequest: vi.fn(),
}));

vi.mock("@features/analyze/analyzeContribution", () => ({
  analyzeContribution: (...args: unknown[]) => mocks.analyzeContribution(...args),
}));

vi.mock("@/utils/rateLimitHelpers", () => ({
  rateLimitOrThrow: (...args: unknown[]) => mocks.rateLimitOrThrow(...args),
}));

vi.mock("@features/analyze/context", () => ({
  deriveContextNotes: (...args: unknown[]) => mocks.deriveContextNotes(...args),
}));

vi.mock("@features/analyze/questionizers", () => ({
  deriveCriticalQuestions: (...args: unknown[]) => mocks.deriveCriticalQuestions(...args),
  deriveKnots: (...args: unknown[]) => mocks.deriveKnots(...args),
}));

vi.mock("@core/eventualities", () => ({
  persistEventualitiesSnapshot: (...args: unknown[]) => mocks.persistEventualitiesSnapshot(...args),
}));

vi.mock("@/lib/db/runReceiptsRepo", () => ({
  upsertRunReceipt: (...args: unknown[]) => mocks.upsertRunReceipt(...args),
}));

vi.mock("@/utils/logger", () => ({
  logger: {
    error: (...args: unknown[]) => mocks.loggerError(...args),
  },
}));

vi.mock("@core/pii/redact", () => ({
  maskUserId: (...args: unknown[]) => mocks.maskUserId(...args),
}));

vi.mock("@features/analyze/heuristics", () => ({
  buildHeuristicAnalyzeResult: (...args: unknown[]) => mocks.buildHeuristicAnalyzeResult(...args),
}));

vi.mock("@/features/create/matchService", () => ({
  resolveCreateGraphMatches: (...args: unknown[]) => mocks.resolveCreateGraphMatches(...args),
}));

vi.mock("@/lib/server/entitlements/createEntitlements", () => ({
  getCreateEntitlementsForRequest: (...args: unknown[]) =>
    mocks.getCreateEntitlementsForRequest(...args),
}));

import { POST as analyzePOST } from "@/app/api/contributions/analyze/route";

function req(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/contributions/analyze", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "127.0.0.1",
    },
    body: JSON.stringify(body),
  });
}

function buildAnalyzeResult() {
  return {
    mode: "E150",
    sourceText: null,
    language: "de",
    claims: [],
    notes: [{ id: "n1", kind: "FACTS", text: "Quelle fehlt" }],
    questions: [{ id: "q1", text: "Welche Quelle bestaetigt das?", dimension: "FACTS" }],
    missingPerspectives: [],
    findings: [],
    knots: [],
    consequences: { consequences: [], responsibilities: [] },
    responsibilityPaths: [],
    eventualities: [],
    decisionTrees: [],
    impactAndResponsibility: { impacts: [], responsibleActors: [] },
    participationCandidates: [],
    report: {
      summary: null,
      keyConflicts: [],
      facts: { local: [], international: [] },
      openQuestions: [],
      takeaways: [],
    },
    _meta: {
      provider: null,
      model: null,
      pipeline: "contribution_analyze",
      contributionId: "cid-1",
    },
  };
}

describe("/api/contributions/analyze entitlement gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANALYZE_ENABLED = "true";
    delete process.env.E150_PRESENTATION_PASS_DEFAULT;

    mocks.rateLimitOrThrow.mockResolvedValue({ ok: true, retryIn: 0 });
    mocks.deriveContextNotes.mockReturnValue([]);
    mocks.deriveCriticalQuestions.mockReturnValue([]);
    mocks.deriveKnots.mockReturnValue([]);
    mocks.persistEventualitiesSnapshot.mockResolvedValue(null);
    mocks.upsertRunReceipt.mockResolvedValue(undefined);
    mocks.maskUserId.mockImplementation((value: unknown) => String(value ?? ""));
    mocks.buildHeuristicAnalyzeResult.mockReturnValue(buildAnalyzeResult());
    mocks.resolveCreateGraphMatches.mockResolvedValue({
      matches: [
        {
          id: "no-match",
          matchType: "no_match",
          matchEntityType: "question",
          strength: "none",
          label: "Kein belastbarer Match",
          reason: "Kein belastbarer Match in produktiven Quellen gefunden.",
          reasons: ["Kein belastbarer Match in produktiven Quellen gefunden."],
          entityId: null,
          targetRef: null,
        },
      ],
      matchStrength: "none",
      matchType: "no_match",
      matchEntityType: "question",
      reasons: ["Kein belastbarer Match in produktiven Quellen gefunden."],
      suggestedCtas: [
        {
          id: "neu_anlegen",
          label: "Neu anlegen",
          reason: "Kein belastbarer Match. Ein neuer Strang ist der kanonische Einstieg.",
        },
      ],
      sourceState: "ok",
      sourceErrors: [],
    });
    mocks.getCreateEntitlementsForRequest.mockResolvedValue({
      isAuthenticated: true,
      canDeepResearch: true,
    });
  });

  it("uses gated deep-search fallback only when enabled and confirmed", async () => {
    process.env.E150_DEEPSEARCH_ENABLED = "true";
    process.env.E150_DEEPSEARCH_REQUIRE_CONFIRMATION = "true";
    mocks.analyzeContribution.mockResolvedValue(buildAnalyzeResult());

    try {
      const res = await analyzePOST(
        req({
          sourceUrls: ["https://www.youtube.com/watch?v=demo12345"],
          researchMode: "gpt_deepsearch",
          allowDeepSearch: true,
          researchConfirmed: true,
          locale: "de-DE",
        }),
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.researchUsed).toBe("deep_search");
      expect(body.meta?.researchProvider).toBe("openai_deep_research");
      expect(body.meta?.fallbackUsed).toBe(true);
    } finally {
      delete process.env.E150_DEEPSEARCH_ENABLED;
      delete process.env.E150_DEEPSEARCH_REQUIRE_CONFIRMATION;
    }
  });

  it("blocks deep-search when confirmation or entitlement is missing", async () => {
    process.env.E150_DEEPSEARCH_ENABLED = "true";
    process.env.E150_DEEPSEARCH_REQUIRE_CONFIRMATION = "true";
    mocks.getCreateEntitlementsForRequest.mockResolvedValueOnce({
      isAuthenticated: true,
      canDeepResearch: false,
    });

    try {
      const res = await analyzePOST(
        req({
          sourceUrls: ["https://www.youtube.com/watch?v=demo12345"],
          researchMode: "gpt_deepsearch",
          allowDeepSearch: true,
          researchConfirmed: false,
          locale: "de-DE",
        }),
      );

      expect(res.status).toBe(402);
      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.errorCode).toBe("RESEARCH_GATE_BLOCKED");
      expect(body.entitlementGate).toMatchObject({
        action: "deep_research",
        allowed: false,
        entitlementRequired: true,
        pricingRequired: true,
      });
      expect(body.meta).toMatchObject({
        noAutoDeepSearch: true,
        noAutoGraphPromotion: true,
      });
      expect(mocks.analyzeContribution).not.toHaveBeenCalled();
    } finally {
      delete process.env.E150_DEEPSEARCH_ENABLED;
      delete process.env.E150_DEEPSEARCH_REQUIRE_CONFIRMATION;
    }
  });
});
