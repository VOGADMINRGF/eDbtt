import Link from "next/link";

export default function PrivatsphaerePage() {
  return (
    <main className="min-h-screen bg-[rgb(var(--bg))] pb-16">
      <section className="mx-auto max-w-5xl px-4 pt-14">
        <div className="rounded-3xl bg-[rgb(var(--card))] p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] ring-1 ring-[rgb(var(--border))] md:p-10">
          <header className="space-y-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">Privatsphäre</p>
            <h1 className="text-3xl font-extrabold leading-tight text-[rgb(var(--fg))] md:text-4xl">
              Privatsphäre &amp; Datensicherheit
            </h1>
            <p className="text-sm leading-relaxed text-[rgb(var(--muted))] md:text-base">
              Auf dieser Seite findest du die wichtigsten Wege zu Datenschutz, Widerspruch und
              Kontosicherheit. So gelangst du schnell dorthin, wo du Entscheidungen treffen oder
              Hilfe bekommen kannst.
            </p>
          </header>

          <div className="mt-8 grid gap-4">
            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-4 text-sm text-[rgb(var(--fg))]">
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                Schnellzugriff
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <LinkCard
                  href="/datenschutz"
                  label="Datenschutz"
                  body="Verarbeitungszwecke, Rechte und Kontakt."
                />
                <LinkCard
                  href="/widerspruch"
                  label="Widerspruch & Kündigung"
                  body="Widerspruch gegen Datenverarbeitung oder Kündigung."
                />
                <LinkCard
                  href="/account/security"
                  label="Kontosicherheit"
                  body="Sicherheitsoptionen für dein Konto."
                />
              </div>
            </div>

            <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 text-sm text-[rgb(var(--fg))] shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
                Transparenz & Kontrolle
              </p>
              <p className="mt-2">
                Wenn du noch Fragen hast oder einen konkreten Fall klären möchtest, melde dich
                jederzeit über das Kontaktformular.
              </p>
              <Link
                href="/kontakt"
                className="mt-3 inline-flex font-semibold text-sky-700 underline underline-offset-4"
              >
                Kontakt aufnehmen
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function LinkCard({ href, label, body }: { href: string; label: string; body: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-3 text-left text-sm text-[rgb(var(--muted))] shadow-sm transition hover:border-[rgb(var(--border))] hover:text-[rgb(var(--fg))]"
    >
      <p className="font-semibold text-[rgb(var(--fg))]">{label}</p>
      <p className="mt-1 text-xs text-[rgb(var(--muted))]">{body}</p>
    </Link>
  );
}
