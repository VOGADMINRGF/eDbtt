// apps/web/src/app/api/admin/route-access/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { userIsAdminDashboard } from "@/lib/server/auth/roles";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user?.sessionValid) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!userIsAdminDashboard(user)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json(
    {
      ok: false,
      error: "deprecated: route access policies are managed via /admin/access",
    },
    { status: 410 },
  );
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user?.sessionValid) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!userIsAdminDashboard(user)) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json(
    {
      ok: false,
      error: "deprecated: route access policies are managed via /admin/access",
    },
    { status: 410 },
  );
}
