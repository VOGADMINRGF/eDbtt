"use client";

type AnlassraumStartDraftPanelProps = {
  visible?: boolean;
};

export default function AnlassraumStartDraftPanel({
  visible = false,
}: AnlassraumStartDraftPanelProps) {
  if (!visible) return null;

  return (
    <section className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-4 text-sm text-[rgb(var(--fg))]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
        Aus deinem Entwurf vorbereitet
      </p>
      <p className="mt-2">Noch nicht veröffentlicht</p>
      <p className="mt-1 text-[rgb(var(--muted))]">Du kannst Titel, Frage und Optionen ändern.</p>
    </section>
  );
}
