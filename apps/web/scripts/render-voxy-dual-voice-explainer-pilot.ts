import { chromium, type Page } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { access, copyFile, lstat, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  VOXY_DUAL_VOICE_PILOT_AUDIO_SEGMENTS,
  VOXY_DUAL_VOICE_PILOT_OUTPUT,
  buildVoxyDualVoicePilotPlan,
  validateVoxyDualVoicePilotPlan,
} from "../src/features/voxyVideo/dualVoiceExplainerPilot";
import { renderVoxyDualVoicePilotFrameHtml } from "../src/features/voxyVideo/dualVoiceExplainerPilotHtml";
import { VOXY_SIGNATURE } from "../src/features/voxyVideo/dualVoiceArchitecture";
import { VOXY_FIRST_EXPLAINER_STUDIO_LOCKUP_PATH } from "../src/features/voxyVideo/firstExplainerVideo";
import {
  VOXY_CHATTERBOX_MODEL,
  VOXY_FIRST_PARTY_REFERENCE_WINDOWS,
} from "../src/features/voxyVideo/firstPartyVoiceClone";
import { VOXY_POCKET_MARK_COMPOSITION_SOURCE } from "../src/features/voxyVideo/pocketMarkFinalGate";
import {
  VOXY_SIGNATURE_DELIVERY_MODES,
  VOXY_SIGNATURE_MIN_P,
  VOXY_SIGNATURE_REPETITION_PENALTY,
  VOXY_SIGNATURE_TOP_P,
} from "../src/features/voxyVideo/signatureVoiceFinalPass";
import { VOXY_STATIC_CANON_NATIVE_ASSETS } from "../src/features/voxyVideo/staticCanonRecovery";
import type { VoxyMotionV4EmbeddedAssets } from "../src/features/voxyVideo/motionV4Html";

type Probe = { streams: Array<Record<string, string>>; format: Record<string, string> };

function argument(name: string): string | null {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? null;
}

function execute(binary: string, args: string[], options: { cwd?: string; input?: string; env?: NodeJS.ProcessEnv } = {}) {
  const result = spawnSync(binary, args, {
    cwd: options.cwd,
    input: options.input,
    env: { ...process.env, ...options.env },
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
  });
  if (result.status !== 0 || result.error) {
    throw new Error(`${path.basename(binary)}_failed:${result.error?.message ?? result.stderr.trim()}`);
  }
  return { stdout: result.stdout.trim(), stderr: result.stderr.trim() };
}

function run(binary: string, args: string[], options: { cwd?: string; input?: string; env?: NodeJS.ProcessEnv } = {}): string {
  return execute(binary, args, options).stdout;
}

async function sha256(file: string): Promise<string> {
  return createHash("sha256").update(await readFile(file)).digest("hex");
}

function ffprobe(file: string): Probe {
  return JSON.parse(run("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", file])) as Probe;
}

function durationMs(file: string): number {
  return Math.round(Number(ffprobe(file).format.duration) * 1_000);
}

function dataUrl(buffer: Buffer, mime: string): string {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

async function setHtml(page: Page, html: string): Promise<void> {
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.images).map((image) => image.decode()));
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
}

async function assertOutsideRepository(repositoryRoot: string, target: string, label: string): Promise<void> {
  const resolved = await realpath(target);
  const relative = path.relative(repositoryRoot, resolved);
  if (!relative.startsWith("..") || path.isAbsolute(relative) === false && relative === "") {
    throw new Error(`${label}_must_be_outside_repository`);
  }
}

async function normalizeAudio(input: string, output: string): Promise<void> {
  run("ffmpeg", [
    "-y", "-i", input,
    "-af", "loudnorm=I=-18:TP=-1.5:LRA=7",
    "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", output,
  ]);
}

async function synthesizeVoxySegments(input: {
  python: string;
  modelDir: string;
  reference: string;
  temporaryRoot: string;
  rawRoot: string;
}): Promise<Map<string, string>> {
  const window = VOXY_FIRST_PARTY_REFERENCE_WINDOWS.find((entry) => entry.id === "reference-01-segment-b")!;
  const referenceSegment = path.resolve(input.temporaryRoot, "voxy-reference-segment.wav");
  run("ffmpeg", [
    "-y", "-ss", String(window.startSeconds), "-to", String(window.endSeconds),
    "-i", input.reference, "-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le", referenceSegment,
  ]);
  const mode = VOXY_SIGNATURE_DELIVERY_MODES.find((entry) => entry.id === "candidate-e-signature")!;
  const selected = mode.variants.find((entry) => entry.id === "e-02-warm-sovereign")!;
  const spokenParts: Record<string, readonly string[]> = {
    "voxy-introduction": [
      "Hallo Nachbar, ich bin Woxi.",
      "Und ich möchte dir zeigen, warum eh Debatte mehr ist als eine weitere Plattform für politische Meinungen.",
    ],
    "voxy-problem": [
      "Nehmen wir eine politische Frage.",
      "Meistens begegnen uns dazu Schlagzeilen, einzelne Zahlen und ziemlich schnell zwei gegensätzliche Lager.",
    ],
    "voxy-return": [
      "Und genau hier komme ich wieder ins Spiel.",
      "Ich sage dir nicht, welche Seite recht hat.",
    ],
    "voxy-reflection": ["Ich helfe dir dabei, selbst herauszufinden, was du davon hältst."],
    "voxy-closing": ["Das ist eh Debatte.", "Und ich bin Woxi."],
  };
  const jobs = VOXY_DUAL_VOICE_PILOT_AUDIO_SEGMENTS
    .filter((segment) => segment.speakerRole === "voxy")
    .map((segment, jobIndex) => ({
      id: segment.id,
      modeId: mode.id,
      variantId: selected.id,
      situationId: "dual-voice-pilot",
      purpose: "accepted_voxy_signature_for_private_human_review_pilot",
      outputPath: path.resolve(input.rawRoot, `${segment.id}.wav`),
      referencePath: referenceSegment,
      seedOffset: 12_000 + jobIndex * 100,
      parameters: {
        ...selected,
        repetitionPenalty: VOXY_SIGNATURE_REPETITION_PENALTY,
        minP: VOXY_SIGNATURE_MIN_P,
        topP: VOXY_SIGNATURE_TOP_P,
      },
      segments: (spokenParts[segment.id] ?? [segment.spokenText]).map((spokenText, index, parts) => ({
        id: `${segment.id}-${index + 1}`,
        visibleText: spokenText,
        spokenText,
        pauseAfterMs: index < parts.length - 1 ? 280 : 0,
      })),
    }));
  const resultPath = path.resolve(input.temporaryRoot, "voxy-result.json");
  const configPath = path.resolve(input.temporaryRoot, "voxy-config.json");
  await writeFile(configPath, `${JSON.stringify({
    modelDir: input.modelDir,
    modelFiles: VOXY_CHATTERBOX_MODEL.files,
    device: argument("voxy-device") ?? "mps",
    resultPath,
    jobs,
  }, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  run(input.python, [path.resolve(import.meta.dirname, "lib/voxyChatterboxSignature.py"), "--config", configPath], {
    env: {
      HF_HUB_OFFLINE: "1",
      TRANSFORMERS_OFFLINE: "1",
      HF_HOME: path.dirname(input.modelDir),
      HTTPS_PROXY: "http://127.0.0.1:9",
      HTTP_PROXY: "http://127.0.0.1:9",
      ALL_PROXY: "http://127.0.0.1:9",
      NO_PROXY: "",
    },
  });
  const result = JSON.parse(await readFile(resultPath, "utf8")) as {
    runtimeNetworkRequests: number;
    jobs: Array<{ id: string; file: string; watermarkScore: number }>;
  };
  if (result.runtimeNetworkRequests !== 0 || result.jobs.some((job) => job.watermarkScore < 0.9)) {
    throw new Error("voxy_offline_or_watermark_gate_failed");
  }
  return new Map(result.jobs.map((job) => [job.id, job.file]));
}

async function synthesizeEditorialSegment(input: {
  mimic3Cache: string;
  segmentId: string;
  spokenText: string;
  rawRoot: string;
}): Promise<string> {
  const segmentRoot = path.resolve(input.rawRoot, `${input.segmentId}-mimic3`);
  await mkdir(segmentRoot, { recursive: true });
  const mimic3 = path.resolve(input.mimic3Cache, "mimic3-venv/bin/mimic3");
  run(mimic3, [
    "--voices-dir", path.resolve(input.mimic3Cache, "mimic3-voices"),
    "--voice", "de_DE/m-ailabs_low",
    "--speaker", "ramona_deininger",
    "--deterministic", "--noise-scale", "0", "--noise-w", "0",
    "--length-scale", "1.12",
    "--output-dir", segmentRoot, "--output-naming", "id", "--csv",
  ], {
    input: `speech|${input.spokenText.replaceAll("\n", " ")}\n`,
    env: { PIP_NO_INDEX: "1", HF_HUB_OFFLINE: "1", TRANSFORMERS_OFFLINE: "1", HTTPS_PROXY: "http://127.0.0.1:9" },
  });
  return path.resolve(segmentRoot, "speech.wav");
}

async function concatenateMaster(input: {
  finishedById: ReadonlyMap<string, string>;
  output: string;
  temporaryRoot: string;
}): Promise<void> {
  const files: string[] = [];
  const addSilence = (id: string, milliseconds: number) => {
    const file = path.resolve(input.temporaryRoot, `${id}.wav`);
    run("ffmpeg", ["-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", (milliseconds / 1_000).toFixed(3), "-c:a", "pcm_s16le", file]);
    files.push(file);
  };
  addSilence("leading-silence", 500);
  for (const segment of VOXY_DUAL_VOICE_PILOT_AUDIO_SEGMENTS) {
    files.push(input.finishedById.get(segment.id)!);
    if (segment.pauseAfterMs) addSilence(`pause-${segment.id}`, segment.pauseAfterMs);
  }
  addSilence("tail-silence", 700);
  const concatList = path.resolve(input.temporaryRoot, "master-concat.txt");
  await writeFile(concatList, files.map((file) => `file '${file.replaceAll("'", "'\\''")}'`).join("\n"), "utf8");
  run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", concatList, "-c:a", "pcm_s16le", input.output]);
}

function audioLevelsFromWav(buffer: Buffer, fps: number): number[] {
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") throw new Error("master_wav_invalid");
  const fmt = buffer.indexOf(Buffer.from("fmt "));
  const data = buffer.indexOf(Buffer.from("data"));
  if (fmt < 0 || data < 0) throw new Error("master_wav_chunks_missing");
  const channels = buffer.readUInt16LE(fmt + 10);
  const sampleRate = buffer.readUInt32LE(fmt + 12);
  const bits = buffer.readUInt16LE(fmt + 22);
  if (channels !== 1 || sampleRate !== 48_000 || bits !== 16) throw new Error("master_wav_pcm_contract_invalid");
  const start = data + 8;
  const samples = Math.floor((buffer.length - start) / 2);
  const frameCount = Math.ceil((samples * fps) / sampleRate);
  const values: number[] = [];
  const halfWindow = Math.round(sampleRate * 0.042);
  for (let frame = 0; frame < frameCount; frame += 1) {
    const center = Math.round((frame * sampleRate) / fps);
    let sum = 0;
    const from = Math.max(0, center - halfWindow);
    const to = Math.min(samples, center + halfWindow);
    for (let index = from; index < to; index += 1) {
      const sample = buffer.readInt16LE(start + index * 2) / 32768;
      sum += sample * sample;
    }
    values.push(Math.sqrt(sum / Math.max(1, to - from)));
  }
  const sorted = [...values].sort((a, b) => a - b);
  const reference = sorted[Math.floor(sorted.length * 0.96)] ?? 0.001;
  let smoothed = 0;
  return values.map((value) => {
    const gated = value < 0.004 ? 0 : Math.min(1, value / Math.max(0.001, reference));
    smoothed = gated > smoothed ? smoothed * 0.28 + gated * 0.72 : smoothed * 0.58 + gated * 0.42;
    return Math.round(smoothed * 16) / 16;
  });
}

async function main(): Promise<void> {
  const repositoryRoot = path.resolve(import.meta.dirname, "../../..");
  const exactHeadSha = process.env.VOXY_DUAL_VOICE_PILOT_COMMIT_SHA?.trim() ?? "";
  if (!/^[0-9a-f]{40}$/.test(exactHeadSha)) throw new Error("VOXY_DUAL_VOICE_PILOT_COMMIT_SHA_required");
  if (run("git", ["rev-parse", "HEAD"], { cwd: repositoryRoot }) !== exactHeadSha) throw new Error("exact_head_mismatch");
  const requiredArguments = ["voxy-python", "voxy-model-dir", "voxy-reference-01", "mimic3-cache"] as const;
  if (requiredArguments.some((name) => !argument(name))) throw new Error("explicit_private_voice_runtime_arguments_required");
  const voxyPython = path.resolve(argument("voxy-python")!);
  const voxyModelDir = path.resolve(argument("voxy-model-dir")!);
  const voxyReference = path.resolve(argument("voxy-reference-01")!);
  const mimic3Cache = path.resolve(argument("mimic3-cache")!);
  for (const target of [voxyPython, voxyModelDir, voxyReference, mimic3Cache]) await access(target);
  await assertOutsideRepository(repositoryRoot, voxyReference, "private_voxy_reference");
  if (!(await lstat(voxyReference)).isFile()) throw new Error("private_voxy_reference_must_be_file");

  const outputArgument = argument("output") ?? VOXY_DUAL_VOICE_PILOT_OUTPUT.directory;
  const outputRoot = path.resolve(repositoryRoot, outputArgument);
  const outputParentReal = await realpath(path.dirname(outputRoot));
  if (!path.relative(repositoryRoot, outputParentReal).startsWith("..")) throw new Error("private_output_parent_must_resolve_outside_repository");
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true, mode: 0o700 });
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "voxy-dual-voice-pilot-"));
  const rawRoot = path.resolve(temporaryRoot, "raw");
  const finishedRoot = path.resolve(temporaryRoot, "finished");
  const framesRoot = path.resolve(temporaryRoot, "frames");
  const standframesRoot = path.resolve(outputRoot, "standframes");
  await Promise.all([mkdir(rawRoot, { recursive: true }), mkdir(finishedRoot, { recursive: true }), mkdir(framesRoot, { recursive: true }), mkdir(standframesRoot, { recursive: true })]);

  try {
    console.info("pilot_progress:synthesize_voxy_signature");
    const voxyRaw = await synthesizeVoxySegments({ python: voxyPython, modelDir: voxyModelDir, reference: voxyReference, temporaryRoot, rawRoot });
    const rawById = new Map(voxyRaw);
    console.info("pilot_progress:synthesize_editorial_voice");
    for (const segment of VOXY_DUAL_VOICE_PILOT_AUDIO_SEGMENTS.filter((entry) => entry.speakerRole === "editorial")) {
      rawById.set(segment.id, await synthesizeEditorialSegment({ mimic3Cache, segmentId: segment.id, spokenText: segment.spokenText, rawRoot }));
    }
    const finishedById = new Map<string, string>();
    for (const segment of VOXY_DUAL_VOICE_PILOT_AUDIO_SEGMENTS) {
      const finished = path.resolve(finishedRoot, `${segment.id}.wav`);
      await normalizeAudio(rawById.get(segment.id)!, finished);
      finishedById.set(segment.id, finished);
    }
    const speechDurationsMs = VOXY_DUAL_VOICE_PILOT_AUDIO_SEGMENTS.map((segment) => durationMs(finishedById.get(segment.id)!));
    const plan = buildVoxyDualVoicePilotPlan(exactHeadSha, speechDurationsMs);
    const planErrors = validateVoxyDualVoicePilotPlan(plan);
    if (planErrors.length) throw new Error(`pilot_plan_invalid:${planErrors.join(",")}`);
    const masterAudio = path.resolve(outputRoot, VOXY_DUAL_VOICE_PILOT_OUTPUT.masterAudio);
    await concatenateMaster({ finishedById, output: masterAudio, temporaryRoot });
    if (Math.abs(durationMs(masterAudio) - plan.output.durationMs) > 120) throw new Error("master_audio_duration_drift");
    await writeFile(path.resolve(outputRoot, VOXY_DUAL_VOICE_PILOT_OUTPUT.speakerTimeline), `${JSON.stringify(plan.speakerTimeline.map(({ id: _id, ...entry }) => entry), null, 2)}\n`, "utf8");
    await writeFile(path.resolve(outputRoot, VOXY_DUAL_VOICE_PILOT_OUTPUT.visualStateTimeline), `${JSON.stringify(plan.visualStateTimeline, null, 2)}\n`, "utf8");

    const sourcePaths = {
      canonStage: path.resolve(repositoryRoot, VOXY_POCKET_MARK_COMPOSITION_SOURCE.repositoryPath),
      studioLockup: path.resolve(repositoryRoot, VOXY_FIRST_EXPLAINER_STUDIO_LOCKUP_PATH),
      lapelPin: path.resolve(repositoryRoot, VOXY_STATIC_CANON_NATIVE_ASSETS.lapelPin),
      edebattePocketMark: path.resolve(repositoryRoot, VOXY_STATIC_CANON_NATIVE_ASSETS.edebattePocketMark),
    };
    const assets: VoxyMotionV4EmbeddedAssets = {
      canonStageDataUrl: dataUrl(await readFile(sourcePaths.canonStage), "image/png"),
      studioLockupDataUrl: dataUrl(await readFile(sourcePaths.studioLockup), "image/svg+xml"),
      lapelPinDataUrl: dataUrl(await readFile(sourcePaths.lapelPin), "image/svg+xml"),
      edebattePocketMarkDataUrl: dataUrl(await readFile(sourcePaths.edebattePocketMark), "image/svg+xml"),
    };
    const frozenInputs = [
      VOXY_POCKET_MARK_COMPOSITION_SOURCE.repositoryPath,
      VOXY_STATIC_CANON_NATIVE_ASSETS.lapelPin,
      VOXY_STATIC_CANON_NATIVE_ASSETS.edebattePocketMark,
      "apps/web/src/features/voxyVideo/mouthRig.ts",
      "apps/web/src/features/voxyVideo/mouthV41.ts",
      "apps/web/src/features/voxyVideo/headRelativeFaceRigHtml.ts",
    ];
    if (spawnSync("git", ["diff", "--quiet", plan.visualMasterHeadSha, "--", ...frozenInputs], { cwd: repositoryRoot }).status !== 0) throw new Error("visual_canon_freeze_failed");
    const levels = audioLevelsFromWav(await readFile(masterAudio), plan.output.fps);
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: plan.output.width, height: plan.output.height }, deviceScaleFactor: 1, colorScheme: "dark" });
    const page = await context.newPage();
    const externalRequests: string[] = [];
    page.on("request", (request) => { if (/^https?:/i.test(request.url())) externalRequests.push(request.url()); });
    let renderedFrames = 0;
    console.info(`pilot_progress:render_${plan.output.frameCount}_frames`);
    for (let frameIndex = 0; frameIndex < plan.output.frameCount; frameIndex += 1) {
      const output = path.resolve(framesRoot, `frame-${String(frameIndex).padStart(5, "0")}.png`);
      if (frameIndex % 2 === 1) {
        await copyFile(path.resolve(framesRoot, `frame-${String(frameIndex - 1).padStart(5, "0")}.png`), output);
        continue;
      }
      await setHtml(page, renderVoxyDualVoicePilotFrameHtml({ plan, assets, frameIndex, amplitude: levels[frameIndex] ?? 0 }));
      await page.locator(".viewport").screenshot({ path: output, type: "png" });
      renderedFrames += 1;
      if (renderedFrames % 80 === 0) console.info(`pilot_progress:rendered_unique_frames=${renderedFrames}`);
    }
    await context.close();
    await browser.close();
    if (externalRequests.length) throw new Error("external_request_detected_during_render");

    const mp4 = path.resolve(outputRoot, VOXY_DUAL_VOICE_PILOT_OUTPUT.mp4);
    const webm = path.resolve(outputRoot, VOXY_DUAL_VOICE_PILOT_OUTPUT.webm);
    console.info("pilot_progress:encode_mp4");
    run("ffmpeg", ["-y", "-framerate", "24", "-i", path.resolve(framesRoot, "frame-%05d.png"), "-i", masterAudio, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", mp4]);
    console.info("pilot_progress:encode_webm");
    run("ffmpeg", ["-y", "-framerate", "24", "-i", path.resolve(framesRoot, "frame-%05d.png"), "-i", masterAudio, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "32", "-deadline", "good", "-cpu-used", "4", "-threads", "8", "-row-mt", "1", "-pix_fmt", "yuv420p", "-c:a", "libopus", "-b:a", "128k", "-shortest", webm]);

    const stateNames = ["HOST", "FOCUS", "EXPLAIN", "DOCK", "SYNTHESIS"] as const;
    const standframes = [];
    for (const stateName of stateNames) {
      const entry = plan.visualStateTimeline.find((state) => state.state === stateName)!;
      const at = stateName === "DOCK" ? entry.start + (entry.end - entry.start) * 0.68 : (entry.start + entry.end) / 2;
      const frameIndex = Math.min(plan.output.frameCount - 1, Math.floor(at * plan.output.fps));
      const file = path.resolve(standframesRoot, `${stateName.toLowerCase()}.png`);
      await copyFile(path.resolve(framesRoot, `frame-${String(frameIndex - (frameIndex % 2)).padStart(5, "0")}.png`), file);
      standframes.push({ state: stateName, at: Number(at.toFixed(3)), frameIndex, file: `standframes/${stateName.toLowerCase()}.png`, sha256: await sha256(file) });
    }
    await copyFile(path.resolve(standframesRoot, "synthesis.png"), path.resolve(outputRoot, VOXY_DUAL_VOICE_PILOT_OUTPUT.preview));
    run("ffmpeg", ["-y", ...standframes.flatMap((entry) => ["-i", path.resolve(outputRoot, entry.file)]), "-filter_complex", "[0:v]scale=360:203[a];[1:v]scale=360:203[b];[2:v]scale=360:203[c];[3:v]scale=360:203[d];[4:v]scale=360:203[e];[a][b][c][d][e]hstack=inputs=5", "-frames:v", "1", path.resolve(outputRoot, VOXY_DUAL_VOICE_PILOT_OUTPUT.contactSheet)]);

    const mp4Probe = ffprobe(mp4);
    const webmProbe = ffprobe(webm);
    const audioProbe = ffprobe(masterAudio);
    for (const [label, probe] of [["mp4", mp4Probe], ["webm", webmProbe]] as const) {
      const video = probe.streams.find((stream) => stream.codec_type === "video");
      const audio = probe.streams.find((stream) => stream.codec_type === "audio");
      const duration = Number(probe.format.duration);
      if (!video || !audio || Number(video.width) !== 1920 || Number(video.height) !== 1080 || video.avg_frame_rate !== "24/1" || duration < 45 || duration > 60) throw new Error(`${label}_technical_media_gate_failed`);
    }
    const files = {
      mp4: { file: VOXY_DUAL_VOICE_PILOT_OUTPUT.mp4, sha256: await sha256(mp4), ffprobe: mp4Probe },
      webm: { file: VOXY_DUAL_VOICE_PILOT_OUTPUT.webm, sha256: await sha256(webm), ffprobe: webmProbe },
      masterAudio: { file: VOXY_DUAL_VOICE_PILOT_OUTPUT.masterAudio, sha256: await sha256(masterAudio), ffprobe: audioProbe },
      preview: { file: VOXY_DUAL_VOICE_PILOT_OUTPUT.preview, sha256: await sha256(path.resolve(outputRoot, VOXY_DUAL_VOICE_PILOT_OUTPUT.preview)) },
      contactSheet: { file: VOXY_DUAL_VOICE_PILOT_OUTPUT.contactSheet, sha256: await sha256(path.resolve(outputRoot, VOXY_DUAL_VOICE_PILOT_OUTPUT.contactSheet)) },
      speakerTimeline: { file: VOXY_DUAL_VOICE_PILOT_OUTPUT.speakerTimeline, sha256: await sha256(path.resolve(outputRoot, VOXY_DUAL_VOICE_PILOT_OUTPUT.speakerTimeline)) },
      visualStateTimeline: { file: VOXY_DUAL_VOICE_PILOT_OUTPUT.visualStateTimeline, sha256: await sha256(path.resolve(outputRoot, VOXY_DUAL_VOICE_PILOT_OUTPUT.visualStateTimeline)) },
    };
    const manifest = {
      schemaVersion: plan.schemaVersion,
      artifactId: `voxy-dual-voice-explainer-pilot-01-${exactHeadSha.slice(0, 12)}`,
      exactHeadSha,
      technicalPilotGate: "passed",
      format: { width: plan.output.width, height: plan.output.height, fps: plan.output.fps, durationMs: plan.output.durationMs, frameCount: plan.output.frameCount },
      voices: {
        voxy: { role: "voxy", voiceId: VOXY_SIGNATURE.voiceId, selectedVariantId: "e-02-warm-sovereign", gender: "male", privateReferencePathWithheld: true, localOfflineSynthesis: true },
        editorial: { role: "editorial", voiceId: "de_DE/m-ailabs_low#ramona_deininger", gender: "female", localOfflineSynthesis: true },
      },
      speakerTimeline: plan.speakerTimeline,
      visualStateTimeline: plan.visualStateTimeline,
      evidence: plan.evidence,
      mouth: { ...plan.mouth, editorialFramesUseNeutralMouth: true, voxyOnlyLipSync: true },
      waveform: plan.waveform,
      visualCanon: { frozen: true, visualMasterHeadSha: plan.visualMasterHeadSha, sourceAssets: Object.fromEntries(await Promise.all(Object.entries(sourcePaths).map(async ([id, file]) => [id, { repositoryPath: path.relative(repositoryRoot, file), sha256: await sha256(file) }]))), characterRedesign: false, studioRedesign: false },
      rendering: { renderedFrames, duplicatedAdjacentFrames: plan.output.frameCount - renderedFrames, runtimeNetworkRequests: 0, externalVisualUploadUsed: false },
      privacy: { ...plan.privacy, artifactStoredOutsideGitWorktreeViaIgnoredLocalSymlink: true, privateRawReferencesInRepository: false, privateReferencePathsRecorded: false },
      files,
      standframes,
      humanPilotAcceptance: "pending",
      productionEligible: false,
      autoPublish: false,
      knownDeviations: [
        "private_human_review_required_for_voice_naturalness_and_final_visual_rhythm",
        "voxy_mouth_sync_uses_smoothed_audio_amplitude_not_phoneme_alignment",
        "twelve_unique_visual_updates_per_second_are_frame_doubled_to_twenty_four_fps",
        "demo_fixture_objects_show_format_behavior_and_are_not_real_sources_or_statistics",
      ],
    };
    await writeFile(path.resolve(outputRoot, VOXY_DUAL_VOICE_PILOT_OUTPUT.manifest), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    console.info(JSON.stringify({ status: "VOXY_DUAL_VOICE_PILOT_PASS", exactHeadSha, artifactId: manifest.artifactId, output: outputArgument, durationMs: plan.output.durationMs, fps: 24, resolution: "1920x1080", humanPilotAcceptance: "pending", productionEligible: false, autoPublish: false }, null, 2));
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
