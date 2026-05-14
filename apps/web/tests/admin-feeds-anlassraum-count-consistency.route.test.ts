import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ObjectId } from "@core/db/triMongo";

const mocks = vi.hoisted(() => ({
  requireGovernanceActorOrResponse: vi.fn(),
  anlassraumCol: vi.fn(),
  anlassraumSourceLinksCol: vi.fn(),
  anlassraumStructureCol: vi.fn(),
  outputSeedCol: vi.fn(),
  canActorAccessAnlassraum: vi.fn(),
  getAnlassraumPublishGate: vi.fn(),
}));

vi.mock("@/lib/server/auth/governance", () => ({
  requireGovernanceActorOrResponse: (...args: unknown[]) => mocks.requireGovernanceActorOrResponse(...args),
}));

vi.mock("@features/anlassraum/db", () => ({
  anlassraumCol: (...args: unknown[]) => mocks.anlassraumCol(...args),
  anlassraumSourceLinksCol: (...args: unknown[]) => mocks.anlassraumSourceLinksCol(...args),
  anlassraumStructureCol: (...args: unknown[]) => mocks.anlassraumStructureCol(...args),
  outputSeedCol: (...args: unknown[]) => mocks.outputSeedCol(...args),
}));

vi.mock("@features/anlassraum/governance", () => ({
  canActorAccessAnlassraum: (...args: unknown[]) => mocks.canActorAccessAnlassraum(...args),
  getAnlassraumPublishGate: (...args: unknown[]) => mocks.getAnlassraumPublishGate(...args),
}));

import { GET as LIST_GET } from "@/app/api/admin/feeds/anlassraum/route";
import { GET as DETAIL_GET } from "@/app/api/admin/feeds/anlassraum/[id]/route";

describe("admin feeds anlassraum count consistency", () => {
  const roomId = new ObjectId("507f1f77bcf86cd799439011");
  const room = {
    _id: roomId,
    title: "Mobilität Innenstadt",
    slug: "mobilitaet-innenstadt",
    type: "policy",
    kind: "anlassraum",
    sourceMode: "feed",
    originType: "feed",
    ownerType: "municipality",
    status: "reviewed",
    scope: "regional",
    decisionScope: "regional",
    maturity: "structured",
    topicKey: "verkehr",
    clusterKey: "cluster-verkehr",
    regionCode: "DE:BE",
    regionKey: "DE:BE",
    dossierId: null,
    dossierType: null,
    isPublic: false,
    reviewedBy: "editor-1",
    approvedBy: null,
    relevanceScore: 82,
    reviewMode: "standard",
    riskFlags: [],
    createdAt: new Date("2026-05-10T08:00:00.000Z"),
    updatedAt: new Date("2026-05-11T08:00:00.000Z"),
    summary: "Verdichteter Arbeitsstand.",
    roomType: "community",
    contentTrust: "reviewed",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireGovernanceActorOrResponse.mockResolvedValue({
      actor: { role: "admin", isAdmin: true },
    });
    mocks.canActorAccessAnlassraum.mockReturnValue(true);
    mocks.getAnlassraumPublishGate.mockResolvedValue({
      ok: true,
      reasons: [],
      sourceCount: 2,
      requiredSourceCount: 2,
    });

    mocks.anlassraumCol.mockResolvedValue({
      find: vi.fn(() => ({
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([room]),
      })),
      findOne: vi.fn().mockResolvedValue(room),
    });

    mocks.anlassraumSourceLinksCol.mockResolvedValue({
      aggregate: vi.fn(() => ({
        toArray: vi.fn().mockResolvedValue([{ _id: roomId, count: 2 }]),
      })),
      find: vi.fn(() => ({
        toArray: vi.fn().mockResolvedValue([
          {
            _id: new ObjectId("507f1f77bcf86cd799439021"),
            anlassraumId: roomId,
            sourceUrl: "https://example.org/a",
            sourceWeight: 1,
            role: "primary",
            publisher: "Quelle A",
            createdAt: new Date("2026-05-11T08:00:00.000Z"),
            updatedAt: new Date("2026-05-11T08:00:00.000Z"),
          },
          {
            _id: new ObjectId("507f1f77bcf86cd799439022"),
            anlassraumId: roomId,
            sourceUrl: "https://example.org/b",
            sourceWeight: 1,
            role: "supporting",
            publisher: "Quelle B",
            createdAt: new Date("2026-05-11T08:10:00.000Z"),
            updatedAt: new Date("2026-05-11T08:10:00.000Z"),
          },
        ]),
      })),
    });

    mocks.anlassraumStructureCol.mockResolvedValue({
      findOne: vi.fn().mockResolvedValue(null),
    });

    mocks.outputSeedCol.mockResolvedValue({
      find: vi.fn(() => ({
        toArray: vi.fn().mockResolvedValue([]),
        sort: vi.fn().mockReturnThis(),
      })),
    });
  });

  it("keeps source counts aligned between list and detail", async () => {
    const listRes = await LIST_GET(new NextRequest("http://localhost/api/admin/feeds/anlassraum"));
    expect(listRes.status).toBe(200);
    const listBody = await listRes.json();
    expect(listBody?.items?.[0]?.sourceCount).toBe(2);

    const detailRes = await DETAIL_GET(
      new NextRequest(`http://localhost/api/admin/feeds/anlassraum/${roomId.toHexString()}`),
      { params: Promise.resolve({ id: roomId.toHexString() }) },
    );
    expect(detailRes.status).toBe(200);
    const detailBody = await detailRes.json();
    expect(detailBody?.sources).toHaveLength(2);
  });
});
