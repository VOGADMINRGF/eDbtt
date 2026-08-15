import type { VoxyFirstExplainerPlan } from "./firstExplainerVideo";
import { findVoxyFirstExplainerSegment } from "./firstExplainerVideo";
import { VOXY_STATIC_CANON_FINAL_CAMERA } from "./staticCanonRecovery";

export type VoxyFirstExplainerEmbeddedAssets = {
  canonStageDataUrl: string;
  wordmarkDataUrl: string;
  vogPinDataUrl: string;
  edebattePocketMarkDataUrl: string;
};

export type VoxyFirstExplainerFormat = "16:9" | "9:16" | "1:1";

const formatGeometry = {
  "16:9": { width: 1280, height: 720, scale: 2 / 3, translateX: 0 },
  "9:16": { width: 720, height: 1280, scale: 1280 / 1080, translateX: -550 },
  "1:1": { width: 1080, height: 1080, scale: 1, translateX: -365 },
} as const;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smootherstep(value: number): number {
  const x = clamp01(value);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function blinkAmount(atMs: number): number {
  const windows = [1_650, 14_650];
  return Math.max(
    ...windows.map((center) => {
      const distance = Math.abs(atMs - center);
      return distance >= 135 ? 0 : smootherstep(1 - distance / 135);
    }),
  );
}

function segmentOpacity(atMs: number, startMs: number, endMs: number): number {
  const fadeMs = 420;
  const entering = smootherstep((atMs - startMs) / fadeMs);
  const leaving = smootherstep((endMs - atMs) / fadeMs);
  return Math.min(entering, leaving);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function renderVoxyFirstExplainerFrameHtml(input: {
  plan: VoxyFirstExplainerPlan;
  assets: VoxyFirstExplainerEmbeddedAssets;
  frameIndex: number;
  format?: VoxyFirstExplainerFormat;
}): string {
  const { plan, assets, frameIndex, format = "16:9" } = input;
  const geometry = formatGeometry[format];
  const atMs = (frameIndex * 1_000) / plan.output.fps;
  const segment = findVoxyFirstExplainerSegment(atMs);
  const opacity = segmentOpacity(atMs, segment.startMs, segment.endMs);
  const blink = blinkAmount(atMs);
  const masterScale = geometry.scale;
  const masterTranslateX = geometry.translateX;
  const portrait = format !== "16:9";
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Voxy · ${escapeHtml(segment.editorialTitle)}</title>
<style>
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#010511;font-family:Arial,Helvetica,sans-serif;color:#fff}
.viewport{position:relative;width:${geometry.width}px;height:${geometry.height}px;overflow:hidden;background:#010511;isolation:isolate}
.master{position:absolute;left:0;top:0;width:1920px;height:1080px;overflow:hidden;transform-origin:0 0;transform:translateX(${masterTranslateX}px) scale(${masterScale});background:#010511}
.studio-stage{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:translate(${VOXY_STATIC_CANON_FINAL_CAMERA.translateX}px,${VOXY_STATIC_CANON_FINAL_CAMERA.translateY}px) scale(${VOXY_STATIC_CANON_FINAL_CAMERA.scale});transform-origin:${VOXY_STATIC_CANON_FINAL_CAMERA.transformOrigin};filter:saturate(1.055) contrast(1.035) brightness(1.015)}
.studio-grade{position:absolute;inset:0;background:radial-gradient(circle at 48% 36%,rgba(45,106,255,.04),transparent 30%),linear-gradient(90deg,rgba(0,213,203,.035),transparent 34%,rgba(1,5,18,.08) 60%,rgba(1,5,18,.56) 100%);pointer-events:none}
.brand-reset{position:absolute;left:0;top:0;width:520px;height:515px;border-bottom-right-radius:120px;background:linear-gradient(90deg,#010511 0 74%,rgba(1,5,17,.99) 82%,rgba(1,5,17,.7) 91%,transparent),repeating-linear-gradient(90deg,transparent 0 22px,rgba(35,77,136,.12) 23px 25px);filter:drop-shadow(24px 18px 32px rgba(1,5,17,.32))}
.right-reset{position:absolute;left:1305px;right:0;top:0;height:776px;background:linear-gradient(90deg,rgba(1,5,17,.12),rgba(1,5,17,.96) 12%,#010511 30%);box-shadow:-42px 0 70px rgba(1,5,17,.58)}
.bottom-reset{position:absolute;left:0;right:0;top:760px;bottom:0;background:linear-gradient(180deg,#020817,#01040e 58%,#01030a);border-top:1px solid rgba(74,125,195,.28)}
.bottom-reset:before{content:"";position:absolute;left:0;right:0;top:-88px;height:88px;background:linear-gradient(transparent,rgba(1,5,17,.94))}
.frame{position:absolute;inset:14px;border:1px solid rgba(140,175,218,.38);border-radius:20px;box-shadow:inset 0 0 80px rgba(0,34,94,.15)}
.on-air{position:absolute;left:42px;top:34px;height:55px;padding:0 18px;display:flex;align-items:center;gap:12px;border:1px solid rgba(216,231,249,.76);border-radius:8px;background:rgba(1,5,16,.74);font-size:21px;font-weight:800;letter-spacing:.1em;box-shadow:0 12px 34px rgba(0,0,0,.28)}
.on-air i{width:13px;height:13px;border-radius:50%;background:#00d9c0;box-shadow:0 0 ${14 + opacity * 8}px rgba(0,217,192,.8)}
.brand-lockup{position:absolute;left:56px;top:154px;width:350px;height:190px;padding:12px 10px;border-left:3px solid #00d9c0;background:linear-gradient(90deg,rgba(3,13,32,.78),rgba(3,13,32,.16));filter:drop-shadow(0 15px 32px rgba(0,0,0,.25))}
.brand-lockup:after{content:"DIGITALER MODERATOR";position:absolute;left:22px;bottom:-31px;color:#76a9dd;font-size:13px;letter-spacing:.16em}.brand-lockup img{width:100%;height:100%;object-fit:contain}
.native-character-mark{position:absolute;z-index:3;display:block;object-fit:contain;filter:drop-shadow(0 2px 3px rgba(0,0,0,.55))}.native-vog-pin{left:650px;top:482px;width:49px;height:24px;transform:rotate(4deg)}.native-edebatte-pocket-mark{left:838px;top:565px;width:112px;height:34px;transform:rotate(-6deg)}
.eyelid{position:absolute;z-index:4;top:239px;width:39px;height:57px;border-radius:50%;opacity:${blink};background:linear-gradient(100deg,#f2f0ed,#fff 50%,#e4e0dc);box-shadow:inset 0 -4px 4px rgba(133,136,151,.16)}.eyelid:after{content:"";position:absolute;left:7px;right:6px;top:29px;height:4px;border-radius:50%;background:#11121b;transform:rotate(3deg)}.eyelid-left{left:722px}.eyelid-right{left:824px}
.content-rail{position:absolute;left:1362px;top:54px;width:510px;height:650px;padding:34px 29px;background:linear-gradient(145deg,rgba(2,10,27,.97),rgba(1,5,17,.92));border-left:1px solid rgba(73,167,255,.58);border-block:1px solid rgba(107,150,205,.34);box-shadow:-24px 0 55px rgba(0,0,0,.3),inset 20px 0 35px rgba(30,107,255,.04)}
.rail-copy{opacity:${opacity};transform:translateY(${Math.round((1 - opacity) * 18)}px)}.rail-kicker{display:block;color:#3ddde4;font-size:14px;letter-spacing:.16em;margin-bottom:20px}.rail-title{display:block;font-size:${segment.id === "voiceopengov_how" ? 31 : 38}px;line-height:1.08;letter-spacing:.025em}.rail-rule{display:block;width:78%;height:3px;margin:25px 0 33px;background:linear-gradient(90deg,#00d9c0,#1e6bff);border-radius:3px}.rail-role{display:block;color:#a8c5e8;font-size:18px;line-height:1.45;letter-spacing:.08em}.rail-levels{position:absolute;left:29px;right:29px;bottom:42px;display:grid;gap:18px}.rail-levels span{padding-top:17px;border-top:1px solid rgba(126,163,210,.26);color:#6889b2;font-size:13px;letter-spacing:.12em}.rail-levels .active{color:#fff}.rail-levels .active:before{content:"";display:inline-block;width:8px;height:8px;margin-right:12px;border-radius:50%;background:#00d9c0;box-shadow:0 0 13px rgba(0,217,192,.7)}
.caption-bar{position:absolute;left:50px;right:50px;top:798px;min-height:154px;display:flex;align-items:center;padding:22px 46px;background:linear-gradient(90deg,rgba(2,12,31,.985),rgba(2,10,25,.94) 78%,rgba(2,10,25,.86));border-block:1px solid rgba(104,155,215,.5);box-shadow:0 20px 60px rgba(0,0,0,.25)}.caption-bar:before{content:"";position:absolute;left:16px;top:22px;bottom:22px;width:5px;border-radius:4px;background:linear-gradient(#00d9c0,#1e6bff)}.caption{max-width:1500px;font-size:34px;font-weight:700;line-height:1.24;letter-spacing:.008em;opacity:${opacity};transform:translateY(${Math.round((1 - opacity) * 10)}px)}
.footer{position:absolute;left:50px;right:50px;bottom:27px;display:flex;justify-content:space-between;align-items:center;color:#6997cb;font-size:13px;letter-spacing:.14em}.footer b{color:#3bdde5}.portrait-mask{display:${portrait ? "block" : "none"};position:absolute;z-index:10;left:0;right:0;bottom:0;height:150px;background:linear-gradient(transparent,rgba(1,5,17,.98) 40%)}
.portrait-caption{display:${portrait ? "flex" : "none"};position:absolute;z-index:11;left:34px;right:34px;bottom:34px;min-height:96px;align-items:center;padding:16px 22px;border-left:5px solid #00d9c0;background:rgba(2,10,27,.93);font-size:${format === "9:16" ? 25 : 28}px;font-weight:700;line-height:1.24;opacity:${opacity}}
</style>
</head>
<body><main class="viewport" data-format="${format}" data-frame-index="${frameIndex}" data-at-ms="${atMs.toFixed(3)}" data-motion-state="${segment.motionState}" data-waveform-count="1" data-waveform-placement="behind_voxy" data-hand-gesture="none_flattened_master_identity_lock">
  <section class="master">
    <img class="studio-stage" src="${assets.canonStageDataUrl}" alt="">
    <div class="studio-grade"></div><div class="brand-reset"></div><div class="right-reset"></div><div class="bottom-reset"></div>
    <img class="native-character-mark native-vog-pin" src="${assets.vogPinDataUrl}" alt="VOG">
    <img class="native-character-mark native-edebatte-pocket-mark" src="${assets.edebattePocketMarkDataUrl}" alt="eDebatte">
    <div class="eyelid eyelid-left"></div><div class="eyelid eyelid-right"></div>
    <div class="frame"></div><div class="on-air"><i></i>ON AIR</div>
    <section class="brand-lockup"><img src="${assets.wordmarkDataUrl}" alt="Voxy eDebatte"></section>
    <section class="content-rail" aria-label="Markenarchitektur"><div class="rail-copy"><small class="rail-kicker">VOXY VERBINDET</small><strong class="rail-title">${escapeHtml(segment.editorialTitle)}</strong><span class="rail-rule"></span><span class="rail-role">${escapeHtml(segment.editorialRole)}</span></div><div class="rail-levels"><span class="${segment.id === "vote4gov_why" ? "active" : ""}">VOTE4GOV · WARUM</span><span class="${segment.id === "edebatte_what" ? "active" : ""}">eDebatte · WAS</span><span class="${segment.id === "voiceopengov_how" ? "active" : ""}">VOICEOPENGOV · WIE</span></div></section>
    <section class="caption-bar"><span class="caption">${escapeHtml(segment.caption)}</span></section>
    <footer class="footer"><span>VOXY · DIGITALER MODERATOR · eDEBATTE</span><b>CONTROLLED MOTION TEST · HUMAN REVIEW</b></footer>
  </section>
  <div class="portrait-mask"></div><div class="portrait-caption">${escapeHtml(segment.caption)}</div>
</main></body></html>`;
}
