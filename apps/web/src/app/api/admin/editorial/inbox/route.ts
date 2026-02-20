import { NextRequest, NextResponse } from "next/server";
import { coreCol } from "@core/db/triMongo";
import type { EditorialInboxItem } from "@features/dossier/infra/types";
import { requireDossierEditor } from "@/lib/server/auth/dossier";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const INBOX = "dossier_editorial_inbox";

export async function GET(req: NextRequest) {
  const gate = await requireDossierEditor(req);
  if (gate instanceof Response) return gate;

  const col = await coreCol<EditorialInboxItem>(INBOX);
  const items = await col
    .find({})
    .sort({ createdAt: -1, _id: -1 })
    .limit(200)
    .toArray();

  return NextResponse.json({ ok: true, items }, { status: 200 });
}
