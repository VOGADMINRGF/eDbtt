import { NextResponse } from "next/server";
import { ObjectId, coreCol } from "@core/db/triMongo";
import { readSession } from "@/utils/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SocialFriendRequestDoc = {
  _id: ObjectId;
  fromUserId?: string | ObjectId | null;
  toUserId?: string | ObjectId | null;
  status?: "pending" | "accepted" | "rejected" | "canceled" | null;
  message?: string | null;
  createdAt?: string | Date | null;
};

type SocialMessageDoc = {
  _id: ObjectId;
  fromUserId?: string | ObjectId | null;
  toUserId?: string | ObjectId | null;
  text?: string | null;
  body?: string | null;
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

export async function GET() {
  const session = await readSession();
  const userId = session?.uid ?? null;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const requestFilter = userMatchFilter(userId);
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
    requestCol.countDocuments({ ...requestFilter, status: "pending" }),
    messageCol.countDocuments(unreadMessageFilter),
    requestCol.find({ ...requestFilter, status: "pending" }).sort({ createdAt: -1 }).limit(5).toArray(),
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

  const senderLabelById = new Map<string, string>();
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
      fromLabel: senderLabelById.get(fromId) ?? "Unbekannter Kontakt",
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
      fromLabel: senderLabelById.get(fromId) ?? "Unbekannter Kontakt",
      text: text.slice(0, 180),
      createdAt: toIso(doc.createdAt),
      read: Boolean(doc.readAt),
    };
  });

  return NextResponse.json({
    ok: true,
    summary: {
      pendingRequestCount,
      unreadMessageCount,
      friendRequests,
      recentMessages,
    },
  });
}
