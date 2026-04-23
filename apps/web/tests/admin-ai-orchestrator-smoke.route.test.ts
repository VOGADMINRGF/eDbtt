import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdminOrResponse: vi.fn(),
  callE150Orchestrator: vi.fn(),
  analyzeContribution: vi.fn(),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdminOrResponse(...args),
}));

vi.mock("@features/ai/orchestratorE150", () => ({
  callE150Orchestrator: (...args: unknown[]) => mocks.callE150Orchestrator(...args),
}));

vi.mock("@features/analyze/analyzeContribution", () => ({
  analyzeContribution: (...args: unknown[]) => mocks.analyzeContribution(...args),
}));

import { POST } from "@/app/api/admin/ai/orchestrator-smoke/route";

function req(query = "") {
  return new NextRequest(`http://localhost/api/admin/ai/orchestrator-smoke${query}`, {
    method: "POST",
  });
}

describe("/api/admin/ai/orchestrator-smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminOrResponse.mockResolvedValue({ userId: "admin-1" });
  });

  it("keeps provider matrix visibility on orchestrator errors without openai-only collapse", async () => {
    const error = Object.assign(new Error("orchestrator failed"), {
      meta: {
        providerMatrix: [
          {
            provider: "openai",
            state: "failed",
            durationMs: 123,
            reason: "timeout",
          },
          {
            provider: "anthropic",
            state: "disabled",
            durationMs: 0,
            reason: "disabled_by_env",
          },
          {
            provider: "mistral",
            state: "skipped",
            durationMs: 0,
            reason: "quota_guard",
          },
        ],
      },
    });
    mocks.callE150Orchestrator.mockRejectedValue(error);

    const response = await POST(req());
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.orchestratorOk).toBe(false);
    expect(Array.isArray(body.results)).toBe(true);
    expect(body.results).toHaveLength(3);
    expect(body.results.map((entry: any) => entry.providerId)).toEqual([
      "openai",
      "anthropic",
      "mistral",
    ]);
    expect(body.results.map((entry: any) => entry.state)).toEqual([
      "failed",
      "disabled",
      "skipped",
    ]);
    expect(body.results.map((entry: any) => entry.errorMessage)).toEqual([
      "timeout",
      "disabled_by_env",
      "quota_guard",
    ]);
    expect(body.createAnalyzeApi).toMatchObject({
      state: "skipped",
      reason: "full_mode_only",
    });
  });

  it("reports orchestrator and create-analyze statuses separately in full mode", async () => {
    mocks.callE150Orchestrator.mockResolvedValue({
      best: {
        provider: "openai",
        rawText: JSON.stringify({
          claims: [],
          notes: [],
          questions: [],
          knots: [],
        }),
      },
      candidates: [
        {
          provider: "openai",
          rawText: JSON.stringify({
            claims: [],
            notes: [],
            questions: [],
            knots: [],
          }),
        },
      ],
      meta: {
        providerMatrix: [
          {
            provider: "openai",
            state: "ok",
            durationMs: 210,
          },
          {
            provider: "gemini",
            state: "disabled",
            durationMs: 0,
            reason: "disabled_by_env",
          },
        ],
        probes: [],
      },
    });
    mocks.analyzeContribution.mockRejectedValue(
      Object.assign(new Error("BAD_JSON"), { code: "BAD_JSON" }),
    );

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.orchestratorOk).toBe(true);
    expect(body.createAnalyzeApi).toMatchObject({
      state: "failed",
      ok: false,
      code: "BAD_JSON",
    });
    expect(body.ok).toBe(false);
    expect(body.results.map((entry: any) => entry.providerId)).toEqual([
      "openai",
      "gemini",
    ]);
    expect(body.results.map((entry: any) => entry.state)).toEqual(["ok", "disabled"]);
  });
});
