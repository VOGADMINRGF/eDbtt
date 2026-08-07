import { readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildVoxyAnimatableMasterAsset,
  VOXY_MASTER_LAYER_IDS,
} from "@/features/voxyVideo/animatableMasterAsset";

describe("Voxy independent animatable layer files", () => {
  it("provides one real standalone SVG file for every canonical layer", () => {
    const master = buildVoxyAnimatableMasterAsset("edebatte");
    expect(master.layers).toHaveLength(VOXY_MASTER_LAYER_IDS.length);
    expect(new Set(master.layers.map((layer) => layer.id)).size).toBe(
      VOXY_MASTER_LAYER_IDS.length,
    );
    for (const layer of master.layers) {
      const file = resolve(process.cwd(), "public", layer.sourcePath.slice(1));
      const svg = readFileSync(file, "utf8");
      expect(basename(file)).toBe(`${layer.id}.svg`);
      expect(svg).toContain("<svg");
      expect(svg).toContain('viewBox="0 0 1600 1600"');
      expect(svg).toContain('data-independent-layer="true"');
      expect(svg).not.toContain("checkerboard");
      expect(svg).not.toContain("<text");
      if (layer.id !== "studio-background") {
        expect(svg).not.toMatch(/<rect[^>]+width="1600"[^>]+height="1600"/);
      }
    }
  });

  it("keeps the five-finger hands as independent source files", () => {
    for (const id of ["left-hand-five-fingers", "right-hand-five-fingers"]) {
      const file = resolve(process.cwd(), `public/brands/voxy/rig/layers/${id}.svg`);
      const svg = readFileSync(file, "utf8");
      expect((svg.match(/data-digit=/g) ?? []).length).toBe(5);
      expect(svg).toContain('data-independent-layer="true"');
    }
  });

  it("keeps waveform, logo, VOG pin and eDebatte pocket as distinct vector files", () => {
    const ids = ["jarvis-waveform", "logo-zone", "vog-pin", "edebatte-pocket"];
    const contents = ids.map((id) =>
      readFileSync(
        resolve(process.cwd(), `public/brands/voxy/rig/layers/${id}.svg`),
        "utf8",
      ),
    );
    expect(new Set(contents).size).toBe(ids.length);
    for (const svg of contents) {
      expect(svg).not.toContain("<text");
    }
  });
});
