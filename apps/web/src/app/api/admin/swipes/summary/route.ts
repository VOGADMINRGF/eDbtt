export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ObjectId, coreCol } from "@core/db/triMongo";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const votesCol = await coreCol("swipe_votes");
  const statementSwipesCol = await coreCol("statement_swipes");

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [totalVotes, votes30d, totalSwipes, timeseries] = await Promise.all([
    votesCol.countDocuments({}),
    votesCol.countDocuments({ createdAt: { $gte: since } }),
    statementSwipesCol.countDocuments({}),
    votesCol
      .aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray(),
  ]);

  const topRaw = await votesCol
    .aggregate([
      { $group: { _id: "$statementId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ])
    .toArray();

  const ids = topRaw.map((row: any) => row._id).filter(Boolean);
  const objectIds = ids.filter((id) => typeof id === "string" && ObjectId.isValid(id)).map((id) => new ObjectId(id));
  const stringIds = ids.filter((id) => typeof id === "string" && !ObjectId.isValid(id));

  const statementsCol = await coreCol("statements");
  const statementDocs = await statementsCol
    .find(
      {
        $or: [
          ...(objectIds.length ? [{ _id: { $in: objectIds } }] : []),
          ...(stringIds.length ? [{ id: { $in: stringIds } }] : []),
        ],
      },
      { projection: { _id: 1, id: 1, title: 1, text: 1 } },
    )
    .toArray();

  const statementMap = new Map<string, string>();
  statementDocs.forEach((doc: any) => {
    const key = String(doc.id ?? doc._id);
    statementMap.set(key, doc.title ?? doc.text ?? "Statement");
  });

  const topStatements = topRaw.map((row: any) => {
    const id = String(row._id ?? "");
    return {
      id,
      title: statementMap.get(id) ?? "Statement",
      count: row.count ?? 0,
    };
  });

  return NextResponse.json({
    ok: true,
    totals: {
      swipeVotes: totalVotes,
      swipeVotes30d: votes30d,
      statementSwipes: totalSwipes,
    },
    timeseries: timeseries.map((entry: any) => ({ date: entry._id, count: entry.count ?? 0 })),
    topStatements,
  });
}
