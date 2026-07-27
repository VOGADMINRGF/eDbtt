export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import { buildMarketingRegistryReadModel } from "@/features/marketing/registry/readModel";

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  return NextResponse.json({
    ok: true,
    readModel: buildMarketingRegistryReadModel(),
  });
}
