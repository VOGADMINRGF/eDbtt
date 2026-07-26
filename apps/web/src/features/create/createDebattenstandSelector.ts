"use client";

import type { CreateAnalysisState } from "@/features/create/intelligentFollowupContract";

export type CreateDebattenstandStatusTone = "neutral" | "positive" | "warning" | "danger";

export type CreateDebattenstandTopicState =
  | "default"
  | "focused"
  | "primary"
  | "grouped"
  | "parked";

export type CreateDebattenstandTopic = {
  label: string;
  state: CreateDebattenstandTopicState;
};

export type CreateDebattenstandModel = {
  phaseLabel: string;
  phaseDetail: string;
  progressLabel: string;
  nextStepLabel: string;
  nextStepDetail: string;
  openDecisionLabel: string;
  sourceStatusLabel: string;
  sourceStatusDetail: string;
  analysisStatusLabel: string;
  analysisStatusDetail: string;
  validationStatusLabel: string;
  validationStatusDetail: string;
  errorLabel: string | null;
  errorDetail: string | null;
  topicSummaryLabel: string;
  topicPreviewLabel: string;
  topicActionLabel: string | null;
  topicActionCount: number | null;
  visibleTopicCount: number;
  totalTopicCount: number;
  visibleTopics: CreateDebattenstandTopic[];
  hiddenTopicCount: number;
  statusTone: CreateDebattenstandStatusTone;
};

type CreateDebattenstandSelectorInput = {
  hasStarted: boolean;
  isStarting: boolean;
  understandingConfirmed: boolean;
  workspaceActionMode: "default" | "edit" | "source" | "manual_topic";
  analysisState: CreateAnalysisState;
  sourceKind: "text" | "link" | "document";
  hasSourceMaterial: boolean;
  requestedSourceReview: boolean;
  activeTopicLabel?: string | null;
  selectedPrimaryTopic?: string | null;
  groupedTopicLabels?: string[];
  parkedTopicLabels?: string[];
  allTopicLabels?: string[];
  visibleTopicLabels?: string[];
  compactTopicCount?: number;
};

function dedupeLabels(labels: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const label of labels) {
    const normalized = label.trim();
    if (!normalized) continue;
    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }
  return result;
}

function resolveTopicState(params: {
  label: string;
  activeTopicLabel?: string | null;
  selectedPrimaryTopic?: string | null;
  groupedTopicLabels: string[];
  parkedTopicLabels: string[];
}): CreateDebattenstandTopicState {
  if (params.selectedPrimaryTopic === params.label) return "primary";
  if (params.activeTopicLabel === params.label) return "focused";
  if (params.groupedTopicLabels.includes(params.label)) return "grouped";
  if (params.parkedTopicLabels.includes(params.label)) return "parked";
  return "default";
}

function resolveSourceLabels(input: CreateDebattenstandSelectorInput): {
  label: string;
  detail: string;
} {
  if (input.workspaceActionMode === "source" || input.requestedSourceReview) {
    return {
      label: "Quellenmodus geöffnet",
      detail: "Hinweise, Links oder Dokumente können jetzt bewusst ergänzt werden.",
    };
  }
  if (input.sourceKind === "document") {
    return {
      label: input.hasSourceMaterial ? "Dokument liegt vor" : "Dokument ausstehend",
      detail: input.hasSourceMaterial
        ? "Der Debattenstand bezieht ein Dokument als Grundlage ein."
        : "Es wurde noch kein Dokument geladen.",
    };
  }
  if (input.sourceKind === "link") {
    return {
      label: input.hasSourceMaterial ? "Link liegt vor" : "Link noch offen",
      detail: input.hasSourceMaterial
        ? "Der Debattenstand enthält einen Quellenhinweis aus dem Link."
        : "Ein Link kann optional als Quellenhinweis ergänzt werden.",
    };
  }
  return {
    label: input.hasSourceMaterial ? "Quelle ergänzt" : "Noch keine Quelle ergänzt",
    detail: input.hasSourceMaterial
      ? "Zusätzliche Hinweise oder Materialien sind vorhanden."
      : "Der Beitrag arbeitet bisher nur mit dem eingegebenen Text.",
  };
}

function resolveAnalysisLabels(input: CreateDebattenstandSelectorInput): {
  label: string;
  detail: string;
  errorLabel: string | null;
  errorDetail: string | null;
  statusTone: CreateDebattenstandStatusTone;
} {
  if (!input.hasStarted) {
    return {
      label: "Analyse ausstehend",
      detail: "Nach dem Start werden Thema, Kontext und nächste Schritte eingeordnet.",
      errorLabel: null,
      errorDetail: null,
      statusTone: "neutral",
    };
  }
  if (input.isStarting) {
    return {
      label: "Analyse läuft",
      detail: "Der Beitrag wird gerade eingeordnet.",
      errorLabel: null,
      errorDetail: null,
      statusTone: "neutral",
    };
  }
  if (input.analysisState === "fetch_failed" || input.analysisState === "ai_failed") {
    return {
      label: "Analyse blockiert",
      detail: "Noch keine validierten Themen. Du kannst ergänzen, speichern oder später fortsetzen.",
      errorLabel: "Retry nötig",
      errorDetail: "Der Debattenstand bleibt bewusst unvollständig, bis die Analyse erneut gelingt.",
      statusTone: "danger",
    };
  }
  if (input.analysisState === "entitlement_required" || input.analysisState === "link_detected") {
    return {
      label: "Analyse vorbereitet",
      detail: "Für eine belastbare Auswertung fehlt noch die bewusste Freigabe.",
      errorLabel: null,
      errorDetail: null,
      statusTone: "warning",
    };
  }
  return {
    label: "Analyse validiert",
    detail: "Themen und nächste Schritte stammen aus einem validierten Lauf.",
    errorLabel: null,
    errorDetail: null,
    statusTone: "positive",
  };
}

export function deriveCreateDebattenstandModel(
  input: CreateDebattenstandSelectorInput,
): CreateDebattenstandModel {
  const groupedTopicLabels = dedupeLabels(input.groupedTopicLabels ?? []);
  const parkedTopicLabels = dedupeLabels(input.parkedTopicLabels ?? []);
  const allTopicLabels = dedupeLabels(input.allTopicLabels ?? []);
  const visibleTopicLabels = dedupeLabels(
    input.visibleTopicLabels?.length ? input.visibleTopicLabels : allTopicLabels,
  );
  const compactTopicCount = Math.max(1, input.compactTopicCount ?? 4);
  const totalTopicCount = allTopicLabels.length;
  const visibleTopicCount = visibleTopicLabels.length;
  const hiddenTopicCount = Math.max(0, totalTopicCount - visibleTopicCount);
  const visibleTopics = visibleTopicLabels.map((label) => ({
    label,
    state: resolveTopicState({
      label,
      activeTopicLabel: input.activeTopicLabel,
      selectedPrimaryTopic: input.selectedPrimaryTopic,
      groupedTopicLabels,
      parkedTopicLabels,
    }),
  }));
  const sourceLabels = resolveSourceLabels(input);
  const analysisLabels = resolveAnalysisLabels(input);
  const phaseLabel = !input.hasStarted
    ? "Beitrag aufnehmen"
    : input.isStarting
      ? "Themen erkennen"
      : input.analysisState === "fetch_failed" || input.analysisState === "ai_failed"
        ? "Analyse blockiert"
        : !input.understandingConfirmed
          ? "Themenstruktur klären"
          : input.workspaceActionMode === "source"
            ? "Quellen ergänzen"
            : input.workspaceActionMode === "edit"
              ? "Aussage schärfen"
              : "Entwurf weiterführen";
  const phaseDetail = !input.hasStarted
    ? "Der Workspace wartet auf deinen Beitrag."
    : input.isStarting
      ? "Der Debattenstand wird aus dem aktuellen Beitrag abgeleitet."
      : !input.understandingConfirmed
        ? "Die Themenstruktur braucht noch deine bewusste Entscheidung."
        : input.workspaceActionMode === "source"
          ? "Quellen bleiben optional und starten nichts automatisch."
          : "Der Arbeitsstand kann jetzt gezielt weitergeführt werden.";
  const progressLabel = !input.hasStarted
    ? "0 von 5 Schritten sichtbar"
    : input.isStarting
      ? "2 von 5 Schritten aktiv"
      : !input.understandingConfirmed
        ? "3 von 5 Schritten aktiv"
        : input.workspaceActionMode === "source"
          ? "4 von 5 Schritten aktiv"
          : "5 von 5 Schritten vorbereitet";
  const nextStepLabel = !input.hasStarted
    ? "Beitrag prüfen"
    : input.isStarting
      ? "Analyse abwarten"
      : input.analysisState === "fetch_failed" || input.analysisState === "ai_failed"
        ? "Erneut versuchen oder speichern"
        : !input.understandingConfirmed
          ? "Themenstruktur bestätigen"
          : input.workspaceActionMode === "source"
            ? "Quellen prüfen"
            : input.workspaceActionMode === "manual_topic"
              ? "Themen anpassen"
              : input.workspaceActionMode === "edit"
                ? "Aussage schärfen"
                : groupedTopicLabels.length > 1
                  ? "Themen gemeinsam weiterführen"
                  : "Aussage schärfen";
  const nextStepDetail = !input.hasStarted
    ? "Noch kein Debattenstand ohne Startsignal."
    : input.analysisState === "fetch_failed" || input.analysisState === "ai_failed"
      ? "Der nächste sinnvolle Schritt bleibt sichtbar, ohne einen Scheinstatus zu erfinden."
      : !input.understandingConfirmed
        ? "Erst danach werden Quellenmodus oder Entwurf sinnvoll."
        : input.workspaceActionMode === "source"
          ? "Quellen bleiben bewusst nachgeordnet."
          : "Nur ein nächster Hauptschritt bleibt im Fokus.";
  const openDecisionLabel = !input.hasStarted
    ? "Offen: Beitrag starten"
    : input.isStarting
      ? "Offen: Analyse fertigstellen"
      : input.analysisState === "fetch_failed" || input.analysisState === "ai_failed"
        ? "Offen: erneute Analyse entscheiden"
        : !input.understandingConfirmed
          ? "Offen: Themen bestätigen"
          : input.workspaceActionMode === "source"
            ? "Offen: Quellen ergänzen oder ohne Quelle weitergehen"
            : "Offen: nächsten Bearbeitungsschritt wählen";
  const validationStatusLabel = !input.hasStarted
    ? "Noch kein validierter Stand"
    : input.analysisState === "fetch_failed" || input.analysisState === "ai_failed"
      ? "Validierung offen"
      : input.analysisState === "entitlement_required" || input.analysisState === "link_detected"
        ? "Validierung vorbereitet"
        : input.understandingConfirmed
          ? "Themen bestätigt"
          : "Themen erkannt";
  const validationStatusDetail = !input.hasStarted
    ? "Semantische Themen erscheinen erst nach einem validierten Lauf."
    : input.analysisState === "fetch_failed" || input.analysisState === "ai_failed"
      ? "Der Debattenstand zeigt ehrlich, dass noch keine bestätigte Themenlage vorliegt."
      : input.understandingConfirmed
        ? "Die Themenstruktur wurde bewusst bestätigt."
        : "Die Analyse hat Themen erkannt, wartet aber noch auf deine Bestätigung.";
  const topicSummaryLabel =
    totalTopicCount === 0
      ? "Noch keine validierten Themen"
      : totalTopicCount === 1
        ? "1 Thema erkannt"
        : `${totalTopicCount} Themen erkannt`;
  const compactPreviewCount = Math.min(compactTopicCount, totalTopicCount);
  const topicPreviewLabel =
    totalTopicCount === 0
      ? "Keine Themenvorschau vor validierter Analyse."
      : hiddenTopicCount > 0
        ? `${compactPreviewCount} von ${totalTopicCount} Themen sind sichtbar.`
        : `Alle ${totalTopicCount} Themen sind sichtbar.`;
  return {
    phaseLabel,
    phaseDetail,
    progressLabel,
    nextStepLabel,
    nextStepDetail,
    openDecisionLabel,
    sourceStatusLabel: sourceLabels.label,
    sourceStatusDetail: sourceLabels.detail,
    analysisStatusLabel: analysisLabels.label,
    analysisStatusDetail: analysisLabels.detail,
    validationStatusLabel,
    validationStatusDetail,
    errorLabel: analysisLabels.errorLabel,
    errorDetail: analysisLabels.errorDetail,
    topicSummaryLabel,
    topicPreviewLabel,
    topicActionLabel: hiddenTopicCount > 0 ? `Alle ${totalTopicCount} Themen anzeigen` : null,
    topicActionCount: hiddenTopicCount > 0 ? totalTopicCount : null,
    visibleTopicCount,
    totalTopicCount,
    visibleTopics,
    hiddenTopicCount,
    statusTone: analysisLabels.statusTone,
  };
}
