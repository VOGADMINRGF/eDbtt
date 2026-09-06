import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const state = vi.hoisted(() => ({
  set: null as Record<string, any> | null,
  audits: [] as Record<string, any>[],
  failAudit: false,
}));

vi.mock("@core/db/triMongo", () => {
  class ObjectId {
    private readonly value: string;
    constructor(value = "65f000000000000000000499") {
      this.value = value;
    }
    static isValid(value: string) {
      return /^[a-f0-9]{24}$/i.test(value);
    }
    toHexString() {
      return this.value;
    }
    toString() {
      return this.value;
    }
  }

  function matches(doc: Record<string, any> | null, filter: Record<string, any>) {
    if (!doc) return false;
    return Object.entries(filter).every(([key, value]) => {
      if (key === "_id") return String(doc._id) === String(value);
      return doc[key] === value;
    });
  }

  return {
    ObjectId,
    coreCol: async (name: string) => {
      if (name === "qr_question_set_guard_audits") {
        return {
          insertOne: async (doc: Record<string, any>) => {
            if (state.failAudit) throw new Error("audit_unavailable");
            state.audits.push(structuredClone(doc));
            return { insertedId: doc.id };
          },
        };
      }
      if (name !== "qr_question_sets") throw new Error(`unexpected_collection:${name}`);
      return {
        findOne: async (filter: Record<string, any>) =>
          matches(state.set, filter) ? structuredClone(state.set) : null,
        insertOne: async (doc: Record<string, any>) => {
          state.set = {
            ...structuredClone(doc),
            _id: "65f000000000000000000499",
          };
          return { insertedId: "65f000000000000000000499" };
        },
        updateOne: async (
          filter: Record<string, any>,
          update: { $set?: Record<string, any>; $inc?: Record<string, number> },
        ) => {
          if (!matches(state.set, filter)) return { matchedCount: 0, modifiedCount: 0 };
          state.set = {
            ...state.set,
            ...(update.$set ? structuredClone(update.$set) : {}),
          };
          for (const [key, value] of Object.entries(update.$inc ?? {})) {
            state.set[key] = Number(state.set[key] ?? 0) + value;
          }
          return { matchedCount: 1, modifiedCount: 1 };
        },
      };
    },
  };
});

vi.mock("@features/anlassraum/db", () => ({
  anlassraumCol: async () => ({ findOne: vi.fn() }),
}));

vi.mock("@/app/api/streams/utils", () => ({
  requireCreatorContext: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: vi.fn().mockResolvedValue({
    _id: { toHexString: () => "admin-reviewer-1" },
  }),
}));

import { POST as createQrSet } from "@/app/api/qr/sets/route";
import { PATCH as reviewQrSet } from "@/app/api/admin/qr/sets/[code]/question-guard-review/route";

function request(url: string, method: "POST" | "PATCH", body: unknown) {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("QR question set review flow", () => {
  beforeEach(() => {
    state.set = null;
    state.audits = [];
    state.failAudit = false;
  });

  it("persists review-required creation, audits independent review, and stops at ready-for-activation", async () => {
    const createResponse = await createQrSet(
      request("http://localhost/api/qr/sets", "POST", {
        title: "Hitzeschutz",
        questions: [
          {
            title: "Welche Maßnahmen sollten Kommunen gegen Hitze priorisieren?",
            options: ["Mehr Bäume", "Mehr Trinkbrunnen"],
          },
        ],
      }),
    );

    expect(createResponse.status).toBe(202);
    const created = await createResponse.json();
    expect(created).toMatchObject({
      ok: true,
      status: "review_required",
      questionGuardReviewState: "review_required",
      noAutoApproval: true,
      noAutoPublish: true,
    });
    expect(state.set).toMatchObject({
      status: "review_required",
      version: 0,
      noAutoApproval: true,
      noAutoPublish: true,
    });

    const questionId = state.set?.questions[0].id as string;
    const reviewResponse = await reviewQrSet(
      request(
        `http://localhost/api/admin/qr/sets/${created.code}/question-guard-review`,
        "PATCH",
        {
          questions: [
            {
              questionId,
              actorContexts: [],
              evidenceRefs: ["human-review:qr-set:1"],
              noNamedActorsConfirmed: true,
            },
          ],
        },
      ),
      { params: Promise.resolve({ code: created.code }) },
    );

    expect(reviewResponse.status).toBe(200);
    await expect(reviewResponse.json()).resolves.toMatchObject({
      ok: true,
      status: "ready_for_activation",
      questionGuardReviewState: "reviewed",
      noAutoApproval: true,
      noAutoPublish: true,
    });
    expect(state.set).toMatchObject({
      status: "ready_for_activation",
      questionGuardReviewState: "reviewed",
      version: 2,
      noAutoApproval: true,
      noAutoPublish: true,
    });
    expect(state.set?.status).not.toBe("active");
    expect(state.set?.questions[0].questionGuard).toMatchObject({
      releaseState: "draft_allowed",
      actorExtraction: {
        status: "complete",
        source: "human_review",
        humanReviewFinding: "no_named_actors",
      },
    });
    expect(state.audits).toHaveLength(1);
    expect(state.audits[0]).toMatchObject({
      action: "question_guard_reviewed",
      actorUserId: "admin-reviewer-1",
      readyForActivation: true,
      noAutoApproval: true,
      noAutoPublish: true,
    });
  });

  it("cannot complete an actor-free human review from evidenceRef alone", async () => {
    const createResponse = await createQrSet(
      request("http://localhost/api/qr/sets", "POST", {
        questions: [
          {
            title: "Welche Maßnahmen sollten Kommunen gegen Hitze priorisieren?",
            options: ["Mehr Bäume", "Mehr Trinkbrunnen"],
          },
        ],
      }),
    );
    const created = await createResponse.json();
    const questionId = state.set?.questions[0].id as string;

    const response = await reviewQrSet(
      request(
        `http://localhost/api/admin/qr/sets/${created.code}/question-guard-review`,
        "PATCH",
        {
          questions: [
            {
              questionId,
              actorContexts: [],
              evidenceRefs: ["human-review:qr-set:evidence-only"],
            },
          ],
        },
      ),
      { params: Promise.resolve({ code: created.code }) },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "public_question_guard_actor_finding_required",
    });
    expect(state.set?.status).toBe("review_required");
    expect(state.audits).toHaveLength(0);
  });

  it("leaves the persisted guard blocked when durable audit insertion fails", async () => {
    const createResponse = await createQrSet(
      request("http://localhost/api/qr/sets", "POST", {
        questions: [
          {
            title: "Welche Maßnahmen sollten Kommunen gegen Hitze priorisieren?",
            options: ["Mehr Bäume", "Mehr Trinkbrunnen"],
          },
        ],
      }),
    );
    const created = await createResponse.json();
    const questionId = state.set?.questions[0].id as string;
    state.failAudit = true;

    const response = await reviewQrSet(
      request(
        `http://localhost/api/admin/qr/sets/${created.code}/question-guard-review`,
        "PATCH",
        {
          questions: [
            {
              questionId,
              actorContexts: [],
              evidenceRefs: ["human-review:qr-set:audit-failure"],
              noNamedActorsConfirmed: true,
            },
          ],
        },
      ),
      { params: Promise.resolve({ code: created.code }) },
    );

    expect(response.status).toBe(400);
    expect(state.set).toMatchObject({
      status: "review_required",
      questionGuardReviewState: "review_in_progress",
      version: 1,
    });
    expect(state.set?.questions[0].questionGuard.releaseState).toBe(
      "review_required",
    );
    expect(state.audits).toHaveLength(0);
  });
});
