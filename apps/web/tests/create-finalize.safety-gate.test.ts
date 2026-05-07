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
  safetyDecision: "blocked" | "moderation_required" | "factcheck_required" | "allow";
  claimText?: string;
}) {
  const id = new ObjectId();
  mocks.seedDraft({
    _id: id,
    authorId: "user-1",
    status: "draft",
    analysis: {
      safety: {
        decision: params.safetyDecision,
      },
      claims: [{ id: "c1", text: params.claimText ?? "Claim text" }],
    },
  });
  return id.toHexString();
}

describe("create finalize safety gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.reset();
  });

  it("blocks finalize when draft safety is moderation_required", async () => {
    const draftId = seedDraft({ safetyDecision: "moderation_required" });
    const res = await POST(req({ draftId, selectedClaimIds: ["c1"] }));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe("create_input_blocked");
  });

  it("blocks finalize when draft safety is blocked", async () => {
    const draftId = seedDraft({ safetyDecision: "blocked" });
    const res = await POST(req({ draftId, selectedClaimIds: ["c1"] }));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe("create_input_blocked");
  });

  it("requires factcheck on unsupported allegation claims", async () => {
    const draftId = seedDraft({
      safetyDecision: "factcheck_required",
      claimText: "Die Presse schreibt nur für Investoren und alle wissen das.",
    });
    const res = await POST(req({ draftId, selectedClaimIds: ["c1"] }));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe("factcheck_required");
    expect(body.safety).toBeTruthy();
  });
});
