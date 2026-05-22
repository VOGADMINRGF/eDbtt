"use client";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
        <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
          <div className="rounded-[2rem] border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-8 shadow-[0_24px_64px_rgba(2,6,23,0.10)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
              Systemfehler
            </p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[rgb(var(--fg))]">
              Diese Ansicht konnte nicht geladen werden
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-[rgb(var(--muted))]">
              Der Fehlerpfad bleibt absichtlich minimal und ohne zusätzliche Provider,
              damit er auch im Notfall sicher rendert.
            </p>
            {error?.digest ? (
              <p className="mt-3 text-xs text-[rgb(var(--muted))]">
                Fehlerkennung: {error.digest}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => reset()}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
              >
                Erneut versuchen
              </button>
              <a
                href="/"
                className="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))]"
              >
                Zur Startseite
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
