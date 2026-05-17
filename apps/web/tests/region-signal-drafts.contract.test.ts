import { beforeEach, describe, expect, it } from "vitest";
import {
  buildRegionAccessContext,
  createInMemoryParticipationSignalReviewRuntimeRepo,
  createInMemoryRegionDataRepo,
  createInMemoryRegionSignalDraftPersistence,
  createRegionSignalDraft,
  listRegionSignalDraftRecords,
  setParticipationSignalReviewRuntimeRepoForTests,
  setRegionDataRepoForTests,
  setRegionSignalDraftPersistenceForTests,
  type EntitlementCheckResult,
} from "@features/region";

const REINICKENDORF_ORG = {
  id: "org-reinickendorf-1",
  name: "Bezirksamt Reinickendorf",
  type: "district_office" as const,
  countryCode: "DE",
  primaryRegionId: "bezirk-berlin-reinickendorf",
  website: "https://reinickendorf.example",
  verificationStatus: "organization_verified" as const,
  createdByUserId: "user-1",
};

function entitlementCheck(
  allowed: boolean,
  reason: EntitlementCheckResult["reason"] = allowed ? "active" : "missing_entitlement",
): EntitlementCheckResult {
  return {
    allowed,
    reason,
    entitlementId: allowed ? "entitlement-1" : null,
    status: allowed ? "active" : null,
    planId: allowed ? "kommune-aktivierung" : null,
    planLabel: allowed ? "Kommune Aktivierung" : null,
    scope: allowed ? "region" : null,
    source: allowed ? "admin_grant" : null,
    limits: allowed
      ? {
          maxRegions: 1,
          maxDossiers: 10,
          maxAnlassraeume: 10,
          maxSignalsPerMonth: 100,
          maxDraftsPerMonth: 25,
          maxUsers: 10,
          factcheckCredits: 0,
        }
      : null,
    usage: allowed
      ? {
          regionsUsed: 0,
          dossiersUsed: 0,
          anlassraeumeUsed: 0,
          signalsThisMonth: 0,
          draftsThisMonth: 0,
          usersUsed: 0,
          factcheckCreditsUsed: 0,
        }
      : null,
    guardrails: {
      noAutoBilling: true,
      noAutoCharge: true,
      noAutoPublish: true,
      requiresVerifiedMembership: true,
    },
  };
}

function makeVerifiedContext(
  verificationStatus:
    | "pending_review"
    | "email_verified"
    | "organization_verified"
    | "unit_verified"
    | "publication_approved",
  options: { regionId?: string; isAdmin?: boolean } = {},
) {
  return buildRegionAccessContext({
    userId: "user-1",
    actorRole: options.isAdmin ? "admin" : "institutional_actor",
    isAdmin: options.isAdmin,
    roles: options.isAdmin ? ["admin"] : [],
    memberships: options.isAdmin
      ? []
      : [
          {
            id: `membership-${verificationStatus}`,
            userId: "user-1",
            organizationId: REINICKENDORF_ORG.id,
            organizationName: REINICKENDORF_ORG.name,
            organizationType: REINICKENDORF_ORG.type,
            regionId: options.regionId ?? REINICKENDORF_ORG.primaryRegionId,
            unitId:
              verificationStatus === "organization_verified" || verificationStatus === "pending_review"
                ? null
                : "unit-1",
            unitName:
              verificationStatus === "organization_verified" || verificationStatus === "pending_review"
                ? null
                : "Beteiligung",
            optionalLocation: null,
            roleLabel: "Beteiligung",
            roleType: "participation_officer",
            verificationStatus,
            allowedActions:
              verificationStatus === "organization_verified"
                ? ["read_region_dashboard"]
                : verificationStatus === "unit_verified"
                  ? [
                      "read_region_dashboard",
                      "review_region_signal",
                      "create_region_draft",
                      "create_dossier_draft",
                      "create_anlassraum_draft",
                      "attach_signal_to_dossier",
                      "submit_for_review",
                    ]
                  : verificationStatus === "publication_approved"
                    ? [
                        "read_region_dashboard",
                        "review_region_signal",
                        "create_region_draft",
                        "create_dossier_draft",
                        "create_anlassraum_draft",
                        "attach_signal_to_dossier",
                        "submit_for_review",
                        "approve_publication",
                        "manage_organization_members",
                      ]
                    : [],
            createdAt: "2026-05-14T00:00:00.000Z",
            updatedAt: "2026-05-14T00:00:00.000Z",
            verifiedBy: verificationStatus === "pending_review" ? null : "admin-1",
            verifiedAt:
              verificationStatus === "pending_review"
                ? null
                : "2026-05-14T00:00:00.000Z",
            expiresAt: null,
            revokedAt: null,
            noAutoAuthority: true,
          },
        ],
    organizations: [
      {
        ...REINICKENDORF_ORG,
        primaryRegionId: options.regionId ?? REINICKENDORF_ORG.primaryRegionId,
      },
    ],
    dashboardEntitlementCheck: options.isAdmin
      ? undefined
      : entitlementCheck(
          verificationStatus === "organization_verified" ||
            verificationStatus === "unit_verified" ||
            verificationStatus === "publication_approved",
        ),
    dossierDraftEntitlementCheck: options.isAdmin
      ? undefined
      : entitlementCheck(
          verificationStatus === "unit_verified" || verificationStatus === "publication_approved",
        ),
    anlassraumDraftEntitlementCheck: options.isAdmin
      ? undefined
      : entitlementCheck(
          verificationStatus === "unit_verified" || verificationStatus === "publication_approved",
        ),
  });
}

describe("region signal drafts contract", () => {
  beforeEach(() => {
    setRegionDataRepoForTests(createInMemoryRegionDataRepo());
    setRegionSignalDraftPersistenceForTests(createInMemoryRegionSignalDraftPersistence());
    setParticipationSignalReviewRuntimeRepoForTests(
      createInMemoryParticipationSignalReviewRuntimeRepo(),
    );
  });

  it("blocks pending, email-verified, organization-verified and raw-role contexts from creating drafts", async () => {
    const deniedContexts = [
      makeVerifiedContext("pending_review"),
      makeVerifiedContext("email_verified"),
      makeVerifiedContext("organization_verified"),
      buildRegionAccessContext({
        userId: "user-raw",
        actorRole: "institutional_actor",
        roles: ["region_staff:bezirk-berlin-reinickendorf"],
      }),
    ];

    for (const context of deniedContexts) {
      const result = await createRegionSignalDraft({
        signalId: "region-feed-signal-reinickendorf-school-renovation-accepted-001",
        regionId: "berlin-reinickendorf",
        target: "dossier",
        accessContext: context,
        requestedBy: "user-1",
      });
      expect(result).toMatchObject({
        ok: false,
        blockedReason: "missing_permission",
      });
    }
  });

  it("lets unit-verified staff create dossier and anlassraum drafts in their own region without publication approval", async () => {
    const context = makeVerifiedContext("unit_verified");

    const dossier = await createRegionSignalDraft({
      signalId: "region-feed-signal-reinickendorf-school-renovation-accepted-001",
      regionId: "berlin-reinickendorf",
      target: "dossier",
      accessContext: context,
      requestedBy: "user-1",
    });
    const anlassraum = await createRegionSignalDraft({
      signalId: "region-feed-signal-reinickendorf-school-renovation-accepted-001",
      regionId: "berlin-reinickendorf",
      target: "anlassraum",
      accessContext: context,
      requestedBy: "user-1",
      title: "Bildung & Schulinfrastruktur Reinickendorf",
      summary: "Reviewpflichtiger Anlassraum-Draft aus akzeptiertem Signal.",
    });

    expect(dossier.ok).toBe(true);
    expect(dossier.draftType).toBe("dossier");
    expect(anlassraum.ok).toBe(true);
    expect(anlassraum.draftType).toBe("anlassraum");

    const records = await listRegionSignalDraftRecords();
    expect(records).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          draftType: "dossier",
          provenance: expect.objectContaining({
            sourceSignalId: "region-feed-signal-reinickendorf-school-renovation-accepted-001",
            pilotFixture: true,
            notProductionData: true,
            notRealNews: true,
          }),
          guardrails: expect.objectContaining({
            noAutoPublish: true,
            noAutoVote: true,
            noAutoMandate: true,
            noTenderMonitoring: true,
            noProcurementMonitoring: true,
            reviewRequired: true,
          }),
          targetStatus: "draft",
          visibilityState: "internal_review",
          backingStore: "dossiers",
        }),
        expect.objectContaining({
          draftType: "anlassraum",
          targetStatus: "draft",
          visibilityState: "internal_review",
          backingStore: "anlassraum",
        }),
      ]),
    );
  });

  it("keeps foreign regions isolated and still allows admin fallback to create drafts", async () => {
    const unitVerified = makeVerifiedContext("unit_verified");
    const wrongRegion = await createRegionSignalDraft({
      signalId: "region-feed-signal-reinickendorf-school-renovation-accepted-001",
      regionId: "berlin-spandau",
      target: "dossier",
      accessContext: unitVerified,
      requestedBy: "user-1",
    });
    expect(wrongRegion).toMatchObject({
      ok: false,
      blockedReason: "wrong_region",
    });

    const admin = makeVerifiedContext("unit_verified", { isAdmin: true });
    const result = await createRegionSignalDraft({
      signalId: "region-feed-signal-reinickendorf-school-renovation-accepted-001",
      regionId: "berlin-reinickendorf",
      target: "dossier",
      accessContext: admin,
      requestedBy: "admin-1",
    });

    expect(result.ok).toBe(true);
    const records = await listRegionSignalDraftRecords();
    expect(records.some((record) => record.adminFallback && record.authoritySource === "admin_fallback")).toBe(true);
  });

  it("rejects draft, rejected and archived signals and blocks procurement-flavoured signals", async () => {
    const context = makeVerifiedContext("unit_verified");

    await expect(
      createRegionSignalDraft({
        signalId: "region-feed-signal-reinickendorf-citizen-office-001",
        regionId: "berlin-reinickendorf",
        target: "dossier",
        accessContext: context,
        requestedBy: "user-1",
      }),
    ).resolves.toMatchObject({ ok: false, blockedReason: "signal_not_accepted" });

    await expect(
      createRegionSignalDraft({
        signalId: "region-feed-signal-reinickendorf-rejected-001",
        regionId: "berlin-reinickendorf",
        target: "dossier",
        accessContext: context,
        requestedBy: "user-1",
      }),
    ).resolves.toMatchObject({ ok: false, blockedReason: "signal_not_accepted" });

    await expect(
      createRegionSignalDraft({
        signalId: "region-feed-signal-reinickendorf-archived-001",
        regionId: "berlin-reinickendorf",
        target: "anlassraum",
        accessContext: context,
        requestedBy: "user-1",
      }),
    ).resolves.toMatchObject({ ok: false, blockedReason: "signal_not_accepted" });

    setRegionDataRepoForTests(
      createInMemoryRegionDataRepo({
        signals: [
          {
            id: "signal-procurement-1",
            regionId: "bezirk-berlin-reinickendorf",
            title: "Ausschreibung für Schulbau als Themenhinweis",
            summary: "Akzeptierter Hinweis mit Vergabe-/Beschaffungsbezug für Out-of-scope-Tests.",
            signalType: "topic_proposal",
            reviewStatus: "accepted",
            sourceActorId: null,
            sourceUrls: [],
            submitter: { mode: "registered_reference", displayName: "Test", contactChannel: null },
            guardrails: {
              moderationRequired: true,
              noAutoPublish: true,
              noAutoMandate: true,
              noAutomaticDossierCreation: true,
            },
            createdAt: "2026-05-14T00:00:00.000Z",
            updatedAt: "2026-05-14T00:00:00.000Z",
          },
        ],
      }),
    );

    await expect(
      createRegionSignalDraft({
        signalId: "signal-procurement-1",
        regionId: "berlin-reinickendorf",
        target: "dossier",
        accessContext: context,
        requestedBy: "user-1",
      }),
    ).resolves.toMatchObject({
      ok: false,
      blockedReason: "tender_or_procurement_out_of_scope",
    });
  });

  it("blocks non-accepted or privacy-restricted public participation signals and allows accepted sanitized ones", async () => {
    const context = makeVerifiedContext("unit_verified");

    const notAccepted = await createRegionSignalDraft({
      signalId: "region-participation-reinickendorf-claim-001",
      regionId: "berlin-reinickendorf",
      target: "dossier",
      accessContext: context,
      requestedBy: "user-1",
    });
    const regionReviewPending = await createRegionSignalDraft({
      signalId: "region-participation-needs-region-review-001",
      regionId: "berlin-reinickendorf",
      target: "dossier",
      accessContext: context,
      requestedBy: "user-1",
    });
    const privacyRestricted = await createRegionSignalDraft({
      signalId: "region-participation-reinickendorf-source-hint-001",
      regionId: "berlin-reinickendorf",
      target: "dossier",
      accessContext: context,
      requestedBy: "user-1",
    });
    const accepted = await createRegionSignalDraft({
      signalId: "region-participation-reinickendorf-question-accepted-001",
      regionId: "berlin-reinickendorf",
      target: "dossier",
      accessContext: context,
      requestedBy: "user-1",
    });

    expect(notAccepted).toMatchObject({
      ok: false,
      blockedReason: "public_signal_not_accepted",
    });
    expect(regionReviewPending).toMatchObject({
      ok: false,
      blockedReason: "public_signal_region_unconfirmed",
    });
    expect(privacyRestricted).toMatchObject({
      ok: false,
      blockedReason: "public_signal_privacy_restricted",
    });
    expect(accepted).toMatchObject({
      ok: true,
      draftType: "dossier",
      reviewStatus: "needs_review",
      visibilityState: "internal_review",
    });
  });
});
