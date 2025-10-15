// VPM25/apps/web/src/features/user/context/UserContext.tsx
"use client";
import React, { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Role = "guest" | "user" | "verified" | "editor" | "admin";
export type RoleCompat = "guest" | "member" | "admin";
export interface IUserProfile {
  id?: string; name?: string; email?: string;
  role?: Role | RoleCompat; image?: string; locale?: string;
  verification?: "none" | "pending" | "legitimized"; // ⬅️ ergänzt
}
export type UserContextType = {
  user: IUserProfile | null;
  role: Role;
  roleCompat: RoleCompat;
  setUser: (u: IUserProfile | null) => void;
  updateUser: (fields: Partial<IUserProfile>) => void;
  logout: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

function normalizeRoleFine(r?: IUserProfile["role"]): Role {
  const x = (r ?? "guest").toString().toLowerCase();
  switch (x) {
    case "admin": return "admin";
    case "editor": return "editor";
    case "verified": return "verified";
    case "user":
    case "member": return "user";
    default: return "guest";
  }
}
const toCompat = (r: Role): RoleCompat => (r === "admin" ? "admin" : r === "guest" ? "guest" : "member");

export function UserProvider({ children, initialUser }: { children: ReactNode; initialUser?: IUserProfile | null }) {
  const [user, setLocalUser] = useState<IUserProfile | null>(initialUser ?? null);
  const role = useMemo(() => normalizeRoleFine(user?.role), [user?.role]);
  const roleCompat = useMemo(() => toCompat(role), [role]);

  const setUser = (u: IUserProfile | null) => setLocalUser(u);
  const updateUser = (fields: Partial<IUserProfile>) => setLocalUser(prev => (prev ? { ...prev, ...fields } : prev));
  const logout = async () => { setLocalUser(null); window.location.href = "/login"; };

  const value = useMemo<UserContextType>(() => ({ user, role, roleCompat, setUser, updateUser, logout }),
    [user, role, roleCompat]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextType {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
export default useUser;
export const useRole = () => useUser().role;
export const useRoleCompat = () => useUser().roleCompat;
export const useIsAdmin = () => useUser().role === "admin";
export const useIsMember = () => useUser().roleCompat !== "guest";
