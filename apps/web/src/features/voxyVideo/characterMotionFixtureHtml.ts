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
    case "listening":
      return "translate3d(-2px,1px,0) scale(1.004) rotate(-.15deg)";
    case "explaining":
      return "translate3d(-4px,-2px,0) scale(1.008) rotate(-.28deg)";
    case "questioning":
      return "translate3d(2px,-4px,0) scale(1.006) rotate(.18deg)";
    case "highlighting_source":
      return "translate3d(5px,-2px,0) scale(1.01) rotate(.2deg)";
    case "showing_contrast":
      return "translate3d(-3px,1px,0) scale(1.006) rotate(-.22deg)";
    case "inviting_participation":
      return "translate3d(0,-3px,0) scale(1.012)";
    default:
      return "translate3d(0,-2px,0) scale(1.006)";
  }
}

export function renderVoxyCharacterMotionFixtureHtml(input: {
  plan: VoxyCharacterMotionFixturePlan;
  embeddedCharacterAssetUrl?: string;
}): string {
  const validation = validateVoxyCharacterMotionFixturePlan(input.plan);
  if (!validation.ok) {
    throw new Error(
      `invalid_voxy_character_motion_fixture:${validation.errors.join(",")}`,
    );
  }

  const plan = input.plan;
  const assetUrl = input.embeddedCharacterAssetUrl ?? plan.characterAssetPath;
  const sceneCards = plan.scenes
    .map(
      (scene) => `
        <article class="scene-card scene-${escapeHtml(scene.kind)}" style="--scene-start:${scene.startMs}ms;--scene-duration:${scene.endMs - scene.startMs}ms">
          <p class="scene-kicker">${escapeHtml(scene.kicker)}</p>
          <h2>${escapeHtml(scene.headline)}</h2>
          <p>${escapeHtml(scene.detail)}</p>
        </article>`,
    )
    .join("\n");

  const characterLayers = plan.scenes
    .map(
      (scene) => `
        <img
          class="character-layer"
          src="${escapeHtml(assetUrl)}"
          alt=""
          style="--scene-start:${scene.startMs}ms;--scene-duration:${scene.endMs - scene.startMs}ms;--motion-transform:${motionTransform(scene.motion)}"
        />`,
    )
    .join("\n");

  const waveformBars = Array.from({ length: 32 }, (_, index) => {
    const delay = (index % 8) * 45;
    const height = 24 + ((index * 17) % 76);
    return `<span style="--bar-delay:${delay}ms;--bar-height:${height}%"></span>`;
  }).join("");

  return `<!doctype html>
<html lang="${escapeHtml(plan.outputLanguage)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <title>${escapeHtml(plan.title)}</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    * { box-sizing: border-box; }
    html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: #020718; }
    body { display: grid; place-items: center; }
    #fixture { position: relative; width: ${plan.width}px; height: ${plan.height}px; overflow: hidden; isolation: isolate; background: radial-gradient(circle at 50% 42%, #10275f 0%, #050b21 52%, #01040d 100%); }
    .studio-layer, .character-layer { position: absolute; inset: -2%; width: 104%; height: 104%; object-fit: cover; object-position: center; user-select: none; pointer-events: none; }
    .studio-layer { z-index: 1; filter: saturate(.94) contrast(1.03) brightness(.9); animation: studio-push ${plan.durationMs}ms linear both; }
    .character-layer { z-index: 3; opacity: 0; object-position: center; mask-image: radial-gradient(ellipse 29% 53% at 51% 53%, #000 62%, transparent 100%); -webkit-mask-image: radial-gradient(ellipse 29% 53% at 51% 53%, #000 62%, transparent 100%); transform-origin: 51% 58%; filter: saturate(1.05) brightness(1.04); animation: character-scene var(--scene-duration) ease-in-out var(--scene-start) both; }
    .vignette { position: absolute; inset: 0; z-index: 4; pointer-events: none; background: linear-gradient(90deg, rgba(0,3,14,.42), transparent 31%, transparent 68%, rgba(0,3,14,.58)), linear-gradient(0deg, rgba(0,3,14,.62), transparent 39%); }
    .on-air { position: absolute; z-index: 7; top: 4%; left: 3%; border: 1px solid rgba(75,145,255,.82); background: rgba(3,11,34,.82); border-radius: 999px; padding: .62rem 1rem; font-weight: 800; font-size: clamp(13px, 1.45vw, 19px); letter-spacing: .09em; box-shadow: 0 0 28px rgba(28,104,255,.28); animation: on-air-in 520ms cubic-bezier(.2,.8,.2,1) both; }
    .waveform { position: absolute; z-index: 5; top: 8%; right: 4%; width: 28%; height: 22%; display: flex; align-items: center; justify-content: center; gap: 1.5%; border-radius: 50%; border: 1px solid rgba(40,121,255,.24); background: radial-gradient(circle, rgba(20,72,202,.16), transparent 66%); }
    .waveform span { width: 2.1%; min-width: 2px; height: var(--bar-height); border-radius: 999px; background: linear-gradient(#5aa0ff, #1161ff); box-shadow: 0 0 10px rgba(45,118,255,.65); animation: wave 820ms ease-in-out var(--bar-delay) infinite alternate; }
    .scene-stack { position: absolute; z-index: 8; top: 16%; right: 3%; width: min(31%, 390px); height: 58%; }
    .scene-card { position: absolute; inset-inline: 0; top: 50%; transform: translate3d(44px,-50%,0) scale(.98); opacity: 0; border: 1px solid rgba(66,137,255,.82); border-radius: 18px; padding: clamp(16px, 2.1vw, 26px); background: linear-gradient(145deg, rgba(3,11,31,.93), rgba(7,20,54,.86)); box-shadow: 0 20px 50px rgba(0,0,0,.38), 0 0 34px rgba(28,98,255,.16); animation: card-cycle var(--scene-duration) ease-in-out var(--scene-start) both; }
    .scene-kicker { margin: 0 0 .72rem; color: #6ba9ff; font-size: clamp(12px, 1.35vw, 17px); letter-spacing: .1em; font-weight: 850; }
    .scene-card h2 { margin: 0; font-size: clamp(22px, 2.6vw, 38px); line-height: 1.08; letter-spacing: -.025em; }
    .scene-card p:last-child { margin: .9rem 0 0; color: #c9d8f2; font-size: clamp(15px, 1.55vw, 21px); line-height: 1.38; }
    .scene-opening { left: -210%; width: 195%; top: 70%; }
    .scene-closing { left: -115%; width: 210%; top: 72%; text-align: center; }
    .lower-third { position: absolute; z-index: 9; inset-inline: 0; bottom: 0; min-height: 14%; display: grid; grid-template-columns: 1fr auto; gap: 1.5rem; align-items: center; padding: 1.05rem 3%; border-top: 2px solid #2679ff; background: rgba(2,8,24,.91); box-shadow: 0 -16px 42px rgba(0,0,0,.28); animation: lower-third-in 620ms 280ms cubic-bezier(.2,.8,.2,1) both; }
    .lower-third strong { display: block; font-size: clamp(18px, 2.25vw, 31px); letter-spacing: -.018em; }
    .lower-third small { color: #b9cae7; font-size: clamp(11px, 1.15vw, 15px); }
    .lower-third .mode { color: #74adff; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; white-space: nowrap; }
    .transparency { position: absolute; z-index: 10; left: 3%; bottom: 15.4%; max-width: 52%; color: rgba(220,231,248,.84); font-size: clamp(10px, 1vw, 13px); }
    @keyframes studio-push { from { transform: scale(1.01) translate3d(0,0,0); } to { transform: scale(1.055) translate3d(-.35%, -.2%, 0); } }
    @keyframes character-scene { 0% { opacity: 0; transform: translate3d(0,3px,0) scale(1.002); } 14%, 82% { opacity: .98; transform: var(--motion-transform); } 100% { opacity: 0; transform: translate3d(0,-2px,0) scale(1.004); } }
    @keyframes on-air-in { from { opacity: 0; transform: translateX(-32px); } to { opacity: 1; transform: none; } }
    @keyframes lower-third-in { from { opacity: 0; transform: translateY(100%); } to { opacity: 1; transform: none; } }
    @keyframes wave { from { transform: scaleY(.38); opacity: .48; } to { transform: scaleY(1); opacity: 1; } }
    @keyframes card-cycle { 0% { opacity: 0; transform: translate3d(44px,-50%,0) scale(.98); } 13%, 82% { opacity: 1; transform: translate3d(0,-50%,0) scale(1); } 100% { opacity: 0; transform: translate3d(-18px,-50%,0) scale(.99); } }
    @media (max-aspect-ratio: 1/1) {
      .studio-layer, .character-layer { width: 178%; left: -39%; inset-block: -1%; height: 102%; }
      .waveform { top: 4%; right: 4%; width: 40%; height: 15%; }
      .scene-stack { top: 55%; left: 5%; right: 5%; width: auto; height: 30%; }
      .scene-card, .scene-opening, .scene-closing { left: 0; width: 100%; top: 42%; }
      .lower-third { grid-template-columns: 1fr; gap: .3rem; min-height: 12%; }
      .transparency { bottom: 13.5%; max-width: 90%; }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; transition-duration: 1ms !important; }
      .scene-card { display: none; }
      .scene-card:first-child { display: block; opacity: 1; transform: translate3d(0,-50%,0); }
      .character-layer { display: none; }
      .character-layer:first-of-type { display: block; opacity: .98; transform: none; }
    }
  </style>
</head>
<body>
  <main id="fixture" aria-label="Voxy Character Motion Fixture">
    <img class="studio-layer" src="${escapeHtml(assetUrl)}" alt="" />
    ${characterLayers}
    <div class="vignette"></div>
    <div class="on-air">VOXY · ON AIR</div>
    <div class="waveform" aria-hidden="true">${waveformBars}</div>
    <section class="scene-stack" aria-label="Quellen- und Recherchekarten">${sceneCards}</section>
    <p class="transparency">${escapeHtml(plan.mascotDisclosure)} ${escapeHtml(plan.sourceDisclosure)}</p>
    <footer class="lower-third">
      <div>
        <strong>${escapeHtml(plan.title)}</strong>
        <small>Ohne Lip-Sync · Review-first · kein Auto-Publish</small>
      </div>
      <span class="mode">Fakten · Evidenz · Updates</span>
    </footer>
  </main>
</body>
</html>`;
}
