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
      return "Dossier ergänzen";
    case "create_dossier":
      return "Neues Dossier vorbereiten";
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
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Vorbereiteter Beitrag</p>
            <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">Dossier vorbereiten</h1>
            <p className="text-sm text-[rgb(var(--muted))]">
              Hier wird nichts automatisch an ein bestehendes Dossier angehängt. Der Arbeitsstand bleibt reviewbar und bestaetigungspflichtig.
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
                  Zurück zu /create
                </Link>
              </div>
            </div>
          ) : (
            <div className="public-dialog-surface mt-5 px-4 py-5">
              <p className="text-sm text-[rgb(var(--muted))]">
                Noch kein vorbereiteter Beitrag gefunden.
                {props.seedTopic ? ` Themenhinweis: ${props.seedTopic}.` : ""}
              </p>
            </div>
          )}

          <div className="public-flow-line mt-5 px-0 pt-4 text-sm text-[rgb(var(--muted))]">
            Nächster Schritt: {readableNextStepLabel(props.createAction)} · Keine automatische Anheftung an bestehende Dossiers ohne Bestätigung.
          </div>
        </div>
      </div>
    </div>
  );
}
