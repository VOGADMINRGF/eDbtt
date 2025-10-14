// src/app/mitglied-werden/page.tsx

export default function MitgliedWerdenPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16 space-y-8">
      <h1 className="text-3xl font-bold text-coral text-center">
        Mitglied werden
      </h1>

      <p className="text-gray-700 text-lg text-center">
        Als Mitglied stärkst du unabhängige digitale Beteiligung und machst
        politische Mitgestaltung möglich.
      </p>

      <div className="space-y-4 text-gray-700">
        <p>
          <strong>Was du bekommst:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Früher Zugang zu Reports & Voting-Ergebnissen</li>
          <li>Einblick in Plattform-Entwicklung & Priorisierungen</li>
          <li>Exklusive Community-Einladungen & Beteiligungsmöglichkeiten</li>
        </ul>

        <p>
          <strong>Wie du helfen kannst:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>10 €/Monat:</strong> Aktivmitglied mit Reporting-Zugang
          </li>
          <li>
            <strong>25 €/Monat:</strong> Engagiertes Mitglied
          </li>
          <li>
            <strong>50 €/Monat:</strong> Fördermitglied mit Backstage-Einblicken
          </li>
        </ul>
      </div>

      <div className="text-center">
        <a
          href="https://voiceopengov.org/beitritt"
          className="inline-block bg-coral text-white px-6 py-3 rounded font-semibold hover:opacity-90 transition"
        >
          Jetzt Mitglied werden
        </a>
      </div>
    </main>
  );
}
