// apps/web/src/app/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

function okPwd(p: string) {
  return p.length >= 12 && /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p);
}

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [errMsg, setErrMsg] = useState<string>();
  const [okMsg, setOkMsg] = useState<string>();
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrMsg(undefined);
    setOkMsg(undefined);

    if (!okPwd(password)) {
      setErrMsg("Passwort: min. 12 Zeichen, inkl. Zahl & Sonderzeichen.");
      return;
    }

    setBusy(true);
    try {
      const ac = new AbortController();
      const t = setTimeout(() => ac.abort("timeout"), 15_000);

      const r = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({
          email,
          name: name.trim() || undefined,
          password,
        }),
        signal: ac.signal,
      });

      clearTimeout(t);

      const ct = r.headers.get("content-type") || "";
      const data = ct.includes("application/json")
        ? await r.json().catch(() => ({}))
        : { error: (await r.text()).slice(0, 500) };

      if (!r.ok)
        throw new Error(data?.error || data?.message || `HTTP ${r.status}`);

      setOkMsg("Konto erstellt. Weiterleitung zur Verifizierung …");
      const next =
        typeof data?.verifyUrl === "string" && data.verifyUrl.length > 0
          ? data.verifyUrl
          : `/verify?email=${encodeURIComponent(email)}`;
      router.push(next);
    } catch (err: any) {
      setErrMsg(
        err?.name === "AbortError"
          ? "Zeitüberschreitung. Bitte erneut versuchen."
          : err?.message || "Unbekannter Fehler",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Registrieren</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="sr-only">Name (optional)</span>
          <input
            className="w-full border rounded px-3 py-2"
            type="text"
            name="name"
            placeholder="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            disabled={busy}
          />
        </label>

        <label className="block">
          <span className="sr-only">E-Mail</span>
          <input
            className="w-full border rounded px-3 py-2"
            type="email"
            name="email"
            placeholder="E-Mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            inputMode="email"
            disabled={busy}
          />
        </label>

        <label className="block relative">
          <span className="sr-only">Passwort</span>
          <input
            className="w-full border rounded px-3 py-2 pr-12"
            type={showPwd ? "text" : "password"}
            name="password"
            placeholder="Passwort (≥12, Zahl & Sonderzeichen)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={12}
            pattern="^(?=.*[0-9])(?=.*[^A-Za-z0-9]).{12,}$"
            autoComplete="new-password"
            disabled={busy}
            aria-describedby="pw-help"
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-sm px-2 py-1 border rounded"
            tabIndex={-1}
          >
            {showPwd ? "🙈" : "👁️"}
          </button>
        </label>

        <p
          id="pw-help"
          className={`text-xs ${okPwd(password) ? "text-green-600" : "text-neutral-500"}`}
        >
          Anforderungen: min. 12 Zeichen, mind. eine Zahl und ein Sonderzeichen.
        </p>

        {errMsg && (
          <p className="text-red-600 text-sm" aria-live="assertive">
            {String(errMsg)}
          </p>
        )}
        {okMsg && (
          <p className="text-green-700 text-sm" aria-live="polite">
            {okMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="bg-black text-white rounded px-4 py-2 disabled:opacity-50"
        >
          {busy ? "…" : "Konto anlegen"}
        </button>
      </form>

      <p className="text-sm mt-4">
        Schon ein Konto?{" "}
        <Link className="underline" href="/login">
          Login
        </Link>
      </p>
    </div>
  );
}
