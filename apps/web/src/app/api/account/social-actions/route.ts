import { NextResponse } from "next/server";
import { assertStoreConfigured, ObjectId, coreCol } from "@core/db/triMongo";
import { readSession } from "@/utils/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SocialFriendRequestDoc = {
  _id: ObjectId;
  fromUserId?: string | ObjectId | null;
  toUserId?: string | ObjectId | null;
  status?: "pending" | "accepted" | "rejected" | "canceled" | string | null;
  source?: string | null;
  message?: string | null;
  createdAt?: Date | string | null;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeId(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value instanceof ObjectId) return value.toHexString();
  return String(value);
}

function idCandidates(value: string): Array<string | ObjectId> {
  const normalized = clean(value);
  if (!normalized) return [];
  if (ObjectId.isValid(normalized)) return [normalized, new ObjectId(normalized)];
  return [normalized];
}

function statusLabel(status: string | null | undefined) {
  const normalized = clean(status).toLowerCase();
  if (normalized === "accepted") return "accepted";
  if (normalized === "rejected") return "rejected";
  if (normalized === "pending") return "pending";
  return "other";
}

export async function POST(request: Request) {
  assertStoreConfigured("core", "api/account/social-actions");
  const session = await readSession();
  const userId = session?.uid ?? null;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const action = clean(body?.action);
  const requestId = clean(body?.requestId);
  const targetUserId = clean(body?.targetUserId);

  const requestsCol = await coreCol<SocialFriendRequestDoc>("social_friend_requests");

  if (action === "request.accept" || action === "request.reject") {
    if (!requestId || !ObjectId.isValid(requestId)) {
      return NextResponse.json({ ok: false, error: "invalid_request_id" }, { status: 400 });
    }
    const currentUserIds = idCandidates(userId);
    const requestDoc = await requestsCol.findOne({
      _id: new ObjectId(requestId),
      toUserId: { $in: currentUserIds },
    });
    if (!requestDoc) {
      return NextResponse.json({ ok: false, error: "request_not_found" }, { status: 404 });
    }

    const now = new Date();
    const nextStatus = action === "request.accept" ? "accepted" : "rejected";
    await requestsCol.updateOne(
      { _id: requestDoc._id },
      {
        $set: {
          status: nextStatus,
          updatedAt: now,
          ...(nextStatus === "accepted" ? { acceptedAt: now } : { rejectedAt: now }),
        },
      } as any,
    );

    if (nextStatus === "accepted") {
      const fromId = normalizeId(requestDoc.fromUserId);
      if (fromId && fromId !== userId) {
        const fromIds = idCandidates(fromId);
        await requestsCol.updateOne(
          {
            fromUserId: { $in: currentUserIds },
            toUserId: { $in: fromIds },
          },
          {
            $setOnInsert: {
              source: "social_accept_sync",
              createdAt: now,
            },
            $set: {
              status: "accepted",
              updatedAt: now,
              acceptedAt: now,
            },
          } as any,
          { upsert: true },
        );
      }
    }

    return NextResponse.json({
      ok: true,
      state: nextStatus,
      message: nextStatus === "accepted" ? "Anfrage angenommen." : "Anfrage abgelehnt.",
    });
  }

  if (action === "match.request") {
    if (!targetUserId) {
      return NextResponse.json({ ok: false, error: "invalid_target_user" }, { status: 400 });
    }
    if (targetUserId === userId) {
      return NextResponse.json({ ok: false, error: "cannot_request_self" }, { status: 400 });
    }

    const currentUserIds = idCandidates(userId);
    const targetUserIds = idCandidates(targetUserId);

    const existing = await requestsCol.findOne({
      $or: [
        {
          fromUserId: { $in: currentUserIds },
          toUserId: { $in: targetUserIds },
        },
        {
          fromUserId: { $in: targetUserIds },
          toUserId: { $in: currentUserIds },
        },
      ],
    });

    const existingStatus = statusLabel(existing?.status);
    if (existingStatus === "pending") {
      return NextResponse.json({ ok: true, state: "pending", message: "Anfrage ist bereits offen." });
    }
    if (existingStatus === "accepted") {
      return NextResponse.json({ ok: true, state: "accepted", message: "Ihr seid bereits verbunden." });
    }

    await requestsCol.insertOne({
      fromUserId: userId,
      toUserId: targetUserId,
      status: "pending",
      source: "match_request",
      createdAt: new Date(),
    } as any);

    return NextResponse.json({ ok: true, state: "pending", message: "Verbindungsanfrage gesendet." });
  }

  return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
}

