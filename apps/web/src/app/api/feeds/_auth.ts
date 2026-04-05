import { NextRequest, NextResponse } from "next/server";
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

type EditorTokenMatchReason =
  | "ok"
  | "no_token_presented"
  | "editor_token_not_configured"
  | "invalid_authorization_header"
  | "conflicting_token_sources"
  | "invalid_token";

type EditorTokenMatch = {
  ok: boolean;
  reason: EditorTokenMatchReason;
  hadPresentedToken: boolean;
};

function readConfiguredEditorToken(): string | null {
  const raw = process.env.EDITOR_TOKEN;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Hardening: surrounding whitespace is treated as misconfiguration.
  if (trimmed !== raw) return null;
  return trimmed;
}

function readBearerToken(authorizationHeader: string | null): {
  token: string | null;
  invalid: boolean;
} {
  if (!authorizationHeader) return { token: null, invalid: false };
  const header = authorizationHeader.trim();
  if (!header) return { token: null, invalid: false };
  if (!/^Bearer\s+/i.test(header)) return { token: null, invalid: true };
  const token = header.slice(header.indexOf(" ") + 1).trim();
  if (!token || /\s/.test(token)) return { token: null, invalid: true };
  return { token, invalid: false };
}

function matchEditorToken(req: NextRequest): EditorTokenMatch {
  const bearer = readBearerToken(req.headers.get("authorization"));
  if (bearer.invalid) {
    return {
      ok: false,
      reason: "invalid_authorization_header",
      hadPresentedToken: true,
    };
  }

  const headerToken = req.headers.get("x-editor-token")?.trim() ?? "";
  const cookieToken = req.cookies.get("editor_token")?.value?.trim() ?? "";
  const presentedTokens = [bearer.token, headerToken || null, cookieToken || null].filter(
    (value): value is string => Boolean(value),
  );
  if (!presentedTokens.length) {
    return {
      ok: false,
      reason: "no_token_presented",
      hadPresentedToken: false,
    };
  }

  const uniquePresented = [...new Set(presentedTokens)];
  if (uniquePresented.length > 1) {
    return {
      ok: false,
      reason: "conflicting_token_sources",
      hadPresentedToken: true,
    };
  }

  const configuredToken = readConfiguredEditorToken();
  if (!configuredToken) {
    return {
      ok: false,
      reason: "editor_token_not_configured",
      hadPresentedToken: true,
    };
  }

  const presented = uniquePresented[0];
  if (!safeEqual(presented, configuredToken)) {
    return {
      ok: false,
      reason: "invalid_token",
      hadPresentedToken: true,
    };
  }

  return {
    ok: true,
    reason: "ok",
    hadPresentedToken: true,
  };
}

export async function requireAdminOrEditor(req: NextRequest): Promise<Response | null> {
  const gate = await requireAdminOrResponse(req);
  if (!(gate instanceof Response)) return null;
  if (!isEditorTokenFallbackAllowlistedPath(req.nextUrl.pathname)) {
    return gate;
  }

  const match = matchEditorToken(req);
  if (match.ok) {
    return null;
  }

  if (match.reason === "editor_token_not_configured" && match.hadPresentedToken) {
    console.warn("[feeds-auth] editor token misconfiguration", {
      path: req.nextUrl.pathname,
      reason: match.reason,
    });
    return NextResponse.json(
      { ok: false, error: "editor_token_not_configured" },
      { status: 500 },
    );
  }

  if (match.reason === "invalid_authorization_header" || match.reason === "conflicting_token_sources") {
    console.warn("[feeds-auth] rejected editor token transport", {
      path: req.nextUrl.pathname,
      reason: match.reason,
    });
  }

  return gate;
}
