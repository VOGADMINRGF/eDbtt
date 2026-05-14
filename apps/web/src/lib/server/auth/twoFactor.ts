import type { SessionUser } from "./sessionUser";
import { ensureVerificationDefaults } from "@core/auth/verificationTypes";

export function userRequiresTwoFactor(user: SessionUser | null): boolean {
  if (!user) return false;
  const verification = ensureVerificationDefaults((user as any).verification);
  const twoFA = (user as any)?.verification?.twoFA || (verification as any)?.twoFA;
  const enabled = Boolean(twoFA?.enabled || twoFA?.secret);
  const method = twoFA?.method || (enabled && (twoFA?.secret ? "totp" : null));
  return Boolean(enabled && method);
}

export function sessionHasPassedTwoFactor(user: SessionUser | null): boolean {
  if (!user) return false;
  if ((user as any).sessionValid === false) return false;
  return Boolean(user.sessionTwoFactorAuthenticated);
}

export function sessionHasTwoFactorFallback(user: SessionUser | null): boolean {
  if (!user) return false;
  if ((user as any).sessionValid === false) return false;
  return user.sessionTwoFactorFallbackMode === "setup" || user.sessionTwoFactorFallbackMode === "recovery";
}

export function sessionSatisfiesProtectedTwoFactor(user: SessionUser | null): boolean {
  if (!user) return false;
  if (userRequiresTwoFactor(user)) {
    return sessionHasPassedTwoFactor(user) || sessionHasTwoFactorFallback(user);
  }
  return sessionHasTwoFactorFallback(user);
}
