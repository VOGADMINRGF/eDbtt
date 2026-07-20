import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CANONICAL_ENDPOINT = "/api/contributions/save";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: "route_gone",
      route: "/api/contributions/ingest",
      canonicalEndpoint: CANONICAL_ENDPOINT,
      message:
        "Dieser Legacy-Endpunkt wurde entfernt. Nutze den kanonischen Beitragsspeicherpfad /api/contributions/save.",
    },
    { status: 410 },
  );
}
