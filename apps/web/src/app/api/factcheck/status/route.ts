import { NextRequest, NextResponse } from "next/server";
import { formatError } from "@core/errors/formatError";
import { getFactcheckWorkflowRepo } from "@features/factcheck/db";
import { factcheckStatusLabel } from "@features/factcheck/workflow";
import { resolveSealedFactcheckStatusView } from "@features/ai/e150/factcheckStatus";
import { resolveAiRouteClassification } from "@features/ai/e150/routeClassification";
import {
  logPermissionDenied,
  resolveRoleFromRequest,
} from "@/lib/server/auth/requestRole";
import { resolveRequestScopeContext } from "@/lib/server/auth/requestScope";
import {
  resolveInternalSystemIdentity,
  resolveTrustedInternalSystemIdentity,
  internalSystemIdentityAuditFields,
} from "@/lib/server/auth/systemIdentity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const systemIdentity = resolveInternalSystemIdentity(req);
  const trustedSystemIdentity = resolveTrustedInternalSystemIdentity(req);
  const roleContext = resolveRoleFromRequest(req);
  const requestScope = await resolveRequestScopeContext(req).catch(() => null);
  const hasTrustedSystemAccess =
    trustedSystemIdentity?.source === "factcheck_queue" ||
    trustedSystemIdentity?.source === "factcheck_worker";

  if (!hasTrustedSystemAccess && !requestScope?.isOperatorMode) {
    logPermissionDenied({
      req,
      scope: "factcheck.status.list",
      permission: "factcheck:status",
      role: roleContext.role,
      source: roleContext.source,
      details: {
        ...internalSystemIdentityAuditFields(systemIdentity),
        denyReason: systemIdentity
          ? "system_identity_untrusted_or_disallowed"
          : "operator_scope_required",
      },
    });
    const fe = formatError("FORBIDDEN", "Permission denied", { role: roleContext.role });
    return NextResponse.json(fe, { status: 403 });
  }

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") || 20), 100);
  const routeClassification = resolveAiRouteClassification("/api/factcheck/status");
  const jobs = (await getFactcheckWorkflowRepo().list()).slice(0, limit);

  return NextResponse.json({
    ok: true,
    jobs: jobs.map((job) => {
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
        createdAt: job.createdAt,
        finishedAt: job.finishedAt ?? null,
        draftId: job.draftId ?? null,
        contributionId: job.contributionId ?? null,
        organizationId: job.organizationId ?? null,
        regionId: job.regionId ?? null,
        claimsCount: Array.isArray(job.claims) ? job.claims.length : 0,
        sourceRefCount: Array.isArray(job.sourceRefs) ? job.sourceRefs.length : 0,
        verificationMode: statusView.verificationMode,
        researchUsed: statusView.researchUsed,
        sealEligible: statusView.sealEligible,
        sealGranted: statusView.sealGranted,
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
        publicSealVisible: job.publicSealVisible === true,
      };
    }),
    meta: {
      lane: "sealed_factcheck",
      journeyProfile: "sealed_factcheck",
      routeClassification,
    },
  });
}
