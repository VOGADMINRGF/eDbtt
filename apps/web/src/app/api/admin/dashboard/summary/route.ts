import { NextRequest, NextResponse } from "next/server";
import { ObjectId, getCol } from "@core/db/triMongo";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import { ensureEnvSuperadminSeed } from "@/lib/server/auth/superadminSeed";
import { orgsCol } from "@features/org/db";
import { editorialItemsCol } from "@features/editorial/db";
import { reportAssetsCol } from "@features/reportsAssets/db";
import { graphRepairsCol } from "@features/graphAdmin/db";

type UserDoc = {
  _id: ObjectId;
  roles?: string[];
  role?: string | null;
  createdAt?: Date;
  lastLoginAt?: Date;
  stats?: { lastSeenAt?: Date };
  membership?: any;
  settings?: { newsletterOptIn?: boolean | null };
  newsletterOptIn?: boolean | null;
};

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  // Bootstrap "fixed" superadmin from env (dev/staging convenience).
  await ensureEnvSuperadminSeed().catch((err) => console.warn("[admin.summary] ensureEnvSuperadminSeed failed", err));

  const users = await getCol<UserDoc>("users");
  const now = new Date();
  const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const totalUsers = await users.countDocuments({});

  const activeUsers = await users.countDocuments({
    $or: [{ lastLoginAt: { $gte: since } }, { "stats.lastSeenAt": { $gte: since } }],
  });

  const newsletterOptIn = await users.countDocuments({
    $or: [
      { "settings.newsletterOptIn": true },
      { newsletterOptIn: true },
    ],
  });

  const packageAgg = await users
    .aggregate([
      {
        $project: {
          pkg: "$membership.edebatte.planKey",
        },
      },
      { $group: { _id: { $ifNull: ["$pkg", "none"] }, count: { $sum: 1 } } },
    ])
    .toArray();

  const rolesAgg = await users
    .aggregate([
      {
        $project: {
          roles: {
            $cond: [
              { $isArray: "$roles" },
              "$roles",
              { $cond: [{ $ifNull: ["$role", false] }, ["$role"], []] },
            ],
          },
        },
      },
      { $unwind: "$roles" },
      { $group: { _id: "$roles", count: { $sum: 1 } } },
    ])
    .toArray();

  const registrations = await users
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
    .toArray();

  const [orgsTotal, reportAssetsTotal, pendingRepairs, editorialAgg] = await Promise.all([
    (await orgsCol()).countDocuments({ $or: [{ archivedAt: { $exists: false } }, { archivedAt: null }] }),
    (await reportAssetsCol()).countDocuments({}),
    (await graphRepairsCol()).countDocuments({ status: "pending" }),
    (await editorialItemsCol())
      .aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
      .toArray(),
  ]);

  const editorialCounts = editorialAgg.reduce(
    (acc: Record<string, number>, row: any) => {
      acc[String(row._id)] = row.count ?? 0;
      return acc;
    },
    {},
  );

  const data = {
    totalUsers,
    activeUsers,
    newsletterOptIn,
    packages: packageAgg.map((p) => ({ code: p._id, count: p.count })),
    roles: rolesAgg.map((r) => ({ role: r._id, count: r.count })),
    registrationsLast30Days: registrations.map((r) => ({ date: r._id, count: r.count })),
    orgsTotal,
    reportAssetsTotal,
    pendingGraphRepairs: pendingRepairs,
    editorialCounts: {
      triage: editorialCounts.triage ?? 0,
      review: editorialCounts.review ?? 0,
      fact_check: editorialCounts.fact_check ?? 0,
      ready: editorialCounts.ready ?? 0,
      published: editorialCounts.published ?? 0,
      rejected: editorialCounts.rejected ?? 0,
    },
  };

  return NextResponse.json({ data });
}
