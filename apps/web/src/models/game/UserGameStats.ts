import { ObjectId, coreCol } from "@core/db/triMongo";

type AwardXpOptions = {
  eventId?: string;
  badgeCode?: string;
  timezone?: string;
};

type XpEventDoc = {
  _id?: ObjectId;
  userId: ObjectId | string;
  eventId: string;
  xp: number;
  badgeCode?: string | null;
  createdAt: Date;
};

async function awardXp(userId: string, amount: number, options: AwardXpOptions = {}) {
  if (!userId) return;
  const safeAmount = Number.isFinite(amount) ? Math.floor(amount) : 0;
  if (safeAmount <= 0) return;

  const userObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
  const userKey: ObjectId | string = userObjectId ?? userId;

  if (options.eventId) {
    const events = await coreCol<XpEventDoc>("xp_events");
    const result = await events.updateOne(
      { userId: userKey, eventId: options.eventId },
      {
        $setOnInsert: {
          userId: userKey,
          eventId: options.eventId,
          xp: safeAmount,
          badgeCode: options.badgeCode ?? null,
          createdAt: new Date(),
        },
      },
      { upsert: true },
    );

    if (!result.upsertedId) {
      return;
    }
  }

  if (!userObjectId) return;
  const Users = await coreCol("users");
  await Users.updateOne(
    { _id: userObjectId },
    {
      $inc: { "usage.xp": safeAmount, "stats.xp": safeAmount },
      $set: { updatedAt: new Date() },
    },
  );
}

const UserGameStats = {
  awardXp,
};

export default UserGameStats;
