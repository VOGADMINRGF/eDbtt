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

### 1. Planner-first mit engem technischem Notfallback

`apps/web/src/features/create/createPlanner.ts`

- neuer enger technischer Notfallback fuer gemischte Quoten-/Gleichberechtigungs-Texte:
  - `Gleichberechtigung`
  - `Frauenquote`
  - `Minderheitenförderung`
  - `wirtschaftliche Auswirkungen für Unternehmen`
  - optional `Antidiskriminierung`
- neuer lokaler Planner-Pfad `buildQuotaEqualityPlanner()`
- Kommentar im Code: `technical fallback only, not canonical domain mapping`
- Ergebnis bleibt strikt non-mutativ:
  - kein Auto-Save
  - kein Auto-Publish
  - kein Auto-DeepSearch
  - kein Auto-Graph-Merge
  - keine Kostenbuchung
- der Fallback bleibt explizit degradiert:
  - `plannerDegraded=true`
  - `plannerProvider=local_fallback`
  - `providerPlan.plannerProvider=local_fallback`
  - `qualityStatus=needs_confirmation`
  - `qualityIssues` enthaelt `technical_fallback_only`

Der lokale Notfallback extrahiert fuer den Beispieltext nur offensichtliche Startpunkte:

- `plannerCore`: Kritik an verbindlichen Quotenregelungen bei gleichzeitigem Wunsch nach Gleichberechtigung
- `plannerTopic`: Gleichberechtigung, Antidiskriminierung und Quotenregelungen
- `plannerClusters`: Gleichberechtigung, Frauenquote, Minderheitenförderung, wirtschaftliche Auswirkungen für Unternehmen
- `plannerOpenQuestions` mit klaren Folgefragen statt generischem Timeout-Rest

Der Fallback gilt damit nicht als kanonische fachliche Zuordnung, sondern nur als vorlaeufige Orientierung, bis `planner_only` wieder belastbar verfuegbar ist.

### 2. UI zeigt technischen Notfallback jetzt sichtbar als vorlaeufig

`apps/web/src/features/create/CreateVisualFollowup.tsx`

- der Quoten-Notfallback traegt jetzt den Quality-Issue-Marker `technical_fallback_only`
- `CreateVisualFollowup` behandelt diesen Marker bewusst als Klarstellungszustand statt als quasi-verstandene Struktur
- sichtbare UI fuer diesen Fall:
  - Titel: `Vorläufige Einordnung`
  - Hinweis: `Die KI-Einordnung wurde nicht vollständig abgeschlossen.`
  - CTA: `KI-Suche aktivieren`
  - CTA: `Bericht an die Redaktion senden`
  - CTA: `Thema selbst auswählen`
- es werden nur moegliche Startpunkte gezeigt, keine normale Struktur mit `Kern`, `Thema` und Folge-Handoffs

Damit bleibt der technische Notfallback sichtbar nuetzlich, taeuscht aber keine finale fachliche Zuordnung mehr vor.

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
- `apps/web/tests/create-planner-no-domain-heuristic-expansion.contract.test.ts`
- `apps/web/tests/create-chat-first-mobile-dialog-experience.contract.test.tsx`
- `apps/web/tests/create-curated-dialog-workspace.contract.test.tsx`
- `apps/web/tests/create-entry-hierarchy.contract.test.tsx`
- `apps/web/tests/analyze-workbench-hidden-until-start.test.ts`
- `docs/E150/OpenTasks.md`

## Tests

Ausgefuehrt:

- `pnpm -C apps/web exec vitest run tests/create-planner-routing.contract.test.ts tests/create-chat-first-mobile-dialog-experience.contract.test.tsx tests/create-curated-dialog-workspace.contract.test.tsx tests/create-entry-hierarchy.contract.test.tsx tests/analyze-workbench-hidden-until-start.test.ts`
- `pnpm -C apps/web exec vitest run tests/create-planner-no-domain-heuristic-expansion.contract.test.ts`
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
- andere noch nicht abgedeckte gesellschaftspolitische Mischfaelle koennen bei fehlender KI weiterhin eigene lokale Heuristiken brauchen; diese Nachschaerfung fuehrt dafuer aber bewusst **keine** neue kanonische Ersatz-Taxonomie ein
