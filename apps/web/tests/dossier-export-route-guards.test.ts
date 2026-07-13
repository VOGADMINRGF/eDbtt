import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  coreCol: vi.fn(),
  findDossierByAnyId: vi.fn(),
  getAnyDossierPublicationRecordByDossierId: vi.fn(),
  requireAdminOrResponse: vi.fn(),
  rateLimitPublic: vi.fn(),
  rateLimitHeaders: vi.fn(),
  dossierClaimsCol: vi.fn(),
  dossierSourcesCol: vi.fn(),
  dossierFindingsCol: vi.fn(),
  dossierEdgesCol: vi.fn(),
  openQuestionsCol: vi.fn(),
}));

vi.mock("@core/db/triMongo", () => ({
  coreCol: (...args: unknown[]) => mocks.coreCol(...args),
  ObjectId: {
    isValid: () => false,
  },
}));

vi.mock("@features/dossier/lookup", () => ({
  findDossierByAnyId: (...args: unknown[]) => mocks.findDossierByAnyId(...args),
}));

vi.mock("@/features/create/dossierPublishWorkflowServer", () => ({
  getAnyDossierPublicationRecordByDossierId: (...args: unknown[]) =>
    mocks.getAnyDossierPublicationRecordByDossierId(...args),
}));

vi.mock("@/lib/server/auth/admin", () => ({
  requireAdminOrResponse: (...args: unknown[]) => mocks.requireAdminOrResponse(...args),
}));

vi.mock("@/utils/publicRateLimit", () => ({
  rateLimitPublic: (...args: unknown[]) => mocks.rateLimitPublic(...args),
}));

vi.mock("@/utils/rateLimitHelpers", () => ({
  rateLimitHeaders: (...args: unknown[]) => mocks.rateLimitHeaders(...args),
}));

vi.mock("@features/dossier/db", () => ({
  dossierClaimsCol: (...args: unknown[]) => mocks.dossierClaimsCol(...args),
  dossierSourcesCol: (...args: unknown[]) => mocks.dossierSourcesCol(...args),
  dossierFindingsCol: (...args: unknown[]) => mocks.dossierFindingsCol(...args),
  dossierEdgesCol: (...args: unknown[]) => mocks.dossierEdgesCol(...args),
  openQuestionsCol: (...args: unknown[]) => mocks.openQuestionsCol(...args),
}));

import { GET as legacyExportGet } from "@/app/api/dossier/[id]/export/route";
import { GET as exportJsonGet } from "@/app/api/dossiers/[dossierId]/export.json/route";
import { GET as exportCsvGet } from "@/app/api/dossiers/[dossierId]/export.csv/route";

function collection(items: unknown[]) {
  return {
    find: vi.fn(() => ({
      sort: vi.fn(() => ({
        toArray: vi.fn(async () => items),
      })),
    })),
  };
}

describe("dossier export route guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.rateLimitPublic.mockResolvedValue({ ok: true, retryIn: 0 });
    mocks.rateLimitHeaders.mockReturnValue({ "x-test-rate-limit": "ok" });
    mocks.requireAdminOrResponse.mockResolvedValue(
      new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401 }),
    );
    mocks.findDossierByAnyId.mockResolvedValue({
      dossierId: "dossier-1",
      statementId: "statement-1",
      title: "Dossier 1",
      status: "draft",
      createdAt: "2026-07-13T10:00:00.000Z",
      updatedAt: "2026-07-13T10:00:00.000Z",
    });
    mocks.getAnyDossierPublicationRecordByDossierId.mockResolvedValue({
      dossierId: "dossier-1",
      status: "review_only",
      visibility: "internal",
      publicAccessMode: "none",
    });
    mocks.coreCol.mockResolvedValue({
      findOne: vi.fn(async () => ({
        dossier: {
          meta: { id: "dossier-1", title: "Dossier 1" },
          analyze: { claims: [], findings: [], questions: [] },
          sourceSet: [],
        },
      })),
    });
    mocks.dossierClaimsCol.mockResolvedValue(collection([]));
    mocks.dossierSourcesCol.mockResolvedValue(collection([]));
    mocks.dossierFindingsCol.mockResolvedValue(collection([]));
    mocks.dossierEdgesCol.mockResolvedValue(collection([]));
    mocks.openQuestionsCol.mockResolvedValue(collection([]));
  });

  it("blocks legacy public export for review-only dossiers", async () => {
    const res = await legacyExportGet(
      new NextRequest("http://localhost/api/dossier/dossier-1/export?format=json"),
      { params: Promise.resolve({ id: "dossier-1" }) },
    );

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "dossier_review_only",
      truthStage: "review_ready",
      truthStageLabel: "Review-ready",
    });
  });

  it("blocks public json export for review-only dossiers", async () => {
    const res = await exportJsonGet(
      new NextRequest("http://localhost/api/dossiers/dossier-1/export.json"),
      { params: Promise.resolve({ dossierId: "dossier-1" }) },
    );

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "dossier_review_only",
      truthStage: "review_ready",
      truthStageLabel: "Review-ready",
    });
  });

  it("allows admin json export override for review-only dossiers", async () => {
    mocks.requireAdminOrResponse.mockResolvedValue({ _id: "admin-1" });

    const res = await exportJsonGet(
      new NextRequest("http://localhost/api/dossiers/dossier-1/export.json"),
      { params: Promise.resolve({ dossierId: "dossier-1" }) },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      dossier: { dossierId: "dossier-1" },
    });
  });

  it("blocks public csv export for review-only dossiers", async () => {
    const res = await exportCsvGet(
      new NextRequest("http://localhost/api/dossiers/dossier-1/export.csv"),
      { params: Promise.resolve({ dossierId: "dossier-1" }) },
    );

    expect(res.status).toBe(409);
    await expect(res.text()).resolves.toBe("dossier_review_only");
  });
});
