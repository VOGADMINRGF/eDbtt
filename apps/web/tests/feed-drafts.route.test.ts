import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ObjectId } from "@core/db/triMongo";

const mocks = vi.hoisted(() => ({
  requireGate: vi.fn(),
  voteDraftsCol: vi.fn(),
  anlassraumCol: vi.fn(),
  outputSeedCol: vi.fn(),
  canAccess: vi.fn(),
  getRegionName: vi.fn(),
  buildQueueMeta: vi.fn(),
}));

vi.mock("@/lib/server/auth/governance", () => ({
  requireGovernanceActorOrResponse: (...args: unknown[]) => mocks.requireGate(...args),
}));

vi.mock("@features/feeds/db", () => ({
  voteDraftsCol: (...args: unknown[]) => mocks.voteDraftsCol(...args),
}));

vi.mock("@features/anlassraum/db", () => ({
  anlassraumCol: (...args: unknown[]) => mocks.anlassraumCol(...args),
  outputSeedCol: (...args: unknown[]) => mocks.outputSeedCol(...args),
}));

vi.mock("@features/anlassraum/governance", () => ({
  canActorAccessAnlassraum: (...args: unknown[]) => mocks.canAccess(...args),
}));

vi.mock("@core/regions/regionTranslations", () => ({
  getRegionName: (...args: unknown[]) => mocks.getRegionName(...args),
}));

vi.mock("@features/feeds/reviewQueue", () => ({
  FEED_REVIEW_QUEUE_SORTS: ["newest", "oldest", "review_recent", "review_stale", "priority_high"],
  buildFeedQueueMeta: (...args: unknown[]) => mocks.buildQueueMeta(...args),
}));

import { GET as draftsGET } from "@/app/api/admin/feeds/drafts/route";

const gateAccess = {
  user: { _id: { toHexString: () => "u-admin" } },
  roles: ["admin"],
  actor: {
    userId: "u-admin",
    role: "admin",
    isAdmin: true,
    scopedOwnerIds: [],
    scopedEntityIds: [],
    personTrust: "verified",
  },
};

function req(url: string) {
  return new NextRequest(url);
}

function createFindChain(items: unknown[]) {
  const chain = {
    sort: vi.fn(() => chain),
    skip: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    toArray: vi.fn(async () => items),
  };
  return chain;
}

describe("feed drafts route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireGate.mockResolvedValue(gateAccess);
    mocks.canAccess.mockReturnValue(true);
    mocks.getRegionName.mockResolvedValue("Berlin");
    mocks.outputSeedCol.mockResolvedValue({
      find: vi.fn(() => ({
        sort: vi.fn(() => ({
          toArray: vi.fn(async () => []),
        })),
      })),
    });
    mocks.buildQueueMeta.mockReturnValue({
      priorityScore: 5,
      priorityBucket: "medium",
      pendingHours: 2,
      needsAnlassraumBackfill: false,
      reasons: ["seeded"],
    });
  });

  it("rejects invalid anlassraumId filter with 400", async () => {
    const res = await draftsGET(req("http://localhost/api/admin/feeds/drafts?anlassraumId=broken"));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid_anlassraum_id_filter",
    });
    expect(mocks.voteDraftsCol).not.toHaveBeenCalled();
  });

  it("applies anlassraumId filter to read query and response filters", async () => {
    const roomId = new ObjectId("65a111111111111111111110");
    const draftId = new ObjectId("65a111111111111111111111");
    const dossierId = new ObjectId("65a111111111111111111112");
    const chain = createFindChain([
      {
        _id: draftId,
        anlassraumId: roomId,
        title: "Draft mit Anlassraum",
        status: "review",
        regionCode: "DE",
        sourceUrl: "https://example.org/news",
        pipeline: "feeds_to_statementCandidate",
        feedReviewState: "queued",
        weakSignal: null,
        reviewNote: null,
        lastReviewAction: null,
        lastReviewActionBy: null,
        lastReviewActionAt: null,
        createdAt: new Date("2026-03-21T08:00:00.000Z"),
        analyzeCompletedAt: null,
      },
    ]);
    const countDocuments = vi.fn(async () => 1);
    const find = vi.fn(() => chain);
    mocks.voteDraftsCol.mockResolvedValue({ countDocuments, find });

    const roomsFind = { toArray: vi.fn(async () => [{ _id: roomId, title: "Anlassraum A" }]) };
    mocks.anlassraumCol.mockResolvedValue({
      find: vi.fn(() => roomsFind),
    });
    mocks.outputSeedCol.mockResolvedValue({
      find: vi.fn(() => ({
        sort: vi.fn(() => ({
          toArray: vi.fn(async () => [
            {
              _id: new ObjectId("65a111111111111111111120"),
              anlassraumId: roomId,
              outputType: "round_seed",
              publishTarget: "/round/anlassraum-a",
              updatedAt: new Date("2026-03-21T10:00:00.000Z"),
            },
          ]),
        })),
      })),
    });
    roomsFind.toArray.mockResolvedValueOnce([
      {
        _id: roomId,
        title: "Anlassraum A",
        type: "policy",
        scope: "regional",
        status: "active",
        maturity: "emerging",
        ownerType: "association",
        roomType: "community",
        originType: "feed",
        sourceMode: "feed",
        dossierId,
      },
    ]);

    const res = await draftsGET(
      req(
        `http://localhost/api/admin/feeds/drafts?hasAnlassraum=linked&anlassraumId=${roomId.toHexString()}`,
      ),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.filters).toMatchObject({
      hasAnlassraum: "linked",
      anlassraumId: roomId.toHexString(),
    });
    expect(body.items[0]?.anlassraumId).toBe(roomId.toHexString());
    expect(body.items[0]?.surfaceComposition?.anlass?.hasExistingContext).toBe(true);
    expect(body.items[0]?.surfaceComposition?.anlassgeber?.signalPathHint).toBe(
      "attach_to_existing_anlassraum",
    );
    expect(
      body.items[0]?.surfaceComposition?.anschlussflaechen?.canonicalPublicTarget,
    ).toContain("/dossier/");

    const filterArg = countDocuments.mock.calls[0]?.[0] as { $and?: Array<Record<string, unknown>> };
    expect(Array.isArray(filterArg?.$and)).toBe(true);
    const idConditionPresent = (filterArg.$and ?? []).some((entry) => {
      const candidate = entry.anlassraumId;
      return candidate instanceof ObjectId && candidate.toHexString() === roomId.toHexString();
    });
    expect(idConditionPresent).toBe(true);
  });
});
