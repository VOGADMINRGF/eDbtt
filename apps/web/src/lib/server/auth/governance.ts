import { NextRequest, NextResponse } from "next/server";
import type { GovernanceActor, GovernanceActorRole } from "@features/trust/types";
import { mapUserRolesToGovernanceRole } from "@features/trust/gates";
import { getOrgContext } from "./org";
import { userIsAdminDashboard } from "./roles";
import { getSessionUser, type SessionUser } from "./sessionUser";
import { sessionHasPassedTwoFactor, sessionSatisfiesProtectedTwoFactor, userRequiresTwoFactor } from "./twoFactor";

export type GovernanceAccess = {
  user: SessionUser;
  actor: GovernanceActor;
  roles: string[];
};

export async function requireGovernanceActorOrResponse(
  req: NextRequest,
): Promise<GovernanceAccess | Response> {
  const user = await getSessionUser(req);
  const sessionValid = user?.sessionValid ?? false;
  if (!user || !sessionValid) {
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

  const roles = collectRoles(user.roles, user.role);
  const isAdmin = userIsAdminDashboard(user);
  const actorRole = resolveGovernanceRole(roles, isAdmin);
  if (!actorRole) {
    return NextResponse.json({ ok: false, error: "forbidden_governance_role" }, { status: 403 });
  }

  const userId = user._id?.toHexString?.() ?? "";
  if (!userId) {
    return NextResponse.json({ ok: false, error: "missing_actor_id" }, { status: 400 });
  }

  const orgContext = await getOrgContext(userId).catch(() => null);
  const orgIds = Array.isArray(orgContext?.orgIds) ? orgContext.orgIds : [];
  const scopedOwnerIds = uniqueNonEmpty([userId, ...orgIds]);

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
  };
}

function resolveGovernanceRole(
  roles: string[],
  isAdmin: boolean,
): GovernanceActorRole | null {
  if (isAdmin) return "admin";
  const mapped = mapUserRolesToGovernanceRole(roles);
  if (mapped === "reviewer") return mapped;
  if (mapped === "editorial_actor") return mapped;
  if (mapped === "institutional_actor") return mapped;
  return null;
}

function collectRoles(
  roles: SessionUser["roles"] | null | undefined,
  role: SessionUser["role"] | null | undefined,
): string[] {
  const direct = Array.isArray(roles)
    ? roles.map((value) => String(value || "").trim()).filter(Boolean)
    : [];
  const fallback =
    typeof role === "string"
      ? role
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : [];
  return uniqueNonEmpty([...direct, ...fallback]).map((value) => value.toLowerCase());
}

function uniqueNonEmpty(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}
