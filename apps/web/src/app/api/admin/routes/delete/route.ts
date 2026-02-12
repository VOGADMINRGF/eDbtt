// apps/web/src/app/api/admin/routes/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  return NextResponse.json(
    {
      ok: false,
      error: "deprecated: deleting app routes via API is disabled",
    },
    { status: 410 },
  );
}
