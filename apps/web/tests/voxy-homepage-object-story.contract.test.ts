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
        () => filmId === "edebatte" ? 6_600 : 7_200,
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

describe("VOXY homepage object-story reference grammar — V3.4", () => {
  it("01 makes eDebatte the primary brand inside its own homepage film", () => {
    const current = plan("edebatte", "election_window");
    const html = htmlAtSegment(current, "edebatte-greeting");

    expect(html).toContain("homepage-brand-hierarchy edebatte-brand-primary");
    expect(html).toContain("<strong>eDebatte</strong>");
    expect(html).toContain("VoiceOpenGov · demokratischer Kontext");
    expect(html).toContain(".brand-lockup{display:none!important}");
  });

  it("02 turns eDebatte research into readable sequential scene objects", () => {
    const current = plan("edebatte", "election_window");
    const opening = htmlAtSegment(current, "edebatte-greeting", 0.2);
    const freeze = htmlAtSegment(current, "edebatte-election-noise", 0.8);
    const claim = htmlAtSegment(current, "edebatte-source-questions", 0.15);
    const link = htmlAtSegment(current, "edebatte-source-questions", 0.5);
    const primary = htmlAtSegment(current, "edebatte-source-questions", 0.85);
    const number = htmlAtSegment(current, "edebatte-media-forensics", 0.15);
    const quote = htmlAtSegment(current, "edebatte-media-forensics", 0.5);
    const study = htmlAtSegment(current, "edebatte-media-forensics", 0.85);

    expect(opening).toContain("headline-swarm");
    expect(opening).toContain('data-readable-state-id="ed-opening-headline"');
    expect(freeze).toContain("headline-freeze-scene");
    expect(freeze).toContain("STOPP.");
    expect(freeze).toContain('data-readable-state-id="ed-opening-freeze"');

    expect(claim).toContain("source-phase-claim");
    expect(link).toContain("source-phase-link");
    expect(primary).toContain("source-phase-primary");
    expect(primary).toContain("ILLUSTRATIVER QUELLENCHECK");

    expect(number).toContain('<small>ZAHL</small>');
    expect(number).toContain('data-readable-state-id="ed-forensics-number"');
    expect(quote).toContain('<small>ZITAT</small>');
    expect(quote).toContain('data-readable-state-id="ed-forensics-quote"');
    expect(study).toContain("forensic-study-label");
    expect(study).toContain("<small>STUDIE</small>");
    expect(study).toContain("INTERPRETATION");
    expect(study).toContain('data-readable-state-id="ed-forensics-study-source"');
    expect(opening).not.toContain("media-wall");
    expect(link).not.toContain("source-lab");
  });

  it("03 keeps eDebatte trace and synthesis out of the presenter corridor", () => {
    const current = plan("edebatte", "election_window");
    const trace = htmlAtSegment(current, "edebatte-product-model");
    const synthesis = htmlAtSegment(current, "edebatte-synthesis-questions");

    expect(trace).toContain('.case-trace-scene{position:absolute;left:690px;top:125px;width:300px;height:390px}');
    expect(trace).toContain('grid-template-columns:1fr');
    expect(trace).not.toContain('<span></span>');
    expect(synthesis).toContain("case-synthesis-scene");
    expect(synthesis).toContain('data-face-safe-route="outside-host-corridor"');
    expect(synthesis).not.toContain("<svg viewBox=\"0 0 900 470\"");
  });

  it("04 makes VoiceOpenGov a living process and sequences programme, gap and decision", () => {
    const current = plan("voiceopengov", "evergreen");
    const opening = htmlAtSegment(current, "vog-greeting");
    const path = htmlAtSegment(current, "vog-after-election");
    const promise = htmlAtSegment(current, "vog-program-not-contract", 0.15);
    const gap = htmlAtSegment(current, "vog-program-not-contract", 0.5);
    const decision = htmlAtSegment(current, "vog-program-not-contract", 0.85);

    expect(opening).toContain("vog-journey object-led-scene");
    expect(opening).toContain("democratic-loop");
    expect(opening).toContain("RÜCKKOPPLUNG");
    expect(path).toContain("living-mandate-path");
    expect(path).toContain("DER WEG GEHT WEITER");
    expect(promise).toContain("programme-phase-promise");
    expect(promise).toContain("<strong>PROGRAMM</strong>");
    expect(gap).toContain("programme-phase-gap");
    expect(gap).toContain("VERBINDLICHKEIT?");
    expect(decision).toContain("programme-phase-decision");
    expect(decision).toContain("<strong>BESCHLUSS</strong>");
    expect(decision).toContain("AUSSAGE");
    expect(decision).toContain("WIRKUNG");
    expect(opening).not.toContain("ballot-paper");
  });

  it("05 reveals Demophobie source, design question and guardrails sequentially", () => {
    const current = plan("voiceopengov", "evergreen");
    const source = htmlAtSegment(current, "vog-demophobie", 0.15);
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

  it("06 separates current VoiceOpenGov capability from the future target with a readable bridge", () => {
    const current = plan("voiceopengov", "evergreen");
    const now = htmlAtSegment(current, "vog-current-offer", 0.15);
    const bridge = htmlAtSegment(current, "vog-current-offer", 0.5);
    const future = htmlAtSegment(current, "vog-current-offer", 0.85);

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
