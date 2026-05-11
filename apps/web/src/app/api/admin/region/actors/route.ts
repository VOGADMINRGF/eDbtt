import { NextRequest, NextResponse } from "next/server";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";
import {
  listRegionalActorRegister,
  saveRegionalActorRegisterEntry,
  type RegionalActorRegisterQuery,
} from "@features/region";

function parseQuery(req: NextRequest): RegionalActorRegisterQuery {
  const search = req.nextUrl.searchParams;
  return {
    regionId: search.get("regionId"),
    actorType: (search.get("actorType") as RegionalActorRegisterQuery["actorType"]) ?? "all",
    verificationStatus:
      (search.get("verificationStatus") as RegionalActorRegisterQuery["verificationStatus"]) ?? "all",
    sourceKind: (search.get("sourceKind") as RegionalActorRegisterQuery["sourceKind"]) ?? "all",
    limit: search.get("limit") ? Number(search.get("limit")) : undefined,
  };
}

export async function GET(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  const items = await listRegionalActorRegister(parseQuery(req));
  return NextResponse.json({ ok: true, items });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdminOrResponse(req);
  if (gate instanceof Response) return gate;

  try {
    const body = await req.json();
    const actor = await saveRegionalActorRegisterEntry(body);
    return NextResponse.json({ ok: true, actor });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "regional_actor_upsert_failed" },
      { status: 400 },
    );
  }
}
