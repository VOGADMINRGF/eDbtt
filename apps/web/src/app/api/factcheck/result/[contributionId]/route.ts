import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getFactcheckWorkflowRepo } from "@features/factcheck/db";
import { canViewFactcheckRecord } from "@features/factcheck/access";
import { factcheckStatusLabel } from "@features/factcheck/workflow";
import { resolveSealedFactcheckStatusView } from "@features/ai/e150/factcheckStatus";
import { resolveAiRouteClassification } from "@features/ai/e150/routeClassification";
import { resolveRequestScopeContext } from "@/lib/server/auth/requestScope";

const ParamsSchema = z.object({ contributionId: z.string().min(1) });

async function resolveParams(p: any): Promise<{ contributionId: string }> {
  const val = p && typeof p.then === "function" ? await p : p;
  return ParamsSchema.parse(val);
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ contributionId: string }> },
) {
  const { contributionId } = await resolveParams(context.params);
  const requestScope = await resolveRequestScopeContext(req).catch(() => null);
  const routeClassification = resolveAiRouteClassification(
    `/api/factcheck/result/${contributionId}`,
  );

  const job = (await getFactcheckWorkflowRepo().listByContributionId(contributionId))[0] ?? null;
  if (!job) {
    return NextResponse.json(
      { ok: false, reason: "No job found for contributionId", results: [] },
      { status: 404 },
    );
  }

  if (
    !canViewFactcheckRecord({
      requestScope,
      record: job,
    })
  ) {
    return NextResponse.json(
      { ok: false, code: "FORBIDDEN", message: "Permission denied" },
      { status: 403 },
    );
  }

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
    job: {
      jobId: job.jobId ?? null,
      status: job.status ?? null,
      statusLabel: factcheckStatusLabel(job.status),
      verdict: job.verdict ?? null,
      confidence: job.confidenceScore ?? null,
      createdAt: job.createdAt ?? null,
      finishedAt: job.finishedAt ?? null,
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
      publicSealVisible: job.publicSealVisible === true,
      lane: "sealed_factcheck",
      journeyProfile: "sealed_factcheck",
    },
    results: job.claims ?? [],
    sourceRefs: job.sourceRefs ?? [],
    materialRefs: job.materialRefs ?? [],
    limitations: job.limitations ?? [],
    error: job.error ?? null,
    verificationMode: statusView.verificationMode,
    researchUsed: statusView.researchUsed,
    sealEligible: statusView.sealEligible,
    sealGranted: statusView.sealGranted,
    sealedAt: job.sealedAt ?? null,
    verificationLabel: statusView.verificationLabel,
    workflowStage: statusView.workflowStage,
    workflowLabel: statusView.workflowLabel,
    sealStatus: statusView.sealLabel,
    confidence: job.confidenceScore ?? null,
    meta: {
      lane: "sealed_factcheck",
      journeyProfile: "sealed_factcheck",
      routeClassification,
    },
  });
}
