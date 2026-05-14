import { NextRequest, NextResponse } from "next/server";
import { ObjectId, getCol } from "@core/db/triMongo";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import { ensureEnvSuperadminSeed } from "@/lib/server/auth/superadminSeed";
import { orgsCol } from "@features/org/db";
import { editorialItemsCol } from "@features/editorial/db";
import { reportAssetsCol } from "@features/reportsAssets/db";
import { graphRepairsCol } from "@features/graphAdmin/db";
import { anlassraumCol } from "@features/anlassraum/db";
import { dossiersCol } from "@features/dossier/db";
import { buildAdminPricingControlReadModel } from "@/lib/server/pricing/adminPricingControlReadModel";

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

type SwipeVoteDoc = {
  _id?: ObjectId;
  userId?: string;
  decision?: string;
  createdAt?: Date;
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

  const swipeVotesCol = await getCol<SwipeVoteDoc>("swipe_votes");
  const swipeTotal = await swipeVotesCol.countDocuments({});
  const swipeUniqueUsersRaw = await swipeVotesCol.distinct("userId");
  const swipeUniqueUsers = swipeUniqueUsersRaw.filter(Boolean).length;
  const swipeLast30Days = await swipeVotesCol
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
    (await graphRepairsCol()).countDocuments({ status: { $in: ["pending", "open", "in_review", "blocked"] } }),
    (await editorialItemsCol())
      .aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
      .toArray(),
  ]);

  const [activeAnlassraeume, activeDossiers] = await Promise.all([
    (await anlassraumCol()).countDocuments({ status: { $ne: "archived" } }),
    (await dossiersCol()).countDocuments({ status: { $ne: "archived" } }),
  ]);

  const professionalLayerUsage = packageAgg.reduce((sum, row) => {
    const code = String(row?._id ?? "none");
    if (code === "none") return sum;
    return sum + Number(row?.count ?? 0);
  }, 0);

  const editorialCounts = editorialAgg.reduce(
    (acc: Record<string, number>, row: any) => {
      acc[String(row._id)] = row.count ?? 0;
      return acc;
    },
    {},
  );

  const pricingReadModel = buildAdminPricingControlReadModel({
    policy: {
      segment: "public_free",
      creatorType: "civic",
      verificationStatus: "unverified",
      pricingPlanKind: "public_core",
      institutionType: "none",
      publicEntityFlag: false,
      feeRuleType: "none",
      capPolicyType: "default_caps",
      overrideType: "none",
      specialOfferStatus: "none",
      pilotStatus: "none",
      source: "policy_default",
      explainability: {
        segment: {
          factors: ["segment", "verification_status"],
          note: "Globaler Start auf Public-Core-Defaults ohne stillen Override.",
        },
        plan: {
          factors: ["plan", "creator_type"],
          note: "Readmodel folgt manifestierter Segment-/Plan-Zuordnung.",
        },
        fee: {
          factors: ["funding_fee_rule", "cap_policy"],
          note: "Fee/Caps folgen dem kanonischen Guardrail-Rahmen.",
        },
        specialStatus: {
          factors: ["special_offer_status", "pilot_status", "policy_source"],
          note: "Special-/Pilotstatus bleibt transparent und auditierbar.",
        },
      },
    },
    kpiSnapshot: {
      snapshotAt: now.toISOString(),
      window: "rolling_30d",
      activeAnlassraeume,
      activeDossiers,
      professionalLayerUsage,
      fundingVolume: 0,
      fundingFeeRevenue: 0,
      exportUsage: 0,
      embedUsage: 0,
      qrUsage: 0,
      reviewUsage: editorialCounts.review ?? 0,
      factcheckUsage: editorialCounts.fact_check ?? 0,
      conversionFreeToCreator: 0,
      conversionCreatorToTeam: 0,
      conversionTeamToOrganization: 0,
      specialsUsage: 0,
      pilotUsage: 0,
      overrideUsage: 0,
    },
    sourceOfTruthHints: [
      "users.membership.edebatte.planKey",
      "users.accessTier",
      "users.b2cPlanId",
      "admin.editorialCounts",
      "anlassraum.status",
      "dossiers.status",
    ],
  });
  let pricingControlReadModel: unknown;
  if ("value" in pricingReadModel) {
    pricingControlReadModel = pricingReadModel.value;
  } else {
    pricingControlReadModel = {
      status: "invalid",
      error: pricingReadModel.error,
      issues: pricingReadModel.issues,
    };
  }

  const data = {
    totalUsers,
    activeUsers,
    newsletterOptIn,
    packages: packageAgg.map((p) => ({ code: p._id, count: p.count })),
    roles: rolesAgg.map((r) => ({ role: r._id, count: r.count })),
    registrationsLast30Days: registrations.map((r) => ({ date: r._id, count: r.count })),
    swipes: {
      total: swipeTotal,
      uniqueUsers: swipeUniqueUsers,
      last30Days: swipeLast30Days.map((r) => ({ date: r._id, count: r.count })),
    },
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
    pricingControlReadModel,
  };

  return NextResponse.json({ data });
}
