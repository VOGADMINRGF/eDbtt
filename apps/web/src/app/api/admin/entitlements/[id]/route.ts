import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import {
  ENTITLEMENT_STATUSES,
  getRegionEntitlementRuntimeRepo,
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

const UpdateEntitlementBodySchema = z
  .object({
    status: z.enum(ENTITLEMENT_STATUSES).optional(),
    validUntil: z.string().datetime({ offset: true }).nullable().optional(),
    limits: EntitlementLimitsSchema.optional(),
    note: z.string().trim().min(1).optional(),
  })
  .strict();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  try {
    const { id } = await params;
    const body = UpdateEntitlementBodySchema.parse(await req.json());
    const repo = getRegionEntitlementRuntimeRepo();
    const updatedBy = gate._id?.toHexString?.() ?? "admin";
    const entitlement = await repo.updatePaidDashboardEntitlement({
      id,
      updatedBy,
      status: body.status,
      validUntil: body.validUntil,
      limits: body.limits,
      note: body.note ?? null,
    });
    if (!entitlement) {
      return NextResponse.json({ ok: false, error: "entitlement_not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, entitlement });
  } catch (error) {
    const message = error instanceof Error ? error.message : "entitlement_update_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
