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
} from "@/lib/server/auth/requestScope";
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
      membershipStatus: "unit_verified",
      organizationRole: "participation_officer",
      isOperatorMode: false,
      sourceOfTruth: "fixture_demo",
      runtimeMarker: "demo_or_test_runtime",
    });
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
      membershipStatus: "admin_fallback",
      sourceOfTruth: "session",
      runtimeMarker: "demo_or_test_runtime",
    });
    expect(operatorScope?.actor.governanceRole).toBe("admin");
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
      sourceOfTruth: "session",
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
          sourceOfTruth: "external_provider_pending" as const,
          confidence: "limited" as const,
          runtimeMarker: "external_provider_pending" as const,
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
          sourceOfTruth: "external_provider_pending" as const,
          confidence: "limited" as const,
          runtimeMarker: "external_provider_pending" as const,
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
      sourceOfTruth: "session",
      runtimeMarker: "demo_or_test_runtime",
      regionAccessSourceOfTruth: "external_provider_pending",
      regionAccessRuntimeMarker: "external_provider_pending",
    });
    expect(scope?.sourceBreakdown).toMatchObject({
      actor: "session",
      organization: "session",
      organizationRole: "external_provider_pending",
      regionAccess: "external_provider_pending",
    });
  });
});
