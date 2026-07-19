import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  callOpenAI: vi.fn(),
}));

vi.mock("@features/ai/providers/openai", () => ({
  callOpenAI: (...args: unknown[]) => mocks.callOpenAI(...args),
}));
vi.mock("@features/ai/providers/anthropic", () => ({ callAnthropic: vi.fn() }));
vi.mock("@features/ai/providers/mistral", () => ({ callMistral: vi.fn() }));
vi.mock("@features/ai/providers/gemini", () => ({ callGemini: vi.fn() }));

import { runDirectProbeDiagnostic } from "@/features/ai/providerSmokeDirectRunner";

describe("OpenAI operator smoke model fallback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("OPENAI_SMOKE_MODEL", "gpt-4.1-mini");
    vi.stubEnv("OPENAI_MODEL", "gpt-5");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("falls back to OPENAI_MODEL only for MODEL_NOT_FOUND and exposes the effective model", async () => {
    mocks.callOpenAI
      .mockRejectedValueOnce(
        Object.assign(new Error("404 model gpt-4.1-mini not found"), {
          status: 404,
          meta: { code: "MODEL_NOT_FOUND", model: "gpt-4.1-mini" },
        }),
      )
      .mockResolvedValueOnce({
        text: JSON.stringify({ ok: true, ping: "pong", provider: "openai" }),
        model: "gpt-5",
        formatUsed: "json_object",
        didFallback: false,
      });

    const row = await runDirectProbeDiagnostic("openai");

    expect(mocks.callOpenAI).toHaveBeenCalledTimes(2);
    expect(mocks.callOpenAI.mock.calls[0]?.[0]).toMatchObject({ model: "gpt-4.1-mini" });
    expect(mocks.callOpenAI.mock.calls[1]?.[0]).toMatchObject({ model: "gpt-5" });
    expect(row).toMatchObject({
      status: "ok",
      selectedSmokeModel: "gpt-4.1-mini",
      effectiveModel: "gpt-5",
      openAiSmokeModelMismatch: true,
    });
  });

  it("does not hide authentication errors behind a model fallback", async () => {
    mocks.callOpenAI.mockRejectedValue(
      Object.assign(new Error("OpenAI error 401: unauthorized"), {
        status: 401,
        meta: { code: "UNAUTHORIZED" },
      }),
    );

    const row = await runDirectProbeDiagnostic("openai");

    expect(mocks.callOpenAI).toHaveBeenCalledTimes(1);
    expect(row.status).toBe("failed");
    expect(row.providerErrorCode).toBe("UNAUTHORIZED");
  });
});
