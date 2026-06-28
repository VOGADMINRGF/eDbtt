import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { CREATE_SAFETY_ADVERSARIAL_FIXTURES } from "./fixtures/createSafetyAdversarialFixtures";

const mocks = vi.hoisted(() => {
  type AnyDoc = Record<string, any>;
  let userId: string | null = "user-1";
  const drafts = new Map<string, AnyDoc>();
  const insertedDocs: AnyDoc[] = [];

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
      insertedDocs.length = 0;
    },
    seedDraft(doc: AnyDoc) {
      drafts.set(toKey(doc._id), { ...doc });
    },
    readInserted() {
      return insertedDocs.map((doc) => ({ ...doc }));
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
          async insertMany(docs: AnyDoc[]) {
            insertedDocs.push(...docs);
            return { insertedIds: Object.fromEntries(docs.map((_, index) => [index, new ObjectId()])) };
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

vi.mock("@/lib/server/auth/sessionUser", () => ({
  getSessionUser: vi.fn(async () => ({
    _id: { toHexString: () => "user-1" },
    sessionValid: true,
  })),
}));

import { POST } from "@/app/api/contributions/finalize/route";

function req(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/contributions/finalize", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function seedDraft(params: {
  claimText: string;
  claimSafety?: Record<string, unknown>;
  safetyDecision?: "allow" | "factcheck_required";
}) {
  const id = new ObjectId();
  mocks.seedDraft({
    _id: id,
    authorId: "user-1",
    status: "draft",
    analysis: {
      safety: {
        decision: params.safetyDecision ?? "allow",
        claimSafety: params.claimSafety
          ? [
              {
                claimId: "c1",
                text: params.claimText,
                safeText: params.claimSafety.safeText ?? params.claimText,
                kind: "observation",
                truthStatus: "not_checked",
                publicationStatus: params.claimSafety.publicationStatus,
                safetyDecision: params.claimSafety.safetyDecision ?? "allow",
                findingKinds: params.claimSafety.findingKinds ?? [],
                factCheckCandidateIds: params.claimSafety.factCheckCandidateIds ?? [],
                graphReviewRequired: params.claimSafety.graphReviewRequired ?? false,
                noAutoPublish: true,
                noSilentMerge: true,
              },
            ]
          : [],
      },
      claims: [{ id: "c1", text: params.claimText }],
    },
  });
  return id.toHexString();
}

describe("create finalize claim safety gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.reset();
  });

  it("blocks factcheck-required factual claims from finalizing as facts", async () => {
    const draftId = seedDraft({
      claimText: CREATE_SAFETY_ADVERSARIAL_FIXTURES.unverifiedNumber,
      claimSafety: {
        publicationStatus: "factcheck_required",
        safetyDecision: "factcheck_required",
        kind: "factual_claim",
        factCheckCandidateIds: ["factcheck-1"],
      },
      safetyDecision: "factcheck_required",
    });

    const res = await POST(req({ draftId, selectedClaimIds: ["c1"] }));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe("factcheck_required");
  });

  it("allows safe question claims to proceed", async () => {
    const draftId = seedDraft({
      claimText: CREATE_SAFETY_ADVERSARIAL_FIXTURES.safeQuestionOnUnsafeClaim,
      claimSafety: {
        publicationStatus: "publishable_as_question",
        safeText: CREATE_SAFETY_ADVERSARIAL_FIXTURES.safeQuestionOnUnsafeClaim,
      },
      safetyDecision: "factcheck_required",
    });

    const res = await POST(req({ draftId, selectedClaimIds: ["c1"] }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mocks.readInserted()[0]?.text).toContain("Welche Quellen");
  });

  it("blocks moderation-required claims even when overall draft safety allows", async () => {
    const draftId = seedDraft({
      claimText: CREATE_SAFETY_ADVERSARIAL_FIXTURES.thirdPartyAddressAccusation,
      claimSafety: {
        publicationStatus: "moderation_required",
        safetyDecision: "moderation_required",
        kind: "unsafe",
      },
    });

    const res = await POST(req({ draftId, selectedClaimIds: ["c1"] }));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe("create_input_blocked");
  });

  it("uses safeText when a claim must be rewritten before proposal creation", async () => {
    const draftId = seedDraft({
      claimText: CREATE_SAFETY_ADVERSARIAL_FIXTURES.lowReadabilityCivic,
      claimSafety: {
        publicationStatus: "needs_rewrite",
        safeText: "Bitte prüft bessere Busverbindungen und erklärt die Mietfrage klarer.",
      },
    });

    const res = await POST(req({ draftId, selectedClaimIds: ["c1"] }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mocks.readInserted()[0]?.text).toBe(
      "Bitte prüft bessere Busverbindungen und erklärt die Mietfrage klarer.",
    );
  });
});
