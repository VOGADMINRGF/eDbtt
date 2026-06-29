import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", async () => {
  const actual = await vi.importActual<typeof import("next/navigation")>("next/navigation");
  return {
    ...actual,
    useRouter: () => ({
      refresh: vi.fn(),
    }),
  };
});

import AdminTopicGraphApprovalSection from "@/app/admin/review/AdminTopicGraphApprovalSection";
import type { TopicGraphEdge } from "@/features/create/topicGraphRuntime";

function buildEdge(overrides: Partial<TopicGraphEdge> = {}): TopicGraphEdge {
  return {
    id: overrides.id ?? "topic-graph-edge:same_topic_as:topic-new:topic-existing",
    source: overrides.source ?? {
      nodeType: "topic",
      id: "topic-new",
      title: "Sichere Schulwege",
    },
    target: overrides.target ?? {
      nodeType: "topic",
      id: "topic-existing",
      title: "Schulwegsicherheit",
    },
    kind: overrides.kind ?? "same_topic_as",
    mutationStatus: overrides.mutationStatus ?? "queued_for_review",
    blockers: overrides.blockers ?? ["review_not_approved", "unsafe_auto_merge"],
    sourceCandidateId: overrides.sourceCandidateId ?? "candidate-1",
    sourceReviewStatus: overrides.sourceReviewStatus ?? "approved_for_merge",
    sourceKinds: overrides.sourceKinds ?? ["dialog_intelligence"],
    sourceReviewPending: overrides.sourceReviewPending ?? false,
    moderationPending: overrides.moderationPending ?? false,
    communityHintUnreviewed: overrides.communityHintUnreviewed ?? false,
    derivedFromAiSimilarity: overrides.derivedFromAiSimilarity ?? true,
    derivedFromCommunityHint: overrides.derivedFromCommunityHint ?? false,
    derivedFromTrustSignal: overrides.derivedFromTrustSignal ?? false,
    derivedFromVolumeSignal: overrides.derivedFromVolumeSignal ?? false,
    approvedForMerge: overrides.approvedForMerge ?? true,
    approvedForGraphWrite: overrides.approvedForGraphWrite ?? false,
    requiresEditorialReview: true,
    requiresExplicitGraphWriteApproval: true,
    autoMerge: false,
    autoGraphWrite: false,
    autoPublish: false,
    autoDelete: false,
    autoCreateDossier: false,
    autoCreateAnlassraum: false,
    autoCreateParticipationSpace: false,
    note: overrides.note ?? null,
    auditContext: overrides.auditContext ?? {
      actorUserId: null,
      reason: null,
      origin: null,
      approvedAt: null,
    },
    createdAt: overrides.createdAt ?? "2026-06-29T12:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-06-29T12:00:00.000Z",
    writtenAt: overrides.writtenAt ?? null,
  };
}

function renderSection(edge: TopicGraphEdge, graphRuntimeAvailable = true) {
  return renderToStaticMarkup(
    <AdminTopicGraphApprovalSection
      graphRuntimeAvailable={graphRuntimeAvailable}
      topicGraphAuditMap={
        new Map([
          [
            edge.id,
            [
              {
                id: "audit-1",
                edgeId: edge.id,
                action: "draft_saved",
                actorUserId: "admin-1",
                reason: "Entwurf vorbereitet",
                blockers: edge.blockers,
                mutationStatus: edge.mutationStatus,
                at: "2026-06-29T12:00:00.000Z",
              },
            ],
          ],
        ])
      }
      topicGraphEdges={[edge]}
      topicGraphPersistence={{
        mode: "persistent_primary",
        label: "Persistenter Topic-Graph-Mutation-Store",
        summary:
          "Review-bestätigte Topic-Graph-Entwürfe und Audit-Spuren liegen dauerhaft vor.",
        repositoryInterface: "TopicGraphRuntimeRepository",
        storeKind: "mongo_collection",
        productionTruth: true,
        restartReconstructable: true,
        deploymentReconstructable: true,
      }}
    />,
  );
}

describe("topic graph admin approval ui", () => {
  it("shows graph-verknuepfung-pruefen when a topic graph candidate exists", () => {
    const html = renderSection(
      buildEdge({
        kind: "duplicate_of",
        blockers: ["review_not_approved", "unsafe_auto_merge"],
      }),
    );

    expect(html).toContain("Graph-Verknüpfung prüfen");
    expect(html).toContain("duplicate_of");
    expect(html).toContain("Diese Verknüpfung wird nur nach redaktioneller Freigabe in den Graph geschrieben.");
    expect(html).toContain("KI-/Community-Hinweise sind Entscheidungshilfen, keine automatische Wahrheit.");
    expect(html).toContain("Es wird nichts zusammengeführt, gelöscht oder veröffentlicht.");
  });

  it("shows blockers and disables approval when source review is pending", () => {
    const html = renderSection(
      buildEdge({
        sourceReviewPending: true,
        blockers: ["source_review_pending", "review_not_approved"],
      }),
    );

    expect(html).toContain("source_review_pending");
    expect(html).toContain("Quellenprüfung offen");
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Graph-Write freigeben<\/button>/);
  });

  it("shows blockers and disables approval when moderation is pending", () => {
    const html = renderSection(
      buildEdge({
        moderationPending: true,
        blockers: ["moderation_pending", "review_not_approved"],
      }),
    );

    expect(html).toContain("moderation_pending");
    expect(html).toContain("Moderation offen");
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Graph-Write freigeben<\/button>/);
  });

  it("does not allow a graph write when only approved_for_merge is present", () => {
    const html = renderSection(
      buildEdge({
        approvedForMerge: true,
        approvedForGraphWrite: false,
        blockers: ["review_not_approved", "unsafe_auto_merge"],
      }),
    );

    expect(html).toContain("approved_for_merge vorhanden");
    expect(html).toContain("approved_for_graph_write fehlt");
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Freigegebene Kante schreiben<\/button>/);
  });

  it("allows a prepared write only after approved_for_graph_write and full audit context", () => {
    const html = renderSection(
      buildEdge({
        approvedForMerge: true,
        approvedForGraphWrite: true,
        mutationStatus: "approved_for_graph_write",
        blockers: [],
        auditContext: {
          actorUserId: "admin-1",
          reason: "Redaktionell bestätigt",
          origin: "admin_review",
          approvedAt: "2026-06-29T12:04:00.000Z",
        },
      }),
    );

    expect(html).toContain("approved_for_graph_write gesetzt");
    expect(html).toContain("Audit-Kontext: admin-1 · Redaktionell bestätigt");
    expect(html).toContain(
      '<button type="button" class="rounded-full border border-[rgb(var(--border))] bg-[rgb(var(--fg))] px-4 py-2 text-xs font-semibold text-[rgb(var(--bg))] disabled:opacity-60">Freigegebene Kante schreiben</button>',
    );
  });

  it("prevents further writes after rejection", () => {
    const html = renderSection(
      buildEdge({
        mutationStatus: "rejected",
        approvedForGraphWrite: false,
        approvedForMerge: false,
        blockers: [],
      }),
    );

    expect(html).toContain("Abgelehnt");
    expect(html).toMatch(/<button[^>]*disabled[^>]*>Freigegebene Kante schreiben<\/button>/);
  });

  it("shows a written state without claiming publish or merge", () => {
    const html = renderSection(
      buildEdge({
        mutationStatus: "written",
        approvedForGraphWrite: true,
        blockers: [],
        writtenAt: "2026-06-29T12:05:00.000Z",
        auditContext: {
          actorUserId: "admin-1",
          reason: "Freigabe dokumentiert",
          origin: "admin_review",
          approvedAt: "2026-06-29T12:04:00.000Z",
        },
      }),
    );

    expect(html).toContain("Graph-Verknüpfung wurde nach redaktioneller Freigabe und Audit-Kontext geschrieben.");
    expect(html).toContain("Geschrieben");
    expect(html).toContain("Es wird nichts zusammengeführt, gelöscht oder veröffentlicht.");
  });

  it("shows ai, community and trust hints but keeps explicit graph approval unset", () => {
    const html = renderSection(
      buildEdge({
        approvedForGraphWrite: false,
        blockers: ["review_not_approved", "unsafe_auto_merge"],
        sourceKinds: ["dialog_intelligence", "community_hint", "trust_signal"],
        derivedFromAiSimilarity: true,
        derivedFromCommunityHint: true,
        derivedFromTrustSignal: true,
      }),
    );

    expect(html).toContain("Runtime-KI");
    expect(html).toContain("Community-Hinweis");
    expect(html).toContain("Trust-Signal");
    expect(html).toContain("approved_for_graph_write fehlt");
  });
});
