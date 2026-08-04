import { chromium } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import {
  resolveVoxyMarketingAsset,
  resolveVoxyMasterDimensions,
  type VoxyMasterQualityProfile,
} from "../src/features/voxy/voxyMasterAssets";
import type { VoxyVideoFormat } from "../src/features/voxyVideo/modernCharacterContracts";

const FORMATS = new Set<VoxyVideoFormat>(["16:9", "9:16", "1:1"]);
const PROFILES = new Set<VoxyMasterQualityProfile>(["review", "production", "marketing8k"]);

function argument(name: string): string | null {
  const prefix = `--${name}=`;
  return process.argv.slice(2).find((entry) => entry.startsWith(prefix))?.slice(prefix.length) ?? null;
}

async function main(): Promise<void> {
  const format = (argument("format") ?? "16:9") as VoxyVideoFormat;
  const profile = (argument("profile") ?? "production") as VoxyMasterQualityProfile;
  if (!FORMATS.has(format)) throw new Error("Unsupported Voxy format");
  if (!PROFILES.has(profile)) throw new Error("Unsupported Voxy quality profile");

  const { width, height, fps } = resolveVoxyMasterDimensions(format, profile);
  const webRoot = resolve(import.meta.dirname, "..");
  const sourcePath = resolve(webRoot, "public", resolveVoxyMarketingAsset(format).replace(/^\//, ""));
  const output = resolve(
    process.cwd(),
    argument("output") ?? `artifacts/voxy-master-${format.replace(":", "x")}-${profile}.png`,
  );
  const extension = extname(output).toLowerCase();
  if (![".png", ".webp", ".avif"].includes(extension)) {
    throw new Error("Output must be PNG, WebP or AVIF");
  }

  const temporaryDirectory = await mkdtemp(join(tmpdir(), "voxy-master-export-"));
  const htmlPath = join(temporaryDirectory, "export.html");
  const sourceUrl = pathToFileURL(sourcePath).href;
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}html,body{margin:0;width:${width}px;height:${height}px;overflow:hidden;background:#02050f}img{display:block;width:${width}px;height:${height}px;object-fit:fill}</style></head><body><img src="${sourceUrl}" alt=""></body></html>`;
  await writeFile(htmlPath, html, "utf8");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "load" });
  await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0));
  const png = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width, height } });
  await browser.close();

  await mkdir(dirname(output), { recursive: true });
  if (extension === ".png") {
    await writeFile(output, png);
  } else {
    const pngPath = output.replace(/\.(webp|avif)$/i, ".source.png");
    await writeFile(pngPath, png);
    const result = spawnSync("ffmpeg", ["-y", "-i", pngPath, output], { encoding: "utf8" });
    if (result.error || result.status !== 0) {
      throw new Error(`FFmpeg image conversion failed: ${result.error?.message ?? result.stderr}`);
    }
  }

  await rm(temporaryDirectory, { recursive: true, force: true });
  console.log(JSON.stringify({ status: "voxy_master_exported", format, profile, width, height, fps, sourcePath, output }, null, 2));
}

main().catch((error: unknown) => {
  console.error(`VOXY_MASTER_EXPORT_FAILED: ${error instanceof Error ? error.message : "unknown"}`);
  process.exitCode = 1;
});
