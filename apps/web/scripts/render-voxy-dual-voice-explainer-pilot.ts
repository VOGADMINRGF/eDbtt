import { chromium, type Page } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { access, copyFile, lstat, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  VOXY_DUAL_VOICE_PILOT_AUDIO_SEGMENTS,
  VOXY_DUAL_VOICE_PILOT_OUTPUT,
  assertVoxyPilotVoiceBinding,
  buildVoxyDualVoicePilotSrt,
  buildVoxyDualVoicePilotVtt,
  buildVoxyDualVoicePilotPlan,
  validateVoxyDualVoicePilotPlan,
} from "../src/features/voxyVideo/dualVoiceExplainerPilot";
import { renderVoxyDualVoicePilotFrameHtml } from "../src/features/voxyVideo/dualVoiceExplainerPilotHtml";
import { VOXY_SIGNATURE } from "../src/features/voxyVideo/dualVoiceArchitecture";
import { VOXY_FIRST_EXPLAINER_STUDIO_LOCKUP_PATH } from "../src/features/voxyVideo/firstExplainerVideo";
import { VOXY_CHATTERBOX_MODEL } from "../src/features/voxyVideo/firstPartyVoiceClone";
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

function sha256Buffer(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

function ffprobe(file: string): Probe {
  return JSON.parse(run("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", file])) as Probe;
}

function privacySafeProbe(probe: Probe): Probe {
  return {
    ...probe,
    format: {
      ...probe.format,
      ...(probe.format.filename ? { filename: path.basename(probe.format.filename) } : {}),
    },
  };
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

async function verifyAcceptedVoxyReference(input: {
  repositoryRoot: string;
  reference: string;
  selectionManifest: string;
}): Promise<{ expectedSegmentSha256: string; selectionManifestSha256: string }> {
  await assertOutsideRepository(input.repositoryRoot, input.reference, "private_voxy_reference");
  await assertOutsideRepository(input.repositoryRoot, input.selectionManifest, "private_voxy_reference_selection");
  const selection = JSON.parse(await readFile(input.selectionManifest, "utf8")) as {
    schemaVersion?: string;
    references?: Array<{ id: string; sha256: string; originalPathWithheld: boolean; copiedIntoWorktree: boolean }>;
    selectedSegments?: Array<{ id: string; sha256: string; privatePathWithheld: boolean }>;
  };
  const reference = selection.references?.find((entry) => entry.id === "reference-01");
  const segment = selection.selectedSegments?.find((entry) => entry.id === "reference-01-segment-b");
  if (selection.schemaVersion !== "voxy-first-party-reference-selection-v1" || !reference || !segment) {
    throw new Error("accepted_voxy_reference_selection_invalid");
  }
  if (!reference.originalPathWithheld || reference.copiedIntoWorktree || !segment.privatePathWithheld) {
    throw new Error("accepted_voxy_reference_privacy_invalid");
  }
  if (await sha256(input.reference) !== reference.sha256) {
    throw new Error("accepted_voxy_reference_sha_mismatch");
  }
  return {
    expectedSegmentSha256: segment.sha256,
    selectionManifestSha256: await sha256(input.selectionManifest),
  };
}

async function normalizeAudio(input: string, output: string, tempo: number): Promise<void> {
  run("ffmpeg", [
    "-y", "-i", input,
    "-af", `atempo=${tempo.toFixed(6)},loudnorm=I=-18:TP=-1.5:LRA=7`,
    "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", output,
  ]);
}

async function synthesizeVoxySegments(input: {
  python: string;
  modelDir: string;
  reference: string;
  expectedReferenceSegmentSha256: string;
  temporaryRoot: string;
  rawRoot: string;
}): Promise<Map<string, string>> {
  const referenceSegment = path.resolve(input.temporaryRoot, "voxy-reference-segment.wav");
  run("ffmpeg", [
    "-y", "-ss", "59", "-to", "68.95",
    "-i", input.reference, "-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le", referenceSegment,
  ]);
  if (await sha256(referenceSegment) !== input.expectedReferenceSegmentSha256) {
    throw new Error("accepted_voxy_reference_segment_sha_mismatch");
  }
  const mode = VOXY_SIGNATURE_DELIVERY_MODES.find((entry) => entry.id === "candidate-e-signature")!;
  const selected = mode.variants.find((entry) => entry.id === "e-02-warm-sovereign")!;
  if (mode.selectedVariantId !== selected.id) throw new Error("accepted_voxy_variant_binding_invalid");
  const spokenParts: Record<string, readonly { text: string; pauseAfterMs: number }[]> = {
    "voxy-democracy-opening": [
      { text: "Hallo Nachbar.", pauseAfterMs: 360 },
      { text: "Wir wählen. Wir diskutieren. Wir streiten.", pauseAfterMs: 560 },
      { text: "Und trotzdem bleibt bei vielen Menschen eine ziemlich einfache Frage.", pauseAfterMs: 360 },
      { text: "Wird meine Stimme eigentlich gehört?", pauseAfterMs: 0 },
    ],
    "voxy-headline-limits": [
      { text: "Aber wenn wir wissen wollen, wie es unserer Demokratie wirklich geht,", pauseAfterMs: 260 },
      { text: "reicht eine Schlagzeile nicht.", pauseAfterMs: 0 },
    ],
    "voxy-distinction": [
      { text: "Genau deshalb trennen wir Gefühl, Befund und offene Frage.", pauseAfterMs: 0 },
    ],
    "voxy-democracy-reflection": [
      { text: "Vielleicht ist die spannendere Frage also nicht nur, ob Demokratie funktioniert.", pauseAfterMs: 440 },
      { text: "Sondern wo Menschen erleben, dass sie nicht mehr funktioniert.", pauseAfterMs: 0 },
    ],
    "voxy-verifiability": [
      { text: "Du musst mir dabei nichts glauben.", pauseAfterMs: 720 },
      { text: "Du sollst es prüfen können.", pauseAfterMs: 0 },
    ],
  };
  const jobs = VOXY_DUAL_VOICE_PILOT_AUDIO_SEGMENTS
    .filter((segment) => segment.speakerRole === "voxy")
    .map((segment, jobIndex) => {
      const binding = assertVoxyPilotVoiceBinding(segment);
      if (binding.synthesisBackend !== "chatterbox_multilingual_first_party") {
        throw new Error("voxy_synthesis_backend_mapping_invalid");
      }
      return {
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
      segments: (spokenParts[segment.id] ?? [{ text: segment.spokenText, pauseAfterMs: 0 }]).map((part, index, parts) => ({
        id: `${segment.id}-${index + 1}`,
        visibleText: part.text,
        spokenText: part.text,
        pauseAfterMs: index < parts.length - 1 ? part.pauseAfterMs : 0,
      })),
    };
    });
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
  speakerRole: "editorial";
  voiceId: string;
  spokenText: string;
  rawRoot: string;
}): Promise<string> {
  const binding = assertVoxyPilotVoiceBinding(input);
  if (binding.synthesisBackend !== "mimic3_m_ailabs_ramona_deininger") {
    throw new Error("editorial_synthesis_backend_mapping_invalid");
  }
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
  addSilence("leading-silence", 600);
  for (const segment of VOXY_DUAL_VOICE_PILOT_AUDIO_SEGMENTS) {
    files.push(input.finishedById.get(segment.id)!);
    if (segment.pauseAfterMs) addSilence(`pause-${segment.id}`, segment.pauseAfterMs);
  }
  addSilence("tail-silence", 800);
  const concatList = path.resolve(input.temporaryRoot, "master-concat.txt");
  await writeFile(concatList, files.map((file) => `file '${file.replaceAll("'", "'\\''")}'`).join("\n"), "utf8");
  run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", concatList, "-c:a", "pcm_s16le", input.output]);
}

function wavPcmData(buffer: Buffer): Buffer {
  const dataChunk = buffer.indexOf(Buffer.from("data"));
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE" || dataChunk < 0) {
    throw new Error("wav_pcm_data_invalid");
  }
  const byteLength = buffer.readUInt32LE(dataChunk + 4);
  return buffer.subarray(dataChunk + 8, dataChunk + 8 + byteLength);
}

async function verifyMasterAudioAssembly(input: {
  finishedById: ReadonlyMap<string, string>;
  masterAudio: string;
}) {
  const masterPcm = wavPcmData(await readFile(input.masterAudio));
  let cursorBytes = 600 * 48 * 2;
  const segments = [];
  for (const segment of VOXY_DUAL_VOICE_PILOT_AUDIO_SEGMENTS) {
    const binding = assertVoxyPilotVoiceBinding(segment);
    const finishedFile = input.finishedById.get(segment.id);
    if (!finishedFile) throw new Error(`finished_audio_missing:${segment.id}`);
    const finishedPcm = wavPcmData(await readFile(finishedFile));
    const masterWindow = masterPcm.subarray(cursorBytes, cursorBytes + finishedPcm.length);
    if (!finishedPcm.equals(masterWindow)) throw new Error(`master_audio_pcm_identity_mismatch:${segment.id}`);
    let absoluteSampleSum = 0;
    for (let offset = 0; offset < finishedPcm.length; offset += 2) {
      absoluteSampleSum += Math.abs(finishedPcm.readInt16LE(offset));
    }
    const meanAbsoluteSample = absoluteSampleSum / Math.max(1, finishedPcm.length / 2);
    if (meanAbsoluteSample < 80) throw new Error(`assembled_voice_segment_is_silent:${segment.id}`);
    segments.push({
      id: segment.id,
      speakerRole: segment.speakerRole,
      voiceId: segment.voiceId,
      genderPresentation: binding.genderPresentation,
      synthesisBackend: binding.synthesisBackend,
      finishedFileSha256: await sha256(finishedFile),
      masterWindowPcmSha256: sha256Buffer(masterWindow),
      pcmIdentityMatch: true,
      nonSilent: true,
    });
    cursorBytes += finishedPcm.length + segment.pauseAfterMs * 48 * 2;
  }
  return {
    gate: "passed",
    finalMasterContainsEveryVerifiedSegment: true,
    roleVoiceCrossing: false,
    segments,
  } as const;
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
  const requiredArguments = ["voxy-python", "voxy-model-dir", "voxy-reference-01", "voxy-reference-selection", "mimic3-cache"] as const;
  if (requiredArguments.some((name) => !argument(name))) throw new Error("explicit_private_voice_runtime_arguments_required");
  const voxyPython = path.resolve(argument("voxy-python")!);
  const voxyModelDir = path.resolve(argument("voxy-model-dir")!);
  const voxyReference = path.resolve(argument("voxy-reference-01")!);
  const voxyReferenceSelection = path.resolve(argument("voxy-reference-selection")!);
  const mimic3Cache = path.resolve(argument("mimic3-cache")!);
  for (const target of [voxyPython, voxyModelDir, voxyReference, voxyReferenceSelection, mimic3Cache]) await access(target);
  if (!(await lstat(voxyReference)).isFile()) throw new Error("private_voxy_reference_must_be_file");
  if (!(await lstat(voxyReferenceSelection)).isFile()) throw new Error("private_voxy_reference_selection_must_be_file");
  const acceptedVoxyReference = await verifyAcceptedVoxyReference({
    repositoryRoot,
    reference: voxyReference,
    selectionManifest: voxyReferenceSelection,
  });

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
    const masterAudio = path.resolve(outputRoot, VOXY_DUAL_VOICE_PILOT_OUTPUT.masterAudio);
    for (const segment of VOXY_DUAL_VOICE_PILOT_AUDIO_SEGMENTS) assertVoxyPilotVoiceBinding(segment);
    console.info("pilot_progress:synthesize_verified_male_voxy_signature");
    const voxyRaw = await synthesizeVoxySegments({
      python: voxyPython,
      modelDir: voxyModelDir,
      reference: voxyReference,
      expectedReferenceSegmentSha256: acceptedVoxyReference.expectedSegmentSha256,
      temporaryRoot,
      rawRoot,
    });
    const rawById = new Map(voxyRaw);
    console.info("pilot_progress:synthesize_verified_female_editorial_voice");
    for (const segment of VOXY_DUAL_VOICE_PILOT_AUDIO_SEGMENTS.filter((entry) => entry.speakerRole === "editorial")) {
      rawById.set(segment.id, await synthesizeEditorialSegment({
        mimic3Cache,
        segmentId: segment.id,
        speakerRole: segment.speakerRole,
        voiceId: segment.voiceId,
        spokenText: segment.spokenText,
        rawRoot,
      }));
    }
    const fixedPaddingMs = 600 + 800 + VOXY_DUAL_VOICE_PILOT_AUDIO_SEGMENTS.reduce((sum, segment) => sum + segment.pauseAfterMs, 0);
    const rawSpeechDurationMs = VOXY_DUAL_VOICE_PILOT_AUDIO_SEGMENTS.reduce((sum, segment) => sum + durationMs(rawById.get(segment.id)!), 0);
    const unadjustedDurationMs = rawSpeechDurationMs + fixedPaddingMs;
    const targetDurationMs = unadjustedDurationMs < 45_000 ? 50_000 : 55_000;
    const tempo = unadjustedDurationMs >= 45_000 && unadjustedDurationMs <= 60_000
      ? 1
      : rawSpeechDurationMs / (targetDurationMs - fixedPaddingMs);
    if (tempo < 0.85 || tempo > 1.35) throw new Error(`required_tempo_adjustment_out_of_bounds:${tempo.toFixed(4)}`);
    console.info(JSON.stringify({ pilot_progress: "audio_duration_fit", unadjustedDurationMs, targetDurationMs, tempo: Number(tempo.toFixed(6)) }));
    const finishedById = new Map<string, string>();
    for (const segment of VOXY_DUAL_VOICE_PILOT_AUDIO_SEGMENTS) {
      const finished = path.resolve(finishedRoot, `${segment.id}.wav`);
      await normalizeAudio(rawById.get(segment.id)!, finished, tempo);
      finishedById.set(segment.id, finished);
    }
    const speechDurationsMs = VOXY_DUAL_VOICE_PILOT_AUDIO_SEGMENTS.map((segment) => durationMs(finishedById.get(segment.id)!));
    await concatenateMaster({ finishedById, output: masterAudio, temporaryRoot });
    const audioAssembly = await verifyMasterAudioAssembly({ finishedById, masterAudio });
    const plan = buildVoxyDualVoicePilotPlan(exactHeadSha, speechDurationsMs);
    const planErrors = validateVoxyDualVoicePilotPlan(plan);
    if (planErrors.length) throw new Error(`pilot_plan_invalid:${planErrors.join(",")}`);
    if (Math.abs(durationMs(masterAudio) - plan.output.durationMs) > 120) throw new Error("master_audio_duration_drift");
    await writeFile(path.resolve(outputRoot, VOXY_DUAL_VOICE_PILOT_OUTPUT.speakerTimeline), `${JSON.stringify(plan.speakerTimeline.map(({ id: _id, ...entry }) => entry), null, 2)}\n`, "utf8");
    await writeFile(path.resolve(outputRoot, VOXY_DUAL_VOICE_PILOT_OUTPUT.visualStateTimeline), `${JSON.stringify(plan.visualStateTimeline, null, 2)}\n`, "utf8");
    await writeFile(path.resolve(outputRoot, VOXY_DUAL_VOICE_PILOT_OUTPUT.evidenceTimeline), `${JSON.stringify(plan.evidenceTimeline, null, 2)}\n`, "utf8");
    await writeFile(path.resolve(outputRoot, VOXY_DUAL_VOICE_PILOT_OUTPUT.captionsVtt), buildVoxyDualVoicePilotVtt(plan.speakerTimeline), "utf8");
    await writeFile(path.resolve(outputRoot, VOXY_DUAL_VOICE_PILOT_OUTPUT.captionsSrt), buildVoxyDualVoicePilotSrt(plan.speakerTimeline), "utf8");

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

    const firstFocus = plan.visualStateTimeline[1]!;
    const firstExplain = plan.visualStateTimeline[2]!;
    const firstDock = plan.visualStateTimeline[3]!;
    const firstDocked = plan.visualStateTimeline[4]!;
    const secondFocus = plan.visualStateTimeline[5]!;
    const secondDock = plan.visualStateTimeline[7]!;
    const synthesis = plan.visualStateTimeline[8]!;
    const reviewFrameSpecs = [
      { id: "01-voxy-host", at: plan.speakerTimeline[0]!.start + 1 },
      { id: "02-democracy-question", at: plan.speakerTimeline[0]!.end - 0.45 },
      { id: "03-evidence-focus", at: (firstFocus.start + firstFocus.end) / 2 },
      { id: "04-editorial-explain", at: Math.max(firstExplain.start + 0.5, plan.speakerTimeline[2]!.start + 0.5) },
      { id: "05-focus-to-dock-mid-transition", at: (firstDock.start + firstDock.end) / 2 },
      { id: "06-evidence-docked", at: firstDocked.start + 0.18 },
      { id: "07-second-evidence-focus", at: (secondFocus.start + secondFocus.end) / 2 },
      { id: "08-second-evidence-docked", at: secondDock.end + 0.12 },
      { id: "09-synthesis", at: (synthesis.start + synthesis.end) / 2 },
      { id: "10-voxy-close", at: (plan.speakerTimeline.at(-1)!.start + plan.speakerTimeline.at(-1)!.end) / 2 },
    ];
    const reviewFrames = [];
    for (const spec of reviewFrameSpecs) {
      const at = Math.min(plan.output.durationMs / 1_000 - 0.05, spec.at);
      const frameIndex = Math.min(plan.output.frameCount - 1, Math.floor(at * plan.output.fps));
      const file = path.resolve(standframesRoot, `${spec.id}.png`);
      await copyFile(path.resolve(framesRoot, `frame-${String(frameIndex - (frameIndex % 2)).padStart(5, "0")}.png`), file);
      reviewFrames.push({ id: spec.id, at: Number(at.toFixed(3)), frameIndex, file: `standframes/${spec.id}.png`, sha256: await sha256(file) });
    }
    await copyFile(path.resolve(standframesRoot, "09-synthesis.png"), path.resolve(outputRoot, VOXY_DUAL_VOICE_PILOT_OUTPUT.preview));
    run("ffmpeg", ["-y", ...reviewFrames.flatMap((entry) => ["-i", path.resolve(outputRoot, entry.file)]), "-filter_complex", "[0:v]scale=360:203[a];[1:v]scale=360:203[b];[2:v]scale=360:203[c];[3:v]scale=360:203[d];[4:v]scale=360:203[e];[5:v]scale=360:203[f];[6:v]scale=360:203[g];[7:v]scale=360:203[h];[8:v]scale=360:203[i];[9:v]scale=360:203[j];[a][b][c][d][e]hstack=inputs=5[top];[f][g][h][i][j]hstack=inputs=5[bottom];[top][bottom]vstack=inputs=2", "-frames:v", "1", path.resolve(outputRoot, VOXY_DUAL_VOICE_PILOT_OUTPUT.contactSheet)]);

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
      mp4: { file: VOXY_DUAL_VOICE_PILOT_OUTPUT.mp4, sha256: await sha256(mp4), ffprobe: privacySafeProbe(mp4Probe) },
      webm: { file: VOXY_DUAL_VOICE_PILOT_OUTPUT.webm, sha256: await sha256(webm), ffprobe: privacySafeProbe(webmProbe) },
      masterAudio: { file: VOXY_DUAL_VOICE_PILOT_OUTPUT.masterAudio, sha256: await sha256(masterAudio), ffprobe: privacySafeProbe(audioProbe) },
      preview: { file: VOXY_DUAL_VOICE_PILOT_OUTPUT.preview, sha256: await sha256(path.resolve(outputRoot, VOXY_DUAL_VOICE_PILOT_OUTPUT.preview)) },
      contactSheet: { file: VOXY_DUAL_VOICE_PILOT_OUTPUT.contactSheet, sha256: await sha256(path.resolve(outputRoot, VOXY_DUAL_VOICE_PILOT_OUTPUT.contactSheet)) },
      captionsVtt: { file: VOXY_DUAL_VOICE_PILOT_OUTPUT.captionsVtt, sha256: await sha256(path.resolve(outputRoot, VOXY_DUAL_VOICE_PILOT_OUTPUT.captionsVtt)) },
      captionsSrt: { file: VOXY_DUAL_VOICE_PILOT_OUTPUT.captionsSrt, sha256: await sha256(path.resolve(outputRoot, VOXY_DUAL_VOICE_PILOT_OUTPUT.captionsSrt)) },
      speakerTimeline: { file: VOXY_DUAL_VOICE_PILOT_OUTPUT.speakerTimeline, sha256: await sha256(path.resolve(outputRoot, VOXY_DUAL_VOICE_PILOT_OUTPUT.speakerTimeline)) },
      visualStateTimeline: { file: VOXY_DUAL_VOICE_PILOT_OUTPUT.visualStateTimeline, sha256: await sha256(path.resolve(outputRoot, VOXY_DUAL_VOICE_PILOT_OUTPUT.visualStateTimeline)) },
      evidenceTimeline: { file: VOXY_DUAL_VOICE_PILOT_OUTPUT.evidenceTimeline, sha256: await sha256(path.resolve(outputRoot, VOXY_DUAL_VOICE_PILOT_OUTPUT.evidenceTimeline)) },
    };
    const manifest = {
      schemaVersion: plan.schemaVersion,
      artifactId: `voxy-democracy-pilot-v1-1-${exactHeadSha.slice(0, 12)}`,
      exactHeadSha,
      technicalPilotGate: "passed",
      format: { width: plan.output.width, height: plan.output.height, fps: plan.output.fps, durationMs: plan.output.durationMs, frameCount: plan.output.frameCount },
      voices: {
        voxy: { role: "voxy", voiceId: VOXY_SIGNATURE.voiceId, selectedVariantId: "e-02-warm-sovereign", genderPresentation: "male", privateReferencePathWithheld: true, acceptedPrivateReferenceSelectionVerified: true, localOfflineSynthesis: true },
        editorial: { role: "editorial", voiceId: "de_DE/m-ailabs_low#ramona_deininger", genderPresentation: "female", localOfflineSynthesis: true },
      },
      audioAssembly: { ...audioAssembly, acceptedVoxyReferenceSelectionManifestSha256: acceptedVoxyReference.selectionManifestSha256, maleVoxyActuallyInFinalMaster: true, femaleEditorialActuallyInFinalMaster: true },
      speakerTimeline: plan.speakerTimeline,
      visualStateTimeline: plan.visualStateTimeline,
      evidenceTimeline: plan.evidenceTimeline,
      evidence: plan.evidence,
      captions: plan.captions,
      burnedInLowerText: false,
      objectContinuity: plan.objectContinuity,
      mouth: { ...plan.mouth, editorialFramesUseClosedMouth: true, voxyOnlyLipSync: true },
      waveform: plan.waveform,
      visualCanon: { frozen: true, visualMasterHeadSha: plan.visualMasterHeadSha, sourceAssets: Object.fromEntries(await Promise.all(Object.entries(sourcePaths).map(async ([id, file]) => [id, { repositoryPath: path.relative(repositoryRoot, file), sha256: await sha256(file) }]))), characterRedesign: false, studioRedesign: false },
      rendering: { renderedFrames, duplicatedAdjacentFrames: plan.output.frameCount - renderedFrames, runtimeNetworkRequests: 0, externalVisualUploadUsed: false },
      privacy: { ...plan.privacy, artifactStoredOutsideGitWorktreeViaIgnoredLocalSymlink: true, privateRawReferencesInRepository: false, privateReferencePathsRecorded: false },
      files,
      reviewFrames,
      humanPilotAcceptance: "pending",
      humanVoiceMappingAcceptance: "pending",
      humanNews5VisualAcceptance: "pending",
      productionEligible: false,
      autoPublish: false,
      knownDeviations: [
        "private_human_review_required_for_voice_naturalness_and_final_visual_rhythm",
        "voxy_mouth_sync_uses_smoothed_audio_amplitude_not_phoneme_alignment",
        "twelve_unique_visual_updates_per_second_are_frame_doubled_to_twenty_four_fps",
        "demo_illustration_objects_show_format_behavior_and_are_not_real_sources_or_statistics",
      ],
    };
    await writeFile(path.resolve(outputRoot, VOXY_DUAL_VOICE_PILOT_OUTPUT.manifest), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    console.info(JSON.stringify({ status: "VOXY_DUAL_VOICE_PILOT_V1_1_PASS", exactHeadSha, artifactId: manifest.artifactId, output: outputArgument, durationMs: plan.output.durationMs, fps: 24, resolution: "1920x1080", maleVoxyActuallyAudible: true, burnedInLowerText: false, humanPilotAcceptance: "pending", humanVoiceMappingAcceptance: "pending", humanNews5VisualAcceptance: "pending", productionEligible: false, autoPublish: false }, null, 2));
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
