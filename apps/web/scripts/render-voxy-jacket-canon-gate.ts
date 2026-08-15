import { chromium, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import {
  buildVoxyFirstExplainerPlan,
  VOXY_FIRST_EXPLAINER_STUDIO_LOCKUP_PATH,
} from "../src/features/voxyVideo/firstExplainerVideo";
import {
  renderVoxyFirstExplainerFrameHtml,
  type VoxyFirstExplainerEmbeddedAssets,
} from "../src/features/voxyVideo/firstExplainerVideoHtml";
import {
  buildVoxyJacketCanonGatePlan,
  validateVoxyJacketCanonGatePlan,
} from "../src/features/voxyVideo/jacketCanonGate";
import {
  VOXY_STATIC_CANON_BOARDS,
  VOXY_STATIC_CANON_FINAL_CAMERA,
  VOXY_STATIC_CANON_NATIVE_ASSETS,
} from "../src/features/voxyVideo/staticCanonRecovery";

function argument(name: string): string | null {
  const prefix = `--${name}=`;
  return (
    process.argv
      .slice(2)
      .find((value) => value.startsWith(prefix))
      ?.slice(prefix.length) ?? null
  );
}

function sha256(value: Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
}

async function fileSha256(path: string): Promise<string> {
  return sha256(await readFile(path));
}

function runBinary(binary: string, args: string[], cwd: string): string {
  const result = spawnSync(binary, args, { cwd, encoding: "utf8" });
  if (result.error || result.status !== 0) {
    throw new Error(
      `${binary}_failed:${result.error?.message ?? result.stderr.trim()}`,
    );
  }
  return result.stdout.trim();
}

function repositoryPath(repositoryRoot: string, path: string): string {
  const resolved = resolve(repositoryRoot, path);
  if (!resolved.startsWith(`${repositoryRoot}/`)) {
    throw new Error(`repository_path_escape:${path}`);
  }
  return resolved;
}

function dataUrl(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

function pngDimensions(buffer: Buffer): { width: number; height: number } {
  if (
    buffer.length < 24 ||
    buffer[0] !== 0x89 ||
    buffer.subarray(1, 4).toString("ascii") !== "PNG"
  ) {
    throw new Error("invalid_png_signature");
  }
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function settlePage(page: Page, html: string): Promise<void> {
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images).map((image) => image.decode()));
    await new Promise<void>((resolveFrame) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolveFrame()));
    });
  });
}

function renderCanonReferenceHtml(canonStageDataUrl: string): string {
  const camera = VOXY_STATIC_CANON_FINAL_CAMERA;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#010511}.viewport{position:relative;width:1920px;height:1080px;overflow:hidden;background:#010511}.studio-stage{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:translate(${camera.translateX}px,${camera.translateY}px) scale(${camera.scale});transform-origin:${camera.transformOrigin};filter:saturate(1.08) contrast(1.06) brightness(.92)}.studio-grade{position:absolute;inset:0;background:radial-gradient(circle at 47% 38%,rgba(32,102,255,.05),transparent 29%),linear-gradient(90deg,rgba(1,5,17,.88) 0%,rgba(1,5,17,.38) 29%,transparent 54%,rgba(1,5,17,.76) 88%,#010511 100%)}
</style></head><body><main class="viewport"><img class="studio-stage" src="${canonStageDataUrl}" alt=""><div class="studio-grade"></div></main></body></html>`;
}

function renderComparisonHtml(input: {
  candidateDataUrl: string;
  canonDataUrl: string;
}): string {
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>
*{box-sizing:border-box}html,body{margin:0;width:1600px;height:900px;overflow:hidden;background:#050914;color:#f5f7fb;font-family:Arial,Helvetica,sans-serif}.board{width:1600px;height:900px;padding:46px 54px}.header{display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:28px}.eyebrow{color:#ff7474;font-weight:900;letter-spacing:.14em}.title{margin:8px 0 0;font-size:36px}.gate{padding:12px 18px;border:2px solid #ff5d67;border-radius:999px;color:#ff8b92;font-weight:900;letter-spacing:.12em}.pair{display:grid;grid-template-columns:1fr 1fr;gap:28px}.panel{padding:20px;border:1px solid #293750;border-radius:18px;background:#091120}.panel h2{margin:0 0 14px;font-size:18px;letter-spacing:.08em}.panel img{display:block;width:100%;height:465px;object-fit:contain;background:#010511}.notes{margin-top:24px;padding:18px 22px;border-left:4px solid #ff5d67;background:#111829;font-size:20px;line-height:1.45}.notes strong{color:#ff8b92}
</style></head><body><main class="board"><header class="header"><div><div class="eyebrow">VOXY · HARD CANON REGION</div><h1 class="title">Jacket Canon Comparison</h1></div><div class="gate">GATE FAIL</div></header><section class="pair"><article class="panel"><h2>CURRENT MOTION V2 JACKET</h2><img src="${input.candidateDataUrl}" alt="Current Motion v2 jacket crop"></article><article class="panel"><h2>CANON-04 · SAME CAMERA</h2><img src="${input.canonDataUrl}" alt="Canon-04 reference crop"></article></section><section class="notes"><strong>STOP:</strong> Der frei gesetzte VOG-Pin ist nicht canon-integriert; die native eDebatte-Wortmarke liegt zusätzlich über der bereits eingebrannten Markierung. Textur-, Geometrie- und Exactly-once-Vertrag sind damit nicht belastbar erfüllt.</section></main></body></html>`;
}

async function scalePng(input: {
  source: string;
  destination: string;
  multiplier: 2 | 4;
  repositoryRoot: string;
}): Promise<void> {
  runBinary(
    "ffmpeg",
    [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      input.source,
      "-vf",
      `scale=iw*${input.multiplier}:ih*${input.multiplier}:flags=lanczos`,
      "-frames:v",
      "1",
      input.destination,
    ],
    input.repositoryRoot,
  );
}

async function main(): Promise<void> {
  const exactHeadSha = process.env.VOXY_JACKET_GATE_COMMIT_SHA?.trim() ?? "";
  if (!/^[0-9a-f]{40}$/.test(exactHeadSha)) {
    throw new Error("VOXY_JACKET_GATE_COMMIT_SHA_must_be_exact_40_char_sha");
  }

  const webRoot = resolve(import.meta.dirname, "..");
  const repositoryRoot = resolve(webRoot, "../..");
  const currentHead = runBinary("git", ["rev-parse", "HEAD"], repositoryRoot);
  if (currentHead !== exactHeadSha) {
    throw new Error(`exact_head_mismatch:${currentHead}:${exactHeadSha}`);
  }

  const evidenceInputs = [
    ".github/workflows/voxy-jacket-canon-gate.yml",
    "apps/web/scripts/render-voxy-jacket-canon-gate.ts",
    "apps/web/src/features/voxyVideo/jacketCanonGate.ts",
    "apps/web/src/features/voxyVideo/firstExplainerVideo.ts",
    "apps/web/src/features/voxyVideo/firstExplainerVideoHtml.ts",
    "apps/web/src/features/voxyVideo/staticCanonRecovery.ts",
    "apps/web/public/brands/voxy/references/canon",
    VOXY_FIRST_EXPLAINER_STUDIO_LOCKUP_PATH,
    VOXY_STATIC_CANON_NATIVE_ASSETS.vogPin,
    VOXY_STATIC_CANON_NATIVE_ASSETS.edebattePocketMark,
  ];
  const dirtyInputs = runBinary(
    "git",
    ["diff", "--name-only", "HEAD", "--", ...evidenceInputs],
    repositoryRoot,
  );
  if (dirtyInputs) {
    throw new Error(
      `exact_head_jacket_gate_inputs_dirty:${dirtyInputs.replaceAll("\n", ",")}`,
    );
  }

  const plan = buildVoxyJacketCanonGatePlan(exactHeadSha);
  const planErrors = validateVoxyJacketCanonGatePlan(plan);
  if (planErrors.length > 0) {
    throw new Error(`jacket_gate_plan_invalid:${planErrors.join(",")}`);
  }

  const canonEvidence = [];
  for (const board of VOXY_STATIC_CANON_BOARDS) {
    const path = repositoryPath(repositoryRoot, board.repositoryPath);
    const bytes = await readFile(path);
    const dimensions = pngDimensions(bytes);
    const actualSha256 = sha256(bytes);
    if (
      actualSha256 !== board.sha256 ||
      dimensions.width !== board.width ||
      dimensions.height !== board.height
    ) {
      throw new Error(`canon_board_contract_mismatch:${board.id}`);
    }
    canonEvidence.push({
      id: board.id,
      path: board.repositoryPath,
      sha256: actualSha256,
      ...dimensions,
    });
  }

  const outputRoot = resolve(
    process.cwd(),
    argument("output") ?? plan.output.outputDirectory,
  );
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });

  const sourcePaths = {
    canonStage: repositoryPath(repositoryRoot, plan.source.canonBoardPath),
    studioLockup: repositoryPath(
      repositoryRoot,
      VOXY_FIRST_EXPLAINER_STUDIO_LOCKUP_PATH,
    ),
    vogPin: repositoryPath(
      repositoryRoot,
      VOXY_STATIC_CANON_NATIVE_ASSETS.vogPin,
    ),
    edebattePocketMark: repositoryPath(
      repositoryRoot,
      VOXY_STATIC_CANON_NATIVE_ASSETS.edebattePocketMark,
    ),
  };
  const assets: VoxyFirstExplainerEmbeddedAssets = {
    canonStageDataUrl: dataUrl(await readFile(sourcePaths.canonStage), "image/png"),
    studioLockupDataUrl: dataUrl(
      await readFile(sourcePaths.studioLockup),
      "image/svg+xml",
    ),
    vogPinDataUrl: dataUrl(await readFile(sourcePaths.vogPin), "image/svg+xml"),
    edebattePocketMarkDataUrl: dataUrl(
      await readFile(sourcePaths.edebattePocketMark),
      "image/svg+xml",
    ),
  };

  const vogPinSvg = await readFile(sourcePaths.vogPin, "utf8");
  const pocketMarkSvg = await readFile(sourcePaths.edebattePocketMark, "utf8");
  if (!/>VOG<\/text>/.test(vogPinSvg) || !/>eDebatte<\/text>/.test(pocketMarkSvg)) {
    throw new Error("native_brand_asset_provenance_invalid");
  }

  const externalRequests: string[] = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    colorScheme: "dark",
  });
  const page = await context.newPage();
  page.on("request", (request) => {
    if (/^https?:/i.test(request.url())) externalRequests.push(request.url());
  });

  const candidateFrameIndex = 192;
  await settlePage(
    page,
    renderVoxyFirstExplainerFrameHtml({
      plan: buildVoxyFirstExplainerPlan(exactHeadSha),
      assets,
      frameIndex: candidateFrameIndex,
      format: "16:9",
    }),
  );

  const jacketFullPath = resolve(outputRoot, plan.output.jacketFullFileName);
  const lapelSourcePath = resolve(outputRoot, ".lapel-source.png");
  const pocketSourcePath = resolve(outputRoot, ".pocket-source.png");
  await page.screenshot({
    path: jacketFullPath,
    type: "png",
    clip: plan.cropContract.jacket,
  });
  await page.screenshot({
    path: lapelSourcePath,
    type: "png",
    clip: plan.cropContract.lapelPin,
  });
  await page.screenshot({
    path: pocketSourcePath,
    type: "png",
    clip: plan.cropContract.pocketMark,
  });

  const jacket200PctPath = resolve(
    outputRoot,
    plan.output.jacket200PctFileName,
  );
  const lapel400PctPath = resolve(
    outputRoot,
    plan.output.lapelPin400PctFileName,
  );
  const pocket400PctPath = resolve(
    outputRoot,
    plan.output.pocketMark400PctFileName,
  );
  await scalePng({
    source: jacketFullPath,
    destination: jacket200PctPath,
    multiplier: 2,
    repositoryRoot,
  });
  await scalePng({
    source: lapelSourcePath,
    destination: lapel400PctPath,
    multiplier: 4,
    repositoryRoot,
  });
  await scalePng({
    source: pocketSourcePath,
    destination: pocket400PctPath,
    multiplier: 4,
    repositoryRoot,
  });

  await settlePage(page, renderCanonReferenceHtml(assets.canonStageDataUrl));
  const canonJacketPath = resolve(outputRoot, ".canon-jacket-source.png");
  await page.screenshot({
    path: canonJacketPath,
    type: "png",
    clip: plan.cropContract.jacket,
  });
  const comparisonPath = resolve(outputRoot, plan.output.comparisonFileName);
  await page.setViewportSize({ width: 1600, height: 900 });
  await settlePage(
    page,
    renderComparisonHtml({
      candidateDataUrl: dataUrl(await readFile(jacketFullPath), "image/png"),
      canonDataUrl: dataUrl(await readFile(canonJacketPath), "image/png"),
    }),
  );
  await page.locator(".board").screenshot({ path: comparisonPath, type: "png" });
  await browser.close();

  if (externalRequests.length > 0) {
    throw new Error(`external_requests_detected:${externalRequests.join(",")}`);
  }

  const outputFiles = [
    plan.output.jacketFullFileName,
    plan.output.jacket200PctFileName,
    plan.output.lapelPin400PctFileName,
    plan.output.pocketMark400PctFileName,
    plan.output.comparisonFileName,
  ];
  const outputs = Object.fromEntries(
    await Promise.all(
      outputFiles.map(async (file) => {
        const path = resolve(outputRoot, file);
        const bytes = await readFile(path);
        return [file, { file, sha256: sha256(bytes), ...pngDimensions(bytes) }];
      }),
    ),
  );

  const manifest = {
    schemaVersion: plan.schemaVersion,
    exactHeadSha,
    staticMasterSha: await fileSha256(sourcePaths.canonStage),
    canonHashes: plan.source.allCanonHashes,
    canonEvidence,
    hardCanonRegion: plan.hardCanonRegion,
    cropContract: plan.cropContract,
    comparison: plan.comparison,
    candidateFrameIndex,
    sourceAssets: {
      canonStage: {
        path: relative(repositoryRoot, sourcePaths.canonStage),
        sha256: await fileSha256(sourcePaths.canonStage),
      },
      vogPinOverlay: {
        path: relative(repositoryRoot, sourcePaths.vogPin),
        sha256: await fileSha256(sourcePaths.vogPin),
        textProvenance: "svg_source_contains_exact_text_vog",
      },
      edebattePocketOverlay: {
        path: relative(repositoryRoot, sourcePaths.edebattePocketMark),
        sha256: await fileSha256(sourcePaths.edebattePocketMark),
        textProvenance: "svg_source_contains_exact_text_edebatte",
      },
    },
    outputs,
    jacketCanonGate: plan.jacketCanonGate,
    brandQa: plan.brandQa,
    humanDecision: plan.humanDecision,
    layerMasterEligible: plan.layerMasterEligible,
    motionV3Eligible: plan.motionV3Eligible,
    animationEligible: plan.animationEligible,
    externalProviderUsed: plan.externalProviderUsed,
    externalUploadUsed: plan.externalUploadUsed,
    generativeReplacementUsed: plan.generativeReplacementUsed,
    humanVisualAcceptance: plan.humanVisualAcceptance,
    productionEligible: plan.productionEligible,
    autoPublish: plan.autoPublish,
    stopReason:
      "Jacket Canon Gate failed. No layer master or Motion v3 render is authorized.",
  };
  await writeFile(
    resolve(outputRoot, plan.output.manifestFileName),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  await rm(lapelSourcePath, { force: true });
  await rm(pocketSourcePath, { force: true });
  await rm(canonJacketPath, { force: true });

  process.stdout.write(
    `${JSON.stringify(
      {
        status: "jacket_canon_gate_failed",
        exactHeadSha,
        outputRoot: relative(process.cwd(), outputRoot),
        evidenceFiles: outputFiles,
        lapelPin: manifest.brandQa.lapelPin,
        pocketMark: manifest.brandQa.pocketMark,
        animationEligible: manifest.animationEligible,
        productionEligible: manifest.productionEligible,
        autoPublish: manifest.autoPublish,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? error.stack : String(error)}\n`,
  );
  process.exitCode = 1;
});
