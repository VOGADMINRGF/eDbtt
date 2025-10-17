/* @ts-nocheck */
export default function Home() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="flex items-center justify-between">
        <a href="/" className="text-xl font-bold">VoiceOpenGov</a>
        <button className="p-2 rounded-md border md:hidden">☰</button>
        <nav className="hidden md:flex gap-4">
          <a className="hover:underline" href="/contributions/new">Schnell starten</a>
          <a className="hover:underline" href="/contributions/analyze">Vollanalyse</a>
        </nav>
      </header>

      <section className="mt-10">
        <h1 className="text-4xl font-extrabold tracking-tight">eDebatte – Deine Anliegen, sauber analysiert.</h1>
        <p className="mt-4 text-gray-600">
          Schreibe frei, wir extrahieren Kernaussagen, ordnen Themen zu, prüfen Fakten und zeigen transparent die KI-Schritte.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href="/contributions/new" className="px-4 py-2 rounded-lg bg-black text-white">Beitrag kurz analysieren</a>
          <a href="/contributions/analyze" className="px-4 py-2 rounded-lg border">Vollanalyse (Pro)</a>
        </div>
      </section>

      <section className="mt-10 grid md:grid-cols-3 gap-4">
        {[
          ["Kernaussagen", "1–3 Statements mit Relevanz-Sternen (editierbar)."],
          ["Transparenz", "Jeder Schritt (Kanon, Quellen, Checks) visuell nachvollziehbar."],
          ["Faktencheck", "Bei bedarfsgerechter Evidenz automatisch anstoßen."]
        ].map(([t,d],i)=>(
          <div key={i} className="p-4 rounded-xl border bg-white">
            <h3 className="font-semibold">{t}</h3>
            <p className="text-sm text-gray-600 mt-1">{d}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
