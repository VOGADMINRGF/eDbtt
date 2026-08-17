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
  type VoxyExplainerPilotPlan,
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

function evidenceById(id: string) {
  return VOXY_DUAL_VOICE_PILOT_EVIDENCE.find((entry) => entry.id === id);
}

function renderEvidenceCore(evidenceId: string): string {
  const evidence = evidenceById(evidenceId);
  if (!evidence) return "";
  if (evidenceId === "democracy-trust") {
    return `<div class="evidence-core evidence-trust" data-evidence-id="${evidence.id}" data-visual-identity="${evidence.visualIdentity}">
      <div class="fixture-label">DEMO · ILLUSTRATION</div>
      <small class="evidence-kind">VERTRAUEN</small>
      <h1>Vertrauen im Zeitverlauf</h1>
      <div class="trend-chart" aria-label="Illustrativer Zeitverlauf ohne behauptete Werte">
        <i class="axis axis-x"></i><i class="axis axis-y"></i>
        <svg viewBox="0 0 600 150" aria-hidden="true"><path class="trend-line" d="M20 106 C115 94, 142 42, 228 67 S353 131, 430 92 S520 54, 580 72"/><circle cx="228" cy="67" r="7"/><circle cx="430" cy="92" r="7"/></svg>
        <span class="trend-note">Verlauf illustriert · keine realen Werte</span>
      </div>
    </div>`;
  }
  if (evidenceId === "democracy-participation") {
    return `<div class="evidence-core evidence-participation" data-evidence-id="${evidence.id}" data-visual-identity="${evidence.visualIdentity}">
      <div class="fixture-label">DEMO · ILLUSTRATION</div>
      <small class="evidence-kind">BETEILIGUNG</small>
      <h1>Beteiligung folgt einem eigenen Muster</h1>
      <div class="participation-chart" aria-label="Illustrativer Beteiligungsindikator ohne behauptete Werte">
        <i style="--bar:.42"></i><i style="--bar:.67"></i><i style="--bar:.51"></i><i style="--bar:.78"></i><i style="--bar:.59"></i><i style="--bar:.71"></i>
      </div>
      <span class="trend-note">Eigenständiger Indikator · keine realen Werte</span>
    </div>`;
  }
  return `<div class="evidence-core evidence-question" data-evidence-id="${evidence.id}" data-visual-identity="${evidence.visualIdentity}">
    <div class="fixture-label">DEMO · ILLUSTRATION</div>
    <small class="evidence-kind">OFFENE FRAGE</small>
    <span class="question-ring">?</span>
    <h1>Fühlen sich Menschen politisch wirksam?</h1>
  </div>`;
}

function renderMemory(state: VoxyDualVoicePilotVisualEntry): string {
  if (state.state === "SYNTHESIS") return "";
  const visibleIds = state.dockedEvidenceIds.filter(
    (id) => !(state.state === "DOCK" && state.activeEvidenceId === id),
  );
  if (visibleIds.length === 0) return "";
  return `<aside class="evidence-memory" aria-label="Dynamisches Evidence-Gedächtnis">
    <header><span>IM GEDÄCHTNIS</span><small>DEMO</small></header>
    ${visibleIds.map((id) => `<div class="memory-card" data-evidence-id="${id}" data-memory-object="true">${renderEvidenceCore(id)}</div>`).join("")}
  </aside>`;
}

function renderActiveEvidence(state: VoxyDualVoicePilotVisualEntry, progress: number): string {
  if (!state.activeEvidenceId || state.state === "SYNTHESIS") return "";
  const docking = state.state === "DOCK" ? smooth(progress) : 0;
  const build = state.state === "FOCUS" ? smooth(progress) : 1;
  return `<section class="information-stage" data-evidence-id="${state.activeEvidenceId}" data-object-continuity="same-object-scale-translation" style="--dock:${docking};--build:${build}">
    ${renderEvidenceCore(state.activeEvidenceId)}
  </section>`;
}

function renderSynthesis(): string {
  return `<section class="synthesis-stage" data-synthesis-uses="democracy-trust democracy-participation" data-derived-evidence-id="democracy-open-question">
    <div class="fixture-label">DEMO · ILLUSTRATION</div>
    <small class="evidence-kind">ZUSAMMENFÜHRUNG</small>
    <h1>Erst die Beziehung ergibt ein Bild.</h1>
    <div class="synthesis-flow">
      <div class="synthesis-source">${renderEvidenceCore("democracy-trust")}</div>
      <div class="relationship-line"><i></i><span>zusammen betrachten</span><i></i></div>
      <div class="synthesis-source">${renderEvidenceCore("democracy-participation")}</div>
    </div>
    <div class="derived-question">${renderEvidenceCore("democracy-open-question")}</div>
  </section>`;
}

function renderHostPrompt(speakerId: string | undefined, atSeconds: number, speakerStart: number): string {
  if (speakerId === "voxy-democracy-opening") {
    const reveal = smooth((atSeconds - speakerStart - 3.4) / 2.2);
    return `<section class="host-prompt democracy-question" style="--reveal:${reveal}" data-host-review-frame="democracy-question">
      <small>DEMOKRATIE BEGINNT IM ALLTAG</small>
      <strong>Wird meine Stimme<br>eigentlich gehört?</strong>
    </section>`;
  }
  if (speakerId === "voxy-verifiability") {
    return `<section class="host-prompt verifiability"><small>NICHT GLAUBEN MÜSSEN</small><strong>Prüfen können.</strong></section>`;
  }
  return "";
}

export function renderVoxyDualVoicePilotFrameHtml(input: {
  plan: VoxyExplainerPilotPlan;
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
    ? { mouthState: "closed" as const, mouthNextState: "closed" as const, mouthMix: 0 }
    : audioMouth;
  const sourceDurationFrames = 22 * input.plan.output.fps;
  const sourceFrameIndex = editorial
    ? Math.floor(input.frameIndex % (2.2 * input.plan.output.fps))
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
      kicker: "",
      title: "",
      brand: "",
      caption: "",
    },
  });

  const informational = visual.state !== "HOST";
  const injected = `${informational ? '<div class="information-dimmer"></div>' : ""}
    ${renderHostPrompt(speaker?.id, atSeconds, speaker?.start ?? 0)}
    ${visual.state === "SYNTHESIS" ? renderSynthesis() : renderActiveEvidence(visual, progress)}
    ${renderMemory(visual)}`;

  const css = `
.caption-bar,.portrait-caption,.editorial-cue{display:none!important}.information-dimmer{position:absolute;z-index:12;inset:28px;border-radius:21px;background:linear-gradient(90deg,rgba(1,6,18,.38) 0%,rgba(1,6,18,.48) 50%,rgba(1,6,18,.78) 100%);box-shadow:inset 0 0 100px rgba(2,9,28,.38)}.host-prompt{position:absolute;z-index:14;right:110px;top:245px;width:610px;padding:38px 42px;border-left:3px solid #00d9c0;background:linear-gradient(90deg,rgba(2,11,30,.88),rgba(2,11,30,.34));box-shadow:0 28px 80px rgba(0,0,0,.26)}.host-prompt small{display:block;margin-bottom:18px;color:#66e6df;font-size:13px;font-weight:900;letter-spacing:.15em}.host-prompt strong{display:block;font-size:53px;line-height:1.05;letter-spacing:-.035em}.democracy-question{opacity:var(--reveal);transform:translateY(calc((1 - var(--reveal))*18px))}.verifiability{top:300px;width:520px}.verifiability strong{font-size:59px}.information-stage{position:absolute;z-index:20;left:1030px;top:220px;width:820px;height:410px;padding:38px 42px;border:1px solid rgba(83,158,244,.52);border-radius:27px;background:linear-gradient(145deg,rgba(5,18,45,.97),rgba(2,9,25,.985));box-shadow:0 35px 95px rgba(0,0,0,.52),0 0 62px rgba(21,112,255,.13);transform-origin:0 0;transform:translate(calc(var(--dock)*445px),calc(var(--dock)*630px)) scale(calc(1 - var(--dock)*.56));overflow:hidden}.evidence-core{position:relative;width:100%;height:100%;color:#fff}.fixture-label{display:inline-flex;padding:7px 11px;border:1px solid rgba(0,217,192,.42);border-radius:999px;background:rgba(0,217,192,.1);color:#6cece2;font-size:11px;font-weight:900;letter-spacing:.14em}.evidence-kind{display:block;margin-top:22px;color:#8eb8ea;font-size:13px;font-weight:900;letter-spacing:.17em}.evidence-core h1{max-width:700px;margin:12px 0 0;font-size:42px;line-height:1.02;letter-spacing:-.035em}.trend-chart{position:relative;height:190px;margin-top:22px;padding:10px 14px 25px 30px;border-radius:17px;background:rgba(8,30,67,.62)}.trend-chart svg{width:100%;height:145px;overflow:visible}.axis{position:absolute;background:rgba(139,178,224,.22)}.axis-x{left:29px;right:17px;bottom:31px;height:1px}.axis-y{left:29px;top:15px;bottom:31px;width:1px}.trend-line{fill:none;stroke:#20d8cb;stroke-width:7;stroke-linecap:round;stroke-dasharray:800;stroke-dashoffset:calc((1 - var(--build))*800)}.trend-chart circle{fill:#04152f;stroke:#78eee4;stroke-width:4;opacity:var(--build)}.trend-note{position:absolute;right:16px;bottom:9px;color:#92aecb;font-size:10px;font-weight:750;letter-spacing:.05em}.participation-chart{display:flex;align-items:flex-end;gap:18px;height:174px;margin-top:22px;padding:20px 30px 0;border-bottom:1px solid rgba(139,178,224,.24);border-left:1px solid rgba(139,178,224,.24);background:linear-gradient(180deg,rgba(8,30,67,.56),rgba(8,30,67,.2))}.participation-chart i{flex:1;height:calc(var(--bar)*145px*var(--build));border-radius:8px 8px 0 0;background:linear-gradient(180deg,#347fff,#164797);box-shadow:0 0 24px rgba(28,104,235,.16)}.evidence-participation>.trend-note{position:static;display:block;margin-top:11px;text-align:right}.evidence-question{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:10px 25px}.evidence-question .fixture-label,.evidence-question .evidence-kind{grid-column:1/3}.question-ring{display:grid;width:78px;height:78px;place-items:center;border:2px solid #ffb45e;border-radius:50%;color:#ffd29e;font-size:45px;font-weight:900;box-shadow:0 0 35px rgba(255,172,79,.17)}.evidence-question h1{font-size:34px}.evidence-memory{position:absolute;z-index:24;right:57px;bottom:44px;width:390px;padding:18px;border:1px solid rgba(72,139,222,.42);border-radius:19px;background:linear-gradient(155deg,rgba(3,14,36,.97),rgba(1,7,20,.985));box-shadow:0 28px 75px rgba(0,0,0,.42)}.evidence-memory header{display:flex;justify-content:space-between;margin-bottom:10px;color:#8bb9ec;font-size:10px;font-weight:900;letter-spacing:.14em}.evidence-memory header small{color:#5ee6de}.memory-card{height:160px;margin-top:10px;padding:15px 17px;border-left:3px solid #1ed4c6;border-radius:11px;background:rgba(9,31,67,.86);overflow:hidden}.memory-card .fixture-label{padding:3px 7px;font-size:7px}.memory-card .evidence-kind{margin-top:8px;font-size:8px}.memory-card h1{margin-top:5px;font-size:17px;line-height:1.05}.memory-card .trend-chart{height:58px;margin-top:7px;padding:0 4px;background:transparent}.memory-card .trend-chart svg{height:50px}.memory-card .axis,.memory-card .trend-note,.memory-card .participation-chart+.trend-note{display:none}.memory-card .participation-chart{height:58px;margin-top:7px;padding:6px 8px 0;gap:5px;background:transparent}.memory-card .participation-chart i{height:calc(var(--bar)*48px)}.memory-card .evidence-question{display:grid;grid-template-columns:42px 1fr;gap:5px 10px}.memory-card .evidence-question .fixture-label,.memory-card .evidence-question .evidence-kind{grid-column:1/3}.memory-card .question-ring{width:38px;height:38px;font-size:20px}.memory-card .evidence-question h1{font-size:15px}.synthesis-stage{--build:1;position:absolute;z-index:20;left:965px;top:150px;width:880px;height:590px;padding:40px 45px;border:1px solid rgba(85,157,241,.5);border-radius:28px;background:linear-gradient(145deg,rgba(5,18,45,.975),rgba(2,9,25,.99));box-shadow:0 35px 95px rgba(0,0,0,.52)}.synthesis-stage>h1{margin:12px 0 18px;font-size:41px;letter-spacing:-.035em}.synthesis-flow{display:grid;grid-template-columns:1fr 120px 1fr;align-items:center;gap:12px}.synthesis-source{height:205px;padding:17px;border:1px solid rgba(67,137,224,.4);border-radius:15px;background:rgba(8,30,67,.68);overflow:hidden}.synthesis-source .fixture-label{font-size:7px;padding:3px 6px}.synthesis-source .evidence-kind{margin-top:8px;font-size:8px}.synthesis-source h1{margin-top:5px;font-size:18px}.synthesis-source .trend-chart,.synthesis-source .participation-chart{height:90px;margin-top:9px}.synthesis-source .trend-chart svg{height:75px}.synthesis-source .trend-note{display:none}.relationship-line{display:grid;gap:9px;place-items:center;color:#8ab0da;font-size:9px;font-weight:850;text-align:center;letter-spacing:.08em}.relationship-line i{width:100%;height:1px;background:linear-gradient(90deg,transparent,#38d6cc,transparent)}.derived-question{height:130px;margin-top:18px;padding:13px 18px;border:1px solid rgba(255,177,94,.52);border-radius:15px;background:rgba(60,35,12,.28)}.derived-question .evidence-core{display:grid;grid-template-columns:55px 1fr;gap:4px 14px}.derived-question .fixture-label,.derived-question .evidence-kind{grid-column:1/3}.derived-question .fixture-label{font-size:7px;padding:3px 6px}.derived-question .evidence-kind{margin-top:4px;font-size:8px}.derived-question .question-ring{width:48px;height:48px;font-size:26px}.derived-question h1{font-size:21px}`;

  return baseHtml
    .replace("</style>", `${css}</style>`)
    .replace('<div class="frame"></div>', `${injected}<div class="frame"></div>`)
    .replace(
      '<main class="viewport"',
      `<main class="viewport" data-pilot-version="1.1" data-pilot-state="${visual.state}" data-speaker-role="${speaker?.speakerRole ?? "none"}" data-active-evidence-id="${visual.activeEvidenceId ?? "none"}" data-docked-evidence-count="${visual.dockedEvidenceIds.length}" data-editorial-mouth-neutral="${editorial}" data-burned-in-captions="false"`,
    );
}
