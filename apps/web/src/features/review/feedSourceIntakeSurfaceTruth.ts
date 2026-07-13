export const FEED_SOURCE_INTAKE_SURFACE_TRUTH_PHASES = [
  "source_connection",
  "snapshot",
  "material_intake",
  "create_handoff",
  "review_item",
  "publish_preparation",
] as const;

export type FeedSourceIntakeSurfaceTruthPhase =
  (typeof FEED_SOURCE_INTAKE_SURFACE_TRUTH_PHASES)[number];

export const FEED_SOURCE_INTAKE_SURFACE_TRUTHS = [
  "admin_region",
  "admin_feeds",
  "admin_review",
  "organization_dashboard",
] as const;

export type FeedSourceIntakeSurfaceTruthSurface =
  (typeof FEED_SOURCE_INTAKE_SURFACE_TRUTHS)[number];

type FeedSourceIntakeSurfaceTruthPhaseCopy = {
  label: string;
  body: string;
  guardrail: string;
};

type FeedSourceIntakeSurfaceTruth = {
  title: string;
  body: string;
  footer: string;
  phases: FeedSourceIntakeSurfaceTruthPhase[];
};

const PHASE_COPY: Record<
  FeedSourceIntakeSurfaceTruthPhase,
  FeedSourceIntakeSurfaceTruthPhaseCopy
> = {
  source_connection: {
    label: "Source Connection",
    body: "Explizite Quellen bleiben kontrollierte Arbeitsverbindungen mit Scope, URL und Testpfad.",
    guardrail: "Kein Live-Crawler, kein Auto-Import und kein verdeckter Research-Lauf.",
  },
  snapshot: {
    label: "Snapshot",
    body: "Dry Run und Snapshot bleiben reviewpflichtige Zwischenstände mit sichtbarer Herkunft.",
    guardrail: "Kein Auto-Publish, kein public_official und kein behaupteter Dauerabruf.",
  },
  material_intake: {
    label: "Material Intake",
    body: "Material bleibt privat, review-first und erst nach bewusster Prüfung weiter nutzbar.",
    guardrail: "Keine automatische Extraktion, kein DeepSearch-Autolauf und keine öffentliche Referenz ohne Review.",
  },
  create_handoff: {
    label: "Create-Handoff",
    body: "Create-Arbeitsstände bleiben scope- und quellengebundene Review-Pakete statt stiller Veröffentlichung.",
    guardrail: "Keine automatische Dossier-Mutation, kein Auto-Publish und keine stille Freigabe.",
  },
  review_item: {
    label: "Review Item",
    body: "Quelle, Material und Handoff laufen als bewusste Review-Aufgabe in dieselbe Arbeitsliste.",
    guardrail: "Keine automatische Freigabe, kein stiller Merge und kein Bulk-Approve.",
  },
  publish_preparation: {
    label: "Publish-Vorbereitung",
    body: "Öffentliche Anschlüsse entstehen nur aus freigegebenen Kontexten und bleiben getrennt von Amtlichkeit.",
    guardrail: "Kein Auto-Publish, kein Social Posting und kein Scheduling ohne bewusste Entscheidung.",
  },
};

const SURFACE_TRUTH: Record<
  FeedSourceIntakeSurfaceTruthSurface,
  FeedSourceIntakeSurfaceTruth
> = {
  admin_region: {
    title: "Review-first Quellenpfad",
    body: "Diese Fläche verbindet Source Connection, Snapshot und spätere Review-Aufgabe in einer einzigen kontrollierten Kette.",
    footer:
      "Der Dry Run bleibt ein Snapshot-Schritt. Sichtbarkeit, Veröffentlichung und Amtlichkeit liegen bewusst auf späteren Review-Pfaden.",
    phases: ["source_connection", "snapshot", "review_item"],
  },
  admin_feeds: {
    title: "Review-first Intake-Handoff",
    body: "Feed-, Source- und Materialsignale dürfen weiterlaufen, aber nur als review-first Readmodel und nie als verdeckte Runtime-Freigabe.",
    footer:
      "Themenradar, Dossier und öffentliche Anschlüsse bleiben bewusste Folgepfade statt Auto-Import oder Auto-Publish.",
    phases: [
      "source_connection",
      "material_intake",
      "review_item",
      "publish_preparation",
    ],
  },
  admin_review: {
    title: "Kanonische Review-Herkunft",
    body: "Review-Items zeigen denselben Intake-, Snapshot- und Handoff-Kontext wie die vorgelagerten Admin- und Org-Surfaces.",
    footer:
      "Review, Freigabe und sichtbare Veröffentlichung bleiben getrennte Entscheidungen mit auditierbarem Ursprung.",
    phases: ["snapshot", "create_handoff", "review_item", "publish_preparation"],
  },
  organization_dashboard: {
    title: "Direkter Organisationspfad",
    body: "Organisationen sehen dieselbe Source-, Material- und Review-Wahrheit wie die Admin-Flächen, aber nur im eigenen Scope.",
    footer:
      "Quellen, Material und Sichtbarkeit bleiben review-first. Öffentliche Schritte folgen erst nach bewusster Freigabe.",
    phases: [
      "source_connection",
      "material_intake",
      "review_item",
      "publish_preparation",
    ],
  },
};

export function feedSourceIntakeTruthPhaseCopy(
  phase: FeedSourceIntakeSurfaceTruthPhase,
) {
  return PHASE_COPY[phase];
}

export function buildFeedSourceIntakeSurfaceTruth(
  surface: FeedSourceIntakeSurfaceTruthSurface,
) {
  const truth = SURFACE_TRUTH[surface];
  return {
    ...truth,
    phases: truth.phases.map((phase) => ({
      key: phase,
      ...feedSourceIntakeTruthPhaseCopy(phase),
    })),
  };
}
