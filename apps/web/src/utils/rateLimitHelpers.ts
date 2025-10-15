// apps/web/src/utils/rateLimitHelpers.ts
import type { NextRequest } from "next/server";
import { rateLimit, type RateLimitResult } from "src/utils/rateLimit";

export function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  // Next.js dev-fallbacks:
  // @ts-ignore
  return (req as any).ip || "0.0.0.0";
}

export async function rateLimitFromRequest(
  req: NextRequest,
  limit: number,
  windowMs: number,
  opts?: { salt?: string; scope?: string }
): Promise<RateLimitResult> {
  const ip = getClientIp(req);
  const { pathname, search } = new URL(req.url);
  // Scope bindet IP + Route + Methode (keine UA-Fragmentierung)
  const scope = opts?.scope ?? `${req.method}:${pathname}`;
  const key = `${ip}:${scope}`;
  return rateLimit(key, limit, windowMs, { salt: opts?.salt });
}

export function rateLimitHeaders(rl: RateLimitResult) {
  const h: Record<string, string> = {
    "X-RateLimit-Limit": String(rl.limit),
    "X-RateLimit-Remaining": String(rl.remaining),
    "X-RateLimit-Reset": String(Math.ceil(rl.resetAt / 1000)), // epoch-seconds
  };
  if (!rl.ok && rl.retryIn > 0) h["Retry-After"] = String(Math.ceil(rl.retryIn / 1000));
  return h;
}
