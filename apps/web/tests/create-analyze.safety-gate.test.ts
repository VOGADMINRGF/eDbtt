import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { CREATE_SAFETY_ADVERSARIAL_FIXTURES } from "./fixtures/createSafetyAdversarialFixtures";

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
    const res = await POST(req(CREATE_SAFETY_ADVERSARIAL_FIXTURES.threat));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.errorCode).toBe("CREATE_INPUT_BLOCKED");
    expect(body.safety.decision).toBe("blocked");
    expect(body.safety.reviewItems.length).toBeGreaterThan(0);
    expect(mocks.analyzeContribution).not.toHaveBeenCalled();
  });

  it("returns moderation review envelope without running provider", async () => {
    const res = await POST(req(CREATE_SAFETY_ADVERSARIAL_FIXTURES.selfJustice));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.degraded).toBe(true);
    expect(body.safety.decision).toBe("moderation_required");
    expect(body.createAnalyze.safety.decision).toBe("moderation_required");
    expect(Array.isArray(body.createAnalyze.claimSafety)).toBe(true);
    expect(Array.isArray(body.meta.claimSafety)).toBe(true);
    expect(body.createAnalyze.noAutoPublish).toBe(true);
    expect(body.createAnalyze.noSilentMerge).toBe(true);
    expect(mocks.analyzeContribution).not.toHaveBeenCalled();
  });

  it("continues analyze for factcheck_required but attaches safety meta", async () => {
    const res = await POST(req(CREATE_SAFETY_ADVERSARIAL_FIXTURES.allegation));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.safety.decision).toBe("factcheck_required");
    expect(body.meta.safety.decision).toBe("factcheck_required");
    expect(body.createAnalyze.safety.decision).toBe("factcheck_required");
    expect(body.createAnalyze.claimSafety[0]?.claimId).toBe("c1");
    expect(body.meta.claimSafety[0]?.noAutoPublish).toBe(true);
    expect(mocks.analyzeContribution).toHaveBeenCalledTimes(1);
  });

  it("continues analyze for safe verification questions and keeps safety telemetry pii-free", async () => {
    const res = await POST(req(CREATE_SAFETY_ADVERSARIAL_FIXTURES.safeQuestionOnUnsafeClaim));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.safety.decision).toBe("allow");
    expect(body.safety.telemetry.routeStage).toBe("analyze");
    expect(body.safety.factCheckCandidates[0]?.truthStatus).toBe("open");
    expect(body.createAnalyze.claimSafety[0]?.publicationStatus).toBeTruthy();
    expect(JSON.stringify(body.safety.telemetry)).not.toContain("Investoren");
    expect(mocks.analyzeContribution).toHaveBeenCalledTimes(1);
  });

  it("continues analyze for editorial review requests but preserves the manual review signal", async () => {
    const res = await POST(req(CREATE_SAFETY_ADVERSARIAL_FIXTURES.editorialReviewRequested));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.safety.decision).toBe("editorial_review_required");
    expect(body.safety.qualityGate.editorialReviewRequested).toBe(true);
    expect(body.safety.reviewItems.some((item: any) => item.code === "editorial_review_requested")).toBe(true);
    expect(mocks.analyzeContribution).toHaveBeenCalledTimes(1);
  });
});
