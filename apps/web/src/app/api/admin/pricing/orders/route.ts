import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import {
  listPricingOrders,
  updatePricingOrderReview,
} from "@features/pricing/server/leadsRepo";
import type { PricingOrderStatus } from "@features/pricing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUS_VALUES: PricingOrderStatus[] = [
  "submitted",
  "under_review",
  "approved",
  "adjusted",
  "rejected",
  "active",
  "paused",
  "cancelled",
];

const querySchema = z.object({
  status: z.enum(STATUS_VALUES as [PricingOrderStatus, ...PricingOrderStatus[]]).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
});

const patchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(STATUS_VALUES as [PricingOrderStatus, ...PricingOrderStatus[]]),
  note: z.string().max(1200).optional(),
  adjustedPriceLabel: z.string().max(120).optional(),
  discountKind: z.enum(["pilot", "yearly", "partner", "reference", "manual_special"]).optional().nullable(),
  discountReason: z.string().max(240).optional().nullable(),
  discountAmount: z.coerce.number().min(0).max(250000).optional().nullable(),
  approvalReason: z.string().max(240).optional().nullable(),
  rejectionReason: z.string().max(240).optional().nullable(),
  activationNotes: z.string().max(500).optional().nullable(),
  billingFinanceNote: z.string().max(500).optional().nullable(),
  contractReference: z.string().max(120).optional().nullable(),
  invoiceReference: z.string().max(120).optional().nullable(),
});

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const parsed = querySchema.safeParse({
    status: req.nextUrl.searchParams.get("status") ?? undefined,
    limit: req.nextUrl.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_query" }, { status: 400 });
  }

  const items = await listPricingOrders(parsed.data);
  return NextResponse.json({ ok: true, items });
}

export async function PATCH(req: NextRequest) {
  const actor = await requireAdminOrResponse(req);
  if (actor instanceof Response) return actor;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  try {
    const updated = await updatePricingOrderReview(parsed.data.id, {
      status: parsed.data.status,
      actorUserId: String(actor._id),
      note: parsed.data.note,
      adjustedPriceLabel: parsed.data.adjustedPriceLabel,
      discountKind: parsed.data.discountKind ?? null,
      discountReason: parsed.data.discountReason ?? null,
      discountAmount: parsed.data.discountAmount ?? null,
      approvalReason: parsed.data.approvalReason ?? null,
      rejectionReason: parsed.data.rejectionReason ?? null,
      activationNotes: parsed.data.activationNotes ?? null,
      billingFinanceNote: parsed.data.billingFinanceNote ?? null,
      contractReference: parsed.data.contractReference ?? null,
      invoiceReference: parsed.data.invoiceReference ?? null,
    });
    return NextResponse.json({ ok: true, order: updated });
  } catch (error: any) {
    const message = typeof error?.message === "string" ? error.message : "unknown_error";
    if (message === "invalid_order_id") {
      return NextResponse.json({ ok: false, error: message }, { status: 400 });
    }
    if (message === "order_not_found") {
      return NextResponse.json({ ok: false, error: message }, { status: 404 });
    }
    if (message === "invalid_status_transition") {
      return NextResponse.json({ ok: false, error: message }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  }
}

