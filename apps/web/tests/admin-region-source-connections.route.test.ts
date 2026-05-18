import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  createInMemoryRegionEntitlementRuntimeRepo,
  createInMemoryRegionOrganizationRuntimeRepo,
  createInMemoryRegionSourceConnectionRuntimeRepo,
  setRegionEntitlementRuntimeRepoForTests,
  setRegionOrganizationRuntimeRepoForTests,
  setRegionSourceConnectionRuntimeRepoForTests,
} from "@features/region";

const mocks = vi.hoisted(() => ({
  requireGovernanceActorOrResponse: vi.fn(),
}));

vi.mock("@/lib/server/auth/governance", () => ({
  requireGovernanceActorOrResponse: (...args: unknown[]) => mocks.requireGovernanceActorOrResponse(...args),
}));

import { GET, POST as POST_CONNECTION } from "@/app/api/admin/region/source-connections/route";
import { POST as POST_TEST } from "@/app/api/admin/region/source-connections/[id]/test/route";

function buildRequest(url: string, body?: Record<string, unknown>) {
  return new NextRequest(url, {
    method: body ? "POST" : "GET",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe("admin region source connection routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(
          `<!doctype html><html><head><title>Schulsanierung in Reinickendorf</title><meta name="description" content="Das Bezirksamt Reinickendorf informiert über Schulwegsicherheit und Sanierungsbedarf."></head><body><p>Das Bezirksamt Reinickendorf informiert über Schulwegsicherheit an mehreren Standorten.</p><p>Für die Region wird zusätzlicher Sanierungsbedarf an Schulen beschrieben.</p></body></html>`,
          {
            status: 200,
            headers: { "content-type": "text/html; charset=utf-8" },
          },
        ),
      ),
    );
    setRegionSourceConnectionRuntimeRepoForTests(
      createInMemoryRegionSourceConnectionRuntimeRepo(),
    );
    setRegionOrganizationRuntimeRepoForTests(createInMemoryRegionOrganizationRuntimeRepo());
    setRegionEntitlementRuntimeRepoForTests(createInMemoryRegionEntitlementRuntimeRepo());
    mocks.requireGovernanceActorOrResponse.mockResolvedValue({
      user: { _id: { toHexString: () => "admin-1" } },
      roles: ["admin"],
      actor: {
        userId: "admin-1",
        role: "admin",
        isAdmin: true,
        scopedOwnerIds: ["org-1"],
        scopedEntityIds: ["org-1"],
        personTrust: null,
      },
    });
  });

  it("creates a source connection, lists it and runs a dry run result", async () => {
    const createRes = await POST_CONNECTION(
      buildRequest("http://localhost/api/admin/region/source-connections", {
        regionId: "berlin-reinickendorf",
        sourceType: "municipal_news",
        label: "Bezirksamt Reinickendorf News",
        url: "https://reinickendorf.example/aktuelles",
        notes: "Explizite Verwaltungsquelle",
        sampleItems: [
          {
            title: "Schulwege im Bezirk",
            summary: "Verwaltung informiert über Schulwegsicherheit.",
            url: "https://reinickendorf.example/aktuelles/schulwege",
            detectedTopics: ["Schule", "Verkehr"],
          },
        ],
      }),
    );
    expect(createRes.status).toBe(200);
    const createBody = await createRes.json();
    expect(createBody).toMatchObject({
      ok: true,
      connection: expect.objectContaining({
        regionId: "bezirk-berlin-reinickendorf",
        sourceType: "municipal_news",
        adapterId: "productive_regional_source",
        noLiveCrawlerClaim: true,
      }),
    });

    const listRes = await GET(
      new NextRequest(
        "http://localhost/api/admin/region/source-connections?regionId=berlin-reinickendorf",
      ),
    );
    expect(listRes.status).toBe(200);
    const listBody = await listRes.json();
    expect(listBody).toMatchObject({
      ok: true,
      connections: [
        expect.objectContaining({
          label: "Bezirksamt Reinickendorf News",
        }),
      ],
    });

    const dryRunRes = await POST_TEST(
      buildRequest(
        `http://localhost/api/admin/region/source-connections/${createBody.connection.id}/test`,
        {},
      ),
      { params: Promise.resolve({ id: createBody.connection.id }) },
    );
    expect(dryRunRes.status).toBe(200);
    await expect(dryRunRes.json()).resolves.toMatchObject({
      ok: true,
      result: expect.objectContaining({
        connectionId: createBody.connection.id,
        visibilityState: "internal_review",
        reviewStatus: "needs_review",
        noAutoPublish: true,
        noPublicOfficial: true,
        sourceSnapshotStatus: "fetched",
        sourceSnapshotTitle: "Schulsanierung in Reinickendorf",
        possibleClaims: expect.arrayContaining([
          expect.objectContaining({
            basisLabel: "Titel",
          }),
        ]),
        topicClusters: expect.arrayContaining([
          expect.objectContaining({
            label: expect.any(String),
          }),
        ]),
        dossierSuggestions: expect.arrayContaining([
          expect.objectContaining({
            title: expect.stringContaining("Berlin Reinickendorf"),
          }),
        ]),
        evidenceReferences: expect.arrayContaining([
          expect.objectContaining({
            label: expect.stringContaining("Seitenauszug"),
          }),
        ]),
        reviewTaskSummary: expect.objectContaining({
          claimCount: expect.any(Number),
        }),
      }),
    });
  });

  it("rejects explicit-url source types without a URL", async () => {
    const res = await POST_CONNECTION(
      buildRequest("http://localhost/api/admin/region/source-connections", {
        regionId: "berlin-reinickendorf",
        sourceType: "official_feed",
        label: "Ohne URL",
      }),
    );
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: expect.any(String),
    });
  });
});
