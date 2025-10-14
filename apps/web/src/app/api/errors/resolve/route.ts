import { NextRequest, NextResponse } from "next/server";
import ErrorLogModel from "@/models/ErrorLog";

export async function POST(req: NextRequest) {
  const { _id, traceId, resolved } = await req.json();

  const query: any = _id ? { _id } : { traceId };
  const updated = await ErrorLogModel.findOneAndUpdate(
    query,
    { resolved: Boolean(resolved) },
    { new: true },
  );

  if (!updated) {
    return NextResponse.json(
      { ok: false, error: "Fehler nicht gefunden" },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true });
}
