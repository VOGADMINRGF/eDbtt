import type { UserRole } from "@/types/user";

export const ADMIN_DASHBOARD_ROLES: UserRole[] = ["admin", "superadmin"];

export function userIsAdminDashboard(user: { roles?: UserRole[] | null; role?: UserRole | null } | null): boolean {
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const primary = user?.role ? [user.role] : [];
  return [...roles, ...primary].some((role) => ADMIN_DASHBOARD_ROLES.includes(role));
}

export function userIsSuperadmin(user: { roles?: UserRole[] | null; role?: UserRole | null } | null): boolean {
  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const primary = user?.role ? [user.role] : [];
  return [...roles, ...primary].includes("superadmin");
}
