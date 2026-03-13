import Link from "next/link";
import type { Eventuality, SwipeItem } from "@/features/swipes/types";

type SwipeDetailSheetProps = {
  open: boolean;
  item: SwipeItem | null;
  eventualities: Eventuality[] | null;
  loadingEventualities: boolean;
  dossierHref: string | null;
  evidenceHref: string | null;
  onClose: () => void;
};

export function SwipeDetailSheet({
  open,
  item,
  eventualities,
  loadingEventualities,
  dossierHref,
  evidenceHref,
  onClose,
}: SwipeDetailSheetProps) {
  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-[70]">
      <button
        type="button"
        aria-label="Detailansicht schließen"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
      />
      <section className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-[0_-24px_60px_rgba(2,6,23,0.45)] md:left-1/2 md:max-h-[86vh] md:w-[860px] md:-translate-x-1/2 md:rounded-3xl md:bottom-6">
        <header className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Vertiefung</p>
            <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">{item.title}</h3>
            <p className="text-sm text-[rgb(var(--muted))]">
              Haltungsentscheidung ist gespeichert. Jetzt kannst du Dossier, Evidenz und Varianten vergleichen.
            </p>
          </div>
          <button type="button" onClick={onClose} className="vog-chip">
            Schließen
          </button>
        </header>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Dossier</p>
            <p className="mt-2 text-sm text-[rgb(var(--fg))]">
              Öffne den vollständigen Entscheidungsraum mit Akte, Statusfluss, offenen Fragen und Optionen.
            </p>
            {dossierHref ? (
              <Link href={dossierHref} className="mt-3 inline-flex vog-chip vog-chip--active">
                Dossier öffnen
              </Link>
            ) : null}
          </article>

          <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Quellen & Evidenz</p>
            <p className="mt-2 text-sm text-[rgb(var(--fg))]">
              Evidenzstatus: {item.evidenceCount ?? 0} Hinweise. Prüfe Primärquellen und Gegenperspektiven.
            </p>
            {evidenceHref ? (
              <Link href={evidenceHref} className="mt-3 inline-flex vog-chip">
                Evidenz ansehen
              </Link>
            ) : null}
          </article>
        </div>

        <article className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Eventualitäten / Varianten</p>
          {loadingEventualities ? (
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">Lade Varianten …</p>
          ) : eventualities && eventualities.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {eventualities.map((evt) => (
                <li key={evt.id} className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-3 py-2">
                  <p className="text-sm font-semibold text-[rgb(var(--fg))]">{evt.shortLabel || evt.title}</p>
                  {evt.description ? <p className="mt-1 text-xs text-[rgb(var(--muted))]">{evt.description}</p> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">
              Für diese Karte liegen aktuell keine Varianten vor. Du kannst im Dossier eine Option vorschlagen.
            </p>
          )}
        </article>

        <article className="mt-3 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Nächste Schritte</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href="/abstimmungen" className="vog-chip vog-chip--active">
              Zur Abstimmung
            </Link>
            <Link href="/mitwirken" className="vog-chip">
              Mitwirken
            </Link>
            <Link href="/factcheck" className="vog-chip">
              Faktencheck
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}

