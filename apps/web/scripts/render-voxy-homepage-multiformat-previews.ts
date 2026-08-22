import { chromium, type Page } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  buildVoxyHomepageReferenceFilmPlan,
  filmSegments,
  validateVoxyHomepageReferenceFilmPlan,
  type VoxyHomepageFilmId,
} from "../src/features/voxyVideo/homepageReferenceFilms";
import {
  contextualizeVoxyHomepageReferenceFilmPlan,
  validateVoxyHomepageContextIsolation,
} from "../src/features/voxyVideo/homepageReferenceFilmsContext";
import {
  VOXY_HOMEPAGE_FILM_LAYOUT_PROFILE_IDS,
  type HomepageFilmLayoutProfile,
} from "../src/features/voxyVideo/homepageReferenceFilmLayouts";
import { renderVoxyHomepageReferenceFilmFrameHtml } from "../src/features/voxyVideo/homepageReferenceFilmsHtml";
import { VOXY_FIRST_EXPLAINER_STUDIO_LOCKUP_PATH } from "../src/features/voxyVideo/firstExplainerVideo";
import { VOXY_POCKET_MARK_COMPOSITION_SOURCE } from "../src/features/voxyVideo/pocketMarkFinalGate";
import { VOXY_STATIC_CANON_NATIVE_ASSETS } from "../src/features/voxyVideo/staticCanonRecovery";
import type { VoxyMotionV4EmbeddedAssets } from "../src/features/voxyVideo/motionV4Html";
import {
  assertOutsideRepository,
  dataUrl,
  setHtml,
} from "./render-voxy-dual-voice-explainer-pilot";

const REVIEW_MOMENTS = {
  voiceopengov: [
    ["opening", "vog-greeting", 0.2],
    ["process", "vog-after-election", 0.55],
    ["programme-decision", "vog-program-not-contract", 0.86],
    ["democratic-guardrails", "vog-demophobie", 0.86],
    ["participation", "vog-participation-balance", 0.5],
    ["current-offer-next-step", "vog-current-offer", 0.5],
    ["final-cta", "vog-cta", 0.65],
  ],
  edebatte: [
    ["opening", "edebatte-greeting", 0.15],
    ["headline", "edebatte-election-noise", 0.75],
    ["primary-source", "edebatte-source-questions", 0.86],
    ["media-forensics", "edebatte-media-forensics", 0.86],
    ["evidence-path", "edebatte-product-model", 0.55],
    ["synthesis", "edebatte-synthesis-questions", 0.7],
    ["final-cta", "edebatte-cta", 0.65],
  ],
} as const satisfies Record<
  VoxyHomepageFilmId,
  readonly (readonly [string, string, number])[]
>;

type PreviewTarget = Readonly<{
  filmId: VoxyHomepageFilmId;
  layoutProfile: HomepageFilmLayoutProfile;
  moments: readonly (readonly [string, string, number])[];
}>;

const SOCIAL_CHROME_V3_10_2_TARGETS = [
  {
    filmId: "voiceopengov",
    layoutProfile: "vertical_9_16",
    moments: [
      REVIEW_MOMENTS.voiceopengov[0],
      REVIEW_MOMENTS.voiceopengov[1],
      REVIEW_MOMENTS.voiceopengov[6],
    ],
  },
  {
    filmId: "voiceopengov",
    layoutProfile: "feed_4_5",
    moments: [REVIEW_MOMENTS.voiceopengov[0], REVIEW_MOMENTS.voiceopengov[1]],
  },
  {
    filmId: "edebatte",
    layoutProfile: "vertical_9_16",
    moments: [
      REVIEW_MOMENTS.edebatte[0],
      REVIEW_MOMENTS.edebatte[4],
      REVIEW_MOMENTS.edebatte[6],
    ],
  },
  {
    filmId: "edebatte",
    layoutProfile: "feed_4_5",
    moments: [REVIEW_MOMENTS.edebatte[0]],
  },
  {
    filmId: "voiceopengov",
    layoutProfile: "square_1_1",
    moments: [REVIEW_MOMENTS.voiceopengov[1]],
  },
  {
    filmId: "voiceopengov",
    layoutProfile: "landscape_16_9",
    moments: [REVIEW_MOMENTS.voiceopengov[1]],
  },
] as const satisfies readonly PreviewTarget[];

const BROADCAST_CRISP_V3_10_3_TARGETS = [
  {
    filmId: "voiceopengov",
    layoutProfile: "vertical_9_16",
    moments: [REVIEW_MOMENTS.voiceopengov[1]],
  },
  {
    filmId: "voiceopengov",
    layoutProfile: "feed_4_5",
    moments: [REVIEW_MOMENTS.voiceopengov[1]],
  },
  {
    filmId: "edebatte",
    layoutProfile: "vertical_9_16",
    moments: [REVIEW_MOMENTS.edebatte[4]],
  },
  {
    filmId: "edebatte",
    layoutProfile: "feed_4_5",
    moments: [REVIEW_MOMENTS.edebatte[4]],
  },
  {
    filmId: "edebatte",
    layoutProfile: "landscape_16_9",
    moments: [REVIEW_MOMENTS.edebatte[2]],
  },
  {
    filmId: "edebatte",
    layoutProfile: "square_1_1",
    moments: [REVIEW_MOMENTS.edebatte[2]],
  },
  {
    filmId: "voiceopengov",
    layoutProfile: "landscape_16_9",
    moments: [REVIEW_MOMENTS.voiceopengov[1]],
  },
] as const satisfies readonly PreviewTarget[];

function cliArgument(name: string): string | null {
  const prefix = `--${name}=`;
  return process.argv.find((entry) => entry.startsWith(prefix))?.slice(prefix.length) ?? null;
}

function exactHead(repositoryRoot: string): string {
  const result = spawnSync("git", ["rev-parse", "HEAD"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  if (result.status !== 0) throw new Error("preview_exact_head_unavailable");
  return result.stdout.trim();
}

function buildPreviewPlan(
  filmId: VoxyHomepageFilmId,
  layoutProfile: HomepageFilmLayoutProfile,
  head: string,
) {
  const contextMode = filmId === "voiceopengov" ? "evergreen" : "election_window";
  const durationMs = filmId === "voiceopengov" ? 7_500 : 6_400;
  const raw = buildVoxyHomepageReferenceFilmPlan({
    filmId,
    contextMode,
    exactHeadSha: head,
    speechDurationsMs: Array.from(
      { length: filmSegments(filmId, contextMode).length },
      () => durationMs,
    ),
    layoutProfile,
  });
  const errors = validateVoxyHomepageReferenceFilmPlan(raw);
  if (errors.length) throw new Error(`preview_plan_invalid:${filmId}:${layoutProfile}:${errors}`);
  const plan = contextualizeVoxyHomepageReferenceFilmPlan(raw);
  const contextErrors = validateVoxyHomepageContextIsolation(plan);
  if (contextErrors.length) {
    throw new Error(`preview_context_invalid:${filmId}:${layoutProfile}:${contextErrors}`);
  }
  return plan;
}

async function contactSheet(input: {
  page: Page;
  files: readonly string[];
  labels: readonly string[];
  output: string;
  aspectRatio: number;
}): Promise<void> {
  const cellWidth = 250;
  const imageHeight = Math.round(cellWidth * input.aspectRatio);
  const cells = await Promise.all(
    input.files.map(async (file, index) => {
      const source = dataUrl(await readFile(file), "image/png");
      return `<figure><img src="${source}" alt=""><figcaption>${input.labels[index]}</figcaption></figure>`;
    }),
  );
  const width = cellWidth * 4 + 60;
  const height = (imageHeight + 44) * 2 + 30;
  await input.page.setViewportSize({ width, height });
  await input.page.setContent(`<!doctype html><html><head><style>*{box-sizing:border-box}html,body{margin:0;background:#010511;color:#dcebf5;font-family:Arial,sans-serif}main{display:grid;grid-template-columns:repeat(4,${cellWidth}px);gap:12px;padding:12px}figure{margin:0;background:#071329;border:1px solid #244565}img{display:block;width:${cellWidth}px;height:${imageHeight}px;object-fit:contain;background:#010511}figcaption{height:32px;padding:9px 10px;font-size:11px;font-weight:800;letter-spacing:.04em}</style></head><body><main>${cells.join("")}</main></body></html>`, { waitUntil: "load" });
  await input.page.screenshot({ path: input.output, type: "png" });
}

async function main(): Promise<void> {
  const repositoryRoot = path.resolve(import.meta.dirname, "../../..");
  const reviewSet = cliArgument("review-set");
  if (
    reviewSet !== null
    && reviewSet !== "social-chrome-v3-10-2"
    && reviewSet !== "broadcast-crisp-v3-10-3"
  ) {
    throw new Error(`unsupported_preview_review_set:${reviewSet}`);
  }
  const outputRoot = path.resolve(
    cliArgument("output") ?? path.join(
      process.env.TMPDIR ?? "/tmp",
      reviewSet === "broadcast-crisp-v3-10-3"
        ? "voxy-homepage-v3-10-3-previews"
        : reviewSet === "social-chrome-v3-10-2"
          ? "voxy-homepage-v3-10-2-previews"
          : "voxy-homepage-v3-10-1-previews",
    ),
  );
  await mkdir(outputRoot, { recursive: true, mode: 0o700 });
  await assertOutsideRepository(repositoryRoot, outputRoot, "private_multiformat_preview_output");
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true, mode: 0o700 });

  const sourcePaths = {
    canonStage: path.resolve(repositoryRoot, VOXY_POCKET_MARK_COMPOSITION_SOURCE.repositoryPath),
    studioLockup: path.resolve(repositoryRoot, VOXY_FIRST_EXPLAINER_STUDIO_LOCKUP_PATH),
    lapelPin: path.resolve(repositoryRoot, VOXY_STATIC_CANON_NATIVE_ASSETS.lapelPin),
    edebattePocketMark: path.resolve(
      repositoryRoot,
      VOXY_STATIC_CANON_NATIVE_ASSETS.edebattePocketMark,
    ),
  };
  const assets: VoxyMotionV4EmbeddedAssets = {
    canonStageDataUrl: dataUrl(await readFile(sourcePaths.canonStage), "image/png"),
    studioLockupDataUrl: dataUrl(await readFile(sourcePaths.studioLockup), "image/svg+xml"),
    lapelPinDataUrl: dataUrl(await readFile(sourcePaths.lapelPin), "image/svg+xml"),
    edebattePocketMarkDataUrl: dataUrl(
      await readFile(sourcePaths.edebattePocketMark),
      "image/svg+xml",
    ),
  };

  const head = exactHead(repositoryRoot);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ colorScheme: "dark" });
  const manifest = [] as Array<Record<string, unknown>>;
  const targets: readonly PreviewTarget[] = reviewSet === "broadcast-crisp-v3-10-3"
    ? BROADCAST_CRISP_V3_10_3_TARGETS
    : reviewSet === "social-chrome-v3-10-2"
      ? SOCIAL_CHROME_V3_10_2_TARGETS
      : (["voiceopengov", "edebatte"] as const).flatMap((filmId) =>
          VOXY_HOMEPAGE_FILM_LAYOUT_PROFILE_IDS.map((layoutProfile) => ({
            filmId,
            layoutProfile,
            moments: REVIEW_MOMENTS[filmId],
          })),
        );

  try {
    for (const { filmId, layoutProfile, moments } of targets) {
      const plan = buildPreviewPlan(filmId, layoutProfile, head);
      const profileRoot = path.resolve(outputRoot, filmId, layoutProfile);
      await mkdir(profileRoot, { recursive: true, mode: 0o700 });
      const files: string[] = [];
      const labels: string[] = [];
      await page.setViewportSize({ width: plan.output.width, height: plan.output.height });

      for (const [label, segmentId, progress] of moments) {
        const segment = plan.speakerTimeline.find((entry) => entry.id === segmentId);
        if (!segment) throw new Error(`preview_segment_missing:${filmId}:${segmentId}`);
        const at = segment.start + (segment.end - segment.start) * progress;
        const file = path.resolve(profileRoot, `${label}.png`);
        await setHtml(
          page,
          renderVoxyHomepageReferenceFilmFrameHtml({
            plan,
            assets,
            frameIndex: Math.floor(at * plan.output.fps),
            amplitude: 0.35,
          }),
        );
        await page.locator(".viewport").screenshot({ path: file, type: "png" });
        files.push(file);
        labels.push(label);
      }

      const sheet = path.resolve(profileRoot, "contact-sheet.png");
      await contactSheet({
        page,
        files,
        labels,
        output: sheet,
        aspectRatio: plan.output.height / plan.output.width,
      });
      manifest.push({
        filmId,
        layoutProfile,
        output: plan.layout.output,
        safeArea: plan.layout.safeArea,
        frames: labels,
        contactSheet: path.relative(outputRoot, sheet),
      });
    }
  } finally {
    await page.close();
    await browser.close();
  }

  await writeFile(
    path.resolve(outputRoot, "preview-manifest.json"),
    `${JSON.stringify({
      schemaVersion: reviewSet === "broadcast-crisp-v3-10-3"
        ? "voxy-homepage-broadcast-crisp-preview-v3-10-3"
        : reviewSet === "social-chrome-v3-10-2"
          ? "voxy-homepage-social-chrome-cleanup-preview-v3-10-2"
          : "voxy-homepage-multiformat-preview-v3-10-1",
      mobileReadabilityLock: "v3-10",
      journeySemanticSync: "v3-10-1",
      socialChromeCleanup: reviewSet === null ? null : "v3-10-2",
      broadcastCrispPolish: reviewSet === "broadcast-crisp-v3-10-3" ? "v3-10-3" : null,
      d1PronunciationAlias: reviewSet === "broadcast-crisp-v3-10-3" ? "Weg:/veːk/" : null,
      exactHeadSha: head,
      previews: manifest,
      humanHomepageFilmAcceptance: "pending",
      humanNews5VisualAcceptance: "pending",
      productionEligible: false,
      autoPublish: false,
      homepageIntegrationIncluded: false,
    }, null, 2)}\n`,
    "utf8",
  );
  console.info(`voxy_homepage_multiformat_previews_ready:${outputRoot}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
