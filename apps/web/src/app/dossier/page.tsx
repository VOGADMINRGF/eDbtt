import type { Metadata } from "next";
import DossierIndex from "./ui";
import { listPublishedDossiers } from "@/features/dossier/publicRuntime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dossiers",
  description: "Veröffentlichte Debattenstände mit Positionen, Quellen und offenen Fragen.",
};

export default async function DossierIndexPage() {
  const result = await listPublishedDossiers()
    .then((items) => ({ items, loadFailed: false }))
    .catch(() => ({ items: [], loadFailed: true }));
  return (
    <main className="public-canvas min-h-screen">
      <h1 className="sr-only">Dossiers</h1>
      <DossierIndex items={result.items} loadFailed={result.loadFailed} />
    </main>
  );
}
