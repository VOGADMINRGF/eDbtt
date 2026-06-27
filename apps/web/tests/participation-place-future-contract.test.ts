import { describe, expect, it } from "vitest";

import {
  canShowParticipationPlacePublicly,
  createEmptyParticipationPlaceReference,
  getParticipationPlaceDisplayModeLabel,
  getParticipationPlacePrecisionLabel,
  getParticipationPlaceReviewStatusLabel,
  getParticipationPlaceTypeLabel,
  isParticipationPlaceDisplayable,
  PARTICIPATION_PLACE_DISPLAY_MODES,
  PARTICIPATION_PLACE_PRECISIONS,
  PARTICIPATION_PLACE_REFERENCE_TYPES,
  PARTICIPATION_PLACE_REVIEW_STATUSES,
  requiresParticipationPlaceReview,
  summarizeParticipationPlaceReadiness,
} from "@/features/participation/placeFuture";

function basePlace() {
  return createEmptyParticipationPlaceReference({
    id: "place-1",
    label: "Stadtteil Nord",
    description: "Ein grob beschriebener Ortsbezug für den Beteiligungskontext.",
    createdAt: "2026-06-27T12:00:00.000Z",
    updatedAt: "2026-06-27T12:00:00.000Z",
    linkedSpace: {
      spaceId: "space-1",
      spaceTitle: "Vorhabenraum Mobilität",
      spaceStatus: "review_active",
      spaceVisibility: "review_only",
    },
  });
}

describe("participation place future contract", () => {
  it("defines all place reference types", () => {
    expect(PARTICIPATION_PLACE_REFERENCE_TYPES).toEqual([
      "free_text_place",
      "district",
      "street_or_area",
      "institution",
      "event_location",
      "online_context",
      "not_location_bound",
    ]);
  });

  it("defines all precision values", () => {
    expect(PARTICIPATION_PLACE_PRECISIONS).toEqual([
      "none",
      "low",
      "medium",
      "high",
      "exact",
    ]);
  });

  it("defines all review statuses", () => {
    expect(PARTICIPATION_PLACE_REVIEW_STATUSES).toEqual([
      "unreviewed",
      "needs_clarification",
      "reviewed_context",
      "approved_for_display",
      "hidden_for_safety",
    ]);
  });

  it("defines all display modes", () => {
    expect(PARTICIPATION_PLACE_DISPLAY_MODES).toEqual([
      "hidden",
      "text_only",
      "area_label",
      "approximate_marker",
      "exact_marker_future",
    ]);
  });

  it("shows approved non-hidden location-bound places publicly", () => {
    const place = {
      ...basePlace(),
      type: "district" as const,
      precision: "medium" as const,
      reviewStatus: "approved_for_display" as const,
      displayMode: "area_label" as const,
    };

    expect(canShowParticipationPlacePublicly(place)).toBe(true);
    expect(isParticipationPlaceDisplayable(place)).toBe(true);
  });

  it("blocks public display for hidden_for_safety", () => {
    const place = {
      ...basePlace(),
      type: "institution" as const,
      reviewStatus: "hidden_for_safety" as const,
      displayMode: "text_only" as const,
    };

    expect(canShowParticipationPlacePublicly(place)).toBe(false);
  });

  it("requires review for unreviewed and needs_clarification", () => {
    expect(
      requiresParticipationPlaceReview({
        ...basePlace(),
        reviewStatus: "unreviewed",
      }),
    ).toBe(true);
    expect(
      requiresParticipationPlaceReview({
        ...basePlace(),
        reviewStatus: "needs_clarification",
      }),
    ).toBe(true);
  });

  it("keeps not_location_bound valid but not displayable", () => {
    const place = {
      ...basePlace(),
      type: "not_location_bound" as const,
      reviewStatus: "approved_for_display" as const,
      displayMode: "text_only" as const,
    };

    expect(isParticipationPlaceDisplayable(place)).toBe(false);
    expect(canShowParticipationPlacePublicly(place)).toBe(false);
  });

  it("prevents marker-style display for online_context", () => {
    const place = {
      ...basePlace(),
      type: "online_context" as const,
      reviewStatus: "approved_for_display" as const,
      displayMode: "approximate_marker" as const,
    };

    expect(isParticipationPlaceDisplayable(place)).toBe(false);
    expect(
      summarizeParticipationPlaceReadiness(place).blockingReasons,
    ).toContain("online_context_text_only");
  });

  it("keeps exact_marker_future as future intent without coordinates or rendering", () => {
    const place = {
      ...basePlace(),
      type: "street_or_area" as const,
      precision: "exact" as const,
      reviewStatus: "approved_for_display" as const,
      displayMode: "exact_marker_future" as const,
    };
    const readiness = summarizeParticipationPlaceReadiness(place);

    expect(readiness.displayable).toBe(true);
    expect("coordinates" in place).toBe(false);
    expect(readiness.guardrails.noCoordinateStorage).toBe(true);
    expect(readiness.guardrails.noMapRendering).toBe(true);
  });

  it("keeps low precision free-text places text or area only", () => {
    const allowed = {
      ...basePlace(),
      type: "free_text_place" as const,
      precision: "low" as const,
      reviewStatus: "approved_for_display" as const,
      displayMode: "area_label" as const,
    };
    const blocked = {
      ...allowed,
      displayMode: "approximate_marker" as const,
    };

    expect(isParticipationPlaceDisplayable(allowed)).toBe(true);
    expect(isParticipationPlaceDisplayable(blocked)).toBe(false);
  });

  it("keeps linked space status and visibility intact", () => {
    const place = {
      ...basePlace(),
      linkedSpace: {
        spaceId: "space-2",
        spaceTitle: "Vorhabenraum Schule",
        spaceStatus: "public_feedback_live" as const,
        spaceVisibility: "public_read_only" as const,
      },
    };

    expect(place.linkedSpace).toEqual({
      spaceId: "space-2",
      spaceTitle: "Vorhabenraum Schule",
      spaceStatus: "public_feedback_live",
      spaceVisibility: "public_read_only",
    });
  });

  it("keeps readiness guardrails explicit", () => {
    const readiness = summarizeParticipationPlaceReadiness({
      ...basePlace(),
      type: "district",
      reviewStatus: "approved_for_display",
      displayMode: "text_only",
    });

    expect(readiness.guardrails).toEqual({
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
    });
  });

  it("keeps helper output free of map, geocoding, external api, coordinate, publish, dossier, anlassraum and graph automation", () => {
    const place = basePlace();
    const readiness = summarizeParticipationPlaceReadiness(place);

    expect(readiness.guardrails.noMapRendering).toBe(true);
    expect(readiness.guardrails.noGeocoding).toBe(true);
    expect(readiness.guardrails.noExternalMapApi).toBe(true);
    expect(readiness.guardrails.noCoordinateStorage).toBe(true);
    expect(readiness.guardrails.noAutoPublish).toBe(true);
    expect(readiness.guardrails.noAutoDossier).toBe(true);
    expect(readiness.guardrails.noAutoAnlassraum).toBe(true);
    expect(readiness.guardrails.noAutoGraph).toBe(true);
  });

  it("keeps labels explicit and non-technical", () => {
    expect(getParticipationPlaceTypeLabel("institution")).toBe(
      "Institution / Einrichtung",
    );
    expect(getParticipationPlacePrecisionLabel("exact")).toBe(
      "Exakte fachliche Einordnung",
    );
    expect(
      getParticipationPlaceReviewStatusLabel("approved_for_display"),
    ).toBe("Für Anzeige freigegeben");
    expect(getParticipationPlaceDisplayModeLabel("exact_marker_future")).toBe(
      "Exakter Marker später",
    );
  });
});
