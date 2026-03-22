import { NextResponse } from "next/server";
import { assertStoreConfigured, ObjectId, coreCol } from "@core/db/triMongo";
import { readSession } from "@/utils/session";
import { buildLocalizedContentRecord } from "@/features/i18n/contentTranslations";
import {
  FOUNDER_ACCOUNT_EMAIL,
  FOUNDER_FALLBACK_DISPLAY_NAME,
  FOUNDER_FALLBACK_USER_ID,
} from "@/lib/onboarding/founderWelcome";
import {
  clean,
  deriveMessagingCapability,
  idCandidates,
  normalizeId,
  pairFilter,
  summarizePairState,
  type CannotMessageReason,
  type SocialRelationshipState,
} from "@/lib/social/relationshipState";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SocialFriendRequestDoc = {
  _id: ObjectId;
  fromUserId?: string | ObjectId | null;
  toUserId?: string | ObjectId | null;
  status?: string | null;
  createdAt?: string | Date | null;
};

type SocialMessageDoc = {
  _id: ObjectId;
  fromUserId?: string | ObjectId | null;
  toUserId?: string | ObjectId | null;
  text?: string | null;
  body?: string | null;
  kind?: string | null;
  originalLanguage?: string | null;
  originalText?: string | null;
  translations?: Record<string, string | null> | null;
  translationStatus?: "missing" | "pending" | "translated" | "failed" | string | null;
  translatedAt?: string | Date | null;
  translationProvider?: string | null;
  translationModel?: string | null;
  readAt?: string | Date | null;
  createdAt?: string | Date | null;
};

type UserDoc = {
  _id: ObjectId;
  name?: string | null;
  email?: string | null;
  profile?: {
    displayName?: string | null;
    avatarUrl?: string | null;
    publicShareId?: string | null;
    tagline?: string | null;
    bio?: string | null;
    publicLocation?: {
      city?: string | null;
      region?: string | null;
      countryCode?: string | null;
    } | null;
    topTopics?: Array<{ title?: string | null; key?: string | null }> | null;
  } | null;
};

type TargetResolution = {
  userId: string;
  idCandidates: Array<string | ObjectId>;
  targetKnown: boolean;
  displayName: string;
  avatarUrl: string | null;
  shareId: string | null;
  tagline: string | null;
  bio: string | null;
  locationLabel: string | null;
  topics: string[];
};

function toIso(value?: string | Date | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function ensureMessageText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim();
}

function displayNameFromUser(user: UserDoc | null | undefined, fallback = "Nutzer:in") {
  if (!user) return fallback;
  const profileName = clean(user.profile?.displayName);
  if (profileName) return profileName;
  const name = clean(user.name);
  if (name) return name;
  const email = clean(user.email);
  if (email) return email;
  return fallback;
}

function normalizeTargetLabel(targetUserId: string) {
  if (targetUserId === FOUNDER_FALLBACK_USER_ID) {
    return `${FOUNDER_FALLBACK_DISPLAY_NAME} · ${FOUNDER_ACCOUNT_EMAIL}`;
  }
  return "Unbekannter Kontakt";
}

function cannotMessageReasonLabel(reason: CannotMessageReason | null): string | null {
  if (reason === "incoming_request_pending") return "Anfrage zuerst annehmen";
  if (reason === "outgoing_request_pending") return "Warte auf Annahme der Anfrage";
  if (reason === "not_connected") return "Nur mit bestätigten Verbindungen möglich";
  if (reason === "target_unknown") return "Kontakt ist aktuell nicht auflösbar";
  if (reason === "self") return "Nachricht an dich selbst nicht möglich";
  return null;
}

async function resolveTarget(params: {
  usersCol: Awaited<ReturnType<typeof coreCol<UserDoc>>>;
  targetUserIdRaw: string;
  shareIdRaw: string;
}): Promise<TargetResolution | null> {
  const targetUserIdRaw = clean(params.targetUserIdRaw);
  const shareIdRaw = clean(params.shareIdRaw);

  if (!targetUserIdRaw && !shareIdRaw) return null;

  if (shareIdRaw) {
    const user = await params.usersCol.findOne(
      { "profile.publicShareId": shareIdRaw },
      {
        projection: {
          name: 1,
          email: 1,
          "profile.displayName": 1,
          "profile.avatarUrl": 1,
          "profile.publicShareId": 1,
          "profile.tagline": 1,
          "profile.bio": 1,
          "profile.publicLocation": 1,
          "profile.topTopics": 1,
        },
      },
    );
    if (!user?._id) return null;
    return {
      userId: String(user._id),
      idCandidates: idCandidates(String(user._id)),
      targetKnown: true,
      displayName: displayNameFromUser(user),
      avatarUrl: clean(user.profile?.avatarUrl) || null,
      shareId: clean(user.profile?.publicShareId) || null,
      tagline: clean(user.profile?.tagline) || null,
      bio: clean(user.profile?.bio) || null,
      locationLabel: [
        clean(user.profile?.publicLocation?.city),
        clean(user.profile?.publicLocation?.region),
      ]
        .filter(Boolean)
        .join(" · ") || null,
      topics: Array.isArray(user.profile?.topTopics)
        ? user.profile.topTopics
            .map((topic) => clean(topic?.title) || clean(topic?.key))
            .filter(Boolean)
            .slice(0, 4)
        : [],
    };
  }

  if (targetUserIdRaw === FOUNDER_FALLBACK_USER_ID) {
    return {
      userId: FOUNDER_FALLBACK_USER_ID,
      idCandidates: idCandidates(FOUNDER_FALLBACK_USER_ID),
      targetKnown: true,
      displayName: `${FOUNDER_FALLBACK_DISPLAY_NAME} · ${FOUNDER_ACCOUNT_EMAIL}`,
      avatarUrl: null,
      shareId: null,
      tagline: null,
      bio: null,
      locationLabel: null,
      topics: [],
    };
  }

  if (!ObjectId.isValid(targetUserIdRaw)) {
    return {
      userId: targetUserIdRaw,
      idCandidates: idCandidates(targetUserIdRaw),
      targetKnown: false,
      displayName: normalizeTargetLabel(targetUserIdRaw),
      avatarUrl: null,
      shareId: null,
      tagline: null,
      bio: null,
      locationLabel: null,
      topics: [],
    };
  }

  const user = await params.usersCol.findOne(
    { _id: new ObjectId(targetUserIdRaw) },
    {
      projection: {
        name: 1,
        email: 1,
        "profile.displayName": 1,
        "profile.avatarUrl": 1,
        "profile.publicShareId": 1,
        "profile.tagline": 1,
        "profile.bio": 1,
        "profile.publicLocation": 1,
        "profile.topTopics": 1,
      },
    },
  );

  if (!user?._id) {
    return {
      userId: targetUserIdRaw,
      idCandidates: idCandidates(targetUserIdRaw),
      targetKnown: false,
      displayName: normalizeTargetLabel(targetUserIdRaw),
      avatarUrl: null,
      shareId: null,
      tagline: null,
      bio: null,
      locationLabel: null,
      topics: [],
    };
  }

  return {
    userId: String(user._id),
    idCandidates: idCandidates(String(user._id)),
    targetKnown: true,
    displayName: displayNameFromUser(user),
    avatarUrl: clean(user.profile?.avatarUrl) || null,
    shareId: clean(user.profile?.publicShareId) || null,
    tagline: clean(user.profile?.tagline) || null,
    bio: clean(user.profile?.bio) || null,
    locationLabel: [
      clean(user.profile?.publicLocation?.city),
      clean(user.profile?.publicLocation?.region),
    ]
      .filter(Boolean)
      .join(" · ") || null,
    topics: Array.isArray(user.profile?.topTopics)
      ? user.profile.topTopics
          .map((topic) => clean(topic?.title) || clean(topic?.key))
          .filter(Boolean)
          .slice(0, 4)
      : [],
  };
}

async function loadThreadAndState(params: {
  userId: string;
  target: TargetResolution;
  limit: number;
}) {
  const requestCol = await coreCol<SocialFriendRequestDoc>("social_friend_requests");
  const messageCol = await coreCol<SocialMessageDoc>("social_messages");
  const usersCol = await coreCol<UserDoc>("users");

  const currentUserIds = idCandidates(params.userId);
  const currentIdSet = new Set(currentUserIds.map((candidate) => normalizeId(candidate)));
  const pairDocs = await requestCol
    .find(pairFilter(currentUserIds, params.target.idCandidates))
    .sort({ createdAt: -1, _id: -1 })
    .limit(30)
    .toArray();

  const pairState = summarizePairState(pairDocs, params.userId, params.target.userId);

  const threadDocs = await messageCol
    .find(pairFilter(currentUserIds, params.target.idCandidates))
    .sort({ createdAt: -1, _id: -1 })
    .limit(params.limit)
    .toArray();

  if (!params.target.targetKnown && (pairDocs.length > 0 || threadDocs.length > 0)) {
    params.target.targetKnown = true;
  }

  const capability = deriveMessagingCapability({
    pairState,
    currentUserId: params.userId,
    targetUserId: params.target.userId,
    targetKnown: params.target.targetKnown,
  });

  const senderIds = Array.from(
    new Set(
      threadDocs
        .map((doc) => normalizeId(doc.fromUserId))
        .filter((id) => id.length > 0 && ObjectId.isValid(id)),
    ),
  ).map((id) => new ObjectId(id));

  const senderDocs =
    senderIds.length > 0
      ? await usersCol
          .find(
            { _id: { $in: senderIds } },
            {
              projection: {
                name: 1,
                email: 1,
                "profile.displayName": 1,
                "profile.avatarUrl": 1,
              },
            },
          )
          .toArray()
      : [];

  const senderInfoById = new Map<string, { label: string; avatarUrl: string | null }>([
    [
      FOUNDER_FALLBACK_USER_ID,
      {
        label: `${FOUNDER_FALLBACK_DISPLAY_NAME} · ${FOUNDER_ACCOUNT_EMAIL}`,
        avatarUrl: null,
      },
    ],
  ]);

  for (const doc of senderDocs) {
    senderInfoById.set(String(doc._id), {
      label: displayNameFromUser(doc),
      avatarUrl: clean(doc.profile?.avatarUrl) || null,
    });
  }

  const now = new Date();
  const readUpdate = await messageCol.updateMany(
    {
      fromUserId: { $in: params.target.idCandidates },
      toUserId: { $in: currentUserIds },
      $or: [{ readAt: null }, { readAt: { $exists: false } }],
    },
    {
      $set: {
        readAt: now,
        updatedAt: now,
      },
    } as any,
  );

  const thread = threadDocs
    .map((doc) => {
      const fromId = normalizeId(doc.fromUserId);
      const sender = senderInfoById.get(fromId) ?? {
        label: "Kontakt",
        avatarUrl: null,
      };
      const text =
        (typeof doc.text === "string" && doc.text.trim()) ||
        (typeof doc.body === "string" && doc.body.trim()) ||
        "Nachricht ohne Text";
      const content = buildLocalizedContentRecord({
        originalLanguage: doc.originalLanguage,
        originalText: doc.originalText,
        fallbackOriginalText: text,
        translations: doc.translations,
        translationStatus: doc.translationStatus,
        translatedAt: doc.translatedAt,
        translationProvider: doc.translationProvider,
        translationModel: doc.translationModel,
        maxOriginalLength: 600,
        maxTranslationLength: 600,
      });
      return {
        id: String(doc._id),
        fromUserId: fromId || null,
        fromLabel: sender.label,
        fromAvatarUrl: sender.avatarUrl,
        fromSelf: currentIdSet.has(fromId),
        text: text.slice(0, 600),
        content,
        kind: typeof doc.kind === "string" ? doc.kind : "direct",
        createdAt: toIso(doc.createdAt),
      };
    })
    .reverse();

  return {
    capability,
    pairState,
    thread,
    readMarkedCount: Number(readUpdate.modifiedCount ?? 0),
  };
}

export async function GET(request: Request) {
  assertStoreConfigured("core", "api/account/social-thread.GET");

  const session = await readSession();
  const userId = clean(session?.uid);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const targetUserId = clean(params.get("targetUserId"));
  const shareId = clean(params.get("shareId"));
  const limitRaw = Number(params.get("limit") ?? 16);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(40, Math.round(limitRaw))) : 16;

  const usersCol = await coreCol<UserDoc>("users");
  const target = await resolveTarget({ usersCol, targetUserIdRaw: targetUserId, shareIdRaw: shareId });
  if (!target) {
    return NextResponse.json({ ok: false, error: "target_missing" }, { status: 400 });
  }

  if (normalizeId(target.userId) === normalizeId(userId)) {
    return NextResponse.json({ ok: false, error: "cannot_message_self" }, { status: 400 });
  }

  const { capability, pairState, thread, readMarkedCount } = await loadThreadAndState({
    userId,
    target,
    limit,
  });

  const incomingRequestId = pairState.incomingPending?._id ? String(pairState.incomingPending._id) : null;
  const outgoingRequestId = pairState.outgoingPending?._id ? String(pairState.outgoingPending._id) : null;
  const primaryTopic = target.topics?.[0] ?? null;
  const communityLabel = primaryTopic
    ? target.locationLabel
      ? `${primaryTopic} · ${target.locationLabel}`
      : `${primaryTopic} überregional`
    : target.locationLabel
      ? `Region ${target.locationLabel}`
      : null;
  const originContext =
    target.userId === FOUNDER_FALLBACK_USER_ID
      ? {
          type: "founder",
          communityKey: "founder-channel",
          communityLabel: "Founder-Channel",
          reasonLabel: "Founder-Willkommenskanal",
        }
      : {
          type: target.locationLabel ? "regional_group" : "interest_match",
          topicLabel: primaryTopic,
          regionLabel: target.locationLabel,
          communityKey: communityLabel
            ? communityLabel
                .toLowerCase()
                .replace(/[^a-z0-9äöüß]+/gi, "-")
                .replace(/^-+|-+$/g, "")
            : null,
          communityLabel,
          scope: target.locationLabel ? "regional" : "ueberregional",
          reasonLabel: primaryTopic
            ? target.locationLabel
              ? `Gemeinsam über ${primaryTopic} in ${target.locationLabel}`
              : `Gemeinsames Thema ${primaryTopic}`
            : "Kontakt aus Interessenraum",
        };

  return NextResponse.json({
    ok: true,
    context: {
      targetUserId: target.userId,
      targetShareId: target.shareId,
      targetProfileHref: target.shareId ? `/profile/${encodeURIComponent(target.shareId)}` : null,
      displayName: target.displayName,
      avatarUrl: target.avatarUrl,
      tagline: target.tagline,
      bio: target.bio,
      locationLabel: target.locationLabel,
      topics: target.topics,
      relationshipState: capability.relationshipState as SocialRelationshipState,
      canMessage: capability.canMessage,
      cannotMessageReason: capability.cannotMessageReason,
      cannotMessageReasonLabel: cannotMessageReasonLabel(capability.cannotMessageReason),
      incomingRequestId,
      outgoingRequestId,
      originContext,
    },
    thread,
    meta: {
      store: "core",
      limit,
      readMarkedCount,
    },
  });
}

export async function POST(request: Request) {
  assertStoreConfigured("core", "api/account/social-thread.POST");

  const session = await readSession();
  const userId = clean(session?.uid);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const targetUserId = clean(body?.targetUserId);
  const shareId = clean(body?.shareId);
  const text = ensureMessageText(body?.text);

  if (!text) {
    return NextResponse.json({ ok: false, error: "message_empty" }, { status: 400 });
  }
  if (text.length > 600) {
    return NextResponse.json({ ok: false, error: "message_too_long" }, { status: 400 });
  }

  const usersCol = await coreCol<UserDoc>("users");
  const target = await resolveTarget({ usersCol, targetUserIdRaw: targetUserId, shareIdRaw: shareId });
  if (!target) {
    return NextResponse.json({ ok: false, error: "target_missing" }, { status: 400 });
  }

  if (normalizeId(target.userId) === normalizeId(userId)) {
    return NextResponse.json({ ok: false, error: "cannot_message_self" }, { status: 400 });
  }

  const requestCol = await coreCol<SocialFriendRequestDoc>("social_friend_requests");
  const messageCol = await coreCol<SocialMessageDoc>("social_messages");

  const currentUserIds = idCandidates(userId);
  const pairDocs = await requestCol
    .find(pairFilter(currentUserIds, target.idCandidates))
    .sort({ createdAt: -1, _id: -1 })
    .limit(30)
    .toArray();
  const pairState = summarizePairState(pairDocs, userId, target.userId);
  const capability = deriveMessagingCapability({
    pairState,
    currentUserId: userId,
    targetUserId: target.userId,
    targetKnown: target.targetKnown,
  });

  if (!capability.canMessage) {
    return NextResponse.json(
      {
        ok: false,
        error: "cannot_message_yet",
        relationshipState: capability.relationshipState,
        cannotMessageReason: capability.cannotMessageReason,
        cannotMessageReasonLabel: cannotMessageReasonLabel(capability.cannotMessageReason),
      },
      { status: 403 },
    );
  }

  const now = new Date();
  const duplicateWindow = new Date(now.getTime() - 10_000);
  const duplicate = await messageCol.findOne(
    {
      fromUserId: { $in: currentUserIds },
      toUserId: { $in: target.idCandidates },
      kind: { $in: ["direct", "DIRECT"] },
      text,
      createdAt: { $gte: duplicateWindow },
    },
    { sort: { createdAt: -1, _id: -1 } },
  );

  if (duplicate?._id) {
    const duplicateContent = buildLocalizedContentRecord({
      originalLanguage: duplicate.originalLanguage,
      originalText: duplicate.originalText,
      fallbackOriginalText: text,
      translations: duplicate.translations,
      translationStatus: duplicate.translationStatus,
      translatedAt: duplicate.translatedAt,
      translationProvider: duplicate.translationProvider,
      translationModel: duplicate.translationModel,
      maxOriginalLength: 600,
      maxTranslationLength: 600,
    });
    return NextResponse.json({
      ok: true,
      duplicate: true,
      message: {
        id: String(duplicate._id),
        text,
        content: duplicateContent,
        kind: typeof duplicate.kind === "string" ? duplicate.kind : "direct",
        createdAt: toIso(duplicate.createdAt),
      },
      info: "Nachricht bereits gesendet.",
    });
  }

  const insertResult = await messageCol.insertOne({
    fromUserId: userId,
    toUserId: target.userId,
    text,
    originalLanguage: null,
    originalText: text,
    translations: {},
    translationStatus: "missing",
    translatedAt: null,
    translationProvider: null,
    translationModel: null,
    kind: "direct",
    createdAt: now,
    updatedAt: now,
    readAt: null,
  } as any);

  return NextResponse.json({
    ok: true,
    duplicate: false,
    message: {
      id: String(insertResult.insertedId),
      text,
      content: {
        originalLanguage: null,
        originalText: text,
        translations: {},
        translationStatus: "missing",
        translatedAt: null,
        translationProvider: null,
        translationModel: null,
      },
      kind: "direct",
      createdAt: now.toISOString(),
    },
    info: "Nachricht gesendet.",
  });
}
