import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildMarketingSourceDecisionReadModel } from "@/features/marketing/sources/readModel";

type CoverageContract = {
  status: string;
  liveIngestionEnabled: boolean;
  candidateLimitPerArea: number;
  operatorTopLimitPerArea: number;
  phase1SourcePolicy: string;
  phase2ProviderCandidate: string;
  areas: Array<{ id: string; scope: string; candidateLimit: number; operatorTopLimit: number }>;
};

function readCoverage(): CoverageContract {
  return JSON.parse(
    fs.readFileSync(
      path.resolve(process.cwd(), "../../docs/marketing/source-profiles/topic-radar-coverage.json"),
      "utf8",
    ),
  ) as CoverageContract;
}

describe("marketing source decision workspace contract", () => {
  it("stays aligned with the canonical topic radar coverage contract", () => {
    const coverage = readCoverage();
    const model = buildMarketingSourceDecisionReadModel();
    const neighbours = coverage.areas.filter((area) => area.scope === "neighbor_country");
    const states = coverage.areas.filter((area) => area.scope === "state");

    expect(model.contractStatus).toBe(coverage.status);
    expect(model.liveIngestionEnabled).toBe(coverage.liveIngestionEnabled);
    expect(model.candidateLimitPerArea).toBe(coverage.candidateLimitPerArea);
    expect(model.operatorTopLimitPerArea).toBe(coverage.operatorTopLimitPerArea);
    expect(model.phase1SourcePolicy).toBe(coverage.phase1SourcePolicy);
    expect(model.phase2ProviderCandidate).toBe(coverage.phase2ProviderCandidate);
    expect(model.coverageAreaCount).toBe(coverage.areas.length);
    expect(neighbours).toHaveLength(9);
    expect(states).toHaveLength(16);
    expect(model.rawCandidateCapacity).toBe(560);
  });

  it("keeps productive connections and live ingestion behind separate gates", () => {
    const model = buildMarketingSourceDecisionReadModel();

    expect(model.connectionsRouteAvailable).toBe(false);
    expect(model.liveTopicRouteAvailable).toBe(false);
    expect(model.regionalSourceRoute).toBe("/admin/regions");
    expect(model.decisions.some((decision) => decision.id === "source-allowlist" && decision.state === "open")).toBe(true);
    expect(model.decisions.some((decision) => decision.id === "phase2-provider" && decision.state === "manual_gate")).toBe(true);
    expect(model.decisions.some((decision) => decision.id === "live-activation" && decision.state === "manual_gate")).toBe(true);
  });
});
