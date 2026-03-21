import { NextRequest, NextResponse } from "next/server";
import {
  listAnlassraumOperations,
  normalizeAnlassraumOperationsQuery,
} from "@/features/anlassraumOperationsRead";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";

export async function GET(req: NextRequest) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  try {
    const query = normalizeAnlassraumOperationsQuery(req.nextUrl.searchParams);
    const result = await listAnlassraumOperations({
      actor: gate.actor,
      query,
    });

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "anlassraum_operations_failed";
    const status =
      message === "invalid_anlassraum_operations_status" ||
      message === "invalid_anlassraum_operations_scope"
        ? 400
        : message === "actor_scope_forbidden"
        ? 403
        : 500;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
