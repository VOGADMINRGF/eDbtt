import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireGate: vi.fn(),
  applyDraft: vi.fn(),
}));

vi.mock("@/lib/server/auth/governance", () => ({
  requireGovernanceActorOrResponse: (...args: unknown[]) => mocks.requireGate(...args),
}));

vi.mock("@/features/create/attachDraftApply", () => ({
  applyCreatePrepareAttachDraft: (...args: unknown[]) => mocks.applyDraft(...args),
}));

import { POST as applyPOST } from "@/app/api/admin/create/attach-drafts/[draftId]/apply/route";

const gateAccess = {
  user: { _id: { toHexString: () => "u-review" } },
  roles: ["reviewer"],
  actor: {
    userId: "u-review",
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

describe("create prepare-attach apply route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireGate.mockResolvedValue(gateAccess);
  });

  it("applies accepted drafts and returns updated apply state", async () => {
    mocks.applyDraft.mockResolvedValue({
      draftId: "65f000000000000000000011",
      reviewState: "accepted_for_apply",
      applyState: "applied",
      appliedBy: "u-review",
      applyNote: "manual apply",
    });

    const res = await applyPOST(
      req("http://localhost/api/admin/create/attach-drafts/65f000000000000000000011/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ applyNote: "manual apply" }),
      }),
      { params: Promise.resolve({ draftId: "65f000000000000000000011" }) },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      item: {
        draftId: "65f000000000000000000011",
        applyState: "applied",
      },
    });
  });

  it("maps invalid ids and missing drafts", async () => {
    mocks.applyDraft.mockRejectedValueOnce(new Error("invalid_attach_draft_id"));
    let res = await applyPOST(
      req("http://localhost/api/admin/create/attach-drafts/bad/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ draftId: "bad" }) },
    );
    expect(res.status).toBe(400);

    mocks.applyDraft.mockRejectedValueOnce(new Error("attach_draft_not_found"));
    res = await applyPOST(
      req("http://localhost/api/admin/create/attach-drafts/65f000000000000000000099/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ draftId: "65f000000000000000000099" }) },
    );
    expect(res.status).toBe(404);
  });

  it("maps wrong review state, already applied and unsupported target to conflict", async () => {
    mocks.applyDraft.mockRejectedValueOnce(new Error("attach_draft_review_state_not_accepted"));
    let res = await applyPOST(
      req("http://localhost/api/admin/create/attach-drafts/65f000000000000000000011/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ draftId: "65f000000000000000000011" }) },
    );
    expect(res.status).toBe(409);

    mocks.applyDraft.mockRejectedValueOnce(new Error("attach_draft_already_applied"));
    res = await applyPOST(
      req("http://localhost/api/admin/create/attach-drafts/65f000000000000000000011/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ draftId: "65f000000000000000000011" }) },
    );
    expect(res.status).toBe(409);

    mocks.applyDraft.mockRejectedValueOnce(new Error("unsupported_attach_target_type"));
    res = await applyPOST(
      req("http://localhost/api/admin/create/attach-drafts/65f000000000000000000011/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ draftId: "65f000000000000000000011" }) },
    );
    expect(res.status).toBe(409);
  });

  it("passes through governance gate response", async () => {
    mocks.requireGate.mockResolvedValue(
      new Response(JSON.stringify({ ok: false, error: "forbidden_governance_role" }), { status: 403 }),
    );
    const res = await applyPOST(
      req("http://localhost/api/admin/create/attach-drafts/65f000000000000000000011/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ draftId: "65f000000000000000000011" }) },
    );
    expect(res.status).toBe(403);
  });
});
