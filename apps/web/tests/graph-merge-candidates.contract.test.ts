import { beforeEach, describe, expect, it } from "vitest";
import {
  applyGraphMergeCandidateAction,
  confirmProductiveGraphMerge,
  createInMemoryGraphMergeCandidatesRepository,
  listGraphMergeAuditEntries,
  prepareGraphMergeCandidateFromReviewRequest,
  prepareGraphMergeCandidateFromFactcheckJob,
  prepareProductiveGraphMerge,
  setGraphMergeCandidatesRepoForTests,
  listGraphMergeCandidates,
} from "@features/graphMergeCandidates";

describe("graph merge candidates", () => {
  beforeEach(() => {
    setGraphMergeCandidatesRepoForTests(createInMemoryGraphMergeCandidatesRepository());
  });

  it("prepares a candidate from accepted review work without auto-merge", async () => {
    const candidate = await prepareGraphMergeCandidateFromReviewRequest({
      id: "review-1",
      sourceType: "create_analysis",
      sourceId: "draft-1",
      userId: "user-1",
      originalText: "Der Schulweg vor der Grundschule ist unzureichend abgesichert.",
      normalizedText: "der schulweg vor der grundschule ist unzureichend abgesichert",
      truthStatus: "review_required",
      sourceSupport: "partial",
      sourceStatus: "Prüfung empfohlen",
      verificationLabel: "analysiert",
      reviewRecommended: true,
    });

    expect(candidate.noAutoGraphPromotion).toBe(true);
    expect(candidate.reviewStatus).toBe("needs_review");
    expect(candidate.mergeStatus).toBe("not_started");
  });

  it("keeps open source support out of merge_ready", async () => {
    const candidate = await prepareGraphMergeCandidateFromReviewRequest({
      id: "review-2",
      sourceType: "create_analysis",
      sourceId: "draft-2",
      userId: "user-1",
      originalText: "Bitte prüft die Quelle erst noch.",
      normalizedText: "bitte prüft die quelle erst noch",
      truthStatus: "source_open",
      sourceSupport: "open",
      sourceStatus: "Quellenlage offen",
      verificationLabel: "analysiert",
      reviewRecommended: true,
    });

    expect(candidate.reviewStatus).toBe("needs_review");
    expect(candidate.mergeStatus).toBe("blocked");
  });

  it("shows duplicate candidates without merging automatically", async () => {
    await prepareGraphMergeCandidateFromReviewRequest({
      id: "review-3",
      sourceType: "theme_suggestion",
      sourceId: "theme-1",
      userId: "user-1",
      originalText: "Radweg vor der Grundschule als Thema weiterführen.",
      normalizedText: "radweg vor der grundschule als thema weiterführen",
      truthStatus: "review_required",
      sourceSupport: "partial",
      sourceStatus: "Prüfung empfohlen",
      verificationLabel: "analysiert",
      reviewRecommended: false,
    });

    const second = await prepareGraphMergeCandidateFromReviewRequest({
      id: "review-4",
      sourceType: "theme_suggestion",
      sourceId: "theme-2",
      userId: "user-2",
      originalText: "Radweg vor der Grundschule Nord als Thema weiterführen.",
      normalizedText: "radweg vor der grundschule nord als thema weiterführen",
      truthStatus: "review_required",
      sourceSupport: "partial",
      sourceStatus: "Prüfung empfohlen",
      verificationLabel: "analysiert",
      reviewRecommended: false,
    });

    expect(second.duplicateCandidates?.length).toBeGreaterThan(0);
    expect(second.mergeStatus).toBe("duplicate_suspected");

    const all = await listGraphMergeCandidates({ limit: 10 });
    expect(all).toHaveLength(2);
    expect(all.some((entry) => entry.reviewStatus === "merged")).toBe(false);
  });

  it("keeps duplicate hints review-first when a candidate is marked as duplicate", async () => {
    const candidate = await prepareGraphMergeCandidateFromReviewRequest({
      id: "review-5",
      sourceType: "theme_suggestion",
      sourceId: "theme-5",
      userId: "user-1",
      originalText: "Schulwegsicherheit im Norden als Thema weiterführen.",
      normalizedText: "schulwegsicherheit im norden als thema weiterführen",
      truthStatus: "review_required",
      sourceSupport: "partial",
      sourceStatus: "Prüfung empfohlen",
      verificationLabel: "analysiert",
      reviewRecommended: false,
    });

    const result = await applyGraphMergeCandidateAction({
      candidateId: candidate.id,
      action: "mark_duplicate",
      requestedByUserId: "admin-1",
      note: "Möglicherweise bereits vorhanden.",
    });

    expect(result.candidate.mergeStatus).toBe("duplicate_suspected");
    expect(result.candidate.reviewStatus).not.toBe("merged");
    expect(result.candidate.noAutoPublish).toBe(true);
    expect(result.candidate.noAutoGraphPromotion).toBe(true);
  });

  it("blocks productive merge confirmation when sourceSupport is open", async () => {
    const candidate = await prepareGraphMergeCandidateFromReviewRequest({
      id: "review-6",
      sourceType: "create_analysis",
      sourceId: "draft-6",
      userId: "user-1",
      originalText: "Bitte Quellenlage erst schließen.",
      normalizedText: "bitte quellenlage erst schließen",
      truthStatus: "source_open",
      sourceSupport: "open",
      sourceStatus: "Quellenlage offen",
      verificationLabel: "analysiert",
      reviewRecommended: false,
    });

    await expect(
      confirmProductiveGraphMerge(candidate.id, { userId: "admin-1", isAdmin: true }),
    ).rejects.toThrow("graph_merge_candidate_blocked_source_open");

    const audits = await listGraphMergeAuditEntries({ candidateId: candidate.id });
    expect(audits[0]).toMatchObject({
      action: "merge_blocked",
      reason: "blocked_source_open",
    });
  });

  it("blocks duplicate candidates from productive merge until resolved", async () => {
    await prepareGraphMergeCandidateFromReviewRequest({
      id: "review-7a",
      sourceType: "theme_suggestion",
      sourceId: "theme-7a",
      userId: "user-1",
      originalText: "Radweg Nord als Thema vorbereiten.",
      normalizedText: "radweg nord als thema vorbereiten",
      truthStatus: "factcheck_passed",
      sourceSupport: "sourced",
      sourceStatus: "Quellenprüfung vorhanden",
      verificationLabel: "analysiert",
      reviewRecommended: false,
    });
    const candidate = await prepareGraphMergeCandidateFromReviewRequest({
      id: "review-7b",
      sourceType: "theme_suggestion",
      sourceId: "theme-7b",
      userId: "user-2",
      originalText: "Radweg Nord als Thema vorbereiten und zusammenführen.",
      normalizedText: "radweg nord als thema vorbereiten und zusammenführen",
      truthStatus: "factcheck_passed",
      sourceSupport: "sourced",
      sourceStatus: "Quellenprüfung vorhanden",
      verificationLabel: "analysiert",
      reviewRecommended: false,
    });

    await applyGraphMergeCandidateAction({
      candidateId: candidate.id,
      action: "accept_for_staging",
      requestedByUserId: "admin-1",
    });

    await expect(
      confirmProductiveGraphMerge(candidate.id, { userId: "admin-1", isAdmin: true }),
    ).rejects.toThrow("graph_merge_candidate_blocked_duplicate_unresolved");

    await applyGraphMergeCandidateAction({
      candidateId: candidate.id,
      action: "resolve_duplicate",
      requestedByUserId: "admin-1",
      note: "Duplikat geprüft und abgegrenzt.",
    });
    await prepareProductiveGraphMerge({
      candidateId: candidate.id,
      requestedByUserId: "admin-1",
    });
    const merged = await confirmProductiveGraphMerge(candidate.id, {
      userId: "admin-1",
      isAdmin: true,
    });

    expect(merged.candidate.reviewStatus).toBe("merged");
    expect(merged.candidate.mergeStatus).toBe("merged");
  });

  it("keeps accepted_for_staging as non-merged working state", async () => {
    const candidate = await prepareGraphMergeCandidateFromReviewRequest({
      id: "review-8",
      sourceType: "create_analysis",
      sourceId: "draft-8",
      userId: "user-1",
      originalText: "Claim für spätere Zusammenführung.",
      normalizedText: "claim für spätere zusammenführung",
      truthStatus: "factcheck_passed",
      sourceSupport: "sourced",
      sourceStatus: "Quellenprüfung vorhanden",
      verificationLabel: "analysiert",
      reviewRecommended: false,
    });

    const staged = await applyGraphMergeCandidateAction({
      candidateId: candidate.id,
      action: "accept_for_staging",
      requestedByUserId: "admin-1",
    });

    expect(staged.candidate.reviewStatus).toBe("accepted_for_staging");
    expect(staged.candidate.mergeStatus).toBe("staged");
    expect(staged.candidate.productiveMergeConfirmedAt).toBeNull();
  });

  it("writes audit entries when productive merge is confirmed", async () => {
    const candidate = await prepareGraphMergeCandidateFromReviewRequest({
      id: "review-9",
      sourceType: "create_analysis",
      sourceId: "draft-9",
      userId: "user-1",
      originalText: "Belastbarer Claim für produktive Zusammenführung.",
      normalizedText: "belastbarer claim für produktive zusammenführung",
      truthStatus: "sealed_verified",
      sourceSupport: "sourced",
      sourceStatus: "Quellenprüfung vorhanden",
      verificationLabel: "analysiert",
      reviewRecommended: false,
    });

    await applyGraphMergeCandidateAction({
      candidateId: candidate.id,
      action: "accept_for_staging",
      requestedByUserId: "admin-1",
    });
    await prepareProductiveGraphMerge({
      candidateId: candidate.id,
      requestedByUserId: "admin-1",
    });
    const result = await confirmProductiveGraphMerge(candidate.id, {
      userId: "admin-1",
      isAdmin: true,
    });

    expect(result.auditEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "merge_confirmed",
          reason: "merge_ready",
          noAutoPublish: true,
        }),
      ]),
    );
  });

  it("does not auto-merge completed factcheck jobs", async () => {
    const candidate = await prepareGraphMergeCandidateFromFactcheckJob({
      jobId: "factcheck-1",
      requestedByUserId: "user-1",
      inputText: "Belastbarer Faktencheck-Arbeitsstand",
      normalizedText: "belastbarer faktencheck-arbeitsstand",
      truthStatus: "sealed_verified",
      sourceSupport: "sourced",
      sourceStatus: "Ergebnis liegt vor",
      verificationLabel: "analysiert",
      result: {
        reviewRecommended: false,
        truthStatus: "sealed_verified",
        sourceSupport: "sourced",
        sourceStatus: "Ergebnis liegt vor",
        verificationLabel: "analysiert",
      },
      claims: [{ text: "Der Sachverhalt ist belastbar." }],
      sourceRefs: [],
    });

    expect(candidate.reviewStatus).not.toBe("merged");
    expect(candidate.mergeStatus).not.toBe("merged");
    expect(await listGraphMergeAuditEntries({ candidateId: candidate.id })).toHaveLength(0);
  });

  it("requires an override reason and audits it", async () => {
    const candidate = await prepareGraphMergeCandidateFromReviewRequest({
      id: "review-10",
      sourceType: "create_analysis",
      sourceId: "draft-10",
      userId: "user-1",
      originalText: "Belastbarer Claim mit Review-Hinweis.",
      normalizedText: "belastbarer claim mit review-hinweis",
      truthStatus: "factcheck_passed",
      sourceSupport: "sourced",
      sourceStatus: "Quellenprüfung vorhanden",
      verificationLabel: "analysiert",
      reviewRecommended: true,
    });

    await applyGraphMergeCandidateAction({
      candidateId: candidate.id,
      action: "accept_for_staging",
      requestedByUserId: "admin-1",
    });
    await prepareProductiveGraphMerge({
      candidateId: candidate.id,
      requestedByUserId: "admin-1",
    });

    await expect(
      confirmProductiveGraphMerge(candidate.id, { userId: "admin-1", isAdmin: true }),
    ).rejects.toThrow("graph_merge_candidate_override_required");

    const result = await confirmProductiveGraphMerge(
      candidate.id,
      { userId: "admin-1", isAdmin: true },
      { overrideReason: "Explizite redaktionelle Freigabe trotz Review-Hinweis." },
    );

    expect(result.candidate.productiveMergeOverrideReason).toContain("Explizite redaktionelle Freigabe");
    expect(result.auditEntries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "override_confirmed",
          reason: "override_required",
        }),
        expect.objectContaining({
          action: "merge_confirmed",
          overrideReason: "Explizite redaktionelle Freigabe trotz Review-Hinweis.",
        }),
      ]),
    );
  });
});
