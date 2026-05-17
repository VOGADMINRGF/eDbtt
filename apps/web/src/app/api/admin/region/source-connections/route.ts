import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";
import {
  RegionSourceConnectionUpsertSchema,
  buildPersistedRegionAccessContext,
  canCreateRegionDraft,
  canReviewRegionSignal,
  getOperationalRegionById,
  listRegionSourceConnections,
  listRegionSourceTestResults,
  saveRegionSourceConnection,
} from "@features/region";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z
  .object({
    regionId: z.string().trim().min(1).optional(),
  })
  .strict();

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

export async function GET(req: NextRequest) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;
  try {
    const parsed = QuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams.entries()));
    const region = parsed.regionId ? await getOperationalRegionById(parsed.regionId) : null;
    if (parsed.regionId && !region) {
      return NextResponse.json({ ok: false, error: "region_not_found" }, { status: 404 });
    }

    if (region && !(await canManageRegionSources({ gate, regionId: region.id }))) {
      return NextResponse.json({ ok: false, error: "region_source_forbidden" }, { status: 403 });
    }

    const [connections, results] = await Promise.all([
      listRegionSourceConnections(region?.id ?? null),
      listRegionSourceTestResults({ regionId: region?.id ?? null, limit: 50 }),
    ]);
    return NextResponse.json({ ok: true, connections, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "region_source_list_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;
  try {
    const parsed = RegionSourceConnectionUpsertSchema.parse(await req.json());
    const region = await getOperationalRegionById(parsed.regionId);
    if (!region) {
      return NextResponse.json({ ok: false, error: "region_not_found" }, { status: 404 });
    }

    if (!(await canManageRegionSources({ gate, regionId: region.id }))) {
      return NextResponse.json({ ok: false, error: "region_source_forbidden" }, { status: 403 });
    }

    const connection = await saveRegionSourceConnection({
      ...parsed,
      regionId: region.id,
      userId: gate.actor.userId,
    });
    return NextResponse.json({ ok: true, connection });
  } catch (error) {
    const message = error instanceof Error ? error.message : "region_source_save_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
