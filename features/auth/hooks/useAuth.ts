// features/auth/hooks/useAuth.ts
import { useState } from "react";
import type { UserType as IUserProfileDTO } from "../../user/types/UserType";

type LoginParams = { email: string; password: string };

export function useAuth() {
  const [user, setUser] = useState<IUserProfileDTO | null>(null);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<null | { message: string }>(null);

  async function login({ email, password }: LoginParams) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Login fehlgeschlagen");
      }
      const dto: IUserProfileDTO = await res.json();
      setUser(dto);
    } catch (e: any) {
      setError({ message: e?.message || "Unbekannter Fehler" });
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setUser(null);
  }

  return { user, login, logout, isLoading, error, setUser };
}
