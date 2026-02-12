import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, type SessionUser } from "./sessionUser";
import { sessionHasPassedTwoFactor, userRequiresTwoFactor } from "./twoFactor";
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

async function gateAdmin(req: NextRequest): Promise<SessionUser | Response> {
  const user = await getSessionUser(req);
  const sessionValid = user?.sessionValid ?? false;
  const isAdmin = userIsAdminDashboard(user);
  const hasTwoFactorSetup = userRequiresTwoFactor(user);
  const hasTwoFactor = sessionHasPassedTwoFactor(user);

  logGate(req?.nextUrl?.pathname ?? "unknown", {
    userId: user?._id ? String(user._id) : null,
    email: maskEmail((user as any)?.email),
    roles: (user as any)?.roles || (user as any)?.role,
    sessionValid,
    isAdmin,
    hasTwoFactorSetup,
    hasTwoFactor,
  });

  if (!user || !sessionValid) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (!isAdmin) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  // Admin access requires 2FA setup + a session that has passed 2FA.
  if (!hasTwoFactorSetup) {
    return NextResponse.json({ ok: false, error: "two_factor_setup_required" }, { status: 403 });
  }

  if (!hasTwoFactor) {
    return NextResponse.json({ ok: false, error: "two_factor_required" }, { status: 403 });
  }

  return user;
}

function maskEmail(email?: string | null) {
  if (!email) return null;
  const [name, domain] = email.split("@");
  if (!domain) return email;
  const head = name.slice(0, 2);
  return `${head}${name.length > 2 ? "***" : ""}@${domain}`;
}

function logGate(path: string, payload: Record<string, unknown>) {
  try {
    console.log("[admin-gate]", { path, ...payload });
  } catch {
    // no-op
  }
}
