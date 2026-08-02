import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { RegionalAgentRunSchema } from "@/features/marketing/registry/regionalRuns/contracts";
import { getRegionalAgentRunFixtures } from "@/features/marketing/registry/regionalRuns/data";
import {
  buildRegionalAgentRunDetailReadModel,
  buildRegionalAgentRunsReadModel,
} from "@/features/marketing/registry/regionalRuns/readModel";
import { getMarketingRegistry } from "@/features/marketing/registry/data";

describe("marketing regional agent run contract", () => {
  it("validates the repo-backed run fixtures inside the existing marketing registry", () => {
    const fixtures = getRegionalAgentRunFixtures();
    const registry = getMarketingRegistry();

    expect(fixtures).toHaveLength(3);
    expect(fixtures.map((run) => RegionalAgentRunSchema.parse(run).id)).toEqual(
      registry.regionalAgentRuns.map((run) => run.id),
    );
    expect(fixtures.every((run) => run.runtimeBoundaries.executionMode === "read_only")).toBe(true);
    expect(fixtures.every((run) => run.runtimeBoundaries.externalSearch === "no_external_search")).toBe(true);
  });

  it("keeps Berlin region type, municipal jurisdiction, period and topic frame explicit", () => {
    const berlin = getRegionalAgentRunFixtures().find((run) => run.id.includes("berlin-mitte"));

    expect(berlin?.configuration).toMatchObject({
      region: {
        displayName: "Berlin · Bezirk Mitte",
        type: "district",
        countryCode: "DE",
        subdivisionCode: "DE-BE",
      },
      jurisdiction: {
        politicalLevel: "municipal",
      },
      topicFrame: {
        topicKeys: ["mobility", "school-routes", "local-administration"],
      },
    });
    expect(Date.parse(berlin!.configuration.period.startsAt)).toBeLessThan(
      Date.parse(berlin!.configuration.period.endsAt),
    );
  });

  it("preserves original, reading, interface and output language roles separately", () => {
    const multilingual = getRegionalAgentRunFixtures().find((run) => run.id.includes("multilingual"));
    const languages = multilingual!.configuration.languages;

    expect(languages.originalLanguages).toEqual(["de-DE", "tr-TR", "ar"]);
    expect(languages.readingLanguage).toBe("en-GB");
    expect(languages.interfaceLanguage).toBe("en");
    expect(languages.outputLanguages).toEqual(["de-DE", "en-GB", "tr-TR"]);
    expect(languages.preserveOriginal).toBe(true);
    expect(languages.translationIsEvidence).toBe(false);
  });

  it("requires source provenance with language, issuer and retrieval time", () => {
    for (const run of getRegionalAgentRunFixtures()) {
      for (const pack of run.sourcePacks) {
        expect(pack.externalSearchUsed).toBe(false);
        for (const source of pack.sources) {
          expect(source.originalLanguage).toBeTruthy();
          expect(source.issuer).toBeTruthy();
          expect(source.retrievedAt).toMatch(/^2026-/);
          expect(source.provenance.note).toBeTruthy();
        }
      }
    }

    const invalid = structuredClone(getRegionalAgentRunFixtures()[0]);
    invalid.sourcePacks[0].sources[0].issuer = "";
    expect(RegionalAgentRunSchema.safeParse(invalid).success).toBe(false);
  });

  it("exposes only user-safe trace fields and suggestion-only opportunity candidates", () => {
    const privateKeys = new Set([
      "prompt",
      "rawPrompt",
      "rawResponse",
      "secret",
      "token",
      "credentials",
      "chainOfThought",
      "providerResponse",
    ]);

    for (const run of getRegionalAgentRunFixtures()) {
      expect(run.safeTrace).toMatchObject({
        safeForUser: true,
        containsPrivateChainOfThought: false,
        containsPromptData: false,
        containsSecrets: false,
      });
      expect(collectKeys(run.safeTrace).some((key) => privateKeys.has(key))).toBe(false);
      expect(run.opportunityCandidates.every((candidate) => candidate.disposition === "suggestion_only")).toBe(true);
      expect(run.opportunityCandidates.every((candidate) => candidate.humanDecisionRequired)).toBe(true);
    }
  });

  it("represents ready, blocked, failed, detail and empty read-model states", () => {
    const model = buildRegionalAgentRunsReadModel();

    expect(model.summary).toEqual({
      totalRuns: 3,
      reviewReadyRuns: 1,
      blockedRuns: 1,
      failedRuns: 1,
    });
    expect(buildRegionalAgentRunsReadModel([]).runs).toEqual([]);
    expect(buildRegionalAgentRunDetailReadModel("regional-run-berlin-mitte-2026-07-fixture")?.sourceCount).toBe(2);
    expect(buildRegionalAgentRunDetailReadModel("unknown-run")).toBeNull();
  });

  it("has no external network, provider or mutation edge in the regional run slice", () => {
    const relativeFiles = [
      "src/features/marketing/registry/regionalRuns/contracts.ts",
      "src/features/marketing/registry/regionalRuns/data.ts",
      "src/features/marketing/registry/regionalRuns/readModel.ts",
      "src/app/api/admin/marketing/agent/runs/route.ts",
      "src/app/api/admin/marketing/agent/runs/[runId]/route.ts",
    ];
    const source = relativeFiles.map((file) => readFileSync(resolve(process.cwd(), file), "utf8")).join("\n");

    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/from ["'](?:axios|openai|node-fetch|@aws-sdk)/);
    expect(source).not.toMatch(/process\.env/);
    expect(source).not.toMatch(/export async function (?:POST|PUT|PATCH|DELETE)/);
  });
});

function collectKeys(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value)) return value.flatMap(collectKeys);
  return Object.entries(value).flatMap(([key, nested]) => [key, ...collectKeys(nested)]);
}
