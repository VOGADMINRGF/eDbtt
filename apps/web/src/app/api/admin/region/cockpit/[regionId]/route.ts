import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import { getRegionalAdminCockpitReadModel } from "@features/region";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ regionId: string }> },
) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  try {
    const { regionId } = await params;
    const cockpit = await getRegionalAdminCockpitReadModel(regionId);
    return NextResponse.json({ ok: true, cockpit });
  } catch (error) {
    const message = error instanceof Error ? error.message : "regional_cockpit_failed";
    return NextResponse.json(
      { ok: false, error: message },
      { status: message === "region_not_found" ? 404 : 400 },
    );
  }
}
