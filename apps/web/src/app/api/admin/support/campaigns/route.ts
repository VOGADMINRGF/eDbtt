import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "@core/db/triMongo";
import { getStaffContext } from "@/app/api/admin/eventualities/helpers";
import { supportCampaignsCol, supportPledgesCol } from "@features/campaign/db";
import type { SupportCampaignDoc } from "@features/campaign/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function serializeCampaign(doc: SupportCampaignDoc, stats: { raisedCents: number; waitingCents: number; pledges: number }) {
  return {
    id: doc._id?.toString() ?? "",
    slug: doc.slug,
    title: doc.title,
    targetType: doc.targetType,
    targetId: doc.targetId,
    status: doc.status,
    goalCents: doc.goalCents,
    currency: doc.currency,
    raisedCents: stats.raisedCents,
    waitingCents: stats.waitingCents,
    pledges: stats.pledges,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const staff = await getStaffContext(req);
  if (staff.response) return staff.response;

  const statusParam = req.nextUrl.searchParams.get("status");
  const status = statusParam === "draft" || statusParam === "active" || statusParam === "closed" ? statusParam : null;

  const campaigns = await supportCampaignsCol();
  const items = await campaigns
    .find(status ? { status } : {})
    .sort({ createdAt: -1 })
    .limit(300)
    .toArray();

  const ids = items.map((item) => item._id).filter(Boolean) as ObjectId[];
  const pledges = await supportPledgesCol();
  const grouped = ids.length
    ? await pledges
        .aggregate([
          { $match: { supportCampaignId: { $in: ids } } },
          {
            $group: {
              _id: "$supportCampaignId",
              raisedCents: {
                $sum: {
                  $cond: [{ $eq: ["$status", "paid"] }, "$amountCents", 0],
                },
              },
              waitingCents: {
                $sum: {
                  $cond: [{ $eq: ["$status", "waiting_payment"] }, "$amountCents", 0],
                },
              },
              pledges: { $sum: 1 },
            },
          },
        ])
        .toArray()
    : [];

  const byId = new Map<string, { raisedCents: number; waitingCents: number; pledges: number }>();
  grouped.forEach((item: any) => {
    byId.set(String(item?._id ?? ""), {
      raisedCents: Number(item?.raisedCents ?? 0),
      waitingCents: Number(item?.waitingCents ?? 0),
      pledges: Number(item?.pledges ?? 0),
    });
  });

  return NextResponse.json({
    ok: true,
    items: items.map((doc) =>
      serializeCampaign(doc, byId.get(doc._id?.toString() ?? "") ?? { raisedCents: 0, waitingCents: 0, pledges: 0 }),
    ),
  });
}
