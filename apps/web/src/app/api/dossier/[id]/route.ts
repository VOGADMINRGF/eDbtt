import { NextRequest, NextResponse } from "next/server";
import { coreCol } from "@core/db/triMongo";
import demoDossier from "@features/dossier/data/demoDossier";
import type { StoredDossier } from "@features/dossier/infra/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DOSSIER_STORE = "dossier_store";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: RouteParams) {
  const { id: rawId } = await params;
  const id = rawId ?? "demo";
  if (id === "demo" || id === demoDossier.meta.id) {
    return NextResponse.json({ ok: true, dossier: demoDossier }, { status: 200 });
  }

  try {
    const col = await coreCol<StoredDossier>(DOSSIER_STORE);
    const doc = await col.findOne({ dossierId: id });
    if (!doc?.dossier) {
      return NextResponse.json({ ok: false, error: "dossier_not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, dossier: doc.dossier }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "dossier_load_failed" }, { status: 500 });
  }
}
