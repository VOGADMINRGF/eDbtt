import {
  type ParticipationSpaceStatus,
  type ParticipationSpaceVisibility,
} from "@/features/participation/spaceContainer";

export const PARTICIPATION_PLACE_REFERENCE_TYPES = [
  "free_text_place",
  "district",
  "street_or_area",
  "institution",
  "event_location",
  "online_context",
  "not_location_bound",
] as const;

export type ParticipationPlaceReferenceType =
  (typeof PARTICIPATION_PLACE_REFERENCE_TYPES)[number];

export const PARTICIPATION_PLACE_PRECISIONS = [
  "none",
  "low",
  "medium",
  "high",
  "exact",
] as const;

export type ParticipationPlacePrecision =
  (typeof PARTICIPATION_PLACE_PRECISIONS)[number];

export const PARTICIPATION_PLACE_REVIEW_STATUSES = [
  "unreviewed",
  "needs_clarification",
  "reviewed_context",
  "approved_for_display",
  "hidden_for_safety",
] as const;

export type ParticipationPlaceReviewStatus =
  (typeof PARTICIPATION_PLACE_REVIEW_STATUSES)[number];

export const PARTICIPATION_PLACE_DISPLAY_MODES = [
  "hidden",
  "text_only",
  "area_label",
  "approximate_marker",
  "exact_marker_future",
] as const;

export type ParticipationPlaceDisplayMode =
  (typeof PARTICIPATION_PLACE_DISPLAY_MODES)[number];

export const PARTICIPATION_PLACE_SOURCES = [
  "user_submitted",
  "operator_added",
  "space_context",
  "live_context",
  "dossier_reference",
] as const;

export type ParticipationPlaceSource =
  (typeof PARTICIPATION_PLACE_SOURCES)[number];

export type ParticipationPlaceGuardrails = {
  noMapRendering: true;
  noGeocoding: true;
  noExternalMapApi: true;
  noCoordinateStorage: true;
  noAutoPublish: true;
  noAutoDossier: true;
  noAutoAnlassraum: true;
  noAutoGraph: true;
  noAutomaticOfficialAssessment: true;
  placeIsContextOnly: true;
  exactMarkerIsFutureIntentOnly: true;
  safetyReviewCanHidePlace: true;
};

export type ParticipationPlaceLinkedSpace = {
  spaceId: string;
  spaceTitle: string;
  spaceStatus: ParticipationSpaceStatus;
  spaceVisibility: ParticipationSpaceVisibility;
};

export type ParticipationPlaceReference = {
  id: string;
  label: string;
  description: string;
  type: ParticipationPlaceReferenceType;
  precision: ParticipationPlacePrecision;
  reviewStatus: ParticipationPlaceReviewStatus;
  displayMode: ParticipationPlaceDisplayMode;
  linkedSpace: ParticipationPlaceLinkedSpace;
  source: ParticipationPlaceSource;
  createdAt: string;
  updatedAt: string;
  guardrails: ParticipationPlaceGuardrails;
};

export type ParticipationPlaceReadiness = {
  displayable: boolean;
  publicVisible: boolean;
  reviewRequired: boolean;
  blockingReasons: string[];
  typeLabel: string;
  precisionLabel: string;
  reviewStatusLabel: string;
  displayModeLabel: string;
  guardrails: ParticipationPlaceGuardrails;
};

const PARTICIPATION_PLACE_GUARDRAILS =
  Object.freeze({
    noMapRendering: true,
    noGeocoding: true,
    noExternalMapApi: true,
    noCoordinateStorage: true,
    noAutoPublish: true,
    noAutoDossier: true,
    noAutoAnlassraum: true,
    noAutoGraph: true,
    noAutomaticOfficialAssessment: true,
    placeIsContextOnly: true,
    exactMarkerIsFutureIntentOnly: true,
    safetyReviewCanHidePlace: true,
  }) satisfies ParticipationPlaceGuardrails;

const PARTICIPATION_PLACE_TYPE_LABELS: Record<
  ParticipationPlaceReferenceType,
  string
> = {
  free_text_place: "Freitext-Ortsbezug",
  district: "Bezirk / Stadtteil / Region",
  street_or_area: "Straße / Platz / Gebiet",
  institution: "Institution / Einrichtung",
  event_location: "Termin- oder Veranstaltungsort",
  online_context: "Digitaler Kontext",
  not_location_bound: "Nicht ortsgebunden",
};

const PARTICIPATION_PLACE_PRECISION_LABELS: Record<
  ParticipationPlacePrecision,
  string
> = {
  none: "Keine Präzisierung",
  low: "Grobe Einordnung",
  medium: "Mittlere Einordnung",
  high: "Hohe Einordnung",
  exact: "Exakte fachliche Einordnung",
};

const PARTICIPATION_PLACE_REVIEW_STATUS_LABELS: Record<
  ParticipationPlaceReviewStatus,
  string
> = {
  unreviewed: "Ungeprüft",
  needs_clarification: "Rückfrage nötig",
  reviewed_context: "Kontext geprüft",
  approved_for_display: "Für Anzeige freigegeben",
  hidden_for_safety: "Aus Sicherheitsgründen verborgen",
};

const PARTICIPATION_PLACE_DISPLAY_MODE_LABELS: Record<
  ParticipationPlaceDisplayMode,
  string
> = {
  hidden: "Verborgen",
  text_only: "Nur Text",
  area_label: "Bereichslabel",
  approximate_marker: "Ungefährer Marker",
  exact_marker_future: "Exakter Marker später",
};

function buildBlockingReasons(
  place: ParticipationPlaceReference,
): string[] {
  const reasons: string[] = [];

  if (place.reviewStatus === "hidden_for_safety") {
    reasons.push("hidden_for_safety");
  }
  if (place.type === "not_location_bound") {
    reasons.push("not_location_bound");
  }
  if (
    place.type === "online_context" &&
    place.displayMode !== "text_only" &&
    place.displayMode !== "hidden"
  ) {
    reasons.push("online_context_text_only");
  }
  if (
    place.displayMode === "exact_marker_future" &&
    (place.precision !== "exact" ||
      place.reviewStatus !== "approved_for_display")
  ) {
    reasons.push("exact_marker_requires_exact_approved_intent");
  }
  if (
    place.type === "free_text_place" &&
    place.precision === "low" &&
    place.displayMode !== "text_only" &&
    place.displayMode !== "area_label" &&
    place.displayMode !== "hidden"
  ) {
    reasons.push("low_precision_free_text_restricted");
  }
  if (place.displayMode === "hidden") {
    reasons.push("display_hidden");
  }

  return reasons;
}

export function getParticipationPlaceTypeLabel(
  type: ParticipationPlaceReferenceType,
): string {
  return PARTICIPATION_PLACE_TYPE_LABELS[type];
}

export function getParticipationPlacePrecisionLabel(
  precision: ParticipationPlacePrecision,
): string {
  return PARTICIPATION_PLACE_PRECISION_LABELS[precision];
}

export function getParticipationPlaceReviewStatusLabel(
  status: ParticipationPlaceReviewStatus,
): string {
  return PARTICIPATION_PLACE_REVIEW_STATUS_LABELS[status];
}

export function getParticipationPlaceDisplayModeLabel(
  mode: ParticipationPlaceDisplayMode,
): string {
  return PARTICIPATION_PLACE_DISPLAY_MODE_LABELS[mode];
}

export function isParticipationPlaceDisplayable(
  place: ParticipationPlaceReference,
): boolean {
  return buildBlockingReasons(place).length === 0;
}

export function requiresParticipationPlaceReview(
  place: ParticipationPlaceReference,
): boolean {
  return (
    place.reviewStatus === "unreviewed" ||
    place.reviewStatus === "needs_clarification"
  );
}

export function canShowParticipationPlacePublicly(
  place: ParticipationPlaceReference,
): boolean {
  if (place.reviewStatus === "hidden_for_safety") {
    return false;
  }

  return (
    place.reviewStatus === "approved_for_display" &&
    place.displayMode !== "hidden" &&
    place.type !== "not_location_bound" &&
    isParticipationPlaceDisplayable(place)
  );
}

export function summarizeParticipationPlaceReadiness(
  place: ParticipationPlaceReference,
): ParticipationPlaceReadiness {
  const blockingReasons = buildBlockingReasons(place);

  return {
    displayable: blockingReasons.length === 0,
    publicVisible: canShowParticipationPlacePublicly(place),
    reviewRequired: requiresParticipationPlaceReview(place),
    blockingReasons,
    typeLabel: getParticipationPlaceTypeLabel(place.type),
    precisionLabel: getParticipationPlacePrecisionLabel(place.precision),
    reviewStatusLabel: getParticipationPlaceReviewStatusLabel(
      place.reviewStatus,
    ),
    displayModeLabel: getParticipationPlaceDisplayModeLabel(place.displayMode),
    guardrails: PARTICIPATION_PLACE_GUARDRAILS,
  };
}

export function createEmptyParticipationPlaceReference(
  params: Pick<
    ParticipationPlaceReference,
    "id" | "label" | "createdAt" | "updatedAt"
  > & {
    description?: string;
    type?: ParticipationPlaceReferenceType;
    precision?: ParticipationPlacePrecision;
    reviewStatus?: ParticipationPlaceReviewStatus;
    displayMode?: ParticipationPlaceDisplayMode;
    linkedSpace?: ParticipationPlaceLinkedSpace;
    source?: ParticipationPlaceSource;
  },
): ParticipationPlaceReference {
  return {
    id: params.id,
    label: params.label,
    description: params.description ?? "",
    type: params.type ?? "free_text_place",
    precision: params.precision ?? "none",
    reviewStatus: params.reviewStatus ?? "unreviewed",
    displayMode: params.displayMode ?? "hidden",
    linkedSpace: params.linkedSpace ?? {
      spaceId: "",
      spaceTitle: "",
      spaceStatus: "draft",
      spaceVisibility: "private",
    },
    source: params.source ?? "user_submitted",
    createdAt: params.createdAt,
    updatedAt: params.updatedAt,
    guardrails: PARTICIPATION_PLACE_GUARDRAILS,
  };
}
