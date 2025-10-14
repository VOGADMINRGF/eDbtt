import { env } from "@/utils/env";
// apps/web/src/app/api/csrf/route.ts
import { NextRequest, NextResponse } from "next/server";

const CSRF_COOKIE = "csrf-token";
// Route handler runs on Node by default; no edge-only restrictions here.
export async function GET(req: NextRequest) {
  const res = NextResponse.json(null, {
    status: 204,
    headers: { "Cache-Control": "no-store" },
  });

  let token = req.cookies.get(CSRF_COOKIE)?.value;
  if (!token) {
    // Create one if middleware hasn’t set it yet (e.g., calling this route directly)
    // Use Web Crypto for portability
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    token = Buffer.from(bytes).toString("base64url");
    res.cookies.set({
      name: CSRF_COOKIE,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 12, // 12h
    });
  }

  // Expose the token via a response header so the client can echo it on state-changing calls.
  res.headers.set(CSRF_HEADER, token);
  return res;
}
