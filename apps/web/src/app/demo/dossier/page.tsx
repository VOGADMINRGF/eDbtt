import { parseDemoPersona, type DemoPersona } from "@/features/demo/personas";
import DemoDossierClient, { type DemoDossierMode } from "./DemoDossierClient";

type SearchParamsShape =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

function readParam(value?: string | string[]) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseMode(value?: string): DemoDossierMode | undefined {
  if (value === "lesen" || value === "mitwirken" || value === "verwalten") return value;
  return undefined;
}

const DEFAULT_MODE_BY_PERSONA: Record<DemoPersona, DemoDossierMode> = {
  journalist: "lesen",
  administration: "verwalten",
  citizen: "mitwirken",
};

export default async function DemoDossierPage({
  searchParams,
}: {
  searchParams?: SearchParamsShape;
}) {
  const resolved = searchParams ? await searchParams : {};
  const persona = parseDemoPersona(readParam(resolved?.persona));
  const requestedMode = parseMode(readParam(resolved?.mode));
  const initialMode = requestedMode ?? DEFAULT_MODE_BY_PERSONA[persona];

  return (
    <main className="dossier-editorial min-h-screen bg-[radial-gradient(circle_at_top,var(--dossier-top)_0%,var(--dossier-mid)_45%,var(--dossier-bottom)_100%)] text-[rgb(var(--fg))]">
      <h1 className="sr-only">Demo Dossier</h1>
      <DemoDossierClient persona={persona} initialMode={initialMode} />
    </main>
  );
}
