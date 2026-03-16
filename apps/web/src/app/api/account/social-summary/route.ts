import { NextResponse } from "next/server";
import { assertStoreConfigured, ObjectId, coreCol } from "@core/db/triMongo";
import { readSession } from "@/utils/session";
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
  readAt?: string | Date | null;
  createdAt?: string | Date | null;
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

function resolveSenderLabel(params: {
  fromId: string;
  kind?: string | null;
  source?: string | null;
  senderLabelById: Map<string, string>;
}) {
  if (params.senderLabelById.has(params.fromId)) {
    return params.senderLabelById.get(params.fromId) ?? "Nutzer:in";
  }
  if (
    params.fromId === FOUNDER_FALLBACK_USER_ID ||
    params.kind === "founder_welcome" ||
    params.source === "founder_welcome"
  ) {
    return `${FOUNDER_FALLBACK_DISPLAY_NAME} · ${FOUNDER_ACCOUNT_EMAIL}`;
  }
  return "Unbekannter Kontakt";
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

  const requestCol = await coreCol<SocialFriendRequestDoc>("social_friend_requests");
  const messageCol = await coreCol<SocialMessageDoc>("social_messages");
  const usersCol = await coreCol<any>("users");

  const [pendingRequestCount, unreadMessageCount, friendRequestDocs, recentMessageDocs] = await Promise.all([
    requestCol.countDocuments(pendingRequestFilter),
    messageCol.countDocuments(unreadMessageFilter),
    requestCol.find(pendingRequestFilter).sort({ createdAt: -1 }).limit(5).toArray(),
    messageCol.find(requestFilter).sort({ createdAt: -1 }).limit(6).toArray(),
  ]);

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
            { projection: { name: 1, email: 1, "profile.displayName": 1 } },
          )
          .toArray()
      : [];

  const senderLabelById = new Map<string, string>([
    [FOUNDER_FALLBACK_USER_ID, `${FOUNDER_FALLBACK_DISPLAY_NAME} · ${FOUNDER_ACCOUNT_EMAIL}`],
  ]);
  for (const doc of senderDocs) {
    const label =
      (typeof doc?.profile?.displayName === "string" && doc.profile.displayName.trim()) ||
      (typeof doc?.name === "string" && doc.name.trim()) ||
      (typeof doc?.email === "string" && doc.email.trim()) ||
      "Nutzer:in";
    senderLabelById.set(String(doc._id), label);
  }

  const friendRequests = friendRequestDocs.map((doc) => {
    const fromId = normalizeId(doc.fromUserId);
    return {
      id: String(doc._id),
      fromLabel: resolveSenderLabel({
        fromId,
        source: doc.source ?? null,
        senderLabelById,
      }),
      message: typeof doc.message === "string" ? doc.message.trim().slice(0, 160) : null,
      createdAt: toIso(doc.createdAt),
    };
  });

  const recentMessages = recentMessageDocs.map((doc) => {
    const fromId = normalizeId(doc.fromUserId);
    const text =
      (typeof doc.text === "string" && doc.text.trim()) ||
      (typeof doc.body === "string" && doc.body.trim()) ||
      "Nachricht ohne Text";
    return {
      id: String(doc._id),
      fromLabel: resolveSenderLabel({
        fromId,
        kind: doc.kind ?? null,
        senderLabelById,
      }),
      text: text.slice(0, 180),
      kind: typeof doc.kind === "string" ? doc.kind : "direct",
      createdAt: toIso(doc.createdAt),
      read: Boolean(doc.readAt),
    };
  });

  console.info("[social-summary] counts", {
    userId,
    founderFlow,
    pendingRequestCount,
    unreadMessageCount,
    friendRequestPreviewCount: friendRequests.length,
    recentMessagePreviewCount: recentMessages.length,
  });

  return NextResponse.json({
    ok: true,
    summary: {
      pendingRequestCount,
      unreadMessageCount,
      friendRequests,
      recentMessages,
    },
    meta: {
      store: "core",
      founderFlow,
    },
  });
}
