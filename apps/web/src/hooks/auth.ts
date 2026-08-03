"use client";

import { useCallback, useEffect, useState } from "react";

export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
  roles: string[];
  accessTier: string | null;
  b2cPlanId: string | null;
  planSlug: string | null;
  engagementXp: number | null;
  engagementLevel: string | null;
  contributionCredits: number | null;
  vogMembershipStatus: string | null;
  avatarUrl?: string | null;
  avatarStyle?: "initials" | "abstract" | "emoji" | null;
};

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  error?: string;
  refresh: () => Promise<void>;
};

let cachedUser: AuthUser | null | undefined;
let pending: Promise<AuthUser | null> | null = null;
let lastRevalidate = 0;
const REVALIDATE_MS = 15_000;

async function fetchCurrentUser(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/me", { cache: "no-store" });
  if (!res.ok) return null;
  const data = (await res.json().catch(() => ({}))) as { user?: AuthUser | null };
  return data?.user ?? null;
}

function getOrLoadUser() {
  if (cachedUser !== undefined) return Promise.resolve(cachedUser ?? null);
  if (!pending) {
    pending = fetchCurrentUser().then((user) => {
      cachedUser = user ?? null;
      pending = null;
      return user ?? null;
    });
  }
  return pending;
}

export function useCurrentUser(initialUser?: AuthUser | null): AuthState {
  const initialResolvedUser = initialUser !== undefined ? initialUser : cachedUser;
  const [user, setUser] = useState<AuthUser | null | undefined>(initialResolvedUser);
  const [loading, setLoading] = useState(initialResolvedUser === undefined);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    if (initialUser !== undefined) {
      cachedUser = initialUser;
      pending = null;
      setUser(initialUser);
      setLoading(false);
    }
    const revalidate = async () => {
      const now = Date.now();
      if (now - lastRevalidate < REVALIDATE_MS) return;
      lastRevalidate = now;
      try {
        const fresh = await fetchCurrentUser();
        cachedUser = fresh ?? null;
        pending = null;
        if (!active) return;
        setUser(fresh ?? null);
        setLoading(false);
      } catch (e: any) {
        if (!active) return;
        setError(e?.message || "auth_load_failed");
      }
    };

    if (cachedUser !== undefined) {
      setLoading(false);
      setUser(cachedUser ?? null);
      void revalidate();
      return () => {
        active = false;
      };
    }

    getOrLoadUser()
      .then((u) => {
        if (!active) return;
        setUser(u ?? null);
        setLoading(false);
      })
      .catch((e) => {
        if (!active) return;
        setError(e?.message || "auth_load_failed");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialUser]);

  const refresh = useCallback(async () => {
    cachedUser = undefined;
    setLoading(true);
    const next = await getOrLoadUser();
    setUser(next ?? null);
    setLoading(false);
  }, []);

  return { user: user ?? null, loading, error, refresh };
}

// Helfer, um den Client-Cache explizit zu leeren (z.B. nach Logout)
export function clearCachedUser() {
  cachedUser = undefined;
  pending = null;
}

export function useAccessTier() {
  const { user, loading, error, refresh } = useCurrentUser();
  return { accessTier: user?.accessTier ?? null, loading, error, refresh };
}

export function useEngagementLevel() {
  const { user, loading, error, refresh } = useCurrentUser();
  return {
    engagementLevel: user?.engagementLevel ?? null,
    engagementXp: user?.engagementXp ?? null,
    loading,
    error,
    refresh,
  };
}

export function useB2CPlan() {
  const { user, loading, error, refresh } = useCurrentUser();
  return { b2cPlanId: user?.b2cPlanId ?? null, loading, error, refresh };
}

export function useVogMembershipStatus() {
  const { user, loading, error, refresh } = useCurrentUser();
  return { vogMembershipStatus: user?.vogMembershipStatus ?? null, loading, error, refresh };
}
