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

const providerMocks = vi.hoisted(() => ({
  callOpenAI: vi.fn(),
  callAnthropic: vi.fn(),
  callMistral: vi.fn(),
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
    const text = "failure with key sk-test-secret-token in payload";
    const redactedText = redactSecretsInText(text);
    const redactedObj = redactSecretsInValue({ note: text });
    expect(redactedText).not.toContain("sk-test-secret-token");
    expect(redactedObj.note).not.toContain("sk-test-secret-token");
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
      rows: [buildRow({ rawExcerpt: "contains sk-test-secret-token" })],
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
    expect(path.basename(outputPath)).toBe("20260429-101112-full.json");
    expect(body).not.toContain("sk-test-secret-token");
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
  });

  it("fails fast on invalid provider and does not call providers", () => {
    expect(() => parseProviderSmokeCliArgs(["--provider=openia"])).toThrow(
      /Allowed: openai, anthropic, mistral, all-primary/,
    );
    expect(providerMocks.callOpenAI).not.toHaveBeenCalled();
    expect(providerMocks.callAnthropic).not.toHaveBeenCalled();
    expect(providerMocks.callMistral).not.toHaveBeenCalled();
  });

  it("fails fast on invalid provider list and does not call providers", () => {
    expect(() => parseProviderSmokeCliArgs(["--providers=openai,openia"])).toThrow(
      /Invalid provider value/,
    );
    expect(providerMocks.callOpenAI).not.toHaveBeenCalled();
    expect(providerMocks.callAnthropic).not.toHaveBeenCalled();
    expect(providerMocks.callMistral).not.toHaveBeenCalled();
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
  });

  it("accepts full-lite mode", () => {
    const args = parseProviderSmokeCliArgs(["--provider=openai", "--mode=full-lite"]);
    expect(args.mode).toBe("full-lite");
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
