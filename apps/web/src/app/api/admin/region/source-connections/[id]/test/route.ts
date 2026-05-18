import { NextRequest, NextResponse } from "next/server";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";
import {
  RegionSourceConnectionDryRunSchema,
  buildPersistedRegionAccessContext,
  canCreateRegionDraft,
  canReviewRegionSignal,
  getOperationalRegionById,
  listRegionSourceConnections,
  runRegionSourceConnectionDryRun,
} from "@features/region";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function canManageRegionSources(params: {
  gate: Awaited<ReturnType<typeof requireGovernanceActorOrResponse>>;
  regionId: string;
}) {
  if (params.gate instanceof Response) return false;
  if (params.gate.actor.isAdmin) return true;
  const accessContext = await buildPersistedRegionAccessContext({
    userId: params.gate.actor.userId,
    actorRole: params.gate.actor.role,
    isAdmin: params.gate.actor.isAdmin,
    roles: params.gate.roles,
    organizationIds: params.gate.actor.scopedOwnerIds,
    regionId: params.regionId,
  });
  return (
    canReviewRegionSignal(accessContext, params.regionId) ||
    canCreateRegionDraft(accessContext, params.regionId)
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;
  try {
    RegionSourceConnectionDryRunSchema.parse(await req.json());

    const { id } = await params;
    const connection = (await listRegionSourceConnections()).find((entry) => entry.id === id) ?? null;
    if (!connection) {
      return NextResponse.json({ ok: false, error: "source_connection_not_found" }, { status: 404 });
    }
    const region = await getOperationalRegionById(connection.regionId);
    if (!region) {
      return NextResponse.json({ ok: false, error: "region_not_found" }, { status: 404 });
    }
    if (!(await canManageRegionSources({ gate, regionId: region.id }))) {
      return NextResponse.json({ ok: false, error: "region_source_forbidden" }, { status: 403 });
    }

    const result = await runRegionSourceConnectionDryRun({
      connectionId: connection.id,
      testedBy: gate.actor.userId,
      region,
      actorRole: gate.actor.role,
      organizationIds: gate.actor.scopedOwnerIds,
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "region_source_test_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
