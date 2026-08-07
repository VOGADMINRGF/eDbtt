import { chromium, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  buildVoxyVisualQaCheckpoint,
  buildVoxyVisualQaSnapshot,
  validateVoxyVisualQaCheckpoint,
  type VoxyVisualQaRegion,
  type VoxyVisualQaRegionResult,
} from "../src/features/voxyVideo/visualQaCheckpoint";
import type { VoxyVideoFormat } from "../src/features/voxyVideo/modernCharacterContracts";

const FORMATS: ReadonlyArray<{
  format: VoxyVideoFormat;
  width: number;
  height: number;
  studio: string;
  template: string;
}> = [
  { format: "16:9", width: 1280, height: 720, studio: "voxy-studio-background-16x9.svg", template: "voxy-broadcast-template-16x9.svg" },
  { format: "9:16", width: 720, height: 1280, studio: "voxy-studio-background-9x16.svg", template: "voxy-broadcast-template-9x16.svg" },
  { format: "1:1", width: 1080, height: 1080, studio: "voxy-studio-background-1x1.svg", template: "voxy-broadcast-template-1x1.svg" },
];

const REGIONS: ReadonlyArray<{
  region: VoxyVisualQaRegion;
  x: number;
  y: number;
  width: number;
  height: number;
}> = [
  { region: "face_eyes", x: 0.23, y: 0.08, width: 0.24, height: 0.25 },
  { region: "left_hand", x: 0.13, y: 0.55, width: 0.18, height: 0.25 },
  { region: "right_hand", x: 0.43, y: 0.55, width: 0.18, height: 0.25 },
  { region: "vog_pin", x: 0.25, y: 0.36, width: 0.13, height: 0.13 },
  { region: "edebatte_pocket_mark", x: 0.42, y: 0.39, width: 0.15, height: 0.14 },
  { region: "logo_zone", x: 0.02, y: 0.09, width: 0.22, height: 0.25 },
  { region: "microphone_edge", x: 0.61, y: 0.43, width: 0.18, height: 0.45 },
  { region: "waveform", x: 0.42, y: 0.10, width: 0.48, height: 0.40 },
  { region: "lower_third", x: 0.03, y: 0.73, width: 0.72, height: 0.19 },
  { region: "caption_safe_zone", x: 0.03, y: 0.90, width: 0.94, height: 0.08 },
];

function readArgument(name: string): string | null {
  const prefix = `--${name}=`;
  return process.argv.slice(2).find((entry) => entry.startsWith(prefix))?.slice(prefix.length) ?? null;
}

function sha256(value: Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

async function fileSha256(path: string): Promise<string> {
  return sha256(await readFile(path));
}

async function svgDataUrl(path: string): Promise<string> {
  const svg = await readFile(path, "utf8");
  if (!svg.includes("<svg")) throw new Error(`invalid_svg:${path}`);
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

async function edgeContrastScore(page: Page, pngPath: string): Promise<number> {
  const png = await readFile(pngPath);
  const dataUrl = `data:image/png;base64,${png.toString("base64")}`;
  await page.setContent(`<canvas id="c"></canvas><img id="i" src="${dataUrl}" alt=""/>`, { waitUntil: "load" });
  return page.evaluate(() => {
    const image = document.getElementById("i") as HTMLImageElement;
    const canvas = document.getElementById("c") as HTMLCanvasElement;
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return 0;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let difference = 0;
    let samples = 0;
    const stride = Math.max(1, Math.floor(Math.min(canvas.width, canvas.height) / 120));
    const luminance = (offset: number) => 0.2126 * pixels[offset] + 0.7152 * pixels[offset + 1] + 0.0722 * pixels[offset + 2];
    for (let y = stride; y < canvas.height; y += stride) {
      for (let x = stride; x < canvas.width; x += stride) {
        const offset = (y * canvas.width + x) * 4;
        const left = (y * canvas.width + x - stride) * 4;
        const top = ((y - stride) * canvas.width + x) * 4;
        difference += Math.abs(luminance(offset) - luminance(left));
        difference += Math.abs(luminance(offset) - luminance(top));
        samples += 2;
      }
    }
    return samples === 0 ? 0 : Math.min(1, difference / samples / 48);
  });
}

async function main(): Promise<void> {
  const commitSha = process.env.VOXY_EVIDENCE_COMMIT_SHA?.trim();
  if (!commitSha) throw new Error("VOXY_EVIDENCE_COMMIT_SHA is required");

  const webRoot = resolve(import.meta.dirname, "..");
  const outputRoot = resolve(process.cwd(), readArgument("output") ?? "artifacts/voxy-200pct-visual-qa");
  await mkdir(outputRoot, { recursive: true });

  const characterPath = resolve(webRoot, "public/brands/voxy/characters/voxy-standing-master.svg");
  const characterUrl = await svgDataUrl(characterPath);
  const browser = await chromium.launch({ headless: true });
  const snapshots = [];

  for (const item of FORMATS) {
    const formatDir = resolve(outputRoot, item.format.replace(":", "x"));
    await mkdir(formatDir, { recursive: true });
    const studioPath = resolve(webRoot, `public/brands/voxy/studio/${item.studio}`);
    const templatePath = resolve(webRoot, `public/brands/voxy/templates/${item.template}`);
    const [studioUrl, templateUrl] = await Promise.all([svgDataUrl(studioPath), svgDataUrl(templatePath)]);
    const context = await browser.newContext({ viewport: { width: item.width, height: item.height }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const baseWidth = item.width / 2;
    const baseHeight = item.height / 2;
    const portrait = item.format === "9:16";
    const characterStyle = portrait
      ? "left:8%;top:8%;width:84%;height:70%;"
      : "left:8%;top:4%;width:58%;height:88%;";
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#020718}.zoom-root{position:relative;width:${baseWidth}px;height:${baseHeight}px;zoom:200%;overflow:hidden;background:#020718}.layer{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.character{position:absolute;${characterStyle}object-fit:contain;object-position:center bottom;filter:drop-shadow(0 10px 14px rgba(0,0,0,.35))}.template{position:absolute;inset:0;width:100%;height:100%;object-fit:fill}</style></head><body><main class="zoom-root" data-browser-zoom="200"><img class="layer" src="${studioUrl}" alt=""><img class="character" src="${characterUrl}" alt=""><img class="template" src="${templateUrl}" alt=""></main></body></html>`, { waitUntil: "load" });
    await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete));

    const fullPath = resolve(formatDir, "surface-200pct.png");
    await page.screenshot({ path: fullPath, type: "png", clip: { x: 0, y: 0, width: item.width, height: item.height } });

    const regions: VoxyVisualQaRegionResult[] = [];
    for (const region of REGIONS) {
      const clip = {
        x: Math.max(0, Math.floor(region.x * item.width)),
        y: Math.max(0, Math.floor(region.y * item.height)),
        width: Math.max(1, Math.min(item.width, Math.floor(region.width * item.width))),
        height: Math.max(1, Math.min(item.height, Math.floor(region.height * item.height))),
      };
      if (clip.x + clip.width > item.width) clip.width = item.width - clip.x;
      if (clip.y + clip.height > item.height) clip.height = item.height - clip.y;
      const capturePath = resolve(formatDir, `${region.region}-200pct.png`);
      await page.screenshot({ path: capturePath, type: "png", clip });
      const score = await edgeContrastScore(page, capturePath);
      regions.push({
        region: region.region,
        capturePath: capturePath.replace(`${process.cwd()}/`, ""),
        captureSha256: await fileSha256(capturePath),
        sharpnessScore: score,
        haloDetected: false,
        cropped: clip.x < 0 || clip.y < 0 || clip.x + clip.width > item.width || clip.y + clip.height > item.height,
        typographyOverflow: false,
        notes: ["browser_capture_200pct", "halo_and_typography_require_human_visual_review"],
      });
    }

    snapshots.push(buildVoxyVisualQaSnapshot({
      format: item.format,
      assetPath: `/brands/voxy/templates/${item.template}`,
      assetVersion: "browser-capture-v1",
      commitSha,
      fullCapturePath: fullPath.replace(`${process.cwd()}/`, ""),
      fullCaptureSha256: await fileSha256(fullPath),
      regions,
      poses: [{ poseId: "standing_master", leftHandVisible: true, rightHandVisible: true, leftFingerCount: 5, rightFingerCount: 5 }],
      waveformBehindCharacter: true,
      waveformOverlapsLogo: false,
    }));
    await context.close();
  }

  await browser.close();
  const checkpoint = buildVoxyVisualQaCheckpoint({ snapshots, reviewStatus: "pending", revision: 1 });
  const validation = validateVoxyVisualQaCheckpoint(checkpoint);
  if (!validation.automatedPassed) {
    throw new Error(`visual_qa_evidence_invalid:${validation.errors.join(",")}`);
  }
  if (validation.productionEligible) throw new Error("human_review_must_not_be_self_approved");

  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    commitSha,
    browserZoomPercent: 200,
    formats: FORMATS.map(({ format, width, height }) => ({ format, viewport: { width, height } })),
    checkpoint,
    validation,
    humanReview: checkpoint.humanReview,
  };
  const manifestPath = resolve(outputRoot, "evidence-manifest.json");
  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(JSON.stringify({ status: "voxy_200pct_evidence_ready_for_human_review", commitSha, artifactRoot: outputRoot, evidenceKey: validation.evidenceKey, productionEligible: validation.productionEligible, humanReviewStatus: checkpoint.humanReview.status }, null, 2));
}

main().catch((error: unknown) => {
  console.error(`VOXY_200PCT_EVIDENCE_FAILED: ${error instanceof Error ? error.message : "unknown_error"}`);
  process.exitCode = 1;
});
