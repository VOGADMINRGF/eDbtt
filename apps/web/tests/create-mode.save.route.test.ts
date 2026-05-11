import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";

const mocks = vi.hoisted(() => {
  type AnyDoc = Record<string, any>;

  let userId: string | null = "user-1";
  const docs: AnyDoc[] = [];

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
      userId = "user-1";
    },
    readAll() {
      return docs.map((doc) => ({ ...doc }));
    },
    cookies: vi.fn(async () => ({
      get(name: string) {
        if (name !== "u_id" || !userId) return undefined;
        return { value: userId };
      },
    })),
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
    expect(body).toMatchObject({ ok: true, createMode: "manual" });

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
});
