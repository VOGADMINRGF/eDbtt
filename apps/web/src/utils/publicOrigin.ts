// apps/web/src/utils/publicOrigin.ts
import { BRAND } from "@/lib/brand";

export function publicOrigin(): string {
  const envOrigin =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_ORIGIN ||
    process.env.PUBLIC_BASE_URL ||
    "";
  const trimmed = envOrigin.trim();
  if (trimmed && /voiceopengov\.org/i.test(trimmed)) {
    return BRAND.baseUrl || "http://localhost:3000";
  }
  return trimmed || BRAND.baseUrl || "http://localhost:3000";
}
export function publicHost(): string {
  try {
    return new URL(publicOrigin()).host;
  } catch {
    return "app.local";
  }
}
