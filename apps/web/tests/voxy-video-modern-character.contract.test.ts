import { describe, expect, it } from "vitest";
import {
  VOXY_CHARACTER_EXPRESSIONS,
  VOXY_CHARACTER_MOTIONS,
  VOXY_MODERN_VIDEO_STATUSES,
  assertVoxyModernVideoTransition,
  buildFailedVoxyModernRenderJob,
  canTransitionVoxyModernVideoStatus,
  resolveVoxyModernPublishGate,
  resolveVoxyModernRenderGate,
  type VoxyCharacterMotionSegment,
  type VoxyLanguageEdition,
} from "@/features/voxyVideo/modernCharacterContracts";

describe("Voxy modern character contracts", () => {
  it("keeps the review-first lifecycle explicit", () => {
    expect(VOXY_MODERN_VIDEO_STATUSES).toEqual([
      "draft",
      "briefing_ready",
      "script_ready",
      "needs_review",
      "approved",
      "render_queued",
      "rendering",
      "rendered",
      "publish_ready",
      "published",
      "failed",
    ]);
    expect(canTransitionVoxyModernVideoStatus("approved", "render_queued")).toBe(
      true,
    );
    expect(canTransitionVoxyModernVideoStatus("needs_review", "rendering")).toBe(
      false,
    );
    expect(() =>
      assertVoxyModernVideoTransition("needs_review", "rendering"),
    ).toThrow("invalid_voxy_video_transition");
  });

  it("uses controlled character motion instead of lip-sync semantics", () => {
    expect(VOXY_CHARACTER_MOTIONS).toEqual([
      "neutral_idle",
      "listening",
      "explaining",
      "questioning",
      "highlighting_source",
      "showing_contrast",
      "inviting_participation",
    ]);
    expect(VOXY_CHARACTER_MOTIONS.join(" ").toLowerCase()).not.toContain("lip");
  });

  it("keeps expressions controlled and non-partisan", () => {
    expect(VOXY_CHARACTER_EXPRESSIONS).toEqual([
      "neutral",
      "attentive",
      "thoughtful",
      "friendly",
      "serious",
      "surprised",
      "inviting",
    ]);
  });

  it("separates original, working and output language", () => {
    const edition: VoxyLanguageEdition = {
      countryCode: "FR",
      originalLanguage: "de",
      workingLanguage: "de",
      outputLanguage: "fr",
      locale: "fr-FR",
      translationReviewRequired: true,
    };

    expect(edition.outputLanguage).not.toBe(edition.originalLanguage);
    expect(edition.translationReviewRequired).toBe(true);
  });

  it("gives every segment timing, motion and source linkage", () => {
    const segment: VoxyCharacterMotionSegment = {
      id: "segment-1",
      kind: "source_note",
      text: "Das ist der aktuelle Quellenstand.",
      startMs: 1_500,
      durationMs: 2_000,
      motion: "highlighting_source",
      expression: "attentive",
      visualCue: "source_card",
      sourceIds: ["source-1"],
    };

    expect(segment.motion).toBe("highlighting_source");
    expect(segment.sourceIds).toEqual(["source-1"]);
  });

  it("blocks rendering without approval, segments or source disclosure", () => {
    expect(
      resolveVoxyModernRenderGate({
        videoStatus: "needs_review",
        reviewStatus: "pending",
        hasSegments: true,
        hasSourceDisclosure: true,
      }),
    ).toEqual({ allowed: false, reason: "video_not_approved" });

    expect(
      resolveVoxyModernRenderGate({
        videoStatus: "approved",
        reviewStatus: "approved",
        hasSegments: true,
        hasSourceDisclosure: true,
      }),
    ).toEqual({ allowed: true, reason: null });
  });

  it("blocks publishing until rendered output and publish review exist", () => {
    expect(
      resolveVoxyModernPublishGate({
        videoStatus: "publish_ready",
        outputAssetId: null,
        publishReviewStatus: "approved",
      }),
    ).toEqual({ allowed: false, reason: "rendered_output_missing" });

    expect(
      resolveVoxyModernPublishGate({
        videoStatus: "publish_ready",
        outputAssetId: "asset-1",
        publishReviewStatus: "approved",
      }),
    ).toEqual({ allowed: true, reason: null });
  });

  it("keeps provider failures visible without leaking raw provider errors", () => {
    const job = buildFailedVoxyModernRenderJob({
      id: "render-1",
      briefingId: "briefing-1",
      format: "9:16",
      attempt: 2,
      errorCode: "provider_unavailable",
    });

    expect(job.status).toBe("failed");
    expect(job.attempt).toBe(2);
    expect(job.errorCode).toBe("provider_unavailable");
    expect(job.safeErrorMessage).toContain("nichts veröffentlicht");
  });
});
