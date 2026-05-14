import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import {
  ENTITLEMENT_SCOPES,
  ENTITLEMENT_SOURCES,
  ENTITLEMENT_STATUSES,
  getOperationalRegionById,
  getRegionEntitlementRuntimeRepo,
  getRegionOrganizationRuntimeRepo,
} from "@features/region";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EntitlementLimitsSchema = z
  .object({
    maxRegions: z.number().int().nonnegative().optional(),
    maxDossiers: z.number().int().nonnegative().optional(),
    maxAnlassraeume: z.number().int().nonnegative().optional(),
    maxSignalsPerMonth: z.number().int().nonnegative().optional(),
    maxDraftsPerMonth: z.number().int().nonnegative().optional(),
    maxUsers: z.number().int().nonnegative().optional(),
    factcheckCredits: z.number().int().nonnegative().optional(),
  })
  .strict();

const CreateEntitlementBodySchema = z
  .object({
    organizationId: z.string().trim().min(1),
    regionId: z.string().trim().min(1).optional(),
    unitId: z.string().trim().min(1).optional(),
    planId: z.string().trim().min(1),
    planLabel: z.string().trim().min(1).optional(),
    status: z.enum(ENTITLEMENT_STATUSES),
    scope: z.enum(ENTITLEMENT_SCOPES),
    validUntil: z.string().datetime({ offset: true }).optional(),
    limits: EntitlementLimitsSchema.optional(),
    source: z.enum(ENTITLEMENT_SOURCES),
  })
  .strict();

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const repo = getRegionEntitlementRuntimeRepo();
  const entitlements = await repo.listEntitlementsForAdmin();
  return NextResponse.json({ ok: true, entitlements });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  try {
    const body = CreateEntitlementBodySchema.parse(await req.json());
    const organizationRepo = getRegionOrganizationRuntimeRepo();
    const organization = (await organizationRepo.listOrganizationsByIds([body.organizationId]))[0] ?? null;
    if (!organization) {
      return NextResponse.json({ ok: false, error: "organization_not_found" }, { status: 404 });
    }

    const resolvedRegion = body.regionId ? await getOperationalRegionById(body.regionId) : null;
    if (body.regionId && !resolvedRegion) {
      return NextResponse.json({ ok: false, error: "region_not_found" }, { status: 404 });
    }

    const repo = getRegionEntitlementRuntimeRepo();
    const createdBy = gate._id?.toHexString?.() ?? "admin";
    const entitlement = await repo.createPaidDashboardEntitlement({
      organizationId: organization.id,
      organizationName: organization.name,
      organizationType: organization.type,
      regionId: resolvedRegion?.id ?? body.regionId ?? null,
      unitId: body.unitId ?? null,
      planId: body.planId,
      planLabel: body.planLabel ?? null,
      status: body.status,
      scope: body.scope,
      validUntil: body.validUntil ?? null,
      limits: body.limits ?? null,
      createdBy,
      source: body.source,
    });

    return NextResponse.json({ ok: true, entitlement }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "entitlement_create_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
