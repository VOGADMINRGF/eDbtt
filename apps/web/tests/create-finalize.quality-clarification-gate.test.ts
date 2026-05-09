import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";

const mocks = vi.hoisted(() => {
  type AnyDoc = Record<string, any>;
  let userId: string | null = "user-1";
  const drafts = new Map<string, AnyDoc>();

  function toKey(value: unknown): string {
    if (value && typeof value === "object" && "toHexString" in (value as Record<string, unknown>)) {
      const fn = (value as { toHexString?: () => string }).toHexString;
      if (typeof fn === "function") return fn.call(value);
    }
    return String(value ?? "");
  }

  return {
    reset() {
      userId = "user-1";
      drafts.clear();
    },
    seedDraft(doc: AnyDoc) {
      drafts.set(toKey(doc._id), { ...doc });
    },
    cookies: vi.fn(async () => ({
      get(name: string) {
        if (name !== "u_id" || !userId) return undefined;
        return { value: userId };
      },
    })),
    getCol: vi.fn(async (name: string) => {
      if (name === "contribution_drafts") {
        return {
          async findOne(filter: AnyDoc) {
            const found = drafts.get(toKey(filter._id));
            if (!found || String(found.authorId) !== String(filter.authorId)) return null;
            return { ...found };
          },
          async updateOne() {
            return { acknowledged: true };
          },
        };
      }
      if (name === "statement_proposals") {
        return {
          async insertMany() {
            return { insertedIds: { 0: new ObjectId() } };
          },
        };
      }
      throw new Error(`unexpected_collection_${name}`);
    }),
    coreCol: vi.fn(async () => ({
      find() {
        return {
          sort() {
            return {
              limit() {
                return { async next() { return null; } };
              },
            };
          },
        };
      },
      async insertOne() {
        return { acknowledged: true };
      },
      async updateOne() {
        return { acknowledged: true };
      },
    })),
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

import { POST } from "@/app/api/contributions/finalize/route";

function req(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/contributions/finalize", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function seedDraft(params: {
  decision: string;
  clarifications?: Array<{ requiredBeforeFinalize: boolean }>;
  qualityGate?: Record<string, unknown>;
}) {
  const id = new ObjectId();
  mocks.seedDraft({
    _id: id,
    authorId: "user-1",
    status: "draft",
    analysis: {
      safety: {
        decision: params.decision,
        clarifications: params.clarifications ?? [],
        qualityGate: params.qualityGate ?? {},
      },
      claims: [{ id: "c1", text: "Bei uns ist die Straße kaputt." }],
    },
  });
  return id.toHexString();
}

describe("create finalize quality clarification gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.reset();
  });

  it("keeps drafts with required clarifications from finalizing into finished statements", async () => {
    const draftId = seedDraft({
      decision: "revise_required",
      clarifications: [{ requiredBeforeFinalize: true }],
    });
    const res = await POST(req({ draftId, selectedClaimIds: ["c1"] }));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe("quality_clarification_required");
  });

  it("keeps manual editorial review requests out of auto finalize", async () => {
    const draftId = seedDraft({
      decision: "editorial_review_required",
      qualityGate: { editorialReviewRequested: true },
    });
    const res = await POST(req({ draftId, selectedClaimIds: ["c1"] }));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe("editorial_review_required");
  });
});
