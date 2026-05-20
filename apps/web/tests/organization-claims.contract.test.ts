import { beforeEach, describe, expect, it } from "vitest";
import {
  createInMemoryRegionOrganizationRuntimeRepo,
  createPendingClaimBundle,
  parseSelfDeclaredOrganizationProfile,
  setRegionOrganizationRuntimeRepoForTests,
} from "@features/region";

describe("organization claims runtime contract", () => {
  beforeEach(() => {
    setRegionOrganizationRuntimeRepoForTests(createInMemoryRegionOrganizationRuntimeRepo());
  });

  it("creates self-declared claims as pending_review with no auto authority", async () => {
    const repo = createInMemoryRegionOrganizationRuntimeRepo();
    const claim = await repo.createOrganizationClaim({
      userId: "user-1",
      organizationName: "Stadt Beispielstadt",
      organizationType: "municipality",
      regionId: "kommune-beispielstadt",
      roleLabel: "Sachbearbeitung",
    });

    expect(claim.verificationStatus).toBe("pending_review");
    expect(claim.noAutoAuthority).toBe(true);
  });

  it("keeps pending_review memberships without allowed actions", () => {
    const bundle = createPendingClaimBundle({
      claimId: "claim-pending",
      membershipId: "membership-pending",
      organizationId: "org-pending",
      userId: "user-1",
      requestedRegionId: "kommune-beispielstadt",
      createdAt: "2026-05-14T00:00:00.000Z",
      profile: {
        countryCode: "DE",
        countryName: "Deutschland",
        organizationName: "Stadt Beispielstadt",
        roleLabel: "Sachbearbeitung",
      },
    });

    expect(bundle.membership.allowedActions).toEqual([]);
    expect(bundle.membership.noAutoAuthority).toBe(true);
  });

  it("accepts missing optionalLocation and keeps location outside the organization hierarchy", () => {
    const withoutLocation = createPendingClaimBundle({
      claimId: "claim-no-location",
      membershipId: "membership-no-location",
      organizationId: "org-no-location",
      userId: "user-2",
      requestedRegionId: "kommune-beispielstadt",
      createdAt: "2026-05-14T00:00:00.000Z",
      profile: {
        countryCode: "DE",
        countryName: "Deutschland",
        organizationName: "Stadt Beispielstadt",
        unitName: "Bauen und Wohnen",
        roleLabel: "Sachbearbeitung",
      },
    });
    const withLocation = createPendingClaimBundle({
      claimId: "claim-location",
      membershipId: "membership-location",
      organizationId: "org-location",
      userId: "user-3",
      requestedRegionId: "kommune-beispielstadt",
      createdAt: "2026-05-14T00:00:00.000Z",
      profile: {
        countryCode: "DE",
        countryName: "Deutschland",
        organizationName: "Stadt Beispielstadt",
        locationName: "Rathaus Beispielstadt",
        roleLabel: "Sachbearbeitung",
      },
    });

    expect(withoutLocation.claim.optionalLocation).toBeNull();
    expect(withLocation.claim.optionalLocation?.name).toBe("Rathaus Beispielstadt");
    expect(withLocation.unit).toBeNull();
  });

  it("lets associations, traeger and NGOs submit claims without granting authority", async () => {
    const repo = createInMemoryRegionOrganizationRuntimeRepo();
    const claim = await repo.createOrganizationClaim({
      userId: "user-ngo-1",
      organizationName: "Sozialträger Nord",
      organizationType: "association",
      countryCode: "DE",
      evidence: { note: "Lokaler Verein oder Träger" },
    });

    expect(claim.organizationType).toBe("association");
    expect(claim.verificationStatus).toBe("pending_review");
    expect(claim.noAutoAuthority).toBe(true);
  });

  it("lets media partners register without any implicit authority claim", async () => {
    const repo = createInMemoryRegionOrganizationRuntimeRepo();
    const claim = await repo.createOrganizationClaim({
      userId: "user-media-1",
      organizationName: "Lokalredaktion Mitte",
      organizationType: "media",
      regionId: "kommune-beispielstadt",
      countryCode: "DE",
      evidence: { website: "https://lokalredaktion.example" },
    });

    expect(claim.organizationType).toBe("media");
    expect(claim.verificationStatus).toBe("pending_review");
    expect(claim.noAutoAuthority).toBe(true);
  });

  it("supports international organizations without German-only required fields", () => {
    const profile = parseSelfDeclaredOrganizationProfile({
      countryCode: "ES",
      countryName: "Spain",
      regionLevel1Label: "Region",
      regionLevel1Name: "Andalucía",
      regionLevel2Label: "Municipality",
      regionLevel2Name: "Sevilla",
      organizationName: "Ayuntamiento de Sevilla",
      organizationType: "municipality",
      departmentName: "Urbanismo",
      unitName: "Participación Ciudadana",
      roleLabel: "Coordinación",
    });

    expect(profile.organizationName).toBe("Ayuntamiento de Sevilla");
    expect(profile.departmentName).toBe("Urbanismo");
    expect(profile.unitName).toBe("Participación Ciudadana");
  });
});
