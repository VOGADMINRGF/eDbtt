# PARTICIPATION-ADMIN-COCKPIT-04

Datum: 2026-06-27
Status: erledigt

## Ziel

Einen kleinen, typed Operator-/Admin-Cockpit-Contract einführen, der eine spätere Moderations- oder
Auswertungsoberfläche vorbereitet, ohne schon Route, Persistenz, Datenbankmigration oder Automation
auszurollen.

## Umgesetzter Contract

Datei:

- `apps/web/src/features/participation/adminCockpit.ts`

Enthalten:

- `ParticipationAdminCockpitItem`
- `ParticipationAdminCockpitQueue`
- `ParticipationAdminCockpitQueueKey`
- `ParticipationAdminCockpitAction`
- `ParticipationAdminCockpitSummary`
- `ParticipationAdminCockpitRiskFlag`
- `createParticipationAdminCockpitItem(...)`
- `getParticipationAdminCockpitQueueKey(...)`
- `getParticipationAdminCockpitAllowedActions(...)`
- `buildParticipationAdminCockpitSummary(...)`
- `isParticipationAdminCockpitActionAllowed(...)`
- `hasParticipationAdminCockpitRisk(...)`

Der Contract nutzt bestehende Typen aus:

- `apps/web/src/features/participation/impactStatus.ts`
- `apps/web/src/features/participation/resultFeedback.ts`

## Queue-Modell

- `needs_clarification`
- `ready_for_review`
- `in_evaluation`
- `bundled_for_response`
- `addressed_waiting_feedback`
- `feedback_ready`
- `archive_candidates`

Wichtig:

- Das Cockpit ist eine Arbeitsliste, keine Automationsmaschine.
- `feedback_ready` heißt nur freigegeben bzw. vorbereitbar, nicht öffentlich sichtbar.
- `addressed_waiting_feedback` heißt adressiert, nicht politisch gelöst.

## Action-Modell

- `request_clarification`
- `mark_ready_for_review`
- `start_evaluation`
- `bundle_with_related`
- `mark_addressed`
- `prepare_feedback`
- `approve_feedback_for_public`
- `publish_feedback_manually`
- `archive_item`

Wichtig:

- `publish_feedback_manually` existiert nur als manuelle Action.
- Kein Status und keine Helper-Funktion erzeugt automatische Veröffentlichung.
- Approval und Publish bleiben getrennt.

## Risk Flags

- `unverified_source`
- `sensitive_claim`
- `minority_position_present`
- `open_questions_present`
- `external_feedback_pending`
- `manual_review_required`

## Guardrails

- kein Auto-Publish
- kein Auto-Dossier
- kein Auto-Anlassraum
- kein Auto-Graph
- keine automatische amtliche Bewertung
- manuelle Review-Pflicht vor öffentlicher Rückmeldung
- Cockpit ist reine Arbeitsliste
- Publish bleibt manuell
- Feedback Ready heißt nicht öffentlich
- Addressed heißt nicht gelöst
- Operator Review heißt nicht politische Entscheidung

## Validierung

Erfolgreich ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/participation-admin-cockpit-contract.test.ts`
- `pnpm -C apps/web run build`

## Bewusst out of scope

- keine große UI
- keine Admin-Route
- keine Persistenz
- keine Datenbankmigration
- keine externe Integration
- kein Workflow-Runner
- keine automatische Veröffentlichung
- keine automatische Dossier-Erzeugung
- keine automatische Anlassraum-Erzeugung
- keine automatische Graph-Erzeugung
- keine amtliche Entscheidungsbehauptung
