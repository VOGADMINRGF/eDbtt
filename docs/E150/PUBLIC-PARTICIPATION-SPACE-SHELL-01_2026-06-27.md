# PUBLIC-PARTICIPATION-SPACE-SHELL-01

Datum: 2026-06-27
Status: erledigt

## Ziel

Eine erste sichere, sichtbare Public Participation Space Shell bauen, die zeigt, wie ein
Beteiligungs- oder Vorhabenraum später öffentlich aussehen kann, aber ausschließlich auf bestehenden
typed Contracts und lokalen Fixture-Daten basiert.

## Route / Dateien

- `apps/web/src/app/beteiligung/[slug]/page.tsx`
- `apps/web/src/features/participation/publicParticipationSpaceShell.tsx`
- `apps/web/src/features/participation/fixtures/publicParticipationSpace.ts`
- `apps/web/tests/public-participation-space-shell.page.test.tsx`

## Genutzte Contracts

- `apps/web/src/features/participation/spaceContainer.ts`
- `apps/web/src/features/participation/resultFeedback.ts`
- `apps/web/src/features/participation/placeFuture.ts`
- indirekt die bestehenden Impact- und Cockpit-Contracts über Fixture-Strukturen

## Fixture-Ansatz

- ausschließlich statische, lokale Fixture-Daten
- keine API
- keine DB
- keine Server Action
- keine externe Integration
- keine echte Veröffentlichung
- kein live eingelieferter User-Content

Die Shell zeigt nur konservativ vorbereitete öffentliche Lesestände.

## Public Safety-Regeln

- Public Summary erscheint nur, wenn `isParticipationSpaceFeedbackPublic(space)` true ist
- `feedback_prepared` wird nicht als öffentliche Rückmeldung behandelt
- Ortsangaben erscheinen nur, wenn `canShowParticipationPlacePublicly(place)` true ist
- öffentlich sichtbar bleiben bei Ortsbezügen nur Label, Beschreibung und Display-Label
- keine Karte, keine Marker, keine Koordinaten, kein Geocoding und keine externe Map-API
- `operator_cockpit`, Review Notes, Risk Flags, Admin Actions und Publish Actions bleiben unsichtbar
- Safety-/Trust-Hinweise machen sichtbar:
  - Rückmeldungen sind redaktionelle Einordnungen, keine amtliche Entscheidung
  - Ortsangaben werden nur geprüft und sicherheitsbewusst angezeigt
  - der Raum ist ein transparenter Beteiligungsstand, kein automatischer Veröffentlichungsworkflow

## Validierung

Erfolgreich ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/public-participation-space-shell.page.test.tsx`
- `pnpm -C apps/web run build`

## Bewusst out of scope

- keine echte Datenquelle
- keine DB
- keine Persistenz
- keine Auth
- kein Intake-Formular
- keine Admin-Oberfläche
- kein öffentliches Operator-Cockpit
- keine Map
- keine Marker
- keine Koordinaten
- kein Geocoding
- keine externe API
- keine automatische Veröffentlichung
- keine automatische Dossier-Erzeugung
- keine automatische Anlassraum-Erzeugung
- keine automatische Graph-Erzeugung
- keine amtliche Entscheidungsbehauptung
