import Link from "next/link";
import type { Eventuality, SwipeItem } from "@/features/swipes/types";

type SwipeDetailSheetProps = {
  open: boolean;
  item: SwipeItem | null;
  eventualities: Eventuality[] | null;
  loadingEventualities: boolean;
  dossierHref: string | null;
  evidenceHref: string | null;
  votesHref: string | null;
  onClose: () => void;
};

export function SwipeDetailSheet({
  open,
  item,
  eventualities,
  loadingEventualities,
  dossierHref,
  evidenceHref,
  votesHref,
  onClose,
}: SwipeDetailSheetProps) {
  if (!open || !item) return null;

  const contextHref = typeof item.contextHref === "string" ? item.contextHref : null;
  const contextLabel = contextHref?.startsWith("/runden")
    ? "Zum Thema"
    : contextHref?.startsWith("/create")
      ? "Etwas ergänzen"
      : contextHref
        ? "Zum Zusammenhang"
        : null;
  const shortContext = resolveShortContext(item.text);

  return (
    <div className="fixed inset-0 z-[70]">
      <button type="button" aria-label="Mehr erfahren schließen" onClick={onClose} className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]" />
      <section className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-[0_-24px_60px_rgba(2,6,23,0.45)] md:left-1/2 md:bottom-6 md:max-h-[86vh] md:w-[860px] md:-translate-x-1/2 md:rounded-3xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(100%_100%_at_100%_0%,rgba(14,165,233,0.11),rgba(15,23,42,0)_45%)]" />
        <header className="relative flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Mehr erfahren</p>
            <h3 className="text-xl font-semibold text-[rgb(var(--fg))]">{item.title}</h3>
          </div>
          <button type="button" onClick={onClose} className="vog-chip">Schließen</button>
        </header>

        <article className="relative mt-5 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Kurz erklärt</p>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--fg))]">
            {shortContext || "Zu dieser Frage kannst du Hintergründe, mögliche Folgen und Quellen ansehen, bevor du dich entscheidest."}
          </p>
          {item.supplyLabel ? (
            <p className="mt-3 text-xs leading-5 text-[rgb(var(--muted))]">
              <span className="font-semibold text-[rgb(var(--fg))]">Warum sehe ich das?</span> {item.supplyLabel}{item.supplyHint ? ` · ${item.supplyHint}` : ""}
            </p>
          ) : null}
        </article>

        <article className="relative mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Möglichkeiten & Folgen</p>
          {loadingEventualities ? (
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">Lade weitere Perspektiven …</p>
          ) : eventualities && eventualities.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {eventualities.slice(0, 4).map((evt) => (
                <li key={evt.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-3">
                  <p className="text-sm font-semibold text-[rgb(var(--fg))]">{evt.shortLabel || evt.title}</p>
                  {evt.description ? <p className="mt-1 text-xs leading-5 text-[rgb(var(--muted))]">{evt.description}</p> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">Dazu sind noch keine weiteren Möglichkeiten hinterlegt. Wenn etwas fehlt, kannst du es ergänzen.</p>
          )}
        </article>

        <div className="relative mt-3 grid gap-3 md:grid-cols-2">
          <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Quellen</p>
            <p className="mt-2 text-sm leading-6 text-[rgb(var(--fg))]">
              {item.evidenceCount > 0 ? `${item.evidenceCount} Quellenhinweise sind mit dieser Frage verbunden.` : "Noch keine Quellenhinweise vorhanden."}
            </p>
            {evidenceHref ? <Link href={evidenceHref} className="mt-3 inline-flex vog-chip">Quellen ansehen</Link> : null}
          </article>

          <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Was ist noch offen?</p>
            <p className="mt-2 text-sm leading-6 text-[rgb(var(--fg))]">
              {item.eventualitiesCount > 0 ? `${item.eventualitiesCount} weitere Möglichkeiten oder offene Punkte sind hinterlegt.` : "Noch keine offenen Punkte hinterlegt. Du kannst fehlende Perspektiven sichtbar machen."}
            </p>
            {contextHref && contextLabel ? <Link href={contextHref} className="mt-3 inline-flex vog-chip">{contextLabel}</Link> : null}
          </article>
        </div>

        <article className="relative mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Noch tiefer einsteigen</p>
          <p className="mt-2 text-sm leading-6 text-[rgb(var(--muted))]">Wenn du den vollständigen Hintergrund sehen möchtest, findest du dort Quellen, offene Fragen, Zusammenhänge und den aktuellen Stand.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {dossierHref ? <Link href={dossierHref} className="vog-chip vog-chip--active">Vollständigen Hintergrund öffnen</Link> : null}
            {votesHref ? <Link href={votesHref} className="vog-chip">Meinungsbild ansehen</Link> : null}
            <Link href="/mitwirken" className="vog-chip">Etwas ergänzen</Link>
          </div>
        </article>
      </section>
    </div>
  );
}

function resolveShortContext(text?: string) {
  const value = text?.trim();
  if (!value) return null;
  const sentences = value.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.slice(0, 2).join(" ");
}
