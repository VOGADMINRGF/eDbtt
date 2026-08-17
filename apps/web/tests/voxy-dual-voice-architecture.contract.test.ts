import { describe, expect, it } from "vitest";

import {
  EDITORIAL_VOICE,
  VOXY_CANONICAL_INFORMATION_FLOW,
  VOXY_DUAL_VOICE_ACCEPTANCE,
  VOXY_DIRECT_ADDRESS_GREETING,
  VOXY_DUAL_VOICE_PILOT_CONTRACT,
  VOXY_DUAL_VOICE_PILOT_SEGMENTS,
  VOXY_DYNAMIC_EVIDENCE_MEMORY,
  VOXY_FUTURE_FORMAT_FAMILY,
  VOXY_NARRATIVE_CHART_BEHAVIOR,
  VOXY_NEWS_VISUAL_STATES,
  VOXY_SIGNATURE,
  VOXY_SOURCE_FIRST_GUARDRAILS,
  VOXY_SOURCE_FIRST_PRIORITY,
  VOXY_SPEAKER_ROLE_RULES,
  validateVoxyDualVoiceArchitecture,
} from "@/features/voxyVideo/dualVoiceArchitecture";

describe("Voxy dual-voice and evidence-first visual contract", () => {
  it("records the failed human identities without gender or canonical labels", () => {
    expect(VOXY_DUAL_VOICE_ACCEPTANCE).toMatchObject({
      humanVoiceArchitectureAcceptance: "accepted",
      technicalVoiceMappingGate: "passed",
      humanVoiceIdentityAcceptance: "failed",
      humanEditorialVoiceAcceptance: "failed_for_v1.1",
      humanPilotAcceptance: "needs_changes",
      canonicalVoxyVoice: "pending",
      canonicalEditorialVoice: "pending",
      genderLabelsAllowed: false,
      videoRenderingAllowed: false,
      productionEligible: false,
      autoPublish: false,
    });
    expect(VOXY_SIGNATURE).toMatchObject({
      speakerRole: "voxy",
      candidateId: "candidate-e",
      humanIdentityStatus: "failed_pending_reselection",
      voiceId: "voxy-signature-e-5a465a33",
      selectedVariantId: "e-02-warm-sovereign",
    });
    expect(EDITORIAL_VOICE).toMatchObject({
      speakerRole: "editorial",
      candidateId: "v1.1-editorial",
      humanIdentityStatus: "failed_for_v1.1_pending_reselection",
      voiceId: "de_DE/m-ailabs_low#ramona_deininger",
    });
    expect(VOXY_SIGNATURE).not.toHaveProperty("gender");
    expect(EDITORIAL_VOICE).not.toHaveProperty("gender");
    expect(EDITORIAL_VOICE.voiceId).not.toBe(VOXY_SIGNATURE.voiceId);
  });

  it("makes every spoken pilot block explicit and role-safe", () => {
    expect(VOXY_DUAL_VOICE_PILOT_SEGMENTS).toHaveLength(9);
    expect(VOXY_DUAL_VOICE_PILOT_SEGMENTS.map(({ speakerRole }) => speakerRole)).toEqual([
      "voxy",
      "voxy",
      "editorial",
      "editorial",
      "voxy",
      "editorial",
      "editorial",
      "voxy",
      "voxy",
    ]);
    for (const segment of VOXY_DUAL_VOICE_PILOT_SEGMENTS) {
      expect(segment.voiceId).toBe(
        segment.speakerRole === "voxy" ? VOXY_SIGNATURE.voiceId : EDITORIAL_VOICE.voiceId,
      );
      expect(segment.text.trim()).not.toBe("");
    }
    expect(VOXY_SPEAKER_ROLE_RULES.editorial.voxyMouth).toBe(
      "neutral_or_closed_no_editorial_lip_sync",
    );
    expect(VOXY_SPEAKER_ROLE_RULES.waveform).toMatchObject({
      count: 1,
      reactsToActiveVoice: true,
      speakerChangeCreatesSecondWaveform: false,
    });
  });

  it("opens direct Voxy address exactly once with the canonical greeting", () => {
    expect(VOXY_DIRECT_ADDRESS_GREETING).toEqual({
      text: "Hallo Nachbar,",
      speakerRole: "voxy",
      placement: "once_at_start_of_connected_direct_address_video",
      editorialUsesGreeting: false,
      repeatBeforeEachVoxySegment: false,
      repeatForShortInsertTransitionOrNonDirectInformation: false,
      brandNarrativeException: false,
    });
    expect(VOXY_DUAL_VOICE_PILOT_SEGMENTS[0].text).toContain(`Hallo Nachbar.

Wir wählen.
Wir diskutieren.
Wir streiten.`);
    expect(
      VOXY_DUAL_VOICE_PILOT_SEGMENTS.flatMap(({ text }) =>
        text.match(/Hallo Nachbar\./g) ?? [],
      ),
    ).toHaveLength(1);
    expect(
      VOXY_DUAL_VOICE_PILOT_SEGMENTS.filter(
        ({ speakerRole, text }) => speakerRole === "editorial" && text.includes("Hallo Nachbar."),
      ),
    ).toEqual([]);
  });

  it("defines the complete evidence-first state machine and dynamic evidence memory", () => {
    expect(VOXY_NEWS_VISUAL_STATES.map(({ id }) => id)).toEqual([
      "host",
      "focus",
      "explain",
      "dock",
      "synthesis",
    ]);
    expect(VOXY_CANONICAL_INFORMATION_FLOW.map(({ state }) => state)).toEqual([
      "host",
      "focus",
      "explain",
      "dock",
      "host",
      "focus",
      "explain",
      "dock",
      "synthesis",
      "host",
    ]);
    expect(VOXY_DYNAMIC_EVIDENCE_MEMORY).toMatchObject({
      staticSidebar: false,
      previouslyDockedObjectsMayReturnToFocus: true,
      provenanceRemainsTraceable: true,
    });
    expect(VOXY_DYNAMIC_EVIDENCE_MEMORY.stores).toContain("uncertainty");
    expect(VOXY_DYNAMIC_EVIDENCE_MEMORY.stores).toContain("vote_result");
  });

  it("keeps source-first evidence and narration-driven charts non-decorative", () => {
    expect(VOXY_SOURCE_FIRST_PRIORITY).toEqual([
      "original_source_or_original_data",
      "traceably_derived_visualization",
      "clearly_labeled_editorial_summary",
    ]);
    expect(VOXY_SOURCE_FIRST_GUARDRAILS).toMatchObject({
      showOrigin: true,
      showRelevantPart: true,
      showDerivation: true,
      inventedCharts: false,
      decorativeFakeData: false,
      sourceOnlyAsFinePrint: false,
    });
    expect(VOXY_NARRATIVE_CHART_BEHAVIOR).toMatchObject({
      narrationDrivesAnimation: true,
      fullComplexChartRequiredAtStart: false,
      decorativeAnimationWithoutInformationValue: false,
    });
    expect(VOXY_NARRATIVE_CHART_BEHAVIOR.allowedSequence).toEqual([
      "axis_first",
      "relevant_series",
      "time_range_focus",
      "comparison_value",
      "relevant_point",
      "full_context",
      "dock",
    ]);
  });

  it("binds the implemented private pilot without releasing it", () => {
    expect(VOXY_DUAL_VOICE_PILOT_CONTRACT).toMatchObject({
      taskId: "VOXY-DUAL-VOICE-EXPLAINER-PILOT-01",
      status: "review",
      implementationInCurrentPass: true,
      privateHumanReviewEvidence: true,
      format: {
        width: 1920,
        height: 1080,
        fps: 24,
        durationSeconds: { min: 45, max: 60 },
      },
      requiredVisualSequence: ["host", "focus", "explain", "dock", "host"],
      finalSynthesisRequired: true,
      autonomousNewsProductionImplemented: false,
      productionEligible: false,
      autoPublish: false,
    });
    expect(VOXY_DUAL_VOICE_PILOT_CONTRACT.speakerTimelineFields).toEqual([
      "start",
      "end",
      "speakerRole",
      "voiceId",
      "text",
    ]);
    expect(VOXY_DUAL_VOICE_PILOT_CONTRACT.requiredOutputs).toContain(
      "visual-state-timeline.json",
    );
    expect(VOXY_FUTURE_FORMAT_FAMILY).toEqual([
      "VOXY_NEWS",
      "VOXY_EXPLAINER",
      "VOXY_DOSSIER",
      "VOXY_BALLOT",
      "VOXY_SOCIAL_SHORT",
    ]);
    expect(validateVoxyDualVoiceArchitecture()).toEqual([]);
  });
});
