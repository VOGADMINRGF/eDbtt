import { mkdtemp, readFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProviderDiagnostic } from "@/features/ai/adminTelemetryDiagnostics";
import {
  evaluateProviderSmokeRows,
  formatProviderSmokeSummary,
  parseProviderSmokeCliArgs,
  runProviderSmokeCli,
  redactSecretsInText,
  redactSecretsInValue,
  writeProviderSmokeJsonLog,
} from "@/features/ai/providerSmokeCli";
import { estimateAiRunCost } from "@/features/ai/aiCostTelemetry";
import {
  OPTIONAL_RESEARCH_PROVIDER_POLICIES,
  RESEARCH_ENTITLEMENT_KEYS,
} from "@/features/ai/researchProviderPolicy";
import { buildResearchProviderRegistry } from "@/features/ai/researchProviderRegistry";

const providerMocks = vi.hoisted(() => ({
  callOpenAI: vi.fn(),
  callAnthropic: vi.fn(),
  callMistral: vi.fn(),
  callGemini: vi.fn(),
}));

vi.mock("@features/ai/providers/openai", () => ({
  callOpenAI: (...args: unknown[]) => providerMocks.callOpenAI(...args),
}));

vi.mock("@features/ai/providers/anthropic", () => ({
  callAnthropic: (...args: unknown[]) => providerMocks.callAnthropic(...args),
}));

vi.mock("@features/ai/providers/mistral", () => ({
  callMistral: (...args: unknown[]) => providerMocks.callMistral(...args),
}));

vi.mock("@features/ai/providers/gemini", () => ({
  callGemini: (...args: unknown[]) => providerMocks.callGemini(...args),
}));

function buildRow(overrides: Partial<ProviderDiagnostic> = {}): ProviderDiagnostic {
  return {
    provider: "openai",
    displayName: "GPT / OpenAI",
    model: "gpt-4.1-mini",
    pipeline: "provider_probe",
    mode: "full_contract",
    stage: "analyze_contract",
    status: "ok",
    errorKind: null,
    providerErrorCode: null,
    httpStatus: 200,
    errorMessage: null,
    reason: null,
    validationMode: "analyze_schema",
    providerStatus: "reachable",
    adapterStatus: "ok",
    parseStatus: "ok",
    schemaStatus: "ok",
    parseError: null,
    schemaError: null,
    schemaPath: null,
    rawExcerpt: null,
    durationMs: 100,
    tokensIn: 10,
    tokensOut: 20,
    estimatedCostUsd: 0.000036,
    estimatedCostEur: 0.00003312,
    costKnown: true,
    pricingSource: "internal_smoke_estimate_2026-04-29",
    costReason: null,
    runCostGroup: "full",
    smokeMode: "full",
    budgetProfile: "full_default",
    fallbackUsed: null,
    fallbackReason: null,
    journeyDecision: "selected",
    strictStatus: "ok",
    strictProviderErrorCode: null,
    strictSchemaPath: null,
    repairAttempted: false,
    repairStatus: "not_attempted",
    repairProviderErrorCode: null,
    repairSchemaPath: null,
    repairReason: null,
    repairUsed: false,
    directStrictStatus: "ok",
    draftStatus: "not_attempted",
    envelopeBuildStatus: "not_attempted",
    finalSchemaStatus: "ok",
    finalContractStatus: "strict_ok",
    buildWarnings: [],
    filledDefaults: [],
    missingContainers: [],
    normalizedEnumWarnings: [],
    generatedIds: [],
    nativeStrategy: "openai_responses_json_schema",
    preferredContractStrategy: "json_schema",
    providerStrategy: "json_schema",
    fallbackStrategy: "json_object_envelope",
    supportsStrictJsonSchema: true,
    supportsJsonObjectMode: true,
    supportsPromptEnvelope: true,
    supportsRepairAttempt: true,
    canBeUsedAsRepairProvider: true,
    knownBlockers: [],
    nonRepairableErrorCodes: [],
    diagnosticNotes: [],
    formatUsed: "json_schema",
    didFallback: false,
    rootCause: "STRICT_OK",
    nextAction: "none",
    ...overrides,
  };
}

describe("ai provider smoke cli helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns exit 0 for strict_ok in full mode", () => {
    const evaluation = evaluateProviderSmokeRows({
      mode: "full",
      rows: [buildRow()],
      allowBuiltValid: false,
      allowDegraded: false,
    });
    expect(evaluation.ok).toBe(true);
    expect(evaluation.exitCode).toBe(0);
  });

  it("returns exit 0 for built_valid only with allow-built-valid", () => {
    const row = buildRow({
      provider: "anthropic",
      finalContractStatus: "built_valid",
      strictStatus: "failed",
      directStrictStatus: "failed",
      draftStatus: "ok",
      envelopeBuildStatus: "ok",
      finalSchemaStatus: "ok",
      status: "degraded",
    });
    const denied = evaluateProviderSmokeRows({
      mode: "full",
      rows: [row],
      allowBuiltValid: false,
      allowDegraded: false,
    });
    const allowed = evaluateProviderSmokeRows({
      mode: "full",
      rows: [row],
      allowBuiltValid: true,
      allowDegraded: false,
    });
    expect(denied.exitCode).toBe(1);
    expect(allowed.exitCode).toBe(0);
  });

  it("returns non-zero for blocked rows", () => {
    const evaluation = evaluateProviderSmokeRows({
      mode: "full",
      rows: [
        buildRow({
          provider: "mistral",
          status: "failed",
          strictStatus: "blocked",
          directStrictStatus: "blocked",
          finalContractStatus: "blocked",
        }),
      ],
      allowBuiltValid: true,
      allowDegraded: true,
    });
    expect(evaluation.ok).toBe(false);
    expect(evaluation.exitCode).toBe(1);
  });

  it("redacts secrets from text and nested objects", () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test-secret-token");
    vi.stubEnv("PERPLEXITY_API_KEY", "pplx-test-secret-token");
    const text = "failure with key sk-test-secret-token in payload";
    const redactedText = redactSecretsInText(text);
    const redactedObj = redactSecretsInValue({ note: text });
    expect(redactedText).not.toContain("sk-test-secret-token");
    expect(redactedObj.note).not.toContain("sk-test-secret-token");
    const perplexityText = "failure with key pplx-test-secret-token in payload";
    expect(redactSecretsInText(perplexityText)).not.toContain("pplx-test-secret-token");
    vi.unstubAllEnvs();
  });

  it("writes sanitized JSON log output", async () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test-secret-token");
    const dir = await mkdtemp(path.join(tmpdir(), "ai-provider-smoke-"));
    const outputPath = await writeProviderSmokeJsonLog({
      mode: "full",
      providers: ["openai"],
      allowBuiltValid: false,
      allowDegraded: false,
      noRepair: false,
      dryRun: false,
      maxOutputTokens: null,
      startedAt: 1,
      finishedAt: 2,
      durationMs: 1,
      rows: [
        buildRow({
          rawExcerpt: "contains sk-test-secret-token",
          errorMessage: "provider said sk-test-secret-token in free text",
          reason: "free-form provider failure",
          openaiErrorMessage: "raw upstream message",
          fallbackReason: "verbatim fallback detail",
          repairReason: "verbatim repair detail",
        }),
      ],
      totals: {
        totalEstimatedCostUsd: 0.000036,
        totalEstimatedCostEur: 0.00003312,
        totalCostKnown: true,
        unknownCostProviders: [],
      },
      dryRunPlan: [],
      summary: [
        {
          provider: "openai",
          model: "gpt-4.1-mini",
          status: "ok",
          rootCause: "STRICT_OK",
          finalContractStatus: "strict_ok",
          directStrictStatus: "ok",
          draftStatus: "not_attempted",
          envelopeBuildStatus: "not_attempted",
          finalSchemaStatus: "ok",
          repairStatus: "not_attempted",
          providerErrorCode: null,
          schemaPath: null,
          durationMs: 1,
          tokensIn: 1,
          tokensOut: 1,
          estimatedCostUsd: 0.000002,
          estimatedCostEur: 0.00000184,
          costKnown: true,
          pricingSource: "internal_smoke_estimate_2026-04-29",
          costReason: null,
          runCostGroup: "full",
          smokeMode: "full",
          budgetProfile: "full_default",
          nextAction: "none",
        },
      ],
      evaluation: { ok: true, exitCode: 0, failures: [] },
      outputDir: dir,
      now: new Date("2026-04-29T10:11:12.000Z"),
    });

    const body = await readFile(outputPath, "utf8");
    const json = JSON.parse(body) as { rows: Array<Record<string, unknown>> };
    expect(path.basename(outputPath)).toBe("20260429-101112-full.json");
    expect(body).not.toContain("sk-test-secret-token");
    expect(body).not.toContain("free-form provider failure");
    expect(body).not.toContain("raw upstream message");
    expect(json.rows[0]).not.toHaveProperty("rawExcerpt");
    expect(json.rows[0]).not.toHaveProperty("errorMessage");
    expect(json.rows[0]).not.toHaveProperty("reason");
    expect(json.rows[0]).not.toHaveProperty("openaiErrorMessage");
    expect(json.rows[0]).not.toHaveProperty("fallbackReason");
    expect(json.rows[0]).not.toHaveProperty("repairReason");
    vi.unstubAllEnvs();
  });

  it("formats compact summary with required fields", () => {
    const text = formatProviderSmokeSummary({
      mode: "full",
      outputFilePath: "/tmp/test.json",
      evaluation: { ok: true, exitCode: 0, failures: [] },
      summary: [
        {
          provider: "openai",
          model: "gpt-4.1-mini",
          status: "ok",
          rootCause: "STRICT_OK",
          finalContractStatus: "strict_ok",
          directStrictStatus: "ok",
          draftStatus: "not_attempted",
          envelopeBuildStatus: "not_attempted",
          finalSchemaStatus: "ok",
          repairStatus: "not_attempted",
          providerErrorCode: null,
          schemaPath: null,
          durationMs: 10,
          tokensIn: 7,
          tokensOut: 13,
          estimatedCostUsd: 0.00002,
          estimatedCostEur: 0.0000184,
          costKnown: true,
          pricingSource: "internal_smoke_estimate_2026-04-29",
          costReason: null,
          runCostGroup: "full",
          smokeMode: "full",
          budgetProfile: "full_default",
          nextAction: "none",
        },
      ],
    });
    expect(text).toContain("finalContractStatus=strict_ok");
    expect(text).toContain("directStrictStatus=ok");
    expect(text).toContain("tokensIn=7");
    expect(text).toContain("tokensOut=13");
  });

  it("defaults to all-primary providers when provider flag is missing", () => {
    const args = parseProviderSmokeCliArgs([]);
    expect(args.providers).toEqual(["openai", "anthropic", "mistral"]);
    expect(args.providers.includes("gemini")).toBe(false);
  });

  it("fails fast on invalid provider and does not call providers", () => {
    expect(() => parseProviderSmokeCliArgs(["--provider=openia"])).toThrow(
      /Allowed: openai, anthropic, mistral, gemini, all-primary, all-optional/,
    );
    expect(providerMocks.callOpenAI).not.toHaveBeenCalled();
    expect(providerMocks.callAnthropic).not.toHaveBeenCalled();
    expect(providerMocks.callMistral).not.toHaveBeenCalled();
    expect(providerMocks.callGemini).not.toHaveBeenCalled();
  });

  it("fails fast on invalid provider list and does not call providers", () => {
    expect(() => parseProviderSmokeCliArgs(["--providers=openai,openia"])).toThrow(
      /Invalid provider value/,
    );
    expect(providerMocks.callOpenAI).not.toHaveBeenCalled();
    expect(providerMocks.callAnthropic).not.toHaveBeenCalled();
    expect(providerMocks.callMistral).not.toHaveBeenCalled();
    expect(providerMocks.callGemini).not.toHaveBeenCalled();
  });

  it("defaults mode to full when mode flag is missing", () => {
    const args = parseProviderSmokeCliArgs(["--provider=openai"]);
    expect(args.mode).toBe("full");
  });

  it("fails fast on invalid mode and does not call providers", () => {
    expect(() => parseProviderSmokeCliArgs(["--provider=openai", "--mode=ful"])).toThrow(
      /Allowed: probe, runtime, full, full-lite/,
    );
    expect(providerMocks.callOpenAI).not.toHaveBeenCalled();
    expect(providerMocks.callAnthropic).not.toHaveBeenCalled();
    expect(providerMocks.callMistral).not.toHaveBeenCalled();
    expect(providerMocks.callGemini).not.toHaveBeenCalled();
  });

  it("accepts full-lite mode", () => {
    const args = parseProviderSmokeCliArgs(["--provider=openai", "--mode=full-lite"]);
    expect(args.mode).toBe("full-lite");
  });

  it("accepts gemini as optional provider and keeps all-primary unchanged", () => {
    const single = parseProviderSmokeCliArgs(["--provider=gemini", "--mode=probe"]);
    expect(single.providers).toEqual(["gemini"]);
    const primary = parseProviderSmokeCliArgs(["--providers=all-primary"]);
    expect(primary.providers).toEqual(["openai", "anthropic", "mistral"]);
    expect(primary.providers.includes("gemini")).toBe(false);
  });

  it("keeps Perplexity prepared only as optional research discovery and not as analyze provider", () => {
    const perplexity = OPTIONAL_RESEARCH_PROVIDER_POLICIES.find((entry) => entry.provider === "perplexity");
    expect(perplexity).toBeTruthy();
    expect(perplexity?.role).toBe("research_discovery");
    expect(perplexity?.strictPrimary).toBe(false);
    expect(perplexity?.analyzeProvider).toBe(false);
    expect(perplexity?.coreOrchestrator).toBe(false);
    expect(RESEARCH_ENTITLEMENT_KEYS).toEqual([
      "search_credit",
      "deep_research_credit",
      "dossier_boost",
      "research_supporter",
      "initiator",
    ]);
    const openAiDeep = OPTIONAL_RESEARCH_PROVIDER_POLICIES.find(
      (entry) => entry.provider === "openai_deep_research",
    );
    expect(openAiDeep).toBeTruthy();
    expect(openAiDeep?.strictPrimary).toBe(false);
    expect(openAiDeep?.analyzeProvider).toBe(false);
    expect(openAiDeep?.coreOrchestrator).toBe(false);
  });

  it("marks Perplexity as disabled-by-default when no explicit enable flag is set", () => {
    vi.unstubAllEnvs();
    vi.stubEnv("PERPLEXITY_API_KEY", "test-key");
    vi.stubEnv("PERPLEXITY_BASE_URL", "https://api.perplexity.ai");
    vi.stubEnv("PERPLEXITY_DISABLED", "");
    const registry = buildResearchProviderRegistry();
    const perplexity = registry.activeProviders.find((entry) => entry.provider === "perplexity");
    expect(perplexity?.availability).toBe("disabled");
  });

  it("marks OpenAI deep research unavailable when disabled and available only with explicit config", () => {
    vi.unstubAllEnvs();
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("OPENAI_DEEP_RESEARCH_ENABLED", "0");
    let registry = buildResearchProviderRegistry();
    let deep = registry.activeProviders.find((entry) => entry.provider === "openai_deep_research");
    expect(deep?.availability).toBe("disabled");

    vi.stubEnv("OPENAI_DEEP_RESEARCH_ENABLED", "1");
    vi.stubEnv("OPENAI_DEEP_RESEARCH_MODEL", "o4-deep-research-preview");
    registry = buildResearchProviderRegistry();
    deep = registry.activeProviders.find((entry) => entry.provider === "openai_deep_research");
    expect(deep?.availability).toBe("available");
  });

  it("documents Perplexity environment preparation keys in env example", async () => {
    const envExamplePath = path.resolve(process.cwd(), ".env.example");
    const body = await readFile(envExamplePath, "utf8");
    expect(body).toContain("PERPLEXITY_API_KEY=");
    expect(body).toContain("PERPLEXITY_BASE_URL=https://api.perplexity.ai");
    expect(body).toContain("PERPLEXITY_SEARCH_MODEL=sonar");
    expect(body).toContain("PERPLEXITY_TIMEOUT_MS=15000");
    expect(body).toContain("PERPLEXITY_MAX_OUTPUT_TOKENS=1200");
    expect(body).toContain("PERPLEXITY_DISABLED=0");
  });

  it("full mode uses draft/envelope pipeline and can produce built_valid", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    providerMocks.callAnthropic.mockResolvedValue({
      text: JSON.stringify([{ text: "Autofreier Sonntag hat lokale Wirkung." }]),
      model: "claude-sonnet-test",
      tokensIn: 11,
      tokensOut: 22,
    });

    const outDir = await mkdtemp(path.join(tmpdir(), "ai-provider-smoke-full-"));
    const result = await runProviderSmokeCli({
      mode: "full",
      providers: ["anthropic"],
      allowBuiltValid: true,
      allowDegraded: false,
      noRepair: false,
      dryRun: false,
      maxOutputTokens: null,
      jsonOnly: false,
      help: false,
      outputDir: outDir,
    });

    expect(result.rows).toHaveLength(1);
    const row = result.rows[0];
    expect(row.finalContractStatus).toBe("built_valid");
    expect(row.directStrictStatus).toBe("failed");
    expect(row.draftStatus).toBe("ok");
    expect(row.envelopeBuildStatus).toBe("ok");
    expect(row.finalSchemaStatus).toBe("ok");
    expect(row.repairStatus).toBe("not_attempted");
    expect(row.providerStrategy).toBe("prompt_envelope");
    expect(Array.isArray(row.filledDefaults)).toBe(true);
    expect(result.evaluation.exitCode).toBe(0);
  });

  it("built_valid in full mode is non-zero without allow flag", async () => {
    vi.stubEnv("MISTRAL_API_KEY", "test-key");
    providerMocks.callMistral.mockResolvedValue({
      text: JSON.stringify([{ text: "Test claim for deterministic build." }]),
      model: "mistral-test",
      tokensIn: 9,
      tokensOut: 19,
    });

    const outDir = await mkdtemp(path.join(tmpdir(), "ai-provider-smoke-full-denied-"));
    const result = await runProviderSmokeCli({
      mode: "full",
      providers: ["mistral"],
      allowBuiltValid: false,
      allowDegraded: false,
      noRepair: false,
      dryRun: false,
      maxOutputTokens: null,
      jsonOnly: false,
      help: false,
      outputDir: outDir,
    });

    expect(result.rows[0].finalContractStatus).toBe("built_valid");
    expect(result.rows[0].draftStatus).toBe("ok");
    expect(result.rows[0].envelopeBuildStatus).toBe("ok");
    expect(result.evaluation.exitCode).toBe(1);
  });

  it("full mode passes OpenAI smoke profile metadata through diagnostics", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("OPENAI_MODEL", "gpt-5");
    vi.stubEnv("OPENAI_SMOKE_MODEL", "gpt-4.1-mini");
    vi.stubEnv("OPENAI_SMOKE_TIMEOUT_MS", "31000");
    vi.stubEnv("OPENAI_SMOKE_MAX_OUTPUT_TOKENS", "2300");

    providerMocks.callOpenAI.mockResolvedValue({
      text: JSON.stringify({
        mode: "E150",
        sourceText: null,
        language: "de",
        claims: [],
        findings: [],
        notes: [],
        questions: [],
        missingPerspectives: [],
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
      }),
      model: "gpt-4.1-mini",
      tokensIn: 40,
      tokensOut: 90,
      formatUsed: "json_schema",
      didFallback: false,
      openaiErrorCode: null,
      openaiErrorMessage: null,
    });

    const outDir = await mkdtemp(path.join(tmpdir(), "ai-provider-smoke-openai-"));
    const result = await runProviderSmokeCli({
      mode: "full",
      providers: ["openai"],
      allowBuiltValid: false,
      allowDegraded: false,
      noRepair: false,
      dryRun: false,
      maxOutputTokens: null,
      jsonOnly: false,
      help: false,
      outputDir: outDir,
    });

    const row = result.rows[0];
    expect(row.finalContractStatus).toBe("strict_ok");
    expect(row.selectedSmokeModel).toBe("gpt-4.1-mini");
    expect(row.model).toBe("gpt-4.1-mini");
    expect(row.effectiveModel).toBe("gpt-4.1-mini");
    expect(row.timeoutMs).toBe(31_000);
    expect(row.maxOutputTokens).toBe(2_300);
    expect(row.formatUsed).toBe("json_schema");
    expect(row.didFallback).toBe(false);
    expect(providerMocks.callOpenAI).toHaveBeenCalled();
    const openAiCall = providerMocks.callOpenAI.mock.calls[0]?.[0] as { model?: string };
    expect(openAiCall?.model).toBe("gpt-4.1-mini");
    expect(result.evaluation.exitCode).toBe(0);
  });

  it("dry-run does not call providers and returns a budget plan", async () => {
    vi.stubEnv("OPENAI_SMOKE_MODEL", "gpt-4.1-mini");
    const outDir = await mkdtemp(path.join(tmpdir(), "ai-provider-smoke-dry-run-"));
    const result = await runProviderSmokeCli({
      mode: "full-lite",
      providers: ["openai", "anthropic", "mistral"],
      allowBuiltValid: true,
      allowDegraded: false,
      noRepair: false,
      dryRun: true,
      maxOutputTokens: null,
      jsonOnly: false,
      help: false,
      outputDir: outDir,
    });

    expect(result.evaluation.exitCode).toBe(0);
    expect(result.rows).toHaveLength(0);
    expect(result.dryRunPlan).toHaveLength(3);
    expect(typeof result.totals.totalEstimatedCostUsd).toBe("number");
    expect((result.totals.totalEstimatedCostUsd ?? 0) > 0).toBe(true);
    expect(providerMocks.callOpenAI).not.toHaveBeenCalled();
    expect(providerMocks.callAnthropic).not.toHaveBeenCalled();
    expect(providerMocks.callMistral).not.toHaveBeenCalled();
    expect(providerMocks.callGemini).not.toHaveBeenCalled();
  });

  it("uses tiny token budgets for probe/runtime smoke profiles", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("OPENAI_MODEL", "gpt-5");
    vi.stubEnv("OPENAI_SMOKE_MODEL", "gpt-4.1-mini");
    vi.stubEnv("OPENAI_SMOKE_TIMEOUT_MS", "31000");
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");

    providerMocks.callOpenAI.mockResolvedValue({
      text: JSON.stringify({ ok: true, ping: "pong", provider: "openai" }),
      model: "gpt-4.1-mini",
      tokensIn: 5,
      tokensOut: 10,
      formatUsed: "json_schema",
      didFallback: false,
      openaiErrorCode: null,
      openaiErrorMessage: null,
    });
    providerMocks.callAnthropic.mockResolvedValue({
      text: JSON.stringify({ ok: true, ping: "pong", provider: "anthropic" }),
      model: "claude-sonnet-test",
      tokensIn: 6,
      tokensOut: 12,
    });

    const probeOutDir = await mkdtemp(path.join(tmpdir(), "ai-provider-smoke-probe-budget-"));
    const probeResult = await runProviderSmokeCli({
      mode: "probe",
      providers: ["openai"],
      allowBuiltValid: false,
      allowDegraded: false,
      noRepair: false,
      dryRun: false,
      maxOutputTokens: null,
      jsonOnly: false,
      help: false,
      outputDir: probeOutDir,
    });
    const openAiProbeCall = providerMocks.callOpenAI.mock.calls[0]?.[0] as {
      model?: string;
      timeoutMs?: number;
      maxOutputTokens?: number;
    };
    expect(openAiProbeCall?.maxOutputTokens).toBe(96);
    expect(openAiProbeCall?.model).toBe("gpt-4.1-mini");
    expect(openAiProbeCall?.timeoutMs).toBe(31_000);
    expect(probeResult.rows[0]?.selectedSmokeModel).toBe("gpt-4.1-mini");
    expect(probeResult.rows[0]?.effectiveModel).toBe("gpt-4.1-mini");
    expect(probeResult.rows[0]?.openAiSmokeModelMismatch).toBe(false);

    const runtimeOutDir = await mkdtemp(path.join(tmpdir(), "ai-provider-smoke-runtime-budget-"));
    await runProviderSmokeCli({
      mode: "runtime",
      providers: ["anthropic"],
      allowBuiltValid: false,
      allowDegraded: false,
      noRepair: false,
      dryRun: false,
      maxOutputTokens: null,
      jsonOnly: false,
      help: false,
      outputDir: runtimeOutDir,
    });
    const anthropicRuntimeCall = providerMocks.callAnthropic.mock.calls[0]?.[0] as {
      maxOutputTokens?: number;
    };
    expect(anthropicRuntimeCall?.maxOutputTokens).toBe(192);
  });

  it("retries Gemini probe with relaxed parsing after BAD_JSON", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    providerMocks.callGemini
      .mockResolvedValueOnce({
        text: "{\"ok\":true,\"ping\":\"pong\"",
        model: "gemini-2.5-flash",
      })
      .mockResolvedValueOnce({
        text: "Result: {\"ok\":true,\"ping\":\"pong\",\"provider\":\"gemini\"}",
        model: "gemini-2.5-flash",
      });

    const outDir = await mkdtemp(path.join(tmpdir(), "ai-provider-smoke-gemini-probe-"));
    const result = await runProviderSmokeCli({
      mode: "probe",
      providers: ["gemini"],
      allowBuiltValid: false,
      allowDegraded: false,
      noRepair: false,
      dryRun: false,
      maxOutputTokens: null,
      jsonOnly: false,
      help: false,
      outputDir: outDir,
    });

    const firstCallArgs = providerMocks.callGemini.mock.calls[0]?.[0] as
      | { expectJson?: boolean; maxOutputTokens?: number }
      | undefined;
    const secondCallArgs = providerMocks.callGemini.mock.calls[1]?.[0] as
      | { expectJson?: boolean; maxOutputTokens?: number }
      | undefined;
    expect(providerMocks.callGemini).toHaveBeenCalledTimes(2);
    expect(firstCallArgs?.expectJson).toBe(true);
    expect(firstCallArgs?.maxOutputTokens).toBe(96);
    expect(secondCallArgs?.expectJson).toBe(false);
    expect(secondCallArgs?.maxOutputTokens).toBe(192);
    expect(result.rows[0]?.status).toBe("ok");
    expect(result.rows[0]?.providerErrorCode).toBeNull();
  });

  it("prints n/a for unknown costs instead of 0", () => {
    const text = formatProviderSmokeSummary({
      mode: "full-lite",
      outputFilePath: "/tmp/test-unknown-cost.json",
      evaluation: { ok: true, exitCode: 0, failures: [] },
      summary: [
        {
          provider: "gemini",
          model: "gemini-2.5-flash",
          status: "ok",
          rootCause: "STRICT_OK",
          finalContractStatus: "strict_ok",
          directStrictStatus: "ok",
          draftStatus: "not_attempted",
          envelopeBuildStatus: "not_attempted",
          finalSchemaStatus: "ok",
          repairStatus: "not_attempted",
          providerErrorCode: null,
          schemaPath: null,
          durationMs: 10,
          tokensIn: 100,
          tokensOut: 200,
          estimatedCostUsd: null,
          estimatedCostEur: null,
          costKnown: false,
          pricingSource: "internal_smoke_estimate_2026-04-29",
          costReason: "pricing_unknown_for_model",
          runCostGroup: "tiny",
          smokeMode: "runtime",
          budgetProfile: "runtime_tiny",
          nextAction: "none",
        },
      ],
      totals: {
        totalEstimatedCostUsd: null,
        totalEstimatedCostEur: null,
        totalCostKnown: false,
        unknownCostProviders: ["gemini"],
      },
    });
    expect(text).toContain("estimatedCostUsd=n/a");
    expect(text).toContain("estimatedCostEur=n/a");
    expect(text).not.toContain("estimatedCostEur=0.000000");
  });

  it("gemini config missing returns blocked diagnostic in probe mode", async () => {
    vi.unstubAllEnvs();
    const outDir = await mkdtemp(path.join(tmpdir(), "ai-provider-smoke-gemini-missing-"));
    const result = await runProviderSmokeCli({
      mode: "probe",
      providers: ["gemini"],
      allowBuiltValid: false,
      allowDegraded: false,
      noRepair: false,
      dryRun: false,
      maxOutputTokens: null,
      jsonOnly: false,
      help: false,
      outputDir: outDir,
    });
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]?.status).toBe("config_missing");
    expect(result.rows[0]?.finalContractStatus).toBe("blocked");
    expect(result.rows[0]?.providerErrorCode).toBe("CONFIG_MISSING");
    expect(providerMocks.callGemini).not.toHaveBeenCalled();
  });

  it("gemini dry-run makes no provider call", async () => {
    const outDir = await mkdtemp(path.join(tmpdir(), "ai-provider-smoke-gemini-dryrun-"));
    const result = await runProviderSmokeCli({
      mode: "full-lite",
      providers: ["gemini"],
      allowBuiltValid: false,
      allowDegraded: false,
      noRepair: true,
      dryRun: true,
      maxOutputTokens: null,
      jsonOnly: false,
      help: false,
      outputDir: outDir,
    });
    expect(result.dryRunPlan).toHaveLength(1);
    expect(result.dryRunPlan[0]?.provider).toBe("gemini");
    expect(providerMocks.callGemini).not.toHaveBeenCalled();
  });

  it("full mode with --no-repair disables repair fallback", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    providerMocks.callAnthropic.mockResolvedValue({
      text: "not-json",
      model: "claude-sonnet-test",
      tokensIn: 5,
      tokensOut: 8,
    });

    const outDir = await mkdtemp(path.join(tmpdir(), "ai-provider-smoke-no-repair-"));
    const result = await runProviderSmokeCli({
      mode: "full",
      providers: ["anthropic"],
      allowBuiltValid: false,
      allowDegraded: false,
      noRepair: true,
      dryRun: false,
      maxOutputTokens: null,
      jsonOnly: false,
      help: false,
      outputDir: outDir,
    });

    expect(result.rows[0]?.repairStatus).toBe("not_attempted");
    expect(result.rows[0]?.repairReason).toBe("repair_disabled");
    expect(providerMocks.callAnthropic).toHaveBeenCalledTimes(1);
  });

  it("max-output-tokens override affects full-lite budget planning", async () => {
    const args = parseProviderSmokeCliArgs([
      "--providers=openai,anthropic,mistral",
      "--mode=full-lite",
      "--dry-run",
      "--max-output-tokens=777",
    ]);
    expect(args.maxOutputTokens).toBe(777);

    const outDir = await mkdtemp(path.join(tmpdir(), "ai-provider-smoke-budget-"));
    const result = await runProviderSmokeCli({
      ...args,
      allowBuiltValid: false,
      allowDegraded: false,
      outputDir: outDir,
      help: false,
      jsonOnly: false,
      noRepair: false,
      dryRun: true,
    });

    for (const plan of result.dryRunPlan) {
      expect(plan.maxOutputTokens).toBe(777);
    }
  });

  it("estimates known model pricing and returns unknown for unmapped models", () => {
    const known = estimateAiRunCost({
      provider: "openai",
      model: "gpt-4.1-mini",
      tokensIn: 1_000,
      tokensOut: 500,
    });
    expect(known.costKnown).toBe(true);
    expect(known.estimatedCostUsd).toBeGreaterThan(0);
    expect(known.estimatedCostEur).toBeGreaterThan(0);

    const unknown = estimateAiRunCost({
      provider: "openai",
      model: "gpt-unknown-x",
      tokensIn: 1_000,
      tokensOut: 500,
    });
    expect(unknown.costKnown).toBe(false);
    expect(unknown.estimatedCostUsd).toBeNull();
    expect(unknown.estimatedCostEur).toBeNull();

    const geminiUnknown = estimateAiRunCost({
      provider: "gemini",
      model: "gemini-2.5-flash",
      tokensIn: 1000,
      tokensOut: 500,
    });
    expect(geminiUnknown.costKnown).toBe(false);
    expect(geminiUnknown.estimatedCostUsd).toBeNull();
    expect(geminiUnknown.estimatedCostEur).toBeNull();
  });

  it("json log contains cost telemetry metadata", async () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    providerMocks.callOpenAI.mockResolvedValue({
      text: JSON.stringify({
        mode: "E150",
        sourceText: null,
        language: "de",
        claims: [],
        findings: [],
        notes: [],
        questions: [],
        missingPerspectives: [],
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
      }),
      model: "gpt-4.1-mini",
      tokensIn: 120,
      tokensOut: 340,
      formatUsed: "json_schema",
      didFallback: false,
      openaiErrorCode: null,
      openaiErrorMessage: null,
    });

    const outDir = await mkdtemp(path.join(tmpdir(), "ai-provider-smoke-cost-json-"));
    const result = await runProviderSmokeCli({
      mode: "full",
      providers: ["openai"],
      allowBuiltValid: false,
      allowDegraded: false,
      noRepair: false,
      dryRun: false,
      maxOutputTokens: null,
      jsonOnly: false,
      help: false,
      outputDir: outDir,
    });

    const body = await readFile(result.outputFilePath, "utf8");
    const parsed = JSON.parse(body) as {
      summary: Array<{ estimatedCostUsd: number | null; costKnown: boolean }>;
      totals: { totalEstimatedCostUsd: number | null };
    };
    expect(parsed.summary[0]?.costKnown).toBe(true);
    expect(typeof parsed.summary[0]?.estimatedCostUsd).toBe("number");
    expect(typeof parsed.totals.totalEstimatedCostUsd).toBe("number");
  });
});
