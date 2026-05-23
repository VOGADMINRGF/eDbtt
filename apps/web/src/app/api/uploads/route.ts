// apps/web/src/app/api/uploads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { buildMaterialIntakeContract, type MaterialIntakeInputItem } from "@/features/material/materialIntakeContract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function materialItemFromFile(file: File, index: number): MaterialIntakeInputItem {
  return {
    id: `upload-${index + 1}`,
    kind: "upload_document",
    label: file.name || `Upload ${index + 1}`,
    url: null,
    uploadId: `upload-${index + 1}`,
    mimeType: file.type || null,
    fileName: file.name || null,
    text: null,
    pageRef: null,
    timestampRef: null,
    extractedBy: null,
    extractionStatus: "none",
  };
}

export async function POST(req: NextRequest) {
  const fd = await req.formData();
  const files = fd.getAll("files") as File[];
  const materialItems = files.map(materialItemFromFile);
  const materialIntake = buildMaterialIntakeContract({
    items: materialItems,
    productionTruth: false,
    storageMode: "local_pending",
  });
  // -> hier zu S3/GCS o.ä. speichern (lokales fs ist in serverless nicht tragfähig)
  return NextResponse.json({
    ok: true,
    storageMode: "local_pending",
    productionTruth: false,
    message:
      "Upload-Metadaten wurden angenommen. Es wurde kein Scan, keine Extraktion, keine KI-Recherche und keine Veröffentlichung automatisch gestartet.",
    files: files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
    materialIntake,
  });
}
