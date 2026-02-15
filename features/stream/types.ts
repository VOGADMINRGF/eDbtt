import type { ObjectId } from "@core/db/triMongo";

export type StreamVisibility = "public" | "unlisted";
export type StreamAgendaKind = "statement" | "question" | "poll" | "info";
export type StreamAgendaStatus = "queued" | "live" | "archived" | "skipped";
export type StreamSessionStatus = "draft" | "scheduled" | "live" | "ended" | "cancelled";
export type StreamAttributionMode = "hidden" | "creator_only" | "public";
export type StreamModerationItemKind = "claim" | "source" | "question" | "option" | "impact";
export type StreamModerationItemStatus = "queued" | "approved" | "rejected";
export type StreamFollowUpStatus =
  | "submitted"
  | "in_review"
  | "accepted"
  | "partial"
  | "rejected";
export type StreamCallInStatus = "invited" | "ready" | "live" | "removed";
export type StreamDeliberationPhase =
  | "mandate"
  | "input"
  | "round_a"
  | "round_b"
  | "round_c"
  | "plenum"
  | "vote"
  | "follow_up";

export interface StreamDeliberationState {
  enabled: boolean;
  phase: StreamDeliberationPhase;
  round: number;
  roundEndsAt?: Date | null;
  updatedAt?: Date | null;
  updatedBy?: string | null;
}

export interface StreamSessionDoc {
  _id?: ObjectId;
  creatorId: string;
  title: string;
  description?: string | null;
  regionCode?: string | null;
  topicKey?: string | null;
  startsAt?: Date | null;
  playerUrl?: string | null;
  visibility: StreamVisibility;
  status?: StreamSessionStatus;
  isLive: boolean;
  deliberation?: StreamDeliberationState | null;
  liveBoard?: StreamLiveBoardState | null;
  followUp?: StreamFollowUpState | null;
  supportEnabled?: boolean | null;
  supportBlind?: boolean | null;
  recordingAllowed?: boolean | null;
  requireVerifiedParticipants?: boolean | null;
  hideViewerCount?: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date | null;
  endedAt?: Date | null;
}

export interface StreamAgendaItemDoc {
  _id?: ObjectId;
  sessionId: ObjectId;
  creatorId: string;
  kind: StreamAgendaKind;
  status: StreamAgendaStatus;
  order?: number;
  statementId?: string | null;
  evidenceClaimId?: ObjectId | null;
  reportId?: string | null;
  customQuestion?: string | null;
  description?: string | null;
  pollOptions?: string[];
  qrTarget?: string | null;
  allowAnonymousVoting: boolean;
  publicAttribution: StreamAttributionMode;
  activeSince?: Date | null;
  archivedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface StreamOverlayItem {
  id: string;
  kind: StreamAgendaKind;
  title: string;
  body?: string | null;
  pollOptions?: string[];
  qrTarget?: string | null;
  allowAnonymousVoting: boolean;
  publicAttribution: StreamAttributionMode;
  pollTotals?: Record<string, number>;
}

export interface StreamOverlayState {
  sessionId: ObjectId;
  items: StreamOverlayItem[];
  updatedAt: Date;
}

export interface StreamLiveBoardOption {
  id: string;
  title: string;
  pros: string[];
  cons: string[];
  sources: string[];
  openQuestions: string[];
}

export interface StreamLiveBoardState {
  title: string;
  summary?: string | null;
  options: StreamLiveBoardOption[];
  updatedAt?: Date | null;
  updatedBy?: string | null;
}

export interface StreamFollowUpUpdate {
  id: string;
  status: StreamFollowUpStatus;
  note: string;
  link?: string | null;
  createdAt: Date;
}

export interface StreamFollowUpState {
  updates: StreamFollowUpUpdate[];
  nextReminderAt?: Date | null;
  updatedAt?: Date | null;
  updatedBy?: string | null;
}

export interface StreamCallInDoc {
  _id?: ObjectId;
  sessionId: ObjectId;
  creatorId: string;
  name: string;
  handle?: string | null;
  channel?: string | null;
  notes?: string | null;
  status: StreamCallInStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface StreamModerationQueueItemDoc {
  _id?: ObjectId;
  sessionId: ObjectId;
  creatorId: string;
  kind: StreamModerationItemKind;
  text: string;
  sourceUrl?: string | null;
  notes?: string | null;
  status: StreamModerationItemStatus;
  createdAt: Date;
  updatedAt: Date;
}

export function resolveSessionStatus(
  session: Pick<StreamSessionDoc, "status" | "isLive" | "endedAt">,
): StreamSessionStatus {
  if (
    session.status === "draft" ||
    session.status === "scheduled" ||
    session.status === "live" ||
    session.status === "ended" ||
    session.status === "cancelled"
  ) {
    return session.status;
  }
  if (session.isLive) return "live";
  if (session.endedAt) return "ended";
  return "draft";
}
