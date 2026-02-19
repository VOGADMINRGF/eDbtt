import { NextResponse } from "next/server";
import demoDossier from "@features/dossier/data/demoDossier";

export const runtime = "nodejs";

function withDemoEnvelope() {
  return {
    ok: true,
    serverTimestamp: new Date().toISOString(),
    dossier: demoDossier,
  };
}

export async function GET() {
  return NextResponse.json(withDemoEnvelope(), { status: 200 });
}
