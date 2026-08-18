import type { VoxyFinalLayoutPlan } from "./dualVoiceExplainerPilot";
import { renderVoxyDualVoicePilotFrameHtml } from "./dualVoiceExplainerPilotHtml";
import type { VoxyHomepageReferenceFilmPlan } from "./homepageReferenceFilms";
import type { VoxyMotionV4EmbeddedAssets } from "./motionV4Html";

const escapeHtml = (value: string): string => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

export function renderVoxyHomepageReferenceFilmFrameHtml(input: {
  plan: VoxyHomepageReferenceFilmPlan;
  assets: VoxyMotionV4EmbeddedAssets;
  frameIndex: number;
  amplitude: number;
}): string {
  const { plan, frameIndex } = input;
  const at = frameIndex / plan.output.fps;
  let currentEventIndex = 0;
  for (const [index, entry] of plan.motionTimeline.entries()) {
    if (entry.at <= at) currentEventIndex = index;
  }
  const eventIndex = currentEventIndex;
  const event = plan.motionTimeline[eventIndex]!;
  const nextEvent = plan.motionTimeline[eventIndex + 1];
  const window = Math.max(.5, (nextEvent?.at ?? plan.output.durationMs / 1_000) - event.at);
  const eventProgress = Math.max(0, Math.min(1, (at - event.at) / window));
  const base = renderVoxyDualVoicePilotFrameHtml({
    plan: plan as unknown as VoxyFinalLayoutPlan,
    assets: input.assets,
    frameIndex,
    amplitude: input.amplitude,
  });
  const semanticMotion = `<div class="homepage-motion-cue" data-motion-event-id="${escapeHtml(event.id)}" data-motion-kind="${escapeHtml(event.motion)}" data-semantic-purpose="${escapeHtml(event.semanticPurpose)}" style="--event-progress:${eventProgress.toFixed(4)}">
    <span>${escapeHtml(plan.filmId === "edebatte" ? "QUELLE · KONTEXT · STATUS" : "WAHL · BESCHLUSS · WIRKUNG")}</span>
    <i></i>
  </div>`;
  const css = `<style>
    .homepage-motion-cue{position:absolute;z-index:29;left:650px;top:82px;width:760px;display:grid;grid-template-columns:auto 1fr;align-items:center;gap:16px;pointer-events:none;opacity:calc(.5 + var(--event-progress)*.5);transform:translateX(calc((1 - var(--event-progress))*9px))}
    .homepage-motion-cue span{color:#7ddfdc;font-size:10px;font-weight:900;letter-spacing:.16em}.homepage-motion-cue i{height:2px;transform-origin:left;transform:scaleX(var(--event-progress));background:linear-gradient(90deg,#20d8cb,#347fff,transparent);box-shadow:0 0 16px rgba(32,216,203,.4)}
  </style>`;
  return base
    .replace("</head>", `${css}</head>`)
    .replace('<div class="frame"></div>', `${semanticMotion}<div class="frame"></div>`)
    .replace('data-pilot-version="1.4-final-layout"', `data-pilot-version="homepage-reference-v1" data-homepage-film="${plan.filmId}" data-context-mode="${plan.contextMode}" data-motion-event-index="${eventIndex}"`);
}
