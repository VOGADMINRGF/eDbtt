import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { analyzeContribution } from "@features/analyze/analyzeContribution";
import { persistEventualitiesSnapshot } from "@core/eventualities";
import { getStaffContext } from "@/app/api/admin/eventualities/helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: "bad_request", message }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const staff = await getStaffContext(req);
  if (staff.response) return staff.response;

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid_json");
  }

  const text = String(body?.text ?? "").trim();
  if (!text) return badRequest("missing_text");

  const locale = String(body?.locale ?? "de").toLowerCase();
  const contributionId =
    typeof body?.contributionId === "string" && body.contributionId.trim()
      ? body.contributionId.trim()
      : `evt-${crypto.randomUUID()}`;

  const result = await analyzeContribution({
    text,
    locale,
    pipeline: "other",
    audienceRole: "staff",
  });

  const snapshot = await persistEventualitiesSnapshot({
    result,
    contributionId,
    locale,
    userId: staff.context?.userId ?? null,
  });

  return NextResponse.json({
    ok: true,
    contributionId,
    snapshot: snapshot
      ? {
          contributionId: snapshot.contributionId,
          locale: snapshot.locale,
          nodesCount: snapshot.nodesCount,
          treesCount: snapshot.treesCount,
          consequencesCount: snapshot.consequencesCount ?? 0,
          responsibilitiesCount: snapshot.responsibilitiesCount ?? 0,
          pathsCount: snapshot.pathsCount ?? 0,
          reviewed: snapshot.reviewed,
          reviewedAt: snapshot.reviewedAt ? snapshot.reviewedAt.toISOString() : null,
        }
      : null,
    eventualities: result.eventualities ?? [],
    decisionTrees: result.decisionTrees ?? [],
    consequences: result.consequences ?? null,
    responsibilityPaths: result.responsibilityPaths ?? [],
  });
}
