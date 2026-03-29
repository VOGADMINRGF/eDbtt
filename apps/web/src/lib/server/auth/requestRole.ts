import type { NextRequest } from "next/server";
import { logger } from "@core/observability/logger";
import type { Permission, Role } from "@core/auth/rbac";

type RoleSource = "cookie" | "header" | "default";

const KNOWN_ROLES: Role[] = ["guest", "user", "verified", "editor", "admin", "owner"];

function parseRole(value: unknown): Role | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return KNOWN_ROLES.find((candidate) => candidate === normalized) ?? null;
}

export function resolveRoleFromRequest(req: NextRequest): { role: Role; source: RoleSource } {
  const cookieRole = parseRole(req.cookies.get("u_role")?.value);
  if (cookieRole) return { role: cookieRole, source: "cookie" };

  const headerRole = parseRole(req.headers.get("x-role"));
  if (headerRole) return { role: headerRole, source: "header" };

  return { role: "guest", source: "default" };
}

export function logPermissionDenied(params: {
  req: NextRequest;
  scope: string;
  permission: Permission;
  role: Role;
  source: RoleSource;
  details?: Record<string, unknown>;
}) {
  logger.warn(
    {
      scope: params.scope,
      permission: params.permission,
      role: params.role,
      roleSource: params.source,
      method: params.req.method,
      path: params.req.nextUrl.pathname,
      requestId: params.req.headers.get("x-request-id") ?? null,
      ...params.details,
    },
    "RBAC_PERMISSION_DENIED",
  );
}

