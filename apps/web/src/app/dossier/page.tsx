import type { Metadata } from "next";
import DossierIndexClient from "./ui";

export const metadata: Metadata = {
  title: "Dossier vorbereiten",
  description: "Reviewbare Dossier-Vorbereitung aus /create ohne automatische Anheftung oder Veröffentlichung.",
};

type SearchParamsShape =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

function firstParam(value?: string | string[]) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return null;
}

export default async function DossierIndexPage({
  searchParams,
}: {
  searchParams?: SearchParamsShape;
}) {
  const resolved = searchParams ? await searchParams : {};
  return (
    <main className="public-canvas min-h-screen">
      <h1 className="sr-only">Dossier vorbereiten</h1>
      <DossierIndexClient
        handoffId={firstParam(resolved?.handoffId)}
        createAction={firstParam(resolved?.createAction)}
        seedTopic={firstParam(resolved?.topic)}
      />
    </main>
  );
}
