import { NextRequest, NextResponse } from "next/server";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";
import {
  RegionSourceConnectionDryRunSchema,
  canEditOrganizationResource,
  canCreateRegionDraft,
  canReviewRegionSignal,
  canViewRegionResource,
  getOperationalRegionById,
  listRegionSourceConnections,
  regionScopeFromRegionAccessContext,
  runRegionSourceConnectionDryRun,
} from "@features/region";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function canManageRegionSources(params: {
  gate: Awaited<ReturnType<typeof requireGovernanceActorOrResponse>>;
  regionId: string;
  organizationId?: string | null;
}) {
  if (params.gate instanceof Response) return false;
  const accessContext = params.gate.requestScope.regionAccess;
  const scope = regionScopeFromRegionAccessContext({ accessContext });
  return (
    canViewRegionResource(scope, {
      regionId: params.regionId,
      organizationId: params.organizationId ?? null,
    }) &&
    canEditOrganizationResource(scope, {
      organizationId:
        params.organizationId ?? accessContext.organization.primaryOrganizationId,
    }) &&
    (
      canReviewRegionSignal(accessContext, params.regionId) ||
      canCreateRegionDraft(accessContext, params.regionId)
    )
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
    const gate = await requireGovernanceActorOrResponse(req, { regionId: region.id });
    if (gate instanceof Response) return gate;
    if (
      !(await canManageRegionSources({
        gate,
        regionId: region.id,
        organizationId: connection.organizationId ?? null,
      }))
    ) {
      return NextResponse.json({ ok: false, error: "region_source_forbidden" }, { status: 403 });
    }

    const result = await runRegionSourceConnectionDryRun({
      connectionId: connection.id,
      testedBy: gate.actor.userId,
      region,
      actorRole: gate.actor.role,
      organizationIds: gate.actor.scopedOwnerIds,
    });
    return NextResponse.json({
      ok: true,
      result,
      requestScope: {
        isOperatorMode: gate.requestScope.isOperatorMode,
        operatorModeLabel: gate.requestScope.operatorModeLabel,
        organizationId: gate.requestScope.organizationId,
        regionIds: gate.requestScope.regionIds,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "region_source_test_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
