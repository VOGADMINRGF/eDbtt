import { NextResponse } from "next/server";
import { prisma } from "@db/web";

export async function GET(
  _: Request,
  { params }: { params: { contributionId: string } },
) {
  const { contributionId } = params;

  const job = await prisma.factcheckJob.findFirst({
    where: { contributionId },
    orderBy: { createdAt: "desc" },
  });

  if (!job) {
    return NextResponse.json(
      { ok: false, reason: "No job found for contributionId", results: [] },
      { status: 404 },
    );
  }

  const results = await prisma.factcheckResult.findMany({
    where: { jobId: job.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    ok: true,
    job: {
      id: job.id,
      status: job.status,
      tokensUsed: job.tokensUsed,
      durationMs: job.durationMs,
    },
    results,
  });
}
