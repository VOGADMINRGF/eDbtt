import { NextRequest, NextResponse } from "next/server";
import { rateLimitHeaders } from "@/utils/rateLimitHelpers";
import { rateLimitPublic } from "@/utils/publicRateLimit";

const EMBED_RATE_LIMIT = { limit: 60, windowMs: 60 * 1000 };

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname.startsWith("/static")) {
    return allowNext();
  }

  if (pathname.startsWith("/embed/dossier/")) {
    const rl = await rateLimitPublic(req, EMBED_RATE_LIMIT.limit, EMBED_RATE_LIMIT.windowMs, "embed:dossier");
    if (!rl.ok) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: rateLimitHeaders(rl) });
    }
    return allowNext();
  }

  if (pathname.startsWith("/embed/topic/") || pathname.startsWith("/embed/round/")) {
    const rl = await rateLimitPublic(req, EMBED_RATE_LIMIT.limit, EMBED_RATE_LIMIT.windowMs, "embed:topic-round");
    if (!rl.ok) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: rateLimitHeaders(rl) });
    }
    return allowNext();
  }

  if (!pathname.startsWith("/api")) {
    return allowNext();
  }

  if (pathname.startsWith("/api/auth")) {
    return allowNext();
  }

  if (pathname === "/api/access/check") {
    return allowNext();
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
      return allowNext();
    }
    if (body?.decision === "login_required") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (body?.decision === "forbidden") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
  } catch {
    return allowNext();
  }

  return allowNext();
}

function allowNext() {
  return (NextResponse as any).next();
}

export const config = {
  matcher: ["/api/:path*", "/embed/dossier/:path*", "/embed/topic/:path*", "/embed/round/:path*"],
};
