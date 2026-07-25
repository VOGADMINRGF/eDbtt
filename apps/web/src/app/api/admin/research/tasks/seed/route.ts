import { NextResponse, type NextRequest } from "next/server";
import { ObjectId } from "@core/db/triMongo";
import { seedTasksFromAnalysis } from "@core/research";
import { AnalyzeResultSchema } from "@features/analyze/schemas";
import { logger } from "@/utils/logger";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import { z } from "zod";
import { readCreateContributionDraftById } from "@/server/serverDrafts";


const SeedSchema = z.object({
  draftId: z.string().optional(),
  analysis: z.unknown().optional(),
  contributionId: z.string().optional(),
  statementId: z.string().optional(),
  level: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  let body: z.infer<typeof SeedSchema>;
  try {
    body = SeedSchema.parse(await req.json());
  } catch (err: any) {
    const message = err?.issues?.[0]?.message ?? "invalid_body";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  try {
    let analysis: unknown = body.analysis ?? null;
    let draftId: string | null = body.draftId ?? null;

    if (!analysis && draftId) {
      if (!ObjectId.isValid(draftId)) {
        return NextResponse.json({ ok: false, error: "invalid_draft" }, { status: 400 });
      }
      const draft = await readCreateContributionDraftById(draftId);
      if (!draft?.analysis) {
        return NextResponse.json({ ok: false, error: "draft_analysis_missing" }, { status: 404 });
      }
      analysis = draft.analysis;
    }

    const parsed = AnalyzeResultSchema.safeParse(analysis);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "invalid_analysis" }, { status: 400 });
    }

    const result = await seedTasksFromAnalysis({
      analysis: parsed.data,
      source: {
        contributionId: body.contributionId ?? undefined,
        statementId: body.statementId ?? undefined,
        analyzeJobId: draftId ?? undefined,
      },
      createdBy: gate?._id ? String(gate._id) : null,
      level: body.level as any,
      tags: body.tags ?? [],
    });

    logger.info({
      msg: "admin.research.tasks.seeded",
      created: result.created.length,
      skipped: result.skipped,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    logger.error({ msg: "admin.research.tasks.seed_failed", err: err?.message });
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
