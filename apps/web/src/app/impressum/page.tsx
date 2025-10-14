// src/app/impressum/page.tsx

export default function ImpressumPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16 space-y-8">
      <h1 className="text-3xl font-bold text-coral text-center">Impressum</h1>

      <p className="text-gray-700 text-center text-lg">
        Angaben gemäß § 5 TMG und § 18 MStV für die Plattform VoiceOpenGov.
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4 text-gray-700">
        <p>
          <strong>Verantwortlich für den Inhalt:</strong>
        </p>
        <p>
          VoiceOpenGov – Initiative für digitale Beteiligung <br />
          Projekt in Gründung <br />
          Gerichtsstand Berlin <br />
          E-Mail:{" "}
          <a
            href="mailto:impressum@voiceopengov.org"
            className="underline text-coral"
          >
            impressum@voiceopengov.org
          </a>
        </p>

        <p>
          <strong>Verantwortlich gemäß § 55 Abs. 2 RStV:</strong>
        </p>
        <p>
          Redaktionsteam VoiceOpenGov <br />
          (Ehrenamtlich, demokratisch legitimiert, kollektiv organisiert)
        </p>

        <p>
          <strong>Haftungshinweis:</strong>
        </p>
        <p>
          Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung
          für die Inhalte externer Links. Für den Inhalt der verlinkten Seiten
          sind ausschließlich deren Betreiber verantwortlich.
        </p>
      </div>
    </main>
  );
}
