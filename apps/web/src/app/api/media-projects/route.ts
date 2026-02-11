import { NextResponse } from "next/server";
import { listMediaProjects } from "@core/mediaProjects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const projects = await listMediaProjects({ status: "active" });
  return NextResponse.json({ ok: true, projects });
}
