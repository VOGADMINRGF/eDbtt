import Link from "next/link";
import { buildCreateHref } from "@/features/create/intents";

export default function MitwirkenPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10 space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">Mitwirken</p>
        <h1 className="text-3xl font-semibold text-[rgb(var(--fg))]">Beitrag einreichen ohne Umwege</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Der Einreichungsassistent führt immer in denselben Ablauf für Anlass, Thema und Beitrag.
        </p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href={buildCreateHref({ intent: "source" })} className="btn btn-primary text-sm">
          Anlass eröffnen
        </Link>
        <Link href={buildCreateHref({ intent: "question" })} className="btn-secondary text-sm">
          Frage einreichen
        </Link>
        <Link href={buildCreateHref({ intent: "perspective" })} className="btn-secondary text-sm">
          Perspektive ergänzen
        </Link>
        <Link href={buildCreateHref({ intent: "objection" })} className="btn-secondary text-sm">
          Widerspruch melden
        </Link>
      </div>
    </main>
  );
}
