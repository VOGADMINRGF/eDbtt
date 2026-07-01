import { afterEach, describe, expect, it } from "vitest";
import { createCommunitySourceReviewContributionDraft } from "@/features/create/communitySourceReviewContribution";
import {
  addCommunitySourceReviewInternalNote,
  archiveCommunitySourceReviewItem,
  createInMemoryCommunitySourceReviewRepository,
  listCommunitySourceReviewAudits,
  markCommunitySourceReviewHintNeedsEditorialReview,
  markCommunitySourceReviewHintNeedsSourceReview,
  persistCommunitySourceReviewContributionDraft,
  setCommunitySourceReviewPriority,
  setCommunitySourceReviewRepositoryForTests,
} from "@/features/create/communitySourceReviewServer";
import {
  getCommunitySourceReviewWorkbenchItem,
  listCommunitySourceReviewWorkbenchItems,
  summarizeCommunitySourceReviewWorkbench,
} from "@/features/create/communitySourceReviewWorkbench";

afterEach(() => {
  setCommunitySourceReviewRepositoryForTests(null);
});

describe("community source review workbench", () => {
  it("shows public submissions and direct community contributions as workbench items", async () => {
    setCommunitySourceReviewRepositoryForTests(
      createInMemoryCommunitySourceReviewRepository(),
    );

    await persistCommunitySourceReviewContributionDraft(
      createCommunitySourceReviewContributionDraft({
        id: "community-workbench-public-1",
        kind: "counter_source",
        target: "handoff_review_item",
        targetId: "participation-space-1",
        text: "Ein Gegenbeleg aus dem lokalen Amtsblatt.",
        sourceRefs: ["https://beispiel.de/amtsblatt"],
        notes: [
          "Öffentlicher Intake: review-first API",
          "Öffentlicher Beteiligungsraum: sichere-schulwege",
        ],
      }),
    );

    await persistCommunitySourceReviewContributionDraft(
      createCommunitySourceReviewContributionDraft({
        id: "community-workbench-contribution-1",
        kind: "context_note",
        target: "source_question",
        targetId: "source-question-1",
        text: "Der Kontext vor Ort hat sich durch eine Baustelle verändert.",
        relatedContributionCount: 2,
      }),
    );

    const items = await listCommunitySourceReviewWorkbenchItems({
      includeArchived: true,
    });

    expect(items.map((item) => item.origin)).toEqual(
      expect.arrayContaining(["public_submission", "community_contribution"]),
    );
    expect(items.map((item) => item.kind)).toEqual(
      expect.arrayContaining(["counter_source", "context_note"]),
    );
    expect(items.some((item) => item.originDetail.includes("sichere-schulwege"))).toBe(
      true,
    );

    const summary = summarizeCommunitySourceReviewWorkbench({ items });
    expect(summary.total).toBe(2);
    expect(summary.newCount).toBeGreaterThanOrEqual(1);
  });

  it("derives signals, priority, source review and editorial routing without turning hints into facts", async () => {
    setCommunitySourceReviewRepositoryForTests(
      createInMemoryCommunitySourceReviewRepository(),
    );

    await persistCommunitySourceReviewContributionDraft(
      createCommunitySourceReviewContributionDraft({
        id: "community-workbench-ops-1",
        kind: "escalation_request",
        target: "claim",
        targetId: "claim-1",
        claimText: "Die Aussage ist unklar.",
        text: "Bitte redaktionell und quellenbezogen priorisieren.",
        sourceRefs: ["http://bit.ly/verdacht"],
        relatedContributionCount: 14,
        moderation: {
          trustLevel: "high",
        },
      }),
    );

    await setCommunitySourceReviewPriority({
      contributionId: "community-workbench-ops-1",
      actorUserId: "admin-1",
      reason: "Operativ zuerst prüfen.",
      priority: "urgent",
    });
    await markCommunitySourceReviewHintNeedsSourceReview({
      contributionId: "community-workbench-ops-1",
      actorUserId: "admin-1",
      reason: "Quellenprüfung ergänzen.",
    });
    await markCommunitySourceReviewHintNeedsEditorialReview({
      contributionId: "community-workbench-ops-1",
      actorUserId: "admin-1",
      reason: "Danach redaktionell weiterführen.",
    });
    await addCommunitySourceReviewInternalNote({
      contributionId: "community-workbench-ops-1",
      actorUserId: "admin-1",
      reason: "Interne Notiz für die Tageslage.",
    });

    const item = await getCommunitySourceReviewWorkbenchItem(
      "community-workbench-ops-1",
    );

    expect(item).not.toBeNull();
    expect(item?.priority).toBe("urgent");
    expect(item?.signals.map((signal) => signal.kind)).toEqual(
      expect.arrayContaining([
        "duplicate_suspected",
        "high_volume",
        "trust_signal",
        "source_quality_signal",
        "escalation_requested",
        "editorial_review_requested",
      ]),
    );
    expect(item?.routeTargetLabel).toBe("redaktionelle Prüfung");
    expect(item?.guardrails).toEqual(
      expect.arrayContaining([
        "Hinweis ist kein verifizierter Fakt.",
        "Freigabe als Hinweis bedeutet nicht Veröffentlichung als Wahrheit.",
      ]),
    );

    const audits = await listCommunitySourceReviewAudits({
      contributionId: "community-workbench-ops-1",
      limit: 30,
    });
    expect(audits.map((entry) => entry.action)).toEqual(
      expect.arrayContaining([
        "workbench_priority_set",
        "source_review_requested",
        "editorial_review_requested",
        "internal_note_added",
      ]),
    );
  });

  it("keeps counter sources, lived experience and archive review-first without graph, merge or publish side effects", async () => {
    setCommunitySourceReviewRepositoryForTests(
      createInMemoryCommunitySourceReviewRepository(),
    );

    await persistCommunitySourceReviewContributionDraft(
      createCommunitySourceReviewContributionDraft({
        id: "community-workbench-lived-1",
        kind: "lived_experience",
        target: "factcheck_request",
        targetId: "factcheck-1",
        text: "Vor Ort wurde die Situation anders erlebt.",
        relatedContributionCount: 24,
      }),
    );

    await archiveCommunitySourceReviewItem({
      contributionId: "community-workbench-lived-1",
      actorUserId: "admin-1",
      reason: "Operativ abgeschlossen, aber nicht löschen.",
    });

    const archived = await getCommunitySourceReviewWorkbenchItem(
      "community-workbench-lived-1",
    );
    const activeItems = await listCommunitySourceReviewWorkbenchItems({
      includeArchived: false,
    });

    expect(archived?.status).toBe("archived");
    expect(archived?.guardrails).toEqual(
      expect.arrayContaining([
        "Erfahrungsbericht bedeutet nicht repräsentative Evidenz.",
      ]),
    );
    expect(activeItems.some((item) => item.id === "community-workbench-lived-1")).toBe(
      false,
    );

    const record = archived;
    expect(record?.availableActions).toEqual(
      expect.arrayContaining(["add_internal_note"]),
    );

    const persisted = await getCommunitySourceReviewWorkbenchItem(
      "community-workbench-lived-1",
    );
    expect(persisted?.status).toBe("archived");
  });
});
