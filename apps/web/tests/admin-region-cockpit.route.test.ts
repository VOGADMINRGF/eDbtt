import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  createInMemoryParticipationSignalReviewRuntimeRepo,
  createInMemoryRegionDataRepo,
  createInMemoryRegionEntitlementRuntimeRepo,
  createInMemoryRegionOrganizationRuntimeRepo,
  createInMemoryRegionSourceConnectionRuntimeRepo,
  setParticipationSignalReviewRuntimeRepoForTests,
  setRegionDataRepoForTests,
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

import { GET } from "@/app/api/admin/region/cockpit/[regionId]/route";

describe("/api/admin/region/cockpit/[regionId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    setRegionDataRepoForTests(
      createInMemoryRegionDataRepo({
        signals: [
          {
            id: "signal-cockpit-1",
            regionId: "bezirk-berlin-reinickendorf",
            title: "Hinweis",
            summary: "Reviewbarer Hinweis",
            signalType: "hint",
            reviewStatus: "submitted",
            sourceActorId: null,
            sourceUrls: [],
            submitter: { mode: "anonymous", displayName: null, contactChannel: null },
            guardrails: {
              moderationRequired: true,
              noAutoPublish: true,
              noAutoMandate: true,
              noAutomaticDossierCreation: true,
            },
            createdAt: "2026-05-11T00:00:00.000Z",
            updatedAt: "2026-05-11T00:00:00.000Z",
          },
        ],
      }),
    );
    setRegionOrganizationRuntimeRepoForTests(createInMemoryRegionOrganizationRuntimeRepo());
    setRegionEntitlementRuntimeRepoForTests(createInMemoryRegionEntitlementRuntimeRepo());
    setParticipationSignalReviewRuntimeRepoForTests(
      createInMemoryParticipationSignalReviewRuntimeRepo(),
    );
    setRegionSourceConnectionRuntimeRepoForTests(
      createInMemoryRegionSourceConnectionRuntimeRepo({
        connections: [
          {
            id: "source-1",
            regionId: "bezirk-berlin-reinickendorf",
            label: "Bezirksamt Reinickendorf News",
            sourceType: "municipal_news",
            adapterId: "productive_regional_source",
            url: "https://reinickendorf.example/aktuelles",
            notes: null,
            enabled: true,
            sampleItems: [
              {
                title: "Schulwegsicherheit im Bezirk",
                summary: "Explizit verbundene kommunale Quelle für die regionale Startlage.",
                url: "https://reinickendorf.example/aktuelles/schulwege",
                detectedTopics: ["Schule", "Verkehr"],
              },
            ],
            sourceSnapshotTemplate: {
              id: "region-source-snapshot-template-source-1",
              label: "Beispiel-Snapshot",
              mode: "template_plus_explicit_url",
              seedKind: "example_seed",
              seedKindLabel: "Beispiel-Seed",
              configuredUrl: "https://reinickendorf.example/aktuelles",
              isExampleSeed: true,
              reviewHint:
                "Explizite URL bleibt kontrolliert reviewpflichtig; hinterlegte Snapshot-Hinweise halten den Demo-/Pilotstand reproduzierbar, ohne Live-Crawler oder automatische Veröffentlichung.",
              noLiveCrawlerClaim: true,
              noScraping: true,
              noDeepSearchAutoCosts: true,
              noAutoPublish: true,
              noPublicOfficial: true,
            },
            createdAt: "2026-05-17T00:00:00.000Z",
            updatedAt: "2026-05-17T00:00:00.000Z",
            createdBy: "admin-1",
            updatedBy: "admin-1",
            reviewRequired: true,
            noLiveCrawlerClaim: true,
            noScraping: true,
            noDeepSearchAutoCosts: true,
          },
        ],
        results: [
          {
            id: "source-result-1",
            connectionId: "source-1",
            regionId: "bezirk-berlin-reinickendorf",
            connectionLabel: "Bezirksamt Reinickendorf News",
            sourceType: "municipal_news",
            adapterId: "productive_regional_source",
            resultMode: "dry_run",
            title: "Bezirksamt Reinickendorf News · Dry Run",
            summary: "Explizite URL vorbereitet und reviewpflichtig ausgewertet.",
            configuredUrl: "https://reinickendorf.example/aktuelles",
            detectedTopics: ["Schule", "Verkehr"],
            visibilityState: "internal_review",
            visibilityLabel: "reviewpflichtig",
            reviewStatus: "needs_review",
            confidence: 0.68,
            sourceSnapshotStatus: "fetched",
            sourceSnapshotTitle: "Schulsanierung in Reinickendorf",
            sourceSnapshotSummary: "Das Bezirksamt Reinickendorf informiert über Schulwegsicherheit und Sanierungsbedarf.",
            sourceSnapshotExcerpt: "Das Bezirksamt Reinickendorf informiert über Schulwegsicherheit an mehreren Standorten.",
            sourceSnapshotTemplate: {
              id: "region-source-snapshot-template-source-1",
              label: "Beispiel-Snapshot",
              mode: "template_plus_explicit_url",
              seedKind: "example_seed",
              seedKindLabel: "Beispiel-Seed",
              configuredUrl: "https://reinickendorf.example/aktuelles",
              isExampleSeed: true,
              reviewHint:
                "Explizite URL bleibt kontrolliert reviewpflichtig; hinterlegte Snapshot-Hinweise halten den Demo-/Pilotstand reproduzierbar, ohne Live-Crawler oder automatische Veröffentlichung.",
              noLiveCrawlerClaim: true,
              noScraping: true,
              noDeepSearchAutoCosts: true,
              noAutoPublish: true,
              noPublicOfficial: true,
              claimCandidates: [],
              topicCandidates: [],
              evidenceHints: [],
              openQuestions: ["Welche nächsten Prüfschritte ergeben sich aus Schule?"],
            },
            possibleClaims: [
              {
                text: "Schulsanierung in Reinickendorf",
                confidence: 0.74,
                basisLabel: "Titel",
                excerpt: "Das Bezirksamt Reinickendorf informiert über Schulwegsicherheit an mehreren Standorten.",
                reviewRequired: true,
              },
            ],
            topicClusters: [
              {
                clusterKey: "schule-reinickendorf",
                label: "Schule Reinickendorf",
                signalSeedIds: ["region-source-feed-signal-source-1-1"],
                openQuestions: ["Welche nächsten Prüfschritte ergeben sich aus Schule?"],
                confidence: 0.68,
                suggestedAction: "ask_clarifying_question",
                reviewStatus: "needs_review",
              },
            ],
            dossierSuggestions: [
              {
                title: "Berlin Reinickendorf: Schule",
                signalSeedIds: ["region-source-feed-signal-source-1-1"],
                openQuestions: ["Welche nächsten Prüfschritte ergeben sich aus Schule?"],
                confidence: 0.68,
                reviewStatus: "needs_review",
              },
            ],
            anlassraumSuggestions: [
              {
                title: "Schule Berlin Reinickendorf",
                signalSeedIds: ["region-source-feed-signal-source-1-1"],
                openQuestions: ["Welche nächsten Prüfschritte ergeben sich aus Schule?"],
                confidence: 0.68,
                reviewStatus: "needs_review",
              },
            ],
            evidenceReferences: [
              {
                label: "Seitenauszug · Schulsanierung in Reinickendorf",
                url: "https://reinickendorf.example/aktuelles",
                excerpt: "Das Bezirksamt Reinickendorf informiert über Schulwegsicherheit an mehreren Standorten.",
              },
            ],
            openQuestions: ["Welche nächsten Prüfschritte ergeben sich aus Schule?"],
            affectedScope: {
              regionName: "Berlin Reinickendorf",
              detectedPlaces: ["Berlin Reinickendorf"],
              ortsteilHints: [],
              fachbereichHints: ["Schule/Bildung", "Schule", "Verkehr"],
            },
            reviewSuggestions: [
              {
                id: "region-intelligence-dossier-schule-reinickendorf",
                suggestionType: "dossier_suggestion",
                title: "Berlin Reinickendorf: Schule",
                summary: "1 Signal spricht für einen reviewpflichtigen Dossier-Vorschlag.",
                signalSeedIds: ["region-source-feed-signal-source-1-1"],
                confidence: 0.68,
                reviewStatus: "needs_review",
                visibilityState: "internal_review",
                sourceCategories: ["productive"],
                sourceLabels: ["Bezirksamt Reinickendorf News"],
                sourceStatusLabel: "1 produktive Quelle verbunden",
              },
            ],
            reviewTaskSummary: {
              claimCount: 1,
              topicClusterCount: 1,
              dossierSuggestionCount: 1,
              anlassraumSuggestionCount: 1,
              openQuestionCount: 1,
              evidenceCount: 1,
              label: "1 mögliche Aussagen · 1 Themencluster · 1 Dossier-Vorschläge · 1 Anlassraum-Vorschläge · 1 offene Fragen",
            },
            createdAt: "2026-05-17T00:00:00.000Z",
            updatedAt: "2026-05-17T00:00:00.000Z",
            testedBy: "admin-1",
            reviewRequired: true,
            noAutoPublish: true,
            noPublicOfficial: true,
          },
        ],
      }),
    );
  });

  it("returns a read-only cockpit with regional signals, suggestions and guardrails", async () => {
    const res = await GET(
      new NextRequest("http://localhost/api/admin/region/cockpit/berlin-reinickendorf"),
      { params: Promise.resolve({ regionId: "berlin-reinickendorf" }) },
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      ok: true,
      cockpit: {
        region: { id: "bezirk-berlin-reinickendorf" },
        accessSummary: {
          authoritySource: "admin_fallback",
          adminFallback: true,
          verificationStatus: "admin_fallback",
          entitlementStatus: "admin_fallback",
          entitlementReason: "admin_fallback",
          canReadRegionDashboard: true,
          canCreateDossierDraft: true,
        },
        guidelineProfile: "berlin_participation_guidelines",
        guidelineMatrix: expect.objectContaining({
          title: "Leitlinienmatrix Berlin / Bürgerbeteiligung",
          legalAdvice: false,
          reviewRequired: true,
        }),
        guardrails: {
          noAutoPublish: true,
          noAutoDossierCreation: true,
          noAutoAnlassraumCreation: true,
          noTenderMonitoring: true,
          noProcurementMonitoring: true,
        },
        feedSignals: expect.arrayContaining([
          expect.objectContaining({
            title: "Pilotvorschau: Hinweise zu Schulsanierung und Bauzustand",
            provenance: expect.objectContaining({ dataOrigin: "pilot_fixture" }),
          }),
          expect.objectContaining({
            title: "Schulwegsicherheit im Bezirk",
            provenance: expect.objectContaining({ dataOrigin: "source_connection_runtime" }),
          }),
        ]),
        participationSignals: expect.arrayContaining([
          expect.objectContaining({
            sourceType: "public_question",
            visibilityState: "public_unverified",
          }),
          expect.objectContaining({
            sourceType: "swipe_interest",
            aggregationMode: "anonymized_count",
            privacyMode: "anonymized",
          }),
        ]),
        participationAggregates: expect.arrayContaining([
          expect.objectContaining({
            label: "Fragen aus der Öffentlichkeit",
          }),
        ]),
        publicClaimsSummary: expect.objectContaining({
          total: expect.any(Number),
        }),
        swipeInterestSummary: expect.objectContaining({
          totalSignals: expect.any(Number),
        }),
        reviewItemsFromPublicInput: expect.arrayContaining([
          expect.objectContaining({
            sourceType: "public_claim",
            visibilityState: "internal_review",
          }),
        ]),
        needsRegionReviewSignals: expect.arrayContaining([
          expect.objectContaining({
            reviewStatus: "needs_region_review",
          }),
        ]),
        suggestedAnlassraeume: expect.arrayContaining([
          expect.objectContaining({
            title: "Bildung & Schulinfrastruktur Reinickendorf",
          }),
        ]),
        suggestedDossiers: expect.arrayContaining([
          expect.objectContaining({
            title: "Sanierung von Schulen im Bezirk",
            noAutoCreateDossier: true,
          }),
        ]),
        sourceConnections: expect.arrayContaining([
          expect.objectContaining({
            label: "Bezirksamt Reinickendorf News",
          }),
        ]),
        sourceTestResults: expect.arrayContaining([
          expect.objectContaining({
            title: "Bezirksamt Reinickendorf News · Dry Run",
          }),
        ]),
        openReviewItems: expect.arrayContaining([
          expect.objectContaining({
            title: "Pilotvorschau: Hinweise zu Schulsanierung und Bauzustand",
          }),
          expect.objectContaining({
            title: "Schulwegsicherheit im Bezirk",
          }),
        ]),
      },
    });

    const payload = JSON.stringify(body);
    expect(payload).not.toContain("userId");
  });

  it("blocks pending self-declared users from the region dashboard", async () => {
    setRegionOrganizationRuntimeRepoForTests(
      createInMemoryRegionOrganizationRuntimeRepo({
        memberships: [
          {
            id: "membership-pending-1",
            userId: "pending-1",
            organizationId: "org-reinickendorf-1",
            organizationName: "Bezirksamt Reinickendorf",
            organizationType: "district_office",
            regionId: "bezirk-berlin-reinickendorf",
            unitId: null,
            unitName: null,
            optionalLocation: null,
            roleLabel: "Sachbearbeitung",
            roleType: "staff",
            verificationStatus: "pending_review",
            allowedActions: [],
            createdAt: "2026-05-14T00:00:00.000Z",
            updatedAt: "2026-05-14T00:00:00.000Z",
            verifiedBy: null,
            verifiedAt: null,
            expiresAt: null,
            revokedAt: null,
            noAutoAuthority: true,
          },
        ],
      }),
    );
    setRegionEntitlementRuntimeRepoForTests(
      createInMemoryRegionEntitlementRuntimeRepo({
        entitlements: [
          {
            id: "entitlement-reinickendorf-1",
            organizationId: "org-reinickendorf-1",
            organizationName: "Bezirksamt Reinickendorf",
            organizationType: "district_office",
            regionId: "bezirk-berlin-reinickendorf",
            unitId: null,
            planId: "kommune-aktivierung",
            planLabel: "Kommune Aktivierung",
            status: "active",
            scope: "region",
            validFrom: "2026-05-14T00:00:00.000Z",
            validUntil: null,
            limits: {
              maxRegions: 1,
              maxDossiers: 10,
              maxAnlassraeume: 10,
              maxSignalsPerMonth: 100,
              maxDraftsPerMonth: 25,
              maxUsers: 10,
              factcheckCredits: 0,
            },
            usage: {
              regionsUsed: 0,
              dossiersUsed: 0,
              anlassraeumeUsed: 0,
              signalsThisMonth: 0,
              draftsThisMonth: 0,
              usersUsed: 0,
              factcheckCreditsUsed: 0,
            },
            createdAt: "2026-05-14T00:00:00.000Z",
            updatedAt: "2026-05-14T00:00:00.000Z",
            createdBy: "admin-1",
            source: "admin_grant",
            noAutoBilling: true,
            noAutoCharge: true,
          },
        ],
      }),
    );
    mocks.requireGovernanceActorOrResponse.mockResolvedValue({
      user: { _id: { toHexString: () => "pending-1" } },
      roles: [],
      actor: {
        userId: "pending-1",
        role: "institutional_actor",
        isAdmin: false,
        scopedOwnerIds: [],
        scopedEntityIds: [],
        personTrust: null,
      },
    });

    const res = await GET(
      new NextRequest("http://localhost/api/admin/region/cockpit/berlin-reinickendorf"),
      { params: Promise.resolve({ regionId: "berlin-reinickendorf" }) },
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "region_dashboard_forbidden",
    });
  });

  it("allows organization-verified memberships to read only their own region from persisted runtime data", async () => {
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
            createdByUserId: "staff-1",
          },
        ],
        memberships: [
          {
            id: "membership-org-verified-1",
            userId: "staff-1",
            organizationId: "org-reinickendorf-1",
            organizationName: "Bezirksamt Reinickendorf",
            organizationType: "district_office",
            regionId: "bezirk-berlin-reinickendorf",
            unitId: null,
            unitName: null,
            optionalLocation: null,
            roleLabel: "Kommunikation",
            roleType: "communications",
            verificationStatus: "organization_verified",
            allowedActions: ["read_region_dashboard"],
            createdAt: "2026-05-14T00:00:00.000Z",
            updatedAt: "2026-05-14T00:00:00.000Z",
            verifiedBy: "admin-1",
            verifiedAt: "2026-05-14T00:00:00.000Z",
            expiresAt: null,
            revokedAt: null,
            noAutoAuthority: true,
          },
        ],
      }),
    );
    setRegionEntitlementRuntimeRepoForTests(
      createInMemoryRegionEntitlementRuntimeRepo({
        entitlements: [
          {
            id: "entitlement-reinickendorf-org-read-1",
            organizationId: "org-reinickendorf-1",
            organizationName: "Bezirksamt Reinickendorf",
            organizationType: "district_office",
            regionId: "bezirk-berlin-reinickendorf",
            unitId: null,
            planId: "kommune-aktivierung",
            planLabel: "Kommune Aktivierung",
            status: "active",
            scope: "region",
            validFrom: "2026-05-14T00:00:00.000Z",
            validUntil: null,
            limits: {
              maxRegions: 1,
              maxDossiers: 10,
              maxAnlassraeume: 10,
              maxSignalsPerMonth: 100,
              maxDraftsPerMonth: 25,
              maxUsers: 10,
              factcheckCredits: 0,
            },
            usage: {
              regionsUsed: 0,
              dossiersUsed: 0,
              anlassraeumeUsed: 0,
              signalsThisMonth: 0,
              draftsThisMonth: 0,
              usersUsed: 0,
              factcheckCreditsUsed: 0,
            },
            createdAt: "2026-05-14T00:00:00.000Z",
            updatedAt: "2026-05-14T00:00:00.000Z",
            createdBy: "admin-1",
            source: "admin_grant",
            noAutoBilling: true,
            noAutoCharge: true,
          },
        ],
      }),
    );
    mocks.requireGovernanceActorOrResponse.mockResolvedValue({
      user: { _id: { toHexString: () => "staff-1" } },
      roles: ["institutional_actor", "region_staff:bezirk-berlin-reinickendorf"],
      actor: {
        userId: "staff-1",
        role: "institutional_actor",
        isAdmin: false,
        scopedOwnerIds: ["org-reinickendorf-1"],
        scopedEntityIds: ["org-reinickendorf-1"],
        personTrust: null,
      },
    });

    const res = await GET(
      new NextRequest("http://localhost/api/admin/region/cockpit/berlin-reinickendorf"),
      { params: Promise.resolve({ regionId: "berlin-reinickendorf" }) },
    );

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      cockpit: {
        accessSummary: {
          authoritySource: "verified_membership",
          adminFallback: false,
          verificationStatus: "organization_verified",
          entitlementStatus: "active",
          entitlementPlanLabel: "Kommune Aktivierung",
          canReadRegionDashboard: true,
          canCreateDossierDraft: false,
        },
      },
    });
  });

  it("blocks verified memberships without entitlement even when raw region hints are present", async () => {
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
            createdByUserId: "staff-2",
          },
        ],
        memberships: [
          {
            id: "membership-org-verified-2",
            userId: "staff-2",
            organizationId: "org-reinickendorf-1",
            organizationName: "Bezirksamt Reinickendorf",
            organizationType: "district_office",
            regionId: "bezirk-berlin-reinickendorf",
            unitId: null,
            unitName: null,
            optionalLocation: null,
            roleLabel: "Kommunikation",
            roleType: "communications",
            verificationStatus: "organization_verified",
            allowedActions: ["read_region_dashboard"],
            createdAt: "2026-05-14T00:00:00.000Z",
            updatedAt: "2026-05-14T00:00:00.000Z",
            verifiedBy: "admin-1",
            verifiedAt: "2026-05-14T00:00:00.000Z",
            expiresAt: null,
            revokedAt: null,
            noAutoAuthority: true,
          },
        ],
      }),
    );
    mocks.requireGovernanceActorOrResponse.mockResolvedValue({
      user: { _id: { toHexString: () => "staff-2" } },
      roles: ["institutional_actor", "region_staff:bezirk-berlin-reinickendorf"],
      actor: {
        userId: "staff-2",
        role: "institutional_actor",
        isAdmin: false,
        scopedOwnerIds: ["org-reinickendorf-1"],
        scopedEntityIds: ["org-reinickendorf-1"],
        personTrust: null,
      },
    });

    const res = await GET(
      new NextRequest("http://localhost/api/admin/region/cockpit/berlin-reinickendorf"),
      { params: Promise.resolve({ regionId: "berlin-reinickendorf" }) },
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "region_dashboard_forbidden",
    });
  });

  it("blocks raw region roles without verified membership context", async () => {
    mocks.requireGovernanceActorOrResponse.mockResolvedValue({
      user: { _id: { toHexString: () => "staff-raw-1" } },
      roles: ["region_staff:bezirk-berlin-reinickendorf"],
      actor: {
        userId: "staff-raw-1",
        role: "institutional_actor",
        isAdmin: false,
        scopedOwnerIds: [],
        scopedEntityIds: [],
        personTrust: null,
      },
    });

    const res = await GET(
      new NextRequest("http://localhost/api/admin/region/cockpit/berlin-reinickendorf"),
      { params: Promise.resolve({ regionId: "berlin-reinickendorf" }) },
    );

    expect(res.status).toBe(403);
    await expect(res.json()).resolves.toMatchObject({
      ok: false,
      error: "region_dashboard_forbidden",
    });
  });
});
