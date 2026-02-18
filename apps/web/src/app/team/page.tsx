export default function TeamPage() {
  return (
    <main className="min-h-screen bg-[rgb(var(--bg))] pb-16">
      <section className="mx-auto max-w-3xl px-4 py-16 space-y-8 text-center">
        <h1 className="headline-grad text-3xl font-extrabold md:text-4xl">Team</h1>
        <div className="space-y-4 text-[rgb(var(--muted))] text-lg">
        <p>
          eDebatte wird von einem interdisziplinären Team getragen – mit
          Fokus auf faire Verfahren, klare Regeln und eine verlässliche
          Infrastruktur.
        </p>
        <p>
          Du möchtest mitwirken oder kooperieren? Schreib uns gerne über{" "}
          <a className="font-semibold text-sky-700 underline underline-offset-4" href="/kontakt">
            /kontakt
          </a>
          .
        </p>
        </div>
      </section>
    </main>
  );
}
