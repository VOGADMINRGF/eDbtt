import PackagesGrid from "@/components/pricing/PackagesGrid";

export default function PricingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[var(--brand-from)] via-white to-white pb-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 right-0 h-64 w-64 rounded-full bg-sky-200/35 blur-3xl" />
        <div className="absolute left-0 top-1/3 h-80 w-80 rounded-full bg-emerald-100/45 blur-3xl" />
      </div>

      <section className="relative mx-auto max-w-6xl px-4 py-12 lg:py-16">
        <header className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pakete</p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">Pakete & Vormerkung</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            eDebatte ist im Aufbau. Du kannst dir schon jetzt ein Paket vormerken – unverbindlich und ohne Zahlung.
          </p>
        </header>

        <div className="mt-10">
          <PackagesGrid />
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { title: "Unverbindlich", text: "Vormerken heißt: kein Abo, keine Zahlung. Nur Interesse speichern." },
            { title: "Start-Info", text: "Wenn der Starttermin steht, bekommst du die Details (optional per Mail)." },
            { title: "Später anpassen", text: "Paketwechsel jederzeit möglich – im Konto oder erneut per Vormerkung." },
          ].map((b) => (
            <div key={b.title} className="rounded-3xl border border-slate-200 bg-white/90 p-5 text-sm shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{b.title}</p>
              <p className="mt-2 text-slate-700">{b.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
