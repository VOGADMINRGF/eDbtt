import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireAdminOrResponse: vi.fn(),
  callE150Orchestrator: vi.fn(),
  analyzeContribution: vi.fn(),
  callOpenAI: vi.fn(),
  callAnthropic: vi.fn(),
  callMistral: vi.fn(),
  callGemini: vi.fn(),
  callAriLLM: vi.fn(),
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

vi.mock("@features/ai/providers/openai", () => ({
  callOpenAI: (...args: unknown[]) => mocks.callOpenAI(...args),
}));

vi.mock("@features/ai/providers/anthropic", () => ({
  callAnthropic: (...args: unknown[]) => mocks.callAnthropic(...args),
}));

vi.mock("@features/ai/providers/mistral", () => ({
  callMistral: (...args: unknown[]) => mocks.callMistral(...args),
}));

vi.mock("@features/ai/providers/gemini", () => ({
  callGemini: (...args: unknown[]) => mocks.callGemini(...args),
}));

vi.mock("@features/ai/providers/ari_llm", () => ({
  callAriLLM: (...args: unknown[]) => mocks.callAriLLM(...args),
}));

import { clearAdminAiRunsForTests } from "@/features/ai/adminTelemetryStore";
import { getProviderContractCapabilities } from "@/features/ai/adminTelemetryDiagnostics";
import { POST } from "@/app/api/admin/ai/orchestrator-smoke/route";

function req(query = "") {
  return new NextRequest(`http://localhost/api/admin/ai/orchestrator-smoke${query}`, {
    method: "POST",
  });
}

const VALID_ANALYZE_JSON = {
  mode: "E150",
  sourceText: null,
  language: "de",
  claims: [],
  notes: [],
  questions: [],
  knots: [],
  consequences: { consequences: [], responsibilities: [] },
  responsibilityPaths: [],
  decisionTrees: [],
  eventualities: [],
  impactAndResponsibility: { impacts: [], responsibleActors: [] },
  report: {
    summary: null,
    keyConflicts: [],
    facts: { local: [], international: [] },
    openQuestions: [],
    takeaways: [],
  },
};

function mockFullOrchestrator(rawText: string) {
  mocks.callE150Orchestrator.mockResolvedValue({
    best: { provider: "openai", rawText },
    candidates: [{ provider: "openai", rawText }],
    meta: {
      providerMatrix: [{ provider: "openai", state: "ok", durationMs: 111 }],
      probes: [{ provider: "openai", ok: true, errorKind: null, durationMs: 80 }],
    },
  });
}

describe("/api/admin/ai/orchestrator-smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAdminAiRunsForTests();
    mocks.requireAdminOrResponse.mockResolvedValue({ userId: "admin-1" });
  });

  it("keeps provider matrix visibility on runtime errors", async () => {
    const error = Object.assign(new Error("orchestrator failed"), {
      meta: {
        providerMatrix: [
          {
            provider: "openai",
            state: "failed",
            durationMs: 123,
            reason: "timeout",
            errorKind: "TIMEOUT",
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
    expect(body.mode).toBe("runtime_smoke");
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
    expect(body.rows[0]).toMatchObject({
      provider: "openai",
      mode: "runtime_smoke",
      errorKind: "TIMEOUT",
      rootCause: "TIMEOUT",
    });
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
          mode: "E150",
          language: "de",
          claims: [],
          notes: [],
          questions: [],
          knots: [],
          consequences: { consequences: [], responsibilities: [] },
          responsibilityPaths: [],
          decisionTrees: [],
          eventualities: [],
          impactAndResponsibility: { impacts: [], responsibleActors: [] },
          report: { summary: null, keyConflicts: [], facts: { local: [], international: [] }, openQuestions: [], takeaways: [] },
        }),
      },
      candidates: [
        {
          provider: "openai",
          rawText: JSON.stringify({
            mode: "E150",
            language: "de",
            claims: [],
            notes: [],
            questions: [],
            knots: [],
            consequences: { consequences: [], responsibilities: [] },
            responsibilityPaths: [],
            decisionTrees: [],
            eventualities: [],
            impactAndResponsibility: { impacts: [], responsibleActors: [] },
            report: { summary: null, keyConflicts: [], facts: { local: [], international: [] }, openQuestions: [], takeaways: [] },
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
    expect(body.mode).toBe("full_contract");
    expect(body.orchestratorOk).toBe(false);
    expect(body.createAnalyzeApi).toMatchObject({
      state: "failed",
      ok: false,
      code: "BAD_JSON",
    });
    expect(body.ok).toBe(false);
    expect(body.rows.map((entry: any) => entry.provider)).toEqual(["openai", "gemini"]);
  });

  it("includes ARI in provider_probe mode with config_missing when env is not complete", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    vi.stubEnv("MISTRAL_API_KEY", "");
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("GOOGLE_API_KEY", "");
    vi.stubEnv("ARI_BASE_URL", "");
    vi.stubEnv("ARI_API_KEY", "");
    vi.stubEnv("YOUCOM_ARI_API_URL", "");
    vi.stubEnv("YOUCOM_ARI_API_KEY", "");

    const response = await POST(req("?mode=probe"));
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.mode).toBe("provider_probe");
    const ari = body.rows.find((row: any) => row.provider === "ari");
    expect(ari).toBeTruthy();
    expect(ari.status).toBe("config_missing");
    expect(ari.journeyDecision).toBe("config_missing");
    expect(ari.reason).toContain("missing ARI_BASE_URL / ARI_API_KEY");

    vi.unstubAllEnvs();
  });

  it("classifies full-contract BAD_JSON as parse failure while provider remains reachable", async () => {
    const error = Object.assign(new Error("full smoke failed"), {
      meta: {
        providerMatrix: [
          {
            provider: "openai",
            state: "failed",
            errorKind: "BAD_JSON",
            errorMessage: "Unexpected token < in JSON",
            reason: "Unexpected token < in JSON",
          },
        ],
        probes: [
          {
            provider: "openai",
            ok: true,
            errorKind: null,
            durationMs: 88,
          },
        ],
      },
    });
    mocks.callE150Orchestrator.mockRejectedValue(error);
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();

    const openai = body.rows.find((row: any) => row.provider === "openai");
    expect(openai.status).toBe("failed");
    expect(openai.providerStatus).toBe("reachable");
    expect(openai.parseStatus).toBe("failed");
    expect(openai.schemaStatus).toBe("not_started");
    expect(openai.errorKind).toBe("BAD_JSON");
    expect(openai.nextAction).toContain("Analyze-/JSON-Contract");
  });

  it("accepts fenced JSON in full contract mode when schema-valid", async () => {
    mockFullOrchestrator(`\`\`\`json\n${JSON.stringify(VALID_ANALYZE_JSON)}\n\`\`\``);
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();

    const openai = body.rows.find((row: any) => row.provider === "openai");
    expect(openai.status).toBe("ok");
    expect(openai.parseStatus).toBe("ok");
    expect(openai.schemaStatus).toBe("ok");
  });

  it("accepts prose plus clearly bounded JSON object in full contract mode", async () => {
    mockFullOrchestrator(`Analyse folgt:\n${JSON.stringify(VALID_ANALYZE_JSON)}\nEnde.`);
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();
    const openai = body.rows.find((row: any) => row.provider === "openai");
    expect(openai.status).toBe("ok");
    expect(openai.parseStatus).toBe("ok");
  });

  it("reports BAD_JSON with parseError and rawExcerpt for malformed JSON", async () => {
    mockFullOrchestrator("```json\n{\"mode\":\"E150\", bad}\n```");
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();
    const openai = body.rows.find((row: any) => row.provider === "openai");

    expect(openai.status).toBe("failed");
    expect(openai.errorKind).toBe("BAD_JSON");
    expect(openai.providerErrorCode).toBe("BAD_JSON");
    expect(openai.parseError).toBeTruthy();
    expect(openai.rawExcerpt).toBeTruthy();
  });

  it("reports SCHEMA_INVALID with schemaPath for valid JSON missing required fields", async () => {
    const { notes: _ignored, ...missingNotes } = VALID_ANALYZE_JSON;
    mockFullOrchestrator(JSON.stringify(missingNotes));
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();
    const openai = body.rows.find((row: any) => row.provider === "openai");

    expect(openai.status).toBe("failed");
    expect(openai.providerErrorCode).toBe("SCHEMA_INVALID");
    expect(openai.schemaStatus).toBe("failed");
    expect(openai.schemaPath).toContain("notes");
    expect(openai.errorKind).toBe("INTERNAL");
  });

  it("exposes stable provider capability mapping", () => {
    const openai = getProviderContractCapabilities("openai");
    expect(openai.nativeStrategy).toBe("openai_responses_json_schema");
    expect(openai.preferredContractStrategy).toBe("json_schema");
    expect(openai.fallbackStrategy).toBe("json_object_envelope");
    expect(openai.supportsStrictJsonSchema).toBe(true);

    const anthropic = getProviderContractCapabilities("anthropic");
    expect(anthropic.preferredContractStrategy).toBe("prompt_envelope");
    expect(anthropic.supportsStrictJsonSchema).toBe(false);
    expect(anthropic.supportsJsonObjectMode).toBe("prompt_only");

    const mistral = getProviderContractCapabilities("mistral");
    expect(mistral.nativeStrategy).toBe("mistral_response_format_json_object");
    expect(mistral.preferredContractStrategy).toBe("json_object_envelope");
    expect(mistral.supportsStrictJsonSchema).toBe(false);

    const gemini = getProviderContractCapabilities("gemini");
    expect(gemini.nonRepairableErrorCodes).toContain("UNAVAILABLE");

    const ari = getProviderContractCapabilities("ari");
    expect(ari.canBeUsedAsRepairProvider).toBe(false);
    expect(ari.nonRepairableErrorCodes).toContain("PAYMENT_REQUIRED");
  });

  it("passes OpenAI formatUsed/didFallback metadata to direct diagnostics", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    vi.stubEnv("OPENAI_SMOKE_MODEL", "gpt-4.1");
    vi.stubEnv("OPENAI_SMOKE_TIMEOUT_MS", "17000");
    vi.stubEnv("OPENAI_SMOKE_MAX_OUTPUT_TOKENS", "1337");
    mockFullOrchestrator(JSON.stringify(VALID_ANALYZE_JSON));
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });
    mocks.callOpenAI.mockResolvedValue({
      text: JSON.stringify(VALID_ANALYZE_JSON),
      model: "gpt-4.1-mini",
      formatUsed: "json_object",
      didFallback: true,
      openaiErrorCode: "json_schema_not_supported",
      openaiErrorMessage: "schema fallback",
    });

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();

    const openaiDirect = body.directContractRows.find((row: any) => row.provider === "openai");
    expect(openaiDirect.formatUsed).toBe("json_object");
    expect(openaiDirect.didFallback).toBe(true);
    expect(openaiDirect.openaiErrorCode).toBe("json_schema_not_supported");
    expect(openaiDirect.openaiErrorMessage).toBe("schema fallback");
    expect(openaiDirect.timeoutMs).toBe(17000);
    expect(openaiDirect.maxOutputTokens).toBe(1337);
    expect(openaiDirect.finalContractStatus).toBe("strict_ok");
    expect(Array.isArray(openaiDirect.diagnosticNotes)).toBe(true);
    expect(openaiDirect.diagnosticNotes.join(" ")).toContain("fallback");
    expect(openaiDirect.diagnosticNotes.join(" ")).toContain("OPENAI_SMOKE_MODEL");
    expect(openaiDirect.diagnosticNotes.join(" ")).toContain("OPENAI_SMOKE_TIMEOUT_MS");
    expect(openaiDirect.diagnosticNotes.join(" ")).toContain("OPENAI_SMOKE_MAX_OUTPUT_TOKENS");

    vi.unstubAllEnvs();
  });

  it("marks OpenAI strict json_schema success as final strict_ok without repair", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    mockFullOrchestrator(JSON.stringify(VALID_ANALYZE_JSON));
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });
    mocks.callOpenAI.mockResolvedValue({
      text: JSON.stringify(VALID_ANALYZE_JSON),
      model: "gpt-4.1-mini",
      formatUsed: "json_schema",
      didFallback: false,
    });

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();

    const openaiDirect = body.directContractRows.find((row: any) => row.provider === "openai");
    expect(openaiDirect.strictStatus).toBe("ok");
    expect(openaiDirect.repairAttempted).toBe(false);
    expect(openaiDirect.repairStatus).toBe("not_attempted");
    expect(openaiDirect.formatUsed).toBe("json_schema");
    expect(openaiDirect.didFallback).toBe(false);
    expect(openaiDirect.finalContractStatus).toBe("strict_ok");

    vi.unstubAllEnvs();
  });

  it("keeps strict failed for TOP_LEVEL_ARRAY and marks repaired_degraded when repair succeeds", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    mockFullOrchestrator(JSON.stringify(VALID_ANALYZE_JSON));
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });
    mocks.callOpenAI
      .mockResolvedValueOnce({
        text: JSON.stringify([{ id: "claim-1", text: "foo" }]),
        model: "gpt-4.1-mini",
        tokensIn: 12,
        tokensOut: 40,
      })
      .mockResolvedValueOnce({
        text: JSON.stringify(VALID_ANALYZE_JSON),
        model: "gpt-4.1-mini",
        tokensIn: 20,
        tokensOut: 120,
      });

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();

    const openaiDirect = body.directContractRows.find((row: any) => row.provider === "openai");
    expect(openaiDirect).toBeTruthy();
    expect(openaiDirect.strictStatus).toBe("failed");
    expect(openaiDirect.strictProviderErrorCode).toBe("TOP_LEVEL_ARRAY");
    expect(openaiDirect.repairAttempted).toBe(true);
    expect(openaiDirect.repairStatus).toBe("ok");
    expect(openaiDirect.finalContractStatus).toBe("repaired_degraded");
    expect(openaiDirect.status).toBe("degraded");

    vi.unstubAllEnvs();
  });

  it("keeps final contract failed when repair fails", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    mockFullOrchestrator(JSON.stringify(VALID_ANALYZE_JSON));
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });
    mocks.callOpenAI
      .mockResolvedValueOnce({
        text: JSON.stringify([{ id: "claim-1", text: "foo" }]),
        model: "gpt-4.1-mini",
      })
      .mockResolvedValueOnce({
        text: "not-json-after-repair",
        model: "gpt-4.1-mini",
      });

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();

    const openaiDirect = body.directContractRows.find((row: any) => row.provider === "openai");
    expect(openaiDirect.strictStatus).toBe("failed");
    expect(openaiDirect.repairAttempted).toBe(true);
    expect(openaiDirect.repairStatus).toBe("failed");
    expect(openaiDirect.finalContractStatus).toBe("failed");

    vi.unstubAllEnvs();
  });

  it("does not attempt repair for Gemini 429 and reports blocked contract status", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-gemini-key");
    mockFullOrchestrator(JSON.stringify(VALID_ANALYZE_JSON));
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });
    mocks.callGemini.mockRejectedValue(
      Object.assign(new Error("Gemini error 429: RESOURCE_EXHAUSTED"), {
        status: 429,
        code: "RESOURCE_EXHAUSTED",
      }),
    );

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();

    const geminiDirect = body.directContractRows.find((row: any) => row.provider === "gemini");
    expect(geminiDirect.repairAttempted).toBe(false);
    expect(geminiDirect.finalContractStatus).toBe("blocked");
    expect(geminiDirect.strictStatus).toBe("blocked");

    vi.unstubAllEnvs();
  });

  it("does not attempt repair for Gemini 503 UNAVAILABLE and reports blocked", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-gemini-key");
    mockFullOrchestrator(JSON.stringify(VALID_ANALYZE_JSON));
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });
    mocks.callGemini.mockRejectedValue(
      Object.assign(new Error("Gemini error 503: UNAVAILABLE"), {
        status: 503,
        code: "UNAVAILABLE",
      }),
    );

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();

    const geminiDirect = body.directContractRows.find((row: any) => row.provider === "gemini");
    expect(geminiDirect.strictProviderErrorCode).toBe("UNAVAILABLE");
    expect(geminiDirect.repairAttempted).toBe(false);
    expect(geminiDirect.finalContractStatus).toBe("blocked");
    expect(geminiDirect.strictStatus).toBe("blocked");

    vi.unstubAllEnvs();
  });

  it("does not attempt repair for ARI 402 and reports blocked contract status", async () => {
    vi.stubEnv("ARI_BASE_URL", "https://ari.example");
    vi.stubEnv("ARI_API_KEY", "test-ari-key");
    mockFullOrchestrator(JSON.stringify(VALID_ANALYZE_JSON));
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });
    mocks.callAriLLM.mockRejectedValue(
      Object.assign(new Error("ARI request failed: 402 Payment Required"), {
        status: 402,
        code: "PAYMENT_REQUIRED",
      }),
    );

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();

    const ariDirect = body.directContractRows.find((row: any) => row.provider === "ari");
    expect(ariDirect.repairAttempted).toBe(false);
    expect(ariDirect.finalContractStatus).toBe("blocked");
    expect(ariDirect.strictStatus).toBe("blocked");

    vi.unstubAllEnvs();
  });

  it("keeps OpenAI TIMEOUT non-repairable and blocked", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    mockFullOrchestrator(JSON.stringify(VALID_ANALYZE_JSON));
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });
    mocks.callOpenAI.mockRejectedValue(
      Object.assign(new Error("request timeout after 30s"), {
        status: 504,
      }),
    );

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();

    const openaiDirect = body.directContractRows.find((row: any) => row.provider === "openai");
    expect(openaiDirect.strictProviderErrorCode).toBe("TIMEOUT");
    expect(openaiDirect.repairAttempted).toBe(false);
    expect(openaiDirect.finalContractStatus).toBe("blocked");
    expect(openaiDirect.strictStatus).toBe("blocked");
    expect(mocks.callOpenAI).toHaveBeenCalledTimes(1);

    vi.unstubAllEnvs();
  });
});
