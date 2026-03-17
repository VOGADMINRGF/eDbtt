import { ObjectId } from "@core/db/triMongo";

export type SocialFriendRequestLike = {
  _id?: unknown;
  fromUserId?: unknown;
  toUserId?: unknown;
  status?: unknown;
};

export type NormalizedSocialStatus = "pending" | "accepted" | "rejected" | "canceled" | "other";
export type SocialRelationshipState = "connected" | "incoming_pending" | "outgoing_pending" | "none";
export type CannotMessageReason =
  | "not_connected"
  | "incoming_request_pending"
  | "outgoing_request_pending"
  | "self"
  | "target_unknown";

export type PairState<TDoc extends SocialFriendRequestLike = SocialFriendRequestLike> = {
  connected: boolean;
  incomingPending: TDoc | null;
  outgoingPending: TDoc | null;
};

export function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeId(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value instanceof ObjectId) return value.toHexString();
  return String(value);
}

export function normalizeStatus(value: unknown): NormalizedSocialStatus {
  const normalized = clean(value).toLowerCase();
  if (normalized === "pending") return "pending";
  if (normalized === "accepted") return "accepted";
  if (normalized === "rejected") return "rejected";
  if (normalized === "canceled" || normalized === "cancelled") return "canceled";
  return "other";
}

export function idCandidates(value: string): Array<string | ObjectId> {
  const normalized = clean(value);
  if (!normalized) return [];
  if (ObjectId.isValid(normalized)) return [normalized, new ObjectId(normalized)];
  return [normalized];
}

export function pairFilter(aIds: Array<string | ObjectId>, bIds: Array<string | ObjectId>) {
  return {
    $or: [
      { fromUserId: { $in: aIds }, toUserId: { $in: bIds } },
      { fromUserId: { $in: bIds }, toUserId: { $in: aIds } },
    ],
  };
}

export function summarizePairState<TDoc extends SocialFriendRequestLike>(
  docs: TDoc[],
  currentUserId: string,
  targetUserId: string,
): PairState<TDoc> {
  const currentSet = new Set(idCandidates(currentUserId).map((candidate) => normalizeId(candidate)));
  const targetSet = new Set(idCandidates(targetUserId).map((candidate) => normalizeId(candidate)));
  let connected = false;
  let incomingPending: TDoc | null = null;
  let outgoingPending: TDoc | null = null;

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

export function deriveRelationshipState<TDoc extends SocialFriendRequestLike>(
  pairState: PairState<TDoc>,
): SocialRelationshipState {
  if (pairState.connected) return "connected";
  if (pairState.incomingPending) return "incoming_pending";
  if (pairState.outgoingPending) return "outgoing_pending";
  return "none";
}

export function deriveMessagingCapability<TDoc extends SocialFriendRequestLike>(params: {
  pairState: PairState<TDoc>;
  currentUserId: string;
  targetUserId: string;
  targetKnown?: boolean;
}): {
  relationshipState: SocialRelationshipState;
  canMessage: boolean;
  cannotMessageReason: CannotMessageReason | null;
} {
  const { pairState, currentUserId, targetUserId, targetKnown = true } = params;
  const relationshipState = deriveRelationshipState(pairState);

  if (!targetKnown) {
    return { relationshipState, canMessage: false, cannotMessageReason: "target_unknown" };
  }
  if (normalizeId(currentUserId) === normalizeId(targetUserId)) {
    return { relationshipState, canMessage: false, cannotMessageReason: "self" };
  }
  if (pairState.connected) {
    return { relationshipState, canMessage: true, cannotMessageReason: null };
  }
  if (pairState.incomingPending) {
    return {
      relationshipState,
      canMessage: false,
      cannotMessageReason: "incoming_request_pending",
    };
  }
  if (pairState.outgoingPending) {
    return {
      relationshipState,
      canMessage: false,
      cannotMessageReason: "outgoing_request_pending",
    };
  }

  return {
    relationshipState,
    canMessage: false,
    cannotMessageReason: "not_connected",
  };
}
