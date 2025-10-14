import { NextResponse } from "next/server";
import { ensureGraph } from "@/graph";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const res = await ensureGraph(); // 👈 statt repo.ensureSchema()
  return NextResponse.json({ ok: true, ...res });
}
