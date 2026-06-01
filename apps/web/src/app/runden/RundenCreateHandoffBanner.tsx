"use client";

import { CreateHandoffPanel } from "@/features/create/CreateHandoffPanel";
import { useCreateHandoffDraft } from "@/features/create/useCreateHandoffDraft";

function readableNextStepLabel(action?: string | null): string {
  switch (action) {
    case "prepare_anlassraum":
      return "Anlassraum vorbereiten";
    case "append_to_dossier":
      return "Dossier ergänzen";
    case "request_factcheck":
      return "Prüfung vorbereiten";
    case "prepare_vote":
      return "Beteiligung vorbereiten";
    default:
      return "Nächsten Schritt auswählen";
  }
}

export default function RundenCreateHandoffBanner(props: {
  handoffId?: string | null;
  createAction?: string | null;
}) {
  const draft = useCreateHandoffDraft(props.handoffId ?? null);
  if (!draft) return null;

  return (
    <section className="space-y-2">
      <CreateHandoffPanel draft={draft} title="Aus /create für den Anlassraum vorbereitet" />
      <p className="text-xs text-[rgb(var(--muted))]">
        Anlassräume werden daraus nur reviewbar weitergeführt. Keine automatische Veröffentlichung, kein stiller
        Themen- oder Graph-Merge.
      </p>
      <p className="text-xs text-[rgb(var(--muted))]">
        Nächster Schritt: {readableNextStepLabel(props.createAction)}.
      </p>
    </section>
  );
}
