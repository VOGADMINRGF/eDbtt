import type { Metadata } from "next";
import DossierPageClient from "./ui";

export const metadata: Metadata = {
  title: "Dossier",
  description: "Dossier-Ansicht mit institutioneller Infrastruktur.",
};

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ anchor?: string | string[] }>;
};

function readAnchorParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function DossierPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const selectedAnchorId = readAnchorParam(resolvedSearch?.anchor);
  return (
    <main className="min-h-screen bg-[rgb(var(--bg))]">
      <h1 className="sr-only">Dossier</h1>
      <DossierPageClient dossierId={id} selectedAnchorId={selectedAnchorId} />
    </main>
  );
}
