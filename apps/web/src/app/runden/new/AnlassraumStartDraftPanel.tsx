"use client";

type AnlassraumStartDraftPanelProps = {
  visible?: boolean;
  title?: string;
  statusLine?: string;
  helperText?: string;
};

export default function AnlassraumStartDraftPanel({
  visible = false,
  title = "Aus deinem Entwurf vorbereitet",
  statusLine = "Noch nicht veröffentlicht",
  helperText = "Du kannst Titel, Frage und Optionen ändern.",
}: AnlassraumStartDraftPanelProps) {
  if (!visible) return null;

  return (
    <section className="mt-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-4 py-4 text-sm text-[rgb(var(--fg))]">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[rgb(var(--muted))]">
        {title}
      </p>
      <p className="mt-2">{statusLine}</p>
      <p className="mt-1 text-[rgb(var(--muted))]">{helperText}</p>
    </section>
  );
}
