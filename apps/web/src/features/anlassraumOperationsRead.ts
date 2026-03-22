import { ObjectId } from "@core/db/triMongo";
import { anlassraumCol, anlassraumSourceLinksCol, outputSeedCol } from "@features/anlassraum/db";
import { canActorAccessAnlassraum } from "@features/anlassraum/governance";
import { feedAnlassraumClusterCandidatesCol, voteDraftsCol } from "@features/feeds/db";
import {
  ANLASSRAUM_LIFECYCLE_STATUSES,
  ANLASSRAUM_SCOPES,
  LEGACY_ANLASSRAUM_STATUSES,
  type AnlassraumScope,
  type AnlassraumStatus,
} from "@features/anlassraum/types";
import type { GovernanceActor } from "@features/trust/types";
import { buildCreateFastPathHref } from "@/features/create/intents";

const KNOWN_STATUS = [...ANLASSRAUM_LIFECYCLE_STATUSES, ...LEGACY_ANLASSRAUM_STATUSES] as const;
const KNOWN_SCOPE = [...ANLASSRAUM_SCOPES] as const;

export const ANLASSRAUM_OPERATIONS_DEFAULT_LIMIT = 24;
export const ANLASSRAUM_OPERATIONS_MAX_LIMIT = 100;

export type AnlassraumOperationsStatusFilter = "all" | AnlassraumStatus;
export type AnlassraumOperationsScopeFilter = "all" | AnlassraumScope;

export type AnlassraumOperationsQuery = {
  q: string;
  status: AnlassraumOperationsStatusFilter;
  scope: AnlassraumOperationsScopeFilter;
  page: number;
  limit: number;
};

export type AnlassraumOperationsItem = {
  id: string;
  title: string;
  slug: string | null;
  status: string;
  scope: string | null;
  decisionScope: string | null;
  summary: string | null;
  regionKey: string | null;
  topicKey: string | null;
  clusterKey: string | null;
  sourceMode: string | null;
  originType: string | null;
  maturity: string | null;
  relevanceScore: number | null;
  riskFlags: string[];
  sourceCount: number;
  outputCount: number;
  outputTypes: string[];
  feedContext: {
    linkedDraftCount: number;
    queuedDraftCount: number;
    weakSignalDraftCount: number;
    latestDraftCreatedAt: string | null;
  };
  clusterContext: {
    clusterKey: string | null;
    peerRoomCount: number;
    candidateStatus: string | null;
    candidateDraftCount: number;
    candidateUpdatedAt: string | null;
  };
  isPublic: boolean;
  dossierId: string | null;
  dossierType: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  operationalHints: string[];
  links: {
    detailAdmin: string;
    detailJson: string;
    createContext: string;
    attachQueue: string;
    feedDrafts: string;
    feedClusterRooms: string;
    feedInputRooms: string;
    clusterControl: string;
    dossierAdmin: string | null;
  };
};

export type AnlassraumOperationsResult = {
  items: AnlassraumOperationsItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  filters: {
    q: string | null;
    status: AnlassraumOperationsStatusFilter;
    scope: AnlassraumOperationsScopeFilter;
  };
  scan: {
    scanned: number;
    visible: number;
  };
};

export function normalizeAnlassraumOperationsQuery(
  params: URLSearchParams | Record<string, unknown>,
): AnlassraumOperationsQuery {
  const read = (key: string) => {
    if (params instanceof URLSearchParams) return params.get(key);
    const value = params[key];
    if (value == null) return null;
    return String(value);
  };

  const q = normalizeQueryText(read("q"));
  const statusRaw = String(read("status") || "all").trim().toLowerCase();
  const scopeRaw = String(read("scope") || "all").trim().toLowerCase();

  if (statusRaw !== "all" && !KNOWN_STATUS.includes(statusRaw as AnlassraumStatus)) {
    throw new Error("invalid_anlassraum_operations_status");
  }
  if (scopeRaw !== "all" && !KNOWN_SCOPE.includes(scopeRaw as AnlassraumScope)) {
    throw new Error("invalid_anlassraum_operations_scope");
  }

  return {
    q,
    status: statusRaw as AnlassraumOperationsStatusFilter,
    scope: scopeRaw as AnlassraumOperationsScopeFilter,
    page: normalizePositiveInt(read("page"), 1, 1_000),
    limit: normalizePositiveInt(
      read("limit"),
      ANLASSRAUM_OPERATIONS_DEFAULT_LIMIT,
      ANLASSRAUM_OPERATIONS_MAX_LIMIT,
    ),
  };
}

export async function listAnlassraumOperations(input: {
  actor: GovernanceActor;
  query: AnlassraumOperationsQuery;
}): Promise<AnlassraumOperationsResult> {
  const Rooms = await anlassraumCol();

  const dbFilter: Record<string, unknown> = {};
  if (input.query.status !== "all") dbFilter.status = input.query.status;
  if (input.query.scope !== "all") dbFilter.scope = input.query.scope;

  const scanLimit = Math.min(2000, Math.max(200, input.query.page * input.query.limit * 6));
  const scannedDocs = await Rooms.find(dbFilter).sort({ updatedAt: -1, _id: -1 }).limit(scanLimit).toArray();
  const visibleDocs = scannedDocs.filter((doc) => canActorAccessAnlassraum(doc, input.actor, "read"));

  const q = input.query.q;
  const matchedDocs = q
    ? visibleDocs.filter((doc) => matchesOperationsQuery(doc as Record<string, unknown>, q))
    : visibleDocs;

  const total = matchedDocs.length;
  const start = (input.query.page - 1) * input.query.limit;
  const pageDocs = matchedDocs.slice(start, start + input.query.limit);

  const roomIds = pageDocs
    .map((doc) => toObjectId(doc._id))
    .filter((value): value is ObjectId => value instanceof ObjectId);
  const clusterKeys = Array.from(
    new Set(
      pageDocs
        .map((doc) => asText((doc as Record<string, unknown>).clusterKey))
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const [sourceCounts, outputs, draftBuckets, clusterCandidates, clusterPeers] = await Promise.all([
    roomIds.length > 0
      ? (await anlassraumSourceLinksCol())
          .aggregate<{ _id: ObjectId; count: number }>([
            { $match: { anlassraumId: { $in: roomIds } } },
            { $group: { _id: "$anlassraumId", count: { $sum: 1 } } },
          ])
          .toArray()
      : [],
    roomIds.length > 0
      ? (await outputSeedCol())
          .find({ anlassraumId: { $in: roomIds } }, { projection: { anlassraumId: 1, outputType: 1 } })
          .toArray()
      : [],
    roomIds.length > 0
      ? (await voteDraftsCol())
          .aggregate<{
            _id: { anlassraumId?: ObjectId; feedReviewState?: string };
            count: number;
            latestCreatedAt?: Date | string | null;
          }>([
            { $match: { anlassraumId: { $in: roomIds } } },
            {
              $group: {
                _id: {
                  anlassraumId: "$anlassraumId",
                  feedReviewState: { $ifNull: ["$feedReviewState", "queued"] },
                },
                count: { $sum: 1 },
                latestCreatedAt: { $max: "$createdAt" },
              },
            },
          ])
          .toArray()
      : [],
    clusterKeys.length > 0
      ? (await feedAnlassraumClusterCandidatesCol())
          .find(
            { clusterKey: { $in: clusterKeys } },
            { projection: { clusterKey: 1, status: 1, draftCount: 1, updatedAt: 1 } },
          )
          .toArray()
      : [],
    clusterKeys.length > 0
      ? Rooms.aggregate<{ _id: string; count: number }>([
          { $match: { clusterKey: { $in: clusterKeys } } },
          { $group: { _id: "$clusterKey", count: { $sum: 1 } } },
        ]).toArray()
      : [],
  ]);

  const sourceCountByRoom = new Map<string, number>();
  for (const row of sourceCounts) {
    sourceCountByRoom.set(row._id.toHexString(), row.count);
  }

  const outputMetaByRoom = new Map<string, { count: number; outputTypes: Set<string> }>();
  for (const output of outputs as Array<{ anlassraumId?: ObjectId; outputType?: unknown }>) {
    if (!(output.anlassraumId instanceof ObjectId)) continue;
    const key = output.anlassraumId.toHexString();
    const current = outputMetaByRoom.get(key) ?? { count: 0, outputTypes: new Set<string>() };
    current.count += 1;
    const outputType = asText(output.outputType);
    if (outputType) current.outputTypes.add(outputType);
    outputMetaByRoom.set(key, current);
  }

  const feedContextByRoom = new Map<
    string,
    {
      linkedDraftCount: number;
      queuedDraftCount: number;
      weakSignalDraftCount: number;
      latestDraftCreatedAt: string | null;
    }
  >();
  for (const bucket of draftBuckets) {
    const roomId = bucket?._id?.anlassraumId;
    if (!(roomId instanceof ObjectId)) continue;

    const key = roomId.toHexString();
    const current = feedContextByRoom.get(key) ?? {
      linkedDraftCount: 0,
      queuedDraftCount: 0,
      weakSignalDraftCount: 0,
      latestDraftCreatedAt: null,
    };
    current.linkedDraftCount += Number(bucket.count) || 0;

    const state = String(bucket?._id?.feedReviewState ?? "queued").toLowerCase();
    if (state === "queued") current.queuedDraftCount += Number(bucket.count) || 0;
    if (state === "weak_signal") current.weakSignalDraftCount += Number(bucket.count) || 0;

    const latest = asIso(bucket.latestCreatedAt);
    if (latest && (!current.latestDraftCreatedAt || latest > current.latestDraftCreatedAt)) {
      current.latestDraftCreatedAt = latest;
    }
    feedContextByRoom.set(key, current);
  }

  const clusterCandidateByKey = new Map<
    string,
    {
      status: string | null;
      draftCount: number;
      updatedAt: string | null;
    }
  >();
  for (const candidate of clusterCandidates) {
    const key = asText((candidate as Record<string, unknown>).clusterKey);
    if (!key) continue;
    clusterCandidateByKey.set(key, {
      status: asText((candidate as Record<string, unknown>).status),
      draftCount: Math.max(0, Math.floor(asFiniteNumber((candidate as Record<string, unknown>).draftCount) ?? 0)),
      updatedAt: asIso((candidate as Record<string, unknown>).updatedAt),
    });
  }

  const clusterPeerCountByKey = new Map<string, number>();
  for (const clusterPeer of clusterPeers) {
    const key = asText(clusterPeer._id);
    if (!key) continue;
    clusterPeerCountByKey.set(key, Math.max(0, Math.floor(Number(clusterPeer.count) || 0)));
  }

  const items = pageDocs.map((doc) => {
    const normalized = normalizeAnlassraumOperationsDoc(doc as Record<string, unknown>);
    const sourceCount = sourceCountByRoom.get(normalized.id) ?? 0;
    const outputMeta = outputMetaByRoom.get(normalized.id) ?? { count: 0, outputTypes: new Set<string>() };
    const outputTypes = Array.from(outputMeta.outputTypes).sort((left, right) => left.localeCompare(right));
    const feedContext = feedContextByRoom.get(normalized.id) ?? {
      linkedDraftCount: 0,
      queuedDraftCount: 0,
      weakSignalDraftCount: 0,
      latestDraftCreatedAt: null,
    };
    const clusterContext = normalized.clusterKey
      ? {
          clusterKey: normalized.clusterKey,
          peerRoomCount: clusterPeerCountByKey.get(normalized.clusterKey) ?? 0,
          candidateStatus: clusterCandidateByKey.get(normalized.clusterKey)?.status ?? null,
          candidateDraftCount: clusterCandidateByKey.get(normalized.clusterKey)?.draftCount ?? 0,
          candidateUpdatedAt: clusterCandidateByKey.get(normalized.clusterKey)?.updatedAt ?? null,
        }
      : {
          clusterKey: null,
          peerRoomCount: 0,
          candidateStatus: null,
          candidateDraftCount: 0,
          candidateUpdatedAt: null,
        };

    return {
      ...normalized,
      sourceCount,
      outputCount: outputMeta.count,
      outputTypes,
      feedContext,
      clusterContext,
      operationalHints: buildOperationalHints({
        status: normalized.status,
        sourceMode: normalized.sourceMode,
        summary: normalized.summary,
        topicKey: normalized.topicKey,
        clusterKey: normalized.clusterKey,
        clusterCandidateStatus: clusterContext.candidateStatus,
        dossierId: normalized.dossierId,
        riskFlags: normalized.riskFlags,
        sourceCount,
        outputCount: outputMeta.count,
        updatedAt: normalized.updatedAt,
      }),
      links: {
        detailAdmin: `/admin/feeds/anlassraum/${encodeURIComponent(normalized.id)}`,
        detailJson: `/api/admin/feeds/anlassraum/${encodeURIComponent(normalized.id)}`,
        createContext: buildCreateFastPathHref({
          anlassraumId: normalized.id,
          source: "anlassraum_operations",
          signalTitle: normalized.title,
          region: normalized.regionKey,
          scope: normalized.scope,
          clusterHint: normalized.clusterKey,
          reason: "manual_fast_path_via_create",
        }),
        attachQueue: `/admin/create/attach-drafts?reviewState=all&q=${encodeURIComponent(normalized.id)}`,
        feedDrafts: `/admin/feeds/drafts?hasAnlassraum=linked&anlassraumId=${encodeURIComponent(normalized.id)}`,
        feedClusterRooms: `/admin/feeds/anlassraum?sourceMode=cluster`,
        feedInputRooms: `/admin/feeds/anlassraum?sourceMode=feed`,
        clusterControl: `/admin/feeds`,
        dossierAdmin: normalized.dossierId
          ? `/admin/dossiers/${encodeURIComponent(normalized.dossierId)}`
          : null,
      },
    } satisfies AnlassraumOperationsItem;
  });

  return {
    items,
    total,
    page: input.query.page,
    limit: input.query.limit,
    hasMore: start + items.length < total,
    filters: {
      q: q || null,
      status: input.query.status,
      scope: input.query.scope,
    },
    scan: {
      scanned: scannedDocs.length,
      visible: visibleDocs.length,
    },
  };
}

export function normalizeAnlassraumOperationsDoc(
  doc: Record<string, unknown>,
): Omit<
  AnlassraumOperationsItem,
  "sourceCount" | "outputCount" | "outputTypes" | "feedContext" | "clusterContext" | "operationalHints" | "links"
> {
  const id = deriveDocId(doc);
  const title = asText(doc.title) || "Anlassraum ohne Titel";
  const slug = asText(doc.slug) || null;
  const status = normalizeStatusForDisplay(doc.status);
  const scope = normalizeScopeForDisplay(doc.scope);
  const decisionScope = normalizeScopeForDisplay(doc.decisionScope);
  const summary = normalizeSummary(doc.summary);
  const createdAt = asIso(doc.createdAt);
  const updatedAt = asIso(doc.updatedAt);

  return {
    id,
    title,
    slug,
    status,
    scope,
    decisionScope,
    summary,
    regionKey: asText(doc.regionKey),
    topicKey: asText(doc.topicKey),
    clusterKey: asText(doc.clusterKey),
    sourceMode: asText(doc.sourceMode),
    originType: asText(doc.originType),
    maturity: asText(doc.maturity),
    relevanceScore: asFiniteNumber(doc.relevanceScore),
    riskFlags: asStringArray(doc.riskFlags),
    isPublic: doc.isPublic === true,
    dossierId: asIdOrNull(doc.dossierId),
    dossierType: asText(doc.dossierType),
    createdAt,
    updatedAt,
  };
}

function buildOperationalHints(input: {
  status: string;
  sourceMode: string | null;
  summary: string | null;
  topicKey: string | null;
  clusterKey: string | null;
  clusterCandidateStatus: string | null;
  dossierId: string | null;
  riskFlags: string[];
  sourceCount: number;
  outputCount: number;
  updatedAt: string | null;
}): string[] {
  const hints = new Set<string>();

  if (!input.summary) hints.add("missing_summary");
  if (!input.topicKey) hints.add("missing_topic_key");
  if (input.sourceCount === 0) hints.add("missing_source_links");
  if (input.outputCount === 0) hints.add("missing_output_seeds");
  if (input.sourceMode === "cluster" && !input.clusterKey) hints.add("missing_cluster_key");
  if (input.clusterKey && !input.clusterCandidateStatus) hints.add("missing_cluster_candidate");
  if (!input.dossierId) hints.add("no_dossier_link");
  if (input.riskFlags.length > 0) hints.add("risk_flags_present");
  if ((LEGACY_ANLASSRAUM_STATUSES as readonly string[]).includes(input.status)) {
    hints.add("legacy_status");
  }
  if (isStaleIso(input.updatedAt, 30)) hints.add("stale_30d");

  return Array.from(hints);
}

function matchesOperationsQuery(doc: Record<string, unknown>, q: string): boolean {
  const normalized = q.toLowerCase();
  const candidates = [
    deriveDocId(doc),
    asText(doc.title),
    asText(doc.slug),
    asText(doc.summary),
    asText(doc.topicKey),
    asText(doc.clusterKey),
    asText(doc.regionKey),
    asText(doc.status),
    asText(doc.sourceMode),
  ].filter((value): value is string => typeof value === "string" && value.length > 0);

  return candidates.some((value) => value.toLowerCase().includes(normalized));
}

function normalizeStatusForDisplay(value: unknown): string {
  const raw = asText(value);
  if (!raw) return "unknown";
  if (KNOWN_STATUS.includes(raw as AnlassraumStatus)) return raw;
  return "unknown";
}

function normalizeScopeForDisplay(value: unknown): string | null {
  const raw = asText(value);
  if (!raw) return null;
  if (KNOWN_SCOPE.includes(raw as AnlassraumScope)) return raw;
  return null;
}

function normalizeSummary(value: unknown): string | null {
  const summary = asText(value);
  if (!summary) return null;
  return summary.slice(0, 360);
}

function normalizeQueryText(value: unknown): string {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

function normalizePositiveInt(value: unknown, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.floor(parsed);
  if (rounded <= 0) return fallback;
  return Math.min(max, rounded);
}

function asText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => asText(entry))
    .filter((entry): entry is string => typeof entry === "string");
}

function asFiniteNumber(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function toObjectId(value: unknown): ObjectId | null {
  if (value instanceof ObjectId) return value;
  if (typeof value === "string" && ObjectId.isValid(value)) return new ObjectId(value);
  return null;
}

function asId(value: unknown): string {
  if (value instanceof ObjectId) return value.toHexString();
  if (typeof value === "string" && value.trim()) return value.trim();
  return "";
}

function asIdOrNull(value: unknown): string | null {
  if (value instanceof ObjectId) return value.toHexString();
  if (typeof value === "string" && value.trim()) return value.trim();
  return null;
}

function asIso(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const date = new Date(trimmed);
    if (!Number.isNaN(date.getTime())) return date.toISOString();
  }
  return null;
}

function isStaleIso(value: string | null, thresholdDays: number): boolean {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const ageMs = Date.now() - date.getTime();
  const thresholdMs = thresholdDays * 24 * 60 * 60 * 1000;
  return ageMs > thresholdMs;
}

function deriveDocId(doc: Record<string, unknown>): string {
  const native = asId(doc._id);
  if (native) return native;

  const seed = [
    asText(doc.slug) ?? "",
    asText(doc.title) ?? "",
    asIso(doc.createdAt) ?? "",
    asIso(doc.updatedAt) ?? "",
  ].join("|");

  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const suffix = (hash >>> 0).toString(16).padStart(8, "0");
  return `missing-${suffix}`;
}
