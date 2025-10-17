import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  if (req.method === "OPTIONS") return NextResponse.next();
  if (req.nextUrl.pathname === "/statements/new") {
    const url = req.nextUrl.clone();
    url.pathname = "/contributions/new";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
