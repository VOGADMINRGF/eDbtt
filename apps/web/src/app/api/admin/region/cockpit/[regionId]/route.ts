import { NextRequest, NextResponse } from "next/server";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";
import {
  buildPersistedRegionAccessContext,
  canReadRegionDashboard,
  getOperationalRegionById,
  getRegionalAdminCockpitReadModel,
} from "@features/region";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ regionId: string }> },
) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  try {
    const { regionId } = await params;
    const region = await getOperationalRegionById(regionId);
    if (!region) {
      return NextResponse.json({ ok: false, error: "region_not_found" }, { status: 404 });
    }

    const accessContext = await buildPersistedRegionAccessContext({
      userId: gate.actor.userId,
      actorRole: gate.actor.role,
      isAdmin: gate.actor.isAdmin,
      roles: gate.roles,
      organizationIds: gate.actor.scopedOwnerIds,
      regionId: region.id,
    });
    if (!canReadRegionDashboard(accessContext, region.id)) {
      return NextResponse.json(
        { ok: false, error: "region_dashboard_forbidden" },
        { status: 403 },
      );
    }

    const cockpit = await getRegionalAdminCockpitReadModel(region.id, { accessContext });
    return NextResponse.json({ ok: true, cockpit });
  } catch (error) {
    const message = error instanceof Error ? error.message : "regional_cockpit_failed";
    return NextResponse.json(
      { ok: false, error: message },
      { status: message === "region_not_found" ? 404 : 400 },
    );
  }
}
