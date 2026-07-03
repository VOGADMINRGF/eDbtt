import {
  readRundenEntryCanonReadModel,
  type RundenEntryCanonReadModel,
} from "@/features/surfaces/runden/rundenEntryCanon";
import {
  buildCreateAiOrchestrationProvenanceTrace,
  buildRundenAiOrchestrationProvenanceTrace,
  type AiOrchestrationProvenanceTraceStep,
  type CreateAnalyzeRuntimeTrace,
  type CreatePlannerRuntimeTrace,
} from "@/features/create/aiOrchestrationProvenanceTrace";
import type { CreateIntakeContext } from "@/features/create/intakeContext";
import type { CreateIntelligentFollowupResult } from "@/features/create/intelligentFollowupContract";
import type { NormalizedMaterialItem } from "@/features/create/materialRouting";
import type {
  RundenCreateHandoffIntegrityState,
  RundenCreateHandoffIntegrityStatus,
} from "@/features/create/rundenCreateHandoffIntegrity";
import type { ManualAnlassraumServerDraftSnapshot } from "@/features/surfaces/runden/manualAnlassraumSetup";

export type FrontendAiTransparencySurface = "/runden/new" | "/create";

export type FrontendAiTransparencyStatus =
  | "not_started"
  | "running"
  | "completed"
  | "skipped_no_ai"
  | "review_required"
  | "planned_not_active";

export type FrontendAiTransparencyStep = {
  id: string;
  label: string;
  status: FrontendAiTransparencyStatus;
  detail: string;
};

export type FrontendAiTransparencyReadModel = {
  surface: FrontendAiTransparencySurface;
  title: string;
  summary: string;
  steps: FrontendAiTransparencyStep[];
  traceSteps: AiOrchestrationProvenanceTraceStep[];
  visibleNow: string[];
  hiddenByPolicy: string[];
  futurePathNotes: string[];
};

export type CreateFrontendAiTransparencyInput = {
  hasStarted: boolean;
  isStarting: boolean;
  hasIntelligentFollowup: boolean;
  showAnalyzeWorkspace: boolean;
  isRetryPlannerPending: boolean;
  fromManualAnlassraumContinueCreate: boolean;
  startBusyStatusLabel: string;
  rundenCreateHandoffStatus?: RundenCreateHandoffIntegrityStatus | null;
  rundenCreateHandoffDetail?: string | null;
  rundenCreateHandoff?: RundenCreateHandoffIntegrityState | null;
  initialText?: string | null;
  intakeContext?: CreateIntakeContext | null;
  draftId?: string | null;
  dossierId?: string | null;
  anlassraumId?: string | null;
  plannerResult?: CreateIntelligentFollowupResult | null;
  plannerTrace?: CreatePlannerRuntimeTrace | null;
  analyzeTrace?: CreateAnalyzeRuntimeTrace | null;
  materialItems?: NormalizedMaterialItem[] | null;
  hasCandidatePreview?: boolean;
};

const FRONTEND_AI_STATUS_LABELS: Record<FrontendAiTransparencyStatus, string> = {
  not_started: "Noch nicht gestartet",
  running: "Läuft gerade",
  completed: "Abgeschlossen",
  skipped_no_ai: "Keine KI aktiv",
  review_required: "Bleibt im Review",
  planned_not_active: "Geplant, nicht aktiv",
};

export function getFrontendAiTransparencyStatusLabel(status: FrontendAiTransparencyStatus) {
  return FRONTEND_AI_STATUS_LABELS[status];
}

export function buildRundenFrontendAiTransparencyReadModel(
  canon: RundenEntryCanonReadModel = readRundenEntryCanonReadModel(),
  serverDraft?: ManualAnlassraumServerDraftSnapshot | null,
): FrontendAiTransparencyReadModel {
  const noAiAction = canon.actions.find((action) => action.id === "without_ai_save");
  const aiAction = canon.actions.find((action) => action.id === "with_ai_continue");

  return {
    surface: "/runden/new",
    title: "Welche KI hier greift oder bewusst nicht greift",
    summary:
      "Auf /runden/new bleibt dein Arbeitsstand zuerst ein Entwurf. KI startet nur, wenn du später bewusst in /create weitergehst.",
    steps: [
      {
        id: "without_ai_save",
        label: noAiAction?.label ?? "Ohne KI speichern",
        status: "skipped_no_ai",
        detail:
          "Entwurf wird gespeichert. Kein AI-Usage-Event, kein DeepSearch und kein automatischer KI-Lauf.",
      },
      {
        id: "with_ai_continue",
        label: aiAction?.label ?? "Mit KI in /create weiter",
        status: "planned_not_active",
        detail:
          "Bereitet nur den Wechsel nach /create vor. Analyse und Planner starten erst dort nach deiner bewussten Aktion.",
      },
      {
        id: "review_guardrail",
        label: "Ergebnis bleibt im Review",
        status: "review_required",
        detail:
          "Anlassraum, Dossier und Beteiligungsraum entstehen später über bewusste Review- und Runtime-Pfade.",
      },
      {
        id: "auto_publish_guardrail",
        label: "Nichts wird automatisch veröffentlicht",
        status: "review_required",
        detail:
          "Der Entwurf bleibt offline und nicht amtlich, bis ein späterer Review-Pfad ihn ausdrücklich weiterführt.",
      },
    ],
    traceSteps: buildRundenAiOrchestrationProvenanceTrace({
      serverDraft,
    }),
    visibleNow: [
      "Entwurfsspeicherung mit klarer No-AI-Trennung",
      "Bewusster Wechsel in /create statt stiller KI-Automation",
      "Review-first und No-Auto-Publish-Guardrails",
    ],
    hiddenByPolicy: [
      "Keine internen Modell- oder Zugangsdaten",
      "Keine Debugmeldungen oder Fehlerdetails",
    ],
    futurePathNotes: [
      "Mehr Transparenz für spätere Analyse-, Review- und Folgeschritte kommt erst, nachdem die jeweiligen Nutzerwege dort wirklich sichtbar geschlossen sind.",
      "Spätere Claims, Fragen, Feed-Anreicherung, Social-Drafts und Voxy-Briefings starten hier nicht automatisch.",
    ],
  };
}

export function buildCreateFrontendAiTransparencyReadModel(
  input: CreateFrontendAiTransparencyInput,
): FrontendAiTransparencyReadModel {
  const plannerStatus: FrontendAiTransparencyStatus =
    input.isStarting || input.isRetryPlannerPending
      ? "running"
      : input.hasIntelligentFollowup
        ? "completed"
        : "not_started";
  const analyzeStatus: FrontendAiTransparencyStatus = input.showAnalyzeWorkspace
    ? "running"
    : "planned_not_active";
  const candidatePreviewStatus: FrontendAiTransparencyStatus = input.hasCandidatePreview
    ? "review_required"
    : "planned_not_active";

  return {
    surface: "/create",
    title: "Welche KI im aktuellen Schritt sichtbar arbeitet",
    summary: input.fromManualAnlassraumContinueCreate
      ? "Du bist im KI-gestützten Folgeschritt eines manuellen Anlassraum-Entwurfs. Analyse startet erst nach deinem bewussten Start."
      : "Auf /create kann KI deinen Text einordnen und nächste Schritte vorbereiten. Alles bleibt review-first und ohne automatische Veröffentlichung.",
    steps: [
      ...(input.fromManualAnlassraumContinueCreate
        ? [
            {
              id: "runden_draft_handoff",
              label: "Entwurf aus /runden/new übernehmen",
              status:
                input.rundenCreateHandoffStatus === "loaded"
                  ? ("completed" as const)
                  : input.rundenCreateHandoffStatus === "missing" ||
                      input.rundenCreateHandoffStatus === "invalid" ||
                      input.rundenCreateHandoffStatus === "not_requested"
                    ? ("review_required" as const)
                    : ("planned_not_active" as const),
              detail:
                input.rundenCreateHandoffDetail ??
                "Für diesen Übergang liegt noch keine belastbare serverseitige Draft-Wahrheit vor.",
            },
          ]
        : []),
      {
        id: "planner_preparation",
        label: "Nächste Schritte vorbereiten",
        status: plannerStatus,
        detail:
          plannerStatus === "running"
            ? `${input.startBusyStatusLabel} Ergebnis bleibt ein Entwurf und braucht weiter deine Bestätigung.`
            : plannerStatus === "completed"
              ? "Die Einordnung und die nächsten Vorschläge wurden als Entwurf vorbereitet."
              : "Startet erst, wenn du den KI-gestützten Schritt bewusst auslöst.",
      },
      {
        id: "analyze_workspace",
        label: "Thema analysieren",
        status: analyzeStatus,
        detail:
          analyzeStatus === "running"
            ? "Die Analysefläche ist geöffnet und verarbeitet den aktuellen Entwurf im bestehenden Arbeitsbereich."
            : "Die Analysefläche ist vorbereitet, aber noch nicht aktiv.",
      },
      {
        id: "review_guardrail",
        label: "Ergebnis bleibt im Review",
        status: "review_required",
        detail:
          "Vorschläge, Handoffs und Folgepfade bleiben überprüfbar. Nichts wird still in Anlassraum, Dossier oder Beteiligungsraum veröffentlicht.",
      },
      {
        id: "auto_publish_guardrail",
        label: "Nichts wird automatisch veröffentlicht",
        status: "review_required",
        detail:
          "Es gibt keinen Auto-Publish-, Auto-Amtlichkeits- oder Auto-DeepSearch-Pfad in diesem Frontend-Schritt.",
      },
      {
        id: "later_followups",
        label: "Claims, Gegenpositionen, Fragen und mögliche Umfragen",
        status: candidatePreviewStatus,
        detail:
          candidatePreviewStatus === "review_required"
            ? "Eine review-first Kandidatenvorschau ist sichtbar. Sie bleibt Preview-only, schreibt nichts automatisch und veröffentlicht nichts."
            : "Folgepfade wie Claims, Umfragen, Feed-Anreicherung, Social-Drafts oder Voxy-Briefings entstehen erst später über separate Review- und Runtime-Schritte.",
      },
    ],
    traceSteps: buildCreateAiOrchestrationProvenanceTrace({
      initialText: input.initialText,
      intakeContext: input.intakeContext,
      draftId: input.draftId,
      dossierId: input.dossierId,
      anlassraumId: input.anlassraumId,
      handoff: input.rundenCreateHandoff,
      plannerResult: input.plannerResult,
      plannerTrace: input.plannerTrace,
      analyzeTrace: input.analyzeTrace,
      materialItems: input.materialItems,
      candidatePreviewAvailable: input.hasCandidatePreview,
    }),
    visibleNow: [
      "Startsignal für Planner und Analyse",
      "Review-first und No-Auto-Publish-Guardrails",
      "Ehrliche Trennung zwischen aktiv, vorbereitet und später",
      "Getypte Provenance-Spur für Draft, Planner, Analyze und spätere Folgepfade",
      ...(input.hasCandidatePreview
        ? ["Review-first Kandidatenvorschau für Claims, Gegenpositionen, Fragen und mögliche Umfragen"]
        : []),
    ],
    hiddenByPolicy: [
      "Keine internen Modell- oder Zugangsdaten",
      "Keine Debugmeldungen, Fehlerdetails oder versteckten Kostenbehauptungen",
      "Keine Prompts, Secrets, Rohlogs oder Stacktraces im Frontend",
    ],
    futurePathNotes: [
      "AI-Usage-, Cost- und Debit-Wahrheit bleiben in den bestehenden V3-Admin-Sichten dokumentiert und werden hier nicht simuliert.",
      "Downstream-Transparenz für Dossier-, Anlassraum- und Beteiligungsraum-Folgeflächen bleibt ein eigener Folgepfad.",
      "Modellnamen und technische Laufdetails werden nur dann sichtbar, wenn sie im Runtime-Kontext wirklich vorliegen und frontendsicher sind.",
    ],
  };
}
