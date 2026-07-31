import "server-only";

import crypto from "node:crypto";
import { loadPublicAuthRateLimiter } from "@/utils/publicAuthRateLimitLoader";

const WINDOW_MS = 10 * 60_000;
const ADDRESS_LIMIT = 3;
const IP_LIMIT = 12;

export const PUBLIC_AUTH_RESPONSE_FLOOR_MS = 120;

export type PublicAuthMailControl = {
  allowed: boolean;
  startedAt: number;
  auditStatus:
    | "allowed"
    | "rate_limited"
    | "rate_limiter_unavailable";
};

function digest(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function requestIp(req: Request) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "0.0.0.0"
  );
}

export async function beginPublicAuthMailControl(
  req: Request,
  scope: "reset" | "verify",
  normalizedEmail: string,
): Promise<PublicAuthMailControl> {
  const startedAt = Date.now();
  const addressKey = digest(`${scope}:address:${normalizedEmail}`);
  const ipKey = digest(`${scope}:ip:${requestIp(req)}`);

  try {
    const limiter = await loadPublicAuthRateLimiter();
    if (!limiter) {
      console.error("[public-auth-mail-control] rate_limiter_unavailable", {
        auditStatus: "rate_limiter_unavailable",
        scope,
        category: "loader_null",
      });
      return {
        allowed: false,
        startedAt,
        auditStatus: "rate_limiter_unavailable",
      };
    }

    const [addressLimit, ipLimit] = await Promise.all([
      limiter({
        namespace: `public-auth:${scope}:address`,
        subjectHash: addressKey,
        limit: ADDRESS_LIMIT,
        windowMs: WINDOW_MS,
      }),
      limiter({
        namespace: `public-auth:${scope}:ip`,
        subjectHash: ipKey,
        limit: IP_LIMIT,
        windowMs: WINDOW_MS,
      }),
    ]);
    const allowed = addressLimit.ok && ipLimit.ok;
    return {
      allowed,
      startedAt,
      auditStatus: allowed ? "allowed" : "rate_limited",
    };
  } catch (error) {
    console.error("[public-auth-mail-control] rate_limiter_unavailable", {
      auditStatus: "rate_limiter_unavailable",
      scope,
      category: "loader_or_storage_error",
      error: error instanceof Error ? error.name : "unknown",
    });
    return {
      allowed: false,
      startedAt,
      auditStatus: "rate_limiter_unavailable",
    };
  }
}

export async function finishPublicAuthMailControl(
  control: PublicAuthMailControl,
) {
  const remaining = PUBLIC_AUTH_RESPONSE_FLOOR_MS - (Date.now() - control.startedAt);
  if (remaining > 0) {
    await new Promise<void>((resolve) => setTimeout(resolve, remaining));
  }
}
