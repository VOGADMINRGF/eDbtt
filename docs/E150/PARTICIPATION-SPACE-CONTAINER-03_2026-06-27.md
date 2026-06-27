# PARTICIPATION-SPACE-CONTAINER-03

Datum: 2026-06-27
Status: erledigt

## Ziel

Einen kleinen, typed Participation Space / Vorhabenraum Contract einführen, der Beiträge, Statuslogik,
Feedback-Readiness und Cockpit-Arbeitslisten logisch bündelt, ohne schon eine große öffentliche Raum-UI,
Admin-Route, Persistenz, Map-Logik oder Workflow-Automation zu bauen.

## Umgesetzter Contract

Datei:

- `apps/web/src/features/participation/spaceContainer.ts`

Enthalten:

- `ParticipationSpace`
- `ParticipationSpaceStatus`
- `ParticipationSpaceVisibility`
- `ParticipationSpaceModule`
- `ParticipationSpaceLinkedItem`
- `ParticipationSpacePublicSummary`
- `ParticipationSpaceReadiness`
- `ParticipationSpaceGuardrails`
- `getParticipationSpaceStatusLabel(...)`
- `getParticipationSpaceVisibilityLabel(...)`
- `isParticipationSpacePublic(...)`
- `isParticipationSpaceIntakeOpen(...)`
- `isParticipationSpaceFeedbackPublic(...)`
- `requiresParticipationSpaceReview(...)`
- `canShowParticipationSpaceModule(...)`
- `summarizeParticipationSpaceReadiness(...)`
- `createEmptyParticipationSpace(...)`

Der Contract nutzt bestehende Typen aus:

- `apps/web/src/features/participation/impactStatus.ts`
- `apps/web/src/features/participation/resultFeedback.ts`
- `apps/web/src/features/participation/adminCockpit.ts`

## Space-Statusmodell

- `draft`
- `intake_open`
- `review_active`
- `feedback_prepared`
- `public_feedback_live`
- `closed_archived`

Wichtig:

- `feedback_prepared` ist nicht öffentlich.
- `public_feedback_live` bleibt ein explizit gesetzter Zustand.
- `closed_archived` heißt abgeschlossen oder archiviert, nicht entwertet.

## Visibility-Modell

- `private`
- `review_only`
- `public_read_only`
- `public_intake_open`
- `archived_public`

Wichtig:

- öffentlich ist nur `public_read_only`, `public_intake_open` oder `archived_public`
- `review_only` heißt nicht öffentlich
- Sichtbarkeit heißt nicht Prüfung oder Freigabe

## Module-Modell

- `topic_overview`
- `public_intake`
- `status_timeline`
- `result_feedback`
- `minority_positions`
- `open_questions`
- `next_steps`
- `operator_cockpit`
- `live_context`
- `dossier_references`

Wichtig:

- Module beschreiben nur verfügbare Container-Bausteine.
- `operator_cockpit` bleibt intern.
- `live_context` zeigt nur Kontext und startet kein Live-Event.
- `dossier_references` zeigt nur Referenzen und erzeugt kein Dossier.

## Linked-Item-Modell

Ein `ParticipationSpaceLinkedItem` trägt:

- `id`
- `title`
- `impactStatus`
- `feedbackStatus`
- `sourceStatus`
- `queueKey`
- `riskFlags`

Damit kann der Space bestehende Impact-, Feedback- und Cockpit-Arbeitsstände bündeln, ohne neue
Parallel-Statuslogik einzuführen.

## Public Summary

`ParticipationSpacePublicSummary` enthält:

- `headline`
- `shortSummary`
- `statusLabel`
- `feedbackAvailable`
- `openQuestionCount`
- `minorityPositionCount`
- `nextStepCount`
- `lastUpdatedAt`

Wichtig:

- Rückmeldung heißt Einordnung oder Rückmeldung, nicht Zustimmung
- Statuslabel heißt Arbeitsstand, nicht amtliche Entscheidung

## Guardrails

- kein Auto-Publish
- kein Auto-Dossier
- kein Auto-Anlassraum
- kein Auto-Graph
- keine automatische amtliche Bewertung
- Space ist nur Container
- Public Feedback braucht expliziten Status
- Operator-Cockpit ist nie öffentlich
- Module lösen keine Automation aus
- Map-/Ortlogik bleibt out of scope

## Validierung

Erfolgreich ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/participation-space-container-contract.test.ts`
- `pnpm -C apps/web run build`

## Bewusst out of scope

- keine große UI
- keine neue Route
- keine Admin-Oberfläche
- keine öffentliche Raumseite
- keine Persistenz
- keine Datenbankmigration
- keine externe Integration
- keine Map-/Ortlogik
- kein Workflow-Runner
- keine automatische Veröffentlichung
- keine automatische Dossier-Erzeugung
- keine automatische Anlassraum-Erzeugung
- keine automatische Graph-Erzeugung
- keine amtliche Entscheidungsbehauptung
