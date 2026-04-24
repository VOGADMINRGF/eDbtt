import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { hasPermission, PERMISSIONS } from "@core/auth/rbac";
import { factcheckJobsCol } from "@features/factcheck/db";
import { buildSealedFactcheckContract } from "@features/ai/e150/factcheckProfiles";
import { deriveVerificationLabel } from "@features/ai/e150/verificationContract";
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

async function resolveParams(p: any): Promise<{ jobId: string }> {
  const val = p && typeof p.then === "function" ? await p : p;
  return ParamsSchema.parse(val);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ jobId: string }> },
) {
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
      scope: "factcheck.status.seal",
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
    return NextResponse.json(
      { ok: false, code: "FORBIDDEN", message: "Permission denied" },
      { status: 403 },
    );
  }

  const { jobId } = await resolveParams(ctx.params);
  const routeClassification = resolveAiRouteClassification(`/api/factcheck/status/${jobId}/seal`);
  const col = await factcheckJobsCol();
  const job = await col.findOne(
    { jobId },
    {
      projection: {
        jobId: 1,
        status: 1,
        claims: 1,
        error: 1,
        researchUsed: 1,
      },
    },
  );

  if (!job) {
    return NextResponse.json(
      { ok: false, code: "NOT_FOUND", message: "Job not found", jobId },
      { status: 404 },
    );
  }

  if (job.status !== "completed") {
    return NextResponse.json(
      {
        ok: false,
        code: "SEAL_NOT_READY",
        message: "Seal can only be granted for completed jobs.",
        status: job.status,
      },
      { status: 409 },
    );
  }

  if (job.error) {
    return NextResponse.json(
      {
        ok: false,
        code: "SEAL_NOT_READY",
        message: "Seal cannot be granted while job has errors.",
      },
      { status: 409 },
    );
  }

  const claimCount = Array.isArray((job as any)?.claims) ? (job as any).claims.length : 0;
  if (claimCount === 0) {
    return NextResponse.json(
      {
        ok: false,
        code: "SEAL_NOT_READY",
        message: "Seal cannot be granted without evaluated claims.",
      },
      { status: 409 },
    );
  }

  const verification = buildSealedFactcheckContract({
    researchUsed: (job as any)?.researchUsed === "deep_search" ? "deep_search" : "search",
    sealGranted: true,
  });
  const now = new Date();
  await col.updateOne(
    { jobId },
    {
      $set: {
        verificationMode: verification.verificationMode,
        researchUsed: verification.researchUsed,
        sealEligible: verification.sealEligible,
        sealGranted: verification.sealGranted,
        sealedAt: now,
        updatedAt: now,
      },
    },
  );

  const statusView = resolveSealedFactcheckStatusView({
    status: "completed",
    verification,
  });
  const verificationLabel = deriveVerificationLabel({
    verificationMode: statusView.verificationMode,
    sealGranted: statusView.sealGranted,
  });

  return NextResponse.json({
    ok: true,
    jobId,
    verificationMode: statusView.verificationMode,
    researchUsed: statusView.researchUsed,
    sealEligible: statusView.sealEligible,
    sealGranted: statusView.sealGranted,
    verificationLabel,
    workflowStage: statusView.workflowStage,
    workflowLabel: statusView.workflowLabel,
    sealStatus: statusView.sealLabel,
    sealedAt: now.toISOString(),
    meta: {
      lane: "sealed_factcheck",
      journeyProfile: "sealed_factcheck",
      routeClassification,
    },
  });
}
