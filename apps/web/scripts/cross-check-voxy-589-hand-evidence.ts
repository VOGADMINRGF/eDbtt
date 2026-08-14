import { chromium, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import {
  isUsableVoxyHandDetectionEvidence,
  VOXY_VISUAL_DETECTOR_SELECTED,
} from "../src/features/voxyVideo/visualDetectorLicenseContract";
import {
  VoxyVisualHandDetector,
  VOXY_VISUAL_HAND_DETECTOR_PROFILE,
  VOXY_VISUAL_HAND_DETECTOR_PROFILE_SERIALIZED,
} from "../src/features/voxyVideo/voxyVisualHandDetector";

type RigHand = {
  side: "left" | "right";
  crop: string;
  cropSha256: string;
  bounds: { x: number; y: number; width: number; height: number };
};
type RigStandframe = {
  timeMs: number;
  state: string;
  file: string;
  sha256: string;
  hands: RigHand[];
};
type RigFormat = {
  format: "16:9" | "9:16" | "1:1";
  standframes: RigStandframe[];
};
type RigManifest = {
  schemaVersion: string;
  exactHeadSha: string;
  formats: RigFormat[];
  humanVisualAcceptance: "pending";
  productionEligible: false;
  autoPublish: false;
};

function argument(name: string): string | null {
  const prefix = `--${name}=`;
  return process.argv.slice(2).find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? null;
}

function sha256(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex");
}

async function paddedCrop(input: {
  page: Page;
  standframePath: string;
  bounds: RigHand["bounds"];
  outputPath: string;
}): Promise<void> {
  const source = await readFile(input.standframePath);
  const sourceUrl = `data:image/png;base64,${source.toString("base64")}`;
  const padding = VOXY_VISUAL_HAND_DETECTOR_PROFILE.paddingPixels;
  const inspectionScale = 1;
  const sourceWidth = Math.ceil(input.bounds.width) + padding * 2;
  const sourceHeight = Math.ceil(input.bounds.height) + padding * 2;
  const width = sourceWidth * inspectionScale;
  const height = sourceHeight * inspectionScale;
  await input.page.setViewportSize({ width, height });
  await input.page.setContent(
    `<style>html,body{margin:0;overflow:hidden;background:#020718}canvas{display:block}</style><canvas id="crop" width="${width}" height="${height}"></canvas><img id="source" src="${sourceUrl}" alt="">`,
    { waitUntil: "load" },
  );
  await input.page.evaluate(({ bounds, paddingPixels, sourceWidth, sourceHeight }) => {
    const canvas = document.getElementById("crop") as HTMLCanvasElement;
    const context = canvas.getContext("2d");
    const image = document.getElementById("source") as HTMLImageElement;
    if (!context) throw new Error("padded_crop_canvas_context_unavailable");
    context.imageSmoothingEnabled = true;
    context.fillStyle = "#020718";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(
      image,
      bounds.x - paddingPixels,
      bounds.y - paddingPixels,
      sourceWidth,
      sourceHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );
  }, { bounds: input.bounds, paddingPixels: padding, sourceWidth, sourceHeight });
  await input.page.locator("#source").evaluate((element) => element.remove());
  await input.page.screenshot({ path: input.outputPath, type: "png" });
}

async function decodePng(page: Page, path: string) {
  const png = await readFile(path);
  const sourceUrl = `data:image/png;base64,${png.toString("base64")}`;
  await page.setContent(
    `<canvas id="decode"></canvas><img id="source" src="${sourceUrl}" alt="">`,
    { waitUntil: "load" },
  );
  const decoded = await page.evaluate(() => {
    const canvas = document.getElementById("decode") as HTMLCanvasElement;
    const image = document.getElementById("source") as HTMLImageElement;
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("png_decode_canvas_context_unavailable");
    context.drawImage(image, 0, 0);
    return {
      width: canvas.width,
      height: canvas.height,
      rgba: Array.from(context.getImageData(0, 0, canvas.width, canvas.height).data),
    };
  });
  return {
    width: decoded.width,
    height: decoded.height,
    rgba: new Uint8ClampedArray(decoded.rgba),
    inputPath: relative(process.cwd(), path),
    inputSha256: sha256(png),
  };
}

async function main(): Promise<void> {
  const evidenceRoot = resolve(argument("evidence") ?? "");
  const outputRoot = resolve(
    argument("output") ?? "artifacts/voxy-589-hand-detector-cross-check",
  );
  const expectedHead = argument("expected-head");
  if (!argument("evidence")) throw new Error("--evidence is required");
  const rigManifest = JSON.parse(
    await readFile(resolve(evidenceRoot, "manifest.json"), "utf8"),
  ) as RigManifest;
  if (rigManifest.schemaVersion !== "voxy-animatable-rig-evidence-v1") {
    throw new Error(`unsupported_rig_manifest:${rigManifest.schemaVersion}`);
  }
  if (expectedHead && rigManifest.exactHeadSha !== expectedHead) {
    throw new Error(
      `rig_exact_head_mismatch:${rigManifest.exactHeadSha}:${expectedHead}`,
    );
  }
  if (
    rigManifest.humanVisualAcceptance !== "pending" ||
    rigManifest.productionEligible !== false ||
    rigManifest.autoPublish !== false
  ) {
    throw new Error("rig_human_or_production_gate_contract_invalid");
  }

  await mkdir(outputRoot, { recursive: true });
  const profileSha256 = sha256(
    Buffer.from(VOXY_VISUAL_HAND_DETECTOR_PROFILE_SERIALIZED),
  );
  const detector = new VoxyVisualHandDetector({
    modelSha256: profileSha256,
    hashBytes: sha256,
  });
  const browser = await chromium.launch({ headless: true });
  const cropPage = await browser.newPage();
  const decodePage = await browser.newPage();
  const crops = [];

  for (const format of rigManifest.formats) {
    for (const standframe of format.standframes) {
      const standframePath = resolve(evidenceRoot, standframe.file);
      if (sha256(await readFile(standframePath)) !== standframe.sha256) {
        throw new Error(`rig_standframe_sha_mismatch:${standframe.file}`);
      }
      for (const hand of standframe.hands) {
        const sourceArtifactCropSha256 = sha256(
          await readFile(resolve(evidenceRoot, hand.crop)),
        );
        if (sourceArtifactCropSha256 !== hand.cropSha256) {
          throw new Error(`rig_hand_crop_sha_mismatch:${hand.crop}`);
        }
        const outputPath = resolve(
          outputRoot,
          "padded-crops",
          `${format.format.replace(":", "x")}-${standframe.timeMs}ms-${hand.side}.png`,
        );
        await mkdir(dirname(outputPath), { recursive: true });
        await paddedCrop({
          page: cropPage,
          standframePath,
          bounds: hand.bounds,
          outputPath,
        });
        const image = await decodePng(decodePage, outputPath);
        const detection = detector.detect({ hand: hand.side, image });
        const accepted =
          isUsableVoxyHandDetectionEvidence(detection) &&
          detection.fingerCount === 5;
        crops.push({
          format: format.format,
          timeMs: standframe.timeMs,
          state: standframe.state,
          hand: hand.side,
          sourceArtifactCrop: hand.crop,
          sourceArtifactCropSha256,
          paddedCrop: relative(process.cwd(), outputPath),
          paddedCropSha256: image.inputSha256,
          accepted,
          detection,
        });
      }
    }
  }

  await cropPage.close();
  await decodePage.close();
  await browser.close();
  const accepted = crops.filter((crop) => crop.accepted).length;
  const manifest = {
    schemaVersion: "voxy-589-hand-detector-cross-check-v1",
    source: {
      artifactExactHeadSha: rigManifest.exactHeadSha,
      artifactManifest: relative(process.cwd(), resolve(evidenceRoot, "manifest.json")),
      humanVisualAcceptance: rigManifest.humanVisualAcceptance,
      productionEligible: rigManifest.productionEligible,
      autoPublish: rigManifest.autoPublish,
    },
    detector: {
      id: VOXY_VISUAL_DETECTOR_SELECTED.id,
      version: VOXY_VISUAL_DETECTOR_SELECTED.version,
      runtimeVersion: VOXY_VISUAL_DETECTOR_SELECTED.runtimeVersion,
      modelId: VOXY_VISUAL_DETECTOR_SELECTED.modelId,
      detectorProfileSha256: profileSha256,
      profile: VOXY_VISUAL_HAND_DETECTOR_PROFILE,
      crossCheckCropInspectionScale: 1,
      localExecution: true,
      externalServiceRequired: false,
    },
    summary: {
      tested: crops.length,
      accepted,
      blocked: crops.length - accepted,
      humanReview: "pending",
      productionEligible: false,
    },
    crops,
  };
  await writeFile(
    resolve(outputRoot, "cross-check-manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  process.stdout.write(
    `${JSON.stringify({
      exactHead: rigManifest.exactHeadSha,
      tested: crops.length,
      accepted,
      blocked: crops.length - accepted,
      output: relative(process.cwd(), outputRoot),
    })}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
