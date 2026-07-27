"use client";

import { useEffect, useState } from "react";
import type { Dossier } from "@features/dossier";
import demoFallback from "@features/dossier/data/demoDossier";
import DossierWorkspace from "@/components/dossier/DossierWorkspace";

type ApiResponse =
  | { ok: true; serverTimestamp: string; dossier: Dossier }
  | { ok: false; error?: string };

export default function DossierDemoClient() {
  const [dossier, setDossier] = useState<Dossier>(demoFallback);
  const [serverTimestamp, setServerTimestamp] = useState<string | null>(null);
  const [backendOk, setBackendOk] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/demo/dossier", { cache: "no-store" })
      .then((r) => r.json() as Promise<ApiResponse>)
      .then((data) => {
        if (cancelled) return;
        if (data.ok) {
          setDossier(data.dossier);
          setServerTimestamp(data.serverTimestamp);
          setBackendOk(true);
        } else {
          setBackendOk(false);
        }
      })
      .catch(() => setBackendOk(false));

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-2 px-4 pt-6 text-[11px] text-[rgb(var(--muted))] sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[10px] uppercase tracking-wide text-[rgb(var(--muted))]">
            Demo-Backend
          </span>
          <span
            className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${
              backendOk
                ? "border-emerald-500/40 text-emerald-400"
                : "border-amber-500/40 text-amber-300"
            }`}
          >
            {backendOk ? "verbunden" : "Fallback (lokal)"}
          </span>
        </div>
        {serverTimestamp ? (
          <div className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[10px]">
            Server-Stand: <span className="font-semibold text-[rgb(var(--fg))]">{serverTimestamp}</span>
          </div>
        ) : null}
      </div>
      <DossierWorkspace dossier={dossier} demo sourceStatusLabel="Demodaten, kein produktiver Prüfstatus" />
    </div>
  );
}
