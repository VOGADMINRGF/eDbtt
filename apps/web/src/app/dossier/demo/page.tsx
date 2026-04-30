import type { Metadata } from "next";
import DossierDemoClient from "./ui";

export const metadata: Metadata = {
  title: "Dossier-Demo – Innenstadt von morgen",
  description:
    "Demonstrationsdossier zur Frage fairer Zugangsrechte und Beteiligung in der Innenstadt.",
};

export default function DossierDemoPage() {
  return (
    <main className="dossier-editorial min-h-screen bg-[radial-gradient(circle_at_top,var(--dossier-top)_0%,var(--dossier-mid)_45%,var(--dossier-bottom)_100%)] text-[rgb(var(--fg))]">
      <h1 className="sr-only">Dossier-Demo</h1>
      <DossierDemoClient />
    </main>
  );
}
