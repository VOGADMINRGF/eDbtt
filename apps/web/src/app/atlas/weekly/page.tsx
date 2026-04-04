import type { Metadata } from "next";
import { resolveDossierAtlasLandscapeContract } from "@features/anlassraum/dossierAtlasLandscapeContract";
import {
  loadDossierAtlasWeeklySnapshotExportFromReadModel,
  resolveDossierAtlasWeeklySnapshotExport,
} from "@features/anlassraum/dossierAtlasWeeklySnapshotExport";
import WeeklySnapshotSurface from "./WeeklySnapshotSurface";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Wochenatlas - eDebatte",
  description: "Read-only Wochenlage aus dem Dossier-Atlas als graphic-ready Surface.",
};

function readFirst(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AtlasWeeklyPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = (await searchParams) ?? {};
  const showInternal = readFirst(resolvedParams.detail) === "internal";
  let sourceState: "live" | "fallback" = "live";

  const snapshot = await loadDossierAtlasWeeklySnapshotExportFromReadModel({
    limit: 260,
  }).catch(() => {
    sourceState = "fallback";
    return resolveDossierAtlasWeeklySnapshotExport({
      atlas: resolveDossierAtlasLandscapeContract({ items: [] }),
      label: "Wochenlage Atlas (degradiert)",
    });
  });

  return (
    <WeeklySnapshotSurface
      snapshot={snapshot}
      sourceState={sourceState}
      showInternal={showInternal}
    />
  );
}
