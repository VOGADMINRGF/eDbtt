import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  analyzeContribution: vi.fn(),
  rateLimitOrThrow: vi.fn(),
  deriveContextNotes: vi.fn(),
  deriveCriticalQuestions: vi.fn(),
  deriveKnots: vi.fn(),
  syncAnalyzeResultToGraph: vi.fn(),
  persistEventualitiesSnapshot: vi.fn(),
  upsertRunReceipt: vi.fn(),
  resolveCreateGraphMatches: vi.fn(),
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
vi.mock("@core/graph", () => ({
  syncAnalyzeResultToGraph: (...args: unknown[]) => mocks.syncAnalyzeResultToGraph(...args),
}));
vi.mock("@core/eventualities", () => ({
  persistEventualitiesSnapshot: (...args: unknown[]) => mocks.persistEventualitiesSnapshot(...args),
}));
vi.mock("@/lib/db/runReceiptsRepo", () => ({
  upsertRunReceipt: (...args: unknown[]) => mocks.upsertRunReceipt(...args),
}));
vi.mock("@/features/create/matchService", () => ({
  resolveCreateGraphMatches: (...args: unknown[]) => mocks.resolveCreateGraphMatches(...args),
}));

import { POST } from "@/app/api/contributions/analyze/route";

function req(text: string) {
  return new NextRequest("http://localhost/api/contributions/analyze", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "127.0.0.1",
    },
    body: JSON.stringify({ text, locale: "de" }),
  });
}

function analyzeFixture() {
  return {
    mode: "E150",
    sourceText: null,
    language: "de",
    claims: [{ id: "c1", text: "Prüfbarer Claim", stance: "pro", topic: "Wohnen", domain: "politik" }],
    notes: [{ id: "n1", kind: "FACTS", text: "Quelle prüfen" }],
    questions: [],
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
      summary: "Summary",
      keyConflicts: [],
      facts: { local: [], international: [] },
      openQuestions: [],
      takeaways: [],
    },
    _meta: {},
  };
}

describe("create analyze safety gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANALYZE_ENABLED = "true";
    mocks.rateLimitOrThrow.mockResolvedValue({ ok: true, retryIn: 0 });
    mocks.deriveContextNotes.mockReturnValue([]);
    mocks.deriveCriticalQuestions.mockReturnValue([]);
    mocks.deriveKnots.mockReturnValue([]);
    mocks.syncAnalyzeResultToGraph.mockResolvedValue(undefined);
    mocks.persistEventualitiesSnapshot.mockResolvedValue(null);
    mocks.upsertRunReceipt.mockResolvedValue(undefined);
    mocks.resolveCreateGraphMatches.mockResolvedValue({
      matches: [],
      matchStrength: "none",
      reasons: [],
      suggestedCtas: [],
      sourceState: "ok",
      sourceErrors: [],
    });
    mocks.analyzeContribution.mockResolvedValue(analyzeFixture());
  });

  it("blocks concrete violence before analyze", async () => {
    const res = await POST(req("Ich bringe dich um."));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.errorCode).toBe("CREATE_INPUT_BLOCKED");
    expect(body.safety.decision).toBe("blocked");
    expect(mocks.analyzeContribution).not.toHaveBeenCalled();
  });

  it("returns moderation review envelope without running provider", async () => {
    const res = await POST(req("Wenn nichts passiert, machen wir Selbstjustiz."));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.degraded).toBe(true);
    expect(body.safety.decision).toBe("moderation_required");
    expect(body.createAnalyze.safety.decision).toBe("moderation_required");
    expect(body.createAnalyze.noAutoPublish).toBe(true);
    expect(body.createAnalyze.noSilentMerge).toBe(true);
    expect(mocks.analyzeContribution).not.toHaveBeenCalled();
  });

  it("continues analyze for factcheck_required but attaches safety meta", async () => {
    const res = await POST(req("Die Presse schreibt nur für Investoren, das kostet 40 Millionen."));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.safety.decision).toBe("factcheck_required");
    expect(body.meta.safety.decision).toBe("factcheck_required");
    expect(body.createAnalyze.safety.decision).toBe("factcheck_required");
    expect(mocks.analyzeContribution).toHaveBeenCalledTimes(1);
  });
});
