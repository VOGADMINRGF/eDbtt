"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLoginFlow } from "@/hooks/useLoginFlow";
import { normalizeTwoFactorCode, TWO_FACTOR_CODE_LENGTH } from "@/features/auth/twoFactorSetup";

export function HeaderLoginInline({
  redirectTo,
  initialOpen = false,
}: {
  redirectTo?: string;
  initialOpen?: boolean;
}) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [open, setOpen] = useState(initialOpen);
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    step,
    method,
    availableMethods,
    loading,
    requestingEmail,
    switchingMethod,
    allowEmailFallback,
    error,
    submitCredentials,
    submitTwoFactor,
    requestEmailCode,
    selectTwoFactorMethod,
    reset,
  } = useLoginFlow({ redirectTo });
  const normalizedCode = useMemo(() => normalizeTwoFactorCode(code), [code]);
  const showOtpOption = availableMethods.includes("otp");
  const showEmailOption = availableMethods.includes("email");
  const canSubmitTwoFactor = normalizedCode.length === TWO_FACTOR_CODE_LENGTH && !loading;

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      setIdentifier("");
      setPassword("");
      setCode("");
    }
  }, [open, reset]);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    await submitCredentials(identifier, password);
  }

  async function handleCode(e: React.FormEvent) {
    e.preventDefault();
    await submitTwoFactor(normalizedCode);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-[rgb(var(--border))] px-4 py-1 text-[rgb(var(--muted))] transition hover:bg-[rgb(var(--bg))]"
      >
        Login
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 text-sm shadow-xl">
          {step === "credentials" && (
            <form onSubmit={handleCredentials} className="space-y-3">
              <input
                className="w-full rounded-md border border-[rgb(var(--border))] px-3 py-2"
                placeholder="E-Mail oder Nickname"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                required
              />
              <input
                className="w-full rounded-md border border-[rgb(var(--border))] px-3 py-2"
                placeholder="Passwort"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              {error && <p className="text-xs text-rose-600">{error}</p>}
              <button
                type="submit"
                className="w-full rounded-md bg-slate-900 px-3 py-2 text-white shadow-sm disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "…" : "Einloggen"}
              </button>
            </form>
          )}

          {step === "twofactor" && (
            <form onSubmit={handleCode} className="space-y-3">
              {(showOtpOption || showEmailOption) && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--muted))]">
                    Sicherheitscode erhalten über
                  </p>
                  <div className={`grid gap-2 ${showOtpOption && showEmailOption ? "grid-cols-2" : "grid-cols-1"}`}>
                    {showOtpOption && (
                      <button
                        type="button"
                        className={`rounded-full border px-3 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-sky-200 ${
                          method === "otp"
                            ? "border-sky-400 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-100"
                            : "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--muted))]"
                        }`}
                        onClick={async () => {
                          const ok = await selectTwoFactorMethod("otp");
                          if (ok) setCode("");
                        }}
                        disabled={switchingMethod || requestingEmail || loading}
                      >
                        Authenticator-App
                      </button>
                    )}
                    {showEmailOption && (
                      <button
                        type="button"
                        className={`rounded-full border px-3 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-sky-200 ${
                          method === "email"
                            ? "border-sky-400 bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-100"
                            : "border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--muted))]"
                        }`}
                        onClick={async () => {
                          const ok = await selectTwoFactorMethod("email");
                          if (ok) setCode("");
                        }}
                        disabled={switchingMethod || requestingEmail || loading}
                      >
                        Code per E-Mail
                      </button>
                    )}
                  </div>
                </div>
              )}
              <p className="text-[rgb(var(--muted))]">
                {method === "email"
                  ? "Wir haben dir einen 6-stelligen Code per E-Mail gesendet."
                  : "Öffne deine Authenticator-App und gib den aktuellen 6-stelligen Code ein."}
              </p>
              <input
                className="w-full rounded-md border border-[rgb(var(--border))] px-3 py-2"
                placeholder="Sicherheitscode"
                value={normalizedCode}
                onChange={(e) => setCode(e.target.value)}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                required
              />
              {allowEmailFallback && method === "otp" && (
                <button
                  type="button"
                  className="text-left text-xs font-semibold text-sky-700 underline-offset-2 hover:underline disabled:opacity-60"
                  onClick={async () => {
                    const ok = await selectTwoFactorMethod("email");
                    if (ok) setCode("");
                  }}
                  disabled={switchingMethod || requestingEmail || loading}
                >
                  Ich habe keine Authenticator-App
                </button>
              )}
              {allowEmailFallback && method === "email" && (
                <button
                  type="button"
                  className="text-left text-xs font-semibold text-sky-700 underline-offset-2 hover:underline disabled:opacity-60"
                  onClick={async () => {
                    const ok = await requestEmailCode();
                    if (ok) setCode("");
                  }}
                  disabled={switchingMethod || requestingEmail || loading}
                >
                  {requestingEmail ? "Sende Code per E-Mail …" : "Code per E-Mail senden"}
                </button>
              )}
              {error && <p className="text-xs text-rose-600">{error}</p>}
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 rounded-md bg-slate-900 px-3 py-2 text-white shadow-sm disabled:opacity-60"
                  disabled={!canSubmitTwoFactor}
                >
                  {loading ? "…" : "Bestätigen"}
                </button>
                <button
                  type="button"
                  className="rounded-md border border-[rgb(var(--border))] px-3 py-2 text-[rgb(var(--muted))]"
                  onClick={reset}
                >
                  Zurück
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
