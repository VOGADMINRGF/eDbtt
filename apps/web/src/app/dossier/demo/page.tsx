import type { Metadata } from "next";
import DossierSurface from "@/components/dossier/DossierSurface";
import DossierShell from "@/components/dossier/DossierShell";

export const metadata: Metadata = {
  title: "Dossier-Demo – Schulentwicklung",
  description: "Demonstrationsdossier einer standardisierten digitalen Entscheidungsakte.",
};

export default function DossierDemoPage() {
  return (
    <DossierShell>
      <h1 className="sr-only">Dossier Demo</h1>
      <DossierSurface entry="demo" source="demo" />
    </DossierShell>
  );
}
