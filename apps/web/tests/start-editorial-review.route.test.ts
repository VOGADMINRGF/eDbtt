import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const mocks = vi.hoisted(() => {
  type Doc = Record<string, any>;

  const docs: Doc[] = [];
  let userId: string | null = "user-1";

  return {
    reset() {
      docs.length = 0;
      userId = "user-1";
    },
    setUser(next: string | null) {
      userId = next;
    },
    getSessionUser: vi.fn(async () =>
      userId
        ? {
            _id: { toHexString: () => userId },
            roles: ["user"],
            sessionValid: true,
          }
        : null,
    ),
    coreCol: vi.fn(async (name: string) => {
      if (name !== "landing_editorial_review_requests") {
        throw new Error(`unexpected_collection_${name}`);
      }

      return {
        async countDocuments(filter: Record<string, any>) {
          return docs.filter((doc) => {
            if (filter.userId && doc.userId !== filter.userId) return false;
            if (filter.createdAt?.$gte && !(doc.createdAt >= filter.createdAt.$gte)) return false;
            return true;
          }).length;
        },
        async findOne(filter: Record<string, any>) {
          return (
            docs.find((doc) => {
              if (filter.userId && doc.userId !== filter.userId) return false;
              if (filter.normalizedText && doc.normalizedText !== filter.normalizedText) return false;
              if (filter.sourceType && doc.sourceType !== filter.sourceType) return false;
              if (filter.status?.$in && !filter.status.$in.includes(doc.status)) return false;
              if (filter.status && !filter.status.$in && doc.status !== filter.status) return false;
              if (filter.createdAt?.$gte && !(doc.createdAt >= filter.createdAt.$gte)) return false;
              return true;
            }) ?? null
          );
        },
        async insertOne(doc: Doc) {
          const next = { ...doc, _id: new ObjectId() };
          docs.push(next);
          return { acknowledged: true, insertedId: next._id };
        },
      };
    }),
    readAll() {
      return docs.map((doc) => ({ ...doc }));
    },
  };
});

vi.mock("@/lib/server/auth/sessionUser", () => ({
  getSessionUser: (...args: unknown[]) => mocks.getSessionUser(...args),
}));

vi.mock("@core/db/triMongo", async () => {
  const mongodb = await import("mongodb");
  return {
    ObjectId: mongodb.ObjectId,
    coreCol: (...args: unknown[]) => mocks.coreCol(...args),
  };
});

import { POST } from "@/app/api/start/editorial-review/route";

function buildRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/start/editorial-review", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/start/editorial-review", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.reset();
  });

  it("creates a pending_review draft for an authenticated needs_reframe submission", async () => {
    const res = await POST(
      buildRequest({
        originalText: "Freibier für alle",
        userReason: "Es geht mir eigentlich um soziale Teilhabe bei öffentlichen Veranstaltungen.",
        relevanceClassification: "needs_reframe",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      ok: true,
      deduped: false,
      reviewRequest: {
        status: "pending_review",
        relevanceClassification: "needs_reframe",
        source: "start_create_light",
        noAutoPublish: true,
        noAutoDossier: true,
        noAutoAnlassraum: true,
        noAutoGraphPromotion: true,
        noAutoVote: true,
      },
    });

    const saved = mocks.readAll();
    expect(saved).toHaveLength(1);
    expect(saved[0].status).toBe("pending_review");
    expect(saved[0].noAutoPublish).toBe(true);
    expect(saved[0].noAutoDossier).toBe(true);
    expect(saved[0].noAutoAnlassraum).toBe(true);
    expect(saved[0].noAutoGraphPromotion).toBe(true);
    expect(saved[0].noAutoVote).toBe(true);
  });

  it("deduplicates repeated submissions with the same normalized text and package guardrails", async () => {
    await POST(
      buildRequest({
        originalText: "Freibier für alle",
        userReason: "Es geht mir um soziale Teilhabe bei Veranstaltungen.",
        relevanceClassification: "needs_reframe",
      }),
    );
    const res = await POST(
      buildRequest({
        originalText: "Freibier   für   alle",
        userReason: "Es geht mir um soziale Teilhabe bei Veranstaltungen.",
        relevanceClassification: "needs_reframe",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, deduped: true });
    expect(mocks.readAll()).toHaveLength(1);
  });

  it("requires a public relevance reason for personal_only submissions", async () => {
    const res = await POST(
      buildRequest({
        originalText: "Ich will ein neues Handy.",
        userReason: "zu kurz",
        relevanceClassification: "personal_only",
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "reason_required",
    });
  });

  it("offers only a protected auth path for guests and does not create a review draft", async () => {
    mocks.setUser(null);

    const res = await POST(
      buildRequest({
        originalText: "Freibier für alle",
        userReason: "Es geht um Teilhabe.",
        relevanceClassification: "needs_reframe",
      }),
    );

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "not_authenticated",
    });
    expect(mocks.readAll()).toHaveLength(0);
  });

  it("blocks clear linkspam from the editorial review path", async () => {
    const res = await POST(
      buildRequest({
        originalText: "Jetzt kaufen https://spam.example/a https://spam.example/b bester Bonuscode heute",
        userReason: "Bitte trotzdem prüfen",
        relevanceClassification: "spam_suspected",
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "review_not_allowed",
    });
    expect(mocks.readAll()).toHaveLength(0);
  });

  it("keeps the review route free of publish, dossier and costly orchestration side effects", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/app/api/start/editorial-review/route.ts"),
      "utf8",
    );

    expect(source).not.toContain("DeepSearch");
    expect(source).not.toContain("callOpenAI");
    expect(source).not.toContain("create_dossier");
    expect(source).not.toContain("recordSwipeVoteInGraph");
  });
});
