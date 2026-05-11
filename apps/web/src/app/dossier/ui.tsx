"use client";

import * as React from "react";
import Link from "next/link";
import { CreateHandoffPanel } from "@/features/create/CreateHandoffPanel";
import { useCreateHandoffDraft } from "@/features/create/useCreateHandoffDraft";

export default function DossierIndexClient(props: {
  handoffId?: string | null;
  createAction?: string | null;
  seedTopic?: string | null;
}) {
  const draft = useCreateHandoffDraft(props.handoffId ?? null);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">Dossier-Handoff</p>
        <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">Dossier vorbereiten</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Hier wird nichts automatisch an ein bestehendes Dossier angehängt. Der Arbeitsstand bleibt reviewbar und bestaetigungspflichtig.
        </p>
      </div>

      {draft ? (
        <div className="mt-5 space-y-3">
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
        <div className="mt-5 rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-5">
          <p className="text-sm text-[rgb(var(--muted))]">
            Noch kein Create-Handoff gefunden.
            {props.seedTopic ? ` Seed-Thema: ${props.seedTopic}.` : ""}
          </p>
        </div>
      )}

      <div className="mt-5 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-4 text-sm text-[rgb(var(--muted))]">
        Zielaktion: {props.createAction ?? "create_dossier"} · Keine automatische Anheftung an bestehende Dossiers ohne Bestätigung.
      </div>
    </div>
  );
}
