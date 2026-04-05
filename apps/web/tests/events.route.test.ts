import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  coreCol: vi.fn(),
  requireGate: vi.fn(),
  ensureSystemEntityForRegion: vi.fn(),
  createManualAnlassraum: vi.fn(),
  eventsInsertOne: vi.fn(),
  anlassFindOne: vi.fn(),
}));

vi.mock("@core/db/triMongo", async () => {
  const actual = await vi.importActual<typeof import("@core/db/triMongo")>("@core/db/triMongo");
  return {
    ...actual,
    coreCol: (...args: unknown[]) => mocks.coreCol(...args),
  };
});

vi.mock("@/lib/server/auth/governance", () => ({
  requireGovernanceActorOrResponse: (...args: unknown[]) => mocks.requireGate(...args),
}));

vi.mock("@features/entities/service", () => ({
  ensureSystemEntityForRegion: (...args: unknown[]) => mocks.ensureSystemEntityForRegion(...args),
}));

vi.mock("@features/anlassraum/service", () => ({
  createManualAnlassraum: (...args: unknown[]) => mocks.createManualAnlassraum(...args),
}));

vi.mock("@features/dossier/protocolUpsert", () => ({
  getLatestDossierUpsertContractByCode: vi.fn(async () => null),
}));

vi.mock("@features/topicRound/seedContract", () => ({
  getLatestRoundSeedContractByCode: vi.fn(async () => null),
}));

import { ObjectId } from "@core/db/triMongo";
import { POST as eventsPOST } from "@/app/api/events/route";

function req(body: unknown) {
  return new NextRequest("http://localhost/api/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("events route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.eventsInsertOne.mockResolvedValue({
      insertedId: new ObjectId("65a111111111111111111119"),
    });
    mocks.anlassFindOne.mockResolvedValue(null);
    mocks.coreCol.mockImplementation(async (name: string) => {
      if (name === "events") {
        return {
          insertOne: mocks.eventsInsertOne,
        };
      }
      if (name === "anlassraum") {
        return {
          createIndex: vi.fn(async () => null),
          findOne: mocks.anlassFindOne,
        };
      }
      throw new Error(`unexpected_collection:${name}`);
    });
  });

  it("rejects invalid anlassraum id", async () => {
    const res = await eventsPOST(req({ title: "Buergerabend", anlassraumId: "bad-id" }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "invalid_anlassraum_id" });
    expect(mocks.eventsInsertOne).not.toHaveBeenCalled();
  });

  it("rejects missing anlassraum references", async () => {
    const anlassraumId = "65a111111111111111111110";
    const res = await eventsPOST(req({ title: "Buergerabend", anlassraumId }));
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "anlassraum_not_found" });
    expect(mocks.eventsInsertOne).not.toHaveBeenCalled();
  });

  it("rejects ambiguous create-and-link payloads", async () => {
    const roomId = new ObjectId("65a111111111111111111110");
    mocks.anlassFindOne.mockResolvedValue({ _id: roomId });
    const res = await eventsPOST(
      req({
        title: "Buergerabend",
        anlassraumId: roomId.toHexString(),
        createAnlassraum: true,
      }),
    );
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "anlassraum_link_conflict" });
    expect(mocks.requireGate).not.toHaveBeenCalled();
    expect(mocks.createManualAnlassraum).not.toHaveBeenCalled();
    expect(mocks.eventsInsertOne).not.toHaveBeenCalled();
  });

  it("creates event linked to an existing anlassraum", async () => {
    const roomId = new ObjectId("65a111111111111111111110");
    mocks.anlassFindOne.mockResolvedValue({ _id: roomId });
    const res = await eventsPOST(
      req({
        title: "Buergerabend",
        anlassraumId: roomId.toHexString(),
        qrSetCode: "qr-1",
      }),
    );
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      anlassraumId: roomId.toHexString(),
      dossierId: null,
    });
    expect(mocks.eventsInsertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Buergerabend",
        anlassraumId: roomId,
        qrSetCode: "qr-1",
        protocolStatus: "planned",
      }),
    );
    const insertedDoc = mocks.eventsInsertOne.mock.calls[0]?.[0];
    expect(insertedDoc).not.toHaveProperty("publishedAt");
    expect(mocks.createManualAnlassraum).not.toHaveBeenCalled();
  });

  it("creates and links a manual anlassraum without auto-publish path", async () => {
    const createdRoom = new ObjectId("65a111111111111111111121");
    mocks.requireGate.mockResolvedValue({
      actor: {
        userId: "reviewer-1",
        role: "reviewer",
        isAdmin: false,
        scopedOwnerIds: ["owner-1"],
        scopedEntityIds: ["owner-1"],
        personTrust: "verified",
      },
    });
    mocks.ensureSystemEntityForRegion.mockResolvedValue({
      entityId: new ObjectId("65a111111111111111111130"),
    });
    mocks.createManualAnlassraum.mockResolvedValue({
      anlassraumId: createdRoom,
    });

    const res = await eventsPOST(
      req({
        title: "Sitzung Mobilitaet",
        description: "Planung",
        createAnlassraum: true,
        regionCode: "DE-BE",
        scope: "regional",
        decisionScope: "national",
      }),
    );

    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      anlassraumId: createdRoom.toHexString(),
    });
    expect(mocks.createManualAnlassraum).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "event",
        originType: "event",
        ownerType: "system",
        ownerId: "event-flow",
        roomType: "community",
        scope: "regional",
        decisionScope: "national",
        createdBy: "reviewer-1",
      }),
    );
    expect(mocks.eventsInsertOne).toHaveBeenCalledWith(
      expect.objectContaining({
        anlassraumId: createdRoom,
        protocolStatus: "planned",
      }),
    );
  });
});
