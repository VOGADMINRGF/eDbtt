import { buildVoxyMotionV41Plan } from "./motionV41";
import {
  renderVoxyMotionV4FrameHtml,
  type VoxyMotionV4EmbeddedAssets,
} from "./motionV4Html";
import { buildVoxyAudioMouthFrame } from "./voicedExplainerV1Html";
import {
  VOXY_DUAL_VOICE_PILOT_EVIDENCE,
  speakerAt,
  visualStateAt,
  type VoxyDualVoicePilotPlan,
  type VoxyDualVoicePilotVisualEntry,
} from "./dualVoiceExplainerPilot";

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));
const smooth = (value: number): number => {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function stateProgress(state: VoxyDualVoicePilotVisualEntry, atSeconds: number): number {
  return clamp01((atSeconds - state.start) / Math.max(0.001, state.end - state.start));
}

function renderMemory(state: VoxyDualVoicePilotVisualEntry): string {
  if (state.dockedEvidenceIds.length === 0) return "";
  const cards = state.dockedEvidenceIds
    .map((id) => VOXY_DUAL_VOICE_PILOT_EVIDENCE.find((entry) => entry.id === id))
    .filter((entry): entry is (typeof VOXY_DUAL_VOICE_PILOT_EVIDENCE)[number] => Boolean(entry))
    .map(
      (entry, index) => `<div class="memory-card" style="--memory-index:${index}">
        <small>${escapeHtml(entry.type)}</small><strong>${escapeHtml(entry.label)}</strong>
      </div>`,
    )
    .join("");
  return `<aside class="evidence-memory" aria-label="Dynamisches Evidence-Gedächtnis">
    <header><span>BELEGGEDÄCHTNIS</span><small>DYNAMISCH</small></header>${cards}
  </aside>`;
}

function renderClaimStage(state: VoxyDualVoicePilotVisualEntry, progress: number): string {
  const docking = state.state === "DOCK" ? smooth(progress) : 0;
  const marker = state.state === "EXPLAIN" ? smooth(progress) : state.state === "DOCK" ? 1 : 0;
  return `<section class="information-stage claim-stage" style="--dock:${docking};--marker:${marker}">
    <div class="fixture-label">DEMO / FORMAT-FIXTURE</div>
    <div class="object-type">HEADLINE / CLAIM</div>
    <h1>These oder Schlagzeile</h1>
    <div class="claim-lines"><i></i><i></i><i></i></div>
    <div class="opposition"><span>Position A</span><em>WIDERSPRUCH SICHTBAR</em><span>Position B</span></div>
    <footer>Information zuerst groß zeigen · relevante Stelle markieren · danach docken</footer>
  </section>`;
}

function renderSourceStage(state: VoxyDualVoicePilotVisualEntry, progress: number): string {
  const docking = state.state === "DOCK" ? smooth(progress) : 0;
  const explainProgress = state.state === "EXPLAIN" ? progress : state.state === "DOCK" ? 1 : 0;
  const contextVisible = explainProgress > 0.42 ? 1 : 0;
  const relationshipVisible = explainProgress > 0.72 ? 1 : 0;
  return `<section class="information-stage source-stage" style="--dock:${docking};--build:${smooth(explainProgress)};--context:${contextVisible};--relationships:${relationshipVisible}">
    <div class="fixture-label">DEMO / FORMAT-FIXTURE</div>
    <div class="object-type">SOURCE CARD · NARRATIV AUFGEBAUT</div>
    <div class="source-layout">
      <div class="document">
        <div class="document-head"><span>Quelle / Datengrundlage</span><small>ORIGINAL ZUERST</small></div>
        <i></i><i class="relevant"></i><i></i><i></i><i class="short"></i>
        <mark>relevante Stelle</mark>
      </div>
      <div class="derived-context">
        <span>nachvollziehbare Ableitung</span>
        <strong>Argument</strong><strong>Gegenargument</strong><strong>Offene Frage</strong>
      </div>
    </div>
    <footer>Grundstruktur → Markierung → Kontext → Evidence Memory</footer>
  </section>`;
}

function renderSynthesis(): string {
  return `<section class="synthesis-stage">
    <div class="fixture-label">DEMO / FORMAT-FIXTURE</div>
    <div class="object-type">SYNTHESIS · ZUVOR ERKLÄRTE ELEMENTE</div>
    <h1>Was gehört zusammen?</h1>
    <div class="synthesis-grid">
      ${VOXY_DUAL_VOICE_PILOT_EVIDENCE.map(
        (entry) => `<div class="synthesis-card"><small>${escapeHtml(entry.type)}</small><strong>${escapeHtml(entry.label)}</strong></div>`,
      ).join("")}
    </div>
    <div class="synthesis-legend"><span>belegt</span><span>widersprüchlich</span><span>offen</span></div>
  </section>`;
}

export function renderVoxyDualVoicePilotFrameHtml(input: {
  plan: VoxyDualVoicePilotPlan;
  assets: VoxyMotionV4EmbeddedAssets;
  frameIndex: number;
  amplitude: number;
}): string {
  const atSeconds = input.frameIndex / input.plan.output.fps;
  const speaker = speakerAt(input.plan, atSeconds);
  const visual = visualStateAt(input.plan, atSeconds);
  const progress = stateProgress(visual, atSeconds);
  const editorial = speaker?.speakerRole === "editorial";
  const audioMouth = buildVoxyAudioMouthFrame(input.amplitude);
  const mouth = editorial
    ? { mouthState: "neutral" as const, mouthNextState: "closed" as const, mouthMix: 0 }
    : audioMouth;
  const sourceDurationFrames = 22 * input.plan.output.fps;
  const sourceFrameIndex = editorial
    ? Math.floor((input.frameIndex % (1.8 * input.plan.output.fps)))
    : input.frameIndex % sourceDurationFrames;
  const motionPlan = buildVoxyMotionV41Plan(input.plan.exactHeadSha).baseMotionPlan;
  const baseHtml = renderVoxyMotionV4FrameHtml({
    plan: motionPlan,
    assets: input.assets,
    frameIndex: sourceFrameIndex,
    displayFrameIndex: input.frameIndex,
    mouthProfile: "v4.1",
    mouthOverride: mouth,
    waveformAmplitude: input.amplitude,
    editorialOverride: {
      kicker: editorial ? "EDITORIAL · EINORDNUNG" : "VOXY · HOST",
      title: visual.state,
      brand: editorial ? "Redaktionelle Stimme" : "Voxy",
      caption: speaker?.text ?? "",
    },
  });

  const informational = visual.state !== "HOST";
  const activeStage = visual.state === "SYNTHESIS"
    ? renderSynthesis()
    : visual.activeEvidenceId === "claim-headline"
      ? renderClaimStage(visual, progress)
      : visual.activeEvidenceId === "source-card"
        ? renderSourceStage(visual, progress)
        : "";
  const role = editorial ? "EDITORIAL" : speaker ? "VOXY" : "PAUSE";
  const injected = `<div class="pilot-role ${editorial ? "editorial-role" : "voxy-role"}"><span>${role}</span><small>${escapeHtml(visual.state)}</small></div>
    ${informational ? '<div class="information-dimmer"></div>' : ""}
    ${activeStage}
    ${renderMemory(visual)}`;

  const css = `
.editorial-cue{display:none!important}.caption-bar{right:58px;z-index:30;min-height:116px}.caption{white-space:pre-line;max-width:1760px}.pilot-role{position:absolute;z-index:31;right:74px;top:54px;display:flex;align-items:center;gap:13px;padding:11px 16px;border:1px solid rgba(121,164,214,.45);border-radius:999px;background:rgba(1,7,20,.86);box-shadow:0 14px 45px rgba(0,0,0,.25)}.pilot-role span{font-size:13px;font-weight:900;letter-spacing:.16em;color:#fff}.pilot-role small{font-size:12px;font-weight:800;letter-spacing:.12em;color:#6fe9e0}.editorial-role{border-color:rgba(85,228,232,.62)}.information-dimmer{position:absolute;z-index:12;left:28px;top:28px;width:1395px;height:860px;border-radius:21px;background:rgba(1,6,18,.69);backdrop-filter:blur(1.5px);box-shadow:inset 0 0 90px rgba(2,9,28,.55)}.information-stage,.synthesis-stage{position:absolute;z-index:20;left:210px;top:145px;width:1160px;height:625px;padding:45px 54px 42px;border:1px solid rgba(92,164,255,.5);border-radius:28px;background:linear-gradient(145deg,rgba(5,17,43,.985),rgba(2,8,24,.985));box-shadow:0 34px 90px rgba(0,0,0,.52),0 0 54px rgba(16,90,255,.12);transform-origin:100% 20%;transform:translate(calc(var(--dock,0) * 460px),calc(var(--dock,0) * 25px)) scale(calc(1 - var(--dock,0) * .62));opacity:calc(1 - var(--dock,0) * .12)}.fixture-label{display:inline-flex;padding:8px 12px;border-radius:999px;background:rgba(0,217,192,.12);border:1px solid rgba(0,217,192,.38);color:#63eee2;font-size:12px;font-weight:900;letter-spacing:.14em}.object-type{margin-top:28px;color:#8cb5e8;font-size:15px;font-weight:850;letter-spacing:.15em}.information-stage h1,.synthesis-stage h1{margin:18px 0 0;font-size:62px;line-height:1;letter-spacing:-.04em}.claim-lines{margin-top:40px;display:grid;gap:15px}.claim-lines i{display:block;width:78%;height:12px;border-radius:99px;background:rgba(145,177,219,.24)}.claim-lines i:nth-child(2){width:92%;background:linear-gradient(90deg,#13d8ca 0 calc(var(--marker) * 58%),rgba(145,177,219,.22) calc(var(--marker) * 58%))}.claim-lines i:nth-child(3){width:61%}.opposition{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:20px;margin-top:42px}.opposition span{padding:21px;border:1px solid rgba(74,128,212,.43);border-radius:14px;background:rgba(13,34,71,.56);text-align:center;font-size:22px;font-weight:800}.opposition em{color:#ffb976;font-style:normal;font-size:12px;font-weight:900;letter-spacing:.12em}.information-stage footer{position:absolute;left:54px;right:54px;bottom:34px;color:#98b5d4;font-size:16px;font-weight:700}.source-layout{display:grid;grid-template-columns:1.25fr .75fr;gap:35px;margin-top:28px}.document{position:relative;height:335px;padding:27px 30px;border-radius:18px;background:#f5f8fc;color:#071329;box-shadow:0 20px 50px rgba(0,0,0,.28)}.document-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:27px}.document-head span{font-size:22px;font-weight:900}.document-head small{color:#1464cf;font-size:11px;font-weight:900;letter-spacing:.12em}.document i{display:block;height:10px;margin:14px 0;border-radius:99px;background:#c9d4e2}.document i:nth-of-type(1){width:88%}.document i:nth-of-type(2){width:96%}.document i:nth-of-type(3){width:73%}.document i:nth-of-type(4){width:90%}.document i.short{width:52%}.document i.relevant{background:linear-gradient(90deg,#08bfb3 0 calc(var(--build) * 72%),#d6dee8 calc(var(--build) * 72%));box-shadow:0 0 calc(var(--build) * 22px) rgba(8,191,179,.3)}.document mark{position:absolute;right:26px;top:130px;padding:8px 11px;border-radius:8px;background:#07376d;color:#fff;font-size:12px;font-weight:850;opacity:var(--build);transform:translateX(calc((1 - var(--build)) * 18px))}.derived-context{display:grid;align-content:start;gap:14px;padding-top:10px;opacity:var(--context);transform:translateY(calc((1 - var(--context)) * 14px))}.derived-context span{margin-bottom:7px;color:#7ce8e0;font-size:13px;font-weight:900;letter-spacing:.1em}.derived-context strong{padding:20px 18px;border:1px solid rgba(83,142,225,.38);border-radius:13px;background:rgba(12,37,81,.7);font-size:20px}.derived-context strong:nth-of-type(2),.derived-context strong:nth-of-type(3){opacity:var(--relationships)}.evidence-memory{position:absolute;z-index:22;right:57px;top:134px;width:390px;min-height:220px;padding:22px;border:1px solid rgba(61,127,211,.38);border-radius:20px;background:linear-gradient(155deg,rgba(3,13,35,.96),rgba(1,7,20,.96));box-shadow:0 26px 70px rgba(0,0,0,.38)}.evidence-memory header{display:flex;justify-content:space-between;align-items:center;margin-bottom:15px}.evidence-memory header span{color:#87b6ef;font-size:12px;font-weight:900;letter-spacing:.12em}.evidence-memory header small{color:#4de3d8;font-size:10px;font-weight:900}.memory-card{display:grid;gap:5px;margin-top:10px;padding:14px 15px;border-left:3px solid #176cff;border-radius:9px;background:rgba(11,31,65,.8);animation:none}.memory-card small{color:#79e5de;font-size:10px;font-weight:850;letter-spacing:.1em}.memory-card strong{font-size:15px;line-height:1.16}.synthesis-stage{left:180px;top:130px;width:1280px;height:650px}.synthesis-stage h1{font-size:48px}.synthesis-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:30px}.synthesis-card{min-height:112px;padding:20px;border:1px solid rgba(72,133,218,.46);border-radius:14px;background:linear-gradient(140deg,rgba(13,43,91,.86),rgba(7,23,51,.88))}.synthesis-card small{display:block;margin-bottom:10px;color:#65e4dc;font-size:10px;font-weight:900;letter-spacing:.12em}.synthesis-card strong{font-size:20px;line-height:1.1}.synthesis-card:last-child{grid-column:2/3;border-color:rgba(255,177,94,.55)}.synthesis-legend{display:flex;justify-content:center;gap:40px;margin-top:25px}.synthesis-legend span{position:relative;color:#aec5df;font-size:13px;font-weight:850}.synthesis-legend span:before{content:"";display:inline-block;width:8px;height:8px;margin-right:9px;border-radius:99px;background:#17d4c4}.synthesis-legend span:nth-child(2):before{background:#ffb15e}.synthesis-legend span:nth-child(3):before{background:#7395c3}`;

  return baseHtml
    .replace("</style>", `${css}</style>`)
    .replace('<div class="frame"></div>', `${injected}<div class="frame"></div>`)
    .replace(
      '<main class="viewport"',
      `<main class="viewport" data-pilot-state="${visual.state}" data-speaker-role="${speaker?.speakerRole ?? "none"}" data-active-evidence-id="${visual.activeEvidenceId ?? "none"}" data-docked-evidence-count="${visual.dockedEvidenceIds.length}" data-editorial-mouth-neutral="${editorial}"`,
    );
}
