"use client";

import { useEffect, useMemo, useState } from "react";
import type { Dossier } from "@features/dossier";
import demoFallback from "@features/dossier/data/demoDossier";
import { DossierViewer } from "./DossierViewer";
import type { DossierDataState, DossierEntry } from "@features/dossier/modes";

type DossierSurfaceProps = {
  dossierId?: string;
  entry: DossierEntry;
  source: "api" | "demo";
};

type ApiResponse =
  | { ok: true; dossier: Dossier; serverTimestamp?: string }
  | { ok: false; error?: string };

function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "positive" | "warning";
}) {
  const toneClass =
    tone === "positive"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
      : tone === "warning"
        ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
        : "border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))]";
  return (
    <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${toneClass}`}>
      {label}
    </span>
  );
}

export default function DossierSurface({ dossierId, entry, source }: DossierSurfaceProps) {
  const [dossier, setDossier] = useState<Dossier>(demoFallback);
  const [dataState, setDataState] = useState<DossierDataState>(source === "demo" ? "demo" : "loading");
  const [serverTimestamp, setServerTimestamp] = useState<string | null>(null);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (source === "demo") {
      fetch("/api/demo/dossier", { cache: "no-store" })
        .then((r) => r.json() as Promise<ApiResponse>)
        .then((data) => {
          if (cancelled) return;
          if (data.ok) {
            setDossier(data.dossier);
            setServerTimestamp(data.serverTimestamp ?? null);
            setBackendOk(true);
            setDataState("demo");
          } else {
            setBackendOk(false);
            setDataState(entry === "demo" ? "demo" : "fallback");
          }
        })
        .catch(() => {
          if (cancelled) return;
          setBackendOk(false);
          setDataState(entry === "demo" ? "demo" : "fallback");
        });
      return () => {
        cancelled = true;
      };
    }

    if (!dossierId) return () => {
      cancelled = true;
    };

    fetch(`/api/dossier/${encodeURIComponent(dossierId)}`, { cache: "no-store" })
      .then((r) => r.json() as Promise<ApiResponse>)
      .then((data) => {
        if (cancelled) return;
        if (data.ok) {
          setDossier(data.dossier);
          setBackendOk(true);
          setDataState("live");
        } else {
          setBackendOk(false);
          setDataState(entry === "demo" ? "demo" : "fallback");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setBackendOk(false);
        setDataState(entry === "demo" ? "demo" : "fallback");
      });

    return () => {
      cancelled = true;
    };
  }, [dossierId, entry, source]);

  const statusLabel = useMemo(() => {
    if (dataState === "loading") return "Lädt …";
    if (dataState === "live") return "Echtdaten";
    if (dataState === "demo") return "Demo-Simulation";
    return "Fallback";
  }, [dataState]);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-6 py-12 lg:px-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[rgb(var(--muted))]">
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill label={entry === "demo" ? "Demo-Ansicht" : "Dossier"} />
          <StatusPill
            label={statusLabel}
            tone={dataState === "live" ? "positive" : dataState === "fallback" ? "warning" : "neutral"}
          />
          {backendOk === false ? (
            <StatusPill label="Backend nicht erreichbar" tone="warning" />
          ) : null}
        </div>
        {serverTimestamp ? (
          <div className="rounded-full border border-[rgb(var(--border))] px-2 py-1 text-[10px]">
            Server-Stand: <span className="font-semibold text-[rgb(var(--fg))]">{serverTimestamp}</span>
          </div>
        ) : null}
      </div>

      <DossierViewer dossier={dossier} context={{ entry, dataState, serverTimestamp }} />
    </div>
  );
}
