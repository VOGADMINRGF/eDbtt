import { NextRequest, NextResponse } from "next/server";
import { isSupportedLocale } from "@/config/locales";
import { rateLimitHeaders } from "@/utils/rateLimitHelpers";
import { rateLimitPublic } from "@/utils/publicRateLimit";

const EMBED_RATE_LIMIT = { limit: 60, windowMs: 60 * 1000 };
const REQUEST_LOCALE_HEADER = "x-edebatte-locale";

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.startsWith("/static")) {
    return allowNext(req);
  }

  if (pathname.startsWith("/embed/dossier/")) {
    const rl = await rateLimitPublic(req, EMBED_RATE_LIMIT.limit, EMBED_RATE_LIMIT.windowMs, "embed:dossier");
    if (!rl.ok) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: rateLimitHeaders(rl) });
    }
    return allowNext(req);
  }

  if (pathname.startsWith("/embed/topic/") || pathname.startsWith("/embed/round/")) {
    const rl = await rateLimitPublic(req, EMBED_RATE_LIMIT.limit, EMBED_RATE_LIMIT.windowMs, "embed:topic-round");
    if (!rl.ok) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: rateLimitHeaders(rl) });
    }
    return allowNext(req);
  }

  if (!pathname.startsWith("/api")) {
    return allowNext(req);
  }

  if (pathname.startsWith("/api/auth")) {
    return allowNext(req);
  }

  if (pathname === "/api/access/check") {
    return allowNext(req);
  }

  try {
    const checkUrl = new URL("/api/access/check", req.url);
    checkUrl.searchParams.set("path", pathname);
    const checkRes = await fetch(checkUrl, {
      headers: {
        cookie: req.headers.get("cookie") ?? "",
      },
    });
    const body = (await checkRes.json().catch(() => null)) as {
      decision?: "allowed" | "login_required" | "forbidden";
    } | null;
    if (body?.decision === "allowed") {
      return allowNext(req);
    }
    if (body?.decision === "login_required") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (body?.decision === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  } catch {
    return allowNext(req);
  }

  return allowNext(req);
}

function allowNext(req: NextRequest) {
  const requestedLocale = req.nextUrl.searchParams.get("lang");
  if (!isSupportedLocale(requestedLocale)) {
    return (NextResponse as any).next();
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(REQUEST_LOCALE_HEADER, requestedLocale);
  const response = (NextResponse as any).next({
    request: {
      headers: requestHeaders,
    },
  });
  response.cookies.set("lang", requestedLocale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: req.nextUrl.protocol === "https:",
  });
  return response;
}

export const config = {
  matcher: [
    "/api/:path*",
    "/embed/dossier/:path*",
    "/embed/topic/:path*",
    "/embed/round/:path*",
    {
      source: "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
      has: [{ type: "query", key: "lang" }],
    },
  ],
};
