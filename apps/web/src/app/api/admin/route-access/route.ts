// apps/web/src/app/api/admin/route-access/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  return NextResponse.json(
    {
      ok: false,
      error: "deprecated: route access policies are managed via /admin/access",
    },
    { status: 410 },
  );
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  return NextResponse.json(
    {
      ok: false,
      error: "deprecated: route access policies are managed via /admin/access",
    },
    { status: 410 },
  );
}
