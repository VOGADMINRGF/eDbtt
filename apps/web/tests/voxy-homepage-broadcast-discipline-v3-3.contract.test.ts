import { describe, expect, it } from "vitest";

import {
  buildVoxyHomepageReferenceFilmPlan,
  filmSegments,
  type VoxyHomepageContextMode,
  type VoxyHomepageFilmId,
} from "../src/features/voxyVideo/homepageReferenceFilms";
import { contextualizeVoxyHomepageReferenceFilmPlan } from "../src/features/voxyVideo/homepageReferenceFilmsContext";
import { renderVoxyHomepageReferenceFilmFrameHtml } from "../src/features/voxyVideo/homepageReferenceFilmsHtml";

const exactHead = "e".repeat(40);
const assets = {
  canonStageDataUrl: "data:image/png;base64,AA==",
  studioLockupDataUrl: "data:image/svg+xml;base64,AA==",
  lapelPinDataUrl: "data:image/svg+xml;base64,AA==",
  edebattePocketMarkDataUrl: "data:image/svg+xml;base64,AA==",
};

function plan(filmId: VoxyHomepageFilmId, contextMode: VoxyHomepageContextMode) {
  const segments = filmSegments(filmId, contextMode);
  return contextualizeVoxyHomepageReferenceFilmPlan(
    buildVoxyHomepageReferenceFilmPlan({
      filmId,
      contextMode,
      exactHeadSha: exactHead,
      speechDurationsMs: Array.from(
        { length: segments.length },
        () => filmId === "edebatte" ? 6_000 : 7_300,
      ),
    }),
  );
}

function htmlAt(
  current: ReturnType<typeof plan>,
  atSeconds: number,
) {
  return renderVoxyHomepageReferenceFilmFrameHtml({
    plan: current,
    assets,
    frameIndex: Math.floor(atSeconds * current.output.fps),
    amplitude: 0.35,
  });
}

function htmlAtSegment(
  current: ReturnType<typeof plan>,
  segmentId: string,
  progress = 0.5,
) {
  const segment = current.speakerTimeline.find((entry) => entry.id === segmentId);
  if (!segment) throw new Error(`missing_segment:${segmentId}`);
  const at = segment.start + (segment.end - segment.start) * progress;
  return htmlAt(current, at);
}

function htmlInsidePauseAfter(
  current: ReturnType<typeof plan>,
  segmentId: string,
) {
  const index = current.speakerTimeline.findIndex((entry) => entry.id === segmentId);
  const segment = current.speakerTimeline[index];
  const next = current.speakerTimeline[index + 1];
  if (!segment || !next) throw new Error(`missing_pause_after:${segmentId}`);
  const at = segment.end + (next.start - segment.end) / 2;
  return htmlAt(current, at);
}

describe("VOXY homepage V3.3 — broadcast discipline", () => {
  it("01 holds the previous scene through narration pauses instead of flashing the final CTA", () => {
    const edebatte = plan("edebatte", "election_window");
    const vog = plan("voiceopengov", "evergreen");

    const edPause = htmlInsidePauseAfter(edebatte, "edebatte-source-questions");
    const vogPause = htmlInsidePauseAfter(vog, "vog-after-election");

    expect(edPause).toContain('data-homepage-segment-id="edebatte-source-questions"');
    expect(edPause).not.toContain('data-homepage-segment-id="edebatte-cta"');
    expect(vogPause).toContain('data-homepage-segment-id="vog-after-election"');
    expect(vogPause).not.toContain('data-homepage-segment-id="vog-cta"');
    expect(edPause).toContain('data-pause-hold="previous-segment"');
  });

  it("02 declares a two-second minimum readable-state policy and keeps blinking disabled", () => {
    for (const current of [
      plan("edebatte", "election_window"),
      plan("voiceopengov", "evergreen"),
    ]) {
      const html = htmlAtSegment(current, current.speakerTimeline[0]!.id);
      expect(html).toContain('data-broadcast-discipline="v3-3"');
      expect(html).toContain('data-min-readable-state-seconds="2"');
      expect(current.lowerThirdTimeline.every((entry) => !entry.blinking && !entry.wordByWordAnimation)).toBe(true);
    }
  });

  it("03 moves VOG process graphics and participation balance into the right safe lane", () => {
    const current = plan("voiceopengov", "evergreen");
    const opening = htmlAtSegment(current, "vog-greeting");
    const path = htmlAtSegment(current, "vog-after-election");
    const balance = htmlAtSegment(current, "vog-participation-balance");

    expect(opening).toContain('[data-broadcast-discipline="v3-3"] .democratic-loop{left:690px;top:78px;transform:scale(.48)');
    expect(path).toContain('[data-broadcast-discipline="v3-3"] .living-mandate-path{inset:auto;left:650px;top:70px;width:310px;height:410px}');
    expect(balance).toContain('[data-broadcast-discipline="v3-3"] .participation-balance-scene{inset:auto;left:650px;top:65px;width:310px;height:390px}');
    expect(balance).toContain('[data-broadcast-discipline="v3-3"] .balance-axis{display:none}');
  });

  it("04 gives the VOG bridge enough normalized dwell to be read instead of flashing", () => {
    const current = plan("voiceopengov", "evergreen");
    const segment = current.speakerTimeline.find((entry) => entry.id === "vog-current-offer");
    if (!segment) throw new Error("missing_segment:vog-current-offer");

    const bridgeEarly = htmlAtSegment(current, "vog-current-offer", 0.4);
    const bridgeLate = htmlAtSegment(current, "vog-current-offer", 0.66);
    const future = htmlAtSegment(current, "vog-current-offer", 0.75);

    expect(bridgeEarly).toContain("offer-phase-bridge");
    expect(bridgeLate).toContain("offer-phase-bridge");
    expect(future).toContain("offer-phase-future");
    expect((segment.end - segment.start) * 0.34).toBeGreaterThanOrEqual(2.4);
  });

  it("05 reduces eDebatte synthesis to one supporting orbit at a time", () => {
    const current = plan("edebatte", "election_window");
    const source = htmlAtSegment(current, "edebatte-synthesis-questions", 0.2);
    const context = htmlAtSegment(current, "edebatte-synthesis-questions", 0.5);
    const counter = htmlAtSegment(current, "edebatte-synthesis-questions", 0.85);

    expect(source).toContain('data-synthesis-phase="source"');
    expect(context).toContain('data-synthesis-phase="context"');
    expect(counter).toContain('data-synthesis-phase="counter"');
    expect(source).toContain('[data-broadcast-discipline="v3-3"] .case-synthesis-scene .synthesis-orbit{display:none}');
    expect(source).toContain('[data-broadcast-discipline="v3-3"] .case-synthesis-scene svg{display:none!important}');
  });

  it("06 drops the lower third during dense full-screen explanation and closing states", () => {
    const vog = htmlAtSegment(plan("voiceopengov", "evergreen"), "vog-synthesis");
    const edebatte = htmlAtSegment(plan("edebatte", "election_window"), "edebatte-synthesis-questions");

    expect(vog).toContain('[data-broadcast-discipline="v3-3"][data-homepage-segment-id="vog-synthesis"] .broadcast-lower-third');
    expect(vog).toContain('[data-broadcast-discipline="v3-3"][data-homepage-segment-id="vog-cta"] .broadcast-lower-third');
    expect(edebatte).toContain('[data-broadcast-discipline="v3-3"][data-homepage-segment-id="edebatte-synthesis-questions"] .broadcast-lower-third');
    expect(vog).toContain("opacity:0!important;pointer-events:none!important");
  });

  it("07 keeps all human and release gates closed until the fresh render is reviewed", () => {
    for (const current of [
      plan("edebatte", "election_window"),
      plan("voiceopengov", "evergreen"),
    ]) {
      expect(current).toMatchObject({
        humanHomepageFilmAcceptance: "pending",
        humanNews5VisualAcceptance: "pending",
        productionEligible: false,
        autoPublish: false,
        homepageIntegrationIncluded: false,
      });
    }
  });
});
