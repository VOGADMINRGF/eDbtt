import { createEmptyParticipationResultFeedback } from "@/features/participation/resultFeedback";
import { createEmptyParticipationSpace } from "@/features/participation/spaceContainer";
import { createEmptyParticipationPlaceReference } from "@/features/participation/placeFuture";
import type { ParticipationPlaceReference } from "@/features/participation/placeFuture";
import type { ParticipationResultFeedback } from "@/features/participation/resultFeedback";
import type { ParticipationSpace } from "@/features/participation/spaceContainer";

export type PublicParticipationSpaceFixture = {
  space: ParticipationSpace;
  feedback: ParticipationResultFeedback;
  place: ParticipationPlaceReference | null;
};

const PUBLIC_PARTICIPATION_SPACE_FIXTURES: PublicParticipationSpaceFixture[] = [
  {
    space: {
      ...createEmptyParticipationSpace({
        id: "space-schulweg-nord",
        title: "Beteiligungsraum Schulwegsicherheit Nord",
        slug: "schulwegsicherheit-nord",
        summary:
          "Ein transparenter Beteiligungsstand zu Schulweg, Querungen und Sicherheit rund um den nördlichen Kiez.",
        updatedAt: "2026-06-27T12:00:00.000Z",
        status: "public_feedback_live",
        visibility: "public_read_only",
        modules: [
          "topic_overview",
          "status_timeline",
          "result_feedback",
          "minority_positions",
          "open_questions",
          "next_steps",
          "dossier_references",
        ],
      }),
      linkedItems: [
        {
          id: "linked-item-1",
          title: "Hinweis zu gefährlicher Querung",
          impactStatus: "addressed",
          feedbackStatus: "published_feedback",
          sourceStatus: "reviewed_summary",
          queueKey: "archive_candidates",
          riskFlags: [],
        },
      ],
      publicSummary: {
        headline: "Öffentliche Rückmeldung zum Beteiligungsstand",
        shortSummary:
          "Mehrere Hinweise zur Querungssituation wurden gebündelt. Rückmeldungen fokussieren auf Sichtachsen, Hol- und Bringverkehr und nächste Prüfpfade.",
        statusLabel: "Öffentliche Rückmeldung sichtbar",
        feedbackAvailable: true,
        openQuestionCount: 2,
        minorityPositionCount: 1,
        nextStepCount: 2,
        lastUpdatedAt: "2026-06-27T12:00:00.000Z",
      },
    },
    feedback: {
      ...createEmptyParticipationResultFeedback({
        id: "feedback-schulweg-nord",
        updatedAt: "2026-06-27T12:00:00.000Z",
        impactStatus: "feedback_available",
      }),
      title: "Rückmeldung zur Schulwegsicherheit",
      summary:
        "Der aktuelle Beteiligungsstand bündelt häufige Hinweise und offene Fragen, ohne daraus automatische politische Entscheidungen abzuleiten.",
      feedbackStatus: "published_feedback",
      sourceStatus: "reviewed_summary",
      topicSummaries: [
        {
          id: "topic-1",
          title: "Querung vor der Schule",
          summary:
            "Viele Rückmeldungen betreffen eingeschränkte Sicht und hohes Verkehrsaufkommen zu Stoßzeiten.",
          contributionCount: 8,
        },
      ],
      minorityPositions: [
        {
          id: "minority-1",
          title: "Mehr Aufsicht statt baulicher Änderung",
          summary:
            "Ein Teil der Rückmeldungen bevorzugt zunächst organisatorische Maßnahmen statt sofortiger baulicher Eingriffe.",
          preserved: true,
        },
      ],
      openQuestions: [
        {
          id: "question-1",
          question: "Welche Zeitfenster sind tatsächlich am stärksten belastet?",
          stillOpen: true,
        },
        {
          id: "question-2",
          question: "Welche Querung lässt sich kurzfristig sicherer markieren?",
          stillOpen: true,
        },
      ],
      nextSteps: [
        {
          id: "step-1",
          label: "Sichtachsen konkret prüfen",
          description:
            "Die Quellenlage zur Sichtbehinderung wird review-first weiter verdichtet.",
          reviewFirst: true,
        },
        {
          id: "step-2",
          label: "Rückmeldung mit lokalen Akteuren spiegeln",
          description:
            "Die Einordnung wird im nächsten Schritt mit lokalen Zuständigen und betroffenen Gruppen abgeglichen.",
          reviewFirst: true,
        },
      ],
    },
    place: {
      ...createEmptyParticipationPlaceReference({
        id: "place-schulweg-nord",
        label: "Kiezbereich rund um die Grundschule Nord",
        description:
          "Öffentlich sichtbar bleibt nur ein grober Gebietsbezug ohne Karte oder Markeransicht.",
        type: "district",
        precision: "medium",
        reviewStatus: "approved_for_display",
        displayMode: "area_label",
        createdAt: "2026-06-27T12:00:00.000Z",
        updatedAt: "2026-06-27T12:00:00.000Z",
        linkedSpace: {
          spaceId: "space-schulweg-nord",
          spaceTitle: "Beteiligungsraum Schulwegsicherheit Nord",
          spaceStatus: "public_feedback_live",
          spaceVisibility: "public_read_only",
        },
        source: "space_context",
      }),
    },
  },
  {
    space: {
      ...createEmptyParticipationSpace({
        id: "space-jugendforum-sued",
        title: "Beteiligungsraum Jugendforum Süd",
        slug: "jugendforum-sued",
        summary:
          "Ein öffentlicher Zwischenstand zu Treffpunkten, Mobilität und Aufenthaltsqualität im südlichen Stadtteil.",
        updatedAt: "2026-06-27T12:00:00.000Z",
        status: "feedback_prepared",
        visibility: "public_read_only",
        modules: [
          "topic_overview",
          "status_timeline",
          "result_feedback",
          "open_questions",
          "next_steps",
          "operator_cockpit",
        ],
      }),
      linkedItems: [
        {
          id: "linked-item-2",
          title: "Frage zu sicheren Abendwegen",
          impactStatus: "addressed",
          feedbackStatus: "approved_for_public_feedback",
          sourceStatus: "reviewed_summary",
          queueKey: "feedback_ready",
          riskFlags: [],
        },
      ],
      publicSummary: {
        headline: "Rückmeldung in Vorbereitung",
        shortSummary:
          "Eine öffentliche Rückmeldung ist vorbereitet, aber noch nicht als öffentliche Einordnung freigegeben.",
        statusLabel: "Rückmeldung vorbereitet",
        feedbackAvailable: false,
        openQuestionCount: 1,
        minorityPositionCount: 0,
        nextStepCount: 1,
        lastUpdatedAt: "2026-06-27T12:00:00.000Z",
      },
    },
    feedback: {
      ...createEmptyParticipationResultFeedback({
        id: "feedback-jugendforum-sued",
        updatedAt: "2026-06-27T12:00:00.000Z",
        impactStatus: "addressed",
      }),
      title: "Vorbereitete Rückmeldung Jugendforum Süd",
      summary:
        "Die nächste öffentliche Einordnung ist vorbereitet, aber noch nicht als öffentlicher Rückmeldestand sichtbar.",
      feedbackStatus: "approved_for_public_feedback",
      sourceStatus: "reviewed_summary",
      topicSummaries: [
        {
          id: "topic-2",
          title: "Abendwege und Aufenthaltsorte",
          summary:
            "Die Hinweise verdichten sich auf sichere Wege, Beleuchtung und besser sichtbare Treffpunkte.",
          contributionCount: 5,
        },
      ],
      openQuestions: [
        {
          id: "question-3",
          question: "Welche Orte sollen zuerst gemeinsam nachgeschärft werden?",
          stillOpen: true,
        },
      ],
      nextSteps: [
        {
          id: "step-3",
          label: "Sichtbare Rückmeldung nach Review freigeben",
          description:
            "Vor einer sichtbaren Rückmeldung bleibt ein separater Review- und Freigabeschritt nötig.",
          reviewFirst: true,
        },
      ],
    },
    place: {
      ...createEmptyParticipationPlaceReference({
        id: "place-jugendforum-sued",
        label: "Genauer Treffpunkt bleibt geschützt",
        description:
          "Der konkrete Ortsbezug bleibt aus Sicherheitsgründen verborgen und wird nicht öffentlich angezeigt.",
        type: "event_location",
        precision: "high",
        reviewStatus: "hidden_for_safety",
        displayMode: "hidden",
        createdAt: "2026-06-27T12:00:00.000Z",
        updatedAt: "2026-06-27T12:00:00.000Z",
        linkedSpace: {
          spaceId: "space-jugendforum-sued",
          spaceTitle: "Beteiligungsraum Jugendforum Süd",
          spaceStatus: "feedback_prepared",
          spaceVisibility: "public_read_only",
        },
        source: "live_context",
      }),
    },
  },
];

export function listPublicParticipationSpaceFixtures(): PublicParticipationSpaceFixture[] {
  return PUBLIC_PARTICIPATION_SPACE_FIXTURES;
}

export function getPublicParticipationSpaceFixtureBySlug(
  slug: string,
): PublicParticipationSpaceFixture | null {
  return (
    PUBLIC_PARTICIPATION_SPACE_FIXTURES.find((fixture) => fixture.space.slug === slug) ??
    null
  );
}
