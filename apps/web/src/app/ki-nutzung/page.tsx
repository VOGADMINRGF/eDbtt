export default function KiNutzungPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[rgb(var(--bg))] pb-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_50%_at_50%_0%,rgba(56,189,248,0.18),transparent_60%),radial-gradient(55%_45%_at_80%_15%,rgba(168,85,247,0.16),transparent_55%),radial-gradient(55%_45%_at_20%_15%,rgba(34,197,94,0.10),transparent_55%)]" />
      <section className="relative mx-auto w-full max-w-3xl space-y-8 px-4 py-14 sm:py-16">
        <header className="space-y-4 text-center">
          <h1 className="text-3xl font-bold text-coral">KI-Nutzung</h1>
          <p className="text-lg text-gray-700">
            Wir setzen ausgewählte KI-Dienste ein, um Inhalte verständlich und fair aufzubereiten.
            Diese Übersicht zeigt, welche Anbieter eingebunden sind und nach welchen Prinzipien wir
            sie nutzen.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-[rgb(var(--fg))]">Eingesetzte Provider</h2>
          <p className="text-gray-700">
            Aktuell nutzen wir unter anderem Modelle von OpenAI, Anthropic, Mistral und, wo
            verfügbar, Gemini. Die konkrete Liste kann sich ändern, wenn wir bessere oder sicherere
            Alternativen finden.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-[rgb(var(--fg))]">Wofür wir KI einsetzen</h2>
          <ul className="list-disc space-y-2 pl-6 text-gray-700">
            <li>Analyse und Strukturierung von Beiträgen, Kontextkarten und Stellungnahmen.</li>
            <li>Übersetzungen und sprachliche Vereinheitlichung.</li>
            <li>Erklär- und Kontextkarten, damit Inhalte schneller verständlich werden.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-[rgb(var(--fg))]">Leitplanken</h2>
          <ul className="list-disc space-y-2 pl-6 text-gray-700">
            <li>Grundsatz: minimale personenbezogene Daten und transparente Dokumentation.</li>
            <li>Sensible Felder werden maskiert oder entfernt, wo das technisch möglich ist.</li>
            <li>KI-Ergebnisse werden geprüft, Entscheidungen treffen Menschen, nicht Modelle.</li>
          </ul>
          <p className="text-gray-700">
            Weitere Hinweise zu Datenverarbeitung, Cookies und Rechten findest du unter
            <a className="text-coral underline" href="/datenschutz">
              {" "}
              /datenschutz
            </a>
            .
          </p>
        </section>
      </section>
    </main>
  );
}
