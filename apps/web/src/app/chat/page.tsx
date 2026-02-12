import Link from "next/link";

export default function ChatPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Chat</p>
        <h1 className="text-3xl font-bold text-slate-900">Community Chat (Skeleton)</h1>
        <p className="text-sm text-slate-600">
          Dies ist ein bewusst schlankes Grundgeruest. Realtime-Provider und Moderations-Logik folgen in einem
          separaten Block.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm">
        <p className="text-slate-700">
          Chat ist derzeit read-only geplant. Sobald die Infrastruktur steht, werden hier Topics, Reactions und
          Moderation sichtbar gemacht.
        </p>
      </section>

      <div className="flex gap-4 text-sm">
        <Link href="/community" className="font-semibold text-slate-600 hover:text-slate-900">
          Zurueck zu den Raeumen
        </Link>
        <Link href="/stream" className="font-semibold text-slate-500 hover:text-slate-700">
          Streams ansehen
        </Link>
      </div>
    </main>
  );
}
