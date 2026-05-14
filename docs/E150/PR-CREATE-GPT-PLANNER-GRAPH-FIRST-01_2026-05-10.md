# PR-CREATE-GPT-PLANNER-GRAPH-FIRST-01

Datum: 2026-05-10
Status: done

## Ziel

Der erste fachliche Schritt im `/create`-Fast-Follow-up soll nicht mehr durch fachfremde Demo-/Regex-Fallbacks entschieden werden. Stattdessen:

- User Input
- `planner_only`
- bestaetigungspflichtige Graph-Match-Vorbereitung
- spaetere Struktur-/Summary-Pfade

Wichtig in diesem Slice:

- keine zweite Create-Oberflaeche
- keine Safety-Felder aus PR #125
- keine automatische Veroeffentlichung
- keine automatische DeepSearch
- keine automatische Graph-Merge
- `planner_only` bleibt strikt nicht-mutativ

## Umsetzung

### 1. Planner-first in `/create`

Neue Datei:

- `apps/web/src/features/create/createPlanner.ts`

Der Planner liefert jetzt vor dem bisherigen Analyze-/Fallback-Pfad:

- `plannerTopic`
- `plannerCore`
- `plannerScope`
- `plannerStance`
- `plannerClusters`
- `plannerOpenQuestions`
- `recommendedLane`
- `providerPlan`

Zusaetzlich im Vertrag:

- `shortSummary`
- `topicCandidates`
- `clusterCandidates`
- `scopeCandidates`
- `graphSearchTerms`
- `materialSignals`
- nicht-mutative Policy-Flags

OpenAI ist als `planner_only` vorbereitet; wenn kein brauchbarer Planner-Run verfuegbar ist, greift ein neutraler heuristischer Fallback.

### 2. Follow-up-Vertrag + Graph-Match-Plan

`CreateIntelligentFollowupResult` enthaelt jetzt Meta-Informationen fuer:

- `planner`
- `graphMatch`
- `researchUsed`
- `researchProvider`
- `deepSearchUsed`

Graph-Match wird in diesem Slice nur vorbereitet:

- `stage = after_structure`
- `requiresConfirmation = true`
- keine Matches werden automatisch uebernommen
- kein Merge

### 3. Amtstraeger-Regel enger

Die alte Fehlzuordnung kam aus mehreren breiten Default-Regeln in:

- `apps/web/src/features/create/intelligentFollowup.ts`
- `apps/web/src/features/create/createConnectionSuggestions.ts`

Problematisch war vor allem:

- `mindestanforderung`
- `verantwort`
- `qualifikation`
- `sanktion`

in Kombination mit zu breiten Defaults auf Amtstraeger-/Mandats-Titel.

Jetzt gilt:

- nur explizite Amtstraeger-/Mandat-/Minister-/Abgeordneten-Signale oeffnen diesen Pfad
- `mindestens`, `Mindeststandards`, `Tierwohlstandards`, `Haltungsstandards`, Import-/Export-Verantwortung triggern ihn nicht mehr

### 4. Tierwohl-/Agrar-Mapping

Fuer das Video-Beispiel und aehnliche Texte wird jetzt konkret erkannt:

- `Kern`: Forderung nach besseren Tierschutz- und Tierhaltungsstandards
- `Thema`: Tierschutz, Tierhaltung und Agrarstandards
- `Cluster`:
  - Tierwohl und Haltungsstandards
  - Import- und Exportregeln
  - EU-/internationale Mindeststandards
  - Verbraucherinformation / Kennzeichnung / Bio-Label / Haltungsstufen
  - ethische Bewertung von Tierhaltung
- `Ebene`: EU / Bund / international
- `Haltung`: eher dafuer / normative Forderung
- `Noch offen`: Produkte, Laender, Standards, Kontrollmechanismen

Die Strukturast-Logik verwendet Planner-Cluster bevorzugt, statt fachfremd auf Wohnen/Verkehr/Klima zurueckzufallen.

### 5. UI-Verbraucher nachgezogen

`CreateVisualFollowup.tsx` nutzt jetzt Planner-Signale fuer:

- Assistant-Lead
- `Kern`
- `Noch offen`
- tierwohl-spezifische Erstblick-Einordnung

Es wurde keine zweite Create-Surface gebaut.

## Geaenderte Dateien

- `apps/web/src/features/create/createPlanner.ts`
- `apps/web/src/features/create/intelligentFollowup.ts`
- `apps/web/src/features/create/intelligentFollowupContract.ts`
- `apps/web/src/features/create/createConnectionSuggestions.ts`
- `apps/web/src/features/create/CreateVisualFollowup.tsx`
- `apps/web/tests/create-planner-routing.contract.test.ts`
- `apps/web/tests/create-followup-tierwohl-mapping.contract.test.ts`
- `apps/web/tests/create-connection-suggestions.no-domain-fallback.contract.test.ts`
- `apps/web/tests/create-graph-match-after-planner.contract.test.ts`
- `apps/web/tests/create-entry-hierarchy.contract.test.tsx`
- `docs/E150/OpenTasks.md`
- `docs/E150/Part15.md`

## Verifikation

### Pflichtlauf

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web exec vitest run tests/create-planner-routing.contract.test.ts tests/create-followup-tierwohl-mapping.contract.test.ts tests/create-connection-suggestions.no-domain-fallback.contract.test.ts tests/create-graph-match-after-planner.contract.test.ts tests/create-chat-first-mobile-dialog-experience.contract.test.tsx tests/create-entry-hierarchy.contract.test.tsx tests/e150-journey-routing.contract.test.ts`

Ergebnis:

- Typecheck gruen
- alle 7 Testdateien / 22 Tests gruen

## Offene Restpunkte

- `PR-CREATE-WORKFLOW-LIVE-QA-01` bleibt offen fuer den breiteren Browser-/Save-/Finalize-/Material-Matrixlauf
- der alte breite Contract `create-intelligent-followup.contract.test.ts` sollte in einem separaten Cleanup-Slice explizit auf die neue Planner-First-Architektur umgestellt werden
