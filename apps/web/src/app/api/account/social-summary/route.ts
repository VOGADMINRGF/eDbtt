import { NextResponse } from "next/server";
import { assertStoreConfigured, ObjectId, coreCol } from "@core/db/triMongo";
import { readSession } from "@/utils/session";
import { buildLocalizedContentRecord } from "@/features/i18n/contentTranslations";
import {
  ensureFounderWelcomeForUser,
  FOUNDER_ACCOUNT_EMAIL,
  FOUNDER_FALLBACK_DISPLAY_NAME,
  FOUNDER_FALLBACK_USER_ID,
} from "@/lib/onboarding/founderWelcome";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SocialFriendRequestDoc = {
  _id: ObjectId;
  fromUserId?: string | ObjectId | null;
  toUserId?: string | ObjectId | null;
  status?: "pending" | "accepted" | "rejected" | "canceled" | null;
  source?: string | null;
  message?: string | null;
  createdAt?: string | Date | null;
};

type SocialMessageDoc = {
  _id: ObjectId;
  fromUserId?: string | ObjectId | null;
  toUserId?: string | ObjectId | null;
  text?: string | null;
  body?: string | null;
  kind?: "direct" | "founder_welcome" | "referral_signup" | "system_onboarding" | string | null;
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

type MessageType = "founder" | "system" | "direct";
type RequestType = "user" | "founder" | "system";
type OriginType = "interest_match" | "dossier" | "topic_round" | "regional_group" | "founder" | "system";
type OriginScope = "regional" | "ueberregional";
type OriginContext = {
  type: OriginType;
  topicKey?: string | null;
  topicLabel?: string | null;
  dossierId?: string | null;
  dossierTitle?: string | null;
  regionKey?: string | null;
  regionLabel?: string | null;
  communityKey?: string | null;
  communityLabel?: string | null;
  scope?: OriginScope | null;
  reasonLabel?: string | null;
};

type UserDoc = {
  _id: ObjectId;
  name?: string | null;
  email?: string | null;
  profile?: {
    displayName?: string | null;
    avatarUrl?: string | null;
    publicShareId?: string | null;
    publicLocation?: {
      city?: string | null;
      region?: string | null;
    } | null;
    topTopics?: Array<{ key?: string | null; title?: string | null }> | null;
  } | null;
};

function toIso(value?: string | Date | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function userMatchFilter(userId: string) {
  const filters: Array<Record<string, unknown>> = [{ toUserId: userId }];
  if (ObjectId.isValid(userId)) {
    filters.push({ toUserId: new ObjectId(userId) });
  }
  return filters.length === 1 ? filters[0] : { $or: filters };
}

function normalizeId(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value instanceof ObjectId) return value.toHexString();
  return String(value);
}

type SenderInfo = {
  label: string;
  avatarUrl: string | null;
  shareId: string | null;
  topicLabels: string[];
  topicKeys: string[];
  city: string | null;
  region: string | null;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeTopicList(input: unknown): Array<{ key: string; label: string }> {
  if (!Array.isArray(input)) return [];
  const seen = new Set<string>();
  const list: Array<{ key: string; label: string }> = [];
  for (const entry of input) {
    const key = clean((entry as { key?: unknown } | null)?.key).toLowerCase();
    const label = clean((entry as { title?: unknown } | null)?.title) || key;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    list.push({ key, label });
  }
  return list;
}

function normalizeRegionLabel(city?: string | null, region?: string | null) {
  const cityLabel = clean(city);
  const regionLabel = clean(region);
  if (cityLabel && regionLabel && cityLabel.toLowerCase() !== regionLabel.toLowerCase()) {
    return `${cityLabel} · ${regionLabel}`;
  }
  return cityLabel || regionLabel || null;
}

function classifyRequestType(params: { source?: string | null; fromId: string }): RequestType {
  const source = clean(params.source).toLowerCase();
  if (
    params.fromId === FOUNDER_FALLBACK_USER_ID ||
    source === "founder_welcome" ||
    source.includes("founder")
  ) {
    return "founder";
  }
  if (source.includes("system") || source.includes("referral") || source.includes("onboarding")) {
    return "system";
  }
  return "user";
}

function parseOriginContextFromSource(source?: string | null): Partial<OriginContext> {
  const normalized = clean(source).toLowerCase();
  if (!normalized) return {};
  if (normalized === "founder_welcome") {
    return {
      type: "founder",
      communityKey: "founder-channel",
      communityLabel: "Founder-Channel",
      reasonLabel: "Founder-Willkommenskanal",
    };
  }
  if (normalized.includes("system") || normalized.includes("referral") || normalized.includes("onboarding")) {
    return {
      type: "system",
      communityKey: "system-channel",
      communityLabel: "System-Hinweise",
      reasonLabel: "System- oder Onboarding-Hinweis",
    };
  }
  if (normalized.startsWith("dossier:")) {
    const [, dossierId] = normalized.split(":");
    return {
      type: "dossier",
      dossierId: dossierId || null,
      reasonLabel: "Entstanden aus Dossier-Kontext",
    };
  }
  if (normalized.startsWith("topic_round:")) {
    return {
      type: "topic_round",
      reasonLabel: "Entstanden aus gemeinsamer Runde",
    };
  }
  return {};
}

function buildOriginContext(params: {
  source?: string | null;
  kind?: string | null;
  meTopicKeys: Set<string>;
  senderTopicKeys: string[];
  senderTopicLabels: string[];
  meRegionKey: string | null;
  senderRegionKey: string | null;
  senderRegionLabel: string | null;
}): OriginContext {
  const fromSource = parseOriginContextFromSource(params.source);
  if (params.kind === "founder_welcome" || fromSource.type === "founder") {
    return {
      type: "founder",
      communityKey: "founder-channel",
      communityLabel: "Founder-Channel",
      reasonLabel: "Founder-Willkommenskanal",
    };
  }
  if (fromSource.type === "system") {
    return {
      type: "system",
      communityKey: "system-channel",
      communityLabel: "System-Hinweise",
      reasonLabel: "System- oder Onboarding-Hinweis",
    };
  }

  const sharedTopicKey = params.senderTopicKeys.find((key) => params.meTopicKeys.has(key)) ?? null;
  const sharedTopicLabel = sharedTopicKey
    ? params.senderTopicLabels[params.senderTopicKeys.indexOf(sharedTopicKey)] || sharedTopicKey
    : null;
  const hasRegionalOverlap =
    Boolean(params.meRegionKey) && Boolean(params.senderRegionKey) && params.meRegionKey === params.senderRegionKey;
  const regionKey = hasRegionalOverlap ? params.senderRegionKey : null;
  const regionLabel = hasRegionalOverlap ? params.senderRegionLabel : null;

  if (hasRegionalOverlap) {
    const communityLabel = sharedTopicLabel
      ? `${sharedTopicLabel} · ${regionLabel}`
      : `Region ${regionLabel}`;
    return {
      type: "regional_group",
      topicKey: sharedTopicKey,
      topicLabel: sharedTopicLabel,
      regionKey,
      regionLabel,
      communityKey: slugify(communityLabel),
      communityLabel,
      scope: "regional",
      reasonLabel: sharedTopicLabel
        ? `Gemeinsam über ${sharedTopicLabel} in ${regionLabel}`
        : `Gleiche Region ${regionLabel}`,
      ...fromSource,
    };
  }

  if (sharedTopicLabel) {
    const communityLabel = `${sharedTopicLabel} überregional`;
    return {
      type: "interest_match",
      topicKey: sharedTopicKey,
      topicLabel: sharedTopicLabel,
      communityKey: slugify(communityLabel),
      communityLabel,
      scope: "ueberregional",
      reasonLabel: `Gemeinsames Thema ${sharedTopicLabel}`,
      ...fromSource,
    };
  }

  return {
    type: fromSource.type ?? "interest_match",
    communityKey: fromSource.communityKey ?? null,
    communityLabel: fromSource.communityLabel ?? null,
    reasonLabel: fromSource.reasonLabel ?? "Kontakt aus gemeinsamem Interessenraum",
    dossierId: fromSource.dossierId ?? null,
    dossierTitle: fromSource.dossierTitle ?? null,
  };
}

function resolveSenderInfo(params: {
  fromId: string;
  kind?: string | null;
  source?: string | null;
  senderInfoById: Map<string, SenderInfo>;
}): SenderInfo {
  if (params.senderInfoById.has(params.fromId)) {
    return (
      params.senderInfoById.get(params.fromId) ?? {
        label: "Nutzer:in",
        avatarUrl: null,
        shareId: null,
        topicLabels: [],
        topicKeys: [],
        city: null,
        region: null,
      }
    );
  }
  if (
    params.fromId === FOUNDER_FALLBACK_USER_ID ||
    params.kind === "founder_welcome" ||
    params.source === "founder_welcome"
  ) {
    return {
      label: `${FOUNDER_FALLBACK_DISPLAY_NAME} · ${FOUNDER_ACCOUNT_EMAIL}`,
      avatarUrl: null,
      shareId: null,
      topicLabels: [],
      topicKeys: [],
      city: null,
      region: null,
    };
  }
  return {
    label: "Unbekannter Kontakt",
    avatarUrl: null,
    shareId: null,
    topicLabels: [],
    topicKeys: [],
    city: null,
    region: null,
  };
}

function classifyMessageType(kind?: string | null): MessageType {
  const normalized = clean(kind).toLowerCase();
  if (normalized === "founder_welcome") return "founder";
  if (normalized === "referral_signup" || normalized === "system_onboarding") return "system";
  return "direct";
}

export async function GET() {
  // Founder/social/inbox collections are intentionally stored in triMongo core.
  assertStoreConfigured("core", "api/account/social-summary");
  const session = await readSession();
  const userId = session?.uid ?? null;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  let founderFlow:
    | "ensured"
    | "already_present"
    | "founder_not_found_fallback"
    | "target_is_founder"
    | "failed" = "already_present";
  try {
    const founderResult = await ensureFounderWelcomeForUser(userId, { source: "manual" });
    if (founderResult.skipped) {
      founderFlow = founderResult.reason === "target_is_founder" ? "target_is_founder" : "already_present";
    } else if (founderResult.reason === "founder_not_found_fallback") {
      founderFlow = "founder_not_found_fallback";
    } else if (founderResult.friendRequestCreated || founderResult.welcomeMessageCreated) {
      founderFlow = "ensured";
    } else {
      founderFlow = "already_present";
    }
  } catch (error) {
    founderFlow = "failed";
    console.error("[social-summary] founder ensure failed", { userId, error });
  }

  const requestFilter = userMatchFilter(userId);
  const pendingRequestFilter = {
    $and: [
      requestFilter,
      {
        $or: [{ status: "pending" }, { status: "PENDING" }],
      },
    ],
  };
  const unreadMessageFilter = {
    $and: [
      userMatchFilter(userId),
      {
        $or: [{ readAt: null }, { readAt: { $exists: false } }],
      },
    ],
  };
  const unreadDirectFilter = {
    $and: [
      unreadMessageFilter,
      {
        $or: [{ kind: "direct" }, { kind: "DIRECT" }, { kind: null }, { kind: { $exists: false } }],
      },
    ],
  };
  const unreadSystemFilter = {
    $and: [
      unreadMessageFilter,
      {
        kind: {
          $in: ["founder_welcome", "referral_signup", "system_onboarding", "FOUNDER_WELCOME", "REFERRAL_SIGNUP", "SYSTEM_ONBOARDING"],
        },
      },
    ],
  };

  const requestCol = await coreCol<SocialFriendRequestDoc>("social_friend_requests");
  const messageCol = await coreCol<SocialMessageDoc>("social_messages");
  const usersCol = await coreCol<UserDoc>("users");

  const NON_USER_REQUEST_SOURCES = [
    "founder_welcome",
    "FOUNDER_WELCOME",
    "system_onboarding",
    "SYSTEM_ONBOARDING",
    "referral_signup",
    "REFERRAL_SIGNUP",
  ];
  const userPendingRequestFilter = {
    $and: [
      pendingRequestFilter,
      {
        $or: [
          { source: { $exists: false } },
          { source: null },
          { source: { $nin: NON_USER_REQUEST_SOURCES } },
        ],
      },
    ],
  };

  const meDocPromise = ObjectId.isValid(userId)
    ? usersCol.findOne(
        { _id: new ObjectId(userId) },
        { projection: { "profile.topTopics": 1, "profile.publicLocation.city": 1, "profile.publicLocation.region": 1 } },
      )
    : Promise.resolve(null);

  const [meDoc, pendingRequestCount, unreadMessageCount, unreadDirectCount, unreadSystemCount, friendRequestDocs, recentMessageDocs] = await Promise.all([
    meDocPromise,
    requestCol.countDocuments(userPendingRequestFilter),
    messageCol.countDocuments(unreadMessageFilter),
    messageCol.countDocuments(unreadDirectFilter),
    messageCol.countDocuments(unreadSystemFilter),
    requestCol.find(pendingRequestFilter).sort({ createdAt: -1 }).limit(10).toArray(),
    messageCol.find(requestFilter).sort({ createdAt: -1 }).limit(6).toArray(),
  ]);

  const myTopics = normalizeTopicList(meDoc?.profile?.topTopics);
  const myTopicSet = new Set(myTopics.map((topic) => topic.key));
  const myRegionKey = slugify(
    normalizeRegionLabel(meDoc?.profile?.publicLocation?.city, meDoc?.profile?.publicLocation?.region) ?? "",
  ) || null;

  const senderIds = Array.from(
    new Set(
      [...friendRequestDocs, ...recentMessageDocs]
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
                "profile.publicShareId": 1,
                "profile.publicLocation.city": 1,
                "profile.publicLocation.region": 1,
                "profile.topTopics": 1,
              },
            },
          )
          .toArray()
      : [];

  const senderInfoById = new Map<string, SenderInfo>([
    [
      FOUNDER_FALLBACK_USER_ID,
      {
        label: `${FOUNDER_FALLBACK_DISPLAY_NAME} · ${FOUNDER_ACCOUNT_EMAIL}`,
        avatarUrl: null,
        shareId: null,
        topicLabels: [],
        topicKeys: [],
        city: null,
        region: null,
      },
    ],
  ]);
  for (const doc of senderDocs) {
    const topicList = normalizeTopicList(doc?.profile?.topTopics);
    const label =
      clean(doc?.profile?.displayName) ||
      clean(doc?.name) ||
      clean(doc?.email) ||
      "Nutzer:in";
    senderInfoById.set(String(doc._id), {
      label,
      avatarUrl: clean(doc?.profile?.avatarUrl) || null,
      shareId: clean(doc?.profile?.publicShareId) || null,
      topicLabels: topicList.map((topic) => topic.label),
      topicKeys: topicList.map((topic) => topic.key),
      city: clean(doc?.profile?.publicLocation?.city) || null,
      region: clean(doc?.profile?.publicLocation?.region) || null,
    });
  }

  const friendRequests = friendRequestDocs.map((doc) => {
    const fromId = normalizeId(doc.fromUserId);
    const sender = resolveSenderInfo({
      fromId,
      source: doc.source ?? null,
      senderInfoById,
    });
    const senderRegionLabel = normalizeRegionLabel(sender.city, sender.region);
    const senderRegionKey = senderRegionLabel ? slugify(senderRegionLabel) : null;
    const requestType = classifyRequestType({ source: doc.source ?? null, fromId });
    const originContext = buildOriginContext({
      source: doc.source ?? null,
      meTopicKeys: myTopicSet,
      senderTopicKeys: sender.topicKeys,
      senderTopicLabels: sender.topicLabels,
      meRegionKey: myRegionKey,
      senderRegionKey,
      senderRegionLabel,
    });
    if (requestType === "founder") {
      originContext.type = "founder";
      originContext.reasonLabel = originContext.reasonLabel ?? "Founder-Willkommenskanal";
    } else if (requestType === "system") {
      originContext.type = "system";
      originContext.reasonLabel = originContext.reasonLabel ?? "System- oder Onboarding-Hinweis";
    }
    return {
      id: String(doc._id),
      fromLabel: sender.label,
      message: typeof doc.message === "string" ? doc.message.trim().slice(0, 160) : null,
      createdAt: toIso(doc.createdAt),
      fromUserId: fromId || null,
      fromShareId: sender.shareId,
      fromAvatarUrl: sender.avatarUrl,
      requestType,
      originContext,
    };
  });

  const recentMessages = recentMessageDocs.map((doc) => {
    const fromId = normalizeId(doc.fromUserId);
    const sender = resolveSenderInfo({
      fromId,
      kind: doc.kind ?? null,
      senderInfoById,
    });
    const senderRegionLabel = normalizeRegionLabel(sender.city, sender.region);
    const senderRegionKey = senderRegionLabel ? slugify(senderRegionLabel) : null;
    const kind = typeof doc.kind === "string" ? doc.kind : "direct";
    const messageType = classifyMessageType(kind);
    const originContext = buildOriginContext({
      source: null,
      kind,
      meTopicKeys: myTopicSet,
      senderTopicKeys: sender.topicKeys,
      senderTopicLabels: sender.topicLabels,
      meRegionKey: myRegionKey,
      senderRegionKey,
      senderRegionLabel,
    });
    if (messageType === "founder") {
      originContext.type = "founder";
      originContext.reasonLabel = originContext.reasonLabel ?? "Founder-Kontakt";
    } else if (messageType === "system") {
      originContext.type = "system";
      originContext.reasonLabel = originContext.reasonLabel ?? "System- oder Onboarding-Nachricht";
    }
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
      maxOriginalLength: 180,
      maxTranslationLength: 180,
    });
    return {
      id: String(doc._id),
      fromLabel: sender.label,
      text: text.slice(0, 180),
      content,
      kind,
      messageType,
      createdAt: toIso(doc.createdAt),
      read: Boolean(doc.readAt),
      fromUserId: fromId || null,
      fromShareId: sender.shareId,
      fromAvatarUrl: sender.avatarUrl,
      originContext,
    };
  });

  console.info("[social-summary] counts", {
    userId,
    founderFlow,
    pendingRequestCount,
    unreadMessageCount,
    unreadDirectCount,
    unreadSystemCount,
    friendRequestPreviewCount: friendRequests.length,
    recentMessagePreviewCount: recentMessages.length,
  });

  return NextResponse.json({
    ok: true,
    summary: {
      pendingRequestCount,
      unreadMessageCount,
      unreadDirectCount,
      unreadSystemCount,
      friendRequests,
      recentMessages,
    },
    meta: {
      store: "core",
      founderFlow,
    },
  });
}
