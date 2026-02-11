import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import { analyzeContribution } from "@features/analyze/analyzeContribution";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  text: z.string().min(20),
  locale: z.string().optional().nullable(),
  maxClaims: z.number().int().min(1).max(10).optional(),
});

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const body = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await analyzeContribution({
    text: parsed.data.text,
    locale: parsed.data.locale ?? undefined,
    maxClaims: parsed.data.maxClaims,
    pipeline: "other",
  });

  return NextResponse.json({
    ok: true,
    decisionTrees: result.decisionTrees ?? [],
    eventualities: result.eventualities ?? [],
    consequences: result.consequences?.consequences ?? [],
    responsibilities: result.consequences?.responsibilities ?? [],
    responsibilityPaths: result.responsibilityPaths ?? [],
  });
}
