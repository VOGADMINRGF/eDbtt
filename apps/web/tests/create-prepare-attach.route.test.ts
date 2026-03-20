import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";

const mocks = vi.hoisted(() => {
  let userId: string | null = "user-1";
  const docs: Array<Record<string, unknown>> = [];
  const getColCalls: string[] = [];

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
    const res = await attachDraftPOST(
      req({
        sourceRunId: "run-1",
        ctaId: "perspektive_anhaengen",
        attachTargetType: "claim",
        attachTargetId: "claim-1",
        attachTargetRef: "/swipes?statementId=claim-1",
        sourceSummary: "Kurzsummary",
        selectedReason: "Perspektive soll angehaengt werden",
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      ok: true,
      status: "draft_intent",
      requiresReview: true,
      noAutoPublish: true,
      noSilentMerge: true,
      attachTargetType: "claim",
      attachTargetId: "claim-1",
    });

    const saved = mocks.readDocs();
    expect(saved).toHaveLength(1);
    expect(saved[0].status).toBe("draft_intent");
    expect(saved[0].ctaId).toBe("perspektive_anhaengen");
  });

  it("rejects invalid anlassraum target ids explicitly", async () => {
    const res = await attachDraftPOST(
      req({
        sourceRunId: "run-1",
        ctaId: "perspektive_anhaengen",
        attachTargetType: "anlassraum",
        attachTargetId: "bad-id",
        sourceSummary: "Kurzsummary",
      }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "invalid_attach_target_id" });
  });

  it("rejects unsupported payload shape cleanly", async () => {
    const res = await attachDraftPOST(
      req({
        sourceRunId: "run-1",
        ctaId: "neu_anlegen",
        attachTargetType: "question",
        attachTargetId: "q1",
        sourceSummary: "Kurzsummary",
      } as any),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false });
  });

  it("keeps write scope limited to create_prepare_attach_drafts only", async () => {
    const res = await attachDraftPOST(
      req({
        sourceRunId: "run-2",
        ctaId: "zustimmen",
        attachTargetType: "claim",
        attachTargetId: "claim-2",
        sourceSummary: "Zusammenfassung",
      }),
    );

    expect(res.status).toBe(200);
    expect(mocks.getColCalls()).toEqual(["create_prepare_attach_drafts"]);
  });

  it("requires authentication", async () => {
    mocks.setUser(null);
    const res = await attachDraftPOST(
      req({
        sourceRunId: "run-1",
        ctaId: "perspektive_anhaengen",
        attachTargetType: "claim",
        attachTargetId: "claim-1",
        sourceSummary: "Kurzsummary",
      }),
    );

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "not_authenticated" });
  });
});
