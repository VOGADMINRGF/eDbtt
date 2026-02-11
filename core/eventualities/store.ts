import crypto from "node:crypto";
import type {
  AnalyzeResult,
  ConsequenceRecord,
  DecisionTree,
  EventualityNode,
  ResponsibilityPath,
  ResponsibilityRecord,
  ScenarioOption,
} from "@features/analyze/schemas";
import {
  ConsequenceRecordSchema,
  DecisionTreeSchema,
  EventualityNodeSchema,
  ResponsibilityPathSchema,
  ResponsibilityRecordSchema,
} from "@features/analyze/schemas";
import { logger } from "@core/observability/logger";
import { maskUserId } from "@core/pii/redact";
import {
  decisionTreesCol,
  eventualityNodesCol,
  eventualitySnapshotsCol,
} from "./db";
import type {
  DecisionTreeDoc,
  EventualityNodeDoc,
  EventualitySnapshotDoc,
  ImpactSnapshot,
} from "./types";

type ContributionIdInput = string | { toString(): string };

type PersistArgs = {
  result: AnalyzeResult;
  contributionId: string;
  locale?: string;
  userId?: string | null;
};

type StructuredPayload = {
  nodes: EventualityNode[];
  trees: DecisionTree[];
  consequences: ConsequenceRecord[];
  responsibilities: ResponsibilityRecord[];
  responsibilityPaths: ResponsibilityPath[];
  invalid: {
    nodes: number;
    trees: number;
    consequences: number;
    responsibilities: number;
    paths: number;
  };
};

export async function persistEventualitiesSnapshot({
  result,
  contributionId,
  locale,
  userId,
}: PersistArgs): Promise<EventualitySnapshotDoc | null> {
  const effectiveLocale = locale || result.language || "de";
  const payload = sanitizeStructuredPayload(result);

  const hasStructuredPayload =
    payload.nodes.length > 0 ||
    payload.trees.length > 0 ||
    payload.consequences.length > 0 ||
    payload.responsibilities.length > 0 ||
    payload.responsibilityPaths.length > 0;

  if (
    payload.invalid.nodes > 0 ||
    payload.invalid.trees > 0 ||
    payload.invalid.consequences > 0 ||
    payload.invalid.responsibilities > 0 ||
    payload.invalid.paths > 0
  ) {
    logger.warn(
      {
        msg: "eventualities.payload.sanitized",
        contributionId,
        userIdMasked: maskUserId(userId),
        dropped: payload.invalid,
      },
      "Dropped invalid eventuality payload items before persistence",
    );
  }

  if (!hasStructuredPayload) {
    await Promise.all([
      eventualityNodesCol().then((col) => col.deleteMany({ contributionId })),
      decisionTreesCol().then((col) => col.deleteMany({ contributionId })),
      eventualitySnapshotsCol().then((col) => col.deleteOne({ contributionId })),
    ]);
    return null;
  }

  const [nodesCol, treesCol, snapshotsCol] = await Promise.all([
    eventualityNodesCol(),
    decisionTreesCol(),
    eventualitySnapshotsCol(),
  ]);

  await Promise.all([
    nodesCol.deleteMany({ contributionId }),
    treesCol.deleteMany({ contributionId }),
  ]);

  const now = new Date();

  if (payload.nodes.length) {
    const docs: EventualityNodeDoc[] = payload.nodes.map((node, idx) => ({
      contributionId,
      nodeId: ensureStableId(node.id, `${contributionId}:evt:${idx}`),
      statementId: node.statementId,
      locale: effectiveLocale,
      option: normalizeScenarioOption(node.stance),
      payload: node,
      createdAt: now,
      updatedAt: now,
    }));
    await nodesCol.insertMany(docs, { ordered: false });
  }

  if (payload.trees.length) {
    const docs: DecisionTreeDoc[] = payload.trees.map((tree, idx) => ({
      contributionId,
      treeId: ensureStableId(tree.id, `${contributionId}:tree:${tree.rootStatementId}:${idx}`),
      rootStatementId: tree.rootStatementId,
      locale: tree.locale ?? effectiveLocale,
      payload: tree,
      createdAt: now,
      updatedAt: now,
    }));
    await treesCol.insertMany(docs, { ordered: false });
  }

  const snapshot = await snapshotsCol.findOneAndUpdate(
    { contributionId },
    {
      $set: {
        locale: effectiveLocale,
        userHash: hashUserId(userId),
        userIdMasked: maskUserId(userId),
        nodesCount: payload.nodes.length,
        treesCount: payload.trees.length,
        consequences: payload.consequences,
        responsibilities: payload.responsibilities,
        responsibilityPaths: payload.responsibilityPaths,
        consequencesCount: payload.consequences.length,
        responsibilitiesCount: payload.responsibilities.length,
        pathsCount: payload.responsibilityPaths.length,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
        reviewed: false,
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  return snapshot ?? null;
}

export async function listEventualitySnapshots(limit = 200): Promise<EventualitySnapshotDoc[]> {
  const col = await eventualitySnapshotsCol();
  return col
    .find({})
    .sort({ createdAt: -1 })
    .limit(Math.max(1, limit))
    .toArray();
}

export async function getEventualitySnapshot(contributionId: string): Promise<EventualitySnapshotDoc | null> {
  const col = await eventualitySnapshotsCol();
  return col.findOne({ contributionId });
}

export async function markEventualitySnapshotReviewed(
  contributionId: string,
  reviewed: boolean,
  reviewedBy?: string | null,
): Promise<EventualitySnapshotDoc | null> {
  const col = await eventualitySnapshotsCol();
  const now = new Date();
  const update: Record<string, any> = {
    reviewed,
    updatedAt: now,
  };
  if (reviewed) {
    update.reviewedAt = now;
    update.reviewedBy = reviewedBy ?? null;
  } else {
    update.reviewedAt = null;
    update.reviewedBy = null;
  }
  const result = await col.findOneAndUpdate(
    { contributionId },
    { $set: update },
    { returnDocument: "after" },
  );
  return result ?? null;
}

export async function getEventualitiesByContribution(contributionId: string) {
  const [snapshot, nodesDoc, treesDoc] = await Promise.all([
    getEventualitySnapshot(contributionId),
    eventualityNodesCol().then((col) =>
      col
        .find({ contributionId })
        .sort({ createdAt: 1 })
        .toArray(),
    ),
    decisionTreesCol().then((col) =>
      col
        .find({ contributionId })
        .sort({ createdAt: 1 })
        .toArray(),
    ),
  ]);

  if (!snapshot) return null;

  return {
    snapshot,
    eventualities: nodesDoc.map((doc) => doc.payload),
    decisionTrees: treesDoc.map((doc) => doc.payload),
    consequences: snapshot.consequences ?? [],
    responsibilities: snapshot.responsibilities ?? [],
    responsibilityPaths: snapshot.responsibilityPaths ?? [],
  };
}

export async function getImpactSnapshotByContribution(
  contributionIdInput: ContributionIdInput,
): Promise<ImpactSnapshot> {
  const contributionId = normalizeContributionId(contributionIdInput);
  const snapshotData = await getEventualitiesByContribution(contributionId);

  if (!snapshotData) {
    return {
      contributionId,
      locale: undefined,
      eventualities: [],
      decisionTrees: [],
      consequences: [],
      responsibilities: [],
      responsibilityPaths: [],
    };
  }

  return {
    contributionId: snapshotData.snapshot.contributionId ?? contributionId,
    locale: snapshotData.snapshot.locale,
    eventualities: snapshotData.eventualities ?? [],
    decisionTrees: snapshotData.decisionTrees ?? [],
    consequences: snapshotData.consequences ?? [],
    responsibilities: snapshotData.responsibilities ?? [],
    responsibilityPaths: snapshotData.responsibilityPaths ?? [],
  };
}

function ensureStableId(value: string | undefined, seed: string): string {
  const trimmed = value?.trim();
  if (trimmed) return trimmed;
  return crypto.createHash("sha1").update(seed).digest("hex").slice(0, 16);
}

function normalizeScenarioOption(option?: ScenarioOption | null): ScenarioOption | null {
  if (!option) return null;
  const normalized = option.toLowerCase();
  return normalized === "pro" || normalized === "neutral" || normalized === "contra"
    ? (normalized as ScenarioOption)
    : null;
}

function hashUserId(userId?: string | null): string | null {
  if (!userId) return null;
  return crypto.createHash("sha1").update(userId).digest("hex");
}

function normalizeContributionId(value: ContributionIdInput): string {
  if (typeof value === "string") return value.trim();
  try {
    return value.toString();
  } catch {
    return String(value);
  }
}

function sanitizeStructuredPayload(result: AnalyzeResult): StructuredPayload {
  const nodeResults = sanitizeList(result.eventualities, EventualityNodeSchema);
  const treeResults = sanitizeList(result.decisionTrees, DecisionTreeSchema);
  const consequenceBundle = result.consequences ?? null;
  const consequences = sanitizeList(consequenceBundle?.consequences, ConsequenceRecordSchema);
  const responsibilities = sanitizeList(consequenceBundle?.responsibilities, ResponsibilityRecordSchema);
  const paths = sanitizeList(result.responsibilityPaths, ResponsibilityPathSchema);

  return {
    nodes: nodeResults.valid,
    trees: treeResults.valid,
    consequences: consequences.valid,
    responsibilities: responsibilities.valid,
    responsibilityPaths: paths.valid,
    invalid: {
      nodes: nodeResults.invalid,
      trees: treeResults.invalid,
      consequences: consequences.invalid,
      responsibilities: responsibilities.invalid,
      paths: paths.invalid,
    },
  };
}

function sanitizeList<T>(value: unknown, schema: { safeParse: (input: unknown) => { success: boolean; data?: T } }): {
  valid: T[];
  invalid: number;
} {
  if (!Array.isArray(value)) return { valid: [], invalid: 0 };

  const valid: T[] = [];
  let invalid = 0;

  for (const item of value) {
    const parsed = schema.safeParse(item);
    if (parsed.success) {
      valid.push(parsed.data as T);
      continue;
    }
    invalid += 1;
  }

  return { valid, invalid };
}
