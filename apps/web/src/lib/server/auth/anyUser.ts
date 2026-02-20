import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "./sessionUser";
import type { DossierActorRole } from "@features/dossier/schemas";

type AnyUserAuth = {
  userId: string;
  actorRole: DossierActorRole;
  roles: string[];
};

const ADMIN_ROLES = new Set(["admin", "superadmin", "owner"]);
const EDITOR_ROLES = new Set([
  "editor",
  "journalist",
  "redaktion",
  "moderator",
  "staff",
  "admin",
  "superadmin",
  "owner",
]);

function normalizeRoles(roles: Array<string | null | undefined> | null | undefined): string[] {
  if (!Array.isArray(roles)) return [];
  return roles.map((r) => String(r).toLowerCase()).filter(Boolean);
}

function resolveActorRole(roles: string[]): DossierActorRole {
  if (roles.some((r) => ADMIN_ROLES.has(r))) return "admin";
  if (roles.some((r) => EDITOR_ROLES.has(r))) return "editor";
  return "member";
}

export async function requireAnyUser(req: NextRequest): Promise<AnyUserAuth | Response> {
  const user = await getSessionUser(req);
  if (!user || !user.sessionValid) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const roles = normalizeRoles(user.roles ?? []);
  const actorRole = resolveActorRole(roles);
  return {
    userId: String(user._id),
    actorRole,
    roles,
  };
}
