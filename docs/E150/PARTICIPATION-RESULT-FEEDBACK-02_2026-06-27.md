# PARTICIPATION-RESULT-FEEDBACK-02

Datum: 2026-06-27
Status: erledigt

## Ziel

Einen kleinen, typed Participation Result Feedback Contract einführen, der eine spätere öffentliche
Ergebnis- oder Rückmeldeseite vorbereitet, ohne sie schon produktiv auszurollen und ohne irgendeine
Runtime-Automation einzuführen.

## Umgesetzter Contract

Datei:

- `apps/web/src/features/participation/resultFeedback.ts`

Enthalten:

- `ParticipationResultFeedback`
- `ParticipationResultFeedbackStatus`
- `ParticipationResultFeedbackSourceStatus`
- `ParticipationResultFeedbackTopicSummary`
- `ParticipationResultFeedbackMinorityPosition`
- `ParticipationResultFeedbackOpenQuestion`
- `ParticipationResultFeedbackNextStep`
- `isParticipationResultFeedbackPublishable(feedback)`
- `isParticipationResultFeedbackPublic(feedback)`
- `getParticipationResultFeedbackStatusLabel(status)`
- `getParticipationResultFeedbackSourceStatusLabel(status)`
- `requiresParticipationResultFeedbackReview(feedback)`
- `summarizeParticipationResultFeedbackReadiness(feedback)`

`impactStatus` nutzt den bestehenden `ParticipationImpactStatus` aus `impactStatus.ts`.

## Feedback-Statusmodell

- `draft`
- `in_review`
- `approved_for_public_feedback`
- `published_feedback`
- `archived`

Wichtig:

- `approved_for_public_feedback` ist nicht gleich `published_feedback`
- `published_feedback` ist nur durch expliziten Status öffentlich sichtbar

## Source-/Review-Statusmodell

- `unverified_input`
- `reviewed_summary`
- `dossier_bound`
- `external_feedback_received`
- `operator_reviewed`

Bedeutung:

- `unverified_input` darf nicht öffentlich als Fakt behauptet werden
- `reviewed_summary` heißt redaktionell geprüft, nicht amtlich bestätigt
- `dossier_bound` heißt an ein Dossier gebunden, nicht automatisch veröffentlicht
- `external_feedback_received` heißt Rückmeldung liegt vor, nicht Zustimmung
- `operator_reviewed` heißt menschlich geprüft, nicht politisch entschieden

## Readiness-/Publishability-Regeln

Öffentlich sichtbar:

- nur bei `feedbackStatus === "published_feedback"`

Publishable:

- nur bei `feedbackStatus === "approved_for_public_feedback"`
- `sourceStatus` darf nicht `unverified_input` sein
- `title` und `summary` müssen vorhanden sein
- mindestens eine `topicSummary` oder ein `nextStep` muss vorhanden sein

Wichtig:

- `published_feedback` entsteht nicht automatisch aus `approved_for_public_feedback`
- Publishability bedeutet nur Vorbereitungsreife, nicht Veröffentlichung

## Guardrails

- Feedback heißt Rückmeldung oder Einordnung, nicht Zustimmung
- Ergebnis heißt dokumentierter Stand, nicht politische Lösung
- TopicSummary heißt verdichtete Darstellung, nicht Löschung einzelner Stimmen
- MinorityPosition muss erhalten bleiben und darf nicht durch Mehrheitslogik verschwinden
- OpenQuestion bleibt sichtbar als offene Frage, nicht als Fehler
- kein Status löst Auto-Publish aus
- kein Status löst Auto-Dossier aus
- kein Status löst Auto-Anlassraum aus
- kein Status löst Auto-Graph aus
- kein Status behauptet amtliche Bewertung oder politische Entscheidung

## Validierung

Erfolgreich ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/participation-result-feedback-contract.test.ts`
- `pnpm -C apps/web run build`

## Bewusst out of scope

- keine große UI
- keine öffentliche Ergebnis- oder Feedback-Seite als Route
- keine Admin-Oberfläche
- keine Datenbankmigration
- keine Runtime-Persistenz
- keine externe Behörden- oder Verwaltungsintegration
- keine automatische Veröffentlichung
- keine automatische Dossier-Erzeugung
- keine automatische Anlassraum-Erzeugung
- keine automatische Graph-Erzeugung
- keine amtliche Entscheidungsbehauptung
