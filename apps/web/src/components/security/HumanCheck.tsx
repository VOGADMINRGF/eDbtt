"use client";
// E200: Lightweight anti-bot check with honeypot, puzzle, and time heuristic.

import { useEffect, useMemo, useRef, useState } from "react";
import { derivePuzzle } from "@/lib/security/human-puzzle";
import {
  getHumanCheckFailureMessage,
  normalizeHumanPuzzleAnswerInput,
  parseHumanPuzzleAnswer,
} from "@/lib/security/humanCheckContract";
import { safeRandomId } from "@core/utils/random";

interface HumanCheckProps {
  formId?: string;
  onSolved: (result: { token: string; meta?: Record<string, unknown> }) => void;
  onError?: (reason: string) => void;
  variant?: "full" | "compact";
  disabled?: boolean;
  resetSignal?: number;
}

const STORAGE_PREFIX = "edb_human_check";
const TOKEN_TTL_MS = 10 * 60 * 1000;

type StoredHumanCheck = {
  token: string;
  solvedAt: number;
  formId: string;
};

function storageKey(formId: string) {
  return `${STORAGE_PREFIX}:${formId}`;
}

function readStoredToken(formId: string): StoredHumanCheck | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(storageKey(formId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredHumanCheck;
    if (!parsed?.token || !parsed?.solvedAt || parsed.formId !== formId) return null;
    if (Date.now() - parsed.solvedAt > TOKEN_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function storeToken(formId: string, token: string) {
  if (typeof window === "undefined") return;
  const payload: StoredHumanCheck = { token, solvedAt: Date.now(), formId };
  window.sessionStorage.setItem(storageKey(formId), JSON.stringify(payload));
}

function clearStoredToken(formId: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(storageKey(formId));
}

export function HumanCheck({
  formId = "public-updates",
  onSolved,
  onError,
  variant = "full",
  disabled = false,
  resetSignal = 0,
}: HumanCheckProps) {
  const isCompact = variant === "compact";
  const [isOpen, setIsOpen] = useState(!isCompact);
  const [honeypot, setHoneypot] = useState("");
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<"idle" | "checking" | "solved" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const startRef = useRef<number | null>(null);
  const solvedRef = useRef(false);
  const resetInitializedRef = useRef(false);
  const [puzzleSeed, setPuzzleSeed] = useState<string | null>(null);
  const answerValue = normalizeHumanPuzzleAnswerInput(answer);
  const parsedAnswer = parseHumanPuzzleAnswer(answerValue);
  const isAnswerValid = parsedAnswer !== null;

  useEffect(() => {
    // Erst auf dem Client einen Seed erzeugen, damit SSR/CSR übereinstimmen.
    const seed = safeRandomId();
    setPuzzleSeed(seed);
    startRef.current = performance.now();
  }, []);

  useEffect(() => {
    if (!resetInitializedRef.current) {
      resetInitializedRef.current = true;
      return;
    }
    solvedRef.current = false;
    clearStoredToken(formId);
    setStatus("idle");
    setMessage(null);
    setAnswer("");
  }, [formId, resetSignal]);

  useEffect(() => {
    const cached = readStoredToken(formId);
    if (!cached || solvedRef.current) return;
    solvedRef.current = true;
    setStatus("solved");
    setMessage("Bereits bestätigt.");
    if (isCompact) setIsOpen(true);
    onSolved({ token: cached.token, meta: { restored: true } });
  }, [formId, isCompact, onSolved]);

  const puzzle = useMemo(() => (puzzleSeed ? derivePuzzle(puzzleSeed) : null), [puzzleSeed]);

  const handleVerify = async () => {
    if (disabled || status === "checking" || status === "solved") return;
    if (!isAnswerValid) {
      setStatus("error");
      setMessage("Bitte trage das Ergebnis als Zahl ein.");
      return;
    }
    setStatus("checking");
    setMessage(null);

    const startedAt = startRef.current ?? performance.now();
    const timeToSolve = Math.max(0, Math.floor(performance.now() - startedAt));

    try {
      const res = await fetch("/api/security/verify-human", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formId,
          honeypotValue: honeypot,
          puzzleAnswer: parsedAnswer,
          puzzleSeed,
          timeToSolve,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        const reason = data?.code ?? "unknown";
        setStatus("error");
        setMessage(getHumanCheckFailureMessage(reason));
        onError?.(reason);
        clearStoredToken(formId);
        return;
      }

      setStatus("solved");
      setMessage("Bestätigt.");
      solvedRef.current = true;
      storeToken(formId, data.humanToken);
      onSolved({ token: data.humanToken, meta: { timeToSolve, puzzleSeed } });
    } catch (err) {
      setStatus("error");
      setMessage(getHumanCheckFailureMessage("technical"));
      onError?.(err instanceof Error ? err.message : "unknown");
      clearStoredToken(formId);
    }
  };

  if (isCompact && !isOpen && status !== "solved") {
    return (
      <div className="space-y-2 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 text-xs text-[rgb(var(--muted))] shadow-sm">
        <p className="text-sm font-semibold text-[rgb(var(--fg))]">Kurze Bestätigung</p>
        <p>
          Kurzer Anti-Spam-Check. Öffne die Aufgabe nur, wenn du das Formular absenden willst.
        </p>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800"
        >
          Bestätigung öffnen
        </button>
      </div>
    );
  }

  if (!puzzle) {
    return (
      <div
        className={`space-y-2 rounded-xl border p-4 text-xs ${
          isCompact
            ? "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--muted))] shadow-sm"
            : "border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--card))_90%,rgb(var(--bg))_10%)] text-[rgb(var(--muted))]"
        }`}
      >
        Lade kurze Bestätigung …
      </div>
    );
  }

  return (
    <div
      className={`space-y-3 overflow-hidden rounded-xl border p-4 ${
        isCompact
          ? "border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-sm"
          : "border-[rgb(var(--border))] bg-[color-mix(in_oklab,rgb(var(--card))_90%,rgb(var(--bg))_10%)]"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p
          className={`text-sm font-semibold ${
            isCompact ? "text-[rgb(var(--fg))]" : "text-[rgb(var(--fg))]"
          }`}
        >
          Kurze Bestätigung: Bist du ein Mensch?
        </p>
        {status === "solved" && (
          <span
            className={`text-xs font-semibold ${
              isCompact ? "text-[rgb(var(--muted))]" : "text-emerald-600 dark:text-emerald-300"
            }`}
          >
            Bestätigt
          </span>
        )}
      </div>
      <p className={`text-xs ${isCompact ? "text-[rgb(var(--muted))]" : "text-[rgb(var(--muted))]"}`}>
        Wir schützen Formulare vor Spam. Kein Tracking, nur ein kleiner Check: Bitte rechne die Aufgabe und lass das versteckte
        Feld leer.
      </p>

      <label className="sr-only" aria-hidden>
        Bitte leer lassen
        <input
          tabIndex={-1}
          autoComplete="new-password"
          data-form-type="other"
          data-1p-ignore="true"
          data-lpignore="true"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="absolute opacity-0"
        />
      </label>

      <div
        className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
          isCompact
            ? "border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
            : "border-[rgb(var(--border))] bg-[rgb(var(--card))]"
        }`}
      >
        <span
          className={`text-sm font-semibold ${
            isCompact ? "text-[rgb(var(--fg))]" : "text-[rgb(var(--fg))]"
          }`}
        >
          {puzzle.first} + {puzzle.second} =
        </span>
        <input
          required
          inputMode="numeric"
          pattern="[0-9]*"
          value={answer}
          onChange={(e) => {
            setAnswer(normalizeHumanPuzzleAnswerInput(e.target.value));
            if (status !== "checking") {
              if (status !== "idle") setStatus("idle");
              if (message) setMessage(null);
            }
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            e.stopPropagation();
            if (status !== "checking") void handleVerify();
          }}
          className={`w-24 rounded-lg border bg-[rgb(var(--card))] px-3 py-2 text-sm outline-none ${
            isCompact
              ? "border-[rgb(var(--border))] text-[rgb(var(--fg))] focus:border-[rgb(var(--border))] focus:ring-2 focus:ring-[rgb(var(--border))]"
              : "border-[rgb(var(--border))] text-[rgb(var(--fg))] focus:border-[rgb(var(--grad-from))] focus:ring-2 focus:ring-[rgb(var(--border))]"
          }`}
          aria-label="Ergebnis eintragen"
          disabled={disabled || status === "checking" || status === "solved"}
        />
        <button
          type="button"
          disabled={disabled || status === "checking" || status === "solved"}
          onClick={() => {
            if (status !== "checking") void handleVerify();
          }}
          className={`ml-auto inline-flex items-center rounded-full px-4 py-2 text-xs font-semibold text-white shadow disabled:opacity-60 ${
            isCompact
              ? "bg-slate-900 hover:bg-slate-800"
              : "bg-gradient-to-r from-sky-500 to-emerald-500 hover:brightness-110"
          }`}
        >
          {status === "checking" ? "Prüfen …" : status === "solved" ? "Bestätigt" : "Kurz prüfen"}
        </button>
      </div>

      {message && (
        <p
          className={`text-xs break-words whitespace-normal ${
            isCompact ? "text-[rgb(var(--muted))]" : "text-[rgb(var(--muted))]"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
