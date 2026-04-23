import { NextRequest, NextResponse } from "next/server";
import {
  callE150Orchestrator,
  type E150OrchestratorMeta,
  type E150ProviderName,
  type ProviderMatrixEntry,
} from "@features/ai/orchestratorE150";
import { analyzeContribution } from "@features/analyze/analyzeContribution";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SMOKE_SYSTEM_PROMPT =
  "You are the E150 orchestration smoke-tester. Respond exactly with 'OK'.";
const SMOKE_USER_PROMPT =
  "E150 Orchestrator Smoke Test. Please respond with exactly 'OK'.";
const FULL_SAMPLE_TEXT =
  "In unserer Stadt soll ein autofreier Sonntag pro Monat eingeführt werden, um die Luftqualität zu verbessern und den ÖPNV zu stärken. Gleichzeitig gibt es Bedenken wegen Umsatzeinbußen im Einzelhandel und fehlender Barrierefreiheit für ältere Menschen.";
const PROVIDER_ORDER: readonly E150ProviderName[] = [
  "openai",
  "anthropic",
  "mistral",
  "gemini",
  "ari",
];

type ProviderSmokeState =
  | "ok"
  | "failed"
  | "disabled"
  | "skipped"
  | "cancelled"
  | "running";

type ProviderSmokeResult = {
  providerId: E150ProviderName;
  state: ProviderSmokeState;
  ok: boolean;
  durationMs: number | null;
  errorKind: string | null;
  status: number | null;
  reason: string | null;
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
  orchestratorOk: boolean;
  bestProviderId?: E150ProviderName | null;
  bestRawText?: string | null;
  results: ProviderSmokeResult[];
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

function providerIndex(providerId: E150ProviderName): number {
  const index = PROVIDER_ORDER.indexOf(providerId);
  return index >= 0 ? index : PROVIDER_ORDER.length + 1;
}

function sortProviderResults(results: ProviderSmokeResult[]): ProviderSmokeResult[] {
  return [...results].sort(
    (left, right) => providerIndex(left.providerId) - providerIndex(right.providerId),
  );
}

function mapProviderMatrixEntry(entry: ProviderMatrixEntry): ProviderSmokeResult {
  return {
    providerId: entry.provider,
    state: entry.state,
    ok: entry.state === "ok",
    durationMs: typeof entry.durationMs === "number" ? entry.durationMs : null,
    errorKind: entry.errorKind ?? null,
    status: typeof entry.status === "number" ? entry.status : null,
    reason: entry.reason ?? null,
    model: entry.model ?? null,
    formatUsed: entry.formatUsed ?? null,
    didFallback: typeof entry.didFallback === "boolean" ? entry.didFallback : null,
    openaiErrorCode: entry.openaiErrorCode ?? null,
    openaiErrorMessage: entry.openaiErrorMessage ?? null,
  };
}

function buildProviderResultsFromMeta(
  meta: Partial<E150OrchestratorMeta> | null | undefined,
  errorMessage: string | null,
): ProviderSmokeResult[] {
  const providerMatrix = Array.isArray(meta?.providerMatrix) ? meta.providerMatrix : [];
  if (providerMatrix.length > 0) {
    return sortProviderResults(providerMatrix.map(mapProviderMatrixEntry));
  }

  const byProvider = new Map<E150ProviderName, ProviderSmokeResult>();
  for (const providerId of PROVIDER_ORDER) {
    byProvider.set(providerId, {
      providerId,
      state: "failed",
      ok: false,
      durationMs: null,
      errorKind: null,
      status: null,
      reason: errorMessage || "orchestrator_failed_without_provider_matrix",
      model: null,
      formatUsed: null,
      didFallback: null,
      openaiErrorCode: null,
      openaiErrorMessage: null,
    });
  }

  for (const item of meta?.disabledProviders ?? []) {
    if (!byProvider.has(item.provider)) continue;
    byProvider.set(item.provider, {
      ...byProvider.get(item.provider)!,
      state: "disabled",
      reason: item.reason ?? "disabled",
    });
  }
  for (const item of meta?.skippedProviders ?? []) {
    if (!byProvider.has(item.provider)) continue;
    byProvider.set(item.provider, {
      ...byProvider.get(item.provider)!,
      state: "skipped",
      reason: item.reason ?? "skipped",
    });
  }
  for (const item of meta?.failedProviders ?? []) {
    if (!byProvider.has(item.provider)) continue;
    byProvider.set(item.provider, {
      ...byProvider.get(item.provider)!,
      state: "failed",
      reason: item.error ?? byProvider.get(item.provider)!.reason,
      errorKind: item.errorKind ?? null,
    });
  }

  return sortProviderResults(Array.from(byProvider.values()));
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

function extractOrchestratorMeta(error: unknown): Partial<E150OrchestratorMeta> | null {
  const rawMeta = (error as { meta?: unknown })?.meta;
  if (!rawMeta || typeof rawMeta !== "object") return null;
  return rawMeta as Partial<E150OrchestratorMeta>;
}

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

function validateAnalyzeShapePayload(payload: any): { ok: boolean; message?: string } {
  if (!payload || typeof payload !== "object") return { ok: false, message: "empty payload" };
  if (!Array.isArray(payload.claims)) return { ok: false, message: "claims missing" };
  if (!Array.isArray(payload.notes)) return { ok: false, message: "notes missing" };
  if (!Array.isArray(payload.questions)) return { ok: false, message: "questions missing" };
  if (!Array.isArray(payload.knots)) return { ok: false, message: "knots missing" };
  return { ok: true };
}

function validateOrchestratorCandidate(rawText: string): { ok: boolean; message?: string } {
  try {
    const parsed = JSON.parse(cleanJson(rawText));
    return validateAnalyzeShapePayload(parsed);
  } catch (error: any) {
    return { ok: false, message: error?.message ?? "parse failed" };
  }
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

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const mode = req.nextUrl.searchParams.get("mode");
  if (mode === "full") {
    return runFullSmoke();
  }

  try {
    const orchestratorResult = await callE150Orchestrator({
      systemPrompt: SMOKE_SYSTEM_PROMPT,
      userPrompt: SMOKE_USER_PROMPT,
      maxTokens: 64,
      timeoutMs: 10_000,
      requiredCapability: "core_analysis",
      telemetry: {
        pipeline: "orchestrator_smoke",
      },
    });

    const results = buildProviderResultsFromMeta(orchestratorResult.meta, null);
    const probeMaps = buildProbeMaps(orchestratorResult.meta.probes as ProbeSnapshot[] | undefined);
    const orchestratorOk = results.some((entry) => entry.ok);

    return NextResponse.json({
      ok: orchestratorOk,
      orchestratorOk,
      bestProviderId: orchestratorResult.best.provider,
      bestRawText: orchestratorResult.best.rawText,
      results,
      ...probeMaps,
      createAnalyzeApi: {
        state: "skipped",
        ok: false,
        durationMs: 0,
        reason: "full_mode_only",
        code: "SKIPPED",
      },
    } satisfies OrchestratorSmokeResponse);
  } catch (error: any) {
    const meta = extractOrchestratorMeta(error);
    const results = buildProviderResultsFromMeta(meta, error?.message ?? "orchestrator_error");
    const probeMaps = buildProbeMaps((meta?.probes ?? []) as ProbeSnapshot[]);

    return NextResponse.json({
      ok: false,
      orchestratorOk: false,
      bestProviderId: null,
      bestRawText: null,
      results,
      error: error?.message ?? "orchestrator error",
      ...probeMaps,
      createAnalyzeApi: {
        state: "skipped",
        ok: false,
        durationMs: 0,
        reason: "full_mode_only",
        code: "SKIPPED",
      },
    } satisfies OrchestratorSmokeResponse);
  }
}

async function runFullSmoke() {
  let orchestratorResult:
    | Awaited<ReturnType<typeof callE150Orchestrator>>
    | null = null;
  let orchestratorError: unknown = null;

  try {
    orchestratorResult = await callE150Orchestrator({
      systemPrompt:
        "You are the E150 orchestrator. Return strictly valid JSON for contribution analysis, including claims, notes, questions and knots.",
      userPrompt: FULL_SAMPLE_TEXT,
      maxTokens: 1_400,
      timeoutMs: 20_000,
      requiredCapability: "core_analysis",
      telemetry: {
        pipeline: "orchestrator_smoke",
      },
    });
  } catch (error) {
    orchestratorError = error;
  }

  const createAnalyzeApi = await runCreateAnalyzeApiSmoke();

  if (!orchestratorResult) {
    const meta = extractOrchestratorMeta(orchestratorError);
    const results = buildProviderResultsFromMeta(
      meta,
      (orchestratorError as any)?.message ?? "full smoke orchestrator failed",
    );
    const probeMaps = buildProbeMaps((meta?.probes ?? []) as ProbeSnapshot[]);

    return NextResponse.json(
      {
        ok: false,
        orchestratorOk: false,
        bestProviderId: null,
        bestRawText: null,
        results,
        error: (orchestratorError as any)?.message ?? "full smoke failed",
        ...probeMaps,
        createAnalyzeApi,
      } satisfies OrchestratorSmokeResponse,
      { status: 200 },
    );
  }

  const validatedResults = buildProviderResultsFromMeta(orchestratorResult.meta, null).map((entry) => {
    if (entry.state !== "ok") return entry;
    const candidate = orchestratorResult?.candidates.find((item) => item.provider === entry.providerId);
    if (!candidate) {
      return {
        ...entry,
        state: "failed",
        ok: false,
        reason: "candidate_missing_for_ok_provider",
      } satisfies ProviderSmokeResult;
    }
    const validation = validateOrchestratorCandidate(candidate.rawText);
    if (validation.ok) return entry;
    return {
      ...entry,
      state: "failed",
      ok: false,
      reason: validation.message ?? "invalid_json_shape",
    } satisfies ProviderSmokeResult;
  });

  const probeMaps = buildProbeMaps(orchestratorResult.meta.probes as ProbeSnapshot[] | undefined);
  const orchestratorOk = validatedResults.some((entry) => entry.ok);

  return NextResponse.json({
    ok: orchestratorOk && createAnalyzeApi.ok,
    orchestratorOk,
    bestProviderId: orchestratorResult.best.provider,
    bestRawText: orchestratorResult.best.rawText,
    results: validatedResults,
    ...probeMaps,
    createAnalyzeApi,
  } satisfies OrchestratorSmokeResponse);
}
