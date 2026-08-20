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

const HOMEPAGE_VOG_LAPEL_PIN = `<svg class="character-mark lapel-pin homepage-vog-lapel-pin" viewBox="0 0 480 240" role="img" aria-label="VOG"><defs><linearGradient id="homepage-vog-pin-surface" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#111827"/><stop offset=".55" stop-color="#071126"/><stop offset="1" stop-color="#020714"/></linearGradient><linearGradient id="homepage-vog-pin-rim" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#D2D8E2"/><stop offset=".46" stop-color="#7E8A9D"/><stop offset="1" stop-color="#33435E"/></linearGradient></defs><rect x="14" y="18" width="452" height="204" rx="22" fill="url(#homepage-vog-pin-surface)" stroke="#02050D" stroke-width="24"/><rect x="22" y="26" width="436" height="188" rx="17" fill="none" stroke="url(#homepage-vog-pin-rim)" stroke-width="12"/><text x="240" y="158" fill="#FFFFFF" stroke="#020611" stroke-width="7" paint-order="stroke fill" font-family="Arial, Helvetica, sans-serif" font-size="108" font-weight="800" letter-spacing="3" text-anchor="middle">VOG</text></svg>`;

function replaceHomepageLapelPin(html: string): string {
  return html.replace(
    /<img class="character-mark lapel-pin"[^>]*>/,
    HOMEPAGE_VOG_LAPEL_PIN,
  );
}

function currentSegment(plan: VoxyHomepageReferenceFilmPlan, at: number) {
  const active = plan.speakerTimeline.find((entry) => at >= entry.start && at < entry.end);
  if (active) return active;

  const previous = [...plan.speakerTimeline]
    .reverse()
    .find((entry) => at >= entry.end);
  return previous ?? plan.speakerTimeline[0]!;
}

function segmentProgress(plan: VoxyHomepageReferenceFilmPlan, at: number): number {
  const segment = currentSegment(plan, at);
  return clamp01((at - segment.start) / Math.max(0.001, segment.end - segment.start));
}

function segmentOrdinal(plan: VoxyHomepageReferenceFilmPlan, at: number): number {
  const segment = currentSegment(plan, at);
  return Math.max(0, plan.speakerTimeline.findIndex((entry) => entry.id === segment.id));
}

function renderBrandHierarchy(plan: VoxyHomepageReferenceFilmPlan): string {
  return plan.filmId === "edebatte"
    ? `<div class="homepage-brand-hierarchy edebatte-brand-primary"><strong>eDebatte</strong><span>VoiceOpenGov · demokratischer Kontext</span></div>`
    : `<div class="homepage-brand-hierarchy vog-brand-primary"><strong>VoiceOpenGov</strong><span>eDebatte · prüfbare Grundlage</span></div>`;
}

function renderEdebateForensics(
  plan: VoxyHomepageReferenceFilmPlan,
  at: number,
  eventProgress: number,
): string {
  const segment = currentSegment(plan, at);
  const progress = segmentProgress(plan, at);
  const ordinal = segmentOrdinal(plan, at);
  const opening = segment.id === "edebatte-greeting" || segment.id === "edebatte-election-noise";
  const sourcePull = segment.id === "edebatte-source-questions";
  const forensicSplit = segment.id === "edebatte-media-forensics";
  const trace = segment.id === "edebatte-product-model" || segment.id === "edebatte-current-offer";
  const synthesis = segment.id === "edebatte-next-generation" || segment.id === "edebatte-synthesis-questions";
  const resolution = segment.id === "edebatte-verifiability" || segment.id === "edebatte-cta";
  const reached = Math.min(
    5,
    Math.max(0, Math.round((ordinal / Math.max(1, plan.speakerTimeline.length - 1)) * 5)),
  );
  const synthesisPhase = progress < .34 ? "source" : progress < .67 ? "context" : "counter";

  const sourceObject = `<article class="case-source-object" data-illustrative-source="true">
    <header><span>ILLUSTRATIVER QUELLENCHECK</span><b>PRIMÄRQUELLE</b></header>
    <i class="source-line wide"></i><i class="source-line"></i><i class="source-line medium"></i>
    <div class="source-passage" style="--passage:${Math.max(.12, progress).toFixed(4)}"><span>RELEVANTE PASSAGE</span></div>
    <i class="source-line"></i><i class="source-line short"></i>
    <footer><span>AKTEUR</span><span>DATUM</span><span>KONTEXT</span></footer>
  </article>`;

  const headlineObject = `<article class="case-headline-object">
    <small>BEHAUPTUNG</small><strong>DIE HEADLINE</strong><span>Was genau wird hier behauptet?</span><i></i>
  </article>`;

  const openingScene = progress < .58
    ? `<div class="headline-swarm" aria-label="Illustrative Medienimpulse ohne reale Schlagzeilen">
        <span class="swarm s1">PUSH</span><span class="swarm s2">ZAHL</span><span class="swarm s3">ZITAT</span><span class="swarm s4">STUDIE</span>
        ${headlineObject}
      </div>`
    : `<div class="headline-freeze-scene"><div class="freeze-ring"><b>STOPP.</b><span>Zurück zur Quelle.</span></div></div>`;

  const sourceScene = progress < .33
    ? `<div class="source-pull-scene source-phase-claim">${headlineObject}</div>`
    : progress < .66
      ? `<div class="source-pull-scene source-phase-link"><div class="source-claim-chip">DIE HEADLINE</div><div class="evidence-beam"><i></i><span>BELEGEN</span></div>${sourceObject}</div>`
      : `<div class="source-pull-scene source-phase-primary">${sourceObject}</div>`;

  const splitScene = progress < .28
    ? `<div class="forensic-split-scene"><div class="claim-token number"><small>ZAHL</small><b>WERT</b><span>ohne Kontext?</span></div></div>`
    : progress < .52
      ? `<div class="forensic-split-scene"><div class="claim-token quote"><small>ZITAT</small><b>„…“</b><span>im Original?</span></div></div>`
      : progress < .76
        ? `<div class="forensic-split-scene"><div class="claim-token study"><small>STUDIE</small><b>PDF</b><span>oder Interpretation?</span></div></div>`
        : `<div class="forensic-split-scene forensic-source-resolution">${sourceObject}<div class="split-rule"><span>QUELLE</span><i></i><span>INTERPRETATION</span></div></div>`;

  const traceItems = ["AUSSAGE", "QUELLE", "PASSAGE", "KONTEXT", "GEGENPOSITION", "OFFEN"];
  const traceScene = `<div class="case-trace-scene">
    <div class="trace-axis">${traceItems.map((item, index) => `<div class="trace-node ${index <= reached ? "reached" : ""}" style="--node:${index}"><i></i><b>${item}</b>${index < traceItems.length - 1 ? '<span></span>' : ''}</div>`).join("")}</div>
    <div class="trace-copy"><small>eDEBATTE · PRÜFPFAD</small><strong>${segment.id === "edebatte-current-offer" ? "Öffentliche Themen zurück zum Beleg verfolgen." : "Nicht nur das Ergebnis zeigen. Den Weg dorthin zeigen."}</strong></div>
  </div>`;

  const synthesisScene = `<div class="case-synthesis-scene" data-face-safe-route="outside-host-corridor" data-synthesis-phase="${synthesisPhase}">
    <div class="synthesis-orbit source"><small>QUELLE</small><b>01</b></div>
    <div class="synthesis-orbit context"><small>KONTEXT</small><b>02</b></div>
    <div class="synthesis-orbit counter"><small>GEGENPOSITION</small><b>03</b></div>
    <div class="synthesis-core"><small>NACHPRÜFBARKEIT</small><strong>${segment.id === "edebatte-synthesis-questions" ? "WO ENDET DER BELEG?" : "VERTRAUEN + PRÜFBARKEIT"}</strong><span>Was wissen wir? Was spricht dagegen? Was fehlt?</span></div>
    <svg viewBox="0 0 900 470" aria-hidden="true" data-face-safe-routes="left-and-right-only"><path d="M120 135 C165 140 195 158 225 185"/><path d="M760 130 C710 165 660 195 605 225"/><path d="M650 360 C700 325 735 285 765 240"/></svg>
  </div>`;

  const resolutionScene = `<div class="case-resolution-scene">
    <div class="verification-pulse"><i></i><i></i><i></i><b>PRÜFBAR</b></div>
    <strong>${segment.id === "edebatte-cta" ? "DANN GEH EINEN SCHRITT WEITER." : "DU SOLLST ES PRÜFEN KÖNNEN."}</strong>
    <span>Headline → Quelle → Kontext → Gegenposition → offene Frage</span>
    <div class="memory-flight"><i></i><small>BELEG BLEIBT SICHTBAR</small></div>
  </div>`;

  return `<section class="homepage-distinctive-stage edebatte-forensics object-led-scene" data-visual-language="media_forensics" data-segment-id="${escapeHtml(segment.id)}" style="--segment-progress:${progress.toFixed(4)};--event-progress:${eventProgress.toFixed(4)}">
    <div class="scene-kicker"><b>eDEBATTE · MEDIENFORENSIK</b><span>RECHERCHE WIRD ZUR SZENE</span></div>
    ${opening ? openingScene : sourcePull ? sourceScene : forensicSplit ? splitScene : trace ? traceScene : synthesis ? synthesisScene : resolution ? resolutionScene : openingScene}
  </section>`;
}

function renderVoiceOpenGovJourney(
  plan: VoxyHomepageReferenceFilmPlan,
  at: number,
  eventProgress: number,
): string {
  const segment = currentSegment(plan, at);
  const progress = segmentProgress(plan, at);
  const afterElection = segment.id === "vog-after-election";
  const programmeGap = segment.id === "vog-program-not-contract";
  const demophobie = segment.id === "vog-demophobie";
  const balance = segment.id === "vog-participation-balance";
  const currentOffer = segment.id === "vog-current-offer";
  const synthesis = segment.id === "vog-synthesis";
  const cta = segment.id === "vog-cta";

  const loop = `<div class="democratic-loop" style="--loop:${progress.toFixed(4)}">
    <div class="loop-node n1"><i></i><span>STIMME</span></div>
    <div class="loop-node n2"><i></i><span>PRIORITÄT</span></div>
    <div class="loop-node n3"><i></i><span>REAKTION</span></div>
    <div class="loop-node n4"><i></i><span>ENTSCHEIDUNG</span></div>
    <div class="loop-node n5"><i></i><span>WIRKUNG</span></div>
    <div class="loop-node n6"><i></i><span>RÜCKKOPPLUNG</span></div>
    <svg viewBox="0 0 920 500" aria-hidden="true"><path d="M180 250 C240 95 565 65 730 190 C820 260 805 370 680 410 C500 470 245 410 180 250"/></svg>
    <div class="mandate-pulse"><i></i><b>DEINE STIMME</b></div>
  </div>`;

  const process = `<div class="living-mandate-path">
    <div class="mandate-origin"><i></i><small>WAHL</small><b>×</b></div>
    <div class="mandate-track"><i></i><span>DER WEG GEHT WEITER</span></div>
    ${["PROGRAMM", "VERHANDLUNG", "BESCHLUSS", "UMSETZUNG", "WIRKUNG"].map((item, index) => `<div class="mandate-step ${index <= Math.floor(progress * 5) ? "active" : ""}" style="--step:${index}"><i></i><b>${item}</b></div>`).join("")}
    <div class="moving-mandate" style="--travel:${progress.toFixed(4)}"><span>MANDAT?</span></div>
  </div>`;

  const programme = progress < .34
    ? `<div class="programme-gap-scene programme-phase-promise"><div class="promise-object"><small>WAHLVERSPRECHEN</small><strong>PROGRAMM</strong><span>politische Absicht</span></div></div>`
    : progress < .66
      ? `<div class="programme-gap-scene programme-phase-gap"><div class="gap-field"><b>≠</b><span>PROGRAMM IST NICHT BESCHLUSS</span><em>VERBINDLICHKEIT?</em></div></div>`
      : `<div class="programme-gap-scene programme-phase-decision"><div class="decision-object"><small>POLITISCHER STATUS</small><strong>BESCHLUSS</strong><span>erst später möglich</span></div><div class="status-ruler"><i></i><span>AUSSAGE</span><span>PLAN</span><span>ANTRAG</span><span>ABSTIMMUNG</span><span>BESCHLUSS</span><span>WIRKUNG</span></div></div>`;

  const demophobieScene = progress < .34
    ? `<div class="demophobie-space demophobie-phase-source"><div class="demophobie-source"><small>DISKUSSIONSIMPULS · 2023</small><strong>DEMOPHOBIE?</strong><span>Gertrude Lübbe-Wolff · Vittorio Klostermann</span></div></div>`
    : progress < .7
      ? `<div class="demophobie-space demophobie-phase-question"><div class="design-question"><small>GESTALTUNGSFRAGE</small><b>Wie viel direkte Entscheidung trauen wir Bürgern zu?</b></div></div>`
      : `<div class="demophobie-space demophobie-phase-guardrails"><div class="design-question"><small>GESTALTUNGSFRAGE</small><b>Direkte Entscheidung braucht demokratische Leitplanken.</b></div><div class="guardrail-row"><div class="guardrail">GRUNDRECHTE</div><div class="guardrail">MINDERHEITENSCHUTZ</div><div class="guardrail">RECHENSCHAFT</div><div class="guardrail">REVISION</div></div></div>`;

  const balanceScene = `<div class="participation-balance-scene">
    <div class="extreme left"><small>ZU WENIG</small><strong>NUR ZUSCHAUEN</strong></div>
    <div class="balance-core"><i></i><strong>WIRKSAME MITBESTIMMUNG</strong><span>Beteiligung braucht eine definierte Folge.</span></div>
    <div class="extreme right"><small>ZU EINFACH</small><strong>ALLES DIREKT</strong></div>
    <div class="balance-axis"><i></i></div>
  </div>`;

  const offerScene = progress < .36
    ? `<div class="vog-offer-scene offer-phase-current"><div class="current-layer"><small>HEUTE · CURRENT CAPABILITY</small><strong>MITMACHEN · INFORMIERT BLEIBEN</strong><span>Eintragen oder freiwillig unterstützen. Keine Stimmvorteile.</span></div></div>`
    : progress < .70
      ? `<div class="vog-offer-scene offer-phase-bridge"><div class="bridge"><i></i><span>VON BETEILIGUNG ZU SUBSTANZ</span></div></div>`
      : `<div class="vog-offer-scene offer-phase-future"><div class="future-layer"><small>ZIELBILD · NICHT ALS PRODUKTFUNKTION BEHAUPTET</small><strong>STIMME → FOLGE → RECHENSCHAFT → WIRKUNG</strong><span>Die demokratische Designfrage bleibt offen und prüfbar.</span></div></div>`;

  const closingScene = `<div class="vog-closing-scene">${loop}<div class="closing-copy"><small>VOICEOPENGOV</small><strong>${cta ? "DEINE STIMME IST MEHR ALS EIN KREUZ." : "NACHVOLLZIEHBARKEIT ZEIGT, WAS DARAUS WIRD."}</strong><span>Demokratie endet nicht am Wahltag.</span></div></div>`;

  return `<section class="homepage-distinctive-stage vog-journey object-led-scene" data-visual-language="democratic_journey" data-segment-id="${escapeHtml(segment.id)}" style="--segment-progress:${progress.toFixed(4)};--event-progress:${eventProgress.toFixed(4)}">
    <div class="scene-kicker vog"><b>VOICEOPENGOV · DEMOKRATIE IN BEWEGUNG</b><span>DER WEG GEHT WEITER</span></div>
    ${afterElection ? process : programmeGap ? programme : demophobie ? demophobieScene : balance ? balanceScene : currentOffer ? offerScene : synthesis || cta ? closingScene : loop}
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
  const segment = currentSegment(plan, at);
  let currentEventIndex = 0;
  for (const [index, entry] of plan.motionTimeline.entries()) {
    if (entry.at <= at) currentEventIndex = index;
  }
  const eventIndex = currentEventIndex;
  const event = plan.motionTimeline[eventIndex]!;
  const nextEvent = plan.motionTimeline[eventIndex + 1];
  const window = Math.max(0.5, (nextEvent?.at ?? plan.output.durationMs / 1_000) - event.at);
  const eventProgress = clamp01((at - event.at) / window);
  const visualState = homepageVisualStateAt(plan, at);
  const base = renderVoxyDualVoicePilotFrameHtml({
    plan: plan as unknown as VoxyFinalLayoutPlan,
    assets: input.assets,
    frameIndex,
    amplitude: input.amplitude,
  });
  const semanticMotion = `<div class="homepage-motion-cue" data-motion-event-id="${escapeHtml(event.id)}" data-motion-kind="${escapeHtml(event.motion)}" data-semantic-purpose="${escapeHtml(event.semanticPurpose)}" style="--event-progress:${eventProgress.toFixed(4)}"><i></i><span>${escapeHtml(plan.filmId === "edebatte" ? "QUELLE PRÜFEN" : "DEMOKRATISCHE WIRKUNG")}</span></div>`;
  const distinctiveStage = renderDistinctiveStage(plan, at, eventProgress);
  const brandHierarchy = renderBrandHierarchy(plan);

  const css = `<style>
    .studio-stage{filter:saturate(1.08) contrast(1.055) brightness(1.035)!important}.brand-lockup{display:none!important}.information-dimmer{background:linear-gradient(90deg,rgba(1,6,18,.05),rgba(1,6,18,.08) 58%,rgba(1,6,18,.42) 100%)!important;box-shadow:none!important}
    .homepage-brand-hierarchy{position:absolute;z-index:33;left:56px;top:126px;width:345px;display:flex;flex-direction:column;gap:7px;pointer-events:none}.homepage-brand-hierarchy strong{font-size:38px;line-height:1;font-weight:900;letter-spacing:-.045em}.homepage-brand-hierarchy span{font-size:12px;font-weight:800;letter-spacing:.055em;color:#8faec7}.edebatte-brand-primary strong,.vog-brand-primary strong{color:#f6fbff}.edebatte-brand-primary::after,.vog-brand-primary::after{content:"";height:3px;margin-top:2px;background:linear-gradient(90deg,#20d8cb,#347fff)}.edebatte-brand-primary::after{width:168px}.vog-brand-primary::after{width:190px;background:linear-gradient(90deg,#347fff,#20d8cb)}
    .homepage-motion-cue{position:absolute;z-index:33;left:446px;top:76px;display:flex;align-items:center;gap:10px;pointer-events:none;opacity:calc(.52 + var(--event-progress)*.38)}.homepage-motion-cue i{width:8px;height:8px;border-radius:50%;background:#3ee0d6;box-shadow:0 0 18px rgba(62,224,214,.55);transform:scale(calc(.7 + var(--event-progress)*.3))}.homepage-motion-cue span{color:#90bfd0;font-size:9px;font-weight:900;letter-spacing:.16em}
    .homepage-distinctive-stage{position:absolute;z-index:22;left:360px;top:132px;width:1060px;height:570px;pointer-events:none;font-family:Inter,Arial,sans-serif;color:#f6fbff;overflow:visible}.scene-kicker{position:absolute;left:0;top:0;right:20px;display:flex;justify-content:space-between;align-items:center;color:#7896ad;font-size:9px;letter-spacing:.16em}.scene-kicker b{color:#58e7df}.scene-kicker.vog b{color:#76b7ff}.scene-kicker span{font-weight:850}
    .broadcast-right-column{width:390px!important;right:48px!important}.topic-date-zone{min-height:118px!important;padding:16px 19px!important}.topic-date-zone strong{font-size:19px!important}.memory-stack{padding:13px 14px 14px!important}.broadcast-lower-third{left:50px!important;right:470px!important;bottom:45px!important;min-height:132px!important;padding:14px 20px!important;grid-template-columns:6px 1fr 165px!important}.lower-copy strong{font-size:24px!important}.lower-copy p{font-size:12px!important}.lower-meta{font-size:9px!important}
    [data-pilot-version="homepage-reference-v3-2-geometry-sync"][data-homepage-visual-state="FOCUS"] .broadcast-lower-third,[data-pilot-version="homepage-reference-v3-2-geometry-sync"][data-homepage-visual-state="EXPLAIN"] .broadcast-lower-third{min-height:86px!important;padding:10px 16px!important;grid-template-columns:4px 1fr 0!important;background:linear-gradient(135deg,rgba(3,16,38,.7),rgba(1,8,23,.78))!important;box-shadow:0 12px 28px rgba(0,0,0,.22)!important}[data-pilot-version="homepage-reference-v3-2-geometry-sync"][data-homepage-visual-state="FOCUS"] .lower-copy p,[data-pilot-version="homepage-reference-v3-2-geometry-sync"][data-homepage-visual-state="EXPLAIN"] .lower-copy p,[data-pilot-version="homepage-reference-v3-2-geometry-sync"][data-homepage-visual-state="FOCUS"] .lower-meta,[data-pilot-version="homepage-reference-v3-2-geometry-sync"][data-homepage-visual-state="EXPLAIN"] .lower-meta{display:none!important}[data-pilot-version="homepage-reference-v3-2-geometry-sync"][data-homepage-visual-state="FOCUS"] .lower-copy strong,[data-pilot-version="homepage-reference-v3-2-geometry-sync"][data-homepage-visual-state="EXPLAIN"] .lower-copy strong{font-size:20px!important}
    [data-homepage-segment-id="edebatte-source-questions"] .lower-copy strong,[data-homepage-segment-id="edebatte-source-questions"] .lower-copy p,[data-homepage-segment-id="edebatte-source-questions"] .lower-meta,[data-homepage-segment-id="edebatte-media-forensics"] .lower-copy strong,[data-homepage-segment-id="edebatte-media-forensics"] .lower-copy p,[data-homepage-segment-id="edebatte-media-forensics"] .lower-meta,[data-homepage-segment-id="edebatte-product-model"] .lower-copy strong,[data-homepage-segment-id="edebatte-product-model"] .lower-copy p,[data-homepage-segment-id="edebatte-product-model"] .lower-meta,[data-homepage-segment-id="edebatte-current-offer"] .lower-copy strong,[data-homepage-segment-id="edebatte-current-offer"] .lower-copy p,[data-homepage-segment-id="edebatte-current-offer"] .lower-meta,[data-homepage-segment-id="vog-program-not-contract"] .lower-copy strong,[data-homepage-segment-id="vog-program-not-contract"] .lower-copy p,[data-homepage-segment-id="vog-program-not-contract"] .lower-meta,[data-homepage-segment-id="vog-demophobie"] .lower-copy strong,[data-homepage-segment-id="vog-demophobie"] .lower-copy p,[data-homepage-segment-id="vog-demophobie"] .lower-meta,[data-homepage-segment-id="vog-current-offer"] .lower-copy strong,[data-homepage-segment-id="vog-current-offer"] .lower-copy p,[data-homepage-segment-id="vog-current-offer"] .lower-meta{display:none!important}
    .information-stage{left:1060px!important;top:165px!important;width:320px!important;height:92px!important;padding:10px 14px!important;border-radius:14px!important;background:linear-gradient(145deg,rgba(5,18,45,.88),rgba(2,9,25,.92))!important;box-shadow:0 16px 38px rgba(0,0,0,.3),0 0 24px rgba(21,112,255,.06)!important;--dock-scale:.55!important}.information-stage[data-evidence-id="edebatte-source-chain"],.information-stage[data-evidence-id="vog-evergreen-impact-loop"]{--dock-x:420px!important;--dock-y:105px!important}.information-stage[data-evidence-id="edebatte-status-ladder"],.information-stage[data-evidence-id="vog-accountability-chain"]{--dock-x:420px!important;--dock-y:245px!important}.information-stage .fixture-label{display:none!important}.information-stage .evidence-kind{margin-top:0!important;font-size:7px!important}.information-stage .evidence-core h1{max-width:290px!important;margin-top:5px!important;font-size:17px!important;line-height:1.02!important}.information-stage .trend-chart,.information-stage .participation-chart,.information-stage .question-ring,.information-stage .trend-note{display:none!important}.information-stage .evidence-question{display:block!important}.synthesis-stage{opacity:0!important;pointer-events:none!important}
    [data-homepage-film="edebatte"] .memory-card{border-left-color:#42d8d0!important;background:linear-gradient(135deg,rgba(5,43,62,.96),rgba(3,21,39,.95))!important}[data-homepage-film="edebatte"] .memory-stack>header span::after{content:" · QUELLENAKTE";color:#5fe4dc}[data-homepage-film="voiceopengov"] .memory-card{border-left-color:#5fa8ff!important;background:linear-gradient(135deg,rgba(11,38,82,.96),rgba(5,20,48,.95))!important}[data-homepage-film="voiceopengov"] .memory-stack>header span::after{content:" · WIRKUNGSPFAD";color:#77b6ff}

    .headline-swarm{position:absolute;inset:44px 55px 50px 15px}.headline-freeze-scene{position:absolute;inset:44px 55px 50px 15px}.swarm{position:absolute;padding:8px 11px;border:1px solid rgba(101,157,199,.32);border-radius:9px;background:rgba(6,23,45,.76);color:#7595ad;font-size:9px;font-weight:900;letter-spacing:.12em;opacity:calc(.35 + var(--event-progress)*.45)}.s1{left:1%;top:11%;transform:translate(calc((1 - var(--segment-progress))*-35px),calc((1 - var(--segment-progress))*-18px)) rotate(-5deg)}.s2{left:20%;top:2%;transform:translateY(calc((1 - var(--segment-progress))*-26px)) rotate(3deg)}.s3{right:10%;top:13%;transform:translate(calc((1 - var(--segment-progress))*31px),calc((1 - var(--segment-progress))*-12px)) rotate(4deg)}.s4{right:3%;bottom:17%;transform:translateX(calc((1 - var(--segment-progress))*35px)) rotate(-3deg)}
    .case-headline-object{position:absolute;width:310px;height:155px;padding:20px 22px;border-left:4px solid #48e2d7;border-radius:13px;background:linear-gradient(135deg,rgba(5,33,51,.96),rgba(3,17,35,.95));box-shadow:0 24px 58px rgba(0,0,0,.31),0 0 34px rgba(48,212,204,.09)}.case-headline-object small,.case-source-object header span,.claim-token small,.trace-copy small,.synthesis-core small,.vog-offer-scene small{color:#5ce3d9;font-size:8px;font-weight:900;letter-spacing:.14em}.case-headline-object strong{display:block;margin-top:10px;font-size:27px;letter-spacing:-.035em}.case-headline-object span{display:block;margin-top:8px;color:#a8c0d2;font-size:11px}.case-headline-object>i{display:block;width:74%;height:4px;margin-top:16px;border-radius:5px;background:linear-gradient(90deg,#45d9d0,rgba(70,137,195,.18))}
    .headline-swarm .case-headline-object{left:-18px;top:145px;transform:scale(calc(.92 + var(--segment-progress)*.08))}.freeze-ring{position:absolute;left:735px;top:142px;width:175px;height:175px;display:grid;place-content:center;text-align:center;border:2px solid rgba(67,218,209,.65);border-radius:50%;box-shadow:0 0 0 calc(var(--segment-progress)*18px) rgba(42,210,202,.04),0 0 65px rgba(42,210,202,.14)}.freeze-ring b{font-size:28px}.freeze-ring span{margin-top:7px;color:#93b2c7;font-size:10px}
    .source-pull-scene{position:absolute;inset:55px 35px 25px 20px}.source-pull-scene .case-headline-object{left:-18px;top:130px;transform:translateX(calc((1 - var(--segment-progress))*-18px))}.source-claim-chip{position:absolute;left:28px;top:160px;padding:10px 14px;border-left:3px solid #48e2d7;border-radius:9px;background:rgba(5,30,50,.86);font-size:11px;font-weight:900;letter-spacing:.08em}.case-source-object{position:absolute;width:430px;height:250px;padding:18px 20px;border-radius:12px;background:linear-gradient(145deg,#eaf3f7,#d3e2e9);color:#102033;box-shadow:0 24px 60px rgba(0,0,0,.28)}.source-pull-scene .case-source-object{right:-12px;top:76px;transform:translateX(calc((1 - var(--segment-progress))*18px)) scale(.78);transform-origin:100% 0}.case-source-object header,.case-source-object footer{display:flex;justify-content:space-between;align-items:center;font-size:8px;letter-spacing:.1em}.case-source-object header b{color:#006e76}.case-source-object footer{position:absolute;left:20px;right:20px;bottom:14px;color:#627d90;border-top:1px solid rgba(31,71,94,.15);padding-top:8px}.source-line{display:block;width:86%;height:6px;margin-top:11px;border-radius:5px;background:rgba(38,66,82,.14)}.source-line.wide{width:100%;margin-top:20px}.source-line.medium{width:70%}.source-line.short{width:48%}.source-passage{height:34px;margin:13px -3px 0;padding-left:12px;display:flex;align-items:center;border-left:4px solid #00a9a0;background:linear-gradient(90deg,rgba(0,169,160,.2) calc(var(--passage)*100%),rgba(40,72,91,.06) calc(var(--passage)*100%))}.source-passage span{font-size:8px;font-weight:900;letter-spacing:.12em;color:#006c70}.evidence-beam{position:absolute;left:250px;top:395px;width:360px;display:flex;align-items:center;gap:8px;color:#5be0d6;font-size:8px;font-weight:900;letter-spacing:.12em}.evidence-beam i{height:2px;flex:1;background:linear-gradient(90deg,#38d6cc,#3788e3);transform-origin:left;transform:scaleX(var(--segment-progress))}
    .forensic-split-scene{position:absolute;inset:48px 28px 30px 10px}.forensic-source-resolution .case-source-object{left:auto;right:-5px;top:78px;transform:scale(.78);transform-origin:100% 0}.claim-token{position:absolute;width:190px;height:112px;padding:16px 18px;border:1px solid rgba(76,156,209,.42);border-radius:14px;background:rgba(5,27,51,.94);box-shadow:0 18px 40px rgba(0,0,0,.22);transform:scale(calc(.92 + var(--segment-progress)*.08))}.claim-token b{display:block;margin-top:8px;font-size:28px}.claim-token span{display:block;margin-top:7px;color:#8eabc0;font-size:10px}.claim-token.number,.claim-token.quote,.claim-token.study{left:680px;top:145px;right:auto;bottom:auto}.split-rule{position:absolute;left:675px;bottom:42px;width:300px;display:grid;grid-template-columns:auto 1fr auto;gap:13px;align-items:center;color:#a9c4d7;font-size:9px;font-weight:900;letter-spacing:.1em}.split-rule i{height:2px;background:linear-gradient(90deg,#45d9d0,#ffb45e)}
    .case-trace-scene{position:absolute;inset:70px 30px 30px 20px}.trace-axis{position:absolute;left:5px;right:5px;top:385px;display:grid;grid-template-columns:repeat(6,1fr)}.trace-node{position:relative;display:flex;flex-direction:column;align-items:center;color:#557590;font-size:8px;letter-spacing:.08em}.trace-node i{width:18px;height:18px;border:2px solid #496b87;border-radius:50%;background:#07172b}.trace-node b{margin-top:11px}.trace-node span{position:absolute;left:58%;top:8px;width:84%;height:2px;background:#274f70}.trace-node.reached{color:#c1eee9}.trace-node.reached i{border-color:#49ded4;background:#169a95;box-shadow:0 0 24px rgba(59,220,210,.28)}.trace-node.reached span{background:linear-gradient(90deg,#3ed9d0,#397fd8)}.trace-copy{position:absolute;left:680px;top:195px;width:290px;text-align:right}.trace-copy strong{display:block;margin-top:9px;font-size:22px;line-height:1.08}.trace-copy small{color:#63dcd4}
    .case-synthesis-scene{position:absolute;inset:52px 35px 35px 20px}.synthesis-orbit{position:absolute;width:120px;height:120px;display:grid;place-content:center;text-align:center;border:1px solid rgba(87,162,215,.45);border-radius:50%;background:rgba(4,23,45,.82);box-shadow:0 0 45px rgba(41,119,183,.09)}.synthesis-orbit small{color:#87a9c2;font-size:8px;font-weight:900;letter-spacing:.1em}.synthesis-orbit b{font-size:24px;margin-top:4px}.synthesis-orbit.source{left:0;top:72px}.synthesis-orbit.context{right:10px;top:65px}.synthesis-orbit.counter{left:650px;bottom:18px}.synthesis-core{position:absolute;left:680px;top:150px;width:290px;text-align:right}.synthesis-core strong{display:block;margin-top:10px;font-size:26px;line-height:1.02}.synthesis-core span{display:block;margin-top:11px;color:#9cb7ca;font-size:11px}.case-synthesis-scene svg{position:absolute;inset:0;width:100%;height:100%}.case-synthesis-scene svg path{fill:none;stroke:#2d7f9d;stroke-width:2;stroke-dasharray:9 9;opacity:calc(.35 + var(--segment-progress)*.5)}
    .case-resolution-scene{position:absolute;left:680px;top:92px;width:300px;text-align:right}.verification-pulse{position:relative;width:145px;height:145px;margin-left:auto;display:grid;place-content:center;text-align:center;border:1px solid rgba(71,218,208,.62);border-radius:50%}.verification-pulse i{position:absolute;inset:15px;border:1px solid rgba(62,224,214,.25);border-radius:50%;transform:scale(calc(.8 + var(--segment-progress)*.22))}.verification-pulse i:nth-child(2){inset:32px}.verification-pulse i:nth-child(3){inset:49px}.verification-pulse b{font-size:16px;letter-spacing:.12em}.case-resolution-scene>strong{display:block;margin-top:20px;font-size:27px}.case-resolution-scene>span{display:block;margin-top:10px;color:#92b0c5;font-size:11px}.memory-flight{position:absolute;right:-55px;top:218px;width:210px;display:flex;align-items:center;gap:10px;color:#66ddd6;font-size:8px;font-weight:900;letter-spacing:.1em}.memory-flight i{height:2px;flex:1;background:linear-gradient(90deg,#39d7cd,#3d83dd);transform-origin:left;transform:scaleX(var(--segment-progress))}

    .democratic-loop{position:absolute;left:80px;top:55px;width:820px;height:440px}.democratic-loop svg{position:absolute;inset:0;width:100%;height:100%}.democratic-loop svg path{fill:none;stroke:#3d7bb5;stroke-width:3;stroke-dasharray:8 11;stroke-dashoffset:calc((1 - var(--loop))*80);opacity:.58}.loop-node{position:absolute;width:110px;height:70px;display:grid;place-content:center;text-align:center;color:#8daac3;font-size:8px;font-weight:900;letter-spacing:.08em}.loop-node i{width:13px;height:13px;margin:0 auto 7px;border-radius:50%;border:2px solid #5883aa;background:#081a32}.n1{left:55px;top:190px}.n2{left:170px;top:42px}.n3{left:395px;top:8px}.n4{right:90px;top:95px}.n5{right:42px;bottom:62px}.n6{left:295px;bottom:15px}.mandate-pulse{position:absolute;left:500px;top:170px;width:145px;height:145px;display:grid;place-content:center;text-align:center;border:1px solid rgba(95,175,255,.55);border-radius:50%;background:radial-gradient(circle,rgba(33,103,187,.22),rgba(4,20,45,.58));box-shadow:0 0 60px rgba(48,126,214,.11)}.mandate-pulse i{position:absolute;inset:18px;border:1px solid rgba(71,220,209,.38);border-radius:50%;transform:scale(calc(.75 + var(--loop)*.28))}.mandate-pulse b{font-size:13px;letter-spacing:.08em}
    .living-mandate-path{position:absolute;inset:65px 35px 45px 35px}.mandate-origin{position:absolute;left:0;top:150px;width:86px;height:86px;display:grid;place-content:center;text-align:center;border:1px solid rgba(97,174,245,.5);border-radius:50%;background:#081b36}.mandate-origin small{font-size:8px;color:#8eb4d4}.mandate-origin b{font-size:28px;color:#69b8ff}.mandate-track{position:absolute;left:100px;right:20px;top:190px;display:flex;align-items:center;gap:10px;color:#8eabc3;font-size:8px;font-weight:900;letter-spacing:.1em}.mandate-track i{height:3px;flex:1;background:linear-gradient(90deg,#347fff,#20d8cb);transform-origin:left;transform:scaleX(max(.08,var(--segment-progress)))}.mandate-step{position:absolute;top:250px;width:110px;text-align:center;color:#587790;font-size:8px;letter-spacing:.07em}.mandate-step i{display:block;width:14px;height:14px;margin:0 auto 8px;border-radius:50%;border:2px solid #4d7190;background:#07172d}.mandate-step.active{color:#d2e7f6}.mandate-step.active i{border-color:#70baff;background:#317dc6;box-shadow:0 0 20px rgba(85,170,239,.25)}.mandate-step:nth-of-type(3){left:145px}.mandate-step:nth-of-type(4){left:310px}.mandate-step:nth-of-type(5){left:475px}.mandate-step:nth-of-type(6){left:640px}.mandate-step:nth-of-type(7){left:805px}.moving-mandate{position:absolute;left:125px;top:159px;width:70px;height:32px;display:grid;place-content:center;border-radius:999px;background:#0c5b92;color:#d9f1ff;font-size:8px;font-weight:900;letter-spacing:.08em;transform:translateX(calc(var(--travel)*660px));box-shadow:0 0 25px rgba(74,170,230,.2)}
    .programme-gap-scene{position:absolute;inset:80px 55px 45px 55px}.promise-object,.decision-object{position:absolute;top:85px;height:168px;padding:22px;border-radius:18px;background:linear-gradient(145deg,rgba(10,41,79,.92),rgba(4,19,42,.94));border:1px solid rgba(91,157,224,.42)}.promise-object{left:0;width:190px}.decision-object{right:5px;width:300px}.promise-object small,.decision-object small,.demophobie-source small,.design-question small,.current-layer small,.future-layer small,.closing-copy small{color:#76b7ff;font-size:8px;font-weight:900;letter-spacing:.13em}.promise-object strong,.decision-object strong{display:block;margin-top:10px;font-size:27px}.promise-object span,.decision-object span{display:block;margin-top:9px;color:#97b0c5;font-size:10px}.gap-field{position:absolute;right:0;top:115px;width:300px;text-align:center}.gap-field b{display:block;font-size:48px;color:#ffbc70}.gap-field span{display:block;margin-top:7px;color:#dbe8f4;font-size:14px;font-weight:900;letter-spacing:.06em}.gap-field em{display:block;margin-top:9px;color:#8eaac1;font-size:9px;font-style:normal;font-weight:900;letter-spacing:.1em}.status-ruler{position:absolute;left:650px;right:15px;bottom:20px;display:grid;grid-template-columns:repeat(6,1fr);gap:6px;color:#6887a2;font-size:7px;font-weight:900;letter-spacing:.05em;text-align:center}.status-ruler i{position:absolute;left:0;right:0;top:-10px;height:2px;background:linear-gradient(90deg,#3e88cf,#55d1c8)}
    .demophobie-space{position:absolute;inset:70px 55px 40px 45px}.demophobie-source{position:absolute;left:-15px;top:75px;width:210px;padding:20px;border-left:3px solid #73b7ff;background:linear-gradient(90deg,rgba(10,40,78,.88),rgba(5,19,43,.55))}.demophobie-source strong{display:block;margin-top:10px;font-size:29px}.demophobie-source span{display:block;margin-top:8px;color:#9db5ca;font-size:9px}.design-question{position:absolute;right:-5px;top:70px;width:300px;padding:23px;border:1px solid rgba(94,158,221,.44);border-radius:20px;background:rgba(4,19,43,.8)}.design-question b{display:block;margin-top:12px;font-size:22px;line-height:1.08}.guardrail-row{position:absolute;left:650px;right:0;bottom:22px;display:flex;flex-wrap:wrap;justify-content:flex-end;gap:9px}.guardrail{padding:9px 12px;border:1px solid rgba(86,148,204,.35);border-radius:999px;background:rgba(5,24,48,.8);color:#92acc2;font-size:8px;font-weight:900;letter-spacing:.08em}
    .participation-balance-scene{position:absolute;inset:95px 35px 45px 35px}.extreme{position:absolute;width:210px;padding:17px;border:1px solid rgba(91,145,197,.34);border-radius:16px;background:rgba(5,22,45,.72);text-align:center}.extreme.left{left:0;top:95px}.extreme.right{left:0;top:225px;right:auto}.extreme small{color:#718fa9;font-size:8px;font-weight:900}.extreme strong{display:block;margin-top:8px;font-size:17px}.balance-core{position:absolute;left:auto;right:0;top:65px;width:310px;height:275px;display:grid;place-content:center;text-align:center;border:1px solid rgba(73,213,203,.5);border-radius:50%;background:radial-gradient(circle,rgba(24,111,146,.19),rgba(4,20,44,.68))}.balance-core i{position:absolute;inset:28px;border:1px solid rgba(90,177,230,.28);border-radius:50%;transform:scale(calc(.84 + var(--segment-progress)*.18))}.balance-core strong{font-size:20px}.balance-core span{max-width:230px;margin:10px auto 0;color:#9ab6ca;font-size:10px}.balance-axis{position:absolute;left:210px;right:385px;top:390px;z-index:-1}.balance-axis i{display:block;height:3px;background:linear-gradient(90deg,#54708a,#2fcfc4)}
    .vog-offer-scene{position:absolute;inset:75px 55px 45px 55px}.current-layer,.future-layer{position:absolute;left:650px;right:5px;height:132px;padding:20px 22px;border-radius:17px}.current-layer{top:105px;border:1px solid rgba(77,162,225,.46);background:linear-gradient(135deg,rgba(9,41,78,.88),rgba(5,20,45,.84))}.future-layer{top:105px;border:1px dashed rgba(66,211,201,.5);background:rgba(4,26,44,.5)}.current-layer strong,.future-layer strong{display:block;margin-top:8px;font-size:17px}.current-layer span,.future-layer span{display:block;margin-top:7px;color:#9bb4c8;font-size:9px}.bridge{position:absolute;left:650px;top:175px;width:250px;display:flex;align-items:center;gap:10px;color:#62d8d0;font-size:9px;font-weight:900;letter-spacing:.08em}.bridge i{height:2px;flex:1;background:linear-gradient(90deg,#478fe0,#37d5cb)}
    .vog-closing-scene{position:absolute;inset:30px 20px 20px 10px}.vog-closing-scene .democratic-loop{transform:scale(.78);transform-origin:44% 45%;opacity:.74}.closing-copy{position:absolute;right:35px;top:190px;width:350px;padding:18px;border-left:3px solid #64b1ff;background:linear-gradient(90deg,rgba(3,19,43,.84),transparent)}.closing-copy strong{display:block;margin-top:10px;font-size:23px;line-height:1.06}.closing-copy span{display:block;margin-top:9px;color:#9db4c7;font-size:10px}

    [data-broadcast-discipline="v3-3"] .headline-swarm .case-headline-object{left:-145px;top:165px}[data-broadcast-discipline="v3-3"] .source-pull-scene .case-headline-object{left:-145px;top:145px}[data-broadcast-discipline="v3-3"] .source-claim-chip{left:-125px;top:180px}
    [data-broadcast-discipline="v3-3"] .case-synthesis-scene svg{display:none!important}[data-broadcast-discipline="v3-3"] .case-synthesis-scene .synthesis-orbit{display:none}[data-broadcast-discipline="v3-3"] .case-synthesis-scene[data-synthesis-phase="source"] .synthesis-orbit.source,[data-broadcast-discipline="v3-3"] .case-synthesis-scene[data-synthesis-phase="context"] .synthesis-orbit.context,[data-broadcast-discipline="v3-3"] .case-synthesis-scene[data-synthesis-phase="counter"] .synthesis-orbit.counter{display:grid}[data-broadcast-discipline="v3-3"] .case-synthesis-scene .synthesis-orbit.source{left:-135px;top:150px}[data-broadcast-discipline="v3-3"] .case-synthesis-scene .synthesis-orbit.context{right:0;top:45px}[data-broadcast-discipline="v3-3"] .case-synthesis-scene .synthesis-orbit.counter{left:725px;bottom:20px}
    [data-broadcast-discipline="v3-3"] .democratic-loop{left:690px;top:78px;transform:scale(.48);transform-origin:0 0}[data-broadcast-discipline="v3-3"] .living-mandate-path{inset:auto;left:650px;top:70px;width:310px;height:410px}[data-broadcast-discipline="v3-3"] .mandate-origin{left:0;top:0;width:72px;height:72px}[data-broadcast-discipline="v3-3"] .mandate-track{left:94px;right:0;top:28px}[data-broadcast-discipline="v3-3"] .mandate-track i{display:none}[data-broadcast-discipline="v3-3"] .mandate-step{left:0!important;top:calc(100px + var(--step)*54px)!important;width:285px;display:grid;grid-template-columns:22px 1fr;align-items:center;gap:11px;text-align:left;font-size:10px}[data-broadcast-discipline="v3-3"] .mandate-step i{margin:0}[data-broadcast-discipline="v3-3"] .moving-mandate{left:190px;top:20px;transform:none!important}
    [data-broadcast-discipline="v3-3"] .programme-gap-scene{inset:auto;left:650px;top:80px;width:310px;height:365px}[data-broadcast-discipline="v3-3"] .promise-object,[data-broadcast-discipline="v3-3"] .decision-object{left:0;right:auto;width:265px;top:70px}[data-broadcast-discipline="v3-3"] .gap-field{left:0;right:auto;top:100px;width:285px}[data-broadcast-discipline="v3-3"] .status-ruler{left:0;right:0;bottom:12px}
    [data-broadcast-discipline="v3-3"] .demophobie-space{inset:auto;left:650px;top:70px;width:310px;height:365px}[data-broadcast-discipline="v3-3"] .demophobie-source{left:0;top:70px;width:270px}[data-broadcast-discipline="v3-3"] .design-question{left:0;right:auto;top:65px;width:265px}[data-broadcast-discipline="v3-3"] .guardrail-row{left:0;right:0;bottom:15px;justify-content:flex-start}
    [data-broadcast-discipline="v3-3"] .participation-balance-scene{inset:auto;left:650px;top:65px;width:310px;height:390px}[data-broadcast-discipline="v3-3"] .extreme{width:135px;padding:12px}[data-broadcast-discipline="v3-3"] .extreme.left{left:0;top:0}[data-broadcast-discipline="v3-3"] .extreme.right{left:158px;top:0}[data-broadcast-discipline="v3-3"] .extreme strong{font-size:14px}[data-broadcast-discipline="v3-3"] .balance-core{left:0;right:auto;top:105px;width:300px;height:220px}[data-broadcast-discipline="v3-3"] .balance-axis{display:none}
    [data-broadcast-discipline="v3-3"] .vog-closing-scene .democratic-loop{left:690px;top:70px;transform:scale(.40)!important;transform-origin:0 0!important;opacity:.22!important}[data-broadcast-discipline="v3-3"] .closing-copy{right:10px;top:205px;width:310px}
    [data-broadcast-discipline="v3-3"][data-homepage-segment-id="vog-after-election"] .broadcast-lower-third,[data-broadcast-discipline="v3-3"][data-homepage-segment-id="vog-participation-balance"] .broadcast-lower-third,[data-broadcast-discipline="v3-3"][data-homepage-segment-id="vog-synthesis"] .broadcast-lower-third,[data-broadcast-discipline="v3-3"][data-homepage-segment-id="vog-cta"] .broadcast-lower-third,[data-broadcast-discipline="v3-3"][data-homepage-segment-id="edebatte-next-generation"] .broadcast-lower-third,[data-broadcast-discipline="v3-3"][data-homepage-segment-id="edebatte-synthesis-questions"] .broadcast-lower-third,[data-broadcast-discipline="v3-3"][data-homepage-segment-id="edebatte-verifiability"] .broadcast-lower-third,[data-broadcast-discipline="v3-3"][data-homepage-segment-id="edebatte-cta"] .broadcast-lower-third{opacity:0!important;pointer-events:none!important}
  </style>`;

  const contextDateReplacement = plan.filmId === "voiceopengov" && plan.contextMode === "evergreen"
    ? "ZWISCHEN DEN WAHLEN"
    : null;

  let html = replaceHomepageLapelPin(base)
    .replace("</head>", `${css}</head>`)
    .replace(
      '<div class="frame"></div>',
      `${semanticMotion}${brandHierarchy}${distinctiveStage}<div class="frame"></div>`,
    )
    .replace(
      'data-pilot-version="1.4-final-layout"',
      `data-pilot-version="homepage-reference-v3-2-geometry-sync" data-broadcast-discipline="v3-3" data-pause-hold="previous-segment" data-min-readable-state-seconds="2" data-homepage-film="${plan.filmId}" data-context-mode="${plan.contextMode}" data-visual-language="${plan.visualLanguage}" data-homepage-visual-state="${visualState.state}" data-homepage-segment-id="${escapeHtml(segment.id)}" data-motion-event-index="${eventIndex}" data-host-face-safe-zone="x560-1030:y135-535" data-host-face-safe-policy="hard-no-lines-or-large-objects"`,
    );
  if (contextDateReplacement) html = html.replaceAll("SEPTEMBER 2026", contextDateReplacement);
  return html;
}
