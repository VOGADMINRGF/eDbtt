import "server-only";

import crypto from "node:crypto";
import { rateLimitOrThrow } from "@/utils/rateLimitHelpers";

const WINDOW_MS = 10 * 60_000;
const ADDRESS_LIMIT = 3;
const IP_LIMIT = 12;

export const PUBLIC_AUTH_RESPONSE_FLOOR_MS = 120;

export type PublicAuthMailControl = {
  allowed: boolean;
  startedAt: number;
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
    const [addressLimit, ipLimit] = await Promise.all([
      rateLimitOrThrow(
        `public-auth:${scope}:address:${addressKey}`,
        ADDRESS_LIMIT,
        WINDOW_MS,
        {
          salt: `public-auth-${scope}-address`,
        },
      ),
      rateLimitOrThrow(
        `public-auth:${scope}:ip:${ipKey}`,
        IP_LIMIT,
        WINDOW_MS,
        {
          salt: `public-auth-${scope}-ip`,
        },
      ),
    ]);
    return {
      allowed: addressLimit.ok && ipLimit.ok,
      startedAt,
    };
  } catch {
    return { allowed: false, startedAt };
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
