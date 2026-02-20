"use client";

import { useEffect, useState } from "react";
import type { Dossier } from "@features/dossier";
import demoFallback from "@features/dossier/data/demoDossier";
import { DossierViewer } from "@/components/dossier/DossierViewer";

type ApiResponse =
  | { ok: true; dossier: Dossier }
  | { ok: false; error?: string };

export default function DossierPageClient({ dossierId }: { dossierId: string }) {
  const [dossier, setDossier] = useState<Dossier>(demoFallback);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/dossier/${encodeURIComponent(dossierId)}`, { cache: "no-store" })
      .then((r) => r.json() as Promise<ApiResponse>)
      .then((data) => {
        if (cancelled) return;
        if (data.ok) setDossier(data.dossier);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [dossierId]);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-6 py-18 lg:px-10">
      {!loaded ? (
        <p className="text-xs text-[rgb(var(--muted))]">Dossier wird geladen…</p>
      ) : null}
      <DossierViewer dossier={dossier} />
    </div>
  );
}
