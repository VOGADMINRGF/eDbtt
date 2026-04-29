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

const STRICT_ANALYZE_JSON = {
  ...VALID_ANALYZE_JSON,
  findings: [],
  missingPerspectives: [],
  participationCandidates: [],
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

  it("uses OPENAI_SMOKE_MODEL before OPENAI_MODEL in direct full contract", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    vi.stubEnv("OPENAI_SMOKE_MODEL", "gpt-4.1-mini");
    vi.stubEnv("OPENAI_MODEL", "gpt-5");
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

    const firstCallArgs = mocks.callOpenAI.mock.calls[0]?.[0] as { model?: string } | undefined;
    expect(firstCallArgs?.model).toBe("gpt-4.1-mini");

    const openaiDirect = body.directContractRows.find((row: any) => row.provider === "openai");
    expect(openaiDirect.selectedSmokeModel).toBe("gpt-4.1-mini");
    expect(openaiDirect.effectiveModel).toBe("gpt-4.1-mini");
    expect(openaiDirect.effectiveModel).not.toBe("gpt-5");
    expect(openaiDirect.openAiSmokeModelMismatch).toBe(false);

    vi.unstubAllEnvs();
  });

  it("flags OpenAI smoke model mismatch when effective model differs from OPENAI_SMOKE_MODEL", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    vi.stubEnv("OPENAI_SMOKE_MODEL", "gpt-4.1-mini");
    vi.stubEnv("OPENAI_MODEL", "gpt-5");
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
        meta: { model: "gpt-5" },
      }),
    );

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();
    const openaiDirect = body.directContractRows.find((row: any) => row.provider === "openai");

    expect(openaiDirect.selectedSmokeModel).toBe("gpt-4.1-mini");
    expect(openaiDirect.effectiveModel).toBe("gpt-5");
    expect(openaiDirect.openAiSmokeModelMismatch).toBe(true);
    expect(openaiDirect.nextAction).toBe("OPENAI_SMOKE_MODEL prüfen; Direct Contract sollte Smoke-Profil nutzen.");
    expect(openaiDirect.diagnosticNotes.join(" ")).toContain("OPENAI_SMOKE_MODEL mismatch");

    vi.unstubAllEnvs();
  });

  it("hardens full contract prompt with consequence scope enums and report.facts required arrays", async () => {
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
    expect(mocks.callOpenAI).toHaveBeenCalledTimes(1);

    const firstCallArgs = mocks.callOpenAI.mock.calls[0]?.[0] as { prompt?: string } | undefined;
    const prompt = String(firstCallArgs?.prompt ?? "");
    expect(prompt).toContain("Never return an array as the top-level value.");
    expect(prompt).toContain("Allowed scope: local_short, local_long, national, global, systemic.");
    expect(prompt).toContain("Never use \"local\" as scope.");
    expect(prompt).toContain("For short-term local effects use \"local_short\".");
    expect(prompt).toContain("For long-term local effects use \"local_long\".");
    expect(prompt).toContain("eventualities[].consequences[].scope");
    expect(prompt).toContain("decisionTrees.options.*.consequences[].scope");
    expect(prompt).toContain("report.facts.local must always be an array.");
    expect(prompt).toContain("report.facts.international must always be an array.");
    expect(prompt).toContain("If no local facts are available, return report.facts.local: [].");
    expect(prompt).toContain("If no international facts are available, return report.facts.international: [].");
    expect(prompt).toContain("Never omit report.facts.local or report.facts.international.");

    vi.unstubAllEnvs();
  });

  it("keeps Anthropic direct strict failed for TOP_LEVEL_ARRAY but marks built_valid when deterministic envelope succeeds", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-anthropic-key");
    mockFullOrchestrator(JSON.stringify(VALID_ANALYZE_JSON));
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });
    mocks.callAnthropic
      .mockResolvedValueOnce({
        text: JSON.stringify([{ id: "claim-1", text: "array-payload" }]),
        model: "claude-sonnet-4-20250514",
      })
      .mockResolvedValueOnce({
        text: JSON.stringify([{ id: "claim-1", text: "array-payload" }]),
        model: "claude-sonnet-4-20250514",
      });

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();
    const anthropicDirect = body.directContractRows.find((row: any) => row.provider === "anthropic");

    expect(anthropicDirect.strictStatus).toBe("failed");
    expect(anthropicDirect.directStrictStatus).toBe("failed");
    expect(anthropicDirect.strictProviderErrorCode).toBe("TOP_LEVEL_ARRAY");
    expect(anthropicDirect.draftStatus).toBe("ok");
    expect(anthropicDirect.envelopeBuildStatus).toBe("ok");
    expect(anthropicDirect.finalSchemaStatus).toBe("ok");
    expect(anthropicDirect.repairAttempted).toBe(false);
    expect(anthropicDirect.finalContractStatus).toBe("built_valid");
    expect(anthropicDirect.status).toBe("degraded");

    vi.unstubAllEnvs();
  });

  it("keeps Anthropic non-strict and uses built_valid path for full object drafts", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-anthropic-key");
    mockFullOrchestrator(JSON.stringify(VALID_ANALYZE_JSON));
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });
    mocks.callAnthropic.mockResolvedValue({
      text: JSON.stringify(STRICT_ANALYZE_JSON),
      model: "claude-sonnet-4-20250514",
    });

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();
    const anthropicDirect = body.directContractRows.find((row: any) => row.provider === "anthropic");

    expect(anthropicDirect.strictStatus).toBe("failed");
    expect(anthropicDirect.repairAttempted).toBe(false);
    expect(anthropicDirect.finalContractStatus).toBe("built_valid");

    vi.unstubAllEnvs();
  });

  it("keeps Mistral direct strict failed for TOP_LEVEL_ARRAY but marks built_valid when deterministic envelope succeeds", async () => {
    vi.stubEnv("MISTRAL_API_KEY", "test-mistral-key");
    mockFullOrchestrator(JSON.stringify(VALID_ANALYZE_JSON));
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });
    mocks.callMistral
      .mockResolvedValueOnce({
        text: JSON.stringify([{ id: "claim-1", text: "array-payload" }]),
        model: "mistral-large-latest",
      })
      .mockResolvedValueOnce({
        text: JSON.stringify([{ id: "claim-1", text: "array-payload" }]),
        model: "mistral-large-latest",
      });

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();
    const mistralDirect = body.directContractRows.find((row: any) => row.provider === "mistral");

    expect(mistralDirect.strictStatus).toBe("failed");
    expect(mistralDirect.directStrictStatus).toBe("failed");
    expect(mistralDirect.strictProviderErrorCode).toBe("TOP_LEVEL_ARRAY");
    expect(mistralDirect.draftStatus).toBe("ok");
    expect(mistralDirect.envelopeBuildStatus).toBe("ok");
    expect(mistralDirect.finalSchemaStatus).toBe("ok");
    expect(mistralDirect.repairAttempted).toBe(false);
    expect(mistralDirect.finalContractStatus).toBe("built_valid");
    expect(mistralDirect.status).toBe("degraded");

    vi.unstubAllEnvs();
  });

  it("keeps Mistral non-strict and uses built_valid path for full object drafts", async () => {
    vi.stubEnv("MISTRAL_API_KEY", "test-mistral-key");
    mockFullOrchestrator(JSON.stringify(VALID_ANALYZE_JSON));
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });
    mocks.callMistral.mockResolvedValue({
      text: JSON.stringify(STRICT_ANALYZE_JSON),
      model: "mistral-large-latest",
    });

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();
    const mistralDirect = body.directContractRows.find((row: any) => row.provider === "mistral");

    expect(mistralDirect.strictStatus).toBe("failed");
    expect(mistralDirect.repairAttempted).toBe(false);
    expect(mistralDirect.finalContractStatus).toBe("built_valid");

    vi.unstubAllEnvs();
  });

  it("keeps strict failed for BAD_JSON and marks repaired_degraded when repair succeeds", async () => {
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
        text: "{not-json",
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
    expect(openaiDirect.strictProviderErrorCode).toBe("BAD_JSON");
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
        text: "{not-json",
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

  it("fills missing report.facts.international with [] in deterministic envelope build and records warnings", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-anthropic-key");
    mockFullOrchestrator(JSON.stringify(VALID_ANALYZE_JSON));
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });
    mocks.callAnthropic.mockResolvedValue({
      text: JSON.stringify({
        mode: "E150",
        sourceText: null,
        language: "de",
        claims: [{ id: "claim-1", text: "Test claim" }],
        notes: [],
        questions: [],
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
          facts: { local: [] },
          openQuestions: [],
          takeaways: [],
        },
      }),
      model: "claude-sonnet-4-20250514",
    });

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();
    const anthropicDirect = body.directContractRows.find((row: any) => row.provider === "anthropic");

    expect(anthropicDirect.strictStatus).toBe("failed");
    expect(anthropicDirect.strictSchemaPath).toContain("report.facts.international");
    expect(anthropicDirect.finalContractStatus).toBe("built_valid");
    expect(anthropicDirect.filledDefaults).toContain("report.facts.international:[]");
    expect(anthropicDirect.buildWarnings.join(" ")).toContain("neutral summary fallback");
    expect(anthropicDirect.repairAttempted).toBe(false);

    vi.unstubAllEnvs();
  });

  it("does not accept local scope as direct strict and normalizes it for built envelope", async () => {
    vi.stubEnv("MISTRAL_API_KEY", "test-mistral-key");
    mockFullOrchestrator(JSON.stringify(VALID_ANALYZE_JSON));
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });
    mocks.callMistral.mockResolvedValue({
      text: JSON.stringify({
        mode: "E150",
        sourceText: null,
        language: "de",
        claims: [],
        notes: [],
        questions: [],
        knots: [],
        consequences: {
          consequences: [{ id: "c-1", scope: "local", statementIndex: 0, text: "Kurzfristig lokal" }],
          responsibilities: [],
        },
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
      }),
      model: "mistral-large-latest",
    });

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();
    const mistralDirect = body.directContractRows.find((row: any) => row.provider === "mistral");

    expect(mistralDirect.strictStatus).toBe("failed");
    expect(mistralDirect.strictSchemaPath).toContain("consequences.consequences.0.scope");
    expect(mistralDirect.finalContractStatus).toBe("built_valid");
    expect(mistralDirect.normalizedEnumWarnings.join(" ")).toContain("local -> local_short");
    expect(mistralDirect.repairAttempted).toBe(false);

    vi.unstubAllEnvs();
  });

  it("builds a full AnalyzeResult envelope with safe defaults from an empty draft object", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-anthropic-key");
    mockFullOrchestrator(JSON.stringify(VALID_ANALYZE_JSON));
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });
    mocks.callAnthropic.mockResolvedValue({
      text: JSON.stringify({}),
      model: "claude-sonnet-4-20250514",
    });

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();
    const anthropicDirect = body.directContractRows.find((row: any) => row.provider === "anthropic");

    expect(anthropicDirect.strictStatus).toBe("failed");
    expect(anthropicDirect.finalContractStatus).toBe("built_valid");
    expect(anthropicDirect.finalSchemaStatus).toBe("ok");
    expect(anthropicDirect.filledDefaults).toContain("report.facts.local:[]");
    expect(anthropicDirect.filledDefaults).toContain("report.facts.international:[]");
    expect(anthropicDirect.repairAttempted).toBe(false);

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

  it("selects OpenAI as strict_primary when direct contract is strict_ok", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    mockFullOrchestrator(JSON.stringify(VALID_ANALYZE_JSON));
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });
    mocks.callOpenAI.mockResolvedValue({
      text: JSON.stringify(STRICT_ANALYZE_JSON),
      model: "gpt-4.1-mini",
      formatUsed: "json_schema",
      didFallback: false,
    });

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.operationalSummary.selectedLane).toBe("standard_analyze");
    expect(body.operationalSummary.primaryAnalyzeProvider).toBe("openai");
    expect(body.operationalSummary.productionEligible).toBe(true);
    expect(body.operationalSummary.researchRequired).toBe(false);

    vi.unstubAllEnvs();
  });

  it("treats Anthropic built_valid as draft fallback and not strict primary", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "test-anthropic-key");
    mockFullOrchestrator(JSON.stringify(VALID_ANALYZE_JSON));
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });
    mocks.callAnthropic.mockResolvedValue({
      text: JSON.stringify([{ id: "claim-1", text: "array-payload" }]),
      model: "claude-sonnet-4-20250514",
    });

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.operationalSummary.primaryAnalyzeProvider).toBeNull();
    expect(body.operationalSummary.draftFallbackProviders).toContain("anthropic");
    expect(body.operationalSummary.productionEligible).toBe(true);
    expect(body.operationalSummary.optionalProviders).toContain("gemini");
    expect(body.operationalSummary.draftFallbackProviders).not.toContain("gemini");

    vi.unstubAllEnvs();
  });

  it("treats Mistral built_valid as draft fallback and not strict primary", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    vi.stubEnv("MISTRAL_API_KEY", "test-mistral-key");
    mockFullOrchestrator(JSON.stringify(VALID_ANALYZE_JSON));
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });
    mocks.callMistral.mockResolvedValue({
      text: JSON.stringify([{ id: "claim-1", text: "array-payload" }]),
      model: "mistral-large-latest",
    });

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.operationalSummary.primaryAnalyzeProvider).toBeNull();
    expect(body.operationalSummary.draftFallbackProviders).toContain("mistral");
    expect(body.operationalSummary.productionEligible).toBe(true);
    expect(body.operationalSummary.draftFallbackProviders).not.toContain("gemini");

    vi.unstubAllEnvs();
  });

  it("keeps research providers out of strict primary selection", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    mockFullOrchestrator(JSON.stringify(VALID_ANALYZE_JSON));
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });
    mocks.callOpenAI.mockResolvedValue({
      text: JSON.stringify(STRICT_ANALYZE_JSON),
      model: "gpt-4.1-mini",
      formatUsed: "json_schema",
      didFallback: false,
    });

    const response = await POST(req("?mode=full"));
    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.operationalSummary.researchProviders).toContain("perplexity");
    expect(body.operationalSummary.researchProviders).toContain("ari");
    expect(body.operationalSummary.primaryAnalyzeProvider).not.toBe("ari");
    expect(body.operationalSummary.primaryAnalyzeProvider).not.toBe("perplexity");

    vi.unstubAllEnvs();
  });

  it("marks sealed_factcheck not production-eligible without research provider/credit", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    vi.stubEnv("PERPLEXITY_DISABLED", "1");
    vi.stubEnv("PERPLEXITY_API_KEY", "");
    vi.stubEnv("SEARCH_CREDIT_AVAILABLE", "0");
    mockFullOrchestrator(JSON.stringify(VALID_ANALYZE_JSON));
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });
    mocks.callOpenAI.mockResolvedValue({
      text: JSON.stringify(STRICT_ANALYZE_JSON),
      model: "gpt-4.1-mini",
      formatUsed: "json_schema",
      didFallback: false,
    });

    const response = await POST(req("?mode=full&lane=sealed_factcheck"));
    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.operationalSummary.selectedLane).toBe("sealed_factcheck");
    expect(body.operationalSummary.researchRequired).toBe(true);
    expect(body.operationalSummary.productionEligible).toBe(false);
    expect(String(body.operationalSummary.nextAction)).toContain("Research");
    expect(body.operationalSummary.researchProviderAvailable).toBe(false);
    expect(body.operationalSummary.safeToRunStandardAnalyze).toBe(true);
    expect(body.operationalSummary.safeToRunSealedFactcheck).toBe(false);
    expect(body.operationalSummary.standardAnalyzeUnaffected).toBe(true);
    expect(body.operationalSummary.blockedResearchProviders.some((entry: any) => entry.provider === "perplexity")).toBe(true);

    vi.unstubAllEnvs();
  });

  it("keeps standard_analyze safe when all research providers are disabled", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    vi.stubEnv("PERPLEXITY_DISABLED", "1");
    vi.stubEnv("ARI_RESEARCH_ENABLED", "0");
    vi.stubEnv("OPENAI_DEEP_RESEARCH_ENABLED", "0");
    mockFullOrchestrator(JSON.stringify(VALID_ANALYZE_JSON));
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });
    mocks.callOpenAI.mockResolvedValue({
      text: JSON.stringify(STRICT_ANALYZE_JSON),
      model: "gpt-4.1-mini",
      formatUsed: "json_schema",
      didFallback: false,
    });

    const response = await POST(req("?mode=full&lane=standard_analyze"));
    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.operationalSummary.selectedLane).toBe("standard_analyze");
    expect(body.operationalSummary.researchRequired).toBe(false);
    expect(body.operationalSummary.standardAnalyzeUnaffected).toBe(true);
    expect(body.operationalSummary.safeToRunStandardAnalyze).toBe(true);
    expect(body.operationalSummary.productionEligible).toBe(true);
    expect(body.operationalSummary.researchProviderAvailable).toBe(false);
    expect(body.operationalSummary.selectedResearchProvider).toBeNull();
    expect(body.operationalSummary.blockedResearchProviders.some((entry: any) => entry.provider === "openai_deep_research")).toBe(true);

    vi.unstubAllEnvs();
  });

  it("marks Perplexity as config_missing when explicitly enabled without API key", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    vi.stubEnv("PERPLEXITY_DISABLED", "0");
    vi.stubEnv("PERPLEXITY_API_KEY", "");
    vi.stubEnv("PERPLEXITY_BASE_URL", "https://api.perplexity.ai");
    vi.stubEnv("SEARCH_CREDIT_AVAILABLE", "1");
    mockFullOrchestrator(JSON.stringify(VALID_ANALYZE_JSON));
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });
    mocks.callOpenAI.mockResolvedValue({
      text: JSON.stringify(STRICT_ANALYZE_JSON),
      model: "gpt-4.1-mini",
      formatUsed: "json_schema",
      didFallback: false,
    });

    const response = await POST(req("?mode=full&lane=sealed_factcheck"));
    expect(response.status).toBe(200);
    const body = await response.json();

    const perplexityBlocked = body.operationalSummary.blockedResearchProviders.find((entry: any) => entry.provider === "perplexity");
    expect(perplexityBlocked).toBeTruthy();
    expect(String(perplexityBlocked.reason)).toContain("missing_perplexity_api_key");

    vi.unstubAllEnvs();
  });

  it("enables premium lane with OpenAI deep research only when explicitly configured with credit", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-openai-key");
    vi.stubEnv("OPENAI_DEEP_RESEARCH_ENABLED", "1");
    vi.stubEnv("OPENAI_DEEP_RESEARCH_MODEL", "o4-deep-research-preview");
    vi.stubEnv("DEEP_RESEARCH_CREDIT_AVAILABLE", "1");
    vi.stubEnv("PERPLEXITY_DISABLED", "1");
    vi.stubEnv("ARI_RESEARCH_ENABLED", "0");
    mockFullOrchestrator(JSON.stringify(VALID_ANALYZE_JSON));
    mocks.analyzeContribution.mockResolvedValue({
      claims: [],
      notes: [],
      questions: [],
      knots: [],
    });
    mocks.callOpenAI.mockResolvedValue({
      text: JSON.stringify(STRICT_ANALYZE_JSON),
      model: "gpt-4.1-mini",
      formatUsed: "json_schema",
      didFallback: false,
    });

    const response = await POST(req("?mode=full&lane=premium_deep_research"));
    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.operationalSummary.selectedLane).toBe("premium_deep_research");
    expect(body.operationalSummary.researchRequired).toBe(true);
    expect(body.operationalSummary.researchCreditRequired).toBe(true);
    expect(body.operationalSummary.researchCreditSatisfied).toBe(true);
    expect(body.operationalSummary.selectedResearchProvider).toBe("openai_deep_research");
    expect(body.operationalSummary.safeToRunPremiumDeepResearch).toBe(true);
    expect(body.operationalSummary.primaryAnalyzeProvider).toBe("openai");

    vi.unstubAllEnvs();
  });
});
