"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import QRCode from "qrcode";
import { RegisterStepper } from "../RegisterStepper";
import { resolvePostRegistrationRedirect } from "@/features/auth/roleExperienceContract";

type OtpPhase = "idle" | "loading" | "ready" | "verifying" | "success" | "error";
type EmailPhase = "idle" | "sending" | "sent" | "verifying" | "success" | "error";
type MethodTab = "otp" | "email";

export default function IdentityStepPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [method, setMethod] = useState<MethodTab>("otp");

  const [otpPhase, setOtpPhase] = useState<OtpPhase>("idle");
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [resumeState, setResumeState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resumeMessage, setResumeMessage] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const copyTimerRef = useRef<number | null>(null);
  const [otpData, setOtpData] = useState<{
    otpauth: string;
    secret: string;
    issuer: string;
    label: string;
    qr?: string;
  } | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [emailPhase, setEmailPhase] = useState<EmailPhase>("idle");
  const [emailMessage, setEmailMessage] = useState<string | null>(null);
  const [emailCode, setEmailCode] = useState("");
  const finalNext = useMemo(
    () => resolvePostRegistrationRedirect({ requestedRedirect: searchParams.get("next"), roleId: "citizens" }),
    [searchParams],
  );
  const nextAfterVerify = finalNext;
  const optionalOrderPath = useMemo(
    () => `/order?source=register&next=${encodeURIComponent(finalNext)}`,
    [finalNext],
  );

  useEffect(() => {
    if (method !== "otp" || otpPhase !== "idle") return;
    // Auto-start OTP setup for smoother flow
    startOtpSetup().catch(() => {
      setOtpMessage("Konnte nicht starten – bitte erneut versuchen.");
    });
  }, [method, otpPhase]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  async function startOtpSetup() {
    setOtpPhase("loading");
    setOtpMessage(null);
    setOtpData(null);
    try {
      const res = await fetch("/api/auth/totp/initiate", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.otpauth) throw new Error(body?.error || "TOTP_INIT_FAILED");
      const qr = await QRCode.toDataURL(body.otpauth);
      setOtpData({ ...body, qr });
      setOtpPhase("ready");
      setOtpMessage("Scanne den QR-Code mit deiner bevorzugten Authenticator-App oder gib den Secret-Key manuell ein.");
    } catch (err: any) {
      setOtpPhase("error");
      setOtpMessage(err?.message ?? "Setup konnte nicht gestartet werden.");
    }
  }

  async function copySecret(secret: string) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(secret);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = secret;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopyMessage("Secret kopiert.");
    } catch (err: any) {
      setCopyMessage(err?.message ?? "Kopieren fehlgeschlagen.");
    } finally {
      if (copyTimerRef.current) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => setCopyMessage(null), 2500);
    }
  }
  async function verifyOtpCode() {
    if (!otpCode.trim()) {
      setOtpMessage("Bitte den 6-stelligen Code eingeben.");
      return;
    }
    setOtpPhase("verifying");
    setOtpMessage(null);
    try {
      const res = await fetch("/api/auth/totp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: otpCode.replace(/\s+/g, ""), next: nextAfterVerify }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) throw new Error(body?.error || "VERIFICATION_FAILED");
      setOtpPhase("success");
      setOtpMessage("Authenticator aktiviert – danke für deine Registrierung. Wir leiten dich weiter …");
      setTimeout(() => router.push(body?.next || nextAfterVerify), 1200);
    } catch (err: any) {
      setOtpPhase("error");
      setOtpMessage(err?.message ?? "Code ungültig. Bitte erneut versuchen.");
    }
  }

  async function sendResumeMail() {
    setResumeState("sending");
    setResumeMessage(null);
    try {
      const res = await fetch("/api/auth/totp/send-resume", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ next: nextAfterVerify }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) throw new Error(body?.error || "SEND_FAILED");
      setResumeState("sent");
      setResumeMessage("Link gesendet. Öffne ihn später auf dem Gerät deiner Wahl.");
    } catch (err: any) {
      setResumeState("error");
      setResumeMessage(err?.message ?? "Versand fehlgeschlagen. Bitte erneut versuchen.");
    }
  }

  async function sendEmailCode() {
    setEmailPhase("sending");
    setEmailMessage(null);
    try {
      const res = await fetch("/api/auth/identity/email/start", { method: "POST" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) throw new Error(body?.error || "SEND_FAILED");
      setEmailPhase("sent");
      setEmailMessage("Code gesendet. Bitte prüfe dein Postfach.");
    } catch (err: any) {
      setEmailPhase("error");
      setEmailMessage(err?.message ?? "Versand fehlgeschlagen. Bitte erneut versuchen.");
    }
  }

  async function verifyEmailCode() {
    if (!emailCode.trim()) {
      setEmailPhase("error");
      setEmailMessage("Bitte den 6-stelligen Code eingeben.");
      return;
    }
    setEmailPhase("verifying");
    setEmailMessage(null);
    try {
      const res = await fetch("/api/auth/identity/email/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: emailCode.replace(/\s+/g, ""), next: nextAfterVerify }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.ok) {
        const fallback = body?.error === "CODE_EXPIRED"
          ? "Code abgelaufen. Bitte einen neuen senden."
          : "Code ungültig. Bitte erneut versuchen.";
        throw new Error(body?.message || fallback);
      }
      setEmailPhase("success");
      setEmailMessage("E-Mail-Code bestätigt – danke für deine Registrierung. Wir leiten dich weiter …");
      setTimeout(() => router.push(body?.next || nextAfterVerify), 1200);
    } catch (err: any) {
      setEmailPhase("error");
      setEmailMessage(err?.message ?? "Code ungültig. Bitte erneut versuchen.");
    }
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <RegisterStepper current={2} />
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Schritt 2 · Verifikation</p>
        <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">Identität sichern</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Wähle Authenticator-App (TOTP) oder E-Mail-Code, um Missbrauch vorzubeugen. Im nächsten Schritt kannst du optional
          deinen eDebatte-Paketstart anlegen.
        </p>
        <p className="text-xs text-[rgb(var(--muted))]">
          Standard nach Abschluss: Swipes. Paketstart bleibt optional.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-full bg-[rgb(var(--bg))] p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMethod("otp")}
            className={
              "rounded-full px-3 py-1 " +
              (method === "otp"
                ? "bg-[rgb(var(--card))] text-[rgb(var(--fg))] shadow-sm"
                : "text-[rgb(var(--muted))]")
            }
          >
            Authenticator-App
          </button>
          <button
            type="button"
            onClick={() => setMethod("email")}
            className={
              "rounded-full px-3 py-1 " +
              (method === "email"
                ? "bg-[rgb(var(--card))] text-[rgb(var(--fg))] shadow-sm"
                : "text-[rgb(var(--muted))]")
            }
          >
            E-Mail-Code
          </button>
        </div>
        <p className="text-xs text-[rgb(var(--muted))]">
          Alternativ kannst du dich per E-Mail-Code verifizieren.
        </p>
        <Link
          href={optionalOrderPath}
          className="inline-flex items-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-1 text-xs font-semibold text-[rgb(var(--muted))] hover:border-[rgb(var(--grad-from))] hover:text-[rgb(var(--fg))]"
        >
          Optional: Paketstart öffnen
        </Link>
      </div>

      {method === "otp" && (
        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm space-y-5">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Authenticator-App (OTP)</h2>
            <p className="text-sm text-[rgb(var(--muted))]">
              Du kannst jede OTP-App verwenden (Aegis, Ente, Authy, Bitwarden, 1Password, Google Authenticator …). Nach
              Aktivierung nutzt du denselben Code später auch bei der Anmeldung.
            </p>
          </div>
          <div className="space-y-4">
            <p className="text-sm text-[rgb(var(--muted))]">
              Wir haben die Einrichtung bereits gestartet. Falls etwas schiefgeht, nutze den Button:
            </p>
            <button
              type="button"
              onClick={startOtpSetup}
              disabled={otpPhase === "loading" || otpPhase === "verifying"}
              className="rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow disabled:opacity-60"
            >
              {otpPhase === "loading" ? "Vorbereiten …" : "Neu starten"}
            </button>

            {otpPhase !== "loading" && !otpData && (
              <p className="text-sm text-rose-600">
                Konnte keinen QR-Code abrufen. Bitte neu starten oder später erneut versuchen.
              </p>
            )}

            {otpData && otpData.qr && (
              <div className="flex flex-col items-center gap-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 text-center text-sm text-[rgb(var(--muted))]">
                <img src={otpData.qr} alt="Authenticator QR-Code" className="h-40 w-40 rounded-lg border border-white shadow" />
                <div>
                  <p>Secret-Key (falls du ihn manuell eingeben möchtest):</p>
                  <p className="font-mono text-xs text-[rgb(var(--fg))]">{otpData.secret}</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <a
                    href={otpData.otpauth}
                    className="rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--fg))]"
                  >
                    In Authenticator öffnen
                  </a>
                  <button
                    type="button"
                    onClick={() => copySecret(otpData.secret)}
                    className="rounded-full border border-[rgb(var(--border))] px-3 py-1.5 text-xs font-semibold text-[rgb(var(--fg))]"
                  >
                    Secret kopieren
                  </button>
                </div>
                {copyMessage && <p className="text-xs text-emerald-600">{copyMessage}</p>}
              </div>
            )}

            {otpData && (
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[rgb(var(--muted))]">
                  6-stelliger Code
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123 456"
                  className="mt-1 w-full rounded-2xl border border-[rgb(var(--border))] px-4 py-2 text-sm"
                  maxLength={9}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                />
                </label>
                <button
                  type="button"
                  onClick={verifyOtpCode}
                  disabled={otpPhase === "verifying"}
                  className="rounded-full border border-[rgb(var(--border))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] disabled:opacity-60"
                >
                  {otpPhase === "verifying" ? "Prüfe Code …" : "Code bestätigen"}
                </button>
              </div>
            )}

            {otpMessage && (
              <p
                className={`text-sm ${
                  otpPhase === "error"
                    ? "text-rose-600"
                    : otpPhase === "success"
                      ? "text-emerald-600"
                      : "text-[rgb(var(--muted))]"
                }`}
              >
                {otpMessage}
              </p>
            )}
          </div>
        </section>
      )}

      {method === "email" && (
        <section className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm space-y-5">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">E-Mail-Code</h2>
            <p className="text-sm text-[rgb(var(--muted))]">
              Wir schicken dir einen 6-stelligen Code an deine registrierte E-Mail-Adresse. Du kannst danach direkt
              weitergehen.
            </p>
          </div>
          <div className="space-y-3">
            <button
              type="button"
              onClick={sendEmailCode}
              disabled={emailPhase === "sending"}
              className="btn btn-ghost"
            >
              {emailPhase === "sending" ? "Sende …" : "Code per E-Mail senden"}
            </button>
            <label className="block text-sm font-semibold text-[rgb(var(--muted))]">
              6-stelliger Code
              <input
                type="text"
                value={emailCode}
                onChange={(e) => setEmailCode(e.target.value)}
                placeholder="123 456"
                className="mt-1 w-full rounded-2xl border border-[rgb(var(--border))] px-4 py-2 text-sm"
                maxLength={9}
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            </label>
            <button
              type="button"
              onClick={verifyEmailCode}
              disabled={emailPhase === "verifying"}
              className="btn btn-primary"
            >
              {emailPhase === "verifying" ? "Prüfe Code …" : "Code bestätigen"}
            </button>
            {emailMessage && (
              <p
                className={`text-sm ${
                  emailPhase === "error"
                    ? "text-rose-600"
                    : emailPhase === "success"
                      ? "text-emerald-600"
                      : "text-[rgb(var(--muted))]"
                }`}
              >
                {emailMessage}
              </p>
            )}
          </div>
        </section>
      )}

      {method === "otp" && (
        <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 text-sm text-[rgb(var(--muted))] space-y-3">
          <h3 className="font-semibold text-[rgb(var(--fg))]">Gerät wechseln oder später fortsetzen</h3>
          <p>
            Auf dem Handy ist der QR-Code unkomfortabel? Schick dir den Link per E-Mail oder überspringe den Schritt
            jetzt und erledige ihn später im Profil.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={sendResumeMail}
              disabled={resumeState === "sending"}
              className="btn btn-ghost disabled:opacity-60"
            >
              {resumeState === "sending" ? "Sende …" : "Link per E-Mail senden"}
            </button>
            <button
              type="button"
              onClick={() => router.push(finalNext as Parameters<typeof router.push>[0])}
              className="btn btn-primary"
            >
              Schritt überspringen
            </button>
          </div>
          {resumeMessage && (
            <p className={`text-sm ${resumeState === "error" ? "text-rose-600" : "text-emerald-600"}`}>{resumeMessage}</p>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 text-sm text-[rgb(var(--muted))] space-y-3">
        <h3 className="font-semibold text-[rgb(var(--fg))]">Warum dieser Aufwand?</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Bürgerabstimmungen werden international beobachtet – starke Legitimation schützt Ergebnisse vor Manipulation.</li>
          <li>Doppelter Opt-in: Du bestätigst E-Mail und Identität, damit wir keine fremden Accounts freischalten.</li>
          <li>Nach der Identitätsprüfung kannst du deinen Paketstart anlegen und die Freischaltung abstimmen.</li>
          <li>Familien- oder Teamkonten: Du kannst später in deinem Profil zusätzliche Personen einladen oder Gönner-E-Mails hinterlegen.</li>
        </ul>
        <p className="text-xs text-[rgb(var(--muted))]">
          Alle Schritte laufen in der eDebatte-Infrastruktur – keine Datenweitergabe an Dritte, kein Vendor-Lock-in auf eine bestimmte App.
        </p>
      </section>
    </div>
  );
}
