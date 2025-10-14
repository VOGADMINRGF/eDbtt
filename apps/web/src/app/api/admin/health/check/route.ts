export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { runSystemMatrix } from "@/server/health";

async function isAdmin() {
  const c = await cookies();
  return c.get("u_role")?.value === "admin";
}

export async function POST() {
  if (!(await isAdmin()))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const services = await runSystemMatrix();
  return NextResponse.json({ ts: new Date().toISOString(), services });
}
