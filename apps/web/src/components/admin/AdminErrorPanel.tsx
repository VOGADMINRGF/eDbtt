"use client";

import React from "react";

type AdminErrorPanelProps = {
  error: string;
  title?: string;
  hint?: string | null;
  missingEnv?: string[] | null;
  details?: string | null;
  className?: string;
  children?: React.ReactNode;
};

const KNOWN_HINTS: Array<{
  match: (value: string) => boolean;
  title: string;
  hint: string;
}> = [
  {
    match: (value) => value.includes("graph_unavailable") || value.includes("neo4j"),
    title: "Graph nicht verfuegbar",
    hint: "NEO4J_URL, NEO4J_USER und NEO4J_PASSWORD in .env(.local) setzen und Server neu starten.",
  },
  {
    match: (value) => value.includes("unauthorized") || value.includes("401"),
    title: "Kein Zugriff",
    hint: "Bitte erneut anmelden oder Admin-Rechte pruefen.",
  },
  {
    match: (value) => value.includes("two_factor_required"),
    title: "2FA erforderlich",
    hint: "Bitte 2FA bestaetigen (Login) und erneut versuchen.",
  },
  {
    match: (value) => value.includes("two_factor_setup_required"),
    title: "2FA Setup erforderlich",
    hint: "Bitte 2FA im Account einrichten und erneut versuchen.",
  },
];

function resolveKnownHint(error: string) {
  const value = error.toLowerCase();
  return KNOWN_HINTS.find((entry) => entry.match(value)) ?? null;
}

export function AdminErrorPanel({
  error,
  title,
  hint,
  missingEnv,
  details,
  className,
  children,
}: AdminErrorPanelProps) {
  const known = resolveKnownHint(error);
  const resolvedTitle = title ?? known?.title ?? "Fehler";
  const resolvedHint = hint ?? known?.hint ?? null;
  const envList = (missingEnv ?? []).filter(Boolean);

  return (
    <div
      className={[
        "rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 shadow-sm",
        className ?? "",
      ].join(" ")}
      role="alert"
    >
      <p className="font-semibold">{resolvedTitle}</p>
      <p className="mt-1 break-words">{error}</p>
      {envList.length > 0 && (
        <p className="mt-2 text-[12px] text-rose-600">Fehlende ENV: {envList.join(", ")}</p>
      )}
      {resolvedHint ? <p className="mt-1 text-[12px] text-rose-600">{resolvedHint}</p> : null}
      {details ? <p className="mt-1 text-[12px] text-rose-600">{details}</p> : null}
      {children ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}
