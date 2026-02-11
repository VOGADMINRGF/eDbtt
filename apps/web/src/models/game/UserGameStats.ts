import { randomUUID } from "crypto";
import { coreCol, ObjectId } from "@core/db/triMongo";
import type { EngagementLevel } from "@features/user/engagement";
import { getEngagementLevel } from "@features/user/engagement";
import type { XpEventType } from "@features/user/xp";

type AwardXpOptions = {
  badgeCode?: string;
  eventId?: string;
  eventType?: XpEventType | "custom";
  timezone?: string;
  metadata?: Record<string, unknown>;
};

type XpEventDoc = {
  _id?: ObjectId;
  userId: ObjectId;
  eventId: string;
  type: XpEventType | "custom";
  deltaXp: number;
  badgeCode?: string;
  timezone?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
};

type UserStatsDoc = {
  _id: ObjectId;
  engagementXp?: number;
  engagementLevel?: EngagementLevel | string;
  usage?: { xp?: number };
  stats?: { xp?: number; engagementLevel?: EngagementLevel | string };
};

type AwardXpResult = {
  awarded: boolean;
  eventId: string;
  xp: number;
  level: EngagementLevel;
};

function parsePositiveXp(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function resolveXp(doc: UserStatsDoc | null): number {
  if (!doc) return 0;
  if (typeof doc.engagementXp === "number") return doc.engagementXp;
  if (typeof doc.usage?.xp === "number") return doc.usage.xp;
  if (typeof doc.stats?.xp === "number") return doc.stats.xp;
  return 0;
}

async function readCurrentXp(userId: ObjectId): Promise<{ xp: number; level: EngagementLevel }> {
  const Users = await coreCol<UserStatsDoc>("users");
  const doc = await Users.findOne(
    { _id: userId },
    { projection: { engagementXp: 1, usage: 1, stats: 1 } },
  );
  const xp = resolveXp(doc);
  return { xp, level: getEngagementLevel(xp) };
}

const UserGameStats = {
  async awardXp(userId: string, amount: number, options: AwardXpOptions = {}): Promise<AwardXpResult> {
    if (!ObjectId.isValid(userId)) {
      return { awarded: false, eventId: options.eventId ?? "", xp: 0, level: "interessiert" };
    }

    const deltaXp = parsePositiveXp(amount);
    if (deltaXp <= 0) {
      const current = await readCurrentXp(new ObjectId(userId));
      return {
        awarded: false,
        eventId: options.eventId ?? "",
        xp: current.xp,
        level: current.level,
      };
    }

    const oid = new ObjectId(userId);
    const eventId = options.eventId?.trim() || randomUUID();
    const now = new Date();

    const XpEvents = await coreCol<XpEventDoc>("user_xp_events");
    const insertResult = await XpEvents.updateOne(
      { userId: oid, eventId },
      {
        $setOnInsert: {
          userId: oid,
          eventId,
          type: options.eventType ?? "custom",
          deltaXp,
          badgeCode: options.badgeCode,
          timezone: options.timezone,
          metadata: options.metadata,
          createdAt: now,
        },
      },
      { upsert: true },
    );

    if (!insertResult.upsertedCount) {
      const current = await readCurrentXp(oid);
      return { awarded: false, eventId, xp: current.xp, level: current.level };
    }

    const Users = await coreCol<UserStatsDoc>("users");
    const userAfter = await Users.findOneAndUpdate(
      { _id: oid },
      {
        $inc: {
          engagementXp: deltaXp,
          "usage.xp": deltaXp,
          "stats.xp": deltaXp,
        },
      },
      {
        returnDocument: "after",
        projection: { engagementXp: 1, usage: 1, stats: 1 },
      },
    );

    const xp = resolveXp(userAfter);
    const level = getEngagementLevel(xp);

    await Users.updateOne(
      { _id: oid },
      {
        $set: {
          engagementLevel: level,
          "stats.engagementLevel": level,
        },
      },
    );

    return { awarded: true, eventId, xp, level };
  },

  async rebuildXpFromHistory(userId: string): Promise<{ xp: number; level: EngagementLevel }> {
    if (!ObjectId.isValid(userId)) {
      return { xp: 0, level: "interessiert" };
    }
    const oid = new ObjectId(userId);
    const XpEvents = await coreCol<XpEventDoc>("user_xp_events");
    const [agg] = await XpEvents
      .aggregate<{ totalXp: number }>([
        { $match: { userId: oid } },
        { $group: { _id: null, totalXp: { $sum: "$deltaXp" } } },
      ])
      .toArray();

    const xp = parsePositiveXp(agg?.totalXp ?? 0);
    const level = getEngagementLevel(xp);

    const Users = await coreCol<UserStatsDoc>("users");
    await Users.updateOne(
      { _id: oid },
      {
        $set: {
          engagementXp: xp,
          engagementLevel: level,
          "usage.xp": xp,
          "stats.xp": xp,
          "stats.engagementLevel": level,
        },
      },
    );

    return { xp, level };
  },
};

export default UserGameStats;
