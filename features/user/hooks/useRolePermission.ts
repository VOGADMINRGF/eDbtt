// features/user/hooks/useRolePermission.ts

import { useAuth } from "../../auth/hooks/useAuth";

export function useRolePermission(required: string | string[]) {
  const { user } = useAuth();
  if (!user) return false;

  // Rollen-Objekt defensiv extrahieren
  const roles: Record<string, { role?: string }> = (user as any)?.roles ?? {};

  // Robust: aktiven Key bestimmen (entweder user.activeRole oder erster vorhandener Key)
  let activeRoleKey: string | undefined = (user as any)?.activeRole;
  if (!activeRoleKey || !(activeRoleKey in roles)) {
    const keys = Object.keys(roles);
    activeRoleKey = keys.length ? keys[0] : undefined;
  }

  const active = activeRoleKey ? roles[activeRoleKey]?.role : undefined;
  if (!active) return false;

  return Array.isArray(required) ? required.includes(active) : active === required;
}
