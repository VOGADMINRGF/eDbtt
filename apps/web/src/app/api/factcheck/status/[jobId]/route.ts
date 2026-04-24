import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { formatError } from "@core/errors/formatError";
import { logger } from "@core/observability/logger";
import { hasPermission, PERMISSIONS } from "@core/auth/rbac";
import { factcheckJobsCol } from "@features/factcheck/db";
import { resolveSealedFactcheckStatusView } from "@features/ai/e150/factcheckStatus";
import { resolveAiRouteClassification } from "@features/ai/e150/routeClassification";
import { logPermissionDenied, resolveRoleFromRequest } from "@/lib/server/auth/requestRole";
import {
  internalSystemIdentityAuditFields,
  resolveInternalSystemIdentity,
  resolveTrustedInternalSystemIdentity,
} from "@/lib/server/auth/systemIdentity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ParamsSchema = z.object({ jobId: z.string().min(3) });

// Hilfsfunktion: Kompatibel mit Next 13/14 (Objekt) und Next 15 (Promise)
async function resolveParams(p: any): Promise<{ jobId: string }> {
  const val = p && typeof p.then === "function" ? await p : p;
  return ParamsSchema.parse(val);
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ jobId: string }> },
) {
  const t0 = Date.now();
  try {
    const systemIdentity = resolveInternalSystemIdentity(req);
    const trustedSystemIdentity = resolveTrustedInternalSystemIdentity(req);
    const roleContext = resolveRoleFromRequest(req);
    const hasSessionAccess =
      roleContext.source === "cookie" && hasPermission(roleContext.role, PERMISSIONS.FACTCHECK_STATUS);
    const hasTrustedSystemAccess =
      trustedSystemIdentity?.source === "factcheck_queue" ||
      trustedSystemIdentity?.source === "factcheck_worker";
    if (!hasSessionAccess && !hasTrustedSystemAccess) {
      logPermissionDenied({
        req,
        scope: "factcheck.status.detail",
        permission: PERMISSIONS.FACTCHECK_STATUS,
        role: roleContext.role,
        source: roleContext.source,
        details: {
          ...internalSystemIdentityAuditFields(systemIdentity),
          denyReason: systemIdentity
            ? "system_identity_untrusted_or_disallowed"
            : roleContext.source === "header"
              ? "header_role_not_allowed"
              : "missing_permission",
        },
      });
      const fe = formatError("FORBIDDEN", "Permission denied", { role: roleContext.role });
      logger.warn({ fe }, "FACTCHECK_STATUS_FORBIDDEN");
      return NextResponse.json(fe, { status: 403 });
    }

    const { jobId } = await resolveParams(ctx.params);
    const routeClassification = resolveAiRouteClassification(`/api/factcheck/status/${jobId}`);

    const col = await factcheckJobsCol();
    const job = await col.findOne(
      { jobId },
      {
        projection: {
          jobId: 1,
          status: 1,
          verdict: 1,
          confidence: 1,
          language: 1,
          createdAt: 1,
          finishedAt: 1,
          draftId: 1,
          contributionId: 1,
          claims: 1,
          serpResults: 1,
          verificationMode: 1,
          researchUsed: 1,
          sealEligible: 1,
          sealGranted: 1,
          sealedAt: 1,
          fallbackUsed: 1,
          disagreement: 1,
          orchestrationConfidence: 1,
          error: 1,
        },
      },
    );
    if (!job) {
      const fe = formatError("NOT_FOUND", "Job not found", { jobId });
      logger.warn({ fe }, "FACTCHECK_STATUS_NOT_FOUND");
      return NextResponse.json(fe, { status: 404 });
    }

    const sealedStatus = resolveSealedFactcheckStatusView({
      status: job.status,
      verificationMode: (job as any)?.verificationMode,
      researchUsed: (job as any)?.researchUsed,
      sealEligible: (job as any)?.sealEligible,
      sealGranted: (job as any)?.sealGranted,
    });

    const durationMs = Date.now() - t0;
    return NextResponse.json({
      ok: true,
      job: {
        jobId: job.jobId,
        status: job.status,
        verdict: job.verdict,
        confidence: job.confidence,
        language: job.language,
        createdAt: job.createdAt,
        finishedAt: job.finishedAt ?? null,
        durationMs,
        draftId: job.draftId ?? null,
        contributionId: job.contributionId ?? null,
        verificationMode: sealedStatus.verificationMode,
        researchUsed: sealedStatus.researchUsed,
        sealEligible: sealedStatus.sealEligible,
        sealGranted: sealedStatus.sealGranted,
        sealedAt: (job as any)?.sealedAt ?? null,
        verificationLabel: sealedStatus.verificationLabel,
        workflowStage: sealedStatus.workflowStage,
        workflowLabel: sealedStatus.workflowLabel,
        sealStatus: sealedStatus.sealLabel,
        fallbackUsed: (job as any)?.fallbackUsed ?? false,
        disagreement: (job as any)?.disagreement ?? null,
        orchestrationConfidence: (job as any)?.orchestrationConfidence ?? null,
        lane: "sealed_factcheck",
        journeyProfile: "sealed_factcheck",
      },
      claims: job.claims ?? [],
      serpResults: job.serpResults ?? [],
      error: job.error ?? null,
      verificationMode: sealedStatus.verificationMode,
      researchUsed: sealedStatus.researchUsed,
      sealEligible: sealedStatus.sealEligible,
      sealGranted: sealedStatus.sealGranted,
      sealedAt: (job as any)?.sealedAt ?? null,
      verificationLabel: sealedStatus.verificationLabel,
      workflowStage: sealedStatus.workflowStage,
      workflowLabel: sealedStatus.workflowLabel,
      sealStatus: sealedStatus.sealLabel,
      confidence: job.confidence ?? null,
      fallbackUsed: (job as any)?.fallbackUsed ?? false,
      disagreement: (job as any)?.disagreement ?? null,
      orchestrationConfidence: (job as any)?.orchestrationConfidence ?? null,
      meta: {
        lane: "sealed_factcheck",
        journeyProfile: "sealed_factcheck",
        routeClassification,
      },
    });
  } catch (e: any) {
    if (e instanceof ZodError) {
      const fe = formatError("BAD_REQUEST", "Invalid input", { issues: e.issues });
      return NextResponse.json(fe, { status: 400 });
    }
    const fe = formatError("INTERNAL_ERROR", "Unexpected failure", e?.message ?? String(e));
    logger.error({ fe, e }, "FACTCHECK_STATUS_FAIL");
    return NextResponse.json(fe, { status: 500 });
  }
}
