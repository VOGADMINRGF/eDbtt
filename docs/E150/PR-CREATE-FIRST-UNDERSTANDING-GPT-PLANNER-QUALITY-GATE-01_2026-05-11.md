# PR-CREATE-FIRST-UNDERSTANDING-GPT-PLANNER-QUALITY-GATE-01

Stand: 2026-05-11
Status: done

## Ausgangslage

Der bestehende `/create`-First-Understanding-Step hatte zwar bereits einen lokalen `createPlanner`, aber keinen harten Qualitäts-Gate. Dadurch konnten komplexe Mehrthemenbeiträge trotz planner-first Verdrahtung mit generischen Ausgaben wie `Aussage`, `Öffentliches Anliegen mit Klärungsbedarf` oder `Neues öffentliches Thema strukturieren` in die UI und in nachgelagerte Graph-/Handoff-Pfade rutschen.

Zusätzlich war `planner_only` nicht als echte E150-Rolle in `providerRoleRouting` oder `roleRouting` verdrahtet, sondern ein lokaler `callOpenAIJson`-Pfad innerhalb von `createPlanner.ts`.

## Diagnose

Hauptursachen:

1. `buildNeutralPlanner` lieferte bewusst generische Fallback-Copy, ohne dass diese Ergebnisse anschließend als unzureichend markiert wurden.
2. Es gab keinen `qualityStatus` und keine `qualityIssues`, um generische Planner-Ausgaben oder fachfremde Fallback-Domains früh zu erkennen.
3. `CreateVisualFollowup` behauptete auch bei generischen Planner-Ergebnissen pauschal `Wir haben deinen Beitrag grob verstanden.`
4. `buildGraphMatchPlan` konnte weiterhin Graph-Suchterme vorbereiten, obwohl der Planner fachlich nicht konkret genug war.
5. Strukturierte Handoffs blieben im UI erreichbar, obwohl die Planner-Einordnung noch nicht sicher genug war.

## Umsetzung

### Planner-Contract gehärtet

`apps/web/src/features/create/createPlanner.ts`

- `CreatePlannerResult` um folgende Debug-/Qualitätsfelder erweitert:
  - `plannerProvider`
  - `plannerRole`
  - `plannerDegraded`
  - `degradedReason`
  - `qualityStatus`
  - `qualityIssues`
  - `providerCallAttempted`
  - `providerCallSucceeded`
- `validateCreatePlannerQuality(...)` ergänzt.
- generische Outputs werden jetzt aktiv erkannt:
  - generischer `plannerCore`
  - generischer `plannerTopic`
  - fehlende oder generische `graphSearchTerms`
  - zu wenige Cluster für komplexe Mehrsatztexte
  - fachfremde Fallback-Domains wie `Amtsträger`, `Wohnen`, `Verkehr`, `Klima`, wenn sie nicht im Input liegen
- OpenAI-Fehler werden jetzt als konkrete Gründe klassifiziert:
  - `openai_unavailable`
  - `provider_timeout`
  - `schema_invalid`
  - `bad_json`
  - `planner_too_generic`
  - `unknown`

### Komplexe Mehrthemen-Heuristik ergänzt

Für den Härtetest-Input zu Menschenwürde, Migration, Europa, Beteiligung und Budget wurde ein konkreter heuristischer Planner ergänzt:

- Thema:
  - `Grundrechte, gesellschaftliche Pflichten und demokratische Priorisierung`
- Cluster:
  - `Menschenwürde, Grundrechte und Verantwortung`
  - `Migration, offene Grenzen und gesellschaftliche Regeln`
  - `Europäische Energie- und Industriepolitik`
  - `Regionale Abstimmungen und Bürgerbeteiligung`
  - `Budgetverteilung und öffentliche Prioritäten`
- konkrete `graphSearchTerms`
- offene Auswahlfrage statt generischer Klärungsfrage

### Graph- und Handoff-Gating

`apps/web/src/features/create/intelligentFollowup.ts`

- Planner wird nur noch in die Understanding-Merge übernommen, wenn `qualityStatus === "specific"`.
- Graph-Match wird nur noch vorbereitet, wenn:
  - `planner.qualityStatus === "specific"`
  - `planner.plannerDegraded === false`
- bei generischem/degradiertem Planner:
  - `prepared = false`
  - `searchTerms = []`
  - `matches = []`

`apps/web/src/features/create/createConnectionSuggestions.ts`

- generische Planner-Ergebnisse erzeugen keine Dossier-/Vote-/Factcheck-Anschlüsse mehr.
- stattdessen bleibt nur eine neutrale `Thema zuerst bestätigen`-Suggestion.

`apps/web/src/app/create/CreateClient.tsx`

- strukturierte Handoffs (`Dossier`, `Factcheck`, `Vote`, `Anlassraum`) werden zusätzlich im Client blockiert, wenn der Planner nicht `specific` und nicht stabil ist.
- neuer Retry-Pfad für die KI-Einordnung ergänzt.

### UI-Deeskalation

`apps/web/src/features/create/CreateVisualFollowup.tsx`

- bei `plannerDegraded` oder `qualityStatus !== specific`:
  - keine `verstanden`-Headline mehr
  - stattdessen:
    - `Wir brauchen noch eine kurze Einordnung.`
    - `Konnte nicht exakt zugeordnet werden.`
  - sichtbare Gründe in menschlicher Sprache
  - drei Aktionen:
    - `KI-Suche / genauere Einordnung aktivieren`
    - `Bericht an Redaktion senden`
    - `Thema selbst auswählen`
- normale Next-Step-Handoffs werden in diesem Zustand nicht gerendert

## Beispieloutput Härtetest

Input:

> Ich bin schon für die Würde des Menschen, aber stelle dessen Legitimation in Frage ...

Planner-Output jetzt:

- `plannerCore`
  - `Zielkonflikt zwischen Menschenwürde, Grundrechten, gesellschaftlicher Verantwortung, Migration, europäischer Politik, regionaler Beteiligung und Budgetprioritäten.`
- `plannerTopic`
  - `Grundrechte, gesellschaftliche Pflichten und demokratische Priorisierung`
- `plannerClusters`
  - `Menschenwürde, Grundrechte und Verantwortung`
  - `Migration, offene Grenzen und gesellschaftliche Regeln`
  - `Europäische Energie- und Industriepolitik`
  - `Regionale Abstimmungen und Bürgerbeteiligung`
  - `Budgetverteilung und öffentliche Prioritäten`
- `plannerScope`
  - `federal`
  - `eu`
  - `local`
- `plannerStance`
  - `reform_oriented`
- `plannerOpenQuestions[0]`
  - `Welcher Teil soll zuerst bearbeitet werden: Grundrechte, Migration, Energiepolitik, regionale Abstimmung oder Budgetverteilung?`
- `graphSearchTerms`
  - `Menschenwürde`
  - `Grundrechte`
  - `gesellschaftliche Pflichten`
  - `offene Grenzen`
  - `Migration`
  - `EU Energiepolitik`
  - `Industriepolitik Europa`
  - `regionale Abstimmungen`
  - `Bürgerbeteiligung`
  - `Budgetpriorisierung`

## Provider-Stand

- Vorher gab es bereits einen echten `createPlanner`, aber keinen Quality-Gate.
- OpenAI wird weiterhin über den lokalen planner-only Pfad in `createPlanner.ts` aufgerufen.
- `planner_only` ist weiterhin keine vollwertige Rolle im allgemeinen E150-Orchestrator-/Role-Routing.
- Neu ist:
  - klarer Provider-Debug im Planner-Contract
  - harte Qualitätsprüfung vor Graph/Handoff/UI

## Verifikation

Ausgeführt:

- `pnpm -C apps/web run typecheck`
- `pnpm -C apps/web exec vitest run tests/create-intelligent-followup.route.test.ts tests/create-intelligent-followup.contract.test.ts tests/create-planner-routing.contract.test.ts tests/create-planner-complex-civic-input.contract.test.ts tests/create-planner-quality-gate.contract.test.ts tests/create-planner-degraded-ui.contract.test.tsx tests/create-graph-match-after-planner.contract.test.ts tests/create-chat-first-mobile-dialog-experience.contract.test.tsx tests/create-entry-hierarchy.contract.test.tsx`

Ergebnis:

- Typecheck grün
- 9 Testdateien grün

## Restpunkte

- `planner_only` ist weiterhin lokal in `createPlanner.ts` verdrahtet, nicht als vollwertiger Journey-/Role-Eintrag im zentralen E150-Orchestrator.
- `PR-CREATE-WORKFLOW-LIVE-QA-01` bleibt separat offen; dieser Slice hat bewusst keinen neuen Browser-Matrixblock aufgemacht.

## Nachzug 2026-05-12

Der degradierte Planner-Zustand wurde anschliessend final bereinigt:

- `tryOpenAiPlanner(...)` gibt jetzt keinen stillen `null`-/Catch-Fallback mehr zurueck, sondern einen harten `PlannerAttempt` mit Diagnose.
- `CreatePlannerDebug` fuehrt jetzt explizit:
  - `attemptedProvider`
  - `usedProvider`
  - `providerAvailable`
  - `providerErrorCode`
  - `providerErrorMessage`
  - `rawPayloadValid`
  - `normalizedPayloadValid`
  - `qualityGatePassed`
- der Planner nutzt fuer `planner_only` jetzt explizit `OPENAI_PLANNER_MODEL` oder `gpt-4.1-mini` und reicht `model`, `temperature` und `response_format` bis zum OpenAI-Provider durch; `response_format` wird nicht mehr im Wrapper ignoriert.
- bei `plannerDegraded=true` rendert `CreateVisualFollowup` keine normale Kern-/Thema-/Bedarfspunkt-Struktur mehr. Stattdessen erscheint nur noch die degradierte Einordnung mit:
  - `Wir konnten deinen Beitrag noch nicht exakt zuordnen.`
  - `KI-Suche aktivieren`
  - `Bericht an die Redaktion senden`
  - `Thema selbst auswählen`
  - optionalen, unverbindlichen `Mögliche Startpunkte`
- generische Fallback-Karten wie `Kern: Aussage` oder `Thema: Öffentliches Anliegen` werden in diesem Zustand nicht mehr als scheinbar normales Verständnis gerendert.

Zusätzliche Verifikation (2026-05-12):

- `pnpm -C apps/web exec vitest run tests/create-planner-debug-diagnostics.contract.test.ts tests/create-planner-openai-happy-path.contract.test.ts tests/create-degraded-followup-actions.contract.test.tsx tests/create-planner-quality-gate.contract.test.ts tests/create-planner-routing.contract.test.ts tests/create-chat-first-mobile-dialog-experience.contract.test.tsx tests/create-entry-hierarchy.contract.test.tsx`

Ergebnis:

- 7 Testdateien / 24 Tests grün
