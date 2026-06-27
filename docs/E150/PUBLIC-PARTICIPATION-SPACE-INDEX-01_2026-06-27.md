# PUBLIC-PARTICIPATION-SPACE-INDEX-01

Datum: 2026-06-27
Status: erledigt

## Ziel

Neben der bestehenden Detailroute `/beteiligung/[slug]` eine kleine öffentliche Übersicht
`/beteiligung` schaffen, die vorhandene lokale Beteiligungsraum-Fixtures als read-only Teaser
sichtbar macht und sicher auf die Detailseiten verlinkt.

## Umsetzung

- neue Route `apps/web/src/app/beteiligung/page.tsx` ergänzt
- kleiner Feature-Renderer `apps/web/src/features/participation/publicParticipationSpaceIndex.tsx`
  eingeführt, statt neue Architektur oder Datenpfade aufzubauen
- Overview nutzt ausschließlich `listPublicParticipationSpaceFixtures()`
- pro Raum rendert die Übersicht:
  - Titel
  - Summary
  - `publicSummary.headline`
  - `publicSummary.shortSummary`
  - Status-/Visibility-Hinweise
  - sichere Kurzstatuszeile
  - letzte Aktualisierung
  - Link `Beteiligungsraum ansehen`
- Hero und Kartenrhythmus sind visuell an die bereits gepolishte Detailseite angelehnt

## Read-only Guardrails

- keine API
- keine DB
- keine Persistenz
- keine Auth
- keine Admin-/Operator-Fläche
- keine Formulare
- keine Intake-Logik
- keine Server Action
- keine Map oder Geo-Integration

## Gating- / Leak-Schutz

- Indexseite zeigt nur sichere Fixture- und `publicSummary`-Felder
- keine direkte Anzeige von:
  - `feedback.title`
  - `feedback.summary`
  - offenen Fragen
  - Minderheitenpositionen
  - nächsten Schritten
- `jugendforum-sued` bleibt auf der Übersicht frei von nicht öffentlichen Feedbackdetails
- interne Workflow-Begriffe und Map-/Geo-Begriffe bleiben im Public-DOM unsichtbar
- öffentliche Rückmeldedetails bleiben weiter Aufgabe der Detailroute `/beteiligung/[slug]`

## Tests

Neu: `apps/web/tests/public-participation-space-index.page.test.tsx`

Abgesichert werden:

- genau ein sichtbares `h1`
- alle Fixture-Räume erscheinen als Links zu `/beteiligung/[slug]`
- öffentliche Übersichtsdaten werden gerendert
- keine Leaks nicht öffentlicher Feedbackdetails
- keine internen Workflow-Begriffe
- keine Map-/Geo-Begriffe
- keine Formular-/Intake-Sprache

Zusätzlich bleibt die Detailroute über
`apps/web/tests/public-participation-space-shell.page.test.tsx` mitvalidiert.

## Validierung

Erfolgreich ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/public-participation-space-index.page.test.tsx tests/public-participation-space-shell.page.test.tsx`
- `unset NODE_ENV && pnpm -C apps/web run build`

## Bewusst out of scope

- kein Formular
- kein Intake
- keine Auth
- keine Admin-Fläche
- kein Operator-Cockpit
- keine echte Datenquelle
- keine DB
- keine Persistenz
- keine API
- keine Map
- keine Marker
- keine Koordinaten
- kein Geocoding
- keine externe Integration
- keine automatische Veröffentlichung
- keine automatische Dossier-Erzeugung
- keine automatische Anlassraum-Erzeugung
- keine automatische Graph-Erzeugung
- keine amtliche Entscheidungsbehauptung
