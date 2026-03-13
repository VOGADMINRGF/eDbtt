import { NextRequest, NextResponse } from "next/server";
import { buildNewsroomEmbedBundle } from "@features/embed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function read(value: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const dossierId = read(searchParams.get("dossierId"));
  if (!dossierId) {
    return NextResponse.json(
      { ok: false, error: "missing_dossier_id", code: "missing_dossier_id" },
      { status: 400 },
    );
  }

  const anchorId = read(searchParams.get("anchorId"));
  const medium = read(searchParams.get("medium"));
  const format = read(searchParams.get("format"));
  const publishedAt = read(searchParams.get("publishedAt"));
  const cta = read(searchParams.get("cta"));
  const bundle = buildNewsroomEmbedBundle({
    dossierId,
    anchorId,
    medium,
    format,
    publishedAt,
    cta,
  });

  return NextResponse.json({
    ok: true,
    data: {
      ...bundle,
      rule: "open_dossier_only",
    },
  });
}
