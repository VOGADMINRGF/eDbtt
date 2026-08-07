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

function identityTransform(timeMs: number): string {
  const phase = (timeMs / DURATION_MS) * Math.PI * 2;
  const scale = 1.008 + Math.sin(phase) * 0.004;
  const x = Math.sin(phase * 0.5) * 2.5;
  const y = Math.cos(phase * 0.5) * 1.5;
  return `translate(${x.toFixed(3)}px, ${y.toFixed(3)}px) scale(${scale.toFixed(6)})`;
}

async function main(): Promise<void> {
  const commitSha = process.env.VOXY_EVIDENCE_COMMIT_SHA?.trim();
  if (!commitSha) throw new Error("VOXY_EVIDENCE_COMMIT_SHA is required");

  const outputRoot = resolve(
    process.cwd(),
    readArgument("output") ?? "artifacts/voxy-approved-look-candidate",
  );
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
  await page.setContent(
    `<!doctype html><html><head><meta charset="utf-8"><style>
      *{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#020718}
      #stage{position:relative;width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden;background:#020718}
      #identity{position:absolute;inset:-8px;width:calc(100% + 16px);height:calc(100% + 16px);object-fit:cover;transform-origin:50% 50%;will-change:transform}
      #theme-wash{position:absolute;inset:0;pointer-events:none;opacity:.055;mix-blend-mode:screen;background:linear-gradient(115deg,#0b5fff00 20%,#0b5fff 100%)}
      #safe{position:absolute;display:none;border:3px dashed #25e6ff;border-radius:12px;z-index:20;pointer-events:none;box-shadow:0 0 0 1px rgba(2,7,24,.85)}
      #label{position:absolute;left:20px;bottom:18px;z-index:30;padding:7px 10px;border-radius:8px;background:rgba(2,7,24,.78);color:#dce8ff;font:600 13px/1.2 Arial,sans-serif;letter-spacing:.02em}
    </style></head><body><main id="stage"><img id="identity" src="${sourceDataUrl}" alt=""><div id="theme-wash"></div><div id="safe"></div><div id="label">APPROVED-LOOK CANDIDATE · HUMAN REVIEW REQUIRED</div></main></body></html>`,
    { waitUntil: "load" },
  );
  await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete));

  const setFrame = async (timeMs: number, theme: "edebatte" | "vog_member" = "edebatte") => {
    const transform = identityTransform(timeMs);
    await page.evaluate(
      ({ transform, theme }) => {
        const identity = document.getElementById("identity") as HTMLElement;
        const wash = document.getElementById("theme-wash") as HTMLElement;
        identity.style.transform = transform;
        wash.style.background =
          theme === "vog_member"
            ? "linear-gradient(115deg,#16d7c700 15%,#16d7c7 55%,#2a7cff 100%)"
            : "linear-gradient(115deg,#0b5fff00 20%,#0b5fff 100%)";
      },
      { transform, theme },
    );
  };

  for (let index = 0; index < FRAME_COUNT; index += 1) {
    const timeMs = Math.round((index * 1000) / FPS);
    await setFrame(timeMs);
    await page.screenshot({
      path: join(framesDir, `frame-${String(index).padStart(4, "0")}.png`),
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
    });
  }

  const renderPath = resolve(outputRoot, "voxy-approved-look-candidate-8s-16x9.mp4");
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

  const themePreviews = [];
  for (const theme of ["edebatte", "vog_member"] as const) {
    await setFrame(4000, theme);
    const path = resolve(outputRoot, `approved-look-${theme.replace("_", "-")}-frame-4s.png`);
    await page.screenshot({ path, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
    themePreviews.push({ theme, path: path.replace(`${process.cwd()}/`, ""), sha256: await sha256(path) });
  }

  await setFrame(4000, "edebatte");
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

  const cropSpecs = [
    { format: "16:9", x: 0, y: 0, width: 1280, height: 720, marginX: 64, marginY: 43 },
    { format: "9:16", x: 437, y: 0, width: 405, height: 720, marginX: 32, marginY: 58 },
    { format: "1:1", x: 280, y: 0, width: 720, height: 720, marginX: 58, marginY: 58 },
  ];
  const cropEvidence = [];
  for (const spec of cropSpecs) {
    await safe(
      spec.x + spec.marginX,
      spec.y + spec.marginY,
      spec.width - spec.marginX * 2,
      spec.height - spec.marginY * 2,
    );
    const path = resolve(outputRoot, `approved-look-crop-${spec.format.replace(":", "x")}.png`);
    await page.screenshot({ path, clip: { x: spec.x, y: spec.y, width: spec.width, height: spec.height } });
    cropEvidence.push({
      format: spec.format,
      path: path.replace(`${process.cwd()}/`, ""),
      sha256: await sha256(path),
      width: spec.width,
      height: spec.height,
      safeAreaVisible: true,
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

  const manifest = {
    schemaVersion: 1,
    commitSha,
    generatedAt: new Date().toISOString(),
    purpose: "human_visual_identity_recovery_candidate",
    status: "needs_human_review",
    renderMode: "approved_raster_identity_preserving_2_5d_candidate",
    canonicalVisualSource: {
      repositoryPath: `apps/web/public/${CANONICAL_VISUAL_SOURCE}`,
      sha256: sourceSha256,
      humanApprovedLookDate: "2026-08-04",
    },
    constraints: {
      substituteCharacterForbidden: true,
      identityGeometryRegeneration: false,
      lipSync: false,
      autoPublish: false,
      deployment: false,
    },
    render: {
      path: renderPath.replace(`${process.cwd()}/`, ""),
      sha256: await sha256(renderPath),
      durationSeconds: Number(probe.format?.duration ?? 0),
      fps: FPS,
      frameCount: FRAME_COUNT,
      width: Number(probe.streams?.[0]?.width ?? WIDTH),
      height: Number(probe.streams?.[0]?.height ?? HEIGHT),
    },
    themePreviews,
    cropEvidence,
    humanReview: {
      required: true,
      status: "pending",
      approvedCommitSha: null,
      question: "Does this preserve the exact approved Voxy identity and premium broadcast look?",
    },
    technicalNote:
      "This candidate intentionally preserves the approved raster identity without regenerating anatomy. It is visual-recovery evidence for PR #589, not self-approval of the final independent layered rig.",
  };
  const manifestPath = resolve(outputRoot, "approved-look-candidate-manifest.json");
  await mkdir(dirname(manifestPath), { recursive: true });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        status: "approved_look_candidate_ready_for_human_review",
        commitSha,
        sourceSha256,
        render: manifest.render,
        cropEvidence,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  console.error(
    `VOXY_APPROVED_LOOK_CANDIDATE_FAILED: ${error instanceof Error ? error.message : "unknown_error"}`,
  );
  process.exitCode = 1;
});
