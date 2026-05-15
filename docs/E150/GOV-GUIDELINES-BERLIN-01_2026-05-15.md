# Evidence: GOV-GUIDELINES-BERLIN-01 (2026-05-15)

## Ziel des Slices

Die Berliner Leitlinien zur Bürgerbeteiligung werden als Arbeits- und Transparenzmatrix an den bestehenden
regionalen Pilotpfad angebunden.

Der Slice bleibt bewusst **nicht** bei Rechtsberatung, sondern bei einem nachvollziehbaren Review-/Arbeitsraster
für Reinickendorf und weitere Berliner Bezirks- oder Quartierspfade.

## Umgesetzt

- neuer typed Contract in `features/region/guidelines.ts`
- Auflösung von `guidelineProfile` in ein echtes `guidelineMatrix`-Feld im `RegionalAdminCockpitReadModel`
- Readout in der bestehenden `/admin/region`-Surface
- Tests für Contract, Cockpit-Route, Region-Readmodel und Render-Surface

## Inhalt der Matrix

Die Matrix zeigt genau diese sieben Arbeitsdimensionen:

- `Frühzeitigkeit`
- `Transparenz`
- `Rückmeldung`
- `Zielgruppenansprache`
- `Barrierefreiheit`
- `Dokumentation`
- `Nachvollziehbarkeit`

Jede Dimension enthält:

- eine Arbeitsregel
- eine Prüffrage
- einen Dokumentationshinweis

## Bestehende Bausteine, die wiederverwendet wurden

- `guidelineProfile` aus den bestehenden Regional-/Anlassraum-Contracts und Fixtures
- `RegionalAdminCockpitReadModel` in `features/region/store.ts`
- bestehende `/admin/region`-Surface
- bestehende Region-/Cockpit-Tests

## Wichtige Guardrails

- keine Rechtsberatung
- keine automatische Behauptung, dass Berliner Leitlinien bereits erfüllt seien
- keine neue Region-/Geo-/Routing-Logik
- keine automatische Veröffentlichung
- keine automatische Dossier- oder Anlassraum-Erstellung
- keine Ausschreibungs-/Vergabelogik

## Profilauflösung

- Reinickendorf und andere Berliner Bezirks-/Quartierspfade erhalten das Profil
  `berlin_participation_guidelines`
- Magdeburg und andere nicht-berlinbezogene Kommunen erhalten **kein** implizites Berlin-Profil

## Tests

Ausgeführt wurden:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/admin-region-page.render.test.tsx tests/admin-region-cockpit.route.test.ts tests/regional-dashboard-readmodel.test.ts tests/region-guidelines.contract.test.ts`

## Bewusst offen

- keine rechtsförmige oder juristische Bewertung einzelner Beteiligungsverfahren
- keine Workflow-Automatik „Leitlinie erfüllt“
- keine generischen Leitlinienprofile für andere Bundesländer oder Länder
- keine neue Admin- oder Public-Surface außerhalb des bestehenden Region-Cockpits
