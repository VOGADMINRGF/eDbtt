import type { Metadata } from "next";
import Link from "next/link";
import { buildShareMetadata } from "@/features/share/metadata";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return buildShareMetadata({
    objectType: "factcheck",
    pathOrUrl: `/factcheck/${id}`,
    title: `Factcheck ${id}`,
    description: "Detailansicht für Factcheck-Status, Evidenzbezug und Workflowfortschritt.",
    ogType: "article",
  });
}

export default async function FactcheckDetailPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 space-y-4">
      <h1 className="text-2xl font-semibold text-[rgb(var(--fg))]">Factcheck {id}</h1>
      <p className="text-sm text-[rgb(var(--muted))]">
        Detailroute ist angelegt und kann auf denselben Factcheck-Workflow erweitert werden.
      </p>
      <Link href="/factcheck" className="btn-secondary text-sm">
        Zurück zur Factcheck-Übersicht
      </Link>
    </main>
  );
}
