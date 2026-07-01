import { afterEach, describe, expect, it, vi } from "vitest";
import { createCommunitySourceReviewContributionDraft } from "@/features/create/communitySourceReviewContribution";
import {
  addCommunitySourceReviewInternalNote,
  archiveCommunitySourceReviewItem,
  createInMemoryCommunitySourceReviewRepository,
  hideCommunitySourceReviewHint,
  listCommunitySourceReviewAudits,
  markCommunitySourceReviewHintNeedsEditorialReview,
  markCommunitySourceReviewHintNeedsSourceReview,
  persistCommunitySourceReviewContributionDraft,
  rejectCommunitySourceReviewHint,
  setCommunitySourceReviewPriority,
  setCommunitySourceReviewRepositoryForTests,
} from "@/features/create/communitySourceReviewServer";
import {
  getCommunitySourceReviewWorkbenchItem,
  listCommunitySourceReviewWorkbenchItems,
  summarizePublicModerationOperations,
  summarizeCommunitySourceReviewWorkbench,
} from "@/features/create/communitySourceReviewWorkbench";

afterEach(() => {
  setCommunitySourceReviewRepositoryForTests(null);
  vi.useRealTimers();
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
    expect(summary.needsOwnerCount).toBe(2);
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
    expect(item?.queueBucket).toBe("escalated");
    expect(item?.slaState).toBe("escalated");
    expect(item?.ownerState).toBe("needs_owner");
    expect(item?.operationalFlagLabels).toEqual(
      expect.arrayContaining(["Owner nötig", "Eskaliert", "Urgent Priority"]),
    );
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

  it("summarizes active, stale, overdue and owner-needed moderation work without treating it as truth or publication", async () => {
    setCommunitySourceReviewRepositoryForTests(
      createInMemoryCommunitySourceReviewRepository(),
    );

    const end = new Date("2026-07-01T12:00:00.000Z");
    vi.useFakeTimers();

    vi.setSystemTime(new Date(end.getTime() - 2 * 36e5));
    await persistCommunitySourceReviewContributionDraft(
      createCommunitySourceReviewContributionDraft({
        id: "community-ops-fresh",
        kind: "source_suggestion",
        target: "claim",
        targetId: "claim-fresh",
        text: "Frischer Hinweis.",
      }),
    );

    vi.setSystemTime(new Date(end.getTime() - 80 * 36e5));
    await persistCommunitySourceReviewContributionDraft(
      createCommunitySourceReviewContributionDraft({
        id: "community-ops-source-review",
        kind: "source_suggestion",
        target: "claim",
        targetId: "claim-source-review",
        text: "Bitte Quelle nachziehen.",
      }),
    );
    await markCommunitySourceReviewHintNeedsSourceReview({
      contributionId: "community-ops-source-review",
      actorUserId: "admin-1",
      reason: "Quellenprüfung offen.",
    });

    vi.setSystemTime(new Date(end.getTime() - 30 * 36e5));
    await persistCommunitySourceReviewContributionDraft(
      createCommunitySourceReviewContributionDraft({
        id: "community-ops-editorial",
        kind: "context_note",
        target: "source_question",
        targetId: "source-question-editorial",
        text: "Redaktionell prüfen.",
      }),
    );
    await markCommunitySourceReviewHintNeedsEditorialReview({
      contributionId: "community-ops-editorial",
      actorUserId: "admin-1",
      reason: "Redaktion offen.",
    });

    vi.setSystemTime(new Date(end.getTime() - 4 * 36e5));
    await persistCommunitySourceReviewContributionDraft(
      createCommunitySourceReviewContributionDraft({
        id: "community-ops-escalated",
        kind: "escalation_request",
        target: "claim",
        targetId: "claim-escalated",
        text: "Bitte eskalieren.",
      }),
    );

    vi.setSystemTime(new Date(end.getTime() - 90 * 36e5));
    await persistCommunitySourceReviewContributionDraft(
      createCommunitySourceReviewContributionDraft({
        id: "community-ops-stale",
        kind: "context_note",
        target: "handoff_review_item",
        targetId: "handoff-stale",
        text: "Alter Hinweis ohne Owner.",
      }),
    );

    vi.setSystemTime(new Date(end.getTime() - 140 * 36e5));
    await persistCommunitySourceReviewContributionDraft(
      createCommunitySourceReviewContributionDraft({
        id: "community-ops-overdue",
        kind: "counter_source",
        target: "factcheck_request",
        targetId: "factcheck-overdue",
        text: "Sehr alter Hinweis.",
      }),
    );

    vi.setSystemTime(new Date(end.getTime() - 12 * 36e5));
    await persistCommunitySourceReviewContributionDraft(
      createCommunitySourceReviewContributionDraft({
        id: "community-ops-hidden",
        kind: "source_suggestion",
        target: "claim",
        targetId: "claim-hidden",
        text: "Wird verborgen.",
      }),
    );
    await hideCommunitySourceReviewHint({
      contributionId: "community-ops-hidden",
      actorUserId: "admin-1",
      reason: "Nicht aktiv weiterführen.",
    });

    vi.setSystemTime(new Date(end.getTime() - 10 * 36e5));
    await persistCommunitySourceReviewContributionDraft(
      createCommunitySourceReviewContributionDraft({
        id: "community-ops-rejected",
        kind: "source_suggestion",
        target: "claim",
        targetId: "claim-rejected",
        text: "Wird abgelehnt.",
      }),
    );
    await rejectCommunitySourceReviewHint({
      contributionId: "community-ops-rejected",
      actorUserId: "admin-1",
      reason: "Review-first abgelehnt.",
    });

    vi.setSystemTime(new Date(end.getTime() - 8 * 36e5));
    await persistCommunitySourceReviewContributionDraft(
      createCommunitySourceReviewContributionDraft({
        id: "community-ops-archived",
        kind: "lived_experience",
        target: "factcheck_request",
        targetId: "factcheck-archived",
        text: "Archiviert statt gelöscht.",
      }),
    );
    await archiveCommunitySourceReviewItem({
      contributionId: "community-ops-archived",
      actorUserId: "admin-1",
      reason: "Abgeschlossen.",
    });

    vi.setSystemTime(end);

    const items = await listCommunitySourceReviewWorkbenchItems({
      includeArchived: true,
      limit: 20,
    });
    const summary = summarizePublicModerationOperations({ items });

    const fresh = items.find((item) => item.id === "community-ops-fresh");
    const sourceReview = items.find(
      (item) => item.id === "community-ops-source-review",
    );
    const editorial = items.find(
      (item) => item.id === "community-ops-editorial",
    );
    const escalated = items.find(
      (item) => item.id === "community-ops-escalated",
    );
    const stale = items.find((item) => item.id === "community-ops-stale");
    const overdue = items.find((item) => item.id === "community-ops-overdue");
    const hidden = items.find((item) => item.id === "community-ops-hidden");
    const rejected = items.find(
      (item) => item.id === "community-ops-rejected",
    );
    const archived = items.find(
      (item) => item.id === "community-ops-archived",
    );

    expect(summary.totalActive).toBe(6);
    expect(summary.needsOwnerCount).toBe(6);
    expect(summary.escalatedCount).toBe(1);
    expect(summary.staleOrOverdueCount).toBe(3);
    expect(summary.needsSourceReviewCount).toBe(1);
    expect(summary.needsEditorialReviewCount).toBe(1);

    expect(fresh?.ownerState).toBe("needs_owner");
    expect(fresh?.slaState).toBe("on_track");
    expect(fresh?.activeInOperations).toBe(true);

    expect(sourceReview?.queueBucket).toBe("needs_source_review");
    expect(sourceReview?.slaState).toBe("stale");

    expect(editorial?.queueBucket).toBe("needs_editorial_review");
    expect(editorial?.slaState).toBe("aging");

    expect(escalated?.queueBucket).toBe("escalated");
    expect(escalated?.priority).toBe("urgent");
    expect(escalated?.operationalFlagLabels).toEqual(
      expect.arrayContaining(["Eskaliert", "Owner nötig"]),
    );

    expect(stale?.queueBucket).toBe("stale");
    expect(stale?.slaState).toBe("stale");

    expect(overdue?.queueBucket).toBe("overdue");
    expect(overdue?.slaState).toBe("overdue");

    expect(hidden?.activeInOperations).toBe(false);
    expect(hidden?.queueBucket).toBe("blocked_or_rejected");
    expect(rejected?.activeInOperations).toBe(false);
    expect(rejected?.queueBucket).toBe("blocked_or_rejected");
    expect(archived?.activeInOperations).toBe(false);
    expect(archived?.queueBucket).toBe("archived");

    expect(escalated?.guardrails).toEqual(
      expect.arrayContaining([
        "Hinweis ist kein verifizierter Fakt.",
        "Freigabe als Hinweis bedeutet nicht Veröffentlichung als Wahrheit.",
        "Keine Aktion schreibt in Graph, Merge oder Entitätserstellung.",
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
