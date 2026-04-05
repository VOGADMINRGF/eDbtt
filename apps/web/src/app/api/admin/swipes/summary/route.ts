export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ObjectId, coreCol } from "@core/db/triMongo";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import { eventualityNodesCol } from "@core/eventualities/db";
import { buildSwipeVariantAggregationReadModel } from "@/features/swipes/variantAggregationReadModel";

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const votesCol = await coreCol("swipe_votes");
  const statementSwipesCol = await coreCol("statement_swipes");

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [totalVotes, votes30d, totalSwipes, timeseries, variantSelectedRows, variantRankedRows] = await Promise.all([
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
    votesCol
      .aggregate([
        {
          $match: {
            createdAt: { $gte: since },
            statementId: { $type: "string", $ne: "" },
            eventualityId: { $type: "string", $ne: "" },
          },
        },
        {
          $project: {
            statementId: 1,
            eventualityId: 1,
            normalizedWeight: {
              $cond: [{ $in: ["$variantWeight", [1, 3, 5]] }, "$variantWeight", 3],
            },
          },
        },
        {
          $group: {
            _id: {
              statementId: "$statementId",
              eventualityId: "$eventualityId",
            },
            selectedCount: { $sum: 1 },
            weightedScore: { $sum: "$normalizedWeight" },
          },
        },
      ])
      .toArray(),
    votesCol
      .aggregate([
        {
          $match: {
            createdAt: { $gte: since },
            statementId: { $type: "string", $ne: "" },
            variantRankedIds: { $type: "array", $ne: [] },
          },
        },
        { $unwind: { path: "$variantRankedIds", includeArrayIndex: "rankIndex" } },
        { $match: { variantRankedIds: { $type: "string", $ne: "" } } },
        {
          $group: {
            _id: {
              statementId: "$statementId",
              eventualityId: "$variantRankedIds",
            },
            rankedMentions: { $sum: 1 },
            rankPositionScore: { $sum: { $add: ["$rankIndex", 1] } },
          },
        },
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

  const variantStatementIds = [
    ...new Set(
      variantSelectedRows
        .map((row: any) => row?._id?.statementId)
        .concat(variantRankedRows.map((row: any) => row?._id?.statementId))
        .filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0),
    ),
  ];
  const variantEventualityIds = [
    ...new Set(
      variantSelectedRows
        .map((row: any) => row?._id?.eventualityId)
        .concat(variantRankedRows.map((row: any) => row?._id?.eventualityId))
        .filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0),
    ),
  ];

  const ids = topRaw
    .map((row: any) => row._id)
    .concat(variantStatementIds)
    .filter(Boolean);
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

  const eventualityLabels = new Map<string, string>();
  if (variantEventualityIds.length > 0) {
    const eventualitiesCol = await eventualityNodesCol();
    const eventualityDocs = await eventualitiesCol
      .find(
        { nodeId: { $in: variantEventualityIds } },
        { projection: { nodeId: 1, "payload.label": 1 } },
      )
      .toArray();
    eventualityDocs.forEach((doc: any) => {
      const key = String(doc?.nodeId ?? "");
      if (!key) return;
      const label = String(doc?.payload?.label ?? "").trim();
      if (label) {
        eventualityLabels.set(key, label);
      }
    });
  }

  const topStatements = topRaw.map((row: any) => {
    const id = String(row._id ?? "");
    return {
      id,
      title: statementMap.get(id) ?? "Statement",
      count: row.count ?? 0,
    };
  });

  const variantAggregationStatements = buildSwipeVariantAggregationReadModel({
    selectedRows: variantSelectedRows,
    rankedRows: variantRankedRows,
    statementTitles: Object.fromEntries(statementMap.entries()),
    eventualityLabels: Object.fromEntries(eventualityLabels.entries()),
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
    variantAggregation: {
      windowDays: 30,
      scope: "statement_eventuality_local",
      transparency: "visible_reviewable_non_normative",
      guardrails: {
        noTruthBoost: true,
        noPriorityBoost: true,
        noFeedOrAtlasSortingImpact: true,
        noPublishAutomationImpact: true,
      },
      statements: variantAggregationStatements,
    },
  });
}
