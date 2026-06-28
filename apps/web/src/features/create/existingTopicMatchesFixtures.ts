import type { ExistingTopicMatchPanelModel } from "@/features/create/existingTopicMatches";

// Preview- und Test-Fixtures. Sie markieren nur Anschlussvorschlaege
// fuer UI und Tests und behaupten keine vollstaendige Suche.
export const EXISTING_TOPIC_MATCH_PREVIEW_FIXTURES = {
  weakTopicMatch: {
    id: "fixture-topic-weak",
    kind: "topic",
    title: "Sichere Schulwege",
    summary:
      "Ein aehnlicher Themenfokus ist bereits sichtbar, aber noch ohne bestaetigte Dublette.",
    strength: "weak",
    status: "suggested",
    reason:
      "Thema und Formulierung liegen nah beieinander, bleiben aber nur ein Vorschlag.",
    relatedTopicId: "topic-schulwege",
    requiresReview: false,
  },
  mediumBranchMatch: {
    id: "fixture-branch-medium",
    kind: "branch",
    title: "Querungen vor Grundschulen zuerst",
    summary:
      "Ein bestehender Zweig sammelt bereits Vorschlaege zu sicheren Querungen und Tempo-30-Kontrollen.",
    strength: "medium",
    status: "suggested",
    reason:
      "Die gleiche lokale Problemrichtung wurde bereits als eigener Zweig vorgemerkt.",
    relatedTopicId: "topic-schulwege",
    relatedBranchId: "branch-querungen",
    requiresReview: false,
  },
  strongParticipationSpaceMatch: {
    id: "fixture-space-strong",
    kind: "participation_space",
    title: "Beteiligungsraum Schulweg im Kiez",
    summary:
      "Ein vorhandener Beteiligungsraum koennte lokale Erfahrungen, Gegenperspektiven und Prioritaeten zu diesem Thema buendeln.",
    strength: "strong",
    status: "needs_review",
    reason:
      "Fuer diesen Anschluss braucht es bewusste Pruefung und keinen automatischen Uebergang.",
    relatedParticipationSpaceId: "space-schulweg-kiez",
    requiresReview: true,
  },
  dossierMatch: {
    id: "fixture-dossier-medium",
    kind: "dossier",
    title: "Dossier-Anknuepfung Sichere Schulwege",
    summary:
      "Ein Dossierpfad koennte Argumente, offene Fragen und spaetere Evidenz dazu geordnet aufnehmen.",
    strength: "medium",
    status: "needs_review",
    reason:
      "Dossiers bleiben review-first und werden hier nicht automatisch erstellt.",
    relatedDossierId: "dossier-schulwege",
    requiresReview: true,
  },
  opinionClusterMatch: {
    id: "fixture-opinion-cluster",
    kind: "opinion_cluster",
    title: "Aehnliche Meinungen zu sicheren Schulwegen",
    summary:
      "Aehnliche Meinungen koennen nur vorsichtig gezaehlt werden und sind keine repraesentative Statistik.",
    strength: "medium",
    status: "suggested",
    reason:
      "Der Beitrag koennte auch nur als aehnliche Meinung markiert werden, ohne Zweig oder Dossier zu uebernehmen.",
    countedOpinions: 14,
    requiresReview: false,
  },
  sourceQuestionMatch: {
    id: "fixture-source-question",
    kind: "source_question",
    title: "Quellen- und Belegfrage vormerken",
    summary:
      "Einzelne Wirkbehauptungen sollten erst in einen Quellenpruefungsbedarf gehen, bevor daraus mehr abgeleitet wird.",
    strength: "strong",
    status: "needs_review",
    reason:
      "Hier ist ein vorsichtiger Quellenpruefungsbedarf sichtbar, keine bestaetigte Tatsache.",
    requiresReview: true,
  },
} as const satisfies Record<string, ExistingTopicMatchPanelModel["matches"][number]>;

export const EXISTING_TOPIC_MATCH_PANEL_PREVIEW_MODEL = {
  topicTitle: "Sichere Schulwege",
  introText:
    "Dein Beitrag muss nicht allein stehen. eDebatte kann prüfen, ob er an bestehende Themen, Zweige oder Beteiligungsräume anschließt – oder ob du bewusst einen neuen Zweig starten möchtest.",
  matches: [
    EXISTING_TOPIC_MATCH_PREVIEW_FIXTURES.weakTopicMatch,
    EXISTING_TOPIC_MATCH_PREVIEW_FIXTURES.mediumBranchMatch,
    EXISTING_TOPIC_MATCH_PREVIEW_FIXTURES.strongParticipationSpaceMatch,
    EXISTING_TOPIC_MATCH_PREVIEW_FIXTURES.dossierMatch,
    EXISTING_TOPIC_MATCH_PREVIEW_FIXTURES.opinionClusterMatch,
    EXISTING_TOPIC_MATCH_PREVIEW_FIXTURES.sourceQuestionMatch,
  ],
  suggestedDecision: "connect_to_existing",
  openQuestions: [
    "Welcher Anschluss soll nur vorgemerkt bleiben und was braucht noch Review?",
  ],
  guardrailNote:
    "Das sind Anschlussvorschläge, keine automatische Zusammenführung.",
  sourceKind: "preview",
  sourceLabel: "Preview auf Basis lokaler Beispieldaten",
  emptyStateText: null,
} as const satisfies ExistingTopicMatchPanelModel;
