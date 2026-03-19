import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  requireGate: vi.fn(),
  dossierList: vi.fn(),
  dossierGet: vi.fn(),
  dossierApply: vi.fn(),
  dossierReject: vi.fn(),
  dossierLegacyList: vi.fn(),
  dossierBackfill: vi.fn(),
  roundList: vi.fn(),
  roundGet: vi.fn(),
  roundHandoff: vi.fn(),
  roundReject: vi.fn(),
  roundLegacyList: vi.fn(),
  roundBackfill: vi.fn(),
}));

vi.mock("@/lib/server/auth/governance", () => ({
  requireGovernanceActorOrResponse: (...args: unknown[]) => mocks.requireGate(...args),
}));

vi.mock("@features/dossier/protocolUpsert", () => ({
  listDossierUpsertContractsAuthorized: (...args: unknown[]) => mocks.dossierList(...args),
  getDossierUpsertContractAuthorized: (...args: unknown[]) => mocks.dossierGet(...args),
  applyDossierUpsertContractAuthorized: (...args: unknown[]) => mocks.dossierApply(...args),
  rejectDossierUpsertContractAuthorized: (...args: unknown[]) => mocks.dossierReject(...args),
  listLegacyDossierUpsertContractsAuthorized: (...args: unknown[]) => mocks.dossierLegacyList(...args),
  backfillDossierUpsertContractAuthorized: (...args: unknown[]) => mocks.dossierBackfill(...args),
}));

vi.mock("@features/topicRound/seedContract", () => ({
  listRoundSeedContractsAuthorized: (...args: unknown[]) => mocks.roundList(...args),
  getRoundSeedContractAuthorized: (...args: unknown[]) => mocks.roundGet(...args),
  handoffRoundSeedContractAuthorized: (...args: unknown[]) => mocks.roundHandoff(...args),
  rejectRoundSeedContractAuthorized: (...args: unknown[]) => mocks.roundReject(...args),
  listLegacyRoundSeedContractsAuthorized: (...args: unknown[]) => mocks.roundLegacyList(...args),
  backfillRoundSeedContractAuthorized: (...args: unknown[]) => mocks.roundBackfill(...args),
}));

import { GET as dossierListGET } from "@/app/api/admin/governance/dossier-upsert-contracts/route";
import { GET as dossierGetGET } from "@/app/api/admin/governance/dossier-upsert-contracts/[contractId]/route";
import { POST as dossierApplyPOST } from "@/app/api/admin/governance/dossier-upsert-contracts/[contractId]/apply/route";
import { POST as dossierRejectPOST } from "@/app/api/admin/governance/dossier-upsert-contracts/[contractId]/reject/route";
import { GET as dossierLegacyGET } from "@/app/api/admin/governance/dossier-upsert-contracts/legacy/route";
import { POST as dossierBackfillPOST } from "@/app/api/admin/governance/dossier-upsert-contracts/[contractId]/backfill/route";
import { GET as roundListGET } from "@/app/api/admin/governance/round-seed-contracts/route";
import { GET as roundGetGET } from "@/app/api/admin/governance/round-seed-contracts/[contractId]/route";
import { POST as roundHandoffPOST } from "@/app/api/admin/governance/round-seed-contracts/[contractId]/handoff/route";
import { POST as roundRejectPOST } from "@/app/api/admin/governance/round-seed-contracts/[contractId]/reject/route";
import { GET as roundLegacyGET } from "@/app/api/admin/governance/round-seed-contracts/legacy/route";
import { POST as roundBackfillPOST } from "@/app/api/admin/governance/round-seed-contracts/[contractId]/backfill/route";

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

function makeReq(url: string, init?: RequestInit) {
  return new NextRequest(url, init);
}

function params(contractId = "c-1") {
  return { params: Promise.resolve({ contractId }) };
}

describe("GOV-EVENT-02 route acceptance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireGate.mockResolvedValue(gateAccess);
  });

  it("dossier list route returns success payload", async () => {
    mocks.dossierList.mockResolvedValue([{ contractId: "dupc_1" }]);
    const res = await dossierListGET(makeReq("http://localhost/api/admin/governance/dossier-upsert-contracts?status=applied"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, items: [{ contractId: "dupc_1" }] });
  });

  it("dossier list route rejects invalid status", async () => {
    const res = await dossierListGET(makeReq("http://localhost/api/admin/governance/dossier-upsert-contracts?status=nope"));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "invalid_status" });
  });

  it("gate response is passed through", async () => {
    mocks.requireGate.mockResolvedValue(new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401 }));
    const res = await dossierListGET(makeReq("http://localhost/api/admin/governance/dossier-upsert-contracts"));
    expect(res.status).toBe(401);
  });

  it("dossier apply maps missing dossier target to 409", async () => {
    mocks.dossierApply.mockRejectedValue(new Error("contract_missing_target_dossier"));
    const res = await dossierApplyPOST(
      makeReq("http://localhost/api/admin/governance/dossier-upsert-contracts/c-1/apply", {
        method: "POST",
        body: JSON.stringify({ targetDossierId: "missing" }),
        headers: { "content-type": "application/json" },
      }),
      params("c-1"),
    );
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "contract_missing_target_dossier" });
  });

  it("dossier apply maps invalid contract id to 400", async () => {
    mocks.dossierApply.mockRejectedValue(new Error("invalid_contract_id"));
    const res = await dossierApplyPOST(
      makeReq("http://localhost/api/admin/governance/dossier-upsert-contracts/xx/apply", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
      }),
      params("xx"),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "invalid_contract_id" });
  });

  it("dossier reject maps already rejected to 409", async () => {
    mocks.dossierReject.mockRejectedValue(new Error("contract_already_rejected"));
    const res = await dossierRejectPOST(
      makeReq("http://localhost/api/admin/governance/dossier-upsert-contracts/c-1/reject", {
        method: "POST",
        body: JSON.stringify({ reason: "dup" }),
        headers: { "content-type": "application/json" },
      }),
      params("c-1"),
    );
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "contract_already_rejected" });
  });

  it("dossier legacy list route works and maps forbidden scope", async () => {
    mocks.dossierLegacyList.mockRejectedValue(new Error("forbidden_scope"));
    const res = await dossierLegacyGET(makeReq("http://localhost/api/admin/governance/dossier-upsert-contracts/legacy"));
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "forbidden_scope" });
  });

  it("dossier backfill route returns success payload", async () => {
    mocks.dossierBackfill.mockResolvedValue({ contract: { contractId: "dupc_1" }, backfillResult: { anlassraumId: "a1" } });
    const res = await dossierBackfillPOST(
      makeReq("http://localhost/api/admin/governance/dossier-upsert-contracts/c-1/backfill", {
        method: "POST",
        body: JSON.stringify({ anlassraumId: "65a111111111111111111111" }),
        headers: { "content-type": "application/json" },
      }),
      params("c-1"),
    );
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, contract: { contractId: "dupc_1" } });
  });

  it("round list route returns success payload", async () => {
    mocks.roundList.mockResolvedValue([{ contractId: "rsc_1" }]);
    const res = await roundListGET(makeReq("http://localhost/api/admin/governance/round-seed-contracts?status=review_required"));
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({ ok: true, items: [{ contractId: "rsc_1" }] });
  });

  it("round get route maps not found to 404", async () => {
    mocks.roundGet.mockRejectedValue(new Error("contract_not_found"));
    const res = await roundGetGET(makeReq("http://localhost/api/admin/governance/round-seed-contracts/c-1"), params("c-1"));
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "contract_not_found" });
  });

  it("round handoff route maps already handed off to 409", async () => {
    mocks.roundHandoff.mockRejectedValue(new Error("contract_already_handed_off"));
    const res = await roundHandoffPOST(
      makeReq("http://localhost/api/admin/governance/round-seed-contracts/c-1/handoff", {
        method: "POST",
        body: JSON.stringify({ actionNote: "retry" }),
        headers: { "content-type": "application/json" },
      }),
      params("c-1"),
    );
    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "contract_already_handed_off" });
  });

  it("round reject route maps scope requirement to 403", async () => {
    mocks.roundReject.mockRejectedValue(new Error("actor_scope_requires_anlassraum"));
    const res = await roundRejectPOST(
      makeReq("http://localhost/api/admin/governance/round-seed-contracts/c-1/reject", {
        method: "POST",
        body: JSON.stringify({ reason: "scope" }),
        headers: { "content-type": "application/json" },
      }),
      params("c-1"),
    );
    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "actor_scope_requires_anlassraum" });
  });

  it("round legacy list validates limit", async () => {
    const res = await roundLegacyGET(makeReq("http://localhost/api/admin/governance/round-seed-contracts/legacy?limit=nope"));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "invalid_limit" });
  });

  it("round backfill route passes gate response", async () => {
    mocks.requireGate.mockResolvedValue(new Response(JSON.stringify({ ok: false, error: "forbidden_governance_role" }), { status: 403 }));
    const res = await roundBackfillPOST(
      makeReq("http://localhost/api/admin/governance/round-seed-contracts/c-1/backfill", {
        method: "POST",
        body: JSON.stringify({}),
        headers: { "content-type": "application/json" },
      }),
      params("c-1"),
    );
    expect(res.status).toBe(403);
  });

  it("dossier get maps invalid contract id to 400", async () => {
    mocks.dossierGet.mockRejectedValue(new Error("invalid_contract_id"));
    const res = await dossierGetGET(makeReq("http://localhost/api/admin/governance/dossier-upsert-contracts/bad"), params("bad"));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({ ok: false, error: "invalid_contract_id" });
  });
});
