import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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
import { AnalyzeResultSchema, type AnalyzeResult } from "@features/analyze/schemas";
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
  type RunCostGroup,
  type SmokeBudgetProfile,
  type SmokeExecutionMode,
  type SmokeMode,
  PROVIDER_ORDER,
} from "@/features/ai/adminTelemetryDiagnostics";
import { estimateAiRunCost } from "@/features/ai/aiCostTelemetry";
import { recordAdminAiRun } from "@/features/ai/adminTelemetryStore";
import {
  defaultLaneForSmokeMode,
  resolveOperationalProviderRoutingSummary,
  type OperationalProviderRoutingSummary,
  type OrchestrationLane,
} from "@/features/ai/providerRoleRouting";
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
      consequences: [
        {
          id: "ev-pro-cons-1",
          scope: "local_long",
          statementIndex: 0,
          text: "...",
          confidence: 0.55,
        },
      ],
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
          consequences: [
            {
              id: "tree-pro-cons-1",
              scope: "national",
              statementIndex: 0,
              text: "...",
              confidence: 0.58,
            },
          ],
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
          consequences: [
            {
              id: "tree-contra-cons-1",
              scope: "global",
              statementIndex: 0,
              text: "...",
              confidence: 0.52,
            },
            {
              id: "tree-contra-cons-2",
              scope: "systemic",
              statementIndex: 0,
              text: "...",
              confidence: 0.49,
            },
          ],
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
const FULL_CONTRACT_REQUIRED_TOP_LEVEL_KEYS = [
  "mode",
  "sourceText",
  "language",
  "claims",
  "findings",
  "notes",
  "questions",
  "missingPerspectives",
  "knots",
  "consequences",
  "responsibilityPaths",
  "eventualities",
  "decisionTrees",
  "impactAndResponsibility",
  "participationCandidates",
  "report",
] as const;
const FULL_CONTRACT_REQUIRED_TOP_LEVEL_KEYS_LABEL = FULL_CONTRACT_REQUIRED_TOP_LEVEL_KEYS.join(", ");

const FULL_CONTRACT_SYSTEM_PROMPT = [
  "You are the E150 orchestrator contract tester.",
  "Return exactly one strictly valid RFC8259 JSON object. No markdown. No prose. No code fences. Never return a top-level array.",
  "Never return an array as the top-level value.",
  "The first character must be { and the last character must be }. The top-level value must be an object, never an array.",
  "Do not return an array of claims, suggestions, records, candidates, options or alternatives. The response itself must be the AnalyzeResult object.",
  "Do not wrap the AnalyzeResult object in an array. Do not return multiple objects. Do not return a list.",
  "If you have multiple claims or options, put them inside the claims, eventualities or decisionTrees arrays within the single top-level AnalyzeResult object.",
  "You must satisfy the AnalyzeResultSchema exactly.",
  "Do not use string arrays where object arrays are required.",
  "claims must be StatementRecord objects: {id,text,title,responsibility,importance,topic,domain,domains,stance,statementType}. statementType must be exactly one of: fact, interpretation, value, question. Never use policy, action, goal, proposal, measure or recommendation as statementType.",
  "notes must be objects: {id,text,kind}. questions must be objects: {id,text,dimension}. knots must be objects: {id,label,description}.",
  "consequences.consequences must be objects: {id,scope,statementIndex,text,confidence}. Allowed scope: local_short, local_long, national, global, systemic.",
  "Never use \"local\" as scope. For short-term local effects use \"local_short\". For long-term local effects use \"local_long\".",
  "The allowed scope enum applies consistently to consequences.consequences[].scope, eventualities[].consequences[].scope, and decisionTrees.options.*.consequences[].scope.",
  "consequences.responsibilities must be objects: {id,level,actor,text,relevance}. Allowed level: municipality, district, state, federal, eu, ngo, private, unknown.",
  "responsibilityPaths must be objects: {id,statementId,locale,nodes}. nodes must be objects: {level,actorKey,displayName,description,contactUrl,processHint,relevance}.",
  "eventualities must be EventualityNode objects: {id,statementId,label,narrative,stance,likelihood,impact,consequences,responsibilities,children}. children must be an array.",
  "decisionTrees must be objects: {id,rootStatementId,locale,options}. options must contain pro and contra EventualityNode objects; neutral is optional.",
  "impactAndResponsibility.impacts must be objects: {type,description,confidence}. impactAndResponsibility.responsibleActors must be objects: {level,hint,confidence}.",
  "report.facts.local and report.facts.international must be string arrays. report.keyConflicts, report.openQuestions and report.takeaways must be string arrays.",
  "report.facts.local must always be an array. report.facts.international must always be an array.",
  "If no local facts are available, return report.facts.local: []. If no international facts are available, return report.facts.international: [].",
  "Never omit report.facts.local or report.facts.international.",
  "Use mode exactly E150 and language de.",
  "If uncertain, return empty arrays for optional arrays but never omit required top-level keys.",
  "Minimal valid shape example:",
  FULL_CONTRACT_EXAMPLE_JSON,
].join(" ");

const OPENAI_SMOKE_DEFAULT_MODEL = "gpt-4.1-mini";
const FULL_CONTRACT_DEFAULT_MAX_OUTPUT_TOKENS = 2_600;
const FULL_CONTRACT_LITE_MAX_OUTPUT_TOKENS = 1_200;
const FULL_CONTRACT_REPAIR_MAX_OUTPUT_TOKENS = 2_300;
const PROBE_TINY_MAX_OUTPUT_TOKENS = 96;
const RUNTIME_TINY_MAX_OUTPUT_TOKENS = 192;

export type DirectFullContractMode = "full" | "full-lite";
export type DirectFullContractRunOptions = {
  mode?: DirectFullContractMode;
  maxOutputTokens?: number | null;
  disableRepair?: boolean;
};

type ResolvedDirectFullContractRunOptions = {
  mode: DirectFullContractMode;
  maxOutputTokens: number;
  disableRepair: boolean;
};

function normalizePositiveNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return null;
  return Math.floor(value);
}

function resolveDirectFullContractOptions(
  provider: E150ProviderName,
  options: DirectFullContractRunOptions | undefined,
): ResolvedDirectFullContractRunOptions {
  const mode: DirectFullContractMode = options?.mode === "full-lite" ? "full-lite" : "full";
  const overrideMax = normalizePositiveNumber(options?.maxOutputTokens ?? null);
  const baseMax =
    provider === "openai"
      ? openAiSmokeMaxOutputTokens()
      : mode === "full-lite"
        ? FULL_CONTRACT_LITE_MAX_OUTPUT_TOKENS
        : FULL_CONTRACT_DEFAULT_MAX_OUTPUT_TOKENS;
  const maxOutputTokens = overrideMax ?? (mode === "full-lite" ? Math.min(baseMax, FULL_CONTRACT_LITE_MAX_OUTPUT_TOKENS) : baseMax);
  return {
    mode,
    maxOutputTokens,
    disableRepair: Boolean(options?.disableRepair),
  };
}

function openAiSmokeModel(): string {
  return process.env.OPENAI_SMOKE_MODEL || OPENAI_SMOKE_DEFAULT_MODEL;
}

function openAiSmokeModelSource(): "OPENAI_SMOKE_MODEL" | "default_gpt-4.1-mini" {
  if (process.env.OPENAI_SMOKE_MODEL) return "OPENAI_SMOKE_MODEL";
  return "default_gpt-4.1-mini";
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
  operationalSummary: OperationalProviderRoutingSummary;
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

function normalizeLane(value: string | null, mode: SmokeMode): OrchestrationLane {
  if (!value) return defaultLaneForSmokeMode(mode);
  if (value === "fast_draft") return "fast_draft";
  if (value === "standard_analyze") return "standard_analyze";
  if (value === "dossier_enrichment") return "dossier_enrichment";
  if (value === "sealed_factcheck") return "sealed_factcheck";
  if (value === "premium_deep_research") return "premium_deep_research";
  return defaultLaneForSmokeMode(mode);
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
  directStrictStatus?: ProviderDiagnostic["directStrictStatus"];
  draftStatus?: ProviderDiagnostic["draftStatus"];
  envelopeBuildStatus?: ProviderDiagnostic["envelopeBuildStatus"];
  finalSchemaStatus?: ProviderDiagnostic["finalSchemaStatus"];
  finalContractStatus?: ProviderDiagnostic["finalContractStatus"];
  buildWarnings?: string[];
  filledDefaults?: string[];
  missingContainers?: string[];
  normalizedEnumWarnings?: string[];
  generatedIds?: string[];
  formatUsed?: ProviderDiagnostic["formatUsed"];
  didFallback?: boolean | null;
  timeoutMs?: number | null;
  maxOutputTokens?: number | null;
  openaiErrorCode?: string | null;
  openaiErrorMessage?: string | null;
  selectedSmokeModel?: string | null;
  smokeModelEnvPresent?: boolean | null;
  effectiveModel?: string | null;
  openAiSmokeModelMismatch?: boolean | null;
  diagnosticNotes?: string[];
  runCostGroup?: RunCostGroup | null;
  smokeMode?: SmokeExecutionMode | null;
  budgetProfile?: SmokeBudgetProfile | null;
}): ProviderDiagnostic {
  const capabilities = getProviderContractCapabilities(params.provider);
  const resolvedModel = params.model ?? defaultModelForProvider(params.provider);
  const tokensIn = typeof params.tokensIn === "number" ? params.tokensIn : null;
  const tokensOut = typeof params.tokensOut === "number" ? params.tokensOut : null;
  const costEstimate = estimateAiRunCost({
    provider: params.provider,
    model: resolvedModel,
    tokensIn,
    tokensOut,
  });
  const defaultSmokeMode: SmokeExecutionMode =
    params.mode === "provider_probe" ? "probe" : params.mode === "runtime_smoke" ? "runtime" : "full";
  const defaultBudgetProfile: SmokeBudgetProfile =
    defaultSmokeMode === "probe"
      ? "probe_tiny"
      : defaultSmokeMode === "runtime"
        ? "runtime_tiny"
        : "full_default";
  const defaultRunCostGroup: RunCostGroup =
    defaultSmokeMode === "probe" || defaultSmokeMode === "runtime" ? "tiny" : "full";
  const row: ProviderDiagnostic = {
    provider: params.provider,
    displayName: providerDisplayName(params.provider),
    model: resolvedModel,
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
    tokensIn,
    tokensOut,
    estimatedCostUsd: costEstimate.estimatedCostUsd,
    estimatedCostEur: costEstimate.estimatedCostEur,
    costKnown: costEstimate.costKnown,
    pricingSource: costEstimate.pricingSource,
    costReason: costEstimate.reason,
    runCostGroup: params.runCostGroup ?? defaultRunCostGroup,
    smokeMode: params.smokeMode ?? defaultSmokeMode,
    budgetProfile: params.budgetProfile ?? defaultBudgetProfile,
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
    directStrictStatus:
      params.directStrictStatus ??
      (params.strictStatus ??
        (params.status === "ok" ? "ok" : params.status === "config_missing" ? "blocked" : "not_started")),
    draftStatus: params.draftStatus ?? "not_attempted",
    envelopeBuildStatus: params.envelopeBuildStatus ?? "not_attempted",
    finalSchemaStatus:
      params.finalSchemaStatus ??
      (params.schemaStatus === "ok"
        ? "ok"
        : params.schemaStatus === "failed"
          ? "failed"
          : "not_started"),
    finalContractStatus:
      params.finalContractStatus ??
      (params.status === "ok"
        ? "strict_ok"
        : params.status === "config_missing"
          ? "blocked"
          : "not_started"),
    buildWarnings: Array.isArray(params.buildWarnings) ? params.buildWarnings : [],
    filledDefaults: Array.isArray(params.filledDefaults) ? params.filledDefaults : [],
    missingContainers: Array.isArray(params.missingContainers) ? params.missingContainers : [],
    normalizedEnumWarnings: Array.isArray(params.normalizedEnumWarnings)
      ? params.normalizedEnumWarnings
      : [],
    generatedIds: Array.isArray(params.generatedIds) ? params.generatedIds : [],
    nativeStrategy: capabilities.nativeStrategy,
    preferredContractStrategy: capabilities.preferredContractStrategy,
    providerStrategy: capabilities.preferredContractStrategy,
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
    selectedSmokeModel: params.selectedSmokeModel ?? null,
    smokeModelEnvPresent:
      typeof params.smokeModelEnvPresent === "boolean" ? params.smokeModelEnvPresent : null,
    effectiveModel: params.effectiveModel ?? params.model ?? defaultModelForProvider(params.provider),
    openAiSmokeModelMismatch:
      typeof params.openAiSmokeModelMismatch === "boolean" ? params.openAiSmokeModelMismatch : null,
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
        maxOutputTokens: PROBE_TINY_MAX_OUTPUT_TOKENS,
      });
      text = res.text;
      model = res.model;
      tokensIn = res.tokensIn;
      tokensOut = res.tokensOut;
    } else if (provider === "anthropic") {
      const res = await callAnthropic({
        prompt: DIRECT_PROBE_PROMPT.replace("<name>", "anthropic"),
        maxOutputTokens: PROBE_TINY_MAX_OUTPUT_TOKENS,
      });
      text = res.text;
      model = res.model;
      tokensIn = res.tokensIn;
      tokensOut = res.tokensOut;
    } else if (provider === "mistral") {
      const res = await callMistral({
        prompt: DIRECT_PROBE_PROMPT.replace("<name>", "mistral"),
        maxOutputTokens: PROBE_TINY_MAX_OUTPUT_TOKENS,
      });
      text = res.text;
      model = res.model;
      tokensIn = res.tokensIn;
      tokensOut = res.tokensOut;
    } else if (provider === "gemini") {
      const res = await callGemini({
        prompt: DIRECT_PROBE_PROMPT.replace("<name>", "gemini"),
        maxOutputTokens: PROBE_TINY_MAX_OUTPUT_TOKENS,
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
        maxOutputTokens: PROBE_TINY_MAX_OUTPUT_TOKENS,
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

async function runDirectProviderRuntime(provider: E150ProviderName): Promise<ProviderDiagnostic> {
  const missingReason = configMissingReason(provider);
  if (missingReason) {
    return baseDiagnostic({
      provider,
      mode: "runtime_smoke",
      stage: "runtime",
      pipeline: "provider_probe",
      model: defaultModelForProvider(provider),
      status: "config_missing",
      errorKind: "INVALID_API_KEY",
      providerErrorCode: "CONFIG_MISSING",
      httpStatus: null,
      errorMessage: missingReason,
      reason: missingReason,
      validationMode: "json_only",
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
  const runtimePrompt = `${RUNTIME_SYSTEM_PROMPT}\n\n${RUNTIME_USER_PROMPT}`;
  try {
    let text = "";
    let model: string | undefined;
    let tokensIn: number | undefined;
    let tokensOut: number | undefined;

    if (provider === "openai") {
      const res = await callOpenAI({
        prompt: runtimePrompt,
        asJson: true,
        forceJsonFormat: true,
        model: openAiSmokeModel(),
        timeoutMs: openAiSmokeTimeoutMs(),
        maxOutputTokens: RUNTIME_TINY_MAX_OUTPUT_TOKENS,
      });
      text = res.text;
      model = res.model;
      tokensIn = res.tokensIn;
      tokensOut = res.tokensOut;
    } else if (provider === "anthropic") {
      const res = await callAnthropic({
        prompt: runtimePrompt,
        maxOutputTokens: RUNTIME_TINY_MAX_OUTPUT_TOKENS,
      });
      text = res.text;
      model = res.model;
      tokensIn = res.tokensIn;
      tokensOut = res.tokensOut;
    } else if (provider === "mistral") {
      const res = await callMistral({
        prompt: runtimePrompt,
        maxOutputTokens: RUNTIME_TINY_MAX_OUTPUT_TOKENS,
      });
      text = res.text;
      model = res.model;
      tokensIn = res.tokensIn;
      tokensOut = res.tokensOut;
    } else if (provider === "gemini") {
      const res = await callGemini({
        prompt: runtimePrompt,
        maxOutputTokens: RUNTIME_TINY_MAX_OUTPUT_TOKENS,
        expectJson: true,
      });
      text = res.text;
      model = res.model;
      tokensIn = res.tokensIn;
      tokensOut = res.tokensOut;
    } else {
      const res = await callAriLLM({
        prompt: runtimePrompt,
        asJson: true,
        maxOutputTokens: RUNTIME_TINY_MAX_OUTPUT_TOKENS,
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
        mode: "runtime_smoke",
        stage: "runtime",
        pipeline: "provider_probe",
        model: model ?? defaultModelForProvider(provider),
        status: "failed",
        errorKind: "BAD_JSON",
        providerErrorCode: "BAD_JSON",
        httpStatus: 200,
        errorMessage: parseError,
        reason: parseError,
        validationMode: "json_only",
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
      mode: "runtime_smoke",
      stage: "runtime",
      pipeline: "provider_probe",
      model: model ?? defaultModelForProvider(provider),
      status: "ok",
      errorKind: null,
      providerErrorCode: null,
      httpStatus: 200,
      errorMessage: null,
      reason: null,
      validationMode: "json_only",
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
      mode: "runtime_smoke",
      stage: "runtime",
      pipeline: "provider_probe",
      model: (error as any)?.meta?.model ?? defaultModelForProvider(provider),
      status: looksConfigMissing(error?.message) ? "config_missing" : "failed",
      errorKind,
      providerErrorCode: providerCode,
      httpStatus: status,
      errorMessage: error?.message ?? "provider_runtime_failed",
      reason: error?.message ?? "provider_runtime_failed",
      validationMode: "json_only",
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
  parsed: unknown | null;
  cleanedCandidate: string | null;
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
      parsed: null,
      cleanedCandidate: null,
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
      parsed: null,
      cleanedCandidate: cleaned,
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
      parsed: null,
      cleanedCandidate: cleaned,
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
      parsed,
      cleanedCandidate: cleaned,
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
      parsed,
      cleanedCandidate: cleaned,
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
    parsed,
    cleanedCandidate: cleaned,
  };
}

const DRAFT_SCOPE_VALUES = ["local_short", "local_long", "national", "global", "systemic"] as const;
const DRAFT_SCOPE_SET = new Set<string>(DRAFT_SCOPE_VALUES);
const RESPONSIBILITY_LEVEL_VALUES = [
  "municipality",
  "district",
  "state",
  "federal",
  "eu",
  "ngo",
  "private",
  "unknown",
] as const;
const RESPONSIBILITY_LEVEL_SET = new Set<string>(RESPONSIBILITY_LEVEL_VALUES);
const STANCE_VALUES = ["pro", "neutral", "contra"] as const;
const STANCE_SET = new Set<string>(STANCE_VALUES);
const STATEMENT_TYPE_VALUES = ["fact", "interpretation", "value", "question"] as const;
const STATEMENT_TYPE_SET = new Set<string>(STATEMENT_TYPE_VALUES);
const FINDING_VALUES = ["supports", "contradicts", "unclear", "mentions"] as const;
const FINDING_SET = new Set<string>(FINDING_VALUES);

const DraftAnalysisSchema = z
  .object({
    sourceText: z.string().nullable().optional(),
    language: z.string().optional(),
    claims: z.array(z.unknown()).optional(),
    findings: z.array(z.unknown()).optional(),
    notes: z.array(z.unknown()).optional(),
    questions: z.array(z.unknown()).optional(),
    missingPerspectives: z.array(z.unknown()).optional(),
    knots: z.array(z.unknown()).optional(),
    consequences: z
      .object({
        consequences: z.array(z.unknown()).optional(),
        responsibilities: z.array(z.unknown()).optional(),
      })
      .partial()
      .optional(),
    responsibilities: z.array(z.unknown()).optional(),
    responsibilityPaths: z.array(z.unknown()).optional(),
    eventualities: z.array(z.unknown()).optional(),
    decisionTrees: z.array(z.unknown()).optional(),
    impactAndResponsibility: z
      .object({
        impacts: z.array(z.unknown()).optional(),
        responsibleActors: z.array(z.unknown()).optional(),
      })
      .partial()
      .optional(),
    participationCandidates: z.array(z.unknown()).optional(),
    report: z
      .object({
        summary: z.string().nullable().optional(),
        keyConflicts: z.array(z.string()).optional(),
        facts: z
          .object({
            local: z.array(z.string()).optional(),
            international: z.array(z.string()).optional(),
          })
          .partial()
          .optional(),
        openQuestions: z.array(z.string()).optional(),
        takeaways: z.array(z.string()).optional(),
      })
      .partial()
      .optional(),
  })
  .passthrough();

type DraftAnalysis = z.infer<typeof DraftAnalysisSchema>;

type AnalyzeEnvelopeBuildDiagnostics = {
  filledDefaults: string[];
  missingContainers: string[];
  normalizedEnumWarnings: string[];
  generatedIds: string[];
  buildWarnings: string[];
};

type DraftEnvelopeBuildResult = {
  attempted: boolean;
  draftStatus: ProviderDiagnostic["draftStatus"];
  envelopeBuildStatus: ProviderDiagnostic["envelopeBuildStatus"];
  finalSchemaStatus: ProviderDiagnostic["finalSchemaStatus"];
  finalContractStatus: ProviderDiagnostic["finalContractStatus"] | null;
  strictValidation: FullContractValidation;
  candidate: AnalyzeResult | null;
  diagnostics: AnalyzeEnvelopeBuildDiagnostics;
};

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return asString(value);
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => asString(entry)).filter((entry): entry is string => Boolean(entry));
}

function asBoundedProbability(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value < 0 || value > 1) return null;
  return value;
}

function asStatementIndex(value: unknown): number {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) return value;
  return 0;
}

function buildNeutralSummary(sourceText: string | null): string {
  const normalized = asString(sourceText);
  if (!normalized) return "Keine belastbare Zusammenfassung aus dem Draft verfügbar.";
  const capped = normalized.replace(/\s+/g, " ").trim().slice(0, 180);
  return capped.length > 0 ? capped : "Keine belastbare Zusammenfassung aus dem Draft verfügbar.";
}

function resolveScopeValue(
  raw: unknown,
  path: string,
  diagnostics: AnalyzeEnvelopeBuildDiagnostics,
): AnalyzeResult["consequences"]["consequences"][number]["scope"] | null {
  const scope = asString(raw);
  if (!scope) return null;
  if (scope === "local") {
    diagnostics.normalizedEnumWarnings.push(`${path}: local -> local_short`);
    return "local_short";
  }
  if (!DRAFT_SCOPE_SET.has(scope)) return null;
  return scope as AnalyzeResult["consequences"]["consequences"][number]["scope"];
}

function resolveResponsibilityLevel(
  raw: unknown,
  path: string,
  diagnostics: AnalyzeEnvelopeBuildDiagnostics,
): AnalyzeResult["consequences"]["responsibilities"][number]["level"] {
  const level = asString(raw);
  if (!level || !RESPONSIBILITY_LEVEL_SET.has(level)) {
    diagnostics.filledDefaults.push(`${path}:unknown`);
    return "unknown";
  }
  return level as AnalyzeResult["consequences"]["responsibilities"][number]["level"];
}

function resolveStance(raw: unknown): "pro" | "neutral" | "contra" | null {
  const stance = asString(raw);
  if (!stance || !STANCE_SET.has(stance)) return null;
  return stance as "pro" | "neutral" | "contra";
}

function resolveStatementType(raw: unknown): "fact" | "interpretation" | "value" | "question" | null {
  const value = asString(raw);
  if (!value || !STATEMENT_TYPE_SET.has(value)) return null;
  return value as "fact" | "interpretation" | "value" | "question";
}

function resolveFindingType(raw: unknown): "supports" | "contradicts" | "unclear" | "mentions" | null {
  const value = asString(raw);
  if (!value || !FINDING_SET.has(value)) return null;
  return value as "supports" | "contradicts" | "unclear" | "mentions";
}

function buildAnalyzeResultEnvelopeFromDraft(args: {
  provider: E150ProviderName;
  sourceText: string;
  language: string;
  draft: DraftAnalysis;
  rawText?: string | null;
}): { candidate: AnalyzeResult; diagnostics: AnalyzeEnvelopeBuildDiagnostics } {
  const diagnostics: AnalyzeEnvelopeBuildDiagnostics = {
    filledDefaults: [],
    missingContainers: [],
    normalizedEnumWarnings: [],
    generatedIds: [],
    buildWarnings: [],
  };

  const idCounters: Record<string, number> = {};
  const nextId = (prefix: string, path: string): string => {
    idCounters[prefix] = (idCounters[prefix] ?? 0) + 1;
    const id = `${prefix}-${idCounters[prefix]}`;
    diagnostics.generatedIds.push(path);
    return id;
  };

  const draftClaims = Array.isArray(args.draft.claims) ? args.draft.claims : [];
  if (!Array.isArray(args.draft.claims)) diagnostics.missingContainers.push("claims");
  const claims: AnalyzeResult["claims"] = [];
  for (let index = 0; index < draftClaims.length; index += 1) {
    const entry = draftClaims[index];
    if (typeof entry === "string") {
      claims.push({
        id: nextId("claim", `claims[${index}].id`),
        text: entry,
        title: null,
        responsibility: null,
        importance: null,
        topic: null,
        domain: null,
        domains: null,
        stance: null,
        statementType: null,
      });
      continue;
    }
    const record = asRecord(entry);
    if (!record) continue;
    const text = asString(record.text ?? record.claim ?? record.statement);
    if (!text) continue;
    const domain = asNullableString(record.domain);
    const domains = asStringArray(record.domains);
    claims.push({
      id: asString(record.id) ?? nextId("claim", `claims[${index}].id`),
      text,
      title: asNullableString(record.title),
      responsibility: asNullableString(record.responsibility),
      importance:
        typeof record.importance === "number" &&
        Number.isInteger(record.importance) &&
        record.importance >= 1 &&
        record.importance <= 5
          ? record.importance
          : null,
      topic: asNullableString(record.topic),
      domain,
      domains: domains.length > 0 ? domains : domain ? [domain] : null,
      stance: resolveStance(record.stance),
      statementType: resolveStatementType(record.statementType),
    });
  }

  const draftFindings = Array.isArray(args.draft.findings) ? args.draft.findings : [];
  if (!Array.isArray(args.draft.findings)) diagnostics.filledDefaults.push("findings:[]");
  const findings: AnalyzeResult["findings"] = [];
  for (let index = 0; index < draftFindings.length; index += 1) {
    const record = asRecord(draftFindings[index]);
    if (!record) continue;
    const finding = resolveFindingType(record.finding);
    const claimId = asString(record.claimId);
    const sourceId = asString(record.sourceId);
    if (!finding || !claimId || !sourceId) continue;
    findings.push({
      id: asString(record.id) ?? nextId("finding", `findings[${index}].id`),
      claimId,
      sourceId,
      finding,
      rationale: asString(record.rationale) ?? undefined,
      excerptRef: asString(record.excerptRef) ?? undefined,
    });
  }

  const draftNotes = Array.isArray(args.draft.notes) ? args.draft.notes : [];
  if (!Array.isArray(args.draft.notes)) diagnostics.missingContainers.push("notes");
  const notes: AnalyzeResult["notes"] = [];
  for (let index = 0; index < draftNotes.length; index += 1) {
    const entry = draftNotes[index];
    if (typeof entry === "string") {
      notes.push({ id: nextId("note", `notes[${index}].id`), text: entry, kind: null });
      continue;
    }
    const record = asRecord(entry);
    if (!record) continue;
    const text = asString(record.text ?? record.note);
    if (!text) continue;
    notes.push({
      id: asString(record.id) ?? nextId("note", `notes[${index}].id`),
      text,
      kind: asNullableString(record.kind),
    });
  }

  const draftQuestions = Array.isArray(args.draft.questions) ? args.draft.questions : [];
  if (!Array.isArray(args.draft.questions)) diagnostics.missingContainers.push("questions");
  const questions: AnalyzeResult["questions"] = [];
  for (let index = 0; index < draftQuestions.length; index += 1) {
    const entry = draftQuestions[index];
    if (typeof entry === "string") {
      questions.push({ id: nextId("question", `questions[${index}].id`), text: entry, dimension: null });
      continue;
    }
    const record = asRecord(entry);
    if (!record) continue;
    const text = asString(record.text ?? record.question);
    if (!text) continue;
    questions.push({
      id: asString(record.id) ?? nextId("question", `questions[${index}].id`),
      text,
      dimension: asNullableString(record.dimension),
    });
  }

  const draftMissingPerspectives = Array.isArray(args.draft.missingPerspectives)
    ? args.draft.missingPerspectives
    : [];
  if (!Array.isArray(args.draft.missingPerspectives)) {
    diagnostics.filledDefaults.push("missingPerspectives:[]");
  }
  const missingPerspectives: AnalyzeResult["missingPerspectives"] = [];
  for (let index = 0; index < draftMissingPerspectives.length; index += 1) {
    const entry = draftMissingPerspectives[index];
    if (typeof entry === "string") {
      missingPerspectives.push({
        id: nextId("missing-perspective", `missingPerspectives[${index}].id`),
        text: entry,
      });
      continue;
    }
    const record = asRecord(entry);
    if (!record) continue;
    const text = asString(record.text);
    if (!text) continue;
    missingPerspectives.push({
      id: asString(record.id) ?? nextId("missing-perspective", `missingPerspectives[${index}].id`),
      text,
      dimension: asString(record.dimension) ?? undefined,
    });
  }

  const draftKnots = Array.isArray(args.draft.knots) ? args.draft.knots : [];
  if (!Array.isArray(args.draft.knots)) diagnostics.missingContainers.push("knots");
  const knots: AnalyzeResult["knots"] = [];
  for (let index = 0; index < draftKnots.length; index += 1) {
    const entry = draftKnots[index];
    if (typeof entry === "string") {
      knots.push({
        id: nextId("knot", `knots[${index}].id`),
        label: entry,
        description: entry,
      });
      continue;
    }
    const record = asRecord(entry);
    if (!record) continue;
    const label = asString(record.label ?? record.text ?? record.title);
    if (!label) continue;
    knots.push({
      id: asString(record.id) ?? nextId("knot", `knots[${index}].id`),
      label,
      description: asString(record.description ?? record.text) ?? label,
    });
  }

  const draftConsequenceBundle = asRecord(args.draft.consequences) ?? {};
  if (!asRecord(args.draft.consequences)) diagnostics.filledDefaults.push("consequences:empty_bundle");
  const draftConsequences = Array.isArray(draftConsequenceBundle.consequences)
    ? draftConsequenceBundle.consequences
    : [];
  const draftResponsibilities = Array.isArray(draftConsequenceBundle.responsibilities)
    ? draftConsequenceBundle.responsibilities
    : Array.isArray(args.draft.responsibilities)
      ? args.draft.responsibilities
      : [];

  const mappedConsequences: AnalyzeResult["consequences"]["consequences"] = [];
  for (let index = 0; index < draftConsequences.length; index += 1) {
    const record = asRecord(draftConsequences[index]);
    if (!record) continue;
    const text = asString(record.text ?? record.description);
    const scope = resolveScopeValue(record.scope, `consequences.consequences[${index}].scope`, diagnostics);
    if (!text || !scope) continue;
    if (scope === "local_short" && asString(record.scope) === "local") {
      diagnostics.buildWarnings.push("scope value \"local\" was normalized to \"local_short\".");
    }
    mappedConsequences.push({
      id: asString(record.id) ?? nextId("consequence", `consequences.consequences[${index}].id`),
      scope,
      statementIndex: asStatementIndex(record.statementIndex),
      text,
      confidence: asBoundedProbability(record.confidence),
    });
  }

  const mappedResponsibilities: AnalyzeResult["consequences"]["responsibilities"] = [];
  for (let index = 0; index < draftResponsibilities.length; index += 1) {
    const record = asRecord(draftResponsibilities[index]);
    if (!record) continue;
    const text = asString(record.text ?? record.description);
    if (!text) continue;
    mappedResponsibilities.push({
      id: asString(record.id) ?? nextId("responsibility", `consequences.responsibilities[${index}].id`),
      level: resolveResponsibilityLevel(
        record.level,
        `consequences.responsibilities[${index}].level`,
        diagnostics,
      ),
      actor: asNullableString(record.actor),
      text,
      relevance: asBoundedProbability(record.relevance),
    });
  }

  const draftResponsibilityPaths = Array.isArray(args.draft.responsibilityPaths)
    ? args.draft.responsibilityPaths
    : [];
  if (!Array.isArray(args.draft.responsibilityPaths)) {
    diagnostics.filledDefaults.push("responsibilityPaths:[]");
  }
  const responsibilityPaths: AnalyzeResult["responsibilityPaths"] = [];
  for (let index = 0; index < draftResponsibilityPaths.length; index += 1) {
    const record = asRecord(draftResponsibilityPaths[index]);
    if (!record) continue;
    const statementId = asString(record.statementId);
    if (!statementId) continue;
    const rawNodes = Array.isArray(record.nodes) ? record.nodes : [];
    const nodes: AnalyzeResult["responsibilityPaths"][number]["nodes"] = [];
    for (let nodeIndex = 0; nodeIndex < rawNodes.length; nodeIndex += 1) {
      const node = asRecord(rawNodes[nodeIndex]);
      if (!node) continue;
      const actorKey = asString(node.actorKey);
      const displayName = asString(node.displayName);
      if (!actorKey || !displayName) continue;
      nodes.push({
        level: resolveResponsibilityLevel(
          node.level,
          `responsibilityPaths[${index}].nodes[${nodeIndex}].level`,
          diagnostics,
        ),
        actorKey,
        displayName,
        description: asNullableString(node.description),
        contactUrl: asNullableString(node.contactUrl),
        processHint: asNullableString(node.processHint),
        relevance: asBoundedProbability(node.relevance) ?? undefined,
      });
    }
    responsibilityPaths.push({
      id: asString(record.id) ?? nextId("path", `responsibilityPaths[${index}].id`),
      statementId,
      locale: asString(record.locale) ?? args.language,
      nodes,
      createdAt: asString(record.createdAt) ?? undefined,
      updatedAt: asString(record.updatedAt) ?? undefined,
    });
  }

  const mapEventualityNode = (
    value: unknown,
    path: string,
  ): AnalyzeResult["eventualities"][number] | null => {
    const record = asRecord(value);
    if (!record) return null;
    const statementId = asString(record.statementId);
    const label = asString(record.label);
    const narrative = asString(record.narrative ?? record.text);
    if (!statementId || !label || !narrative) return null;
    const rawConsequences = Array.isArray(record.consequences) ? record.consequences : [];
    const consequences: AnalyzeResult["eventualities"][number]["consequences"] = [];
    for (let index = 0; index < rawConsequences.length; index += 1) {
      const node = asRecord(rawConsequences[index]);
      if (!node) continue;
      const text = asString(node.text ?? node.description);
      const scope = resolveScopeValue(node.scope, `${path}.consequences[${index}].scope`, diagnostics);
      if (!text || !scope) continue;
      if (scope === "local_short" && asString(node.scope) === "local") {
        diagnostics.buildWarnings.push(`"${path}.consequences[${index}].scope" local -> local_short`);
      }
      consequences.push({
        id: asString(node.id) ?? nextId("eventuality-consequence", `${path}.consequences[${index}].id`),
        scope,
        statementIndex: asStatementIndex(node.statementIndex),
        text,
        confidence: asBoundedProbability(node.confidence),
      });
    }
    const rawResponsibilities = Array.isArray(record.responsibilities) ? record.responsibilities : [];
    const responsibilities: AnalyzeResult["eventualities"][number]["responsibilities"] = [];
    for (let index = 0; index < rawResponsibilities.length; index += 1) {
      const node = asRecord(rawResponsibilities[index]);
      if (!node) continue;
      const text = asString(node.text ?? node.description);
      if (!text) continue;
      responsibilities.push({
        id: asString(node.id) ?? nextId("eventuality-responsibility", `${path}.responsibilities[${index}].id`),
        level: resolveResponsibilityLevel(
          node.level,
          `${path}.responsibilities[${index}].level`,
          diagnostics,
        ),
        actor: asNullableString(node.actor),
        text,
        relevance: asBoundedProbability(node.relevance),
      });
    }
    const rawChildren = Array.isArray(record.children) ? record.children : [];
    const children = rawChildren
      .map((child, childIndex) => mapEventualityNode(child, `${path}.children[${childIndex}]`))
      .filter((child): child is AnalyzeResult["eventualities"][number] => Boolean(child));

    return {
      id: asString(record.id) ?? nextId("eventuality", `${path}.id`),
      statementId,
      label,
      narrative,
      stance: resolveStance(record.stance),
      likelihood:
        typeof record.likelihood === "number" &&
        Number.isFinite(record.likelihood) &&
        record.likelihood >= 0 &&
        record.likelihood <= 1
          ? record.likelihood
          : undefined,
      impact:
        typeof record.impact === "number" &&
        Number.isFinite(record.impact) &&
        record.impact >= 0 &&
        record.impact <= 1
          ? record.impact
          : undefined,
      consequences,
      responsibilities,
      children,
    };
  };

  const draftEventualities = Array.isArray(args.draft.eventualities) ? args.draft.eventualities : [];
  if (!Array.isArray(args.draft.eventualities)) diagnostics.filledDefaults.push("eventualities:[]");
  const eventualities = draftEventualities
    .map((value, index) => mapEventualityNode(value, `eventualities[${index}]`))
    .filter((item): item is AnalyzeResult["eventualities"][number] => Boolean(item));

  const draftDecisionTrees = Array.isArray(args.draft.decisionTrees) ? args.draft.decisionTrees : [];
  if (!Array.isArray(args.draft.decisionTrees)) diagnostics.filledDefaults.push("decisionTrees:[]");
  const decisionTrees: AnalyzeResult["decisionTrees"] = [];
  for (let index = 0; index < draftDecisionTrees.length; index += 1) {
    const record = asRecord(draftDecisionTrees[index]);
    if (!record) continue;
    const rootStatementId = asString(record.rootStatementId);
    const options = asRecord(record.options);
    if (!rootStatementId || !options) continue;
    const pro = mapEventualityNode(options.pro, `decisionTrees[${index}].options.pro`);
    const contra = mapEventualityNode(options.contra, `decisionTrees[${index}].options.contra`);
    if (!pro || !contra) continue;
    const neutral = mapEventualityNode(options.neutral, `decisionTrees[${index}].options.neutral`);
    decisionTrees.push({
      id: asString(record.id) ?? nextId("decision-tree", `decisionTrees[${index}].id`),
      rootStatementId,
      locale: asString(record.locale) ?? args.language,
      createdAt: asString(record.createdAt) ?? new Date().toISOString(),
      updatedAt: asString(record.updatedAt) ?? undefined,
      options: {
        pro,
        ...(neutral ? { neutral } : {}),
        contra,
      },
    });
  }

  const impactSource = asRecord(args.draft.impactAndResponsibility);
  if (!impactSource) diagnostics.filledDefaults.push("impactAndResponsibility:empty_containers");
  const impactsRaw = Array.isArray(impactSource?.impacts) ? impactSource.impacts : [];
  const responsibleActorsRaw = Array.isArray(impactSource?.responsibleActors)
    ? impactSource.responsibleActors
    : [];
  const impacts: AnalyzeResult["impactAndResponsibility"]["impacts"] = impactsRaw
    .map((value) => asRecord(value))
    .filter((item): item is Record<string, unknown> => Boolean(item))
    .map((item) => ({
      type: asString(item.type) ?? "unknown",
      description: asString(item.description) ?? "",
      confidence: asBoundedProbability(item.confidence),
    }))
    .filter((item) => item.description.length > 0);
  const responsibleActors: AnalyzeResult["impactAndResponsibility"]["responsibleActors"] =
    responsibleActorsRaw
      .map((value) => asRecord(value))
      .filter((item): item is Record<string, unknown> => Boolean(item))
      .map((item) => ({
        level: asString(item.level) ?? "unknown",
        hint: asString(item.hint ?? item.actor ?? item.displayName) ?? "",
        confidence: asBoundedProbability(item.confidence),
      }))
      .filter((item) => item.hint.length > 0);

  const participationRaw = Array.isArray(args.draft.participationCandidates)
    ? args.draft.participationCandidates
    : [];
  if (!Array.isArray(args.draft.participationCandidates)) {
    diagnostics.filledDefaults.push("participationCandidates:[]");
  }
  const participationCandidates: AnalyzeResult["participationCandidates"] = [];
  for (let index = 0; index < participationRaw.length; index += 1) {
    const entry = participationRaw[index];
    if (typeof entry === "string") {
      participationCandidates.push({
        id: nextId("participation", `participationCandidates[${index}].id`),
        text: entry,
      });
      continue;
    }
    const record = asRecord(entry);
    if (!record) continue;
    const text = asString(record.text);
    if (!text) continue;
    participationCandidates.push({
      id: asString(record.id) ?? nextId("participation", `participationCandidates[${index}].id`),
      text,
      rationale: asString(record.rationale) ?? undefined,
      stance: resolveStance(record.stance) ?? undefined,
      dimension: asString(record.dimension) ?? undefined,
    });
  }

  const reportSource = asRecord(args.draft.report);
  if (!reportSource) diagnostics.missingContainers.push("report");
  const reportFacts = asRecord(reportSource?.facts);
  if (!reportFacts) diagnostics.filledDefaults.push("report.facts:{local:[],international:[]}");
  const factsLocal = asStringArray(reportFacts?.local);
  const factsInternational = asStringArray(reportFacts?.international);
  if (!Array.isArray(reportFacts?.local)) diagnostics.filledDefaults.push("report.facts.local:[]");
  if (!Array.isArray(reportFacts?.international)) {
    diagnostics.filledDefaults.push("report.facts.international:[]");
  }

  const summary = asNullableString(reportSource?.summary);
  if (summary === null) {
    diagnostics.buildWarnings.push("report.summary missing in draft; neutral summary fallback was used.");
  }

  const candidate: AnalyzeResult = {
    mode: "E150",
    sourceText: args.draft.sourceText ?? args.sourceText,
    language: asString(args.draft.language) ?? args.language,
    claims,
    findings,
    notes,
    questions,
    missingPerspectives,
    knots,
    consequences: {
      consequences: mappedConsequences,
      responsibilities: mappedResponsibilities,
    },
    responsibilityPaths,
    eventualities,
    decisionTrees,
    impactAndResponsibility: {
      impacts,
      responsibleActors,
    },
    participationCandidates,
    report: {
      summary: summary ?? buildNeutralSummary(args.sourceText),
      keyConflicts: asStringArray(reportSource?.keyConflicts),
      facts: {
        local: factsLocal,
        international: factsInternational,
      },
      openQuestions: asStringArray(reportSource?.openQuestions),
      takeaways: asStringArray(reportSource?.takeaways),
    },
  };

  diagnostics.filledDefaults = uniqueStrings(diagnostics.filledDefaults);
  diagnostics.missingContainers = uniqueStrings(diagnostics.missingContainers);
  diagnostics.normalizedEnumWarnings = uniqueStrings(diagnostics.normalizedEnumWarnings);
  diagnostics.generatedIds = uniqueStrings(diagnostics.generatedIds);
  diagnostics.buildWarnings = uniqueStrings(diagnostics.buildWarnings);

  return { candidate, diagnostics };
}

function runDeterministicDraftEnvelopeBuild(params: {
  provider: E150ProviderName;
  sourceText: string;
  strictValidation: FullContractValidation;
  rawText: string;
}): DraftEnvelopeBuildResult {
  const emptyDiagnostics: AnalyzeEnvelopeBuildDiagnostics = {
    filledDefaults: [],
    missingContainers: [],
    normalizedEnumWarnings: [],
    generatedIds: [],
    buildWarnings: [],
  };

  if (!params.strictValidation.parsed) {
    return {
      attempted: false,
      draftStatus: "not_attempted",
      envelopeBuildStatus: "not_attempted",
      finalSchemaStatus: "not_started",
      finalContractStatus: null,
      strictValidation: params.strictValidation,
      candidate: null,
      diagnostics: emptyDiagnostics,
    };
  }

  const parsedRoot = params.strictValidation.parsed;
  let draftPayload: unknown = parsedRoot;
  const preWarnings: string[] = [];
  if (Array.isArray(parsedRoot)) {
    draftPayload = { claims: parsedRoot };
    preWarnings.push("Top-level array detected; treated as draft.claims for deterministic envelope build.");
  } else if (!asRecord(parsedRoot)) {
    return {
      attempted: true,
      draftStatus: "failed",
      envelopeBuildStatus: "failed",
      finalSchemaStatus: "failed",
      finalContractStatus: null,
      strictValidation: params.strictValidation,
      candidate: null,
      diagnostics: {
        ...emptyDiagnostics,
        buildWarnings: ["Draft payload is not an object and cannot be transformed deterministically."],
      },
    };
  }

  const draftParsed = DraftAnalysisSchema.safeParse(draftPayload);
  if (!draftParsed.success) {
    const first = draftParsed.error.issues[0];
    return {
      attempted: true,
      draftStatus: "failed",
      envelopeBuildStatus: "failed",
      finalSchemaStatus: "failed",
      finalContractStatus: null,
      strictValidation: params.strictValidation,
      candidate: null,
      diagnostics: {
        ...emptyDiagnostics,
        buildWarnings: [
          ...preWarnings,
          `DraftAnalysis validation failed at ${Array.isArray(first?.path) ? first.path.join(".") || "$" : "$"}: ${first?.message ?? "invalid_draft"}`,
        ],
      },
    };
  }

  const built = buildAnalyzeResultEnvelopeFromDraft({
    provider: params.provider,
    sourceText: params.sourceText,
    language: "de",
    draft: draftParsed.data,
    rawText: params.rawText,
  });
  const mergedDiagnostics: AnalyzeEnvelopeBuildDiagnostics = {
    ...built.diagnostics,
    buildWarnings: uniqueStrings([...preWarnings, ...built.diagnostics.buildWarnings]),
  };
  const schema = AnalyzeResultSchema.safeParse(built.candidate);
  if (schema.success) {
    return {
      attempted: true,
      draftStatus: "ok",
      envelopeBuildStatus: "ok",
      finalSchemaStatus: "ok",
      finalContractStatus: "built_valid",
      strictValidation: params.strictValidation,
      candidate: schema.data,
      diagnostics: mergedDiagnostics,
    };
  }

  const first = schema.error.issues[0];
  const errorMessage = first?.message ?? "schema_validation_failed_after_envelope_build";
  const schemaPath = Array.isArray(first?.path) ? first.path.join(".") || "$" : "$";
  return {
    attempted: true,
    draftStatus: "ok",
    envelopeBuildStatus: "failed",
    finalSchemaStatus: "failed",
    finalContractStatus: null,
    strictValidation: {
      ...params.strictValidation,
      providerErrorCode: "SCHEMA_INVALID",
      errorMessage,
      reason: errorMessage,
      schemaError: errorMessage,
      schemaPath,
      rawExcerpt: params.strictValidation.cleanedCandidate?.slice(0, 500) ?? params.strictValidation.rawExcerpt,
    },
    candidate: built.candidate,
    diagnostics: {
      ...mergedDiagnostics,
      buildWarnings: uniqueStrings([
        ...mergedDiagnostics.buildWarnings,
        `Envelope build output failed AnalyzeResultSchema at ${schemaPath}: ${errorMessage}`,
      ]),
    },
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
  const resolvedModel = openAiSmokeModel();
  const modelSource = openAiSmokeModelSource();
  const smokeModelEnvPresent = Boolean(process.env.OPENAI_SMOKE_MODEL);
  const timeoutMs = openAiSmokeTimeoutMs();
  const timeoutSource = openAiSmokeTimeoutSource();
  const maxOutputTokens = openAiSmokeMaxOutputTokens();
  const maxOutputSource = openAiSmokeMaxOutputTokensSource();
  return `OpenAI smoke profile: selectedSmokeModel=${resolvedModel} (source=${modelSource}, OPENAI_SMOKE_MODEL=${smokeModelEnvPresent ? "present" : "missing"}), timeoutMs=${timeoutMs} (source=${timeoutSource}), maxOutputTokens=${maxOutputTokens} (source=${maxOutputSource}).`;
}

function isOpenAiSmokeModelMismatch(params: {
  selectedSmokeModel: string | null;
  effectiveModel: string | null;
  smokeModelEnvPresent: boolean;
}): boolean {
  if (!params.smokeModelEnvPresent) return false;
  if (!params.selectedSmokeModel || !params.effectiveModel) return false;
  return params.selectedSmokeModel.trim().toLowerCase() !== params.effectiveModel.trim().toLowerCase();
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

function buildProviderFullContractPrompt(provider: E150ProviderName): string {
  const compactEnvelopeHint = [
    "Required top-level keys (must all be present exactly once):",
    FULL_CONTRACT_REQUIRED_TOP_LEVEL_KEYS_LABEL,
    "Return exactly one top-level JSON object.",
    "The top-level object must satisfy AnalyzeResultSchema.",
    "Never return an array as the top-level value.",
    "Never return only claims.",
    "Include all required top-level keys.",
    "report.facts.local must always be an array.",
    "report.facts.international must always be an array.",
    "If no local facts are available, return report.facts.local: [].",
    "If no international facts are available, return report.facts.international: [].",
    "Never omit either report.facts.local or report.facts.international.",
    "For consequences.scope never use \"local\".",
    "Allowed scope values are only: local_short, local_long, national, global, systemic.",
  ].join(" ");

  const providerHint =
    provider === "anthropic"
      ? [
          "Anthropic-specific full-contract envelope:",
          "Return exactly one top-level JSON object.",
          "Never return a top-level array.",
          "Never return only claims.",
          compactEnvelopeHint,
        ].join(" ")
      : provider === "mistral"
        ? [
            "Mistral-specific full-contract envelope:",
            "response_format=json_object is active. Return the complete AnalyzeResult envelope.",
            "Return exactly one top-level JSON object.",
            "Never return a top-level array.",
            "Never return only claims.",
            compactEnvelopeHint,
          ].join(" ")
        : provider === "openai"
          ? [
              "OpenAI-specific contract reminder:",
              "Structured JSON output is requested. Return the AnalyzeResult object itself.",
              "Do not wrap the object in an array.",
              compactEnvelopeHint,
            ].join(" ")
          : [
              "Contract reminder:",
              "Return exactly one AnalyzeResult object, not an array.",
              compactEnvelopeHint,
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
  profileMaxOutputTokens?: number;
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
    const maxOutputTokens =
      params.maxOutputTokens ?? params.profileMaxOutputTokens ?? openAiSmokeMaxOutputTokens();
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
      maxOutputTokens:
        params.maxOutputTokens ??
        (params.repairAttempt
          ? Math.min(params.profileMaxOutputTokens ?? FULL_CONTRACT_REPAIR_MAX_OUTPUT_TOKENS, FULL_CONTRACT_REPAIR_MAX_OUTPUT_TOKENS)
          : params.profileMaxOutputTokens ?? FULL_CONTRACT_DEFAULT_MAX_OUTPUT_TOKENS),
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
      maxOutputTokens:
        params.maxOutputTokens ??
        (params.repairAttempt
          ? Math.min(params.profileMaxOutputTokens ?? FULL_CONTRACT_REPAIR_MAX_OUTPUT_TOKENS, FULL_CONTRACT_REPAIR_MAX_OUTPUT_TOKENS)
          : params.profileMaxOutputTokens ?? FULL_CONTRACT_DEFAULT_MAX_OUTPUT_TOKENS),
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
      maxOutputTokens:
        params.maxOutputTokens ??
        (params.repairAttempt
          ? Math.min(params.profileMaxOutputTokens ?? FULL_CONTRACT_REPAIR_MAX_OUTPUT_TOKENS, FULL_CONTRACT_REPAIR_MAX_OUTPUT_TOKENS)
          : params.profileMaxOutputTokens ?? FULL_CONTRACT_DEFAULT_MAX_OUTPUT_TOKENS),
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
    maxOutputTokens:
      params.maxOutputTokens ??
      (params.repairAttempt
        ? Math.min(params.profileMaxOutputTokens ?? FULL_CONTRACT_REPAIR_MAX_OUTPUT_TOKENS, FULL_CONTRACT_REPAIR_MAX_OUTPUT_TOKENS)
        : params.profileMaxOutputTokens ?? FULL_CONTRACT_DEFAULT_MAX_OUTPUT_TOKENS),
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
  disableRepair?: boolean;
  profileMaxOutputTokens?: number;
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
  if (params.disableRepair) {
    return {
      attempted: false,
      blocked: false,
      reason: "repair_disabled",
      status: "not_attempted",
      providerErrorCode: null,
      schemaPath: params.strictValidation.schemaPath,
      errorKind: null,
      errorMessage: params.strictValidation.errorMessage,
      parseStatus: "not_started",
      schemaStatus: "not_started",
      rawExcerpt: null,
    };
  }

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
      profileMaxOutputTokens: params.profileMaxOutputTokens,
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

async function runDirectFullContractProvider(
  provider: E150ProviderName,
  options?: DirectFullContractRunOptions,
): Promise<ProviderDiagnostic> {
  const resolvedOptions = resolveDirectFullContractOptions(provider, options);
  const runCostGroup: RunCostGroup = resolvedOptions.mode === "full-lite" ? "lite" : "full";
  const budgetProfile: SmokeBudgetProfile =
    resolvedOptions.mode === "full-lite" ? "full_lite" : "full_default";
  const missingReason = configMissingReason(provider);
  const isOpenAi = provider === "openai";
  const openAiSelectedSmokeModel = isOpenAi ? openAiSmokeModel() : null;
  const openAiSmokeEnvPresent = isOpenAi ? Boolean(process.env.OPENAI_SMOKE_MODEL) : null;
  const openAiTimeoutMs = isOpenAi ? openAiSmokeTimeoutMs() : null;
  const openAiMaxOutputTokens = isOpenAi ? resolvedOptions.maxOutputTokens : null;
  const openAiProfileNote = isOpenAi ? openAiSmokeConfigDiagnosticNote() : null;
  if (missingReason) {
    const missingModel = isOpenAi ? openAiSelectedSmokeModel ?? OPENAI_SMOKE_DEFAULT_MODEL : defaultModelForProvider(provider);
    return baseDiagnostic({
      provider,
      mode: "full_contract",
      stage: "analyze_contract",
      pipeline: "provider_probe",
      model: missingModel,
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
      directStrictStatus: "blocked",
      draftStatus: "not_attempted",
      envelopeBuildStatus: "not_attempted",
      finalSchemaStatus: "not_started",
      finalContractStatus: "blocked",
      formatUsed: null,
      didFallback: null,
      timeoutMs: openAiTimeoutMs,
      maxOutputTokens: openAiMaxOutputTokens,
      selectedSmokeModel: openAiSelectedSmokeModel,
      smokeModelEnvPresent: openAiSmokeEnvPresent,
      effectiveModel: missingModel,
      openAiSmokeModelMismatch: false,
      runCostGroup,
      smokeMode: resolvedOptions.mode,
      budgetProfile,
      diagnosticNotes: mergeDiagnosticNotes(provider, [
        "Provider configuration missing.",
        openAiProfileNote,
        `repairPolicy=${resolvedOptions.disableRepair ? "disabled" : "enabled"}`,
        `budgetProfile=${budgetProfile}`,
      ]),
    });
  }

  const started = Date.now();
  const prompt = buildProviderFullContractPrompt(provider);

  try {
    const strictCall = await executeDirectFullContractCall({
      provider,
      prompt,
      repairAttempt: false,
      profileMaxOutputTokens: resolvedOptions.maxOutputTokens,
    });
    const strictValidation = validateFullContractPayload(strictCall.text ?? "");
    const strictEffectiveModel = strictCall.model ?? defaultModelForProvider(provider);
    const openAiSmokeModelMismatch =
      isOpenAi &&
      isOpenAiSmokeModelMismatch({
        selectedSmokeModel: openAiSelectedSmokeModel,
        effectiveModel: strictEffectiveModel,
        smokeModelEnvPresent: Boolean(openAiSmokeEnvPresent),
      });

    if (strictValidation.ok) {
      return baseDiagnostic({
        provider,
        mode: "full_contract",
        stage: "analyze_contract",
        pipeline: "provider_probe",
        model: strictEffectiveModel,
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
        directStrictStatus: "ok",
        draftStatus: "not_attempted",
        envelopeBuildStatus: "not_attempted",
        finalSchemaStatus: "ok",
        finalContractStatus: "strict_ok",
        formatUsed: strictCall.formatUsed,
        didFallback: strictCall.didFallback,
        timeoutMs: strictCall.timeoutMs,
        maxOutputTokens: strictCall.maxOutputTokens,
        openaiErrorCode: strictCall.openaiErrorCode,
        openaiErrorMessage: strictCall.openaiErrorMessage,
        selectedSmokeModel: openAiSelectedSmokeModel,
        smokeModelEnvPresent: openAiSmokeEnvPresent,
        effectiveModel: strictEffectiveModel,
        openAiSmokeModelMismatch,
        runCostGroup,
        smokeMode: resolvedOptions.mode,
        budgetProfile,
        diagnosticNotes: mergeDiagnosticNotes(provider, [
          openAiProfileNote,
          isOpenAi ? `effectiveModel=${strictEffectiveModel}` : null,
          openAiSmokeModelMismatch
            ? "OPENAI_SMOKE_MODEL mismatch: provider returned a different effective model than selectedSmokeModel."
            : null,
          strictCall.formatUsed ? `formatUsed=${strictCall.formatUsed}` : null,
          strictCall.didFallback ? "Strict call used OpenAI json_object fallback." : null,
          strictCall.openaiErrorCode ? `openaiErrorCode=${strictCall.openaiErrorCode}` : null,
          strictCall.openaiErrorMessage ? `openaiErrorMessage=${strictCall.openaiErrorMessage}` : null,
          `repairPolicy=${resolvedOptions.disableRepair ? "disabled" : "enabled"}`,
          `budgetProfile=${budgetProfile}`,
        ]),
      });
    }

    let strictCode = normalizeErrorCode({
      providerErrorCode: strictValidation.providerErrorCode,
      errorKind: strictValidation.errorKind,
      httpStatus: 200,
      message: strictValidation.errorMessage,
    });
    const blockedStrict = isBlockedContractError(strictCode);
    const built = runDeterministicDraftEnvelopeBuild({
      provider,
      sourceText: FULL_SAMPLE_TEXT,
      strictValidation,
      rawText: strictCall.text ?? "",
    });

    if (built.finalContractStatus === "built_valid") {
      return baseDiagnostic({
        provider,
        mode: "full_contract",
        stage: "analyze_contract",
        pipeline: "provider_probe",
        model: strictEffectiveModel,
        status: "degraded",
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
        repairAttempted: false,
        repairStatus: "not_attempted",
        repairProviderErrorCode: null,
        repairSchemaPath: null,
        repairReason: "builder_preferred_over_repair",
        repairUsed: false,
        directStrictStatus: blockedStrict ? "blocked" : "failed",
        draftStatus: built.draftStatus,
        envelopeBuildStatus: built.envelopeBuildStatus,
        finalSchemaStatus: built.finalSchemaStatus,
        finalContractStatus: "built_valid",
        buildWarnings: built.diagnostics.buildWarnings,
        filledDefaults: built.diagnostics.filledDefaults,
        missingContainers: built.diagnostics.missingContainers,
        normalizedEnumWarnings: built.diagnostics.normalizedEnumWarnings,
        generatedIds: built.diagnostics.generatedIds,
        formatUsed: strictCall.formatUsed,
        didFallback: strictCall.didFallback,
        timeoutMs: strictCall.timeoutMs,
        maxOutputTokens: strictCall.maxOutputTokens,
        openaiErrorCode: strictCall.openaiErrorCode,
        openaiErrorMessage: strictCall.openaiErrorMessage,
        selectedSmokeModel: openAiSelectedSmokeModel,
        smokeModelEnvPresent: openAiSmokeEnvPresent,
        effectiveModel: strictEffectiveModel,
        openAiSmokeModelMismatch,
        runCostGroup,
        smokeMode: resolvedOptions.mode,
        budgetProfile,
        diagnosticNotes: mergeDiagnosticNotes(provider, [
          openAiProfileNote,
          isOpenAi ? `effectiveModel=${strictEffectiveModel}` : null,
          openAiSmokeModelMismatch
            ? "OPENAI_SMOKE_MODEL mismatch: provider returned a different effective model than selectedSmokeModel."
            : null,
          strictCall.formatUsed ? `formatUsed=${strictCall.formatUsed}` : null,
          strictCall.didFallback ? "Strict call used OpenAI json_object fallback." : null,
          strictCall.openaiErrorCode ? `openaiErrorCode=${strictCall.openaiErrorCode}` : null,
          strictCall.openaiErrorMessage ? `openaiErrorMessage=${strictCall.openaiErrorMessage}` : null,
          "Direct strict failed; deterministic AnalyzeResult envelope build produced schema-valid output.",
          `repairPolicy=${resolvedOptions.disableRepair ? "disabled" : "enabled"}`,
          `budgetProfile=${budgetProfile}`,
        ]),
      });
    }

    if (built.strictValidation !== strictValidation) {
      strictCode = normalizeErrorCode({
        providerErrorCode: built.strictValidation.providerErrorCode,
        errorKind: built.strictValidation.errorKind,
        httpStatus: 200,
        message: built.strictValidation.errorMessage,
      });
    }
    const repair = await runFullContractRepairAttempt({
      provider,
      rawText: strictCall.text ?? "",
      strictValidation: built.strictValidation,
      disableRepair: resolvedOptions.disableRepair,
      profileMaxOutputTokens: resolvedOptions.maxOutputTokens,
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
      model: strictEffectiveModel,
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
      adapterStatus: built.strictValidation.adapterStatus,
      parseStatus: built.strictValidation.parseStatus,
      schemaStatus: built.strictValidation.schemaStatus,
      parseError: built.strictValidation.parseError,
      schemaError: built.strictValidation.schemaError,
      schemaPath: built.strictValidation.schemaPath,
      rawExcerpt: built.strictValidation.rawExcerpt ?? strictCall.text,
      durationMs: Date.now() - started,
      tokensIn: strictCall.tokensIn,
      tokensOut: strictCall.tokensOut,
      journeyDecision: "selected",
      strictStatus: blockedStrict ? "blocked" : "failed",
      strictProviderErrorCode: strictCode,
      strictSchemaPath: built.strictValidation.schemaPath ?? strictValidation.schemaPath,
      repairAttempted: repair.attempted,
      repairStatus: repair.status,
      repairProviderErrorCode: repair.providerErrorCode,
      repairSchemaPath: repair.schemaPath,
      repairReason: repair.reason,
      repairUsed: repair.attempted,
      directStrictStatus: blockedStrict ? "blocked" : "failed",
      draftStatus: built.draftStatus,
      envelopeBuildStatus: built.envelopeBuildStatus,
      finalSchemaStatus:
        finalContractStatus === "repaired_degraded"
          ? "ok"
          : built.finalSchemaStatus === "failed"
            ? "failed"
            : strictValidation.schemaStatus === "ok"
              ? "ok"
              : strictValidation.schemaStatus === "failed"
                ? "failed"
                : "not_started",
      finalContractStatus,
      buildWarnings: built.diagnostics.buildWarnings,
      filledDefaults: built.diagnostics.filledDefaults,
      missingContainers: built.diagnostics.missingContainers,
      normalizedEnumWarnings: built.diagnostics.normalizedEnumWarnings,
      generatedIds: built.diagnostics.generatedIds,
      formatUsed: strictCall.formatUsed,
      didFallback: strictCall.didFallback,
      timeoutMs: strictCall.timeoutMs,
      maxOutputTokens: strictCall.maxOutputTokens,
      openaiErrorCode: strictCall.openaiErrorCode,
      openaiErrorMessage: strictCall.openaiErrorMessage,
      selectedSmokeModel: openAiSelectedSmokeModel,
      smokeModelEnvPresent: openAiSmokeEnvPresent,
      effectiveModel: strictEffectiveModel,
      openAiSmokeModelMismatch,
      runCostGroup,
      smokeMode: resolvedOptions.mode,
      budgetProfile,
      diagnosticNotes: mergeDiagnosticNotes(provider, [
        openAiProfileNote,
        isOpenAi ? `effectiveModel=${strictEffectiveModel}` : null,
        openAiSmokeModelMismatch
          ? "OPENAI_SMOKE_MODEL mismatch: provider returned a different effective model than selectedSmokeModel."
          : null,
        strictCall.formatUsed ? `formatUsed=${strictCall.formatUsed}` : null,
        strictCall.didFallback ? "Strict call used OpenAI json_object fallback." : null,
        strictCall.openaiErrorCode ? `openaiErrorCode=${strictCall.openaiErrorCode}` : null,
        strictCall.openaiErrorMessage ? `openaiErrorMessage=${strictCall.openaiErrorMessage}` : null,
        built.draftStatus === "ok" ? "Draft parsing completed for deterministic envelope build." : null,
        repair.attempted ? "Repair attempt executed as degraded fallback." : "Repair not attempted.",
        `repairPolicy=${resolvedOptions.disableRepair ? "disabled" : "enabled"}`,
        `budgetProfile=${budgetProfile}`,
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
    const effectiveModel = isOpenAi
      ? error?.meta?.model ?? openAiSelectedSmokeModel ?? OPENAI_SMOKE_DEFAULT_MODEL
      : error?.meta?.model ?? defaultModelForProvider(provider);
    const openAiSmokeModelMismatch =
      isOpenAi &&
      isOpenAiSmokeModelMismatch({
        selectedSmokeModel: openAiSelectedSmokeModel,
        effectiveModel,
        smokeModelEnvPresent: Boolean(openAiSmokeEnvPresent),
      });

    return baseDiagnostic({
      provider,
      mode: "full_contract",
      stage: "analyze_contract",
      pipeline: "provider_probe",
      model: effectiveModel,
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
      directStrictStatus: blocked ? "blocked" : "failed",
      draftStatus: "not_attempted",
      envelopeBuildStatus: "not_attempted",
      finalSchemaStatus: "not_started",
      finalContractStatus,
      formatUsed: null,
      didFallback: null,
      timeoutMs: openAiTimeoutMs,
      maxOutputTokens: openAiMaxOutputTokens,
      openaiErrorCode: isOpenAi ? providerCode : null,
      openaiErrorMessage: isOpenAi ? error?.message ?? "direct_full_contract_failed" : null,
      selectedSmokeModel: openAiSelectedSmokeModel,
      smokeModelEnvPresent: openAiSmokeEnvPresent,
      effectiveModel,
      openAiSmokeModelMismatch,
      runCostGroup,
      smokeMode: resolvedOptions.mode,
      budgetProfile,
      diagnosticNotes: mergeDiagnosticNotes(provider, [
        openAiProfileNote,
        isOpenAi ? `effectiveModel=${effectiveModel}` : null,
        openAiSmokeModelMismatch
          ? "OPENAI_SMOKE_MODEL mismatch: provider returned a different effective model than selectedSmokeModel."
          : null,
        blocked ? "Strict call blocked by account/runtime condition." : "Strict call failed before validation.",
        `repairPolicy=${resolvedOptions.disableRepair ? "disabled" : "enabled"}`,
        `budgetProfile=${budgetProfile}`,
      ]),
    });
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __EDEBATTE_ROUTE_DIRECT_FULL_PROVIDER__:
    | ((provider: E150ProviderName, options?: DirectFullContractRunOptions) => Promise<ProviderDiagnostic>)
    | undefined;
}

globalThis.__EDEBATTE_ROUTE_DIRECT_FULL_PROVIDER__ = runDirectFullContractProvider;

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
  lane: OrchestrationLane;
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
  const directRows = params.directContractRows ? sortProviderDiagnostics(params.directContractRows) : undefined;
  const ok =
    params.mode === "full_contract"
      ? params.orchestratorOk && params.createAnalyzeApi.ok
      : sortedRows.some((row) => row.status === "ok");

  const operationalSummary = resolveOperationalProviderRoutingSummary({
    lane: params.lane,
    rows: sortedRows,
    directContractRows: directRows,
  });

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
    directContractRows: directRows,
    results: sortedRows.map(toLegacyResult),
    error: params.error,
    ...(params.probeMaps ?? {}),
    operationalSummary,
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
  lane: OrchestrationLane;
  runId: string;
  correlationId: string;
  startedAt: number;
}): Promise<OrchestratorSmokeResponse> {
  const rows = await Promise.all(PROVIDER_ORDER.map((provider) => runDirectProviderProbe(provider)));
  return buildResponse({
    mode: "provider_probe",
    lane: base.lane,
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
  lane: OrchestrationLane;
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
      lane: base.lane,
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
      lane: base.lane,
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
  lane: OrchestrationLane;
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
      lane: base.lane,
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
    lane: base.lane,
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
  const lane = normalizeLane(req.nextUrl.searchParams.get("lane"), mode);
  const runId = crypto.randomUUID();
  const correlationId = runId;
  const startedAt = Date.now();

  try {
    const { requireAdminOrResponse } = await import("@/lib/server/auth/admin");
    const gate = await requireAdminOrResponse(req);
    if (gate instanceof Response) return gate;

    if (mode === "provider_probe") {
      const response = await runProviderProbeMode({ lane, runId, correlationId, startedAt });
      return NextResponse.json(response);
    }
    if (mode === "full_contract") {
      const response = await runFullMode({ lane, runId, correlationId, startedAt });
      return NextResponse.json(response);
    }

    const response = await runRuntimeMode({ lane, runId, correlationId, startedAt });
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
      operationalSummary: resolveOperationalProviderRoutingSummary({
        lane,
        rows: [],
        directContractRows: [],
      }),
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
