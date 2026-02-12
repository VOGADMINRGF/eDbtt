// apps/web/src/utils/rateLimiter.ts
import { createClient } from "redis";
import { rateLimit as rateLimitUnified } from "./rateLimit";

type RLResult = {
  ok: boolean;
  remaining: number;
  resetSec: number;
  retryAfterSec?: number;
};

let redis: ReturnType<typeof createClient> | null = null;
if (process.env.REDIS_URL) {
  redis = createClient({ url: process.env.REDIS_URL });
  redis.connect().catch(() => {
    redis = null;
  });
}

// Fixed-Window: key = rl:{bucket}:{ip}
export async function rateLimit(
  ip: string,
  bucket: string,
  limitPerWindow: number,
  windowSec: number,
): Promise<RLResult> {
  const now = Math.floor(Date.now() / 1000);
  const resetSec = now + windowSec;

  if (redis) {
    const key = `rl:${bucket}:${ip}`;
    const c = await redis.incr(key);
    if (c === 1) await redis.expire(key, windowSec);
    const remaining = Math.max(0, limitPerWindow - c);
    if (c > limitPerWindow) {
      const ttl = await redis.ttl(key);
      return {
        ok: false,
        remaining: 0,
        resetSec: now + (ttl > 0 ? ttl : windowSec),
        retryAfterSec: ttl,
      };
    }
    return { ok: true, remaining, resetSec };
  }

  // Einheitlicher In-Memory-Fallback ueber die zentrale RL-Implementierung.
  const unified = await rateLimitUnified(`${bucket}:${ip}`, limitPerWindow, windowSec * 1000, {
    salt: "legacy-rateLimiter",
  });
  return {
    ok: unified.ok,
    remaining: unified.remaining,
    resetSec: Math.ceil(unified.resetAt / 1000),
    retryAfterSec: unified.ok ? undefined : Math.ceil(unified.retryIn / 1000),
  };
}
