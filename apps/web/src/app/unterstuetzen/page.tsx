// src/app/unterstuetzen/page.tsx

export default function UnterstuetzenPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 pt-24 pb-16 space-y-8">
      <h1 className="text-4xl font-extrabold text-coral text-center">
        Unterstützen
      </h1>

      <p className="text-gray-800 text-lg text-center max-w-2xl mx-auto">
        VoiceOpenGov ist eine gemeinwohlorientierte Plattform – unabhängig,
        datensicher und demokratisch. Deine Unterstützung macht politische
        Teilhabe möglich.
      </p>

      <section className="bg-[#F0FAF9] border-l-4 border-[#00B3A6] rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[#00B3A6] mb-2">
          Warum unterstützen?
        </h2>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>Barrierefreie Weiterentwicklung</li>
          <li>Redaktionelle Aufarbeitung & Moderation</li>
          <li>Unabhängige Infrastruktur (DSGVO-konform)</li>
        </ul>
      </section>

      <section className="bg-[#FFF6F5] border-l-4 border-[#FF6F61] rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-[#FF6F61] mb-2">
          Mitgliedschaften
        </h2>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li>
            <strong>10 €/Monat:</strong> Zugang zu exklusiven Reports
          </li>
          <li>
            <strong>50 €/Monat:</strong> Fördermitgliedschaft
          </li>
          <li>Freiwillig, monatlich kündbar</li>
        </ul>
      </section>

      <div className="text-center">
        <a
          href="/mitglied-werden"
          className="inline-block bg-[#4B0082] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition"
        >
          Jetzt unterstützen
        </a>
      </div>
    </main>
  );
}
