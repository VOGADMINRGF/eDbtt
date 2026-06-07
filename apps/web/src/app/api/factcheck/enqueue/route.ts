import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { formatError } from "@core/errors/formatError";
import { logger } from "@core/observability/logger";
import { safeRandomId } from "@core/utils/random";
import type { StatementRecord } from "@features/analyze/schemas";
import {
  getFactcheckWorkflowRepo,
  type FactcheckAccessContext,
  type FactcheckJobDoc,
  type FactcheckJobSourceType,
  type FactcheckRequestedAction,
  type FactcheckSourceRef,
  type FactcheckStatus,
} from "@features/factcheck/db";
import {
  createFactcheckAuditEvent,
  deriveFactcheckResearchMode,
  extractSourceRefsFromText,
  factcheckLimitationsForRequest,
  factcheckStatusLabel,
} from "@features/factcheck/workflow";
import { refreshFactcheckJobState } from "@features/factcheck/jobRunner";
import { resolveSealedFactcheckStatusView } from "@features/ai/e150/factcheckStatus";
import { resolveAiRouteClassification } from "@features/ai/e150/routeClassification";
import {
  buildOrganizationDashboardReadModel,
  organizationEntitlementAllowsScope,
} from "@features/region";
import { buildLandingContributionDraft } from "@/features/start/landingCreateLight";
import {
  logPermissionDenied,
  resolveRoleFromRequest,
} from "@/lib/server/auth/requestRole";
import {
  requestScopeCanWriteOrganizationRoutes,
  resolveRequestScopeContext,
  summarizeRequestScopeContext,
} from "@/lib/server/auth/requestScope";
import {
  internalSystemIdentityAuditFields,
  resolveInternalSystemIdentity,
  resolveTrustedInternalSystemIdentity,
} from "@/lib/server/auth/systemIdentity";
import { getCreateEntitlementsForRequest } from "@/lib/server/entitlements/createEntitlements";
import {
  getFactcheckEntitlementGateMessage,
  resolveFactcheckEntitlementGate,
  type FactcheckEntitlementAction,
} from "@features/factcheck/entitlementGate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CLAIMS = 8;

const EnqueueSchema = z.object({
  sourceType: z
    .enum([
      "editorial_review_request",
      "create_analysis",
      "factcheck_request",
      "graph_merge_candidate",
      "dossier_candidate",
    ])
    .optional()
    .nullable(),
  sourceId: z.string().optional().nullable(),
  reviewRequestId: z.string().optional().nullable(),
  graphCandidateId: z.string().optional().nullable(),
  draftId: z.string().optional().nullable(),
  contributionId: z.string().optional().nullable(),
  dossierId: z.string().optional().nullable(),
  handoffId: z.string().optional().nullable(),
  text: z.string().optional().nullable(),
  language: z.string().optional().nullable(),
  requestedAction: z
    .enum(["source_check", "factcheck", "deep_research", "sealed_factcheck"])
    .optional()
    .nullable(),
  claims: z.array(z.any()).optional().nullable(),
  sourceRefs: z.array(z.string().trim().min(1)).optional().default([]),
  materialRefs: z.array(z.string().trim().min(1)).optional().default([]),
  withSerp: z.boolean().optional().default(false),
  deepSearch: z.boolean().optional().default(false),
  researchConfirmed: z.boolean().optional().default(false),
});

function toShortLang(v?: string | null): string {
  const t = (v ?? "").trim().toLowerCase();
  if (!t) return "de";
  return t.split(/[-_]/)[0] || "de";
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function coerceClaims(claims: unknown, fallbackText: string): StatementRecord[] {
  const normalized = Array.isArray(claims)
    ? claims
        .map((claim, index) => {
          if (typeof claim === "string") {
            const text = claim.trim();
            if (!text) return null;
            return { id: String(index + 1), text } as StatementRecord;
          }
          if (claim && typeof claim === "object" && typeof (claim as any).text === "string") {
            const text = String((claim as any).text).trim();
            if (!text) return null;
            return {
              id: String((claim as any).id ?? index + 1),
              text,
              title: (claim as any).title ?? null,
              responsibility: (claim as any).responsibility ?? null,
              importance: (claim as any).importance ?? null,
              topic: (claim as any).topic ?? null,
              domains: (claim as any).domains ?? undefined,
              domain: (claim as any).domain ?? undefined,
            } as StatementRecord;
          }
          return null;
        })
        .filter(Boolean)
        .slice(0, MAX_CLAIMS)
    : [];

  if (normalized.length > 0) return normalized as StatementRecord[];
  return fallbackText.trim()
    ? [{ id: "1", text: fallbackText.trim() } as StatementRecord]
    : [];
}

function uniqueNonEmpty(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));
}

function normalizeGateFailureCode(reason: string) {
  switch (reason) {
    case "login_required":
      return "login_required";
    case "entitlement_missing":
      return "entitlement_required";
    case "pricing_required":
      return "pricing_required";
    case "confirmation_required":
      return "confirmation_required";
    case "blocked_by_truth_guard":
    case "review_required_first":
      return "blocked_by_truth_guard";
    case "blocked_by_spam":
      return "blocked_by_spam";
    default:
      return "factcheck_not_allowed";
  }
}

function resolveRequestedAction(payload: z.infer<typeof EnqueueSchema>): FactcheckRequestedAction {
  if (payload.requestedAction) return payload.requestedAction;
  if (payload.deepSearch === true) return "deep_research";
  if (payload.withSerp === true) return "source_check";
  return "factcheck";
}

function resolveJobSourceType(payload: z.infer<typeof EnqueueSchema>): FactcheckJobSourceType {
  if (payload.sourceType) return payload.sourceType;
  if (payload.reviewRequestId) return "editorial_review_request";
  if (payload.graphCandidateId) return "graph_merge_candidate";
  if (payload.draftId || payload.contributionId || payload.handoffId) return "create_analysis";
  if (payload.dossierId) return "dossier_candidate";
  return "factcheck_request";
}

function resolveJobSourceId(payload: z.infer<typeof EnqueueSchema>) {
  return (
    payload.sourceId ??
    payload.reviewRequestId ??
    payload.graphCandidateId ??
    payload.contributionId ??
    payload.handoffId ??
    payload.draftId ??
    payload.dossierId ??
    null
  );
}

function contractIsBlocked(contractStatus: string | null, billingStatus: string | null) {
  return (
    contractStatus === "suspended" ||
    contractStatus === "cancelled" ||
    contractStatus === "expired" ||
    billingStatus === "overdue" ||
    billingStatus === "suspended" ||
    billingStatus === "cancelled" ||
    billingStatus === "expired"
  );
}

function contractIsLimited(contractStatus: string | null, billingStatus: string | null) {
  return (
    contractStatus === "limited" ||
    contractStatus === "none" ||
    contractStatus === "draft" ||
    contractStatus === "offered" ||
    contractStatus === "accepted" ||
    billingStatus === "none" ||
    billingStatus === "billing_pending" ||
    billingStatus === "grace_period"
  );
}

function buildAccessContext(input: {
  trustedSystemAccess: boolean;
  scopeSummary: ReturnType<typeof summarizeRequestScopeContext>;
  canWriteOrganizationRoutes: boolean;
  hasReviewQueueEntitlement: boolean;
  contractStatus: string | null;
  billingStatus: string | null;
}): {
  accessContext: FactcheckAccessContext;
  persistedOrganizationId: string | null;
  persistedRegionId: string | null;
} {
  if (input.trustedSystemAccess) {
    return {
      accessContext: {
        scope: "operator",
        productionAccess: "allowed",
        reason: "none",
      },
      persistedOrganizationId: null,
      persistedRegionId: null,
    };
  }

  if (!input.scopeSummary?.organizationId || input.scopeSummary.isOperatorMode) {
    return {
      accessContext: {
        scope: input.scopeSummary?.isOperatorMode ? "operator" : "requester_only",
        productionAccess: input.scopeSummary?.isOperatorMode ? "allowed" : "limited",
        reason: "none",
      },
      persistedOrganizationId: input.scopeSummary?.isOperatorMode
        ? input.scopeSummary.organizationId
        : null,
      persistedRegionId: input.scopeSummary?.isOperatorMode
        ? input.scopeSummary.primaryRegionId
        : null,
    };
  }

  if (!input.canWriteOrganizationRoutes) {
    return {
      accessContext: {
        scope: "requester_only",
        productionAccess:
          input.scopeSummary.membershipStatus === "suspended" ||
          input.scopeSummary.membershipStatus === "revoked"
            ? "blocked"
            : "limited",
        reason:
          input.scopeSummary.membershipStatus === "suspended" ||
          input.scopeSummary.membershipStatus === "revoked"
            ? "membership_blocked"
            : "membership_pending",
      },
      persistedOrganizationId: null,
      persistedRegionId: null,
    };
  }

  if (contractIsBlocked(input.contractStatus, input.billingStatus)) {
    return {
      accessContext: {
        scope: "requester_only",
        productionAccess: "blocked",
        reason: "contract_blocked",
      },
      persistedOrganizationId: null,
      persistedRegionId: null,
    };
  }

  if (
    !input.hasReviewQueueEntitlement ||
    contractIsLimited(input.contractStatus, input.billingStatus)
  ) {
    return {
      accessContext: {
        scope: "requester_only",
        productionAccess: "limited",
        reason: !input.hasReviewQueueEntitlement
          ? "entitlement_missing"
          : "contract_pending",
      },
      persistedOrganizationId: null,
      persistedRegionId: null,
    };
  }

  return {
    accessContext: {
      scope: "organization",
      productionAccess: "allowed",
      reason: "none",
    },
    persistedOrganizationId: input.scopeSummary.organizationId,
    persistedRegionId: input.scopeSummary.primaryRegionId,
  };
}

function nextSafeStep(status: FactcheckStatus, accessContext: FactcheckAccessContext) {
  if (accessContext.productionAccess === "blocked") {
    return {
      title: "Produktiver Organisationspfad ist gesperrt",
      body: "Die Anfrage wurde nicht als aktiver Organisations-Check eingeordnet. Bitte Membership-, Entitlement- oder Vertragslage prüfen lassen.",
    };
  }
  if (accessContext.productionAccess === "limited") {
    return {
      title: "Prüfung ist vorgemerkt",
      body: "Die Anfrage ist gespeichert, aber noch nicht als produktiver Organisations-Check freigeschaltet. Sichere nächste Schritte bleiben Quellen nachreichen oder Betreiberentscheidung abwarten.",
    };
  }
  if (status === "queued") {
    return {
      title: "Quellenprüfung eingeplant",
      body: "Der Job ist vorgemerkt und noch nicht veröffentlicht oder zusammengeführt.",
    };
  }
  if (status === "running") {
    return {
      title: "Quellenprüfung läuft",
      body: "Der Job läuft als kontrollierter Arbeitsstand ohne Auto-Publish oder Auto-Merge.",
    };
  }
  return {
    title: "Review einplanen",
    body: "Die Anfrage ist gespeichert und bleibt review-first. Ein öffentliches Ergebnis oder Siegel entsteht erst nach bewusster Entscheidung.",
  };
}

function toFactcheckGateStatus(reason: string) {
  if (reason === "login_required") return 401;
  if (reason === "confirmation_required") return 409;
  if (reason === "entitlement_missing" || reason === "pricing_required") return 402;
  if (reason === "blocked_by_spam") return 400;
  if (reason === "blocked_by_truth_guard" || reason === "review_required_first") return 409;
  return 400;
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  try {
    const systemIdentity = resolveInternalSystemIdentity(req);
    const trustedSystemIdentity = resolveTrustedInternalSystemIdentity(req);
    const roleContext = resolveRoleFromRequest(req);
    const scopeContext = await resolveRequestScopeContext(req).catch(() => null);
    const hasSessionAccess = Boolean(scopeContext?.actorId);
    const hasTrustedSystemAccess =
      trustedSystemIdentity?.source === "factcheck_queue" ||
      trustedSystemIdentity?.source === "factcheck_worker";

    if (!hasSessionAccess && !hasTrustedSystemAccess) {
      if (roleContext.source !== "header" && !systemIdentity) {
        return json(
          {
            ok: false,
            code: "login_required",
            message:
              "Bitte melde dich an, bevor du eine verbindliche Quellenprüfung startest.",
          },
          401,
        );
      }
      logPermissionDenied({
        req,
        scope: "factcheck.enqueue",
        permission: "factcheck:enqueue",
        role: roleContext.role,
        source: roleContext.source,
        details: {
          ...internalSystemIdentityAuditFields(systemIdentity),
          denyReason: systemIdentity
            ? "system_identity_untrusted_or_disallowed"
            : roleContext.source === "header"
              ? "header_role_not_allowed"
              : "missing_session",
        },
      });
      return json(formatError("FORBIDDEN", "Permission denied", { role: roleContext.role }), 403);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ ok: false, code: "INVALID_JSON", message: "Malformed JSON" }, 400);
    }

    let payload: z.infer<typeof EnqueueSchema>;
    try {
      payload = EnqueueSchema.parse(body);
    } catch (error) {
      const issues = error instanceof ZodError ? error.issues : [];
      return json({ ok: false, code: "VALIDATION_ERROR", issues }, 400);
    }

    const inputText = String(payload.text ?? "").trim();
    if (!inputText) {
      return json(
        { ok: false, code: "MISSING_INPUT", message: "Provide text or draftId" },
        400,
      );
    }
    const draft = buildLandingContributionDraft(inputText);
    if (
      draft.relevanceClassification === "spam_suspected" ||
      draft.relevanceClassification === "abusive_or_empty" ||
      draft.guardrails.isTooShort
    ) {
      const gateReason = resolveFactcheckEntitlementGate("source_check", {
        isAuthenticated: hasTrustedSystemAccess || hasSessionAccess,
        blockedBySpam: true,
      });
      return json(
        {
          ok: false,
          code: normalizeGateFailureCode(gateReason.reason),
          message:
            draft.guardrails.blockingMessage ??
            getFactcheckEntitlementGateMessage(gateReason),
          entitlementGate: gateReason,
        },
        toFactcheckGateStatus(gateReason.reason),
      );
    }

    const scopeSummary = summarizeRequestScopeContext(scopeContext);
    const dashboardReadModel =
      scopeContext?.actorId && !scopeContext.isOperatorMode
        ? await buildOrganizationDashboardReadModel({
            userId: scopeContext.actorId,
            roles: scopeContext.actor.roles,
            isAdmin: false,
            actorRole: scopeContext.organizationRole,
          }).catch(() => null)
        : null;
    const accessResolution = buildAccessContext({
      trustedSystemAccess: hasTrustedSystemAccess,
      scopeSummary,
      canWriteOrganizationRoutes: scopeContext
        ? requestScopeCanWriteOrganizationRoutes(scopeContext)
        : false,
      hasReviewQueueEntitlement: dashboardReadModel
        ? organizationEntitlementAllowsScope(
            dashboardReadModel.entitlementSummary,
            "review_queue",
          )
        : false,
      contractStatus: dashboardReadModel?.contractSummary.currentContractStatus ?? null,
      billingStatus: dashboardReadModel?.contractSummary.billingStatus ?? null,
    });
    const entitlements =
      hasTrustedSystemAccess || !hasSessionAccess
        ? null
        : await getCreateEntitlementsForRequest(req).catch(() => null);

    const lang = toShortLang(payload.language);
    const requestedAction = resolveRequestedAction(payload);
    const claims = coerceClaims(payload.claims, inputText);
    const sourceRefs: FactcheckSourceRef[] = [
      ...extractSourceRefsFromText(inputText),
      ...uniqueNonEmpty(payload.sourceRefs).map((value, index) => {
        const sourceType: FactcheckSourceRef["sourceType"] = value.endsWith(".pdf")
          ? "document_url"
          : value.includes("youtube.com/") || value.includes("youtu.be/")
            ? "youtube_video_url"
            : "manual_reference";
        return {
          id: `payload-source-${index + 1}`,
          label: value,
          url: value.startsWith("http://") || value.startsWith("https://") ? value : null,
          sourceType,
        };
      }),
    ];
    const uniqueSourceRefs = Array.from(
      new Map(sourceRefs.map((entry) => [`${entry.url ?? entry.label}`, entry])).values(),
    );
    const researchMode = deriveFactcheckResearchMode({
      requestedDeepResearch: requestedAction === "deep_research",
      requestedProviderRun:
        payload.withSerp === true ||
        requestedAction === "source_check" ||
        requestedAction === "sealed_factcheck",
    });

    const actorId =
      hasTrustedSystemAccess
        ? `system:${trustedSystemIdentity?.source ?? "factcheck_queue"}`
        : scopeContext?.actorId ?? "unknown-requester";
    const actorLabel =
      hasTrustedSystemAccess
        ? `System · ${trustedSystemIdentity?.source ?? "factcheck_queue"}`
        : scopeContext?.email ?? scopeContext?.actorId ?? "Anfragende Person";
    const actorMode = hasTrustedSystemAccess
      ? "system"
      : scopeContext?.isOperatorMode
        ? "operator"
        : accessResolution.persistedOrganizationId
          ? "organization"
          : "user";
    const now = new Date();
    const routeClassification = resolveAiRouteClassification("/api/factcheck/enqueue");
    const jobId = safeRandomId();
    const gateAction: FactcheckEntitlementAction =
      requestedAction === "deep_research" ? "deep_research" : "source_check";
    const entitlementGate = resolveFactcheckEntitlementGate(gateAction, {
      isAuthenticated: hasTrustedSystemAccess || hasSessionAccess,
      hasEntitlement: hasTrustedSystemAccess ? true : entitlements?.canDeepResearch ?? false,
      hasPricingAccess: hasTrustedSystemAccess ? true : entitlements?.canDeepResearch ?? false,
      confirmationProvided: hasTrustedSystemAccess || payload.researchConfirmed === true,
    });

    if (!entitlementGate.allowed) {
      return json(
        {
          ok: false,
          code: normalizeGateFailureCode(entitlementGate.reason),
          message: getFactcheckEntitlementGateMessage(entitlementGate),
          entitlementGate,
          meta: {
            lane: "sealed_factcheck",
            journeyProfile: "sealed_factcheck",
            routeClassification,
            noAutoDeepSearch: true,
            noAutoSeal: true,
            noAutoPublish: true,
            noAutoGraphPromotion: true,
          },
        },
        toFactcheckGateStatus(entitlementGate.reason),
      );
    }

    const record = refreshFactcheckJobState({
      jobId,
      sourceType: resolveJobSourceType(payload),
      sourceId: resolveJobSourceId(payload),
      reviewRequestId: payload.reviewRequestId ?? null,
      graphCandidateId: payload.graphCandidateId ?? null,
      draftId: payload.draftId ?? null,
      contributionId: payload.contributionId ?? null,
      dossierId: payload.dossierId ?? null,
      handoffId: payload.handoffId ?? null,
      userId: hasTrustedSystemAccess ? null : scopeContext?.actorId ?? null,
      tenantId: accessResolution.persistedOrganizationId,
      organizationId: accessResolution.persistedOrganizationId,
      regionId: accessResolution.persistedRegionId,
      requestedByUserId: hasTrustedSystemAccess ? null : scopeContext?.actorId ?? null,
      requestedByRole: scopeSummary?.roleLabel ?? scopeSummary?.organizationRole ?? roleContext.role,
      requestedInOperatorMode: scopeSummary?.isOperatorMode ?? hasTrustedSystemAccess,
      sourceOfTruth: scopeSummary?.sourceOfTruth ?? (hasTrustedSystemAccess ? "session" : null),
      confidence: scopeSummary?.confidence ?? null,
      accessContext: accessResolution.accessContext,
      language: lang,
      inputText,
      normalizedText: inputText.toLowerCase().replace(/\s+/g, " ").trim(),
      requestedAction,
      status: "queued",
      gate: {
        loginConfirmed: hasTrustedSystemAccess || hasSessionAccess,
        entitlementConfirmed: hasTrustedSystemAccess ? true : entitlements?.canDeepResearch === true,
        pricingConfirmed: hasTrustedSystemAccess ? true : entitlements?.canDeepResearch === true,
        userConfirmed: hasTrustedSystemAccess || payload.researchConfirmed === true,
        noSilentCost: true,
      },
      verdict: "UNDETERMINED",
      confidenceScore: 0,
      claims,
      sourceRefs: uniqueSourceRefs,
      materialRefs: uniqueNonEmpty(payload.materialRefs),
      serpResults: [],
      factcheckVerificationMode: "intake_only",
      factcheckResearchMode: researchMode,
      factcheckSealEligibility: "needs_review",
      factcheckSealDecision: "none",
      publicSealVisible: false,
      limitations: factcheckLimitationsForRequest({
        sourceRefs: uniqueSourceRefs,
        researchMode,
      }),
      verificationMode: "none",
      researchUsed:
        requestedAction === "deep_research"
          ? "deep_search"
          : requestedAction === "source_check" || requestedAction === "sealed_factcheck"
            ? "search"
            : "none",
      sealEligible: true,
      sealGranted: false,
      sealedAt: null,
      fallbackUsed: false,
      disagreement: null,
      orchestrationConfidence: null,
      auditEvents: [
        createFactcheckAuditEvent({
          eventType: "request",
          actorId,
          actorLabel,
          actorMode,
          note: "Prüfauftrag ist bestätigt, eingeplant und bleibt review-first.",
        }),
      ],
      error: null,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      finishedAt: null,
      noAutoPublish: true,
      noAutoGraphPromotion: true,
      noAutoDossier: true,
      noAutoAnlassraum: true,
      noAutoVote: true,
    } satisfies FactcheckJobDoc);

    await getFactcheckWorkflowRepo().save(record);

    const statusView = resolveSealedFactcheckStatusView({
      status: record.status,
      verificationMode: record.verificationMode,
      researchUsed: record.researchUsed,
      sealEligible: record.sealEligible,
      sealGranted: record.sealGranted,
      factcheckVerificationMode: record.factcheckVerificationMode,
      factcheckResearchMode: record.factcheckResearchMode,
      factcheckSealEligibility: record.factcheckSealEligibility,
      factcheckSealDecision: record.factcheckSealDecision,
    });
    const nextStep = nextSafeStep(record.status, record.accessContext ?? {
      scope: "requester_only",
      productionAccess: "limited",
      reason: "none",
    });

    return json({
      ok: true,
      jobId,
      status: record.status,
      statusLabel: factcheckStatusLabel(record.status),
      claimsCount: claims.length,
      sourceRefCount: uniqueSourceRefs.length,
      materialRefCount: record.materialRefs.length,
      durationMs: Date.now() - t0,
      requestedAction: record.requestedAction,
      truthStatus: record.truthStatus,
      sourceSupport: record.sourceSupport,
      sourceStatus: record.sourceStatus,
      verificationLabel: record.verificationLabel,
      verificationMode: statusView.verificationMode,
      researchUsed: statusView.researchUsed,
      sealEligible: statusView.sealEligible,
      sealGranted: statusView.sealGranted,
      workflowStage: statusView.workflowStage,
      workflowLabel: statusView.workflowLabel,
      sealStatus: statusView.sealLabel,
      factcheckStatus: statusView.factcheckStatus,
      factcheckStatusLabel: statusView.factcheckStatusLabel,
      factcheckVerificationMode: statusView.factcheckVerificationMode,
      factcheckResearchMode: statusView.factcheckResearchMode,
      factcheckSealEligibility: statusView.factcheckSealEligibility,
      factcheckSealDecision: statusView.factcheckSealDecision,
      sourceRefs: uniqueSourceRefs,
      materialRefs: record.materialRefs,
      limitations: record.limitations,
      accessContext: record.accessContext,
      gate: record.gate,
      requestScope: scopeSummary,
      nextStep,
      meta: {
        lane: "sealed_factcheck",
        journeyProfile: "sealed_factcheck",
        routeClassification,
        entitlementGate,
        noAutoDeepSearch: true,
        noAutoSeal: true,
        noAutoPublish: true,
        noAutoGraphPromotion: true,
      },
    });
  } catch (error: any) {
    const fe = formatError(
      "INTERNAL_ERROR",
      "Unexpected failure",
      error?.message ?? String(error),
    );
    logger.error({ fe, error }, "FACTCHECK_ENQUEUE_FAIL");
    return NextResponse.json(fe, { status: 500 });
  }
}
