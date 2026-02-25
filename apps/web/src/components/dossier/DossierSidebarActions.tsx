import type { ReactNode } from "react";
import Link from "next/link";

export default function DossierSidebarActions({
  dossierId,
  counts,
  exportNode,
}: {
  dossierId: string;
  counts: { streams: number; contributions: number; claims: number; sources: number };
  exportNode?: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[rgb(var(--muted))]">
          Übersicht
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <div className="text-[rgb(var(--muted))]">Themastrom</div>
            <div className="text-lg font-semibold text-[rgb(var(--fg))]">{counts.streams}</div>
          </div>
          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <div className="text-[rgb(var(--muted))]">Beiträge</div>
            <div className="text-lg font-semibold text-[rgb(var(--fg))]">{counts.contributions}</div>
          </div>
          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <div className="text-[rgb(var(--muted))]">Kernaussagen</div>
            <div className="text-lg font-semibold text-[rgb(var(--fg))]">{counts.claims}</div>
          </div>
          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))] p-3">
            <div className="text-[rgb(var(--muted))]">Quellen</div>
            <div className="text-lg font-semibold text-[rgb(var(--fg))]">{counts.sources}</div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/create?intent=contribution&dossierId=${encodeURIComponent(dossierId)}`}
            className="btn btn-ghost text-xs"
          >
            Beitrag hinzufügen
          </Link>
          <Link
            href={`/create?intent=statement&dossierId=${encodeURIComponent(dossierId)}`}
            className="btn btn-ghost text-xs"
          >
            Aussage ergänzen
          </Link>
        </div>
      </div>

      {exportNode}
    </div>
  );
}
