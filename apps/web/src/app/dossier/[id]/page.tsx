import type { Metadata } from "next";
import DossierPageClient from "./ui";
import { buildShareMetadata } from "@/features/share/metadata";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return buildShareMetadata({
    objectType: "dossier",
    pathOrUrl: `/dossier/${id}`,
    title: `Dossier ${id}`,
    description: "Dossier-Ansicht mit Kontext, Einordnung und offenen Anschlussfragen.",
    ogType: "article",
  });
}

export default async function DossierPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <main className="min-h-screen bg-[rgb(var(--bg))]">
      <h1 className="sr-only">Dossier</h1>
      <DossierPageClient dossierId={id} />
    </main>
  );
}
