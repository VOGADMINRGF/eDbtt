export default function BarrierefreiheitPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[rgb(var(--bg))] pb-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_50%_at_50%_0%,rgba(56,189,248,0.18),transparent_60%),radial-gradient(55%_45%_at_80%_15%,rgba(168,85,247,0.16),transparent_55%),radial-gradient(55%_45%_at_20%_15%,rgba(34,197,94,0.10),transparent_55%)]" />
      <section className="relative mx-auto w-full max-w-3xl px-4 py-14 sm:py-16">
        <h1 className="text-center text-3xl font-bold text-coral">Barrierefreiheit</h1>
        <div className="space-y-4 text-center text-lg text-gray-700">
          <p>
            Wir möchten, dass eDebatte für alle Menschen gut nutzbar ist, auf dem Handy ebenso
            wie am Desktop.
          </p>
          <p>
            Wenn dir Barrieren auffallen, melde sie uns bitte über
            <a className="text-coral underline" href="/kontakt">
              {" "}
              /kontakt
            </a>
            . Wir prüfen jede Rückmeldung.
          </p>
        </div>
      </section>
    </main>
  );
}
