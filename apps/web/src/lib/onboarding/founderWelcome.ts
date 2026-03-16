import { getCol, ObjectId } from "@core/db/triMongo";

export const FOUNDER_ACCOUNT_EMAIL = "rgf@voiceopengov.org";
export const FOUNDER_WELCOME_MESSAGE_KIND = "founder_welcome";

const FOUNDER_DEFAULT_NAME = "Ricky";

function buildFounderWelcomeText(founderName?: string | null) {
  const safeName = founderName?.trim() || FOUNDER_DEFAULT_NAME;
  return `Willkommen bei eDebatte. Ich bin ${safeName}, Gründer von voiceopengov. Vervollständige kurz dein Profil, wähle mindestens 3 Interessen und ergänze deinen Ort. Danach priorisieren wir Debatten und Kontakte passender für dich.`;
}

type FounderCandidateDoc = {
  _id: ObjectId;
  email?: string | null;
  role?: string | null;
  roles?: Array<string | { role?: string | null }> | null;
  systemAccountType?: string | null;
  profile?: {
    displayName?: string | null;
    systemAccountType?: string | null;
  };
};

type FounderFlowResult = {
  founderUserId: string | null;
  founderDisplayName: string | null;
  friendRequestCreated: boolean;
  welcomeMessageCreated: boolean;
};

function normalizeRole(value: unknown) {
  if (!value) return "";
  if (typeof value === "string") return value.trim().toLowerCase();
  if (typeof value === "object" && value && "role" in (value as Record<string, unknown>)) {
    const role = (value as Record<string, unknown>).role;
    return typeof role === "string" ? role.trim().toLowerCase() : "";
  }
  return "";
}

function founderCandidateScore(user: FounderCandidateDoc) {
  let score = 0;
  const email = (user.email ?? "").trim().toLowerCase();
  const directRoles = [normalizeRole(user.role), ...(Array.isArray(user.roles) ? user.roles.map(normalizeRole) : [])];
  const roleSet = new Set(directRoles.filter(Boolean));
  const systemType = (user.systemAccountType ?? user.profile?.systemAccountType ?? "").trim().toLowerCase();

  if (email === FOUNDER_ACCOUNT_EMAIL) score += 100;
  if (systemType === "founder") score += 80;
  if (roleSet.has("admin") || roleSet.has("superadmin")) score += 35;
  if (roleSet.has("staff")) score += 10;
  return score;
}

export async function resolveFounderAccount(excludeUserId?: ObjectId | null) {
  const users = await getCol<FounderCandidateDoc>("users");
  const filters: Array<Record<string, unknown>> = [
    { email: FOUNDER_ACCOUNT_EMAIL },
    { systemAccountType: "founder" },
    { "profile.systemAccountType": "founder" },
    { role: { $in: ["admin", "superadmin"] } },
    { roles: "admin" },
    { roles: "superadmin" },
  ];

  const query: Record<string, unknown> = { $or: filters };
  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }

  const candidates = await users
    .find(query, {
      projection: {
        email: 1,
        role: 1,
        roles: 1,
        systemAccountType: 1,
        "profile.displayName": 1,
        "profile.systemAccountType": 1,
      },
    })
    .limit(24)
    .toArray();

  const ranked = candidates
    .map((candidate) => ({ candidate, score: founderCandidateScore(candidate) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const top = ranked[0]?.candidate ?? null;
  if (!top?._id) return null;

  const founderDisplayName =
    (typeof top.profile?.displayName === "string" && top.profile.displayName.trim()) ||
    (typeof top.email === "string" && top.email.trim()) ||
    "Founder";

  return {
    userId: top._id,
    displayName: founderDisplayName,
  };
}

export async function ensureFounderWelcomeFlow(newUserId: ObjectId): Promise<FounderFlowResult> {
  const founder = await resolveFounderAccount(newUserId);
  if (!founder?.userId) {
    return {
      founderUserId: null,
      founderDisplayName: null,
      friendRequestCreated: false,
      welcomeMessageCreated: false,
    };
  }

  const founderId = String(founder.userId);
  const userId = String(newUserId);
  const now = new Date();
  const friendRequestsCol = await getCol("social_friend_requests");
  const messagesCol = await getCol("social_messages");

  const existingRequest = await friendRequestsCol.findOne({
    fromUserId: founderId,
    toUserId: userId,
  });
  let friendRequestCreated = false;
  if (!existingRequest?._id) {
    await friendRequestsCol.insertOne({
      fromUserId: founderId,
      toUserId: userId,
      status: "pending",
      source: FOUNDER_WELCOME_MESSAGE_KIND,
      message: "Willkommen bei eDebatte",
      createdAt: now,
      updatedAt: now,
    });
    friendRequestCreated = true;
  }

  const messageWrite = await messagesCol.updateOne(
    { fromUserId: founderId, toUserId: userId, kind: FOUNDER_WELCOME_MESSAGE_KIND },
    {
      $setOnInsert: {
        text: buildFounderWelcomeText(founder.displayName),
        kind: FOUNDER_WELCOME_MESSAGE_KIND,
        readAt: null,
        createdAt: now,
      },
      $set: {
        updatedAt: now,
      },
    },
    { upsert: true },
  );

  return {
    founderUserId: founderId,
    founderDisplayName: founder.displayName ?? null,
    friendRequestCreated,
    welcomeMessageCreated: Boolean(messageWrite.upsertedId),
  };
}
