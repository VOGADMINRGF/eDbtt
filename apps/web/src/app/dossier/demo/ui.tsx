"use client";

import { useEffect, useState } from "react";
import type { Dossier } from "@features/dossier";
import demoFallback from "@features/dossier/data/demoDossier";
import { DossierViewer } from "@/components/dossier/DossierViewer";

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
    <div className="mx-auto w-full max-w-screen-2xl px-6 py-18 lg:px-10">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[rgb(var(--muted))]">
        <div>
          Demo-Backend:{" "}
          <span className={`font-semibold ${backendOk ? "text-emerald-400" : "text-amber-300"}`}>
            {backendOk ? "verbunden" : "Fallback (lokal)"}
          </span>
        </div>
        {serverTimestamp ? (
          <div>
            Server-Stand: <span className="font-semibold text-[rgb(var(--fg))]">{serverTimestamp}</span>
          </div>
        ) : null}
      </div>
      <DossierViewer dossier={dossier} />
    </div>
  );
}
