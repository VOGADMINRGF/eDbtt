# PARTICIPATION-IMPACT-STATUS-01

Datum: 2026-06-27
Status: erledigt

## Ziel

Einen kleinen, typed Participation-Impact-Status-Contract einführen, der die Wirkungskette von Beitrag,
Thema oder Beteiligungssignal sichtbar und nachvollziehbar modelliert, ohne Runtime-Automation oder
amtliche Wirkungsbehauptungen einzuführen.

## Umgesetzter Contract

Datei:

- `apps/web/src/features/participation/impactStatus.ts`

Enthalten:

- `ParticipationImpactStatus`
- `PARTICIPATION_IMPACT_STATUSES`
- Label-/Beschreibungsmapping
- Order-/Progress-Mapping
- `getParticipationImpactStatusMeta(status)`
- `getParticipationImpactStatusLabel(status)`
- `getParticipationImpactStatusDescription(status)`
- `isParticipationImpactStatusTerminal(status)`
- `canTransitionParticipationImpactStatus(from, to)`

## Statusmodell

- `submitted`
- `needs_clarification`
- `queued_for_review`
- `in_evaluation`
- `bundled`
- `addressed`
- `feedback_available`
- `closed_archived`

Deutsch sichtbare Lesefassung:

- Eingereicht
- Rückfrage offen
- Zur Prüfung vorgemerkt
- In Auswertung
- Gebündelt
- Adressiert
- Rückmeldung vorhanden
- Abgeschlossen / archiviert

## Transition-Regeln

- `submitted` -> `needs_clarification`, `queued_for_review`, `closed_archived`
- `needs_clarification` -> `submitted`, `queued_for_review`, `closed_archived`
- `queued_for_review` -> `in_evaluation`, `needs_clarification`, `closed_archived`
- `in_evaluation` -> `bundled`, `addressed`, `needs_clarification`, `closed_archived`
- `bundled` -> `addressed`, `feedback_available`, `closed_archived`
- `addressed` -> `feedback_available`, `closed_archived`
- `feedback_available` -> `closed_archived`
- `closed_archived` -> terminal

## Guardrails

- `addressed` heißt redaktionell oder organisatorisch adressiert, nicht politisch gelöst
- `feedback_available` heißt Rückmeldung liegt vor, nicht Zustimmung
- `bundled` heißt verdichtet oder zusammengeführt, nicht gelöscht
- `closed_archived` heißt abgeschlossen oder archiviert, nicht inhaltlich entwertet
- kein Status löst Auto-Publish aus
- kein Status löst Auto-Dossier aus
- kein Status löst Auto-Anlassraum aus
- kein Status löst Auto-Graph aus
- kein Status behauptet automatische amtliche Bewertung

## Validierung

Erfolgreich ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/participation-impact-status-contract.test.ts`
- `pnpm -C apps/web run build`

## Bewusst out of scope

- keine große UI
- keine Admin-Oberfläche
- keine öffentliche Ergebnis- oder Rückmeldeseite
- keine Runtime-Persistenz
- keine Datenbankmigration
- keine externe Integration
- keine amtliche Statusbehauptung
- kein Auto-Publish
- kein Auto-Dossier
- kein Auto-Anlassraum
- kein Auto-Graph
