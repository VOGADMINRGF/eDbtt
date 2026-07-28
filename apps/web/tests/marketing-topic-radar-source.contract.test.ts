import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

function readJson(relativePath: string) {
  return JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), "../../", relativePath), "utf8"),
  ) as Record<string, unknown>;
}

describe("marketing topic radar source contract", () => {
  it("covers international, EU, Germany, all neighbours and all German states", () => {
    const coverage = readJson("docs/marketing/source-profiles/topic-radar-coverage.json") as {
      liveIngestionEnabled: boolean;
      candidateLimitPerArea: number;
      operatorTopLimitPerArea: number;
      phase1SourcePolicy: string;
      phase2ProviderCandidate: string;
      areas: Array<{
        id: string;
        scope: string;
        countryCode: string | null;
        regionCode: string | null;
        candidateLimit: number;
        operatorTopLimit: number;
      }>;
    };

    expect(coverage.liveIngestionEnabled).toBe(false);
    expect(coverage.candidateLimitPerArea).toBe(20);
    expect(coverage.operatorTopLimitPerArea).toBe(20);
    expect(coverage.phase1SourcePolicy).toBe("official_public_machine_readable_sources");
    expect(coverage.phase2ProviderCandidate).toBe("gdelt-cloud");
    expect(coverage.areas).toHaveLength(29);

    expect(coverage.areas.some((area) => area.scope === "international")).toBe(true);
    expect(coverage.areas.some((area) => area.scope === "eu")).toBe(true);
    expect(coverage.areas.some((area) => area.id === "de-national")).toBe(true);

    const neighbours = coverage.areas.filter((area) => area.scope === "neighbor_country");
    expect(neighbours).toHaveLength(9);
    expect(neighbours.map((area) => area.countryCode).sort()).toEqual(
      ["AT", "BE", "CH", "CZ", "DK", "FR", "LU", "NL", "PL"],
    );
    expect(neighbours.every((area) => area.candidateLimit === 20 && area.operatorTopLimit === 20)).toBe(true);

    const neighbourGroup = coverage.areas.find((area) => area.id === "de-neighbors");
    expect(neighbourGroup).toMatchObject({ candidateLimit: 180, operatorTopLimit: 20 });

    const states = coverage.areas.filter((area) => area.scope === "state");
    expect(states).toHaveLength(16);
    expect(new Set(states.map((area) => area.regionCode)).size).toBe(16);
    expect(states.every((area) => area.candidateLimit === 20 && area.operatorTopLimit === 20)).toBe(true);
  });

  it("requires provenance, licensing, retention and freshness for every source", () => {
    const schema = readJson("docs/marketing/schemas/marketing-topic-source.schema.json") as {
      required: string[];
      properties: Record<string, unknown>;
    };

    expect(schema.required).toEqual(
      expect.arrayContaining([
        "id",
        "publisher",
        "sourceType",
        "jurisdiction",
        "originalLanguages",
        "transport",
        "endpoint",
        "licensePolicy",
        "storagePolicy",
        "freshness",
        "status",
      ]),
    );
    expect(schema.properties).toHaveProperty("credentialRequired");
    expect(schema.properties).toHaveProperty("lastSuccessfulFetchAt");
  });

  it("keeps source evidence, multilingual truth and participation suitability on clusters", () => {
    const schema = readJson("docs/marketing/schemas/marketing-topic-cluster.schema.json") as {
      required: string[];
      properties: Record<string, unknown>;
    };

    expect(schema.required).toEqual(
      expect.arrayContaining([
        "originalLanguages",
        "jurisdictions",
        "sources",
        "independentPublisherCount",
        "segmentRelevance",
        "participationSuitability",
        "uncertainties",
        "missingVoices",
        "ranking",
      ]),
    );
    expect(schema.properties).toHaveProperty("canonicalClusterKey");
  });
});
