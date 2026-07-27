export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import {
  createMarketingDelegation,
  getMarketingDelegationPersistenceState,
  listMarketingDelegations,
} from "@/features/marketing/delegations/repository";

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  return NextResponse.json({
    ok: true,
    delegations: await listMarketingDelegations(),
    persistence: getMarketingDelegationPersistenceState(),
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  try {
    const payload = await req.json();
    const delegation = await createMarketingDelegation({
      ...payload,
      requestedByUserId: String(gate._id),
    });

    return NextResponse.json({ ok: true, delegation }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { ok: false, error: "invalid_marketing_delegation", details: error.issues },
        { status: 400 },
      );
    }
    if (error instanceof SyntaxError) {
      return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
    }
    if (error instanceof Error && error.message === "marketing_delegation_item_not_found") {
      return NextResponse.json({ ok: false, error: error.message }, { status: 404 });
    }
    if (error instanceof Error && error.message === "marketing_delegation_actor_required") {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: false, error: "marketing_delegation_failed" }, { status: 500 });
  }
}
