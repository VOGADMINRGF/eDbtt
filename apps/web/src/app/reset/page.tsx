"use client";
import { useMemo, useState } from "react";

export default function ResetPage() {
  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("token") ?? "";
  }, []);
  const invite = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("invite") ?? "";
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [msg, setMsg] = useState<string>();
  const [okMsg, setOkMsg] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function requestLink(e: React.FormEvent) {
    e.preventDefault();
    setMsg(undefined);
    setOkMsg(undefined);
    setBusy(true);
    try {
      const r = await fetch("/api/auth/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Fehler");
      setOkMsg(
        "Wenn die E-Mail bei uns existiert, haben wir dir einen Link geschickt.",
      );
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Fehler");
    } finally {
      setBusy(false);
    }
  }

  async function setNew(e: React.FormEvent) {
    e.preventDefault();
    setMsg(undefined);
    setOkMsg(undefined);
    if (password !== confirmPassword) {
      setMsg("Passwörter stimmen nicht überein.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/auth/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, invite: invite || undefined }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || "Fehler");
      setOkMsg("Passwort gesetzt. Du kannst dich jetzt einloggen.");
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : "Fehler");
    } finally {
      setBusy(false);
    }
  }

    if (token) {
    return (
      <div className="mx-auto max-w-md p-6">
        <h1 className="text-2xl font-semibold mb-4">Neues Passwort setzen</h1>
        <form onSubmit={setNew} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="new-password">
              Neues Passwort
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={showPwd ? "text" : "password"}
                placeholder="Neues Passwort"
                className="w-full border rounded px-3 py-2 pr-12 text-slate-900 placeholder:text-slate-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button
                type="button"
                onPointerDown={() => setShowPwd(true)}
                onPointerUp={() => setShowPwd(false)}
                onPointerLeave={() => setShowPwd(false)}
                onPointerCancel={() => setShowPwd(false)}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") setShowPwd(true);
                }}
                onKeyUp={(e) => {
                  if (e.key === " " || e.key === "Enter") setShowPwd(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border px-2 py-1 text-xs"
                aria-label="Passwort kurz anzeigen"
                title="Gedrückt halten zum Anzeigen"
              >
                Anzeigen
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="confirm-password">
              Passwort bestätigen
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={showPwd ? "text" : "password"}
                placeholder="Passwort wiederholen"
                className="w-full border rounded px-3 py-2 pr-12 text-slate-900 placeholder:text-slate-400"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <button
                type="button"
                onPointerDown={() => setShowPwd(true)}
                onPointerUp={() => setShowPwd(false)}
                onPointerLeave={() => setShowPwd(false)}
                onPointerCancel={() => setShowPwd(false)}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") setShowPwd(true);
                }}
                onKeyUp={(e) => {
                  if (e.key === " " || e.key === "Enter") setShowPwd(false);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full border px-2 py-1 text-xs"
                aria-label="Passwort kurz anzeigen"
                title="Gedrückt halten zum Anzeigen"
              >
                Anzeigen
              </button>
            </div>
          </div>
          {msg && <p className="text-red-600 text-sm">{msg}</p>}
          {okMsg && <p className="text-green-700 text-sm">{okMsg}</p>}
          <button
            disabled={busy}
            className="btn btn-primary disabled:opacity-50"
            type="submit"
          >
            {busy ? "…" : "Setzen"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Passwort zurücksetzen</h1>
      <form onSubmit={requestLink} className="space-y-4">
        <input
          type="email"
          placeholder="E-Mail"
          className="w-full border rounded px-3 py-2 text-slate-900 placeholder:text-slate-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {msg && <p className="text-red-600 text-sm">{msg}</p>}
        {okMsg && <p className="text-green-700 text-sm">{okMsg}</p>}
        <button
          disabled={busy}
          className="btn btn-primary disabled:opacity-50"
          type="submit"
        >
          {busy ? "…" : "Link anfordern"}
        </button>
      </form>
    </div>
  );
}
