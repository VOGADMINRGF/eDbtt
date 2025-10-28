// apps/web/src/middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** Zugriff für Journalist:innen/Editor:innen/Admins */
export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  if (url.pathname.startsWith("/contributions/analyze")) {
    const role = req.cookies.get("u_role")?.value || "guest";
    const allowed = new Set(["editor", "admin", "journalist"]);
    if (!allowed.has(role)) {
      url.pathname = "/contributions/new";
      return NextResponse.redirect(url);
    }
  }
  // nichts zurückgeben => Request läuft weiter
}
