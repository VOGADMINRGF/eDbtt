import Link from "next/link";

type SwipeAuthGateProps = {
  open: boolean;
  count: number;
  limit: number;
  onClose: () => void;
};

export function SwipeAuthGate({ open, count, limit, onClose }: SwipeAuthGateProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85]">
      <button
        type="button"
        aria-label="Anmeldehinweis schließen"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"
      />
      <section className="absolute inset-x-0 bottom-0 rounded-t-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 shadow-[0_-24px_60px_rgba(2,6,23,0.45)] md:left-1/2 md:w-[560px] md:-translate-x-1/2 md:rounded-3xl md:bottom-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">Weiter abstimmen</p>
        <h3 className="mt-2 text-xl font-semibold text-[rgb(var(--fg))]">
          Du hast {Math.max(count, limit)} Themen eingeordnet.
        </h3>
        <p className="mt-2 text-sm text-[rgb(var(--muted))]">
          Melde dich an, um weiter abzustimmen, Varianten zu vergleichen und deine Tendenz zu speichern.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link href="/register?next=%2Fswipes" className="btn-primary h-11 justify-center text-sm">
            Kostenlos registrieren
          </Link>
          <Link href="/login?next=%2Fswipes" className="btn-secondary h-11 justify-center text-sm">
            Login
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link href="/dossier/demo?mode=lesen" className="btn-secondary h-11 justify-center text-sm">
            Dossier weiterlesen
          </Link>
          <button type="button" onClick={onClose} className="btn-secondary h-11 justify-center text-sm">
            Später
          </button>
        </div>
      </section>
    </div>
  );
}
