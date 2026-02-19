import type { Metadata } from "next";
import demoDossier from "@features/dossier/data/demoDossier";
import { DossierViewer } from "@/components/dossier/DossierViewer";

export const metadata: Metadata = {
  title: "Dossier-Demo – Schulentwicklung",
  description: "Demonstrationsdossier einer normierten digitalen Entscheidungsakte (E150).",
};

export default function DossierDemoPage() {
  return (
    <main className="min-h-screen bg-[rgb(var(--bg))]">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-10">
        <DossierViewer dossier={demoDossier} />
      </div>
    </main>
  );
}
