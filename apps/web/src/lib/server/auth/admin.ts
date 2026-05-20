import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "./sessionUser";
import { resolveRequestScopeContext, type RequestScopeContext } from "./requestScope";
import { sessionHasPassedTwoFactor, sessionSatisfiesProtectedTwoFactor, userRequiresTwoFactor } from "./twoFactor";
import { userIsAdminDashboard, userIsSuperadmin } from "./roles";

export { userIsAdminDashboard, userIsSuperadmin } from "./roles";

export async function requireAdminOrThrow(req: NextRequest) {
  const gate = await gateAdmin(req);
  if (gate instanceof Response) throw new Error("forbidden");
  return gate;
}

export async function requireAdminOrResponse(req: NextRequest) {
  const gate = await gateAdmin(req);
  if (gate instanceof Response) return gate;
  return gate;
}

async function gateAdmin(
  req: NextRequest,
): Promise<(SessionUser & { requestScope: RequestScopeContext }) | Response> {
  const requestScope = await resolveRequestScopeContext(req, { allowOperatorFallback: true });
  const user = requestScope?.user ?? null;
  const sessionValid = user?.sessionValid ?? false;
  const isAdmin = requestScope?.isOperatorMode ?? userIsAdminDashboard(user);
  const hasTwoFactorSetup = userRequiresTwoFactor(user);
  const hasDirectTwoFactor = sessionHasPassedTwoFactor(user);
  const hasProtectedTwoFactor = sessionSatisfiesProtectedTwoFactor(user);

  if (!user || !sessionValid) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  // Admin access requires 2FA setup + a session that has passed 2FA.
  if (!hasTwoFactorSetup && !hasProtectedTwoFactor) {
    return NextResponse.json({ ok: false, error: "two_factor_setup_required" }, { status: 403 });
  }

  if (hasTwoFactorSetup && !hasDirectTwoFactor && !hasProtectedTwoFactor) {
    return NextResponse.json({ ok: false, error: "two_factor_required" }, { status: 403 });
  }

  return Object.assign(user, { requestScope });
}
