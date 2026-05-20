import { NextRequest, NextResponse } from "next/server";
import type { GovernanceActor, GovernanceActorRole } from "@features/trust/types";
import { resolveRequestScopeContext, type RequestScopeContext } from "./requestScope";
import { sessionHasPassedTwoFactor, sessionSatisfiesProtectedTwoFactor, userRequiresTwoFactor } from "./twoFactor";

export type GovernanceAccess = {
  user: RequestScopeContext["user"];
  actor: GovernanceActor;
  roles: string[];
  requestScope: RequestScopeContext;
};

export async function requireGovernanceActorOrResponse(
  req: NextRequest,
  options: {
    regionId?: string | null;
    allowOperatorFallback?: boolean;
  } = {},
): Promise<GovernanceAccess | Response> {
  const requestScope = await resolveRequestScopeContext(req, options);
  const user = requestScope?.user ?? null;
  if (!requestScope || !user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const hasTwoFactorSetup = userRequiresTwoFactor(user);
  const hasProtectedTwoFactor = sessionSatisfiesProtectedTwoFactor(user);
  const hasDirectTwoFactor = sessionHasPassedTwoFactor(user);
  if (!hasTwoFactorSetup && !hasProtectedTwoFactor) {
    return NextResponse.json({ ok: false, error: "two_factor_setup_required" }, { status: 403 });
  }
  if (hasTwoFactorSetup && !hasDirectTwoFactor && !hasProtectedTwoFactor) {
    return NextResponse.json({ ok: false, error: "two_factor_required" }, { status: 403 });
  }

  const roles = requestScope.actor.roles;
  const isAdmin = requestScope.isOperatorMode;
  const actorRole = requestScope.actor.governanceRole;
  if (!actorRole) {
    return NextResponse.json({ ok: false, error: "forbidden_governance_role" }, { status: 403 });
  }

  const userId = requestScope.actorId;
  if (!userId) {
    return NextResponse.json({ ok: false, error: "missing_actor_id" }, { status: 400 });
  }

  const scopedOwnerIds = uniqueNonEmpty([
    userId,
    ...requestScope.organizationMembership.organizationIds,
  ]);

  return {
    user,
    roles,
    actor: {
      userId,
      role: actorRole,
      isAdmin,
      scopedOwnerIds,
      scopedEntityIds: scopedOwnerIds,
      personTrust: null,
    },
    requestScope,
  };
}

function uniqueNonEmpty(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}
