// apps/web/src/app/daten/page.tsx
export default function DatenPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16 space-y-10">
      <h1 className="text-3xl font-bold text-coral text-center">
        Was passiert mit meinen Daten?
      </h1>

      <section className="bg-gray-50 p-6 rounded-lg shadow space-y-4">
        <p className="text-gray-700 text-lg">
          Wir legen großen Wert auf Datenschutz. Die Nutzung von VoiceOpenGov
          ist weitgehend anonym möglich – freiwillige Angaben kannst du
          jederzeit einsehen oder löschen.
        </p>

        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>Keine dauerhafte Speicherung deiner IP-Adresse</li>
          <li>Kein Einsatz von Tracking-Cookies oder externem Profiling</li>
          <li>
            Alle Daten unterliegen der DSGVO (Serverstandort: Deutschland)
          </li>
          <li>Transparente Datenverwaltung – jederzeit einsehbar & löschbar</li>
        </ul>

        <p className="text-sm text-gray-600">
          Fragen? Schreib uns unter{" "}
          <a
            href="mailto:datenschutz@voiceopengov.org"
            className="text-coral underline"
          >
            datenschutz@voiceopengov.org
          </a>
        </p>
      </section>

      <div className="text-center">
        <a
          href="/report"
          className="inline-block bg-coral text-white px-6 py-3 rounded font-semibold hover:opacity-90 transition"
        >
          Mehr zur Transparenz
        </a>
      </div>
    </main>
  );
}
