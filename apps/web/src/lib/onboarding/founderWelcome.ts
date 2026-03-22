import { assertStoreConfigured, getCol, ObjectId } from "@core/db/triMongo";
import { runContentTranslationProduction } from "@/features/i18n/contentTranslationProduction";

export const FOUNDER_ACCOUNT_EMAIL = "rgf@voiceopengov.org";
export const FOUNDER_WELCOME_MESSAGE_KIND = "founder_welcome";
export const FOUNDER_FALLBACK_USER_ID = "founder:voiceopengov";
export const FOUNDER_FALLBACK_DISPLAY_NAME = "Ricky";
// Social/onboarding founder flows are part of the operational core store.

const FOUNDER_DEFAULT_NAME = FOUNDER_FALLBACK_DISPLAY_NAME;

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
    onboarding?: {
      founderFriendRequestSentAt?: string | Date | null;
      founderWelcomeMessageSentAt?: string | Date | null;
    } | null;
  };
};

type FounderFlowResult = {
  targetUserId: string;
  founderUserId: string | null;
  founderDisplayName: string | null;
  friendRequestCreated: boolean;
  friendRequestExists: boolean;
  welcomeMessageCreated: boolean;
  welcomeMessageExists: boolean;
  onboardingMarkerUpdated: boolean;
  skipped?: boolean;
  reason?: string;
};

type FounderFlowOptions = {
  source?: "register" | "backfill" | "admin_api" | "manual";
};

type FounderBackfillOptions = {
  userId?: string | ObjectId;
  limit?: number;
  includeAlreadyMarked?: boolean;
  source?: "backfill" | "admin_api" | "manual";
};

type FounderBackfillResult = {
  processed: number;
  skipped: number;
  friendRequestsCreated: number;
  welcomeMessagesCreated: number;
  onboardingMarkersUpdated: number;
  users: FounderFlowResult[];
  founderUserId: string | null;
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
  assertStoreConfigured("core", "onboarding/founderWelcome.resolveFounderAccount");
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
  return ensureFounderWelcomeForUser(newUserId, { source: "register" });
}

function toObjectId(value: string | ObjectId) {
  if (value instanceof ObjectId) return value;
  if (!ObjectId.isValid(value)) return null;
  return new ObjectId(value);
}

export async function ensureFounderWelcomeForUser(
  targetUserIdInput: string | ObjectId,
  options: FounderFlowOptions = {},
): Promise<FounderFlowResult> {
  assertStoreConfigured("core", "onboarding/founderWelcome.ensureFounderWelcomeForUser");
  const source = options.source ?? "manual";
  const targetUserId = toObjectId(targetUserIdInput);
  if (!targetUserId) {
    return {
      targetUserId: String(targetUserIdInput),
      founderUserId: null,
      founderDisplayName: null,
      friendRequestCreated: false,
      friendRequestExists: false,
      welcomeMessageCreated: false,
      welcomeMessageExists: false,
      onboardingMarkerUpdated: false,
      skipped: true,
      reason: "invalid_user_id",
    };
  }

  const usersCol = await getCol("users");
  const targetDoc = await usersCol.findOne(
    { _id: targetUserId },
    { projection: { profile: 1, email: 1 } },
  );
  if (!targetDoc?._id) {
    return {
      targetUserId: String(targetUserId),
      founderUserId: null,
      founderDisplayName: null,
      friendRequestCreated: false,
      friendRequestExists: false,
      welcomeMessageCreated: false,
      welcomeMessageExists: false,
      onboardingMarkerUpdated: false,
      skipped: true,
      reason: "user_not_found",
    };
  }

  const founder = await resolveFounderAccount(targetUserId);
  const founderMissing = !founder?.userId;
  if (founderMissing) {
    console.info("[founder-welcome] founder not found", {
      source,
      targetUserId: String(targetUserId),
      fallbackFromUserId: FOUNDER_FALLBACK_USER_ID,
    });
  }

  const founderId = founderMissing ? FOUNDER_FALLBACK_USER_ID : String(founder.userId);
  const founderDisplayName =
    founder?.displayName?.trim() ||
    FOUNDER_FALLBACK_DISPLAY_NAME;
  const userId = String(targetUserId);
  if (!founderMissing && founderId === userId) {
    return {
      targetUserId: userId,
      founderUserId: founderId,
      founderDisplayName: founderDisplayName,
      friendRequestCreated: false,
      friendRequestExists: false,
      welcomeMessageCreated: false,
      welcomeMessageExists: false,
      onboardingMarkerUpdated: false,
      skipped: true,
      reason: "target_is_founder",
    };
  }

  const now = new Date();
  const friendRequestsCol = await getCol("social_friend_requests");
  const messagesCol = await getCol("social_messages");

  let friendRequestExists = false;
  let friendRequestCreated = false;
  const welcomeText = buildFounderWelcomeText(founderDisplayName);
  const welcomeContentLifecycle = await runContentTranslationProduction({
    originalText: welcomeText,
    originalLanguage: "de",
    maxLength: 600,
  });
  const welcomeContent = welcomeContentLifecycle.content ?? {
    originalLanguage: "de",
    originalText: welcomeText,
    translations: {},
    translationStatus: "missing" as const,
    translatedAt: null,
    translationProvider: null,
    translationModel: null,
  };
  const existingRequest = await friendRequestsCol.findOne({
    fromUserId: founderId,
    toUserId: userId,
  });
  if (existingRequest?._id) {
    friendRequestExists = true;
  } else {
    await friendRequestsCol.insertOne({
      fromUserId: founderId,
      toUserId: userId,
      status: "pending",
      source: FOUNDER_WELCOME_MESSAGE_KIND,
      message: "Willkommen bei eDebatte",
      createdAt: now,
      updatedAt: now,
    });
    friendRequestExists = true;
    friendRequestCreated = true;
  }

  const messageWrite = await messagesCol.updateOne(
    { fromUserId: founderId, toUserId: userId, kind: FOUNDER_WELCOME_MESSAGE_KIND },
    {
      $setOnInsert: {
        text: welcomeText,
        originalLanguage: welcomeContent.originalLanguage ?? "de",
        originalText: welcomeContent.originalText ?? welcomeText,
        translations: welcomeContent.translations ?? {},
        translationStatus: welcomeContent.translationStatus ?? "missing",
        translatedAt: welcomeContent.translatedAt ?? null,
        translationProvider: welcomeContent.translationProvider ?? null,
        translationModel: welcomeContent.translationModel ?? null,
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
  const welcomeMessageCreated = Boolean(messageWrite.upsertedId);
  const welcomeMessageExists = welcomeMessageCreated || messageWrite.matchedCount > 0;

  const setOps: Record<string, unknown> = {};
  if (
    friendRequestExists &&
    !targetDoc?.profile?.onboarding?.founderFriendRequestSentAt
  ) {
    setOps["profile.onboarding.founderFriendRequestSentAt"] = now;
  }
  if (
    welcomeMessageExists &&
    !targetDoc?.profile?.onboarding?.founderWelcomeMessageSentAt
  ) {
    setOps["profile.onboarding.founderWelcomeMessageSentAt"] = now;
  }
  const onboardingMarkerUpdated = Object.keys(setOps).length > 0;
  if (onboardingMarkerUpdated) {
    setOps.updatedAt = now;
    await usersCol.updateOne({ _id: targetUserId }, { $set: setOps });
  }

  const result: FounderFlowResult = {
    targetUserId: userId,
    founderUserId: founderId,
    founderDisplayName,
    friendRequestCreated,
    friendRequestExists,
    welcomeMessageCreated,
    welcomeMessageExists,
    onboardingMarkerUpdated,
    reason: founderMissing ? "founder_not_found_fallback" : undefined,
  };

  console.info("[founder-welcome] ensured", {
    source,
    ...result,
  });

  return result;
}

export async function backfillFounderWelcomeForExistingUsers(
  options: FounderBackfillOptions = {},
): Promise<FounderBackfillResult> {
  assertStoreConfigured("core", "onboarding/founderWelcome.backfillFounderWelcomeForExistingUsers");
  const usersCol = await getCol<FounderCandidateDoc>("users");
  const source = options.source ?? "backfill";
  const limit = Math.max(1, Math.min(500, Number(options.limit) || 150));

  const founder = await resolveFounderAccount(null);
  const founderUserId = founder?.userId ? String(founder.userId) : null;
  if (!founderUserId) {
    console.info("[founder-welcome-backfill] founder not found");
    return {
      processed: 0,
      skipped: 0,
      friendRequestsCreated: 0,
      welcomeMessagesCreated: 0,
      onboardingMarkersUpdated: 0,
      users: [],
      founderUserId: null,
    };
  }

  let targetIds: ObjectId[] = [];
  if (options.userId) {
    const oid = toObjectId(options.userId);
    if (oid && String(oid) !== founderUserId) {
      targetIds = [oid];
    }
  } else if (options.includeAlreadyMarked) {
    const docs = await usersCol
      .find(
        { _id: { $ne: new ObjectId(founderUserId) } },
        { projection: { _id: 1 } },
      )
      .limit(limit)
      .toArray();
    targetIds = docs.map((doc) => doc._id);
  } else {
    const docs = await usersCol
      .find(
        {
          _id: { $ne: new ObjectId(founderUserId) },
          $or: [
            { "profile.onboarding.founderFriendRequestSentAt": { $exists: false } },
            { "profile.onboarding.founderWelcomeMessageSentAt": { $exists: false } },
          ],
        },
        { projection: { _id: 1 } },
      )
      .limit(limit)
      .toArray();
    targetIds = docs.map((doc) => doc._id);
  }

  const users: FounderFlowResult[] = [];
  let skipped = 0;
  let friendRequestsCreated = 0;
  let welcomeMessagesCreated = 0;
  let onboardingMarkersUpdated = 0;

  for (const targetId of targetIds) {
    const result = await ensureFounderWelcomeForUser(targetId, { source });
    users.push(result);
    if (result.skipped) {
      skipped += 1;
      continue;
    }
    if (result.friendRequestCreated) friendRequestsCreated += 1;
    if (result.welcomeMessageCreated) welcomeMessagesCreated += 1;
    if (result.onboardingMarkerUpdated) onboardingMarkersUpdated += 1;
  }

  const summary: FounderBackfillResult = {
    processed: users.length,
    skipped,
    friendRequestsCreated,
    welcomeMessagesCreated,
    onboardingMarkersUpdated,
    users,
    founderUserId,
  };

  console.info("[founder-welcome-backfill] completed", {
    source,
    ...summary,
  });
  return summary;
}
