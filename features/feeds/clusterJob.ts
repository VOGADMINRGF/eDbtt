import { createHash } from "crypto";
import { ObjectId } from "@core/db/triMongo";
import { feedAnlassraumClusterCandidatesCol, voteDraftsCol } from "./db";
import type {
  FeedAnlassraumClusterCandidateDoc,
  VoteDraftDoc,
} from "./types";

const DEFAULT_LIMIT = 600;
const DEFAULT_WINDOW_HOURS = 72;
const DEFAULT_MIN_ITEMS = 2;
const FEED_CLUSTER_SOURCE_PIPELINES = ["feeds_to_statementCandidate"] as const;

export type FeedAnlassraumClusterJobAction = "created" | "updated" | "unchanged";
export type FeedAnlassraumClusterJobStatus = "success" | "empty";
export type FeedAnlassraumClusterJobEmptyReason = "no_source_items" | "no_cluster_candidates";

export type RunFeedAnlassraumClusterJobInput = {
  limit?: number;
  windowHours?: number;
  minItemsPerCluster?: number;
  dryRun?: boolean;
};

export type FeedAnlassraumClusterJobItem = {
  clusterKey: string;
  topicKey: string;
  regionCode: string | null;
  windowBucket: string;
  action: FeedAnlassraumClusterJobAction;
  draftCount: number;
  anlassraumCount: number;
  sampleTitles: string[];
  candidateId: string | null;
};

export type RunFeedAnlassraumClusterJobResult = {
  status: FeedAnlassraumClusterJobStatus;
  emptyReason: FeedAnlassraumClusterJobEmptyReason | null;
  dryRun: boolean;
  source: {
    scannedDrafts: number;
    eligibleDrafts: number;
  };
  summary: {
    totalClusters: number;
    created: number;
    updated: number;
    unchanged: number;
  };
  clusters: FeedAnlassraumClusterJobItem[];
};

type ClusterableDraft = {
  draftId: ObjectId;
  anlassraumId: ObjectId | null;
  title: string;
  topicKey: string;
  regionCode: string | null;
  windowBucket: string;
};

type ClusterAccumulator = {
  clusterKey: string;
  topicKey: string;
  regionCode: string | null;
  windowBucket: string;
  draftIds: Set<string>;
  anlassraumIds: Set<string>;
  sampleTitles: string[];
};

export async function runFeedAnlassraumClusterJob(
  input: RunFeedAnlassraumClusterJobInput = {},
): Promise<RunFeedAnlassraumClusterJobResult> {
  const limit = normalizeLimit(input.limit);
  const windowHours = normalizeWindowHours(input.windowHours);
  const minItemsPerCluster = normalizeMinItemsPerCluster(input.minItemsPerCluster);
  const dryRun = input.dryRun === true;

  const drafts = await listSourceDrafts(limit);
  if (drafts.length === 0) {
    return buildEmptyResult({
      dryRun,
      reason: "no_source_items",
      scannedDrafts: 0,
      eligibleDrafts: 0,
    });
  }

  const eligibleDrafts = drafts
    .map((draft) => toClusterableDraft(draft, windowHours))
    .filter((draft): draft is ClusterableDraft => Boolean(draft));
  const grouped = groupDrafts(eligibleDrafts, minItemsPerCluster);
  if (!grouped.length) {
    return buildEmptyResult({
      dryRun,
      reason: "no_cluster_candidates",
      scannedDrafts: drafts.length,
      eligibleDrafts: eligibleDrafts.length,
    });
  }

  const clustersCol = await feedAnlassraumClusterCandidatesCol().catch(() => {
    throw new Error("feed_anlassraum_cluster_job_failed");
  });

  const outcomes: FeedAnlassraumClusterJobItem[] = [];
  for (const cluster of grouped) {
    const now = new Date();
    const draftIds = Array.from(cluster.draftIds)
      .sort()
      .map((id) => new ObjectId(id));
    const anlassraumIds = Array.from(cluster.anlassraumIds)
      .sort()
      .map((id) => new ObjectId(id));
    const sampleTitles = cluster.sampleTitles.slice(0, 3);
    const fingerprint = buildFingerprint({
      clusterKey: cluster.clusterKey,
      draftIds: draftIds.map((id) => id.toHexString()),
      anlassraumIds: anlassraumIds.map((id) => id.toHexString()),
      sampleTitles,
    });

    const existing = await clustersCol.findOne({ clusterKey: cluster.clusterKey }).catch(() => {
      throw new Error("feed_anlassraum_cluster_job_failed");
    });
    const action = resolveAction(existing, fingerprint);
    let candidateId = existing?._id?.toHexString() ?? null;

    if (!dryRun) {
      if (action === "created") {
        const doc: FeedAnlassraumClusterCandidateDoc = {
          clusterKey: cluster.clusterKey,
          topicKey: cluster.topicKey,
          regionCode: cluster.regionCode,
          windowBucket: cluster.windowBucket,
          windowHours,
          source: "vote_drafts",
          status: "candidate",
          draftIds,
          anlassraumIds,
          draftCount: draftIds.length,
          sampleTitles,
          fingerprint,
          createdAt: now,
          updatedAt: now,
        };
        const inserted = await clustersCol.insertOne(doc).catch(() => {
          throw new Error("feed_anlassraum_cluster_job_failed");
        });
        candidateId = inserted.insertedId?.toHexString?.() ?? candidateId;
      } else if (action === "updated") {
        await clustersCol
          .updateOne(
            { clusterKey: cluster.clusterKey },
            {
              $set: {
                topicKey: cluster.topicKey,
                regionCode: cluster.regionCode,
                windowBucket: cluster.windowBucket,
                windowHours,
                source: "vote_drafts",
                status: "candidate",
                draftIds,
                anlassraumIds,
                draftCount: draftIds.length,
                sampleTitles,
                fingerprint,
                updatedAt: now,
              } satisfies Partial<FeedAnlassraumClusterCandidateDoc>,
            },
          )
          .catch(() => {
            throw new Error("feed_anlassraum_cluster_job_failed");
          });
      }
    }

    outcomes.push({
      clusterKey: cluster.clusterKey,
      topicKey: cluster.topicKey,
      regionCode: cluster.regionCode,
      windowBucket: cluster.windowBucket,
      action,
      draftCount: draftIds.length,
      anlassraumCount: anlassraumIds.length,
      sampleTitles,
      candidateId,
    });
  }

  return {
    status: "success",
    emptyReason: null,
    dryRun,
    source: {
      scannedDrafts: drafts.length,
      eligibleDrafts: eligibleDrafts.length,
    },
    summary: {
      totalClusters: outcomes.length,
      created: outcomes.filter((item) => item.action === "created").length,
      updated: outcomes.filter((item) => item.action === "updated").length,
      unchanged: outcomes.filter((item) => item.action === "unchanged").length,
    },
    clusters: outcomes,
  };
}

async function listSourceDrafts(limit: number): Promise<VoteDraftDoc[]> {
  try {
    const drafts = await voteDraftsCol();
    return drafts
      .find({
        status: { $in: ["draft", "review"] },
        pipeline: { $in: [...FEED_CLUSTER_SOURCE_PIPELINES] },
      })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(limit)
      .toArray();
  } catch {
    throw new Error("feed_anlassraum_cluster_source_unavailable");
  }
}

function toClusterableDraft(draft: VoteDraftDoc, windowHours: number): ClusterableDraft | null {
  const draftId = draft?._id;
  if (!draftId) return null;

  const topicKey = normalizeTopicKey(
    firstNonEmpty(
      draft.claims?.find((claim) => String(claim?.topic || "").trim())?.topic,
      Array.isArray(draft.tags) ? draft.tags.find((tag) => String(tag || "").trim()) : null,
      draft.title,
    ),
  );
  const regionCode = normalizeRegionCode(draft.regionCode ?? null);
  const when = normalizeDate(draft.updatedAt ?? draft.createdAt ?? null);
  const windowBucket = toWindowBucket(when ?? new Date(), windowHours);

  return {
    draftId,
    anlassraumId: draft.anlassraumId ?? null,
    title: normalizeTitle(draft.title, draftId),
    topicKey,
    regionCode,
    windowBucket,
  };
}

function groupDrafts(
  drafts: ClusterableDraft[],
  minItemsPerCluster: number,
): ClusterAccumulator[] {
  const grouped = new Map<string, ClusterAccumulator>();
  for (const draft of drafts) {
    const clusterKey = buildClusterKey(draft.regionCode, draft.topicKey, draft.windowBucket);
    const hit =
      grouped.get(clusterKey) ??
      {
        clusterKey,
        topicKey: draft.topicKey,
        regionCode: draft.regionCode,
        windowBucket: draft.windowBucket,
        draftIds: new Set<string>(),
        anlassraumIds: new Set<string>(),
        sampleTitles: [],
      };

    hit.draftIds.add(draft.draftId.toHexString());
    if (draft.anlassraumId) {
      hit.anlassraumIds.add(draft.anlassraumId.toHexString());
    }
    if (hit.sampleTitles.length < 3 && !hit.sampleTitles.includes(draft.title)) {
      hit.sampleTitles.push(draft.title);
    }
    grouped.set(clusterKey, hit);
  }

  return Array.from(grouped.values())
    .filter((item) => item.draftIds.size >= minItemsPerCluster)
    .sort((a, b) => {
      const diff = b.draftIds.size - a.draftIds.size;
      if (diff !== 0) return diff;
      return a.clusterKey.localeCompare(b.clusterKey);
    });
}

function resolveAction(
  existing: FeedAnlassraumClusterCandidateDoc | null,
  fingerprint: string,
): FeedAnlassraumClusterJobAction {
  if (!existing) return "created";
  if (existing.fingerprint === fingerprint) return "unchanged";
  return "updated";
}

function buildFingerprint(input: {
  clusterKey: string;
  draftIds: string[];
  anlassraumIds: string[];
  sampleTitles: string[];
}): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        clusterKey: input.clusterKey,
        draftIds: input.draftIds,
        anlassraumIds: input.anlassraumIds,
        sampleTitles: input.sampleTitles,
      }),
    )
    .digest("hex");
}

function buildClusterKey(regionCode: string | null, topicKey: string, windowBucket: string): string {
  return ["feed_cluster", regionCode ?? "global", topicKey, windowBucket].join("|");
}

function normalizeLimit(value: number | undefined): number {
  if (value == null) return DEFAULT_LIMIT;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("invalid_limit");
  }
  return Math.min(2000, Math.floor(parsed));
}

function normalizeWindowHours(value: number | undefined): number {
  if (value == null) return DEFAULT_WINDOW_HOURS;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("invalid_window_hours");
  }
  return Math.max(24, Math.min(240, Math.floor(parsed)));
}

function normalizeMinItemsPerCluster(value: number | undefined): number {
  if (value == null) return DEFAULT_MIN_ITEMS;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    throw new Error("invalid_min_items_per_cluster");
  }
  return Math.max(1, Math.min(50, Math.floor(parsed)));
}

function normalizeRegionCode(value: unknown): string | null {
  const normalized = String(value || "").trim().toUpperCase();
  if (!normalized) return null;
  return normalized.slice(0, 24);
}

function normalizeTopicKey(value: unknown): string {
  return (
    String(value || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9äöüß-]/g, "")
      .slice(0, 64) || "allgemein"
  );
}

function normalizeTitle(value: unknown, draftId: ObjectId): string {
  const normalized = String(value || "").trim();
  if (normalized) return normalized.slice(0, 180);
  return `Draft ${draftId.toHexString().slice(-8)}`;
}

function normalizeDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toWindowBucket(date: Date, hours: number): string {
  const windowMs = Math.max(1, hours) * 60 * 60 * 1000;
  const floored = new Date(Math.floor(date.getTime() / windowMs) * windowMs);
  return [
    floored.getUTCFullYear(),
    String(floored.getUTCMonth() + 1).padStart(2, "0"),
    String(floored.getUTCDate()).padStart(2, "0"),
    String(floored.getUTCHours()).padStart(2, "0"),
  ].join("");
}

function firstNonEmpty(...values: Array<unknown>): string | null {
  for (const value of values) {
    const normalized = String(value || "").trim();
    if (normalized) return normalized;
  }
  return null;
}

function buildEmptyResult(input: {
  dryRun: boolean;
  reason: FeedAnlassraumClusterJobEmptyReason;
  scannedDrafts: number;
  eligibleDrafts: number;
}): RunFeedAnlassraumClusterJobResult {
  return {
    status: "empty",
    emptyReason: input.reason,
    dryRun: input.dryRun,
    source: {
      scannedDrafts: input.scannedDrafts,
      eligibleDrafts: input.eligibleDrafts,
    },
    summary: {
      totalClusters: 0,
      created: 0,
      updated: 0,
      unchanged: 0,
    },
    clusters: [],
  };
}
