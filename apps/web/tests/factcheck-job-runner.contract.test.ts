import { beforeEach, describe, expect, it } from "vitest";
import {
  createInMemoryFactcheckWorkflowRepo,
  setFactcheckWorkflowRepoForTests,
  type FactcheckJobDoc,
} from "@features/factcheck/db";
import { runFactcheckJob } from "@features/factcheck/jobRunner";

function baseJob(overrides: Partial<FactcheckJobDoc> = {}): FactcheckJobDoc {
  return {
    jobId: "job-1",
    sourceType: "factcheck_request",
    sourceId: "contribution-1",
    requestedAction: "source_check",
    inputText: "Bitte prüft diese Behauptung.",
    normalizedText: "bitte prüft diese behauptung.",
    language: "de",
    status: "queued",
    gate: {
      loginConfirmed: true,
      entitlementConfirmed: true,
      pricingConfirmed: true,
      userConfirmed: true,
      noSilentCost: true,
    },
    verdict: "UNDETERMINED",
    confidenceScore: 0,
    claims: [{ id: "1", text: "Behauptung A" } as any],
    sourceRefs: [],
    materialRefs: [],
    factcheckVerificationMode: "intake_only",
    factcheckResearchMode: "provider_assisted",
    factcheckSealEligibility: "needs_review",
    factcheckSealDecision: "none",
    publicSealVisible: false,
    limitations: ["Kein automatischer DeepSearch-Lauf."],
    auditEvents: [],
    createdAt: new Date("2026-06-06T09:00:00.000Z"),
    noAutoPublish: true,
    noAutoGraphPromotion: true,
    noAutoDossier: true,
    noAutoAnlassraum: true,
    noAutoVote: true,
    ...overrides,
  };
}

describe("factcheck job runner", () => {
  beforeEach(() => {
    setFactcheckWorkflowRepoForTests(createInMemoryFactcheckWorkflowRepo());
  });

  it("keeps source-open results review-first when sources are missing", async () => {
    const repo = createInMemoryFactcheckWorkflowRepo({
      records: [baseJob()],
    });
    setFactcheckWorkflowRepoForTests(repo);

    const job = await runFactcheckJob("job-1");

    expect(job.status).toBe("needs_manual_review");
    expect(job.result?.sourceSupport).toBe("open");
    expect(job.result?.reviewRecommended).toBe(true);
    expect(job.noAutoPublish).toBe(true);
    expect(job.noAutoGraphPromotion).toBe(true);
  });

  it("forces manual review on fallback or disagreement", async () => {
    const repo = createInMemoryFactcheckWorkflowRepo({
      records: [
        baseJob({
          jobId: "job-2",
          sourceRefs: [{ id: "s1", label: "Quelle", url: "https://example.org", sourceType: "link" }],
          fallbackUsed: true,
          disagreement: {
            present: true,
            insufficientIndependentSuccess: true,
            specialistAgreementScore: 0.22,
            specialistAgreement: "low",
            missingSpecialists: ["perplexity"],
            successfulProviders: ["perplexity"],
            failedProviders: [],
            fallbackReliance: "full",
            fallbackRelianceScore: 1,
            coverage: {
              requiredPrimary: 2,
              successfulPrimary: 1,
              missingPrimary: 1,
            },
          },
        }),
      ],
    });
    setFactcheckWorkflowRepoForTests(repo);

    const job = await runFactcheckJob("job-2");

    expect(job.status).toBe("needs_manual_review");
    expect(job.result?.reviewRecommended).toBe(true);
    expect(job.result?.disagreement?.present).toBe(true);
  });

  it("marks sealed_verified only for sealed_factcheck jobs with granted seal", async () => {
    const repo = createInMemoryFactcheckWorkflowRepo({
      records: [
        baseJob({
          jobId: "job-3",
          requestedAction: "sealed_factcheck",
          sourceRefs: [{ id: "s1", label: "Quelle", url: "https://example.org", sourceType: "link" }],
          factcheckSealDecision: "granted",
          sealGranted: true,
          status: "completed",
        }),
        baseJob({
          jobId: "job-4",
          requestedAction: "source_check",
          sourceRefs: [{ id: "s1", label: "Quelle", url: "https://example.org", sourceType: "link" }],
          factcheckSealDecision: "granted",
          sealGranted: true,
          status: "completed",
        }),
      ],
    });
    setFactcheckWorkflowRepoForTests(repo);

    const sealedJob = await runFactcheckJob("job-3");
    const normalJob = await runFactcheckJob("job-4");

    expect(sealedJob.result?.truthStatus).toBe("sealed_verified");
    expect(sealedJob.result?.verificationLabel).toBe("verifiziert");
    expect(normalJob.result?.truthStatus).not.toBe("sealed_verified");
  });
});
