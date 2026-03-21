import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireGate: vi.fn(),
  runBackfill: vi.fn(),
}));

vi.mock("@/lib/server/auth/governance", () => ({
  requireGovernanceActorOrResponse: (...args: unknown[]) => mocks.requireGate(...args),
}));

vi.mock("@/features/create/attachDraftHistoryBackfill", () => ({
  runCreatePrepareAttachHistoryBackfill: (...args: unknown[]) => mocks.runBackfill(...args),
}));

import { GET as historyMaintenanceGET } from "@/app/api/admin/create/attach-drafts/history-maintenance/route";

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

function req(url: string) {
  return new NextRequest(url);
}

describe("create prepare-attach history maintenance route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireGate.mockResolvedValue(gateAccess);
  });

  it("returns read-only dry-run diagnostics payload", async () => {
    mocks.runBackfill.mockResolvedValue({
      mode: "dry_run",
      totalScanned: 9,
      canonical: 5,
      normalizable: 3,
      unsafe: 1,
      applied: 0,
      applySkipped: 0,
      samples: [
        {
          rowId: "65f000000000000000000111",
          draftId: "65f000000000000000000211",
          status: "normalizable",
          inferredEventType: "review",
          reasons: ["event_type_inferred"],
        },
      ],
      reasonBuckets: {
        event_type_inferred: 3,
      },
    });

    const res = await historyMaintenanceGET(
      req("http://localhost/api/admin/create/attach-drafts/history-maintenance?previewLimit=5&scanLimit=20"),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      ok: true,
      mode: "dry_run",
      totalScanned: 9,
      canonical: 5,
      normalizable: 3,
      unsafe: 1,
      applied: 0,
      applySkipped: 0,
      samples: [
        {
          rowId: "65f000000000000000000111",
          status: "normalizable",
        },
      ],
      reasonBuckets: {
        event_type_inferred: 3,
      },
    });
    expect(mocks.runBackfill).toHaveBeenCalledTimes(1);
    expect(mocks.runBackfill).toHaveBeenCalledWith({
      mode: "dry_run",
      previewLimit: "5",
      scanLimit: "20",
    });
  });

  it("rejects apply mode and never forwards an apply mutation", async () => {
    const res = await historyMaintenanceGET(
      req("http://localhost/api/admin/create/attach-drafts/history-maintenance?mode=apply"),
    );

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toMatchObject({
      ok: false,
      error: "invalid_history_maintenance_mode",
    });
    expect(mocks.runBackfill).not.toHaveBeenCalled();
  });

  it("maps forbidden gate and validation failures", async () => {
    mocks.requireGate.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: false, error: "forbidden_governance_role" }), { status: 403 }),
    );

    let res = await historyMaintenanceGET(
      req("http://localhost/api/admin/create/attach-drafts/history-maintenance"),
    );
    expect(res.status).toBe(403);

    mocks.runBackfill.mockRejectedValueOnce(new Error("invalid_history_backfill_scan_limit"));
    res = await historyMaintenanceGET(
      req("http://localhost/api/admin/create/attach-drafts/history-maintenance?scanLimit=bad"),
    );
    expect(res.status).toBe(400);

    mocks.runBackfill.mockRejectedValueOnce(new Error("actor_scope_forbidden"));
    res = await historyMaintenanceGET(
      req("http://localhost/api/admin/create/attach-drafts/history-maintenance"),
    );
    expect(res.status).toBe(403);
  });
});
