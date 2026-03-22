import type { SupportedLocale } from "@/config/locales";
import type { SignalToAnlassraumPath } from "@features/feeds/signalDecisioning";
import type { FeedReviewState, VoteDraftStatus } from "@features/feeds/types";

export type OperatorLocale = "de" | "en";

export function resolveOperatorLocale(locale: SupportedLocale | string | null | undefined): OperatorLocale {
  return locale === "en" ? "en" : "de";
}

function humanizeToken(token: string): string {
  return token
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

type OperatorTexts = {
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
    colRegion: string;
    colTopic: string;
    colSignalSource: string;
    pullAnalyzeTitle: string;
    pullAnalyzeLead: string;
    scopeLabel: string;
    regionCodeOptional: string;
    maxFeeds: string;
    maxItemsPerFeed: string;
    dryRunLabel: string;
    fetchSignalSources: string;
    pullRunning: string;
    analyzeLimit: string;
    startAnalyze: string;
    analyzeRunning: string;
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
    freeStartKicker: "Create Freistart",
    freeStartHeadline: "Freistart für Anlassraum- und Dossier-Flows",
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
    contextPickerTitle: "Kontext-Picker",
    contextPickerLead:
      "Optional: Wähle einen bestehenden Anlassraum als Kontext. Kontext kann später auch als Match-/Routing-Ergebnis sichtbar werden. Keine automatische Verlinkung, kein Auto-Publish, kein Auto-Merge.",
    loadingContextList: "Lade produktive Kontextliste ...",
    contextUnavailable: "Kontextquelle derzeit nicht verfügbar",
    reload: "Erneut laden",
    contextEmpty: "Keine produktiven Kontext-Einträge verfügbar. Es wird kein Demo-/Static-Fallback genutzt.",
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
    goToRounds: "Zu /runden",
    srOnlyCreate: "Erstellen",
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
    colRegion: "Region",
    colTopic: "Thema",
    colSignalSource: "Signalquelle (Feed-URL)",
    pullAnalyzeTitle: "Abruf + Analyse",
    pullAnalyzeLead:
      "Abruf lädt Signale in `statement_candidates`; Analyse erzeugt daraus prüfbare `vote_drafts`. Kein direkter Publish-Pfad.",
    scopeLabel: "Relevanzraum",
    regionCodeOptional: "Regionscode (optional)",
    maxFeeds: "Max. Feeds",
    maxItemsPerFeed: "Max. Einträge pro Feed",
    dryRunLabel: "Dry-Run (nur zählen, nicht schreiben)",
    fetchSignalSources: "Signalquellen abrufen",
    pullRunning: "Pull läuft ...",
    analyzeLimit: "Analyse-Limit",
    startAnalyze: "Analyse starten",
    analyzeRunning: "Analyse läuft ...",
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
    contextPickerTitle: "Context picker",
    contextPickerLead:
      "Optional: choose an existing Anlassraum as context. Context can later appear as a match/routing result. No automatic linking, no auto publish, no auto merge.",
    loadingContextList: "Loading production context list ...",
    contextUnavailable: "Context source currently unavailable",
    reload: "Reload",
    contextEmpty: "No production context entries available. No demo/static fallback is used.",
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
    colRegion: "Region",
    colTopic: "Topic",
    colSignalSource: "Signal source (feed URL)",
    pullAnalyzeTitle: "Pull + analyze",
    pullAnalyzeLead:
      "Pull loads signals into `statement_candidates`; analyze generates reviewable `vote_drafts`. No direct publish path.",
    scopeLabel: "Scope",
    regionCodeOptional: "Region code (optional)",
    maxFeeds: "Max feeds",
    maxItemsPerFeed: "Max items per feed",
    dryRunLabel: "Dry run (count only, do not write)",
    fetchSignalSources: "Fetch signal sources",
    pullRunning: "Pull running ...",
    analyzeLimit: "Analyze limit",
    startAnalyze: "Start analysis",
    analyzeRunning: "Analyze running ...",
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

const OPERATOR_TEXTS: Record<OperatorLocale, OperatorTexts> = {
  de: DE,
  en: EN,
};

export function getOperatorSystemTexts(locale: OperatorLocale): OperatorTexts {
  return OPERATOR_TEXTS[locale];
}

export function formatDecisionPathLabel(path: SignalToAnlassraumPath, locale: OperatorLocale): string {
  const map: Record<SignalToAnlassraumPath, string> = {
    ignore: locale === "en" ? "Ignore" : "Ignorieren",
    attach_to_existing_anlassraum: locale === "en" ? "Link to Anlassraum" : "Mit Anlassraum verknüpfen",
    create_anlassraum_candidate: locale === "en" ? "Create an Anlassraum candidate" : "Anlassraum-Kandidat anlegen",
    manual_fast_path_via_create: locale === "en" ? "Manual via /create" : "Manuell via /create",
  };
  return map[path];
}

export function formatFeedReviewStateLabel(state: FeedReviewState | "all", locale: OperatorLocale): string {
  if (state === "all") return locale === "en" ? "All queue states" : "Alle Warteschlangen-Zustände";
  const map: Record<FeedReviewState, string> = {
    queued: locale === "en" ? "Queued" : "In Warteschlange",
    ignored: locale === "en" ? "Ignored" : "Ignoriert",
    attached: locale === "en" ? "Linked" : "Verknüpft",
    candidate_created: locale === "en" ? "Candidate created" : "Kandidat angelegt",
    weak_signal: locale === "en" ? "Weak signal" : "Schwaches Signal",
  };
  return map[state];
}

export function formatVoteDraftStatusLabel(status: VoteDraftStatus | "all", locale: OperatorLocale): string {
  if (status === "all") return locale === "en" ? "All" : "Alle";
  const map: Record<VoteDraftStatus, string> = {
    draft: locale === "en" ? "Draft" : "Entwurf",
    review: locale === "en" ? "Review" : "Prüfung",
    published: locale === "en" ? "Published" : "Veröffentlicht",
    discarded: locale === "en" ? "Discarded" : "Verworfen",
  };
  return map[status];
}

export function formatPriorityBucketLabel(bucket: "high" | "medium" | "low", locale: OperatorLocale): string {
  const map: Record<"high" | "medium" | "low", string> = {
    high: locale === "en" ? "High priority" : "Priorität hoch",
    medium: locale === "en" ? "Medium priority" : "Priorität mittel",
    low: locale === "en" ? "Low priority" : "Priorität niedrig",
  };
  return map[bucket];
}

export function formatQueueSortLabel(sort: string, locale: OperatorLocale): string {
  const map: Record<string, string> = {
    newest: locale === "en" ? "Newest first" : "Neueste zuerst",
    oldest: locale === "en" ? "Oldest first" : "Älteste zuerst",
    review_recent: locale === "en" ? "Recently reviewed" : "Zuletzt geprüft",
    review_stale: locale === "en" ? "Least recently reviewed" : "Lange nicht geprüft",
    priority_high: locale === "en" ? "Queue priority" : "Warteschlangen-Priorität",
  };
  return map[sort] ?? humanizeToken(sort);
}

export function formatLinkFilterLabel(value: string, locale: OperatorLocale): string {
  const map: Record<string, string> = {
    all: locale === "en" ? "All link states" : "Alle Verknüpfungszustände",
    linked: locale === "en" ? "Linked to Anlassraum" : "Mit Anlassraum verknüpft",
    unlinked: locale === "en" ? "Without Anlassraum" : "Ohne Anlassraum",
  };
  return map[value] ?? humanizeToken(value);
}

export function formatWeakSignalFilterLabel(value: string, locale: OperatorLocale): string {
  const map: Record<string, string> = {
    all: locale === "en" ? "All signal flags" : "Alle Signalmarkierungen",
    flagged: locale === "en" ? "Weak signal" : "Schwaches Signal",
    clear: locale === "en" ? "No weak signal" : "Kein schwaches Signal",
  };
  return map[value] ?? humanizeToken(value);
}

export function formatBulkActionLabel(value: string, locale: OperatorLocale): string {
  const map: Record<string, string> = {
    ignore: locale === "en" ? "1) Ignore (discard signal)" : "1) Ignorieren (Signal verwerfen)",
    attach_to_anlassraum:
      locale === "en" ? "2) Link to existing Anlassraum" : "2) Mit bestehendem Anlassraum verknüpfen",
    create_anlassraum_candidate:
      locale === "en" ? "3) Create an Anlassraum candidate" : "3) Anlassraum-Kandidat anlegen",
    mark_as_weak_signal: locale === "en" ? "Mark as weak signal" : "Als schwaches Signal markieren",
  };
  return map[value] ?? humanizeToken(value);
}

export function formatOutputActionLabel(value: string, locale: OperatorLocale): string {
  const map: Record<string, string> = {
    queue: locale === "en" ? "Move to queue" : "In Warteschlange setzen",
    send_to_review: locale === "en" ? "Send to review" : "Zur Prüfung senden",
    approve_prep: locale === "en" ? "Approve prep" : "Vorbereitet freigeben",
    reject_prep: locale === "en" ? "Reject prep" : "Vorbereitung ablehnen",
    mark_ready: locale === "en" ? "Mark as ready" : "Als bereit markieren",
    publish: locale === "en" ? "Manual publish" : "Manuell publizieren",
    discard: locale === "en" ? "Discard" : "Verwerfen",
    reset_draft: locale === "en" ? "Reset to draft" : "Auf Draft zurücksetzen",
  };
  return map[value] ?? humanizeToken(value);
}

export function formatOutputSeedStatusLabel(value: string, locale: OperatorLocale): string {
  const map: Record<string, string> = {
    draft: locale === "en" ? "Draft" : "Entwurf",
    queued: locale === "en" ? "Queued" : "In Warteschlange",
    review: locale === "en" ? "In review" : "In Prüfung",
    ready: locale === "en" ? "Ready" : "Bereit",
    published: locale === "en" ? "Published" : "Veröffentlicht",
    discarded: locale === "en" ? "Discarded" : "Verworfen",
  };
  return map[value] ?? humanizeToken(value);
}

export function formatOutputSeedReviewStateLabel(value: string, locale: OperatorLocale): string {
  const map: Record<string, string> = {
    queued: locale === "en" ? "Queued" : "In Warteschlange",
    in_review: locale === "en" ? "In review" : "In Prüfung",
    approved: locale === "en" ? "Approved" : "Freigegeben",
    rejected: locale === "en" ? "Rejected" : "Abgelehnt",
    blocked: locale === "en" ? "Blocked" : "Blockiert",
    none: locale === "en" ? "None" : "Kein Prüfstatus",
  };
  return map[value] ?? humanizeToken(value);
}

export function formatBooleanLabel(value: boolean, locale: OperatorLocale): string {
  return locale === "en" ? (value ? "yes" : "no") : value ? "ja" : "nein";
}

export function formatOpenLabel(locale: OperatorLocale): string {
  return locale === "en" ? "open" : "offen";
}
