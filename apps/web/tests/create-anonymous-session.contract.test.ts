import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/utils/env", () => ({
  env: {
    JWT_SECRET: "create-anonymous-session-test-secret",
  },
}));

import {
  resolveVerifiedCreateActor,
  setCreateAnonymousSessionRepoForTests,
} from "@/features/create/createAnonymousSession";

type SessionRecord = {
  id: string;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  lastVerifiedAt: Date;
};

describe("verified create anonymous session", () => {
  const records = new Map<string, SessionRecord>();

  beforeEach(() => {
    records.clear();
    setCreateAnonymousSessionRepoForTests({
      async create(record) {
        records.set(record.id, { ...record });
      },
      async verify(input) {
        const record = records.get(input.id);
        if (
          !record ||
          record.tokenHash !== input.tokenHash ||
          record.expiresAt <= input.now
        ) {
          return false;
        }
        record.lastVerifiedAt = input.now;
        return true;
      },
    });
  });

  it("reuses only a signed token backed by the server-side session store", async () => {
    const first = await resolveVerifiedCreateActor(
      new NextRequest("http://localhost/api/create/intelligent-followup"),
      null,
    );
    const cookie = first.responseCookie;
    expect(cookie).not.toBeNull();
    expect(first).toMatchObject({
      affectedUserId: null,
      anonymousSessionId: expect.stringMatching(/^create-anon-/),
    });
    expect(records.get(first.anonymousSessionId!)).toBeDefined();

    const verified = await resolveVerifiedCreateActor(
      new NextRequest("http://localhost/api/create/intelligent-followup", {
        headers: {
          cookie: `${cookie!.name}=${cookie!.value}`,
        },
      }),
      null,
    );

    expect(verified.anonymousSessionId).toBe(first.anonymousSessionId);
    expect(verified.responseCookie).toBeNull();
  });

  it("rejects client-chosen and tampered session identifiers", async () => {
    const clientChosen = await resolveVerifiedCreateActor(
      new NextRequest("http://localhost/api/create/intelligent-followup", {
        headers: {
          cookie: "edb_anon=client-picked; edb_create_session=client-picked",
        },
      }),
      null,
    );
    const originalId = clientChosen.anonymousSessionId;
    const issuedToken = clientChosen.responseCookie!.value;

    const tampered = await resolveVerifiedCreateActor(
      new NextRequest("http://localhost/api/create/intelligent-followup", {
        headers: {
          cookie: `edb_create_session=${issuedToken.slice(0, -1)}x`,
        },
      }),
      null,
    );

    expect(originalId).not.toBe("client-picked");
    expect(tampered.anonymousSessionId).not.toBe(originalId);
    expect(tampered.responseCookie).not.toBeNull();
  });

  it("always prefers the authenticated user binding over an anonymous cookie", async () => {
    const actor = await resolveVerifiedCreateActor(
      new NextRequest("http://localhost/api/create/intelligent-followup", {
        headers: { cookie: "edb_create_session=client-picked" },
      }),
      "user-verified",
    );

    expect(actor).toEqual({
      actorKey: "user:user-verified",
      affectedUserId: "user-verified",
      anonymousSessionId: null,
      responseCookie: null,
    });
    expect(records.size).toBe(0);
  });
});
