import { coreCol, type ObjectId } from "@core/db/triMongo";

export const SOCIAL_REVIEW_PERSISTED_DECISIONS = [
  "approved_for_social",
  "held_back",
  "deferred",
  "internal_only",
  "marked_for_rework",
] as const;

export type SocialReviewPersistedDecision =
  (typeof SOCIAL_REVIEW_PERSISTED_DECISIONS)[number];

type SocialReviewDecisionDoc = {
  _id?: ObjectId;
  entryId: string;
  decision: SocialReviewPersistedDecision;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  updatedByUserId: string | null;
};

type SocialReviewDecisionEventDoc = {
  _id?: ObjectId;
  entryId: string;
  decision: SocialReviewPersistedDecision;
  note: string | null;
  updatedAt: Date;
  updatedByUserId: string | null;
};

export type SocialReviewPersistedDecisionRecord = {
  entryId: string;
  decision: SocialReviewPersistedDecision;
  note: string | null;
  updatedAt: string;
  updatedByUserId: string | null;
};

export type SocialReviewDecisionEventRecord = {
  entryId: string;
  decision: SocialReviewPersistedDecision;
  note: string | null;
  updatedAt: string;
  updatedByUserId: string | null;
};

const SOCIAL_REVIEW_DECISIONS_COLLECTION = "anlassraum_social_review_decisions";
const SOCIAL_REVIEW_DECISION_EVENTS_COLLECTION =
  "anlassraum_social_review_decision_events";

let ensuredIndexes = false;
let ensuredEventIndexes = false;

async function socialReviewDecisionsCol() {
  if (!ensuredIndexes) {
    const col = await coreCol<SocialReviewDecisionDoc>(SOCIAL_REVIEW_DECISIONS_COLLECTION);
    await col.createIndex({ entryId: 1 }, { unique: true });
    await col.createIndex({ decision: 1, updatedAt: -1 });
    ensuredIndexes = true;
  }
  return coreCol<SocialReviewDecisionDoc>(SOCIAL_REVIEW_DECISIONS_COLLECTION);
}

async function socialReviewDecisionEventsCol() {
  if (!ensuredEventIndexes) {
    const col = await coreCol<SocialReviewDecisionEventDoc>(
      SOCIAL_REVIEW_DECISION_EVENTS_COLLECTION,
    );
    await col.createIndex({ entryId: 1, updatedAt: -1 });
    ensuredEventIndexes = true;
  }
  return coreCol<SocialReviewDecisionEventDoc>(SOCIAL_REVIEW_DECISION_EVENTS_COLLECTION);
}

export async function listSocialReviewDecisionsByEntryIds(
  entryIds: string[],
): Promise<Map<string, SocialReviewPersistedDecisionRecord>> {
  const normalized = Array.from(
    new Set(entryIds.map((value) => value.trim()).filter((value) => value.length > 0)),
  );
  if (normalized.length === 0) return new Map();

  const rows = await (await socialReviewDecisionsCol())
    .find({ entryId: { $in: normalized } })
    .toArray();

  return new Map(rows.map((row) => [row.entryId, serializePersistedDecision(row)]));
}

export async function upsertSocialReviewDecision(input: {
  entryId: string;
  decision: SocialReviewPersistedDecision;
  note?: string | null;
  updatedByUserId?: string | null;
}): Promise<SocialReviewPersistedDecisionRecord> {
  const entryId = input.entryId.trim();
  const note = normalizeNote(input.note);
  const now = new Date();
  const col = await socialReviewDecisionsCol();
  const existing = await col.findOne({ entryId });

  await col.updateOne(
    { entryId },
    {
      $set: {
        decision: input.decision,
        note,
        updatedAt: now,
        updatedByUserId: input.updatedByUserId ?? null,
      },
      $setOnInsert: {
        entryId,
        createdAt: now,
      },
    },
    { upsert: true },
  );

  const saved = await col.findOne({ entryId });
  if (!saved) {
    throw new Error("social_review_decision_not_persisted");
  }

  const hasChanged =
    !existing ||
    existing.decision !== saved.decision ||
    (existing.note ?? null) !== (saved.note ?? null);

  if (hasChanged) {
    await (await socialReviewDecisionEventsCol()).insertOne({
      entryId: saved.entryId,
      decision: saved.decision,
      note: saved.note ?? null,
      updatedAt: saved.updatedAt,
      updatedByUserId: saved.updatedByUserId ?? null,
    });
  }

  return serializePersistedDecision(saved);
}

export async function listSocialReviewDecisionEventsByEntryIds(input: {
  entryIds: string[];
  limitPerEntry?: number;
}): Promise<Map<string, SocialReviewDecisionEventRecord[]>> {
  const normalized = Array.from(
    new Set(input.entryIds.map((value) => value.trim()).filter((value) => value.length > 0)),
  );
  if (normalized.length === 0) return new Map();

  const limitPerEntry = Math.max(1, Math.min(8, input.limitPerEntry ?? 3));
  const rows = await (await socialReviewDecisionEventsCol())
    .find({ entryId: { $in: normalized } })
    .sort({ updatedAt: -1 })
    .toArray();

  const map = new Map<string, SocialReviewDecisionEventRecord[]>();
  for (const row of rows) {
    const current = map.get(row.entryId) ?? [];
    if (current.length >= limitPerEntry) continue;
    current.push(serializeDecisionEvent(row));
    map.set(row.entryId, current);
  }
  return map;
}

function serializePersistedDecision(
  doc: SocialReviewDecisionDoc,
): SocialReviewPersistedDecisionRecord {
  return {
    entryId: doc.entryId,
    decision: doc.decision,
    note: doc.note ?? null,
    updatedAt: doc.updatedAt.toISOString(),
    updatedByUserId: doc.updatedByUserId ?? null,
  };
}

function normalizeNote(note?: string | null): string | null {
  if (typeof note !== "string") return null;
  const normalized = note.trim();
  return normalized.length > 0 ? normalized.slice(0, 500) : null;
}

function serializeDecisionEvent(
  doc: SocialReviewDecisionEventDoc,
): SocialReviewDecisionEventRecord {
  return {
    entryId: doc.entryId,
    decision: doc.decision,
    note: doc.note ?? null,
    updatedAt: doc.updatedAt.toISOString(),
    updatedByUserId: doc.updatedByUserId ?? null,
  };
}
