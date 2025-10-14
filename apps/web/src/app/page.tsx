// apps/web/src/app/page.tsx
export const metadata = { title: "e-Debatte – Konsens finden" };
// Wir wollen im Dev keine Cache-Irritationen:
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[var(--brand-from)] to-[var(--brand-to)]">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl p-10 shadow-sm bg-white/70 backdrop-blur">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            e-Debatte
          </h1>
          <p className="mt-4 text-lg md:text-xl text-gray-700">
            Direkte Mitbestimmung – transparent, fair, digital. Starte eine Aussage,
            stimme ab, verfolge den Stream in Echtzeit.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
          <a href="/statements/new" className="inline-flex items-center rounded-2xl px-5 py-3 text-white shadow hover:opacity-95 transition bg-[var(--brand-accent-1)]">
  ✍️ Neue Aussage
</a>
            <a
              href="/stream"
              className="inline-flex items-center rounded-2xl px-5 py-3 border shadow-sm hover:bg-white transition
                         border-[var(--chip-border,#E5E7EB)] text-gray-900"
            >
              📡 Live-Stream
            </a>
            <a
              href="/swipe"
              className="inline-flex items-center rounded-2xl px-5 py-3 border shadow-sm hover:bg-white transition
                         border-[var(--chip-border,#E5E7EB)] text-gray-900"
            >
              🎯 Quick-Vote (Swipe)
            </a>
          </div>
        </div>

        <section className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl p-6 bg-white/70 backdrop-blur shadow-sm">
            <h3 className="font-semibold">1 · Aussage erstellen</h3>
            <p className="mt-2 text-sm text-gray-700">
              Klarer Titel, Kontext, Quellenlink. Optional: Region &amp; Sprache wählen.
            </p>
          </div>
          <div className="rounded-2xl p-6 bg-white/70 backdrop-blur shadow-sm">
            <h3 className="font-semibold">2 · Abstimmen &amp; teilen</h3>
            <p className="mt-2 text-sm text-gray-700">
              Stimmen sammeln und Debatte öffnen – fair, transparent, moderiert.
            </p>
          </div>
          <div className="rounded-2xl p-6 bg-white/70 backdrop-blur shadow-sm">
            <h3 className="font-semibold">3 · Ergebnisse verfolgen</h3>
            <p className="mt-2 text-sm text-gray-700">
              Live-Trends, Regionenvergleich, Zielmehrheiten. Evidenz statt Bauchgefühl.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
