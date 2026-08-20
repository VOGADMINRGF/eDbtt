import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  buildVoxyHomepageReferenceFilmPlan,
  filmSegments,
  type VoxyHomepageContextMode,
  type VoxyHomepageFilmId,
} from "../src/features/voxyVideo/homepageReferenceFilms";
import { contextualizeVoxyHomepageReferenceFilmPlan } from "../src/features/voxyVideo/homepageReferenceFilmsContext";
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

  it("02 turns eDebatte research into sequential scene objects instead of a persistent dashboard", () => {
    const current = plan("edebatte", "election_window");
    const opening = htmlAtSegment(current, "edebatte-greeting", 0.3);
    const freeze = htmlAtSegment(current, "edebatte-greeting", 0.8);
    const sourcePull = htmlAtSegment(current, "edebatte-source-questions", 0.5);
    const number = htmlAtSegment(current, "edebatte-media-forensics", 0.15);
    const quote = htmlAtSegment(current, "edebatte-media-forensics", 0.4);
    const study = htmlAtSegment(current, "edebatte-media-forensics", 0.64);
    const splitResolution = htmlAtSegment(current, "edebatte-media-forensics", 0.9);
    const synthesis = htmlAtSegment(current, "edebatte-synthesis-questions");

    expect(opening).toContain("headline-swarm");
    expect(opening).toContain("case-headline-object");
    expect(opening).not.toContain("freeze-ring");
    expect(freeze).toContain("headline-freeze-scene");
    expect(freeze).toContain("STOPP.");
    expect(sourcePull).toContain("source-pull-scene source-phase-link");
    expect(sourcePull).toContain("ILLUSTRATIVER QUELLENCHECK");
    expect(number).toContain("<small>ZAHL</small>");
    expect(number).not.toContain("<small>ZITAT</small>");
    expect(quote).toContain("<small>ZITAT</small>");
    expect(quote).not.toContain("<small>STUDIE</small>");
    expect(study).toContain("<small>STUDIE</small>");
    expect(splitResolution).toContain("forensic-source-resolution");
    expect(splitResolution).toContain("QUELLE");
    expect(splitResolution).toContain("INTERPRETATION");
    expect(synthesis).toContain("case-synthesis-scene");
    expect(opening).not.toContain("media-wall");
    expect(sourcePull).not.toContain("source-lab");
  });

  it("03 keeps Voxy visible with a compact evidence tag and silhouette-safe routing", () => {
    const current = plan("edebatte", "election_window");
    const source = htmlAtSegment(current, "edebatte-source-questions");
    const synthesis = htmlAtSegment(current, "edebatte-synthesis-questions");

    expect(source).toContain(".homepage-distinctive-stage{position:absolute;z-index:22");
    expect(source).toContain(".information-stage{left:1060px!important;top:165px!important;width:320px!important;height:92px!important");
    expect(source).toContain("data-host-face-safe-zone=\"x560-1030:y135-535\"");
    expect(source).toContain("data-host-face-safe-policy=\"hard-no-lines-or-large-objects\"");
    expect(source).toContain(".studio-stage{filter:saturate(1.08) contrast(1.055) brightness(1.035)!important}");
    expect(synthesis).toContain("data-face-safe-route=\"outside-host-corridor\"");
    expect(synthesis).toContain("data-face-safe-routes=\"left-and-right-only\"");
  });

  it("04 makes VoiceOpenGov a living process and sequences programme, gap and decision", () => {
    const current = plan("voiceopengov", "evergreen");
    const opening = htmlAtSegment(current, "vog-greeting");
    const path = htmlAtSegment(current, "vog-after-election");
    const promise = htmlAtSegment(current, "vog-program-not-contract", 0.18);
    const gap = htmlAtSegment(current, "vog-program-not-contract", 0.5);
    const decision = htmlAtSegment(current, "vog-program-not-contract", 0.84);

    expect(opening).toContain("vog-journey object-led-scene");
    expect(opening).toContain("democratic-loop");
    expect(opening).toContain("RÜCKKOPPLUNG");
    expect(path).toContain("living-mandate-path");
    expect(path).toContain("DER WEG GEHT WEITER");
    expect(promise).toContain("programme-phase-promise");
    expect(promise).toContain("<strong>PROGRAMM</strong>");
    expect(promise).not.toContain("<strong>BESCHLUSS</strong>");
    expect(gap).toContain("programme-phase-gap");
    expect(gap).toContain("VERBINDLICHKEIT?");
    expect(decision).toContain("programme-phase-decision");
    expect(decision).toContain("<strong>BESCHLUSS</strong>");
    expect(opening).not.toContain("case-headline-object");
    expect(opening).not.toContain("ballot-paper");
  });

  it("05 reveals Demophobie source, design question and guardrails sequentially", () => {
    const current = plan("voiceopengov", "evergreen");
    const source = htmlAtSegment(current, "vog-demophobie", 0.2);
    const question = htmlAtSegment(current, "vog-demophobie", 0.5);
    const guardrails = htmlAtSegment(current, "vog-demophobie", 0.85);

    expect(source).toContain("demophobie-phase-source");
    expect(source).toContain("DEMOPHOBIE?");
    expect(question).toContain("demophobie-phase-question");
    expect(question).toContain("GESTALTUNGSFRAGE");
    expect(question).not.toContain('<div class="guardrail">');
    expect(guardrails).toContain("demophobie-phase-guardrails");
    expect(guardrails).toContain("GRUNDRECHTE");
    expect(guardrails).toContain("MINDERHEITENSCHUTZ");
    expect(guardrails).toContain("RECHENSCHAFT");
    expect(guardrails).toContain("REVISION");
  });

  it("06 separates current VoiceOpenGov capability from the future target in time as well as semantics", () => {
    const current = plan("voiceopengov", "evergreen");
    const now = htmlAtSegment(current, "vog-current-offer", 0.2);
    const bridge = htmlAtSegment(current, "vog-current-offer", 0.5);
    const future = htmlAtSegment(current, "vog-current-offer", 0.8);

    expect(now).toContain("offer-phase-current");
    expect(now).toContain("HEUTE · CURRENT CAPABILITY");
    expect(now).not.toContain("ZIELBILD · NICHT ALS PRODUKTFUNKTION BEHAUPTET");
    expect(bridge).toContain("offer-phase-bridge");
    expect(bridge).toContain("VON BETEILIGUNG ZU SUBSTANZ");
    expect(future).toContain("offer-phase-future");
    expect(future).toContain("ZIELBILD · NICHT ALS PRODUKTFUNKTION BEHAUPTET");
    expect(future).not.toContain("HEUTE · CURRENT CAPABILITY");
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
    expect(html).toContain("Stimme → Folge → Wirkung");
    expect(html).not.toContain("WAHLTERMINE 2026");
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
