import type { SupportedLocale } from "@/config/locales";

export type OperatorLocale = "de" | "en" | "es" | "fr" | "zh";

export function resolveOperatorLocale(locale: SupportedLocale | string | null | undefined): OperatorLocale {
  if (locale === "en") return "en";
  if (locale === "es") return "es";
  if (locale === "fr") return "fr";
  if (locale === "zh") return "zh";
  return "de";
}

export function humanizeOperatorToken(token: string): string {
  return token
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export type OperatorTexts = {
  create: {
    loadingAccess: string;
    loginRequired: string;
    submissionBlocked: string;
    freeStartKicker: string;
    freeStartHeadline: string;
    freeStartLead: string;
    chipFreeStart: string;
    chipIntake: string;
    chipQuality: string;
    chipGraphMatching: string;
    chipCtaRouting: string;
    chipNoAutoPublish: string;
    chipNoSilentMerge: string;
    legacyModePrefix: string;
    legacyModeSuffix: string;
    intakeContextTitle: string;
    intakeContextLead: string;
    openPrimarySource: string;
    regionLabel: string;
    scopeLabel: string;
    signalTrailLabel: string;
    signalLabel: string;
    clusterLabel: string;
    reviewLabel: string;
    handoffLabel: string;
    candidateIdLabel: string;
    draftIdLabel: string;
    contextPickerTitle: string;
    contextPickerLead: string;
    loadingContextList: string;
    contextUnavailable: string;
    reload: string;
    contextEmpty: string;
    topicLabel: string;
    statusLabel: string;
    statusOpen: string;
    selectedLabel: string;
    anlassraumIdLabel: string;
    clearSelection: string;
    quotasTitle: string;
    tierLabel: string;
    creditsLabel: string;
    monthlyLimitLabel: string;
    monthlyLimitUnlimited: string;
    maxClaimsLabel: string;
    goToRounds: string;
    srOnlyCreate: string;
    workGoalTitle: string;
    workGoalLineReview: string;
    workGoalLineAttach: string;
    workGoalLineContinue: string;
    accessNoteDefault: string;
    accessNoteStaff: string;
    accessNoteMedia: string;
    accessNoteAgenda: string;
    accessNoteCivic: string;
    lockLabelCivic: string;
    lockLabelJournalism: string;
    lockLabelAgenda: string;
    upgradeLabel: string;
    selectionInfoInvalidContext: string;
    selectionInfoUnavailableContext: string;
  };
  feeds: {
    headerKicker: string;
    headerTitle: string;
    headerLead: string;
    linkToDrafts: string;
    linkToAnlassraeume: string;
    linkToAcquisition: string;
    sourceConfigTitle: string;
    dedupFeedsSuffix: string;
    loadingConfig: string;
    sourceMissing: string;
    invalidUrlsIgnoredSuffix: string;
    feedRowsLabel: string;
    globalLabel: string;
    colRegion: string;
    colTopic: string;
    colSignalSource: string;
    pullAnalyzeTitle: string;
    pullAnalyzeLead: string;
    scopeLabel: string;
    regionCodeOptional: string;
    regionCodeExamplePlaceholder: string;
    maxFeeds: string;
    maxItemsPerFeed: string;
    dryRunLabel: string;
    fetchSignalSources: string;
    pullRunning: string;
    pullErrorPrefix: string;
    analyzeLimit: string;
    startAnalyze: string;
    analyzeRunning: string;
    analyzeErrorPrefix: string;
    batchTitle: string;
    batchLead: string;
    startImport: string;
    importRunning: string;
  };
  feedDrafts: {
    headerKicker: string;
    headerTitle: string;
    headerLead: string;
    linkToFeedControl: string;
    linkToAnlassraumList: string;
    linkToAnlassraumOps: string;
    linkToCreateFastPath: string;
    decisioningLeadPrefix: string;
    decisioningLeadSuffix: string;
    candidateFilters: string;
    regionAll: string;
    regionGlobal: string;
    regionEu: string;
    regionGermany: string;
    regionAustria: string;
    regionSwitzerland: string;
    searchPlaceholder: string;
    anlassraumFilterPlaceholder: string;
    anlassraumFilterActive: string;
    candidatesTitle: string;
    candidatesLead: string;
    summaryHits: string;
    summaryUnlinked: string;
    summaryWeak: string;
    summaryHighPriority: string;
    tableCandidate: string;
    tableQueueContext: string;
    tableAnlassraumHints: string;
    tableNextStep: string;
    tablePrimarySource: string;
    selectAllAriaLabel: string;
    selectDraftAriaPrefix: string;
    loadingDrafts: string;
    emptyDraftsPrefix: string;
    emptyDraftsMiddle: string;
    emptyDraftsSuffix: string;
    pendingLabel: string;
    weakLabel: string;
    reasonsLabel: string;
    lastActionLabel: string;
    linkedLabel: string;
    unlinkedLabel: string;
    openAnlassraum: string;
    checkAnlassraumContext: string;
    weakSignalLabel: string;
    noteLabel: string;
    draftDetailLink: string;
    manualCreateLink: string;
    primarySourceLabel: string;
    signalTrailLabel: string;
    signalTrailCandidate: string;
    analysisLabel: string;
    pipelineLabel: string;
    sourceOpenLabel: string;
    bulkSummaryPrefix: string;
    selectedSuffix: string;
    bulkLead: string;
    bulkAnlassraumPlaceholder: string;
    bulkWeakReasonPlaceholder: string;
    bulkReviewNotePlaceholder: string;
    applyBulk: string;
    applying: string;
    legacySummary: string;
    legacyLead: string;
    legacyColDraft: string;
    legacyColQueue: string;
    legacyColAudit: string;
    legacyColRemediation: string;
    loadingLegacy: string;
    emptyLegacy: string;
    missingAnlassraumId: string;
    queueLabel: string;
    priorityLabel: string;
    openSinceLabel: string;
    hintsLabel: string;
    weakSignalLongLabel: string;
    noFlagLabel: string;
    executedByLabel: string;
    timestampLabel: string;
    remediationLabel: string;
    remediationAnlassraumPlaceholder: string;
    remediationNotePlaceholder: string;
    remediationAttach: string;
    remediationCreateCandidate: string;
    noValue: string;
    idLabel: string;
    regionLabel: string;
    nextStepWeakTitle: string;
    nextStepWeakDetail: string;
    nextStepAttachTitle: string;
    nextStepAttachDetail: string;
    nextStepCandidateTitle: string;
    nextStepCandidateDetail: string;
    nextStepReviewTitle: string;
    nextStepReviewDetail: string;
    nextStepVerifyTitle: string;
    nextStepVerifyDetail: string;
    selectAtLeastOne: string;
    attachNeedsAnlassraumId: string;
    bulkDonePrefix: string;
    bulkDoneMiddle: string;
    bulkDoneSuffix: string;
    bulkFailedFallback: string;
    legacyAttachNeedsAnlassraumId: string;
    legacyBackfillFailed: string;
    unknownLoadError: string;
    unknownActionFallback: string;
  };
  anlassraumList: {
    headerKicker: string;
    headerTitle: string;
    headerLead: string;
    linkToFeedControl: string;
    linkToAnlassraumOps: string;
    statusFilterPrefix: string;
    sourceModeFilterPrefix: string;
    colAnlassraum: string;
    colStatus: string;
    colRegionTopic: string;
    colOutputs: string;
    colRisk: string;
    loading: string;
    empty: string;
    originLabel: string;
    ownerLabel: string;
    scoreLabel: string;
    globalOpen: string;
    dossierConsolidationLabel: string;
    optionalNotStarted: string;
    sourcesLabel: string;
    riskOk: string;
    statusOpen: string;
  };
  anlassraumDetail: {
    loading: string;
    notFound: string;
    headerKicker: string;
    scoreLabel: string;
    relevanceLabel: string;
    originLabel: string;
    ownerLabel: string;
    publishGateLabel: string;
    publishGateReleased: string;
    publishGateBlocked: string;
    sourcesLabel: string;
    requiredLabel: string;
    hintLabel: string;
    linkToCreate: string;
    linkToDraftQueue: string;
    linkToOverview: string;
    linkToDossier: string;
    optionalDossierLead: string;
    workspaceContext: string;
    topicLabel: string;
    clusterLabel: string;
    sourceSituationLabel: string;
    referencedSourceSuffix: string;
    outputTransitions: string;
    colOutputType: string;
    colStatus: string;
    colReviewState: string;
    colPublishTarget: string;
    colLastAction: string;
    colNextAction: string;
    loadingOutputSeeds: string;
    emptyOutputSeeds: string;
    publishTargetPlaceholder: string;
    reviewNotePlaceholder: string;
    apply: string;
    diagnosticsTitle: string;
    diagnosticsLead: string;
    metaJsonTitle: string;
    sourcesJsonTitle: string;
    structureJsonTitle: string;
    publishGateEvidenceTitle: string;
    sourcePrefix: string;
    sourceNoMetaSuffix: string;
    sourceNoTitleOrUrlSuffix: string;
    actionCurate: string;
    actionReview: string;
    actionApprove: string;
    actionActivate: string;
    actionArchive: string;
    operatorFocusNeedsSourcesTitle: string;
    operatorFocusNeedsSourcesPrefix: string;
    operatorFocusNeedsSourcesMiddle: string;
    operatorFocusNeedsSourcesSuffix: string;
    operatorFocusHasDossierTitle: string;
    operatorFocusHasDossierDetail: string;
    operatorFocusContinueTitle: string;
    operatorFocusContinueDetail: string;
    transitionFailed: string;
    outputTransitionFailed: string;
  };
};

// Terminology policy:
// - Domain terms remain explicit across locales: Anlassraum, Dossier, Feed, Signal.
// - Generic operator UI terms are localized per locale (e.g. queue/review/status/action labels).
const DE: OperatorTexts = {
  create: {
    loadingAccess: "Lade deinen Zugang ...",
    loginRequired: "Bitte melde dich an, um eine Analyse zu starten.",
    submissionBlocked: "Dein aktuelles Paket erlaubt keine Einreichung.",
    freeStartKicker: "Mitwirken",
    freeStartHeadline: "Anlass eröffnen und Beitrag einreichen",
    freeStartLead:
      "Ein gemeinsamer Einstieg: Text, Zitat, Quelle/URL oder Material. Die Plattform führt danach immer durch Intake, Prüf-/Qualität, Graph-Matching und CTA-Routing.",
    chipFreeStart: "Freistart",
    chipIntake: "Intake",
    chipQuality: "Prüf/Qualität",
    chipGraphMatching: "Graph-Matching",
    chipCtaRouting: "CTA/Routing",
    chipNoAutoPublish: "kein Auto-Publish",
    chipNoSilentMerge: "kein Silent-Merge",
    legacyModePrefix: "Legacy-Mode-Parameter erkannt",
    legacyModeSuffix:
      "und aus Kompatibilitätsgründen gelesen. Der kanonische Einstieg bleibt Freistart; ein sichtbarer Primärsplit ist nicht mehr Ziel-UX.",
    intakeContextTitle: "Intake-Kontext",
    intakeContextLead:
      "Kontext wurde aus dem vorgelagerten Signal-/Review-Flow weitergereicht und dient als manueller Startpunkt: zuerst Primärquelle, dann Relevanzraum, dann Signalspur. Primärquellen bitte prüfen; kein Auto-Publish.",
    openPrimarySource: "Primärquelle öffnen",
    regionLabel: "Region",
    scopeLabel: "Relevanzraum",
    signalTrailLabel: "Signalspur",
    signalLabel: "Signal",
    clusterLabel: "Cluster",
    reviewLabel: "Prüfung",
    handoffLabel: "Übergabe",
    candidateIdLabel: "Kandidaten-ID (tech)",
    draftIdLabel: "Entwurfs-ID (tech)",
    contextPickerTitle: "Optional: einem bestehenden Anlassraum zuordnen",
    contextPickerLead:
      "Du kannst deinen Arbeitsstand einem bestehenden Anlassraum zuordnen. Ohne Auswahl startet eDebatte einen neuen Arbeitsstand.",
    loadingContextList: "Lade produktive Kontextliste ...",
    contextUnavailable: "Kontextquelle derzeit nicht verfügbar",
    reload: "Erneut laden",
    contextEmpty: "Derzeit ist kein passender Anlassraum vorausgewählt.",
    topicLabel: "Thema",
    statusLabel: "Status",
    statusOpen: "offen",
    selectedLabel: "Ausgewählt",
    anlassraumIdLabel: "anlassraumId",
    clearSelection: "Auswahl entfernen",
    quotasTitle: "Kontingente und Zugriff",
    tierLabel: "Tier",
    creditsLabel: "Credits",
    monthlyLimitLabel: "Monatslimit",
    monthlyLimitUnlimited: "unbegrenzt",
    maxClaimsLabel: "Max. Claims",
    goToRounds: "Anlässe öffnen",
    srOnlyCreate: "Erstellen",
    workGoalTitle: "Arbeitsziel:",
    workGoalLineReview: "- Signal strukturiert prüfen",
    workGoalLineAttach: "- Anlassraum zuordnen oder Kandidat sauber neu anlegen",
    workGoalLineContinue: "- Dossier erst nachgelagert weiterführen",
    accessNoteDefault: "Dein Bereich ist festgelegt. Für andere Use Cases brauchst du das passende Paket.",
    accessNoteStaff: "Staff-Zugang: alle Use Cases sind freigeschaltet.",
    accessNoteMedia: "Journalismus/Medien: Zugriff nur für journalistische Formate.",
    accessNoteAgenda: "Verwaltung/Organisation: Zugriff nur für Agenda- und Verwaltungsformate.",
    accessNoteCivic: "Bürgerbereich: Zugriff für Beiträge und Projekte.",
    lockLabelCivic: "Bürger-Bereich",
    lockLabelJournalism: "Nur Journalismus/Medien",
    lockLabelAgenda: "Nur Verwaltung/Organisationen",
    upgradeLabel: "Upgrade",
    selectionInfoInvalidContext: "Der gewählte Anlassraum konnte nicht übernommen werden.",
    selectionInfoUnavailableContext: "Der gewählte Anlassraum ist derzeit nicht verfügbar.",
  },
  feeds: {
    headerKicker: "Admin · Feeds",
    headerTitle: "Feed-Leitstand",
    headerLead:
      "Signale aus Feeds, öffentlichen Quellen und Hinweis-Eingängen in Anlassräume überführen; Dossier-Verdichtung bleibt ein bewusster Folgeschritt. Primärquellen werden separat geprüft; es gibt kein automatisches Publishing aus Feed-Signalen.",
    linkToDrafts: "Zu Feed-Drafts",
    linkToAnlassraeume: "Zu Anlassräumen",
    linkToAcquisition: "Zum Akquise-Dashboard",
    sourceConfigTitle: "Signalquellen-Konfiguration (Feed-Referenzen)",
    dedupFeedsSuffix: "deduplizierte Feeds",
    loadingConfig: "Lade Konfiguration ...",
    sourceMissing: "keine Signalquelle gefunden",
    invalidUrlsIgnoredSuffix: "ungültige Feed-URLs wurden ignoriert.",
    feedRowsLabel: "Feeds",
    globalLabel: "GLOBAL",
    colRegion: "Region",
    colTopic: "Thema",
    colSignalSource: "Signalquelle (Feed-URL)",
    pullAnalyzeTitle: "Abruf + Analyse",
    pullAnalyzeLead:
      "Abruf lädt Signale in `statement_candidates`; Analyse erzeugt daraus prüfbare `vote_drafts`. Kein direkter Publish-Pfad.",
    scopeLabel: "Relevanzraum",
    regionCodeOptional: "Regionscode (optional)",
    regionCodeExamplePlaceholder: "z.B. DE:BE",
    maxFeeds: "Max. Feeds",
    maxItemsPerFeed: "Max. Einträge pro Feed",
    dryRunLabel: "Dry-Run (nur zählen, nicht schreiben)",
    fetchSignalSources: "Signalquellen abrufen",
    pullRunning: "Pull läuft ...",
    pullErrorPrefix: "Pull",
    analyzeLimit: "Analyse-Limit",
    startAnalyze: "Analyse starten",
    analyzeRunning: "Analyse läuft ...",
    analyzeErrorPrefix: "Analyse",
    batchTitle: "Batch-Signalimport (Wartung)",
    batchLead:
      "JSON im Format {\"items\":[...]} oder direkt [...] einfügen und an /api/feeds/batch senden. Batch erzeugt Signalkandidaten, keine direkte Inhaltsübernahme und keine Veröffentlichung.",
    startImport: "Import starten",
    importRunning: "Import läuft ...",
  },
  feedDrafts: {
    headerKicker: "Admin · Feed-Pipeline",
    headerTitle: "Signal-Entwürfe: Anlassraum-first Warteschlange",
    headerLead:
      "Operativer Kernpfad: Signal -> Anlassraum -> Dossier -> Output. Feeds liefern Hinweise, keine direkte Publikationslogik. Primärquellen bleiben die fachliche Basis.",
    linkToFeedControl: "Zum Feed-Leitstand",
    linkToAnlassraumList: "Zu Anlassräumen",
    linkToAnlassraumOps: "Zu Anlassraum-Operationen",
    linkToCreateFastPath: "4) Manuell via /create fortsetzen",
    decisioningLeadPrefix: "Operator-Entscheidungspfade",
    decisioningLeadSuffix: "Kein Auto-Publish, keine automatische Feed-Übernahme.",
    candidateFilters: "Kandidatenfilter",
    regionAll: "Alle Regionen",
    regionGlobal: "Global / offen",
    regionEu: "EU / Europa",
    regionGermany: "Deutschland",
    regionAustria: "Österreich",
    regionSwitzerland: "Schweiz",
    searchPlaceholder: "Suche in Titel, Summary, Primärquelle",
    anlassraumFilterPlaceholder: "Anlassraum-ID (optional)",
    anlassraumFilterActive: "Anlassraum-Filter aktiv",
    candidatesTitle: "Kandidatenliste",
    candidatesLead:
      "Fokus auf die nächste sichere Aktion pro Entwurf: Kontext prüfen, Anlassraum zuordnen oder Prüfung sauber abschließen.",
    summaryHits: "Aktuelle Treffer",
    summaryUnlinked: "Ohne Anlassraum",
    summaryWeak: "Schwaches Signal",
    summaryHighPriority: "Hohe Priorität",
    tableCandidate: "Kandidat",
    tableQueueContext: "Warteschlangen-Kontext",
    tableAnlassraumHints: "Anlassraum & Hinweise",
    tableNextStep: "Nächster Schritt",
    tablePrimarySource: "Primärquelle / Signalspur",
    selectAllAriaLabel: "Alle auswählen",
    selectDraftAriaPrefix: "Entwurf",
    loadingDrafts: "Lade Entwürfe ...",
    emptyDraftsPrefix: "Keine Entwürfe für die aktuellen Filter. Prüfe, ob Filter zu eng sind, oder öffne den",
    emptyDraftsMiddle: "Feed-Leitstand",
    emptyDraftsSuffix: "bzw. starte einen manuellen Anlassraum-Einstieg via",
    pendingLabel: "offen",
    weakLabel: "schwach",
    reasonsLabel: "Gründe",
    lastActionLabel: "letzte Aktion",
    linkedLabel: "verknüpft",
    unlinkedLabel: "nicht verknüpft",
    openAnlassraum: "Anlassraum öffnen",
    checkAnlassraumContext: "Anlassraum-Kontext prüfen",
    weakSignalLabel: "Schwaches Signal",
    noteLabel: "Notiz",
    draftDetailLink: "Entwurf im Detail prüfen",
    manualCreateLink: "Manuell via /create fortsetzen",
    primarySourceLabel: "Primärquelle",
    signalTrailLabel: "Signalspur",
    signalTrailCandidate: "Feed-Kandidat",
    analysisLabel: "Analyse",
    pipelineLabel: "Pipeline",
    sourceOpenLabel: "offen",
    bulkSummaryPrefix: "Sammelprüfung (sekundär)",
    selectedSuffix: "ausgewählt",
    bulkLead: "Sammelaktion für mehrere Signale. Kein Auto-Publish und keine automatische Freigabe.",
    bulkAnlassraumPlaceholder: "Anlassraum-ID (nur für Attach)",
    bulkWeakReasonPlaceholder: "Grund für schwaches Signal (optional)",
    bulkReviewNotePlaceholder: "Prüfnotiz (optional)",
    applyBulk: "Sammelaktion anwenden",
    applying: "läuft...",
    legacySummary: "Legacy-Backfill (nachgeordnete Wartungsausnahme)",
    legacyLead:
      "Explizite Einzelkorrektur für Entwürfe ohne `anlassraumId` (kein Auto-Backfill, keine stille Migration).",
    legacyColDraft: "Entwurf",
    legacyColQueue: "Warteschlange/Triage",
    legacyColAudit: "Audit",
    legacyColRemediation: "Korrektur",
    loadingLegacy: "Lade Legacy-Entwürfe ...",
    emptyLegacy: "Keine nicht verknüpften Legacy-Entwürfe im aktuellen Filter.",
    missingAnlassraumId: "anlassraumId fehlt",
    queueLabel: "Warteschlange",
    priorityLabel: "Priorität",
    openSinceLabel: "Offen seit",
    hintsLabel: "Hinweise",
    weakSignalLongLabel: "Schwaches Signal",
    noFlagLabel: "kein Flag",
    executedByLabel: "Durchgeführt von",
    timestampLabel: "Zeitpunkt",
    remediationLabel: "Korrektur",
    remediationAnlassraumPlaceholder: "Anlassraum-ID für Attach",
    remediationNotePlaceholder: "Korrektur-Notiz (optional)",
    remediationAttach: "Mit Anlassraum verknüpfen",
    remediationCreateCandidate: "Anlassraum-Kandidat anlegen",
    noValue: "—",
    idLabel: "ID",
    regionLabel: "Region",
    nextStepWeakTitle: "Weak Signal validieren",
    nextStepWeakDetail: "Unsicheren Kontext manuell über /create prüfen und begründen.",
    nextStepAttachTitle: "An bestehenden Anlassraum anhängen",
    nextStepAttachDetail: "Zuordnung steht im Vordergrund, neue Kandidatenanlage vermeiden.",
    nextStepCandidateTitle: "Anlassraum-Kandidat anlegen",
    nextStepCandidateDetail: "Signal ist unlinked und braucht einen neuen Anlassraum-Kandidaten als Basis.",
    nextStepReviewTitle: "Prüfung abschließen",
    nextStepReviewDetail: "Entscheidung prüfen und Status konsistent fortführen.",
    nextStepVerifyTitle: "Kandidat verifizieren",
    nextStepVerifyDetail: "Kontext, Analyse und Verlauf im Detailscreen prüfen.",
    selectAtLeastOne: "Bitte mindestens einen Draft auswählen.",
    attachNeedsAnlassraumId: "Für das Verknüpfen ist eine Anlassraum-ID erforderlich.",
    bulkDonePrefix: "Bulk abgeschlossen:",
    bulkDoneMiddle: "erfolgreich,",
    bulkDoneSuffix: "fehlgeschlagen.",
    bulkFailedFallback: "Sammelprüfung fehlgeschlagen.",
    legacyAttachNeedsAnlassraumId: "Für das Verknüpfen ist eine Anlassraum-ID erforderlich.",
    legacyBackfillFailed: "legacy_backfill_failed",
    unknownLoadError: "Unbekannter Fehler beim Laden der Entwürfe",
    unknownActionFallback: "Aktion",
  },
  anlassraumList: {
    headerKicker: "Admin · Signal-Pipeline",
    headerTitle: "Anlassräume",
    headerLead:
      "Anlassräume strukturieren Signale zuerst. Relevanz kann lokal, regional, bundesweit oder institutionell sein; Dossier-Verdichtung folgt optional als bewusster nächster Schritt.",
    linkToFeedControl: "Zum Feed-Leitstand",
    linkToAnlassraumOps: "Zu Anlassraum-Operationen",
    statusFilterPrefix: "Status",
    sourceModeFilterPrefix: "Quellmodus",
    colAnlassraum: "Anlassraum",
    colStatus: "Status",
    colRegionTopic: "Region/Thema",
    colOutputs: "Ausgaben",
    colRisk: "Risiko",
    loading: "Lädt Anlassräume ...",
    empty: "Keine Anlassräume gefunden.",
    originLabel: "Herkunft",
    ownerLabel: "Trägerschaft",
    scoreLabel: "Score",
    globalOpen: "Global / offen",
    dossierConsolidationLabel: "Dossier-Verdichtung",
    optionalNotStarted: "optional / nicht gestartet",
    sourcesLabel: "Quellen",
    riskOk: "ok",
    statusOpen: "offen",
  },
  anlassraumDetail: {
    loading: "Lade Anlassraum ...",
    notFound: "Nicht gefunden",
    headerKicker: "Admin · Anlassraum",
    scoreLabel: "score",
    relevanceLabel: "Relevanzraum",
    originLabel: "Herkunft",
    ownerLabel: "Trägerschaft",
    publishGateLabel: "Publish-Gate",
    publishGateReleased: "freigegeben",
    publishGateBlocked: "blockiert",
    sourcesLabel: "Quellen",
    requiredLabel: "benötigt",
    hintLabel: "Hinweis",
    linkToCreate: "Manuell via /create weiterführen",
    linkToDraftQueue: "Zu Feed-Entwürfen",
    linkToOverview: "Zur Übersicht",
    linkToDossier: "Dossier-Verdichtung öffnen",
    optionalDossierLead:
      "Anlassraum bleibt eigenständiger Arbeitsraum. Dossier-Verdichtung ist ein bewusster, optionaler Folgeschritt.",
    workspaceContext: "Arbeitskontext",
    topicLabel: "Thema",
    clusterLabel: "Cluster",
    sourceSituationLabel: "Quellenlage",
    referencedSourceSuffix: "referenzierte Quelle",
    outputTransitions: "Output-Übergänge",
    colOutputType: "Output-Typ",
    colStatus: "Status",
    colReviewState: "Prüfstatus",
    colPublishTarget: "Veröffentlichungsziel",
    colLastAction: "Letzte Aktion",
    colNextAction: "Nächste Aktion",
    loadingOutputSeeds: "Lade Output-Seeds ...",
    emptyOutputSeeds: "Keine Output-Seeds vorhanden.",
    publishTargetPlaceholder: "Publish-Ziel (nur bei manueller Publikation)",
    reviewNotePlaceholder: "Prüfnotiz (optional)",
    apply: "Übernehmen",
    diagnosticsTitle: "Diagnose & JSON (nachgeordnet)",
    diagnosticsLead: "Audit-Readout für Deep-Dive und Fehlersuche. Der operative Arbeitsfluss bleibt oben.",
    metaJsonTitle: "Meta",
    sourcesJsonTitle: "Quellen-JSON",
    structureJsonTitle: "Struktur-JSON",
    publishGateEvidenceTitle: "Publish-Gate-Evidenz",
    sourcePrefix: "Quelle",
    sourceNoMetaSuffix: "ohne lesbare Metadaten",
    sourceNoTitleOrUrlSuffix: "ohne Titel/URL",
    actionCurate: "Kurationsstart",
    actionReview: "In Prüfung führen",
    actionApprove: "Freigeben",
    actionActivate: "Aktivieren",
    actionArchive: "Archivieren",
    operatorFocusNeedsSourcesTitle: "Quellenlage zuerst absichern",
    operatorFocusNeedsSourcesPrefix: "Publikation bleibt blockiert",
    operatorFocusNeedsSourcesMiddle: "Quelle",
    operatorFocusNeedsSourcesSuffix:
      "Anlassraum strukturieren und Primärquellen prüfen, bevor Verdichtung/Publish weitergeführt wird.",
    operatorFocusHasDossierTitle: "Anlassraum stabil halten, Verdichtung gezielt fortführen",
    operatorFocusHasDossierDetail:
      "Dossier ist bereits verbunden. Anlassraum-Kontext weiter pflegen und Verdichtung bewusst steuern.",
    operatorFocusContinueTitle: "Anlassraum weiter strukturieren",
    operatorFocusContinueDetail:
      "Signal- und Quellenkontext im Anlassraum ausarbeiten; Dossier-Verdichtung bleibt optional als bewusster nächster Schritt.",
    transitionFailed: "transition_failed",
    outputTransitionFailed: "output_seed_transition_failed",
  },
};

const EN: OperatorTexts = {
  create: {
    loadingAccess: "Loading your access ...",
    loginRequired: "Please sign in to start an analysis.",
    submissionBlocked: "Your current plan does not allow submissions.",
    freeStartKicker: "Create Free Start",
    freeStartHeadline: "Free start for Anlassraum and dossier flows",
    freeStartLead:
      "A shared entry point: text, quote, source URL, or material. The platform then guides through intake, quality checks, graph matching, and CTA routing.",
    chipFreeStart: "Free start",
    chipIntake: "Intake",
    chipQuality: "Quality checks",
    chipGraphMatching: "Graph matching",
    chipCtaRouting: "CTA routing",
    chipNoAutoPublish: "no auto publish",
    chipNoSilentMerge: "no silent merge",
    legacyModePrefix: "Legacy mode parameter detected",
    legacyModeSuffix:
      "and read for compatibility. The canonical entry remains free start; a visible primary split is no longer the target UX.",
    intakeContextTitle: "Intake context",
    intakeContextLead:
      "Context was forwarded from the upstream signal/review flow and serves as a manual start point: primary source first, then relevance scope, then signal trail. Please verify primary sources; no auto publish.",
    openPrimarySource: "Open primary source",
    regionLabel: "Region",
    scopeLabel: "Relevance scope",
    signalTrailLabel: "Signal trail",
    signalLabel: "Signal",
    clusterLabel: "Cluster",
    reviewLabel: "Review",
    handoffLabel: "Handoff",
    candidateIdLabel: "Candidate ID (tech)",
    draftIdLabel: "Draft ID (tech)",
    contextPickerTitle: "Optional: link to an existing Anlassraum",
    contextPickerLead:
      "You can link your working state to an existing Anlassraum. Without a selection, eDebatte starts a new working state.",
    loadingContextList: "Loading production context list ...",
    contextUnavailable: "Context source currently unavailable",
    reload: "Reload",
    contextEmpty: "No matching Anlassraum is currently preselected.",
    topicLabel: "Topic",
    statusLabel: "Status",
    statusOpen: "open",
    selectedLabel: "Selected",
    anlassraumIdLabel: "anlassraumId",
    clearSelection: "Clear selection",
    quotasTitle: "Access and quotas",
    tierLabel: "Tier",
    creditsLabel: "Credits",
    monthlyLimitLabel: "Monthly limit",
    monthlyLimitUnlimited: "unlimited",
    maxClaimsLabel: "Max claims",
    goToRounds: "Go to /runden",
    srOnlyCreate: "Create",
    workGoalTitle: "Work goal:",
    workGoalLineReview: "- Review signal context in a structured way",
    workGoalLineAttach: "- Attach to an Anlassraum or create a candidate deliberately",
    workGoalLineContinue: "- Continue dossier work only as a follow-up",
    accessNoteDefault: "Your area is fixed. For other use cases, you need the matching package.",
    accessNoteStaff: "Staff access: all use cases are enabled.",
    accessNoteMedia: "Journalism/media: access limited to journalism formats.",
    accessNoteAgenda: "Administration/organizations: access limited to agenda and administration formats.",
    accessNoteCivic: "Civic area: access for contributions and projects.",
    lockLabelCivic: "Civic area",
    lockLabelJournalism: "Journalism/media only",
    lockLabelAgenda: "Administration/organizations only",
    upgradeLabel: "Upgrade",
    selectionInfoInvalidContext: "The selected Anlassraum could not be applied.",
    selectionInfoUnavailableContext: "The selected Anlassraum is currently unavailable.",
  },
  feeds: {
    headerKicker: "Admin · Feeds",
    headerTitle: "Feed control plane",
    headerLead:
      "Move signals from feeds, public sources, and incoming hints into Anlassräume; dossier consolidation remains a deliberate follow-up. Primary sources are reviewed separately; there is no automatic publishing from feed signals.",
    linkToDrafts: "Go to feed drafts",
    linkToAnlassraeume: "Go to Anlassraum list",
    linkToAcquisition: "Go to acquisition dashboard",
    sourceConfigTitle: "Signal source configuration (feed references)",
    dedupFeedsSuffix: "deduplicated feeds",
    loadingConfig: "Loading configuration ...",
    sourceMissing: "no signal source found",
    invalidUrlsIgnoredSuffix: "invalid feed URLs were ignored.",
    feedRowsLabel: "Feeds",
    globalLabel: "GLOBAL",
    colRegion: "Region",
    colTopic: "Topic",
    colSignalSource: "Signal source (feed URL)",
    pullAnalyzeTitle: "Pull + analyze",
    pullAnalyzeLead:
      "Pull loads signals into `statement_candidates`; analyze generates reviewable `vote_drafts`. No direct publish path.",
    scopeLabel: "Scope",
    regionCodeOptional: "Region code (optional)",
    regionCodeExamplePlaceholder: "e.g. DE:BE",
    maxFeeds: "Max feeds",
    maxItemsPerFeed: "Max items per feed",
    dryRunLabel: "Dry run (count only, do not write)",
    fetchSignalSources: "Fetch signal sources",
    pullRunning: "Pull running ...",
    pullErrorPrefix: "Pull",
    analyzeLimit: "Analyze limit",
    startAnalyze: "Start analysis",
    analyzeRunning: "Analyze running ...",
    analyzeErrorPrefix: "Analyze",
    batchTitle: "Batch signal import (maintenance)",
    batchLead:
      "Paste JSON as {\"items\":[...]} or directly [...], then send it to /api/feeds/batch. Batch creates signal candidates, no direct content takeover, and no publishing.",
    startImport: "Start import",
    importRunning: "Import running ...",
  },
  feedDrafts: {
    headerKicker: "Admin · Feed pipeline",
    headerTitle: "Signal drafts: Anlassraum-first queue",
    headerLead:
      "Core operator path: signal -> Anlassraum -> dossier -> output. Feeds provide hints, not direct publishing logic. Primary sources remain the factual base.",
    linkToFeedControl: "To feed control plane",
    linkToAnlassraumList: "To Anlassraum list",
    linkToAnlassraumOps: "To Anlassraum operations",
    linkToCreateFastPath: "4) Continue manually via /create",
    decisioningLeadPrefix: "Operator decision paths",
    decisioningLeadSuffix: "No auto publish, no automatic feed takeover.",
    candidateFilters: "Candidate filters",
    regionAll: "All regions",
    regionGlobal: "Global / open",
    regionEu: "EU / Europe",
    regionGermany: "Germany",
    regionAustria: "Austria",
    regionSwitzerland: "Switzerland",
    searchPlaceholder: "Search in title, summary, primary source",
    anlassraumFilterPlaceholder: "Anlassraum ID (optional)",
    anlassraumFilterActive: "Anlassraum filter active",
    candidatesTitle: "Candidate list",
    candidatesLead:
      "Focus on the next safe action per draft: check context, map to Anlassraum, or complete review cleanly.",
    summaryHits: "Current matches",
    summaryUnlinked: "Without Anlassraum",
    summaryWeak: "Weak signal",
    summaryHighPriority: "High priority",
    tableCandidate: "Candidate",
    tableQueueContext: "Queue context",
    tableAnlassraumHints: "Anlassraum & hints",
    tableNextStep: "Next step",
    tablePrimarySource: "Primary source / signal trail",
    selectAllAriaLabel: "Select all",
    selectDraftAriaPrefix: "Draft",
    loadingDrafts: "Loading drafts ...",
    emptyDraftsPrefix: "No drafts for the current filters. Check whether filters are too strict, or open the",
    emptyDraftsMiddle: "Feed control plane",
    emptyDraftsSuffix: "or start a manual Anlassraum intake via",
    pendingLabel: "pending",
    weakLabel: "weak",
    reasonsLabel: "Reasons",
    lastActionLabel: "last action",
    linkedLabel: "linked",
    unlinkedLabel: "unlinked",
    openAnlassraum: "Open Anlassraum",
    checkAnlassraumContext: "Check Anlassraum context",
    weakSignalLabel: "Weak signal",
    noteLabel: "Note",
    draftDetailLink: "Review draft details",
    manualCreateLink: "Continue manually via /create",
    primarySourceLabel: "Primary source",
    signalTrailLabel: "Signal trail",
    signalTrailCandidate: "Feed candidate",
    analysisLabel: "Analysis",
    pipelineLabel: "Pipeline",
    sourceOpenLabel: "open",
    bulkSummaryPrefix: "Bulk review (secondary)",
    selectedSuffix: "selected",
    bulkLead: "Bulk action for multiple signals. No auto publish and no auto approval.",
    bulkAnlassraumPlaceholder: "Anlassraum ID (attach only)",
    bulkWeakReasonPlaceholder: "Weak signal reason (optional)",
    bulkReviewNotePlaceholder: "Review note (optional)",
    applyBulk: "Apply bulk action",
    applying: "running...",
    legacySummary: "Legacy backfill (secondary maintenance exception)",
    legacyLead:
      "Explicit single remediation for drafts without `anlassraumId` (no auto backfill, no silent migration).",
    legacyColDraft: "Draft",
    legacyColQueue: "Queue/Triage",
    legacyColAudit: "Audit",
    legacyColRemediation: "Remediation",
    loadingLegacy: "Loading legacy drafts ...",
    emptyLegacy: "No unlinked legacy drafts for the current filters.",
    missingAnlassraumId: "missing anlassraumId",
    queueLabel: "Queue",
    priorityLabel: "Priority",
    openSinceLabel: "Open since",
    hintsLabel: "Hints",
    weakSignalLongLabel: "Weak signal",
    noFlagLabel: "no flag",
    executedByLabel: "Executed by",
    timestampLabel: "Timestamp",
    remediationLabel: "Remediation",
    remediationAnlassraumPlaceholder: "Anlassraum ID for attach",
    remediationNotePlaceholder: "Remediation note (optional)",
    remediationAttach: "Link to Anlassraum",
    remediationCreateCandidate: "Create an Anlassraum candidate",
    noValue: "—",
    idLabel: "ID",
    regionLabel: "Region",
    nextStepWeakTitle: "Validate weak signal",
    nextStepWeakDetail: "Validate uncertain context manually via /create and document the reason.",
    nextStepAttachTitle: "Link to existing Anlassraum",
    nextStepAttachDetail: "Mapping has priority; avoid creating a new candidate when possible.",
    nextStepCandidateTitle: "Create an Anlassraum candidate",
    nextStepCandidateDetail: "Signal is unlinked and needs a new Anlassraum candidate as base.",
    nextStepReviewTitle: "Complete review",
    nextStepReviewDetail: "Check the decision and continue with consistent state.",
    nextStepVerifyTitle: "Verify candidate",
    nextStepVerifyDetail: "Check context, analysis, and history in the detail screen.",
    selectAtLeastOne: "Select at least one draft.",
    attachNeedsAnlassraumId: "An Anlassraum ID is required for linking.",
    bulkDonePrefix: "Bulk completed:",
    bulkDoneMiddle: "successful,",
    bulkDoneSuffix: "failed.",
    bulkFailedFallback: "Bulk review failed.",
    legacyAttachNeedsAnlassraumId: "An Anlassraum ID is required for linking.",
    legacyBackfillFailed: "legacy_backfill_failed",
    unknownLoadError: "Unknown error while loading drafts",
    unknownActionFallback: "action",
  },
  anlassraumList: {
    headerKicker: "Admin · Signal pipeline",
    headerTitle: "Anlassräume",
    headerLead:
      "Anlassräume structure signals first. Relevance can be local, regional, national, or institutional; dossier consolidation remains an optional deliberate next step.",
    linkToFeedControl: "To feed control plane",
    linkToAnlassraumOps: "To Anlassraum operations",
    statusFilterPrefix: "status",
    sourceModeFilterPrefix: "sourceMode",
    colAnlassraum: "Anlassraum",
    colStatus: "Status",
    colRegionTopic: "Region/topic",
    colOutputs: "Outputs",
    colRisk: "Risk",
    loading: "Loading Anlassräume ...",
    empty: "No Anlassräume found.",
    originLabel: "Origin",
    ownerLabel: "Ownership",
    scoreLabel: "score",
    globalOpen: "Global / open",
    dossierConsolidationLabel: "dossier consolidation",
    optionalNotStarted: "optional / not started",
    sourcesLabel: "Sources",
    riskOk: "ok",
    statusOpen: "open",
  },
  anlassraumDetail: {
    loading: "Loading Anlassraum ...",
    notFound: "Not found",
    headerKicker: "Admin · Anlassraum",
    scoreLabel: "score",
    relevanceLabel: "Relevance scope",
    originLabel: "Origin",
    ownerLabel: "Ownership",
    publishGateLabel: "Publish gate",
    publishGateReleased: "released",
    publishGateBlocked: "blocked",
    sourcesLabel: "Sources",
    requiredLabel: "required",
    hintLabel: "Hint",
    linkToCreate: "Continue manually via /create",
    linkToDraftQueue: "Feed drafts queue",
    linkToOverview: "Back to overview",
    linkToDossier: "Open dossier consolidation",
    optionalDossierLead:
      "Anlassraum remains an independent workspace. Dossier consolidation is a deliberate optional follow-up.",
    workspaceContext: "Work context",
    topicLabel: "Topic",
    clusterLabel: "Cluster",
    sourceSituationLabel: "Source situation",
    referencedSourceSuffix: "referenced source",
    outputTransitions: "Output transitions",
    colOutputType: "Output type",
    colStatus: "Status",
    colReviewState: "Review state",
    colPublishTarget: "Publish target",
    colLastAction: "Last action",
    colNextAction: "Next action",
    loadingOutputSeeds: "Loading output seeds ...",
    emptyOutputSeeds: "No output seeds found.",
    publishTargetPlaceholder: "Publish target (manual publish only)",
    reviewNotePlaceholder: "Review note (optional)",
    apply: "Apply",
    diagnosticsTitle: "Diagnostics & JSON (secondary)",
    diagnosticsLead: "Audit readout for deep-dive and troubleshooting. Main operator flow remains above.",
    metaJsonTitle: "Meta",
    sourcesJsonTitle: "Sources JSON",
    structureJsonTitle: "Structure JSON",
    publishGateEvidenceTitle: "Publish gate evidence",
    sourcePrefix: "Source",
    sourceNoMetaSuffix: "without readable metadata",
    sourceNoTitleOrUrlSuffix: "without title/URL",
    actionCurate: "Start curation",
    actionReview: "Move to review",
    actionApprove: "Approve",
    actionActivate: "Activate",
    actionArchive: "Archive",
    operatorFocusNeedsSourcesTitle: "Secure source situation first",
    operatorFocusNeedsSourcesPrefix: "Publishing remains blocked",
    operatorFocusNeedsSourcesMiddle: "source",
    operatorFocusNeedsSourcesSuffix:
      "Structure the Anlassraum and verify primary sources before continuing consolidation/publish.",
    operatorFocusHasDossierTitle: "Keep Anlassraum stable, continue consolidation deliberately",
    operatorFocusHasDossierDetail:
      "A dossier is already linked. Maintain Anlassraum context and continue consolidation deliberately.",
    operatorFocusContinueTitle: "Continue structuring Anlassraum",
    operatorFocusContinueDetail:
      "Refine signal and source context in Anlassraum; dossier consolidation remains an optional deliberate next step.",
    transitionFailed: "transition_failed",
    outputTransitionFailed: "output_seed_transition_failed",
  },
};

const ES: OperatorTexts = {
  ...EN,
  create: {
    ...EN.create,
    loadingAccess: "Cargando tu acceso ...",
    loginRequired: "Inicia sesión para comenzar un análisis.",
    submissionBlocked: "Tu plan actual no permite envíos.",
    freeStartKicker: "Create · Inicio libre",
    freeStartHeadline: "Inicio libre para flujos de Anlassraum y Dossier",
    freeStartLead:
      "Punto de entrada unificado: texto, cita, URL de fuente o material. Después, la plataforma guía por intake, control de calidad, graph matching y CTA routing.",
    chipQuality: "Control de calidad",
    chipNoAutoPublish: "sin publicación automática",
    chipNoSilentMerge: "sin fusión silenciosa",
    legacyModePrefix: "Parámetro legacy de modo detectado",
    intakeContextTitle: "Contexto de intake",
    intakeContextLead:
      "El contexto llega desde el flujo previo de Signal/revisión y sirve como inicio manual: primero fuente primaria, luego alcance de relevancia y después rastro de Signal. Verifica siempre fuentes primarias; no hay publicación automática.",
    openPrimarySource: "Abrir fuente primaria",
    scopeLabel: "Alcance de relevancia",
    reviewLabel: "Revisión",
    handoffLabel: "Transferencia",
    candidateIdLabel: "ID de candidato (técnico)",
    draftIdLabel: "ID de borrador (técnico)",
    contextPickerTitle: "Selector de contexto",
    contextPickerLead:
      "Opcional: selecciona un Anlassraum existente como contexto. El contexto puede aparecer más tarde en match/routing. Sin vinculación automática, sin publicación automática y sin fusión automática.",
    loadingContextList: "Cargando lista de contexto productivo ...",
    contextUnavailable: "Fuente de contexto no disponible",
    reload: "Recargar",
    contextEmpty: "No hay entradas de contexto productivo disponibles. No se usa fallback demo/estático.",
    topicLabel: "Tema",
    statusOpen: "abierto",
    selectedLabel: "Seleccionado",
    clearSelection: "Quitar selección",
    quotasTitle: "Acceso y cuotas",
    monthlyLimitLabel: "Límite mensual",
    monthlyLimitUnlimited: "ilimitado",
    maxClaimsLabel: "Máx. claims",
    goToRounds: "Ir a /runden",
    srOnlyCreate: "Crear",
    workGoalTitle: "Objetivo de trabajo:",
    workGoalLineReview: "- Revisar el contexto de Signal de forma estructurada",
    workGoalLineAttach: "- Vincular con un Anlassraum o crear un candidato de forma deliberada",
    workGoalLineContinue: "- Continuar el trabajo de Dossier solo como paso posterior",
    accessNoteDefault: "Tu área está fijada. Para otros casos de uso necesitas el paquete correspondiente.",
    accessNoteStaff: "Acceso staff: todos los casos de uso están habilitados.",
    accessNoteMedia: "Periodismo/medios: acceso limitado a formatos periodísticos.",
    accessNoteAgenda: "Administración/organizaciones: acceso limitado a formatos de agenda y administración.",
    accessNoteCivic: "Área cívica: acceso para contribuciones y proyectos.",
    lockLabelCivic: "Área cívica",
    lockLabelJournalism: "Solo periodismo/medios",
    lockLabelAgenda: "Solo administración/organizaciones",
    upgradeLabel: "Mejorar plan",
    selectionInfoInvalidContext: "El contexto recibido no es válido y no se aplicó.",
    selectionInfoUnavailableContext: "El contexto seleccionado está desactualizado o ya no está disponible.",
  },
  feeds: {
    ...EN.feeds,
    headerTitle: "Centro de control de Feed",
    headerLead:
      "Traslada Signals desde Feeds, fuentes públicas y avisos entrantes hacia Anlassräume; la consolidación de Dossier sigue siendo un paso deliberado. Las fuentes primarias se verifican por separado; no hay publicación automática desde Signals de Feed.",
    linkToDrafts: "Ir a borradores de Feed",
    linkToAnlassraeume: "Ir a lista de Anlassraum",
    linkToAcquisition: "Ir al panel de adquisición",
    sourceConfigTitle: "Configuración de fuentes de Signal (referencias Feed)",
    loadingConfig: "Cargando configuración ...",
    feedRowsLabel: "Feeds",
    globalLabel: "GLOBAL",
    colSignalSource: "Fuente de Signal (URL de Feed)",
    pullAnalyzeTitle: "Extracción + análisis",
    pullAnalyzeLead:
      "La extracción carga Signals en `statement_candidates`; el análisis genera `vote_drafts` revisables. Sin ruta de publicación directa.",
    scopeLabel: "Alcance",
    regionCodeOptional: "Código de región (opcional)",
    regionCodeExamplePlaceholder: "p. ej. DE:BE",
    maxItemsPerFeed: "Máx. elementos por Feed",
    dryRunLabel: "Simulación (solo contar, sin escribir)",
    fetchSignalSources: "Cargar fuentes de Signal",
    pullRunning: "Extracción en curso ...",
    pullErrorPrefix: "Extracción",
    analyzeLimit: "Límite de análisis",
    startAnalyze: "Iniciar análisis",
    analyzeRunning: "Análisis en curso ...",
    analyzeErrorPrefix: "Análisis",
    batchTitle: "Importación batch de Signal (mantenimiento)",
    startImport: "Iniciar importación",
    importRunning: "Importación en curso ...",
  },
  feedDrafts: {
    ...EN.feedDrafts,
    headerKicker: "Admin · Pipeline de Feed",
    headerTitle: "Borradores de Signal: cola Anlassraum-first",
    headerLead:
      "Ruta operativa principal: Signal -> Anlassraum -> Dossier -> output. Los Feeds aportan pistas, no lógica de publicación directa. Las fuentes primarias siguen siendo la base factual.",
    linkToFeedControl: "Al centro de control de Feed",
    linkToAnlassraumList: "A la lista de Anlassraum",
    linkToAnlassraumOps: "A operaciones de Anlassraum",
    linkToCreateFastPath: "4) Continuar manualmente vía /create",
    decisioningLeadPrefix: "Rutas de decisión del operador",
    candidateFilters: "Filtros de candidatos",
    regionAll: "Todas las regiones",
    regionGlobal: "Global / abierto",
    regionEu: "UE / Europa",
    searchPlaceholder: "Buscar en título, resumen y fuente primaria",
    anlassraumFilterActive: "Filtro de Anlassraum activo",
    candidatesTitle: "Lista de candidatos",
    candidatesLead:
      "Enfoca la siguiente acción segura por borrador: revisar contexto, asignar a Anlassraum o cerrar revisión de forma consistente.",
    summaryHits: "Resultados actuales",
    summaryUnlinked: "Sin Anlassraum",
    summaryWeak: "Signal débil",
    summaryHighPriority: "Alta prioridad",
    tableQueueContext: "Contexto de cola",
    tableNextStep: "Siguiente paso",
    selectAllAriaLabel: "Seleccionar todo",
    selectDraftAriaPrefix: "Borrador",
    loadingDrafts: "Cargando borradores ...",
    emptyDraftsPrefix: "No hay borradores para los filtros actuales. Revisa si son demasiado estrictos o abre el",
    emptyDraftsMiddle: "centro de control de Feed",
    emptyDraftsSuffix: "o inicia intake manual de Anlassraum vía",
    pendingLabel: "pendiente",
    weakLabel: "débil",
    reasonsLabel: "Motivos",
    lastActionLabel: "última acción",
    linkedLabel: "vinculado",
    unlinkedLabel: "sin vincular",
    openAnlassraum: "Abrir Anlassraum",
    checkAnlassraumContext: "Revisar contexto de Anlassraum",
    weakSignalLabel: "Signal débil",
    noteLabel: "Nota",
    draftDetailLink: "Revisar detalle del borrador",
    manualCreateLink: "Continuar manualmente vía /create",
    primarySourceLabel: "Fuente primaria",
    signalTrailLabel: "Rastro de Signal",
    signalTrailCandidate: "Candidato de Feed",
    analysisLabel: "Análisis",
    sourceOpenLabel: "abierto",
    bulkSummaryPrefix: "Revisión masiva (secundaria)",
    selectedSuffix: "seleccionados",
    bulkLead: "Acción masiva para varios Signals. Sin publicación automática y sin aprobación automática.",
    bulkWeakReasonPlaceholder: "Motivo de Signal débil (opcional)",
    bulkReviewNotePlaceholder: "Nota de revisión (opcional)",
    applyBulk: "Aplicar acción masiva",
    applying: "ejecutando...",
    legacySummary: "Backfill legacy (excepción secundaria de mantenimiento)",
    legacyColDraft: "Borrador",
    legacyColQueue: "Cola/Triage",
    legacyColRemediation: "Corrección",
    loadingLegacy: "Cargando borradores legacy ...",
    queueLabel: "Cola",
    priorityLabel: "Prioridad",
    openSinceLabel: "Abierto desde",
    hintsLabel: "Indicaciones",
    weakSignalLongLabel: "Signal débil",
    noFlagLabel: "sin marca",
    executedByLabel: "Ejecutado por",
    timestampLabel: "Marca de tiempo",
    remediationLabel: "Corrección",
    remediationNotePlaceholder: "Nota de corrección (opcional)",
    remediationAttach: "Vincular a Anlassraum",
    remediationCreateCandidate: "Crear candidato de Anlassraum",
    nextStepWeakTitle: "Validar Signal débil",
    nextStepWeakDetail: "Valida contexto incierto manualmente vía /create y documenta el motivo.",
    nextStepAttachTitle: "Vincular a Anlassraum existente",
    nextStepCandidateTitle: "Crear candidato de Anlassraum",
    nextStepReviewTitle: "Completar revisión",
    nextStepReviewDetail: "Revisa la decisión y continúa con estado consistente.",
    nextStepVerifyTitle: "Verificar candidato",
    selectAtLeastOne: "Selecciona al menos un borrador.",
    attachNeedsAnlassraumId: "Se requiere un ID de Anlassraum para vincular.",
    bulkDonePrefix: "Acción masiva completada:",
    bulkDoneMiddle: "correctos,",
    bulkDoneSuffix: "fallidos.",
    bulkFailedFallback: "La revisión masiva falló.",
    legacyAttachNeedsAnlassraumId: "Se requiere un ID de Anlassraum para vincular.",
    unknownLoadError: "Error desconocido al cargar borradores",
    unknownActionFallback: "acción",
  },
  anlassraumList: {
    ...EN.anlassraumList,
    headerKicker: "Admin · Pipeline de Signal",
    headerLead:
      "Los Anlassräume estructuran primero los Signals. La relevancia puede ser local, regional, nacional o institucional; la consolidación de Dossier sigue siendo un siguiente paso opcional y deliberado.",
    linkToFeedControl: "Al centro de control de Feed",
    linkToAnlassraumOps: "A operaciones de Anlassraum",
    statusFilterPrefix: "estado",
    sourceModeFilterPrefix: "modo de origen",
    colRegionTopic: "Región/tema",
    colOutputs: "Salidas",
    loading: "Cargando Anlassräume ...",
    empty: "No se encontraron Anlassräume.",
    ownerLabel: "Titularidad",
    scoreLabel: "puntuación",
    globalOpen: "Global / abierto",
    dossierConsolidationLabel: "consolidación de Dossier",
    sourcesLabel: "Fuentes",
  },
  anlassraumDetail: {
    ...EN.anlassraumDetail,
    loading: "Cargando Anlassraum ...",
    notFound: "No encontrado",
    headerKicker: "Admin · Anlassraum",
    scoreLabel: "puntuación",
    relevanceLabel: "Alcance de relevancia",
    originLabel: "Origen",
    ownerLabel: "Titularidad",
    publishGateLabel: "Puerta de publicación",
    publishGateReleased: "liberado",
    publishGateBlocked: "bloqueado",
    requiredLabel: "requerido",
    hintLabel: "Indicación",
    linkToCreate: "Continuar manualmente vía /create",
    linkToDraftQueue: "Cola de borradores de Feed",
    linkToOverview: "Volver al resumen",
    linkToDossier: "Abrir consolidación de Dossier",
    optionalDossierLead:
      "Anlassraum sigue siendo un espacio de trabajo independiente. La consolidación de Dossier es un paso opcional y deliberado.",
    workspaceContext: "Contexto de trabajo",
    topicLabel: "Tema",
    sourceSituationLabel: "Situación de fuentes",
    referencedSourceSuffix: "fuente referenciada",
    outputTransitions: "Transiciones de output",
    colOutputType: "Tipo de output",
    colStatus: "Estado",
    colReviewState: "Estado de revisión",
    colPublishTarget: "Objetivo de publicación",
    colLastAction: "Última acción",
    colNextAction: "Siguiente acción",
    loadingOutputSeeds: "Cargando outputs en preparación ...",
    emptyOutputSeeds: "No se encontraron outputs en preparación.",
    publishTargetPlaceholder: "Objetivo de publicación (solo publicación manual)",
    reviewNotePlaceholder: "Nota de revisión (opcional)",
    apply: "Aplicar",
    diagnosticsTitle: "Diagnóstico y JSON (secundario)",
    diagnosticsLead: "Salida de auditoría para análisis profundo y depuración. El flujo operativo principal queda arriba.",
    metaJsonTitle: "Meta",
    sourcesJsonTitle: "JSON de fuentes",
    structureJsonTitle: "JSON de estructura",
    publishGateEvidenceTitle: "Evidencia de puerta de publicación",
    sourcePrefix: "Fuente",
    sourceNoMetaSuffix: "sin metadatos legibles",
    sourceNoTitleOrUrlSuffix: "sin título/URL",
    actionCurate: "Iniciar curación",
    actionReview: "Mover a revisión",
    actionApprove: "Aprobar",
    actionActivate: "Activar",
    actionArchive: "Archivar",
    operatorFocusNeedsSourcesTitle: "Asegura primero la situación de fuentes",
    operatorFocusNeedsSourcesPrefix: "La publicación sigue bloqueada",
    operatorFocusNeedsSourcesMiddle: "fuente",
    operatorFocusNeedsSourcesSuffix:
      "Estructura el Anlassraum y verifica fuentes primarias antes de continuar con consolidación/publicación.",
    operatorFocusHasDossierTitle: "Mantén estable el Anlassraum y continúa la consolidación con intención",
    operatorFocusHasDossierDetail:
      "Ya hay un Dossier vinculado. Mantén el contexto de Anlassraum y avanza la consolidación de forma deliberada.",
    operatorFocusContinueTitle: "Continuar estructurando Anlassraum",
    operatorFocusContinueDetail:
      "Refina el contexto de Signal y fuentes en Anlassraum; la consolidación de Dossier sigue siendo un siguiente paso opcional y deliberado.",
    transitionFailed: "Transición fallida",
    outputTransitionFailed: "Transición de output fallida",
  },
};

const FR: OperatorTexts = {
  ...EN,
  create: {
    ...EN.create,
    loadingAccess: "Chargement de votre accès ...",
    loginRequired: "Connectez-vous pour démarrer une analyse.",
    submissionBlocked: "Votre offre actuelle n'autorise pas les soumissions.",
    freeStartKicker: "Create · Démarrage libre",
    freeStartHeadline: "Démarrage libre pour les flux Anlassraum et Dossier",
    freeStartLead:
      "Point d'entrée unifié : texte, citation, URL source ou matériau. Ensuite, la plateforme guide via intake, contrôle qualité, graph matching et CTA routing.",
    chipQuality: "Contrôle qualité",
    chipNoAutoPublish: "pas de publication auto",
    chipNoSilentMerge: "pas de fusion silencieuse",
    legacyModePrefix: "Paramètre de mode legacy détecté",
    intakeContextTitle: "Contexte d'intake",
    intakeContextLead:
      "Le contexte provient du flux amont Signal/revue et sert de point de départ manuel : source primaire d'abord, puis périmètre de pertinence, puis trace de Signal.",
    openPrimarySource: "Ouvrir la source primaire",
    scopeLabel: "Périmètre de pertinence",
    reviewLabel: "Revue",
    handoffLabel: "Transfert",
    candidateIdLabel: "ID candidat (tech)",
    draftIdLabel: "ID brouillon (tech)",
    contextPickerTitle: "Sélecteur de contexte",
    contextPickerLead:
      "Optionnel : choisissez un Anlassraum existant comme contexte. Le contexte peut apparaître plus tard dans le match/routing. Pas de lien automatique, pas de publication auto, pas de fusion auto.",
    loadingContextList: "Chargement de la liste de contexte en production ...",
    contextUnavailable: "Source de contexte indisponible",
    reload: "Recharger",
    contextEmpty: "Aucune entrée de contexte de production disponible. Aucun fallback démo/statique n'est utilisé.",
    topicLabel: "Thème",
    statusOpen: "ouvert",
    selectedLabel: "Sélectionné",
    clearSelection: "Effacer la sélection",
    quotasTitle: "Accès et quotas",
    monthlyLimitLabel: "Limite mensuelle",
    monthlyLimitUnlimited: "illimité",
    goToRounds: "Aller à /runden",
    srOnlyCreate: "Créer",
    workGoalTitle: "Objectif de travail :",
    workGoalLineReview: "- Vérifier le contexte Signal de manière structurée",
    workGoalLineAttach: "- Lier à un Anlassraum ou créer un candidat de façon délibérée",
    workGoalLineContinue: "- Poursuivre le travail Dossier uniquement en étape suivante",
    accessNoteDefault: "Votre périmètre est fixé. Pour d'autres cas d'usage, il faut l'offre adaptée.",
    accessNoteStaff: "Accès staff : tous les cas d'usage sont activés.",
    accessNoteMedia: "Journalisme/médias : accès limité aux formats journalistiques.",
    accessNoteAgenda: "Administration/organisations : accès limité aux formats agenda et administration.",
    accessNoteCivic: "Espace civique : accès pour contributions et projets.",
    lockLabelCivic: "Espace civique",
    lockLabelJournalism: "Journalisme/médias uniquement",
    lockLabelAgenda: "Administration/organisations uniquement",
    upgradeLabel: "Mise à niveau",
    selectionInfoInvalidContext: "Le contexte transmis est invalide et n'a pas été appliqué.",
    selectionInfoUnavailableContext: "Le contexte sélectionné est obsolète ou indisponible.",
  },
  feeds: {
    ...EN.feeds,
    headerTitle: "Centre de contrôle Feed",
    headerLead:
      "Achemine les Signals issus des Feeds, des sources publiques et des signalements entrants vers les Anlassräume ; la consolidation Dossier reste une étape volontaire.",
    linkToDrafts: "Aller aux brouillons Feed",
    linkToAnlassraeume: "Aller à la liste Anlassraum",
    linkToAcquisition: "Aller au tableau acquisition",
    sourceConfigTitle: "Configuration des sources Signal (références Feed)",
    loadingConfig: "Chargement de la configuration ...",
    feedRowsLabel: "Feeds",
    globalLabel: "GLOBAL",
    colTopic: "Thème",
    colSignalSource: "Source Signal (URL Feed)",
    pullAnalyzeTitle: "Collecte + analyse",
    pullAnalyzeLead:
      "La collecte charge les Signals dans `statement_candidates`; l'analyse produit des `vote_drafts` révisables. Aucun chemin de publication directe.",
    scopeLabel: "Périmètre",
    regionCodeOptional: "Code région (optionnel)",
    regionCodeExamplePlaceholder: "ex. DE:BE",
    maxItemsPerFeed: "Max éléments par Feed",
    dryRunLabel: "Simulation (compter uniquement, ne pas écrire)",
    fetchSignalSources: "Récupérer les sources Signal",
    pullRunning: "Collecte en cours ...",
    pullErrorPrefix: "Collecte",
    analyzeLimit: "Limite d'analyse",
    startAnalyze: "Démarrer l'analyse",
    analyzeRunning: "Analyse en cours ...",
    analyzeErrorPrefix: "Analyse",
    batchTitle: "Import batch de Signal (maintenance)",
    startImport: "Démarrer l'import",
    importRunning: "Import en cours ...",
  },
  feedDrafts: {
    ...EN.feedDrafts,
    headerKicker: "Admin · Pipeline Feed",
    headerTitle: "Brouillons Signal : file Anlassraum-first",
    headerLead:
      "Chemin opérateur principal : Signal -> Anlassraum -> Dossier -> output. Les Feeds fournissent des indices, pas une logique de publication directe.",
    linkToFeedControl: "Vers le centre de contrôle Feed",
    linkToAnlassraumList: "Vers la liste Anlassraum",
    linkToAnlassraumOps: "Vers les opérations Anlassraum",
    linkToCreateFastPath: "4) Continuer manuellement via /create",
    decisioningLeadPrefix: "Chemins de décision opérateur",
    candidateFilters: "Filtres candidats",
    regionAll: "Toutes les régions",
    regionGlobal: "Global / ouvert",
    regionEu: "UE / Europe",
    searchPlaceholder: "Rechercher dans titre, résumé et source primaire",
    anlassraumFilterActive: "Filtre Anlassraum actif",
    candidatesTitle: "Liste des candidats",
    candidatesLead:
      "Concentrez-vous sur l'action sûre suivante par brouillon : vérifier le contexte, associer à Anlassraum ou clôturer la revue proprement.",
    summaryHits: "Résultats actuels",
    summaryUnlinked: "Sans Anlassraum",
    summaryWeak: "Signal faible",
    summaryHighPriority: "Haute priorité",
    tableQueueContext: "Contexte de file",
    tableNextStep: "Étape suivante",
    selectAllAriaLabel: "Tout sélectionner",
    selectDraftAriaPrefix: "Brouillon",
    loadingDrafts: "Chargement des brouillons ...",
    emptyDraftsPrefix: "Aucun brouillon pour les filtres actuels. Vérifiez si les filtres sont trop stricts ou ouvrez le",
    emptyDraftsMiddle: "centre de contrôle Feed",
    emptyDraftsSuffix: "ou démarrez un intake Anlassraum manuel via",
    pendingLabel: "en attente",
    weakLabel: "faible",
    reasonsLabel: "Raisons",
    lastActionLabel: "dernière action",
    linkedLabel: "lié",
    unlinkedLabel: "non lié",
    openAnlassraum: "Ouvrir Anlassraum",
    checkAnlassraumContext: "Vérifier le contexte Anlassraum",
    weakSignalLabel: "Signal faible",
    noteLabel: "Note",
    draftDetailLink: "Examiner le brouillon en détail",
    manualCreateLink: "Continuer manuellement via /create",
    primarySourceLabel: "Source primaire",
    signalTrailLabel: "Trace Signal",
    signalTrailCandidate: "Candidat Feed",
    analysisLabel: "Analyse",
    sourceOpenLabel: "ouvert",
    bulkSummaryPrefix: "Revue en masse (secondaire)",
    selectedSuffix: "sélectionnés",
    bulkLead: "Action en masse pour plusieurs Signals. Pas de publication auto ni d'approbation auto.",
    bulkWeakReasonPlaceholder: "Raison de Signal faible (optionnel)",
    bulkReviewNotePlaceholder: "Note de revue (optionnel)",
    applyBulk: "Appliquer l'action en masse",
    applying: "en cours...",
    legacySummary: "Backfill legacy (exception secondaire de maintenance)",
    legacyColDraft: "Brouillon",
    legacyColQueue: "File/Triage",
    legacyColRemediation: "Correction",
    loadingLegacy: "Chargement des brouillons legacy ...",
    queueLabel: "File",
    priorityLabel: "Priorité",
    openSinceLabel: "Ouvert depuis",
    hintsLabel: "Indices",
    weakSignalLongLabel: "Signal faible",
    noFlagLabel: "sans marqueur",
    executedByLabel: "Exécuté par",
    timestampLabel: "Horodatage",
    remediationLabel: "Correction",
    remediationNotePlaceholder: "Note de correction (optionnel)",
    remediationAttach: "Lier à Anlassraum",
    remediationCreateCandidate: "Créer un candidat Anlassraum",
    nextStepWeakTitle: "Valider le Signal faible",
    nextStepWeakDetail: "Validez le contexte incertain manuellement via /create et documentez la raison.",
    nextStepAttachTitle: "Lier à un Anlassraum existant",
    nextStepCandidateTitle: "Créer un candidat Anlassraum",
    nextStepReviewTitle: "Terminer la revue",
    nextStepReviewDetail: "Vérifiez la décision et poursuivez avec un état cohérent.",
    nextStepVerifyTitle: "Vérifier le candidat",
    selectAtLeastOne: "Sélectionnez au moins un brouillon.",
    attachNeedsAnlassraumId: "Un ID Anlassraum est requis pour la liaison.",
    bulkDonePrefix: "Action en masse terminée :",
    bulkDoneMiddle: "réussis,",
    bulkDoneSuffix: "échoués.",
    bulkFailedFallback: "La revue en masse a échoué.",
    legacyAttachNeedsAnlassraumId: "Un ID Anlassraum est requis pour la liaison.",
    unknownLoadError: "Erreur inconnue lors du chargement des brouillons",
    unknownActionFallback: "action",
  },
  anlassraumList: {
    ...EN.anlassraumList,
    headerKicker: "Admin · Pipeline Signal",
    headerLead:
      "Les Anlassräume structurent d'abord les Signals. La pertinence peut être locale, régionale, nationale ou institutionnelle ; la consolidation Dossier reste une étape optionnelle et volontaire.",
    linkToFeedControl: "Vers le centre de contrôle Feed",
    linkToAnlassraumOps: "Vers les opérations Anlassraum",
    statusFilterPrefix: "statut",
    sourceModeFilterPrefix: "mode source",
    colRegionTopic: "Région/thème",
    colOutputs: "Sorties",
    loading: "Chargement des Anlassräume ...",
    empty: "Aucun Anlassraum trouvé.",
    ownerLabel: "Responsabilité",
    scoreLabel: "score",
    globalOpen: "Global / ouvert",
    dossierConsolidationLabel: "consolidation Dossier",
    sourcesLabel: "Sources",
  },
  anlassraumDetail: {
    ...EN.anlassraumDetail,
    loading: "Chargement de Anlassraum ...",
    notFound: "Introuvable",
    headerKicker: "Admin · Anlassraum",
    scoreLabel: "score",
    relevanceLabel: "Périmètre de pertinence",
    originLabel: "Origine",
    ownerLabel: "Responsabilité",
    publishGateLabel: "Garde de publication",
    publishGateReleased: "autorisé",
    publishGateBlocked: "bloqué",
    requiredLabel: "requis",
    hintLabel: "Indice",
    linkToCreate: "Continuer manuellement via /create",
    linkToDraftQueue: "File des brouillons Feed",
    linkToOverview: "Retour à l'aperçu",
    linkToDossier: "Ouvrir la consolidation Dossier",
    optionalDossierLead:
      "Anlassraum reste un espace de travail indépendant. La consolidation Dossier est une suite optionnelle et volontaire.",
    workspaceContext: "Contexte de travail",
    topicLabel: "Thème",
    sourceSituationLabel: "Situation des sources",
    referencedSourceSuffix: "source référencée",
    outputTransitions: "Transitions d'output",
    colOutputType: "Type d'output",
    colStatus: "Statut",
    colReviewState: "Statut de revue",
    colPublishTarget: "Cible de publication",
    colLastAction: "Dernière action",
    colNextAction: "Action suivante",
    loadingOutputSeeds: "Chargement des outputs en préparation ...",
    emptyOutputSeeds: "Aucun output en préparation.",
    publishTargetPlaceholder: "Cible de publication (publication manuelle uniquement)",
    reviewNotePlaceholder: "Note de revue (optionnel)",
    apply: "Appliquer",
    diagnosticsTitle: "Diagnostic et JSON (secondaire)",
    diagnosticsLead: "Sortie d'audit pour analyse approfondie et dépannage. Le flux opérateur principal reste au-dessus.",
    metaJsonTitle: "Meta",
    sourcesJsonTitle: "JSON des sources",
    structureJsonTitle: "JSON de structure",
    publishGateEvidenceTitle: "Preuves de garde de publication",
    sourcePrefix: "Source",
    sourceNoMetaSuffix: "sans métadonnées lisibles",
    sourceNoTitleOrUrlSuffix: "sans titre/URL",
    actionCurate: "Démarrer la curation",
    actionReview: "Passer en revue",
    actionApprove: "Approuver",
    actionActivate: "Activer",
    actionArchive: "Archiver",
    operatorFocusNeedsSourcesTitle: "Sécuriser d'abord la situation des sources",
    operatorFocusNeedsSourcesPrefix: "La publication reste bloquée",
    operatorFocusNeedsSourcesMiddle: "source",
    operatorFocusNeedsSourcesSuffix:
      "Structurez l'Anlassraum et vérifiez les sources primaires avant de poursuivre consolidation/publication.",
    operatorFocusHasDossierTitle: "Garder Anlassraum stable et poursuivre la consolidation avec intention",
    operatorFocusHasDossierDetail:
      "Un Dossier est déjà lié. Maintenez le contexte Anlassraum et poursuivez la consolidation de manière délibérée.",
    operatorFocusContinueTitle: "Continuer à structurer Anlassraum",
    operatorFocusContinueDetail:
      "Affinez le contexte Signal et sources dans Anlassraum ; la consolidation Dossier reste un prochain pas optionnel et délibéré.",
    transitionFailed: "Transition échouée",
    outputTransitionFailed: "Transition d'output échouée",
  },
};

const ZH: OperatorTexts = {
  ...EN,
  create: {
    ...EN.create,
    loadingAccess: "正在加载你的访问权限...",
    loginRequired: "请先登录后再开始分析。",
    submissionBlocked: "你当前的套餐不允许提交。",
    freeStartKicker: "Create · 自由起步",
    freeStartHeadline: "用于 Anlassraum 与 Dossier 流程的自由起步",
    freeStartLead:
      "统一入口：文本、引用、来源 URL 或材料。随后平台会引导完成 intake、质量检查、graph matching 与 CTA routing。",
    chipQuality: "质量检查",
    chipNoAutoPublish: "无自动发布",
    chipNoSilentMerge: "无静默合并",
    legacyModePrefix: "检测到 legacy 模式参数",
    intakeContextTitle: "Intake 上下文",
    intakeContextLead:
      "该上下文来自上游 Signal/审核流程，作为人工起点：先核验主来源，再确认相关范围，最后查看 Signal 轨迹。不会自动发布。",
    openPrimarySource: "打开主来源",
    scopeLabel: "相关范围",
    reviewLabel: "审核",
    handoffLabel: "交接",
    candidateIdLabel: "候选 ID（技术）",
    draftIdLabel: "草稿 ID（技术）",
    contextPickerTitle: "上下文选择器",
    contextPickerLead:
      "可选：选择一个已有 Anlassraum 作为上下文。该上下文可在后续匹配/路由中出现。不会自动关联、自动发布或自动合并。",
    loadingContextList: "正在加载生产上下文列表...",
    contextUnavailable: "上下文来源暂不可用",
    reload: "重新加载",
    contextEmpty: "暂无可用的生产上下文条目。不会使用 demo/static 回退。",
    topicLabel: "主题",
    statusOpen: "开放",
    selectedLabel: "已选择",
    clearSelection: "清除选择",
    quotasTitle: "访问与配额",
    monthlyLimitLabel: "月度上限",
    monthlyLimitUnlimited: "无限制",
    goToRounds: "前往 /runden",
    srOnlyCreate: "创建",
    workGoalTitle: "工作目标：",
    workGoalLineReview: "- 以结构化方式核验 Signal 上下文",
    workGoalLineAttach: "- 将其关联到 Anlassraum，或有意识地创建候选",
    workGoalLineContinue: "- 仅在后续阶段继续 Dossier 工作",
    accessNoteDefault: "你的使用范围已固定。若需其他用例，请升级到对应套餐。",
    accessNoteStaff: "Staff 访问：全部用例均已开放。",
    accessNoteMedia: "新闻/媒体：仅可访问新闻类格式。",
    accessNoteAgenda: "行政/组织：仅可访问议程与行政类格式。",
    accessNoteCivic: "公民区：可访问贡献与项目类内容。",
    lockLabelCivic: "公民区",
    lockLabelJournalism: "仅新闻/媒体",
    lockLabelAgenda: "仅行政/组织",
    upgradeLabel: "升级",
    selectionInfoInvalidContext: "传入的上下文无效，未被应用。",
    selectionInfoUnavailableContext: "所选上下文已过期或不再可用。",
  },
  feeds: {
    ...EN.feeds,
    headerTitle: "Feed 控制台",
    headerLead:
      "将来自 Feed、公共来源与外部线索的 Signal 导入 Anlassräume；Dossier 汇总仍是有意识的后续步骤。主来源需要单独核验，不存在从 Feed Signal 自动发布。",
    linkToDrafts: "前往 Feed 草稿",
    linkToAnlassraeume: "前往 Anlassraum 列表",
    linkToAcquisition: "前往获客面板",
    sourceConfigTitle: "Signal 来源配置（Feed 引用）",
    loadingConfig: "正在加载配置...",
    feedRowsLabel: "Feed 条目",
    globalLabel: "全局",
    colTopic: "主题",
    colSignalSource: "Signal 来源（Feed URL）",
    pullAnalyzeTitle: "抓取 + 分析",
    pullAnalyzeLead: "抓取将 Signal 写入 `statement_candidates`；分析生成可审核的 `vote_drafts`。无直接发布路径。",
    scopeLabel: "范围",
    regionCodeOptional: "区域代码（可选）",
    regionCodeExamplePlaceholder: "例如 DE:BE",
    maxItemsPerFeed: "每个 Feed 最大条目",
    dryRunLabel: "演练模式（仅统计，不写入）",
    fetchSignalSources: "获取 Signal 来源",
    pullRunning: "抓取进行中...",
    pullErrorPrefix: "抓取",
    analyzeLimit: "分析上限",
    startAnalyze: "开始分析",
    analyzeRunning: "分析进行中...",
    analyzeErrorPrefix: "分析",
    batchTitle: "Signal 批量导入（维护）",
    startImport: "开始导入",
    importRunning: "导入进行中...",
  },
  feedDrafts: {
    ...EN.feedDrafts,
    headerKicker: "Admin · Feed 管道",
    headerTitle: "Signal 草稿：Anlassraum-first 队列",
    headerLead:
      "核心操作路径：Signal -> Anlassraum -> Dossier -> output。Feed 提供线索，不提供直接发布逻辑。主来源始终是事实基础。",
    linkToFeedControl: "前往 Feed 控制台",
    linkToAnlassraumList: "前往 Anlassraum 列表",
    linkToAnlassraumOps: "前往 Anlassraum 运营",
    linkToCreateFastPath: "4）通过 /create 手动继续",
    decisioningLeadPrefix: "操作员决策路径",
    candidateFilters: "候选筛选",
    regionAll: "全部区域",
    regionGlobal: "全局 / 开放",
    regionEu: "欧盟 / 欧洲",
    searchPlaceholder: "按标题、摘要、主来源搜索",
    anlassraumFilterActive: "Anlassraum 筛选已启用",
    candidatesTitle: "候选列表",
    candidatesLead: "聚焦每条草稿的下一步安全动作：核验上下文、关联 Anlassraum 或一致地完成审核。",
    summaryHits: "当前命中",
    summaryUnlinked: "未关联 Anlassraum",
    summaryWeak: "弱 Signal",
    summaryHighPriority: "高优先级",
    tableQueueContext: "队列上下文",
    tableNextStep: "下一步",
    selectAllAriaLabel: "全选",
    selectDraftAriaPrefix: "草稿",
    loadingDrafts: "正在加载草稿...",
    emptyDraftsPrefix: "当前筛选下没有草稿。请检查筛选是否过严，或打开",
    emptyDraftsMiddle: "Feed 控制台",
    emptyDraftsSuffix: "或通过以下入口手动启动 Anlassraum intake",
    pendingLabel: "待处理",
    weakLabel: "较弱",
    reasonsLabel: "原因",
    lastActionLabel: "最后操作",
    linkedLabel: "已关联",
    unlinkedLabel: "未关联",
    openAnlassraum: "打开 Anlassraum",
    checkAnlassraumContext: "检查 Anlassraum 上下文",
    weakSignalLabel: "弱 Signal",
    noteLabel: "备注",
    draftDetailLink: "查看草稿详情",
    manualCreateLink: "通过 /create 手动继续",
    primarySourceLabel: "主来源",
    signalTrailLabel: "Signal 轨迹",
    signalTrailCandidate: "Feed 候选",
    analysisLabel: "分析",
    sourceOpenLabel: "开放",
    bulkSummaryPrefix: "批量审核（次级）",
    selectedSuffix: "已选",
    bulkLead: "对多个 Signal 执行批量动作。无自动发布、无自动批准。",
    bulkWeakReasonPlaceholder: "弱 Signal 原因（可选）",
    bulkReviewNotePlaceholder: "审核备注（可选）",
    applyBulk: "应用批量动作",
    applying: "执行中...",
    legacySummary: "Legacy 回填（次级维护例外）",
    legacyColDraft: "草稿",
    legacyColQueue: "队列/分诊",
    legacyColRemediation: "修复",
    loadingLegacy: "正在加载 legacy 草稿...",
    queueLabel: "队列",
    priorityLabel: "优先级",
    openSinceLabel: "开放时长",
    hintsLabel: "提示",
    weakSignalLongLabel: "弱 Signal",
    noFlagLabel: "无标记",
    executedByLabel: "执行人",
    timestampLabel: "时间戳",
    remediationLabel: "修复",
    remediationNotePlaceholder: "修复备注（可选）",
    remediationAttach: "关联到 Anlassraum",
    remediationCreateCandidate: "创建 Anlassraum 候选",
    nextStepWeakTitle: "验证弱 Signal",
    nextStepWeakDetail: "通过 /create 手动验证不确定上下文并记录原因。",
    nextStepAttachTitle: "关联到现有 Anlassraum",
    nextStepCandidateTitle: "创建 Anlassraum 候选",
    nextStepReviewTitle: "完成审核",
    nextStepReviewDetail: "检查决策并以一致状态继续。",
    nextStepVerifyTitle: "验证候选",
    selectAtLeastOne: "请至少选择一条草稿。",
    attachNeedsAnlassraumId: "执行关联需要 Anlassraum ID。",
    bulkDonePrefix: "批量完成：",
    bulkDoneMiddle: "成功，",
    bulkDoneSuffix: "失败。",
    bulkFailedFallback: "批量审核失败。",
    legacyAttachNeedsAnlassraumId: "执行关联需要 Anlassraum ID。",
    unknownLoadError: "加载草稿时发生未知错误",
    unknownActionFallback: "操作",
  },
  anlassraumList: {
    ...EN.anlassraumList,
    headerKicker: "Admin · Signal 管道",
    headerLead:
      "Anlassräume 先对 Signals 进行结构化。相关性可以是本地、区域、全国或机构级；Dossier 汇总仍是可选且有意识的下一步。",
    linkToFeedControl: "前往 Feed 控制台",
    linkToAnlassraumOps: "前往 Anlassraum 运营",
    statusFilterPrefix: "状态",
    sourceModeFilterPrefix: "来源模式",
    colRegionTopic: "区域/主题",
    colOutputs: "输出",
    loading: "正在加载 Anlassräume...",
    empty: "未找到 Anlassraum。",
    scoreLabel: "评分",
    globalOpen: "全局 / 开放",
    dossierConsolidationLabel: "Dossier 汇总",
    sourcesLabel: "来源",
  },
  anlassraumDetail: {
    ...EN.anlassraumDetail,
    loading: "正在加载 Anlassraum...",
    notFound: "未找到",
    headerKicker: "Admin · Anlassraum",
    scoreLabel: "评分",
    relevanceLabel: "相关范围",
    originLabel: "来源",
    ownerLabel: "归属",
    publishGateLabel: "发布闸门",
    publishGateReleased: "已放行",
    publishGateBlocked: "已阻塞",
    requiredLabel: "需要",
    hintLabel: "提示",
    linkToCreate: "通过 /create 手动继续",
    linkToDraftQueue: "Feed 草稿队列",
    linkToOverview: "返回概览",
    linkToDossier: "打开 Dossier 汇总",
    optionalDossierLead: "Anlassraum 保持为独立工作区。Dossier 汇总是有意识的可选后续步骤。",
    workspaceContext: "工作上下文",
    topicLabel: "主题",
    sourceSituationLabel: "来源情况",
    referencedSourceSuffix: "条已引用来源",
    outputTransitions: "输出流转",
    colOutputType: "输出类型",
    colStatus: "状态",
    colReviewState: "审核状态",
    colPublishTarget: "发布目标",
    colLastAction: "最后操作",
    colNextAction: "下一步操作",
    loadingOutputSeeds: "正在加载待处理输出...",
    emptyOutputSeeds: "暂无待处理输出。",
    publishTargetPlaceholder: "发布目标（仅手动发布）",
    reviewNotePlaceholder: "审核备注（可选）",
    apply: "应用",
    diagnosticsTitle: "诊断与 JSON（次级）",
    diagnosticsLead: "用于深度排查与故障诊断的审计输出。主要操作流保持在上方。",
    metaJsonTitle: "元数据",
    sourcesJsonTitle: "来源 JSON",
    structureJsonTitle: "结构 JSON",
    publishGateEvidenceTitle: "发布闸门证据",
    sourcePrefix: "来源",
    sourceNoMetaSuffix: "无可读元数据",
    sourceNoTitleOrUrlSuffix: "无标题/URL",
    actionCurate: "开始整理",
    actionReview: "移至审核",
    actionApprove: "批准",
    actionActivate: "激活",
    actionArchive: "归档",
    operatorFocusNeedsSourcesTitle: "先确保来源情况",
    operatorFocusNeedsSourcesPrefix: "发布仍被阻塞",
    operatorFocusNeedsSourcesMiddle: "来源",
    operatorFocusNeedsSourcesSuffix: "请先结构化 Anlassraum 并核验主来源，再继续汇总/发布。",
    operatorFocusHasDossierTitle: "保持 Anlassraum 稳定并有意识地继续汇总",
    operatorFocusHasDossierDetail: "已关联 Dossier。请持续维护 Anlassraum 上下文，并有意识地推进汇总。",
    operatorFocusContinueTitle: "继续结构化 Anlassraum",
    operatorFocusContinueDetail: "继续完善 Anlassraum 中的 Signal 与来源上下文；Dossier 汇总仍是可选且有意识的下一步。",
    transitionFailed: "流转失败",
    outputTransitionFailed: "输出流转失败",
  },
};

const OPERATOR_TEXTS: Record<OperatorLocale, OperatorTexts> = {
  de: DE,
  en: EN,
  es: ES,
  fr: FR,
  zh: ZH,
};

export function getOperatorSystemTexts(locale: OperatorLocale): OperatorTexts {
  return OPERATOR_TEXTS[locale];
}
