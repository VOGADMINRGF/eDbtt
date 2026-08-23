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
  it("01 clips the moving eDebatte 9:16 head to its silhouette and leaves the canonical body unobscured", () => {
    const vertical = htmlAtSegment("edebatte", "vertical_9_16", "edebatte-greeting");
    const vogVertical = htmlAtSegment(
      "voiceopengov",
      "vertical_9_16",
      "vog-greeting",
    );

    expect(vertical).toContain('data-final-surgical-human-correction="v3-10-4"');
    expect(vertical).toContain(
      'data-head-body-separation="silhouette-clipped-head-over-canonical-body"',
    );
    expect(vertical).toContain(
      "clip-path:polygon(10px 48px,90px 8px,295px 12px,380px 64px,480px 92px,500px 272px,450px 340px,350px 352px,305px 400px,190px 400px,120px 344px,5px 272px)!important",
    );
    expect(vertical).toContain('data-body-source="canonical-body-master"');
    expect(vertical).toContain(
      'clip-path:path("M450 720L500 520C505 480 510 450 520 435C555 420 590 412 625 420L680 455L760 720ZM680 720L680 455L755 445L850 410L880 450L900 720ZM850 410C890 415 920 425 940 435C960 470 990 520 1050 720L850 720Z")',
    );
    expect(vertical).not.toContain("homepage-shoulder-repair");
    expect(vertical).not.toContain("canonical-left-upper-arm-layer");
    expect(vertical).not.toContain("mask-image:");
    expect(vogVertical).toContain('data-head-body-separation="unchanged"');
    expect(vogVertical).not.toContain('data-body-source="canonical-body-master"');
    expect(vogVertical).not.toContain('data-repair-source="canonical-left-upper-arm-layer"');

    for (const layoutProfile of [
      "landscape_16_9",
      "square_1_1",
      "feed_4_5",
    ] as const) {
      expect(
        htmlAtSegment("edebatte", layoutProfile, "edebatte-greeting"),
      ).toContain('data-head-body-separation="unchanged"');
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
