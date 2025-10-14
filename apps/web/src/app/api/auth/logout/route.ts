import { NextResponse } from "next/server";
export async function POST() {
  const res = NextResponse.json({ ok: true });
  for (const c of ["session", "u_id", "u_role", "u_verified", "u_loc"]) {
    res.cookies.set(c, "", { path: "/", maxAge: 0 });
  }
  return res;
}
