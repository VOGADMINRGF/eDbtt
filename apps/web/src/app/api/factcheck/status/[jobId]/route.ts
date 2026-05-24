import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { formatError } from "@core/errors/formatError";
import { logger } from "@core/observability/logger";
import { getFactcheckWorkflowRepo } from "@features/factcheck/db";
import {
  createFactcheckAuditEvent,
  deriveFactcheckSealEligibility,
  deriveFactcheckVerificationMode,
  factcheckResearchModeToCompatibilityResearchUsed,
  factcheckStatusLabel,
  factcheckVerificationModeToCompatibilityMode,
} from "@features/factcheck/workflow";
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
    verdict: job.verdict,
    confidence: job.confidenceScore,
    language: job.language,
    createdAt: job.createdAt,
    finishedAt: job.finishedAt ?? null,
    draftId: job.draftId ?? null,
    contributionId: job.contributionId ?? null,
    dossierId: job.dossierId ?? null,
    handoffId: job.handoffId ?? null,
    organizationId: job.organizationId ?? null,
    regionId: job.regionId ?? null,
    requestedByUserId: job.requestedByUserId ?? null,
    verificationMode: statusView.verificationMode,
    researchUsed: statusView.researchUsed,
    sealEligible: statusView.sealEligible,
    sealGranted: statusView.sealGranted,
    sealedAt: job.sealedAt ?? null,
    verificationLabel: statusView.verificationLabel,
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
    publicSealVisible: job.publicSealVisible === true,
    accessContext: job.accessContext ?? null,
    auditEvents: job.auditEvents ?? [],
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
      error: job.error ?? null,
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
    const job = await getFactcheckWorkflowRepo().get(jobId);
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

    switch (payload.action) {
      case "queue":
        job.status = "queued";
        break;
      case "approve_provider":
        job.status = "queued";
        job.factcheckResearchMode =
          job.factcheckResearchMode === "deep_research_requested"
            ? "deep_research_approved"
            : "provider_assisted";
        break;
      case "complete":
        job.status = job.factcheckSealDecision === "requested" ? "seal_review_required" : "completed";
        break;
      case "reject":
        job.status = "rejected";
        break;
      case "request_seal":
        job.status = "seal_review_required";
        job.factcheckSealDecision = "requested";
        break;
      case "archive":
        job.status = "archived";
        job.publicSealVisible = false;
        break;
    }

    job.factcheckSealEligibility = deriveFactcheckSealEligibility({
      status: job.status,
      hasSourceRefs: (job.sourceRefs ?? []).length > 0,
      hasClaims: (job.claims ?? []).length > 0,
    });
    job.factcheckVerificationMode = deriveFactcheckVerificationMode({
      status: job.status,
      researchMode: job.factcheckResearchMode,
      hasSourceRefs: (job.sourceRefs ?? []).length > 0,
      sealDecision: job.factcheckSealDecision,
    });
    job.verificationMode = factcheckVerificationModeToCompatibilityMode(
      job.factcheckVerificationMode,
    );
    job.researchUsed = factcheckResearchModeToCompatibilityResearchUsed(
      job.factcheckResearchMode,
    );
    job.sealEligible =
      job.factcheckSealEligibility === "eligible" ||
      job.factcheckSealEligibility === "needs_review";
    job.sealGranted = job.factcheckSealDecision === "granted";
    job.updatedAt = now;
    job.finishedAt = (
      ["completed", "rejected", "not_seal_eligible", "sealed", "archived"] as readonly string[]
    ).includes(job.status)
      ? now
      : null;
    job.auditEvents = [
      ...(job.auditEvents ?? []),
      createFactcheckAuditEvent({
        eventType:
          payload.action === "queue"
            ? "queue"
            : payload.action === "approve_provider"
              ? "approve-provider"
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

    await getFactcheckWorkflowRepo().save(job);
    const serializedJob = serializeJob(job);
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
