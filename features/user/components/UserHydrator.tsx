// features/user/components/UserHydrator.tsx
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type User =
  | { id: string; email: string; name?: string | null; roles: string[] }
  | null;

type Ctx = {
  user: User;
  setUser: (u: User) => void;
  refresh: () => Promise<void>;
  loading: boolean;
};

const UserContext = createContext<Ctx | null>(null);

type Props = {
  children: ReactNode;
  initialUser?: User;
  refreshOnMount?: boolean;
};

export default function UserHydrator({
  children,
  initialUser = null,
  refreshOnMount = true,
}: Props) {
  const [user, setUser] = useState<User>(initialUser);
  const [loading, setLoading] = useState(false);
  const didRun = useRef(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        setUser(json?.user ?? null);
      } else if (res.status === 401) {
        setUser(null);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!refreshOnMount || didRun.current) return;
    didRun.current = true;
    void refresh();
  }, [refreshOnMount]);

  useEffect(() => {
    const bc =
      typeof window !== "undefined" && "BroadcastChannel" in window
        ? new BroadcastChannel("auth")
        : null;

    const onMsg = () => void refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "auth:event") void refresh();
    };

    bc?.addEventListener("message", onMsg);
    window.addEventListener("storage", onStorage);
    return () => {
      bc?.removeEventListener("message", onMsg);
      bc?.close();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const value: Ctx = { user, setUser, refresh, loading };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within <UserHydrator>");
  return ctx;
}
