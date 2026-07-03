# V3 Core AI Orchestration Provenance / Graph Trace

Stand: 2026-07-03
Task: `V3-CORE-AI-ORCHESTRATION-PROVENANCE-GRAPH-TRACE-01`
Status: done

## Ziel des Slices

Die bereits sichtbare KI-Transparenz auf `/runden/new` und `/create` sollte
nicht bei groben Statuschips enden. Der kleinste saubere Ausbau war deshalb
keine neue Orchestrierung, sondern eine kanonische kleine Trace-Wahrheit fuer
die heute real vorhandenen Schritte:

- no-AI-Draft auf `/runden/new`
- bewusster Uebergang nach `/create`
- Create Intelligent Follow-up / Planner
- Analyze
- Admin Orchestrator Smoke als technischer Admin-Trace

Downstream-Transparenz fuer Dossier-, Anlassraum-, Beteiligungsraum-, Claim-,
Feed-, Social- oder Voxy-Folgepfade bleibt bewusst ein getrennter Folgepfad.

## Analyse vor Umsetzung

### Echte KI-Schritte heute

1. `/runden/new`
   - `Ohne KI speichern` bleibt ein no-AI-Draftpfad.
   - `Mit KI in /create weiter` bereitet nur den Uebergang vor.
2. `/api/create/intelligent-followup`
   - erzeugt echten Planner-Kontext mit `requestId`, `operationId`,
     `operationType = create_intelligent_followup_planner`
   - ruft `buildCreateIntelligentFollowup(...)`
3. `createPlanner.ts`
   - echte OpenAI-Planer-Route mit Modell-Fallback auf
     `process.env.OPENAI_PLANNER_MODEL || "gpt-4.1-mini"`
   - heuristischer Fallback bleibt bewusst ohne behaupteten externen
     KI-Nachweis
   - AI-Usage-Writer bleibt real ueber `logAiUsage(...)`
4. `/api/contributions/analyze`
   - traegt `runId`, `providerMatrix`, `RunReceipt`, `provenanceRefs`
5. `/api/admin/ai/orchestrator-smoke`
   - admin-only technischer AI-/Provider-/Korrelationstest

### Reale Provider-/Modelltruth heute

- Planner:
  - `plannerProvider` ist real vorhanden
  - Modellname ist nur im echten OpenAI-Pfad belastbar
  - heuristische Fallbacks bleiben ehrlich ohne Modelltruth
- Analyze:
  - `providerMatrix` und `RunReceipt` koennen reale Provider-/Modelltruth
    tragen
  - ohne diese Runtime-Daten bleibt `missing_runtime_truth`
- Admin-Smoke:
  - Provider-/Modelltruth ist technisch vorhanden, aber admin-only
- No-AI:
  - kein Provider, kein Modell, keine AI-Usage

### Reale Input-/Output-/Provenance-Wahrheit heute

- Input-Ursprung:
  - Nutzertext
  - serverseitiger Draft aus `/runden/new`
  - optional URL-/Material-/Dossier-Kontext
- Output:
  - gespeicherter Draft
  - vorbereitete Planner-Folgeschritte
  - Analyze-Ergebnis / Run-Receipt
- Graph-/Dossier-/Anlassraum-Ziel:
  - heute nur `candidate_only`, `planned_handoff` oder `pre_record`
  - kein echter Graph-Write in diesem Slice
- Evidence-/Source-Provenance:
  - Analyze traegt reale `provenanceRefs`, `runId`, `RunReceipt`,
    `sourceSet`
  - Planner traegt reale Korrelation jetzt ueber Response-`trace`
  - externe Quellen werden nicht erfunden

## Umsetzung

### Kanonische Trace-Struktur

Neu: `apps/web/src/features/create/aiOrchestrationProvenanceTrace.ts`

Die Datei definiert die kleine getypte SSOT fuer Frontend-/Admin-sichere
Trace-Wahrheit mit Feldern fuer:

- `stepId`
- `surface`
- `trigger`
- `inputContext`
- `inputOrigin`
- `inputOriginType`
- `inputOriginRef`
- `provider`
- `model`
- `providerKnown`
- `providerVisibility`
- `aiActive`
- `usageRecorded`
- `outputType`
- `outputOrigin`
- `sourceProvenance`
- `evidenceRefs`
- `graphTarget`
- `graphTargetState`
- `reviewState`
- `publishState`
- `userVisibleLabel`
- `adminVisibleLabel`
- `missingRuntimeTruth`

### Kleine Runtime-Erweiterungen

1. `/api/create/intelligent-followup`
   - Response enthaelt jetzt zusaetzlich `trace` mit
     `requestId`, `operationId`, `operationType`, `userScope`
   - keine neue Orchestrierung, nur Sichtbarmachung bereits vorhandener
     Korrelation
2. `AnalyzeWorkspace`
   - gibt optional eine kleine Runtime-Trace-Rueckmeldung an `/create`
     weiter:
     - `createAnalyze`
     - `providerMatrix`
     - `runReceipt`
   - keine neue Persistenz
3. `/runden/new` und `/create`
   - nutzen dieselbe bestehende Frontend-Transparenz weiter
   - zeigen jetzt zusaetzlich eine nutzerverstaendliche
     Nachvollziehbarkeitssektion

## Was jetzt tracebar ist

### `/runden/new`

- `runden_no_ai_draft`
  - `ai_active = false`
  - `usage_recorded = false`
  - `input_origin = human_input` oder `server_draft`
  - `graph_target = draft_pre_record`
  - `review_state = draft`
  - `publish_state = not_published`
- `runden_create_transition`
  - bewusster Uebergang nach `/create`
  - weiterhin ohne KI-Lauf
  - Provider-/Modelltruth entsteht erst spaeter

### `/create`

- `create_server_draft_transition`
  - zeigt, ob der Server-Draft-Kontext real uebernommen wurde
- `create_planner_trace`
  - zeigt echte Planner-Korrelation
  - OpenAI-Modell nur dann, wenn wirklich vorhanden
  - heuristischer Fallback bleibt ohne erfundene externe KI-Behauptung
- `create_analyze_trace`
  - zeigt `runId`, `RunReceipt`, `providerMatrix`, `provenanceRefs`, sofern
    die Runtime sie wirklich traeegt
- `claims_questions_planned`
- `feeds_social_voxy_planned`
  - bleiben bewusst `planned_not_active`

### Admin

- `admin_orchestrator_smoke_trace`
  - technische Provider-/Modelltruth nur fuer Admin-/Review-Kontext

## Frontend-Sicherheit

Im Frontend bleiben weiterhin verborgen:

- Prompts
- Secrets
- Token-Werte
- Rohlogs
- Stacktraces
- Provider-Rohantworten

Provider-/Modellangaben werden nur dann ueberhaupt getragen, wenn sie im
Runtime-Kontext real vorhanden sind. In der sichtbaren Frontend-Copy bleiben
sie ansonsten absichtlich hinter nutzerverstaendlichen Labels versteckt.

## Ehrlich offene Luecken

Die aktuelle Basis ist eine kleine belastbare Vorstufe fuer spaetere
AI-Act-/Transparenzanforderungen, aber noch keine vollstaendige
Kennzeichnungs- oder Reviewhistorie.

Bewusst offen bleiben:

- echte Downstream-Transparenz fuer Dossier-, Anlassraum- und
  Beteiligungsraum-Folgeflaechen
- Claim-/Question-/Poll-/Feed-/Social-/Voxy-Runtime mit echter
  Provider-/Quellenwahrheit
- zusammenhaengende Review-/Freigabehistorie je KI-Output
- breitere Graph-Provenance ueber reale Graph-Writes
- AI-generated-Kennzeichnung fuer spaetere Output-Familien
- rechtliche Bewertung oder Rechtsberatung wird nicht behauptet

## Nicht gebaut

- keine neue KI-Orchestrierung
- kein neues Billing
- keine neue Payment-Integration
- kein Auto-Publish
- keine DeepSearch-Automation
- keine Fake-Claims
- keine Fake-Quellen
- keine Fake-Graph-Knoten

## Geaenderte Dateien

- `apps/web/src/features/create/aiOrchestrationProvenanceTrace.ts`
- `apps/web/src/features/create/frontendAiTransparency.ts`
- `apps/web/src/features/create/FrontendAiTransparencyPanel.tsx`
- `apps/web/src/app/runden/new/page.tsx`
- `apps/web/src/app/api/create/intelligent-followup/route.ts`
- `apps/web/src/components/analyze/AnalyzeWorkspace.tsx`
- `apps/web/src/app/create/CreateClient.tsx`
- `apps/web/tests/ai-orchestration-provenance-trace.contract.test.ts`
- `apps/web/tests/frontend-ai-transparency.contract.test.ts`
- `apps/web/tests/create-intelligent-followup.route.test.ts`
- `apps/web/tests/create-mode.page.test.ts`
- `apps/web/tests/runden-manual-create.page.contract.test.tsx`
- `docs/E150/OpenTasks.md`
- `docs/E150/ProductionReadinessMatrix.md`
- `docs/E150/V3_TEST_RESULTS_REGRESSION_MATRIX_2026-07-02.md`

## Validierung fuer diesen Slice

- `pnpm -C apps/web exec vitest run tests/frontend-ai-transparency.contract.test.ts tests/create-intelligent-followup.route.test.ts tests/create-mode.page.test.ts tests/runden-manual-create.page.contract.test.tsx tests/ai-orchestration-provenance-trace.contract.test.ts`

Die volle Pflichtvalidierung fuer den Slice folgt im Abschlusslauf.
