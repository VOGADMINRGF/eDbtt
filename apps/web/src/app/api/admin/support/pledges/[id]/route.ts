import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "@core/db/triMongo";
import { getStaffContext } from "@/app/api/admin/eventualities/helpers";
import { supportPledgesCol } from "@features/campaign/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: "bad_request", message }, { status: 400 });
}

function parseId(raw: string) {
  if (!raw || !ObjectId.isValid(raw)) return null;
  return new ObjectId(raw);
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const staff = await getStaffContext(req);
  if (staff.response) return staff.response;

  const { id } = await ctx.params;
  const pledgeId = parseId(String(id ?? ""));
  if (!pledgeId) return badRequest("invalid_id");

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid_json");
  }

  const status = body?.status;
  if (status !== "paid" && status !== "canceled") return badRequest("invalid_status");

  const now = new Date();
  const patch: Record<string, unknown> = {
    status,
    updatedAt: now,
    bookedByUserId: staff.context?.userId ?? null,
  };
  if (status === "paid") {
    patch.paidAt = now;
    patch.canceledAt = null;
  } else {
    patch.canceledAt = now;
  }

  const pledges = await supportPledgesCol();
  const updated = await pledges.findOneAndUpdate({ _id: pledgeId }, { $set: patch }, { returnDocument: "after" });
  if (!updated) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  return NextResponse.json({
    ok: true,
    pledge: {
      id: updated._id?.toString() ?? "",
      status: updated.status,
      paymentReference: updated.paymentReference,
      amountCents: updated.amountCents,
      paidAt: updated.paidAt ? updated.paidAt.toISOString() : null,
      canceledAt: updated.canceledAt ? updated.canceledAt.toISOString() : null,
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
}
