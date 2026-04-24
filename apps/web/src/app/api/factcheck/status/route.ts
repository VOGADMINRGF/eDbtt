import { NextRequest, NextResponse } from "next/server";
import { hasPermission, PERMISSIONS } from "@core/auth/rbac";
import { formatError } from "@core/errors/formatError";
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

export async function GET(req: NextRequest) {
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
      scope: "factcheck.status.list",
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
    return NextResponse.json(fe, { status: 403 });
  }

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") || 20), 100);
  const routeClassification = resolveAiRouteClassification("/api/factcheck/status");

  const col = await factcheckJobsCol();
  const jobs = await col
    .aggregate([
      { $sort: { createdAt: -1 } },
      { $limit: limit },
      {
        $project: {
          jobId: 1,
          status: 1,
          verdict: 1,
          confidence: 1,
          createdAt: 1,
          finishedAt: { $ifNull: ["$finishedAt", null] },
          draftId: { $ifNull: ["$draftId", null] },
          contributionId: { $ifNull: ["$contributionId", null] },
          claimsCount: { $size: { $ifNull: ["$claims", []] } },
          serpCount: { $size: { $ifNull: ["$serpResults", []] } },
          verificationMode: { $ifNull: ["$verificationMode", null] },
          researchUsed: { $ifNull: ["$researchUsed", null] },
          sealEligible: { $ifNull: ["$sealEligible", null] },
          sealGranted: { $ifNull: ["$sealGranted", null] },
          sealedAt: { $ifNull: ["$sealedAt", null] },
          fallbackUsed: { $ifNull: ["$fallbackUsed", false] },
          disagreement: { $ifNull: ["$disagreement", null] },
          orchestrationConfidence: { $ifNull: ["$orchestrationConfidence", null] },
        },
      },
    ])
    .toArray();

  const normalizedJobs = jobs.map((job: any) => {
    const sealedStatus = resolveSealedFactcheckStatusView({
      status: job.status,
      verificationMode: job.verificationMode,
      researchUsed: job.researchUsed,
      sealEligible: job.sealEligible,
      sealGranted: job.sealGranted,
    });
    return {
      ...job,
      verificationMode: sealedStatus.verificationMode,
      researchUsed: sealedStatus.researchUsed,
      sealEligible: sealedStatus.sealEligible,
      sealGranted: sealedStatus.sealGranted,
      sealedAt: job.sealedAt ?? null,
      verificationLabel: sealedStatus.verificationLabel,
      workflowStage: sealedStatus.workflowStage,
      workflowLabel: sealedStatus.workflowLabel,
      sealStatus: sealedStatus.sealLabel,
      fallbackUsed: job.fallbackUsed ?? false,
      disagreement: job.disagreement ?? null,
      orchestrationConfidence: job.orchestrationConfidence ?? null,
      lane: "sealed_factcheck",
      journeyProfile: "sealed_factcheck",
    };
  });

  return NextResponse.json({
    ok: true,
    jobs: normalizedJobs,
    meta: {
      lane: "sealed_factcheck",
      journeyProfile: "sealed_factcheck",
      routeClassification,
    },
  });
}
