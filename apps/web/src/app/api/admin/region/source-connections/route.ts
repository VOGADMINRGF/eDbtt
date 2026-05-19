import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";
import {
  RegionSourceConnectionUpsertSchema,
  buildPersistedRegionAccessContext,
  canEditOrganizationResource,
  canCreateRegionDraft,
  canReviewRegionSignal,
  canViewRegionResource,
  getOperationalRegionById,
  listRegionSourceConnections,
  listRegionSourceTestResults,
  regionScopeFromRegionAccessContext,
  saveRegionSourceConnection,
} from "@features/region";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const QuerySchema = z
  .object({
    regionId: z.string().trim().min(1).optional(),
  })
  .strict();

async function buildScopedAccess(params: {
  gate: Awaited<ReturnType<typeof requireGovernanceActorOrResponse>>;
  regionId?: string | null;
}) {
  if (params.gate instanceof Response) return false;
  const accessContext = await buildPersistedRegionAccessContext({
    userId: params.gate.actor.userId,
    actorRole: params.gate.actor.role,
    isAdmin: params.gate.actor.isAdmin,
    roles: params.gate.roles,
    organizationIds: params.gate.actor.scopedOwnerIds,
    regionId: params.regionId ?? undefined,
  });
  return {
    accessContext,
    scope: regionScopeFromRegionAccessContext({ accessContext }),
  };
}

async function canManageRegionSources(params: {
  gate: Awaited<ReturnType<typeof requireGovernanceActorOrResponse>>;
  regionId: string;
}) {
  if (params.gate instanceof Response) return false;
  const scoped = await buildScopedAccess(params);
  if (!scoped) return false;
  return (
    canViewRegionResource(scoped.scope, {
      regionId: params.regionId,
      organizationId: scoped.accessContext.organization.primaryOrganizationId,
    }) &&
    canEditOrganizationResource(scoped.scope, {
      organizationId: scoped.accessContext.organization.primaryOrganizationId,
    }) &&
    (
      canReviewRegionSignal(scoped.accessContext, params.regionId) ||
      canCreateRegionDraft(scoped.accessContext, params.regionId)
    )
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

    const scoped = await buildScopedAccess({ gate, regionId: region?.id ?? null });
    const [connections, results] = await Promise.all([
      listRegionSourceConnections(region?.id ?? null),
      listRegionSourceTestResults({ regionId: region?.id ?? null, limit: 50 }),
    ]);
    if (gate.actor.isAdmin) {
      return NextResponse.json({ ok: true, connections, results });
    }
    const filteredConnections = connections.filter((connection) =>
      scoped &&
      canViewRegionResource(scoped.scope, {
        regionId: connection.regionId,
        organizationId: connection.organizationId ?? null,
      }),
    );
    const filteredResults = results.filter((result) =>
      scoped &&
      canViewRegionResource(scoped.scope, {
        regionId: result.regionId,
        organizationId: result.organizationId ?? null,
      }),
    );
    return NextResponse.json({ ok: true, connections: filteredConnections, results: filteredResults });
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

    const scoped = await buildScopedAccess({ gate, regionId: region.id });
    const connection = await saveRegionSourceConnection({
      ...parsed,
      regionId: region.id,
      userId: gate.actor.userId,
      organizationId: gate.actor.isAdmin
        ? null
        : scoped && canEditOrganizationResource(scoped.scope, {
            organizationId: scoped.accessContext.organization.primaryOrganizationId,
          })
          ? scoped.accessContext.organization.primaryOrganizationId
          : null,
    });
    return NextResponse.json({ ok: true, connection });
  } catch (error) {
    const message = error instanceof Error ? error.message : "region_source_save_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
