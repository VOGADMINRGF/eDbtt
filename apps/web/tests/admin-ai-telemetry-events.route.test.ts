import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdminOrResponse: vi.fn(),
  recentEvents: vi.fn(),
  summarizeTelemetry: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdminOrResponse(...args),
}));

vi.mock("@features/ai/telemetry", () => ({
  recentEvents: (...args: unknown[]) => mocks.recentEvents(...args),
  summarizeTelemetry: (...args: unknown[]) => mocks.summarizeTelemetry(...args),
}));

import { recordAdminAiRun, clearAdminAiRunsForTests } from "@/features/ai/adminTelemetryStore";
import { GET } from "@/app/api/admin/telemetry/ai/events/route";

function req() {
  return new NextRequest("http://localhost/api/admin/telemetry/ai/events", { method: "GET" });
}

describe("/api/admin/telemetry/ai/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAdminAiRunsForTests();
    mocks.requireAdminOrResponse.mockResolvedValue({ userId: "admin-1" });
    mocks.recentEvents.mockReturnValue([]);
    mocks.summarizeTelemetry.mockReturnValue({ totals: { calls: 0, successRate: 0, avgDurationMs: 0, fallbackRate: 0 }, perProvider: [] });
  });

  it("groups related provider rows by runId and keeps diagnostics in child rows", async () => {
    recordAdminAiRun({
      runId: "run-1",
      correlationId: "run-1",
      mode: "full_contract",
      startedAt: 100,
      finishedAt: 240,
      ok: false,
      bestProviderId: null,
      rows: [
        {
          provider: "openai",
          displayName: "GPT / OpenAI",
          model: "gpt-4.1-mini",
          pipeline: "orchestrator_smoke",
          mode: "full_contract",
          stage: "analyze_contract",
          status: "failed",
          errorKind: "BAD_JSON",
          providerErrorCode: "BAD_JSON",
          httpStatus: 200,
          errorMessage: "Unexpected token",
          reason: "Unexpected token",
          validationMode: "analyze_schema",
          providerStatus: "reachable",
          adapterStatus: "failed",
          parseStatus: "failed",
          schemaStatus: "not_started",
          parseError: "Unexpected token",
          schemaError: null,
          schemaPath: null,
          rawExcerpt: "<html>",
          durationMs: 120,
          tokensIn: 10,
          tokensOut: 0,
          fallbackUsed: false,
          fallbackReason: null,
          journeyDecision: "selected",
          rootCause: "BAD_JSON",
          nextAction: "Provider erreichbar; Analyze-/JSON-Contract pruefen.",
        },
      ],
    });

    const response = await GET(req());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.runs)).toBe(true);
    expect(body.runs).toHaveLength(1);
    expect(body.runs[0]).toMatchObject({
      runId: "run-1",
      mode: "full_contract",
      rootCause: "BAD_JSON",
    });
    expect(body.runs[0].providers).toHaveLength(1);
    expect(body.runs[0].providers[0]).toMatchObject({
      provider: "openai",
      errorKind: "BAD_JSON",
      providerErrorCode: "BAD_JSON",
      rawExcerpt: "<html>",
    });
  });
});
