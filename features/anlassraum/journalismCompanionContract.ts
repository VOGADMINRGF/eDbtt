import type { AnlassraumOriginType } from "@features/anlassraum/types";
import type { RoomType } from "@features/trust/types";

export type JournalismCompanionChannel = "open_dossier_companion" | "embed" | "qr";

export type JournalismCompanionSurface =
  | "public_open"
  | "editorial_context"
  | "restricted_context";

export type JournalismCompanionContract = {
  sourceAnchorContext: boolean;
  publicConnection: boolean;
  companionSurface: JournalismCompanionSurface;
  channels: readonly JournalismCompanionChannel[];
  allowsCompanionConnection: true;
  allowsEmbedConnection: boolean;
  allowsQrConnection: boolean;
  allowsWorkflowAccelerationOnly: boolean;
  requiresOpenDossierKernel: true;
  requiresFactcheckReviewVisibility: true;
  forbidsTruthPrivilege: true;
  forbidsPriorityPrivilege: true;
  forbidsParallelTruthChannel: true;
  forbidsPublisherSiloClosure: true;
  forbiddenInferences: readonly string[];
  allowedStrengths: readonly string[];
};

export const JOURNALISM_COMPANION_FORBIDDEN_INFERENCES = [
  "truth_status_from_companion_channel",
  "priority_rank_from_embed_or_qr_context",
  "parallel_truth_surface_from_publisher_context",
  "closed_publisher_silo_overrides_open_dossier_kernel",
] as const;

export const JOURNALISM_COMPANION_ALLOWED_STRENGTHS = [
  "article_podcast_stream_companion_connection",
  "public_readability_of_open_dossier_context",
  "qr_supported_followup_participation",
  "transparent_review_factcheck_visibility",
] as const;

function normalizeOriginType(value: unknown): AnlassraumOriginType | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "manual" ||
    normalized === "feed" ||
    normalized === "source_anchor" ||
    normalized === "source-anchor" ||
    normalized === "community" ||
    normalized === "event" ||
    normalized === "official" ||
    normalized === "tip" ||
    normalized === "system"
  ) {
    return normalized === "source-anchor" ? "source_anchor" : (normalized as AnlassraumOriginType);
  }
  return null;
}

function normalizeRoomType(value: unknown): RoomType | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "public" ||
    normalized === "community" ||
    normalized === "official" ||
    normalized === "editorial" ||
    normalized === "internal" ||
    normalized === "hybrid"
  ) {
    return normalized as RoomType;
  }
  return null;
}

function resolveCompanionSurface(input: {
  publicConnection: boolean;
  roomType: RoomType | null;
}): JournalismCompanionSurface {
  if (input.publicConnection) return "public_open";
  if (input.roomType === "editorial") return "editorial_context";
  return "restricted_context";
}

export function resolveJournalismCompanionContract(input: {
  originType: unknown;
  roomType: unknown;
}): JournalismCompanionContract {
  const originType = normalizeOriginType(input.originType);
  const roomType = normalizeRoomType(input.roomType);
  const sourceAnchorContext = originType === "source_anchor";
  const publicConnection = roomType === "public" || roomType === "community";
  const allowsEmbedConnection = publicConnection || roomType === "editorial";
  const allowsQrConnection = publicConnection;

  const channels: JournalismCompanionChannel[] = ["open_dossier_companion"];
  if (allowsEmbedConnection) channels.push("embed");
  if (allowsQrConnection) channels.push("qr");

  return {
    sourceAnchorContext,
    publicConnection,
    companionSurface: resolveCompanionSurface({ publicConnection, roomType }),
    channels,
    allowsCompanionConnection: true,
    allowsEmbedConnection,
    allowsQrConnection,
    allowsWorkflowAccelerationOnly: sourceAnchorContext,
    requiresOpenDossierKernel: true,
    requiresFactcheckReviewVisibility: true,
    forbidsTruthPrivilege: true,
    forbidsPriorityPrivilege: true,
    forbidsParallelTruthChannel: true,
    forbidsPublisherSiloClosure: true,
    forbiddenInferences: JOURNALISM_COMPANION_FORBIDDEN_INFERENCES,
    allowedStrengths: JOURNALISM_COMPANION_ALLOWED_STRENGTHS,
  };
}
