import type { Metadata } from "next";
import DossierSurface from "@/components/dossier/DossierSurface";
import DossierShell from "@/components/dossier/DossierShell";

export const metadata: Metadata = {
  title: "Dossier",
  description: "Dossier-Ansicht mit institutioneller Infrastruktur.",
};

type PageProps = { params: Promise<{ id: string }> };

export default async function DossierPage({ params }: PageProps) {
  const { id } = await params;
  const entry = id.toLowerCase().startsWith("demo") ? "demo" : "public";
  return (
    <DossierShell>
      <h1 className="sr-only">Dossier</h1>
      <DossierSurface dossierId={id} entry={entry} source="api" />
    </DossierShell>
  );
}
