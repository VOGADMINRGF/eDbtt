import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";

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
    readAll() {
      return docs.map((doc) => ({ ...doc }));
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
        async updateOne() {
          return { acknowledged: true };
        },
        find() {
          return {
            sort() {
              return {
                limit() {
                  return {
                    async toArray() {
                      return [];
                    },
                  };
                },
                async toArray() {
                  return [];
                },
              };
            },
          };
        },
      };
    }),
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

import { POST } from "@/app/api/editorial/review-requests/route";

function buildRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/editorial/review-requests", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/editorial/review-requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.reset();
  });

  it("allows authenticated users to create a review request with truth guard fields", async () => {
    const response = await POST(
      buildRequest({
        sourceType: "theme_suggestion",
        originalText: "Wir sollten das Thema Schulwegsicherheit als eigenen Themenvorschlag sammeln.",
        truthStatus: "source_open",
        sourceSupport: "open",
        sourceStatus: "Quellenlage offen",
        reviewRecommended: true,
        verificationLabel: "analysiert",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      reviewRequest: {
        sourceType: "theme_suggestion",
        truthStatus: "source_open",
        sourceSupport: "open",
        sourceStatus: "Quellenlage offen",
        reviewRecommended: true,
        verificationLabel: "analysiert",
        noTruthPromotion: true,
        noAutoGraphPromotion: true,
        noAutoPublish: true,
      },
    });
  });

  it("deduplicates identical user/text/sourceType combinations", async () => {
    await POST(
      buildRequest({
        sourceType: "round_draft",
        originalText: "Wir sollten den Schulhof als Anlassraum weiter strukturieren.",
      }),
    );

    const response = await POST(
      buildRequest({
        sourceType: "round_draft",
        originalText: "Wir sollten   den Schulhof als Anlassraum weiter strukturieren.",
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      ok: true,
      deduped: true,
      message: "Diese Prüfbitte ist bereits zur manuellen Prüfung vorgemerkt.",
    });
    expect(mocks.readAll()).toHaveLength(1);
  });

  it("blocks linkspam and abusive inputs from the generic review request route", async () => {
    const spamResponse = await POST(
      buildRequest({
        sourceType: "factcheck_request",
        originalText: "Jetzt kaufen https://spam.example/a https://spam.example/b bester Bonuscode heute",
      }),
    );
    expect(spamResponse.status).toBe(400);
    await expect(spamResponse.json()).resolves.toMatchObject({
      ok: false,
      error: "review_not_allowed",
    });

    const abusiveResponse = await POST(
      buildRequest({
        sourceType: "factcheck_request",
        originalText: "Verpiss dich",
      }),
    );
    expect(abusiveResponse.status).toBe(400);
    await expect(abusiveResponse.json()).resolves.toMatchObject({
      ok: false,
      error: "review_requires_rework",
    });

    expect(mocks.readAll()).toHaveLength(0);
  });

  it("requires authentication for generic review requests", async () => {
    mocks.setUser(null);
    const response = await POST(
      buildRequest({
        sourceType: "theme_suggestion",
        originalText: "Bitte redaktionell prüfen.",
      }),
    );
    expect(response.status).toBe(401);
  });
});
