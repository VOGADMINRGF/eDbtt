import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth/sessionUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || !user.sessionValid) {
    return NextResponse.json({ ok: false, roles: [], actorRole: "member" }, { status: 200 });
  }

  const roles = (user.roles ?? []).map((r) => String(r).toLowerCase());
  const adminRoles = new Set(["admin", "superadmin", "owner"]);
  const editorRoles = new Set([
    "editor",
    "journalist",
    "redaktion",
    "moderator",
    "staff",
    "admin",
    "superadmin",
    "owner",
  ]);
  const actorRole = roles.some((r) => adminRoles.has(r))
    ? "admin"
    : roles.some((r) => editorRoles.has(r))
      ? "editor"
      : "member";

  return NextResponse.json(
    {
      ok: true,
      roles,
      actorRole,
    },
    { status: 200 },
  );
}
