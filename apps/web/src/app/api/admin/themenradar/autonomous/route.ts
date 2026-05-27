import { NextRequest, NextResponse } from "next/server";
import { buildAutonomousThemenradarReadModel } from "@features/themenradar";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

function readStringList(params: URLSearchParams, key: string): string[] {
  return params
    .getAll(key)
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const params = req.nextUrl.searchParams;
  const limit = Number(params.get("limit") ?? 16);
  const viewerRegionIds = readStringList(params, "regionId");
  const organizationIds = readStringList(params, "organizationId");

  const readModel = await buildAutonomousThemenradarReadModel({
    scope: {
      viewerRegionIds,
      organizationIds,
      adminContext: true,
    },
    limit: Number.isFinite(limit) ? limit : 16,
  });

  return NextResponse.json({
    ok: true,
    readModel,
  });
}
