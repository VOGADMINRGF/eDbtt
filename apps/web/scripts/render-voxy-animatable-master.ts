import { chromium } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import {
  buildVoxyAnimatableMasterAsset,
  buildVoxyMasterMotionFrame,
  validateVoxyAnimatableMasterAsset,
  type VoxyMasterLayerTransform,
} from "../src/features/voxyVideo/animatableMasterAsset";
import type { VoxyCharacterMotion } from "../src/features/voxyVideo/modernCharacterContracts";

const WIDTH = 1280;
const HEIGHT = 720;
const FPS = 24;
const DURATION_MS = 8000;
const FRAME_COUNT = FPS * (DURATION_MS / 1000);
const RIG_SIZE = 540;
const RIG_LEFT = (WIDTH - RIG_SIZE) / 2;
const RIG_TOP = (HEIGHT - RIG_SIZE) / 2;
const MOTIONS: VoxyCharacterMotion[] = [
  "neutral_idle",
  "listening",
  "explaining",
  "questioning",
  "highlighting_source",
  "showing_contrast",
  "inviting_participation",
];

function readArgument(name: string): string | null {
  const prefix = `--${name}=`;
  return process.argv.slice(2).find((entry) => entry.startsWith(prefix))?.slice(prefix.length) ?? null;
}

async function sha256(path: string): Promise<string> {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

function command(commandName: string, args: string[]): string {
  const result = spawnSync(commandName, args, { encoding: "utf8" });
  if (result.error || result.status !== 0) {
    throw new Error(`${commandName}_failed:${result.error?.message ?? result.stderr.trim()}`);
  }
  return result.stdout.trim();
}

async function dataUrl(path: string): Promise<string> {
  const svg = await readFile(path, "utf8");
  if (!svg.includes("<svg")) throw new Error(`invalid_layer_svg:${path}`);
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function transformCss(transform: VoxyMasterLayerTransform | undefined): string {
  if (!transform) return "translate(0,0) rotate(0deg) scale(1)";
  return `translate(${transform.translateXPercent}%,${transform.translateYPercent}%) rotate(${transform.rotateDegrees}deg) scale(${transform.scale})`;
}

async function main(): Promise<void> {
  const commitSha = process.env.VOXY_EVIDENCE_COMMIT_SHA?.trim();
  if (!commitSha) throw new Error("VOXY_EVIDENCE_COMMIT_SHA is required");
  const outputRoot = resolve(process.cwd(), readArgument("output") ?? "artifacts/voxy-animatable-master");
  const webRoot = resolve(import.meta.dirname, "..");
  const framesDir = await mkdtemp(join(tmpdir(), "voxy-layered-frames-"));
  await mkdir(outputRoot, { recursive: true });

  const master = buildVoxyAnimatableMasterAsset("edebatte");
  const validation = validateVoxyAnimatableMasterAsset(master);
  if (!validation.ok) throw new Error(`invalid_master:${validation.errors.join(",")}`);

  const layerAssets = [];
  for (const layer of master.layers) {
    const file = resolve(webRoot, "public", layer.sourcePath.slice(1));
    layerAssets.push({
      id: layer.id,
      path: layer.sourcePath,
      sha256: await sha256(file),
      url: await dataUrl(file),
      pivot: layer.pivot,
      zIndex: layer.zIndex,
    });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT } });
  const page = await context.newPage();
  const layerMarkup = layerAssets
    .map(
      (layer) =>
        `<img class="rig-layer" data-layer-id="${layer.id}" src="${layer.url}" alt="" style="z-index:${layer.zIndex};transform-origin:${layer.pivot ? `${(layer.pivot.x / 1600) * 100}% ${(layer.pivot.y / 1600) * 100}%` : "50% 50%"}">`,
    )
    .join("");
  await page.setContent(
    `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#020718}#stage{position:relative;width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden;background:radial-gradient(circle at 52% 36%,#102855,#020718 70%)}#rig{position:absolute;width:${RIG_SIZE}px;height:${RIG_SIZE}px;left:${RIG_LEFT}px;top:${RIG_TOP}px}.rig-layer{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;will-change:transform,opacity}.safe-area{position:absolute;display:none;border:3px dashed #25e6ff;border-radius:12px;z-index:999;pointer-events:none;box-shadow:0 0 0 1px rgba(2,7,24,.8)}</style></head><body><main id="stage"><div id="rig">${layerMarkup}</div><div id="safe" class="safe-area"></div></main></body></html>`,
    { waitUntil: "load" },
  );
  await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete));

  const applyFrame = async (timeMs: number) => {
    const motionIndex = Math.min(
      MOTIONS.length - 1,
      Math.floor((timeMs / DURATION_MS) * MOTIONS.length),
    );
    const frame = buildVoxyMasterMotionFrame({
      master,
      motion: MOTIONS[motionIndex],
      timeMs,
    });
    const transforms = Object.fromEntries(
      frame.transforms.map((item) => [
        item.layerId,
        { transform: transformCss(item), opacity: item.opacity },
      ]),
    );
    await page.evaluate((values) => {
      document.querySelectorAll<HTMLElement>("[data-layer-id]").forEach((element) => {
        const value = values[element.dataset.layerId ?? ""];
        element.style.transform = value?.transform ?? "translate(0,0) rotate(0deg) scale(1)";
        element.style.opacity = String(value?.opacity ?? 1);
      });
    }, transforms);
  };

  for (let index = 0; index < FRAME_COUNT; index += 1) {
    const timeMs = Math.round((index * 1000) / FPS);
    await applyFrame(timeMs);
    await page.screenshot({
      path: join(framesDir, `frame-${String(index).padStart(4, "0")}.png`),
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
    });
  }

  const renderPath = resolve(outputRoot, "voxy-layered-master-8s-16x9.mp4");
  command("ffmpeg", [
    "-y",
    "-framerate",
    String(FPS),
    "-i",
    join(framesDir, "frame-%04d.png"),
    "-frames:v",
    String(FRAME_COUNT),
    "-r",
    String(FPS),
    "-an",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    renderPath,
  ]);

  await applyFrame(4000);
  const safe = async (left: number, top: number, width: number, height: number) =>
    page.evaluate(
      ({ left, top, width, height }) => {
        const element = document.getElementById("safe") as HTMLElement;
        element.style.display = "block";
        element.style.left = `${left}px`;
        element.style.top = `${top}px`;
        element.style.width = `${width}px`;
        element.style.height = `${height}px`;
      },
      { left, top, width, height },
    );

  const cropEvidence = [];
  const cropSpecs = [
    { format: "16:9", x: 0, y: 0, width: 1280, height: 720, marginX: 64, marginY: 43 },
    { format: "9:16", x: 437, y: 0, width: 405, height: 720, marginX: 32, marginY: 58 },
    { format: "1:1", x: 280, y: 0, width: 720, height: 720, marginX: 58, marginY: 58 },
  ];
  for (const spec of cropSpecs) {
    await safe(
      spec.x + spec.marginX,
      spec.y + spec.marginY,
      spec.width - spec.marginX * 2,
      spec.height - spec.marginY * 2,
    );
    const path = resolve(outputRoot, `crop-safe-${spec.format.replace(":", "x")}.png`);
    await page.screenshot({
      path,
      clip: { x: spec.x, y: spec.y, width: spec.width, height: spec.height },
    });
    cropEvidence.push({
      format: spec.format,
      path: path.replace(`${process.cwd()}/`, ""),
      sha256: await sha256(path),
      width: spec.width,
      height: spec.height,
      safeAreaVisible: true,
      rigBounds: {
        left: RIG_LEFT,
        top: RIG_TOP,
        width: RIG_SIZE,
        height: RIG_SIZE,
      },
    });
  }

  await page.close();
  await context.close();
  await browser.close();
  await rm(framesDir, { recursive: true, force: true });

  const probe = JSON.parse(
    command("ffprobe", [
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height,avg_frame_rate:format=duration",
      "-of",
      "json",
      renderPath,
    ]),
  );
  const durationSeconds = Number(probe.format?.duration ?? 0);
  const manifest = {
    schemaVersion: 2,
    commitSha,
    generatedAt: new Date().toISOString(),
    renderer: "apps/web/scripts/render-voxy-animatable-master.ts",
    layout: {
      stage: { width: WIDTH, height: HEIGHT },
      rig: { left: RIG_LEFT, top: RIG_TOP, width: RIG_SIZE, height: RIG_SIZE },
      strategy: "center_crop_safe_rig",
    },
    layerAssets: layerAssets.map(({ id, path, sha256: hash, pivot, zIndex }) => ({
      id,
      path,
      sha256: hash,
      pivot,
      zIndex,
    })),
    render: {
      path: renderPath.replace(`${process.cwd()}/`, ""),
      sha256: await sha256(renderPath),
      durationSeconds,
      fps: FPS,
      width: Number(probe.streams?.[0]?.width ?? WIDTH),
      height: Number(probe.streams?.[0]?.height ?? HEIGHT),
      frameCount: FRAME_COUNT,
    },
    cropEvidence,
    humanReview: { required: true, status: "pending", approvedCommitSha: null },
  };
  const manifestPath = resolve(outputRoot, "evidence-manifest.json");
  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(
    JSON.stringify(
      {
        status: "voxy_layered_render_ready_for_human_review",
        commitSha,
        render: manifest.render,
        cropEvidence,
        layerCount: manifest.layerAssets.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(
    `VOXY_ANIMATABLE_RENDER_FAILED: ${error instanceof Error ? error.message : "unknown_error"}`,
  );
  process.exitCode = 1;
});
