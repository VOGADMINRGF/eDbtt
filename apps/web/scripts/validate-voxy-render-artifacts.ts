import { existsSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

type ExpectedArtifact = {
  path: string;
  width: number;
  height: number;
  fps?: number;
  durationSeconds?: number;
  minimumBytes: number;
};

const EXPECTED: ExpectedArtifact[] = [
  { path: "artifacts/voxy-character-motion-fixture-16x9.mp4", width: 1280, height: 720, fps: 24, durationSeconds: 8, minimumBytes: 20_000 },
  { path: "artifacts/voxy-character-motion-fixture-9x16.mp4", width: 720, height: 1280, fps: 24, durationSeconds: 8, minimumBytes: 20_000 },
  { path: "artifacts/voxy-character-motion-fixture-1x1.mp4", width: 1080, height: 1080, fps: 24, durationSeconds: 8, minimumBytes: 20_000 },
  { path: "artifacts/voxy-master-16x9-production.png", width: 3840, height: 2160, minimumBytes: 50_000 },
  { path: "artifacts/voxy-master-9x16-production.png", width: 2160, height: 3840, minimumBytes: 50_000 },
  { path: "artifacts/voxy-master-1x1-production.png", width: 2160, height: 2160, minimumBytes: 50_000 },
  { path: "artifacts/voxy-master-16x9-marketing8k.png", width: 7680, height: 4320, minimumBytes: 100_000 },
];

function readProbe(path: string): { width: number; height: number; fps: number; duration: number } {
  const result = spawnSync(
    "ffprobe",
    [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=width,height,r_frame_rate,duration:format=duration",
      "-of", "json",
      path,
    ],
    { encoding: "utf8" },
  );
  if (result.error || result.status !== 0) {
    throw new Error(`ffprobe_failed:${path}:${result.error?.message ?? result.stderr.trim()}`);
  }
  const parsed = JSON.parse(result.stdout) as {
    streams?: Array<{ width?: number; height?: number; r_frame_rate?: string; duration?: string }>;
    format?: { duration?: string };
  };
  const stream = parsed.streams?.[0];
  if (!stream?.width || !stream.height) throw new Error(`missing_video_stream:${path}`);
  const [numerator = "0", denominator = "1"] = (stream.r_frame_rate ?? "0/1").split("/");
  return {
    width: stream.width,
    height: stream.height,
    fps: Number(numerator) / Math.max(1, Number(denominator)),
    duration: Number(stream.duration ?? parsed.format?.duration ?? 0),
  };
}

const evidence = EXPECTED.map((expected) => {
  const absolutePath = resolve(process.cwd(), expected.path);
  if (!existsSync(absolutePath)) throw new Error(`missing_artifact:${expected.path}`);
  const bytes = statSync(absolutePath).size;
  if (bytes < expected.minimumBytes) throw new Error(`artifact_too_small:${expected.path}:${bytes}`);
  const probe = readProbe(absolutePath);
  if (probe.width !== expected.width || probe.height !== expected.height) {
    throw new Error(`artifact_dimensions_invalid:${expected.path}:${probe.width}x${probe.height}`);
  }
  if (expected.fps !== undefined && Math.abs(probe.fps - expected.fps) > 0.01) {
    throw new Error(`artifact_fps_invalid:${expected.path}:${probe.fps}`);
  }
  if (expected.durationSeconds !== undefined && Math.abs(probe.duration - expected.durationSeconds) > 0.15) {
    throw new Error(`artifact_duration_invalid:${expected.path}:${probe.duration}`);
  }
  return { ...expected, bytes, probedFps: probe.fps, probedDuration: probe.duration };
});

console.log(JSON.stringify({ status: "voxy_artifacts_valid", evidence }, null, 2));
