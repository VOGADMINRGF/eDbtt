import { chromium } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const WIDTH = 1280;
const HEIGHT = 720;
const FPS = 24;
const DURATION_MS = 8000;
const FRAME_COUNT = FPS * (DURATION_MS / 1000);
const CANONICAL_VISUAL_SOURCE = "brand/voxy/voxy-podcast-stage.png";
const REVIEW_TEXT = "Hallo, ich bin Voxy. Was spricht dafür, was dagegen – und was denkst du?";

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

function easeInOut(value: number): number {
  const clamped = Math.max(0, Math.min(1, value));
  return clamped * clamped * (3 - 2 * clamped);
}

function pulse(timeMs: number, startMs: number, peakMs: number, endMs: number): number {
  if (timeMs <= startMs || timeMs >= endMs) return 0;
  if (timeMs <= peakMs) return easeInOut((timeMs - startMs) / (peakMs - startMs));
  return 1 - easeInOut((timeMs - peakMs) / (endMs - peakMs));
}

async function main(): Promise<void> {
  const commitSha = process.env.VOXY_EVIDENCE_COMMIT_SHA?.trim();
  if (!commitSha) throw new Error("VOXY_EVIDENCE_COMMIT_SHA is required");

  const outputRoot = resolve(process.cwd(), readArgument("output") ?? "artifacts/voxy-approved-look-candidate");
  const webRoot = resolve(import.meta.dirname, "..");
  const sourcePath = resolve(webRoot, "public", CANONICAL_VISUAL_SOURCE);
  const sourceBytes = await readFile(sourcePath);
  if (sourceBytes.length < 10_000) throw new Error("canonical_visual_source_unexpectedly_small");
  const sourceSha256 = createHash("sha256").update(sourceBytes).digest("hex");
  const sourceDataUrl = `data:image/png;base64,${sourceBytes.toString("base64")}`;

  const framesDir = await mkdtemp(join(tmpdir(), "voxy-approved-look-"));
  await mkdir(outputRoot, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT } });
  const page = await context.newPage();
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#020718}
    #stage{position:relative;width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden;background:#020718}
    .source{position:absolute;inset:-8px;width:calc(100% + 16px);height:calc(100% + 16px);object-fit:cover;transform-origin:50% 50%;will-change:transform}
    #identity{z-index:1}
    /* These overlays reuse pixels from the approved raster; they never redraw Voxy. The deliberately
       conservative masks are a review fixture for motion legibility, not a claim of final layer parity. */
    #head-motion{z-index:2;clip-path:polygon(35% 10%,65% 10%,69% 58%,31% 58%);transform-origin:50% 43%}
    #left-motion{z-index:3;clip-path:polygon(24% 45%,46% 45%,47% 91%,18% 91%);transform-origin:39% 59%}
    #right-motion{z-index:3;clip-path:polygon(54% 45%,78% 45%,83% 91%,53% 91%);transform-origin:61% 59%}
    #theme-wash{position:absolute;inset:0;z-index:4;pointer-events:none;opacity:.045;mix-blend-mode:screen;background:linear-gradient(115deg,#0b5fff00 20%,#0b5fff 100%)}
    #caption{position:absolute;left:50%;bottom:38px;z-index:10;transform:translateX(-50%);max-width:980px;padding:10px 18px;border-radius:12px;background:rgba(2,7,24,.82);color:#fff;font:700 22px/1.25 Arial,sans-serif;text-align:center;text-shadow:0 2px 4px #000}
    #label{position:absolute;left:20px;top:18px;z-index:11;padding:7px 10px;border-radius:8px;background:rgba(2,7,24,.78);color:#dce8ff;font:600 13px/1.2 Arial,sans-serif;letter-spacing:.02em}
    #safe{position:absolute;display:none;border:3px dashed #25e6ff;border-radius:12px;z-index:20;pointer-events:none;box-shadow:0 0 0 1px rgba(2,7,24,.85)}
  </style></head><body><main id="stage">
    <img id="identity" class="source" src="${sourceDataUrl}" alt="">
    <img id="head-motion" class="source" src="${sourceDataUrl}" alt="">
    <img id="left-motion" class="source" src="${sourceDataUrl}" alt="">
    <img id="right-motion" class="source" src="${sourceDataUrl}" alt="">
    <div id="theme-wash"></div><div id="safe"></div>
    <div id="caption">${REVIEW_TEXT}</div>
    <div id="label">APPROVED-LOOK MOTION TEST · HUMAN REVIEW REQUIRED</div>
  </main></body></html>`, { waitUntil: "load" });
  await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete));

  const setFrame = async (timeMs: number, theme: "edebatte" | "vog_member" = "edebatte") => {
    const phase = (timeMs / DURATION_MS) * Math.PI * 2;
    const breathe = Math.sin(phase) * 0.0025;
    const headGesture = pulse(timeMs, 900, 1500, 2200) - pulse(timeMs, 5000, 5500, 6100) * 0.7;
    const leftGesture = pulse(timeMs, 1900, 3000, 4100);
    const rightGesture = pulse(timeMs, 3600, 4450, 5250);
    const baseTransform = `translate(${(Math.sin(phase * 0.5) * 1.2).toFixed(2)}px, ${(Math.cos(phase * 0.5) * 0.8).toFixed(2)}px) scale(${(1.004 + breathe).toFixed(6)})`;
    const headTransform = `${baseTransform} translate(${(headGesture * 2.2).toFixed(2)}px, ${(-headGesture * 1.5).toFixed(2)}px) rotate(${(headGesture * 1.15).toFixed(3)}deg)`;
    const leftTransform = `${baseTransform} translate(${(-leftGesture * 8).toFixed(2)}px, ${(-leftGesture * 10).toFixed(2)}px) rotate(${(-leftGesture * 2.4).toFixed(3)}deg)`;
    const rightTransform = `${baseTransform} translate(${(rightGesture * 6).toFixed(2)}px, ${(-rightGesture * 6).toFixed(2)}px) rotate(${(rightGesture * 1.8).toFixed(3)}deg)`;
    await page.evaluate(({ baseTransform, headTransform, leftTransform, rightTransform, theme }) => {
      (document.getElementById("identity") as HTMLElement).style.transform = baseTransform;
      (document.getElementById("head-motion") as HTMLElement).style.transform = headTransform;
      (document.getElementById("left-motion") as HTMLElement).style.transform = leftTransform;
      (document.getElementById("right-motion") as HTMLElement).style.transform = rightTransform;
      (document.getElementById("theme-wash") as HTMLElement).style.background = theme === "vog_member"
        ? "linear-gradient(115deg,#16d7c700 15%,#16d7c7 55%,#2a7cff 100%)"
        : "linear-gradient(115deg,#0b5fff00 20%,#0b5fff 100%)";
    }, { baseTransform, headTransform, leftTransform, rightTransform, theme });
  };

  for (let index = 0; index < FRAME_COUNT; index += 1) {
    const timeMs = Math.round((index * 1000) / FPS);
    await setFrame(timeMs);
    await page.screenshot({ path: join(framesDir, `frame-${String(index).padStart(4, "0")}.png`), clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
  }

  const renderPath = resolve(outputRoot, "voxy-approved-look-candidate-8s-16x9.mp4");
  command("ffmpeg", ["-y", "-framerate", String(FPS), "-i", join(framesDir, "frame-%04d.png"), "-frames:v", String(FRAME_COUNT), "-r", String(FPS), "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", renderPath]);

  const reviewFrames = [];
  for (const [name, timeMs] of [["neutral", 0], ["head", 1500], ["left-gesture", 3000], ["right-gesture", 4450]] as const) {
    await setFrame(timeMs);
    const path = resolve(outputRoot, `approved-look-review-${name}.png`);
    await page.screenshot({ path, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
    reviewFrames.push({ name, timeMs, path: path.replace(`${process.cwd()}/`, ""), sha256: await sha256(path) });
  }

  const themePreviews = [];
  for (const theme of ["edebatte", "vog_member"] as const) {
    await setFrame(4000, theme);
    const path = resolve(outputRoot, `approved-look-${theme.replace("_", "-")}-frame-4s.png`);
    await page.screenshot({ path, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
    themePreviews.push({ theme, path: path.replace(`${process.cwd()}/`, ""), sha256: await sha256(path) });
  }

  await setFrame(4000, "edebatte");
  const cropSpecs = [
    { format: "16:9", x: 0, y: 0, width: 1280, height: 720 },
    { format: "9:16", x: 437, y: 0, width: 405, height: 720 },
    { format: "1:1", x: 280, y: 0, width: 720, height: 720 },
  ];
  const cropEvidence = [];
  for (const spec of cropSpecs) {
    const path = resolve(outputRoot, `approved-look-crop-${spec.format.replace(":", "x")}.png`);
    await page.screenshot({ path, clip: { x: spec.x, y: spec.y, width: spec.width, height: spec.height } });
    cropEvidence.push({ format: spec.format, path: path.replace(`${process.cwd()}/`, ""), sha256: await sha256(path), width: spec.width, height: spec.height });
  }

  await page.close(); await context.close(); await browser.close();
  await rm(framesDir, { recursive: true, force: true });

  const probe = JSON.parse(command("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,avg_frame_rate:format=duration", "-of", "json", renderPath]));
  const manifest = {
    schemaVersion: 2,
    commitSha,
    generatedAt: new Date().toISOString(),
    purpose: "human_visual_identity_and_motion_review_candidate",
    status: "needs_human_review",
    renderMode: "approved_raster_source_preserving_masked_motion_candidate",
    reviewText: REVIEW_TEXT,
    canonicalVisualSource: { repositoryPath: `apps/web/public/${CANONICAL_VISUAL_SOURCE}`, sha256: sourceSha256, humanApprovedLookDate: "2026-08-04" },
    constraints: { substituteCharacterForbidden: true, identityGeometryRegeneration: false, lipSync: false, audio: false, autoPublish: false, deployment: false },
    motion: { source: "canonical approved raster pixels only", independentlyDrivenReviewMasks: ["head", "left_arm_hand_region", "right_arm_hand_region"], note: "Review fixture only. Human parity approval remains mandatory before this technique may replace the rejected simplified SVG master." },
    render: { path: renderPath.replace(`${process.cwd()}/`, ""), sha256: await sha256(renderPath), durationSeconds: Number(probe.format?.duration ?? 0), fps: FPS, frameCount: FRAME_COUNT, width: Number(probe.streams?.[0]?.width ?? WIDTH), height: Number(probe.streams?.[0]?.height ?? HEIGHT) },
    reviewFrames, themePreviews, cropEvidence,
    humanReview: { required: true, status: "pending", approvedCommitSha: null, question: "Does the visible motion preserve the exact approved Voxy identity without tearing, duplicate anatomy, or degraded premium broadcast appearance?" },
  };
  const manifestPath = resolve(outputRoot, "approved-look-candidate-manifest.json");
  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ status: "approved_look_visible_motion_candidate_ready_for_human_review", commitSha, sourceSha256, render: manifest.render, reviewFrames }, null, 2));
}

main().catch((error: unknown) => {
  console.error(`VOXY_APPROVED_LOOK_CANDIDATE_FAILED: ${error instanceof Error ? error.message : "unknown_error"}`);
  process.exitCode = 1;
});
