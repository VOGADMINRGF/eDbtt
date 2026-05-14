import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import { getRegionOrganizationRuntimeRepo } from "@features/region";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const repo = getRegionOrganizationRuntimeRepo();
  const claims = await repo.listOrganizationClaimsForReview();
  return NextResponse.json({ ok: true, claims });
}
