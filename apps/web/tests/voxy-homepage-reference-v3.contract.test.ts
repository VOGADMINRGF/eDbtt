import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  buildVoxyHomepageReferenceFilmPlan,
  filmSegments,
  type VoxyHomepageContextMode,
  type VoxyHomepageFilmId,
} from "../src/features/voxyVideo/homepageReferenceFilms";
import {
  contextualizeVoxyHomepageReferenceFilmPlan,
  validateVoxyHomepageContextIsolation,
} from "../src/features/voxyVideo/homepageReferenceFilmsContext";
import { renderVoxyHomepageReferenceFilmFrameHtml } from "../src/features/voxyVideo/homepageReferenceFilmsHtml";

const exactHead = "d".repeat(40);
const assets = {
  canonStageDataUrl: "data:image/png;base64,AA==",
  studioLockupDataUrl: "data:image/svg+xml;base64,AA==",
  lapelPinDataUrl: "data:image/svg+xml;base64,VOXY_LEGACY_PIN",
  edebattePocketMarkDataUrl: "data:image/svg+xml;base64,AA==",
};

function plan(filmId: VoxyHomepageFilmId, contextMode: VoxyHomepageContextMode) {
  const segments = filmSegments(filmId, contextMode);
  const raw = buildVoxyHomepageReferenceFilmPlan({
    filmId,
    contextMode,
    exactHeadSha: exactHead,
    speechDurationsMs: Array.from(
      { length: segments.length },
      () => filmId === "edebatte" ? 6_000 : 7_300,
    ),
  });
  return contextualizeVoxyHomepageReferenceFilmPlan(raw);
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

describe("VOXY homepage reference V3.2 — geometry and editorial sync", () => {
  it("01 strips election-only evidence and sources from the evergreen VOG render plan", () => {
    const current = plan("voiceopengov", "evergreen");
    const serialized = JSON.stringify(current);

    expect(validateVoxyHomepageContextIsolation(current)).toEqual([]);
    expect(serialized).toContain("vog-evergreen-impact-loop");
    expect(serialized).toContain("Stimme → Folge → Wirkung");
    expect(serialized).not.toContain("vog-election-calendar");
    expect(serialized).not.toContain("WAHLTERMINE 2026");
    expect(serialized).not.toContain("Vier Termine im September");
    expect(serialized).not.toContain("Bundeswahlleiterin");
    expect(serialized).not.toContain("Landeswahlleiterin");
    expect(current.broadcastMeta.displayDate).toBe("ZWISCHEN DEN WAHLEN");
  });

  it("02 keeps election evidence available in the separate election-window plan", () => {
    const election = contextualizeVoxyHomepageReferenceFilmPlan(
      buildVoxyHomepageReferenceFilmPlan({
        filmId: "voiceopengov",
        contextMode: "election_window",
        exactHeadSha: exactHead,
        speechDurationsMs: Array.from(
          { length: filmSegments("voiceopengov", "election_window").length },
          () => 6_500,
        ),
      }),
    );

    expect(election.evidence.some((entry) => entry.id === "vog-election-calendar")).toBe(true);
    expect(election.sources.some((source) => source.id === "federal-election-calendar-2026")).toBe(true);
  });

  it("03 renders the visible lapel pin as VOG instead of the legacy VOXY artwork", () => {
    const current = plan("edebatte", "election_window");
    const html = htmlAtSegment(current, "edebatte-greeting");

    expect(html).toContain("homepage-vog-lapel-pin");
    expect(html).toContain(">VOG</text>");
    expect(html).not.toContain('alt="VOXY"');
    expect(html).not.toContain("VOXY_LEGACY_PIN");
  });

  it("04 expands the host silhouette safe zone and moves large right-side objects beyond it", () => {
    const current = plan("edebatte", "election_window");
    const source = htmlAtSegment(current, "edebatte-source-questions");
    const trace = htmlAtSegment(current, "edebatte-product-model");
    const synthesis = htmlAtSegment(current, "edebatte-synthesis-questions");

    expect(source).toContain('data-host-face-safe-zone="x560-1030:y135-535"');
    expect(source).toContain('data-host-face-safe-policy="hard-no-lines-or-large-objects"');
    expect(source).toContain('data-homepage-segment-id="edebatte-source-questions"');
    expect(source).toContain(".information-stage{left:1060px!important;top:165px!important;width:320px!important;height:92px!important");
    expect(source).toContain(".source-pull-scene .case-source-object{right:-12px;top:76px;transform:translateX(calc((1 - var(--segment-progress))*18px)) scale(.78)");
    expect(source).toContain(".evidence-beam{position:absolute;left:250px;top:395px;width:360px");
    expect(trace).toContain(".trace-axis{position:absolute;left:5px;right:5px;top:385px");
    expect(trace).toContain(".trace-copy{position:absolute;left:680px;top:195px;width:290px");
    expect(synthesis).toContain('data-face-safe-route="outside-host-corridor"');
    expect(synthesis).toContain('data-face-safe-routes="left-and-right-only"');
    expect(synthesis).toContain(".synthesis-core{position:absolute;left:680px;top:150px;width:290px");
  });

  it("05 keeps lower-third chrome stable but suppresses competing editorial headlines in object-dominant segments", () => {
    const current = plan("voiceopengov", "evergreen");
    const programme = htmlAtSegment(current, "vog-program-not-contract");
    const currentOffer = htmlAtSegment(current, "vog-current-offer");

    expect(programme).toContain('data-pilot-version="homepage-reference-v3-2-geometry-sync"');
    expect(programme).toContain('[data-homepage-segment-id="vog-program-not-contract"] .lower-copy strong');
    expect(programme).toContain('[data-homepage-segment-id="vog-demophobie"] .lower-copy strong');
    expect(currentOffer).toContain('[data-homepage-segment-id="vog-current-offer"] .lower-copy strong');
    expect(programme).toContain('min-height:86px!important');
  });

  it("06 pushes the VOG design and current-capability objects clear of the host silhouette", () => {
    const current = plan("voiceopengov", "evergreen");
    const demophobie = htmlAtSegment(current, "vog-demophobie", 0.5);
    const offer = htmlAtSegment(current, "vog-current-offer", 0.2);
    const programme = htmlAtSegment(current, "vog-program-not-contract", 0.5);

    expect(demophobie).toContain(".design-question{position:absolute;right:-5px;top:70px;width:300px");
    expect(demophobie).toContain(".guardrail-row{position:absolute;left:650px");
    expect(offer).toContain(".current-layer,.future-layer{position:absolute;left:650px;right:5px");
    expect(offer).toContain(".bridge{position:absolute;left:650px;top:175px;width:250px");
    expect(programme).toContain(".gap-field{position:absolute;right:0;top:115px;width:300px");
    expect(programme).toContain(".status-ruler{position:absolute;left:650px;right:15px");
  });

  it("07 keeps the evergreen VOG HTML free of election-calendar artifacts", () => {
    const current = plan("voiceopengov", "evergreen");
    const html = htmlAtSegment(current, "vog-after-election");

    expect(html).toContain("ZWISCHEN DEN WAHLEN");
    expect(html).toContain("Stimme → Folge → Wirkung");
    expect(html).not.toContain("WAHLTERMINE 2026");
    expect(html).not.toContain("Vier Termine im September");
    expect(html).not.toContain("Bundeswahlleiterin");
  });

  it("08 makes the private renderer fail closed on context isolation", () => {
    const renderer = readFileSync(
      new URL("../scripts/render-voxy-homepage-reference-films.ts", import.meta.url),
      "utf8",
    );

    expect(renderer).toContain("contextualizeVoxyHomepageReferenceFilmPlan(rawPlan)");
    expect(renderer).toContain("validateVoxyHomepageContextIsolation(plan)");
    expect(renderer).toContain("contextIsolationGate: \"passed\"");
  });

  it("09 preserves the release gates pending a fresh human review", () => {
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
