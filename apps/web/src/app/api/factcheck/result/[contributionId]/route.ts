import { NextResponse } from "next/server";
import { z } from "zod";
import { factcheckJobsCol } from "@features/factcheck/db";
import { resolveSealedFactcheckStatusView } from "@features/ai/e150/factcheckStatus";
import { resolveAiRouteClassification } from "@features/ai/e150/routeClassification";

const ParamsSchema = z.object({ contributionId: z.string().min(1) });

async function resolveParams(p: any): Promise<{ contributionId: string }> {
  const val = p && typeof p.then === "function" ? await p : p;
  return ParamsSchema.parse(val);
}

export async function GET(
  _: Request,
  context: { params: Promise<{ contributionId: string }> },
) {
  const { contributionId } = await resolveParams(context.params);
  const routeClassification = resolveAiRouteClassification(
    `/api/factcheck/result/${contributionId}`,
  );

  const col = await factcheckJobsCol();
  const job = await col
    .find({ contributionId })
    .sort({ createdAt: -1 })
    .limit(1)
    .toArray()
    .then((xs: any[]) => xs?.[0] ?? null);

  if (!job) {
    return NextResponse.json(
      { ok: false, reason: "No job found for contributionId", results: [] },
      { status: 404 },
    );
  }

  const sealedStatus = resolveSealedFactcheckStatusView({
    status: job.status ?? null,
    verificationMode: (job as any)?.verificationMode,
    researchUsed: (job as any)?.researchUsed,
    sealEligible: (job as any)?.sealEligible,
    sealGranted: (job as any)?.sealGranted,
  });

  return NextResponse.json({
    ok: true,
    job: {
      jobId: job.jobId ?? null,
      status: job.status ?? null,
      verdict: job.verdict ?? null,
      confidence: job.confidence ?? null,
      durationMs: job.durationMs ?? null,
      createdAt: job.createdAt ?? null,
      finishedAt: job.finishedAt ?? null,
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
    results: job.claims ?? [],
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
}
