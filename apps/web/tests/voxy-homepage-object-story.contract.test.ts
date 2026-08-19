import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  buildVoxyHomepageReferenceFilmPlan,
  filmSegments,
  type VoxyHomepageContextMode,
  type VoxyHomepageFilmId,
} from "../src/features/voxyVideo/homepageReferenceFilms";
import { renderVoxyHomepageReferenceFilmFrameHtml } from "../src/features/voxyVideo/homepageReferenceFilmsHtml";

const exactHead = "c".repeat(40);
const assets = {
  canonStageDataUrl: "data:image/png;base64,AA==",
  studioLockupDataUrl: "data:image/svg+xml;base64,AA==",
  lapelPinDataUrl: "data:image/svg+xml;base64,AA==",
  edebattePocketMarkDataUrl: "data:image/svg+xml;base64,AA==",
};

function plan(filmId: VoxyHomepageFilmId, contextMode: VoxyHomepageContextMode) {
  const segments = filmSegments(filmId, contextMode);
  return buildVoxyHomepageReferenceFilmPlan({
    filmId,
    contextMode,
    exactHeadSha: exactHead,
    speechDurationsMs: Array.from(
      { length: segments.length },
      () => filmId === "edebatte" ? 6_000 : 7_300,
    ),
  });
}

function frameInsideSegment(
  current: ReturnType<typeof plan>,
  segmentId: string,
  progress = 0.5,
): number {
  const segment = current.speakerTimeline.find((entry) => entry.id === segmentId);
  if (!segment) throw new Error(`missing_segment:${segmentId}`);
  const at = segment.start + (segment.end - segment.start) * progress;
  return Math.floor(at * current.output.fps);
}

function htmlAtSegment(
  current: ReturnType<typeof plan>,
  segmentId: string,
  progress = 0.5,
) {
  return renderVoxyHomepageReferenceFilmFrameHtml({
    plan: current,
    assets,
    frameIndex: frameInsideSegment(current, segmentId, progress),
    amplitude: 0.35,
  });
}

describe("VOXY homepage object-story reference grammar", () => {
  it("01 makes eDebatte the primary brand inside its own homepage film", () => {
    const current = plan("edebatte", "election_window");
    const html = htmlAtSegment(current, "edebatte-greeting");

    expect(html).toContain("homepage-brand-hierarchy edebatte-brand-primary");
    expect(html).toContain("<strong>eDebatte</strong>");
    expect(html).toContain("VoiceOpenGov · demokratischer Kontext");
    expect(html).toContain(".brand-lockup{display:none!important}");
  });

  it("02 turns eDebatte research into moving objects instead of one persistent dashboard", () => {
    const current = plan("edebatte", "election_window");
    const opening = htmlAtSegment(current, "edebatte-greeting");
    const sourcePull = htmlAtSegment(current, "edebatte-source-questions");
    const split = htmlAtSegment(current, "edebatte-media-forensics");
    const synthesis = htmlAtSegment(current, "edebatte-synthesis-questions");

    expect(opening).toContain("headline-swarm");
    expect(opening).toContain("case-headline-object");
    expect(sourcePull).toContain("source-pull-scene");
    expect(sourcePull).toContain("ILLUSTRATIVER QUELLENCHECK");
    expect(split).toContain("forensic-split-scene");
    expect(split).toContain("QUELLE");
    expect(split).toContain("INTERPRETATION");
    expect(synthesis).toContain("case-synthesis-scene");
    expect(opening).not.toContain("media-wall");
    expect(sourcePull).not.toContain("source-lab");
  });

  it("03 keeps Voxy visible by shrinking evidence into objects rather than covering the studio", () => {
    const current = plan("edebatte", "election_window");
    const html = htmlAtSegment(current, "edebatte-source-questions");

    expect(html).toContain(".homepage-distinctive-stage{position:absolute;z-index:22");
    expect(html).toContain(".information-stage{left:720px!important;top:210px!important;width:560px!important;height:300px!important");
    expect(html).toContain(".studio-stage{filter:saturate(1.08) contrast(1.055) brightness(1.02)!important}");
  });

  it("04 makes VoiceOpenGov a living democratic feedback loop, not the eDebatte scene in another color", () => {
    const current = plan("voiceopengov", "evergreen");
    const opening = htmlAtSegment(current, "vog-greeting");
    const path = htmlAtSegment(current, "vog-after-election");
    const programme = htmlAtSegment(current, "vog-program-not-contract");

    expect(opening).toContain("vog-journey object-led-scene");
    expect(opening).toContain("democratic-loop");
    expect(opening).toContain("RÜCKKOPPLUNG");
    expect(path).toContain("living-mandate-path");
    expect(path).toContain("DER WEG GEHT WEITER");
    expect(programme).toContain("programme-gap-scene");
    expect(programme).toContain("VERBINDLICHKEIT?");
    expect(opening).not.toContain("case-headline-object");
    expect(opening).not.toContain("ballot-paper");
  });

  it("05 frames Demophobie as a design question with democratic guardrails", () => {
    const current = plan("voiceopengov", "evergreen");
    const html = htmlAtSegment(current, "vog-demophobie");

    expect(html).toContain("demophobie-space");
    expect(html).toContain("GESTALTUNGSFRAGE");
    expect(html).toContain("GRUNDRECHTE");
    expect(html).toContain("MINDERHEITENSCHUTZ");
    expect(html).toContain("RECHENSCHAFT");
    expect(html).toContain("REVISION");
  });

  it("06 separates current VoiceOpenGov capability from the future democratic target model", () => {
    const current = plan("voiceopengov", "evergreen");
    const html = htmlAtSegment(current, "vog-current-offer");

    expect(html).toContain("HEUTE · CURRENT CAPABILITY");
    expect(html).toContain("MITMACHEN · INFORMIERT BLEIBEN");
    expect(html).toContain("ZIELBILD · NICHT ALS PRODUKTFUNKTION BEHAUPTET");
    expect(html).toContain("STIMME → FOLGE → RECHENSCHAFT → WIRKUNG");
  });

  it("07 renders the VoiceOpenGov homepage reference from the evergreen core", () => {
    const renderer = readFileSync(
      new URL("../scripts/render-voxy-homepage-reference-films.ts", import.meta.url),
      "utf8",
    );

    expect(renderer).toContain(
      'const contextMode = filmId === "voiceopengov" ? "evergreen" : "election_window";',
    );

    const current = plan("voiceopengov", "evergreen");
    const html = htmlAtSegment(current, "vog-greeting");
    expect(html).toContain("ZWISCHEN DEN WAHLEN");
    expect(html).not.toContain("SEPTEMBER 2026");
  });

  it("08 preserves the human and release gates while the new reference is reviewed", () => {
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
