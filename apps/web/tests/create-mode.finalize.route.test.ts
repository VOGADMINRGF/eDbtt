import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";

const mocks = vi.hoisted(() => {
  type AnyDoc = Record<string, any>;

  let userId: string | null = "user-1";
  const drafts = new Map<string, AnyDoc>();
  const proposals: AnyDoc[] = [];
  const getColCalls: string[] = [];

  function toKey(value: unknown) {
    if (value && typeof value === "object" && "toHexString" in (value as Record<string, unknown>)) {
      const asHex = (value as { toHexString?: () => string }).toHexString;
      if (typeof asHex === "function") return asHex.call(value);
    }
    return String(value ?? "");
  }

  return {
    setUser(next: string | null) {
      userId = next;
    },
    reset() {
      userId = "user-1";
      drafts.clear();
      proposals.length = 0;
      getColCalls.length = 0;
    },
    seedDraft(doc: AnyDoc) {
      drafts.set(toKey(doc._id), { ...doc });
    },
    readDraft(id: string) {
      const found = drafts.get(id);
      return found ? { ...found } : null;
    },
    readProposals() {
      return proposals.map((item) => ({ ...item }));
    },
    getColCalls() {
      return [...getColCalls];
    },
    cookies: vi.fn(async () => ({
      get(name: string) {
        if (name !== "u_id" || !userId) return undefined;
        return { value: userId };
      },
    })),
    getCol: vi.fn(async (name: string) => {
      getColCalls.push(String(name));
      if (name === "contribution_drafts") {
        return {
          async findOne(filter: AnyDoc) {
            const draft = drafts.get(toKey(filter?._id));
            if (!draft) return null;
            if (String(draft.authorId) !== String(filter?.authorId)) return null;
            return { ...draft };
          },
          async updateOne(filter: AnyDoc, update: AnyDoc) {
            const key = toKey(filter?._id);
            const draft = drafts.get(key);
            if (!draft) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
            const nextSet = update?.$set && typeof update.$set === "object" ? update.$set : {};
            drafts.set(key, { ...draft, ...nextSet });
            return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
          },
        };
      }
      if (name === "statement_proposals") {
        return {
          async insertMany(docs: AnyDoc[]) {
            const insertedIds: Record<string, ObjectId> = {};
            docs.forEach((doc, index) => {
              const _id = new ObjectId();
              proposals.push({ ...doc, _id });
              insertedIds[String(index)] = _id;
            });
            return { acknowledged: true, insertedCount: docs.length, insertedIds };
          },
        };
      }
      throw new Error(`unexpected_collection_${name}`);
    }),
    coreCol: vi.fn(async () => {
      throw new Error("unexpected_core_col_call");
    }),
  };
});

vi.mock("next/headers", () => ({
  cookies: () => mocks.cookies(),
}));

vi.mock("@core/db/triMongo", async () => {
  const mongodb = await import("mongodb");
  return {
    ObjectId: mongodb.ObjectId,
    getCol: (...args: unknown[]) => mocks.getCol(...args),
    coreCol: (...args: unknown[]) => mocks.coreCol(...args),
  };
});

import { POST as finalizePOST } from "@/app/api/contributions/finalize/route";

function req(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/contributions/finalize", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function seedDraft() {
  const draftId = new ObjectId();
  mocks.seedDraft({
    _id: draftId,
    authorId: "user-1",
    status: "draft",
    analysis: {
      claims: [
        { id: "c1", text: "Claim 1" },
        { id: "c2", text: "Claim 2" },
      ],
    },
  });
  return draftId.toHexString();
}

describe("create mode split - finalize route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.reset();
  });

  it("Scenario D: manual mode is forwarded through finalize and stays non-published", async () => {
    const draftId = seedDraft();

    const res = await finalizePOST(
      req({
        draftId,
        selectedClaimIds: ["c1"],
        source: "statement_new",
        createMode: "manual",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, createMode: "manual" });

    const savedDraft = mocks.readDraft(draftId);
    expect(savedDraft?.status).toBe("finalized");
    expect(savedDraft?.createMode).toBe("manual");

    const created = mocks.readProposals();
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      createMode: "manual",
      status: "proposed",
    });
    expect(created[0].publishedAt).toBeUndefined();
    expect(created[0].approvedAt).toBeUndefined();
  });

  it("Scenario D: source mode is forwarded through finalize", async () => {
    const draftId = seedDraft();

    const res = await finalizePOST(
      req({
        draftId,
        selectedClaimIds: ["c1"],
        source: "contribution_new",
        createMode: "source",
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, createMode: "source" });

    const created = mocks.readProposals();
    expect(created[0].createMode).toBe("source");
  });

  it("Scenario D: ai mode is forwarded as drafting intent only", async () => {
    const draftId = seedDraft();

    const res = await finalizePOST(
      req({
        draftId,
        selectedClaimIds: ["c1"],
        source: "contribution_new",
        createMode: "ai",
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, createMode: "ai" });

    const created = mocks.readProposals();
    expect(created[0]).toMatchObject({
      createMode: "ai",
      status: "proposed",
    });
    expect(created[0].publishedAt).toBeUndefined();
  });

  it("Scenario E: invalid mode is rejected with stable invalid_create_mode", async () => {
    const draftId = seedDraft();

    const res = await finalizePOST(
      req({
        draftId,
        selectedClaimIds: ["c1"],
        createMode: "robot",
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "invalid_create_mode" });
  });

  it("Scenario F: create finalize flow does not write output seeds or publish rounds", async () => {
    const draftId = seedDraft();

    const res = await finalizePOST(
      req({
        draftId,
        selectedClaimIds: ["c1", "c2"],
        source: "contribution_new",
        createMode: "source",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true });

    const colCalls = mocks.getColCalls();
    expect(colCalls).toContain("contribution_drafts");
    expect(colCalls).toContain("statement_proposals");
    expect(colCalls).not.toContain("output_seed");
    expect(colCalls).not.toContain("anlassraum");
    expect(mocks.coreCol).not.toHaveBeenCalled();
  });
});
