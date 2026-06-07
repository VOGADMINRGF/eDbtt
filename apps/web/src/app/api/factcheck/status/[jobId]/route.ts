import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { formatError } from "@core/errors/formatError";
import { logger } from "@core/observability/logger";
import { getFactcheckWorkflowRepo } from "@features/factcheck/db";
import {
  createFactcheckAuditEvent,
  factcheckStatusLabel,
} from "@features/factcheck/workflow";
import {
  refreshFactcheckJobState,
  runFactcheckJob,
} from "@features/factcheck/jobRunner";
import {
  canAdministerFactcheckRecord,
  canViewFactcheckRecord,
} from "@features/factcheck/access";
import { resolveSealedFactcheckStatusView } from "@features/ai/e150/factcheckStatus";
import { resolveAiRouteClassification } from "@features/ai/e150/routeClassification";
import {
  logPermissionDenied,
  resolveRoleFromRequest,
} from "@/lib/server/auth/requestRole";
import {
  resolveRequestScopeContext,
} from "@/lib/server/auth/requestScope";
import {
  internalSystemIdentityAuditFields,
  resolveInternalSystemIdentity,
  resolveTrustedInternalSystemIdentity,
} from "@/lib/server/auth/systemIdentity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ParamsSchema = z.object({ jobId: z.string().min(3) });
const PatchSchema = z
  .object({
    action: z.enum([
      "queue",
      "approve_provider",
      "run",
      "retry",
      "take_review",
      "cancel",
      "complete",
      "reject",
      "request_seal",
      "archive",
    ]),
    note: z.string().trim().optional().nullable(),
  })
  .strict();

async function resolveParams(p: any): Promise<{ jobId: string }> {
  const val = p && typeof p.then === "function" ? await p : p;
  return ParamsSchema.parse(val);
}

function serializeJob(job: Awaited<ReturnType<ReturnType<typeof getFactcheckWorkflowRepo>["get"]>>) {
  if (!job) return null;
  const statusView = resolveSealedFactcheckStatusView({
    status: job.status,
    verificationMode: job.verificationMode,
    researchUsed: job.researchUsed,
    sealEligible: job.sealEligible,
    sealGranted: job.sealGranted,
    factcheckVerificationMode: job.factcheckVerificationMode,
    factcheckResearchMode: job.factcheckResearchMode,
    factcheckSealEligibility: job.factcheckSealEligibility,
    factcheckSealDecision: job.factcheckSealDecision,
  });

  return {
    jobId: job.jobId,
    status: job.status,
    statusLabel: factcheckStatusLabel(job.status),
    sourceType: job.sourceType ?? "factcheck_request",
    sourceId: job.sourceId ?? null,
    requestedAction: job.requestedAction ?? "factcheck",
    reviewRequestId: job.reviewRequestId ?? null,
    userId: job.userId ?? job.requestedByUserId ?? null,
    tenantId: job.tenantId ?? job.organizationId ?? null,
    verdict: job.verdict,
    confidence: job.confidenceScore,
    language: job.language,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt ?? job.createdAt,
    completedAt: job.completedAt ?? job.finishedAt ?? null,
    finishedAt: job.finishedAt ?? null,
    draftId: job.draftId ?? null,
    contributionId: job.contributionId ?? null,
    dossierId: job.dossierId ?? null,
    handoffId: job.handoffId ?? null,
    organizationId: job.organizationId ?? null,
    regionId: job.regionId ?? null,
    requestedByUserId: job.requestedByUserId ?? null,
    normalizedText: job.normalizedText ?? null,
    gate: job.gate ?? null,
    truthStatus: job.truthStatus ?? null,
    sourceSupport: job.sourceSupport ?? null,
    sourceStatus: job.sourceStatus ?? null,
    verificationMode: statusView.verificationMode,
    researchUsed: statusView.researchUsed,
    sealEligible: statusView.sealEligible,
    sealGranted: statusView.sealGranted,
    sealedAt: job.sealedAt ?? null,
    verificationLabel: job.verificationLabel ?? statusView.verificationLabel,
    workflowStage: statusView.workflowStage,
    workflowLabel: statusView.workflowLabel,
    sealStatus: statusView.sealLabel,
    factcheckStatus: statusView.factcheckStatus,
    factcheckStatusLabel: statusView.factcheckStatusLabel,
    factcheckVerificationMode: statusView.factcheckVerificationMode,
    factcheckResearchMode: statusView.factcheckResearchMode,
    factcheckSealEligibility: statusView.factcheckSealEligibility,
    factcheckSealDecision: statusView.factcheckSealDecision,
    sourceRefs: job.sourceRefs ?? [],
    materialRefs: job.materialRefs ?? [],
    limitations: job.limitations ?? [],
    providerMatrix: job.providerMatrix ?? null,
    result: job.result ?? null,
    publicSealVisible: job.publicSealVisible === true,
    accessContext: job.accessContext ?? null,
    auditEvents: job.auditEvents ?? [],
    noAutoPublish: job.noAutoPublish === true,
    noAutoGraphPromotion: job.noAutoGraphPromotion === true,
    noAutoDossier: job.noAutoDossier === true,
    noAutoAnlassraum: job.noAutoAnlassraum === true,
    noAutoVote: job.noAutoVote === true,
    lane: "sealed_factcheck" as const,
    journeyProfile: "sealed_factcheck" as const,
  };
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ jobId: string }> },
) {
  try {
    const systemIdentity = resolveInternalSystemIdentity(req);
    const trustedSystemIdentity = resolveTrustedInternalSystemIdentity(req);
    const roleContext = resolveRoleFromRequest(req);
    const requestScope = await resolveRequestScopeContext(req).catch(() => null);
    const hasTrustedSystemAccess =
      trustedSystemIdentity?.source === "factcheck_queue" ||
      trustedSystemIdentity?.source === "factcheck_worker";

    const { jobId } = await resolveParams(ctx.params);
    const routeClassification = resolveAiRouteClassification(`/api/factcheck/status/${jobId}`);
    const job = await getFactcheckWorkflowRepo().get(jobId);
    if (!job) {
      const fe = formatError("NOT_FOUND", "Job not found", { jobId });
      logger.warn({ fe }, "FACTCHECK_STATUS_NOT_FOUND");
      return NextResponse.json(fe, { status: 404 });
    }

    if (
      !hasTrustedSystemAccess &&
      !canViewFactcheckRecord({
        requestScope,
        record: job,
      })
    ) {
      logPermissionDenied({
        req,
        scope: "factcheck.status.detail",
        permission: "factcheck:status",
        role: roleContext.role,
        source: roleContext.source,
        details: {
          ...internalSystemIdentityAuditFields(systemIdentity),
          denyReason: systemIdentity
            ? "system_identity_untrusted_or_disallowed"
            : "scope_forbidden",
          jobId,
        },
      });
      const fe = formatError("FORBIDDEN", "Permission denied", { role: roleContext.role });
      return NextResponse.json(fe, { status: 403 });
    }

    const serializedJob = serializeJob(job);
    return NextResponse.json({
      ok: true,
      job: serializedJob,
      claims: job.claims ?? [],
      serpResults: job.serpResults ?? [],
      result: serializedJob?.result ?? null,
      error: job.error ?? null,
      requestedAction: serializedJob?.requestedAction ?? "factcheck",
      truthStatus: serializedJob?.truthStatus ?? null,
      sourceSupport: serializedJob?.sourceSupport ?? null,
      sourceStatus: serializedJob?.sourceStatus ?? null,
      verificationMode: serializedJob?.verificationMode ?? "none",
      researchUsed: serializedJob?.researchUsed ?? "none",
      sealEligible: serializedJob?.sealEligible ?? false,
      sealGranted: serializedJob?.sealGranted ?? false,
      verificationLabel: serializedJob?.verificationLabel ?? "analysiert",
      workflowStage: serializedJob?.workflowStage ?? "started",
      workflowLabel: serializedJob?.workflowLabel ?? "angelegt",
      sealStatus: serializedJob?.sealStatus ?? "kein Siegel",
      factcheckStatus: serializedJob?.factcheckStatus ?? "draft",
      factcheckStatusLabel: serializedJob?.factcheckStatusLabel ?? "Entwurf",
      factcheckVerificationMode: serializedJob?.factcheckVerificationMode ?? "none",
      factcheckResearchMode: serializedJob?.factcheckResearchMode ?? "none",
      factcheckSealEligibility: serializedJob?.factcheckSealEligibility ?? "unknown",
      factcheckSealDecision: serializedJob?.factcheckSealDecision ?? "none",
      accessContext: serializedJob?.accessContext ?? null,
      gate: serializedJob?.gate ?? null,
      meta: {
        lane: "sealed_factcheck",
        journeyProfile: "sealed_factcheck",
        routeClassification,
      },
    });
  } catch (error: any) {
    if (error instanceof ZodError) {
      const fe = formatError("BAD_REQUEST", "Invalid input", { issues: error.issues });
      return NextResponse.json(fe, { status: 400 });
    }
    const fe = formatError("INTERNAL_ERROR", "Unexpected failure", error?.message ?? String(error));
    logger.error({ fe, error }, "FACTCHECK_STATUS_FAIL");
    return NextResponse.json(fe, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ jobId: string }> },
) {
  try {
    const trustedSystemIdentity = resolveTrustedInternalSystemIdentity(req);
    const requestScope = await resolveRequestScopeContext(req).catch(() => null);
    const hasTrustedSystemAccess =
      trustedSystemIdentity?.source === "factcheck_queue" ||
      trustedSystemIdentity?.source === "factcheck_worker";

    if (!hasTrustedSystemAccess && !canAdministerFactcheckRecord({ requestScope })) {
      return NextResponse.json(
        { ok: false, code: "FORBIDDEN", message: "Permission denied" },
        { status: 403 },
      );
    }

    const { jobId } = await resolveParams(ctx.params);
    const payload = PatchSchema.parse(await req.json());
    const repo = getFactcheckWorkflowRepo();
    const job = await repo.get(jobId);
    if (!job) {
      return NextResponse.json(
        { ok: false, code: "NOT_FOUND", message: "Job not found", jobId },
        { status: 404 },
      );
    }

    const now = new Date();
    const actorId = hasTrustedSystemAccess
      ? `system:${trustedSystemIdentity?.source ?? "factcheck_worker"}`
      : requestScope?.actorId ?? "operator";
    const actorLabel = hasTrustedSystemAccess
      ? `System · ${trustedSystemIdentity?.source ?? "factcheck_worker"}`
      : requestScope?.email ?? requestScope?.actorId ?? "Betreiber";
    const actorMode = hasTrustedSystemAccess ? "system" : "operator";

    let nextJob = { ...job };
    switch (payload.action) {
      case "queue":
        nextJob = refreshFactcheckJobState({
          ...nextJob,
          status: "queued",
          updatedAt: now,
          completedAt: null,
          finishedAt: null,
          error: null,
        });
        break;
      case "approve_provider":
        nextJob = refreshFactcheckJobState({
          ...nextJob,
          status: "queued",
          factcheckResearchMode:
            nextJob.factcheckResearchMode === "deep_research_requested"
              ? "deep_research_approved"
              : "provider_assisted",
          updatedAt: now,
          completedAt: null,
          finishedAt: null,
          error: null,
        });
        break;
      case "run":
        nextJob = await runFactcheckJob(jobId);
        break;
      case "retry":
        nextJob = refreshFactcheckJobState({
          ...nextJob,
          status: "queued",
          updatedAt: now,
          completedAt: null,
          finishedAt: null,
          error: null,
        });
        break;
      case "take_review":
        nextJob = refreshFactcheckJobState({
          ...nextJob,
          status: "needs_manual_review",
          updatedAt: now,
          completedAt: now,
          finishedAt: now,
        });
        break;
      case "cancel":
        nextJob = refreshFactcheckJobState({
          ...nextJob,
          status: "cancelled",
          updatedAt: now,
          completedAt: now,
          finishedAt: now,
        });
        break;
      case "complete":
        nextJob = refreshFactcheckJobState({
          ...nextJob,
          status:
            nextJob.factcheckSealDecision === "requested"
              ? "seal_review_required"
              : "completed",
          updatedAt: now,
          completedAt: now,
          finishedAt: now,
        });
        break;
      case "reject":
        nextJob = refreshFactcheckJobState({
          ...nextJob,
          status: "rejected",
          updatedAt: now,
          completedAt: now,
          finishedAt: now,
        });
        break;
      case "request_seal":
        nextJob = refreshFactcheckJobState({
          ...nextJob,
          status: "seal_review_required",
          factcheckSealDecision: "requested",
          updatedAt: now,
        });
        break;
      case "archive":
        nextJob = refreshFactcheckJobState({
          ...nextJob,
          status: "archived",
          publicSealVisible: false,
          updatedAt: now,
          completedAt: nextJob.completedAt ?? now,
          finishedAt: now,
        });
        break;
    }

    nextJob.auditEvents = [
      ...(nextJob.auditEvents ?? []),
      createFactcheckAuditEvent({
        eventType:
          payload.action === "queue"
            ? "queue"
            : payload.action === "approve_provider"
              ? "approve-provider"
              : payload.action === "run"
                ? "complete"
                : payload.action === "retry"
                  ? "queue"
                  : payload.action === "take_review"
                    ? "complete"
                    : payload.action === "cancel"
                      ? "archive"
              : payload.action === "complete"
                ? "complete"
                : payload.action === "reject"
                  ? "reject"
                  : payload.action === "request_seal"
                    ? "request-seal"
                    : "archive",
        actorId,
        actorLabel,
        actorMode,
        note: payload.note ?? null,
      }),
    ];

    await repo.save(nextJob);
    const serializedJob = serializeJob(nextJob);
    return NextResponse.json({ ok: true, job: serializedJob });
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, code: "BAD_REQUEST", issues: error.issues },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { ok: false, code: "INTERNAL_ERROR", message: error?.message ?? String(error) },
      { status: 500 },
    );
  }
}
