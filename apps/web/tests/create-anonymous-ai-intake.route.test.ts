import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  buildCreateIntelligentFollowup: vi.fn(),
  evaluateCreateInputSafety: vi.fn(),
  rateLimitOrThrow: vi.fn(),
}));

vi.mock("@/features/create/intelligentFollowup", () => ({
  buildCreateIntelligentFollowup: (...args: unknown[]) =>
    mocks.buildCreateIntelligentFollowup(...args),
}));

vi.mock("@/features/create/safety/createInputSafety", () => ({
  evaluateCreateInputSafety: (...args: unknown[]) =>
    mocks.evaluateCreateInputSafety(...args),
}));

vi.mock("@/utils/rateLimitHelpers", () => ({
  rateLimitOrThrow: (...args: unknown[]) => mocks.rateLimitOrThrow(...args),
}));

import { POST } from "@/app/api/create/intake/route";

function request(body: Record<string, unknown>, ip = "203.0.113.15") {
  return new NextRequest("http://localhost/api/create/intake", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

function allowedSafety(overrides: Record<string, unknown> = {}) {
  return {
    decision: "allow",
    severity: "low",
    findings: [],
    quality: { readability: 0.8, structure: 0.8, civicIntent: 0.8, overall: 0.8, notes: [] },
    redactedText: "Tempo 30 vor der Schule in Wuppertal prüfen.",
    safeRewrite: "",
    factCheckCandidates: [],
    graphReviewHints: [],
    reviewItems: [],
    telemetry: {},
    requiresHumanReview: false,
    noAutoPublish: true,
    noSilentMerge: true,
    blockedReasons: [],
    nextActions: [],
    sourceLanguage: "de",
    contentLanguage: "de",
    crossLingualRisk: false,
    createdAt: "2026-09-04T08:00:00.000Z",
    ...overrides,
  };
}

describe("POST /api/create/intake", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimitOrThrow.mockResolvedValue({ ok: true });
    mocks.evaluateCreateInputSafety.mockReturnValue(allowedSafety());
    mocks.buildCreateIntelligentFollowup.mockResolvedValue({
      understanding: {
        summary: "Sicherer Schulweg und mögliche Geschwindigkeitsbegrenzung.",
        categories: [{ id: "demand", label: "Forderung", confidence: "high" }],
        topics: [{ id: "topic-1", label: "Schulwegsicherheit", confidence: "high" }],
        statements: [],
        scopes: ["municipal"],
        openQuestion: null,
        confidence: "high",
      },
      suggestions: [],
      sourceText: "Tempo 30 vor der Schule in Wuppertal prüfen.",
      generatedAt: "2026-09-04T08:00:00.000Z",
      degraded: false,
      degradedReason: null,
      meta: {
        analysis: { state: "result_ready" },
        citizenContext: { explicitPlaces: [{ label: "Wuppertal" }] },
      },
    });
  });

  it("runs the real canonical AI planner without requiring a user or draft", async () => {
    const response = await POST(request({
      text: "Tempo 30 vor der Schule in Wuppertal prüfen.",
      locale: "de",
      intent: "contribute",
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      ok: true,
      meta: {
        mode: "anonymous_ai_micro_pass",
        persisted: false,
        accountRequired: false,
        deepSearchUsed: false,
        researchUsed: "none",
        noAutoPublish: true,
        noSilentMerge: true,
        ownershipBoundary: "authenticate_before_durable_write",
      },
    });
    expect(mocks.buildCreateIntelligentFollowup).toHaveBeenCalledTimes(1);
    expect(mocks.buildCreateIntelligentFollowup).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: null,
        organizationId: null,
        dossierId: null,
        anlassraumId: null,
        operationType: "create_anonymous_ai_intake",
      }),
    );
  });

  it("redacts avoidable PII before the AI call while keeping the route read-only", async () => {
    mocks.evaluateCreateInputSafety.mockReturnValue(
      allowedSafety({
        decision: "revise_required",
        redactedText: "Bitte sichere Querung an [ADRESSE] prüfen.",
        requiresHumanReview: true,
        nextActions: ["Adresse entfernen"],
      }),
    );

    const response = await POST(request({
      text: "Bitte sichere Querung an Musterstraße 1 prüfen.",
      locale: "de",
    }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.meta.inputRedactedForAi).toBe(true);
    expect(mocks.buildCreateIntelligentFollowup).toHaveBeenCalledWith(
      expect.objectContaining({ text: "Bitte sichere Querung an [ADRESSE] prüfen." }),
    );
  });

  it("blocks unsafe intake before a provider call", async () => {
    mocks.evaluateCreateInputSafety.mockReturnValue(
      allowedSafety({
        decision: "blocked",
        severity: "critical",
        requiresHumanReview: true,
        nextActions: ["Sicher formulieren"],
      }),
    );

    const response = await POST(request({ text: "unsafe input" }));
    const body = await response.json();

    expect(response.status).toBe(422);
    expect(body).toMatchObject({
      ok: false,
      errorCode: "INTAKE_REVIEW_REQUIRED",
      safety: { decision: "blocked", severity: "critical" },
    });
    expect(mocks.buildCreateIntelligentFollowup).not.toHaveBeenCalled();
  });

  it("rate-limits anonymous AI use per IP before the provider call", async () => {
    mocks.rateLimitOrThrow.mockResolvedValue({ ok: false, retryIn: 30_000 });

    const response = await POST(request({ text: "Ein ausreichend konkretes öffentliches Anliegen." }));
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body.errorCode).toBe("RATE_LIMITED");
    expect(mocks.buildCreateIntelligentFollowup).not.toHaveBeenCalled();
  });

  it("fails honestly without heuristic topic invention when the AI planner is unavailable", async () => {
    mocks.buildCreateIntelligentFollowup.mockRejectedValue(new Error("provider raw secret detail"));

    const response = await POST(request({ text: "Ein neues Thema, das es so noch nicht gibt." }));
    const raw = await response.text();
    const body = JSON.parse(raw);

    expect(response.status).toBe(503);
    expect(body).toMatchObject({
      ok: false,
      errorCode: "AI_INTAKE_UNAVAILABLE",
      retryable: true,
      meta: {
        mode: "anonymous_ai_micro_pass",
        persisted: false,
        noAutoPublish: true,
        noSilentMerge: true,
      },
    });
    expect(raw).not.toContain("provider raw secret detail");
  });

  it("rejects empty and oversized inputs without spending an AI call", async () => {
    const empty = await POST(request({ text: "   " }));
    expect(empty.status).toBe(400);

    const oversized = await POST(request({ text: "x".repeat(6_001) }));
    expect(oversized.status).toBe(413);
    expect(mocks.buildCreateIntelligentFollowup).not.toHaveBeenCalled();
  });
});
