import { NextResponse } from "next/server";
import { assertStoreConfigured, ObjectId, coreCol } from "@core/db/triMongo";
import { logger } from "@core/observability/logger";
import { readSession } from "@/utils/session";
import { resolveSocialEscalationPolicy } from "@/lib/social/escalationPolicy";
import { incrementRateLimit } from "@/lib/security/rate-limit";

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

type PairState = {
  connected: boolean;
  incomingPending: SocialFriendRequestDoc | null;
  outgoingPending: SocialFriendRequestDoc | null;
};

type UserDoc = {
  _id: ObjectId;
  verifiedEmail?: boolean | null;
  emailVerified?: boolean | null;
  verification?: {
    level?: string | null;
    methods?: string[] | null;
    twoFA?: {
      enabled?: boolean | null;
      secret?: string | null;
    } | null;
  } | null;
};

const MATCH_REQUEST_RATE_WINDOW_SECONDS = 15 * 60;
const MATCH_REQUEST_RATE_LIMIT = 12;
const MATCH_REQUEST_COOLDOWN_MS = 2 * 60 * 1000;
const MATCH_REQUEST_PENDING_LIMIT = 20;

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeId(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value instanceof ObjectId) return value.toHexString();
  return String(value);
}

function normalizeStatus(value: unknown): "pending" | "accepted" | "rejected" | "canceled" | "other" {
  const normalized = clean(value).toLowerCase();
  if (normalized === "pending") return "pending";
  if (normalized === "accepted") return "accepted";
  if (normalized === "rejected") return "rejected";
  if (normalized === "canceled" || normalized === "cancelled") return "canceled";
  return "other";
}

function idCandidates(value: string): Array<string | ObjectId> {
  const normalized = clean(value);
  if (!normalized) return [];
  if (ObjectId.isValid(normalized)) return [normalized, new ObjectId(normalized)];
  return [normalized];
}

function statusFilter(status: "pending" | "accepted" | "rejected" | "canceled") {
  return { $in: [status, status.toUpperCase()] };
}

function pairFilter(aIds: Array<string | ObjectId>, bIds: Array<string | ObjectId>) {
  return {
    $or: [
      { fromUserId: { $in: aIds }, toUserId: { $in: bIds } },
      { fromUserId: { $in: bIds }, toUserId: { $in: aIds } },
    ],
  };
}

function summarizePairState(
  docs: SocialFriendRequestDoc[],
  currentUserId: string,
  targetUserId: string,
): PairState {
  const currentSet = new Set(idCandidates(currentUserId).map((candidate) => normalizeId(candidate)));
  const targetSet = new Set(idCandidates(targetUserId).map((candidate) => normalizeId(candidate)));
  let connected = false;
  let incomingPending: SocialFriendRequestDoc | null = null;
  let outgoingPending: SocialFriendRequestDoc | null = null;

  for (const doc of docs) {
    const status = normalizeStatus(doc.status);
    const fromId = normalizeId(doc.fromUserId);
    const toId = normalizeId(doc.toUserId);
    const outgoing = currentSet.has(fromId) && targetSet.has(toId);
    const incoming = targetSet.has(fromId) && currentSet.has(toId);

    if (status === "accepted" && (outgoing || incoming)) {
      connected = true;
    }
    if (status === "pending" && incoming && !incomingPending) {
      incomingPending = doc;
    }
    if (status === "pending" && outgoing && !outgoingPending) {
      outgoingPending = doc;
    }
  }

  return { connected, incomingPending, outgoingPending };
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function deriveVerificationSignal(user: UserDoc | null): boolean {
  if (!user) return false;
  const level = clean(user.verification?.level).toLowerCase();
  const methods = Array.isArray(user.verification?.methods) ? user.verification?.methods : [];
  return (
    Boolean(user.verifiedEmail) ||
    Boolean(user.emailVerified) ||
    level === "soft" ||
    level === "strong" ||
    methods.length > 0
  );
}

function deriveTrustSignal(user: UserDoc | null): boolean {
  if (!user) return false;
  const twoFA = user.verification?.twoFA;
  return Boolean(twoFA?.enabled || twoFA?.secret) || deriveVerificationSignal(user);
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
    const doc = await requestsCol.findOne({
      _id: new ObjectId(requestId),
      toUserId: { $in: currentUserIds },
    });
    if (!doc) {
      return NextResponse.json({ ok: false, error: "request_not_found" }, { status: 404 });
    }

    const currentStatus = normalizeStatus(doc.status);
    const nextStatus = action === "request.accept" ? "accepted" : "rejected";

    if (currentStatus === nextStatus) {
      return NextResponse.json({
        ok: true,
        state: nextStatus,
        message: nextStatus === "accepted" ? "Anfrage war bereits angenommen." : "Anfrage war bereits abgelehnt.",
      });
    }
    if (currentStatus !== "pending") {
      return NextResponse.json({ ok: false, error: "request_not_pending" }, { status: 409 });
    }

    const fromId = normalizeId(doc.fromUserId);
    if (!fromId) {
      return NextResponse.json({ ok: false, error: "request_without_sender" }, { status: 409 });
    }

    const now = new Date();
    const fromIds = idCandidates(fromId);

    await requestsCol.updateOne(
      { _id: doc._id },
      {
        $set: {
          status: nextStatus,
          updatedAt: now,
          ...(nextStatus === "accepted" ? { acceptedAt: now } : { rejectedAt: now }),
        },
      } as any,
    );

    if (nextStatus === "accepted") {
      await requestsCol.updateMany(
        {
          ...pairFilter(currentUserIds, fromIds),
          status: statusFilter("pending"),
        },
        {
          $set: {
            status: "accepted",
            acceptedAt: now,
            updatedAt: now,
          },
        } as any,
      );

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
            acceptedAt: now,
            updatedAt: now,
          },
        } as any,
        { upsert: true },
      );
    } else {
      await requestsCol.updateMany(
        {
          fromUserId: { $in: currentUserIds },
          toUserId: { $in: fromIds },
          status: statusFilter("pending"),
        },
        {
          $set: {
            status: "canceled",
            updatedAt: now,
            canceledAt: now,
          },
        } as any,
      );
    }

    return NextResponse.json({
      ok: true,
      state: nextStatus,
      message: nextStatus === "accepted" ? "Anfrage angenommen." : "Anfrage abgelehnt.",
    });
  }

  if (action === "match.request") {
    if (!targetUserId || !ObjectId.isValid(targetUserId)) {
      return NextResponse.json({ ok: false, error: "invalid_target_user" }, { status: 400 });
    }
    if (targetUserId === userId) {
      return NextResponse.json({ ok: false, error: "cannot_request_self" }, { status: 400 });
    }

    const usersCol = await coreCol<UserDoc>("users");
    const [targetExists, actorUser] = await Promise.all([
      usersCol.findOne({ _id: new ObjectId(targetUserId) }, { projection: { _id: 1 } }),
      ObjectId.isValid(userId)
        ? usersCol.findOne(
            { _id: new ObjectId(userId) },
            {
              projection: {
                _id: 1,
                verifiedEmail: 1,
                emailVerified: 1,
                verification: 1,
              },
            },
          )
        : Promise.resolve(null),
    ]);
    if (!targetExists) {
      return NextResponse.json({ ok: false, error: "target_user_not_found" }, { status: 404 });
    }

    const escalation = resolveSocialEscalationPolicy({
      context: body?.context ?? body?.contextType ?? body?.socialContext ?? null,
      optIn: body?.optIn ?? body?.socialOptIn ?? false,
      trustSignal: deriveTrustSignal(actorUser),
      verificationSignal: deriveVerificationSignal(actorUser),
    });
    if (!escalation.allowed) {
      logger.warn(
        {
          scope: "social.match.request",
          userId,
          targetUserId,
          reason: escalation.reason,
          context: escalation.context,
          optIn: escalation.flags.optIn,
          trustSignal: escalation.flags.trustSignal,
          verificationSignal: escalation.flags.verificationSignal,
        },
        "SOCIAL_ESCALATION_DENIED",
      );
      return NextResponse.json(
        {
          ok: false,
          error: "social_escalation_not_allowed",
          reason: escalation.reason,
          context: escalation.context,
        },
        { status: 403 },
      );
    }

    const rateCount = await incrementRateLimit(
      `social:match_request:${userId}`,
      MATCH_REQUEST_RATE_WINDOW_SECONDS,
    );
    if (rateCount > MATCH_REQUEST_RATE_LIMIT) {
      logger.warn(
        {
          scope: "social.match.request",
          userId,
          targetUserId,
          rateCount,
          rateWindowSeconds: MATCH_REQUEST_RATE_WINDOW_SECONDS,
        },
        "SOCIAL_ESCALATION_DENIED",
      );
      return NextResponse.json(
        {
          ok: false,
          error: "social_escalation_rate_limited",
          retryAfterSeconds: MATCH_REQUEST_RATE_WINDOW_SECONDS,
        },
        { status: 429 },
      );
    }

    const currentUserIds = idCandidates(userId);
    const targetUserIds = idCandidates(targetUserId);
    const pairDocs = await requestsCol
      .find(pairFilter(currentUserIds, targetUserIds))
      .sort({ createdAt: -1, _id: -1 })
      .limit(20)
      .toArray();

    const latestOutgoing = pairDocs.find((doc) => {
      const status = normalizeStatus(doc.status);
      if (status !== "pending" && status !== "rejected" && status !== "canceled") return false;
      return (
        currentUserIds.map((id) => normalizeId(id)).includes(normalizeId(doc.fromUserId)) &&
        targetUserIds.map((id) => normalizeId(id)).includes(normalizeId(doc.toUserId))
      );
    });
    const latestOutgoingAt = toDate(latestOutgoing?.createdAt);
    if (latestOutgoingAt && Date.now() - latestOutgoingAt.getTime() < MATCH_REQUEST_COOLDOWN_MS) {
      logger.warn(
        {
          scope: "social.match.request",
          userId,
          targetUserId,
          cooldownMs: MATCH_REQUEST_COOLDOWN_MS,
          lastRequestAt: latestOutgoingAt.toISOString(),
        },
        "SOCIAL_ESCALATION_DENIED",
      );
      return NextResponse.json(
        {
          ok: false,
          error: "social_escalation_cooldown",
          retryAfterMs: MATCH_REQUEST_COOLDOWN_MS,
        },
        { status: 429 },
      );
    }

    const pendingOutgoingCount = await requestsCol.countDocuments({
      fromUserId: { $in: currentUserIds },
      status: statusFilter("pending"),
    });
    if (pendingOutgoingCount > MATCH_REQUEST_PENDING_LIMIT) {
      logger.warn(
        {
          scope: "social.match.request",
          userId,
          targetUserId,
          pendingOutgoingCount,
        },
        "SOCIAL_ESCALATION_DENIED",
      );
      return NextResponse.json(
        { ok: false, error: "social_escalation_abuse_gate" },
        { status: 403 },
      );
    }

    const pairState = summarizePairState(pairDocs, userId, targetUserId);
    if (pairState.connected) {
      return NextResponse.json({ ok: true, state: "accepted", message: "Ihr seid bereits verbunden." });
    }
    if (pairState.outgoingPending) {
      return NextResponse.json({ ok: true, state: "pending", message: "Anfrage ist bereits offen." });
    }
    if (pairState.incomingPending) {
      return NextResponse.json({
        ok: true,
        state: "incoming_pending",
        message: "Diese Person hat dir bereits eine offene Anfrage gesendet.",
      });
    }

    const now = new Date();
    const recycled = await requestsCol.findOneAndUpdate(
      {
        fromUserId: { $in: currentUserIds },
        toUserId: { $in: targetUserIds },
        status: { $in: ["rejected", "REJECTED", "canceled", "CANCELED"] },
      },
      {
        $set: {
          status: "pending",
          source: "match_request",
          updatedAt: now,
        },
        $unset: {
          rejectedAt: "",
          canceledAt: "",
        },
      } as any,
      { sort: { updatedAt: -1, createdAt: -1, _id: -1 }, returnDocument: "after" },
    );

    if (!recycled) {
      await requestsCol.insertOne({
        fromUserId: userId,
        toUserId: targetUserId,
        status: "pending",
        source: "match_request",
        createdAt: now,
      } as any);
    }

    logger.info(
      {
        scope: "social.match.request",
        userId,
        targetUserId,
        state: "pending",
        mode: recycled ? "recycled" : "inserted",
        context: escalation.context,
        pendingOutgoingCount,
      },
      "SOCIAL_ESCALATION_ALLOWED",
    );

    return NextResponse.json({ ok: true, state: "pending", message: "Verbindungsanfrage gesendet." });
  }

  return NextResponse.json({ ok: false, error: "invalid_action" }, { status: 400 });
}
