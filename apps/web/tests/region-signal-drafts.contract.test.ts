import { beforeEach, describe, expect, it } from "vitest";
import {
  buildRegionAccessContext,
  createInMemoryRegionDataRepo,
  createInMemoryRegionSignalDraftPersistence,
  createRegionSignalDraft,
  listRegionSignalDraftRecords,
  setRegionDataRepoForTests,
  setRegionSignalDraftPersistenceForTests,
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
            unitId:
              verificationStatus === "organization_verified" || verificationStatus === "pending_review"
                ? null
                : "unit-1",
            roleLabel: "Beteiligung",
            roleType: "participation_officer",
            verificationStatus,
            allowedActions: [],
            verifiedBy: verificationStatus === "pending_review" ? null : "admin-1",
            verifiedAt:
              verificationStatus === "pending_review"
                ? null
                : "2026-05-14T00:00:00.000Z",
            expiresAt: null,
          },
        ],
    organizations: [
      {
        ...REINICKENDORF_ORG,
        primaryRegionId: options.regionId ?? REINICKENDORF_ORG.primaryRegionId,
      },
    ],
  });
}

describe("region signal drafts contract", () => {
  beforeEach(() => {
    setRegionDataRepoForTests(createInMemoryRegionDataRepo());
    setRegionSignalDraftPersistenceForTests(createInMemoryRegionSignalDraftPersistence());
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
          targetVisibility: "non_public",
          backingStore: "dossiers",
        }),
        expect.objectContaining({
          draftType: "anlassraum",
          targetStatus: "draft",
          targetVisibility: "non_public",
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
});
