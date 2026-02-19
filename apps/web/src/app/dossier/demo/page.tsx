import type { Metadata } from "next";
import demoDossier from "@features/dossier/data/demoDossier";
import { DossierViewer } from "@/components/dossier/DossierViewer";

export const metadata: Metadata = {
  title: "Dossier-Demo – Schulentwicklung",
  description: "Demonstrationsdossier einer standardisierten digitalen Entscheidungsakte.",
};

export default function DossierDemoPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,rgb(248,250,252)_0%,rgb(241,245,249)_45%,rgb(226,232,240)_100%)] dark:bg-[radial-gradient(circle_at_top,rgb(15,23,42)_0%,rgb(2,6,23)_45%,rgb(2,6,23)_100%)]">
      <div className="mx-auto w-full max-w-[1400px] px-8 py-16">
        <DossierViewer dossier={demoDossier} />
      </div>
    </main>
  );
}
