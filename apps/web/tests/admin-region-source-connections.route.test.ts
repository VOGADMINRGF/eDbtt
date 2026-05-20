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

function buildGovernanceRequestScope(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    organizationId: null,
    regionIds: [],
    isOperatorMode: true,
    operatorModeLabel: "Betreiber-Modus",
    regionAccess: {
      userId: "admin-1",
      actorRole: "admin",
      isAdmin: true,
      authoritySource: "admin_fallback",
      adminFallback: true,
      verificationStatus: "admin_fallback",
      roles: ["admin"],
      hintedRegionIds: [],
      verifiedRegionIds: [],
      scopedRegionIds: [],
      organization: {
        organizationIds: [],
        primaryOrganizationId: null,
        paidDashboardEntitlement: "admin_fallback",
        entitlementSource: "admin_fallback",
        entitlementStatus: "admin_fallback",
        entitlementReason: "admin_fallback",
        entitlementPlanId: null,
        entitlementPlanLabel: "Admin-Fallback",
        entitlementScope: null,
        entitlementLimits: null,
        entitlementUsage: null,
        requiresVerifiedMembership: true,
        dashboard: {
          allowed: true,
          reason: "admin_fallback",
          status: "admin_fallback",
          planId: null,
          planLabel: "Admin-Fallback",
          scope: null,
          source: "admin_fallback",
          limits: null,
          usage: null,
        },
        dossierDraft: {
          allowed: true,
          reason: "admin_fallback",
          status: "admin_fallback",
          planId: null,
          planLabel: "Admin-Fallback",
          scope: null,
          source: "admin_fallback",
          limits: null,
          usage: null,
        },
        anlassraumDraft: {
          allowed: true,
          reason: "admin_fallback",
          status: "admin_fallback",
          planId: null,
          planLabel: "Admin-Fallback",
          scope: null,
          source: "admin_fallback",
          limits: null,
          usage: null,
        },
      },
      allowedActions: [
        "read_region_dashboard",
        "review_region_signal",
        "create_region_draft",
        "attach_signal_to_dossier",
        "create_dossier_draft",
        "create_anlassraum_draft",
        "submit_for_review",
        "approve_publication",
        "manage_organization_members",
      ],
    },
    ...overrides,
  };
}

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
      requestScope: buildGovernanceRequestScope(),
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
        snapshotSeedKind: "example_seed",
        snapshotTemplateLabel: "Beispiel-Snapshot",
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
        sourceSnapshotTemplate: expect.objectContaining({
          label: "Beispiel-Snapshot",
          seedKind: "example_seed",
          isExampleSeed: true,
          mode: "template_plus_explicit_url",
        }),
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
        sourceSnapshotTemplate: expect.objectContaining({
          label: "Beispiel-Snapshot",
          seedKindLabel: "Beispiel-Seed",
          isExampleSeed: true,
          noLiveCrawlerClaim: true,
          noPublicOfficial: true,
          claimCandidates: expect.arrayContaining([
            expect.objectContaining({
              basisLabel: "Titel",
            }),
          ]),
          topicCandidates: expect.arrayContaining([
            expect.objectContaining({
              label: expect.any(String),
            }),
          ]),
          evidenceHints: expect.arrayContaining([
            expect.objectContaining({
              label: expect.any(String),
            }),
          ]),
          openQuestions: expect.arrayContaining([expect.any(String)]),
        }),
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

  it("builds deterministic snapshot templates for arbitrary regions without live crawling", async () => {
    const fetchMock = vi.mocked(global.fetch);
    fetchMock.mockClear();

    const magdeburgCreate = await POST_CONNECTION(
      buildRequest("http://localhost/api/admin/region/source-connections", {
        regionId: "magdeburg",
        sourceType: "curated_pilot_source",
        label: "Stadt Magdeburg Beispielquelle",
        url: "https://magdeburg.example/verkehr",
        notes: "Kuratierter regionaler Snapshot",
        snapshotSeedKind: "configured_region_source",
        snapshotTemplateLabel: "Regionales Snapshot-Template",
        sampleItems: [
          {
            title: "Verkehr in Magdeburg",
            summary: "Die Stadt Magdeburg beschreibt priorisierte Verkehrsmaßnahmen.",
            url: "https://magdeburg.example/verkehr",
            detectedTopics: ["Verkehr"],
          },
        ],
      }),
    );
    const magdeburgBody = await magdeburgCreate.json();
    const magdeburgDryRun = await POST_TEST(
      buildRequest(
        `http://localhost/api/admin/region/source-connections/${magdeburgBody.connection.id}/test`,
        {},
      ),
      { params: Promise.resolve({ id: magdeburgBody.connection.id }) },
    );
    expect(magdeburgDryRun.status).toBe(200);
    await expect(magdeburgDryRun.json()).resolves.toMatchObject({
      ok: true,
      result: expect.objectContaining({
        regionId: "kommune-magdeburg",
        configuredUrl: "https://magdeburg.example/verkehr",
        sourceSnapshotStatus: "manual_only",
        sourceSnapshotTemplate: expect.objectContaining({
          seedKind: "configured_region_source",
          seedKindLabel: "Regionales Snapshot-Template",
          isExampleSeed: false,
          mode: "template_only",
        }),
        summary: expect.stringContaining("kein Live-Crawler"),
        possibleClaims: expect.arrayContaining([
          expect.objectContaining({
            text: expect.stringContaining("Magdeburg"),
          }),
        ]),
      }),
    });
    expect(fetchMock).not.toHaveBeenCalled();

    const spandauCreate = await POST_CONNECTION(
      buildRequest("http://localhost/api/admin/region/source-connections", {
        regionId: "berlin-spandau",
        sourceType: "curated_pilot_source",
        label: "Bezirk Spandau Beispielquelle",
        url: "https://spandau.example/kultur",
        notes: "Kuratierter regionaler Snapshot",
        snapshotSeedKind: "configured_region_source",
        snapshotTemplateLabel: "Regionales Snapshot-Template",
        sampleItems: [
          {
            title: "Kultur in Spandau",
            summary: "Der Bezirk Spandau beschreibt neue Kultur- und Nachbarschaftsprojekte.",
            url: "https://spandau.example/kultur",
            detectedTopics: ["Kultur", "Nachbarschaft"],
          },
        ],
      }),
    );
    const spandauBody = await spandauCreate.json();
    const spandauDryRun = await POST_TEST(
      buildRequest(
        `http://localhost/api/admin/region/source-connections/${spandauBody.connection.id}/test`,
        {},
      ),
      { params: Promise.resolve({ id: spandauBody.connection.id }) },
    );
    expect(spandauDryRun.status).toBe(200);
    await expect(spandauDryRun.json()).resolves.toMatchObject({
      ok: true,
      result: expect.objectContaining({
        regionId: "bezirk-berlin-spandau",
        configuredUrl: "https://spandau.example/kultur",
        possibleClaims: expect.arrayContaining([
          expect.objectContaining({
            text: expect.stringContaining("Spandau"),
          }),
        ]),
        sourceSnapshotTemplate: expect.objectContaining({
          seedKindLabel: "Regionales Snapshot-Template",
        }),
        evidenceReferences: expect.arrayContaining([
          expect.objectContaining({
            url: "https://spandau.example/kultur",
          }),
        ]),
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

  it("filters global source listings to the caller's own organization scope", async () => {
    const repo = createInMemoryRegionSourceConnectionRuntimeRepo({
      connections: [
        {
          id: "source-reinickendorf-1",
          regionId: "bezirk-berlin-reinickendorf",
          organizationId: "org-reinickendorf-1",
          label: "Reinickendorf Quelle",
          sourceType: "municipal_news",
          adapterId: "productive_regional_source",
          url: "https://reinickendorf.example/aktuelles",
          notes: null,
          enabled: true,
          sampleItems: [],
          sourceSnapshotTemplate: null,
          createdAt: "2026-05-19T08:00:00.000Z",
          updatedAt: "2026-05-19T08:00:00.000Z",
          createdBy: "staff-1",
          updatedBy: "staff-1",
          reviewRequired: true,
          noLiveCrawlerClaim: true,
          noScraping: true,
          noDeepSearchAutoCosts: true,
        },
        {
          id: "source-spandau-1",
          regionId: "bezirk-berlin-spandau",
          organizationId: "org-spandau-1",
          label: "Spandau Quelle",
          sourceType: "municipal_news",
          adapterId: "productive_regional_source",
          url: "https://spandau.example/aktuelles",
          notes: null,
          enabled: true,
          sampleItems: [],
          sourceSnapshotTemplate: null,
          createdAt: "2026-05-19T08:00:00.000Z",
          updatedAt: "2026-05-19T08:00:00.000Z",
          createdBy: "staff-2",
          updatedBy: "staff-2",
          reviewRequired: true,
          noLiveCrawlerClaim: true,
          noScraping: true,
          noDeepSearchAutoCosts: true,
        },
      ],
      results: [
        {
          id: "result-reinickendorf-1",
          connectionId: "source-reinickendorf-1",
          regionId: "bezirk-berlin-reinickendorf",
          organizationId: "org-reinickendorf-1",
          connectionLabel: "Reinickendorf Quelle",
          sourceType: "municipal_news",
          adapterId: "productive_regional_source",
          resultMode: "dry_run",
          title: "Reinickendorf Dry Run",
          summary: "Reviewpflichtiger Dry Run Reinickendorf.",
          configuredUrl: "https://reinickendorf.example/aktuelles",
          detectedTopics: ["Schule"],
          visibilityState: "internal_review",
          visibilityLabel: "reviewpflichtig",
          reviewStatus: "needs_review",
          confidence: 0.7,
          sourceSnapshotStatus: "manual_only",
          sourceSnapshotTitle: "Reinickendorf",
          sourceSnapshotSummary: "Zusammenfassung Reinickendorf",
          sourceSnapshotExcerpt: "Auszug Reinickendorf",
          sourceSnapshotTemplate: null,
          possibleClaims: [],
          topicClusters: [],
          dossierSuggestions: [],
          anlassraumSuggestions: [],
          evidenceReferences: [],
          openQuestions: [],
          affectedScope: {
            regionName: "Berlin Reinickendorf",
            detectedPlaces: ["Berlin Reinickendorf"],
            ortsteilHints: [],
            fachbereichHints: [],
          },
          reviewSuggestions: [],
          reviewTaskSummary: {
            claimCount: 0,
            topicClusterCount: 0,
            dossierSuggestionCount: 0,
            anlassraumSuggestionCount: 0,
            openQuestionCount: 0,
            evidenceCount: 0,
            label: "0 mögliche Aussagen",
          },
          createdAt: "2026-05-19T08:30:00.000Z",
          updatedAt: "2026-05-19T08:30:00.000Z",
          testedBy: "staff-1",
          reviewRequired: true,
          noAutoPublish: true,
          noPublicOfficial: true,
        },
        {
          id: "result-spandau-1",
          connectionId: "source-spandau-1",
          regionId: "bezirk-berlin-spandau",
          organizationId: "org-spandau-1",
          connectionLabel: "Spandau Quelle",
          sourceType: "municipal_news",
          adapterId: "productive_regional_source",
          resultMode: "dry_run",
          title: "Spandau Dry Run",
          summary: "Reviewpflichtiger Dry Run Spandau.",
          configuredUrl: "https://spandau.example/aktuelles",
          detectedTopics: ["Verkehr"],
          visibilityState: "internal_review",
          visibilityLabel: "reviewpflichtig",
          reviewStatus: "needs_review",
          confidence: 0.7,
          sourceSnapshotStatus: "manual_only",
          sourceSnapshotTitle: "Spandau",
          sourceSnapshotSummary: "Zusammenfassung Spandau",
          sourceSnapshotExcerpt: "Auszug Spandau",
          sourceSnapshotTemplate: null,
          possibleClaims: [],
          topicClusters: [],
          dossierSuggestions: [],
          anlassraumSuggestions: [],
          evidenceReferences: [],
          openQuestions: [],
          affectedScope: {
            regionName: "Berlin Spandau",
            detectedPlaces: ["Berlin Spandau"],
            ortsteilHints: [],
            fachbereichHints: [],
          },
          reviewSuggestions: [],
          reviewTaskSummary: {
            claimCount: 0,
            topicClusterCount: 0,
            dossierSuggestionCount: 0,
            anlassraumSuggestionCount: 0,
            openQuestionCount: 0,
            evidenceCount: 0,
            label: "0 mögliche Aussagen",
          },
          createdAt: "2026-05-19T08:30:00.000Z",
          updatedAt: "2026-05-19T08:30:00.000Z",
          testedBy: "staff-2",
          reviewRequired: true,
          noAutoPublish: true,
          noPublicOfficial: true,
        },
      ],
    });
    setRegionSourceConnectionRuntimeRepoForTests(repo);
    setRegionOrganizationRuntimeRepoForTests(
      createInMemoryRegionOrganizationRuntimeRepo({
        organizations: [
          {
            id: "org-reinickendorf-1",
            name: "Bezirksamt Reinickendorf",
            type: "district_office",
            countryCode: "DE",
            primaryRegionId: "bezirk-berlin-reinickendorf",
            website: "https://reinickendorf.example",
            verificationStatus: "organization_verified",
            createdByUserId: "admin-1",
          },
        ],
        memberships: [
          {
            id: "membership-1",
            userId: "staff-1",
            organizationId: "org-reinickendorf-1",
            organizationName: "Bezirksamt Reinickendorf",
            organizationType: "district_office",
            regionId: "bezirk-berlin-reinickendorf",
            unitId: "unit-1",
            unitName: "Beteiligung",
            optionalLocation: null,
            roleLabel: "Beteiligung",
            roleType: "participation_officer",
            verificationStatus: "unit_verified",
            allowedActions: ["read_region_dashboard", "review_region_signal", "create_region_draft"],
            createdAt: "2026-05-19T08:00:00.000Z",
            updatedAt: "2026-05-19T08:00:00.000Z",
            verifiedBy: "admin-1",
            verifiedAt: "2026-05-19T08:00:00.000Z",
            expiresAt: null,
            revokedAt: null,
            noAutoAuthority: true,
          },
        ],
      }),
    );
    mocks.requireGovernanceActorOrResponse.mockResolvedValue({
      user: { _id: { toHexString: () => "staff-1" } },
      roles: ["organization_member"],
      actor: {
        userId: "staff-1",
        role: "organization_member",
        isAdmin: false,
        scopedOwnerIds: ["org-reinickendorf-1"],
        scopedEntityIds: ["org-reinickendorf-1"],
        personTrust: null,
      },
      requestScope: buildGovernanceRequestScope({
        organizationId: "org-reinickendorf-1",
        regionIds: ["bezirk-berlin-reinickendorf"],
        isOperatorMode: false,
        operatorModeLabel: null,
        regionAccess: {
          userId: "staff-1",
          actorRole: "organization_member",
          isAdmin: false,
          authoritySource: "verified_membership",
          adminFallback: false,
          verificationStatus: "unit_verified",
          roles: ["organization_member"],
          hintedRegionIds: [],
          verifiedRegionIds: ["bezirk-berlin-reinickendorf"],
          scopedRegionIds: ["bezirk-berlin-reinickendorf"],
          organization: {
            organizationIds: ["org-reinickendorf-1"],
            primaryOrganizationId: "org-reinickendorf-1",
            paidDashboardEntitlement: "granted",
            entitlementSource: "admin_grant",
            entitlementStatus: "active",
            entitlementReason: "matched_region",
            entitlementPlanId: "kommune-aktivierung",
            entitlementPlanLabel: "Kommune Aktivierung",
            entitlementScope: "organization_unit",
            entitlementLimits: null,
            entitlementUsage: null,
            requiresVerifiedMembership: true,
            dashboard: {
              allowed: true,
              reason: "matched_region",
              status: "active",
              planId: "kommune-aktivierung",
              planLabel: "Kommune Aktivierung",
              scope: "organization_unit",
              source: "admin_grant",
              limits: null,
              usage: null,
            },
            dossierDraft: {
              allowed: true,
              reason: "matched_region",
              status: "active",
              planId: "kommune-aktivierung",
              planLabel: "Kommune Aktivierung",
              scope: "organization_unit",
              source: "admin_grant",
              limits: null,
              usage: null,
            },
            anlassraumDraft: {
              allowed: true,
              reason: "matched_region",
              status: "active",
              planId: "kommune-aktivierung",
              planLabel: "Kommune Aktivierung",
              scope: "organization_unit",
              source: "admin_grant",
              limits: null,
              usage: null,
            },
          },
          allowedActions: [
            "read_region_dashboard",
            "review_region_signal",
            "create_region_draft",
          ],
        },
      }),
    });

    const response = await GET(
      new NextRequest("http://localhost/api/admin/region/source-connections"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.connections).toEqual([
      expect.objectContaining({ id: "source-reinickendorf-1" }),
    ]);
    expect(body.results).toEqual([
      expect.objectContaining({ id: "result-reinickendorf-1" }),
    ]);
  });
});
