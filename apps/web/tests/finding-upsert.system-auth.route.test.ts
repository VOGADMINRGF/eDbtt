import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  loggerWarn: vi.fn(),
}));

vi.mock("@core/observability/logger", () => ({
  logger: {
    warn: (...args: unknown[]) => mocks.loggerWarn(...args),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/server/auth/dossier", () => ({
  requireDossierEditor: vi.fn(async () => new Response(JSON.stringify({ ok: false }), { status: 401 })),
}));

import { POST as findingUpsertPOST } from "@/app/api/finding/upsert/route";

describe("finding upsert machine-auth contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.INTERNAL_WORKER_TOKEN;
  });

  it("rejects untrusted internal system identity", async () => {
    process.env.INTERNAL_WORKER_TOKEN = "system_secret";
    const req = new NextRequest("http://localhost/api/finding/upsert", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer wrong_secret",
        "x-internal-source": "finding_worker",
        "x-internal-actor-kind": "queue_worker",
      },
      body: JSON.stringify({}),
    });
    const res = await findingUpsertPOST(req);
    expect(res.status).toBe(403);
    const denyPayload = mocks.loggerWarn.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(denyPayload?.scope).toBe("finding.upsert");
    expect(denyPayload?.systemIdentitySource).toBe("finding_worker");
  });

  it("allows trusted internal identity and reaches request validation", async () => {
    process.env.INTERNAL_WORKER_TOKEN = "system_secret";
    const req = new NextRequest("http://localhost/api/finding/upsert", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer system_secret",
        "x-internal-source": "finding_worker",
        "x-internal-actor-kind": "queue_worker",
      },
      body: JSON.stringify({}),
    });
    const res = await findingUpsertPOST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body?.code).toBe("bad_request");
  });
});
