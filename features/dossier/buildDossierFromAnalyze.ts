import type { AnalyzeResult } from "@features/analyze/schemas";
import type { Dossier } from "./schemas";

export function buildDossierFromAnalyze(args: {
  analyze: AnalyzeResult;
  id: string;
  title: string;
  jurisdiction: Dossier["meta"]["jurisdiction"];
  region?: string;
  owner?: string;
  voteConfig?: Dossier["voteConfig"];
}): Dossier {
  const now = new Date().toISOString();

  return {
    meta: {
      id: args.id,
      title: args.title,
      jurisdiction: args.jurisdiction,
      ...(args.region ? { region: args.region } : {}),
      ...(args.owner ? { owner: args.owner } : {}),
      status: "draft",
      createdAt: now,
      updatedAt: now,
    },
    analyze: args.analyze,
    sourceSet: args.analyze.runReceipt?.sourceSet ?? [],
    ...(args.voteConfig ? { voteConfig: args.voteConfig } : {}),
  };
}
