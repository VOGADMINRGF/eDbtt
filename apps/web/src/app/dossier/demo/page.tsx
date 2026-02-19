import type { Metadata } from "next";
import demoDossier from "@features/dossier/data/demoDossier";
import { DossierViewer } from "@/components/dossier/DossierViewer";

export const metadata: Metadata = {
  title: "Dossier-Demo – Schulentwicklung",
  description: "Demonstrationsdossier einer normierten digitalen Entscheidungsakte (E150).",
};

export default function DossierDemoPage() {
  return (
    <main className="dark min-h-screen bg-[radial-gradient(circle_at_top,rgb(15,23,42)_0%,rgb(2,6,23)_45%,rgb(2,6,23)_100%)]">
      <div className="mx-auto w-full max-w-[1400px] px-8 py-16">
        <DossierViewer dossier={demoDossier} />
      </div>
    </main>
  );
}
