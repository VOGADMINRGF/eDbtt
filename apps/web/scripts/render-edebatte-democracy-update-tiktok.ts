import { chromium } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 24;
const DURATION_SECONDS = 30;
const FRAME_COUNT = FPS * DURATION_SECONDS;

function argument(name: string): string | null {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? null;
}

function run(binary: string, args: string[]) {
  const result = spawnSync(binary, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0 || result.error) {
    throw new Error(`${binary}_failed:${result.error?.message ?? result.stderr.trim()}`);
  }
  return result.stdout.trim();
}

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function easeOutCubic(value: number) {
  const x = clamp(value);
  return 1 - Math.pow(1 - x, 3);
}

function easeInOut(value: number) {
  const x = clamp(value);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function dataUrl(buffer: Buffer, mime: string) {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function esc(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function textBlock(text: string, className: string, style = "") {
  return `<div class="${className}" style="${style}">${esc(text)}</div>`;
}

function screenCard(src: string, progress: number, extra = "") {
  const p = easeOutCubic(progress);
  const y = 120 - 120 * p;
  const scale = 0.91 + 0.09 * p;
  const opacity = clamp(progress * 2.6);
  return `<div class="screen-shell" style="opacity:${opacity};transform:translateY(${y}px) scale(${scale});${extra}"><img src="${src}" /></div>`;
}

function renderFrameHtml(time: number, screens: readonly string[]) {
  const [home, participation, vote] = screens;
  let body = "";

  if (time < 7.5) {
    const first = easeOutCubic((time - 0.15) / 0.55);
    const second = easeOutCubic((time - 0.65) / 0.5);
    const q1 = easeOutCubic((time - 1.65) / 0.5);
    const q2 = easeOutCubic((time - 2.0) / 0.5);
    const cross = easeOutCubic((time - 4.45) / 0.45);
    const days = easeOutCubic((time - 5.35) / 0.45);
    body += textBlock("WIR NENNEN ES", "eyebrow", `opacity:${first};transform:translateY(${40 - first * 40}px)`);
    body += textBlock("WAHLJAHR.", "hero cyan", `opacity:${second};transform:scale(${0.84 + second * 0.16})`);
    body += textBlock("ABER WELCHE WAHL", "question", `opacity:${q1}`);
    body += textBlock("HABEN WIR EIGENTLICH?", "question cyan q2", `opacity:${q2}`);
    body += `<div class="lower" style="opacity:${cross}">
      ${textBlock("1 KREUZ.", "lower-big")}
      ${textBlock("ALLE 4 JAHRE.", "lower-big cyan")}
    </div>`;
    body += `<div class="days" style="opacity:${days};transform:translateY(${50 - days * 50}px)">
      ${textBlock("UND DIE ANDEREN", "small")}
      ${textBlock("1.460 TAGE?", "days-big cyan")}
    </div>`;
  } else if (time < 12) {
    const p = (time - 7.5) / 0.75;
    body += screenCard(home, p, `transform-origin:50% 42%`);
    const h = easeOutCubic((time - 7.7) / 0.55);
    body += `<div class="top-banner" style="opacity:${h}">${textBlock("DEMOKRATIE KANN MEHR.", "banner-main")}${textBlock("MITMACHEN STATT NUR ZUSCHAUEN", "banner-sub cyan")}</div>`;
  } else if (time < 17) {
    const p = (time - 12) / 0.7;
    body += screenCard(participation, p);
    const h = easeOutCubic((time - 12.15) / 0.5);
    body += `<div class="top-banner" style="opacity:${h}">${textBlock("NICHT NUR KOMMENTIEREN.", "banner-main")}${textBlock("MITMACHEN.", "banner-main cyan")}</div>`;
  } else if (time < 22.5) {
    const p = (time - 17) / 0.7;
    const dim = clamp((time - 20.15) / 0.45);
    body += screenCard(vote, p, `filter:brightness(${1 - dim * 0.56});`);
    const a = easeOutCubic((time - 20.25) / 0.3);
    const b = easeOutCubic((time - 20.75) / 0.3);
    const c = easeOutCubic((time - 21.25) / 0.3);
    body += `<div class="center-stack">
      ${textBlock("NICHT DIE LAUTESTE STIMME.", "stack-line", `opacity:${a}`)}
      ${textBlock("NICHT LINKS GEGEN RECHTS.", "stack-line cyan", `opacity:${b}`)}
      ${textBlock("FRAGEN. ARGUMENTE. PERSPEKTIVEN.", "stack-line compact", `opacity:${c}`)}
    </div>`;
  } else {
    const a = easeOutCubic((time - 22.65) / 0.45);
    const b = easeOutCubic((time - 23.4) / 0.45);
    const c = easeOutCubic((time - 24.2) / 0.45);
    const finale = easeInOut((time - 26.6) / 0.55);
    if (time < 26.8) {
      body += `<div class="closing-core">
        ${textBlock("VIELLEICHT BRAUCHT", "closing-small", `opacity:${a}`)}
        ${textBlock("DEMOKRATIE", "closing-big", `opacity:${a}`)}
        ${textBlock("KEINE NEUE PARTEI.", "closing-mid", `opacity:${b}`)}
        ${textBlock("VIELLEICHT BRAUCHT SIE", "closing-small spacer", `opacity:${c}`)}
        ${textBlock("EIN UPDATE.", "closing-update cyan", `opacity:${c};transform:scale(${0.88 + c * 0.12})`)}
      </div>`;
    }
    body += `<div class="finale" style="opacity:${finale};transform:scale(${0.96 + finale * 0.04})">
      ${textBlock("EINE FRAGE.", "finale-line")}
      ${textBlock("VIELE PERSPEKTIVEN.", "finale-line cyan")}
      ${textBlock("EIN KLARERES BILD.", "finale-line")}
      <div class="finale-gap"></div>
      ${textBlock("DEINE STIMME ZÄHLT", "finale-sub")}
      ${textBlock("NICHT NUR AM WAHLTAG.", "finale-sub")}
      <div class="cta">EDEBATTE.ORG</div>
      ${textBlock("Jetzt ausprobieren →", "cta-sub")}
    </div>`;
  }

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box} html,body{margin:0;width:${WIDTH}px;height:${HEIGHT}px;overflow:hidden;background:#03111f;color:#f8fbff;font-family:Inter,Arial,Helvetica,sans-serif}
    body{position:relative;background:radial-gradient(circle at 50% 20%,#0d2a3a 0%,#03111f 48%,#020912 100%)}
    body:after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,transparent 0%,rgba(0,0,0,.16) 100%)}
    .cyan{color:#14d7e6}.eyebrow{position:absolute;top:350px;width:100%;text-align:center;font-size:76px;font-weight:900;letter-spacing:1px}.hero{position:absolute;top:500px;width:100%;text-align:center;font-size:154px;font-weight:950;letter-spacing:-5px}.question{position:absolute;top:820px;width:100%;text-align:center;font-size:68px;font-weight:850}.q2{top:910px}.lower{position:absolute;top:1110px;width:100%;text-align:center}.lower-big{font-size:100px;font-weight:950;line-height:1.07}.days{position:absolute;top:1440px;width:100%;text-align:center}.small{font-size:54px;font-weight:800}.days-big{font-size:132px;font-weight:950;letter-spacing:-3px}
    .screen-shell{position:absolute;left:70px;right:70px;top:300px;height:1480px;border-radius:56px;overflow:hidden;background:white;box-shadow:0 45px 110px rgba(0,0,0,.46),0 0 0 2px rgba(20,215,230,.2)}.screen-shell img{width:100%;height:100%;object-fit:cover;object-position:top center;display:block}.top-banner{position:absolute;left:0;right:0;top:0;padding:76px 54px 48px;background:linear-gradient(180deg,rgba(3,17,31,.98),rgba(3,17,31,.88),transparent);text-align:center;z-index:5}.banner-main{font-size:67px;font-weight:950;line-height:1.08}.banner-sub{font-size:39px;font-weight:850;margin-top:15px;letter-spacing:.5px}
    .center-stack{position:absolute;left:54px;right:54px;top:620px;text-align:center;z-index:7}.stack-line{font-size:61px;font-weight:950;line-height:1.16;text-shadow:0 5px 30px rgba(0,0,0,.8);margin:26px 0}.stack-line.compact{font-size:46px}
    .closing-core{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:80px}.closing-small{font-size:60px;font-weight:850}.closing-big{font-size:125px;font-weight:950;letter-spacing:-3px;margin-top:12px}.closing-mid{font-size:70px;font-weight:900;margin-top:16px}.spacer{margin-top:150px}.closing-update{font-size:142px;font-weight:950;letter-spacing:-4px;margin-top:15px;text-shadow:0 0 34px rgba(20,215,230,.25)}
    .finale{position:absolute;inset:0;padding:315px 65px 120px;text-align:center}.finale-line{font-size:75px;font-weight:950;line-height:1.18}.finale-gap{height:145px}.finale-sub{font-size:56px;font-weight:850;line-height:1.16}.cta{margin:145px auto 0;width:850px;padding:40px 20px;border-radius:24px;background:#14d7e6;color:#03111f;font-size:86px;font-weight:950;letter-spacing:-2px;box-shadow:0 18px 70px rgba(20,215,230,.2)}.cta-sub{font-size:44px;font-weight:700;margin-top:35px}
  </style></head><body>${body}</body></html>`;
}

async function main() {
  const screen1 = argument("screen-1");
  const screen2 = argument("screen-2");
  const screen3 = argument("screen-3");
  const output = argument("output") ?? "artifacts/edebatte-democracy-update-tiktok";
  const voice = argument("voice");
  const music = argument("music");
  if (!screen1 || !screen2 || !screen3) throw new Error("screen-1_screen-2_screen-3_required");

  const absoluteOutput = path.resolve(output);
  const frames = path.join(absoluteOutput, "frames");
  await rm(absoluteOutput, { recursive: true, force: true });
  await mkdir(frames, { recursive: true });

  const sources = await Promise.all([screen1, screen2, screen3].map(async (file) => {
    const resolved = path.resolve(file);
    const ext = path.extname(resolved).toLowerCase();
    const mime = ext === ".png" ? "image/png" : "image/jpeg";
    return dataUrl(await readFile(resolved), mime);
  }));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: WIDTH, height: HEIGHT }, deviceScaleFactor: 1 });
  try {
    for (let frame = 0; frame < FRAME_COUNT; frame += 1) {
      const time = frame / FPS;
      await page.setContent(renderFrameHtml(time, sources), { waitUntil: "load" });
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(Array.from(document.images).map((img) => img.decode()));
      });
      await page.screenshot({ path: path.join(frames, `${String(frame).padStart(5, "0")}.png`) });
      if (frame % (FPS * 2) === 0) console.info(`render_progress:${frame}/${FRAME_COUNT}`);
    }
  } finally {
    await browser.close();
  }

  const silentVideo = path.join(absoluteOutput, "edebatte-democracy-update-video.mp4");
  run("ffmpeg", ["-y", "-framerate", String(FPS), "-i", path.join(frames, "%05d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", String(FPS), "-movflags", "+faststart", silentVideo]);

  const finalVideo = path.join(absoluteOutput, "edebatte-democracy-update-tiktok.mp4");
  if (voice || music) {
    const args = ["-y", "-i", silentVideo];
    if (voice) args.push("-i", path.resolve(voice));
    if (music) args.push("-i", path.resolve(music));
    if (voice && music) {
      args.push("-filter_complex", "[1:a]volume=1.0[v];[2:a]volume=0.13[m];[v][m]amix=inputs=2:duration=first:dropout_transition=2[a]", "-map", "0:v", "-map", "[a]");
    } else {
      args.push("-map", "0:v", "-map", "1:a");
    }
    args.push("-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", finalVideo);
    run("ffmpeg", args);
  } else {
    run("ffmpeg", ["-y", "-i", silentVideo, "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=48000", "-c:v", "copy", "-c:a", "aac", "-t", String(DURATION_SECONDS), "-shortest", "-movflags", "+faststart", finalVideo]);
  }

  const bytes = await readFile(finalVideo);
  const manifest = {
    schemaVersion: "edebatte-democracy-update-tiktok-v1",
    width: WIDTH,
    height: HEIGHT,
    fps: FPS,
    durationSeconds: DURATION_SECONDS,
    frameCount: FRAME_COUNT,
    screens: [path.basename(screen1), path.basename(screen2), path.basename(screen3)],
    voiceIncluded: Boolean(voice),
    musicIncluded: Boolean(music),
    mp4: path.basename(finalVideo),
    sha256: createHash("sha256").update(bytes).digest("hex"),
    autoPublish: false,
  };
  await writeFile(path.join(absoluteOutput, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.info(JSON.stringify({ status: "PASS", output: finalVideo, ...manifest }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
