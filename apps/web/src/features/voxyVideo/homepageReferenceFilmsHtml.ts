import type { VoxyFinalLayoutPlan } from "./dualVoiceExplainerPilot";
import { renderVoxyDualVoicePilotFrameHtml } from "./dualVoiceExplainerPilotHtml";
import {
  homepageVisualStateAt,
  type VoxyHomepageReferenceFilmPlan,
} from "./homepageReferenceFilms";
import type { VoxyMotionV4EmbeddedAssets } from "./motionV4Html";

const escapeHtml = (value: string): string => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const clamp01 = (value: number): number => Math.max(0, Math.min(1, value));

function currentSegment(plan: VoxyHomepageReferenceFilmPlan, at: number) {
  return plan.speakerTimeline.find((entry) => at >= entry.start && at < entry.end)
    ?? plan.speakerTimeline.at(-1)!;
}

function segmentProgress(plan: VoxyHomepageReferenceFilmPlan, at: number): number {
  const segment = currentSegment(plan, at);
  return clamp01((at - segment.start) / Math.max(0.001, segment.end - segment.start));
}

function renderEdebateForensics(
  plan: VoxyHomepageReferenceFilmPlan,
  at: number,
  eventProgress: number,
): string {
  const segment = currentSegment(plan, at);
  const progress = segmentProgress(plan, at);
  const forensicQuestion = (() => {
    if (segment.id === "edebatte-source-questions") return "ZEIGT DIE QUELLE WIRKLICH DAS, WAS DIE HEADLINE BEHAUPTET?";
    if (segment.id === "edebatte-media-forensics") return "QUELLE ≠ INTERPRETATION";
    if (segment.id === "edebatte-product-model") return "ZURÜCK ZUM BELEG";
    if (segment.id === "edebatte-current-offer") return "THEMA · STATEMENT · KONTEXT · PRÜFBEITRAG";
    if (segment.id === "edebatte-next-generation") return "VERTRAUEN + NACHPRÜFBARKEIT";
    if (segment.id === "edebatte-synthesis-questions") return "WO ENDET DER BELEG?";
    if (segment.id === "edebatte-verifiability" || segment.id === "edebatte-cta") return "PRÜFEN STATT GLAUBEN";
    return "DIE SCHLAGZEILE IST DER ANFANG";
  })();
  const mediaItems = [
    ["HEADLINE", "Behauptung"],
    ["PUSH", "Tempo"],
    ["ZAHL", "Kontext?"],
    ["ZITAT", "Original?"],
  ] as const;
  const traceItems = ["HEADLINE", "PRIMÄRQUELLE", "PASSAGE", "KONTEXT", "GEGENPOSITION", "OFFEN"];
  const activeTrace = Math.min(traceItems.length - 1, Math.floor(progress * traceItems.length));

  return `<section class="homepage-distinctive-stage edebatte-forensics" data-visual-language="media_forensics" data-segment-id="${escapeHtml(segment.id)}" style="--segment-progress:${progress.toFixed(4)};--event-progress:${eventProgress.toFixed(4)}">
    <div class="forensics-topline"><b>eDEBATTE · MEDIENFORENSIK</b><span>HEADLINE → BELEG</span></div>
    <div class="media-wall" aria-label="Illustrative Medienwand ohne reale Schlagzeilen">
      ${mediaItems.map(([kind, label], index) => `<div class="media-tile ${index === activeTrace % mediaItems.length ? "active" : ""}" style="--tile:${index}"><small>${kind}</small><strong>${label}</strong><i></i><i></i><i></i></div>`).join("")}
    </div>
    <div class="source-lab">
      <div class="source-document" data-illustrative-source="true">
        <header><span>ILLUSTRATIVER QUELLENCHECK</span><b>PRIMÄRQUELLE</b></header>
        <div class="document-line wide"></div><div class="document-line"></div><div class="document-line medium"></div>
        <div class="document-highlight" style="--scan:${Math.max(.08, progress).toFixed(4)}"><span>RELEVANTE PASSAGE</span></div>
        <div class="document-line"></div><div class="document-line short"></div>
        <footer><span>AKTEUR</span><span>DATUM</span><span>KONTEXT</span></footer>
      </div>
      <div class="forensic-question"><small>PRÜFFRAGE</small><strong>${escapeHtml(forensicQuestion)}</strong><span>${escapeHtml(segment.id === "edebatte-election-noise" ? "Tempo darf die Quellenprüfung nicht ersetzen." : "Aussage, Herkunft und Interpretation getrennt betrachten.")}</span></div>
    </div>
    <div class="forensic-trace" data-active-step="${activeTrace}">
      ${traceItems.map((item, index) => `<div class="trace-step ${index <= activeTrace ? "reached" : ""}"><i></i><span>${item}</span></div>`).join("")}
    </div>
  </section>`;
}

function renderVoiceOpenGovJourney(
  plan: VoxyHomepageReferenceFilmPlan,
  at: number,
  eventProgress: number,
): string {
  const segment = currentSegment(plan, at);
  const progress = segmentProgress(plan, at);
  const process = ["WAHLTAG", "PROGRAMM", "VERHANDLUNG", "ENTWURF", "BESCHLUSS", "UMSETZUNG", "WIRKUNG"];
  const activeProcess = Math.min(process.length - 1, Math.floor(progress * process.length));
  const showElectionDates = segment.id === "vog-election-calendar" || segment.id === "vog-berlin-sixteen";
  const showDemophobie = segment.id === "vog-demophobie" || segment.id === "vog-participation-balance";
  const showPeople = ["vog-participation-balance", "vog-current-offer", "vog-synthesis", "vog-cta"].includes(segment.id);

  return `<section class="homepage-distinctive-stage vog-journey" data-visual-language="democratic_journey" data-segment-id="${escapeHtml(segment.id)}" style="--segment-progress:${progress.toFixed(4)};--event-progress:${eventProgress.toFixed(4)}">
    <div class="journey-topline"><b>VOICEOPENGOV · DEMOKRATIE IN BEWEGUNG</b><span>WAHLTAG → WIRKUNG</span></div>
    <div class="ballot-zone">
      <div class="ballot-paper"><small>DEINE STIMME</small><div class="ballot-box"><i></i><i></i><b>×</b></div><strong>WAHLTAG</strong></div>
      <div class="time-arrow"><i></i><span>DER WEG GEHT WEITER</span></div>
    </div>
    <div class="democracy-path" data-active-step="${activeProcess}">
      ${process.map((item, index) => `<div class="democracy-node ${index <= activeProcess ? "reached" : ""}"><i></i><span>${item}</span>${index < process.length - 1 ? "<b>→</b>" : ""}</div>`).join("")}
    </div>
    ${showElectionDates ? `<div class="election-ribbon"><small>SEPTEMBER 2026</small><span><b>06.09.</b> Sachsen-Anhalt</span><span><b>13.09.</b> Niedersachsen</span><span><b>20.09.</b> Berlin</span><span><b>20.09.</b> Mecklenburg-Vorpommern</span>${segment.id === "vog-berlin-sixteen" ? '<em>BERLIN · AB 16</em>' : ""}</div>` : ""}
    ${showDemophobie ? `<div class="demophobie-panel"><small>DISKUSSIONSIMPULS · 2023</small><h2>DEMOPHOBIE?</h2><strong>Muss man die direkte Demokratie fürchten?</strong><p>Gertrude Lübbe-Wolff · Vittorio Klostermann</p><div><span>NICHT: ALLES DIREKT</span><i></i><span>NICHT: NUR ZUSCHAUEN</span></div></div>` : ""}
    ${showPeople ? `<div class="citizen-network" aria-label="Illustratives Netzwerk gleichberechtigter Beteiligung"><span class="citizen c1"></span><span class="citizen c2"></span><span class="citizen c3"></span><span class="citizen c4"></span><span class="citizen c5"></span><span class="citizen c6"></span><i class="link l1"></i><i class="link l2"></i><i class="link l3"></i><i class="link l4"></i><b>BETEILIGUNG ZWISCHEN DEN WAHLEN</b></div>` : ""}
  </section>`;
}

function renderDistinctiveStage(
  plan: VoxyHomepageReferenceFilmPlan,
  at: number,
  eventProgress: number,
): string {
  return plan.filmId === "edebatte"
    ? renderEdebateForensics(plan, at, eventProgress)
    : renderVoiceOpenGovJourney(plan, at, eventProgress);
}

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
  const window = Math.max(0.5, (nextEvent?.at ?? plan.output.durationMs / 1_000) - event.at);
  const eventProgress = Math.max(0, Math.min(1, (at - event.at) / window));
  const visualState = homepageVisualStateAt(plan, at);
  const base = renderVoxyDualVoicePilotFrameHtml({
    plan: plan as unknown as VoxyFinalLayoutPlan,
    assets: input.assets,
    frameIndex,
    amplitude: input.amplitude,
  });
  const semanticMotion = `<div class="homepage-motion-cue" data-motion-event-id="${escapeHtml(event.id)}" data-motion-kind="${escapeHtml(event.motion)}" data-semantic-purpose="${escapeHtml(event.semanticPurpose)}" style="--event-progress:${eventProgress.toFixed(4)}">
    <span>${escapeHtml(plan.filmId === "edebatte" ? "HEADLINE · QUELLE · KONTEXT" : "WAHLTAG · BETEILIGUNG · WIRKUNG")}</span>
    <i></i>
  </div>`;
  const distinctiveStage = renderDistinctiveStage(plan, at, eventProgress);
  const css = `<style>
    .homepage-motion-cue{position:absolute;z-index:31;left:650px;top:82px;width:760px;display:grid;grid-template-columns:auto 1fr;align-items:center;gap:16px;pointer-events:none;opacity:calc(.5 + var(--event-progress)*.5);transform:translateX(calc((1 - var(--event-progress))*9px))}
    .homepage-motion-cue span{color:#7ddfdc;font-size:10px;font-weight:900;letter-spacing:.16em}.homepage-motion-cue i{height:2px;transform-origin:left;transform:scaleX(var(--event-progress));background:linear-gradient(90deg,#20d8cb,#347fff,transparent);box-shadow:0 0 16px rgba(32,216,203,.4)}
    .homepage-distinctive-stage{position:absolute;z-index:27;left:520px;top:142px;width:870px;height:590px;pointer-events:none;font-family:Inter,Arial,sans-serif;color:#f6fbff;overflow:hidden}
    [data-homepage-visual-state="FOCUS"] .information-stage,[data-homepage-visual-state="EXPLAIN"] .information-stage,[data-homepage-visual-state="SYNTHESIS"] .synthesis-stage{opacity:.035!important;filter:blur(8px)!important}
    [data-homepage-visual-state="DOCK"] .information-stage{opacity:.9!important;filter:none!important}

    .edebatte-forensics{display:grid;grid-template-rows:36px 132px 1fr 92px;gap:13px;padding:20px;border:1px solid rgba(73,204,210,.27);border-radius:20px;background:linear-gradient(155deg,rgba(2,14,29,.86),rgba(2,8,20,.7));box-shadow:inset 0 0 70px rgba(20,116,145,.08)}
    .forensics-topline,.journey-topline{display:flex;align-items:center;justify-content:space-between;color:#93afc9;font-size:9px;letter-spacing:.15em}.forensics-topline b{color:#5ce3d9}.forensics-topline span{color:#9fc4d8}
    .media-wall{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.media-tile{position:relative;padding:13px 14px;border:1px solid rgba(100,159,201,.26);border-radius:11px;background:rgba(7,28,50,.82);transform:translateY(calc((1 - var(--event-progress))*8px));opacity:.62;transition:none}.media-tile.active{opacity:1;border-color:rgba(73,226,217,.75);box-shadow:0 0 28px rgba(48,212,204,.12)}.media-tile small{display:block;color:#65d9d5;font-size:8px;font-weight:900;letter-spacing:.14em}.media-tile strong{display:block;margin:7px 0 12px;font-size:14px}.media-tile i{display:block;height:4px;margin-top:6px;border-radius:4px;background:rgba(142,177,204,.22)}.media-tile i:nth-of-type(2){width:78%}.media-tile i:nth-of-type(3){width:58%}
    .source-lab{display:grid;grid-template-columns:1.16fr .84fr;gap:14px}.source-document{position:relative;padding:18px;border:1px solid rgba(105,165,207,.38);border-radius:13px;background:linear-gradient(145deg,rgba(235,244,249,.96),rgba(211,225,234,.94));color:#102033;box-shadow:0 22px 45px rgba(0,0,0,.24);transform:translateX(calc((1 - var(--segment-progress))*10px))}.source-document header,.source-document footer{display:flex;justify-content:space-between;gap:12px;align-items:center;font-size:8px;letter-spacing:.11em}.source-document header span{color:#516e85}.source-document header b{color:#006f79}.source-document footer{position:absolute;left:18px;right:18px;bottom:15px;padding-top:10px;border-top:1px solid rgba(31,71,94,.15);color:#607a8e}.document-line{height:7px;margin-top:12px;border-radius:5px;background:rgba(38,66,82,.14);width:86%}.document-line.wide{margin-top:24px;width:100%}.document-line.medium{width:72%}.document-line.short{width:52%}.document-highlight{position:relative;height:34px;margin:15px -4px 3px;border-left:4px solid #00a9a0;background:linear-gradient(90deg,rgba(0,169,160,.19) calc(var(--scan)*100%),rgba(40,72,91,.06) calc(var(--scan)*100%));display:flex;align-items:center;padding-left:12px}.document-highlight span{font-size:9px;font-weight:900;letter-spacing:.12em;color:#006c70}
    .forensic-question{display:flex;flex-direction:column;justify-content:center;padding:20px;border:1px solid rgba(55,204,196,.34);border-radius:13px;background:linear-gradient(150deg,rgba(5,35,54,.93),rgba(3,17,35,.9))}.forensic-question small{color:#54dcd2;font-size:8px;font-weight:900;letter-spacing:.14em}.forensic-question strong{margin-top:12px;font-size:21px;line-height:1.05;letter-spacing:-.02em}.forensic-question span{margin-top:14px;color:#9eb8cd;font-size:10px;line-height:1.35}
    .forensic-trace{display:grid;grid-template-columns:repeat(6,1fr);align-items:center;gap:4px}.trace-step{display:flex;flex-direction:column;align-items:center;gap:9px;color:#58758e;font-size:8px;font-weight:900;letter-spacing:.08em}.trace-step i{width:13px;height:13px;border:2px solid rgba(104,151,185,.5);border-radius:50%;background:#07182c;box-shadow:0 0 0 5px rgba(19,61,89,.28)}.trace-step.reached{color:#b9eae6}.trace-step.reached i{border-color:#45d7ce;background:#22a9a2;box-shadow:0 0 0 5px rgba(37,194,187,.12),0 0 22px rgba(64,226,215,.28)}
    [data-homepage-film="edebatte"] .memory-card{border-left-color:#42d8d0!important;background:linear-gradient(135deg,rgba(5,43,62,.96),rgba(3,21,39,.95))!important}[data-homepage-film="edebatte"] .memory-stack>header span::after{content:" · QUELLENAKTE";color:#5fe4dc}

    .vog-journey{display:grid;grid-template-rows:36px 126px 105px 1fr;gap:14px;padding:20px;border:1px solid rgba(97,149,228,.26);border-radius:28px;background:radial-gradient(circle at 25% 30%,rgba(35,103,180,.18),transparent 36%),linear-gradient(155deg,rgba(3,12,30,.83),rgba(1,7,20,.7));box-shadow:inset 0 0 80px rgba(48,92,176,.08)}.journey-topline b{color:#77b6ff}.journey-topline span{color:#a7bdd4}
    .ballot-zone{display:flex;align-items:center;gap:22px}.ballot-paper{width:182px;height:112px;padding:13px 15px;border-radius:9px;background:#edf4f7;color:#102135;box-shadow:0 18px 40px rgba(0,0,0,.24);transform:rotate(calc((1 - var(--event-progress))*-2deg))}.ballot-paper small{font-size:8px;font-weight:900;letter-spacing:.12em;color:#516c80}.ballot-paper strong{display:block;margin-top:8px;font-size:12px}.ballot-box{position:relative;margin-top:9px;height:34px;border:1px solid rgba(22,50,70,.2);display:flex;align-items:center;padding:0 10px}.ballot-box i{width:14px;height:14px;border:2px solid #31516b;margin-right:9px}.ballot-box b{position:absolute;left:10px;top:-2px;font-size:32px;line-height:32px;color:#0f78a7;transform:scale(calc(.55 + var(--segment-progress)*.45));transform-origin:center}.time-arrow{flex:1;display:grid;grid-template-columns:1fr auto;align-items:center;gap:12px;color:#80a5c7;font-size:9px;font-weight:900;letter-spacing:.12em}.time-arrow i{height:3px;background:linear-gradient(90deg,#2e83cf,#54d2ca);transform-origin:left;transform:scaleX(max(.1,var(--segment-progress)));box-shadow:0 0 20px rgba(61,160,219,.24)}
    .democracy-path{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;align-items:start}.democracy-node{position:relative;display:grid;grid-template-columns:20px 1fr;grid-template-rows:20px auto;align-items:center;color:#57748f;font-size:8px;font-weight:900;letter-spacing:.06em}.democracy-node i{width:12px;height:12px;border-radius:50%;border:2px solid rgba(100,144,188,.5);background:#07162b}.democracy-node span{grid-column:1/3;margin-top:8px}.democracy-node b{position:absolute;right:3px;top:0;color:#31567b}.democracy-node.reached{color:#c8e0f4}.democracy-node.reached i{border-color:#69b8ff;background:#397fcb;box-shadow:0 0 18px rgba(81,168,237,.3)}
    .election-ribbon{display:grid;grid-template-columns:120px repeat(4,1fr);gap:7px;align-items:center;padding:14px 16px;border:1px solid rgba(83,139,215,.32);border-radius:13px;background:rgba(6,25,52,.88);color:#b2cae0;font-size:8px}.election-ribbon small{color:#67b6ff;font-weight:900;letter-spacing:.1em}.election-ribbon span{display:flex;flex-direction:column;gap:3px}.election-ribbon span b{color:#eff8ff;font-size:11px}.election-ribbon em{position:absolute;right:26px;margin-top:78px;padding:6px 9px;border-radius:10px;background:#164d7a;color:#bfe3ff;font-size:9px;font-style:normal;font-weight:900}
    .demophobie-panel{padding:18px 20px;border:1px solid rgba(104,150,229,.38);border-radius:17px;background:linear-gradient(145deg,rgba(13,35,72,.94),rgba(5,18,43,.93));transform:translateY(calc((1 - var(--segment-progress))*7px))}.demophobie-panel small{color:#75b7ff;font-size:8px;font-weight:900;letter-spacing:.13em}.demophobie-panel h2{margin:8px 0 0;font-size:35px;letter-spacing:.04em}.demophobie-panel strong{display:block;margin-top:4px;font-size:15px}.demophobie-panel p{margin:8px 0;color:#9fb8d0;font-size:9px}.demophobie-panel div{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;margin-top:13px;color:#c7d9e9;font-size:8px;font-weight:900;letter-spacing:.08em}.demophobie-panel div i{height:2px;background:linear-gradient(90deg,#4c8ed5,#4dd0c6)}
    .citizen-network{position:relative;height:145px;border:1px solid rgba(67,130,203,.25);border-radius:17px;background:radial-gradient(circle at center,rgba(37,111,171,.14),rgba(3,18,39,.78));overflow:hidden}.citizen{position:absolute;width:17px;height:17px;border:3px solid #75c6ff;border-radius:50%;background:#0e3159;box-shadow:0 0 22px rgba(79,178,239,.25)}.c1{left:12%;top:28%}.c2{left:31%;top:62%}.c3{left:46%;top:25%}.c4{left:61%;top:58%}.c5{left:78%;top:26%}.c6{left:88%;top:65%}.citizen-network .link{position:absolute;height:2px;background:rgba(90,184,226,.55);transform-origin:left}.l1{left:14%;top:38%;width:22%;transform:rotate(25deg)}.l2{left:33%;top:61%;width:20%;transform:rotate(-29deg)}.l3{left:48%;top:36%;width:20%;transform:rotate(24deg)}.l4{left:63%;top:60%;width:27%;transform:rotate(-22deg)}.citizen-network>b{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);padding:8px 12px;border-radius:12px;background:rgba(3,15,33,.88);color:#d6efff;font-size:9px;letter-spacing:.1em}
    [data-homepage-film="voiceopengov"] .memory-card{border-left-color:#5fa8ff!important;background:linear-gradient(135deg,rgba(11,38,82,.96),rgba(5,20,48,.95))!important}[data-homepage-film="voiceopengov"] .memory-stack>header span::after{content:" · DEMOKRATIEPFAD";color:#77b6ff}
  </style>`;
  return base
    .replace("</head>", `${css}</head>`)
    .replace('<div class="frame"></div>', `${semanticMotion}${distinctiveStage}<div class="frame"></div>`)
    .replace(
      'data-pilot-version="1.4-final-layout"',
      `data-pilot-version="homepage-reference-v1" data-homepage-film="${plan.filmId}" data-context-mode="${plan.contextMode}" data-visual-language="${plan.visualLanguage}" data-homepage-visual-state="${visualState.state}" data-motion-event-index="${eventIndex}"`,
    );
}
