import { useAuth } from "./useAuth";

export function usePermission(requiredRoles: string | string[]) {
  const { user } = useAuth();
  if (!user) return false;
  if (Array.isArray(requiredRoles)) {
    return requiredRoles.includes(user.role);
  }
  return user.role === requiredRoles;
}
