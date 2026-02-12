// apps/web/src/app/api/admin/routes/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/auth/sessionUser";
import { userIsAdminDashboard } from "@/lib/server/auth/roles";

export const runtime = "nodejs";

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
      error: "deprecated: deleting app routes via API is disabled",
    },
    { status: 410 },
  );
}
