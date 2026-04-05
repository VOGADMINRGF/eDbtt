import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { ObjectId } from "@core/db/triMongo";

const mocks = vi.hoisted(() => ({
  requireGate: vi.fn(),
  voteDraftsCol: vi.fn(),
  anlassraumCol: vi.fn(),
  canAccess: vi.fn(),
}));

vi.mock("@/lib/server/auth/governance", () => ({
  requireGovernanceActorOrResponse: (...args: unknown[]) => mocks.requireGate(...args),
}));

vi.mock("@features/feeds/db", () => ({
  voteDraftsCol: (...args: unknown[]) => mocks.voteDraftsCol(...args),
}));

vi.mock("@features/anlassraum/db", () => ({
  anlassraumCol: (...args: unknown[]) => mocks.anlassraumCol(...args),
}));

vi.mock("@features/anlassraum/governance", () => ({
  canActorAccessAnlassraum: (...args: unknown[]) => mocks.canAccess(...args),
}));

import { POST as statusPOST } from "@/app/api/admin/feeds/drafts/[id]/status/route";

function req(id: string, status: string) {
  return {
    request: new NextRequest(`http://localhost/api/admin/feeds/drafts/${id}/status`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    }),
    context: { params: Promise.resolve({ id }) },
  };
}

describe("feed draft status route", () => {
  const draftId = new ObjectId("65a111111111111111111111");

  beforeEach(() => {
    vi.clearAllMocks();
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
    mocks.canAccess.mockReturnValue(true);
    mocks.anlassraumCol.mockResolvedValue({
      findOne: vi.fn(async () => null),
    });
  });

  it("maps discarded status to explicit ignored feedReviewState", async () => {
    let stored = {
      _id: draftId,
      status: "review",
      feedReviewState: "attached",
      reviewNote: null,
      anlassraumId: null,
      updatedAt: new Date("2026-04-05T09:00:00.000Z"),
      lastReviewAction: null,
      lastReviewActionBy: null,
      lastReviewActionAt: null,
    };
    const findOneAndUpdate = vi.fn(async (_filter: unknown, update: any) => {
      stored = { ...stored, ...update.$set };
      return { value: stored };
    });
    mocks.voteDraftsCol.mockResolvedValue({
      findOne: vi.fn(async () => stored),
      findOneAndUpdate,
    });

    const { request, context } = req(draftId.toHexString(), "discarded");
    const res = await statusPOST(request, context as any);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      draft: {
        status: "discarded",
        feedReviewState: "ignored",
        lastReviewAction: "set_status",
        lastReviewActionBy: "reviewer-1",
      },
    });
    expect(findOneAndUpdate).toHaveBeenCalledWith(
      { _id: draftId },
      expect.objectContaining({
        $set: expect.objectContaining({
          status: "discarded",
          feedReviewState: "ignored",
          lastReviewAction: "set_status",
        }),
      }),
      { returnDocument: "after" },
    );
  });

  it("restores queued review state when ignored drafts are reopened", async () => {
    let stored = {
      _id: draftId,
      status: "discarded",
      feedReviewState: "ignored",
      reviewNote: "legacy",
      anlassraumId: null,
      updatedAt: new Date("2026-04-05T09:00:00.000Z"),
      lastReviewAction: "ignore",
      lastReviewActionBy: "reviewer-1",
      lastReviewActionAt: new Date("2026-04-05T09:00:00.000Z"),
    };
    const findOneAndUpdate = vi.fn(async (_filter: unknown, update: any) => {
      stored = { ...stored, ...update.$set };
      return { value: stored };
    });
    mocks.voteDraftsCol.mockResolvedValue({
      findOne: vi.fn(async () => stored),
      findOneAndUpdate,
    });

    const { request, context } = req(draftId.toHexString(), "review");
    const res = await statusPOST(request, context as any);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      draft: {
        status: "review",
        feedReviewState: "queued",
      },
    });
  });

  it("keeps attached review state when non-ignored drafts change status", async () => {
    let stored = {
      _id: draftId,
      status: "review",
      feedReviewState: "attached",
      reviewNote: null,
      anlassraumId: null,
      updatedAt: new Date("2026-04-05T09:00:00.000Z"),
      lastReviewAction: "attach_to_anlassraum",
      lastReviewActionBy: "reviewer-1",
      lastReviewActionAt: new Date("2026-04-05T09:00:00.000Z"),
    };
    const findOneAndUpdate = vi.fn(async (_filter: unknown, update: any) => {
      stored = { ...stored, ...update.$set };
      return { value: stored };
    });
    mocks.voteDraftsCol.mockResolvedValue({
      findOne: vi.fn(async () => stored),
      findOneAndUpdate,
    });

    const { request, context } = req(draftId.toHexString(), "draft");
    const res = await statusPOST(request, context as any);
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      draft: {
        status: "draft",
        feedReviewState: "attached",
      },
    });
  });
});
