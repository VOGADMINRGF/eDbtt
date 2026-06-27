export const PARTICIPATION_IMPACT_STATUSES = [
  "submitted",
  "needs_clarification",
  "queued_for_review",
  "in_evaluation",
  "bundled",
  "addressed",
  "feedback_available",
  "closed_archived",
] as const;

export type ParticipationImpactStatus =
  (typeof PARTICIPATION_IMPACT_STATUSES)[number];

export type ParticipationImpactStatusMeta = {
  label: string;
  description: string;
  order: number;
  progress: number;
  terminal: boolean;
  guardrails: {
    noAutoPublish: true;
    noAutoDossier: true;
    noAutoAnlassraum: true;
    noAutoGraph: true;
    noAutomaticOfficialAssessment: true;
  };
};

const PARTICIPATION_IMPACT_GUARDRAILS =
  Object.freeze({
    noAutoPublish: true,
    noAutoDossier: true,
    noAutoAnlassraum: true,
    noAutoGraph: true,
    noAutomaticOfficialAssessment: true,
  }) satisfies ParticipationImpactStatusMeta["guardrails"];

const PARTICIPATION_IMPACT_STATUS_META: Record<
  ParticipationImpactStatus,
  ParticipationImpactStatusMeta
> = {
  submitted: {
    label: "Eingereicht",
    description:
      "Der Beitrag liegt als eingereichter Arbeitsstand vor, ohne automatische Veröffentlichung oder automatische Weiterleitung.",
    order: 0,
    progress: 5,
    terminal: false,
    guardrails: PARTICIPATION_IMPACT_GUARDRAILS,
  },
  needs_clarification: {
    label: "Rückfrage offen",
    description:
      "Vor der Weiterbearbeitung wird eine gezielte Rückfrage benötigt. Das ist ein Klärungsschritt, keine Abwertung des Beitrags.",
    order: 1,
    progress: 15,
    terminal: false,
    guardrails: PARTICIPATION_IMPACT_GUARDRAILS,
  },
  queued_for_review: {
    label: "Zur Prüfung vorgemerkt",
    description:
      "Der Beitrag ist für einen review-first Prüfpfad vorgemerkt, ohne dass daraus schon Veröffentlichung, Dossier oder Anlassraum entsteht.",
    order: 2,
    progress: 30,
    terminal: false,
    guardrails: PARTICIPATION_IMPACT_GUARDRAILS,
  },
  in_evaluation: {
    label: "In Auswertung",
    description:
      "Der Beitrag wird redaktionell oder organisatorisch ausgewertet. Der Status sagt nichts über Wahrheit, Zustimmung oder amtliche Entscheidung aus.",
    order: 3,
    progress: 45,
    terminal: false,
    guardrails: PARTICIPATION_IMPACT_GUARDRAILS,
  },
  bundled: {
    label: "Gebündelt",
    description:
      "Der Beitrag wurde mit ähnlichen Beiträgen zusammengeführt oder verdichtet. Einzelne Stimmen werden dadurch nicht gelöscht oder entwertet.",
    order: 4,
    progress: 60,
    terminal: false,
    guardrails: PARTICIPATION_IMPACT_GUARDRAILS,
  },
  addressed: {
    label: "Adressiert",
    description:
      "Der Beitrag wurde redaktionell oder organisatorisch adressiert. Das bedeutet nicht, dass das Anliegen politisch gelöst oder amtlich bestätigt ist.",
    order: 5,
    progress: 75,
    terminal: false,
    guardrails: PARTICIPATION_IMPACT_GUARDRAILS,
  },
  feedback_available: {
    label: "Rückmeldung vorhanden",
    description:
      "Es liegt eine Rückmeldung oder Einordnung vor. Das bedeutet weder Zustimmung noch Veröffentlichung oder inhaltliche Übernahme.",
    order: 6,
    progress: 90,
    terminal: false,
    guardrails: PARTICIPATION_IMPACT_GUARDRAILS,
  },
  closed_archived: {
    label: "Abgeschlossen / archiviert",
    description:
      "Der Vorgang ist abgeschlossen oder archiviert. Das bedeutet nicht, dass der Inhalt entwertet, widerlegt oder politisch erledigt ist.",
    order: 7,
    progress: 100,
    terminal: true,
    guardrails: PARTICIPATION_IMPACT_GUARDRAILS,
  },
};

const ALLOWED_TRANSITIONS: Record<
  ParticipationImpactStatus,
  ParticipationImpactStatus[]
> = {
  submitted: [
    "needs_clarification",
    "queued_for_review",
    "closed_archived",
  ],
  needs_clarification: [
    "submitted",
    "queued_for_review",
    "closed_archived",
  ],
  queued_for_review: [
    "in_evaluation",
    "needs_clarification",
    "closed_archived",
  ],
  in_evaluation: [
    "bundled",
    "addressed",
    "needs_clarification",
    "closed_archived",
  ],
  bundled: [
    "addressed",
    "feedback_available",
    "closed_archived",
  ],
  addressed: ["feedback_available", "closed_archived"],
  feedback_available: ["closed_archived"],
  closed_archived: [],
};

export function getParticipationImpactStatusMeta(
  status: ParticipationImpactStatus,
): ParticipationImpactStatusMeta {
  return PARTICIPATION_IMPACT_STATUS_META[status];
}

export function getParticipationImpactStatusLabel(
  status: ParticipationImpactStatus,
): string {
  return getParticipationImpactStatusMeta(status).label;
}

export function getParticipationImpactStatusDescription(
  status: ParticipationImpactStatus,
): string {
  return getParticipationImpactStatusMeta(status).description;
}

export function isParticipationImpactStatusTerminal(
  status: ParticipationImpactStatus,
): boolean {
  return getParticipationImpactStatusMeta(status).terminal;
}

export function canTransitionParticipationImpactStatus(
  from: ParticipationImpactStatus,
  to: ParticipationImpactStatus,
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}
