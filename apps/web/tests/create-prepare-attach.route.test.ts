import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";

const mocks = vi.hoisted(() => {
  let userId: string | null = "user-1";
  const docs: Array<Record<string, unknown>> = [];
  const getColCalls: string[] = [];
  function matchesFilter(doc: Record<string, unknown>, filter: Record<string, unknown>) {
    return Object.entries(filter).every(([key, value]) => (doc as Record<string, unknown>)[key] === value);
  }

  return {
    reset() {
      userId = "user-1";
      docs.length = 0;
      getColCalls.length = 0;
    },
    setUser(value: string | null) {
      userId = value;
    },
    readDocs() {
      return docs.map((entry) => ({ ...entry }));
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
      if (name !== "create_prepare_attach_drafts") {
        throw new Error(`unexpected_collection_${name}`);
      }
      return {
        async findOne(
          filter: Record<string, unknown>,
          opts?: { sort?: Record<string, 1 | -1> },
        ) {
          const matched = docs.filter((doc) => matchesFilter(doc, filter));
          if (!matched.length) return null;
          if (opts?.sort && "createdAt" in opts.sort) {
            const direction = opts.sort.createdAt;
            matched.sort((a, b) =>
              direction === -1
                ? String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
                : String(a.createdAt || "").localeCompare(String(b.createdAt || "")),
            );
          }
          return { ...matched[0] };
        },
        async insertOne(doc: Record<string, unknown>) {
          const next = { ...doc, _id: new ObjectId() };
          docs.push(next);
          return { acknowledged: true, insertedId: next._id };
        },
      };
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
  };
});

import { POST as attachDraftPOST } from "@/app/api/contributions/attach-drafts/route";
import { CREATE_PREPARE_ATTACH_DRAFT_SCHEMA_VERSION } from "@/features/create/prepareAttachDraft";

function basePayload(overrides?: Record<string, unknown>) {
  return {
    schemaVersion: CREATE_PREPARE_ATTACH_DRAFT_SCHEMA_VERSION,
    sourceRunId: "run-1",
    ctaId: "perspektive_anhaengen",
    matchType: "related_claim",
    matchEntityType: "claim",
    attachTargetType: "claim",
    attachTargetId: "claim-1",
    attachTargetRef: "/swipes?statementId=claim-1",
    attachTargetLabel: "Claim 1",
    sourceSummary: "Kurzsummary",
    selectedReason: "Perspektive soll angehaengt werden",
    reasons: ["Semantische Naehe", "Kontext passt"],
    sourceLanguage: "de",
    contentLanguage: "de",
    uiLocale: "de",
    requiresReview: true,
    noAutoPublish: true,
    noSilentMerge: true,
    originPreserved: true,
    duplicateRisk: false,
    userConfirmedAt: "2026-03-20T10:00:00.000Z",
    ...overrides,
  };
}

function req(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/contributions/attach-drafts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/contributions/attach-drafts route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.reset();
  });

  it("saves manual prepare_attach draft with review-safe guardrails", async () => {
    const res = await attachDraftPOST(req(basePayload()));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      ok: true,
      status: "draft_intent",
      requiresReview: true,
      noAutoPublish: true,
      noSilentMerge: true,
      originPreserved: true,
      duplicateRisk: false,
      reviewState: "pending",
      applyState: "not_applied",
      attachTargetType: "claim",
      attachTargetId: "claim-1",
    });

    const saved = mocks.readDocs();
    expect(saved).toHaveLength(1);
    expect(saved[0].status).toBe("draft_intent");
    expect(saved[0].ctaId).toBe("perspektive_anhaengen");
    expect(saved[0].schemaVersion).toBe(CREATE_PREPARE_ATTACH_DRAFT_SCHEMA_VERSION);
    expect(saved[0].originPreserved).toBe(true);
    expect(saved[0].reviewState).toBe("pending");
    expect(saved[0].applyState).toBe("not_applied");
    expect(saved[0].updatedAt).toBeTypeOf("string");
  });

  it("dedupes identical pending drafts and avoids hidden duplicate flood", async () => {
    const first = await attachDraftPOST(req(basePayload()));
    expect(first.status).toBe(200);
    const second = await attachDraftPOST(req(basePayload()));
    expect(second.status).toBe(200);
    await expect(second.json()).resolves.toMatchObject({
      ok: true,
      deduped: true,
      reviewState: "pending",
      applyState: "not_applied",
    });
    expect(mocks.readDocs()).toHaveLength(1);
  });

  it("rejects invalid anlassraum target ids explicitly", async () => {
    const res = await attachDraftPOST(
      req(basePayload({
        attachTargetType: "anlassraum",
        attachTargetId: "bad-id",
      })),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "invalid_attach_target_id" });
  });

  it("rejects unsupported payload shape cleanly", async () => {
    const res = await attachDraftPOST(
      req(basePayload({
        ctaId: "neu_anlegen",
        attachTargetType: "question",
        attachTargetId: "q1",
      } as any)),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false });
  });

  it("keeps write scope limited to create_prepare_attach_drafts only", async () => {
    const res = await attachDraftPOST(
      req(basePayload({
        sourceRunId: "run-2",
        ctaId: "zustimmen",
        attachTargetType: "claim",
        attachTargetId: "claim-2",
      })),
    );

    expect(res.status).toBe(200);
    expect(mocks.getColCalls()).toEqual(["create_prepare_attach_drafts"]);
  });

  it("requires authentication", async () => {
    mocks.setUser(null);
    const res = await attachDraftPOST(
      req(basePayload()),
    );

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "not_authenticated" });
  });

  it("rejects duplicate_risk saves without explicit review reason", async () => {
    const res = await attachDraftPOST(
      req(basePayload({
        matchType: "duplicate_risk",
        duplicateRisk: true,
        selectedReason: null,
      })),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "duplicate_risk_requires_reason",
    });
  });

  it("rejects unknown schema version", async () => {
    const res = await attachDraftPOST(
      req(basePayload({
        schemaVersion: "create_prepare_attach_draft.v0",
      })),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid_schema_version",
    });
  });
});
