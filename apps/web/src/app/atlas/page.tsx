import type { Metadata } from "next";
import { resolveDossierAtlasLandscapeContract } from "@features/anlassraum/dossierAtlasLandscapeContract";
import { loadDossierAtlasLandscapeReadModel } from "@features/anlassraum/dossierAtlasReadModel";
import AtlasClient from "./AtlasClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dossier-Atlas - eDebatte",
  description:
    "Read-only Themenlandschaft für Themen, Anlassräume, Dossiers, Runden und Ergebnisse.",
};

export default async function AtlasPage() {
  let sourceState: "live" | "fallback" = "live";

  const atlas = await loadDossierAtlasLandscapeReadModel({ limit: 240 }).catch(() => {
    sourceState = "fallback";
    return resolveDossierAtlasLandscapeContract({
      items: [],
    });
  });

  return (
    <>
      <h1 className="sr-only">Atlas</h1>
      <AtlasClient atlas={atlas} sourceState={sourceState} />
    </>
  );
}
