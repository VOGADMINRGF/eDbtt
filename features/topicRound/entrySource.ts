import { ObjectId } from "@core/db/triMongo";
import { anlassraumCol, outputSeedCol } from "@features/anlassraum/db";
import type {
  AnlassraumSourceMode,
  AnlassraumStatus,
  AnlassraumType,
  OutputSeedReviewState,
  OutputSeedStatus,
} from "@features/anlassraum/types";

export type RundenEntryLifecycle = "active" | "closed";

export type RundenEntrySourceKind =
  | "output_seed_with_anlassraum"
  | "output_seed_legacy_incomplete";

export type RundenEntryItem = {
  id: string;
  anlassraumId: string | null;
  title: string;
  summary: string;
  topicKey: string | null;
  anlassraumType: AnlassraumType | null;
  sourceMode: AnlassraumSourceMode | null;
  anlassraumStatus: AnlassraumStatus | null;
  outputStatus: OutputSeedStatus;
  reviewState: OutputSeedReviewState;
  publishTarget: string | null;
  entryHref: string;
  lifecycle: RundenEntryLifecycle;
  lastAction: string | null;
  lastActionBy: string | null;
  lastActionAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  legacyIncomplete: boolean;
  sourceKind: RundenEntrySourceKind;
};

export type ListRundenEntryItemsInput = {
  limit?: number;
};

const DEFAULT_LIMIT = 60;

export async function listRundenEntryItems(
  input: ListRundenEntryItemsInput = {},
): Promise<RundenEntryItem[]> {
  try {
    const seeds = await outputSeedCol();
    const items = await seeds
      .find({ outputType: "round_seed" })
      .sort({ updatedAt: -1 })
      .limit(normalizeLimit(input.limit))
      .toArray();

    if (items.length === 0) return [];

    const anlassraumIds = Array.from(
      new Set(
        items
          .map((item) => toHex(item?.anlassraumId))
          .filter((value): value is string => Boolean(value)),
      ),
    );

    const rooms =
      anlassraumIds.length > 0
        ? await (await anlassraumCol())
            .find({ _id: { $in: anlassraumIds.map((id) => new ObjectId(id)) } })
            .toArray()
        : [];
    const roomById = new Map(
      rooms.map((room) => [room._id?.toHexString?.() ?? "", room] as const),
    );

    return items.map((item) => mapToEntry(item as Record<string, unknown>, roomById));
  } catch {
    throw new Error("round_entry_source_unavailable");
  }
}

function mapToEntry(
  seed: Record<string, unknown>,
  roomById: Map<string, Record<string, unknown>>,
): RundenEntryItem {
  const seedId =
    toHex(seed?._id) ??
    firstNonEmpty(asString(seed?.updatedAt), asString(seed?.createdAt), asString(seed?.publishTarget)) ??
    "legacy-seed";
  const anlassraumId = toHex(seed?.anlassraumId);
  const room = anlassraumId ? roomById.get(anlassraumId) ?? null : null;

  const outputStatus = normalizeOutputStatus(seed?.status);
  const reviewState = normalizeReviewState(seed?.reviewState);
  const publishTarget = normalizePublishTarget(seed?.publishTarget);
  const entryHref =
    publishTarget ??
    (anlassraumId
      ? `/create?mode=source&anlassraumId=${encodeURIComponent(anlassraumId)}`
      : "/create?mode=source");

  const title =
    firstNonEmpty(
      asString(room?.title),
      asString(seed?.title),
      asString(seed?.targetAudience),
    ) ?? `Runde ${seedId.slice(-8)}`;

  const summary =
    firstNonEmpty(
      asString(room?.summary),
      asString(seed?.reviewNote),
      asString(seed?.lastAction),
    ) ?? "Produktiver Round-Output-Seed ohne Seed-Fallback.";

  const sourceKind: RundenEntrySourceKind = room
    ? "output_seed_with_anlassraum"
    : "output_seed_legacy_incomplete";

  const legacyIncomplete =
    !room || !asString(room.title) || !asString(room.summary) || !anlassraumId;

  return {
    id: seedId,
    anlassraumId,
    title,
    summary,
    topicKey: asString(room?.topicKey),
    anlassraumType: normalizeAnlassraumType(room?.type),
    sourceMode: normalizeSourceMode(room?.sourceMode),
    anlassraumStatus: normalizeAnlassraumStatus(room?.status),
    outputStatus,
    reviewState,
    publishTarget,
    entryHref,
    lifecycle: toLifecycle(outputStatus),
    lastAction: asString(seed?.lastAction),
    lastActionBy: asString(seed?.lastActionBy),
    lastActionAt: toIso(seed?.lastActionAt),
    createdAt: toIso(seed?.createdAt),
    updatedAt: toIso(seed?.updatedAt),
    legacyIncomplete,
    sourceKind,
  };
}

function toLifecycle(status: OutputSeedStatus): RundenEntryLifecycle {
  if (status === "published" || status === "discarded") return "closed";
  return "active";
}

function normalizeLimit(value: number | undefined) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return DEFAULT_LIMIT;
  return Math.max(1, Math.min(200, Math.floor(numeric)));
}

function toHex(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof ObjectId) return value.toHexString();
  const raw = String(value).trim();
  if (!ObjectId.isValid(raw)) return null;
  return new ObjectId(raw).toHexString();
}

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value.toISOString();
  const normalized = new Date(String(value));
  if (Number.isNaN(normalized.getTime())) return null;
  return normalized.toISOString();
}

function normalizeOutputStatus(value: unknown): OutputSeedStatus {
  const normalized = String(value || "").trim();
  if (normalized === "queued") return "queued";
  if (normalized === "review") return "review";
  if (normalized === "ready") return "ready";
  if (normalized === "published") return "published";
  if (normalized === "discarded") return "discarded";
  return "draft";
}

function normalizeReviewState(value: unknown): OutputSeedReviewState {
  const normalized = String(value || "").trim();
  if (normalized === "approved") return "approved";
  if (normalized === "rejected") return "rejected";
  return "pending";
}

function normalizePublishTarget(value: unknown): string | null {
  const target = String(value || "").trim();
  if (!target) return null;
  if (!target.startsWith("/")) return null;
  return target.slice(0, 200);
}

function normalizeAnlassraumType(value: unknown): AnlassraumType | null {
  const normalized = String(value || "").trim();
  if (normalized === "policy") return "policy";
  if (normalized === "event") return "event";
  if (normalized === "conflict") return "conflict";
  if (normalized === "investigation") return "investigation";
  if (normalized === "proposal") return "proposal";
  if (normalized === "crisis") return "crisis";
  if (normalized === "community_project") return "community_project";
  if (normalized === "funding_case") return "funding_case";
  if (normalized === "monitoring") return "monitoring";
  return null;
}

function normalizeSourceMode(value: unknown): AnlassraumSourceMode | null {
  const normalized = String(value || "").trim();
  if (normalized === "manual") return "manual";
  if (normalized === "feed") return "feed";
  if (normalized === "single_source") return "single_source";
  if (normalized === "cluster") return "cluster";
  if (normalized === "ai_assist") return "ai_assist";
  return null;
}

function normalizeAnlassraumStatus(value: unknown): AnlassraumStatus | null {
  const normalized = String(value || "").trim();
  if (normalized === "draft") return "draft";
  if (normalized === "curated") return "curated";
  if (normalized === "reviewed") return "reviewed";
  if (normalized === "approved") return "approved";
  if (normalized === "active") return "active";
  if (normalized === "archived") return "archived";
  if (normalized === "auto_ingested") return "auto_ingested";
  if (normalized === "auto_clustered") return "auto_clustered";
  if (normalized === "needs_editor_review") return "needs_editor_review";
  if (normalized === "ready_for_round") return "ready_for_round";
  if (normalized === "published") return "published";
  return null;
}

function asString(value: unknown): string | null {
  const normalized = String(value || "").trim();
  return normalized ? normalized : null;
}

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const normalized = asString(value);
    if (normalized) return normalized;
  }
  return null;
}
