export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { callE150Orchestrator } from "@features/ai/orchestratorE150";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import type { ProviderMatrixEntry } from "@features/ai/orchestratorE150";

const SMOKE_SYSTEM_PROMPT =
  "You are the E150 orchestration smoke-tester. Respond exactly with 'OK'.";
const SMOKE_USER_PROMPT =
  "E150 Orchestrator Smoke Test. Please respond with exactly 'OK'.";

function hasValue(value: string | undefined | null): boolean {
  return Boolean(value && String(value).trim());
}

function getProviderConfig(providerId: ProviderId) {
  switch (providerId) {
    case "openai": {
      const configured = hasValue(process.env.OPENAI_API_KEY);
      return { configured, disabled: false, reason: configured ? null : "API key fehlt" };
    }
    case "anthropic": {
      const configured = hasValue(process.env.ANTHROPIC_API_KEY);
      const disabled = process.env.ANTHROPIC_DISABLED === "1";
      return {
        configured,
        disabled,
        reason: disabled ? "deaktiviert (ANTHROPIC_DISABLED=1)" : configured ? null : "API key fehlt",
      };
    }
    case "mistral": {
      const configured = hasValue(process.env.MISTRAL_API_KEY);
      return { configured, disabled: false, reason: configured ? null : "API key fehlt" };
    }
    case "gemini": {
      const configured = hasValue(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
      const disabled = process.env.GEMINI_DISABLED === "1";
      return {
        configured,
        disabled,
        reason: disabled ? "deaktiviert (GEMINI_DISABLED=1)" : configured ? null : "API key fehlt",
      };
    }
    case "ari": {
      const base =
        process.env.ARI_BASE_URL ||
        process.env.ARI_URL ||
        process.env.ARI_API_URL ||
        process.env.YOUCOM_ARI_API_URL;
      const key = process.env.ARI_API_KEY || process.env.YOUCOM_ARI_API_KEY;
      const configured = hasValue(base) && hasValue(key);
      const disabled = process.env.ARI_DISABLED === "1";
      return {
        configured,
        disabled,
        reason: disabled
          ? "deaktiviert (ARI_DISABLED=1)"
          : !hasValue(base)
            ? "Basis-URL fehlt"
            : !hasValue(key)
              ? "API key fehlt"
              : null,
      };
    }
    default:
      return { configured: false, disabled: true, reason: "unbekannt" };
  }
}

function mapMatrixState(entry: ProviderMatrixEntry | null, configured: boolean): ProviderSmokeState {
  if (!entry) return configured ? "skipped" : "unconfigured";
  if (entry.state === "ok") return "success";
  if (entry.state === "failed" || entry.state === "cancelled") return "failed";
  if (entry.state === "skipped") return "skipped";
  if (entry.state === "disabled") return configured ? "disabled" : "unconfigured";
  return configured ? "skipped" : "unconfigured";
}

function buildResultsFromMatrix(params: {
  matrix?: ProviderMatrixEntry[] | null;
  failedProviders?: { provider: string; error: string; errorKind?: string }[];
  mode: "quick" | "full";
}): ProviderSmokeResult[] {
  const { matrix, failedProviders, mode } = params;
  const matrixMap = new Map<string, ProviderMatrixEntry>();
  (matrix ?? []).forEach((entry) => matrixMap.set(entry.provider, entry));
  const failedMap = new Map(
    (failedProviders ?? []).map((entry) => [entry.provider, entry.error]),
  );
  const checkedAt = new Date().toISOString();

  return PROVIDER_IDS.map((providerId) => {
    const entry = matrixMap.get(providerId) ?? null;
    const config = getProviderConfig(providerId);
    const state = mapMatrixState(entry, config.configured);
    const errorMessage = failedMap.get(providerId) ?? entry?.reason ?? config.reason ?? null;
    return {
      providerId,
      state,
      ok: state === "success",
      configured: config.configured,
      durationMs: entry?.durationMs ?? null,
      errorMessage,
      errorKind: entry?.errorKind ?? null,
      status: entry?.status ?? null,
      checkedAt,
      requestMode: mode,
    };
  });
}

const PROVIDER_IDS = ["openai", "anthropic", "mistral", "gemini", "ari"] as const;
type ProviderId = (typeof PROVIDER_IDS)[number];
type ProviderSmokeState = "success" | "failed" | "skipped" | "disabled" | "unconfigured";

type ProviderSmokeResult = {
  providerId: ProviderId;
  state: ProviderSmokeState;
  ok: boolean;
  configured: boolean;
  durationMs: number | null;
  errorMessage?: string | null;
  errorKind?: string | null;
  status?: number | null;
  checkedAt?: string;
  requestMode?: "quick" | "full";
};

type OrchestratorSmokeResponse = {
  ok: boolean;
  bestProviderId?: string | null;
  bestRawText?: string | null;
  results: ProviderSmokeResult[];
  error?: string;
  probeStatus?: Record<string, { ok: boolean; errorKind: string | null; durationMs: number }>;
  probes?: Record<string, { ok: boolean; errorKind: string | null; status?: number | null; latencyMs?: number; checkedAt?: number }>;
  checkedAt?: string;
  mode?: "quick" | "full";
};

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;
  const mode = req.nextUrl.searchParams.get("mode") === "full" ? "full" : "quick";
  if (mode === "full") {
    return runFullSmoke();
  }

  try {
    const orchestratorResult = await callE150Orchestrator({
      systemPrompt: SMOKE_SYSTEM_PROMPT,
      userPrompt: SMOKE_USER_PROMPT,
      maxTokens: 32,
      timeoutMs: 3_000,
      telemetry: {
        pipeline: "orchestrator_smoke",
      },
    });

    const providerResults = buildResultsFromMatrix({
      matrix: orchestratorResult.meta.providerMatrix ?? null,
      failedProviders: orchestratorResult.meta.failedProviders ?? [],
      mode,
    });

    const payload: OrchestratorSmokeResponse = {
      ok: providerResults.some((r) => r.ok),
      bestProviderId: orchestratorResult.best.provider,
      bestRawText: orchestratorResult.best.rawText,
      results: providerResults,
      probeStatus: Object.fromEntries(
        (orchestratorResult.meta.probes ?? []).map((p) => [
          p.provider,
          { ok: p.ok, errorKind: p.errorKind ?? null, durationMs: p.durationMs },
        ]),
      ),
      probes: Object.fromEntries(
        (orchestratorResult.meta.probes ?? []).map((p) => [
          p.provider,
          {
            ok: p.ok,
            errorKind: p.errorKind ?? null,
            status: (p as any).status ?? null,
            latencyMs: p.durationMs,
            checkedAt: (p as any).checkedAt ?? null,
          },
        ]),
      ),
      checkedAt: new Date().toISOString(),
      mode,
    };

    return NextResponse.json(payload);
  } catch (err: any) {
    const metaMatrix = err?.meta?.providerMatrix ?? null;
    const failedProviders = err?.meta?.failedProviders ?? [];
    const providerResults = buildResultsFromMatrix({
      matrix: metaMatrix,
      failedProviders,
      mode,
    });

    return NextResponse.json({
      ok: providerResults.some((entry) => entry.ok),
      bestProviderId: providerResults.find((entry) => entry.ok)?.providerId ?? null,
      bestRawText: null,
      results: providerResults,
      error: err?.message ?? "orchestrator error",
      checkedAt: new Date().toISOString(),
      mode,
    } satisfies OrchestratorSmokeResponse);
  }
}

const FULL_SAMPLE_TEXT =
  "In unserer Stadt soll ein autofreier Sonntag pro Monat eingeführt werden, um die Luftqualität zu verbessern und den ÖPNV zu stärken. Gleichzeitig gibt es Bedenken wegen Umsatzeinbußen im Einzelhandel und fehlender Barrierefreiheit für ältere Menschen.";

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

function validateCandidate(rawText: string): { ok: boolean; message?: string } {
  try {
    const parsed = JSON.parse(cleanJson(rawText));
    if (!parsed || typeof parsed !== "object") return { ok: false, message: "empty payload" };
    if (!Array.isArray((parsed as any).claims)) {
      return { ok: false, message: "claims missing" };
    }
    if (!Array.isArray((parsed as any).notes)) {
      return { ok: false, message: "notes missing" };
    }
    if (!Array.isArray((parsed as any).questions)) {
      return { ok: false, message: "questions missing" };
    }
    if (!Array.isArray((parsed as any).knots)) {
      return { ok: false, message: "knots missing" };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, message: err?.message ?? "parse failed" };
  }
}

async function runFullSmoke() {
  try {
    const orchestratorResult = await callE150Orchestrator({
      systemPrompt:
        "You are the E150 orchestrator. Return strictly valid JSON for contribution analysis, including claims, notes, questions and knots.",
      userPrompt: FULL_SAMPLE_TEXT,
      maxTokens: 1_400,
      timeoutMs: 10_000,
      requiredCapability: "core_analysis",
      telemetry: {
        pipeline: "orchestrator_smoke",
      },
    });

    const baseResults = buildResultsFromMatrix({
      matrix: orchestratorResult.meta.providerMatrix ?? null,
      failedProviders: orchestratorResult.meta.failedProviders ?? [],
      mode: "full",
    });
    const providerResults = baseResults.map((row) => {
      if (row.state !== "success") return row;
      const candidate = orchestratorResult.candidates.find((c) => c.provider === row.providerId);
      if (!candidate) {
        return {
          ...row,
          state: "failed",
          ok: false,
          errorMessage: "no candidate",
        } satisfies ProviderSmokeResult;
      }
      const validation = validateCandidate(candidate.rawText);
      if (validation.ok) return row;
      return {
        ...row,
        state: "failed",
        ok: false,
        errorMessage: validation.message ?? row.errorMessage ?? "invalid response",
      } satisfies ProviderSmokeResult;
    });

    const payload: OrchestratorSmokeResponse = {
      ok: providerResults.some((r) => r.ok),
      bestProviderId: orchestratorResult.best.provider,
      bestRawText: orchestratorResult.best.rawText,
      results: providerResults,
      probeStatus: Object.fromEntries(
        (orchestratorResult.meta.probes ?? []).map((p) => [
          p.provider,
          { ok: p.ok, errorKind: p.errorKind ?? null, durationMs: p.durationMs },
        ]),
      ),
      checkedAt: new Date().toISOString(),
      mode: "full",
    };

    return NextResponse.json(payload);
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        results: [],
        error: err?.message ?? "full smoke failed",
      } satisfies OrchestratorSmokeResponse,
      { status: 500 },
    );
  }
}
