import Link from "next/link";

export default function StreamerGuidePage() {
  return (
    <main className="min-h-screen bg-[rgb(var(--bg))] pb-16">
      <section className="mx-auto max-w-5xl px-4 py-16 space-y-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            Streamer Guide
          </p>
          <h1 className="headline-grad text-4xl font-extrabold leading-tight">
            Streamer:in werden auf eDebatte
          </h1>
          <p className="text-sm text-[rgb(var(--muted))] md:text-base">
            Kein Show-Format, sondern ein ruhiger Debattenmodus: Tagespunkte, Quellen, Optionen
            und klare Moderation.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
            <h2 className="text-base font-semibold text-[rgb(var(--fg))]">1. Zugang & Gating</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[rgb(var(--muted))]">
              <li>Verifizierter Account.</li>
              <li>Engagement-Level ab Brennend oder passender Access-Tier.</li>
              <li>Community-Richtlinien akzeptieren.</li>
            </ul>
          </article>
          <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
            <h2 className="text-base font-semibold text-[rgb(var(--fg))]">2. Setup in 5 Minuten</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[rgb(var(--muted))]">
              <li>Session in `Dashboard → Streams` anlegen.</li>
              <li>Agenda aus Thema ziehen oder manuell ergänzen.</li>
              <li>Overlay URL in OBS als Browser-Source einbinden.</li>
              <li>QR-Ziel je Tagespunkt setzen (z. B. `/qr/...`).</li>
              <li>Mit `Aktiv setzen` den Tagespunkt live schalten.</li>
            </ul>
          </article>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
            <h2 className="text-base font-semibold text-[rgb(var(--fg))]">3. Moderationsmodus</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[rgb(var(--muted))]">
              <li>Fragen und Polls nur entlang der Agenda.</li>
              <li>Quellen und Gegenpositionen sichtbar halten.</li>
              <li>Keine Stimmungsmache, keine Personalisierung.</li>
            </ul>
          </article>
          <article className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 shadow-sm">
            <h2 className="text-base font-semibold text-[rgb(var(--fg))]">4. Nützliche Links</h2>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <Link className="rounded-full border border-[rgb(var(--border))] px-4 py-2" href="/dashboard/streams">
                Stream Dashboard
              </Link>
              <Link className="rounded-full border border-[rgb(var(--border))] px-4 py-2" href="/stream">
                Öffentliche Streams
              </Link>
              <Link className="rounded-full border border-[rgb(var(--border))] px-4 py-2" href="/howtoworks/edebatte">
                eDebatte erklärt
              </Link>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
