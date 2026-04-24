"use client";

import { useEffect, useState } from "react";
import type { Dossier } from "@features/dossier";
import demoFallback from "@features/dossier/data/demoDossier";
import { DossierViewer } from "@/components/dossier/DossierViewer";
import RouteBoundCompanionPanel from "@/components/ai/RouteBoundCompanionPanel";

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
      <p className="mb-3 text-xs text-[rgb(var(--muted))]">
        Dossier = strukturierte Verdichtung; der thematische Arbeitskontext bleibt bei den Anlässen (/runden).
      </p>
      <div className="mb-4">
        <RouteBoundCompanionPanel
          contextKind="dossier"
          title="Dossier"
          routePath={`/dossier/${dossierId}`}
          analysisMode="media"
          intro="Companion für Dossier-Nachfragen auf Media-/Dossier-Journey, ohne implizites Siegel."
          placeholder="Welche Konfliktlinie oder Quelle soll im Dossier als Nächstes geklärt werden?"
          parentStatus={{
            lane: "standard",
            verificationMode: "precheck",
            researchUsed: "none",
            sealEligible: false,
            sealGranted: false,
          }}
        />
      </div>
      <DossierViewer dossier={dossier} />
    </div>
  );
}
