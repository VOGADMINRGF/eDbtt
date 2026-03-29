import { NextRequest } from "next/server";
import { requireAdminOrResponse } from "@/lib/server/auth/admin";

const EDITOR_TOKEN_FALLBACK_ALLOWLIST = [
  "/api/feeds/drafts",
  "/api/feeds/pull",
  "/api/feeds/batch",
  "/api/feeds/candidates",
  "/api/feeds/analyze-pending",
  "/api/_diag/gpt",
] as const;

const EDITOR_TOKEN_FALLBACK_ALLOWLIST_SET = new Set<string>(
  EDITOR_TOKEN_FALLBACK_ALLOWLIST,
);

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function normalizePathname(pathname: string): string {
  const value = pathname.trim();
  if (!value) return "/";
  if (value === "/") return value;
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export function isEditorTokenFallbackAllowlistedPath(pathname: string): boolean {
  return EDITOR_TOKEN_FALLBACK_ALLOWLIST_SET.has(normalizePathname(pathname));
}

function hasEditorToken(req: NextRequest): boolean {
  const envToken = (process.env.EDITOR_TOKEN ?? "").trim();
  if (!envToken) return false;
  const header = req.headers.get("authorization") ?? "";
  const bearer = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";
  const headerToken = req.headers.get("x-editor-token")?.trim() ?? "";
  const cookieToken = req.cookies.get("editor_token")?.value?.trim() ?? "";
  const presented = bearer || headerToken || cookieToken;
  if (!presented) return false;
  return safeEqual(presented, envToken);
}

export async function requireAdminOrEditor(req: NextRequest): Promise<Response | null> {
  const gate = await requireAdminOrResponse(req);
  if (!(gate instanceof Response)) return null;
  if (
    hasEditorToken(req) &&
    isEditorTokenFallbackAllowlistedPath(req.nextUrl.pathname)
  ) {
    return null;
  }
  return gate;
}
