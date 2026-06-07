import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";

const mocks = vi.hoisted(() => {
  type AnyDoc = Record<string, any>;

  let userId: string | null = "user-1";
  const docs: AnyDoc[] = [];
  const reviewDocs: AnyDoc[] = [];

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
      docs.length = 0;
      reviewDocs.length = 0;
      userId = "user-1";
    },
    readAll() {
      return docs.map((doc) => ({ ...doc }));
    },
    readReviewAll() {
      return reviewDocs.map((doc) => ({ ...doc }));
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
    getCol: vi.fn(async (name: string) => {
      if (name !== "contribution_drafts") throw new Error(`unexpected_collection_${name}`);
      return {
        async insertOne(doc: AnyDoc) {
          const next = { ...doc, _id: new ObjectId() };
          docs.push(next);
          return { acknowledged: true, insertedId: next._id };
        },
        async findOneAndUpdate(filter: AnyDoc, update: AnyDoc) {
          const idx = docs.findIndex(
            (doc) => toKey(doc._id) === toKey(filter?._id) && String(doc.authorId) === String(filter?.authorId),
          );
          if (idx < 0) return null;
          const set = update?.$set && typeof update.$set === "object" ? update.$set : {};
          docs[idx] = { ...docs[idx], ...set };
          return docs[idx];
        },
      };
    }),
    coreCol: vi.fn(async (name: string) => {
      if (name !== "landing_editorial_review_requests") {
        throw new Error(`unexpected_core_collection_${name}`);
      }
      return {
        async countDocuments(filter: Record<string, any>) {
          return reviewDocs.filter((doc) => {
            if (filter.userId && doc.userId !== filter.userId) return false;
            if (filter.createdAt?.$gte && !(doc.createdAt >= filter.createdAt.$gte)) return false;
            return true;
          }).length;
        },
        async findOne(filter: Record<string, any>) {
          return (
            reviewDocs.find((doc) => {
              if (filter.userId && doc.userId !== filter.userId) return false;
              if (filter.normalizedText && doc.normalizedText !== filter.normalizedText) return false;
              if (filter.sourceType && doc.sourceType !== filter.sourceType) return false;
              if (filter.status?.$in && !filter.status.$in.includes(doc.status)) return false;
              if (filter.createdAt?.$gte && !(doc.createdAt >= filter.createdAt.$gte)) return false;
              return true;
            }) ?? null
          );
        },
        async insertOne(doc: AnyDoc) {
          const next = { ...doc, _id: new ObjectId() };
          reviewDocs.push(next);
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
    resolveRequestScopeContext: vi.fn(async () => ({
      organizationId: "org-1",
      membershipStatus: "organization_verified",
      organizationRole: "communications",
      regionIds: ["kommune-nord"],
      isOperatorMode: false,
      operatorModeLabel: null,
      sourceOfTruth: "local_membership_store",
      confidence: "high",
    })),
    summarizeRequestScopeContext: vi.fn((scope) => scope),
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

vi.mock("@/lib/server/auth/requestScope", () => ({
  resolveRequestScopeContext: (...args: unknown[]) => mocks.resolveRequestScopeContext(...args),
  summarizeRequestScopeContext: (...args: unknown[]) => mocks.summarizeRequestScopeContext(...args),
}));

vi.mock("@/lib/server/auth/sessionUser", () => ({
  getSessionUser: (...args: unknown[]) => mocks.getSessionUser(...args),
}));

import { POST as savePOST } from "@/app/api/contributions/save/route";

function req(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/contributions/save", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("create mode split - save route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.reset();
  });

  it("Scenario A: manual mode is accepted and persisted as manual", async () => {
    const res = await savePOST(
      req({
        textPrepared: "Manual contribution content with enough characters.",
        source: "statement_new",
        createMode: "manual",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      ok: true,
      createMode: "manual",
      requestScope: {
        organizationId: "org-1",
        membershipStatus: "organization_verified",
        regionIds: ["kommune-nord"],
      },
    });

    const saved = mocks.readAll();
    expect(saved).toHaveLength(1);
    expect(saved[0].createMode).toBe("manual");
  });

  it("Scenario B: source mode is accepted and persisted as source", async () => {
    const res = await savePOST(
      req({
        textPrepared: "Source based contribution content with enough characters.",
        source: "contribution_new",
        createMode: "source",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, createMode: "source" });

    const saved = mocks.readAll();
    expect(saved[0].createMode).toBe("source");
  });

  it("Scenario C: selected anlassraum context is persisted on save boundary", async () => {
    const res = await savePOST(
      req({
        textPrepared: "Source based contribution with explicit context.",
        source: "contribution_new",
        createMode: "source",
        anlassraumId: "65f000000000000000000011",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      ok: true,
      createMode: "source",
      anlassraumId: "65f000000000000000000011",
    });

    const saved = mocks.readAll();
    expect(saved[0].anlassraumId).toBe("65f000000000000000000011");
  });

  it("persists link and material context inside the saved draft analysis snapshot", async () => {
    const res = await savePOST(
      req({
        textPrepared: "Bitte prüft den beigefügten Tierwohl-Bericht und den Link zum EU-Standard.",
        source: "contribution_new",
        createMode: "source",
        sourceUrls: ["https://example.org/tierwohl-standard"],
        materialItems: [{ id: "mat-1", kind: "pdf_document", fileName: "tierwohl-bericht.pdf" }],
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, createMode: "source" });

    const saved = mocks.readAll();
    expect(saved[0].analysis?.inputContext).toMatchObject({
      sourceUrls: ["https://example.org/tierwohl-standard"],
      materialItems: [{ id: "mat-1", kind: "pdf_document", fileName: "tierwohl-bericht.pdf" }],
    });
  });

  it("Scenario C: ai mode is accepted as drafting intent only (no publish side effect)", async () => {
    const res = await savePOST(
      req({
        textPrepared: "AI assisted contribution content with enough characters.",
        source: "contribution_new",
        createMode: "ai",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, createMode: "ai" });

    const saved = mocks.readAll();
    expect(saved[0].createMode).toBe("ai");
    expect(saved[0].status).toBe("draft");
    expect(saved[0].publishedAt).toBeUndefined();
    expect(saved[0].approvedAt).toBeUndefined();
  });

  it("Scenario D: invalid mode is rejected with stable error and status", async () => {
    const res = await savePOST(
      req({
        textPrepared: "Invalid mode content with enough characters.",
        createMode: "robot",
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "invalid_create_mode" });
  });

  it("Scenario D: invalid context id is rejected explicitly", async () => {
    const res = await savePOST(
      req({
        textPrepared: "Invalid context id content with enough characters.",
        createMode: "source",
        anlassraumId: "bad-id",
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "invalid_anlassraum_id" });
  });

  it("Scenario E: missing mode uses stable normalized fallback", async () => {
    const res = await savePOST(
      req({
        textPrepared: "Legacy caller content with enough characters.",
        source: "statement_new",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ ok: true, createMode: "manual" });

    const saved = mocks.readAll();
    expect(saved[0].createMode).toBe("manual");
  });

  it("returns null requestScope when no organization context is resolved", async () => {
    mocks.resolveRequestScopeContext.mockResolvedValueOnce(null);
    mocks.summarizeRequestScopeContext.mockReturnValueOnce(null);

    const res = await savePOST(
      req({
        textPrepared: "Speichert ohne bestätigten Organisationsscope, aber weiterhin als Draft.",
        source: "contribution_new",
        createMode: "source",
      }),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      requestScope: null,
    });
  });

  it("requires a valid session user instead of trusting a bare uid cookie", async () => {
    mocks.setUser(null);

    const res = await savePOST(
      req({
        textPrepared: "Ohne valide Session darf kein Draft gespeichert werden.",
        source: "contribution_new",
        createMode: "source",
      }),
    );

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "not_authenticated",
    });
  });

  it("creates a pending editorial review request without publish or graph side effects", async () => {
    const res = await savePOST(
      req({
        textPrepared: "Bitte prüft diesen Analyse-Entwurf zur Schulwegsicherheit noch redaktionell.",
        source: "create_followup",
        createMode: "source",
        manualReviewRequested: true,
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      ok: true,
      reviewRequest: {
        sourceType: "create_analysis",
        status: "pending_review",
        noAutoPublish: true,
        noAutoGraphPromotion: true,
      },
    });

    const reviewSaved = mocks.readReviewAll();
    expect(reviewSaved).toHaveLength(1);
    expect(reviewSaved[0].status).toBe("pending_review");
    expect(reviewSaved[0].noAutoPublish).toBe(true);
    expect(reviewSaved[0].noAutoGraphPromotion).toBe(true);
    expect(reviewSaved[0].noAutoDossier).toBe(true);
    expect(reviewSaved[0].noAutoAnlassraum).toBe(true);
    expect(reviewSaved[0].noAutoVote).toBe(true);
    expect(reviewSaved[0].publishedAt).toBeUndefined();
  });
});
