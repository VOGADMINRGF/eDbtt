import Link from "next/link";

export default function CommunityPage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-12">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Community</p>
        <h1 className="text-3xl font-bold text-slate-900">Räume & Austausch</h1>
        <p className="text-sm text-slate-600">
          Basis-Struktur für Community-Räume. Inhalte folgen iterativ, sobald die Streams und Campaigns live sind.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <RoomCard
          title="Buerger:innen Lounge"
          description="Offener Raum für kurze Updates, Fragen und Koordination."
          href="/chat"
        />
        <RoomCard
          title="Redaktion & Staff"
          description="Koordination von Research, Eventualitäten und Campaign-Updates."
          href="/chat"
        />
      </section>

      <div className="flex gap-4 text-sm">
        <Link href="/stream" className="font-semibold text-slate-600 hover:text-slate-900">
          Zu den Streams
        </Link>
        <Link href="/campaign" className="font-semibold text-slate-500 hover:text-slate-700">
          Campaigns ansehen
        </Link>
      </div>
    </main>
  );
}

function RoomCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Room</p>
      <h2 className="mt-2 text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mt-2 text-slate-600">{description}</p>
    </Link>
  );
}
