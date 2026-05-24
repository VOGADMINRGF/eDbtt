import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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
} from "@features/factcheck/access";
import { resolveSealedFactcheckStatusView } from "@features/ai/e150/factcheckStatus";
import { resolveAiRouteClassification } from "@features/ai/e150/routeClassification";
import {
  resolveRequestScopeContext,
} from "@/lib/server/auth/requestScope";
import {
  resolveTrustedInternalSystemIdentity,
} from "@/lib/server/auth/systemIdentity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ParamsSchema = z.object({ jobId: z.string().min(3) });
const BodySchema = z
  .object({
    action: z.enum(["grant", "revoke", "archive"]).optional().default("grant"),
    note: z.string().trim().optional().nullable(),
  })
  .strict();

async function resolveParams(p: any): Promise<{ jobId: string }> {
  const val = p && typeof p.then === "function" ? await p : p;
  return ParamsSchema.parse(val);
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ jobId: string }> },
) {
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
  const payload = BodySchema.parse(await req.json().catch(() => ({})));
  const routeClassification = resolveAiRouteClassification(`/api/factcheck/status/${jobId}/seal`);
  const repo = getFactcheckWorkflowRepo();
  const job = await repo.get(jobId);

  if (!job) {
    return NextResponse.json(
      { ok: false, code: "NOT_FOUND", message: "Job not found", jobId },
      { status: 404 },
    );
  }

  const actorId = hasTrustedSystemAccess
    ? `system:${trustedSystemIdentity?.source ?? "factcheck_worker"}`
    : requestScope?.actorId ?? "operator";
  const actorLabel = hasTrustedSystemAccess
    ? `System · ${trustedSystemIdentity?.source ?? "factcheck_worker"}`
    : requestScope?.email ?? requestScope?.actorId ?? "Betreiber";
  const actorMode = hasTrustedSystemAccess ? "system" : "operator";
  const now = new Date();

  if (payload.action === "grant") {
    if (job.factcheckSealEligibility === "not_eligible") {
      return NextResponse.json(
        {
          ok: false,
          code: "SEAL_NOT_READY",
          message: "Seal cannot be granted for not seal-eligible checks.",
          status: job.status,
        },
        { status: 409 },
      );
    }
    job.status = "sealed";
    job.factcheckSealDecision = "granted";
    job.publicSealVisible = true;
    job.sealedAt = now;
  } else if (payload.action === "revoke") {
    job.status = "completed";
    job.factcheckSealDecision = "revoked";
    job.publicSealVisible = false;
    job.sealedAt = null;
  } else {
    job.status = "archived";
    job.publicSealVisible = false;
    job.sealedAt = null;
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
  job.finishedAt = now;
  job.auditEvents = [
    ...(job.auditEvents ?? []),
    createFactcheckAuditEvent({
      eventType:
        payload.action === "grant"
          ? "grant-seal"
          : payload.action === "revoke"
            ? "revoke-seal"
            : "archive",
      actorId,
      actorLabel,
      actorMode,
      note: payload.note ?? null,
    }),
  ];

  await repo.save(job);

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

  return NextResponse.json({
    ok: true,
    jobId,
    status: job.status,
    statusLabel: factcheckStatusLabel(job.status),
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
    sealedAt: job.sealedAt?.toISOString?.() ?? null,
    publicSealVisible: job.publicSealVisible === true,
    meta: {
      lane: "sealed_factcheck",
      journeyProfile: "sealed_factcheck",
      routeClassification,
    },
  });
}
