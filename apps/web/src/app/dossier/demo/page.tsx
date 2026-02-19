import type { Metadata } from "next";
import demoDossier from "@features/dossier/data/demoDossier";
import { DossierViewer } from "@/components/dossier/DossierViewer";

export const metadata: Metadata = {
  title: "Dossier-Demo – Schulentwicklung",
  description: "Demonstrationsdossier einer standardisierten digitalen Entscheidungsakte.",
};

export default function DossierDemoPage() {
  return (
    <main className="dossier-editorial min-h-screen bg-[radial-gradient(circle_at_top,var(--dossier-top)_0%,var(--dossier-mid)_45%,var(--dossier-bottom)_100%)] text-[rgb(var(--fg))]">
      <div className="mx-auto w-full max-w-screen-2xl px-6 py-18 lg:px-10">
        <DossierViewer dossier={demoDossier} />
      </div>
    </main>
  );
}
