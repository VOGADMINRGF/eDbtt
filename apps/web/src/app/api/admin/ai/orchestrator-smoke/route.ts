import { NextRequest, NextResponse } from "next/server";
import {
  callE150Orchestrator,
  type E150OrchestratorMeta,
  type E150ProviderName,
  type ProviderMatrixEntry,
} from "@features/ai/orchestratorE150";
import { callOpenAI } from "@features/ai/providers/openai";
import { callAnthropic } from "@features/ai/providers/anthropic";
import { callMistral } from "@features/ai/providers/mistral";
import { callGemini } from "@features/ai/providers/gemini";
import { callAriLLM } from "@features/ai/providers/ari_llm";
import { analyzeContribution } from "@features/analyze/analyzeContribution";
import { AnalyzeResultSchema } from "@features/analyze/schemas";
import { extractJsonCandidate } from "@features/analyze/llmJson";
import {
  defaultModelForProvider,
  deriveNextAction,
  deriveProviderStatus,
  deriveRootCause,
  extractProviderErrorCode,
  getProviderContractCapabilities,
  isAccountBlockedErrorCode,
  isNonRepairableContractErrorCode,
  isRepairableContractErrorCode,
  mapErrorToKind,
  looksConfigMissing,
  providerDisplayName,
  resolveJourneyDecision,
  sanitizeRawExcerpt,
  sortProviderDiagnostics,
  type ProviderDiagnostic,
  type SmokeMode,
  PROVIDER_ORDER,
} from "@/features/ai/adminTelemetryDiagnostics";
import { recordAdminAiRun } from "@/features/ai/adminTelemetryStore";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import type { AiErrorKind } from "@core/telemetry/aiUsageTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FULL_SAMPLE_TEXT =
  "In unserer Stadt soll ein autofreier Sonntag pro Monat eingefuehrt werden, um die Luftqualitaet zu verbessern und den OePNV zu staerken. Gleichzeitig gibt es Bedenken wegen Umsatzeinbussen im Einzelhandel und fehlender Barrierefreiheit fuer aeltere Menschen.";

const RUNTIME_SYSTEM_PROMPT =
  "You are the E150 runtime smoke-tester. Return strict RFC8259 JSON with keys: ok (true), ping ('OK'), providerNote (short string).";
const RUNTIME_USER_PROMPT =
  "Runtime probe for admin orchestrator smoke. Respond only with the required JSON object.";
const DIRECT_PROBE_PROMPT =
  "Return only valid JSON: {\"ok\":true,\"ping\":\"pong\",\"provider\":\"<name>\"}. No markdown.";
const FULL_CONTRACT_EXAMPLE = {
  mode: "E150",
  sourceText: "...",
  language: "de",
  claims: [
    {
      id: "claim-1",
      text: "...",
      title: null,
      responsibility: "municipality",
      importance: 3,
      topic: "Mobilitaet",
      domain: "infrastruktur",
      domains: ["infrastruktur"],
      stance: "neutral",
      statementType: "interpretation",
    },
  ],
  findings: [],
  notes: [{ id: "note-1", text: "...", kind: "context" }],
  questions: [{ id: "question-1", text: "...", dimension: "implementation" }],
  missingPerspectives: [],
  knots: [{ id: "knot-1", label: "...", description: "..." }],
  consequences: {
    consequences: [
      {
        id: "consequence-1",
        scope: "local_short",
        statementIndex: 0,
        text: "...",
        confidence: 0.6,
      },
    ],
    responsibilities: [
      {
        id: "responsibility-1",
        level: "municipality",
        actor: "Stadtverwaltung",
        text: "...",
        relevance: 0.7,
      },
    ],
  },
  responsibilityPaths: [
    {
      id: "path-1",
      statementId: "claim-1",
      locale: "de",
      nodes: [
        {
          level: "municipality",
          actorKey: "stadtverwaltung",
          displayName: "Stadtverwaltung",
          description: "...",
          contactUrl: null,
          processHint: "...",
          relevance: 0.8,
        },
      ],
    },
  ],
  eventualities: [
    {
      id: "ev-pro-1",
      statementId: "claim-1",
      label: "Pro",
      narrative: "...",
      stance: "pro",
      likelihood: 0.5,
      impact: 0.6,
      consequences: [],
      responsibilities: [],
      children: [],
    },
  ],
  decisionTrees: [
    {
      id: "tree-1",
      rootStatementId: "claim-1",
      locale: "de",
      options: {
        pro: {
          id: "ev-pro-1",
          statementId: "claim-1",
          label: "Pro",
          narrative: "...",
          stance: "pro",
          likelihood: 0.5,
          impact: 0.6,
          consequences: [],
          responsibilities: [],
          children: [],
        },
        contra: {
          id: "ev-contra-1",
          statementId: "claim-1",
          label: "Contra",
          narrative: "...",
          stance: "contra",
          likelihood: 0.5,
          impact: 0.6,
          consequences: [],
          responsibilities: [],
          children: [],
        },
      },
    },
  ],
  impactAndResponsibility: {
    impacts: [{ type: "local", description: "...", confidence: 0.6 }],
    responsibleActors: [{ level: "municipality", hint: "Stadtverwaltung", confidence: 0.7 }],
  },
  participationCandidates: [],
  report: {
    summary: "...",
    keyConflicts: ["..."],
    facts: {
      local: ["..."],
      international: ["..."],
    },
    openQuestions: ["..."],
    takeaways: ["..."],
  },
};

const FULL_CONTRACT_EXAMPLE_JSON = JSON.stringify(FULL_CONTRACT_EXAMPLE);

const FULL_CONTRACT_SYSTEM_PROMPT = [
  "You are the E150 orchestrator contract tester.",
  "Return exactly one strictly valid RFC8259 JSON object. No markdown. No prose. No code fences. Never return a top-level array.",
  "The first character must be { and the last character must be }. The top-level value must be an object, never an array.",
  "Do not return an array of claims, suggestions, records, candidates, options or alternatives. The response itself must be the AnalyzeResult object.",
  "Do not wrap the AnalyzeResult object in an array. Do not return multiple objects. Do not return a list.",
  "If you have multiple claims or options, put them inside the claims, eventualities or decisionTrees arrays within the single top-level AnalyzeResult object.",
  "You must satisfy the AnalyzeResultSchema exactly.",
  "Do not use string arrays where object arrays are required.",
  "claims must be StatementRecord objects: {id,text,title,responsibility,importance,topic,domain,domains,stance,statementType}. statementType must be exactly one of: fact, interpretation, value, question. Never use policy, action, goal, proposal, measure or recommendation as statementType.",
  "notes must be objects: {id,text,kind}. questions must be objects: {id,text,dimension}. knots must be objects: {id,label,description}.",
  "consequences.consequences must be objects: {id,scope,statementIndex,text,confidence}. Allowed scope: local_short, local_long, national, global, systemic.",
  "consequences.responsibilities must be objects: {id,level,actor,text,relevance}. Allowed level: municipality, district, state, federal, eu, ngo, private, unknown.",
  "responsibilityPaths must be objects: {id,statementId,locale,nodes}. nodes must be objects: {level,actorKey,displayName,description,contactUrl,processHint,relevance}.",
  "eventualities must be EventualityNode objects: {id,statementId,label,narrative,stance,likelihood,impact,consequences,responsibilities,children}. children must be an array.",
  "decisionTrees must be objects: {id,rootStatementId,locale,options}. options must contain pro and contra EventualityNode objects; neutral is optional.",
  "impactAndResponsibility.impacts must be objects: {type,description,confidence}. impactAndResponsibility.responsibleActors must be objects: {level,hint,confidence}.",
  "report.facts.local and report.facts.international must be string arrays. report.keyConflicts, report.openQuestions and report.takeaways must be string arrays.",
  "Use mode exactly E150 and language de.",
  "If uncertain, return empty arrays for optional arrays but never omit required top-level keys.",
  "Minimal valid shape example:",
  FULL_CONTRACT_EXAMPLE_JSON,
].join(" ");

function openAiSmokeModel(): string | undefined {
  return (
    process.env.OPENAI_SMOKE_MODEL ||
    process.env.OPENAI_MODEL2 ||
    process.env.OPENAI_MODEL ||
    undefined
  );
}

function openAiSmokeModelSource(): "OPENAI_SMOKE_MODEL" | "OPENAI_MODEL2" | "OPENAI_MODEL" | "adapter_default" {
  if (process.env.OPENAI_SMOKE_MODEL) return "OPENAI_SMOKE_MODEL";
  if (process.env.OPENAI_MODEL2) return "OPENAI_MODEL2";
  if (process.env.OPENAI_MODEL) return "OPENAI_MODEL";
  return "adapter_default";
}

function openAiSmokeTimeoutMs(): number {
  const raw = Number(process.env.OPENAI_SMOKE_TIMEOUT_MS ?? 30_000);
  return Number.isFinite(raw) && raw > 0 ? raw : 30_000;
}

function openAiSmokeTimeoutSource(): "OPENAI_SMOKE_TIMEOUT_MS" | "default_30000" {
  const raw = Number(process.env.OPENAI_SMOKE_TIMEOUT_MS ?? "");
  return Number.isFinite(raw) && raw > 0 ? "OPENAI_SMOKE_TIMEOUT_MS" : "default_30000";
}

function openAiSmokeMaxOutputTokens(): number {
  const raw = Number(process.env.OPENAI_SMOKE_MAX_OUTPUT_TOKENS ?? 2_200);
  return Number.isFinite(raw) && raw > 0 ? raw : 2_200;
}

function openAiSmokeMaxOutputTokensSource(): "OPENAI_SMOKE_MAX_OUTPUT_TOKENS" | "default_2200" {
  const raw = Number(process.env.OPENAI_SMOKE_MAX_OUTPUT_TOKENS ?? "");
  return Number.isFinite(raw) && raw > 0 ? "OPENAI_SMOKE_MAX_OUTPUT_TOKENS" : "default_2200";
}

type ProviderSmokeState =
  | "ok"
  | "failed"
  | "disabled"
  | "skipped"
  | "cancelled"
  | "running";

type LegacyProviderSmokeResult = {
  providerId: E150ProviderName;
  state: ProviderSmokeState;
  ok: boolean;
  durationMs: number | null;
  errorKind: string | null;
  status: number | null;
  reason: string | null;
  errorMessage: string | null;
  providerErrorCode: string | null;
  model: string | null;
  formatUsed: "json_schema" | "json_object" | null;
  didFallback: boolean | null;
  openaiErrorCode: string | null;
  openaiErrorMessage: string | null;
};

type CreateAnalyzeApiSmoke = {
  state: "ok" | "failed" | "skipped";
  ok: boolean;
  durationMs: number;
  reason: string | null;
  code: string | null;
};

type ProbeSnapshot = {
  provider: E150ProviderName;
  ok: boolean;
  errorKind: string | null;
  durationMs: number;
  status?: number | null;
  checkedAt?: number | null;
};

type OrchestratorSmokeResponse = {
  ok: boolean;
  mode: SmokeMode;
  runId: string;
  correlationId: string;
  startedAt: number;
  finishedAt: number;
  orchestratorOk: boolean;
  bestProviderId?: E150ProviderName | null;
  bestRawText?: string | null;
  rows: ProviderDiagnostic[];
  directContractRows?: ProviderDiagnostic[];
  results: LegacyProviderSmokeResult[];
  error?: string;
  probeStatus?: Record<string, { ok: boolean; errorKind: string | null; durationMs: number }>;
  probes?: Record<
    string,
    {
      ok: boolean;
      errorKind: string | null;
      status?: number | null;
      latencyMs?: number;
      checkedAt?: number | null;
    }
  >;
  createAnalyzeApi: CreateAnalyzeApiSmoke;
};

function cleanJson(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    const firstNewline = cleaned.indexOf("\n");
    if (firstNewline !== -1) cleaned = cleaned.slice(firstNewline + 1);
    const lastFence = cleaned.lastIndexOf("```");
    if (lastFence !== -1) cleaned = cleaned.slice(0, lastFence);
    cleaned = cleaned.trim();
  }
  return cleaned;
}

function normalizeMode(value: string | null): SmokeMode {
  if (!value || value === "runtime") return "runtime_smoke";
  if (value === "probe" || value === "provider_probe") return "provider_probe";
  if (value === "full" || value === "full_contract") return "full_contract";
  return "runtime_smoke";
}

function buildProbeMaps(probes: ProbeSnapshot[] | undefined): Pick<OrchestratorSmokeResponse, "probeStatus" | "probes"> {
  const items = Array.isArray(probes) ? probes : [];
  return {
    probeStatus: Object.fromEntries(
      items.map((probe) => [
        probe.provider,
        {
          ok: probe.ok,
          errorKind: probe.errorKind ?? null,
          durationMs: probe.durationMs,
        },
      ]),
    ),
    probes: Object.fromEntries(
      items.map((probe) => [
        probe.provider,
        {
          ok: probe.ok,
          errorKind: probe.errorKind ?? null,
          status: typeof probe.status === "number" ? probe.status : null,
          latencyMs: probe.durationMs,
          checkedAt: probe.checkedAt ?? null,
        },
      ]),
    ),
  };
}

function validateAnalyzeShapePayload(payload: any): { ok: boolean; message?: string } {
  if (!payload || typeof payload !== "object") return { ok: false, message: "empty payload" };
  if (!Array.isArray(payload.claims)) return { ok: false, message: "claims missing" };
  if (!Array.isArray(payload.notes)) return { ok: false, message: "notes missing" };
  if (!Array.isArray(payload.questions)) return { ok: false, message: "questions missing" };
  if (!Array.isArray(payload.knots)) return { ok: false, message: "knots missing" };
  return { ok: true };
}

function baseDiagnostic(params: {
  provider: E150ProviderName;
  mode: SmokeMode;
  stage: "provider_probe" | "runtime" | "analyze_contract";
  pipeline: "provider_probe" | "orchestrator_smoke";
  model?: string | null;
  status: ProviderDiagnostic["status"];
  errorKind?: AiErrorKind | null;
  providerErrorCode?: string | null;
  httpStatus?: number | null;
  errorMessage?: string | null;
  reason?: string | null;
  validationMode: ProviderDiagnostic["validationMode"];
  providerStatus?: ProviderDiagnostic["providerStatus"];
  adapterStatus?: ProviderDiagnostic["adapterStatus"];
  parseStatus?: ProviderDiagnostic["parseStatus"];
  schemaStatus?: ProviderDiagnostic["schemaStatus"];
  parseError?: string | null;
  schemaError?: string | null;
  schemaPath?: string | null;
  rawExcerpt?: string | null;
  durationMs?: number | null;
  tokensIn?: number | null;
  tokensOut?: number | null;
  fallbackUsed?: boolean | null;
  fallbackReason?: string | null;
  journeyDecision?: ProviderDiagnostic["journeyDecision"];
  strictStatus?: ProviderDiagnostic["strictStatus"];
  strictProviderErrorCode?: string | null;
  strictSchemaPath?: string | null;
  repairAttempted?: boolean;
  repairStatus?: ProviderDiagnostic["repairStatus"];
  repairProviderErrorCode?: string | null;
  repairSchemaPath?: string | null;
  repairReason?: string | null;
  repairUsed?: boolean;
  finalContractStatus?: ProviderDiagnostic["finalContractStatus"];
  formatUsed?: ProviderDiagnostic["formatUsed"];
  didFallback?: boolean | null;
  timeoutMs?: number | null;
  maxOutputTokens?: number | null;
  openaiErrorCode?: string | null;
  openaiErrorMessage?: string | null;
  diagnosticNotes?: string[];
}): ProviderDiagnostic {
  const capabilities = getProviderContractCapabilities(params.provider);
  const row: ProviderDiagnostic = {
    provider: params.provider,
    displayName: providerDisplayName(params.provider),
    model: params.model ?? defaultModelForProvider(params.provider),
    pipeline: params.pipeline,
    mode: params.mode,
    stage: params.stage,
    status: params.status,
    errorKind: params.errorKind ?? null,
    providerErrorCode: params.providerErrorCode ?? null,
    httpStatus: typeof params.httpStatus === "number" ? params.httpStatus : null,
    errorMessage: params.errorMessage ?? null,
    reason: params.reason ?? null,
    validationMode: params.validationMode,
    providerStatus:
      params.providerStatus ?? deriveProviderStatus(params.errorKind ?? null, params.status),
    adapterStatus: params.adapterStatus ?? (params.status === "ok" ? "ok" : "failed"),
    parseStatus: params.parseStatus ?? "not_started",
    schemaStatus: params.schemaStatus ?? "not_started",
    parseError: params.parseError ?? null,
    schemaError: params.schemaError ?? null,
    schemaPath: params.schemaPath ?? null,
    rawExcerpt: sanitizeRawExcerpt(params.rawExcerpt ?? params.errorMessage ?? params.reason ?? null),
    durationMs: typeof params.durationMs === "number" ? params.durationMs : null,
    tokensIn: typeof params.tokensIn === "number" ? params.tokensIn : null,
    tokensOut: typeof params.tokensOut === "number" ? params.tokensOut : null,
    fallbackUsed: typeof params.fallbackUsed === "boolean" ? params.fallbackUsed : null,
    fallbackReason: params.fallbackReason ?? null,
    journeyDecision: params.journeyDecision ?? "selected",
    strictStatus:
      params.strictStatus ??
      (params.status === "ok" ? "ok" : params.status === "config_missing" ? "blocked" : "not_started"),
    strictProviderErrorCode: params.strictProviderErrorCode ?? params.providerErrorCode ?? null,
    strictSchemaPath: params.strictSchemaPath ?? params.schemaPath ?? null,
    repairAttempted: typeof params.repairAttempted === "boolean" ? params.repairAttempted : false,
    repairStatus: params.repairStatus ?? "not_attempted",
    repairProviderErrorCode: params.repairProviderErrorCode ?? null,
    repairSchemaPath: params.repairSchemaPath ?? null,
    repairReason: params.repairReason ?? null,
    repairUsed: typeof params.repairUsed === "boolean" ? params.repairUsed : false,
    finalContractStatus:
      params.finalContractStatus ??
      (params.status === "ok"
        ? "strict_ok"
        : params.status === "config_missing"
          ? "blocked"
          : "not_started"),
    nativeStrategy: capabilities.nativeStrategy,
    preferredContractStrategy: capabilities.preferredContractStrategy,
    fallbackStrategy: capabilities.fallbackStrategy,
    supportsStrictJsonSchema: capabilities.supportsStrictJsonSchema,
    supportsJsonObjectMode: capabilities.supportsJsonObjectMode,
    supportsPromptEnvelope: capabilities.supportsPromptEnvelope,
    supportsRepairAttempt: capabilities.supportsRepairAttempt,
    canBeUsedAsRepairProvider: capabilities.canBeUsedAsRepairProvider,
    knownBlockers: [...capabilities.knownBlockers],
    nonRepairableErrorCodes: [...capabilities.nonRepairableErrorCodes],
    diagnosticNotes: params.diagnosticNotes ?? [...capabilities.diagnosticNotes],
    formatUsed: params.formatUsed ?? null,
    didFallback: typeof params.didFallback === "boolean" ? params.didFallback : null,
    timeoutMs: typeof params.timeoutMs === "number" ? params.timeoutMs : null,
    maxOutputTokens: typeof params.maxOutputTokens === "number" ? params.maxOutputTokens : null,
    openaiErrorCode: params.openaiErrorCode ?? null,
    openaiErrorMessage: params.openaiErrorMessage ?? null,
    rootCause: "RUNTIME_FAILED",
    nextAction: "Adapter-/Runtime-Logs pruefen.",
  };

  row.rootCause = deriveRootCause(row);
  row.nextAction = deriveNextAction(row);
  return row;
}

function legacyState(status: ProviderDiagnostic["status"], journeyDecision: ProviderDiagnostic["journeyDecision"]): ProviderSmokeState {
  if (status === "ok") return "ok";
  if (status === "skipped") return "skipped";
  if (journeyDecision === "not_in_plan") return "skipped";
  if (status === "config_missing") return "disabled";
  return "failed";
}

function toLegacyResult(row: ProviderDiagnostic): LegacyProviderSmokeResult {
  return {
    providerId: row.provider,
    state: legacyState(row.status, row.journeyDecision),
    ok: row.status === "ok",
    durationMs: row.durationMs,
    errorKind: row.errorKind,
    status: row.httpStatus,
    reason: row.reason,
    errorMessage: row.errorMessage,
    providerErrorCode: row.providerErrorCode,
    model: row.model,
    formatUsed: row.formatUsed,
    didFallback: row.didFallback ?? row.fallbackUsed,
    openaiErrorCode: row.provider === "openai" ? row.openaiErrorCode ?? row.providerErrorCode : null,
    openaiErrorMessage: row.provider === "openai" ? row.openaiErrorMessage ?? row.errorMessage : null,
  };
}

function extractOrchestratorMeta(error: unknown): Partial<E150OrchestratorMeta> | null {
  const rawMeta = (error as { meta?: unknown })?.meta;
  if (!rawMeta || typeof rawMeta !== "object") return null;
  return rawMeta as Partial<E150OrchestratorMeta>;
}

function mapMatrixStatusToDiagnosticStatus(
  entry: ProviderMatrixEntry,
  journeyDecision: ProviderDiagnostic["journeyDecision"],
): ProviderDiagnostic["status"] {
  if (entry.state === "ok") return "ok";
  if (entry.state === "skipped") return "skipped";
  if (entry.state === "disabled") {
    return journeyDecision === "config_missing" ? "config_missing" : "skipped";
  }
  if (entry.state === "running") return "degraded";
  return "failed";
}

function mapRowsFromProviderMatrix(
  mode: SmokeMode,
  providerMatrix: ProviderMatrixEntry[] | undefined,
  probes: ProbeSnapshot[] | undefined,
  fallbackError: string | null,
): ProviderDiagnostic[] {
  const matrix = Array.isArray(providerMatrix) ? providerMatrix : [];
  const probeMap = new Map((Array.isArray(probes) ? probes : []).map((item) => [item.provider, item]));

  if (matrix.length === 0) {
    return sortProviderDiagnostics(
      PROVIDER_ORDER.map((provider) =>
        baseDiagnostic({
          provider,
          mode,
          stage: mode === "provider_probe" ? "provider_probe" : mode === "runtime_smoke" ? "runtime" : "analyze_contract",
          pipeline: mode === "provider_probe" ? "provider_probe" : "orchestrator_smoke",
          status: "failed",
          errorKind: "UNKNOWN",
          errorMessage: fallbackError ?? "orchestrator_failed_without_provider_matrix",
          reason: fallbackError ?? "orchestrator_failed_without_provider_matrix",
          validationMode: mode === "runtime_smoke" ? "json_only" : mode === "full_contract" ? "analyze_schema" : "none",
          adapterStatus: "failed",
          parseStatus: "not_started",
          schemaStatus: "not_started",
          journeyDecision: "selected",
        }),
      ),
    );
  }

  return sortProviderDiagnostics(
    matrix.map((entry) => {
      const reason = entry.reason ?? entry.errorMessage ?? null;
      const providerCode = entry.providerErrorCode ?? entry.openaiErrorCode ?? null;
      const journeyDecision = resolveJourneyDecision(entry.state, reason);
      const status = mapMatrixStatusToDiagnosticStatus(entry, journeyDecision);
      const probe = probeMap.get(entry.provider);
      const derivedProviderStatus = probe
        ? probe.ok
          ? "reachable"
          : deriveProviderStatus((probe.errorKind as AiErrorKind | null) ?? null, status)
        : deriveProviderStatus(entry.errorKind ?? null, status);
      const adapterStatus: ProviderDiagnostic["adapterStatus"] =
        entry.state === "ok"
          ? "ok"
          : entry.state === "disabled" || entry.state === "skipped"
            ? "not_started"
            : "failed";
      const parseStatus: ProviderDiagnostic["parseStatus"] =
        mode === "runtime_smoke"
          ? entry.state === "ok"
            ? "ok"
            : entry.errorKind === "BAD_JSON" || providerCode === "BAD_JSON"
              ? "failed"
              : "not_started"
          : mode === "full_contract"
            ? entry.state === "ok"
              ? "ok"
              : entry.errorKind === "BAD_JSON" || providerCode === "BAD_JSON"
                ? "failed"
                : providerCode === "SCHEMA_INVALID"
                  ? "ok"
                : "not_started"
            : "not_started";
      const schemaStatus: ProviderDiagnostic["schemaStatus"] =
        mode === "full_contract"
          ? entry.state === "ok"
            ? "ok"
            : providerCode === "SCHEMA_INVALID"
              ? "failed"
              : "not_started"
          : "not_started";

      return baseDiagnostic({
        provider: entry.provider,
        mode,
        stage: mode === "runtime_smoke" ? "runtime" : mode === "full_contract" ? "analyze_contract" : "provider_probe",
        pipeline: mode === "provider_probe" ? "provider_probe" : "orchestrator_smoke",
        model: entry.model ?? defaultModelForProvider(entry.provider),
        status,
        errorKind: entry.errorKind ?? null,
        providerErrorCode: providerCode,
        httpStatus: entry.status ?? probe?.status ?? null,
        errorMessage: entry.errorMessage ?? reason,
        reason,
        validationMode: mode === "runtime_smoke" ? "json_only" : mode === "full_contract" ? "analyze_schema" : "none",
        providerStatus: derivedProviderStatus,
        adapterStatus,
        parseStatus,
        schemaStatus,
        parseError: providerCode === "BAD_JSON" ? entry.parseError ?? entry.errorMessage ?? reason : null,
        schemaError: providerCode === "SCHEMA_INVALID" ? entry.schemaError ?? entry.errorMessage ?? reason : null,
        schemaPath: providerCode === "SCHEMA_INVALID" ? entry.schemaPath ?? null : null,
        rawExcerpt: entry.rawExcerpt ?? entry.errorMessage ?? reason ?? null,
        durationMs: entry.durationMs ?? probe?.durationMs ?? null,
        fallbackUsed: typeof entry.didFallback === "boolean" ? entry.didFallback : null,
        fallbackReason:
          entry.didFallback === true
            ? entry.openaiErrorMessage ?? entry.openaiErrorCode ?? entry.providerErrorCode ?? reason
            : null,
        formatUsed: entry.formatUsed ?? null,
        didFallback: typeof entry.didFallback === "boolean" ? entry.didFallback : null,
        openaiErrorCode: entry.openaiErrorCode ?? null,
        openaiErrorMessage: entry.openaiErrorMessage ?? null,
        journeyDecision,
      });
    }),
  );
}

function validateProbePayload(rawText: string): {
  ok: boolean;
  parseStatus: ProviderDiagnostic["parseStatus"];
  parseError: string | null;
} {
  const cleaned = cleanJson(rawText ?? "");
  if (!cleaned) {
    return { ok: false, parseStatus: "failed", parseError: "empty_output" };
  }

  const normalized = cleaned.trim().toLowerCase();
  if (normalized === "pong" || normalized === "ok") {
    return { ok: true, parseStatus: "not_started", parseError: null };
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object") {
      return { ok: true, parseStatus: "ok", parseError: null };
    }
    return { ok: false, parseStatus: "failed", parseError: "json_not_object" };
  } catch (error: any) {
    return {
      ok: false,
      parseStatus: "failed",
      parseError: error?.message ?? "json_parse_failed",
    };
  }
}

function ariConfigMissingReason(): string | null {
  const hasBase = Boolean(
    process.env.ARI_BASE_URL ||
      process.env.ARI_URL ||
      process.env.ARI_API_URL ||
      process.env.YOUCOM_ARI_API_URL,
  );
  const hasKey = Boolean(process.env.ARI_API_KEY || process.env.YOUCOM_ARI_API_KEY);
  if (hasBase && hasKey) return null;
  return "missing ARI_BASE_URL / ARI_API_KEY or compatible env";
}

function configMissingReason(provider: E150ProviderName): string | null {
  switch (provider) {
    case "openai":
      return process.env.OPENAI_API_KEY ? null : "missing OPENAI_API_KEY";
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY ? null : "missing ANTHROPIC_API_KEY";
    case "mistral":
      return process.env.MISTRAL_API_KEY ? null : "missing MISTRAL_API_KEY";
    case "gemini":
      return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY
        ? null
        : "missing GEMINI_API_KEY / GOOGLE_API_KEY";
    case "ari":
      return ariConfigMissingReason();
    default:
      return "missing config";
  }
}

async function runDirectProviderProbe(provider: E150ProviderName): Promise<ProviderDiagnostic> {
  const missingReason = configMissingReason(provider);
  if (missingReason) {
    return baseDiagnostic({
      provider,
      mode: "provider_probe",
      stage: "provider_probe",
      pipeline: "provider_probe",
      model: defaultModelForProvider(provider),
      status: "config_missing",
      errorKind: "INVALID_API_KEY",
      providerErrorCode: "CONFIG_MISSING",
      httpStatus: null,
      errorMessage: missingReason,
      reason: missingReason,
      validationMode: "none",
      providerStatus: "unknown",
      adapterStatus: "not_started",
      parseStatus: "not_started",
      schemaStatus: "not_started",
      rawExcerpt: missingReason,
      durationMs: 0,
      journeyDecision: "config_missing",
    });
  }

  const started = Date.now();
  try {
    let text = "";
    let model: string | undefined;
    let tokensIn: number | undefined;
    let tokensOut: number | undefined;

    if (provider === "openai") {
      const res = await callOpenAI({
        prompt: DIRECT_PROBE_PROMPT.replace("<name>", "openai"),
        asJson: true,
        forceJsonFormat: true,
        maxOutputTokens: 160,
      });
      text = res.text;
      model = res.model;
      tokensIn = res.tokensIn;
      tokensOut = res.tokensOut;
    } else if (provider === "anthropic") {
      const res = await callAnthropic({
        prompt: DIRECT_PROBE_PROMPT.replace("<name>", "anthropic"),
        maxOutputTokens: 160,
      });
      text = res.text;
      model = res.model;
      tokensIn = res.tokensIn;
      tokensOut = res.tokensOut;
    } else if (provider === "mistral") {
      const res = await callMistral({
        prompt: DIRECT_PROBE_PROMPT.replace("<name>", "mistral"),
        maxOutputTokens: 160,
      });
      text = res.text;
      model = res.model;
      tokensIn = res.tokensIn;
      tokensOut = res.tokensOut;
    } else if (provider === "gemini") {
      const res = await callGemini({
        prompt: DIRECT_PROBE_PROMPT.replace("<name>", "gemini"),
        maxOutputTokens: 160,
        expectJson: true,
      });
      text = res.text;
      model = res.model;
      tokensIn = res.tokensIn;
      tokensOut = res.tokensOut;
    } else {
      const res = await callAriLLM({
        prompt: DIRECT_PROBE_PROMPT.replace("<name>", "ari"),
        asJson: true,
        maxOutputTokens: 160,
      });
      text = res.text;
      model = res.model;
      tokensIn = res.tokensIn;
      tokensOut = res.tokensOut;
    }

    const payload = validateProbePayload(text ?? "");
    if (!payload.ok) {
      const parseError = payload.parseError ?? "json_parse_failed";
      return baseDiagnostic({
        provider,
        mode: "provider_probe",
        stage: "provider_probe",
        pipeline: "provider_probe",
        model: model ?? defaultModelForProvider(provider),
        status: "failed",
        errorKind: "BAD_JSON",
        providerErrorCode: "BAD_JSON",
        httpStatus: 200,
        errorMessage: parseError,
        reason: parseError,
        validationMode: "none",
        providerStatus: "reachable",
        adapterStatus: "failed",
        parseStatus: payload.parseStatus,
        schemaStatus: "not_started",
        parseError,
        rawExcerpt: text,
        durationMs: Date.now() - started,
        tokensIn,
        tokensOut,
        journeyDecision: "selected",
      });
    }

    return baseDiagnostic({
      provider,
      mode: "provider_probe",
      stage: "provider_probe",
      pipeline: "provider_probe",
      model: model ?? defaultModelForProvider(provider),
      status: "ok",
      errorKind: null,
      providerErrorCode: null,
      httpStatus: 200,
      errorMessage: null,
      reason: null,
      validationMode: "none",
      providerStatus: "reachable",
      adapterStatus: "ok",
      parseStatus: payload.parseStatus,
      schemaStatus: "not_started",
      rawExcerpt: text,
      durationMs: Date.now() - started,
      tokensIn,
      tokensOut,
      journeyDecision: "selected",
    });
  } catch (error: any) {
    const errorKind = mapErrorToKind(error);
    const providerCode = extractProviderErrorCode(error);
    const status = typeof error?.status === "number" ? error.status : null;
    return baseDiagnostic({
      provider,
      mode: "provider_probe",
      stage: "provider_probe",
      pipeline: "provider_probe",
      model: (error as any)?.meta?.model ?? defaultModelForProvider(provider),
      status: looksConfigMissing(error?.message) ? "config_missing" : "failed",
      errorKind,
      providerErrorCode: providerCode,
      httpStatus: status,
      errorMessage: error?.message ?? "provider_probe_failed",
      reason: error?.message ?? "provider_probe_failed",
      validationMode: "none",
      providerStatus: deriveProviderStatus(errorKind, "failed"),
      adapterStatus: "failed",
      parseStatus: "not_started",
      schemaStatus: "not_started",
      rawExcerpt: error?.payload ?? error?.message,
      durationMs: Date.now() - started,
      journeyDecision: looksConfigMissing(error?.message) ? "config_missing" : "selected",
    });
  }
}

function looksLikeHtmlOrUpstreamError(rawText: string): boolean {
  const s = rawText.trim().toLowerCase();
  if (!s) return false;
  return (
    s.startsWith("<!doctype html") ||
    s.startsWith("<html") ||
    s.includes("<body") ||
    s.includes("cloudflare") ||
    s.includes("ddos-guard") ||
    s.includes("bad gateway") ||
    s.includes("502") ||
    s.includes("504 gateway") ||
    s.includes("upstream")
  );
}

function topLevelJsonKind(value: unknown): "object" | "array" | "string" | "number" | "boolean" | "null" | "unknown" {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  const type = typeof value;
  if (type === "object") return "object";
  if (type === "string") return "string";
  if (type === "number") return "number";
  if (type === "boolean") return "boolean";
  return "unknown";
}

function topLevelContractErrorCode(kind: ReturnType<typeof topLevelJsonKind>): string {
  if (kind === "array") return "TOP_LEVEL_ARRAY";
  if (kind === "string") return "TOP_LEVEL_STRING";
  if (kind === "null") return "TOP_LEVEL_NULL";
  return "TOP_LEVEL_NOT_OBJECT";
}

type FullContractValidation = {
  ok: boolean;
  errorKind: AiErrorKind | null;
  providerErrorCode: string | null;
  errorMessage: string | null;
  reason: string | null;
  adapterStatus: ProviderDiagnostic["adapterStatus"];
  parseStatus: ProviderDiagnostic["parseStatus"];
  schemaStatus: ProviderDiagnostic["schemaStatus"];
  parseError: string | null;
  schemaError: string | null;
  schemaPath: string | null;
  rawExcerpt: string | null;
};

function validateFullContractPayload(rawText: string): FullContractValidation {
  const raw = rawText ?? "";
  const candidate = extractJsonCandidate(raw) ?? cleanJson(raw);
  const cleaned = candidate.trim();

  if (!cleaned) {
    const reason = looksLikeHtmlOrUpstreamError(raw)
      ? "upstream_bad_response"
      : "no_json_object_found";
    return {
      ok: false,
      errorKind: looksLikeHtmlOrUpstreamError(raw) ? "INTERNAL" : "BAD_JSON",
      providerErrorCode: looksLikeHtmlOrUpstreamError(raw) ? "UPSTREAM_BAD_RESPONSE" : "BAD_JSON",
      errorMessage: reason,
      reason,
      adapterStatus: "failed",
      parseStatus: "failed",
      schemaStatus: "not_started",
      parseError: reason,
      schemaError: null,
      schemaPath: null,
      rawExcerpt: raw.slice(0, 500) || null,
    };
  }

  if (looksLikeHtmlOrUpstreamError(cleaned)) {
    return {
      ok: false,
      errorKind: "INTERNAL",
      providerErrorCode: "UPSTREAM_BAD_RESPONSE",
      errorMessage: "provider_returned_html_or_upstream_error",
      reason: "provider_returned_html_or_upstream_error",
      adapterStatus: "failed",
      parseStatus: "failed",
      schemaStatus: "not_started",
      parseError: "provider_returned_html_or_upstream_error",
      schemaError: null,
      schemaPath: null,
      rawExcerpt: cleaned.slice(0, 500),
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error: any) {
    const parseError = error?.message ?? "json_parse_failed";
    return {
      ok: false,
      errorKind: "BAD_JSON",
      providerErrorCode: "BAD_JSON",
      errorMessage: parseError,
      reason: parseError,
      adapterStatus: "failed",
      parseStatus: "failed",
      schemaStatus: "not_started",
      parseError,
      schemaError: null,
      schemaPath: null,
      rawExcerpt: cleaned.slice(0, 500),
    };
  }

  const parsedKind = topLevelJsonKind(parsed);
  if (parsedKind !== "object") {
    const code = topLevelContractErrorCode(parsedKind);
    const message = `expected top-level JSON object, received ${parsedKind}`;
    return {
      ok: false,
      errorKind: "INTERNAL",
      providerErrorCode: code,
      errorMessage: message,
      reason: message,
      adapterStatus: "failed",
      parseStatus: "ok",
      schemaStatus: "failed",
      parseError: null,
      schemaError: message,
      schemaPath: "$",
      rawExcerpt: cleaned.slice(0, 500),
    };
  }

  const schema = AnalyzeResultSchema.safeParse(parsed);
  if (!schema.success) {
    const first = schema.error.issues[0];
    const schemaError = first?.message ?? "schema_validation_failed";
    return {
      ok: false,
      errorKind: "INTERNAL",
      providerErrorCode: "SCHEMA_INVALID",
      errorMessage: schemaError,
      reason: schemaError,
      adapterStatus: "failed",
      parseStatus: "ok",
      schemaStatus: "failed",
      parseError: null,
      schemaError,
      schemaPath: Array.isArray(first?.path) ? first.path.join(".") || "$" : null,
      rawExcerpt: cleaned.slice(0, 500),
    };
  }

  return {
    ok: true,
    errorKind: null,
    providerErrorCode: null,
    errorMessage: null,
    reason: null,
    adapterStatus: "ok",
    parseStatus: "ok",
    schemaStatus: "ok",
    parseError: null,
    schemaError: null,
    schemaPath: null,
    rawExcerpt: cleaned.slice(0, 500),
  };
}

function normalizeErrorCode(input: {
  providerErrorCode: string | null | undefined;
  errorKind: AiErrorKind | null | undefined;
  httpStatus: number | null | undefined;
  message: string | null | undefined;
}): string | null {
  const providerCode = typeof input.providerErrorCode === "string" && input.providerErrorCode.trim().length > 0
    ? input.providerErrorCode.trim().toUpperCase()
    : null;
  const message = (input.message ?? "").toLowerCase();
  const status = typeof input.httpStatus === "number" ? input.httpStatus : null;
  const kind = input.errorKind ?? null;

  if (looksConfigMissing(input.message)) return "CONFIG_MISSING";
  if (message.includes("openai_empty_output")) return "OPENAI_EMPTY_OUTPUT";
  if (status === 402 || providerCode === "PAYMENT_REQUIRED" || message.includes("payment required")) {
    return "PAYMENT_REQUIRED";
  }
  if (
    status === 429 ||
    providerCode === "RESOURCE_EXHAUSTED" ||
    providerCode === "QUOTA_EXCEEDED" ||
    providerCode === "RATE_LIMIT" ||
    message.includes("resource_exhausted") ||
    message.includes("quota")
  ) {
    return providerCode === "RESOURCE_EXHAUSTED" || message.includes("resource_exhausted")
      ? "RESOURCE_EXHAUSTED"
      : "RATE_LIMIT";
  }
  if (status === 503 || providerCode === "UNAVAILABLE" || message.includes("unavailable")) {
    return "UNAVAILABLE";
  }
  if (status === 401 || status === 403 || kind === "UNAUTHORIZED" || kind === "INVALID_API_KEY") {
    return "UNAUTHORIZED";
  }
  if (kind === "TIMEOUT") return "TIMEOUT";
  if (providerCode) return providerCode;
  if (kind === "BAD_JSON") return "BAD_JSON";
  return null;
}

function isBlockedContractError(code: string | null): boolean {
  if (!code) return false;
  if (isAccountBlockedErrorCode(code)) return true;
  return code === "TIMEOUT" || code === "UNAVAILABLE";
}

function mergeDiagnosticNotes(
  provider: E150ProviderName,
  extraNotes: Array<string | null | undefined>,
): string[] {
  const capabilities = getProviderContractCapabilities(provider);
  const notes = [...capabilities.diagnosticNotes];
  for (const note of extraNotes) {
    if (typeof note !== "string") continue;
    const trimmed = note.trim();
    if (!trimmed) continue;
    notes.push(trimmed);
  }
  return Array.from(new Set(notes));
}

function openAiSmokeConfigDiagnosticNote(): string {
  const resolvedModel = openAiSmokeModel() ?? defaultModelForProvider("openai");
  const modelSource = openAiSmokeModelSource();
  const timeoutMs = openAiSmokeTimeoutMs();
  const timeoutSource = openAiSmokeTimeoutSource();
  const maxOutputTokens = openAiSmokeMaxOutputTokens();
  const maxOutputSource = openAiSmokeMaxOutputTokensSource();
  return `OpenAI smoke profile: model=${resolvedModel} (source=${modelSource}), timeoutMs=${timeoutMs} (source=${timeoutSource}), maxOutputTokens=${maxOutputTokens} (source=${maxOutputSource}).`;
}

function isRepairAttemptAllowedForStrictFailure(params: {
  provider: E150ProviderName;
  strictProviderErrorCode: string | null;
  strictStatusCode: number | null;
  strictMessage: string | null;
}): { allowed: boolean; reason: string | null; blocked: boolean } {
  const capabilities = getProviderContractCapabilities(params.provider);
  const normalizedCode = normalizeErrorCode({
    providerErrorCode: params.strictProviderErrorCode,
    errorKind: null,
    httpStatus: params.strictStatusCode,
    message: params.strictMessage,
  });

  if (!capabilities.supportsRepairAttempt || !capabilities.canBeUsedAsRepairProvider) {
    return { allowed: false, reason: "repair_not_supported_for_provider", blocked: false };
  }
  if (!normalizedCode) {
    return { allowed: false, reason: "repair_not_attempted_unknown_error", blocked: false };
  }
  if (capabilities.accountBlockedCodes.includes(normalizedCode) || isBlockedContractError(normalizedCode)) {
    return { allowed: false, reason: "account_or_runtime_blocked", blocked: true };
  }
  if (capabilities.nonRepairableErrorCodes.includes(normalizedCode) || isNonRepairableContractErrorCode(normalizedCode)) {
    return { allowed: false, reason: "non_repairable_error_code", blocked: false };
  }
  if (!isRepairableContractErrorCode(normalizedCode)) {
    return { allowed: false, reason: "strict_error_not_repairable", blocked: false };
  }
  return { allowed: true, reason: null, blocked: false };
}

function buildDirectFullContractPrompt(provider: E150ProviderName): string {
  const providerHint =
    provider === "anthropic"
      ? [
          "Anthropic-specific contract reminder:",
          "Return one JSON object only. Do not return a JSON array.",
          "Your first non-whitespace character must be {.",
          "Your last non-whitespace character must be }.",
          "The top-level object itself is the AnalyzeResult envelope.",
        ].join(" ")
      : provider === "mistral"
        ? [
            "Mistral-specific contract reminder:",
            "response_format=json_object is active. Use it to return one object envelope.",
            "Do not return an array of claims. Do not return a list of records.",
            "The top-level object itself is the AnalyzeResult envelope.",
          ].join(" ")
        : provider === "openai"
          ? [
              "OpenAI-specific contract reminder:",
              "Structured JSON output is requested. Return the AnalyzeResult object itself.",
              "Do not wrap the object in an array.",
            ].join(" ")
          : [
              "Contract reminder:",
              "Return exactly one AnalyzeResult object, not an array.",
            ].join(" ");

  return `${FULL_CONTRACT_SYSTEM_PROMPT}\n\n${providerHint}\n\nInput:\n${FULL_SAMPLE_TEXT}`;
}

function buildFullContractRepairPrompt(
  provider: E150ProviderName,
  rawText: string,
  strictError: { providerErrorCode: string | null; schemaPath: string | null; message: string | null },
): string {
  const capabilities = getProviderContractCapabilities(provider);
  const strictErrorParts = [
    `code=${strictError.providerErrorCode ?? "unknown"}`,
    `schemaPath=${strictError.schemaPath ?? "$"}`,
    `message=${strictError.message ?? "unknown"}`,
  ].join(" ; ");
  const rawExcerpt = rawText.slice(0, 10_000);

  return [
    "You are repairing a failed AnalyzeResult contract response.",
    "Convert the provider output into exactly one AnalyzeResult JSON object.",
    "Do not output markdown. Do not output a list. Do not output explanations.",
    "The top-level output must be a single JSON object. First non-whitespace character must be '{'.",
    "Last non-whitespace character must be '}'.",
    `Provider capability strategy: ${capabilities.preferredContractStrategy}.`,
    "Target contract constraints:",
    FULL_CONTRACT_SYSTEM_PROMPT,
    "Strict validation failure:",
    strictErrorParts,
    "Raw provider output to repair:",
    rawExcerpt,
    "Minimal valid AnalyzeResult example:",
    FULL_CONTRACT_EXAMPLE_JSON,
  ].join("\n\n");
}

async function executeDirectFullContractCall(params: {
  provider: E150ProviderName;
  prompt: string;
  timeoutMs?: number;
  maxOutputTokens?: number;
  repairAttempt?: boolean;
}): Promise<{
  text: string;
  model: string | null;
  tokensIn: number | null;
  tokensOut: number | null;
  formatUsed: "json_schema" | "json_object" | null;
  didFallback: boolean | null;
  openaiErrorCode: string | null;
  openaiErrorMessage: string | null;
  timeoutMs: number | null;
  maxOutputTokens: number | null;
}> {
  const provider = params.provider;
  if (provider === "openai") {
    const timeoutMs = params.timeoutMs ?? openAiSmokeTimeoutMs();
    const maxOutputTokens = params.maxOutputTokens ?? openAiSmokeMaxOutputTokens();
    const res = await callOpenAI({
      prompt: params.prompt,
      asJson: true,
      forceJsonFormat: true,
      model: openAiSmokeModel(),
      timeoutMs,
      maxOutputTokens,
    });
    return {
      text: res.text,
      model: res.model ?? defaultModelForProvider(provider),
      tokensIn: res.tokensIn ?? null,
      tokensOut: res.tokensOut ?? null,
      formatUsed: res.formatUsed ?? null,
      didFallback: typeof res.didFallback === "boolean" ? res.didFallback : null,
      openaiErrorCode: res.openaiErrorCode ?? null,
      openaiErrorMessage: res.openaiErrorMessage ?? null,
      timeoutMs,
      maxOutputTokens,
    };
  }
  if (provider === "anthropic") {
    const res = await callAnthropic({
      prompt: params.prompt,
      maxOutputTokens: params.maxOutputTokens ?? (params.repairAttempt ? 2_300 : 2_600),
    });
    return {
      text: res.text,
      model: res.model ?? defaultModelForProvider(provider),
      tokensIn: res.tokensIn ?? null,
      tokensOut: res.tokensOut ?? null,
      formatUsed: null,
      didFallback: null,
      openaiErrorCode: null,
      openaiErrorMessage: null,
      timeoutMs: null,
      maxOutputTokens: null,
    };
  }
  if (provider === "mistral") {
    const res = await callMistral({
      prompt: params.prompt,
      maxOutputTokens: params.maxOutputTokens ?? (params.repairAttempt ? 2_300 : 2_600),
    });
    return {
      text: res.text,
      model: res.model ?? defaultModelForProvider(provider),
      tokensIn: res.tokensIn ?? null,
      tokensOut: res.tokensOut ?? null,
      formatUsed: "json_object",
      didFallback: null,
      openaiErrorCode: null,
      openaiErrorMessage: null,
      timeoutMs: null,
      maxOutputTokens: null,
    };
  }
  if (provider === "gemini") {
    const res = await callGemini({
      prompt: params.prompt,
      maxOutputTokens: params.maxOutputTokens ?? (params.repairAttempt ? 2_300 : 2_600),
      expectJson: true,
    });
    return {
      text: res.text,
      model: res.model ?? defaultModelForProvider(provider),
      tokensIn: res.tokensIn ?? null,
      tokensOut: res.tokensOut ?? null,
      formatUsed: "json_object",
      didFallback: null,
      openaiErrorCode: null,
      openaiErrorMessage: null,
      timeoutMs: null,
      maxOutputTokens: null,
    };
  }

  const res = await callAriLLM({
    prompt: params.prompt,
    asJson: true,
    maxOutputTokens: params.maxOutputTokens ?? (params.repairAttempt ? 2_300 : 2_600),
  });
  return {
    text: res.text,
    model: res.model ?? defaultModelForProvider(provider),
    tokensIn: res.tokensIn ?? null,
    tokensOut: res.tokensOut ?? null,
    formatUsed: null,
    didFallback: null,
    openaiErrorCode: null,
    openaiErrorMessage: null,
    timeoutMs: null,
    maxOutputTokens: null,
  };
}

async function runFullContractRepairAttempt(params: {
  provider: E150ProviderName;
  rawText: string;
  strictValidation: FullContractValidation;
}): Promise<{
  attempted: boolean;
  blocked: boolean;
  reason: string | null;
  status: ProviderDiagnostic["repairStatus"];
  providerErrorCode: string | null;
  schemaPath: string | null;
  errorKind: AiErrorKind | null;
  errorMessage: string | null;
  parseStatus: ProviderDiagnostic["parseStatus"];
  schemaStatus: ProviderDiagnostic["schemaStatus"];
  rawExcerpt: string | null;
}> {
  const strictCode = normalizeErrorCode({
    providerErrorCode: params.strictValidation.providerErrorCode,
    errorKind: params.strictValidation.errorKind,
    httpStatus: null,
    message: params.strictValidation.errorMessage,
  });
  const gate = isRepairAttemptAllowedForStrictFailure({
    provider: params.provider,
    strictProviderErrorCode: strictCode,
    strictStatusCode: null,
    strictMessage: params.strictValidation.errorMessage,
  });
  if (!gate.allowed) {
    return {
      attempted: false,
      blocked: gate.blocked,
      reason: gate.reason,
      status: gate.blocked ? "blocked" : "not_attempted",
      providerErrorCode: strictCode,
      schemaPath: params.strictValidation.schemaPath,
      errorKind: null,
      errorMessage: params.strictValidation.errorMessage,
      parseStatus: "not_started",
      schemaStatus: "not_started",
      rawExcerpt: null,
    };
  }

  const repairPrompt = buildFullContractRepairPrompt(params.provider, params.rawText, {
    providerErrorCode: strictCode,
    schemaPath: params.strictValidation.schemaPath,
    message: params.strictValidation.errorMessage,
  });

  try {
    const repairCall = await executeDirectFullContractCall({
      provider: params.provider,
      prompt: repairPrompt,
      timeoutMs: params.provider === "openai" ? 30_000 : undefined,
      repairAttempt: true,
    });
    const validation = validateFullContractPayload(repairCall.text ?? "");
    if (validation.ok) {
      return {
        attempted: true,
        blocked: false,
        reason: "repair_strict_ok",
        status: "ok",
        providerErrorCode: null,
        schemaPath: null,
        errorKind: null,
        errorMessage: null,
        parseStatus: "ok",
        schemaStatus: "ok",
        rawExcerpt: validation.rawExcerpt,
      };
    }

    const repairCode = normalizeErrorCode({
      providerErrorCode: validation.providerErrorCode,
      errorKind: validation.errorKind,
      httpStatus: null,
      message: validation.errorMessage,
    });
    const blocked = isBlockedContractError(repairCode);
    return {
      attempted: true,
      blocked,
      reason: validation.reason,
      status: blocked ? "blocked" : "failed",
      providerErrorCode: repairCode,
      schemaPath: validation.schemaPath,
      errorKind: validation.errorKind,
      errorMessage: validation.errorMessage,
      parseStatus: validation.parseStatus,
      schemaStatus: validation.schemaStatus,
      rawExcerpt: validation.rawExcerpt,
    };
  } catch (error: any) {
    const errorKind = mapErrorToKind(error);
    const code = normalizeErrorCode({
      providerErrorCode: extractProviderErrorCode(error),
      errorKind,
      httpStatus: typeof error?.status === "number" ? error.status : null,
      message: error?.message ?? null,
    });
    const blocked = isBlockedContractError(code);
    return {
      attempted: true,
      blocked,
      reason: error?.message ?? "repair_attempt_failed",
      status: blocked ? "blocked" : "failed",
      providerErrorCode: code,
      schemaPath: null,
      errorKind,
      errorMessage: error?.message ?? "repair_attempt_failed",
      parseStatus: "not_started",
      schemaStatus: "not_started",
      rawExcerpt: sanitizeRawExcerpt(error?.payload ?? error?.message ?? null),
    };
  }
}

async function runDirectFullContractProvider(provider: E150ProviderName): Promise<ProviderDiagnostic> {
  const missingReason = configMissingReason(provider);
  const isOpenAi = provider === "openai";
  const openAiTimeoutMs = isOpenAi ? openAiSmokeTimeoutMs() : null;
  const openAiMaxOutputTokens = isOpenAi ? openAiSmokeMaxOutputTokens() : null;
  const openAiProfileNote = isOpenAi ? openAiSmokeConfigDiagnosticNote() : null;
  if (missingReason) {
    return baseDiagnostic({
      provider,
      mode: "full_contract",
      stage: "analyze_contract",
      pipeline: "provider_probe",
      model: defaultModelForProvider(provider),
      status: "config_missing",
      errorKind: "INVALID_API_KEY",
      providerErrorCode: "CONFIG_MISSING",
      httpStatus: null,
      errorMessage: missingReason,
      reason: missingReason,
      validationMode: "analyze_schema",
      providerStatus: "unknown",
      adapterStatus: "not_started",
      parseStatus: "not_started",
      schemaStatus: "not_started",
      rawExcerpt: missingReason,
      durationMs: 0,
      journeyDecision: "selected",
      strictStatus: "blocked",
      strictProviderErrorCode: "CONFIG_MISSING",
      strictSchemaPath: null,
      repairAttempted: false,
      repairStatus: "not_attempted",
      repairProviderErrorCode: null,
      repairSchemaPath: null,
      repairReason: "config_missing",
      repairUsed: false,
      finalContractStatus: "blocked",
      formatUsed: null,
      didFallback: null,
      timeoutMs: openAiTimeoutMs,
      maxOutputTokens: openAiMaxOutputTokens,
      diagnosticNotes: mergeDiagnosticNotes(provider, [
        "Provider configuration missing.",
        openAiProfileNote,
      ]),
    });
  }

  const started = Date.now();
  const prompt = buildDirectFullContractPrompt(provider);

  try {
    const strictCall = await executeDirectFullContractCall({ provider, prompt, repairAttempt: false });
    const strictValidation = validateFullContractPayload(strictCall.text ?? "");

    if (strictValidation.ok) {
      return baseDiagnostic({
        provider,
        mode: "full_contract",
        stage: "analyze_contract",
        pipeline: "provider_probe",
        model: strictCall.model ?? defaultModelForProvider(provider),
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
        rawExcerpt: strictValidation.rawExcerpt ?? strictCall.text,
        durationMs: Date.now() - started,
        tokensIn: strictCall.tokensIn,
        tokensOut: strictCall.tokensOut,
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
        finalContractStatus: "strict_ok",
        formatUsed: strictCall.formatUsed,
        didFallback: strictCall.didFallback,
        timeoutMs: strictCall.timeoutMs,
        maxOutputTokens: strictCall.maxOutputTokens,
        openaiErrorCode: strictCall.openaiErrorCode,
        openaiErrorMessage: strictCall.openaiErrorMessage,
        diagnosticNotes: mergeDiagnosticNotes(provider, [
          openAiProfileNote,
          strictCall.formatUsed ? `formatUsed=${strictCall.formatUsed}` : null,
          strictCall.didFallback ? "Strict call used OpenAI json_object fallback." : null,
          strictCall.openaiErrorCode ? `openaiErrorCode=${strictCall.openaiErrorCode}` : null,
          strictCall.openaiErrorMessage ? `openaiErrorMessage=${strictCall.openaiErrorMessage}` : null,
        ]),
      });
    }

    const strictCode = normalizeErrorCode({
      providerErrorCode: strictValidation.providerErrorCode,
      errorKind: strictValidation.errorKind,
      httpStatus: 200,
      message: strictValidation.errorMessage,
    });
    const blockedStrict = isBlockedContractError(strictCode);
    const repair = await runFullContractRepairAttempt({
      provider,
      rawText: strictCall.text ?? "",
      strictValidation,
    });

    const finalContractStatus: ProviderDiagnostic["finalContractStatus"] =
      repair.status === "ok"
        ? "repaired_degraded"
        : blockedStrict || repair.blocked
          ? "blocked"
          : "failed";

    return baseDiagnostic({
      provider,
      mode: "full_contract",
      stage: "analyze_contract",
      pipeline: "provider_probe",
      model: strictCall.model ?? defaultModelForProvider(provider),
      status:
        finalContractStatus === "repaired_degraded"
          ? "degraded"
          : finalContractStatus === "blocked" && strictCode === "CONFIG_MISSING"
            ? "config_missing"
            : "failed",
      errorKind: strictValidation.errorKind,
      providerErrorCode: strictCode,
      httpStatus: 200,
      errorMessage: strictValidation.errorMessage,
      reason: strictValidation.reason,
      validationMode: "analyze_schema",
      providerStatus: "reachable",
      adapterStatus: strictValidation.adapterStatus,
      parseStatus: strictValidation.parseStatus,
      schemaStatus: strictValidation.schemaStatus,
      parseError: strictValidation.parseError,
      schemaError: strictValidation.schemaError,
      schemaPath: strictValidation.schemaPath,
      rawExcerpt: strictValidation.rawExcerpt ?? strictCall.text,
      durationMs: Date.now() - started,
      tokensIn: strictCall.tokensIn,
      tokensOut: strictCall.tokensOut,
      journeyDecision: "selected",
      strictStatus: blockedStrict ? "blocked" : "failed",
      strictProviderErrorCode: strictCode,
      strictSchemaPath: strictValidation.schemaPath,
      repairAttempted: repair.attempted,
      repairStatus: repair.status,
      repairProviderErrorCode: repair.providerErrorCode,
      repairSchemaPath: repair.schemaPath,
      repairReason: repair.reason,
      repairUsed: repair.attempted,
      finalContractStatus,
      formatUsed: strictCall.formatUsed,
      didFallback: strictCall.didFallback,
      timeoutMs: strictCall.timeoutMs,
      maxOutputTokens: strictCall.maxOutputTokens,
      openaiErrorCode: strictCall.openaiErrorCode,
      openaiErrorMessage: strictCall.openaiErrorMessage,
      diagnosticNotes: mergeDiagnosticNotes(provider, [
        openAiProfileNote,
        strictCall.formatUsed ? `formatUsed=${strictCall.formatUsed}` : null,
        strictCall.didFallback ? "Strict call used OpenAI json_object fallback." : null,
        strictCall.openaiErrorCode ? `openaiErrorCode=${strictCall.openaiErrorCode}` : null,
        strictCall.openaiErrorMessage ? `openaiErrorMessage=${strictCall.openaiErrorMessage}` : null,
        repair.attempted ? "Repair attempt executed as degraded fallback." : "Repair not attempted.",
      ]),
    });
  } catch (error: any) {
    const errorKind = mapErrorToKind(error);
    const providerCode = normalizeErrorCode({
      providerErrorCode: extractProviderErrorCode(error),
      errorKind,
      httpStatus: typeof error?.status === "number" ? error.status : null,
      message: error?.message ?? null,
    });
    const status = typeof error?.status === "number" ? error.status : null;
    const blocked = isBlockedContractError(providerCode);
    const finalContractStatus: ProviderDiagnostic["finalContractStatus"] = blocked ? "blocked" : "failed";

    return baseDiagnostic({
      provider,
      mode: "full_contract",
      stage: "analyze_contract",
      pipeline: "provider_probe",
      model: error?.meta?.model ?? defaultModelForProvider(provider),
      status:
        looksConfigMissing(error?.message) || providerCode === "CONFIG_MISSING"
          ? "config_missing"
          : "failed",
      errorKind,
      providerErrorCode: providerCode,
      httpStatus: status,
      errorMessage: error?.message ?? "direct_full_contract_failed",
      reason: error?.message ?? "direct_full_contract_failed",
      validationMode: "analyze_schema",
      providerStatus: deriveProviderStatus(errorKind, "failed"),
      adapterStatus: "failed",
      parseStatus: "not_started",
      schemaStatus: "not_started",
      rawExcerpt: error?.payload ?? error?.message,
      durationMs: Date.now() - started,
      journeyDecision: "selected",
      strictStatus: blocked ? "blocked" : "failed",
      strictProviderErrorCode: providerCode,
      strictSchemaPath: null,
      repairAttempted: false,
      repairStatus: blocked ? "blocked" : "not_attempted",
      repairProviderErrorCode: null,
      repairSchemaPath: null,
      repairReason: blocked ? "account_or_runtime_blocked" : "strict_call_failed",
      repairUsed: false,
      finalContractStatus,
      formatUsed: null,
      didFallback: null,
      timeoutMs: openAiTimeoutMs,
      maxOutputTokens: openAiMaxOutputTokens,
      openaiErrorCode: isOpenAi ? providerCode : null,
      openaiErrorMessage: isOpenAi ? error?.message ?? "direct_full_contract_failed" : null,
      diagnosticNotes: mergeDiagnosticNotes(provider, [
        openAiProfileNote,
        blocked ? "Strict call blocked by account/runtime condition." : "Strict call failed before validation.",
      ]),
    });
  }
}

async function runDirectFullContractProviders(): Promise<ProviderDiagnostic[]> {
  const rows = await Promise.all(PROVIDER_ORDER.map((provider) => runDirectFullContractProvider(provider)));
  return sortProviderDiagnostics(rows);
}

async function runCreateAnalyzeApiSmoke(): Promise<CreateAnalyzeApiSmoke> {
  const started = Date.now();
  try {
    const result = await analyzeContribution({
      text: FULL_SAMPLE_TEXT,
      locale: "de",
      maxClaims: 8,
      analysisMode: "analyze",
      pipeline: "orchestrator_smoke",
    });
    const validation = validateAnalyzeShapePayload(result);
    return {
      state: validation.ok ? "ok" : "failed",
      ok: validation.ok,
      durationMs: Date.now() - started,
      reason: validation.ok ? null : validation.message ?? "invalid_analyze_shape",
      code: validation.ok ? null : "INVALID_ANALYZE_SHAPE",
    };
  } catch (error: any) {
    return {
      state: "failed",
      ok: false,
      durationMs: Date.now() - started,
      reason: error?.message ?? "create_analyze_failed",
      code: error?.code ?? null,
    };
  }
}

function applyFullContractValidation(
  rows: ProviderDiagnostic[],
  candidates: Array<{ provider: E150ProviderName; rawText: string }> | undefined,
): ProviderDiagnostic[] {
  const candidateMap = new Map((candidates ?? []).map((item) => [item.provider, item]));
  return rows.map((row) => {
    if (row.status !== "ok") return row;
    const candidate = candidateMap.get(row.provider);
    if (!candidate) {
      return baseDiagnostic({
        ...row,
        status: "failed",
        errorKind: "INTERNAL",
        providerErrorCode: "CANDIDATE_MISSING",
        errorMessage: "candidate_missing_for_ok_provider",
        reason: "candidate_missing_for_ok_provider",
        validationMode: "analyze_schema",
        providerStatus: row.providerStatus,
        adapterStatus: "failed",
        parseStatus: "not_started",
        schemaStatus: "not_started",
        parseError: null,
        schemaError: null,
        schemaPath: null,
        rawExcerpt: null,
        strictStatus: "failed",
        strictProviderErrorCode: "CANDIDATE_MISSING",
        strictSchemaPath: null,
        repairAttempted: false,
        repairStatus: "not_attempted",
        repairProviderErrorCode: null,
        repairSchemaPath: null,
        repairReason: "candidate_missing_for_ok_provider",
        finalContractStatus: "failed",
      });
    }

    const strictValidation = validateFullContractPayload(candidate.rawText ?? "");
    if (!strictValidation.ok) {
      const strictCode = normalizeErrorCode({
        providerErrorCode: strictValidation.providerErrorCode,
        errorKind: strictValidation.errorKind,
        httpStatus: row.httpStatus,
        message: strictValidation.errorMessage,
      });
      const blocked = isBlockedContractError(strictCode);
      return baseDiagnostic({
        ...row,
        status: "failed",
        errorKind: strictValidation.errorKind,
        providerErrorCode: strictCode,
        errorMessage: strictValidation.errorMessage,
        reason: strictValidation.reason,
        validationMode: "analyze_schema",
        providerStatus: "reachable",
        adapterStatus: "failed",
        parseStatus: strictValidation.parseStatus,
        schemaStatus: strictValidation.schemaStatus,
        parseError: strictValidation.parseError,
        schemaError: strictValidation.schemaError,
        schemaPath: strictValidation.schemaPath,
        rawExcerpt: strictValidation.rawExcerpt,
        strictStatus: blocked ? "blocked" : "failed",
        strictProviderErrorCode: strictCode,
        strictSchemaPath: strictValidation.schemaPath,
        repairAttempted: false,
        repairStatus: blocked ? "blocked" : "not_attempted",
        repairProviderErrorCode: null,
        repairSchemaPath: null,
        repairReason: blocked ? "account_or_runtime_blocked" : null,
        finalContractStatus: blocked ? "blocked" : "failed",
      });
    }

    return baseDiagnostic({
      ...row,
      status: "ok",
      validationMode: "analyze_schema",
      providerStatus: "reachable",
      adapterStatus: "ok",
      parseStatus: "ok",
      schemaStatus: "ok",
      rawExcerpt: strictValidation.rawExcerpt,
      strictStatus: "ok",
      strictProviderErrorCode: null,
      strictSchemaPath: null,
      repairAttempted: false,
      repairStatus: "not_attempted",
      repairProviderErrorCode: null,
      repairSchemaPath: null,
      repairReason: null,
      finalContractStatus: "strict_ok",
    });
  });
}

function buildResponse(params: {
  mode: SmokeMode;
  runId: string;
  correlationId: string;
  startedAt: number;
  finishedAt: number;
  rows: ProviderDiagnostic[];
  directContractRows?: ProviderDiagnostic[];
  orchestratorOk: boolean;
  bestProviderId: E150ProviderName | null;
  bestRawText: string | null;
  error?: string;
  probeMaps?: Pick<OrchestratorSmokeResponse, "probeStatus" | "probes">;
  createAnalyzeApi: CreateAnalyzeApiSmoke;
}): OrchestratorSmokeResponse {
  const sortedRows = sortProviderDiagnostics(params.rows);
  const ok =
    params.mode === "full_contract"
      ? params.orchestratorOk && params.createAnalyzeApi.ok
      : sortedRows.some((row) => row.status === "ok");

  const response: OrchestratorSmokeResponse = {
    ok,
    mode: params.mode,
    runId: params.runId,
    correlationId: params.correlationId,
    startedAt: params.startedAt,
    finishedAt: params.finishedAt,
    orchestratorOk: params.orchestratorOk,
    bestProviderId: params.bestProviderId,
    bestRawText: params.bestRawText,
    rows: sortedRows,
    directContractRows: params.directContractRows ? sortProviderDiagnostics(params.directContractRows) : undefined,
    results: sortedRows.map(toLegacyResult),
    error: params.error,
    ...(params.probeMaps ?? {}),
    createAnalyzeApi: params.createAnalyzeApi,
  };

  recordAdminAiRun({
    runId: params.runId,
    correlationId: params.correlationId,
    mode: params.mode,
    startedAt: params.startedAt,
    finishedAt: params.finishedAt,
    ok: response.ok,
    rows: sortedRows,
    bestProviderId: params.bestProviderId,
  });

  return response;
}

async function runProviderProbeMode(base: {
  runId: string;
  correlationId: string;
  startedAt: number;
}): Promise<OrchestratorSmokeResponse> {
  const rows = await Promise.all(PROVIDER_ORDER.map((provider) => runDirectProviderProbe(provider)));
  return buildResponse({
    mode: "provider_probe",
    runId: base.runId,
    correlationId: base.correlationId,
    startedAt: base.startedAt,
    finishedAt: Date.now(),
    rows,
    orchestratorOk: rows.some((row) => row.status === "ok"),
    bestProviderId: rows.find((row) => row.status === "ok")?.provider ?? null,
    bestRawText: null,
    createAnalyzeApi: {
      state: "skipped",
      ok: false,
      durationMs: 0,
      reason: "provider_probe_mode",
      code: "SKIPPED",
    },
  });
}

async function runRuntimeMode(base: {
  runId: string;
  correlationId: string;
  startedAt: number;
}): Promise<OrchestratorSmokeResponse> {
  try {
    const orchestratorResult = await callE150Orchestrator({
      systemPrompt: RUNTIME_SYSTEM_PROMPT,
      userPrompt: RUNTIME_USER_PROMPT,
      maxTokens: 320,
      timeoutMs: 15_000,
      requiredCapability: "core_analysis",
      validationMode: "json_only",
      telemetry: {
        pipeline: "orchestrator_smoke",
      },
    });

    const rows = mapRowsFromProviderMatrix(
      "runtime_smoke",
      orchestratorResult.meta.providerMatrix,
      orchestratorResult.meta.probes as ProbeSnapshot[] | undefined,
      null,
    );
    const probeMaps = buildProbeMaps(orchestratorResult.meta.probes as ProbeSnapshot[] | undefined);
    const orchestratorOk = rows.some((entry) => entry.status === "ok");

    return buildResponse({
      mode: "runtime_smoke",
      runId: base.runId,
      correlationId: base.correlationId,
      startedAt: base.startedAt,
      finishedAt: Date.now(),
      rows,
      orchestratorOk,
      bestProviderId: orchestratorResult.best.provider,
      bestRawText: orchestratorResult.best.rawText,
      probeMaps,
      createAnalyzeApi: {
        state: "skipped",
        ok: false,
        durationMs: 0,
        reason: "full_mode_only",
        code: "SKIPPED",
      },
    });
  } catch (error: any) {
    const meta = extractOrchestratorMeta(error);
    const rows = mapRowsFromProviderMatrix(
      "runtime_smoke",
      meta?.providerMatrix,
      (meta?.probes ?? []) as ProbeSnapshot[],
      error?.message ?? "orchestrator_error",
    );
    const probeMaps = buildProbeMaps((meta?.probes ?? []) as ProbeSnapshot[]);

    return buildResponse({
      mode: "runtime_smoke",
      runId: base.runId,
      correlationId: base.correlationId,
      startedAt: base.startedAt,
      finishedAt: Date.now(),
      rows,
      orchestratorOk: false,
      bestProviderId: null,
      bestRawText: null,
      error: error?.message ?? "orchestrator error",
      probeMaps,
      createAnalyzeApi: {
        state: "skipped",
        ok: false,
        durationMs: 0,
        reason: "full_mode_only",
        code: "SKIPPED",
      },
    });
  }
}

async function runFullMode(base: {
  runId: string;
  correlationId: string;
  startedAt: number;
}): Promise<OrchestratorSmokeResponse> {
  let orchestratorResult: Awaited<ReturnType<typeof callE150Orchestrator>> | null = null;
  let orchestratorError: unknown = null;

  try {
    orchestratorResult = await callE150Orchestrator({
      systemPrompt: FULL_CONTRACT_SYSTEM_PROMPT,
      userPrompt: FULL_SAMPLE_TEXT,
      maxTokens: 2_600,
      timeoutMs: 45_000,
      requiredCapability: "core_analysis",
      validationMode: "analyze_schema",
      telemetry: {
        pipeline: "orchestrator_smoke",
      },
    });
  } catch (error) {
    orchestratorError = error;
  }

  const [createAnalyzeApi, directContractRows] = await Promise.all([
    runCreateAnalyzeApiSmoke(),
    runDirectFullContractProviders(),
  ]);

  if (!orchestratorResult) {
    const meta = extractOrchestratorMeta(orchestratorError);
    const rows = mapRowsFromProviderMatrix(
      "full_contract",
      meta?.providerMatrix,
      (meta?.probes ?? []) as ProbeSnapshot[],
      (orchestratorError as any)?.message ?? "full smoke orchestrator failed",
    );
    const probeMaps = buildProbeMaps((meta?.probes ?? []) as ProbeSnapshot[]);

    return buildResponse({
      mode: "full_contract",
      runId: base.runId,
      correlationId: base.correlationId,
      startedAt: base.startedAt,
      finishedAt: Date.now(),
      rows,
      directContractRows,
      orchestratorOk: false,
      bestProviderId: null,
      bestRawText: null,
      error: (orchestratorError as any)?.message ?? "full smoke failed",
      probeMaps,
      createAnalyzeApi,
    });
  }

  const rows = mapRowsFromProviderMatrix(
    "full_contract",
    orchestratorResult.meta.providerMatrix,
    orchestratorResult.meta.probes as ProbeSnapshot[] | undefined,
    null,
  );
  const validatedRows = applyFullContractValidation(rows, orchestratorResult.candidates);
  const probeMaps = buildProbeMaps(orchestratorResult.meta.probes as ProbeSnapshot[] | undefined);

  return buildResponse({
    mode: "full_contract",
    runId: base.runId,
    correlationId: base.correlationId,
    startedAt: base.startedAt,
    finishedAt: Date.now(),
    rows: validatedRows,
    directContractRows,
    orchestratorOk: validatedRows.some((entry) => entry.status === "ok") && createAnalyzeApi.ok,
    bestProviderId: orchestratorResult.best.provider,
    bestRawText: orchestratorResult.best.rawText,
    probeMaps,
    createAnalyzeApi,
  });
}

export async function POST(req: NextRequest) {
  const mode = normalizeMode(req.nextUrl.searchParams.get("mode"));
  const runId = crypto.randomUUID();
  const correlationId = runId;
  const startedAt = Date.now();

  try {
    const gate = await requireAdminOrResponse(req);
    if (gate instanceof Response) return gate;

    if (mode === "provider_probe") {
      const response = await runProviderProbeMode({ runId, correlationId, startedAt });
      return NextResponse.json(response);
    }
    if (mode === "full_contract") {
      const response = await runFullMode({ runId, correlationId, startedAt });
      return NextResponse.json(response);
    }

    const response = await runRuntimeMode({ runId, correlationId, startedAt });
    return NextResponse.json(response);
  } catch (error: any) {
    const finishedAt = Date.now();
    const message = error?.message ?? "orchestrator_smoke_unhandled_error";
    const response: OrchestratorSmokeResponse = {
      ok: false,
      mode,
      runId,
      correlationId,
      startedAt,
      finishedAt,
      orchestratorOk: false,
      bestProviderId: null,
      bestRawText: null,
      rows: [],
      directContractRows: [],
      results: [],
      error: message,
      createAnalyzeApi: {
        state: "skipped",
        ok: false,
        durationMs: 0,
        reason: "route_failed_before_create_analyze",
        code: "ROUTE_UNHANDLED_ERROR",
      },
    };

    return NextResponse.json(response, { status: 200 });
  }
}
