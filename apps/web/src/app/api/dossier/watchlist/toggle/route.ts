import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { coreCol } from "@core/db/triMongo";
import type { WatchlistEntry } from "@features/dossier/infra/types";
import { requireAnyUser } from "@/lib/server/auth/anyUser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = { dossierId?: string };

const COL = "dossier_watchlists";

export async function POST(req: NextRequest) {
  const gate = await requireAnyUser(req);
  if (gate instanceof Response) return gate;

  const body = (await req.json().catch(() => ({}))) as Body;
  const dossierId = String(body.dossierId ?? "").trim();
  if (!dossierId) {
    return NextResponse.json({ ok: false, error: "missing_dossierId" }, { status: 400 });
  }

  const col = await coreCol<WatchlistEntry>(COL);
  const existing = await col.findOne({ userId: gate.userId, dossierId });

  if (existing) {
    await col.deleteOne({ entryId: existing.entryId });
    return NextResponse.json({ ok: true, watching: false }, { status: 200 });
  }

  const now = new Date().toISOString();
  const entry: WatchlistEntry = {
    entryId: `wl_${crypto.randomUUID()}`,
    userId: gate.userId,
    dossierId,
    createdAt: now,
  };
  await col.insertOne(entry as any);
  return NextResponse.json({ ok: true, watching: true }, { status: 200 });
}
