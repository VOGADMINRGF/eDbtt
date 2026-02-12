import type { UserRole } from "@/types/user";

export const ADMIN_DASHBOARD_ROLES: UserRole[] = ["admin", "superadmin"];

function splitRoleTokens(value: unknown): string[] {
  if (typeof value !== "string") return [];
  // Support legacy/manual formats like "admin,superadmin".
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function userIsAdminDashboard(user: { roles?: UserRole[] | null; role?: UserRole | null } | null): boolean {
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const primary = splitRoleTokens(user?.role);
  return [...roles, ...primary].some((role) => ADMIN_DASHBOARD_ROLES.includes(role as UserRole));
}

export function userIsSuperadmin(user: { roles?: UserRole[] | null; role?: UserRole | null } | null): boolean {
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const primary = splitRoleTokens(user?.role);
  return [...roles, ...primary].includes("superadmin");
}
