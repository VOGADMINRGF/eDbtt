import Link from "next/link";
import { VOG_SUPPORT_URL } from "@/config/links";

export default function UnterstuetzenPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[rgb(var(--bg))] pb-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute left-0 top-1/3 h-80 w-80 rounded-full bg-emerald-100/45 blur-3xl" />
      </div>

      <section className="relative mx-auto max-w-4xl px-4 py-16 space-y-10">
        <header className="text-center space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Vorbestellung</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-[rgb(var(--fg))]">
            eDebatte vorbestellen
          </h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[rgb(var(--muted))]">
            eDebatte ist aktuell im Aufbau. Mit einer Vorbestellung hilfst du uns, Funktionen sauber zu priorisieren,
            realistische Starttermine zu planen und den Betrieb stabil aufzubauen.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
              Warum Vorbestellung?
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[rgb(var(--muted))]">
              <li>Server- und Moderationskosten sauber planen.</li>
              <li>Keine Werbung, kein Verkauf von Daten.</li>
              <li>Frueher Zugriff auf neue Funktionen und Pilot-Formate.</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Was jetzt?</p>
            <p className="mt-2 text-sm text-[rgb(var(--muted))]">
              Waehle dein Paket auf der Pricing-Seite. Dort kannst du dein Interesse unverbindlich vormerken.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-start">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-[rgb(var(--grad-from))] to-[rgb(var(--grad-to))] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(24,165,255,0.25)] hover:opacity-95"
              >
                Vorbestellung ansehen
              </Link>
              <a
                href={VOG_SUPPORT_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-5 py-2.5 text-sm font-semibold text-[rgb(var(--muted))] hover:bg-[color-mix(in_oklab,rgb(var(--card))_85%,rgb(var(--bg))_15%)] hover:text-[rgb(var(--fg))]"
              >
                VoiceOpenGov unterstuetzen
              </a>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-[rgb(var(--muted))]">
          Hinweis: Unterstuetzung laeuft extern ueber VoiceOpenGov und bringt keine Stimmvorteile.
        </p>
      </section>
    </main>
  );
}
