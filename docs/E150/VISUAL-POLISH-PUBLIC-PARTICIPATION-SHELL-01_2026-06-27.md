# VISUAL-POLISH-PUBLIC-PARTICIPATION-SHELL-01

Datum: 2026-06-27
Status: erledigt

## Ziel

Die bereits gehärtete öffentliche Beteiligungsraum-Shell visuell reifer und klarer machen,
ohne ihren read-only Charakter oder die bestehenden Guardrails zu verändern.

## Visuelle Änderungen

- Hero der Public Shell in einen dunkleren, stärker nach eDebatte/VoiceOpenGov wirkenden
  Beteiligungsstand umgebaut
- Hero jetzt klar gegliedert in:
  - Label `Öffentlicher Beteiligungsraum`
  - Titel
  - Summary
  - Status-/Visibility-/Read-only-Badges
  - kurze Vertrauenszeile
- rechtsseitige Hero-Statuskarten für Beteiligungsstand, letzte Aktualisierung und
  Transparenzrahmen ergänzt
- `Überblick` als eigene scannbare Sektion mit kompakter Kennzahlenstruktur ausgebaut
- `Trust & Guardrails` als visuell getrennte Badge-/Panelgruppe aufbereitet
- Rückmeldestand, offene Fragen, Ortsbezug, Minderheitenpositionen und nächste Schritte
  rhythmischer und mobil lesbarer angeordnet
- Kartenabstände, Typohierarchie und Grid-Verhalten für Mobile/Tablet/Desktop nachgeschärft

## Safety-/Trust-Guardrails

Sichtbar und weiterhin bewusst nicht technisch formuliert:

- `Einordnung, keine amtliche Entscheidung`
- `Review-Inhalte bleiben verborgen`
- `Ortsangaben sicherheitsbewusst`
- `Keine automatische Veröffentlichung`

Die bestehende Gating-Logik blieb unverändert:

- öffentliche Feedbackdetails nur bei `isParticipationSpaceFeedbackPublic(space)`
- `feedback_prepared` zeigt weiter nur einen neutralen Hinweis
- Ortsbezug nur bei öffentlicher Safe-Freigabe über `canShowParticipationPlacePublicly(place)`
- keine internen Workflow-, Queue-, Operator- oder Map-/Geo-Begriffe im Public-DOM

## Was bewusst nicht gebaut wurde

- kein Formular
- kein Intake
- keine Auth
- keine Admin-/Operator-Fläche
- keine API
- keine DB
- keine Persistenz
- keine Map
- keine Marker
- keine Koordinaten
- kein Geocoding
- keine externe Integration
- keine automatische Veröffentlichung
- keine automatische Dossier-, Anlassraum- oder Graph-Erzeugung
- keine amtliche Entscheidungsbehauptung

## Tests

Aktualisiert in `apps/web/tests/public-participation-space-shell.page.test.tsx`:

- genau ein sichtbares `h1`
- öffentliche Rückmeldung bleibt im Public-Fixture sichtbar
- `feedback_prepared` leakt keine nicht öffentlichen Details
- leerer öffentlicher Raum ohne öffentliche Rückmeldung bleibt robust
- Safety-/Trust-Texte sind sichtbar
- interne Workflow-Begriffe bleiben unsichtbar
- Map-/Geo-Begriffe bleiben unsichtbar

## Validierung

Erfolgreich ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`
- `pnpm -C apps/web exec vitest run tests/public-participation-space-shell.page.test.tsx`
- `unset NODE_ENV && pnpm -C apps/web run build`
