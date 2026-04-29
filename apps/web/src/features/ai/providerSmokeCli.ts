import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ProviderDiagnostic } from "@/features/ai/adminTelemetryDiagnostics";
import {
  runDirectFullContractDiagnostic,
  runDirectProbeDiagnostic,
  runDirectRuntimeDiagnostic,
} from "@/features/ai/providerSmokeDirectRunner";

const PRIMARY_PROVIDER_ORDER = ["openai", "anthropic", "mistral"] as const;
export type PrimaryProvider = (typeof PRIMARY_PROVIDER_ORDER)[number];
export type ProviderSmokeCliMode = "probe" | "runtime" | "full";
const ALLOWED_PROVIDER_VALUES = [...PRIMARY_PROVIDER_ORDER, "all-primary"] as const;

export type ProviderSmokeCliArgs = {
  mode: ProviderSmokeCliMode;
  providers: PrimaryProvider[];
  allowBuiltValid: boolean;
  allowDegraded: boolean;
  jsonOnly: boolean;
  help: boolean;
  outputDir: string;
};

export type ProviderSmokeSummaryRow = {
  provider: PrimaryProvider;
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
  nextAction: string;
};

export type ProviderSmokeEvaluation = {
  ok: boolean;
  exitCode: number;
  failures: Array<{ provider: PrimaryProvider; reason: string }>;
};

export type ProviderSmokeCliRunResult = {
  mode: ProviderSmokeCliMode;
  providers: PrimaryProvider[];
  allowBuiltValid: boolean;
  allowDegraded: boolean;
  startedAt: number;
  finishedAt: number;
  durationMs: number;
  rows: ProviderDiagnostic[];
  summary: ProviderSmokeSummaryRow[];
  evaluation: ProviderSmokeEvaluation;
  outputFilePath: string;
};

function isPrimaryProvider(value: string): value is PrimaryProvider {
  return PRIMARY_PROVIDER_ORDER.includes(value as PrimaryProvider);
}

function parseProvidersOrThrow(values: string[], providerFlagSupplied: boolean): PrimaryProvider[] {
  if (!providerFlagSupplied) return [...PRIMARY_PROVIDER_ORDER];

  const expanded = values.flatMap((value) => {
    const token = value.trim().toLowerCase();
    if (!token) return [];
    if (token === "all-primary") return [...PRIMARY_PROVIDER_ORDER];
    return token.split(",").map((part) => part.trim().toLowerCase());
  });

  const invalidValues: string[] = [];
  const out: PrimaryProvider[] = [];
  for (const provider of expanded) {
    if (!provider) continue;
    if (!isPrimaryProvider(provider)) {
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
  throw new Error(`Invalid mode value: ${value ?? ""}. Allowed: probe, runtime, full`);
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
  }

  return {
    mode: parseModeOrThrow(modeToken, modeFlagSupplied),
    providers: parseProvidersOrThrow(providerTokens, providerFlagSupplied),
    allowBuiltValid,
    allowDegraded,
    jsonOnly,
    help,
    outputDir: parseOutputDir(outputDir),
  };
}

export function buildProviderSmokeSummaryRow(row: ProviderDiagnostic): ProviderSmokeSummaryRow {
  return {
    provider: row.provider as PrimaryProvider,
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
    nextAction: row.nextAction,
  };
}

export function evaluateProviderSmokeRows(params: {
  mode: ProviderSmokeCliMode;
  rows: ProviderDiagnostic[];
  allowBuiltValid: boolean;
  allowDegraded: boolean;
}): ProviderSmokeEvaluation {
  const failures: Array<{ provider: PrimaryProvider; reason: string }> = [];

  for (const row of params.rows) {
    const provider = row.provider as PrimaryProvider;
    if (params.mode !== "full") {
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

export function formatProviderSmokeSummary(params: {
  mode: ProviderSmokeCliMode;
  summary: ProviderSmokeSummaryRow[];
  evaluation: ProviderSmokeEvaluation;
  outputFilePath: string;
}): string {
  const lines: string[] = [];
  lines.push(`mode=${params.mode}`);
  lines.push(`log=${params.outputFilePath}`);
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
        `nextAction=${row.nextAction}`,
      ].join(" | "),
    );
  }
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
    startedAt: result.startedAt,
    finishedAt: result.finishedAt,
    durationMs: result.durationMs,
    evaluation: result.evaluation,
    summary: result.summary,
    rows: result.rows,
  });
  await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return filePath;
}

function sortRowsByPrimaryOrder(rows: ProviderDiagnostic[]): ProviderDiagnostic[] {
  return [...rows].sort((a, b) => {
    const left = PRIMARY_PROVIDER_ORDER.indexOf(a.provider as PrimaryProvider);
    const right = PRIMARY_PROVIDER_ORDER.indexOf(b.provider as PrimaryProvider);
    return left - right;
  });
}

async function runSingleProviderMode(
  provider: PrimaryProvider,
  mode: ProviderSmokeCliMode,
): Promise<ProviderDiagnostic> {
  if (mode === "probe") return runDirectProbeDiagnostic(provider);
  if (mode === "runtime") return runDirectRuntimeDiagnostic(provider);
  return runDirectFullContractDiagnostic(provider);
}

export async function runProviderSmokeCli(args: ProviderSmokeCliArgs): Promise<ProviderSmokeCliRunResult> {
  const startedAt = Date.now();
  const rows = await Promise.all(
    args.providers.map((provider) => runSingleProviderMode(provider, args.mode)),
  );
  const sortedRows = sortRowsByPrimaryOrder(rows);
  const summary = sortedRows.map(buildProviderSmokeSummaryRow);
  const evaluation = evaluateProviderSmokeRows({
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
    startedAt,
    finishedAt,
    durationMs: finishedAt - startedAt,
    rows: sortedRows,
    summary,
    evaluation,
    outputDir: args.outputDir,
  });

  return {
    mode: args.mode,
    providers: args.providers,
    allowBuiltValid: args.allowBuiltValid,
    allowDegraded: args.allowDegraded,
    startedAt,
    finishedAt,
    durationMs: finishedAt - startedAt,
    rows: sortedRows,
    summary,
    evaluation,
    outputFilePath,
  };
}
