import { NextRequest, NextResponse } from "next/server";
import { coreCol } from "@core/db/triMongo";
import type { WatchlistEntry } from "@features/dossier/infra/types";
import { requireAnyUser } from "@/lib/server/auth/anyUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COL = "dossier_watchlists";

export async function GET(req: NextRequest) {
  const gate = await requireAnyUser(req);
  if (gate instanceof Response) return gate;

  const col = await coreCol<WatchlistEntry>(COL);
  const items = await col
    .find({ userId: gate.userId })
    .sort({ createdAt: -1, _id: -1 })
    .limit(200)
    .toArray();

  return NextResponse.json({ ok: true, items }, { status: 200 });
}
