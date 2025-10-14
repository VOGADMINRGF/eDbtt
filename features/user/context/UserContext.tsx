//features/user/ContributionCard
"use client";

import { ContributionCard } from "contribution";
import React, { createContext, useContext, useMemo, useState, ReactNode } from "react";

export type Role = "guest" | "user" | "verified" | "editor" | "admin";
export type RoleCompat = "guest" | "member" | "admin";

export interface IUserProfile {
  id?: string;
  name?: string;
  email?: string;
  role?: Role | RoleCompat;
  image?: string;
  locale?: string;
}

type UserContextType = {
  user: IUserProfile | null;
  role: Role;
  roleCompat: RoleCompat;
  setUser: (u: IUserProfile | null) => void;
  updateUser: (fields: Partial<IUserProfile>) => void;
  logout: () => Promise<void>;
};

export const UserContext = createContext<UserContextType | undefined>(undefined);

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
function toCompatRole(r: Role): RoleCompat {
  if (r === "admin") return "admin";
  if (r === "user" || r === "verified" || r === "editor") return "member";
  return "guest";
}

export function UserProvider({ children, initialUser }: { children: ReactNode; initialUser?: IUserProfile | null }) {
  const [localUser, setLocalUser] = useState<IUserProfile | null>(initialUser ?? null);

  const user = useMemo<IUserProfile | null>(() => localUser, [localUser]);
  const role: Role = useMemo(() => normalizeRoleFine(user?.role), [user?.role]);
  const roleCompat: RoleCompat = useMemo(() => toCompatRole(role), [role]);

  function setUser(u: IUserProfile | null) { setLocalUser(u); }
  function updateUser(fields: Partial<IUserProfile>) { setLocalUser(prev => (prev ? { ...prev, ...fields } : prev)); }
  async function logout() { setLocalUser(null); window.location.href = "/login"; }

  const value = useMemo<UserContextType>(() => ({ user, role, roleCompat, setUser, updateUser, logout }), [user, role, roleCompat]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextType {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}
