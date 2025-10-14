// features/auth/hooks/useRouteGuard.ts
"use client"; // darf client sein, nutzt optional window

import { useMemo } from "react";

// Rollen & User minimal typisieren
export type Role = "guest" | "user" | "admin" | string;
export type UserLike = { roles?: Role[] } | null | undefined;

export type AccessRule = {
  /** Pfadprefix, z.B. "/admin" oder "/report" */
  path: string;
  /** Erlaubte Rollen – fehlt => alle dürfen */
  allowedRoles?: Role[];
  /** Optional: weitere Logik */
  customCheck?: (user: UserLike) => boolean;
};

export type GuardResult =
  | { allowed: true; reason?: undefined }
  | { allowed: false; reason: "login_required" | "role_forbidden" | "custom_check_failed" };

export function useRouteGuard(opts?: {
  pathname?: string;              // ← keine Abhängigkeit zu next/navigation
  user?: UserLike;                // ← kein @features/user/context/UserContext nötig
  rules?: AccessRule[];           // ← kein @config/accessControl nötig
}): GuardResult {
  const pathname =
    opts?.pathname ??
    (typeof window !== "undefined" ? window.location.pathname : "/");
  const user = opts?.user ?? null;
  const rules = opts?.rules ?? [];

  const rule = useMemo(
    () => rules.find((r) => pathname.startsWith(r.path)),
    [rules, pathname]
  );

  // Kein spezielles Rule-Match → erlaubt
  if (!rule) return { allowed: true };

  const allowedRoles = new Set<Role>(rule.allowedRoles ?? ["guest", "user", "admin"]);

  // Gast-Only: erlaubt ohne Login
  if (!user && allowedRoles.has("guest")) return { allowed: true };

  // Login nötig
  if (!user) return { allowed: false, reason: "login_required" };

  // Rollencheck
  const hasRole = (user.roles ?? []).some((r) => allowedRoles.has(r));
  if (!hasRole) return { allowed: false, reason: "role_forbidden" };

  // Custom-Check (falls angegeben)
  if (rule.customCheck && !rule.customCheck(user)) {
    return { allowed: false, reason: "custom_check_failed" };
  }

  return { allowed: true };
}
