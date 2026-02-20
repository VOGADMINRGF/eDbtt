import { NextRequest, NextResponse } from "next/server";
import { coreCol } from "@core/db/triMongo";
import demoDossier from "@features/dossier/data/demoDossier";
import type { MaterialLink, StoredDossier } from "@features/dossier/infra/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DOSSIER_STORE = "dossier_store";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: RouteParams) {
  const { id: rawId } = await params;
  const id = rawId ?? "demo";
  if (id === "demo" || id === demoDossier.meta.id) {
    return NextResponse.json({ ok: true, dossier: demoDossier, materialLinks: [] }, { status: 200 });
  }

  try {
    const col = await coreCol<StoredDossier>(DOSSIER_STORE);
    const doc = await col.findOne({ dossierId: id });
    if (!doc?.dossier) {
      return NextResponse.json({ ok: false, error: "dossier_not_found" }, { status: 404 });
    }
    let materialLinks: MaterialLink[] = [];
    try {
      const linksCol = await coreCol<MaterialLink>("dossier_material_links");
      materialLinks = await linksCol
        .find({ dossierId: id })
        .sort({ createdAt: -1, _id: -1 })
        .limit(100)
        .toArray();
    } catch {
      materialLinks = [];
    }
    return NextResponse.json({ ok: true, dossier: doc.dossier, materialLinks }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "dossier_load_failed" }, { status: 500 });
  }
}
