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

describe("VOXY homepage reference V3.1 — surgical human-review corrections", () => {
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

  it("04 makes the face-safe corridor a hard render policy and routes synthesis outside it", () => {
    const current = plan("edebatte", "election_window");
    const source = htmlAtSegment(current, "edebatte-source-questions");
    const synthesis = htmlAtSegment(current, "edebatte-synthesis-questions");

    expect(source).toContain('data-host-face-safe-zone="x610-900:y150-520"');
    expect(source).toContain('data-host-face-safe-policy="hard-no-lines-or-large-objects"');
    expect(source).toContain(".information-stage{left:1030px!important;top:165px!important;width:340px!important;height:92px!important");
    expect(synthesis).toContain('data-face-safe-route="outside-host-corridor"');
    expect(synthesis).toContain('data-face-safe-routes="left-and-right-only"');
    expect(synthesis).toContain('M120 135 C165 140 195 158 225 185');
    expect(synthesis).not.toContain('M150 160 C300 70 580 70 745 155');
  });

  it("05 fixes the duplicate-class selector bug and actually quiets FOCUS and EXPLAIN lower thirds", () => {
    const current = plan("edebatte", "election_window");
    const html = htmlAtSegment(current, "edebatte-media-forensics");

    expect(html).toContain('data-pilot-version="homepage-reference-v3-1-surgical"');
    expect(html).not.toContain('class="homepage-reference-v3"');
    expect(html).toContain('[data-pilot-version="homepage-reference-v3-1-surgical"][data-homepage-visual-state="FOCUS"] .lower-copy p');
    expect(html).toContain('[data-pilot-version="homepage-reference-v3-1-surgical"][data-homepage-visual-state="EXPLAIN"] .lower-meta');
    expect(html).toContain('min-height:86px!important');
  });

  it("06 keeps the evergreen VOG HTML free of election-calendar artifacts", () => {
    const current = plan("voiceopengov", "evergreen");
    const html = htmlAtSegment(current, "vog-after-election");

    expect(html).toContain("ZWISCHEN DEN WAHLEN");
    expect(html).toContain("Stimme → Folge → Wirkung");
    expect(html).not.toContain("WAHLTERMINE 2026");
    expect(html).not.toContain("Vier Termine im September");
    expect(html).not.toContain("Bundeswahlleiterin");
  });

  it("07 makes the private renderer fail closed on context isolation", () => {
    const renderer = readFileSync(
      new URL("../scripts/render-voxy-homepage-reference-films.ts", import.meta.url),
      "utf8",
    );

    expect(renderer).toContain("contextualizeVoxyHomepageReferenceFilmPlan(rawPlan)");
    expect(renderer).toContain("validateVoxyHomepageContextIsolation(plan)");
    expect(renderer).toContain("contextIsolationGate: \"passed\"");
  });

  it("08 preserves the release gates pending a fresh human review", () => {
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
