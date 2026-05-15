# PR-CREATE-FIRST-STEP-PLANNER-AND-STRUCTURE-ROW-FIX-01

Datum: 2026-05-15

## Scope

- `/create` erster planner-only Schritt
- degradierter lokaler Planner-Fallback fuer kurze/ambivalente gesellschaftspolitische Texte
- kompakte 4er-Strukturzeile in `CreateVisualFollowup`
- zugehoerige Contract-Tests

## Ursache des Timeout-/Fallback-Verhaltens

Der bisherige Ablauf hatte zwei getrennte Probleme:

1. `buildCreatePlanner()` fiel bei OpenAI-Timeout, fehlendem Key oder Providerfehlern auf `buildHeuristicPlanner()` zurueck.
2. Diese Heuristik war fachlich nur fuer wenige Faelle konkret genug:
   - Tierwohl/Tierhaltung
   - breite kommunale Mehrthemenfaelle
   - Officeholder-/Sanktionsfaelle
   - der bestehende `complex civic`-Block

Fuer kuerzere, gemischte gesellschaftspolitische Texte wie Frauenquote/Gleichberechtigung/Minderheiten/Wirtschaft griff deshalb am Ende `buildNeutralPlanner()` mit generischen Werten wie:

- `Öffentliches Anliegen mit Klärungsbedarf`
- `Neues öffentliches Thema strukturieren`

Im UI wurde jeder degradierte Planner bisher sofort als `Einordnung offen` behandelt. Dadurch dominierte bei Provider-Timeouts die Fehlermeldung, obwohl lokal bereits genug Textsignale fuer eine brauchbare Erststruktur vorhanden waren.

## Umsetzung

### 1. Planner-first mit konkretem lokalem Minimalplanner

`apps/web/src/features/create/createPlanner.ts`

- neue lokale Signalheuristik fuer gemischte Quoten-/Gleichberechtigungs-Texte:
  - `Gleichberechtigung`
  - `Frauenquote`
  - `Minderheitenförderung`
  - `wirtschaftliche Auswirkungen für Unternehmen`
  - optional `Antidiskriminierung`
- neuer lokaler Planner-Pfad `buildQuotaEqualityPlanner()`
- Ergebnis bleibt strikt non-mutativ:
  - kein Auto-Save
  - kein Auto-Publish
  - kein Auto-DeepSearch
  - kein Auto-Graph-Merge
  - keine Kostenbuchung

Das lokale Ergebnis fuer den Beispieltext liefert jetzt konkret:

- `plannerCore`: Kritik an verbindlichen Quotenregelungen bei gleichzeitigem Wunsch nach Gleichberechtigung
- `plannerTopic`: Gleichberechtigung, Antidiskriminierung und Quotenregelungen
- `plannerClusters`: Gleichberechtigung, Frauenquote, Minderheitenförderung, wirtschaftliche Auswirkungen für Unternehmen
- `plannerOpenQuestions` mit klaren Folgefragen statt generischem Timeout-Rest

### 2. Spezifische degradierte Planner nicht mehr als Total-Fallback behandeln

`apps/web/src/features/create/CreateVisualFollowup.tsx`

- `needsPlannerClarification()` springt nicht mehr allein auf `plannerDegraded` an
- degradierte **aber spezifische** lokale Planner werden jetzt als:
  - `Vorläufige Einordnung`
  - `Wir haben deinen Beitrag vorläufig eingeordnet.`
  - subtile Hinweiscopy zur lokalen Signalschicht
  gerendert
- nur generische oder fachlich unzureichende Planner bleiben im deeskalierten `Einordnung offen`-Zustand

Damit erscheint bei echtem Timeout nicht mehr zuerst die reine Timeout-Karte, solange konkrete lokale Struktur vorhanden ist.

### 3. Strukturzeile symmetrisch gemacht

`apps/web/src/features/create/CreateVisualFollowup.tsx`

- `CreateStructureOverview` nutzt jetzt:
  - `sm:grid-cols-2 md:grid-cols-4`
- die vier Elemente sind als kompakte, gleichwertige Cards aufgebaut
- die Cards fuellen die verfuegbare Hauptbreite statt als `flex-wrap`-Pills schmal umzubrechen
- Mobile bleibt kompakt mit 2x2 ab `sm`, Desktop bleibt eine ruhige 4er-Reihe

### 4. Strukturast-Details fuer den Quotenfall konkretisiert

`apps/web/src/features/create/intelligentFollowupContract.ts`

- neue Planner-Branch-Definitionen fuer:
  - `Gleichberechtigung`
  - `Frauenquote`
  - `Minderheitenförderung`
  - `wirtschaftliche Auswirkungen für Unternehmen`

Dadurch erscheinen Bedarf und Leitfragen im Detailzustand nicht mehr generisch.

## Geaenderte Dateien

- `apps/web/src/features/create/createPlanner.ts`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/src/features/create/intelligentFollowupContract.ts`
- `apps/web/tests/create-planner-routing.contract.test.ts`
- `apps/web/tests/create-chat-first-mobile-dialog-experience.contract.test.tsx`
- `apps/web/tests/create-curated-dialog-workspace.contract.test.tsx`
- `apps/web/tests/create-entry-hierarchy.contract.test.tsx`
- `apps/web/tests/analyze-workbench-hidden-until-start.test.ts`
- `docs/E150/OpenTasks.md`

## Tests

Ausgefuehrt:

- `pnpm -C apps/web exec vitest run tests/create-planner-routing.contract.test.ts tests/create-chat-first-mobile-dialog-experience.contract.test.tsx tests/create-curated-dialog-workspace.contract.test.tsx tests/create-entry-hierarchy.contract.test.tsx tests/analyze-workbench-hidden-until-start.test.ts`
- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web run lint`

Ergebnis:

- alle oben genannten Suites gruen
- Typecheck gruen
- Lint gruen

## Bewusst offen

- keine neue allgemeine Taxonomie
- keine neue Provider-Orchestrierung
- keine DeepSearch-/Billing-/Publish-/Graph-Merge-Logik
- keine neue Create-Surface
- andere noch nicht abgedeckte gesellschaftspolitische Mischfaelle koennen bei fehlender KI weiterhin eigene lokale Heuristiken brauchen; dieser Slice schliesst gezielt den Quoten-/Gleichberechtigungs-Fall und das UI-Verhalten fuer spezifische degradierte Planner
