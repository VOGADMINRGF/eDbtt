import { chromium } from "@playwright/test";
import { spawnSync } from "node:child_process";
import {
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  buildVoxyCharacterMotionFixturePlan,
  validateVoxyCharacterMotionFixturePlan,
} from "../src/features/voxyVideo/characterMotionFixture";
import { renderVoxyCharacterMotionFixtureHtml } from "../src/features/voxyVideo/characterMotionFixtureHtml";
import type { VoxyVideoFormat } from "../src/features/voxyVideo/modernCharacterContracts";

const SUPPORTED_FORMATS = new Set<VoxyVideoFormat>(["16:9", "9:16", "1:1"]);

function readArgument(name: string): string | null {
  const prefix = `--${name}=`;
  const argument = process.argv.slice(2).find((entry) => entry.startsWith(prefix));
  return argument ? argument.slice(prefix.length) : null;
}

function hasFlag(name: string): boolean {
  return process.argv.slice(2).includes(`--${name}`);
}

function resolveFormat(): VoxyVideoFormat {
  const value = readArgument("format") ?? "16:9";
  if (!SUPPORTED_FORMATS.has(value as VoxyVideoFormat)) {
    throw new Error(`Unsupported format: ${value}. Use 16:9, 9:16 or 1:1.`);
  }
  return value as VoxyVideoFormat;
}

function runFfmpeg(inputPath: string, outputPath: string): void {
  const result = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i",
      inputPath,
      "-an",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      outputPath,
    ],
    { encoding: "utf8" },
  );

  if (result.error || result.status !== 0) {
    const detail = result.error?.message ?? result.stderr.trim();
    throw new Error(`FFmpeg conversion failed: ${detail}`);
  }
}

async function main(): Promise<void> {
  const format = resolveFormat();
  const plan = buildVoxyCharacterMotionFixturePlan(format);
  const validation = validateVoxyCharacterMotionFixturePlan(plan);
  if (!validation.ok) {
    throw new Error(`Fixture plan invalid: ${validation.errors.join(", ")}`);
  }

  const webRoot = resolve(import.meta.dirname, "..");
  const repositoryRoot = resolve(webRoot, "../..");
  const assetPath = join(webRoot, "public/brand/voxy/voxy-podcast-stage.png");
  const requestedOutput = resolve(
    process.cwd(),
    readArgument("output") ??
      `artifacts/voxy-character-motion-fixture-${format.replace(":", "x")}.webm`,
  );
  const outputExtension = extname(requestedOutput).toLowerCase();
  if (outputExtension !== ".webm" && outputExtension !== ".mp4") {
    throw new Error("Output must end in .webm or .mp4.");
  }

  const stageAsset = await readFile(assetPath);
  const embeddedCharacterAssetUrl = `data:image/png;base64,${stageAsset.toString("base64")}`;
  const html = renderVoxyCharacterMotionFixtureHtml({
    plan,
    embeddedCharacterAssetUrl,
  });

  const temporaryDirectory = await mkdtemp(
    join(tmpdir(), "voxy-character-motion-fixture-"),
  );
  const htmlPath = join(temporaryDirectory, "fixture.html");
  const planPath = join(temporaryDirectory, "fixture-plan.json");
  await writeFile(htmlPath, html, "utf8");
  await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`, "utf8");

  if (hasFlag("html-only")) {
    const htmlOutput = requestedOutput.replace(/\.(webm|mp4)$/i, ".html");
    const jsonOutput = requestedOutput.replace(/\.(webm|mp4)$/i, ".json");
    await mkdir(dirname(htmlOutput), { recursive: true });
    await copyFile(htmlPath, htmlOutput);
    await copyFile(planPath, jsonOutput);
    console.log(
      JSON.stringify(
        {
          status: "html_fixture_written",
          format,
          htmlOutput,
          jsonOutput,
          reviewRequired: plan.reviewRequired,
          autoPublish: plan.autoPublish,
          lipSync: plan.lipSync,
        },
        null,
        2,
      ),
    );
    await rm(temporaryDirectory, { recursive: true, force: true });
    return;
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: plan.width, height: plan.height },
    recordVideo: {
      dir: temporaryDirectory,
      size: { width: plan.width, height: plan.height },
    },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const video = page.video();
  if (!video) {
    throw new Error("Playwright video recording is unavailable.");
  }

  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "load" });
  await page.waitForTimeout(plan.durationMs + 450);
  await page.close();
  await context.close();
  const recordedWebm = await video.path();
  await browser.close();

  await mkdir(dirname(requestedOutput), { recursive: true });
  if (outputExtension === ".mp4") {
    runFfmpeg(recordedWebm, requestedOutput);
  } else {
    await copyFile(recordedWebm, requestedOutput);
  }

  const manifestOutput = requestedOutput.replace(/\.(webm|mp4)$/i, ".json");
  await copyFile(planPath, manifestOutput);
  await rm(temporaryDirectory, { recursive: true, force: true });

  console.log(
    JSON.stringify(
      {
        status: "fixture_rendered",
        repositoryRoot,
        format,
        output: requestedOutput,
        manifest: manifestOutput,
        width: plan.width,
        height: plan.height,
        durationMs: plan.durationMs,
        fps: plan.fps,
        reviewRequired: plan.reviewRequired,
        autoPublish: plan.autoPublish,
        lipSync: plan.lipSync,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown fixture error";
  console.error(`VOXY_CHARACTER_MOTION_FIXTURE_FAILED: ${message}`);
  process.exitCode = 1;
});
