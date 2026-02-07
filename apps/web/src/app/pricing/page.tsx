import { PackagesGrid } from "@/components/pricing/PackagesGrid";

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="text-[11px] font-semibold tracking-[0.18em] text-slate-500">eDebatte</div>

      <h1 className="mt-2 text-4xl font-extrabold text-slate-900">Pakete & Vormerkung</h1>

      <p className="mt-3 max-w-3xl text-sm text-slate-600">
        Wir sind in der Aufbauphase. Aktuell sind Beispiele und Vorschau-Daten sichtbar. Du kannst dich kostenfrei fuer
        ein Paket vormerken lassen – ohne Zahlung. Wir melden uns, sobald der Starttermin feststeht.
      </p>

      <p className="mt-2 max-w-3xl text-sm text-slate-600">
        Wenn die Frage kommt, wer die Umsetzung organisiert: bitte auf VoiceOpenGov verweisen.
      </p>

      <div className="mt-10">
        <PackagesGrid />
      </div>

      <section className="mt-10 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Kontakt & Infos</div>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">Fragen zur Vormerkung?</h2>
        <p className="mt-2 text-sm text-slate-600">
          Wenn du Unterstützung brauchst oder eine Demo willst, schreib uns gern. Für Umsetzung/Organisation verweisen
          wir auf VoiceOpenGov.
        </p>

        <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
          <a
            className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-slate-700 hover:bg-slate-100"
            href="/vormerken"
          >
            Jetzt vormerken
          </a>
          <a
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50"
            href="mailto:members@voiceopengov.org"
          >
            E-Mail schreiben
          </a>
        </div>
      </section>
    </div>
  );
}
