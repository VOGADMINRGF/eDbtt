import { describe, expect, it } from "vitest";
import {
  buildVoxyStaticCanonRecoveryPlan,
  validateVoxyStaticCanonRecoveryPlan,
  VOXY_REJECTED_MOTION_HEAD,
  VOXY_STATIC_CANON_BOARDS,
  VOXY_STATIC_CANON_PIXEL_SOURCE,
} from "@/features/voxyVideo/staticCanonRecovery";
import {
  renderVoxyStaticCanonCandidateHtml,
  renderVoxyStaticCanonComparisonHtml,
} from "@/features/voxyVideo/staticCanonRecoveryHtml";

const HEAD = "9cb25e91ae6fe04f7e532e8116cf0f500ee30ddb";
const DATA_URL = "data:image/png;base64,canonical";

describe("Voxy static canon recovery contract", () => {
  it("binds all four human-approved canon boards by exact path and SHA", () => {
    expect(VOXY_STATIC_CANON_BOARDS).toHaveLength(4);
    expect(VOXY_STATIC_CANON_BOARDS.map((board) => board.id)).toEqual([
      "CANON-01",
      "CANON-02",
      "CANON-03",
      "CANON-04",
    ]);
    expect(VOXY_STATIC_CANON_BOARDS.every((board) => board.sha256.length === 64))
      .toBe(true);
    expect(VOXY_STATIC_CANON_PIXEL_SOURCE.id).toBe("CANON-04");
  });

  it("keeps one identical canon character source across A, B and C", () => {
    const plan = buildVoxyStaticCanonRecoveryPlan(HEAD);
    expect(plan.candidates.map((candidate) => candidate.fileName)).toEqual([
      "candidate-a-canon.png",
      "candidate-b-broadcast.png",
      "candidate-c-editorial.png",
    ]);
    expect(new Set(plan.candidates.map((candidate) => candidate.characterPixelSource)))
      .toEqual(new Set([VOXY_STATIC_CANON_PIXEL_SOURCE.repositoryPath]));
    expect(plan.candidates.map((candidate) => candidate.mode)).toEqual([
      "canon_fidelity",
      "broadcast",
      "editorial",
    ]);
  });

  it("records the rejected motion head without using it as a visual source", () => {
    const plan = buildVoxyStaticCanonRecoveryPlan(HEAD);
    expect(plan.previousMotion).toEqual({
      exactHeadSha: VOXY_REJECTED_MOTION_HEAD,
      humanVisualAcceptance: "rejected",
      usedAsVisualSource: false,
    });
  });

  it("keeps animation, production and publishing fail-closed", () => {
    const plan = buildVoxyStaticCanonRecoveryPlan(HEAD);
    expect(plan.externalProviderUsed).toBe(false);
    expect(plan.externalUploadUsed).toBe(false);
    expect(plan.generativeRedrawUsed).toBe(false);
    expect(plan.humanVisualAcceptance).toBe("pending");
    expect(plan.animationEligible).toBe(false);
    expect(plan.productionEligible).toBe(false);
    expect(plan.autoPublish).toBe(false);
    expect(validateVoxyStaticCanonRecoveryPlan(plan)).toEqual([]);
  });

  it("rejects a candidate that swaps the canonical character source", () => {
    const plan = buildVoxyStaticCanonRecoveryPlan(HEAD);
    const invalid = structuredClone(plan);
    invalid.candidates[1].characterPixelSource =
      "apps/web/public/brands/voxy/references/canon/CANON-03-broadcast-layout-teal.png" as typeof invalid.candidates[1]["characterPixelSource"];
    expect(validateVoxyStaticCanonRecoveryPlan(invalid)).toContain(
      "candidate_character_source_must_be_identical",
    );
  });

  it("renders static native review zones over the canon pixels", () => {
    const plan = buildVoxyStaticCanonRecoveryPlan(HEAD);
    for (const candidate of plan.candidates) {
      const html = renderVoxyStaticCanonCandidateHtml({
        plan,
        candidate,
        assets: {
          canonStageDataUrl: DATA_URL,
          wordmarkDataUrl: "data:image/svg+xml;base64,wordmark",
        },
      });
      expect(html).toContain(`data-candidate-id="${candidate.id}"`);
      expect(html).toContain('data-character-source="CANON-04"');
      expect(html).toContain("source-clean-right");
      expect(html).toContain("HUMAN-REVIEW-ZONE");
      expect(html).not.toContain("<video");
      expect(html).not.toContain("<canvas");
      expect(html).not.toMatch(/https?:\/\//);
      expect(html).not.toContain("@keyframes");
    }
  });

  it("places A, B, C and all four canon thumbnails into the comparison", () => {
    const html = renderVoxyStaticCanonComparisonHtml({
      candidateDataUrls: {
        "candidate-a-canon": "data:image/png;base64,a",
        "candidate-b-broadcast": "data:image/png;base64,b",
        "candidate-c-editorial": "data:image/png;base64,c",
      },
      canonBoards: VOXY_STATIC_CANON_BOARDS.map((board) => ({
        id: board.id,
        dataUrl: DATA_URL,
      })),
    });
    expect(html).toContain("A · CANON FIDELITY");
    expect(html).toContain("B · BROADCAST");
    expect(html).toContain("C · EDITORIAL");
    for (const board of VOXY_STATIC_CANON_BOARDS) {
      expect(html).toContain(board.id);
    }
    expect(html).toContain("keine automatische Bewertung");
  });
});
