import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "So funktioniert ein Anlassraum - eDebatte",
  description:
    "Erklärung, wie aus einzelnen Beiträgen über Link und QR ein gemeinsamer Arbeitsstand entsteht.",
};

export default function RundenDemoPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl space-y-8 px-4 py-6 md:px-8 md:py-10">
      <header className="rounded-2xl border bg-[rgb(var(--card))] p-5 md:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[rgb(var(--muted))]">ANLASSRAUM</p>
        <h1 className="mt-2 text-3xl font-semibold leading-tight text-[rgb(var(--fg))] md:text-4xl">
          Aus einzelnen Beiträgen wird ein gemeinsamer Arbeitsstand
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[rgb(var(--muted))]">
          Ein Anlassraum sammelt Hinweise, Fragen, Widerspruch und Vorschläge an einem Ort. Per QR oder Link kommen
          Menschen direkt in genau diesen Raum. So entsteht aus vielen Einzelstimmen ein geordneter,
          nachvollziehbarer Stand.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <article className="rounded-xl border bg-[rgb(var(--card))] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">1</p>
          <h2 className="mt-1 text-base font-semibold text-[rgb(var(--fg))]">Anlass öffnen</h2>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
            Ein Thema, eine Frage oder ein Konflikt bekommt einen eigenen Raum.
          </p>
        </article>
        <article className="rounded-xl border bg-[rgb(var(--card))] p-4" id="teilnahmelogik">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">2</p>
          <h2 className="mt-1 text-base font-semibold text-[rgb(var(--fg))]">QR oder Link teilen</h2>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
            Auf Flyer, Website, Veranstaltung, Bühne, Video, Newsletter oder im Gespräch. Menschen landen direkt beim
            passenden Anlass.
          </p>
        </article>
        <article className="rounded-xl border bg-[rgb(var(--card))] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">3</p>
          <h2 className="mt-1 text-base font-semibold text-[rgb(var(--fg))]">Beiträge fließen geordnet ein</h2>
          <p className="mt-2 text-sm text-[rgb(var(--muted))]">
            Hinweise, Fragen, Widerspruch und Optionen gehen nicht verloren, sondern werden in einem gemeinsamen
            Arbeitsstand gebündelt.
          </p>
        </article>
      </section>

      <section className="rounded-2xl border bg-[rgb(var(--card))] p-5">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Aus dem Anlassraum wird:</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[rgb(var(--muted))]">
          <li>ein geordneter Arbeitsstand</li>
          <li>ein Dossier mit Kontext, Quellen und offenen Fragen</li>
          <li>bei Reife eine Abstimmung, Stellungnahme oder Nachverfolgung</li>
        </ul>
      </section>

      <section className="rounded-2xl border bg-[rgb(var(--card))] p-5">
        <h2 className="text-lg font-semibold text-[rgb(var(--fg))]">Warum das hilfreich ist</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[rgb(var(--muted))]">
          <li>Beiträge verschwinden nicht im Kommentarstrom</li>
          <li>unterschiedliche Sichtweisen bleiben sichtbar</li>
          <li>Quellen, Risiken und Alternativen können geordnet werden</li>
          <li>später wird nachvollziehbar, was daraus geworden ist</li>
        </ul>
      </section>

      <section className="flex flex-wrap gap-2">
        <Link
          href="/create?mode=source"
          className="inline-flex items-center justify-center rounded-lg bg-[rgb(var(--grad-from))] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Anlass öffnen
        </Link>
        <Link
          href="/runden/demo#teilnahmelogik"
          className="inline-flex items-center justify-center rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] px-4 py-2 text-sm font-semibold text-[rgb(var(--fg))] transition hover:bg-[rgb(var(--bg))]"
        >
          Teilnahmelogik verstehen
        </Link>
      </section>
    </main>
  );
}
