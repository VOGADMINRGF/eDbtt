// apps/web/src/app/satzung/page.tsx
export default function SatzungPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-16 space-y-10">
      <h1 className="text-3xl font-bold text-coral text-center">Satzung</h1>

      <section className="space-y-6 text-gray-700">
        <article className="bg-white border-l-4 border-coral p-4 rounded shadow-sm">
          <h2 className="font-semibold">§1 Zweck</h2>
          <p>
            Förderung politischer Partizipation und demokratischer Transparenz.
          </p>
        </article>

        <article className="bg-white border-l-4 border-coral p-4 rounded shadow-sm">
          <h2 className="font-semibold">§2 Mittel</h2>
          <p>
            Digitale Beteiligungsformate, offene Debatten und politische
            Bildung.
          </p>
        </article>

        <article className="bg-white border-l-4 border-coral p-4 rounded shadow-sm">
          <h2 className="font-semibold">§3 Mitgliedschaft</h2>
          <p>
            Offen für alle – freiwillig, beitragsbasiert, jederzeit kündbar.
          </p>
        </article>

        <article className="bg-white border-l-4 border-coral p-4 rounded shadow-sm">
          <h2 className="font-semibold">§4 Entscheidungsprozesse</h2>
          <p>Communitybasiert, fair, transparent und dokumentiert.</p>
        </article>

        <article className="bg-white border-l-4 border-coral p-4 rounded shadow-sm">
          <h2 className="font-semibold">§5 Finanzierung</h2>
          <p>Durch Mitgliedschaften, Spenden, Fördermittel – keine Werbung.</p>
        </article>
      </section>

      <div className="text-center space-y-3">
        <a
          href="/satzung.pdf"
          className="inline-block border border-coral text-coral px-6 py-2 rounded font-medium hover:bg-coral hover:text-white transition"
        >
          Satzung als PDF herunterladen
        </a>
        <div>
          <a
            href="/unterstuetzen"
            className="text-sm underline text-gray-600 hover:text-coral"
          >
            → Mitglied werden
          </a>
        </div>
      </div>
    </main>
  );
}
