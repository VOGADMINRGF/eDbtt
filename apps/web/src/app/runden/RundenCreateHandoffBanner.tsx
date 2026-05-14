"use client";

import { CreateHandoffPanel } from "@/features/create/CreateHandoffPanel";
import { useCreateHandoffDraft } from "@/features/create/useCreateHandoffDraft";

export default function RundenCreateHandoffBanner(props: {
  handoffId?: string | null;
  createAction?: string | null;
}) {
  const draft = useCreateHandoffDraft(props.handoffId ?? null);
  if (!draft) return null;

  return (
    <section className="space-y-2">
      <CreateHandoffPanel draft={draft} title="Aus /create in den Anlassraum übernommen" />
      <p className="text-xs text-[rgb(var(--muted))]">
        Anlassräume werden daraus nur reviewbar weitergeführt. Keine automatische Veröffentlichung, kein stiller
        Themen- oder Graph-Merge.
      </p>
      <p className="text-xs text-[rgb(var(--muted))]">
        Zielaktion: {props.createAction ?? "prepare_anlassraum"}.
      </p>
    </section>
  );
}
