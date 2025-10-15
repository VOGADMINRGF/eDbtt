import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
export function middleware(_req: NextRequest) {
  if (_req.method === "OPTIONS") return NextResponse.next();
  return NextResponse.next();
}
export const config = { matcher: ["/api/:path*"] };
