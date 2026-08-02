import "server-only";

import type {
  PersistentRateLimitInput,
  PersistentRateLimitResult,
} from "@/utils/persistentRateLimit";

export type PublicAuthRateLimiter = (
  input: PersistentRateLimitInput,
) => Promise<PersistentRateLimitResult>;

export async function loadPublicAuthRateLimiter(): Promise<PublicAuthRateLimiter | null> {
  if (process.env.NEXT_RUNTIME === "edge") return null;

  const module = await import("@/utils/persistentRateLimit");
  return typeof module.consumePersistentRateLimit === "function"
    ? module.consumePersistentRateLimit
    : null;
}
