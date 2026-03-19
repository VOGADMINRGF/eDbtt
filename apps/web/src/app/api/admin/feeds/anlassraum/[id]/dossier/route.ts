import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "@core/db/triMongo";
import { dossiersCol } from "@features/dossier/db";
import { anlassraumCol } from "@features/anlassraum/db";
import { canActorAccessAnlassraum } from "@features/anlassraum/governance";
import { DOSSIER_TYPES, type DossierType } from "@features/anlassraum/types";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  const { id } = await context.params;
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ ok: false, error: "invalid_anlassraum_id" }, { status: 400 });
  }
  const anlassraumId = new ObjectId(id);

  const roomCol = await anlassraumCol();
  const room = await roomCol.findOne({ _id: anlassraumId });
  if (!room) {
    return NextResponse.json({ ok: false, error: "anlassraum_not_found" }, { status: 404 });
  }
  if (!canActorAccessAnlassraum(room, gate.actor, "curate")) {
    return NextResponse.json({ ok: false, error: "forbidden_scope" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    dossierId?: string | null;
    dossierType?: string | null;
  };

  const dossierType = normalizeDossierType(body.dossierType);
  if (body.dossierType && !dossierType) {
    return NextResponse.json({ ok: false, error: "invalid_dossier_type" }, { status: 400 });
  }

  let resolvedDossierObjectId: ObjectId | null = null;
  let resolvedDossierId: string | null = null;
  if (body.dossierId) {
    const value = String(body.dossierId || "").trim();
    if (!value) {
      return NextResponse.json({ ok: false, error: "invalid_dossier_id" }, { status: 400 });
    }

    const dossiers = await dossiersCol();
    const dossier = ObjectId.isValid(value)
      ? await dossiers.findOne({ _id: new ObjectId(value) })
      : await dossiers.findOne({ $or: [{ dossierId: value }, { statementId: value }] } as any);

    if (!dossier?._id) {
      return NextResponse.json({ ok: false, error: "dossier_not_found" }, { status: 404 });
    }

    resolvedDossierObjectId = dossier._id;
    resolvedDossierId = dossier.dossierId;
  }

  await roomCol.updateOne(
    { _id: anlassraumId },
    {
      $set: {
        dossierId: resolvedDossierObjectId,
        dossierType: resolvedDossierObjectId ? dossierType ?? "exploration_dossier" : null,
        updatedAt: new Date(),
      },
    },
  );

  return NextResponse.json({
    ok: true,
    anlassraumId: anlassraumId.toHexString(),
    dossierId: resolvedDossierObjectId?.toHexString() ?? null,
    dossierRef: resolvedDossierId,
    dossierType: resolvedDossierObjectId ? dossierType ?? "exploration_dossier" : null,
  });
}

function normalizeDossierType(value?: string | null): DossierType | null {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return null;
  if (!DOSSIER_TYPES.includes(normalized as DossierType)) return null;
  return normalized as DossierType;
}
