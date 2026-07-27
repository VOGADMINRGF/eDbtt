export type RundenEntryCanonicalRecordKind =
  | "manual_round_draft"
  | "start_draft_context"
  | "create_handoff_review_item"
  | "anlassraum_runtime_record"
  | "dossier_runtime_record"
  | "participation_space_runtime_record"
  | "dossier_studio_workspace";

export type RundenEntryCanonicalPersistence =
  | "server_persistent"
  | "browser_context"
  | "review_runtime"
  | "derived_followup";

export type RundenEntryCanonicalAction = {
  id:
    | "without_ai_save"
    | "with_ai_continue"
    | "anlassraum_creation"
    | "dossier_creation"
    | "participation_space_creation";
  label: string;
  runtimeTruth: string;
  creates: {
    kind: RundenEntryCanonicalRecordKind;
    persistence: RundenEntryCanonicalPersistence;
    route: string;
  } | null;
  prepares: {
    kind: RundenEntryCanonicalRecordKind;
    persistence: RundenEntryCanonicalPersistence;
    route: string;
  } | null;
  noAiRun: boolean;
  noAiUsageEvent: boolean;
  noDeepSearch: boolean;
};

export type RundenEntryDownstreamCarrier = {
  capability:
    | "claims_and_open_questions"
    | "questions_polls_public_feedback"
    | "feed_enrichment"
    | "review_and_public_visibility"
    | "social_output_drafts"
    | "voxy_video_briefing";
  canonicalCarrier: RundenEntryCanonicalRecordKind | "missing_runtime_truth";
  runtimeTruth: string;
};

export type RundenEntryCanonReadModel = {
  surface: "/runden/new";
  canonicalPurpose: string;
  firstPersistentRecord: {
    kind: RundenEntryCanonicalRecordKind;
    persistence: RundenEntryCanonicalPersistence;
    route: string;
    source: "runden_manual_anlassraum";
    runtimeTruth: string;
  };
  localSupportRecords: Array<{
    kind: RundenEntryCanonicalRecordKind;
    persistence: RundenEntryCanonicalPersistence;
    route: string;
    runtimeTruth: string;
  }>;
  actions: RundenEntryCanonicalAction[];
  downstreamCarriers: RundenEntryDownstreamCarrier[];
  driftWarnings: string[];
  reusableSummary: {
    whatRundenNewIs: string;
    interplay: string;
    frontendAiTransparencyFollowup: string;
    aiActRelevantLater: string;
  };
};

const RUNDEN_ENTRY_CANON_READ_MODEL: RundenEntryCanonReadModel = {
  surface: "/runden/new",
  canonicalPurpose:
    "Manueller, review-first Einstieg in einen Anlassraum-Entwurf. Die Surface erzeugt zuerst nur einen wiederaufnehmbaren Entwurf und verschiebt KI-, Review- und Runtime-Erzeugung auf bestehende Folgeschritte.",
  firstPersistentRecord: {
    kind: "manual_round_draft",
    persistence: "server_persistent",
    route: "/api/drafts/save",
    source: "runden_manual_anlassraum",
    runtimeTruth:
      "\"Ohne KI speichern\", \"Intern starten\" und \"Öffentlich nach Review einreichen\" erzeugen heute zuerst denselben serverseitigen Draft-Record in der bestehenden drafts-Collection. Es entsteht dabei noch kein Anlassraum-, Dossier- oder Beteiligungsraum-Record.",
  },
  localSupportRecords: [
    {
      kind: "start_draft_context",
      persistence: "browser_context",
      route: "sessionStorage:start-draft-context.v1",
      runtimeTruth:
        "Der StartDraftContext bleibt ein browserseitiger Handoff- und Resume-Zustand fuer /create, /themen und /runden/new. Er ist UX-Stuetze, nicht die erste serverseitige Wahrheit.",
    },
    {
      kind: "manual_round_draft",
      persistence: "browser_context",
      route: "localStorage:manual-anlassraum-setup.v1",
      runtimeTruth:
        "Die lokale Entwurfssicherung haelt die Eingabefelder auf demselben Geraet stabil, ist aber keine kanonische Persistenz fuer spaetere Review- oder Runtime-Pfade.",
    },
  ],
  actions: [
    {
      id: "without_ai_save",
      label: "Ohne KI speichern",
      runtimeTruth:
        "Persistiert denselben manuellen Anlassraum-Entwurf serverseitig ueber /api/drafts/save und lokal ueber StartDraftContext plus Local Storage.",
      creates: {
        kind: "manual_round_draft",
        persistence: "server_persistent",
        route: "/api/drafts/save",
      },
      prepares: {
        kind: "start_draft_context",
        persistence: "browser_context",
        route: "sessionStorage:start-draft-context.v1",
      },
      noAiRun: true,
      noAiUsageEvent: true,
      noDeepSearch: true,
    },
    {
      id: "with_ai_continue",
      label: "Mit KI in /create weiter",
      runtimeTruth:
        "Bereitet nur einen bewussten Wechsel nach /create mit Prefill und bestehendem Draft-Kontext vor. Die eigentliche Analyse-, Planner- und Handoff-Logik entsteht erst auf den vorhandenen /create-Pfaden.",
      creates: null,
      prepares: {
        kind: "start_draft_context",
        persistence: "browser_context",
        route: "/create?mode=source&source=runden",
      },
      noAiRun: false,
      noAiUsageEvent: false,
      noDeepSearch: false,
    },
    {
      id: "anlassraum_creation",
      label: "Anlassraum-Erstellung",
      runtimeTruth:
        "Ein echter Anlassraum entsteht erst aus einem explizit bestaetigten review-first Handoff und der bestehenden Anlassraum-Runtime-Creation. /runden/new erzeugt diesen Record nicht direkt.",
      creates: {
        kind: "anlassraum_runtime_record",
        persistence: "review_runtime",
        route: "/api/admin/anlassraum-runtime/[sourceHandoffId]",
      },
      prepares: {
        kind: "create_handoff_review_item",
        persistence: "review_runtime",
        route: "/api/create/handoffs",
      },
      noAiRun: false,
      noAiUsageEvent: false,
      noDeepSearch: false,
    },
    {
      id: "dossier_creation",
      label: "Dossier-Erstellung",
      runtimeTruth:
        "Ein echtes Dossier entsteht heute ueber bestehende Create-Handoffs und die review-first Dossier-Runtime. /runden/new ist dafuer hoechstens ein vorgelagerter Draft-Einstieg.",
      creates: {
        kind: "dossier_runtime_record",
        persistence: "review_runtime",
        route: "/api/admin/dossier-runtime/[sourceHandoffId]",
      },
      prepares: {
        kind: "create_handoff_review_item",
        persistence: "review_runtime",
        route: "/api/create/handoffs",
      },
      noAiRun: false,
      noAiUsageEvent: false,
      noDeepSearch: false,
    },
    {
      id: "participation_space_creation",
      label: "Beteiligungsraum-Erstellung",
      runtimeTruth:
        "Ein Participation Space entsteht erst spaeter aus einem expliziten review-first Handoff und der vorhandenen Participation-Space-Runtime. /runden/new erzeugt keinen direkten Beteiligungsraum-Record.",
      creates: {
        kind: "participation_space_runtime_record",
        persistence: "review_runtime",
        route: "/api/admin/participation-space-runtime/[sourceHandoffId]",
      },
      prepares: {
        kind: "create_handoff_review_item",
        persistence: "review_runtime",
        route: "/api/create/handoffs",
      },
      noAiRun: false,
      noAiUsageEvent: false,
      noDeepSearch: false,
    },
  ],
  downstreamCarriers: [
    {
      capability: "claims_and_open_questions",
      canonicalCarrier: "dossier_runtime_record",
      runtimeTruth:
        "Persistente Claim-, Quellen-, Findings- und Open-Question-Pfade haengen heute an Dossier-Routen wie /api/dossiers/[dossierId]/claims/upsert und /open-questions/upsert, nicht direkt an /runden/new.",
    },
    {
      capability: "questions_polls_public_feedback",
      canonicalCarrier: "participation_space_runtime_record",
      runtimeTruth:
        "Oeffentliche Fragen, Intake und Ergebnis-Rueckmeldung haengen am Participation-Space-Container; der Anlassraum-Entwurf ist dafuer nur vorgelagerter Kontext.",
    },
    {
      capability: "feed_enrichment",
      canonicalCarrier: "anlassraum_runtime_record",
      runtimeTruth:
        "Feed-Radar-, Cluster- und Output-Prep-Pfade referenzieren bestehende Anlassraum-Records und spaetere Dossier-Vorschlaege. Der manuelle Runden-Draft ist dafuer noch kein direkter Feed-Record.",
    },
    {
      capability: "review_and_public_visibility",
      canonicalCarrier: "anlassraum_runtime_record",
      runtimeTruth:
        "Sichtbarkeit, Aktivierung, QR/Share und spaetere public review haengen am review-first Anlassraum-Lifecycle und nicht am initialen /runden/new-Draft.",
    },
    {
      capability: "social_output_drafts",
      canonicalCarrier: "dossier_studio_workspace",
      runtimeTruth:
        "Die heute belastbare Output-Draft-Familie haengt am Dossier-Studio-Workspace und den bestehenden Social-/Queue-Pfaden, nicht an /runden/new selbst.",
    },
    {
      capability: "voxy_video_briefing",
      canonicalCarrier: "missing_runtime_truth",
      runtimeTruth:
        "Ein eigener persistenter Voxy-Video-Briefing-Traeger ist im Repo noch nicht als kanonische Runtime-Wahrheit geschlossen. Naechster belastbarer Traeger waere derzeit hoechstens der bestehende Dossier-Studio-/Output-Draft-Kontext.",
    },
  ],
  driftWarnings: [
    "/runden/new spricht fachlich ueber Anlassraum, erzeugt heute aber zuerst nur einen Draft-Record.",
    "/create und /runden/new nutzen unterschiedliche API-Einstiege, schreiben aber in dieselbe kanonische serverseitige Draft-Wahrheit.",
    "Anlassraum-, Dossier- und Participation-Space-Runtimes sind review-first Folgesysteme und keine stillen Seiteneffekte des manuellen Runden-Einstiegs.",
    "Legacy-Drafts mit alten String-IDs bleiben ausschließlich als Read-only-Resume-Fallback erhalten; aktive Writes nutzen die kanonische user-scoped ObjectId-/Schema-Wahrheit.",
  ],
  reusableSummary: {
    whatRundenNewIs:
      "/runden/new ist heute fachlich ein manueller, review-first Anlassraum-Entwurfsraum. Der Einstieg erzeugt zuerst einen wiederaufnehmbaren Draft und erst spaetere Handoffs koennen daraus belastbare Runtime-Objekte machen.",
    interplay:
      "Draft ist der erste persistente Pre-Record. Anlassraum entsteht spaeter aus review-approved Anlassraum-Runtime-Creation, Dossier aus review-approved Dossier-Runtime, und Beteiligungsraum aus review-approved Beteiligungsraum-Runtime. Claims, offene Fragen und Social-Output-Drafts haengen heute vor allem am Dossier- und Studio-Kontext.",
    frontendAiTransparencyFollowup:
      "Frontend-KI-Orchestrierungs-Transparenz kommt bewusst als eigener Slice danach, weil der Einstieg jetzt erst den fachlichen Kanon klaert. Erst auf dieser Grundlage lohnt es sich, Analyze-, Planner-, Handoff- und Provider-Sichtbarkeit entlang echter User-Wege fein aufzuschluesseln.",
    aiActRelevantLater:
      "Spaetere Transparenzslices muessen fuer KI-unterstuetzte Folgepfade mindestens Startsignal, Nutzerentscheidung, Provider-/Planner-Rolle, Reviewpflicht, Nicht-Autonomie, Nicht-Amtlichkeit und erklaerbare Hand-off-Grenzen sichtbar machen.",
  },
};

export function readRundenEntryCanonReadModel(): RundenEntryCanonReadModel {
  return RUNDEN_ENTRY_CANON_READ_MODEL;
}
