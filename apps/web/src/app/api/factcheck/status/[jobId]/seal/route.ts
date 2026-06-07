import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getFactcheckWorkflowRepo } from "@features/factcheck/db";
import {
  createFactcheckAuditEvent,
  factcheckStatusLabel,
} from "@features/factcheck/workflow";
import { refreshFactcheckJobState } from "@features/factcheck/jobRunner";
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
    if (job.status !== "completed" && job.status !== "seal_review_required") {
      return NextResponse.json(
        {
          ok: false,
          code: "SEAL_NOT_READY",
          message: "Seal can only be granted after a completed sealed factcheck.",
          status: job.status,
        },
        { status: 409 },
      );
    }
    if (job.requestedAction !== "sealed_factcheck") {
      return NextResponse.json(
        {
          ok: false,
          code: "SEAL_NOT_READY",
          message: "Ein verifizierbares Siegel setzt einen sealed_factcheck voraus.",
          status: job.status,
        },
        { status: 409 },
      );
    }
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

  const nextJob = refreshFactcheckJobState({
    ...job,
    updatedAt: now,
    completedAt: now,
    finishedAt: now,
  });
  nextJob.auditEvents = [
    ...(nextJob.auditEvents ?? []),
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

  await repo.save(nextJob);

  const statusView = resolveSealedFactcheckStatusView({
    status: nextJob.status,
    verificationMode: nextJob.verificationMode,
    researchUsed: nextJob.researchUsed,
    sealEligible: nextJob.sealEligible,
    sealGranted: nextJob.sealGranted,
    factcheckVerificationMode: nextJob.factcheckVerificationMode,
    factcheckResearchMode: nextJob.factcheckResearchMode,
    factcheckSealEligibility: nextJob.factcheckSealEligibility,
    factcheckSealDecision: nextJob.factcheckSealDecision,
  });

  return NextResponse.json({
    ok: true,
    jobId,
    status: nextJob.status,
    statusLabel: factcheckStatusLabel(nextJob.status),
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
    sealedAt: nextJob.sealedAt?.toISOString?.() ?? null,
    publicSealVisible: nextJob.publicSealVisible === true,
    meta: {
      lane: "sealed_factcheck",
      journeyProfile: "sealed_factcheck",
      routeClassification,
    },
  });
}
