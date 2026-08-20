import type { RegionalAgentRun, RegionalRunStatus } from "./contracts";
import { getRegionalAgentRunFixtures } from "./data";

export type RegionalAgentRunListRow = {
  run: RegionalAgentRun;
  sourceCount: number;
  sourcePackCount: number;
  opportunityCandidateCount: number;
  openBlockerCount: number;
};

export type RegionalAgentRunsReadModel = {
  mode: "read_only";
  searchMode: "no_external_search";
  generatedFrom: "repository_fixtures";
  summary: {
    totalRuns: number;
    reviewReadyRuns: number;
    blockedRuns: number;
    failedRuns: number;
  };
  runs: RegionalAgentRunListRow[];
};

export type RegionalAgentRunDetailReadModel = {
  mode: "read_only";
  searchMode: "no_external_search";
  run: RegionalAgentRun;
  sourceCount: number;
  sourceLanguages: string[];
  openBlockers: RegionalAgentRun["blockerRefs"];
};

export function buildRegionalAgentRunsReadModel(
  runs: RegionalAgentRun[] = getRegionalAgentRunFixtures(),
): RegionalAgentRunsReadModel {
  const rows = [...runs]
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt) || left.id.localeCompare(right.id))
    .map(toListRow);

  return {
    mode: "read_only",
    searchMode: "no_external_search",
    generatedFrom: "repository_fixtures",
    summary: {
      totalRuns: rows.length,
      reviewReadyRuns: countStatus(rows, "review_ready"),
      blockedRuns: countStatus(rows, "blocked"),
      failedRuns: countStatus(rows, "failed"),
    },
    runs: rows,
  };
}

export function buildRegionalAgentRunDetailReadModel(
  runId: string,
  runs: RegionalAgentRun[] = getRegionalAgentRunFixtures(),
): RegionalAgentRunDetailReadModel | null {
  const run = runs.find((candidate) => candidate.id === runId);
  if (!run) return null;

  return {
    mode: "read_only",
    searchMode: "no_external_search",
    run,
    sourceCount: run.sourcePacks.reduce((sum, pack) => sum + pack.sources.length, 0),
    sourceLanguages: Array.from(
      new Set(run.sourcePacks.flatMap((pack) => pack.sources.map((source) => source.originalLanguage))),
    ).sort(),
    openBlockers: run.blockerRefs.filter((blocker) => blocker.status !== "resolved"),
  };
}

function toListRow(run: RegionalAgentRun): RegionalAgentRunListRow {
  return {
    run,
    sourceCount: run.sourcePacks.reduce((sum, pack) => sum + pack.sources.length, 0),
    sourcePackCount: run.sourcePacks.length,
    opportunityCandidateCount: run.opportunityCandidates.length,
    openBlockerCount: run.blockerRefs.filter((blocker) => blocker.status !== "resolved").length,
  };
}

function countStatus(rows: RegionalAgentRunListRow[], status: RegionalRunStatus) {
  return rows.filter((row) => row.run.status === status).length;
}
