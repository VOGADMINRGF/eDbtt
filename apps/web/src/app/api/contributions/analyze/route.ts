// apps/web/src/app/api/contributions/analyze/route.ts
import { NextRequest, NextResponse } from "next/server";
import {
  analyzeContribution,
  type AnalyzeResultWithMeta,
} from "@features/analyze/analyzeContribution";
import { logger } from "@/utils/logger";
import { deriveContextNotes } from "@features/analyze/context";
import {
  deriveCriticalQuestions,
  deriveKnots,
} from "@features/analyze/questionizers";
import { rateLimitOrThrow } from "@/utils/rateLimitHelpers";
import { persistEventualitiesSnapshot } from "@core/eventualities";
import { upsertRunReceipt } from "@/lib/db/runReceiptsRepo";
import { maskUserId } from "@core/pii/redact";
import type { ProviderMatrixEntry } from "@features/ai/orchestratorE150";
import type { AiErrorKind } from "@core/telemetry/aiUsageTypes";
import { buildHeuristicAnalyzeResult } from "@features/analyze/heuristics";
import {
  buildStandardLaneContract,
  deriveTruthGuardContract,
  type TruthGuardContract,
  type VerificationContract,
} from "@features/ai/e150/verificationContract";
import { resolveJourneyProfile } from "@features/ai/e150/roleRouting";
import { resolveAiRouteClassification } from "@features/ai/e150/routeClassification";
import {
  buildSourceGroundingContext,
  finalizeSourceGroundingAudit,
  type SourceGroundingContext,
} from "@features/analyze/sourceGroundingContract";
import crypto from "crypto";
import { parseAnalyzeRequestBody, type AnalyzeRequestParsed } from "./parseAnalyzeRequest";
import {
  buildCreateAnalyzeResponse,
  summarizeCreateAnalyzeInput,
  type CreateAnalyzeMatchResultInput,
} from "@/features/create/analyzeContract";
import { resolveCreateCtaSuggestions } from "@/features/create/ctaResolver";
import { resolveCreateGraphMatches } from "@/features/create/matchService";
import { resolveCreateLanguageContext } from "@/features/create/languageContextContract";
import type { CreateProductMode } from "@/features/create/createProductModes";
import type { CreateIntent } from "@/features/create/intentFlows";
import {
  evaluateCreateClaimSafety,
  type CreateClaimSafetyResult,
} from "@/features/create/safety/createClaimSafety";
import {
  evaluateCreateInputSafety,
  type CreateInputSafetyResult,
} from "@/features/create/safety/createInputSafety";
import {
  resolveMaterialRouting,
  type MaterialRoutingResult,
} from "@/features/create/materialRouting";
import { buildMaterialIntakeAnalyzeManifest } from "@/features/material/materialIntakeContract";
import { resolveAnalyzeResearchGateBlock } from "./researchEntitlementGate";
import {
  resolveAiRuntimeModeFromEnv,
  tryGetAiRuntimePolicy,
  type AiRuntimeMode,
} from "@features/ai/aiRuntimePolicy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const ANALYZE_HARD_TIMEOUT_MS = Number(process.env.ANALYZE_HARD_TIMEOUT_MS ?? 55_000);

function withHardTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => {
      const e: any = new Error("analyze_timeout");
      e.code = "ANALYZE_TIMEOUT";
      reject(e);
    }, ms);
    p.then((v) => {
      clearTimeout(t);
      resolve(v);
    }).catch((err) => {
      clearTimeout(t);
      reject(err);
    });
  });
}

const DEFAULT_MAX_CLAIMS = 10;

type SuccessResponse<T extends Record<string, unknown>> = { ok: true } & T;
type ErrorResponse<TExtra extends Record<string, unknown> = Record<string, unknown>> = {
  ok: false;
  errorCode: string;
  message: string;
} & TExtra;

function ok<T extends Record<string, unknown>>(data: T, status = 200) {
  return NextResponse.json({ ok: true, ...data } satisfies SuccessResponse<T>, { status });
}

function err(
  code: string,
  message: string,
  status = 500,
  extra: Record<string, unknown> = {},
) {
  return NextResponse.json(
    { ok: false, errorCode: code, message, ...extra } satisfies ErrorResponse,
    { status },
  );
}

type NormalizedAnalyzerError = { code: string; message: string; status?: number };

function formatErrorResponse(error: NormalizedAnalyzerError, status = 500) {
  return err(error.code, error.message, error.status ?? status);
}

function logErrorSafe(payload: Record<string, unknown>) {
  try {
    logger.error(payload);
  } catch {
    // ignore logging failures
  }
}

function safeIdentifier(value: unknown, max = 120): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^[A-Za-z0-9_.:-]{1,120}$/.test(trimmed)) return null;
  return trimmed.slice(0, max);
}

function safeNumeric(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const rounded = Math.floor(value);
  if (rounded < min || rounded > max) return null;
  return rounded;
}

type AnalyzeJobInput = {
  text: string;
  locale: string;
  maxClaims: number;
  runId: string;
  contributionId: string;
  dossierId?: string | null;
  analysisMode: CreateProductMode;
  intent: CreateIntent;
  journeyHint: "analyze" | "media" | "guided" | "material_grounding";
  presentationPassEnabled: boolean;
  sourceGrounding: SourceGroundingContext;
  userId?: string | null;
};

function sanitizeLocale(locale?: string): string {
  if (typeof locale === "string" && locale.trim()) {
    return locale.trim();
  }
  return "de";
}

function sanitizeMaxClaims(maxClaims?: number): number {
  if (typeof maxClaims === "number" && Number.isFinite(maxClaims) && maxClaims > 0) {
    return Math.min(50, Math.max(1, Math.floor(maxClaims)));
  }
  return DEFAULT_MAX_CLAIMS;
}

function resolveAnalyzeAudienceRole(mode: CreateProductMode): "citizen" | "staff" | "institution" {
  if (mode === "media") return "staff";
  if (mode === "guided") return "institution";
  return "citizen";
}

function resolvePresentationPassEnabled(params: {
  analysisMode: CreateProductMode;
  requested?: boolean;
}): boolean {
  if (typeof params.requested === "boolean") {
    return params.requested;
  }
  if (process.env.E150_PRESENTATION_PASS_DEFAULT !== "true") {
    return false;
  }
  return params.analysisMode === "media" || params.analysisMode === "guided";
}

function resolveIntentFromAnalysisMode(mode: CreateProductMode): CreateIntent {
  if (mode === "media") return "check";
  if (mode === "guided") return "draft";
  return "contribute";
}

function resolveJourneyHintFromIntent(intent: CreateIntent): "analyze" | "media" | "guided" {
  if (intent === "check") return "media";
  if (intent === "draft") return "guided";
  return "analyze";
}

function attachSafetyToCreateAnalyze(
  createAnalyze: ReturnType<typeof buildCreateAnalyzeResponse>,
  safety: CreateInputSafetyResult,
  claimSafety: CreateClaimSafetyResult[],
) {
  return {
    ...createAnalyze,
    safety,
    claimSafety,
    requiresHumanReview: createAnalyze.requiresHumanReview || safety.requiresHumanReview,
    noAutoPublish: true as const,
    noSilentMerge: true as const,
  };
}

function resolveAnalyzeRuntimeMode(): AiRuntimeMode {
  const policyResult = tryGetAiRuntimePolicy();
  if (policyResult.ok) return policyResult.policy.runtimeMode;
  return resolveAiRuntimeModeFromEnv();
}

function isNonProductionRuntimeMode(runtimeMode: AiRuntimeMode): boolean {
  return runtimeMode === "development" || runtimeMode === "test";
}

function buildSafeErrorLogMeta(error: unknown): Record<string, unknown> {
  const candidate = error as {
    code?: unknown;
    errorCode?: unknown;
    name?: unknown;
    status?: unknown;
    errorKind?: unknown;
    providerErrorCode?: unknown;
  } | null;
  return {
    errorCode:
      safeIdentifier(candidate?.errorCode) ??
      safeIdentifier(candidate?.code),
    errorKind: asAiErrorKind(candidate?.errorKind),
    providerErrorCode: safeIdentifier(candidate?.providerErrorCode),
    status: safeNumeric(candidate?.status, 100, 599),
    name: safeIdentifier(candidate?.name),
  };
}

function buildClaimSafetyForClaims(params: {
  claims: unknown[];
  locale: string;
  sourceLanguage: string;
  contentLanguage: string;
}): CreateClaimSafetyResult[] {
  if (!Array.isArray(params.claims)) return [];
  return params.claims
    .map((claim) => {
      const text = typeof (claim as any)?.text === "string" ? (claim as any).text : "";
      if (!text.trim()) return null;
      return evaluateCreateClaimSafety({
        claimId:
          typeof (claim as any)?.id === "string" || typeof (claim as any)?.id === "number"
            ? String((claim as any).id)
            : null,
        text,
        locale: params.locale,
        sourceLanguage: params.sourceLanguage,
        contentLanguage: params.contentLanguage,
      });
    })
    .filter((entry): entry is CreateClaimSafetyResult => Boolean(entry));
}

function mergeAnalyzeEvidenceItems(...collections: unknown[]): unknown[] {
  const merged: unknown[] = [];
  collections.forEach((collection) => {
    if (!Array.isArray(collection)) return;
    collection.forEach((entry) => merged.push(entry));
  });
  return merged;
}

function resolveMaterialFallbackUsed(params: {
  providerFallbackUsed?: boolean;
  materialRouting: MaterialRoutingResult;
}): boolean {
  return Boolean(params.providerFallbackUsed) || params.materialRouting.fallbackUsed;
}

function resolveMetaResearchUsed(params: {
  verification: VerificationContract;
  materialRouting: MaterialRoutingResult;
}): VerificationContract["researchUsed"] {
  if (params.materialRouting.researchUsed === "gemini") return "gemini";
  if (params.materialRouting.researchUsed === "deep_search") return "deep_search";
  return params.verification.researchUsed;
}

function resolveMetaRequiresHumanReview(params: {
  createAnalyze?: { requiresHumanReview?: boolean } | null;
  safety: CreateInputSafetyResult;
  sourceGroundingAudit: { requiresManualReview: boolean };
  materialRouting: MaterialRoutingResult;
}): boolean {
  return Boolean(
    params.createAnalyze?.requiresHumanReview ||
      params.safety.requiresHumanReview ||
      params.sourceGroundingAudit.requiresManualReview ||
      params.materialRouting.requiresHumanReview,
  );
}

function buildGraphSyncGuardMeta() {
  return {
    attempted: false,
    mode: "disabled" as const,
    noAutoPromote: true as const,
    reason: "draft_analysis_no_productive_truth_promotion",
  };
}

type AnalyzeTruthRootFields = {
  verificationMode: VerificationContract["verificationMode"];
  researchUsed: VerificationContract["researchUsed"];
  sealEligible: boolean;
  sealGranted: boolean;
  verificationLabel: TruthGuardContract["verificationLabel"];
  truthStatus: TruthGuardContract["truthStatus"];
  sourceSupport: TruthGuardContract["sourceSupport"];
  sourceStatus: TruthGuardContract["sourceStatus"];
  reviewRecommended: boolean;
  noTruthPromotion: true;
  noAutoGraphPromotion: true;
};

type AnalyzeTruthMetaFields = AnalyzeTruthRootFields & {
  graphSync: ReturnType<typeof buildGraphSyncGuardMeta>;
};

type AnalyzeTruthEnvelope<
  TResult extends Record<string, unknown>,
  TCreateAnalyze extends { requiresHumanReview: boolean },
> = {
  result: TResult;
  createAnalyze: TCreateAnalyze & {
    truthStatus: TruthGuardContract["truthStatus"];
    sourceSupport: TruthGuardContract["sourceSupport"];
    sourceStatus: TruthGuardContract["sourceStatus"];
    reviewRecommended: boolean;
    noTruthPromotion: true;
    noAutoGraphPromotion: true;
  };
  truthGuard: TruthGuardContract;
  rootFields: AnalyzeTruthRootFields;
  metaFields: AnalyzeTruthMetaFields;
};

function resolveTruthGuardForAnalyze(params: {
  result?: { _meta?: AnalyzeResultWithMeta["_meta"] } | null;
  verification: VerificationContract;
  sourceGroundingAudit: ReturnType<typeof finalizeSourceGroundingAudit>;
  fallbackUsed: boolean;
  reviewRecommended?: boolean;
}): TruthGuardContract {
  return deriveTruthGuardContract({
    lane: (params.result as any)?._meta?.lane ?? "standard",
    verificationMode: params.verification.verificationMode,
    sealGranted: params.verification.sealGranted,
    fallbackUsed: params.fallbackUsed,
    disagreement: (params.result as any)?._meta?.disagreement ?? null,
    confidence: (params.result as any)?._meta?.confidence ?? null,
    sourceGrounding: params.sourceGroundingAudit,
    reviewRecommended: params.reviewRecommended,
  });
}

function attachTruthGuardToResult<T extends Record<string, unknown>>(
  result: T,
  truthGuard: TruthGuardContract,
) {
  const currentMeta =
    typeof (result as { _meta?: unknown })._meta === "object" &&
    (result as { _meta?: unknown })._meta !== null
      ? ((result as { _meta?: AnalyzeResultWithMeta["_meta"] })._meta ?? {})
      : {};
  (result as T & { _meta: AnalyzeResultWithMeta["_meta"] })._meta = {
    ...currentMeta,
    verificationLabel: truthGuard.verificationLabel,
    truthStatus: truthGuard.truthStatus,
    sourceSupport: truthGuard.sourceSupport,
    sourceStatus: truthGuard.sourceStatus,
    reviewRecommended: truthGuard.reviewRecommended,
    noTruthPromotion: true,
    noAutoGraphPromotion: true,
    graphSync: buildGraphSyncGuardMeta(),
  };
  return result;
}

function attachTruthGuardToCreateAnalyze<T extends { requiresHumanReview: boolean }>(
  createAnalyze: T,
  truthGuard: TruthGuardContract,
) {
  return {
    ...createAnalyze,
    truthStatus: truthGuard.truthStatus,
    sourceSupport: truthGuard.sourceSupport,
    sourceStatus: truthGuard.sourceStatus,
    reviewRecommended: truthGuard.reviewRecommended,
    requiresHumanReview: createAnalyze.requiresHumanReview || truthGuard.reviewRecommended,
    noTruthPromotion: true as const,
    noAutoGraphPromotion: true as const,
  };
}

function buildAnalyzeTruthEnvelope<
  TResult extends Record<string, unknown> & { _meta?: AnalyzeResultWithMeta["_meta"] },
  TCreateAnalyze extends { requiresHumanReview: boolean },
>(params: {
  result: TResult;
  createAnalyze: TCreateAnalyze;
  verification: VerificationContract;
  researchUsed: VerificationContract["researchUsed"];
  sourceGroundingAudit: ReturnType<typeof finalizeSourceGroundingAudit>;
  fallbackUsed: boolean;
  reviewRecommended?: boolean;
}): AnalyzeTruthEnvelope<TResult, TCreateAnalyze> {
  const truthGuard = resolveTruthGuardForAnalyze({
    result: params.result,
    verification: params.verification,
    sourceGroundingAudit: params.sourceGroundingAudit,
    fallbackUsed: params.fallbackUsed,
    reviewRecommended: params.reviewRecommended,
  });
  const result = attachTruthGuardToResult(params.result, truthGuard);
  const createAnalyze = attachTruthGuardToCreateAnalyze(params.createAnalyze, truthGuard);
  const rootFields: AnalyzeTruthRootFields = {
    verificationMode: params.verification.verificationMode,
    researchUsed: params.researchUsed,
    sealEligible: params.verification.sealEligible,
    sealGranted: params.verification.sealGranted,
    verificationLabel: truthGuard.verificationLabel,
    truthStatus: truthGuard.truthStatus,
    sourceSupport: truthGuard.sourceSupport,
    sourceStatus: truthGuard.sourceStatus,
    reviewRecommended: truthGuard.reviewRecommended,
    noTruthPromotion: true,
    noAutoGraphPromotion: true,
  };

  return {
    result,
    createAnalyze,
    truthGuard,
    rootFields,
    metaFields: {
      ...rootFields,
      graphSync: buildGraphSyncGuardMeta(),
    },
  };
}

/**
 * E150 – Contribution-AI
 * - JSON: { ok: true, result: AnalyzeResult }
 * - SSE: progress/result/error-events mit identischem Result-Shape
 */
export async function POST(req: NextRequest): Promise<Response> {
  if (process.env.ANALYZE_ENABLED !== "true") {
    return NextResponse.json({
      ok: false,
      disabled: true,
      message: "Analyse derzeit deaktiviert.",
    });
  }

  const runId = crypto.randomUUID();
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return err("INVALID_JSON", "Ungültiger JSON-Body.", 400);
  }

  const parsed = parseAnalyzeRequestBody(rawBody);
  if (parsed.ok === false) {
    return err("BAD_INPUT", parsed.error.message, 400, { issues: parsed.error.issues });
  }

  const body = parsed.value;

  if (body.test === "ping") {
    return ok({ result: { ping: "pong" } });
  }

  const researchGateBlock = await resolveAnalyzeResearchGateBlock(req, body);
  if (researchGateBlock) {
    return err("RESEARCH_GATE_BLOCKED", researchGateBlock.message, researchGateBlock.status, {
      entitlementGate: researchGateBlock.entitlementGate,
      meta: researchGateBlock.meta,
    });
  }

  const requestLocale = sanitizeLocale(body.locale);
  const languageContext = resolveCreateLanguageContext({
    locale: requestLocale,
    uiLocale: body.uiLocale,
    contentLanguage: body.contentLanguage,
    sourceLanguage: body.sourceLanguage,
  });
  const locale = languageContext.contentLanguage;
  const maxClaims = sanitizeMaxClaims(body.maxClaims);
  const materialRouting = resolveMaterialRouting({
    text: body.text,
    sourceUrls: body.sourceUrls,
    uploadIds: body.uploadIds,
    materialItems: body.materialItems,
    evidenceItems: body.evidenceItems,
    researchMode: body.researchMode,
    allowDeepSearch: body.allowDeepSearch,
    researchConfirmed: body.researchConfirmed,
  });
  const materialManifest =
    materialRouting.lane === "material_grounding"
      ? buildMaterialIntakeAnalyzeManifest({
          items: materialRouting.materialItems,
          userText: body.text ?? null,
          productionTruth: false,
        })
      : null;
  const text =
    body.text?.trim() ||
    materialManifest?.summary?.trim() ||
    materialRouting.materialItems
      .map((item) => item.label || item.url || item.fileName || item.uploadId || "")
      .filter(Boolean)
      .join(" · ");
  const analysisMode = body.analysisMode ?? "analyze";
  const routeJourneyProfile = resolveJourneyProfile({
    analysisMode,
    routePath: "/api/contributions/analyze",
    journeyHint: materialRouting.lane === "material_grounding" ? "material_grounding" : null,
  });
  const routeClassification = resolveAiRouteClassification("/api/contributions/analyze");
  const userId = req.cookies.get("u_id")?.value ?? null;
  const contributionId = resolveContributionId(body.contributionId, text);
  const mergedEvidenceItems = mergeAnalyzeEvidenceItems(
    body.evidenceItems,
    materialManifest?.evidenceItems,
  );
  const sourceGrounding = buildSourceGroundingContext({
    analysisMode,
    evidenceItems: mergedEvidenceItems,
  });
  const ip = (req.headers.get("x-forwarded-for") || "local").split(",")[0].trim();

  const rl = await rateLimitOrThrow(`analyze:ip:${ip}`, 15, 10 * 60 * 1000, { salt: "analyze" });
  if (!rl.ok) {
    return err("RATE_LIMITED", "Too many analyze requests. Please retry later.", 429, {
      retryInMs: rl.retryIn,
    });
  }
  const analyzeInput: AnalyzeJobInput = {
    text,
    locale,
    maxClaims,
    runId,
    contributionId,
    dossierId: body.dossierId ?? null,
    analysisMode,
    intent: body.intent ?? resolveIntentFromAnalysisMode(analysisMode),
    journeyHint: materialRouting.lane === "material_grounding" ? "material_grounding" : resolveJourneyHintFromIntent(body.intent ?? resolveIntentFromAnalysisMode(analysisMode)),
    presentationPassEnabled: resolvePresentationPassEnabled({
      analysisMode,
      requested: body.presentationPass,
    }),
    sourceGrounding,
    userId,
  };
  const runtimeMode = resolveAnalyzeRuntimeMode();

  const safety = evaluateCreateInputSafety({
    text,
    locale: requestLocale,
    contentLanguage: languageContext.contentLanguage,
    sourceLanguage: languageContext.sourceLanguage,
    uiLocale: languageContext.uiLocale,
    routeStage: "analyze",
    runId,
    correlationId: contributionId,
  });

  if (safety.decision === "blocked") {
    return NextResponse.json(
      {
        ok: false,
        errorCode: "CREATE_INPUT_BLOCKED",
        message: "Beitrag enthält Inhalte, die vor der Analyse nicht verarbeitet werden können.",
        safety,
      },
      { status: 422 },
    );
  }

  if (safety.decision === "moderation_required") {
    const moderatedResult = finalizeAnalyzeResult(
      buildHeuristicAnalyzeResult({
        text: safety.safeRewrite || safety.redactedText || text,
        locale,
      }),
    );
    const createMatch = await resolveCreateMatchesSafe({
      text: safety.safeRewrite || safety.redactedText || text,
      normalizedInputSummary: summarizeCreateAnalyzeInput(text),
      claims: Array.isArray(moderatedResult.claims) ? moderatedResult.claims : [],
      anlassraumId: body.anlassraumId ?? null,
      dossierId: body.dossierId ?? null,
      locale: languageContext.contentLanguage,
      languageMode: "same_language_only",
    });
    const claimSafety = buildClaimSafetyForClaims({
      claims: Array.isArray(moderatedResult.claims) ? moderatedResult.claims : [],
      locale: requestLocale,
      sourceLanguage: languageContext.sourceLanguage,
      contentLanguage: languageContext.contentLanguage,
    });
    const createAnalyze = attachSafetyToCreateAnalyze(
      buildCreateAnalyzeResponse({
        runId,
        text,
        intent: analyzeInput.intent,
        locale: languageContext.contentLanguage,
        classificationContext: {
          sourceUrls: materialRouting.sourceUrls,
          materialItems: materialRouting.materialItems,
          dossierId: body.dossierId ?? null,
          anlassraumId: body.anlassraumId ?? null,
        },
        languageContext,
        result: moderatedResult,
        matchResult: createMatch,
      }),
      safety,
      claimSafety,
    );
    const verification = resolveAnalyzeVerificationContract(moderatedResult, analysisMode, materialRouting);
    const sourceGroundingAudit = finalizeSourceGroundingAudit({
      context: analyzeInput.sourceGrounding,
      result: toSourceGroundingResultInput(moderatedResult),
    });
    const requiresHumanReview = resolveMetaRequiresHumanReview({
      createAnalyze,
      safety,
      sourceGroundingAudit,
      materialRouting,
    });
    const researchUsed = resolveMetaResearchUsed({ verification, materialRouting });
    const truthEnvelope = buildAnalyzeTruthEnvelope({
      result: moderatedResult,
      createAnalyze,
      verification,
      researchUsed,
      sourceGroundingAudit,
      fallbackUsed: resolveMaterialFallbackUsed({ providerFallbackUsed: true, materialRouting }),
      reviewRecommended: requiresHumanReview,
    });

    return NextResponse.json(
      {
        ok: true,
        degraded: true,
        warning: "Beitrag benötigt Moderation vor der Weiterverwendung.",
        result: truthEnvelope.result,
        safety,
        createAnalyze: truthEnvelope.createAnalyze,
        ...truthEnvelope.rootFields,
        meta: {
          runId,
          safety,
          claimSafety,
          materialProvider: materialRouting.materialProvider,
          researchProvider: materialRouting.researchProvider,
          materialIntake: materialManifest?.intake ?? null,
          ...truthEnvelope.metaFields,
          journeyProfile: routeJourneyProfile.journey,
          lane: routeJourneyProfile.lane,
          roleProviderMapping: {
            primary: routeJourneyProfile.primaryRoles,
            secondary: routeJourneyProfile.secondaryRoles,
            fallback: routeJourneyProfile.fallbackProviders,
            openAiRoles: routeJourneyProfile.openAiRoles,
          },
          fallbackUsed: resolveMaterialFallbackUsed({ providerFallbackUsed: true, materialRouting }),
          requiresHumanReview: truthEnvelope.createAnalyze.requiresHumanReview,
          materialRouting,
          disagreement: {
            present: false,
            successfulProviders: [],
            failedProviders: [],
          },
          confidence: {
            score: 0.2,
            bucket: "low",
            reasons: ["safety_moderation_required"],
          },
          routeClassification,
          sourceGrounding: sourceGroundingAudit,
        },
      },
      { status: 200 },
    );
  }

  if (wantsSse(req, body)) {
    return startAnalyzeSseStream(analyzeInput);
  }

  try {
    const result = await withHardTimeout(runAnalyzeJob(analyzeInput), ANALYZE_HARD_TIMEOUT_MS);
    await finalizeResultPayload(result, analyzeInput);
    const verification = resolveAnalyzeVerificationContract(result, analysisMode, materialRouting);
    const sourceGroundingAudit = finalizeSourceGroundingAudit({
      context: analyzeInput.sourceGrounding,
      result: toSourceGroundingResultInput(result),
    });
    const createMatch = await resolveCreateMatchesSafe({
      text,
      normalizedInputSummary: summarizeCreateAnalyzeInput(text),
      claims: Array.isArray(result.claims) ? result.claims : [],
      anlassraumId: body.anlassraumId ?? null,
      dossierId: body.dossierId ?? null,
      locale: languageContext.contentLanguage,
      languageMode: "same_language_only",
    });
    const claimSafety = buildClaimSafetyForClaims({
      claims: Array.isArray(result.claims) ? result.claims : [],
      locale: requestLocale,
      sourceLanguage: languageContext.sourceLanguage,
      contentLanguage: languageContext.contentLanguage,
    });
    const createAnalyze = attachSafetyToCreateAnalyze(
      buildCreateAnalyzeResponse({
        runId,
        text,
        intent: analyzeInput.intent,
        locale: languageContext.contentLanguage,
        classificationContext: {
          sourceUrls: materialRouting.sourceUrls,
          materialItems: materialRouting.materialItems,
          dossierId: body.dossierId ?? null,
          anlassraumId: body.anlassraumId ?? null,
        },
        languageContext,
        result,
        matchResult: createMatch,
      }),
      safety,
      claimSafety,
    );
    const providerMatrix = buildProviderMatrixResponse(
      null,
      (result as any)?._meta?.providerMatrix,
      (result as any)?._meta,
    );
    const requiresHumanReview = resolveMetaRequiresHumanReview({
      createAnalyze,
      safety,
      sourceGroundingAudit,
      materialRouting,
    });
    const researchUsed = resolveMetaResearchUsed({ verification, materialRouting });
    const truthEnvelope = buildAnalyzeTruthEnvelope({
      result,
      createAnalyze,
      verification,
      researchUsed,
      sourceGroundingAudit,
      fallbackUsed: resolveMaterialFallbackUsed({
        providerFallbackUsed: (result as any)?._meta?.fallbackUsed ?? false,
        materialRouting,
      }),
      reviewRecommended: requiresHumanReview,
    });
    return NextResponse.json(
      {
        ok: true,
        result: truthEnvelope.result,
        safety,
        createAnalyze: truthEnvelope.createAnalyze,
        ...truthEnvelope.rootFields,
        meta: {
          runId,
          safety,
          claimSafety,
          providerMatrix,
          materialProvider: materialRouting.materialProvider,
          researchProvider: materialRouting.researchProvider,
          materialIntake: materialManifest?.intake ?? null,
          ...truthEnvelope.metaFields,
          journeyProfile: (result as any)?._meta?.journeyProfile ?? routeJourneyProfile.journey,
          lane: (result as any)?._meta?.lane ?? routeJourneyProfile.lane,
          roleProviderMapping: (result as any)?._meta?.roleProviderMapping ?? {
            primary: routeJourneyProfile.primaryRoles,
            secondary: routeJourneyProfile.secondaryRoles,
            fallback: routeJourneyProfile.fallbackProviders,
            openAiRoles: routeJourneyProfile.openAiRoles,
          },
          fallbackUsed: resolveMaterialFallbackUsed({
            providerFallbackUsed: (result as any)?._meta?.fallbackUsed ?? false,
            materialRouting,
          }),
          requiresHumanReview: truthEnvelope.createAnalyze.requiresHumanReview,
          materialRouting,
          disagreement: (result as any)?._meta?.disagreement ?? {
            present: false,
            successfulProviders: [],
            failedProviders: [],
          },
          confidence: (result as any)?._meta?.confidence ?? {
            score: 0.5,
            bucket: "medium",
            reasons: ["fallback_confidence_default"],
          },
          routeClassification: (result as any)?._meta?.routeClassification ?? routeClassification,
          sourceGrounding: sourceGroundingAudit,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    const normalized = normalizeAnalyzerError(error);
    console.error("[contributions/analyze] failed", {
      contributionId,
      code: normalized.code,
      status: normalized.status ?? null,
    });
    logErrorSafe({
      msg: "analyze.route.error",
      contributionId,
      userId: maskUserId(userId),
      ...buildSafeErrorLogMeta(error),
      errorCode: normalized.code,
      status: normalized.status ?? null,
    });
    if (allowHeuristicAnalyzeFallback(runtimeMode, normalized.code) && shouldUseFallback(normalized)) {
      const fallback = buildHeuristicAnalyzeResult({ text, locale });
      const sourceGroundingAudit = finalizeSourceGroundingAudit({
        context: analyzeInput.sourceGrounding,
        result: toSourceGroundingResultInput(fallback),
      });
      const verification = resolveAnalyzeVerificationContract(fallback, analysisMode, materialRouting);
      const createMatch = await resolveCreateMatchesSafe({
        text,
        normalizedInputSummary: summarizeCreateAnalyzeInput(text),
        claims: Array.isArray(fallback.claims) ? fallback.claims : [],
        anlassraumId: body.anlassraumId ?? null,
        dossierId: body.dossierId ?? null,
        locale: languageContext.contentLanguage,
        languageMode: "same_language_only",
      });
      const claimSafety = buildClaimSafetyForClaims({
        claims: Array.isArray(fallback.claims) ? fallback.claims : [],
        locale: requestLocale,
        sourceLanguage: languageContext.sourceLanguage,
        contentLanguage: languageContext.contentLanguage,
      });
      const createAnalyze = attachSafetyToCreateAnalyze(
        buildCreateAnalyzeResponse({
          runId,
          text,
          intent: analyzeInput.intent,
          locale: languageContext.contentLanguage,
          classificationContext: {
            sourceUrls: materialRouting.sourceUrls,
            materialItems: materialRouting.materialItems,
            dossierId: body.dossierId ?? null,
            anlassraumId: body.anlassraumId ?? null,
          },
          languageContext,
          result: fallback,
          matchResult: createMatch,
        }),
        safety,
        claimSafety,
      );
      const requiresHumanReview = resolveMetaRequiresHumanReview({
        createAnalyze,
        safety,
        sourceGroundingAudit,
        materialRouting,
      });
      const researchUsed = resolveMetaResearchUsed({ verification, materialRouting });
      const truthEnvelope = buildAnalyzeTruthEnvelope({
        result: fallback,
        createAnalyze,
        verification,
        researchUsed,
        sourceGroundingAudit,
        fallbackUsed: true,
        reviewRecommended: requiresHumanReview,
      });
      return NextResponse.json({
        ok: true,
        fallback: true,
        degraded: true,
        realProviderSuccess: false,
        errorCode: normalized.code,
        message: normalized.message,
        result: truthEnvelope.result,
        safety,
        createAnalyze: truthEnvelope.createAnalyze,
        ...truthEnvelope.rootFields,
        meta: {
          runId,
          safety,
          claimSafety,
          materialProvider: materialRouting.materialProvider,
          researchProvider: materialRouting.researchProvider,
          materialIntake: materialManifest?.intake ?? null,
          ...truthEnvelope.metaFields,
          journeyProfile: routeJourneyProfile.journey,
          lane: routeJourneyProfile.lane,
          roleProviderMapping: {
            primary: routeJourneyProfile.primaryRoles,
            secondary: routeJourneyProfile.secondaryRoles,
            fallback: routeJourneyProfile.fallbackProviders,
            openAiRoles: routeJourneyProfile.openAiRoles,
          },
          fallbackUsed: resolveMaterialFallbackUsed({ providerFallbackUsed: true, materialRouting }),
          requiresHumanReview: truthEnvelope.createAnalyze.requiresHumanReview,
          materialRouting,
          disagreement: {
            present: false,
            successfulProviders: [],
            failedProviders: [],
          },
          confidence: {
            score: 0.35,
            bucket: "low",
            reasons: ["heuristic_fallback_path"],
          },
          routeClassification,
          sourceGrounding: sourceGroundingAudit,
        },
      });
    }
    if (allowDegradedAnalyzeResult(runtimeMode, normalized.code)) {
      const meta = (error as any)?.meta ?? {};

      const providerMatrix = buildProviderMatrixResponse(
        error,
        meta?.providerMatrix ?? meta?.provider_matrix ?? null,
        meta,
      );

      const degradedResult: AnalyzeResultWithMeta = {
        mode: "E150",
        sourceText: null,
        language: locale,
        claims: [],
        notes: [
          {
            id: "n_degraded",
            kind: "FACTS",
            text: "KI temporär nicht erreichbar; Analyse wird später erneut versucht.",
          },
        ],
        questions: [],
        missingPerspectives: [],
        findings: [],
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
        _meta: {
          provider: null,
          model: null,
          pipeline: "contribution_analyze",
          contributionId,
        },
      };
      const createMatch = await resolveCreateMatchesSafe({
        text,
        normalizedInputSummary: summarizeCreateAnalyzeInput(text),
        claims: [],
        anlassraumId: body.anlassraumId ?? null,
        dossierId: body.dossierId ?? null,
        locale: languageContext.contentLanguage,
        languageMode: "same_language_only",
      });
      const claimSafety = buildClaimSafetyForClaims({
        claims: [],
        locale: requestLocale,
        sourceLanguage: languageContext.sourceLanguage,
        contentLanguage: languageContext.contentLanguage,
      });
      const createAnalyze = attachSafetyToCreateAnalyze(
        buildCreateAnalyzeResponse({
          runId,
          text,
          intent: analyzeInput.intent,
          locale: languageContext.contentLanguage,
          classificationContext: {
            sourceUrls: materialRouting.sourceUrls,
            materialItems: materialRouting.materialItems,
            dossierId: body.dossierId ?? null,
            anlassraumId: body.anlassraumId ?? null,
          },
          languageContext,
          result: degradedResult,
          matchResult: createMatch,
        }),
        safety,
        claimSafety,
      );
      const sourceGroundingAudit = finalizeSourceGroundingAudit({
        context: analyzeInput.sourceGrounding,
        result: toSourceGroundingResultInput(degradedResult),
      });
      const verification = resolveAnalyzeVerificationContract(degradedResult, analysisMode, materialRouting);
      const requiresHumanReview = resolveMetaRequiresHumanReview({
        createAnalyze,
        safety,
        sourceGroundingAudit,
        materialRouting,
      });
      const researchUsed = resolveMetaResearchUsed({ verification, materialRouting });
      const truthEnvelope = buildAnalyzeTruthEnvelope({
        result: degradedResult,
        createAnalyze,
        verification,
        researchUsed,
        sourceGroundingAudit,
        fallbackUsed: true,
        reviewRecommended: requiresHumanReview,
      });

      return NextResponse.json(
        {
          ok: true,
          degraded: true,
          realProviderSuccess: false,
          warning: "KI temporär nicht erreichbar; Analyse wird später erneut versucht.",
          result: truthEnvelope.result,
          safety,
          createAnalyze: truthEnvelope.createAnalyze,
          ...truthEnvelope.rootFields,
          meta: {
            runId,
            safety,
            claimSafety,
            providerMatrix,
            failedProviders: meta?.failedProviders ?? [],
            disabledProviders: meta?.disabledProviders ?? meta?.disabled ?? [],
            skippedProviders: meta?.skippedProviders ?? meta?.skipped ?? [],
            probes: meta?.probes ?? [],
            materialProvider: materialRouting.materialProvider,
            researchProvider: materialRouting.researchProvider,
            materialIntake: materialManifest?.intake ?? null,
            ...truthEnvelope.metaFields,
            journeyProfile: routeJourneyProfile.journey,
            lane: routeJourneyProfile.lane,
            roleProviderMapping: {
              primary: routeJourneyProfile.primaryRoles,
              secondary: routeJourneyProfile.secondaryRoles,
              fallback: routeJourneyProfile.fallbackProviders,
              openAiRoles: routeJourneyProfile.openAiRoles,
            },
            fallbackUsed: resolveMaterialFallbackUsed({ providerFallbackUsed: true, materialRouting }),
            requiresHumanReview: truthEnvelope.createAnalyze.requiresHumanReview,
            materialRouting,
            disagreement: {
              present: false,
              successfulProviders: [],
              failedProviders: [],
            },
            confidence: {
              score: 0.25,
              bucket: "low",
              reasons: ["degraded_provider_path"],
            },
            routeClassification,
            sourceGrounding: sourceGroundingAudit,
          },
        },
        { status: 200 },
      );
    }
    if (shouldFailClosedAnalyze(runtimeMode, normalized.code)) {
      const meta = (error as any)?.meta ?? {};
      const providerMatrix = buildProviderMatrixResponse(
        error,
        meta?.providerMatrix ?? meta?.provider_matrix ?? null,
        meta,
      );
      return err(normalized.code, normalized.message, normalized.status ?? 502, {
        degraded: false,
        realProviderSuccess: false,
        meta: {
          providerMatrix,
          routeClassification,
        },
      });
    }
    return formatErrorResponse(normalized, normalized.status ?? 502);
  }
}

const SSE_HEADERS = {
  "content-type": "text/event-stream; charset=utf-8",
  "cache-control": "no-cache, no-transform",
  connection: "keep-alive",
} as const;

function wantsSse(req: NextRequest, body: AnalyzeRequestParsed | null): boolean {
  if (body?.stream === true || body?.live === true) return true;
  const accept = req.headers.get("accept")?.toLowerCase() ?? "";
  return accept.includes("text/event-stream");
}

function startAnalyzeSseStream(input: AnalyzeJobInput): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      const sendProgress = (stage: string, pct: number) =>
        sendEvent("progress", { stage, pct });

      try {
        sendProgress("init", 5);
        sendProgress("dispatch", 15);

        sendProgress("analyzing", 35);
        const result = await runAnalyzeJob(input);
        await finalizeResultPayload(result, input);
        const sourceGroundingAudit = finalizeSourceGroundingAudit({
          context: input.sourceGrounding,
          result: toSourceGroundingResultInput(result),
        });
        const verification = buildStandardLaneContract({
          verificationMode:
            (result as any)?._meta?.verificationMode === "precheck" ? "precheck" : "none",
          researchUsed:
            (result as any)?._meta?.researchUsed === "lite" ||
            (result as any)?._meta?.researchUsed === "gemini" ||
            (result as any)?._meta?.researchUsed === "deep_search"
              ? (result as any)?._meta?.researchUsed
              : "none",
        });
        const truthEnvelope = buildAnalyzeTruthEnvelope({
          result,
          createAnalyze: {
            requiresHumanReview: Boolean((result as any)?._meta?.reviewRecommended),
          },
          verification,
          researchUsed: verification.researchUsed,
          sourceGroundingAudit,
          fallbackUsed: Boolean((result as any)?._meta?.fallbackUsed),
          reviewRecommended: Boolean((result as any)?._meta?.reviewRecommended),
        });

        sendProgress("finalizing", 85);
        sendEvent("result", {
          result: truthEnvelope.result,
          meta: {
            sourceGrounding: sourceGroundingAudit,
            ...truthEnvelope.metaFields,
          },
        });
        sendProgress("complete", 100);
        controller.close();
      } catch (error) {
        const normalized = normalizeAnalyzerError(error);
        logErrorSafe({
          msg: "analyze.route.sse_error",
          contributionId: input.contributionId,
          userId: maskUserId(input.userId ?? null),
          ...buildSafeErrorLogMeta(error),
          errorCode: normalized.code,
          status: normalized.status ?? null,
        });
        sendEvent("error", { code: normalized.code, reason: normalized.message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: SSE_HEADERS,
  });
}

async function runAnalyzeJob(input: AnalyzeJobInput): Promise<AnalyzeResultWithMeta> {
  const analyzed = await analyzeContribution({
    text: input.text,
    locale: input.locale,
    maxClaims: input.maxClaims,
    runId: input.runId,
    userId: input.userId ?? null,
    dossierId: input.dossierId ?? null,
    operationId: input.contributionId,
    operationType: "analyze_run",
    audienceRole: resolveAnalyzeAudienceRole(input.analysisMode),
    analysisMode: input.analysisMode,
    journeyHint: input.journeyHint,
    routePath: "/api/contributions/analyze",
    sourceGroundingPromptAddon: input.sourceGrounding.promptAddon,
    presentationPassEnabled: input.presentationPassEnabled,
  });
  return finalizeAnalyzeResult(analyzed);
}

function resolveAnalyzeVerificationContract(
  result: AnalyzeResultWithMeta,
  analysisMode: CreateProductMode,
  materialRouting: MaterialRoutingResult,
): VerificationContract {
  const meta = (result as any)?._meta ?? {};
  const modeFromMeta = meta?.verificationMode;
  const verificationMode: "none" | "precheck" =
    modeFromMeta === "none" || modeFromMeta === "precheck"
      ? modeFromMeta
      : analysisMode === "analyze"
        ? "none"
        : "precheck";
  const researchUsed =
    materialRouting.researchUsed === "gemini"
      ? "gemini"
      : materialRouting.researchUsed === "deep_search"
        ? "deep_search"
        : meta?.researchUsed === "none" ||
            meta?.researchUsed === "lite" ||
            meta?.researchUsed === "gemini" ||
            meta?.researchUsed === "deep_search"
          ? meta.researchUsed
          : "none";

  return buildStandardLaneContract({
    verificationMode,
    researchUsed,
  });
}

async function finalizeResultPayload(
  result: AnalyzeResultWithMeta,
  input: AnalyzeJobInput,
) {
  const snapshot = await persistEventualitiesSnapshot({
    result,
    contributionId: input.contributionId,
    locale: input.locale,
    userId: input.userId,
  }).catch((err) => {
    logErrorSafe({
      msg: "analyze.route.eventuality_persist_failed",
      contributionId: input.contributionId,
      ...buildSafeErrorLogMeta(err),
    });
    return null;
  });

  result._meta = {
    ...(result._meta ?? {}),
    contributionId: input.contributionId,
    eventualitiesReviewed: snapshot?.reviewed ?? false,
    eventualitiesReviewedAt: snapshot?.reviewedAt
      ? snapshot.reviewedAt.toISOString()
      : null,
    noAutoGraphPromotion: true,
    graphSync: buildGraphSyncGuardMeta(),
  };

  const runReceipt = (result as any)?.runReceipt;
  if (runReceipt?.id) {
    await upsertRunReceipt(runReceipt).catch((err) => {
      logErrorSafe({
        msg: "analyze.route.runreceipt_persist_failed",
        contributionId: input.contributionId,
        ...buildSafeErrorLogMeta(err),
      });
    });
  }

  return result;
}

function finalizeAnalyzeResult(result: AnalyzeResultWithMeta): AnalyzeResultWithMeta {
  const notes = hasEntries(result.notes)
    ? result.notes
    : deriveContextNotes(result);
  const questions = hasEntries(result.questions)
    ? result.questions
    : deriveCriticalQuestions(result);
  const knots = hasEntries(result.knots) ? result.knots : deriveKnots(result);
  const consequencesBundle = normalizeConsequenceBundle(result.consequences);
  const responsibilityPaths = Array.isArray(result.responsibilityPaths)
    ? result.responsibilityPaths
    : [];
  const eventualities = Array.isArray(result.eventualities)
    ? result.eventualities
    : [];
  const decisionTrees = Array.isArray(result.decisionTrees)
    ? result.decisionTrees
    : [];

  return {
    ...result,
    notes,
    questions,
    knots,
    consequences: {
      consequences: consequencesBundle.consequences ?? [],
      responsibilities: consequencesBundle.responsibilities ?? [],
    },
    responsibilityPaths,
    eventualities,
    decisionTrees,
  };
}

function hasEntries<T>(value?: T[] | null): value is T[] {
  return Array.isArray(value) && value.length > 0;
}

function normalizeConsequenceBundle(
  bundle: AnalyzeResultWithMeta["consequences"],
): NonNullable<AnalyzeResultWithMeta["consequences"]> {
  return {
    consequences: Array.isArray(bundle?.consequences) ? bundle!.consequences : [],
    responsibilities: Array.isArray(bundle?.responsibilities) ? bundle!.responsibilities : [],
  };
}

function toSourceGroundingResultInput(
  result: AnalyzeResultWithMeta,
): {
  claims?: Array<{ text?: string | null }>;
  notes?: Array<{ text?: string | null }>;
  report?: { keyConflicts?: unknown[] } | null;
} {
  return {
    claims: Array.isArray(result.claims)
      ? result.claims.map((claim) => ({
          text: typeof claim?.text === "string" ? claim.text : null,
        }))
      : [],
    notes: Array.isArray(result.notes)
      ? result.notes.map((note) => ({
          text: typeof note?.text === "string" ? note.text : null,
        }))
      : [],
    report: result.report
      ? {
          keyConflicts: Array.isArray(result.report.keyConflicts)
            ? result.report.keyConflicts
            : [],
        }
      : null,
  };
}

function normalizeAnalyzerError(error: unknown): NormalizedAnalyzerError {
  const code = typeof (error as any)?.code === "string" ? (error as any).code : null;
  const message =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message?: unknown }).message ?? "")
      : typeof error === "string"
        ? error
        : "";

  if (code === "NO_ANALYZE_PROVIDER" || (message.includes("Orchestrator") && message.includes("Kein aktiver Provider"))) {
    return {
      code: "NO_ANALYZE_PROVIDER",
      message: "Analyze ist derzeit nicht verfügbar. Bitte später erneut versuchen.",
      status: 503,
    };
  }

  if (/OPENAI_API_KEY fehlt/i.test(message) || /API_KEY fehlt/i.test(message)) {
    return {
      code: "MISSING_ENV",
      message: "Analyze ist derzeit nicht verfügbar. Bitte später erneut versuchen.",
      status: 503,
    };
  }

  if (message.includes("KI-Antwort war kein gültiges JSON")) {
    return {
      code: "INVALID_AI_RESPONSE",
      message: "Analyze ist derzeit nicht verfügbar. Bitte später erneut versuchen.",
      status: 502,
    };
  }
  if (code === "BAD_JSON") {
    return {
      code: "BAD_JSON",
      message: "Analyze ist derzeit nicht verfügbar. Bitte später erneut versuchen.",
      status: 502,
    };
  }
  if (code === "ANALYZE_PROVIDER_FAILED") {
    return {
      code: "ANALYZE_PROVIDER_FAILED",
      message: "Analyze ist derzeit nicht verfügbar. Bitte später erneut versuchen.",
      status: 502,
    };
  }
  if (code === "ANALYZE_TIMEOUT" || message === "analyze_timeout") {
    return {
      code: "ANALYZE_TIMEOUT",
      message: "Analyze ist derzeit nicht verfügbar. Bitte später erneut versuchen.",
      status: 504,
    };
  }
  return {
    code: "ANALYZE_FAILED",
    message: "Analyze ist derzeit nicht verfügbar. Bitte später erneut versuchen.",
    status: 502,
  };
}

const FALLBACK_ELIGIBLE_CODES = new Set([
  "ANALYZE_TIMEOUT",
  "NO_ANALYZE_PROVIDER",
  "MISSING_ENV",
  "INVALID_AI_RESPONSE",
  "ANALYZE_FAILED",
]);

function shouldUseFallback(err: unknown) {
  if (!err || typeof err !== "object") return false;
  const anyErr = err as { errorCode?: string; code?: string };
  const code = anyErr.errorCode ?? anyErr.code;
  return typeof code === "string" && FALLBACK_ELIGIBLE_CODES.has(code);
}

const FAIL_CLOSED_ANALYZE_CODES = new Set([
  "NO_ANALYZE_PROVIDER",
  "MISSING_ENV",
  "ANALYZE_TIMEOUT",
  "ANALYZE_FAILED",
  "ANALYZE_PROVIDER_FAILED",
  "BAD_JSON",
  "INVALID_AI_RESPONSE",
]);

function allowHeuristicAnalyzeFallback(runtimeMode: AiRuntimeMode, code: string): boolean {
  return isNonProductionRuntimeMode(runtimeMode) && FALLBACK_ELIGIBLE_CODES.has(code);
}

function allowDegradedAnalyzeResult(runtimeMode: AiRuntimeMode, code: string): boolean {
  return (
    isNonProductionRuntimeMode(runtimeMode) &&
    (code === "BAD_JSON" || code === "ANALYZE_PROVIDER_FAILED")
  );
}

function shouldFailClosedAnalyze(runtimeMode: AiRuntimeMode, code: string): boolean {
  return !isNonProductionRuntimeMode(runtimeMode) && FAIL_CLOSED_ANALYZE_CODES.has(code);
}

async function resolveCreateMatchesSafe(input: {
  text: string;
  normalizedInputSummary: string;
  claims: unknown[];
  anlassraumId?: string | null;
  dossierId?: string | null;
  locale?: string | null;
  languageMode?: "same_language_only";
}): Promise<CreateAnalyzeMatchResultInput> {
  try {
    return await resolveCreateGraphMatches(input);
  } catch {
    return {
      matches: [
        {
          id: "no-match",
          matchType: "no_match",
          matchEntityType: "question",
          strength: "none",
          label: "Kein belastbarer Match",
          reason: "Produktive Match-Quelle derzeit nicht verfuegbar.",
          reasons: ["Produktive Match-Quelle derzeit nicht verfuegbar."],
          entityId: null,
          targetRef: null,
        },
      ],
      matchStrength: "none",
      matchType: "no_match",
      matchEntityType: "question",
      reasons: ["Produktive Match-Quelle derzeit nicht verfuegbar."],
      suggestedCtas: resolveCreateCtaSuggestions({
        matchType: "no_match",
        matchEntityType: "question",
        matchStrength: "none",
      }),
      sourceState: "degraded",
      sourceErrors: ["match_service_unavailable"],
      languageMode: "same_language_only",
    };
  }
}

const PROVIDER_LIST: ProviderMatrixEntry["provider"][] = [
  "openai",
  "mistral",
  "anthropic",
  "ari",
  "gemini",
];

const AI_ERROR_KINDS: ReadonlySet<AiErrorKind> = new Set<AiErrorKind>([
  "BAD_JSON",
  "CANCELLED",
  "INTERNAL",
  "INVALID_API_KEY",
  "MODEL_NOT_FOUND",
  "RATE_LIMIT",
  "TIMEOUT",
  "UNAUTHORIZED",
  "UNKNOWN",
]);

function asAiErrorKind(value: unknown): AiErrorKind | null {
  if (typeof value !== "string") return null;
  return AI_ERROR_KINDS.has(value as AiErrorKind) ? (value as AiErrorKind) : null;
}

type PublicProviderMatrixEntry = Pick<
  ProviderMatrixEntry,
  "provider" | "state" | "attempt" | "errorKind" | "status" | "durationMs" | "model" | "reason"
>;

function normalizePublicProviderReason(value: unknown, fallbackState?: unknown): string {
  const raw = typeof value === "string" ? value.trim() : "";
  const normalized = raw.toLowerCase();
  if (normalized === "missing_credentials") return "missing_credentials";
  if (
    normalized.includes("missing ") &&
    (normalized.includes("api_key") ||
      normalized.includes("base_url") ||
      normalized.includes("api_url") ||
      normalized.includes("ari_url"))
  ) {
    return "missing_credentials";
  }
  if (normalized === "provider_disabled" || normalized.includes("disabled")) return "provider_disabled";
  if (normalized === "blocked_by_runtime_policy") return "blocked_by_runtime_policy";
  if (normalized === "not_in_journey_plan") return "not_in_journey_plan";
  if (normalized === "fallback_not_needed") return "fallback_not_needed";
  if (normalized === "budget_abort" || normalized.includes("cancelled (budget)")) return "budget_abort";
  if (normalized === "timeout" || normalized.includes("timeout") || normalized.includes("timed out")) return "timeout";
  if (normalized === "rate_limit" || normalized.includes("rate limit") || normalized.includes("429")) return "rate_limit";
  if (
    normalized === "unauthorized" ||
    normalized === "invalid_api_key" ||
    normalized.includes("unauthorized") ||
    normalized.includes("forbidden") ||
    normalized.includes("invalid api key") ||
    normalized.includes("401") ||
    normalized.includes("403")
  ) {
    return "unauthorized";
  }
  if (
    normalized === "model_not_found" ||
    normalized.includes("model_not_found") ||
    normalized.includes("modell nicht gefunden") ||
    (normalized.includes("model") && normalized.includes("not found"))
  ) {
    return "model_not_found";
  }
  if (
    normalized === "invalid_response" ||
    normalized === "bad_json" ||
    normalized === "schema_invalid" ||
    normalized.includes("bad_json") ||
    normalized.includes("schema") ||
    normalized.includes("parse") ||
    normalized.includes("invalid_response")
  ) {
    return "invalid_response";
  }
  if (normalized === "provider_failed" || normalized.includes("provider_failed") || normalized.includes("probe failed")) {
    return "provider_failed";
  }
  const state = typeof fallbackState === "string" ? fallbackState : "";
  if (state === "disabled") return "provider_disabled";
  if (state === "skipped") return "not_in_journey_plan";
  return "provider_failed";
}

function normalizePublicProviderMatrixEntry(entry: Record<string, unknown>): PublicProviderMatrixEntry {
  return {
    provider: entry.provider as ProviderMatrixEntry["provider"],
    state:
      entry.state === "running" ||
      entry.state === "ok" ||
      entry.state === "failed" ||
      entry.state === "cancelled" ||
      entry.state === "skipped" ||
      entry.state === "disabled"
        ? (entry.state as ProviderMatrixEntry["state"])
        : "failed",
    attempt: safeNumeric(entry.attempt, 1, 9),
    errorKind: asAiErrorKind(entry.errorKind),
    status: safeNumeric(entry.status, 100, 599),
    durationMs: safeNumeric(entry.durationMs, 0, 600_000),
    model: safeIdentifier(entry.model),
    reason: normalizePublicProviderReason(
      entry.reason ??
        entry.errorMessage ??
        entry.errorMessageShort ??
        entry.openaiErrorMessage ??
        entry.providerErrorCode,
      entry.state,
    ),
  };
}

function buildProviderMatrixResponse(
  source: any,
  existing: ProviderMatrixEntry[] | undefined | null,
  meta?: any,
): PublicProviderMatrixEntry[] {
  if (Array.isArray(existing) && existing.length) {
    return existing
      .filter((entry): entry is ProviderMatrixEntry => Boolean(entry?.provider))
      .map((entry) =>
        normalizePublicProviderMatrixEntry(entry as unknown as Record<string, unknown>),
      );
  }
  const m = meta ?? source?.meta ?? {};
  const disabled: { provider: string; reason?: string }[] =
    m.disabledProviders ?? m.disabled ?? [];
  const skipped: { provider: string; reason?: string }[] =
    m.skippedProviders ?? m.skipped ?? [];
  const failed: {
    provider: string;
    errorKind?: unknown;
    error?: string;
    httpStatus?: number | null;
    errorMessageShort?: string | null;
  }[] = m.failedProviders ?? [];
  const timings: Record<string, number | null> = m.timings ?? {};
  const successProviders: string[] = m.usedProviders ?? [];

  return PROVIDER_LIST.map((provider) => {
    const disabledEntry = disabled.find((d) => d.provider === provider);
    if (disabledEntry) {
      return normalizePublicProviderMatrixEntry({
        provider,
        state: "disabled",
        errorKind: null,
        status: null,
        durationMs: timings[provider] ?? null,
        model: null,
        reason: disabledEntry.reason ?? null,
      });
    }
    const skippedEntry = skipped.find((s) => s.provider === provider);
    if (skippedEntry) {
      return normalizePublicProviderMatrixEntry({
        provider,
        state: "skipped",
        errorKind: null,
        status: null,
        durationMs: timings[provider] ?? null,
        model: null,
        reason: skippedEntry.reason ?? null,
      });
    }
    const failedEntry = failed.find((f) => f.provider === provider);
    if (failedEntry) {
      const errorKind = asAiErrorKind(failedEntry.errorKind);
      return normalizePublicProviderMatrixEntry({
        provider,
        state: "failed",
        attempt: null,
        errorKind,
        status: (failedEntry as any)?.httpStatus ?? null,
        durationMs: timings[provider] ?? null,
        model: null,
        reason: failedEntry.error ?? failedEntry.errorMessageShort ?? null,
      });
    }
    if (successProviders.includes(provider)) {
      return normalizePublicProviderMatrixEntry({
        provider,
        state: "ok",
        attempt: 1,
        errorKind: null,
        status: null,
        durationMs: timings[provider] ?? null,
        model: null,
        reason: null,
      });
    }
    return normalizePublicProviderMatrixEntry({
      provider,
      state: "failed",
      errorKind: null,
      status: null,
      durationMs: null,
      model: null,
      reason: "provider_failed",
    });
  });
}

function resolveContributionId(rawId: unknown, text: string): string {
  if (typeof rawId === "string") {
    const trimmed = rawId.trim();
    if (trimmed.length >= 8) {
      return trimmed.slice(0, 64);
    }
  }
  return crypto.createHash("sha1").update(text).digest("hex").slice(0, 32);
}
