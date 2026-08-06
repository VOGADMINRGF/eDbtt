"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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
  user: AuthUser | null | undefined;
  loading: boolean;
  error?: string;
  refresh: () => Promise<void>;
  confirmLoggedOut: () => void;
};

let cachedUser: AuthUser | null | undefined;
let pending: Promise<AuthUser | null> | null = null;
let lastRevalidate = 0;
let authGeneration = 0;
const REVALIDATE_MS = 15_000;
const AUTH_FETCH_TIMEOUT_MS = 10_000;

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || typeof value === "number";
}

function isAuthUser(value: unknown): value is AuthUser {
  if (!value || typeof value !== "object") return false;
  const user = value as Record<string, unknown>;
  return (
    typeof user.id === "string" &&
    isNullableString(user.email) &&
    isNullableString(user.name) &&
    Array.isArray(user.roles) &&
    user.roles.every((role) => typeof role === "string") &&
    isNullableString(user.accessTier) &&
    isNullableString(user.b2cPlanId) &&
    isNullableString(user.planSlug) &&
    isNullableNumber(user.engagementXp) &&
    isNullableString(user.engagementLevel) &&
    isNullableNumber(user.contributionCredits) &&
    isNullableString(user.vogMembershipStatus) &&
    (user.avatarUrl === undefined || isNullableString(user.avatarUrl)) &&
    (user.avatarStyle === undefined ||
      user.avatarStyle === null ||
      user.avatarStyle === "initials" ||
      user.avatarStyle === "abstract" ||
      user.avatarStyle === "emoji")
  );
}

async function readAuthResponse(res: Response): Promise<AuthUser | null> {
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error("auth_invalid_response");
  }

  if (!data || typeof data !== "object" || !("user" in data)) {
    throw new Error("auth_invalid_response");
  }

  const user = (data as { user?: unknown }).user;
  if (res.status === 401 && user === null) return null;
  if (!res.ok || !isAuthUser(user)) throw new Error("auth_invalid_response");
  return user;
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/me", {
    cache: "no-store",
    signal: AbortSignal.timeout(AUTH_FETCH_TIMEOUT_MS),
  });
  return readAuthResponse(res);
}

function getOrLoadUser() {
  if (cachedUser !== undefined) return Promise.resolve(cachedUser ?? null);
  if (!pending) {
    const requestGeneration = authGeneration;
    const request = fetchCurrentUser().then((user) => {
      if (requestGeneration === authGeneration) {
        cachedUser = user;
      }
      return user;
    });
    pending = request;
    void request.then(
      () => {
        if (pending === request) pending = null;
      },
      () => {
        if (pending === request) pending = null;
      },
    );
  }
  return pending;
}

function authErrorCode() {
  return "auth_load_failed";
}

function retainConfirmedAuthentication(user: AuthUser | null | undefined) {
  return user ?? undefined;
}

export function useCurrentUser(initialUser?: AuthUser | null): AuthState {
  const initialResolvedUser = initialUser !== undefined ? initialUser : cachedUser;
  const [user, setUser] = useState<AuthUser | null | undefined>(initialResolvedUser);
  const userRef = useRef<AuthUser | null | undefined>(initialResolvedUser);
  const [loading, setLoading] = useState(initialResolvedUser === undefined);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    const effectGeneration = initialUser !== undefined ? ++authGeneration : authGeneration;
    if (initialUser !== undefined) {
      cachedUser = initialUser;
      pending = null;
      userRef.current = initialUser;
      setUser(initialUser);
      setLoading(false);
    }
    const revalidate = async () => {
      const now = Date.now();
      if (now - lastRevalidate < REVALIDATE_MS) return;
      lastRevalidate = now;
      try {
        const fresh = await fetchCurrentUser();
        if (!active || effectGeneration !== authGeneration) return;
        cachedUser = fresh;
        pending = null;
        userRef.current = fresh;
        setUser(fresh);
        setError(undefined);
        setLoading(false);
      } catch {
        if (!active || effectGeneration !== authGeneration) return;
        const retainedUser = retainConfirmedAuthentication(userRef.current);
        cachedUser = retainedUser;
        userRef.current = retainedUser;
        setUser(retainedUser);
        setError(authErrorCode());
        setLoading(false);
      }
    };

    if (cachedUser !== undefined) {
      setLoading(false);
      userRef.current = cachedUser;
      setUser(cachedUser ?? null);
      void revalidate();
      return () => {
        active = false;
      };
    }

    getOrLoadUser()
      .then((u) => {
        if (!active || effectGeneration !== authGeneration) return;
        userRef.current = u;
        setUser(u);
        setError(undefined);
        setLoading(false);
      })
      .catch(() => {
        if (!active || effectGeneration !== authGeneration) return;
        cachedUser = undefined;
        userRef.current = undefined;
        setUser(undefined);
        setError(authErrorCode());
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [initialUser]);

  const refresh = useCallback(async () => {
    const refreshGeneration = ++authGeneration;
    cachedUser = undefined;
    pending = null;
    setLoading(true);
    setError(undefined);
    try {
      const next = await getOrLoadUser();
      if (refreshGeneration !== authGeneration) return;
      userRef.current = next;
      setUser(next);
    } catch {
      if (refreshGeneration !== authGeneration) return;
      const retainedUser = retainConfirmedAuthentication(userRef.current);
      cachedUser = retainedUser;
      userRef.current = retainedUser;
      setUser(retainedUser);
      setError(authErrorCode());
    } finally {
      if (refreshGeneration === authGeneration) setLoading(false);
    }
  }, []);

  const confirmLoggedOut = useCallback(() => {
    authGeneration += 1;
    cachedUser = null;
    pending = null;
    lastRevalidate = 0;
    userRef.current = null;
    setUser(null);
    setError(undefined);
    setLoading(false);
  }, []);

  return { user, loading, error, refresh, confirmLoggedOut };
}

// Helfer, um den Client-Cache explizit zu leeren (z.B. nach Logout)
export function clearCachedUser() {
  authGeneration += 1;
  cachedUser = undefined;
  pending = null;
  lastRevalidate = 0;
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
