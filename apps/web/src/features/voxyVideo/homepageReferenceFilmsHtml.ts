import type { VoxyFinalLayoutPlan } from "./dualVoiceExplainerPilot";
import { renderVoxyDualVoicePilotFrameHtml } from "./dualVoiceExplainerPilotHtml";
import {
  homepageVisualStateAt,
  type VoxyHomepageReferenceFilmPlan,
} from "./homepageReferenceFilms";
import type { VoxyMotionV4EmbeddedAssets } from "./motionV4Html";

const MIN_READABLE_STATE_SECONDS = 2;
const STATE_SETTLE_SECONDS = 0.25;

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

function filmProgress(plan: VoxyHomepageReferenceFilmPlan, at: number): number {
  const first = plan.speakerTimeline[0];
  const last = plan.speakerTimeline.at(-1);
  if (!first || !last) return 0;
  return clamp01((at - first.start) / Math.max(0.001, last.end - first.start));
}

function rangeProgress(
  plan: VoxyHomepageReferenceFilmPlan,
  at: number,
  firstId: string,
  lastId: string,
): number {
  const first = plan.speakerTimeline.find((entry) => entry.id === firstId);
  const last = plan.speakerTimeline.find((entry) => entry.id === lastId) ?? first;
  if (!first || !last) return segmentProgress(plan, at);
  return clamp01((at - first.start) / Math.max(0.001, last.end - first.start));
}

function availableReadablePhaseCount(
  start: number,
  end: number,
  desiredPhaseCount: number,
): number {
  const duration = Math.max(0.001, end - start);
  return Math.max(
    1,
    Math.min(
      desiredPhaseCount,
      Math.floor((duration + 1e-6) / MIN_READABLE_STATE_SECONDS),
    ),
  );
}

function readablePhaseIndex(
  start: number,
  end: number,
  at: number,
  desiredPhaseCount: number,
): number {
  const duration = Math.max(0.001, end - start);
  const availablePhaseCount = availableReadablePhaseCount(start, end, desiredPhaseCount);
  const progress = clamp01((at - start) / duration);
  const compactIndex = Math.min(
    availablePhaseCount - 1,
    Math.floor(progress * availablePhaseCount),
  );
  if (availablePhaseCount === 1) return desiredPhaseCount - 1;
  return Math.round(
    (compactIndex * (desiredPhaseCount - 1)) / (availablePhaseCount - 1),
  );
}

function readablePhaseEnterProgress(
  start: number,
  end: number,
  at: number,
  desiredPhaseCount: number,
): number {
  const duration = Math.max(0.001, end - start);
  const availablePhaseCount = availableReadablePhaseCount(start, end, desiredPhaseCount);
  const progress = clamp01((at - start) / duration);
  const compactIndex = Math.min(
    availablePhaseCount - 1,
    Math.floor(progress * availablePhaseCount),
  );
  const phaseStart = start + (duration * compactIndex) / availablePhaseCount;
  return clamp01((at - phaseStart) / STATE_SETTLE_SECONDS);
}

function phaseIndexForSegment(
  plan: VoxyHomepageReferenceFilmPlan,
  at: number,
  desiredPhaseCount: number,
): number {
  const segment = currentSegment(plan, at);
  return readablePhaseIndex(segment.start, segment.end, at, desiredPhaseCount);
}

function phaseEnterForSegment(
  plan: VoxyHomepageReferenceFilmPlan,
  at: number,
  desiredPhaseCount: number,
): number {
  const segment = currentSegment(plan, at);
  return readablePhaseEnterProgress(segment.start, segment.end, at, desiredPhaseCount);
}

function phaseIndexForRange(
  plan: VoxyHomepageReferenceFilmPlan,
  at: number,
  firstId: string,
  lastId: string,
  desiredPhaseCount: number,
): number {
  const first = plan.speakerTimeline.find((entry) => entry.id === firstId);
  const last = plan.speakerTimeline.find((entry) => entry.id === lastId) ?? first;
  if (!first || !last) return phaseIndexForSegment(plan, at, desiredPhaseCount);
  return readablePhaseIndex(first.start, last.end, at, desiredPhaseCount);
}

function phaseEnterForRange(
  plan: VoxyHomepageReferenceFilmPlan,
  at: number,
  firstId: string,
  lastId: string,
  desiredPhaseCount: number,
): number {
  const first = plan.speakerTimeline.find((entry) => entry.id === firstId);
  const last = plan.speakerTimeline.find((entry) => entry.id === lastId) ?? first;
  if (!first || !last) return phaseEnterForSegment(plan, at, desiredPhaseCount);
  return readablePhaseEnterProgress(first.start, last.end, at, desiredPhaseCount);
}

function subtitleCue(text: string, progress: number): string {
  const sentences = text
    .match(/[^.!?]+[.!?]?/g)
    ?.map((sentence) => sentence.trim())
    .filter(Boolean) ?? [text];
  const chunks = sentences.flatMap((sentence) => {
    if (sentence.length <= 72) return [sentence];
    const clauses = sentence.split(/(?<=[,;:])\s+|\s+[–—]\s+|\s+(?=und\b|aber\b)/);
    const grouped: string[] = [];
    for (const clause of clauses) {
      const previous = grouped.at(-1);
      if (previous && `${previous} ${clause}`.length <= 72) grouped[grouped.length - 1] = `${previous} ${clause}`;
      else grouped.push(clause);
    }
    return grouped;
  });
  const index = Math.min(chunks.length - 1, Math.floor(clamp01(progress) * chunks.length));
  return chunks[Math.max(0, index)] ?? text;
}

function renderBrandHierarchy(plan: VoxyHomepageReferenceFilmPlan): string {
  return plan.filmId === "edebatte"
    ? `<div class="homepage-brand-hierarchy edebatte-brand-primary" data-context-label="VoiceOpenGov · demokratischer Kontext"><strong>eDebatte</strong><b class="brand-descriptor">PRÜFEN STATT GLAUBEN</b><span>Von der Behauptung zurück zum Beleg.</span></div>`
    : `<div class="homepage-brand-hierarchy vog-brand-primary" data-context-label="eDebatte · prüfbare Grundlage"><strong>VoiceOpenGov</strong><b class="brand-descriptor">DEMOKRATIE IN BEWEGUNG</b><span>Was passiert mit deiner Stimme nach der Wahl?</span></div>`;
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

  const openingLastId = plan.speakerTimeline.some((entry) => entry.id === "edebatte-election-noise")
    ? "edebatte-election-noise"
    : "edebatte-greeting";
  const openingPhase = phaseIndexForRange(
    plan,
    at,
    "edebatte-greeting",
    openingLastId,
    2,
  );
  const sourcePhase = sourcePull ? phaseIndexForSegment(plan, at, 3) : 0;
  const forensicPhase = forensicSplit ? phaseIndexForSegment(plan, at, 3) : 0;
  const synthesisPhaseIndex = synthesis
    ? phaseIndexForRange(
        plan,
        at,
        "edebatte-next-generation",
        "edebatte-synthesis-questions",
        3,
      )
    : 0;
  const synthesisPhase = ["source", "context", "counter"][synthesisPhaseIndex]!;
  const stateEnterProgress = opening
    ? phaseEnterForRange(plan, at, "edebatte-greeting", openingLastId, 2)
    : sourcePull
      ? phaseEnterForSegment(plan, at, 3)
      : forensicSplit
        ? phaseEnterForSegment(plan, at, 3)
        : synthesis
          ? phaseEnterForRange(
              plan,
              at,
              "edebatte-next-generation",
              "edebatte-synthesis-questions",
              3,
            )
          : clamp01((at - segment.start) / STATE_SETTLE_SECONDS);

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

  const openingScene = openingPhase === 0
    ? `<div class="headline-swarm" aria-label="Illustrative Medienimpulse ohne reale Schlagzeilen">
        <span class="swarm s1">PUSH</span><span class="swarm s2">ZAHL</span><span class="swarm s3">ZITAT</span><span class="swarm s4">STUDIE</span>
        ${headlineObject}
      </div>`
    : `<div class="headline-freeze-scene"><div class="freeze-ring"><b>STOPP.</b><span>Zurück zur Quelle.</span></div></div>`;

  const sourceScene = sourcePhase === 0
    ? `<div class="source-pull-scene source-phase-claim">${headlineObject}</div>`
    : sourcePhase === 1
      ? `<div class="source-pull-scene source-phase-link"><div class="source-claim-chip">DIE HEADLINE</div><div class="evidence-beam"><i></i><span>BELEGEN</span></div>${sourceObject}</div>`
      : `<div class="source-pull-scene source-phase-primary">${sourceObject}</div>`;

  const splitScene = forensicPhase === 0
    ? `<div class="forensic-split-scene"><div class="claim-token number"><small>ZAHL</small><b>WERT</b><span>ohne Kontext?</span></div></div>`
    : forensicPhase === 1
      ? `<div class="forensic-split-scene"><div class="claim-token quote"><small>ZITAT</small><b>„…“</b><span>im Original?</span></div></div>`
      : `<div class="forensic-split-scene forensic-source-resolution"><div class="forensic-study-label"><small>STUDIE</small><b>ORIGINAL</b></div>${sourceObject}<div class="split-rule"><span>QUELLE</span><i></i><span>INTERPRETATION</span></div></div>`;

  const traceItems = [
    "BEHAUPTUNG",
    "ORIGINALQUELLE",
    "PASSAGE",
    "KONTEXT",
    "GEGENPOSITION",
    "OFFENE FRAGE",
  ];
  const traceScene = `<div class="case-trace-scene">
    <div class="trace-axis">${traceItems.map((item, index) => `<div class="trace-node ${index <= reached ? "reached" : ""}" style="--node:${index}"><i></i><b>${item}</b></div>`).join("")}</div>
    <div class="trace-copy"><small>eDEBATTE · PRÜFPFAD</small><strong>${segment.id === "edebatte-current-offer" ? "Öffentliche Themen zurück zum Beleg verfolgen." : "Nicht nur das Ergebnis zeigen. Den Weg dorthin zeigen."}</strong></div>
  </div>`;

  const synthesisScene = `<div class="case-synthesis-scene" data-face-safe-route="outside-host-corridor" data-synthesis-phase="${synthesisPhase}">
    <div class="synthesis-orbit source"><small>QUELLE</small><b>01</b></div>
    <div class="synthesis-orbit context"><small>KONTEXT</small><b>02</b></div>
    <div class="synthesis-orbit counter"><small>GEGENPOSITION</small><b>03</b></div>
    <div class="synthesis-core"><small>NACHPRÜFBARKEIT</small><strong>${segment.id === "edebatte-synthesis-questions" ? "WO ENDET DER BELEG?" : "VERTRAUEN + PRÜFBARKEIT"}</strong><span>Was wissen wir? Was spricht dagegen? Was fehlt?</span></div>
  </div>`;

  const resolutionScene = `<div class="case-resolution-scene" data-contract-cta="DANN GEH EINEN SCHRITT WEITER.">
    <div class="verification-pulse"><i></i><i></i><i></i><b>PRÜFBAR</b></div>
    <small class="resolution-premise">DU MUSST MIR NICHTS GLAUBEN.</small>
    <strong>DU SOLLST ES PRÜFEN KÖNNEN.</strong>
    <span>${segment.id === "edebatte-cta" ? "Lies die Schlagzeile. Dann geh einen Schritt weiter." : "Headline → Quelle → Kontext → Gegenposition → offene Frage"}</span>
    <div class="memory-flight"><i></i><small>BELEG BLEIBT SICHTBAR</small></div>
  </div>`;

  const readableStateId = opening
    ? `ed-opening-${openingPhase === 0 ? "headline" : "freeze"}`
    : sourcePull
      ? `ed-source-${["claim", "link", "primary"][sourcePhase]}`
      : forensicSplit
        ? `ed-forensics-${["number", "quote", "study-source"][forensicPhase]}`
        : trace
          ? `ed-trace-${segment.id}`
          : synthesis
            ? `ed-synthesis-${synthesisPhase}`
            : resolution
              ? `ed-resolution-${segment.id}`
              : `ed-${segment.id}`;

  return `<section class="homepage-distinctive-stage edebatte-forensics object-led-scene" data-visual-language="media_forensics" data-segment-id="${escapeHtml(segment.id)}" data-readable-state-id="${escapeHtml(readableStateId)}" style="--segment-progress:${progress.toFixed(4)};--event-progress:${eventProgress.toFixed(4)};--state-enter:${stateEnterProgress.toFixed(4)}">
    <div class="scene-kicker"><span>RECHERCHE WIRD ZUR SZENE</span></div>
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

  const programmePhase = programmeGap ? phaseIndexForSegment(plan, at, 3) : 0;
  const demophobiePhase = demophobie ? phaseIndexForSegment(plan, at, 3) : 0;
  const offerPhase = currentOffer ? phaseIndexForSegment(plan, at, 3) : 0;
  const stateEnterProgress = programmeGap
    ? phaseEnterForSegment(plan, at, 3)
    : demophobie
      ? phaseEnterForSegment(plan, at, 3)
      : currentOffer
        ? phaseEnterForSegment(plan, at, 3)
        : clamp01((at - segment.start) / STATE_SETTLE_SECONDS);
  const journeyProgress = filmProgress(plan, at);
  const loopPhase = Math.min(6, Math.floor(journeyProgress * 7));

  const loopLabels = ["PROGRAMM", "VERHANDLUNG", "BESCHLUSS", "UMSETZUNG", "WIRKUNG", "RÜCKKOPPLUNG"];
  const loopNodes = loopLabels
    .map((label, index) => `<div class="loop-node n${index + 1} ${index + 1 === loopPhase ? "active" : ""} ${index + 1 < loopPhase ? "complete" : "upcoming"}"><i></i><span>${label}</span></div>`)
    .join("");
  const loop = `<div class="democratic-loop" data-journey-stage="${loopPhase}" style="--loop:${journeyProgress.toFixed(4)}">
    <div class="loop-heading"><small>WAS PASSIERT DANACH?</small><strong>DER WEG GEHT WEITER</strong></div>
    ${loopNodes}
    <svg viewBox="0 0 920 500" aria-hidden="true"><path d="M180 250 C240 95 565 65 730 190 C820 260 805 370 680 410 C500 470 245 410 180 250"/></svg>
    <div class="mandate-pulse ${loopPhase === 0 ? "active" : "complete"}"><i></i><b>DEINE STIMME</b></div>
  </div>`;

  const leadScene = `<div class="vog-lead-card"><small>LEITFRAGE</small><strong>Was passiert mit deiner Stimme nach der Wahl?</strong></div>`;

  const process = `<div class="living-mandate-path">
    <div class="mandate-origin"><i></i><small>WAHL</small><b>×</b></div>
    <div class="mandate-track"><span>DER WEG GEHT WEITER</span></div>
    ${["PROGRAMM", "VERHANDLUNG", "BESCHLUSS", "UMSETZUNG", "WIRKUNG"].map((item, index) => `<div class="mandate-step ${index <= Math.floor(progress * 5) ? "active" : ""}" style="--step:${index}"><i></i><b>${item}</b></div>`).join("")}
    <div class="moving-mandate" data-contract-label="MANDAT?"><span>FOLGE?</span></div>
  </div>`;

  const programme = programmePhase === 0
    ? `<div class="programme-gap-scene programme-phase-promise"><div class="promise-object"><small>WAHLVERSPRECHEN</small><strong>PROGRAMM</strong><span>politische Absicht</span></div></div>`
    : programmePhase === 1
      ? `<div class="programme-gap-scene programme-phase-gap"><div class="gap-field"><b>≠</b><span>PROGRAMM IST NICHT BESCHLUSS</span><em>VERBINDLICHKEIT?</em></div></div>`
      : `<div class="programme-gap-scene programme-phase-decision"><div class="decision-object"><small>POLITISCHER STATUS</small><strong>BESCHLUSS</strong><span>erst später möglich</span></div><div class="status-ruler"><span>AUSSAGE</span><span>BESCHLUSS</span><span>WIRKUNG</span></div></div>`;

  const demophobieScene = demophobiePhase === 0
    ? `<div class="demophobie-space demophobie-phase-source"><div class="demophobie-source"><small>KERNFRAGE</small><strong>OHNE DEFINIERTE FOLGE</strong><span>ist Beteiligung noch keine Mitbestimmung.</span></div></div>`
    : demophobiePhase === 1
      ? `<div class="demophobie-space demophobie-phase-question"><div class="design-question"><small>GESTALTUNGSFRAGE</small><b>Wie wird aus Beteiligung nachvollziehbare politische Wirkung?</b></div></div>`
      : `<div class="demophobie-space demophobie-phase-guardrails"><div class="design-question"><small>LEITPLANKEN</small><b>Wirkung braucht demokratische Grenzen.</b></div><div class="guardrail-row"><div class="guardrail">GRUNDRECHTE</div><div class="guardrail">MINDERHEITENSCHUTZ</div><div class="guardrail">RECHENSCHAFT</div><div class="guardrail">ÜBERPRÜFUNG</div></div></div>`;

  const balanceScene = `<div class="participation-balance-scene">
    <div class="balance-core" data-contract-label="WIRKSAME MITBESTIMMUNG"><i></i><strong>WAS FOLGT AUS DEINER STIMME?</strong><span>Mitbestimmung braucht eine definierte Folge.</span></div>
  </div>`;

  const offerScene = offerPhase === 0
    ? `<div class="vog-offer-scene offer-phase-current" data-contract-label="HEUTE · CURRENT CAPABILITY"><div class="current-layer"><small>HEUTE</small><strong>MITMACHEN · INFORMIERT BLEIBEN</strong><span>Eintragen oder freiwillig unterstützen. Keine Stimmvorteile.</span></div></div>`
    : offerPhase === 1
      ? `<div class="vog-offer-scene offer-phase-bridge" data-contract-label="VON BETEILIGUNG ZU SUBSTANZ"><div class="bridge"><i></i><span>DER NÄCHSTE SCHRITT</span></div></div>`
      : `<div class="vog-offer-scene offer-phase-future" data-contract-label="ZIELBILD · NICHT ALS PRODUKTFUNKTION BEHAUPTET" data-product-status="future-intent-not-current-capability"><div class="future-layer"><small>WIRKUNG</small><strong>STIMME → FOLGE → WIRKUNG</strong><span>Was soll aus deiner Stimme politisch folgen?</span></div></div>`;

  const closingScene = `<div class="vog-closing-scene"><div class="closing-copy"><small>VOICEOPENGOV</small><strong>${cta ? "DEINE STIMME IST MEHR ALS EIN KREUZ." : "NACHVOLLZIEHBARKEIT ZEIGT, WAS DARAUS WIRD."}</strong><span>${cta ? "Mitmachen. Informiert bleiben." : "Was aus deiner Stimme wird, muss nachvollziehbar sein."}</span></div></div>`;

  const readableStateId = afterElection
    ? "vog-process"
    : programmeGap
      ? `vog-programme-${["promise", "gap", "decision"][programmePhase]}`
      : demophobie
        ? `vog-demophobie-${["source", "question", "guardrails"][demophobiePhase]}`
        : balance
          ? "vog-participation-balance"
          : currentOffer
            ? `vog-offer-${["current", "bridge", "future"][offerPhase]}`
            : synthesis
              ? "vog-closing-synthesis"
              : cta
                ? "vog-closing-cta"
                : "vog-loop";

  return `<section class="homepage-distinctive-stage vog-journey object-led-scene" data-visual-language="democratic_journey" data-segment-id="${escapeHtml(segment.id)}" data-readable-state-id="${escapeHtml(readableStateId)}" style="--segment-progress:${progress.toFixed(4)};--event-progress:${eventProgress.toFixed(4)};--state-enter:${stateEnterProgress.toFixed(4)}">
    <div class="scene-kicker vog" aria-hidden="true"></div>
    ${afterElection ? process : programmeGap ? programme : demophobie ? demophobieScene : balance ? balanceScene : currentOffer ? offerScene : synthesis || cta ? closingScene : leadScene}
    ${loop}
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

function renderProfileMemory(
  plan: VoxyHomepageReferenceFilmPlan,
  at: number,
): string {
  if (plan.layout.evidenceMemory === "full_column") return "";
  const state = homepageVisualStateAt(plan, at);
  const activeId = state.activeEvidenceId ?? state.dockedEvidenceIds.at(-1) ?? null;
  const active = plan.evidence.find((entry) => entry.id === activeId);
  const label = plan.filmId === "edebatte" ? "PRÜFPFAD" : "WIRKUNGSPFAD";
  return `<aside class="homepage-profile-memory" data-evidence-memory-behavior="${plan.layout.evidenceMemory}" data-memory-count="${state.dockedEvidenceIds.length}" data-active-evidence-id="${escapeHtml(activeId ?? "none")}"><small>${label}</small><b>${escapeHtml(active?.type ?? "BEREIT")}</b><span>${state.dockedEvidenceIds.length} · nachvollziehbar</span></aside>`;
}

function socialProfileCss(plan: VoxyHomepageReferenceFilmPlan): string {
  if (plan.layoutProfile === "landscape_16_9") return "";
  const { regions, typography } = plan.layout;
  const navigationLocalX = regions.navigation.x - regions.evidence.x;
  const navigationLocalY = regions.navigation.y - regions.evidence.y;
  const evidenceWidth = regions.evidence.width;
  const evidenceHeight = regions.evidence.height;
  const isSquare = plan.layoutProfile === "square_1_1";
  const compactObjectWidth = isSquare ? evidenceWidth : Math.min(evidenceWidth, 860);

  return `
    [data-layout-profile="${plan.layoutProfile}"] .master .broadcast-chrome{display:none!important}
    [data-layout-profile="${plan.layoutProfile}"] .master .on-air{display:none!important}
    [data-layout-profile="${plan.layoutProfile}"] .homepage-motion-cue{display:none!important}
    [data-layout-profile="${plan.layoutProfile}"] .master .bottom-reset{height:${plan.layoutProfile === "vertical_9_16" ? 610 : plan.layoutProfile === "feed_4_5" ? 410 : 285}px!important;background:linear-gradient(180deg,transparent,rgba(1,5,17,.96) 38%,#010511 100%)!important}
    .homepage-profile-overlay{position:absolute;z-index:40;inset:0;overflow:hidden;pointer-events:none;color:#f6fbff;font-family:Inter,Arial,sans-serif}
    .homepage-profile-overlay::before{content:"";position:absolute;z-index:1;left:0;right:0;top:${regions.evidence.y - 52}px;bottom:0;background:linear-gradient(180deg,transparent,rgba(1,5,17,.86) 8%,#010511 34%)}
    .homepage-brand-hierarchy{left:${regions.brand.x}px!important;top:${regions.brand.y}px!important;width:${regions.brand.width}px!important;z-index:8!important;gap:8px!important;padding:16px 18px 17px!important;border-left:4px solid rgba(73,218,210,.88)!important;border-radius:12px!important;background:linear-gradient(90deg,rgba(1,8,23,.94),rgba(1,8,23,.72) 76%,transparent)!important}
    .homepage-brand-hierarchy strong{font-size:${typography.brandPx}px!important}
    .homepage-brand-hierarchy .brand-descriptor{font-size:${typography.descriptorPx}px!important;letter-spacing:.025em!important}
    .homepage-brand-hierarchy span{max-width:${regions.brand.width}px!important;font-size:${Math.max(17, typography.descriptorPx - 3)}px!important;line-height:1.24!important}
    .homepage-distinctive-stage{left:${regions.evidence.x}px!important;top:${regions.evidence.y}px!important;width:${evidenceWidth}px!important;height:${evidenceHeight}px!important;z-index:7!important;overflow:visible!important}
    .homepage-distinctive-stage .scene-kicker{display:none!important}
    .homepage-voxy-subtitle{left:${regions.caption.x}px!important;right:auto!important;top:${regions.caption.y}px!important;bottom:auto!important;width:${regions.caption.width}px!important;min-height:${regions.caption.height}px!important;padding:18px 24px!important;grid-template-columns:76px 1fr!important;z-index:10!important}
    .homepage-voxy-subtitle b{font-size:${Math.max(14, typography.captionPx - 14)}px!important}
    .homepage-voxy-subtitle p{font-size:${typography.captionPx}px!important;line-height:1.22!important;-webkit-line-clamp:2!important}
    .homepage-profile-memory{position:absolute;z-index:9;left:${regions.navigation.x + Math.max(0, regions.navigation.width - (isSquare ? 118 : 180))}px;top:${regions.navigation.y + (isSquare ? 220 : 0)}px;width:${isSquare ? 118 : 180}px;min-height:${isSquare ? 180 : regions.navigation.height}px;display:flex;flex-direction:column;justify-content:center;padding:12px 14px;border:1px solid rgba(83,158,224,.38);border-radius:14px;background:rgba(4,19,42,.92)}
    .homepage-profile-memory small{color:#72ddd7;font-size:${Math.max(10, typography.navigationPx - 5)}px;font-weight:900;letter-spacing:.08em}.homepage-profile-memory b{margin-top:7px;font-size:${Math.max(13, typography.navigationPx - 1)}px;line-height:1.05}.homepage-profile-memory span{margin-top:7px;color:#91aabd;font-size:${Math.max(10, typography.navigationPx - 5)}px}
    .headline-swarm,.headline-freeze-scene,.source-pull-scene,.forensic-split-scene,.case-trace-scene,.case-synthesis-scene,.case-resolution-scene,.vog-lead-card,.living-mandate-path,.programme-gap-scene,.demophobie-space,.participation-balance-scene,.vog-offer-scene,.vog-closing-scene{inset:0!important;left:0!important;top:0!important;width:${compactObjectWidth}px!important;height:${evidenceHeight}px!important}
    .swarm{display:none!important}.headline-swarm .case-headline-object,.source-pull-scene .case-headline-object,.source-claim-chip,.claim-token,.forensic-study-label{left:0!important;top:0!important}
    .case-headline-object,.case-source-object,.promise-object,.decision-object,.demophobie-source,.design-question,.current-layer,.future-layer{left:0!important;right:auto!important;top:0!important;width:${compactObjectWidth}px!important;max-width:100%!important;height:${isSquare ? `${evidenceHeight}px` : "auto"}!important;min-height:${Math.min(190, evidenceHeight)}px!important;padding:${isSquare ? 16 : 24}px!important;transform:none!important;border-radius:18px!important}
    .case-headline-object strong,.case-source-object strong,.promise-object strong,.decision-object strong,.demophobie-source strong,.design-question b,.current-layer strong,.future-layer strong{font-size:${typography.statementPx}px!important;line-height:1.08!important}
    .case-source-object footer{left:20px!important;right:20px!important}.source-line{margin-top:${isSquare ? 7 : 11}px!important}.source-line.wide{margin-top:${isSquare ? 10 : 18}px!important}.source-passage{margin-top:${isSquare ? 8 : 13}px!important}
    .evidence-beam,.split-rule,.memory-flight{display:none!important}
    .forensic-source-resolution .case-source-object{left:0!important;right:auto!important;top:0!important;width:${compactObjectWidth}px!important;transform:none!important}
    .case-trace-scene{display:grid!important;grid-template-columns:${isSquare ? "1fr" : "1fr 1fr"}!important;gap:20px!important}.trace-axis{position:relative!important;left:0!important;top:0!important;width:100%!important;grid-template-columns:${isSquare ? "1fr" : "repeat(3,1fr)"}!important;gap:8px!important;padding-left:12px!important}.trace-node{min-height:${isSquare ? 31 : 46}px!important;font-size:${Math.max(11, typography.navigationPx - 2)}px!important}.trace-copy{position:relative!important;left:0!important;top:0!important;width:100%!important;align-self:center!important;text-align:left!important}.trace-copy strong{font-size:${typography.statementPx}px!important}
    .case-synthesis-scene .synthesis-orbit{right:0!important;top:0!important}.synthesis-core{left:0!important;top:${isSquare ? 78 : 54}px!important;width:100%!important;text-align:left!important}.synthesis-core strong{font-size:${typography.statementPx}px!important}
    .case-resolution-scene{text-align:left!important}.verification-pulse{display:none!important}.resolution-premise{display:block;color:#8fb2c7;font-size:${Math.max(13, typography.statementPx - 13)}px;font-weight:850;letter-spacing:.04em}.case-resolution-scene>strong{margin-top:10px!important;font-size:${typography.statementPx}px!important}.case-resolution-scene>span{font-size:${Math.max(14, typography.statementPx - 12)}px!important}
    .vog-lead-card{padding:22px 24px!important}.vog-lead-card strong{font-size:${typography.statementPx}px!important}.living-mandate-path .mandate-origin{left:0!important;top:0!important}.living-mandate-path .mandate-track{left:92px!important;top:24px!important}.mandate-step{left:0!important;top:calc(78px + var(--step)*${isSquare ? 53 : 31}px)!important;width:100%!important;font-size:${Math.max(12, typography.navigationPx - 1)}px!important}
    .gap-field{left:0!important;top:0!important;width:100%!important;text-align:left!important}.gap-field b{font-size:${typography.statementPx + 12}px!important}.gap-field span{font-size:${typography.statementPx - 5}px!important}.status-ruler{bottom:0!important;font-size:${Math.max(10, typography.navigationPx - 3)}px!important}
    .guardrail-row{bottom:0!important;gap:7px!important}.guardrail{padding:8px 10px!important;font-size:${Math.max(10, typography.navigationPx - 4)}px!important}
    .participation-balance-scene .extreme{display:none!important}.participation-balance-scene .balance-core{left:0!important;top:0!important;width:${compactObjectWidth}px!important;height:${evidenceHeight}px!important;border-radius:18px!important}.participation-balance-scene .balance-core strong{font-size:${typography.statementPx}px!important}.participation-balance-scene .balance-core span{max-width:${Math.max(180, compactObjectWidth - 80)}px!important;font-size:${Math.max(14, typography.statementPx - 14)}px!important}
    .bridge{left:0!important;top:${Math.max(48, Math.floor(evidenceHeight / 2))}px!important;width:100%!important;font-size:${typography.statementPx - 5}px!important}
    .closing-copy{left:0!important;right:auto!important;top:0!important;width:${compactObjectWidth}px!important;padding:22px!important}.closing-copy strong{font-size:${typography.statementPx}px!important}.closing-copy span{font-size:${Math.max(16, typography.statementPx - 12)}px!important}
    .democratic-loop{left:${navigationLocalX}px!important;top:${navigationLocalY}px!important;width:${Math.max(120, regions.navigation.width - (isSquare ? 126 : 190))}px!important;height:${regions.navigation.height}px!important;transform:none!important;opacity:${plan.layoutProfile === "vertical_9_16" ? .78 : .72}!important}
    .democratic-loop svg{display:none!important}.loop-heading{left:0!important;top:0!important;gap:2px!important}.loop-heading small{display:none!important}.loop-heading strong{font-size:${typography.navigationPx}px!important;letter-spacing:.03em!important}.mandate-pulse{left:0!important;top:34px!important;width:${isSquare ? 104 : 112}px!important;height:${isSquare ? 58 : 64}px!important;border-radius:12px!important}.mandate-pulse i{display:none!important}.mandate-pulse b{font-size:${typography.navigationPx}px!important}.loop-node{top:34px!important;width:${isSquare ? 112 : 92}px!important;height:${isSquare ? 58 : 64}px!important;font-size:${typography.navigationPx}px!important}.loop-node i{width:12px!important;height:12px!important;margin-bottom:4px!important}.n1{left:118px!important}.n2{left:214px!important}.n3{left:310px!important}.n4{left:406px!important}.n5{left:502px!important}.n6{left:598px!important}
    ${isSquare ? ".loop-node{display:none!important}.loop-node.active{display:grid!important;left:0!important;top:120px!important}.mandate-pulse{display:grid!important}.loop-heading{white-space:normal!important}" : ""}
  `;
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
    viewportGeometry: plan.layout.stageGeometry,
  });
  const semanticMotion = `<div class="homepage-motion-cue" data-motion-event-id="${escapeHtml(event.id)}" data-motion-kind="${escapeHtml(event.motion)}" data-semantic-purpose="${escapeHtml(event.semanticPurpose)}" style="--event-progress:${eventProgress.toFixed(4)}"><i></i><span>${escapeHtml(plan.filmId === "edebatte" ? "QUELLE PRÜFEN" : "DEMOKRATISCHE WIRKUNG")}</span></div>`;
  const distinctiveStage = renderDistinctiveStage(plan, at, eventProgress);
  const brandHierarchy = renderBrandHierarchy(plan);
  const profileMemory = renderProfileMemory(plan, at);
  const subtitleText = subtitleCue(segment.text, segmentProgress(plan, at));
  const subtitle = `<div class="homepage-voxy-subtitle" data-subtitle-segment-id="${escapeHtml(segment.id)}" data-caption-mode="sentence-cue" data-full-subtitle="${escapeHtml(segment.text)}"><b>VOXY</b><p>${escapeHtml(subtitleText)}</p></div>`;
  const profileOverlay = `<div class="homepage-profile-overlay" data-compositional-layout="profile-specific" data-maximum-simultaneous-objects="${plan.layout.maximumSimultaneousObjects}">${semanticMotion}${brandHierarchy}${distinctiveStage}${profileMemory}${subtitle}</div>`;
  const { safeArea, regions } = plan.layout;
  const faceSafeZone = plan.layoutProfile === "landscape_16_9"
    ? "x560-1030:y135-535"
    : `x${regions.presenter.x}-${regions.presenter.x + regions.presenter.width}:y${regions.presenter.y}-${regions.presenter.y + Math.round(regions.presenter.height * 0.56)}`;

  const css = `<style>
    .homepage-profile-overlay{position:absolute;z-index:40;inset:0;overflow:hidden;pointer-events:none}
    .studio-stage{filter:saturate(1.08) contrast(1.055) brightness(1.035)!important}
    .brand-lockup{display:none!important}
    .information-dimmer{background:linear-gradient(90deg,rgba(1,6,18,.05),rgba(1,6,18,.08) 58%,rgba(1,6,18,.42) 100%)!important;box-shadow:none!important}
    .homepage-brand-hierarchy{position:absolute;z-index:43;left:56px;top:118px;width:420px;display:flex;flex-direction:column;gap:6px;pointer-events:none}
    .homepage-brand-hierarchy strong{font-size:40px;line-height:1;font-weight:900;letter-spacing:-.045em;color:#f6fbff}
    .homepage-brand-hierarchy .brand-descriptor{margin-top:3px;color:#d7edf7;font-size:19px;line-height:1.08;font-weight:900;letter-spacing:.045em}
    .homepage-brand-hierarchy span{max-width:390px;font-size:13px;line-height:1.22;font-weight:800;letter-spacing:.025em;color:#9eb9cb}
    .homepage-brand-hierarchy::after{content:"";height:3px;margin-top:3px;width:180px;background:linear-gradient(90deg,#20d8cb,#347fff)}
    .vog-brand-primary::after{width:195px;background:linear-gradient(90deg,#347fff,#20d8cb)}
    .homepage-motion-cue{position:absolute;z-index:33;left:446px;top:76px;display:flex;align-items:center;gap:10px;pointer-events:none;opacity:calc(.58 + var(--event-progress)*.28)}
    .homepage-motion-cue i{width:8px;height:8px;border-radius:50%;background:#3ee0d6;box-shadow:0 0 18px rgba(62,224,214,.55)}
    .homepage-motion-cue span{color:#a5cad7;font-size:10px;font-weight:900;letter-spacing:.14em}
    .homepage-distinctive-stage{position:absolute;z-index:22;left:360px;top:132px;width:1060px;height:570px;pointer-events:none;font-family:Inter,Arial,sans-serif;color:#f6fbff;overflow:visible}
    .homepage-distinctive-stage>:not(.scene-kicker){opacity:calc(.72 + var(--state-enter)*.28)}
    .scene-kicker{position:absolute;left:0;top:0;right:20px;display:flex;justify-content:flex-end;align-items:center;color:#8da9bc;font-size:10px;font-weight:800;letter-spacing:.13em}
    .scene-kicker.vog{display:none}

    .homepage-voxy-subtitle{position:absolute;z-index:44;left:360px;right:470px;bottom:72px;min-height:72px;display:grid;grid-template-columns:62px 1fr;align-items:center;gap:14px;padding:13px 20px 14px;border-left:4px solid rgba(92,222,214,.9);border-radius:10px;background:linear-gradient(90deg,rgba(2,10,27,.92),rgba(4,18,40,.88));box-shadow:0 12px 34px rgba(0,0,0,.28);pointer-events:none}
    [data-homepage-film="voiceopengov"] .homepage-voxy-subtitle{border-left-color:#6eb7ff}
    .homepage-voxy-subtitle b{align-self:start;padding-top:4px;color:#69e0d8;font-size:12px;font-weight:900;letter-spacing:.12em}
    [data-homepage-film="voiceopengov"] .homepage-voxy-subtitle b{color:#82bfff}
    .homepage-voxy-subtitle p{margin:0;color:#f2f8fc;font-size:21px;line-height:1.26;font-weight:760;letter-spacing:-.012em;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
    [data-muted-first-captions="v3-7"] .broadcast-lower-third{opacity:0!important;pointer-events:none!important}

    .broadcast-right-column{width:390px!important;right:48px!important}
    .topic-date-zone{min-height:118px!important;padding:16px 19px!important}.topic-date-zone strong{font-size:19px!important}
    .memory-stack{padding:13px 14px 14px!important}
    .broadcast-lower-third{left:50px!important;right:470px!important;bottom:45px!important;min-height:132px!important;padding:14px 20px!important;grid-template-columns:6px 1fr 165px!important}
    .lower-copy strong{font-size:24px!important}.lower-copy p{font-size:12px!important}.lower-meta{font-size:10px!important}
    [data-pilot-version="homepage-reference-v3-4-broadcast-readability"][data-homepage-visual-state="FOCUS"] .broadcast-lower-third,[data-pilot-version="homepage-reference-v3-4-broadcast-readability"][data-homepage-visual-state="EXPLAIN"] .broadcast-lower-third{min-height:86px!important;padding:10px 16px!important;grid-template-columns:4px 1fr 0!important;background:linear-gradient(135deg,rgba(3,16,38,.7),rgba(1,8,23,.78))!important;box-shadow:0 12px 28px rgba(0,0,0,.22)!important}
    [data-pilot-version="homepage-reference-v3-4-broadcast-readability"][data-homepage-visual-state="FOCUS"] .lower-copy p,[data-pilot-version="homepage-reference-v3-4-broadcast-readability"][data-homepage-visual-state="EXPLAIN"] .lower-copy p,[data-pilot-version="homepage-reference-v3-4-broadcast-readability"][data-homepage-visual-state="FOCUS"] .lower-meta,[data-pilot-version="homepage-reference-v3-4-broadcast-readability"][data-homepage-visual-state="EXPLAIN"] .lower-meta{display:none!important}
    [data-pilot-version="homepage-reference-v3-4-broadcast-readability"][data-homepage-visual-state="FOCUS"] .lower-copy strong,[data-pilot-version="homepage-reference-v3-4-broadcast-readability"][data-homepage-visual-state="EXPLAIN"] .lower-copy strong{font-size:20px!important}
    [data-broadcast-discipline="v3-4"][data-homepage-segment-id="edebatte-source-questions"] .broadcast-lower-third,[data-broadcast-discipline="v3-4"][data-homepage-segment-id="edebatte-media-forensics"] .broadcast-lower-third,[data-broadcast-discipline="v3-4"][data-homepage-segment-id="edebatte-product-model"] .broadcast-lower-third,[data-broadcast-discipline="v3-4"][data-homepage-segment-id="edebatte-current-offer"] .broadcast-lower-third,[data-broadcast-discipline="v3-4"][data-homepage-segment-id="edebatte-next-generation"] .broadcast-lower-third,[data-broadcast-discipline="v3-4"][data-homepage-segment-id="edebatte-synthesis-questions"] .broadcast-lower-third,[data-broadcast-discipline="v3-4"][data-homepage-segment-id="edebatte-verifiability"] .broadcast-lower-third,[data-broadcast-discipline="v3-4"][data-homepage-segment-id="edebatte-cta"] .broadcast-lower-third,[data-broadcast-discipline="v3-4"][data-homepage-segment-id="vog-after-election"] .broadcast-lower-third,[data-broadcast-discipline="v3-4"][data-homepage-segment-id="vog-program-not-contract"] .broadcast-lower-third,[data-broadcast-discipline="v3-4"][data-homepage-segment-id="vog-demophobie"] .broadcast-lower-third,[data-broadcast-discipline="v3-4"][data-homepage-segment-id="vog-participation-balance"] .broadcast-lower-third,[data-broadcast-discipline="v3-4"][data-homepage-segment-id="vog-current-offer"] .broadcast-lower-third,[data-broadcast-discipline="v3-4"][data-homepage-segment-id="vog-synthesis"] .broadcast-lower-third,[data-broadcast-discipline="v3-4"][data-homepage-segment-id="vog-cta"] .broadcast-lower-third{opacity:0!important;pointer-events:none!important}

    .information-stage{left:1060px!important;top:165px!important;width:320px!important;height:92px!important;padding:10px 14px!important;border-radius:14px!important;background:linear-gradient(145deg,rgba(5,18,45,.88),rgba(2,9,25,.92))!important;box-shadow:0 16px 38px rgba(0,0,0,.3),0 0 24px rgba(21,112,255,.06)!important;--dock-scale:.55!important}
    .information-stage[data-evidence-id="edebatte-source-chain"],.information-stage[data-evidence-id="vog-evergreen-impact-loop"]{--dock-x:420px!important;--dock-y:105px!important}
    .information-stage[data-evidence-id="edebatte-status-ladder"],.information-stage[data-evidence-id="vog-accountability-chain"]{--dock-x:420px!important;--dock-y:245px!important}
    .information-stage .fixture-label,.memory-card .fixture-label{display:none!important}.information-stage .evidence-kind{margin-top:0!important;font-size:10px!important}.information-stage .evidence-core h1{max-width:290px!important;margin-top:5px!important;font-size:18px!important;line-height:1.05!important}
    .information-stage .trend-chart,.information-stage .participation-chart,.information-stage .question-ring,.information-stage .trend-note{display:none!important}.information-stage .evidence-question{display:block!important}
    .synthesis-stage{opacity:0!important;pointer-events:none!important}
    [data-homepage-film="edebatte"] .memory-card{border-left-color:#42d8d0!important;background:linear-gradient(135deg,rgba(5,43,62,.96),rgba(3,21,39,.95))!important}
    [data-homepage-film="edebatte"] .memory-stack>header span::after{content:" · QUELLENAKTE";color:#5fe4dc}
    [data-homepage-film="voiceopengov"] .memory-card{border-left-color:#5fa8ff!important;background:linear-gradient(135deg,rgba(11,38,82,.96),rgba(5,20,48,.95))!important}
    [data-homepage-film="voiceopengov"] .memory-stack>header span::after{content:" · WIRKUNGSPFAD";color:#77b6ff}
    [data-presenter-transition-polish="v3-5"][data-homepage-segment-id="vog-synthesis"] .memory-card{opacity:.62!important}
    [data-presenter-transition-polish="v3-5"][data-homepage-segment-id="vog-cta"] .memory-card{opacity:.38!important}
    [data-editorial-simplification="v3-8"][data-homepage-segment-id="vog-greeting"] .memory-card,[data-editorial-simplification="v3-8"][data-homepage-segment-id="edebatte-verifiability"] .memory-card{opacity:.48!important}
    [data-editorial-simplification="v3-8"][data-homepage-segment-id="edebatte-cta"] .memory-card{opacity:.3!important}
    [data-editorial-simplification="v3-8"][data-homepage-segment-id="vog-greeting"] .homepage-motion-cue,[data-editorial-simplification="v3-8"][data-homepage-segment-id="vog-synthesis"] .homepage-motion-cue,[data-editorial-simplification="v3-8"][data-homepage-segment-id="vog-cta"] .homepage-motion-cue,[data-editorial-simplification="v3-8"][data-homepage-segment-id="edebatte-verifiability"] .homepage-motion-cue,[data-editorial-simplification="v3-8"][data-homepage-segment-id="edebatte-cta"] .homepage-motion-cue{opacity:0!important}

    .headline-swarm,.headline-freeze-scene{position:absolute;inset:44px 55px 50px 15px}
    .swarm{position:absolute;padding:9px 12px;border:1px solid rgba(101,157,199,.32);border-radius:9px;background:rgba(6,23,45,.76);color:#8eacbf;font-size:10px;font-weight:900;letter-spacing:.11em;opacity:.68}
    .s1{left:1%;top:11%;transform:rotate(-5deg)}.s2{left:20%;top:2%;transform:rotate(3deg)}.s3{right:10%;top:13%;transform:rotate(4deg)}.s4{right:3%;bottom:17%;transform:rotate(-3deg)}
    .case-headline-object{position:absolute;width:310px;height:155px;padding:20px 22px;border-left:4px solid #48e2d7;border-radius:13px;background:linear-gradient(135deg,rgba(5,33,51,.96),rgba(3,17,35,.95));box-shadow:0 24px 58px rgba(0,0,0,.31),0 0 34px rgba(48,212,204,.09)}
    .case-headline-object small,.case-source-object header span,.claim-token small,.trace-copy small,.synthesis-core small,.vog-offer-scene small{color:#5ce3d9;font-size:10px;font-weight:900;letter-spacing:.12em}
    .case-headline-object strong{display:block;margin-top:10px;font-size:27px;letter-spacing:-.035em}.case-headline-object span{display:block;margin-top:8px;color:#b3c8d7;font-size:12px}.case-headline-object>i{display:block;width:74%;height:4px;margin-top:16px;border-radius:5px;background:linear-gradient(90deg,#45d9d0,rgba(70,137,195,.18))}
    .headline-swarm .case-headline-object{left:-145px;top:165px}.freeze-ring{position:absolute;left:735px;top:142px;width:175px;height:175px;display:grid;place-content:center;text-align:center;border:2px solid rgba(67,218,209,.65);border-radius:50%;box-shadow:0 0 65px rgba(42,210,202,.14)}.freeze-ring b{font-size:28px}.freeze-ring span{margin-top:7px;color:#a9c0d0;font-size:12px}
    .source-pull-scene{position:absolute;inset:55px 35px 25px 20px}.source-pull-scene .case-headline-object{left:-145px;top:145px}.source-claim-chip{position:absolute;left:-125px;top:180px;padding:11px 15px;border-left:3px solid #48e2d7;border-radius:9px;background:rgba(5,30,50,.86);font-size:12px;font-weight:900;letter-spacing:.08em}
    .case-source-object{position:absolute;width:430px;height:250px;padding:18px 20px;border-radius:12px;background:linear-gradient(145deg,#eaf3f7,#d3e2e9);color:#102033;box-shadow:0 24px 60px rgba(0,0,0,.28)}
    .source-pull-scene .case-source-object{right:-48px;top:76px;transform:scale(.72);transform-origin:100% 0}.case-source-object header,.case-source-object footer{display:flex;justify-content:space-between;align-items:center;font-size:10px;letter-spacing:.08em}.case-source-object header b{color:#006e76}.case-source-object footer{position:absolute;left:20px;right:20px;bottom:14px;color:#526e81;border-top:1px solid rgba(31,71,94,.15);padding-top:8px}
    .source-line{display:block;width:86%;height:6px;margin-top:11px;border-radius:5px;background:rgba(38,66,82,.14)}.source-line.wide{width:100%;margin-top:20px}.source-line.medium{width:70%}.source-line.short{width:48%}
    .source-passage{height:34px;margin:13px -3px 0;padding-left:12px;display:flex;align-items:center;border-left:4px solid #00a9a0;background:linear-gradient(90deg,rgba(0,169,160,.2) calc(var(--passage)*100%),rgba(40,72,91,.06) calc(var(--passage)*100%))}.source-passage span{font-size:10px;font-weight:900;letter-spacing:.1em;color:#006c70}
    .evidence-beam{position:absolute;left:700px;top:350px;width:230px;display:flex;justify-content:flex-end;align-items:center;gap:9px;color:#5be0d6;font-size:10px;font-weight:900;letter-spacing:.1em}.evidence-beam i{height:2px;flex:0 0 78px;background:linear-gradient(90deg,#38d6cc,#3788e3)}
    .forensic-split-scene{position:absolute;inset:48px 28px 30px 10px}.claim-token{position:absolute;left:690px;top:155px;width:220px;height:126px;padding:18px 20px;border:1px solid rgba(76,156,209,.42);border-radius:14px;background:rgba(5,27,51,.94);box-shadow:0 18px 40px rgba(0,0,0,.22)}.claim-token b{display:block;margin-top:8px;font-size:30px}.claim-token span{display:block;margin-top:8px;color:#a4bbcb;font-size:12px}
    .forensic-source-resolution .case-source-object{left:auto;right:-38px;top:76px;transform:scale(.72);transform-origin:100% 0}.forensic-study-label{position:absolute;left:700px;top:28px;color:#8fb3c8}.forensic-study-label small{display:block;font-size:10px;font-weight:900;letter-spacing:.12em}.forensic-study-label b{display:block;margin-top:4px;font-size:17px;color:#e7f5fb}.split-rule{position:absolute;left:690px;bottom:34px;width:300px;display:grid;grid-template-columns:auto 1fr auto;gap:13px;align-items:center;color:#bfd2df;font-size:11px;font-weight:900;letter-spacing:.08em}.split-rule i{height:2px;background:linear-gradient(90deg,#45d9d0,#ffb45e)}
    .case-trace-scene{position:absolute;left:770px;top:125px;width:260px;height:390px}.trace-axis{position:absolute;left:0;top:0;width:245px;display:grid;grid-template-columns:1fr;gap:8px;padding-left:16px;border-left:2px solid rgba(62,134,184,.42)}.trace-node{display:flex;align-items:center;gap:11px;min-height:36px;color:#7192a9;font-size:11px;font-weight:900;letter-spacing:.06em}.trace-node i{width:16px;height:16px;margin-left:-25px;border:2px solid #496b87;border-radius:50%;background:#07172b}.trace-node.reached{color:#d3eeec}.trace-node.reached i{border-color:#49ded4;background:#169a95;box-shadow:0 0 18px rgba(59,220,210,.2)}.trace-copy{position:absolute;left:0;top:310px;width:260px;text-align:left}.trace-copy strong{display:block;margin-top:9px;font-size:20px;line-height:1.1}.trace-copy small{color:#63dcd4}
    .case-synthesis-scene{position:absolute;left:690px;top:125px;width:300px;height:390px}.case-synthesis-scene .synthesis-orbit{display:none;position:absolute;right:0;top:0;width:112px;height:112px;place-content:center;text-align:center;border:1px solid rgba(87,162,215,.45);border-radius:50%;background:rgba(4,23,45,.82);box-shadow:0 0 45px rgba(41,119,183,.09)}.case-synthesis-scene[data-synthesis-phase="source"] .synthesis-orbit.source,.case-synthesis-scene[data-synthesis-phase="context"] .synthesis-orbit.context,.case-synthesis-scene[data-synthesis-phase="counter"] .synthesis-orbit.counter{display:grid}.synthesis-orbit small{color:#a7c0d1;font-size:10px;font-weight:900;letter-spacing:.08em}.synthesis-orbit b{font-size:24px;margin-top:4px}.synthesis-core{position:absolute;left:0;top:150px;width:300px;text-align:right}.synthesis-core strong{display:block;margin-top:10px;font-size:25px;line-height:1.04}.synthesis-core span{display:block;margin-top:11px;color:#aec2d0;font-size:12px;line-height:1.35}
    .case-resolution-scene{position:absolute;left:690px;top:125px;width:300px;text-align:right}.verification-pulse{position:relative;width:140px;height:140px;margin-left:auto;display:grid;place-content:center;text-align:center;border:1px solid rgba(71,218,208,.62);border-radius:50%}.verification-pulse i{position:absolute;inset:18px;border:1px solid rgba(62,224,214,.25);border-radius:50%}.verification-pulse i:nth-child(2){inset:34px}.verification-pulse i:nth-child(3){inset:50px}.verification-pulse b{font-size:17px;letter-spacing:.1em}.case-resolution-scene>strong{display:block;margin-top:20px;font-size:25px}.case-resolution-scene>span{display:block;margin-top:10px;color:#a7bdcc;font-size:12px;line-height:1.35}.memory-flight{position:absolute;right:0;top:280px;width:230px;display:flex;align-items:center;gap:10px;color:#7ee2dc;font-size:10px;font-weight:900;letter-spacing:.08em}.memory-flight i{height:2px;flex:1;background:linear-gradient(90deg,#39d7cd,#3d83dd)}

    .democratic-loop{position:absolute;left:735px;top:468px;width:820px;height:440px;transform:scale(.34);transform-origin:0 0}
    .loop-heading{position:absolute;left:145px;top:-76px;display:flex;flex-direction:column;gap:7px;color:#91b9da;white-space:nowrap}.loop-heading small{font-size:24px;font-weight:850;letter-spacing:.08em;color:#7899b3}.loop-heading strong{font-size:44px;font-weight:900;letter-spacing:.06em;color:#b9d8ec}
    .democratic-loop svg{position:absolute;inset:0;width:100%;height:100%}.democratic-loop svg path{fill:none;stroke:#3d7bb5;stroke-width:3;stroke-dasharray:8 11;stroke-dashoffset:calc((1 - var(--loop))*80);opacity:.5}.loop-node{position:absolute;width:180px;height:84px;display:grid;place-content:center;text-align:center;color:#7f9aae;font-size:42px;line-height:1.02;font-weight:900;letter-spacing:.015em}.loop-node i{width:20px;height:20px;margin:0 auto 7px;border-radius:50%;border:2px solid #5883aa;background:#081a32}.loop-node.complete{color:#9fb7c8;opacity:.68}.loop-node.upcoming{opacity:.4}.loop-node.active{color:#e6f4ff;opacity:1}.loop-node.active i{border-color:#64d8d0;background:#167e99;box-shadow:0 0 28px rgba(79,207,210,.5)}.n1{left:20px;top:190px}.n2{left:125px;top:32px}.n3{left:350px;top:0}.n4{right:54px;top:88px}.n5{right:6px;bottom:52px}.n6{left:250px;bottom:4px}.mandate-pulse{position:absolute;left:485px;top:160px;width:180px;height:180px;display:grid;place-content:center;text-align:center;border:1px solid rgba(95,175,255,.55);border-radius:50%;background:radial-gradient(circle,rgba(33,103,187,.22),rgba(4,20,45,.58));opacity:.62}.mandate-pulse.active{opacity:1;border-color:#64d8d0;box-shadow:0 0 28px rgba(79,207,210,.22)}.mandate-pulse i{position:absolute;inset:22px;border:1px solid rgba(71,220,209,.38);border-radius:50%}.mandate-pulse b{font-size:38px;line-height:1.05;letter-spacing:.025em}
    .vog-lead-card{position:absolute;left:690px;top:94px;width:300px;padding:18px 20px;border-left:3px solid #69b7ff;background:linear-gradient(90deg,rgba(7,35,72,.8),rgba(4,19,43,.16))}.vog-lead-card small{display:block;color:#8fc5ff;font-size:10px;font-weight:900;letter-spacing:.1em}.vog-lead-card strong{display:block;margin-top:9px;font-size:23px;line-height:1.08}
    .living-mandate-path{position:absolute;left:690px;top:125px;width:300px;height:390px}.mandate-origin{position:absolute;left:0;top:0;width:72px;height:72px;display:grid;place-content:center;text-align:center;border:1px solid rgba(97,174,245,.5);border-radius:50%;background:#081b36}.mandate-origin small{font-size:10px;color:#9fc0da}.mandate-origin b{font-size:28px;color:#69b8ff}.mandate-track{position:absolute;left:94px;right:0;top:25px;color:#a4bdcf;font-size:11px;font-weight:900;letter-spacing:.08em}.mandate-step{position:absolute;left:0!important;top:calc(100px + var(--step)*52px)!important;width:285px;display:grid;grid-template-columns:22px 1fr;align-items:center;gap:11px;text-align:left;color:#7998ae;font-size:11px;font-weight:900;letter-spacing:.05em}.mandate-step i{width:14px;height:14px;border:2px solid #4d7190;border-radius:50%;background:#07172d}.mandate-step.active{color:#d2e7f6}.mandate-step.active i{border-color:#70baff;background:#317dc6;box-shadow:0 0 20px rgba(85,170,239,.25)}.moving-mandate{position:absolute;left:205px;top:0;width:76px;height:34px;display:grid;place-content:center;border-radius:999px;background:#0c5b92;color:#d9f1ff;font-size:10px;font-weight:900;letter-spacing:.07em}
    .programme-gap-scene,.demophobie-space,.participation-balance-scene,.vog-offer-scene{position:absolute;left:690px;top:125px;width:300px;height:390px}
    .promise-object,.decision-object{position:absolute;left:0;top:70px;width:270px;height:168px;padding:22px;border-radius:18px;background:linear-gradient(145deg,rgba(10,41,79,.92),rgba(4,19,42,.94));border:1px solid rgba(91,157,224,.42)}.promise-object small,.decision-object small,.demophobie-source small,.design-question small,.current-layer small,.future-layer small,.closing-copy small{color:#8fc5ff;font-size:10px;font-weight:900;letter-spacing:.1em}.promise-object strong,.decision-object strong{display:block;margin-top:10px;font-size:27px}.promise-object span,.decision-object span{display:block;margin-top:9px;color:#abc1d1;font-size:12px}.gap-field{position:absolute;left:0;top:90px;width:285px;text-align:center}.gap-field b{display:block;font-size:48px;color:#ffbc70}.gap-field span{display:block;margin-top:7px;color:#e3eef7;font-size:16px;font-weight:900;letter-spacing:.04em}.gap-field em{display:block;margin-top:10px;color:#a9c0d0;font-size:11px;font-style:normal;font-weight:900;letter-spacing:.08em}.status-ruler{position:absolute;left:0;right:0;bottom:26px;display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding-top:12px;border-top:2px solid rgba(64,156,211,.6);color:#a6bfd2;font-size:11px;font-weight:900;letter-spacing:.04em;text-align:center}
    .demophobie-source{position:absolute;left:0;top:70px;width:270px;padding:20px;border-left:3px solid #73b7ff;background:linear-gradient(90deg,rgba(10,40,78,.88),rgba(5,19,43,.55))}.demophobie-source strong{display:block;margin-top:10px;font-size:25px;line-height:1.05}.demophobie-source span{display:block;margin-top:9px;color:#b0c4d3;font-size:12px;line-height:1.35}.design-question{position:absolute;left:0;top:65px;width:270px;padding:23px;border:1px solid rgba(94,158,221,.44);border-radius:20px;background:rgba(4,19,43,.8)}.design-question b{display:block;margin-top:12px;font-size:22px;line-height:1.12}.guardrail-row{position:absolute;left:0;right:0;bottom:15px;display:flex;flex-wrap:wrap;justify-content:flex-start;gap:9px}.guardrail{padding:9px 11px;border:1px solid rgba(86,148,204,.35);border-radius:999px;background:rgba(5,24,48,.8);color:#adc3d2;font-size:11px;font-weight:900;letter-spacing:.05em}
    .extreme{position:absolute;top:0;width:132px;padding:12px;border:1px solid rgba(91,145,197,.28);border-radius:14px;background:rgba(5,22,45,.55);text-align:center;opacity:.58}.extreme.left{left:0}.extreme.right{left:158px}.extreme small{color:#91aabc;font-size:10px;font-weight:900}.extreme strong{display:block;margin-top:7px;font-size:14px}.balance-core{position:absolute;left:0;top:105px;width:292px;height:220px;display:grid;place-content:center;text-align:center;border:1px solid rgba(73,213,203,.58);border-radius:50%;background:radial-gradient(circle,rgba(24,111,146,.2),rgba(4,20,44,.7));box-shadow:0 0 42px rgba(43,205,195,.07)}.balance-core i{position:absolute;inset:28px;border:1px solid rgba(90,177,230,.28);border-radius:50%}.balance-core strong{font-size:22px;line-height:1.06}.balance-core span{max-width:230px;margin:11px auto 0;color:#b0c5d4;font-size:12px;line-height:1.35}
    .participation-balance-scene{left:810px;width:220px}.participation-balance-scene .extreme{width:102px;padding:9px;opacity:.42}.participation-balance-scene .extreme.right{left:118px}.participation-balance-scene .balance-core{left:0;top:118px;width:220px;height:168px}.participation-balance-scene .balance-core i{inset:22px}.participation-balance-scene .balance-core strong{font-size:18px;padding:0 12px}.participation-balance-scene .balance-core span{max-width:180px}
    .current-layer,.future-layer{position:absolute;left:0;top:85px;width:270px;min-height:132px;padding:20px 22px;border-radius:17px}.current-layer{border:1px solid rgba(77,162,225,.46);background:linear-gradient(135deg,rgba(9,41,78,.88),rgba(5,20,45,.84))}.future-layer{border:1px dashed rgba(66,211,201,.5);background:rgba(4,26,44,.5)}.current-layer strong,.future-layer strong{display:block;margin-top:9px;font-size:18px;line-height:1.08}.current-layer span,.future-layer span{display:block;margin-top:9px;color:#b1c5d4;font-size:11px;line-height:1.35}.bridge{position:absolute;left:0;top:150px;width:280px;display:flex;align-items:center;gap:12px;color:#79dfd8;font-size:14px;font-weight:900;letter-spacing:.05em}.bridge i{height:2px;flex:1;background:linear-gradient(90deg,#478fe0,#37d5cb)}
    .vog-closing-scene{position:absolute;inset:30px 20px 20px 10px}.vog-closing-scene .democratic-loop{left:735px;top:468px;transform:scale(.3);transform-origin:0 0;opacity:.18}.closing-copy{position:absolute;right:10px;top:205px;width:310px;padding:18px;border-left:3px solid #64b1ff;background:linear-gradient(90deg,rgba(3,19,43,.84),transparent)}.closing-copy strong{display:block;margin-top:10px;font-size:23px;line-height:1.08}.closing-copy span{display:block;margin-top:9px;color:#c4d7e4;font-size:13px;font-weight:750}
    ${socialProfileCss(plan)}
  </style>`;

  const contextDateReplacement = plan.filmId === "voiceopengov" && plan.contextMode === "evergreen"
    ? "ZWISCHEN DEN WAHLEN"
    : null;

  let html = replaceHomepageLapelPin(base)
    .replace('data-burned-in-captions="false"', 'data-burned-in-captions="true"')
    .replace("</head>", `${css}</head>`)
    .replace(
      "</main>",
      `${profileOverlay}</main>`,
    )
    .replace(
      'data-pilot-version="1.4-final-layout"',
      `data-pilot-version="homepage-reference-v3-4-broadcast-readability" data-broadcast-discipline="v3-4" data-presenter-transition-polish="v3-5" data-microphone-clearance-lock="v3-6" data-editorial-clarity="v3-7" data-muted-first-captions="v3-7" data-editorial-simplification="v3-8" data-narrative-navigation="v3-8" data-multiformat-broadcast="v3-9" data-layout-profile="${plan.layoutProfile}" data-layout-profile-width="${plan.layout.output.width}" data-layout-profile-height="${plan.layout.output.height}" data-layout-scale-only="false" data-caption-cues="sentence-level" data-caption-maximum-lines="2" data-state-settle-seconds="${STATE_SETTLE_SECONDS}" data-pause-hold="previous-segment" data-min-readable-state-seconds="${MIN_READABLE_STATE_SECONDS}" data-homepage-film="${plan.filmId}" data-context-mode="${plan.contextMode}" data-visual-language="${plan.visualLanguage}" data-homepage-visual-state="${visualState.state}" data-homepage-segment-id="${escapeHtml(segment.id)}" data-motion-event-index="${eventIndex}" data-platform-safe-zone="top:${safeArea.top};right:${safeArea.right};bottom:${safeArea.bottom};left:${safeArea.left}" data-host-face-safe-zone="${faceSafeZone}" data-host-presenter-safe-zone="x${regions.presenter.x}-${regions.presenter.x + regions.presenter.width}:y${regions.presenter.y}-${regions.presenter.y + regions.presenter.height}" data-microphone-safe-zone="x${regions.microphone.x}-${regions.microphone.x + regions.microphone.width}:y${regions.microphone.y}-${regions.microphone.y + regions.microphone.height}" data-host-face-safe-policy="hard-no-lines-or-large-objects" data-presenter-safe-policy="no-semantic-text-or-connector-lines"`,
    );
  if (contextDateReplacement) html = html.replaceAll("SEPTEMBER 2026", contextDateReplacement);
  return html;
}
