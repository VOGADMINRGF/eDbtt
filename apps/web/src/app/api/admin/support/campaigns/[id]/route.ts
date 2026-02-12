import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "@core/db/triMongo";
import { getStaffContext } from "@/app/api/admin/eventualities/helpers";
import { supportCampaignsCol, supportPledgesCol } from "@features/campaign/db";
import type { SupportCampaignDoc, SupportPledgeDoc } from "@features/campaign/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: "bad_request", message }, { status: 400 });
}

function parseId(raw: string) {
  if (!raw || !ObjectId.isValid(raw)) return null;
  return new ObjectId(raw);
}

function serializeCampaign(doc: SupportCampaignDoc) {
  return {
    id: doc._id?.toString() ?? "",
    targetType: doc.targetType,
    targetId: doc.targetId,
    slug: doc.slug,
    title: doc.title,
    description: doc.description ?? null,
    goalCents: doc.goalCents,
    currency: doc.currency,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

function serializePledge(doc: SupportPledgeDoc) {
  return {
    id: doc._id?.toString() ?? "",
    supportCampaignId: doc.supportCampaignId?.toString(),
    amountCents: doc.amountCents,
    status: doc.status,
    paymentReference: doc.paymentReference,
    isAnonymous: doc.isAnonymous,
    publicName: doc.publicName ?? null,
    publicRegionCode: doc.publicRegionCode ?? null,
    message: doc.message ?? null,
    createdByUserId: doc.createdByUserId ?? null,
    bookedByUserId: doc.bookedByUserId ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    paidAt: doc.paidAt ? doc.paidAt.toISOString() : null,
    canceledAt: doc.canceledAt ? doc.canceledAt.toISOString() : null,
  };
}

function toCsv(pledges: ReturnType<typeof serializePledge>[]) {
  const header =
    "id,status,amountCents,paymentReference,isAnonymous,publicName,publicRegionCode,createdAt,paidAt,canceledAt";
  const rows = pledges.map((p) =>
    [
      p.id,
      p.status,
      p.amountCents,
      p.paymentReference,
      p.isAnonymous ? "true" : "false",
      (p.publicName ?? "").replace(/,/g, " "),
      (p.publicRegionCode ?? "").replace(/,/g, " "),
      p.createdAt,
      p.paidAt ?? "",
      p.canceledAt ?? "",
    ].join(","),
  );
  return [header, ...rows].join("\n");
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const staff = await getStaffContext(req);
  if (staff.response) return staff.response;

  const { id } = await ctx.params;
  const campaignId = parseId(String(id ?? ""));
  if (!campaignId) return badRequest("invalid_id");

  const statusParam = req.nextUrl.searchParams.get("status");
  const statusFilter =
    statusParam === "waiting_payment" || statusParam === "paid" || statusParam === "canceled" ? statusParam : null;
  const csvMode = req.nextUrl.searchParams.get("format") === "csv";

  const campaigns = await supportCampaignsCol();
  const campaign = await campaigns.findOne({ _id: campaignId });
  if (!campaign) return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });

  const pledgesCol = await supportPledgesCol();
  const pledgeQuery = {
    supportCampaignId: campaignId,
    ...(statusFilter ? { status: statusFilter } : {}),
  };
  const pledgeDocs = await pledgesCol.find(pledgeQuery).sort({ createdAt: -1 }).limit(1000).toArray();
  const pledges = pledgeDocs.map(serializePledge);

  const [totals] = await pledgesCol
    .aggregate([
      { $match: { supportCampaignId: campaignId } },
      {
        $group: {
          _id: null,
          raisedCents: { $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$amountCents", 0] } },
          waitingCents: { $sum: { $cond: [{ $eq: ["$status", "waiting_payment"] }, "$amountCents", 0] } },
          canceledCents: { $sum: { $cond: [{ $eq: ["$status", "canceled"] }, "$amountCents", 0] } },
          totalPledges: { $sum: 1 },
        },
      },
    ])
    .toArray();

  if (csvMode) {
    const csv = toCsv(pledges);
    return new Response(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="support-${campaign.slug}.csv"`,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    supportCampaign: serializeCampaign(campaign),
    totals: {
      raisedCents: totals?.raisedCents ?? 0,
      waitingCents: totals?.waitingCents ?? 0,
      canceledCents: totals?.canceledCents ?? 0,
      totalPledges: totals?.totalPledges ?? 0,
      goalCents: campaign.goalCents,
    },
    pledges,
  });
}
