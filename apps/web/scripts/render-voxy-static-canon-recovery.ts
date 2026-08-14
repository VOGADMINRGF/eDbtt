import { chromium, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import {
  buildVoxyStaticCanonRecoveryPlan,
  validateVoxyStaticCanonRecoveryPlan,
  VOXY_STATIC_CANON_NATIVE_ASSETS,
  VOXY_STATIC_CANON_PIXEL_SOURCE,
} from "../src/features/voxyVideo/staticCanonRecovery";
import {
  renderVoxyStaticCanonCandidateHtml,
  renderVoxyStaticCanonComparisonHtml,
} from "../src/features/voxyVideo/staticCanonRecoveryHtml";

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

function runBinary(binary: string, args: string[]): string {
  const result = spawnSync(binary, args, { encoding: "utf8" });
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

async function setStaticHtml(page: Page, html: string): Promise<void> {
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    const images = Array.from(document.images);
    await Promise.all(
      images.map(async (image) => {
        await image.decode();
      }),
    );
    await new Promise<void>((resolveFrame) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolveFrame()));
    });
  });
}

async function main(): Promise<void> {
  const exactHeadSha = process.env.VOXY_STATIC_CANON_COMMIT_SHA?.trim() ?? "";
  if (!/^[0-9a-f]{40}$/.test(exactHeadSha)) {
    throw new Error("VOXY_STATIC_CANON_COMMIT_SHA_must_be_exact_40_char_sha");
  }

  const webRoot = resolve(import.meta.dirname, "..");
  const repositoryRoot = resolve(webRoot, "../..");
  const currentHead = runBinary("git", ["rev-parse", "HEAD"]);
  if (currentHead !== exactHeadSha) {
    throw new Error(`exact_head_mismatch:${currentHead}:${exactHeadSha}`);
  }

  const evidenceInputPaths = [
    ".github/workflows/voxy-static-canon-recovery.yml",
    "apps/web/scripts/render-voxy-static-canon-recovery.ts",
    "apps/web/src/features/voxyVideo/staticCanonRecovery.ts",
    "apps/web/src/features/voxyVideo/staticCanonRecoveryHtml.ts",
    "apps/web/public/brands/voxy/references/canon",
    VOXY_STATIC_CANON_NATIVE_ASSETS.wordmark,
  ];
  const dirtyInputs = runBinary("git", [
    "diff",
    "--name-only",
    "HEAD",
    "--",
    ...evidenceInputPaths,
  ]);
  if (dirtyInputs) {
    throw new Error(
      `exact_head_static_canon_inputs_dirty:${dirtyInputs.replaceAll("\n", ",")}`,
    );
  }

  const plan = buildVoxyStaticCanonRecoveryPlan(exactHeadSha);
  const planErrors = validateVoxyStaticCanonRecoveryPlan(plan);
  if (planErrors.length > 0) {
    throw new Error(`static_canon_plan_invalid:${planErrors.join(",")}`);
  }

  const canonManifestPath = repositoryPath(
    repositoryRoot,
    "apps/web/public/brands/voxy/references/canon/manifest.json",
  );
  const canonManifest = JSON.parse(
    await readFile(canonManifestPath, "utf8"),
  ) as { files?: Array<{ filename?: string; sha256?: string }> };
  const canonBoardEvidence = [];
  const canonBoardDataUrls = [];
  for (const board of plan.canonBoards) {
    const path = repositoryPath(repositoryRoot, board.repositoryPath);
    const bytes = await readFile(path);
    const dimensions = pngDimensions(bytes);
    const actualSha256 = sha256(bytes);
    const manifestEntry = canonManifest.files?.find((entry) =>
      board.repositoryPath.endsWith(`/${entry.filename ?? ""}`),
    );
    if (
      actualSha256 !== board.sha256 ||
      manifestEntry?.sha256 !== board.sha256 ||
      dimensions.width !== board.width ||
      dimensions.height !== board.height
    ) {
      throw new Error(`canon_board_contract_mismatch:${board.id}`);
    }
    canonBoardEvidence.push({
      id: board.id,
      path: board.repositoryPath,
      sha256: actualSha256,
      width: dimensions.width,
      height: dimensions.height,
      role: board.role,
    });
    canonBoardDataUrls.push({
      id: board.id,
      dataUrl: dataUrl(bytes, "image/png"),
    });
  }

  const outputRoot = resolve(
    process.cwd(),
    argument("output") ?? "artifacts/voxy-static-canon-recovery",
  );
  await mkdir(outputRoot, { recursive: true });
  const stagePath = repositoryPath(
    repositoryRoot,
    VOXY_STATIC_CANON_PIXEL_SOURCE.repositoryPath,
  );
  const wordmarkPath = repositoryPath(
    repositoryRoot,
    VOXY_STATIC_CANON_NATIVE_ASSETS.wordmark,
  );
  const embeddedAssets = {
    canonStageDataUrl: dataUrl(await readFile(stagePath), "image/png"),
    wordmarkDataUrl: dataUrl(await readFile(wordmarkPath), "image/svg+xml"),
  };

  const externalRequests: string[] = [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: plan.output.width, height: plan.output.height },
    deviceScaleFactor: 1,
    colorScheme: "dark",
  });
  const page = await context.newPage();
  page.on("request", (request) => {
    if (/^https?:/i.test(request.url())) externalRequests.push(request.url());
  });

  const candidateDataUrls = {} as Record<
    (typeof plan.candidates)[number]["id"],
    string
  >;
  const candidateEvidence = [];
  for (const candidate of plan.candidates) {
    await page.setViewportSize({
      width: plan.output.width,
      height: plan.output.height,
    });
    await setStaticHtml(
      page,
      renderVoxyStaticCanonCandidateHtml({
        plan,
        candidate,
        assets: embeddedAssets,
      }),
    );
    const outputPath = resolve(outputRoot, candidate.fileName);
    const bytes = await page.locator(".master").screenshot({
      path: outputPath,
      type: "png",
    });
    const dimensions = pngDimensions(bytes);
    if (
      dimensions.width !== plan.output.width ||
      dimensions.height !== plan.output.height ||
      bytes.length < 250_000
    ) {
      throw new Error(`candidate_render_contract_failed:${candidate.id}`);
    }
    candidateDataUrls[candidate.id] = dataUrl(bytes, "image/png");
    candidateEvidence.push({
      id: candidate.id,
      file: candidate.fileName,
      sha256: sha256(bytes),
      width: dimensions.width,
      height: dimensions.height,
      mode: candidate.mode,
      characterPixelSource: candidate.characterPixelSource,
      camera: candidate.camera,
      knownDeviations: candidate.knownDeviations,
    });
  }

  await page.setViewportSize({
    width: plan.output.comparisonWidth,
    height: plan.output.comparisonHeight,
  });
  await setStaticHtml(
    page,
    renderVoxyStaticCanonComparisonHtml({
      candidateDataUrls,
      canonBoards: canonBoardDataUrls,
    }),
  );
  const comparisonPath = resolve(outputRoot, "comparison.png");
  const comparisonBytes = await page.locator(".sheet").screenshot({
    path: comparisonPath,
    type: "png",
  });
  const comparisonDimensions = pngDimensions(comparisonBytes);
  if (
    comparisonDimensions.width !== plan.output.comparisonWidth ||
    comparisonDimensions.height !== plan.output.comparisonHeight
  ) {
    throw new Error("comparison_render_contract_failed");
  }
  await context.close();
  await browser.close();
  if (externalRequests.length > 0) {
    throw new Error("external_request_detected");
  }

  const candidateHashes = new Set(
    candidateEvidence.map((candidate) => candidate.sha256),
  );
  if (candidateHashes.size !== plan.candidates.length) {
    throw new Error("candidate_variants_must_be_visibly_distinct");
  }

  const manifest = {
    schemaVersion: plan.schemaVersion,
    exactHeadSha,
    canonBoardPaths: canonBoardEvidence.map((board) => board.path),
    canonBoardSha256: Object.fromEntries(
      canonBoardEvidence.map((board) => [board.id, board.sha256]),
    ),
    canonBoards: canonBoardEvidence,
    sourceAssets: [
      {
        role: "identical_character_and_studio_pixel_source",
        path: VOXY_STATIC_CANON_PIXEL_SOURCE.repositoryPath,
        sha256: await fileSha256(stagePath),
      },
      {
        role: "native_editable_wordmark",
        path: VOXY_STATIC_CANON_NATIVE_ASSETS.wordmark,
        sha256: await fileSha256(wordmarkPath),
      },
    ],
    renderResolution: {
      candidates: { width: plan.output.width, height: plan.output.height },
      comparison: {
        width: plan.output.comparisonWidth,
        height: plan.output.comparisonHeight,
      },
    },
    productionMethod: plan.productionMethod,
    candidates: candidateEvidence,
    comparison: {
      file: "comparison.png",
      sha256: sha256(comparisonBytes),
      width: comparisonDimensions.width,
      height: comparisonDimensions.height,
    },
    visualQualityReview: {
      character: {
        status: "human_review_required",
        evidence:
          "CANON-04 character pixels are the identical source for A/B/C; CANON-01 and CANON-02 remain the direct character and hand references.",
      },
      render: {
        status: "human_review_required",
        evidence:
          "Dimensional material, shadow, highlights and studio depth are preserved from the human-approved raster canon without a generative redraw.",
      },
      studio: {
        status: "human_review_required",
        evidence:
          "CANON-04 is the pixel source; CANON-03 and CANON-04 define lighting, microphone, desk, waveform and spatial hierarchy.",
      },
      layout: {
        status: "human_review_required",
        evidence:
          "Generated board copy is covered by native review zones; camera, crop, content space and lighting weight are the only candidate differences.",
      },
    },
    knownCanonDeviations: [
      "candidates_are_flattened_review_composites_not_layered_character_or_studio_masters",
      "source_board_lighting_and_character_pose_are_baked_into_the_canon_04_pixel_source",
      "native_review_typography_and_empty_content_zones_require_later_product_copy_and_layout_acceptance",
      "no_animation_or_rig_eligibility_is_inferred_from_static_fidelity",
    ],
    previousMotion: plan.previousMotion,
    externalProviderUsed: plan.externalProviderUsed,
    externalUploadUsed: plan.externalUploadUsed,
    generativeRedrawUsed: plan.generativeRedrawUsed,
    humanVisualAcceptance: plan.humanVisualAcceptance,
    animationEligible: plan.animationEligible,
    productionEligible: plan.productionEligible,
    autoPublish: plan.autoPublish,
  };
  const manifestPath = resolve(outputRoot, "manifest.json");
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  process.stdout.write(
    `${JSON.stringify(
      {
        status: "voxy_static_canon_recovery_rendered",
        exactHeadSha,
        outputRoot: relative(process.cwd(), outputRoot),
        manifest: relative(process.cwd(), manifestPath),
        candidates: candidateEvidence.map((candidate) => ({
          file: candidate.file,
          sha256: candidate.sha256,
        })),
        comparison: {
          file: "comparison.png",
          sha256: manifest.comparison.sha256,
        },
        humanVisualAcceptance: manifest.humanVisualAcceptance,
        animationEligible: manifest.animationEligible,
        productionEligible: manifest.productionEligible,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exitCode = 1;
});
