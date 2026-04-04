import { ObjectId } from "@core/db/triMongo";
import { anlassraumCol, outputSeedCol } from "@features/anlassraum/db";
import type {
  AnlassraumDoc,
  OutputSeedDoc,
  OutputSeedStatus,
} from "@features/anlassraum/types";
import {
  resolveDossierAtlasLandscapeContract,
  type DossierAtlasContextGroup,
  type DossierAtlasLandscapeContract,
} from "@features/anlassraum/dossierAtlasLandscapeContract";

export type DossierAtlasReadModelInput = {
  limit?: number;
};

type AtlasSourceRecord = {
  title: string;
  topicKey?: string | null;
  topicLabel?: string | null;
  regionKey?: string | null;
  regionCode?: string | null;
  anlassId?: string | null;
  dossierId?: string | null;
  roundId?: string | null;
  resultId?: string | null;
  companionId?: string | null;
  lifecycle?: string | null;
  activityBand?: string | null;
  workState?: string | null;
  contextGroups?: DossierAtlasContextGroup[];
};

const DEFAULT_LIMIT = 220;

export async function loadDossierAtlasLandscapeReadModel(
  input: DossierAtlasReadModelInput = {},
): Promise<DossierAtlasLandscapeContract> {
  const limit = normalizeLimit(input.limit);
  const seeds = await outputSeedCol();
  const roundSeeds = await seeds
    .find({ outputType: "round_seed" })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .toArray();

  const roomIds = Array.from(
    new Set(
      roundSeeds
        .map((seed) => toHex(seed?.anlassraumId))
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const rooms =
    roomIds.length > 0
      ? await (await anlassraumCol())
          .find({ _id: { $in: roomIds.map((id) => new ObjectId(id)) } })
          .toArray()
      : [];

  const roomById = new Map(
    rooms.map((room) => [room._id?.toHexString?.() ?? "", room] as const),
  );

  const sourceRecords = mapAtlasSourceRecords({
    roundSeeds,
    roomById,
  });

  return resolveDossierAtlasLandscapeContract({
    generatedAt: new Date().toISOString(),
    items: sourceRecords,
  });
}

export function mapAtlasSourceRecords(input: {
  roundSeeds: Array<Partial<OutputSeedDoc>>;
  roomById: Map<string, Partial<AnlassraumDoc>>;
}): AtlasSourceRecord[] {
  return input.roundSeeds.map((seed, idx) => {
    const anlassId = toHex(seed?.anlassraumId);
    const room = anlassId ? input.roomById.get(anlassId) ?? null : null;
    const title = normalize(room?.title) ?? normalize(seed?.targetAudience) ?? `Anlass ${idx + 1}`;
    const topicKey = normalize(room?.topicKey);
    const lifecycle = lifecycleFromRoomStatus(normalize(room?.status));
    const status = normalizeSeedStatus(seed?.status);
    const contextGroups = contextGroupsFromRoom(room);
    const companionId = companionIdFromSeedTarget(seed?.publishTarget);

    return {
      title,
      topicKey,
      topicLabel: topicKey ? toLabel(topicKey) : null,
      regionKey: normalize(room?.regionKey),
      regionCode: regionCodeToString(room?.regionCode),
      anlassId,
      dossierId: toHex(room?.dossierId),
      roundId: toHex(seed?._id),
      resultId: status === "published" || status === "discarded" ? `result-${toHex(seed?._id) ?? idx}` : null,
      companionId,
      lifecycle,
      activityBand: activityBandFromOutputStatus(status),
      workState: workStateFromOutputStatus(status),
      contextGroups,
    };
  });
}

function normalize(value: unknown): string | null {
  const out = typeof value === "string" ? value.trim() : "";
  return out ? out : null;
}

function normalizeLimit(value: number | undefined): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return DEFAULT_LIMIT;
  return Math.max(40, Math.min(500, Math.floor(numeric)));
}

function toHex(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof ObjectId) return value.toHexString();
  const raw = String(value).trim();
  if (!ObjectId.isValid(raw)) return null;
  return new ObjectId(raw).toHexString();
}

function regionCodeToString(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "object" && value && "code" in (value as Record<string, unknown>)) {
    const code = (value as Record<string, unknown>).code;
    return typeof code === "string" && code.trim() ? code.trim() : null;
  }
  return null;
}

function normalizeSeedStatus(value: unknown): OutputSeedStatus {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "queued") return "queued";
  if (normalized === "review") return "review";
  if (normalized === "ready") return "ready";
  if (normalized === "published") return "published";
  if (normalized === "discarded") return "discarded";
  return "draft";
}

function activityBandFromOutputStatus(
  status: OutputSeedStatus,
): "none" | "low" | "medium" | "high" {
  if (status === "queued" || status === "draft") return "low";
  if (status === "review" || status === "ready") return "medium";
  if (status === "published" || status === "discarded") return "high";
  return "none";
}

function workStateFromOutputStatus(
  status: OutputSeedStatus,
): "unknown" | "monitoring" | "in_progress" | "review" | "completed" {
  if (status === "queued" || status === "draft") return "monitoring";
  if (status === "review") return "review";
  if (status === "ready") return "in_progress";
  if (status === "published" || status === "discarded") return "completed";
  return "unknown";
}

function lifecycleFromRoomStatus(
  status: string | null,
): "unknown" | "open" | "active" | "closed" | "archived" {
  if (!status) return "unknown";
  if (status === "archived") return "archived";
  if (status === "published") return "closed";
  if (status === "active" || status === "approved" || status === "reviewed") return "active";
  if (status === "draft" || status === "curated") return "open";
  return "unknown";
}

function toLabel(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function companionIdFromSeedTarget(value: unknown): string | null {
  const target = normalize(value);
  if (!target) return null;
  const match = target.match(/\/companion\/([^/?#]+)/);
  if (!match?.[1]) return null;
  return match[1];
}

function contextGroupsFromRoom(
  room: Partial<AnlassraumDoc> | null,
): DossierAtlasContextGroup[] {
  if (!room) return [];
  const ownerType = normalize(room.ownerType);
  const roomType = normalize(room.roomType);
  const sourceMode = normalize(room.sourceMode);
  const groups: DossierAtlasContextGroup[] = [];

  if (ownerType === "association") groups.push("association");
  if (ownerType === "initiative" || ownerType === "community") groups.push("initiative");
  if (
    ownerType === "organization" ||
    ownerType === "company" ||
    ownerType === "ngo" ||
    ownerType === "municipality" ||
    ownerType === "government" ||
    ownerType === "party"
  ) {
    groups.push("organization");
  }
  if (
    ownerType === "media" ||
    ownerType === "editorial" ||
    roomType === "editorial"
  ) {
    groups.push("editorial_publisher");
  }
  if (ownerType === "user" || ownerType === "community") {
    groups.push("civic_creator");
  }
  if (sourceMode === "single_source") {
    groups.push("expert_voice");
  }

  return Array.from(new Set(groups));
}
