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
import type {
  MembershipDirectoryAdapter,
  MembershipDirectoryRepository,
  MembershipDirectoryRuntimeRecord,
  RegionAccessRuntimeRecord,
  RequestScopeConfidence,
  RequestScopeRuntimeMarker,
  RequestScopeSourceOfTruth,
} from "./membershipDirectoryRepository";
import { getSessionUser, type SessionUser } from "./sessionUser";

export type AuthProviderActorRuntimeRecord = {
  user: SessionUser | null;
  actorType: "session_user";
  sourceOfTruth: RequestScopeSourceOfTruth;
  confidence: RequestScopeConfidence;
  runtimeMarker: RequestScopeRuntimeMarker;
};

export interface AuthProviderRuntimeAdapter {
  getAuthenticatedActor(request?: NextRequest): Promise<AuthProviderActorRuntimeRecord>;
}

let authProviderRuntimeAdapter: AuthProviderRuntimeAdapter | null = null;
let membershipDirectoryRepository: MembershipDirectoryRepository | null = null;

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
    sourceOfTruth: "persistent_membership_store",
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

function createDefaultMembershipDirectoryRepository(): MembershipDirectoryRepository {
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
          sourceOfTruth: "external_directory_pending",
          confidence: input.isOperatorMode ? "admin_fallback" : "limited",
          runtimeMarker: "external_directory_pending",
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

export function getMembershipDirectoryRepository(): MembershipDirectoryRepository {
  if (!membershipDirectoryRepository) {
    membershipDirectoryRepository = createDefaultMembershipDirectoryRepository();
  }
  return membershipDirectoryRepository;
}

export function getMembershipDirectoryAdapter(): MembershipDirectoryAdapter {
  return getMembershipDirectoryRepository();
}

export function setAuthProviderRuntimeAdapterForTests(adapter: AuthProviderRuntimeAdapter | null) {
  authProviderRuntimeAdapter = adapter;
}

export function setMembershipDirectoryRepositoryForTests(adapter: MembershipDirectoryRepository | null) {
  membershipDirectoryRepository = adapter;
}

export function setMembershipDirectoryAdapterForTests(adapter: MembershipDirectoryAdapter | null) {
  setMembershipDirectoryRepositoryForTests(adapter);
}
