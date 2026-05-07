import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";

const mocks = vi.hoisted(() => {
  type AnyDoc = Record<string, any>;
  let userId: string | null = "user-1";
  const docs: AnyDoc[] = [];

  return {
    reset() {
      userId = "user-1";
      docs.length = 0;
    },
    setUser(next: string | null) {
      userId = next;
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
    getCol: vi.fn(async () => ({
      async insertOne(doc: AnyDoc) {
        const next = { ...doc, _id: new ObjectId() };
        docs.push(next);
        return { acknowledged: true, insertedId: next._id };
      },
      async findOneAndUpdate() {
        return null;
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
  };
});

import { POST } from "@/app/api/contributions/save/route";

function req(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/contributions/save", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("create save safety gate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.reset();
  });

  it("blocks save on blocked safety decision", async () => {
    const res = await POST(
      req({
        textPrepared: "Ich bringe dich um.",
        createMode: "source",
      }),
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("create_input_blocked");
    expect(body.safety.decision).toBe("blocked");
    expect(mocks.readAll()).toHaveLength(0);
  });

  it("stores redacted text when pii is present", async () => {
    const res = await POST(
      req({
        textPrepared: "Kontakt: max@example.org, +49 171 1234567, Musterstraße 12.",
        createMode: "source",
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    const saved = mocks.readAll();
    expect(saved).toHaveLength(1);
    expect(saved[0].text).not.toContain("max@example.org");
    expect(saved[0].text).toContain("[E-MAIL ENTFERNT]");
    expect(saved[0].analysis?.safety?.decision).toBeTruthy();
  });

  it("saves moderation-required draft but keeps safety in analysis", async () => {
    const res = await POST(
      req({
        textPrepared: "Wenn nichts passiert, regeln wir das per Selbstjustiz.",
        createMode: "source",
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.safety.decision).toBe("moderation_required");
    const saved = mocks.readAll();
    expect(saved[0].analysis?.safety?.decision).toBe("moderation_required");
  });
});
