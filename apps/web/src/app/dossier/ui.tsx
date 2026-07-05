"use client";

import * as React from "react";
import Link from "next/link";
import { CreateHandoffPanel } from "@/features/create/CreateHandoffPanel";
import { useCreateHandoffDraft } from "@/features/create/useCreateHandoffDraft";
import VoxyGuide from "@/components/voxy/VoxyGuide";
import { getVoxyCopy } from "@/features/voxy/voxyCopy";

function readableNextStepLabel(action?: string | null): string {
  switch (action) {
    case "append_to_dossier":
      return "Zusammenfassung ergänzen";
    case "create_dossier":
      return "Neue Themen-Zusammenfassung vorbereiten";
    case "request_factcheck":
      return "Prüfung vorbereiten";
    default:
      return "Nächsten Schritt auswählen";
  }
}

export default function DossierIndexClient(props: {
  handoffId?: string | null;
  createAction?: string | null;
  seedTopic?: string | null;
}) {
  const draft = useCreateHandoffDraft(props.handoffId ?? null);

  return (
    <div className="public-shell mx-auto w-full px-4 py-8 sm:px-6 sm:py-10">
      <div className="public-reader-grid">
        <aside className="public-voxy-rail">
          <VoxyGuide appearance="compact" title="Voxy als Prüfhinweis" variant="hint">
            {getVoxyCopy("dossier")}
          </VoxyGuide>
        </aside>

        <div className="public-dialog-area">
          <div className="public-section space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Themen-Zusammenfassung</p>
            <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">Aus deinem Beitrag wird ein verständlicher Überblick.</h1>
            <p className="text-sm text-[rgb(var(--muted))]">
              Eine Themen-Zusammenfassung bündelt Anliegen, prüfbare Aussagen, Quellenfragen, Gegenpositionen, Zuständigkeit und offene Punkte. Nichts wird automatisch veröffentlicht oder irgendwo angehängt.
            </p>
          </div>

          {draft ? (
            <div className="public-proof-zone mt-5 space-y-3">
              <CreateHandoffPanel draft={draft} title="Aus deinem Beitrag vorbereitet" />
              <div className="flex flex-wrap gap-2">
                <Link href="/community/contributions" className="btn-secondary min-h-[42px] px-3 py-2 text-sm">
                  Redaktionell prüfen lassen
                </Link>
                <Link href="/create" className="btn-secondary min-h-[42px] px-3 py-2 text-sm">
                  Beitrag weiter bearbeiten
                </Link>
              </div>
            </div>
          ) : (
            <div className="public-dialog-surface mt-5 space-y-4 px-4 py-5">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[rgb(var(--fg))]">
                  Noch keine Themen-Zusammenfassung geöffnet.
                </p>
                <p className="text-sm leading-6 text-[rgb(var(--muted))]">
                  Starte mit einem kurzen Beitrag. eDebatte kann daraus eine erste Struktur vorbereiten: Was ist die Kernfrage, welche Aussagen sind prüfbar, welche Belege fehlen und welche Gegenpositionen sollten sichtbar werden?
                  {props.seedTopic ? ` Themenhinweis: ${props.seedTopic}.` : ""}
                </p>
              </div>
              <div className="grid gap-2 text-sm text-[rgb(var(--muted))] sm:grid-cols-2">
                <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
                  <strong className="block text-[rgb(var(--fg))]">Was entsteht?</strong>
                  Beitrag, Kernaussagen, Quellenfragen, offene Punkte und nächster Prüfschritt.
                </div>
                <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-3">
                  <strong className="block text-[rgb(var(--fg))]">Was passiert nicht?</strong>
                  Keine automatische Veröffentlichung, keine automatische Verknüpfung, keine Entscheidung ohne Prüfung.
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/create?intent=create_dossier" className="btn-primary min-h-[42px] px-3 py-2 text-sm">
                  Beitrag zusammenfassen lassen
                </Link>
                <Link href="/themen" className="btn-secondary min-h-[42px] px-3 py-2 text-sm">
                  Beispielthemen ansehen
                </Link>
              </div>
            </div>
          )}

          <div className="public-flow-line mt-5 px-0 pt-4 text-sm text-[rgb(var(--muted))]">
            Nächster Schritt: {readableNextStepLabel(props.createAction)} · Veröffentlichung oder Verknüpfung erfolgt erst nach bewusster Bestätigung.
          </div>
        </div>
      </div>
    </div>
  );
}
