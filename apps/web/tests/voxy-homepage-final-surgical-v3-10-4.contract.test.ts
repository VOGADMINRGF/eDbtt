import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildVoxyHomepageReferenceFilmPlan,
  filmSegments,
  type VoxyHomepageFilmId,
} from "../src/features/voxyVideo/homepageReferenceFilms";
import { contextualizeVoxyHomepageReferenceFilmPlan } from "../src/features/voxyVideo/homepageReferenceFilmsContext";
import type { HomepageFilmLayoutProfile } from "../src/features/voxyVideo/homepageReferenceFilmLayouts";
import { renderVoxyHomepageReferenceFilmFrameHtml } from "../src/features/voxyVideo/homepageReferenceFilmsHtml";

const exactHead = "4".repeat(40);
const assets = {
  canonStageDataUrl: "data:image/png;base64,AA==",
  studioLockupDataUrl: "data:image/svg+xml;base64,AA==",
  lapelPinDataUrl: "data:image/svg+xml;base64,AA==",
  edebattePocketMarkDataUrl: "data:image/svg+xml;base64,AA==",
};

function plan(filmId: VoxyHomepageFilmId, layoutProfile: HomepageFilmLayoutProfile) {
  const contextMode = filmId === "voiceopengov" ? "evergreen" : "election_window";
  return contextualizeVoxyHomepageReferenceFilmPlan(
    buildVoxyHomepageReferenceFilmPlan({
      filmId,
      contextMode,
      layoutProfile,
      exactHeadSha: exactHead,
      speechDurationsMs: Array.from(
        { length: filmSegments(filmId, contextMode).length },
        () => filmId === "edebatte" ? 6_600 : 7_500,
      ),
    }),
  );
}

function htmlAtSegment(
  filmId: VoxyHomepageFilmId,
  layoutProfile: HomepageFilmLayoutProfile,
  segmentId: string,
): string {
  const current = plan(filmId, layoutProfile);
  const segment = current.speakerTimeline.find((entry) => entry.id === segmentId);
  if (!segment) throw new Error(`missing_segment:${segmentId}`);
  const at = segment.start + (segment.end - segment.start) * 0.55;
  return renderVoxyHomepageReferenceFilmFrameHtml({
    plan: current,
    assets,
    frameIndex: Math.floor(at * current.output.fps),
    amplitude: 0.35,
  });
}

describe("VOXY homepage V3.10.4 — final surgical human correction", () => {
  it("01 repairs only the eDebatte 9:16 shoulder from the canonical frozen layer", () => {
    const vertical = htmlAtSegment("edebatte", "vertical_9_16", "edebatte-greeting");
    const vogVertical = htmlAtSegment(
      "voiceopengov",
      "vertical_9_16",
      "vog-greeting",
    );

    expect(vertical).toContain('data-final-surgical-human-correction="v3-10-4"');
    expect(vertical).toContain('data-repair-source="canonical-left-upper-arm-layer"');
    expect(vertical).toContain(
      "clip-path:polygon(480px 450px,640px 392px,640px 500px,480px 500px)",
    );
    expect(vertical).toContain(
      "mask-image:linear-gradient(90deg,#000 0,#000 610px,transparent 640px)",
    );
    expect(vertical).toContain(
      "background:radial-gradient(circle at 47% 38%,rgba(32,102,255,.05),transparent 29%),linear-gradient(90deg,rgba(1,5,17,.88) 0%,rgba(1,5,17,.38) 29%,transparent 54%,rgba(1,5,17,.76) 88%,#010511 100%)",
    );
    expect(vogVertical).not.toContain('data-repair-source="canonical-left-upper-arm-layer"');

    for (const layoutProfile of [
      "landscape_16_9",
      "square_1_1",
      "feed_4_5",
    ] as const) {
      expect(
        htmlAtSegment("edebatte", layoutProfile, "edebatte-greeting"),
      ).not.toContain('data-repair-source="canonical-left-upper-arm-layer"');
    }
  });

  it("02 gives the vertical VOG process groups more air without changing copy", () => {
    const html = htmlAtSegment(
      "voiceopengov",
      "vertical_9_16",
      "vog-after-election",
    );

    expect(html).toContain(
      '[data-segment-id="vog-after-election"] .living-mandate-path{height:208px!important;gap:16px!important}',
    );
    expect(html).toContain(
      '[data-segment-id="vog-after-election"] .mandate-step{height:208px!important;padding:16px!important;row-gap:10px!important}',
    );
    expect(html).toContain("font-size:34px!important;line-height:1.08!important");
    expect(html).toContain("font-size:20px!important;line-height:1.1!important");
    expect(html).toContain("VERHANDLUNG");
    expect(html).toContain("BESCHLUSS");
    expect(html).toContain("UMSETZUNG");
    expect(html).toContain("DER WEG GEHT WEITER");
  });

  it("03 keeps WIRKSAME MITBESTIMMUNG quiet inside the accepted 220 × 168 core", () => {
    const html = htmlAtSegment(
      "voiceopengov",
      "vertical_9_16",
      "vog-participation-balance",
    );

    expect(html).toContain("width:220px!important;height:168px!important");
    expect(html).toContain(
      ".participation-balance-scene .balance-core strong{font-size:22px!important;line-height:1.08!important;padding:0 18px!important}",
    );
    expect(html).toContain(
      ".participation-balance-scene .balance-core span{max-width:174px!important;margin-top:9px!important;font-size:13px!important;line-height:1.3!important}",
    );
    expect(html).toContain("WIRKSAME MITBESTIMMUNG");
    expect(html).toContain("opacity:.28!important");
    expect(html).toContain('data-min-readable-state-seconds="2"');
    expect(html).toContain('data-state-settle-seconds="0.25"');
  });

  it("04 leaves the accepted Weg spoken alias and all release gates unchanged", () => {
    const segment = filmSegments("edebatte", "evergreen").find(
      (entry) => entry.id === "edebatte-product-model",
    );
    expect(segment?.text).toContain("den Weg zurück zum Beleg");
    expect(segment?.spokenText).toContain("den Weeg zurück zum Beleg");

    for (const filmId of ["edebatte", "voiceopengov"] as const) {
      expect(plan(filmId, "vertical_9_16")).toMatchObject({
        humanHomepageFilmAcceptance: "pending",
        humanNews5VisualAcceptance: "pending",
        productionEligible: false,
        autoPublish: false,
        homepageIntegrationIncluded: false,
      });
    }
  });

  it("05 exposes a fail-closed byte-identical audio reuse path for the visual-only render", () => {
    const renderer = readFileSync(
      path.resolve(import.meta.dirname, "../scripts/render-voxy-homepage-reference-films.ts"),
      "utf8",
    );

    expect(renderer).toContain('mode: "byte_identical_accepted_master"');
    expect(renderer).toContain("synthesisInvoked: false");
    expect(renderer).toContain("processingInvoked: false");
    expect(renderer).toContain("accepted_master_audio_copy_not_byte_identical");
    expect(renderer).toContain("accepted_audio_reuse_output_must_not_overlap_source");
  });
});
