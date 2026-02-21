import type { Metadata } from "next";
import DossierPageClient from "./ui";

export const metadata: Metadata = {
  title: "Dossier",
  description: "Dossier-Ansicht mit institutioneller Infrastruktur.",
};

type PageProps = { params: Promise<{ id: string }> };

export default async function DossierPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <main className="min-h-screen bg-[rgb(var(--bg))]">
      <h1 className="sr-only">Dossier</h1>
      <DossierPageClient dossierId={id} />
    </main>
  );
}
