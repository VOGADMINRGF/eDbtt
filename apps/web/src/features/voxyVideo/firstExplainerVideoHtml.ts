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
export const VOXY_FIRST_EXPLAINER_MOTION_QUANTIZATION_STEPS = 6;

const formatGeometry = {
  "16:9": { width: 1920, height: 1080, scale: 1, translateX: 0 },
  "9:16": { width: 720, height: 1280, scale: 1280 / 1080, translateX: -560 },
  "1:1": { width: 1080, height: 1080, scale: 1, translateX: -420 },
} as const;

function clamp01(value: number): number { return Math.max(0, Math.min(1, value)); }
function smootherstep(value: number): number { const x = clamp01(value); return x * x * x * (x * (x * 6 - 15) + 10); }
function quantizeMotion(value: number): number { return Math.round(clamp01(value) * VOXY_FIRST_EXPLAINER_MOTION_QUANTIZATION_STEPS) / VOXY_FIRST_EXPLAINER_MOTION_QUANTIZATION_STEPS; }
function blinkAmount(atMs: number): number {
  const windows = [1_650, 6_700, 11_600, 14_650];
  return Math.max(...windows.map((center) => {
    const distance = Math.abs(atMs - center);
    return distance >= 135 ? 0 : smootherstep(1 - distance / 135);
  }));
}
function segmentOpacity(atMs: number, startMs: number, endMs: number): number {
  const fadeMs = 260;
  return Math.min(smootherstep((atMs - startMs) / fadeMs), smootherstep((endMs - atMs) / fadeMs));
}

export function buildVoxyFirstExplainerFrameState(input: { plan: VoxyFirstExplainerPlan; frameIndex: number; }): {
  atMs: number;
  segment: ReturnType<typeof findVoxyFirstExplainerSegment>;
  opacity: number;
  blink: number;
  visualStateKey: string;
} {
  const atMs = (input.frameIndex * 1_000) / input.plan.output.fps;
  const segment = findVoxyFirstExplainerSegment(atMs);
  const opacity = quantizeMotion(segmentOpacity(atMs, segment.startMs, segment.endMs));
  const blink = quantizeMotion(blinkAmount(atMs));
  return { atMs, segment, opacity, blink, visualStateKey: `${segment.id}:${opacity.toFixed(9)}:${blink.toFixed(9)}` };
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function renderVoxyFirstExplainerFrameHtml(input: {
  plan: VoxyFirstExplainerPlan;
  assets: VoxyFirstExplainerEmbeddedAssets;
  frameIndex: number;
  format?: VoxyFirstExplainerFormat;
}): string {
  const { plan, assets, frameIndex, format = "16:9" } = input;
  const geometry = formatGeometry[format];
  const { atMs, segment, opacity, blink } = buildVoxyFirstExplainerFrameState({ plan, frameIndex });
  const portrait = format !== "16:9";
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Voxy · ${escapeHtml(segment.editorialTitle)}</title><style>
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#010511;font-family:Arial,Helvetica,sans-serif;color:#fff}.viewport{position:relative;width:${geometry.width}px;height:${geometry.height}px;overflow:hidden;background:#010511;isolation:isolate}.master{position:absolute;left:0;top:0;width:1920px;height:1080px;overflow:hidden;transform-origin:0 0;transform:translateX(${geometry.translateX}px) scale(${geometry.scale});background:#010511}.studio-stage{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:translate(${VOXY_STATIC_CANON_FINAL_CAMERA.translateX}px,${VOXY_STATIC_CANON_FINAL_CAMERA.translateY}px) scale(${VOXY_STATIC_CANON_FINAL_CAMERA.scale});transform-origin:${VOXY_STATIC_CANON_FINAL_CAMERA.transformOrigin};filter:saturate(1.08) contrast(1.06) brightness(.92)}.studio-grade{position:absolute;inset:0;background:radial-gradient(circle at 47% 38%,rgba(32,102,255,.05),transparent 29%),linear-gradient(90deg,rgba(1,5,17,.88) 0%,rgba(1,5,17,.42) 29%,transparent 52%,rgba(1,5,17,.82) 83%,#010511 100%)}.brand-reset{position:absolute;left:0;top:0;width:540px;height:480px;background:linear-gradient(90deg,#010511 0 70%,rgba(1,5,17,.8) 86%,transparent)}.right-reset{position:absolute;right:0;top:0;width:690px;height:100%;background:linear-gradient(90deg,rgba(1,5,17,.88),#010511 22%)}.bottom-reset{position:absolute;left:0;right:0;bottom:0;height:290px;background:#010511}.frame{position:absolute;inset:18px;border:1px solid rgba(126,164,210,.22);border-radius:24px}.on-air{position:absolute;left:56px;top:46px;display:${portrait ? "none" : "flex"};align-items:center;gap:12px;padding:12px 18px;border:1px solid rgba(210,228,249,.58);border-radius:999px;background:rgba(1,5,17,.62);font-size:14px;font-weight:800;letter-spacing:.14em}.on-air i{width:10px;height:10px;border-radius:50%;background:#00d9c0;box-shadow:0 0 ${14 + opacity * 8}px rgba(0,217,192,.8)}.brand-lockup{position:absolute;left:56px;top:120px;width:300px;height:145px;display:${portrait ? "none" : "block"};opacity:.92}.brand-lockup img{width:100%;height:100%;object-fit:contain}.native-character-mark{position:absolute;z-index:3;display:block;object-fit:contain;filter:drop-shadow(0 2px 3px rgba(0,0,0,.55))}.native-vog-pin{left:650px;top:482px;width:49px;height:24px;transform:rotate(4deg)}.native-edebatte-pocket-mark{left:838px;top:565px;width:112px;height:34px;transform:rotate(-6deg)}.eyelid{position:absolute;z-index:4;top:239px;width:39px;height:57px;border-radius:50%;opacity:${blink};background:linear-gradient(100deg,#f2f0ed,#fff 50%,#e4e0dc)}.eyelid:after{content:"";position:absolute;left:7px;right:6px;top:29px;height:4px;border-radius:50%;background:#11121b}.eyelid-left{left:722px}.eyelid-right{left:824px}.content-rail{position:absolute;z-index:5;left:1110px;top:146px;width:720px;min-height:520px;padding:42px 46px 40px;background:linear-gradient(135deg,rgba(2,9,24,.88),rgba(2,9,24,.98));border-left:5px solid #00d9c0;box-shadow:-40px 24px 90px rgba(0,0,0,.32)}.rail-copy{opacity:${opacity};transform:translateY(${Math.round((1-opacity)*18)}px)}.rail-kicker{display:block;margin-bottom:20px;color:#53e4e8;font-size:17px;font-weight:800;letter-spacing:.18em}.rail-title{display:block;max-width:650px;font-size:64px;line-height:.98;letter-spacing:-.025em}.rail-rule{display:block;width:124px;height:5px;margin:30px 0 24px;border-radius:5px;background:linear-gradient(90deg,#00d9c0,#1e6bff)}.rail-role{display:block;color:#b5d2ee;font-size:24px;font-weight:800;line-height:1.2;letter-spacing:.055em}.rail-levels{position:absolute;left:46px;right:46px;bottom:34px;display:flex;gap:18px}.rail-levels span{padding-top:12px;border-top:1px solid rgba(126,163,210,.26);color:#617fa6;font-size:12px;font-weight:800;letter-spacing:.08em;flex:1}.rail-levels .active{color:#fff;border-color:#00d9c0}.caption-bar{position:absolute;z-index:6;left:58px;right:58px;bottom:62px;min-height:126px;display:${portrait ? "none" : "flex"};align-items:center;padding:24px 36px 24px 42px;background:rgba(2,9,24,.96);border-left:5px solid #1e6bff;box-shadow:0 20px 60px rgba(0,0,0,.34)}.caption{max-width:1680px;font-size:31px;font-weight:700;line-height:1.22;opacity:${opacity};transform:translateY(${Math.round((1-opacity)*10)}px)}.footer{display:none}.portrait-mask{display:${portrait ? "block" : "none"};position:absolute;z-index:10;inset:0;background:linear-gradient(180deg,rgba(1,5,17,.2),transparent 28%,transparent 62%,rgba(1,5,17,.96) 90%)}.portrait-title{display:${portrait ? "block" : "none"};position:absolute;z-index:12;left:32px;right:32px;top:38px;padding:20px 22px;border-left:5px solid #00d9c0;background:rgba(2,9,24,.88)}.portrait-title strong{display:block;font-size:40px;line-height:1;letter-spacing:-.02em}.portrait-title small{display:block;margin-top:10px;color:#a7c7e7;font-size:15px;font-weight:800;letter-spacing:.08em}.portrait-caption{display:${portrait ? "flex" : "none"};position:absolute;z-index:12;left:32px;right:32px;bottom:38px;min-height:138px;align-items:center;padding:20px 24px;border-left:5px solid #1e6bff;background:rgba(2,9,24,.98);font-size:25px;font-weight:750;line-height:1.24;opacity:${opacity}}
.content-rail{display:${portrait ? "none" : "block"}}
</style></head><body><main class="viewport" data-format="${format}" data-frame-index="${frameIndex}" data-at-ms="${atMs.toFixed(3)}" data-motion-state="${segment.motionState}" data-waveform-count="1" data-waveform-placement="behind_voxy" data-hand-gesture="none_flattened_master_identity_lock"><section class="master"><img class="studio-stage" src="${assets.canonStageDataUrl}" alt=""><div class="studio-grade"></div><div class="brand-reset"></div><div class="right-reset"></div><div class="bottom-reset"></div><img class="native-character-mark native-vog-pin" src="${assets.vogPinDataUrl}" alt="VOG"><img class="native-character-mark native-edebatte-pocket-mark" src="${assets.edebattePocketMarkDataUrl}" alt="eDebatte"><div class="eyelid eyelid-left"></div><div class="eyelid eyelid-right"></div><div class="frame"></div><div class="on-air"><i></i>VOXY · LIVE</div><section class="brand-lockup"><img src="${assets.wordmarkDataUrl}" alt="Voxy eDebatte"></section><section class="content-rail" aria-label="Markenarchitektur"><div class="rail-copy"><small class="rail-kicker">VOXY VERBINDET</small><strong class="rail-title">${escapeHtml(segment.editorialTitle)}</strong><span class="rail-rule"></span><span class="rail-role">${escapeHtml(segment.editorialRole)}</span></div><div class="rail-levels"><span class="${segment.id === "vote4gov_why" ? "active" : ""}">VOTE4GOV · WARUM</span><span class="${segment.id === "edebatte_what" ? "active" : ""}">eDebatte · WAS</span><span class="${segment.id === "voiceopengov_how" ? "active" : ""}">VOICEOPENGOV · WIE</span></div></section><section class="caption-bar"><span class="caption">${escapeHtml(segment.caption)}</span></section><footer class="footer"><span>VOXY</span><b>HUMAN REVIEW</b></footer></section><div class="portrait-title"><strong>${escapeHtml(segment.editorialTitle)}</strong><small>${escapeHtml(segment.editorialRole)}</small></div><div class="portrait-mask"></div><div class="portrait-caption">${escapeHtml(segment.caption)}</div></main></body></html>`;
}
