import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";
import {
  RegionSourceConnectionUpsertSchema,
  buildOrganizationDashboardReadModel,
  canEditOrganizationResource,
  canCreateRegionDraft,
  canReviewRegionSignal,
  canViewRegionResource,
  getOperationalRegionById,
  listRegionSourceConnections,
  listRegionSourceTestResults,
  organizationEntitlementAllowsScope,
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
  const accessContext = params.gate.requestScope.regionAccess;
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

async function resolveSourceConnectionAccess(params: {
  gate: Awaited<ReturnType<typeof requireGovernanceActorOrResponse>>;
}) {
  if (params.gate instanceof Response) return null;
  if (params.gate.actor.isAdmin) {
    return {
      organizationId: null,
      verifiedMembership: true,
      hasSourceEntitlement: true,
      limitedEntitlement: false,
      requestState: "operator_review" as const,
    };
  }
  const readModel = await buildOrganizationDashboardReadModel({
    userId: params.gate.actor.userId,
    roles: (params.gate.roles ?? []).map((role) => String(role).toLowerCase()),
    isAdmin: false,
    actorRole: params.gate.actor.role,
  });
  const sourceGrant = readModel.entitlementSummary.grants.find(
    (grant) => grant.scope === "source_connection",
  );
  const verifiedMembership = readModel.membershipStatus.verifiedMemberships > 0;
  const hasSourceEntitlement = Boolean(
    sourceGrant &&
      organizationEntitlementAllowsScope(readModel.entitlementSummary, "source_connection"),
  );
  return {
    organizationId:
      params.gate.requestScope.regionAccess.organization.primaryOrganizationId ??
      readModel.organization.primaryOrganizationId,
    verifiedMembership,
    hasSourceEntitlement,
    limitedEntitlement: sourceGrant?.status === "limited",
    requestState: !verifiedMembership
      ? ("verification_required" as const)
      : hasSourceEntitlement
        ? ("entitled" as const)
        : ("entitlement_required" as const),
  };
}

export async function GET(req: NextRequest) {
  try {
    const parsed = QuerySchema.parse(Object.fromEntries(req.nextUrl.searchParams.entries()));
    const region = parsed.regionId ? await getOperationalRegionById(parsed.regionId) : null;
    if (parsed.regionId && !region) {
      return NextResponse.json({ ok: false, error: "region_not_found" }, { status: 404 });
    }
    const gate = await requireGovernanceActorOrResponse(req, { regionId: region?.id ?? null });
    if (gate instanceof Response) return gate;

    if (region && !(await canManageRegionSources({ gate, regionId: region.id }))) {
      return NextResponse.json({ ok: false, error: "region_source_forbidden" }, { status: 403 });
    }

    const scoped = await buildScopedAccess({ gate, regionId: region?.id ?? null });
    const sourceAccess = await resolveSourceConnectionAccess({ gate });
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
    return NextResponse.json({
      ok: true,
      connections: filteredConnections,
      results: filteredResults,
      requestScope: {
        isOperatorMode: gate.requestScope.isOperatorMode,
        operatorModeLabel: gate.requestScope.operatorModeLabel,
        organizationId: gate.requestScope.organizationId,
        regionIds: gate.requestScope.regionIds,
      },
      sourceAccess,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "region_source_list_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const parsed = RegionSourceConnectionUpsertSchema.parse(await req.json());
    const region = await getOperationalRegionById(parsed.regionId);
    if (!region) {
      return NextResponse.json({ ok: false, error: "region_not_found" }, { status: 404 });
    }
    const gate = await requireGovernanceActorOrResponse(req, { regionId: region.id });
    if (gate instanceof Response) return gate;

    if (!(await canManageRegionSources({ gate, regionId: region.id }))) {
      return NextResponse.json({ ok: false, error: "region_source_forbidden" }, { status: 403 });
    }

    const scoped = await buildScopedAccess({ gate, regionId: region.id });
    const sourceAccess = await resolveSourceConnectionAccess({ gate });
    const organizationId = gate.actor.isAdmin
      ? null
      : scoped && canEditOrganizationResource(scoped.scope, {
          organizationId: scoped.accessContext.organization.primaryOrganizationId,
        })
        ? scoped.accessContext.organization.primaryOrganizationId
        : null;
    const status = !sourceAccess || gate.actor.isAdmin
      ? parsed.enabled === false
        ? "draft"
        : "active_review_required"
      : !sourceAccess.verifiedMembership
        ? "submitted"
        : sourceAccess.hasSourceEntitlement
          ? sourceAccess.limitedEntitlement
            ? "active_limited"
            : "active_review_required"
          : "submitted";
    const enabled =
      gate.actor.isAdmin ||
      Boolean(sourceAccess?.verifiedMembership && sourceAccess?.hasSourceEntitlement);
    const connection = await saveRegionSourceConnection({
      ...parsed,
      regionId: region.id,
      userId: gate.actor.userId,
      organizationId,
      enabled,
      status,
      scope: gate.actor.isAdmin ? "operator_review" : "organization_region",
      note:
        !sourceAccess || gate.actor.isAdmin
          ? "Quelle im Betreiberkontext gespeichert."
          : !sourceAccess.verifiedMembership
            ? "Quelle nur beantragt. Ohne verifizierte Organisation bleibt keine produktive Verbindung aktiv."
            : sourceAccess.hasSourceEntitlement
              ? sourceAccess.limitedEntitlement
                ? "Quelle eingeschränkt freigeschaltet. Review bleibt Pflicht."
                : "Quelle aktiv, aber weiterhin reviewpflichtig."
              : "Quelle nur beantragt. Ohne Entitlement `source_connection` bleibt keine produktive Verbindung aktiv.",
    });
    return NextResponse.json({
      ok: true,
      connection,
      sourceAccess,
      requestScope: {
        isOperatorMode: gate.requestScope.isOperatorMode,
        operatorModeLabel: gate.requestScope.operatorModeLabel,
        organizationId: gate.requestScope.organizationId,
        regionIds: gate.requestScope.regionIds,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "region_source_save_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
