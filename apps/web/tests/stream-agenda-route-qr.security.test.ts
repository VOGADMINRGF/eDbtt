import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ObjectId } from "@core/db/triMongo";

const mocks = vi.hoisted(() => ({
  findSession: vi.fn(),
  insertAgenda: vi.fn(),
}));

vi.mock("@features/stream/db", () => ({
  streamSessionsCol: async () => ({
    findOne: (...args: unknown[]) => mocks.findSession(...args),
  }),
  streamAgendaCol: async () => ({
    insertOne: (...args: unknown[]) => mocks.insertAgenda(...args),
  }),
}));

vi.mock("@/app/api/streams/utils", () => ({
  requireCreatorContext: vi.fn(async () => ({
    userId: "creator-1",
    isStaff: false,
  })),
  enforceStreamHost: vi.fn(async () => null),
  enforceStreamIdentityReady: vi.fn(async () => null),
}));

vi.mock("@/utils/rateLimitHelpers", () => ({
  rateLimitOrThrow: vi.fn(async () => ({ ok: true })),
}));

import { POST } from "@/app/api/streams/sessions/[id]/agenda/route";

const SESSION_ID = "65f000000000000000000901";

function requestFor(qrTarget: unknown) {
  return new NextRequest(`http://localhost/api/streams/sessions/${SESSION_ID}/agenda`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ kind: "info", qrTarget }),
  });
}

describe("stream agenda route QR consumer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findSession.mockResolvedValue({
      _id: new ObjectId(SESSION_ID),
      creatorId: "creator-1",
      status: "scheduled",
    });
    mocks.insertAgenda.mockResolvedValue({
      insertedId: new ObjectId("65f000000000000000000902"),
    });
  });

  it.each([
    ["surrounding whitespace", " /dossier/demo "],
    ["raw backslash", "/\\evil.example"],
    ["encoded backslash", "/%5Cevil.example"],
    ["malformed encoding", "/%GG"],
  ])("rejects %s without persistence", async (_label, qrTarget) => {
    const response = await POST(requestFor(qrTarget), {
      params: Promise.resolve({ id: SESSION_ID }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid_qr_target",
    });
    expect(mocks.insertAgenda).not.toHaveBeenCalled();
  });

  it("persists the validator result without trim or cut", async () => {
    const qrTarget = "/dossier/demo?view=public#sources";
    const response = await POST(requestFor(qrTarget), {
      params: Promise.resolve({ id: SESSION_ID }),
    });

    expect(response.status).toBe(200);
    expect(mocks.insertAgenda).toHaveBeenCalledTimes(1);
    expect(mocks.insertAgenda.mock.calls[0]?.[0]).toMatchObject({ qrTarget });
  });
});
