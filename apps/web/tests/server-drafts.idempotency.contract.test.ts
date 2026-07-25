import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  type AnyDoc = Record<string, any>;
  const docs: AnyDoc[] = [];

  function toKey(value: unknown) {
    if (value && typeof value === "object" && "toHexString" in (value as Record<string, unknown>)) {
      const fn = (value as { toHexString?: () => string }).toHexString;
      if (typeof fn === "function") return fn.call(value);
    }
    return String(value ?? "");
  }

  function readPath(source: AnyDoc, path: string) {
    return path.split(".").reduce<unknown>((current, segment) => {
      if (!current || typeof current !== "object") return undefined;
      return (current as Record<string, unknown>)[segment];
    }, source);
  }

  function matchesFilter(doc: AnyDoc, filter: AnyDoc) {
    return Object.entries(filter ?? {}).every(([key, value]) => {
      if (key === "_id") return toKey(doc._id) === toKey(value);
      const currentValue = key.includes(".") ? readPath(doc, key) : doc[key];
      return String(currentValue ?? "") === String(value ?? "");
    });
  }

  return {
    reset() {
      docs.length = 0;
    },
    readAll() {
      return docs.map((doc) => ({ ...doc }));
    },
    getCol: vi.fn(async (name: string) => {
      throw new Error(`unexpected_collection_${name}`);
    }),
    coreCol: vi.fn(async (name: string) => {
      if (name !== "drafts") {
        throw new Error(`unexpected_core_collection_${name}`);
      }
      return {
        async findOne(filter: AnyDoc) {
          return docs.find((doc) => matchesFilter(doc, filter)) ?? null;
        },
        async updateOne(filter: AnyDoc, update: AnyDoc) {
          const idx = docs.findIndex((doc) => matchesFilter(doc, filter));
          if (idx < 0) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
          const set = update?.$set && typeof update.$set === "object" ? update.$set : {};
          docs[idx] = { ...docs[idx], ...set };
          return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
        },
        async insertOne(doc: AnyDoc) {
          if (docs.some((entry) => toKey(entry._id) === toKey(doc._id))) {
            const error = new Error("duplicate key");
            (error as Error & { code?: number }).code = 11000;
            throw error;
          }
          docs.push({ ...doc });
          return { acknowledged: true, insertedId: doc._id };
        },
      };
    }),
  };
});

vi.mock("@core/db/triMongo", async () => {
  const mongodb = await import("mongodb");
  return {
    ObjectId: mongodb.ObjectId,
    getCol: (...args: unknown[]) => mocks.getCol(...args),
    coreCol: (...args: unknown[]) => mocks.coreCol(...args),
  };
});

import {
  CANONICAL_CREATE_DRAFT_KIND,
  GENERIC_SERVER_DRAFT_KIND,
  saveUserScopedServerDraft,
} from "@/server/serverDrafts";

async function saveDraft(input: {
  userId: string;
  kind?: typeof CANONICAL_CREATE_DRAFT_KIND | typeof GENERIC_SERVER_DRAFT_KIND;
  text: string;
  idempotencyKey: string;
  draftId?: string;
}) {
  return saveUserScopedServerDraft({
    userId: input.userId,
    route: "/test/server-drafts.idempotency",
    kind: input.kind ?? CANONICAL_CREATE_DRAFT_KIND,
    text: input.text,
    textOriginal: input.text,
    textPrepared: input.text,
    locale: "de",
    analysis: { summary: input.text },
    idempotencyKey: input.idempotencyKey,
    draftId: input.draftId,
  });
}

describe("serverDrafts deterministic object id and idempotency contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.reset();
  });

  it("A: same user, kind, key and content returns the same draft id and one document", async () => {
    const first = await saveDraft({
      userId: "user-1",
      text: "Gleicher Inhalt",
      idempotencyKey: "idem-key-a",
    });
    const second = await saveDraft({
      userId: "user-1",
      text: "Gleicher Inhalt",
      idempotencyKey: "idem-key-a",
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.draftId).toMatch(/^[0-9a-f]{24}$/);
      expect(second.draftId).toBe(first.draftId);
    }
    expect(mocks.readAll()).toHaveLength(1);
  });

  it("B: same user, kind and key with changed content fails honestly and keeps one document", async () => {
    const first = await saveDraft({
      userId: "user-1",
      text: "Erste Fassung",
      idempotencyKey: "idem-key-b",
    });
    const second = await saveDraft({
      userId: "user-1",
      text: "Veränderte Fassung",
      idempotencyKey: "idem-key-b",
    });

    expect(first.ok).toBe(true);
    expect(second).toMatchObject({ ok: false, error: "idempotency_conflict" });
    expect(mocks.readAll()).toHaveLength(1);
    expect(mocks.readAll()[0].text).toBe("Erste Fassung");
  });

  it("C: different user with the same idempotency key gets a different draft id", async () => {
    const first = await saveDraft({
      userId: "user-1",
      text: "Gleicher Key",
      idempotencyKey: "idem-key-c",
    });
    const second = await saveDraft({
      userId: "user-2",
      text: "Gleicher Key",
      idempotencyKey: "idem-key-c",
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.draftId).not.toBe(second.draftId);
    }
    expect(mocks.readAll()).toHaveLength(2);
  });

  it("D: different draft kind with the same user and key gets a different draft id", async () => {
    const first = await saveDraft({
      userId: "user-1",
      kind: CANONICAL_CREATE_DRAFT_KIND,
      text: "Gleicher Key",
      idempotencyKey: "idem-key-d",
    });
    const second = await saveDraft({
      userId: "user-1",
      kind: GENERIC_SERVER_DRAFT_KIND,
      text: "Gleicher Key",
      idempotencyKey: "idem-key-d",
    });

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.draftId).not.toBe(second.draftId);
    }
    expect(mocks.readAll()).toHaveLength(2);
  });

  it("E: parallel identical requests resolve to one document and one consistent id", async () => {
    const [first, second] = await Promise.all([
      saveDraft({
        userId: "user-1",
        text: "Paralleler Inhalt",
        idempotencyKey: "idem-key-e",
      }),
      saveDraft({
        userId: "user-1",
        text: "Paralleler Inhalt",
        idempotencyKey: "idem-key-e",
      }),
    ]);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(first.draftId).toBe(second.draftId);
    }
    expect(mocks.readAll()).toHaveLength(1);
  });

  it("F: a manipulated foreign draftId plus another user's idempotency key cannot update across users", async () => {
    const owned = await saveDraft({
      userId: "user-1",
      text: "Eigener Draft",
      idempotencyKey: "idem-key-f-owned",
    });
    expect(owned.ok).toBe(true);

    const manipulated = await saveDraft({
      userId: "user-2",
      text: "Fremdzugriff",
      idempotencyKey: "idem-key-f-foreign",
      draftId: owned.ok ? owned.draftId : undefined,
    });

    expect(manipulated).toMatchObject({ ok: false, error: "draft_not_found" });
    expect(mocks.readAll()).toHaveLength(1);
    expect(mocks.readAll()[0].userId).toBe("user-1");
  });
});
