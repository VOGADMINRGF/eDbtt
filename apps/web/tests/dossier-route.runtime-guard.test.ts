import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  coreCol: vi.fn(),
  findDossierByAnyId: vi.fn(),
}));

vi.mock("@core/db/triMongo", () => ({
  coreCol: (...args: unknown[]) => mocks.coreCol(...args),
}));

vi.mock("@features/dossier/lookup", () => ({
  findDossierByAnyId: (...args: unknown[]) => mocks.findDossierByAnyId(...args),
}));

import { GET } from "@/app/api/dossier/[id]/route";

describe("/api/dossier/[id] runtime guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns review-only instead of demo fallback when only a region draft exists", async () => {
    mocks.coreCol.mockResolvedValue({
      findOne: vi.fn(async () => null),
    });
    mocks.findDossierByAnyId.mockResolvedValue({
      dossierId: "dossier-draft-001",
      status: "draft",
    });

    const res = await GET(
      new NextRequest("http://localhost/api/dossier/dossier-draft-001"),
      { params: Promise.resolve({ id: "dossier-draft-001" }) },
    );

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "dossier_review_only",
      dossierId: "dossier-draft-001",
      status: "draft",
    });
  });

  it("keeps explicit demo ids available as demo route exceptions", async () => {
    const res = await GET(
      new NextRequest("http://localhost/api/dossier/demo"),
      { params: Promise.resolve({ id: "demo" }) },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
    });
  });
});
