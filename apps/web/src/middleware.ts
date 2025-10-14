// apps/web/src/middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { ADMIN_ROLES, isPublic, isVerifiedPath, isLocationOnboarding } from "@/lib/auth/roles";

// ---------- Gates / Paths ----------
const ONBOARD_LOCATION_PATH = "/auth/onboarding/location";

// ---------- Dev-Bypass nur für Gates ----------
const DEV_BYPASS_GATES = process.env.NODE_ENV !== "production";
const RL_WINDOW = 60; // s
const RL_MAX = 120;   // req/min/IP

async function rateLimit(ip: string) {
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) return { ok: true, skipped: true as const };

    const key = `rl:${ip}`;
    const body = JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, String(RL_WINDOW)],
    ]);

    const r = await fetch(`${url}/pipeline`, {
      method: "POST",
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body,
    });

    if (!r.ok) return { ok: true, skipped: true as const };
    const json = (await r.json()) as Array<{ result: number }>;
    const count = Number(json?.[0]?.result ?? 0);
    return { ok: count <= RL_MAX, skipped: false as const, count };
  } catch {
    return { ok: true, skipped: true as const };
  }
}

// ---------- CSRF (double-submit) ----------
const CSRF_COOKIE = "csrf-token";
const CSRF_HEADER = "x-csrf-token";

const isApi = (req: NextRequest) => req.nextUrl.pathname.startsWith("/api/");
const isStateChanging = (method: string) =>
  method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";

// ---------- Small utils (Edge crypto, no Node Buffer) ----------
function b64url(bytes: Uint8Array) {
  let base64: string;
  const g = globalThis as any;
  if (typeof g.Buffer !== "undefined" && typeof g.Buffer.from === "function") {
    base64 = g.Buffer.from(bytes).toString("base64");
  } else {
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    base64 = btoa(bin);
  }
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function nonce16() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return b64url(bytes);
}

// ---------- Middleware ----------
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  if (req.method === "OPTIONS") return NextResponse.next();

  // Antwortobjekt früh erzeugen (für Headers/Cookies)
  const res = NextResponse.next();
  const rid = crypto.randomUUID();
  res.headers.set("X-Request-Id", rid);

  // 0) Gates (Admin/Verified/Location) – in DEV optional ausknipsen
  if (!DEV_BYPASS_GATES) {
    // Admin coarse gate (cookie-basiert)
    if (pathname.startsWith("/admin")) {
      const role = req.cookies.get("u_role")?.value ?? "";
      if (!ADMIN_ROLES.has(role as any)) {
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("next", pathname + (search || ""));
        url.searchParams.set("reason", "admin-only");
        return NextResponse.redirect(url);
      }
    }

    // Verified-only Gate (für bestimmte Seiten)
    if (isVerifiedPath(pathname)) {
      const isVerified = req.cookies.get("u_verified")?.value === "1";
      const uid = req.cookies.get("u_id")?.value;
      if (!uid || !isVerified) {
        const url = req.nextUrl.clone();
        url.pathname = "/login";
        url.searchParams.set("next", pathname + (search || ""));
        url.searchParams.set("reason", "verified-only");
        return NextResponse.redirect(url);
      }
    }

    // Location-Onboarding Gate
    const needsLoc = req.cookies.get("u_loc")?.value !== "1";
    if (!isPublic(pathname) && needsLoc && !isLocationOnboarding(pathname)) {
      const url = req.nextUrl.clone();
      url.pathname = ONBOARD_LOCATION_PATH;
      return NextResponse.redirect(url);
    }
  } else {
    // sichtbare Markierung im Dev-Betrieb
    res.headers.set("X-Dev-Bypass", "gates");
  }

  // 1) Rate limit (nur API sinnvoll)
  if (isApi(req)) {
    const ip =
      // Next (Node adapter) füllt .ip, Edge oft nicht:
      (req as any).ip ||
      req.headers.get("x-real-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "0.0.0.0";

    const rl = await rateLimit(ip);
    if (!rl.ok) {
      return new NextResponse("Too Many Requests", {
        status: 429,
        headers: { "X-Request-Id": rid },
      });
    }
    if (rl.skipped) {
      res.headers.set("X-RateLimit-Policy", "skip(no-store)");
    } else {
      res.headers.set("X-RateLimit-Policy", `window=${RL_WINDOW}s; max=${RL_MAX}`);
      res.headers.set("X-RateLimit-Remaining", String(Math.max(0, RL_MAX - (rl.count ?? 0))));
    }
  }

  // 2) CSP + Nonce
  const prod = process.env.NODE_ENV === "production";
const nonce = nonce16();
res.headers.set("x-csp-nonce", nonce);

if (isApi(req)) {
  const cspApi = [
    "default-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'none'",
    "object-src 'none'",
    "img-src 'none'",
    "font-src 'none'",
    "style-src 'none'",
    "script-src 'none'",
    "connect-src 'self'",
  ].join("; ");
  res.headers.set("Content-Security-Policy", cspApi);
} else {
  const cspHtml = prod
    ? [
        "default-src 'self'",
        // in Prod ohne eval; 'self' reicht für Next-Assets
        `script-src 'self' 'nonce-${nonce}'`,
        "style-src 'self'",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data:",
        "connect-src 'self' https:",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "object-src 'none'",
      ].join("; ")
    : [
        "default-src 'self'",
        // Dev: HMR/Refresh braucht eval + inline, außerdem blob: (SourceMaps)
        "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob: data:",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data:",
        "connect-src 'self' https: ws: wss:",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "object-src 'none'",
      ].join("; ");
  res.headers.set("Content-Security-Policy", cspHtml);
}
  // 3) CSRF (Double-submit nur für mutierende API-Calls, Export ausgenommen)
  if (
    isApi(req) &&
    isStateChanging(req.method.toUpperCase()) &&
    !req.nextUrl.pathname.startsWith("/api/gdpr/export")
  ) {
    const headerToken = req.headers.get(CSRF_HEADER) || "";
    const cookieToken = req.cookies.get(CSRF_COOKIE)?.value || "";
    if (!headerToken || !cookieToken || headerToken !== cookieToken) {
      return new NextResponse("Forbidden (CSRF)", {
        status: 403,
        headers: { "X-Request-Id": rid },
      });
    }
  }

  // 4) CSRF-Cookie bereitstellen (nicht HttpOnly, damit Double-Submit am Client möglich)
  if (!req.cookies.get(CSRF_COOKIE)?.value) {
    const token = nonce16();
    res.cookies.set({
      name: CSRF_COOKIE,
      value: token,
      httpOnly: false,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 12, // 12h
    });
  }

  // 5) Security-Header baseline
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "geolocation=(), camera=(), microphone=()");
  if (prod) {
    res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  return res;
}

// nur relevante Pfade – Next internals/Assets ausschließen
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
