import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import {
  buildRegionAccessContext,
  createInMemoryRegionEntitlementRuntimeRepo,
  createInMemoryRegionOrganizationRuntimeRepo,
  setRegionEntitlementRuntimeRepoForTests,
  setRegionOrganizationRuntimeRepoForTests,
} from "@features/region";

const mocks = vi.hoisted(() => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/lib/server/auth/sessionUser", () => ({
  getSessionUser: (...args: unknown[]) => mocks.getSessionUser(...args),
}));

import {
  resolveRequestScopeContext,
  requestScopeCanWriteOrganizationRoutes,
} from "@/lib/server/auth/requestScope";
import { isProductionMembershipTruth } from "@/lib/server/auth/membershipDirectoryRepository";
import {
  setAuthProviderRuntimeAdapterForTests,
  setMembershipDirectoryAdapterForTests,
} from "@/lib/server/auth/runtimeAdapters";

describe("request scope context resolver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuthProviderRuntimeAdapterForTests(null);
    setMembershipDirectoryAdapterForTests(null);
    setRegionOrganizationRuntimeRepoForTests(createInMemoryRegionOrganizationRuntimeRepo());
    setRegionEntitlementRuntimeRepoForTests(createInMemoryRegionEntitlementRuntimeRepo());
  });

  it("distinguishes a verified organization member from operator mode", async () => {
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
            userId: "user-1",
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
            allowedActions: ["read_region_dashboard", "create_dossier_draft"],
            createdAt: "2026-05-20T08:00:00.000Z",
            updatedAt: "2026-05-20T08:00:00.000Z",
            verifiedBy: "admin-1",
            verifiedAt: "2026-05-20T08:00:00.000Z",
            expiresAt: null,
            revokedAt: null,
            noAutoAuthority: true,
          },
        ],
      }),
    );

    mocks.getSessionUser.mockResolvedValue({
      _id: { toHexString: () => "user-1" },
      email: "kontakt@example.org",
      roles: ["user"],
      sessionValid: true,
    });

    const orgScope = await resolveRequestScopeContext(
      new NextRequest("http://localhost/account/organization/dashboard"),
      {
        regionId: "bezirk-berlin-reinickendorf",
        allowOperatorFallback: false,
      },
    );

    expect(orgScope).toMatchObject({
      actorId: "user-1",
      organizationId: "org-reinickendorf-1",
      membershipStatus: "verified",
      organizationRole: "reviewer",
      isOperatorMode: false,
      sourceOfTruth: "fixture_demo",
      runtimeMarker: "demo_or_test_runtime",
    });
    expect(
      isProductionMembershipTruth({
        sourceOfTruth: orgScope!.sourceOfTruth,
        auditBacked: false,
      }),
    ).toBe(false);
    expect(orgScope?.actor.governanceRole).toBe("institutional_actor");
    expect(orgScope?.regionIds).toContain("bezirk-berlin-reinickendorf");
    expect(orgScope?.sourceBreakdown).toMatchObject({
      actor: "session",
      organization: "fixture_demo",
      organizationRole: "fixture_demo",
      regionAccess: "fixture_demo",
    });

    mocks.getSessionUser.mockResolvedValue({
      _id: { toHexString: () => "admin-1" },
      email: "admin@example.org",
      roles: ["admin"],
      sessionValid: true,
    });

    const operatorScope = await resolveRequestScopeContext(
      new NextRequest("http://localhost/admin/review"),
    );

    expect(operatorScope).toMatchObject({
      actorId: "admin-1",
      isOperatorMode: true,
      operatorModeLabel: "Betreiber-Modus",
      membershipStatus: "verified",
      organizationRole: "operator",
      sourceOfTruth: "session",
      runtimeMarker: "demo_or_test_runtime",
    });
    expect(operatorScope?.actor.governanceRole).toBe("admin");
    expect(requestScopeCanWriteOrganizationRoutes(operatorScope!)).toBe(true);
  });

  it("does not silently keep admin fallback on org-scoped requests", async () => {
    mocks.getSessionUser.mockResolvedValue({
      _id: { toHexString: () => "admin-1" },
      email: "admin@example.org",
      roles: ["admin"],
      sessionValid: true,
    });

    const scope = await resolveRequestScopeContext(
      new NextRequest("http://localhost/account/organization/dashboard"),
      { allowOperatorFallback: false },
    );

    expect(scope).toMatchObject({
      isOperatorMode: false,
      membershipStatus: "none",
      sourceOfTruth: "fixture_demo",
    });
    expect(scope?.actor.governanceRole).toBeNull();
  });

  it("uses explicit runtime adapters and marks demo or pending directory sources visibly", async () => {
    const actorAdapter = {
      async getAuthenticatedActor() {
        return {
          user: {
            _id: { toHexString: () => "user-22" },
            email: "demo@example.org",
            roles: ["user"],
            sessionValid: true,
          },
          actorType: "session_user" as const,
          sourceOfTruth: "session" as const,
          confidence: "high" as const,
          runtimeMarker: "demo_or_test_runtime" as const,
        };
      },
    };
    const membershipAdapter = {
      async listMembershipDirectoryForActor() {
        return {
          memberships: [],
          organizations: [],
          sourceOfTruth: "external_directory_pending" as const,
          confidence: "limited" as const,
          runtimeMarker: "external_directory_pending" as const,
        };
      },
      async resolveRegionAccess() {
        return {
          regionAccess: buildRegionAccessContext({
            userId: "user-22",
            actorRole: "organization_member",
            isAdmin: false,
            roles: ["user"],
            organizationIds: [],
          }),
          sourceOfTruth: "external_directory_pending" as const,
          confidence: "limited" as const,
          runtimeMarker: "external_directory_pending" as const,
        };
      },
    };

    setAuthProviderRuntimeAdapterForTests(actorAdapter);
    setMembershipDirectoryAdapterForTests(membershipAdapter);

    const scope = await resolveRequestScopeContext(
      new NextRequest("http://localhost/account/organization/dashboard"),
      { allowOperatorFallback: false },
    );

    expect(scope).toMatchObject({
      actorId: "user-22",
      organizationId: null,
      membershipStatus: "none",
      organizationRole: null,
      sourceOfTruth: "external_directory_pending",
      runtimeMarker: "external_directory_pending",
      regionAccessSourceOfTruth: "external_directory_pending",
      regionAccessRuntimeMarker: "external_directory_pending",
    });
    expect(scope?.sourceBreakdown).toMatchObject({
      actor: "session",
      organization: "external_directory_pending",
      organizationRole: "external_directory_pending",
      regionAccess: "external_directory_pending",
    });
    expect(requestScopeCanWriteOrganizationRoutes(scope!)).toBe(false);
  });

  it("marks pending, suspended and revoked memberships as non-writing contexts", async () => {
    setRegionOrganizationRuntimeRepoForTests(
      createInMemoryRegionOrganizationRuntimeRepo({
        organizations: [
          {
            id: "org-1",
            name: "Stadt Beispielstadt",
            type: "municipality",
            countryCode: "DE",
            primaryRegionId: "kommune-beispielstadt",
            website: "https://beispielstadt.example",
            verificationStatus: "organization_verified",
            createdByUserId: "admin-1",
          },
        ],
        memberships: [
          {
            id: "membership-pending",
            userId: "pending-user",
            organizationId: "org-1",
            organizationName: "Stadt Beispielstadt",
            organizationType: "municipality",
            regionId: "kommune-beispielstadt",
            unitId: "unit-1",
            unitName: "Dialog",
            optionalLocation: null,
            roleLabel: "Dialog",
            roleType: "participation_officer",
            verificationStatus: "pending_review",
            allowedActions: ["read_region_dashboard"],
            createdAt: "2026-05-20T08:00:00.000Z",
            updatedAt: "2026-05-20T08:00:00.000Z",
            verifiedBy: null,
            verifiedAt: null,
            expiresAt: null,
            revokedAt: null,
            noAutoAuthority: true,
          },
          {
            id: "membership-suspended",
            userId: "suspended-user",
            organizationId: "org-1",
            organizationName: "Stadt Beispielstadt",
            organizationType: "municipality",
            regionId: "kommune-beispielstadt",
            unitId: "unit-1",
            unitName: "Dialog",
            optionalLocation: null,
            roleLabel: "Dialog",
            roleType: "participation_officer",
            verificationStatus: "unit_verified",
            allowedActions: ["read_region_dashboard", "review_region_signal"],
            createdAt: "2026-05-20T08:00:00.000Z",
            updatedAt: "2026-05-20T08:00:00.000Z",
            verifiedBy: "admin-1",
            verifiedAt: "2026-05-20T08:00:00.000Z",
            expiresAt: "2026-05-20T08:00:00.000Z",
            revokedAt: null,
            noAutoAuthority: true,
          },
          {
            id: "membership-revoked",
            userId: "revoked-user",
            organizationId: "org-1",
            organizationName: "Stadt Beispielstadt",
            organizationType: "municipality",
            regionId: "kommune-beispielstadt",
            unitId: "unit-1",
            unitName: "Dialog",
            optionalLocation: null,
            roleLabel: "Dialog",
            roleType: "participation_officer",
            verificationStatus: "revoked",
            allowedActions: [],
            createdAt: "2026-05-20T08:00:00.000Z",
            updatedAt: "2026-05-20T08:00:00.000Z",
            verifiedBy: "admin-1",
            verifiedAt: "2026-05-20T08:00:00.000Z",
            expiresAt: null,
            revokedAt: "2026-05-21T08:00:00.000Z",
            noAutoAuthority: true,
          },
        ],
      }),
    );

    mocks.getSessionUser.mockResolvedValue({
      _id: { toHexString: () => "pending-user" },
      email: "pending@example.org",
      roles: ["user"],
      sessionValid: true,
    });
    const pendingScope = await resolveRequestScopeContext(
      new NextRequest("http://localhost/account/organization/dashboard"),
      { allowOperatorFallback: false },
    );
    expect(pendingScope).toMatchObject({
      membershipStatus: "pending",
      organizationRole: null,
      sourceOfTruth: "fixture_demo",
    });
    expect(requestScopeCanWriteOrganizationRoutes(pendingScope!)).toBe(false);

    mocks.getSessionUser.mockResolvedValue({
      _id: { toHexString: () => "suspended-user" },
      email: "suspended@example.org",
      roles: ["user"],
      sessionValid: true,
    });
    const suspendedScope = await resolveRequestScopeContext(
      new NextRequest("http://localhost/account/organization/dashboard"),
      { allowOperatorFallback: false },
    );
    expect(suspendedScope).toMatchObject({
      membershipStatus: "suspended",
      organizationRole: null,
    });
    expect(requestScopeCanWriteOrganizationRoutes(suspendedScope!)).toBe(false);

    mocks.getSessionUser.mockResolvedValue({
      _id: { toHexString: () => "revoked-user" },
      email: "revoked@example.org",
      roles: ["user"],
      sessionValid: true,
    });
    const revokedScope = await resolveRequestScopeContext(
      new NextRequest("http://localhost/account/organization/dashboard"),
      { allowOperatorFallback: false },
    );
    expect(revokedScope).toMatchObject({
      membershipStatus: "revoked",
      organizationRole: null,
    });
    expect(requestScopeCanWriteOrganizationRoutes(revokedScope!)).toBe(false);
  });
});
