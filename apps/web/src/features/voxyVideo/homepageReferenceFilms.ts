import { VOXY_SIGNATURE } from "./dualVoiceArchitecture";
import {
  VOXY_DUAL_VOICE_PILOT_VOICE_BINDINGS,
  type VoxyBroadcastMeta,
  type VoxyDualVoicePilotSpeakerEntry,
  type VoxyDualVoicePilotVisualEntry,
  type VoxyLowerThirdEntry,
  type VoxyPilotEvidence,
} from "./dualVoiceExplainerPilot";
import { VOXY_FIRST_PARTY_VISUAL_BINDING } from "./firstPartyVoiceClone";

export const VOXY_HOMEPAGE_REFERENCE_FILMS_SCHEMA_VERSION =
  "voxy-homepage-reference-films-v1" as const;

export type VoxyHomepageFilmId = "edebatte" | "voiceopengov";
export type VoxyHomepageContextMode = "evergreen" | "election_window";

export const VOXY_HOMEPAGE_REFERENCE_FILMS_OUTPUT = {
  edebatte: {
    directory: "edebatte",
    mp4: "voxy-edebatte-homepage-reference-v1.mp4",
    masterAudio: "master-audio.wav",
    preview: "preview.png",
    contactSheet: "contact-sheet.png",
    manifest: "manifest.json",
    captionsVtt: "captions.de.vtt",
    captionsSrt: "captions.de.srt",
    sourceManifest: "source-manifest.json",
    evidenceTimeline: "evidence-timeline.json",
    motionTimeline: "motion-timeline.json",
    lowerThirdTimeline: "lower-third-timeline.json",
    speakerTimeline: "speaker-timeline.json",
    visualStateTimeline: "visual-state-timeline.json",
    audioPreservation: "audio-preservation.json",
    durationSeconds: { min: 55, max: 70 },
  },
  voiceopengov: {
    directory: "voiceopengov",
    mp4: "voxy-voiceopengov-homepage-reference-v1.mp4",
    masterAudio: "master-audio.wav",
    preview: "preview.png",
    contactSheet: "contact-sheet.png",
    manifest: "manifest.json",
    captionsVtt: "captions.de.vtt",
    captionsSrt: "captions.de.srt",
    sourceManifest: "source-manifest.json",
    evidenceTimeline: "evidence-timeline.json",
    motionTimeline: "motion-timeline.json",
    lowerThirdTimeline: "lower-third-timeline.json",
    speakerTimeline: "speaker-timeline.json",
    visualStateTimeline: "visual-state-timeline.json",
    audioPreservation: "audio-preservation.json",
    durationSeconds: { min: 60, max: 75 },
  },
  width: 1920,
  height: 1080,
  fps: 24,
} as const;

export const VOXY_HOMEPAGE_SOURCE_REGISTRY = [
  {
    id: "edebatte-homepage",
    publisher: "eDebatte",
    title: "eDebatte – Stimmen prüfen, Perspektiven verstehen",
    url: "https://www.edebatte.org/",
    sourceClass: "first_party_product_surface",
    retrievedAt: "2026-08-18",
    revision: "live-page-check-2026-08-18",
  },
  {
    id: "edebatte-statements",
    publisher: "eDebatte",
    title: "Statements",
    url: "https://www.edebatte.org/statements",
    sourceClass: "first_party_product_surface",
    retrievedAt: "2026-08-18",
    revision: "live-page-check-2026-08-18",
  },
  {
    id: "voiceopengov-homepage",
    publisher: "VoiceOpenGov",
    title: "VoiceOpenGov – Mitmachen und informiert bleiben",
    url: "https://www.voiceopengov.org/",
    sourceClass: "first_party_product_surface",
    retrievedAt: "2026-08-18",
    revision: "live-page-check-2026-08-18",
  },
  {
    id: "federal-election-calendar-2026",
    publisher: "Die Bundeswahlleiterin",
    title: "Künftige Wahltermine in Deutschland",
    url: "https://www.bundeswahlleiterin.de/service/wahltermine.html",
    sourceClass: "official_election_authority",
    retrievedAt: "2026-08-18",
    revision: "live-page-check-2026-08-18",
  },
  {
    id: "berlin-election-2026-faq",
    publisher: "Die Landeswahlleiterin für Berlin",
    title: "Fragen und Antworten zu den Berliner Wahlen 2026",
    url: "https://www.berlin.de/wahlen/wahlen/berliner-wahlen-2026/fragen-und-antwortkatalog/artikel.1646712.php",
    sourceClass: "official_election_authority",
    retrievedAt: "2026-08-18",
    revision: "live-page-check-2026-08-18",
  },
] as const;

export const VOXY_CURRENT_OFFER_INVENTORY = [
  {
    id: "edebatte-public-orientation",
    classification: "current_capability",
    product: "eDebatte",
    claim: "Öffentliche Themen, Statements und ihre Kontexte lassen sich aufrufen.",
    sourceIds: ["edebatte-homepage", "edebatte-statements"],
    marketable: true,
  },
  {
    id: "edebatte-check-contribution",
    classification: "current_capability",
    product: "eDebatte",
    claim: "Menschen können einen Beitrag zur Prüfung einreichen und freigegebene Beteiligungswege nutzen.",
    sourceIds: ["edebatte-homepage"],
    marketable: true,
  },
  {
    id: "voiceopengov-double-opt-in",
    classification: "current_capability",
    product: "VoiceOpenGov",
    claim: "Die Initiative bietet eine kostenfreie Eintragung mit Double-Opt-in.",
    sourceIds: ["voiceopengov-homepage"],
    marketable: true,
  },
  {
    id: "voiceopengov-voluntary-support",
    classification: "current_capability",
    product: "VoiceOpenGov",
    claim: "Freiwillige Unterstützung ist möglich und verschafft keine Stimmvorteile.",
    sourceIds: ["voiceopengov-homepage"],
    marketable: true,
  },
  {
    id: "verify-before-belief",
    classification: "editorial_principle",
    product: "shared",
    claim: "Quellen, Gegenpositionen, offene Fragen und Unsicherheit sichtbar halten.",
    sourceIds: [],
    marketable: false,
  },
  {
    id: "continuous-democratic-mandate",
    classification: "future_intent",
    product: "VoiceOpenGov",
    claim: "Ein allgemeines kontinuierliches digitales Mandat ist nicht als aktuelles Produktangebot freigegeben.",
    sourceIds: [],
    marketable: false,
  },
] as const;

type FilmSegment = Readonly<{
  id: string;
  text: string;
  spokenText: string;
  pauseAfterMs: number;
  contexts: readonly VoxyHomepageContextMode[];
}>;

type HomepageFilmDefinition = Readonly<{
  id: VoxyHomepageFilmId;
  title: string;
  proposition: string;
  cta: string;
  broadcastMeta: VoxyBroadcastMeta;
  segments: readonly FilmSegment[];
  evidence: readonly VoxyPilotEvidence[];
  sourceIds: readonly string[];
  marketedOfferIds: readonly string[];
}>;

const bothModes = ["evergreen", "election_window"] as const;

export const VOXY_HOMEPAGE_REFERENCE_FILMS = {
  edebatte: {
    id: "edebatte",
    title: "eDebatte Homepage Reference Film",
    proposition: "Prüfen statt glauben.",
    cta: "Aktuelle Entwicklungen entdecken",
    broadcastMeta: {
      topicLabel: "THEMA",
      topicTitle: "Aussagen nachvollziehbar prüfen",
      displayDate: "WAHLFENSTER 2026",
      kicker: "PRÜFEN STATT GLAUBEN",
      headline: "Eine Behauptung ist noch kein Beleg",
      summary: "Aussage, Quelle, Gegenposition und offene Frage bleiben unterscheidbar.",
    },
    segments: [
      { id: "edebatte-greeting", text: "Hallo Nachbar. Ein Versprechen ist noch kein Beschluss. Und eine Behauptung noch kein Beleg.", spokenText: "Hallo Nachbar. Ein Versprechen ist noch kein Beschluss. Und eine Behauptung noch kein Beleg.", pauseAfterMs: 160, contexts: bothModes },
      { id: "edebatte-election-noise", text: "Gerade vor einer Wahl hören wir viele Antworten. Aber welche Frage wurde eigentlich beantwortet?", spokenText: "Gerade vor einer Wahl hören wir viele Antworten. Aber welche Frage wurde eigentlich beantwortet?", pauseAfterMs: 130, contexts: ["election_window"] },
      { id: "edebatte-source-questions", text: "Wo steht die Aussage? Von wann ist die Quelle? Wer trägt Verantwortung?", spokenText: "Wo steht die Aussage? Von wann ist die Quelle? Wer trägt Verantwortung?", pauseAfterMs: 120, contexts: bothModes },
      { id: "edebatte-status-distinction", text: "Ist es Programm, Antrag, Beschluss – oder schon umgesetzt? Denn ein Wahlprogramm ist kein Gesetz. Und ein Beschluss noch keine Wirkung.", spokenText: "Ist es Programm, Antrag, Beschluss – oder schon umgesetzt? Denn ein Wahlprogramm ist kein Gesetz. Und ein Beschluss noch keine Wirkung.", pauseAfterMs: 170, contexts: bothModes },
      { id: "edebatte-product-model", text: "eDebatte hält Aussage, Quelle, Gegenposition und offene Frage in einem nachvollziehbaren Themenstand auseinander.", spokenText: "eDebatte hält Aussage, Quelle, Gegenposition und offene Frage in einem nachvollziehbaren Themenstand auseinander.", pauseAfterMs: 130, contexts: bothModes },
      { id: "edebatte-current-offer", text: "Du kannst aktuelle Themen und Statements mit Kontext lesen, Dossiers öffnen und einen Beitrag zur Prüfung einreichen.", spokenText: "Du kannst aktuelle Themen und Statements mit Kontext lesen, Dossiers öffnen und einen Beitrag zur Prüfung einreichen.", pauseAfterMs: 130, contexts: bothModes },
      { id: "edebatte-no-autopublish", text: "Nichts davon wird automatisch veröffentlicht. Verantwortung und Freigabe bleiben bei Menschen.", spokenText: "Nichts davon wird automatisch veröffentlicht. Verantwortung und Freigabe bleiben bei Menschen.", pauseAfterMs: 150, contexts: bothModes },
      { id: "edebatte-synthesis-questions", text: "Was wissen wir? Was spricht dafür? Was dagegen? Und was wissen wir noch nicht?", spokenText: "Was wissen wir? Was spricht dafür? Was dagegen? Und was wissen wir noch nicht?", pauseAfterMs: 180, contexts: bothModes },
      { id: "edebatte-verifiability", text: "Du musst mir nichts glauben. Du sollst es prüfen können.", spokenText: "Du musst mir nichts glauben. Du sollst es prüfen können.", pauseAfterMs: 160, contexts: bothModes },
      { id: "edebatte-cta", text: "Aktuelle Entwicklungen entdecken.", spokenText: "Aktuelle Entwicklungen entdecken.", pauseAfterMs: 0, contexts: bothModes },
    ],
    evidence: [
      { id: "edebatte-source-chain", type: "QUELLEN-CHECK", title: "Aussage → Quelle → Kontext", shortSummary: "Herkunft und Stand einer Aussage bleiben sichtbar.", sourceLabel: "eDebatte · öffentliche Produktoberflächen", provenance: "AKTUELLE PRODUKT-EVIDENZ", visualIdentity: "source-chain-cyan-continuous-line", visualPayload: { kind: "trend_line" }, memoryPriority: 100 },
      { id: "edebatte-status-ladder", type: "STATUS PRÜFEN", title: "Programm ist nicht Wirkung", shortSummary: "Programm, Antrag, Beschluss und Umsetzung sind verschiedene Stände.", sourceLabel: "redaktionelle Einordnung", provenance: "REDAKTIONELLES PRINZIP", visualIdentity: "status-ladder-blue-stepped-bars", visualPayload: { kind: "bar_series", values: [0.28, 0.48, 0.7, 1] }, memoryPriority: 90 },
      { id: "edebatte-open-question", type: "OFFENE FRAGE", title: "Was wissen wir noch nicht?", shortSummary: "Unsicherheit bleibt sichtbar, statt zur Gewissheit umgedeutet zu werden.", provenance: "REDAKTIONELLES PRINZIP", visualIdentity: "open-question-amber-ring", visualPayload: { kind: "open_question" }, memoryPriority: 110 },
    ],
    sourceIds: ["edebatte-homepage", "edebatte-statements", "federal-election-calendar-2026", "berlin-election-2026-faq"],
    marketedOfferIds: ["edebatte-public-orientation", "edebatte-check-contribution"],
  },
  voiceopengov: {
    id: "voiceopengov",
    title: "VoiceOpenGov Homepage Reference Film",
    proposition: "Deine Stimme endet nicht am Wahltag.",
    cta: "Mitmachen und informiert bleiben",
    broadcastMeta: {
      topicLabel: "THEMA",
      topicTitle: "Demokratie zwischen den Wahlen",
      displayDate: "SEPTEMBER 2026",
      kicker: "DEINE STIMME BLEIBT",
      headline: "Der Wahltag ist ein Anfang",
      summary: "Zusagen, Entscheidungen, Umsetzung und offene Fragen bleiben nachvollziehbar.",
    },
    segments: [
      { id: "vog-greeting", text: "Hallo Nachbar. Eine Wahl dauert einen Tag. Demokratie die Jahre dazwischen.", spokenText: "Hallo Nachbar. Eine Wahl dauert einen Tag. Demokratie die Jahre dazwischen.", pauseAfterMs: 150, contexts: bothModes },
      { id: "vog-election-calendar", text: "Im September 2026 finden mehrere Wahlen statt: in Sachsen-Anhalt, Niedersachsen, Berlin und Mecklenburg-Vorpommern.", spokenText: "Im September zweitausendsechsundzwanzig finden mehrere Wahlen statt: in Sachsen-Anhalt, Niedersachsen, Berlin und Mecklenburg-Vorpommern.", pauseAfterMs: 130, contexts: ["election_window"] },
      { id: "vog-berlin-sixteen", text: "In Berlin dürfen bei der Abgeordnetenhauswahl erstmals auch Sechzehn- und Siebzehnjährige abstimmen.", spokenText: "In Berlin dürfen bei der Abgeordnetenhauswahl erstmals auch Sechzehn- und Siebzehnjährige abstimmen.", pauseAfterMs: 140, contexts: ["election_window"] },
      { id: "vog-after-election", text: "Aber was passiert nach dem Wahltag? Was wurde zugesagt? Was wurde beschlossen?", spokenText: "Aber was passiert nach dem Wahltag? Was wurde zugesagt? Was wurde beschlossen?", pauseAfterMs: 120, contexts: bothModes },
      { id: "vog-status-chain", text: "Was wurde umgesetzt? Was hat sich verändert – und was blieb offen?", spokenText: "Was wurde umgesetzt? Was hat sich verändert – und was blieb offen?", pauseAfterMs: 130, contexts: bothModes },
      { id: "vog-tools-roles", text: "VoiceOpenGov ist die unabhängige Initiative. eDebatte ist das Werkzeug, das Aussagen, Quellen, Dossiers und Status nachvollziehbar verbindet.", spokenText: "Voice Open Gov ist die unabhängige Initiative. eDebatte ist das Werkzeug, das Aussagen, Quellen, Dossiers und Status nachvollziehbar verbindet.", pauseAfterMs: 140, contexts: bothModes },
      { id: "vog-current-offer", text: "Du kannst dich aktuell kostenfrei per Double-Opt-in eintragen, mobil mitwirken oder die Initiative freiwillig unterstützen.", spokenText: "Du kannst dich aktuell kostenfrei per Double Opt in eintragen, mobil mitwirken oder die Initiative freiwillig unterstützen.", pauseAfterMs: 130, contexts: bothModes },
      { id: "vog-equal-voice", text: "Unterstützung schafft keine Stimmvorteile. Beteiligung bleibt freiwillig und nachvollziehbar.", spokenText: "Unterstützung schafft keine Stimmvorteile. Beteiligung bleibt freiwillig und nachvollziehbar.", pauseAfterMs: 150, contexts: bothModes },
      { id: "vog-synthesis", text: "Ein Kreuz ist eine Entscheidung. Nachvollziehbarkeit zeigt, was daraus geworden ist.", spokenText: "Ein Kreuz ist eine Entscheidung. Nachvollziehbarkeit zeigt, was daraus geworden ist.", pauseAfterMs: 180, contexts: bothModes },
      { id: "vog-cta", text: "Deine Stimme endet nicht am Wahltag. Mitmachen und informiert bleiben.", spokenText: "Deine Stimme endet nicht am Wahltag. Mitmachen und informiert bleiben.", pauseAfterMs: 0, contexts: bothModes },
    ],
    evidence: [
      { id: "vog-election-calendar", type: "WAHLTERMINE 2026", title: "Vier Termine im September", shortSummary: "06.09. Sachsen-Anhalt · 13.09. Niedersachsen · 20.09. Berlin und Mecklenburg-Vorpommern", sourceLabel: "Bundeswahlleiterin · Stand 18.08.2026", provenance: "AMTLICHE QUELLE", visualIdentity: "election-calendar-cyan-continuous-line", visualPayload: { kind: "trend_line" }, memoryPriority: 100 },
      { id: "vog-accountability-chain", type: "NACH DEM WAHLTAG", title: "Zusage → Beschluss → Umsetzung", shortSummary: "Status und offene Fragen bleiben unterscheidbar.", sourceLabel: "VoiceOpenGov · eDebatte", provenance: "REDAKTIONELLES PRINZIP", visualIdentity: "accountability-blue-stepped-bars", visualPayload: { kind: "bar_series", values: [0.34, 0.64, 1] }, memoryPriority: 95 },
      { id: "vog-open-question", type: "OFFENE FRAGE", title: "Was hat sich wirklich verändert?", shortSummary: "Die Bewertung bleibt bei den Menschen.", provenance: "REDAKTIONELLES PRINZIP", visualIdentity: "open-question-amber-ring", visualPayload: { kind: "open_question" }, memoryPriority: 110 },
    ],
    sourceIds: ["voiceopengov-homepage", "edebatte-homepage", "edebatte-statements", "federal-election-calendar-2026", "berlin-election-2026-faq"],
    marketedOfferIds: ["voiceopengov-double-opt-in", "voiceopengov-voluntary-support", "edebatte-public-orientation"],
  },
} as const satisfies Record<VoxyHomepageFilmId, HomepageFilmDefinition>;

export function filmSegments(filmId: VoxyHomepageFilmId, contextMode: VoxyHomepageContextMode) {
  return VOXY_HOMEPAGE_REFERENCE_FILMS[filmId].segments
    .filter((segment) => (segment.contexts as readonly VoxyHomepageContextMode[]).includes(contextMode))
    .map((segment) => ({
      ...segment,
      speakerRole: "voxy" as const,
      voiceId: VOXY_SIGNATURE.voiceId,
      voiceBinding: VOXY_DUAL_VOICE_PILOT_VOICE_BINDINGS.voxy,
    }));
}

const seconds = (milliseconds: number): number => Number((milliseconds / 1_000).toFixed(3));

function lowerThird(input: Omit<VoxyLowerThirdEntry, "transitionMs" | "transition" | "minimumDwellSeconds" | "wordByWordAnimation" | "blinking" | "captionMirror">): VoxyLowerThirdEntry {
  return { ...input, transitionMs: 360, transition: "soft_translate_fade", minimumDwellSeconds: Math.min(2.4, input.validUntil - input.validFrom), wordByWordAnimation: false, blinking: false, captionMirror: false };
}

export function buildVoxyHomepageReferenceFilmPlan(input: {
  filmId: VoxyHomepageFilmId;
  contextMode: VoxyHomepageContextMode;
  exactHeadSha: string;
  speechDurationsMs: readonly number[];
}) {
  const definition = VOXY_HOMEPAGE_REFERENCE_FILMS[input.filmId];
  const segments = filmSegments(input.filmId, input.contextMode);
  if (segments.length !== input.speechDurationsMs.length) throw new Error("homepage_film_speech_duration_count_mismatch");
  let cursorMs = 600;
  const speakerTimeline: VoxyDualVoicePilotSpeakerEntry[] = segments.map((segment, index) => {
    const startMs = cursorMs;
    const endMs = startMs + input.speechDurationsMs[index]!;
    cursorMs = endMs + segment.pauseAfterMs;
    return { id: segment.id, start: seconds(startMs), end: seconds(endMs), speakerRole: "voxy", voiceId: VOXY_SIGNATURE.voiceId, text: segment.text };
  });
  const totalDurationMs = cursorMs + 800;
  const end = seconds(totalDurationMs);
  const boundary = (ratio: number) => Number((end * ratio).toFixed(3));
  const e1 = definition.evidence[0]!.id;
  const e2 = definition.evidence[1]!.id;
  const e3 = definition.evidence[2]!.id;
  const visualStateTimeline: VoxyDualVoicePilotVisualEntry[] = [
    { start: 0, end: boundary(.14), state: "HOST", activeEvidenceId: null, dockedEvidenceIds: [] },
    { start: boundary(.14), end: boundary(.24), state: "FOCUS", activeEvidenceId: e1, dockedEvidenceIds: [] },
    { start: boundary(.24), end: boundary(.34), state: "EXPLAIN", activeEvidenceId: e1, dockedEvidenceIds: [] },
    { start: boundary(.34), end: boundary(.4), state: "DOCK", activeEvidenceId: e1, dockedEvidenceIds: [e1] },
    { start: boundary(.4), end: boundary(.48), state: "HOST", activeEvidenceId: null, dockedEvidenceIds: [e1] },
    { start: boundary(.48), end: boundary(.59), state: "FOCUS", activeEvidenceId: e2, dockedEvidenceIds: [e1] },
    { start: boundary(.59), end: boundary(.7), state: "EXPLAIN", activeEvidenceId: e2, dockedEvidenceIds: [e1] },
    { start: boundary(.7), end: boundary(.76), state: "DOCK", activeEvidenceId: e2, dockedEvidenceIds: [e1, e2] },
    { start: boundary(.76), end: boundary(.89), state: "SYNTHESIS", activeEvidenceId: e3, dockedEvidenceIds: [e1, e2] },
    { start: boundary(.89), end, state: "HOST", activeEvidenceId: null, dockedEvidenceIds: [e1, e2, e3] },
  ];
  const evidenceTimeline = visualStateTimeline
    .filter((entry) => entry.activeEvidenceId)
    .map((entry) => ({
      evidenceId: entry.activeEvidenceId!, start: entry.start, end: entry.end,
      action: entry.state === "DOCK" ? "continuous_scale_translation_to_memory" : entry.state.toLowerCase(),
      visualIdentity: definition.evidence.find((evidence) => evidence.id === entry.activeEvidenceId)!.visualIdentity,
      ...(entry.state === "SYNTHESIS" ? { relatedEvidenceIds: [e1, e2] } : {}),
    }));
  const motionTimeline = [] as Array<{ id: string; at: number; state: string; activeEvidenceId: string | null; motion: string; semanticPurpose: string; decorativeOnly: false }>;
  for (let at = 0, index = 0; at < end; index += 1) {
    const state = visualStateTimeline.find((entry) => at >= entry.start && at < entry.end) ?? visualStateTimeline.at(-1)!;
    const motions = ["semantic_reveal", "source_highlight", "relationship_trace", "status_progression", "camera_emphasis", "memory_continuity"];
    motionTimeline.push({ id: `motion-${String(index + 1).padStart(2, "0")}`, at: Number(at.toFixed(3)), state: state.state, activeEvidenceId: state.activeEvidenceId, motion: motions[index % motions.length]!, semanticPurpose: state.activeEvidenceId ? `explain_${state.activeEvidenceId}` : `advance_${state.state.toLowerCase()}_narrative`, decorativeOnly: false });
    at += at < 12 ? 2 : 3;
  }
  const lowerThirdTimeline = [
    lowerThird({ id: "opening", kicker: definition.broadcastMeta.kicker, headline: definition.proposition, summary: definition.broadcastMeta.summary, validFrom: 0, validUntil: boundary(.24) }),
    lowerThird({ id: "first-evidence", kicker: definition.evidence[0]!.type, headline: definition.evidence[0]!.title, summary: definition.evidence[0]!.shortSummary, validFrom: boundary(.24), validUntil: boundary(.48) }),
    lowerThird({ id: "second-evidence", kicker: definition.evidence[1]!.type, headline: definition.evidence[1]!.title, summary: definition.evidence[1]!.shortSummary, validFrom: boundary(.48), validUntil: boundary(.76) }),
    lowerThird({ id: "synthesis", kicker: "ZUSAMMENFÜHRUNG", headline: definition.evidence[2]!.title, summary: definition.evidence[2]!.shortSummary, validFrom: boundary(.76), validUntil: boundary(.89) }),
    lowerThird({ id: "cta", kicker: "NÄCHSTER SCHRITT", headline: definition.cta, summary: definition.proposition, validFrom: boundary(.89), validUntil: end }),
  ];
  const sourceIds = new Set<string>(definition.sourceIds);
  const marketedOfferIds = new Set<string>(definition.marketedOfferIds);
  const sources = VOXY_HOMEPAGE_SOURCE_REGISTRY.filter((source) => sourceIds.has(source.id));
  const marketedOffers = VOXY_CURRENT_OFFER_INVENTORY.filter((offer) => marketedOfferIds.has(offer.id));
  return {
    schemaVersion: VOXY_HOMEPAGE_REFERENCE_FILMS_SCHEMA_VERSION,
    filmId: input.filmId,
    title: definition.title,
    proposition: definition.proposition,
    cta: definition.cta,
    contextMode: input.contextMode,
    exactHeadSha: input.exactHeadSha,
    visualMasterHeadSha: VOXY_FIRST_PARTY_VISUAL_BINDING.visualMasterHeadSha,
    output: { ...VOXY_HOMEPAGE_REFERENCE_FILMS_OUTPUT[input.filmId], width: 1920, height: 1080, fps: 24, durationMs: totalDurationMs, frameCount: Math.ceil(totalDurationMs * 24 / 1_000) },
    broadcastMeta: definition.broadcastMeta,
    speakerTimeline,
    visualStateTimeline,
    evidenceTimeline,
    motionTimeline,
    lowerThirdTimeline,
    evidence: definition.evidence,
    sources,
    currentOfferInventory: VOXY_CURRENT_OFFER_INVENTORY,
    marketedOffers,
    voiceBindings: { voxy: VOXY_DUAL_VOICE_PILOT_VOICE_BINDINGS.voxy },
    activeVoiceBindings: { voxy: VOXY_DUAL_VOICE_PILOT_VOICE_BINDINGS.voxy },
    canonicalNarrationArchitecture: "single_voice_default",
    canonicalVoxyVoice: "D1 Conversational Dynamic",
    canonicalEditorialVoice: "W1 Natural Editorial / parked optional layer",
    captions: { sidecarsOnly: true, burnedIn: false, languages: ["de"] },
    objectContinuity: { sameEvidenceId: true, sameVisualIdentity: true, scaleAndTranslation: true, hardSubstitution: false, crossfadeToDifferentObject: false },
    mouth: { profile: VOXY_FIRST_PARTY_VISUAL_BINDING.mouthProfile, shapesChanged: false, anchorChanged: false, pivotChanged: false, syncSpeakerRole: "voxy", activeForEverySpokenSegment: true, editorialMouth: "not_applicable_single_voice" },
    waveform: { count: 1, reactsToActiveVoice: true, secondWaveform: false },
    broadcastLayout: {
      stableGrid: true, hostZone: "center_left", topicDateZone: "top_right",
      jacketBranding: { lapelPin: "VOG", pocketMark: "eDebatte", pocketMarkCount: 1 },
      memoryAnchor: { top: true, right: true, bottom: false, safeMarginPx: 56 },
      focusDockDestination: "upper_right_memory_slot",
      lowerThird: { persistent: true, avoidsEvidenceColumn: true, semanticEditorialCondensation: true, captionMirror: false },
      dynamicEvidence: { dataDriven: true, maximumFullCards: 3, overflowBehavior: "compact_older_by_priority_and_recency", fixedEvidenceCount: false },
      textMotion: { blinking: false, flashing: false, typewriter: false, wordByWordReveal: false, transitionMs: 360 },
    },
    contextArchitecture: { supportedModes: ["evergreen", "election_window"], renderedMode: input.contextMode, modeSwitchRequiresResynthesis: true },
    motionPolicy: { adaptiveMotion: true, firstTwelveSecondsMaxGapSeconds: 2.5, laterMaxGapSeconds: 3.5, pilotEvidenceDwellTimesCanonical: false, slideshowMode: false, reducedMotionInformationEquivalent: true },
    privacy: { privateRawVoiceInRepository: false, privateReferencePathInManifest: false, publicArtifact: false, upload: false },
    homepageIntegrationIncluded: false,
    humanHomepageFilmAcceptance: "pending",
    humanNews5VisualAcceptance: "pending",
    productionEligible: false,
    autoPublish: false,
  } as const;
}

export type VoxyHomepageReferenceFilmPlan = ReturnType<typeof buildVoxyHomepageReferenceFilmPlan>;

export function validateVoxyHomepageReferenceFilmPlan(plan: VoxyHomepageReferenceFilmPlan): string[] {
  const errors: string[] = [];
  const expected = VOXY_HOMEPAGE_REFERENCE_FILMS[plan.filmId];
  const duration = plan.output.durationMs / 1_000;
  if (!/^[0-9a-f]{40}$/.test(plan.exactHeadSha)) errors.push("exact_head_invalid");
  if (plan.output.width !== 1920 || plan.output.height !== 1080 || plan.output.fps !== 24 || duration < plan.output.durationSeconds.min || duration > plan.output.durationSeconds.max) errors.push("media_contract_invalid");
  if (plan.speakerTimeline.some((entry) => entry.speakerRole !== "voxy" || entry.voiceId !== VOXY_SIGNATURE.voiceId) || Object.keys(plan.activeVoiceBindings).length !== 1) errors.push("d1_only_gate_invalid");
  if (plan.speakerTimeline.filter((entry) => entry.text.includes("Hallo Nachbar")).length !== 1) errors.push("greeting_count_invalid");
  if (plan.visualStateTimeline.map((entry) => entry.state).join(",") !== "HOST,FOCUS,EXPLAIN,DOCK,HOST,FOCUS,EXPLAIN,DOCK,SYNTHESIS,HOST") errors.push("news_5_sequence_invalid");
  if (plan.waveform.count !== 1 || plan.waveform.secondWaveform || !plan.waveform.reactsToActiveVoice) errors.push("waveform_contract_invalid");
  if (plan.broadcastLayout.jacketBranding.lapelPin !== "VOG" || plan.broadcastLayout.jacketBranding.pocketMark !== "eDebatte" || plan.broadcastLayout.jacketBranding.pocketMarkCount !== 1) errors.push("brand_mark_contract_invalid");
  if (!plan.broadcastLayout.memoryAnchor.top || !plan.broadcastLayout.memoryAnchor.right || plan.broadcastLayout.memoryAnchor.bottom) errors.push("memory_anchor_invalid");
  if (plan.evidenceTimeline.filter((entry) => entry.action === "continuous_scale_translation_to_memory").length !== 2 || !plan.objectContinuity.sameEvidenceId || !plan.objectContinuity.sameVisualIdentity || !plan.objectContinuity.scaleAndTranslation) errors.push("focus_dock_continuity_invalid");
  const firstMotionGaps = plan.motionTimeline.filter((entry) => entry.at <= 12).slice(1).map((entry, index) => entry.at - plan.motionTimeline[index]!.at);
  const later = plan.motionTimeline.filter((entry) => entry.at >= 12);
  const laterGaps = later.slice(1).map((entry, index) => entry.at - later[index]!.at);
  if (!plan.motionPolicy.adaptiveMotion || plan.motionPolicy.pilotEvidenceDwellTimesCanonical || plan.motionPolicy.slideshowMode || firstMotionGaps.some((gap) => gap > 2.5) || laterGaps.some((gap) => gap > 3.5) || plan.motionTimeline.some((entry) => entry.decorativeOnly)) errors.push("adaptive_motion_contract_invalid");
  if (!plan.captions.sidecarsOnly || plan.captions.burnedIn || plan.lowerThirdTimeline.some((entry) => entry.captionMirror || entry.blinking || entry.wordByWordAnimation)) errors.push("caption_or_lower_third_contract_invalid");
  if (!plan.contextArchitecture.supportedModes.includes("evergreen") || !plan.contextArchitecture.supportedModes.includes("election_window")) errors.push("context_mode_contract_invalid");
  if (plan.sources.some((source) => !source.url.startsWith("https://") || !source.publisher || !source.retrievedAt || !source.revision) || plan.sources.length !== expected.sourceIds.length) errors.push("source_integrity_invalid");
  if (plan.marketedOffers.some((offer) => offer.classification !== "current_capability" || !offer.marketable || Array.from(offer.sourceIds).length < 1)) errors.push("current_offer_fail_closed_invalid");
  if (plan.currentOfferInventory.some((offer) => offer.classification === "future_intent" && offer.marketable)) errors.push("future_intent_marketed_invalid");
  if (plan.contextMode === "election_window" && (!plan.sources.some((source) => source.id === "federal-election-calendar-2026") || !plan.sources.some((source) => source.id === "berlin-election-2026-faq"))) errors.push("official_election_source_missing");
  const electionWindowOnlySegmentIds = new Set(["edebatte-election-noise", "vog-election-calendar", "vog-berlin-sixteen"]);
  if (plan.contextMode === "evergreen" && plan.speakerTimeline.some((entry) => electionWindowOnlySegmentIds.has(entry.id))) errors.push("evergreen_contains_election_window_copy");
  if (plan.homepageIntegrationIncluded || plan.productionEligible || plan.autoPublish || plan.privacy.publicArtifact || plan.privacy.upload || plan.humanHomepageFilmAcceptance !== "pending") errors.push("release_gate_invalid");
  return [...new Set(errors)];
}

function captionTime(value: number, separator: "." | ","): string {
  const ms = Math.round(value * 1_000);
  return `${String(Math.floor(ms / 3_600_000)).padStart(2, "0")}:${String(Math.floor(ms % 3_600_000 / 60_000)).padStart(2, "0")}:${String(Math.floor(ms % 60_000 / 1_000)).padStart(2, "0")}${separator}${String(ms % 1_000).padStart(3, "0")}`;
}

export function buildVoxyHomepageFilmVtt(timeline: readonly VoxyDualVoicePilotSpeakerEntry[]): string {
  return `WEBVTT\n\n${timeline.map((entry) => `${captionTime(entry.start, ".")} --> ${captionTime(entry.end, ".")}\n<v Voxy>${entry.text}`).join("\n\n")}\n`;
}

export function buildVoxyHomepageFilmSrt(timeline: readonly VoxyDualVoicePilotSpeakerEntry[]): string {
  return `${timeline.map((entry, index) => `${index + 1}\n${captionTime(entry.start, ",")} --> ${captionTime(entry.end, ",")}\n[Voxy] ${entry.text}`).join("\n\n")}\n`;
}

export function homepageVisualStateAt(plan: VoxyHomepageReferenceFilmPlan, atSeconds: number) {
  return plan.visualStateTimeline.find((entry) => atSeconds >= entry.start && atSeconds < entry.end) ?? plan.visualStateTimeline.at(-1)!;
}

export function homepageLowerThirdAt(plan: VoxyHomepageReferenceFilmPlan, atSeconds: number) {
  return plan.lowerThirdTimeline.find((entry) => atSeconds >= entry.validFrom && atSeconds < entry.validUntil) ?? plan.lowerThirdTimeline.at(-1)!;
}
