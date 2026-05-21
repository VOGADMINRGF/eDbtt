import type { NextRequest } from "next/server";
import { shouldUseInMemoryMongoFallback } from "@core/db/triMongo";
import {
  buildRegionAccessContext,
  buildPersistedRegionAccessContext,
  getRegionOrganizationRuntimeRepo,
  type Organization,
  type OrganizationMembership,
  type RegionAccessContext,
} from "@features/region";
import { getSessionUser, type SessionUser } from "./sessionUser";

export type RequestScopeSourceOfTruth =
  | "session"
  | "local_membership_store"
  | "fixture_demo"
  | "external_provider_pending";

export type RequestScopeConfidence = "high" | "admin_fallback" | "limited";

export type RequestScopeRuntimeMarker =
  | "production_runtime"
  | "demo_or_test_runtime"
  | "external_provider_pending";

export type AuthProviderActorRuntimeRecord = {
  user: SessionUser | null;
  actorType: "session_user";
  sourceOfTruth: RequestScopeSourceOfTruth;
  confidence: RequestScopeConfidence;
  runtimeMarker: RequestScopeRuntimeMarker;
};

export type MembershipDirectoryRuntimeRecord = {
  memberships: OrganizationMembership[];
  organizations: Organization[];
  sourceOfTruth: RequestScopeSourceOfTruth;
  confidence: RequestScopeConfidence;
  runtimeMarker: RequestScopeRuntimeMarker;
};

export type RegionAccessRuntimeRecord = {
  regionAccess: RegionAccessContext;
  sourceOfTruth: RequestScopeSourceOfTruth;
  confidence: RequestScopeConfidence;
  runtimeMarker: RequestScopeRuntimeMarker;
};

export interface AuthProviderRuntimeAdapter {
  getAuthenticatedActor(request?: NextRequest): Promise<AuthProviderActorRuntimeRecord>;
}

export interface MembershipDirectoryAdapter {
  listMembershipDirectoryForActor(actorId: string): Promise<MembershipDirectoryRuntimeRecord>;
  resolveRegionAccess(input: {
    actorId: string;
    actorRole: string;
    isOperatorMode: boolean;
    roles: string[];
    organizationIds?: string[] | null;
    regionId?: string | null;
  }): Promise<RegionAccessRuntimeRecord>;
}

let authProviderRuntimeAdapter: AuthProviderRuntimeAdapter | null = null;
let membershipDirectoryAdapter: MembershipDirectoryAdapter | null = null;

function defaultRuntimeMarker(): RequestScopeRuntimeMarker {
  if (process.env.NODE_ENV === "test") return "demo_or_test_runtime";
  if (shouldUseInMemoryMongoFallback()) return "demo_or_test_runtime";
  return "production_runtime";
}

function defaultDirectorySource(): {
  sourceOfTruth: RequestScopeSourceOfTruth;
  runtimeMarker: RequestScopeRuntimeMarker;
} {
  const runtimeMarker = defaultRuntimeMarker();
  if (runtimeMarker === "demo_or_test_runtime") {
    return {
      sourceOfTruth: "fixture_demo",
      runtimeMarker,
    };
  }
  return {
    sourceOfTruth: "local_membership_store",
    runtimeMarker,
  };
}

function createDefaultAuthProviderRuntimeAdapter(): AuthProviderRuntimeAdapter {
  return {
    async getAuthenticatedActor(request) {
      const user = await getSessionUser(request);
      return {
        user,
        actorType: "session_user",
        sourceOfTruth: "session",
        confidence: user?.sessionValid ? "high" : "limited",
        runtimeMarker: defaultRuntimeMarker(),
      };
    },
  };
}

function createDefaultMembershipDirectoryAdapter(): MembershipDirectoryAdapter {
  return {
    async listMembershipDirectoryForActor(actorId) {
      const repo = getRegionOrganizationRuntimeRepo();
      const memberships = await repo.listMembershipsForUser(actorId);
      const organizations = await repo.listOrganizationsByIds(
        memberships.map((membership) => membership.organizationId),
      );
      const source = defaultDirectorySource();
      return {
        memberships,
        organizations,
        sourceOfTruth: source.sourceOfTruth,
        confidence: memberships.length > 0 ? "high" : "limited",
        runtimeMarker: source.runtimeMarker,
      };
    },

    async resolveRegionAccess(input) {
      const source = defaultDirectorySource();
      try {
        const regionAccess = await buildPersistedRegionAccessContext({
          userId: input.actorId,
          actorRole: input.actorRole,
          isAdmin: input.isOperatorMode,
          roles: input.roles,
          organizationIds: input.organizationIds,
          regionId: input.regionId,
        });
        return {
          regionAccess,
          sourceOfTruth: source.sourceOfTruth,
          confidence: input.isOperatorMode ? "admin_fallback" : "high",
          runtimeMarker: source.runtimeMarker,
        };
      } catch {
        return {
          regionAccess: buildRegionAccessContext({
            userId: input.actorId,
            actorRole: input.actorRole,
            isAdmin: input.isOperatorMode,
            roles: input.roles,
            organizationIds: input.organizationIds,
          }),
          sourceOfTruth: "external_provider_pending",
          confidence: input.isOperatorMode ? "admin_fallback" : "limited",
          runtimeMarker: "external_provider_pending",
        };
      }
    },
  };
}

export function getAuthProviderRuntimeAdapter(): AuthProviderRuntimeAdapter {
  if (!authProviderRuntimeAdapter) {
    authProviderRuntimeAdapter = createDefaultAuthProviderRuntimeAdapter();
  }
  return authProviderRuntimeAdapter;
}

export function getMembershipDirectoryAdapter(): MembershipDirectoryAdapter {
  if (!membershipDirectoryAdapter) {
    membershipDirectoryAdapter = createDefaultMembershipDirectoryAdapter();
  }
  return membershipDirectoryAdapter;
}

export function setAuthProviderRuntimeAdapterForTests(adapter: AuthProviderRuntimeAdapter | null) {
  authProviderRuntimeAdapter = adapter;
}

export function setMembershipDirectoryAdapterForTests(adapter: MembershipDirectoryAdapter | null) {
  membershipDirectoryAdapter = adapter;
}
