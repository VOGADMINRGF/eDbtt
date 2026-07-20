import Link from "next/link";
import demoDossier from "@features/dossier/data/demoDossier";
import { buildCanonicalDossierHref } from "@/components/dossier/runtimeTruth";

export default function StreamsIndexPage() {
  const demoStreamsHref =
    buildCanonicalDossierHref(demoDossier.meta.id, { anchor: "streams" }) ?? "/dossier";

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 text-[rgb(var(--fg))]">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Themenströme
        </p>
        <h1 className="text-2xl font-semibold">Überblick über Streams</h1>
        <p className="text-sm text-[rgb(var(--muted))]">
          Diese Ansicht bündelt die aktuellen Themenströme. In der Demo ist der Überblick mit dem
          Dossier verknüpft.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href={demoStreamsHref} className="btn btn-ghost text-xs">
            Zum Demo-Dossier
          </Link>
        </div>
      </div>
    </main>
  );
}
