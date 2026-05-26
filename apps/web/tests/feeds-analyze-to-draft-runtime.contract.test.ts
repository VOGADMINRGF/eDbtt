import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectId } from "mongodb";

const memory = vi.hoisted(() => {
  type AnyDoc = Record<string, any>;
  const collections = new Map<string, AnyDoc[]>();

  function toKey(value: unknown) {
    if (value && typeof value === "object" && "toHexString" in (value as Record<string, unknown>)) {
      const fn = (value as { toHexString?: () => string }).toHexString;
      if (typeof fn === "function") return fn.call(value);
    }
    return value;
  }

  function matches(doc: AnyDoc, filter: AnyDoc) {
    return Object.entries(filter ?? {}).every(([key, value]) => toKey(doc[key]) === toKey(value));
  }

  function getCollection(name: string) {
    const key = String(name);
    if (!collections.has(key)) collections.set(key, []);
    const rows = collections.get(key)!;
    return {
      async createIndex() {
        return "ok";
      },
      async findOne(filter: AnyDoc) {
        const hit = rows.find((doc) => matches(doc, filter));
        return hit ? { ...hit } : null;
      },
      async findOneAndUpdate(filter: AnyDoc, update: AnyDoc) {
        const index = rows.findIndex((doc) => matches(doc, filter));
        if (index < 0) return null;
        rows[index] = { ...rows[index], ...(update?.$set ?? {}) };
        return { ...rows[index] };
      },
      async updateOne(filter: AnyDoc, update: AnyDoc) {
        const index = rows.findIndex((doc) => matches(doc, filter));
        if (index < 0) return { matchedCount: 0, modifiedCount: 0 };
        rows[index] = { ...rows[index], ...(update?.$set ?? {}) };
        return { matchedCount: 1, modifiedCount: 1 };
      },
      async insertOne(doc: AnyDoc) {
        const next = { ...doc };
        if (!next._id) next._id = new ObjectId();
        rows.push(next);
        return { insertedId: next._id };
      },
      async countDocuments() {
        return rows.length;
      },
      all() {
        return rows.map((row) => ({ ...row }));
      },
    };
  }

  return {
    reset() {
      collections.clear();
    },
    seed(name: string, rows: AnyDoc[]) {
      collections.set(
        name,
        rows.map((row) => ({ ...row })),
      );
    },
    read(name: string) {
      return (collections.get(name) ?? []).map((row) => ({ ...row }));
    },
    getCollection,
  };
});

vi.mock("@core/db/triMongo", async () => {
  const mongodb = await import("mongodb");
  return {
    ObjectId: mongodb.ObjectId,
    coreCol: async (name: string) => memory.getCollection(name),
  };
});

vi.mock("@features/analyze/analyzeContribution", () => ({
  analyzeContribution: vi.fn(async ({ text, locale }: { text: string; locale: string }) => ({
    mode: "E150",
    sourceText: text,
    language: locale,
    claims: [
      {
        id: "claim-1",
        text: "Tempo 30 vor der Schule prüfen",
        title: "Tempo 30 vor der Schule",
        topic: "verkehr",
        responsibility: "Kommune",
      },
    ],
    notes: [{ id: "note-1", text: "Hinweis aus lokalem Feed." }],
    questions: [],
    knots: [],
    _meta: { pipeline: "feeds_to_statementCandidate" },
  })),
}));

vi.mock("@features/evidence/syncFromAnalyze", () => ({
  syncAnalyzeResultToEvidenceGraph: vi.fn(async (result: any) => result.claims ?? []),
}));

vi.mock("@features/evidence/syncNewsEvidence", () => ({
  syncNewsEvidenceForCandidate: vi.fn(async () => undefined),
}));

import { analyzePendingStatementCandidates } from "@features/feeds/analyzePending";

describe("feeds analyze to draft runtime contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    memory.reset();
  });

  it("turns pulled candidates into analyzed drafts without auto-publish", async () => {
    const candidateId = new ObjectId("65f100000000000000000111");
    memory.seed("statement_candidates", [
      {
        _id: candidateId,
        id: "candidate-1",
        sourceUrl: "https://example.org/news/tempo-30",
        sourceTitle: "Mehr Sicherheit vor der Schule",
        sourceSummary: "Ein lokaler Bericht über unsichere Schulwege.",
        sourceContent: "Vor der Schule kommt es morgens zu gefährlichen Situationen.",
        canonicalHash: "hash-1",
        createdAt: "2026-05-25T08:00:00.000Z",
        analyzeStatus: "pending",
        analyzeRequestedAt: new Date("2026-05-25T08:00:00.000Z"),
        analyzeError: null,
        regionCode: "DE:BE",
        sourceLocale: "de",
        topic: "verkehr",
      },
    ]);

    const result = await analyzePendingStatementCandidates({ limit: 1 });

    expect(result).toEqual({ analyzed: 1, errors: 0 });

    const candidates = memory.read("statement_candidates");
    expect(candidates[0]?.analyzeStatus).toBe("success");
    expect(candidates[0]?.analyzeResultId).toBeTruthy();

    const analyzeResults = memory.read("analyze_results");
    expect(analyzeResults).toHaveLength(1);
    expect(analyzeResults[0]?.claims?.[0]?.title).toBe("Tempo 30 vor der Schule");

    const drafts = memory.read("vote_drafts");
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).toMatchObject({
      status: "draft",
      feedReviewState: "queued",
      pipeline: "feeds_to_statementCandidate",
      title: "Tempo 30 vor der Schule",
    });
    expect(drafts[0]?.publishedAt ?? null).toBeNull();
  });
});
