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

function openAiSmokeTimeoutMs(): number {
  const raw = Number(process.env.OPENAI_SMOKE_TIMEOUT_MS ?? 60_000);
  return Number.isFinite(raw) && raw > 0 ? raw : 60_000;
}

function openAiSmokeMaxOutputTokens(): number {
  const raw = Number(process.env.OPENAI_SMOKE_MAX_OUTPUT_TOKENS ?? 2_200);
  return Number.isFinite(raw) && raw > 0 ? raw : 2_200;
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
}): ProviderDiagnostic {
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
    formatUsed: null,
    didFallback: row.fallbackUsed,
    openaiErrorCode: row.provider === "openai" ? row.providerErrorCode : null,
    openaiErrorMessage: row.provider === "openai" ? row.errorMessage : null,
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

function validateFullContractPayload(rawText: string): {
  status: ProviderDiagnostic["status"];
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
} {
  const raw = rawText ?? "";
  const candidate = extractJsonCandidate(raw) ?? cleanJson(raw);
  const cleaned = candidate.trim();

  if (!cleaned) {
    const reason = looksLikeHtmlOrUpstreamError(raw)
      ? "upstream_bad_response"
      : "no_json_object_found";
    return {
      status: "failed",
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
      status: "failed",
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
      status: "failed",
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
      status: "failed",
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
      status: "failed",
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
    status: "ok",
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

async function runDirectFullContractProvider(provider: E150ProviderName): Promise<ProviderDiagnostic> {
  const missingReason = configMissingReason(provider);
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
    });
  }

  const started = Date.now();
  const prompt = `${FULL_CONTRACT_SYSTEM_PROMPT}\n\nInput:\n${FULL_SAMPLE_TEXT}`;

  try {
    let text = "";
    let model: string | undefined;
    let tokensIn: number | undefined;
    let tokensOut: number | undefined;

    if (provider === "openai") {
      const res = await callOpenAI({
        prompt,
        asJson: true,
        forceJsonFormat: true,
        model: openAiSmokeModel(),
        timeoutMs: openAiSmokeTimeoutMs(),
        maxOutputTokens: openAiSmokeMaxOutputTokens(),
      });
      text = res.text;
      model = res.model;
      tokensIn = res.tokensIn;
      tokensOut = res.tokensOut;
    } else if (provider === "anthropic") {
      const res = await callAnthropic({ prompt, maxOutputTokens: 2600 });
      text = res.text;
      model = res.model;
      tokensIn = res.tokensIn;
      tokensOut = res.tokensOut;
    } else if (provider === "mistral") {
      const res = await callMistral({ prompt, maxOutputTokens: 2600 });
      text = res.text;
      model = res.model;
      tokensIn = res.tokensIn;
      tokensOut = res.tokensOut;
    } else if (provider === "gemini") {
      const res = await callGemini({ prompt, maxOutputTokens: 2600, expectJson: true });
      text = res.text;
      model = res.model;
      tokensIn = res.tokensIn;
      tokensOut = res.tokensOut;
    } else {
      const res = await callAriLLM({ prompt, asJson: true, maxOutputTokens: 2600 });
      text = res.text;
      model = res.model;
      tokensIn = res.tokensIn;
      tokensOut = res.tokensOut;
    }

    const validation = validateFullContractPayload(text ?? "");

    return baseDiagnostic({
      provider,
      mode: "full_contract",
      stage: "analyze_contract",
      pipeline: "provider_probe",
      model: model ?? defaultModelForProvider(provider),
      status: validation.status,
      errorKind: validation.errorKind,
      providerErrorCode: validation.providerErrorCode,
      httpStatus: 200,
      errorMessage: validation.errorMessage,
      reason: validation.reason,
      validationMode: "analyze_schema",
      providerStatus: "reachable",
      adapterStatus: validation.adapterStatus,
      parseStatus: validation.parseStatus,
      schemaStatus: validation.schemaStatus,
      parseError: validation.parseError,
      schemaError: validation.schemaError,
      schemaPath: validation.schemaPath,
      rawExcerpt: validation.rawExcerpt ?? text,
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
      mode: "full_contract",
      stage: "analyze_contract",
      pipeline: "provider_probe",
      model: error?.meta?.model ?? defaultModelForProvider(provider),
      status: looksConfigMissing(error?.message) ? "config_missing" : "failed",
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

function normalizeClaimItems(value: unknown): unknown {
  if (!Array.isArray(value)) return value;

  return value.map((item, index) => {
    if (typeof item === "string") {
      return {
        id: `claim-${index + 1}`,
        text: item.trim() || `Claim ${index + 1}`,
      };
    }

    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      const text =
        typeof record.text === "string"
          ? record.text
          : typeof record.claim === "string"
            ? record.claim
            : typeof record.statement === "string"
              ? record.statement
              : typeof record.title === "string"
                ? record.title
                : JSON.stringify(record);

      return {
        ...record,
        id: typeof record.id === "string" ? record.id : `claim-${index + 1}`,
        text: text.trim() || `Claim ${index + 1}`,
      };
    }

    return {
      id: `claim-${index + 1}`,
      text: String(item ?? "").trim() || `Claim ${index + 1}`,
    };
  });
}

function normalizeNoteItems(value: unknown): unknown {
  if (!Array.isArray(value)) return value;

  return value.map((item, index) => {
    if (typeof item === "string") {
      return {
        id: `note-${index + 1}`,
        text: item.trim() || `Note ${index + 1}`,
      };
    }

    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      const text =
        typeof record.text === "string"
          ? record.text
          : typeof record.note === "string"
            ? record.note
            : JSON.stringify(record);

      return {
        ...record,
        id: typeof record.id === "string" ? record.id : `note-${index + 1}`,
        text: text.trim() || `Note ${index + 1}`,
      };
    }

    return {
      id: `note-${index + 1}`,
      text: String(item ?? "").trim() || `Note ${index + 1}`,
    };
  });
}

function normalizeQuestionItems(value: unknown): unknown {
  if (!Array.isArray(value)) return value;

  return value.map((item, index) => {
    if (typeof item === "string") {
      return {
        id: `question-${index + 1}`,
        text: item.trim() || `Question ${index + 1}`,
      };
    }

    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      const text =
        typeof record.text === "string"
          ? record.text
          : typeof record.question === "string"
            ? record.question
            : JSON.stringify(record);

      return {
        ...record,
        id: typeof record.id === "string" ? record.id : `question-${index + 1}`,
        text: text.trim() || `Question ${index + 1}`,
      };
    }

    return {
      id: `question-${index + 1}`,
      text: String(item ?? "").trim() || `Question ${index + 1}`,
    };
  });
}

function normalizeConsequenceItems(value: unknown): unknown {
  if (!Array.isArray(value)) return value;

  return value.map((item, index) => {
    if (typeof item === "string") {
      return {
        id: `consequence-${index + 1}`,
        scope: "local_short",
        statementIndex: 0,
        text: item.trim() || `Consequence ${index + 1}`,
      };
    }

    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      const text =
        typeof record.text === "string"
          ? record.text
          : typeof record.description === "string"
            ? record.description
            : typeof record.consequence === "string"
              ? record.consequence
              : JSON.stringify(record);

      const allowedScopes = new Set(["local_short", "local_long", "national", "global", "systemic"]);
      const scope = typeof record.scope === "string" && allowedScopes.has(record.scope)
        ? record.scope
        : "local_short";

      return {
        ...record,
        id: typeof record.id === "string" ? record.id : `consequence-${index + 1}`,
        scope,
        statementIndex: typeof record.statementIndex === "number" ? record.statementIndex : 0,
        text: text.trim() || `Consequence ${index + 1}`,
      };
    }

    return {
      id: `consequence-${index + 1}`,
      scope: "local_short",
      statementIndex: 0,
      text: String(item ?? "").trim() || `Consequence ${index + 1}`,
    };
  });
}

function normalizeResponsibilityItems(value: unknown): unknown {
  if (!Array.isArray(value)) return value;

  return value.map((item, index) => {
    if (typeof item === "string") {
      return {
        id: `responsibility-${index + 1}`,
        level: "unknown",
        text: item.trim() || `Responsibility ${index + 1}`,
      };
    }

    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      const text =
        typeof record.text === "string"
          ? record.text
          : typeof record.description === "string"
            ? record.description
            : typeof record.responsibility === "string"
              ? record.responsibility
              : JSON.stringify(record);

      const allowedLevels = new Set([
        "municipality",
        "district",
        "state",
        "federal",
        "eu",
        "ngo",
        "private",
        "unknown",
      ]);
      const level = typeof record.level === "string" && allowedLevels.has(record.level)
        ? record.level
        : "unknown";

      return {
        ...record,
        id: typeof record.id === "string" ? record.id : `responsibility-${index + 1}`,
        level,
        text: text.trim() || `Responsibility ${index + 1}`,
      };
    }

    return {
      id: `responsibility-${index + 1}`,
      level: "unknown",
      text: String(item ?? "").trim() || `Responsibility ${index + 1}`,
    };
  });
}

function normalizeImpactItems(value: unknown): unknown {
  if (!Array.isArray(value)) return value;

  return value.map((item, index) => {
    if (typeof item === "string") {
      return {
        type: "general",
        description: item.trim() || `Impact ${index + 1}`,
      };
    }

    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      const description =
        typeof record.description === "string"
          ? record.description
          : typeof record.text === "string"
            ? record.text
            : JSON.stringify(record);

      return {
        ...record,
        type: typeof record.type === "string" ? record.type : "general",
        description: description.trim() || `Impact ${index + 1}`,
      };
    }

    return {
      type: "general",
      description: String(item ?? "").trim() || `Impact ${index + 1}`,
    };
  });
}

function normalizeResponsibleActorItems(value: unknown): unknown {
  if (!Array.isArray(value)) return value;

  return value.map((item, index) => {
    if (typeof item === "string") {
      return {
        level: "unknown",
        hint: item.trim() || `Responsible actor ${index + 1}`,
      };
    }

    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      const hint =
        typeof record.hint === "string"
          ? record.hint
          : typeof record.text === "string"
            ? record.text
            : typeof record.actor === "string"
              ? record.actor
              : JSON.stringify(record);

      return {
        ...record,
        level: typeof record.level === "string" ? record.level : "unknown",
        hint: hint.trim() || `Responsible actor ${index + 1}`,
      };
    }

    return {
      level: "unknown",
      hint: String(item ?? "").trim() || `Responsible actor ${index + 1}`,
    };
  });
}

function normalizeKnotItems(value: unknown): unknown {
  if (!Array.isArray(value)) return value;

  return value.map((item, index) => {
    if (typeof item === "string") {
      const label = item.trim() || `Knot ${index + 1}`;
      return {
        id: `knot-${index + 1}`,
        label,
        description: label,
      };
    }

    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      const label =
        typeof record.label === "string"
          ? record.label
          : typeof record.text === "string"
            ? record.text
            : typeof record.title === "string"
              ? record.title
              : `Knot ${index + 1}`;

      const description =
        typeof record.description === "string"
          ? record.description
          : typeof record.text === "string"
            ? record.text
            : label;

      return {
        ...record,
        id: typeof record.id === "string" ? record.id : `knot-${index + 1}`,
        label,
        description,
      };
    }

    const label = String(item ?? "").trim() || `Knot ${index + 1}`;
    return {
      id: `knot-${index + 1}`,
      label,
      description: label,
    };
  });
}

function buildMinimalAnalyzeEnvelopeFromClaims(claimsInput: unknown[]) {
  const claims = claimsInput.map((item, index) => {
    const source =
      typeof item === "string"
        ? item
        : item && typeof item === "object"
          ? ((item as { text?: unknown; claim?: unknown; statement?: unknown; title?: unknown }).text ??
              (item as { claim?: unknown }).claim ??
              (item as { statement?: unknown }).statement ??
              (item as { title?: unknown }).title ??
              JSON.stringify(item))
          : String(item ?? "");

    return {
      id: `claim-${index + 1}`,
      text: String(source).trim() || `Claim ${index + 1}`,
    };
  });

  return {
    mode: "E150",
    sourceText: FULL_SAMPLE_TEXT,
    language: "de",
    claims,
    findings: [],
    notes: [],
    questions: [],
    missingPerspectives: [],
    knots: [],
    consequences: {
      consequences: [],
      responsibilities: [],
    },
    responsibilityPaths: [],
    eventualities: [],
    decisionTrees: [],
    impactAndResponsibility: {
      impacts: [],
      responsibleActors: [],
    },
    participationCandidates: [],
    report: {
      summary: null,
      keyConflicts: [],
      facts: {
        local: [],
        international: [],
      },
      openQuestions: [],
      takeaways: [],
    },
  };
}

function normalizeFullContractPayload(parsed: unknown): unknown {
  const envelope = Array.isArray(parsed) ? buildMinimalAnalyzeEnvelopeFromClaims(parsed) : parsed;

  if (!envelope || typeof envelope !== "object") return envelope;

  const value = envelope as Record<string, unknown>;

  const consequences =
    value.consequences && typeof value.consequences === "object"
      ? {
          ...(value.consequences as Record<string, unknown>),
          consequences: normalizeConsequenceItems(
            (value.consequences as Record<string, unknown>).consequences,
          ),
          responsibilities: normalizeResponsibilityItems(
            (value.consequences as Record<string, unknown>).responsibilities,
          ),
        }
      : value.consequences;

  const impactAndResponsibility =
    value.impactAndResponsibility && typeof value.impactAndResponsibility === "object"
      ? {
          ...(value.impactAndResponsibility as Record<string, unknown>),
          impacts: normalizeImpactItems(
            (value.impactAndResponsibility as Record<string, unknown>).impacts,
          ),
          responsibleActors: normalizeResponsibleActorItems(
            (value.impactAndResponsibility as Record<string, unknown>).responsibleActors,
          ),
        }
      : value.impactAndResponsibility;

  return {
    ...value,
    claims: normalizeClaimItems(value.claims),
    notes: normalizeNoteItems(value.notes),
    questions: normalizeQuestionItems(value.questions),
    knots: normalizeKnotItems(value.knots),
    consequences,
    impactAndResponsibility,
  };
}

function applyFullContractValidation(
  rows: ProviderDiagnostic[],
  candidates: Array<{ provider: E150ProviderName; rawText: string }> | undefined,
): ProviderDiagnostic[] {
  const parseCandidate = (rawText: string): { ok: true; parsed: unknown; excerpt: string } | { ok: false; parseError: string; excerpt: string | null } => {
    const candidate = extractJsonCandidate(rawText) ?? cleanJson(rawText);
    const cleaned = candidate.trim();
    if (!cleaned) return { ok: false, parseError: "no_json_object_found", excerpt: null };
    try {
      return { ok: true, parsed: normalizeFullContractPayload(JSON.parse(cleaned)), excerpt: cleaned.slice(0, 500) };
    } catch (error: any) {
      return {
        ok: false,
        parseError: error?.message ?? "json_parse_failed",
        excerpt: cleaned.slice(0, 500),
      };
    }
  };

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
      });
    }

    const normalized = parseCandidate(candidate.rawText ?? "");
    if (normalized.ok === false) {
      return baseDiagnostic({
        ...row,
        status: "failed",
        errorKind: "BAD_JSON",
        providerErrorCode: "BAD_JSON",
        errorMessage: normalized.parseError,
        reason: normalized.parseError,
        validationMode: "analyze_schema",
        providerStatus: "reachable",
        adapterStatus: "failed",
        parseStatus: "failed",
        schemaStatus: "not_started",
        parseError: normalized.parseError,
        schemaError: null,
        schemaPath: null,
        rawExcerpt: normalized.excerpt,
      });
    }

    const schema = AnalyzeResultSchema.safeParse(normalized.parsed);
    if (!schema.success) {
      const first = schema.error.issues[0];
      return baseDiagnostic({
        ...row,
        status: "failed",
        errorKind: "INTERNAL",
        providerErrorCode: "SCHEMA_INVALID",
        errorMessage: first?.message ?? "schema_validation_failed",
        reason: first?.message ?? "schema_validation_failed",
        validationMode: "analyze_schema",
        providerStatus: "reachable",
        adapterStatus: "failed",
        parseStatus: "ok",
        schemaStatus: "failed",
        parseError: null,
        schemaError: first?.message ?? "schema_validation_failed",
        schemaPath: Array.isArray(first?.path) ? first.path.join(".") || "$" : null,
        rawExcerpt: normalized.excerpt,
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
      rawExcerpt: normalized.excerpt,
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
