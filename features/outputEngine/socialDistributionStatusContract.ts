export const SOCIAL_DISTRIBUTION_V1_STATUSES = [
  "draft_created",
  "asset_generated",
  "needs_review",
  "review_requested",
  "approved",
  "queued",
  "scheduled_ready",
  "exported",
  "copied",
  "blocked",
  "archived",
  "error",
] as const;

export type SocialDistributionV1Status =
  (typeof SOCIAL_DISTRIBUTION_V1_STATUSES)[number];

export type SocialDistributionStatusMeta = {
  label: string;
  description: string;
  nextAction: string;
  tone: "neutral" | "info" | "warning" | "success" | "danger";
};

const STATUS_META: Record<SocialDistributionV1Status, SocialDistributionStatusMeta> = {
  draft_created: {
    label: "Entwurf erstellt",
    description: "Ein erster Kommunikationsentwurf liegt vor, ist aber noch nicht als Ausgabe vorbereitet.",
    nextAction: "Ausgabe prüfen und als CI-Entwurf vorbereiten.",
    tone: "neutral",
  },
  asset_generated: {
    label: "CI-Ausgabe vorbereitet",
    description: "Texte, Varianten oder QR-/Newsletter-Bausteine wurden vorbereitet, aber noch nicht reviewt.",
    nextAction: "Review-Hinweise prüfen und Folgepfad wählen.",
    tone: "info",
  },
  needs_review: {
    label: "Prüfung nötig",
    description: "Der Kommunikationsentwurf ist noch nicht freigegeben und braucht menschliche Prüfung.",
    nextAction: "Review-Notiz ergänzen oder in die Review-Queue geben.",
    tone: "warning",
  },
  review_requested: {
    label: "Prüfung angefordert",
    description: "Der Entwurf wurde bewusst in den Review-Pfad übergeben, aber noch nicht freigegeben.",
    nextAction: "Freigabe, Rückstellung oder Überarbeitung entscheiden.",
    tone: "warning",
  },
  approved: {
    label: "Freigegeben",
    description: "Die Ausgabe ist intern freigegeben, aber nicht extern veröffentlicht.",
    nextAction: "In Queue setzen, Export vorbereiten oder Planung festlegen.",
    tone: "success",
  },
  queued: {
    label: "In Queue",
    description: "Der Entwurf liegt in der Verteilungsqueue und wartet auf Planung oder Export.",
    nextAction: "Zeitfenster, Kanalreihenfolge oder Export entscheiden.",
    tone: "info",
  },
  scheduled_ready: {
    label: "Bereit zur Planung",
    description: "Der Entwurf ist planbar, aber noch nicht live gestellt oder extern verbunden.",
    nextAction: "Zeitpunkt intern festlegen oder Exportpaket erzeugen.",
    tone: "info",
  },
  exported: {
    label: "Exportiert",
    description: "Die Ausgabe wurde als Payload oder Paket exportiert, aber nicht automatisch veröffentlicht.",
    nextAction: "Extern nur manuell weiterverarbeiten.",
    tone: "success",
  },
  copied: {
    label: "Kopiert",
    description: "Text oder Payload wurde manuell übernommen, ohne externen Connector.",
    nextAction: "Nutzung dokumentieren oder wieder in Queue legen.",
    tone: "neutral",
  },
  blocked: {
    label: "Blockiert",
    description: "Policy, Review oder Scope blockieren die Weitergabe dieses Entwurfs.",
    nextAction: "Blocker klären oder Entwurf zurückstellen.",
    tone: "danger",
  },
  archived: {
    label: "Archiviert",
    description: "Der Entwurf bleibt nachvollziehbar, wird aber nicht weiter verteilt.",
    nextAction: "Nur bei Bedarf reaktivieren oder als Referenz belassen.",
    tone: "neutral",
  },
  error: {
    label: "Fehler",
    description: "Beim Erzeugen, Speichern oder Vorbereiten der Ausgabe ist ein Fehler aufgetreten.",
    nextAction: "Fehler prüfen und Entwurf erneut vorbereiten.",
    tone: "danger",
  },
};

export function getSocialDistributionStatusMeta(
  status: SocialDistributionV1Status,
): SocialDistributionStatusMeta {
  return STATUS_META[status];
}

export function socialDistributionStatusLabel(status: SocialDistributionV1Status): string {
  return getSocialDistributionStatusMeta(status).label;
}
