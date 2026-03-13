import Link from "next/link";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function MandatDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 space-y-4">
      <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">Mandat {id}</h1>
      <p className="text-sm text-[rgb(var(--muted))]">
        Detailansicht wird auf dieselbe Mandat-Surface aufgesetzt. Dieser Link ist bereits stabil
        und merge-sicher.
      </p>
      <Link href="/mandat" className="btn-secondary text-sm">
        Zurück zur Mandatsübersicht
      </Link>
    </main>
  );
}
