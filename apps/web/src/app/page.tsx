/* @ts-nocheck */
export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <section className="mt-2">
        <h1 className="text-4xl font-extrabold tracking-tight">
          <span className="bg-gradient-to-r from-teal-500 to-blue-500 bg-clip-text text-transparent">
            eDebatte
          </span>{" "}
          – Deine Anliegen, sauber analysiert.
        </h1>

        <p className="mt-4 text-gray-600">
          Schreibe frei, wir extrahieren Kernaussagen, ordnen Themen zu, prüfen Fakten
          und zeigen transparent die KI-Schritte.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="/contributions/new"
            className="px-4 py-2 rounded-lg bg-black text-white"
          >
            Beitrag kurz analysieren
          </a>
          <a href="/contributions/analyze" className="px-4 py-2 rounded-lg border">
            Vollanalyse (Pro)
          </a>
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          ["Kernaussagen", "1–3 Statements mit Relevanz-Sternen (editierbar)."],
          ["Transparenz", "Jeder Schritt (Kanon, Quellen, Checks) visuell nachvollziehbar."],
          ["Faktencheck", "Bei bedarfsgerechter Evidenz automatisch anstoßen."],
        ].map(([t, d], i) => (
          <div key={i} className="rounded-xl border bg-white p-4">
            <h3 className="font-semibold">{t}</h3>
            <p className="mt-1 text-sm text-gray-600">{d}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
