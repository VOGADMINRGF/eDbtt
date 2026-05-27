import { NextRequest, NextResponse } from "next/server";
import {
  buildMaterialExtractionJobReadModel,
  createMaterialExtractionJob,
  type MaterialExtractionMode,
} from "@/features/material/materialExtractionJobs";
import { requireGovernanceActorOrResponse } from "@/lib/server/auth/governance";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function readStringList(params: URLSearchParams, key: string) {
  return params
    .getAll(key)
    .map((value) => value.trim())
    .filter(Boolean);
}

export async function GET(req: NextRequest) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  const params = req.nextUrl.searchParams;
  const limit = Number(params.get("limit") ?? 24);
  const organizationIds = readStringList(params, "organizationId");
  const regionIds = readStringList(params, "regionId");

  const readModel = await buildMaterialExtractionJobReadModel({
    organizationIds,
    regionIds,
    limit: Number.isFinite(limit) ? limit : 24,
  });

  return NextResponse.json({
    ok: true,
    readModel,
  });
}

type Body = {
  materialId?: string;
  extractionMode?: MaterialExtractionMode;
  dossierId?: string;
  anlassraumId?: string;
  approveCost?: boolean;
};

export async function POST(req: NextRequest) {
  const gate = await requireGovernanceActorOrResponse(req);
  if (gate instanceof Response) return gate;

  const body = (await req.json().catch(() => ({}))) as Body;
  const materialId = String(body.materialId ?? "").trim();
  const extractionMode = String(body.extractionMode ?? "").trim() as MaterialExtractionMode;
  const dossierId = String(body.dossierId ?? "").trim() || null;
  const anlassraumId = String(body.anlassraumId ?? "").trim() || null;
  const approveCost = body.approveCost === true;

  if (!materialId || !extractionMode) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  try {
    const created = await createMaterialExtractionJob({
      materialId,
      extractionMode,
      submittedBy: gate.actor.userId,
      dossierId,
      anlassraumId,
      approveCost,
    });

    return NextResponse.json({
      ok: true,
      job: created.job,
      persistence: created.persistence,
      message:
        "Extraktionsjob wurde review-first registriert. Es wurde weder automatisch veröffentlicht noch ein externer Kosten- oder DeepSearch-Pfad still gestartet.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "material_extraction_job_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
