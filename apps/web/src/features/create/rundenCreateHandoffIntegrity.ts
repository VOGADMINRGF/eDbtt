import {
  getManualAnlassraumSignalTitle,
  type ManualAnlassraumServerDraftSnapshot,
} from "@/features/surfaces/runden/manualAnlassraumSetup";
import {
  normalizeCreateIntakeContextInput,
  type CreateIntakeContext,
} from "@/features/create/intakeContext";

export type RundenCreateHandoffIntegrityStatus =
  | "not_requested"
  | "loaded"
  | "missing"
  | "invalid";

export type RundenCreateHandoffIntegrityState = {
  status: RundenCreateHandoffIntegrityStatus;
  draftId: string | null;
  title: string;
  detail: string;
  usesServerDraft: boolean;
};

function isObjectIdLike(value: string | null | undefined) {
  return /^[a-f0-9]{24}$/i.test(String(value ?? "").trim());
}

export function resolveRundenCreateHandoffIntegrityState(input: {
  draftId?: string | null;
  serverDraft?: ManualAnlassraumServerDraftSnapshot | null;
}): RundenCreateHandoffIntegrityState {
  const draftId = String(input.draftId ?? "").trim() || null;
  if (!draftId) {
    return {
      status: "not_requested",
      draftId: null,
      title: "Kein serverseitiger Entwurf angefordert",
      detail:
        "Für diesen Übergang wurde noch kein serverseitiger Entwurf übernommen. Analyse und Planner arbeiten dann nur mit dem aktuell sichtbaren Text.",
      usesServerDraft: false,
    };
  }
  if (!isObjectIdLike(draftId)) {
    return {
      status: "invalid",
      draftId,
      title: "Draft-ID ist ungültig",
      detail:
        "Es wurde kein serverseitiger Entwurf übernommen. Wenn du von /runden/new kommst, öffne den Entwurf dort erneut und starte den KI-Schritt noch einmal bewusst.",
      usesServerDraft: false,
    };
  }
  if (input.serverDraft) {
    return {
      status: "loaded",
      draftId,
      title: "Serverseitiger Anlassraum-Entwurf übernommen",
      detail:
        "Der serverseitig gespeicherte Entwurf aus /runden/new wurde geladen. Analyse und Planner arbeiten mit diesem Entwurfstext weiter.",
      usesServerDraft: true,
    };
  }
  return {
    status: "missing",
    draftId,
    title: "Serverseitiger Anlassraum-Entwurf wurde nicht gefunden",
    detail:
      "Es gibt keine belastbare serverseitige Draft-Wahrheit zu dieser Draft-ID. Wenn ein lokaler Entwurf vorhanden ist, kannst du damit weiterarbeiten; Anlassraum- und Dossier-Folgepfade bleiben sonst unvollständig.",
    usesServerDraft: false,
  };
}

export function buildRundenCreateDraftIntakeContext(input: {
  context: CreateIntakeContext;
  draftId?: string | null;
  serverDraft?: ManualAnlassraumServerDraftSnapshot | null;
}): CreateIntakeContext {
  const draft = input.serverDraft;
  const signalTitle = draft
    ? getManualAnlassraumSignalTitle(draft.setup)
    : input.context.signalTitle;

  return normalizeCreateIntakeContextInput({
    ...input.context,
    source: input.context.source ?? (draft ? "runden" : null),
    signalTitle,
    sourceLabel:
      input.context.sourceLabel ??
      (draft ? "Anlassraum-Entwurf aus /runden/new" : null),
    draftId: input.draftId ?? input.context.draftId,
    reason: input.context.reason,
  });
}
