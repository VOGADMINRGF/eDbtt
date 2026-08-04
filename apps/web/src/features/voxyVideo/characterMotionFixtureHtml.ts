import {
  type VoxyCharacterMotionFixturePlan,
  validateVoxyCharacterMotionFixturePlan,
} from "./characterMotionFixture";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function motionTransform(motion: string): string {
  switch (motion) {
    case "listening": return "translate3d(-2px,1px,0) scale(1.004) rotate(-.15deg)";
    case "explaining": return "translate3d(-4px,-2px,0) scale(1.008) rotate(-.28deg)";
    case "questioning": return "translate3d(2px,-4px,0) scale(1.006) rotate(.18deg)";
    case "highlighting_source": return "translate3d(5px,-2px,0) scale(1.01) rotate(.2deg)";
    case "showing_contrast": return "translate3d(-3px,1px,0) scale(1.006) rotate(-.22deg)";
    case "inviting_participation": return "translate3d(0,-3px,0) scale(1.012)";
    default: return "translate3d(0,-2px,0) scale(1.006)";
  }
}

export function renderVoxyCharacterMotionFixtureHtml(input: {
  plan: VoxyCharacterMotionFixturePlan;
  embeddedStudioAssetUrl?: string;
  embeddedCharacterAssetUrl?: string;
  captureTimeMs?: number;
}): string {
  const validation = validateVoxyCharacterMotionFixturePlan(input.plan);
  if (!validation.ok) {
    throw new Error(`invalid_voxy_character_motion_fixture:${validation.errors.join(",")}`);
  }

  const plan = input.plan;
  const captureTimeMs = input.captureTimeMs === undefined
    ? 0
    : Math.max(0, Math.min(plan.durationMs - 1, input.captureTimeMs));
  const captureClass = input.captureTimeMs === undefined ? "" : "capture-mode";
  const studioUrl = input.embeddedStudioAssetUrl ?? plan.studioAssetPath;
  const characterUrl = input.embeddedCharacterAssetUrl ?? plan.characterAssetPath;

  const sceneCards = plan.scenes.map((scene) => `
    <article class="scene-card scene-${escapeHtml(scene.kind)}" style="--scene-start:${scene.startMs}ms;--scene-duration:${scene.endMs - scene.startMs}ms">
      <p class="scene-kicker">${escapeHtml(scene.kicker)}</p>
      <h2>${escapeHtml(scene.headline)}</h2>
      <p class="scene-detail">${escapeHtml(scene.detail)}</p>
    </article>`).join("\n");

  const characterLayers = plan.scenes.map((scene) => `
    <img class="character-layer" src="${escapeHtml(characterUrl)}" alt="" style="--scene-start:${scene.startMs}ms;--scene-duration:${scene.endMs - scene.startMs}ms;--motion-transform:${motionTransform(scene.motion)}" />`).join("\n");

  return `<!doctype html>
<html lang="${escapeHtml(plan.outputLanguage)}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="color-scheme" content="dark"/><title>${escapeHtml(plan.title)}</title>
<style>
:root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}*{box-sizing:border-box}html,body{width:100%;height:100%;margin:0;overflow:hidden;background:#020718}body{display:grid;place-items:center}
#fixture{--capture-time:${captureTimeMs}ms;position:relative;width:${plan.width}px;height:${plan.height}px;overflow:hidden;isolation:isolate;background:#020718}
.studio-layer{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;animation:studio-push ${plan.durationMs}ms linear calc(0ms - var(--capture-time)) both}
.character-layer{position:absolute;z-index:3;opacity:0;left:22%;top:6%;width:55%;height:83%;object-fit:contain;object-position:center bottom;transform-origin:50% 58%;filter:drop-shadow(0 22px 26px rgba(0,0,0,.35));animation:character-scene var(--scene-duration) ease-in-out calc(var(--scene-start) - var(--capture-time)) both}
.vignette{position:absolute;inset:0;z-index:4;pointer-events:none;background:linear-gradient(90deg,rgba(0,3,14,.24),transparent 34%,transparent 70%,rgba(0,3,14,.58)),linear-gradient(0deg,rgba(0,3,14,.58),transparent 38%)}
.on-air{position:absolute;z-index:7;top:4%;left:3%;border:1px solid rgba(0,217,192,.86);background:rgba(3,11,34,.88);border-radius:999px;padding:.62rem 1rem;font-weight:800;font-size:clamp(13px,1.45vw,19px);letter-spacing:.09em;box-shadow:0 0 28px rgba(30,107,255,.28);animation:on-air-in 520ms cubic-bezier(.2,.8,.2,1) calc(0ms - var(--capture-time)) both}
.scene-stack{position:absolute;z-index:8;top:16%;right:3%;width:min(31%,390px);height:58%}.scene-card{position:absolute;inset-inline:0;top:50%;max-width:100%;transform:translate3d(44px,-50%,0) scale(.98);opacity:0;border:1px solid rgba(0,217,192,.74);border-radius:18px;padding:clamp(16px,2.1vw,26px);background:linear-gradient(145deg,rgba(3,11,31,.95),rgba(7,20,54,.9));box-shadow:0 20px 50px rgba(0,0,0,.38),0 0 34px rgba(30,107,255,.16);animation:card-cycle var(--scene-duration) ease-in-out calc(var(--scene-start) - var(--capture-time)) both;overflow:hidden}
.scene-kicker{margin:0 0 .72rem;color:#25e6ff;font-size:clamp(12px,1.35vw,17px);letter-spacing:.1em;font-weight:850}.scene-card h2{margin:0;max-width:100%;font-size:clamp(21px,2.35vw,35px);line-height:1.08;letter-spacing:-.025em;overflow-wrap:anywhere;hyphens:auto}.scene-detail{margin:.9rem 0 0;color:#c9d8f2;font-size:clamp(14px,1.42vw,20px);line-height:1.38;overflow-wrap:anywhere;hyphens:auto}
.scene-opening{left:-210%;width:195%;top:70%}.scene-closing{left:-115%;width:210%;top:72%;text-align:center}
.lower-third{position:absolute;z-index:9;inset-inline:0;bottom:0;min-height:14%;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:1.5rem;align-items:center;padding:1.05rem 3%;border-top:2px solid transparent;border-image:linear-gradient(90deg,#00d9c0,#1e6bff) 1;background:rgba(2,8,24,.93);box-shadow:0 -16px 42px rgba(0,0,0,.28);animation:lower-third-in 620ms cubic-bezier(.2,.8,.2,1) calc(280ms - var(--capture-time)) both}.lower-third strong{display:block;max-width:100%;font-size:clamp(18px,2.15vw,30px);letter-spacing:-.018em;overflow-wrap:anywhere}.lower-third small{color:#b9cae7;font-size:clamp(11px,1.1vw,15px)}.mode{color:#25e6ff;font-weight:800;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap}.transparency{position:absolute;z-index:10;left:3%;bottom:15.4%;max-width:54%;color:rgba(220,231,248,.84);font-size:clamp(10px,1vw,13px)}
.capture-mode .studio-layer,.capture-mode .character-layer,.capture-mode .on-air,.capture-mode .scene-card,.capture-mode .lower-third{animation-play-state:paused!important}
@keyframes studio-push{from{transform:scale(1.005)}to{transform:scale(1.035) translate3d(-.25%,-.15%,0)}}@keyframes character-scene{0%{opacity:0;transform:translate3d(0,3px,0) scale(1.002)}14%,82%{opacity:1;transform:var(--motion-transform)}100%{opacity:0;transform:translate3d(0,-2px,0) scale(1.004)}}@keyframes on-air-in{from{opacity:0;transform:translateX(-32px)}to{opacity:1;transform:none}}@keyframes lower-third-in{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:none}}@keyframes card-cycle{0%{opacity:0;transform:translate3d(44px,-50%,0) scale(.98)}13%,82%{opacity:1;transform:translate3d(0,-50%,0)}100%{opacity:0;transform:translate3d(-18px,-50%,0) scale(.99)}}
@media(max-aspect-ratio:1/1){.character-layer{left:5%;top:13%;width:90%;height:58%;object-position:center bottom}.scene-stack{top:60%;left:5%;right:5%;width:auto;height:23%}.scene-card,.scene-opening,.scene-closing{left:0;width:100%;top:42%}.scene-card h2{font-size:clamp(22px,4.2vw,38px)}.scene-detail{font-size:clamp(15px,2.8vw,22px)}.lower-third{grid-template-columns:1fr;gap:.3rem;min-height:12%}.mode{white-space:normal}.transparency{bottom:13.5%;max-width:90%}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:1ms!important;animation-iteration-count:1!important;transition-duration:1ms!important}.scene-card{display:none}.scene-card:first-child{display:block;opacity:1;transform:translate3d(0,-50%,0)}.character-layer{display:none}.character-layer:first-of-type{display:block;opacity:1;transform:none}}
</style></head><body><main id="fixture" class="${captureClass}" aria-label="Voxy Character Motion Fixture"><img class="studio-layer" src="${escapeHtml(studioUrl)}" alt=""/>${characterLayers}<div class="vignette"></div><div class="on-air">VOXY · ON AIR</div><section class="scene-stack" aria-label="Quellen- und Recherchekarten">${sceneCards}</section><p class="transparency">${escapeHtml(plan.mascotDisclosure)} ${escapeHtml(plan.sourceDisclosure)}</p><footer class="lower-third"><div><strong>${escapeHtml(plan.title)}</strong><small>Ohne Lip-Sync · Review-first · kein Auto-Publish</small></div><span class="mode">Fakten · Evidenz · Updates</span></footer></main></body></html>`;
}
