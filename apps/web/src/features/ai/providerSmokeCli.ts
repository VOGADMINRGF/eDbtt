import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ProviderDiagnostic } from "@/features/ai/adminTelemetryDiagnostics";
import { defaultModelForProvider } from "@/features/ai/adminTelemetryDiagnostics";
import { estimateAiRunCost } from "@/features/ai/aiCostTelemetry";
import { getAiRuntimePolicy, getAiRuntimeProfile } from "@features/ai/aiRuntimePolicy";
import {
  type DirectFullContractRunOptions,
  runDirectFullContractDiagnostic,
  runDirectProbeDiagnostic,
  runDirectRuntimeDiagnostic,
} from "@/features/ai/providerSmokeDirectRunner";

const PRIMARY_PROVIDER_ORDER = ["openai", "anthropic", "mistral"] as const;
export type PrimaryProvider = (typeof PRIMARY_PROVIDER_ORDER)[number];
const OPTIONAL_PROVIDER_ORDER = ["gemini"] as const;
export type OptionalProvider = (typeof OPTIONAL_PROVIDER_ORDER)[number];
const CLI_PROVIDER_ORDER = [...PRIMARY_PROVIDER_ORDER, ...OPTIONAL_PROVIDER_ORDER] as const;
export type SmokeCliProvider = (typeof CLI_PROVIDER_ORDER)[number];
export type ProviderSmokeCliMode = "probe" | "runtime" | "full" | "full-lite";
const ALLOWED_PROVIDER_VALUES = [...CLI_PROVIDER_ORDER, "all-primary", "all-optional"] as const;
const PROBE_TINY_ESTIMATED_TOKENS_IN = 60;
const RUNTIME_TINY_ESTIMATED_TOKENS_IN = 120;
const FULL_ESTIMATED_TOKENS_IN = 900;

export type ProviderSmokeCliArgs = {
  mode: ProviderSmokeCliMode;
  providers: SmokeCliProvider[];
  allowBuiltValid: boolean;
  allowDegraded: boolean;
  noRepair: boolean;
  dryRun: boolean;
  maxOutputTokens: number | null;
  jsonOnly: boolean;
  help: boolean;
  outputDir: string;
};

export type ProviderSmokeSummaryRow = {
  provider: SmokeCliProvider;
  model: string | null;
  status: string;
  rootCause: string;
  finalContractStatus: string;
  directStrictStatus: string;
  draftStatus: string;
  envelopeBuildStatus: string;
  finalSchemaStatus: string;
  repairStatus: string;
  providerErrorCode: string | null;
  schemaPath: string | null;
  durationMs: number | null;
  tokensIn: number | null;
  tokensOut: number | null;
  estimatedCostUsd: number | null;
  estimatedCostEur: number | null;
  costKnown: boolean;
  pricingSource: string | null;
  costReason: string | null;
  runCostGroup: string | null;
  smokeMode: string | null;
  budgetProfile: string | null;
  nextAction: string;
};

export type ProviderSmokeDryRunPlanRow = {
  provider: SmokeCliProvider;
  mode: ProviderSmokeCliMode;
  model: string;
  timeoutMs: number | null;
  maxOutputTokens: number | null;
  repairPolicy: "enabled" | "disabled";
  runCostGroup: "tiny" | "lite" | "full";
  budgetProfile: "probe_tiny" | "runtime_tiny" | "full_default" | "full_lite";
  estimatedBudgetCostUsd: number | null;
  estimatedBudgetCostEur: number | null;
  budgetCostKnown: boolean;
  pricingSource: string;
  costReason: string | null;
};

export type ProviderSmokeCostTotals = {
  totalEstimatedCostUsd: number | null;
  totalEstimatedCostEur: number | null;
  totalCostKnown: boolean;
  unknownCostProviders: SmokeCliProvider[];
};

export type ProviderSmokeEvaluation = {
  ok: boolean;
  exitCode: number;
  failures: Array<{ provider: SmokeCliProvider; reason: string }>;
};

export type ProviderSmokeCliRunResult = {
  mode: ProviderSmokeCliMode;
  providers: SmokeCliProvider[];
  allowBuiltValid: boolean;
  allowDegraded: boolean;
  noRepair: boolean;
  dryRun: boolean;
  maxOutputTokens: number | null;
  startedAt: number;
  finishedAt: number;
  durationMs: number;
  rows: ProviderDiagnostic[];
  summary: ProviderSmokeSummaryRow[];
  dryRunPlan: ProviderSmokeDryRunPlanRow[];
  totals: ProviderSmokeCostTotals;
  evaluation: ProviderSmokeEvaluation;
  outputFilePath: string;
};

function isSmokeCliProvider(value: string): value is SmokeCliProvider {
  return CLI_PROVIDER_ORDER.includes(value as SmokeCliProvider);
}

function parseProvidersOrThrow(values: string[], providerFlagSupplied: boolean): SmokeCliProvider[] {
  if (!providerFlagSupplied) return [...PRIMARY_PROVIDER_ORDER];

  const expanded = values.flatMap((value) => {
    const token = value.trim().toLowerCase();
    if (!token) return [];
    if (token === "all-primary") return [...PRIMARY_PROVIDER_ORDER];
    if (token === "all-optional") return [...OPTIONAL_PROVIDER_ORDER];
    return token.split(",").map((part) => part.trim().toLowerCase());
  });

  const invalidValues: string[] = [];
  const out: SmokeCliProvider[] = [];
  for (const provider of expanded) {
    if (!provider) continue;
    if (!isSmokeCliProvider(provider)) {
      invalidValues.push(provider);
      continue;
    }
    if (!out.includes(provider)) out.push(provider);
  }

  if (invalidValues.length > 0) {
    throw new Error(
      `Invalid provider value(s): ${Array.from(new Set(invalidValues)).join(", ")}. Allowed: ${ALLOWED_PROVIDER_VALUES.join(", ")}`,
    );
  }
  if (out.length === 0) {
    throw new Error(`No valid providers supplied. Allowed: ${ALLOWED_PROVIDER_VALUES.join(", ")}`);
  }
  return out;
}

function parseModeOrThrow(value: string | null | undefined, modeFlagSupplied: boolean): ProviderSmokeCliMode {
  if (!modeFlagSupplied) return "full";
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "probe") return "probe";
  if (normalized === "runtime") return "runtime";
  if (normalized === "full") return "full";
  if (normalized === "full-lite") return "full-lite";
  throw new Error(`Invalid mode value: ${value ?? ""}. Allowed: probe, runtime, full, full-lite`);
}

function parsePositiveIntegerOrThrow(value: string | null | undefined, flag: string): number {
  const raw = (value ?? "").trim();
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
    throw new Error(`Invalid ${flag} value: ${value ?? ""}. Expected a positive integer.`);
  }
  return parsed;
}

function parseOutputDir(value: string | null | undefined): string {
  const normalized = (value ?? "").trim();
  if (!normalized) {
    return path.resolve(process.cwd(), "..", "..", ".logs", "ai-smoke");
  }
  return path.resolve(process.cwd(), normalized);
}

function extractFlagValue(argv: string[], index: number, flag: string): string | null {
  const token = argv[index];
  if (!token.startsWith(`${flag}=`)) return null;
  return token.slice(flag.length + 1);
}

export function parseProviderSmokeCliArgs(argv: string[]): ProviderSmokeCliArgs {
  const providerTokens: string[] = [];
  let modeToken: string | null = null;
  let providerFlagSupplied = false;
  let modeFlagSupplied = false;
  let allowBuiltValid = false;
  let allowDegraded = false;
  let noRepair = false;
  let dryRun = false;
  let maxOutputTokens: number | null = null;
  let jsonOnly = false;
  let help = false;
  let outputDir: string | null = null;

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token) continue;
    if (token === "--help" || token === "-h") {
      help = true;
      continue;
    }
    if (token === "--allow-built-valid") {
      allowBuiltValid = true;
      continue;
    }
    if (token === "--allow-degraded") {
      allowDegraded = true;
      continue;
    }
    if (token === "--no-repair") {
      noRepair = true;
      continue;
    }
    if (token === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (token === "--json-only") {
      jsonOnly = true;
      continue;
    }
    if (token === "--provider" || token === "--providers") {
      providerFlagSupplied = true;
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        providerTokens.push(next);
        i += 1;
      }
      continue;
    }
    if (token === "--mode") {
      modeFlagSupplied = true;
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        modeToken = next;
        i += 1;
      }
      continue;
    }
    if (token === "--output-dir") {
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        outputDir = next;
        i += 1;
      }
      continue;
    }
    if (token === "--max-output-tokens") {
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) {
        throw new Error("Missing value for --max-output-tokens");
      }
      maxOutputTokens = parsePositiveIntegerOrThrow(next, "--max-output-tokens");
      i += 1;
      continue;
    }

    const providerValue =
      extractFlagValue(argv, i, "--provider") ?? extractFlagValue(argv, i, "--providers");
    if (providerValue !== null) {
      providerFlagSupplied = true;
      providerTokens.push(providerValue);
      continue;
    }
    const modeValue = extractFlagValue(argv, i, "--mode");
    if (modeValue !== null) {
      modeFlagSupplied = true;
      modeToken = modeValue;
      continue;
    }
    const outputDirValue = extractFlagValue(argv, i, "--output-dir");
    if (outputDirValue !== null) {
      outputDir = outputDirValue;
      continue;
    }
    const maxOutputTokensValue = extractFlagValue(argv, i, "--max-output-tokens");
    if (maxOutputTokensValue !== null) {
      maxOutputTokens = parsePositiveIntegerOrThrow(maxOutputTokensValue, "--max-output-tokens");
      continue;
    }
  }

  return {
    mode: parseModeOrThrow(modeToken, modeFlagSupplied),
    providers: parseProvidersOrThrow(providerTokens, providerFlagSupplied),
    allowBuiltValid,
    allowDegraded,
    noRepair,
    dryRun,
    maxOutputTokens,
    jsonOnly,
    help,
    outputDir: parseOutputDir(outputDir),
  };
}

export function buildProviderSmokeSummaryRow(row: ProviderDiagnostic): ProviderSmokeSummaryRow {
  return {
    provider: row.provider as SmokeCliProvider,
    model: row.model ?? null,
    status: row.status,
    rootCause: row.rootCause,
    finalContractStatus: row.finalContractStatus,
    directStrictStatus: row.directStrictStatus,
    draftStatus: row.draftStatus,
    envelopeBuildStatus: row.envelopeBuildStatus,
    finalSchemaStatus: row.finalSchemaStatus,
    repairStatus: row.repairStatus,
    providerErrorCode: row.providerErrorCode ?? row.strictProviderErrorCode ?? null,
    schemaPath: row.schemaPath ?? row.strictSchemaPath ?? null,
    durationMs: row.durationMs,
    tokensIn: row.tokensIn,
    tokensOut: row.tokensOut,
    estimatedCostUsd: typeof row.estimatedCostUsd === "number" ? row.estimatedCostUsd : null,
    estimatedCostEur: typeof row.estimatedCostEur === "number" ? row.estimatedCostEur : null,
    costKnown: row.costKnown === true,
    pricingSource: row.pricingSource ?? null,
    costReason: row.costReason ?? null,
    runCostGroup: row.runCostGroup ?? null,
    smokeMode: row.smokeMode ?? null,
    budgetProfile: row.budgetProfile ?? null,
    nextAction: row.nextAction,
  };
}

export function evaluateProviderSmokeRows(params: {
  mode: ProviderSmokeCliMode;
  rows: ProviderDiagnostic[];
  allowBuiltValid: boolean;
  allowDegraded: boolean;
}): ProviderSmokeEvaluation {
  const failures: Array<{ provider: SmokeCliProvider; reason: string }> = [];
  const fullLikeMode = params.mode === "full" || params.mode === "full-lite";

  for (const row of params.rows) {
    const provider = row.provider as SmokeCliProvider;
    if (!fullLikeMode) {
      if (row.status !== "ok") {
        failures.push({
          provider,
          reason: `status=${row.status}`,
        });
      }
      continue;
    }

    if (row.finalContractStatus === "strict_ok") continue;
    if (row.finalContractStatus === "built_valid") {
      if (params.allowBuiltValid) continue;
      failures.push({
        provider,
        reason: "finalContractStatus=built_valid requires --allow-built-valid",
      });
      continue;
    }
    if (row.finalContractStatus === "repaired_degraded") {
      if (params.allowDegraded) continue;
      failures.push({
        provider,
        reason: "finalContractStatus=repaired_degraded requires --allow-degraded",
      });
      continue;
    }

    failures.push({
      provider,
      reason: `finalContractStatus=${row.finalContractStatus}`,
    });
  }

  return {
    ok: failures.length === 0,
    exitCode: failures.length === 0 ? 0 : 1,
    failures,
  };
}

function formatCost(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "n/a";
  return value.toFixed(6);
}

function computeCostTotals(rows: ProviderDiagnostic[]): ProviderSmokeCostTotals {
  let usdTotal = 0;
  let eurTotal = 0;
  let allKnown = true;
  const unknownCostProviders: SmokeCliProvider[] = [];

  for (const row of rows) {
    const provider = row.provider as SmokeCliProvider;
    const known = row.costKnown === true;
    if (!known) {
      allKnown = false;
      if (!unknownCostProviders.includes(provider)) unknownCostProviders.push(provider);
      continue;
    }
    if (typeof row.estimatedCostUsd === "number") usdTotal += row.estimatedCostUsd;
    if (typeof row.estimatedCostEur === "number") eurTotal += row.estimatedCostEur;
  }

  return {
    totalEstimatedCostUsd: allKnown ? Number(usdTotal.toFixed(8)) : null,
    totalEstimatedCostEur: allKnown ? Number(eurTotal.toFixed(8)) : null,
    totalCostKnown: allKnown,
    unknownCostProviders,
  };
}

function computeDryRunCostTotals(plan: ProviderSmokeDryRunPlanRow[]): ProviderSmokeCostTotals {
  let usdTotal = 0;
  let eurTotal = 0;
  let allKnown = true;
  const unknownCostProviders: SmokeCliProvider[] = [];

  for (const row of plan) {
    if (!row.budgetCostKnown) {
      allKnown = false;
      if (!unknownCostProviders.includes(row.provider)) unknownCostProviders.push(row.provider);
      continue;
    }
    if (typeof row.estimatedBudgetCostUsd === "number") usdTotal += row.estimatedBudgetCostUsd;
    if (typeof row.estimatedBudgetCostEur === "number") eurTotal += row.estimatedBudgetCostEur;
  }

  return {
    totalEstimatedCostUsd: allKnown ? Number(usdTotal.toFixed(8)) : null,
    totalEstimatedCostEur: allKnown ? Number(eurTotal.toFixed(8)) : null,
    totalCostKnown: allKnown,
    unknownCostProviders,
  };
}

export function formatProviderSmokeSummary(params: {
  mode: ProviderSmokeCliMode;
  dryRun?: boolean;
  summary: ProviderSmokeSummaryRow[];
  dryRunPlan?: ProviderSmokeDryRunPlanRow[];
  totals?: ProviderSmokeCostTotals;
  evaluation: ProviderSmokeEvaluation;
  outputFilePath: string;
}): string {
  const dryRun = params.dryRun === true;
  const dryRunPlan = params.dryRunPlan ?? [];
  const totals = params.totals ?? {
    totalEstimatedCostUsd: null,
    totalEstimatedCostEur: null,
    totalCostKnown: false,
    unknownCostProviders: [],
  };
  const lines: string[] = [];
  lines.push(`mode=${params.mode}`);
  lines.push(`dryRun=${String(dryRun)}`);
  lines.push(`log=${params.outputFilePath}`);
  if (dryRunPlan.length > 0) {
    for (const plan of dryRunPlan) {
      lines.push(
        [
          `planProvider=${plan.provider}`,
          `model=${plan.model}`,
          `mode=${plan.mode}`,
          `timeoutMs=${plan.timeoutMs ?? "n/a"}`,
          `maxOutputTokens=${plan.maxOutputTokens ?? "n/a"}`,
          `repairPolicy=${plan.repairPolicy}`,
          `runCostGroup=${plan.runCostGroup}`,
          `budgetProfile=${plan.budgetProfile}`,
          `estimatedBudgetCostUsd=${formatCost(plan.estimatedBudgetCostUsd)}`,
          `estimatedBudgetCostEur=${formatCost(plan.estimatedBudgetCostEur)}`,
          `budgetCostKnown=${String(plan.budgetCostKnown)}`,
        ].join(" | "),
      );
    }
  }
  for (const row of params.summary) {
    lines.push(
      [
        `provider=${row.provider}`,
        `model=${row.model ?? "n/a"}`,
        `status=${row.status}`,
        `rootCause=${row.rootCause}`,
        `finalContractStatus=${row.finalContractStatus}`,
        `directStrictStatus=${row.directStrictStatus}`,
        `draftStatus=${row.draftStatus}`,
        `envelopeBuildStatus=${row.envelopeBuildStatus}`,
        `finalSchemaStatus=${row.finalSchemaStatus}`,
        `repairStatus=${row.repairStatus}`,
        `providerErrorCode=${row.providerErrorCode ?? "n/a"}`,
        `schemaPath=${row.schemaPath ?? "n/a"}`,
        `durationMs=${row.durationMs ?? 0}`,
        `tokensIn=${row.tokensIn ?? 0}`,
        `tokensOut=${row.tokensOut ?? 0}`,
        `estimatedCostUsd=${formatCost(row.estimatedCostUsd)}`,
        `estimatedCostEur=${formatCost(row.estimatedCostEur)}`,
        `costKnown=${String(row.costKnown)}`,
        `runCostGroup=${row.runCostGroup ?? "n/a"}`,
        `budgetProfile=${row.budgetProfile ?? "n/a"}`,
        `nextAction=${row.nextAction}`,
      ].join(" | "),
    );
  }
  lines.push(
    [
      `totalEstimatedCostUsd=${formatCost(totals.totalEstimatedCostUsd)}`,
      `totalEstimatedCostEur=${formatCost(totals.totalEstimatedCostEur)}`,
      `totalCostKnown=${String(totals.totalCostKnown)}`,
      `unknownCostProviders=${totals.unknownCostProviders.join(",") || "none"}`,
    ].join(" | "),
  );
  lines.push(`exitCode=${params.evaluation.exitCode}`);
  if (params.evaluation.failures.length > 0) {
    lines.push(
      `failures=${params.evaluation.failures.map((entry) => `${entry.provider}:${entry.reason}`).join(", ")}`,
    );
  }
  return lines.join("\n");
}

function getRedactionSecrets(): string[] {
  const envKeys = [
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "MISTRAL_API_KEY",
    "GEMINI_API_KEY",
    "GOOGLE_API_KEY",
    "PERPLEXITY_API_KEY",
    "ARI_API_KEY",
    "YOUCOM_ARI_API_KEY",
  ] as const;
  const values = envKeys
    .map((key) => process.env[key] ?? "")
    .map((value) => value.trim())
    .filter((value) => value.length >= 8);
  return Array.from(new Set(values));
}

export function redactSecretsInText(input: string): string {
  let out = input;
  for (const secret of getRedactionSecrets()) {
    if (!secret) continue;
    out = out.split(secret).join("[redacted]");
  }
  out = out.replace(/\b(sk|sk-proj)-[A-Za-z0-9_-]{10,}\b/g, "[redacted]");
  return out;
}

export function redactSecretsInValue<T>(value: T): T {
  if (typeof value === "string") {
    return redactSecretsInText(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactSecretsInValue(item)) as T;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, val]) => [
      key,
      redactSecretsInValue(val),
    ]);
    return Object.fromEntries(entries) as T;
  }
  return value;
}

function timestampForFilename(now: Date): string {
  const iso = now.toISOString();
  return iso.replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
}

export async function writeProviderSmokeJsonLog(
  result: Omit<ProviderSmokeCliRunResult, "outputFilePath"> & { outputDir: string; now?: Date },
): Promise<string> {
  const baseDir = result.outputDir;
  await mkdir(baseDir, { recursive: true });
  const stamp = timestampForFilename(result.now ?? new Date());
  const filePath = path.resolve(baseDir, `${stamp}-${result.mode}.json`);
  const payload = redactSecretsInValue({
    mode: result.mode,
    providers: result.providers,
    allowBuiltValid: result.allowBuiltValid,
    allowDegraded: result.allowDegraded,
    noRepair: result.noRepair,
    dryRun: result.dryRun,
    maxOutputTokens: result.maxOutputTokens,
    startedAt: result.startedAt,
    finishedAt: result.finishedAt,
    durationMs: result.durationMs,
    evaluation: result.evaluation,
    totals: result.totals,
    dryRunPlan: result.dryRunPlan,
    summary: result.summary,
    rows: result.rows.map((row) => ({
      provider: row.provider,
      model: row.model ?? null,
      status: row.status,
      errorKind: row.errorKind ?? null,
      providerErrorCode: row.providerErrorCode ?? null,
      httpStatus: row.httpStatus ?? null,
      validationMode: row.validationMode,
      providerStatus: row.providerStatus,
      adapterStatus: row.adapterStatus,
      parseStatus: row.parseStatus,
      schemaStatus: row.schemaStatus,
      durationMs: row.durationMs,
      tokensIn: row.tokensIn,
      tokensOut: row.tokensOut,
      estimatedCostUsd: row.estimatedCostUsd ?? null,
      estimatedCostEur: row.estimatedCostEur ?? null,
      costKnown: row.costKnown ?? false,
      pricingSource: row.pricingSource ?? null,
      costReason: row.costReason ?? null,
      runCostGroup: row.runCostGroup ?? null,
      smokeMode: row.smokeMode ?? null,
      budgetProfile: row.budgetProfile ?? null,
      fallbackUsed: row.fallbackUsed ?? null,
      journeyDecision: row.journeyDecision,
      strictStatus: row.strictStatus,
      strictProviderErrorCode: row.strictProviderErrorCode ?? null,
      repairAttempted: row.repairAttempted,
      repairStatus: row.repairStatus,
      repairProviderErrorCode: row.repairProviderErrorCode ?? null,
      repairUsed: row.repairUsed,
      directStrictStatus: row.directStrictStatus,
      draftStatus: row.draftStatus,
      envelopeBuildStatus: row.envelopeBuildStatus,
      finalSchemaStatus: row.finalSchemaStatus,
      finalContractStatus: row.finalContractStatus,
      nativeStrategy: row.nativeStrategy,
      preferredContractStrategy: row.preferredContractStrategy,
      fallbackStrategy: row.fallbackStrategy,
      supportsStrictJsonSchema: row.supportsStrictJsonSchema,
      supportsJsonObjectMode: row.supportsJsonObjectMode,
      supportsPromptEnvelope: row.supportsPromptEnvelope,
      supportsRepairAttempt: row.supportsRepairAttempt,
      canBeUsedAsRepairProvider: row.canBeUsedAsRepairProvider,
      knownBlockers: row.knownBlockers,
      nonRepairableErrorCodes: row.nonRepairableErrorCodes,
      formatUsed: row.formatUsed ?? null,
      didFallback: row.didFallback ?? null,
      timeoutMs: row.timeoutMs ?? null,
      maxOutputTokens: row.maxOutputTokens ?? null,
      openaiErrorCode: row.openaiErrorCode ?? null,
      selectedSmokeModel: row.selectedSmokeModel ?? null,
      smokeModelEnvPresent: row.smokeModelEnvPresent ?? null,
      effectiveModel: row.effectiveModel ?? null,
      openAiSmokeModelMismatch: row.openAiSmokeModelMismatch ?? null,
      rootCause: row.rootCause,
      nextAction: row.nextAction,
    })),
  });
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return filePath;
}

function sortRowsByPrimaryOrder(rows: ProviderDiagnostic[]): ProviderDiagnostic[] {
  const indexOfProvider = (provider: string): number => {
    const index = CLI_PROVIDER_ORDER.indexOf(provider as SmokeCliProvider);
    return index >= 0 ? index : 99;
  };
  return [...rows].sort((a, b) => {
    const left = indexOfProvider(a.provider);
    const right = indexOfProvider(b.provider);
    return left - right;
  });
}

function openAiSmokeModel(): string {
  return getAiRuntimePolicy().openai.smokeModelCandidates[0] ?? getAiRuntimePolicy().openai.model;
}

function openAiSmokeTimeoutMs(): number {
  return getAiRuntimeProfile("smoke").timeoutMs;
}

function openAiSmokeMaxOutputTokens(): number {
  return getAiRuntimeProfile("smoke").maxOutputTokens ?? getAiRuntimePolicy().smokeMaxOutputTokens;
}

function resolveFullModeMaxOutputTokens(args: ProviderSmokeCliArgs, provider: SmokeCliProvider): number {
  if (typeof args.maxOutputTokens === "number" && args.maxOutputTokens > 0) {
    return args.maxOutputTokens;
  }
  if (provider === "openai") {
    const openAiMax = openAiSmokeMaxOutputTokens();
    return args.mode === "full-lite"
      ? Math.min(openAiMax, getAiRuntimeProfile("fullContractLite").maxOutputTokens ?? openAiMax)
      : openAiMax;
  }
  return args.mode === "full-lite"
    ? (getAiRuntimeProfile("fullContractLite").maxOutputTokens ?? 1_200)
    : (getAiRuntimeProfile("fullContract").maxOutputTokens ?? 2_600);
}

function resolveRepairPolicy(args: ProviderSmokeCliArgs): "enabled" | "disabled" {
  if (args.mode === "full-lite") return args.noRepair ? "disabled" : "disabled";
  return args.noRepair ? "disabled" : "enabled";
}

function buildDryRunPlan(args: ProviderSmokeCliArgs): ProviderSmokeDryRunPlanRow[] {
  const repairPolicy = resolveRepairPolicy(args);
  const fullLike = args.mode === "full" || args.mode === "full-lite";
  const estimatedTokensIn =
    args.mode === "probe"
      ? PROBE_TINY_ESTIMATED_TOKENS_IN
      : args.mode === "runtime"
        ? RUNTIME_TINY_ESTIMATED_TOKENS_IN
        : FULL_ESTIMATED_TOKENS_IN;

  return args.providers.map((provider) => {
    const model =
      provider === "openai"
        ? openAiSmokeModel()
        : defaultModelForProvider(provider);
    const maxOutputTokens = fullLike
      ? resolveFullModeMaxOutputTokens(args, provider)
      : args.mode === "probe"
        ? (getAiRuntimeProfile("providerProbe").maxOutputTokens ?? 96)
        : (getAiRuntimeProfile("runtimeProbe").maxOutputTokens ?? 192);
    const timeoutMs = provider === "openai" ? openAiSmokeTimeoutMs() : null;
    const runCostGroup: ProviderSmokeDryRunPlanRow["runCostGroup"] =
      args.mode === "probe" || args.mode === "runtime"
        ? "tiny"
        : args.mode === "full-lite"
          ? "lite"
          : "full";
    const budgetProfile: ProviderSmokeDryRunPlanRow["budgetProfile"] =
      args.mode === "probe"
        ? "probe_tiny"
        : args.mode === "runtime"
          ? "runtime_tiny"
          : args.mode === "full-lite"
            ? "full_lite"
            : "full_default";
    const budgetCost = estimateAiRunCost({
      provider,
      model,
      tokensIn: estimatedTokensIn,
      tokensOut: maxOutputTokens,
    });
    return {
      provider,
      mode: args.mode,
      model,
      timeoutMs,
      maxOutputTokens,
      repairPolicy,
      runCostGroup,
      budgetProfile,
      estimatedBudgetCostUsd: budgetCost.estimatedCostUsd,
      estimatedBudgetCostEur: budgetCost.estimatedCostEur,
      budgetCostKnown: budgetCost.costKnown,
      pricingSource: budgetCost.pricingSource,
      costReason: budgetCost.reason,
    };
  });
}

async function runSingleProviderMode(
  provider: SmokeCliProvider,
  args: ProviderSmokeCliArgs,
): Promise<ProviderDiagnostic> {
  if (args.mode === "probe") return runDirectProbeDiagnostic(provider);
  if (args.mode === "runtime") return runDirectRuntimeDiagnostic(provider);
  const fullOptions: DirectFullContractRunOptions = {
    mode: args.mode === "full-lite" ? "full-lite" : "full",
    disableRepair: resolveRepairPolicy(args) === "disabled",
    maxOutputTokens: resolveFullModeMaxOutputTokens(args, provider),
  };
  return runDirectFullContractDiagnostic(provider, fullOptions);
}

export async function runProviderSmokeCli(args: ProviderSmokeCliArgs): Promise<ProviderSmokeCliRunResult> {
  const startedAt = Date.now();
  const dryRunPlan = buildDryRunPlan(args);
  const rows = args.dryRun
    ? []
    : await Promise.all(
        args.providers.map((provider) => runSingleProviderMode(provider, args)),
      );
  const sortedRows = sortRowsByPrimaryOrder(rows);
  const summary = sortedRows.map(buildProviderSmokeSummaryRow);
  const totals = args.dryRun ? computeDryRunCostTotals(dryRunPlan) : computeCostTotals(sortedRows);
  const evaluation = args.dryRun
    ? { ok: true, exitCode: 0, failures: [] }
    : evaluateProviderSmokeRows({
        mode: args.mode,
        rows: sortedRows,
        allowBuiltValid: args.allowBuiltValid,
        allowDegraded: args.allowDegraded,
      });
  const finishedAt = Date.now();
  const outputFilePath = await writeProviderSmokeJsonLog({
    mode: args.mode,
    providers: args.providers,
    allowBuiltValid: args.allowBuiltValid,
    allowDegraded: args.allowDegraded,
    noRepair: args.noRepair,
    dryRun: args.dryRun,
    maxOutputTokens: args.maxOutputTokens,
    startedAt,
    finishedAt,
    durationMs: finishedAt - startedAt,
    rows: sortedRows,
    summary,
    dryRunPlan,
    totals,
    evaluation,
    outputDir: args.outputDir,
  });

  return {
    mode: args.mode,
    providers: args.providers,
    allowBuiltValid: args.allowBuiltValid,
    allowDegraded: args.allowDegraded,
    noRepair: args.noRepair,
    dryRun: args.dryRun,
    maxOutputTokens: args.maxOutputTokens,
    startedAt,
    finishedAt,
    durationMs: finishedAt - startedAt,
    rows: sortedRows,
    summary,
    dryRunPlan,
    totals,
    evaluation,
    outputFilePath,
  };
}
