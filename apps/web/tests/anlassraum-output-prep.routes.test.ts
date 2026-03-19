import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireGate: vi.fn(),
  listSeeds: vi.fn(),
  transitionSeed: vi.fn(),
}));

vi.mock("@/lib/server/auth/governance", () => ({
  requireGovernanceActorOrResponse: (...args: unknown[]) => mocks.requireGate(...args),
}));

vi.mock("@features/anlassraum/outputPrep", () => ({
  OUTPUT_PREP_ACTIONS: [
    "queue",
    "send_to_review",
    "approve_prep",
    "reject_prep",
    "mark_ready",
    "publish",
    "discard",
    "reset_draft",
  ],
  listOutputSeedsAuthorized: (...args: unknown[]) => mocks.listSeeds(...args),
  transitionOutputSeedAuthorized: (...args: unknown[]) => mocks.transitionSeed(...args),
}));

import { GET as outputsGET } from "@/app/api/admin/feeds/anlassraum/[id]/outputs/route";
import { POST as transitionPOST } from "@/app/api/admin/feeds/anlassraum/[id]/outputs/[seedId]/transition/route";

const gateAccess = {
  user: { _id: { toHexString: () => "u1" } },
  roles: ["reviewer"],
  actor: {
    userId: "u1",
    role: "reviewer",
    isAdmin: false,
    scopedOwnerIds: ["owner-1"],
    scopedEntityIds: ["owner-1"],
    personTrust: "verified",
  },
};

function req(url: string, init?: RequestInit) {
  return new NextRequest(url, init);
}

function params(id = "65a111111111111111111111", seedId = "65a111111111111111111112") {
  return { params: Promise.resolve({ id, seedId }) };
}

describe("anlassraum output-prep routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireGate.mockResolvedValue(gateAccess);
  });

  it("list route returns output seeds and publish-gate snapshot", async () => {
    mocks.listSeeds.mockResolvedValue({
      anlassraum: {
        _id: { toHexString: () => "65a111111111111111111111" },
        title: "Room A",
        status: "approved",
      },
      items: [
        {
          _id: { toHexString: () => "65a111111111111111111112" },
          outputType: "social_seed",
          status: "review",
          reviewState: "pending",
          targetRegion: "DE-BE",
          targetAudience: "citizens",
          publishTarget: null,
          reviewNote: null,
          lastAction: "send_to_review",
          lastActionBy: "u1",
          lastActionAt: new Date("2026-03-19T10:00:00.000Z"),
          createdAt: new Date("2026-03-19T09:00:00.000Z"),
          updatedAt: new Date("2026-03-19T10:00:00.000Z"),
        },
      ],
      publishGate: { ok: false, reasons: ["missing_approved_by"] },
    });

    const res = await outputsGET(
      req(
        "http://localhost/api/admin/feeds/anlassraum/65a111111111111111111111/outputs?status=review&outputType=social_seed&reviewState=pending",
      ),
      { params: Promise.resolve({ id: "65a111111111111111111111" }) },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      anlassraum: { id: "65a111111111111111111111", title: "Room A" },
      items: [{ id: "65a111111111111111111112", outputType: "social_seed", status: "review" }],
      publishGate: { ok: false },
    });
  });

  it("list route validates status filter", async () => {
    const res = await outputsGET(
      req("http://localhost/api/admin/feeds/anlassraum/65a111111111111111111111/outputs?status=bad"),
      { params: Promise.resolve({ id: "65a111111111111111111111" }) },
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "invalid_status" });
  });

  it("transition route validates action", async () => {
    const res = await transitionPOST(
      req("http://localhost/api/admin/feeds/anlassraum/65a111111111111111111111/outputs/65a111111111111111111112/transition", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "invalid" }),
      }),
      params(),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "invalid_action" });
  });

  it("transition route returns updated seed on success", async () => {
    mocks.transitionSeed.mockResolvedValue({
      seed: {
        _id: { toHexString: () => "65a111111111111111111112" },
        anlassraumId: { toHexString: () => "65a111111111111111111111" },
        outputType: "round_seed",
        status: "ready",
        reviewState: "approved",
        publishTarget: null,
        reviewNote: "ready for prep",
        lastAction: "mark_ready",
        lastActionBy: "u1",
        lastActionAt: new Date("2026-03-19T10:00:00.000Z"),
        updatedAt: new Date("2026-03-19T10:00:00.000Z"),
      },
      publishGate: { ok: true, reasons: [] },
    });

    const res = await transitionPOST(
      req("http://localhost/api/admin/feeds/anlassraum/65a111111111111111111111/outputs/65a111111111111111111112/transition", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "mark_ready" }),
      }),
      params(),
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      seed: {
        id: "65a111111111111111111112",
        anlassraumId: "65a111111111111111111111",
        status: "ready",
        reviewState: "approved",
        lastAction: "mark_ready",
      },
      publishGate: { ok: true },
    });
  });

  it("transition route maps failed publish gate to 409", async () => {
    mocks.transitionSeed.mockRejectedValue(new Error("publish_gate_failed:missing_approved_by"));

    const res = await transitionPOST(
      req("http://localhost/api/admin/feeds/anlassraum/65a111111111111111111111/outputs/65a111111111111111111112/transition", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "mark_ready" }),
      }),
      params(),
    );

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "publish_gate_failed:missing_approved_by",
    });
  });

  it("transition route maps forbidden scope to 403", async () => {
    mocks.transitionSeed.mockRejectedValue(new Error("forbidden_scope"));

    const res = await transitionPOST(
      req("http://localhost/api/admin/feeds/anlassraum/65a111111111111111111111/outputs/65a111111111111111111112/transition", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "discard" }),
      }),
      params(),
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "forbidden_scope" });
  });

  it("transition route maps invalid seed id to 400", async () => {
    mocks.transitionSeed.mockRejectedValue(new Error("invalid_seed_id"));

    const res = await transitionPOST(
      req("http://localhost/api/admin/feeds/anlassraum/65a111111111111111111111/outputs/xx/transition", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "discard" }),
      }),
      params("65a111111111111111111111", "xx"),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "invalid_seed_id" });
  });

  it("transition route blocks direct publish bypass from draft state", async () => {
    mocks.transitionSeed.mockRejectedValue(new Error("invalid_transition_from_status:draft"));

    const res = await transitionPOST(
      req("http://localhost/api/admin/feeds/anlassraum/65a111111111111111111111/outputs/65a111111111111111111112/transition", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "publish", publishTarget: "public_feed" }),
      }),
      params(),
    );

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "invalid_transition_from_status:draft",
    });
  });

  it("passes through gate response", async () => {
    mocks.requireGate.mockResolvedValue(
      new Response(JSON.stringify({ ok: false, error: "forbidden_governance_role" }), { status: 403 }),
    );
    const res = await outputsGET(
      req("http://localhost/api/admin/feeds/anlassraum/65a111111111111111111111/outputs"),
      { params: Promise.resolve({ id: "65a111111111111111111111" }) },
    );
    expect(res.status).toBe(403);
  });
});
