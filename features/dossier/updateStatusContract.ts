export const DOSSIER_UPDATE_STATUSES = [
  "update_suggested",
  "source_hint_added",
  "claim_hint_added",
  "perspective_hint_added",
  "question_hint_added",
  "needs_review",
  "accepted",
  "attached_to_dossier",
  "published_in_dossier",
  "superseded",
  "archived",
  "rejected",
  "error",
] as const;

export type DossierUpdateStatus = (typeof DOSSIER_UPDATE_STATUSES)[number];

export const DOSSIER_UPDATE_SECTIONS = [
  "sources",
  "claim",
  "perspective",
  "question",
  "update",
  "result",
] as const;

export type DossierUpdateSection = (typeof DOSSIER_UPDATE_SECTIONS)[number];

export const DOSSIER_UPDATE_ORIGINS = [
  "create",
  "feed",
  "swipe",
  "anlassraum",
  "evidence",
  "manual",
] as const;

export type DossierUpdateOrigin = (typeof DOSSIER_UPDATE_ORIGINS)[number];

type DossierUpdateStatusMeta = {
  label: string;
  description: string;
  tone: "neutral" | "info" | "warning" | "success" | "danger";
};

const STATUS_META: Record<DossierUpdateStatus, DossierUpdateStatusMeta> = {
  update_suggested: {
    label: "Update vorgeschlagen",
    description: "Ein neuer Hinweis liegt vor und wartet auf bewusste Prüfung.",
    tone: "info",
  },
  source_hint_added: {
    label: "Quelle in Prüfung",
    description: "Ein neuer Quellenhinweis wurde aufgenommen, aber noch nicht freigegeben.",
    tone: "warning",
  },
  claim_hint_added: {
    label: "Claim in Prüfung",
    description: "Ein neuer Claim-Hinweis ist sichtbar, aber noch nicht als Dossierstand übernommen.",
    tone: "warning",
  },
  perspective_hint_added: {
    label: "Perspektive ergänzt",
    description: "Eine weitere Sichtweise ist sichtbar und bleibt reviewpflichtig.",
    tone: "info",
  },
  question_hint_added: {
    label: "Offene Frage ergänzt",
    description: "Eine offene Frage wurde aufgenommen und wartet auf weitere Einordnung.",
    tone: "info",
  },
  needs_review: {
    label: "In Prüfung",
    description: "Dieser Vorschlag darf nicht still veröffentlicht werden und braucht Review.",
    tone: "warning",
  },
  accepted: {
    label: "Angenommen",
    description: "Der Vorschlag wurde angenommen und bleibt als nächster Arbeitsschritt sichtbar.",
    tone: "success",
  },
  attached_to_dossier: {
    label: "Im Dossier-Kontext",
    description: "Der Vorschlag ist dem Dossier zugeordnet, aber nicht automatisch amtlich.",
    tone: "success",
  },
  published_in_dossier: {
    label: "Veröffentlicht im Dossier",
    description: "Der Hinweis ist im öffentlichen Dossierstand sichtbar, ohne Wahrheitsprivileg zu behaupten.",
    tone: "success",
  },
  superseded: {
    label: "Durch neueren Stand ersetzt",
    description: "Ein neuerer Vorschlag oder Stand hat diesen Hinweis ersetzt.",
    tone: "neutral",
  },
  archived: {
    label: "Archiviert",
    description: "Der Hinweis bleibt dokumentiert, ist aber kein aktiver Arbeitsstand mehr.",
    tone: "neutral",
  },
  rejected: {
    label: "Abgelehnt",
    description: "Der Vorschlag wurde bewusst nicht in den Dossierpfad übernommen.",
    tone: "danger",
  },
  error: {
    label: "Fehler im Updatepfad",
    description: "Der Vorschlag konnte nicht sauber gelesen oder zugeordnet werden.",
    tone: "danger",
  },
};

export function dossierUpdateOriginLabel(origin: DossierUpdateOrigin): string {
  switch (origin) {
    case "create":
      return "Create";
    case "feed":
      return "Feed-Radar";
    case "swipe":
      return "Swipes";
    case "anlassraum":
      return "Anlassraum";
    case "evidence":
      return "Evidenzhinweis";
    case "manual":
    default:
      return "Manuell";
  }
}

export function dossierUpdateSectionLabel(section: DossierUpdateSection): string {
  switch (section) {
    case "sources":
      return "Quellenlage";
    case "claim":
      return "Claim";
    case "perspective":
      return "Perspektive";
    case "question":
      return "Offene Frage";
    case "update":
      return "Update";
    case "result":
    default:
      return "Ergebnisstand";
  }
}

export function resolveDossierUpdateStatusMeta(status: DossierUpdateStatus): DossierUpdateStatusMeta {
  return STATUS_META[status];
}

export function resolveDossierUpdateStatus(input: {
  moderationStatus?: "pending" | "accepted" | "rejected" | null;
  section?: DossierUpdateSection | null;
  publicVisible?: boolean;
  attachedToDossier?: boolean;
  superseded?: boolean;
  archived?: boolean;
  hasError?: boolean;
}): DossierUpdateStatus {
  if (input.hasError) return "error";
  if (input.archived) return "archived";
  if (input.superseded) return "superseded";
  if (input.moderationStatus === "rejected") return "rejected";
  if (input.moderationStatus === "accepted" && input.publicVisible) return "published_in_dossier";
  if (input.moderationStatus === "accepted" && input.attachedToDossier) return "attached_to_dossier";
  if (input.moderationStatus === "accepted") return "accepted";

  switch (input.section) {
    case "sources":
      return "source_hint_added";
    case "claim":
      return "claim_hint_added";
    case "perspective":
      return "perspective_hint_added";
    case "question":
      return "question_hint_added";
    case "update":
    case "result":
      return "update_suggested";
    default:
      return "needs_review";
  }
}
